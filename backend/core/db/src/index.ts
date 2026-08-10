import dotenv from 'dotenv';
import { PrismaClient, type Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

dotenv.config();

export const getDatabaseLogLevels = (): Prisma.LogLevel[] =>
    process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'];

export const createDatabasePool = () =>
    new Pool({
        connectionString: process.env.DATABASE_URL
    });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const pool = createDatabasePool();
const adapter = new PrismaPg(pool);

export const createPrismaClient = (): PrismaClient =>
    new PrismaClient({
        adapter,
        log: getDatabaseLogLevels()
    });

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;
