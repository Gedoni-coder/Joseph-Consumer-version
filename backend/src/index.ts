import dotenv from 'dotenv';
import type { Server } from 'http';

dotenv.config();

type ShutdownSignal = 'SIGINT' | 'SIGTERM' | 'uncaughtException' | 'unhandledRejection';
type RuntimeLogger = {
  info: (data: unknown, label?: string) => void;
  error: (data: unknown, label?: string) => void;
  errorX: (error: Error, label?: string) => void;
};
type RuntimePrisma = {
  $connect: () => Promise<void>;
  $disconnect: () => Promise<void>;
};

let server: Server | undefined;
let appLogger: RuntimeLogger = {
  info: (data) => console.info(data),
  error: (data) => console.error(data),
  errorX: (error) => console.error(error)
};
let prisma: RuntimePrisma = {
  $connect: async () => undefined,
  $disconnect: async () => undefined
};

const shutdown = async (signal: ShutdownSignal) => {
  appLogger.info({ message: `${signal} received. Shutting down...` }, 'SHUTDOWN');

  if (!server) {
    await prisma.$disconnect();
    process.exit(0);
  }

  server.close(async () => {
    try {
      await prisma.$disconnect();
      appLogger.info({ message: 'Graceful shutdown complete' }, 'SHUTDOWN');
      process.exit(0);
    } catch (error) {
      appLogger.errorX(error instanceof Error ? error : new Error('Shutdown failed'), 'SHUTDOWN');
      process.exit(1);
    }
  });

  setTimeout(() => {
    appLogger.error({ message: 'Forced shutdown after timeout' }, 'SHUTDOWN');
    process.exit(1);
  }, 10000).unref();
};

const startServer = async () => {
  const [{ appLogger: logger }, { default: app }, { prisma: prismaClient }] = await Promise.all([
    import('@app-core/logger'),
    import('./app.js'),
    import('./config/prisma.js')
  ]);

  appLogger = logger;
  prisma = prismaClient;

  const PORT = Number(process.env.PORT || 4000);
  const HOST = process.env.HOST || '0.0.0.0';
  const skipDb = process.env.SKIP_DB === 'true';

  try {
    if (!skipDb) {
      await prisma.$connect();
      appLogger.info({ message: 'PostgreSQL connected through Prisma' }, 'STARTUP');
    } else {
      appLogger.info({ message: 'Database connection skipped' }, 'STARTUP');
    }

    server = app.listen(PORT, HOST, () => {
      appLogger.info(
        {
          message: 'Server running',
          port: PORT,
          host: HOST,
          environment: process.env.NODE_ENV || 'development',
          database: skipDb ? 'skipped' : 'postgresql'
        },
        'STARTUP'
      );
    });
  } catch (error) {
    appLogger.errorX(error instanceof Error ? error : new Error('Startup failed'), 'STARTUP');
    process.exit(1);
  }
};

process.on('SIGINT', async () => shutdown('SIGINT'));
process.on('SIGTERM', async () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  appLogger.error({ message: 'Unhandled promise rejection', reason }, 'PROCESS');
  void shutdown('unhandledRejection');
});

process.on('uncaughtException', (error) => {
  appLogger.errorX(error, 'PROCESS');
  void shutdown('uncaughtException');
});

void startServer();
