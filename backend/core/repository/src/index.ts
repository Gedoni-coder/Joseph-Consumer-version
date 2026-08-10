import type { Prisma, PrismaClient } from '@prisma/client';
import prisma from '@app-core/db';

export type RepositoryTransaction = Prisma.TransactionClient;
export type RepositoryClient = PrismaClient | RepositoryTransaction;

export type RepositoryContext = {
    client?: RepositoryClient;
};

export const repositoryClient = prisma;

export const getRepositoryClient = (context?: RepositoryContext): RepositoryClient =>
    context?.client ?? repositoryClient;

export const runRepositoryTransaction = <T>(
    callback: (client: RepositoryTransaction) => Promise<T>
): Promise<T> => repositoryClient.$transaction(callback);
