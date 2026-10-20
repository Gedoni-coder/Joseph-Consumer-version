import express, { Application, NextFunction, Request, Response } from 'express';
import './types/express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { createAppError } from '@app-core/errors';
import { appLogger } from '@app-core/logger';
import { MESSAGES } from '@app-core/messages';
import { prisma } from './config/prisma';
import { getRateLimitConfig } from './config/rate-limit';
import {
  createRateLimiter,
  getDefaultRateLimitKeyDetails
} from './middleware/rate-limit.middleware';
import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';
import consumerRoutes from './consumer/routes';
import dreamRoutes from './routes/dream';
import economicRoutes from './routes/economic';
import financeRoutes from './routes/finance';
import interpretationRoutes from './routes/interpretation';
import notificationsRoutes from './routes/notifications';
import preferencesRoutes from './routes/preferences';
import strategyRoutes from './routes/strategy';
import whatsappRoutes from './routes/whatsapp';
import { sendSuccess } from './utils/response.utils';
import { sendNormalizedError } from './utils/service-error.utils';

dotenv.config();

const app: Application = express();
const skipDb = process.env.SKIP_DB === 'true';
const rateLimitConfig = getRateLimitConfig();
const apiRateLimiter = createRateLimiter({
  name: 'api',
  windowMs: rateLimitConfig.apiWindowMs,
  limit: rateLimitConfig.apiMax,
  keyDetails: getDefaultRateLimitKeyDetails
});

app.set('trust proxy', rateLimitConfig.trustProxy);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:']
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',').map((origin) => origin.trim())
      : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/consumer', consumerRoutes);

app.use((req, res, next) => {
  const startedAt = Date.now();

  res.on('finish', () => {
    appLogger.info(
      {
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt
      },
      'HTTP'
    );
  });

  next();
});

app.get('/health', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    if (skipDb) {
      return sendSuccess(
        res,
        { database: 'skipped', timestamp: new Date().toISOString() },
        'Server is healthy'
      );
    }

    await prisma.$queryRaw`SELECT 1`;
    return sendSuccess(
      res,
      { database: 'connected', timestamp: new Date().toISOString() },
      'Server is healthy'
    );
  } catch (_error) {
    return next(
      createAppError('Server is unhealthy', 'SERVICE_UNAVAILABLE', {
        details: {
          database: 'disconnected',
          timestamp: new Date().toISOString()
        }
      })
    );
  }
});

app.get('/', (_req: Request, res: Response) => {
  return sendSuccess(res, { timestamp: new Date().toISOString() }, 'JOSEPH AI API is running');
});

app.use('/api', apiRateLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/economic', economicRoutes);
app.use('/api/dream', dreamRoutes);
app.use('/api/interpret', interpretationRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/strategy', strategyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/notifications', notificationsRoutes);

app.get('/api', (_req: Request, res: Response) => {
  return sendSuccess(
    res,
    {
      modules: {
        auth: '/api/auth',
        economic: '/api/economic',
        dream: '/api/dream',
        interpret: '/api/interpret',
        finance: '/api/finance',
        strategy: '/api/strategy',
        admin: '/api/admin',
        whatsapp: '/api/whatsapp',
        preferences: '/api/preferences',
        notifications: '/api/notifications'
      },
      health: '/health'
    },
    'API route index loaded'
  );
});

app.use('/api', (req: Request, _res: Response, next: NextFunction) => {
  next(createAppError(`Endpoint not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND'));
});

app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(createAppError(MESSAGES.COMMON.ROUTE_NOT_FOUND, 'NOT_FOUND'));
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  appLogger.errorX(err, 'APP-ERROR');
  return sendNormalizedError(res, err);
});

export default app;

// SR
