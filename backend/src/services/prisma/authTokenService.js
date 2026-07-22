/**
 * Authentication Token Service
 * Handles refresh tokens and user sessions
 */

import crypto from 'crypto';
import { prisma } from '../../config/prisma.js';

// ==========================================
// REFRESH TOKEN OPERATIONS
// ==========================================

/**
 * Generate refresh token ID
 */
function generateTokenId() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create refresh token
 */
export async function createRefreshToken(userId, expiresIn = 30) {
  const token = generateTokenId();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresIn);

  return await prisma.refreshToken.create({
    data: {
      userId,
      token,
      expiresAt
    }
  });
}

/**
 * Verify refresh token
 */
export async function verifyRefreshToken(token) {
  const refreshToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!refreshToken) {
    throw new Error('INVALID_TOKEN');
  }

  if (refreshToken.revokedAt) {
    throw new Error('TOKEN_REVOKED');
  }

  if (new Date() > refreshToken.expiresAt) {
    throw new Error('TOKEN_EXPIRED');
  }

  return refreshToken;
}

/**
 * Revoke refresh token
 */
export async function revokeRefreshToken(token) {
  return await prisma.refreshToken.update({
    where: { token },
    data: { revokedAt: new Date() }
  });
}

/**
 * Revoke all user tokens
 */
export async function revokeAllUserTokens(userId) {
  return await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() }
  });
}

/**
 * Clean up expired tokens
 */
export async function cleanupExpiredTokens() {
  return await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: { lt: new Date() }
    }
  });
}

// ==========================================
// USER SESSION OPERATIONS
// ==========================================

/**
 * Create user session
 */
export async function createSession(userId, deviceInfo = {}) {
  const { deviceType, userAgent, ipAddress } = deviceInfo;

  // Calculate session expiry (7 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  return await prisma.userSession.create({
    data: {
      userId,
      deviceType,
      userAgent,
      ipAddress,
      expiresAt
    }
  });
}

/**
 * Update session activity
 */
export async function updateSessionActivity(sessionId) {
  return await prisma.userSession.update({
    where: { id: sessionId },
    data: { lastActive: new Date() }
  });
}

/**
 * Get active user sessions
 */
export async function getUserSessions(userId) {
  return await prisma.userSession.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() }
    },
    orderBy: { lastActive: 'desc' }
  });
}

/**
 * Revoke session
 */
export async function revokeSession(sessionId) {
  return await prisma.userSession.update({
    where: { id: sessionId },
    data: { expiresAt: new Date() }
  });
}

/**
 * Revoke all user sessions
 */
export async function revokeAllUserSessions(userId) {
  return await prisma.userSession.updateMany({
    where: { userId },
    data: { expiresAt: new Date() }
  });
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions() {
  return await prisma.userSession.deleteMany({
    where: {
      expiresAt: { lt: new Date() }
    }
  });
}
