import dotenv from 'dotenv';
import { PrismaClient, type Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

dotenv.config();

export const getDatabaseLogLevels = (): Prisma.LogLevel[] =>
    process.env.DB_LOG_QUERIES === 'true' ? ['query', 'error', 'warn'] : ['error'];

const shouldSkipDatabase = () => process.env.SKIP_DB === 'true';

export const getDatabaseUrl = () => {
    const databaseUrl = process.env.DATABASE_URL?.trim();

    if (!databaseUrl && !shouldSkipDatabase()) {
        throw new Error(
            'DATABASE_URL is required when SKIP_DB is not true. Set DATABASE_URL in backend/.env or use SKIP_DB=true for local no-database smoke tests.'
        );
    }

    return databaseUrl;
};

export const createDatabasePool = () => {
    const databaseUrl = getDatabaseUrl();

    return new Pool(
        databaseUrl
            ? {
                  connectionString: databaseUrl
              }
            : {}
    );
};

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
