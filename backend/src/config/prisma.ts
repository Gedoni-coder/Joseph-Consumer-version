import prismaClient, {
  prisma,
  createDatabasePool,
  createPrismaClient,
  getDatabaseLogLevels
} from '@app-core/db';

export { prisma, createDatabasePool, createPrismaClient, getDatabaseLogLevels };
export default prismaClient;
