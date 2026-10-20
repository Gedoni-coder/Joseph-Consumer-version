/**
 * JOSEPH AI - Backend Server Entry Point
 * Starts the Express server and connects to database (MongoDB or PostgreSQL via Prisma)
 */

import 'dotenv/config';
import http from 'http';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { prisma } from './src/config/prisma.js';

// ==========================================
// SERVER CONFIGURATION
// ==========================================
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';
const DB_TYPE = process.env.DB_TYPE || 'mongodb';

// ==========================================
// START SERVER
// ==========================================
async function startServer() {
  try {
    // Connect to database based on DB_TYPE
    if (DB_TYPE === 'postgresql') {
      console.log('🔄 Connecting to PostgreSQL (Prisma)...');
      await prisma.$connect();
      console.log('✅ PostgreSQL (Prisma) connected');
    } else {
      console.log('🔄 Connecting to MongoDB...');
      await connectDB();
      console.log('✅ MongoDB connected');
    }

    // Create HTTP server
    const server = http.createServer(app);

    // Store server instance in app for graceful shutdown
    app.setServer(server);

    // Start listening
    server.listen(PORT, HOST, () => {
      console.log('\n' + '='.repeat(50));
      console.log('🚀 JOSEPH AI Backend Server Running');
      console.log('='.repeat(50));
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Database: ${DB_TYPE === 'postgresql' ? 'PostgreSQL (Prisma)' : 'MongoDB (Mongoose)'}`);
      console.log(`   Host: ${HOST === '0.0.0.0' ? 'localhost' : HOST}`);
      console.log(`   Port: ${PORT}`);
      console.log(`   URL: http://localhost:${PORT}`);
      console.log(`   API: http://localhost:${PORT}/api`);
      console.log(`   Health: http://localhost:${PORT}/health`);
      console.log('='.repeat(50));
      console.log('\n✨ Server is ready to accept requests\n');
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please use a different port.`);
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });

    // Handle server timeout
    server.timeout = 2 * 60 * 1000; // 2 minutes
    server.keepAliveTimeout = 60 * 1000; // 1 minute
    server.headersTimeout = 65 * 1000; // Slightly longer than keepAlive

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================
async function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  const server = app.getServer();
  if (server) {
    server.close(async () => {
      console.log('📡 HTTP server closed');

      // Disconnect from database
      if (DB_TYPE === 'postgresql') {
        await prisma.$disconnect();
        console.log('✅ Prisma disconnected');
      } else {
        await mongoose.disconnect();
        console.log('✅ MongoDB disconnected');
      }

      console.log('✅ Graceful shutdown complete');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('❌ Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ==========================================
// HANDLE UNHANDLED ERRORS
// ==========================================
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// ==========================================
// START THE SERVER
// ==========================================
startServer();

// SR
