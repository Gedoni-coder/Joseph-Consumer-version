/**
 * Prisma Client Configuration
 * Single instance of Prisma Client for PostgreSQL (Prisma 6.x)
 */

import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

// Prevent multiple instances in development
const globalForPrisma = global;

class PrismaClientSingleton {
  constructor() {
    // Prisma 6.x: Can pass datasourceUrl directly or read from .env
    this.prisma = globalForPrisma.prisma || new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      errorFormat: 'minimal'
    });

    if (process.env.NODE_ENV === 'development') {
      globalForPrisma.prisma = this.prisma;
    }
  }

  async connect() {
    try {
      await this.prisma.$connect();
      console.log('✅ Prisma (PostgreSQL) connected');
    } catch (error) {
      console.error('❌ Prisma connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    await this.prisma.$disconnect();
    console.log('Prisma disconnected');
  }

  getClient() {
    return this.prisma;
  }
}

export default new PrismaClientSingleton();
export const prisma = new PrismaClientSingleton().getClient();
