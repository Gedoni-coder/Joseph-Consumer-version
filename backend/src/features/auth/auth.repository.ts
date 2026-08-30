import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../../config/prisma";

export type AuthRepositoryClient = PrismaClient | Prisma.TransactionClient;

export type CreateUserData = {
  email: string;
  password: string;
  name: string;
  phone?: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
};

export type CreateRefreshTokenData = {
  familyId: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

const getClient = (client?: AuthRepositoryClient) => client ?? prisma;

// Services pass a transaction client here when several auth writes must commit together.
export const runAuthTransaction = <T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> => prisma.$transaction(callback);

// User lookups and mutations stay in the repository so controllers/services do not call Prisma directly.
export const findUserByEmail = (email: string, client?: AuthRepositoryClient) =>
  getClient(client).user.findUnique({
    where: { email: email.toLowerCase() },
  });

export const findUserById = (userId: string, client?: AuthRepositoryClient) =>
  getClient(client).user.findUnique({
    where: { id: userId },
  });

export const findUserByPhone = (phone: string, client?: AuthRepositoryClient) =>
  getClient(client).user.findFirst({
    where: { phone },
  });

export const findUserByPhoneExcept = (
  phone: string,
  userId: string,
  client?: AuthRepositoryClient,
) =>
  getClient(client).user.findFirst({
    where: {
      phone,
      id: { not: userId },
    },
  });

export const createUser = (
  data: CreateUserData,
  client?: AuthRepositoryClient,
) => getClient(client).user.create({ data });

export const updateUserById = (
  userId: string,
  data: Prisma.UserUpdateInput,
  client?: AuthRepositoryClient,
) =>
  getClient(client).user.update({
    where: { id: userId },
    data,
  });

export const findUserByResetToken = (
  resetPasswordToken: string,
  now: Date,
  client?: AuthRepositoryClient,
) =>
  getClient(client).user.findFirst({
    where: {
      resetPasswordToken,
      resetPasswordExpires: {
        gt: now,
      },
    },
  });

export const createRefreshToken = (
  data: CreateRefreshTokenData,
  client?: AuthRepositoryClient,
) => getClient(client).refreshToken.create({ data });

// Refresh-token records store SHA-256 hashes only; the raw cookie value is never persisted.
export const findRefreshTokenByHash = (
  tokenHash: string,
  client?: AuthRepositoryClient,
) =>
  getClient(client).refreshToken.findUnique({
    where: { tokenHash },
  });

export const revokeActiveRefreshTokensByFamily = (
  familyId: string,
  revocationReason: Prisma.RefreshTokenUpdateManyMutationInput["revocationReason"],
  revokedAt: Date,
  client?: AuthRepositoryClient,
) =>
  getClient(client).refreshToken.updateMany({
    where: {
      familyId,
      revokedAt: null,
    },
    data: {
      revokedAt,
      revocationReason,
    },
  });

export const revokeActiveRefreshTokensByUser = (
  userId: string,
  revocationReason: Prisma.RefreshTokenUpdateManyMutationInput["revocationReason"],
  revokedAt: Date,
  client?: AuthRepositoryClient,
) =>
  getClient(client).refreshToken.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt,
      revocationReason,
    },
  });

export const markRefreshTokenRotated = (
  refreshTokenId: string,
  replacementTokenId: string,
  revokedAt: Date,
  client?: AuthRepositoryClient,
) =>
  // Conditional update makes refresh rotation atomic: only an active, unreplaced token can rotate.
  getClient(client).refreshToken.updateMany({
    where: {
      id: refreshTokenId,
      revokedAt: null,
      replacedByTokenId: null,
    },
    data: {
      revokedAt,
      revocationReason: "ROTATED",
      replacedByTokenId: replacementTokenId,
    },
  });

export const deleteRefreshTokenById = (
  refreshTokenId: string,
  client?: AuthRepositoryClient,
) =>
  getClient(client).refreshToken.delete({
    where: { id: refreshTokenId },
  });

export default {
  runAuthTransaction,
  findUserByEmail,
  findUserById,
  findUserByPhone,
  findUserByPhoneExcept,
  createUser,
  updateUserById,
  findUserByResetToken,
  createRefreshToken,
  findRefreshTokenByHash,
  revokeActiveRefreshTokensByFamily,
  revokeActiveRefreshTokensByUser,
  markRefreshTokenRotated,
  deleteRefreshTokenById,
};
