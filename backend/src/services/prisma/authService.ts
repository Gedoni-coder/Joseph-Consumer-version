/**
 * Prisma-based Authentication Service
 * Handles user authentication using Prisma/PostgreSQL
 */

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import {
  revokeAuthSession, revokeAllAuthSessions, revokeUserSessionsInTransaction, withLockedUser
} from './authSessionService';

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Hash password using bcrypt
 */
async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Compare password with hash
 */
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate password reset token
 */
function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash reset token for storage
 */
function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Calculate reset token expiry (1 hour from now)
 */
function getResetTokenExpiry() {
  const now = new Date();
  now.setHours(now.getHours() + 1);
  return now;
}

// ==========================================
// AUTH OPERATIONS
// ==========================================

/**
 * Register new user
 */
export async function registerUser(data) {
  const { email, password, name, phone } = data;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (existingUser) {
    throw new Error('DUPLICATE_EMAIL');
  }

  // Check if phone number already exists
  if (phone) {
    const existingPhone = await prisma.user.findFirst({
      where: { phone }
    });
    if (existingPhone) {
      throw new Error('DUPLICATE_PHONE');
    }
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name.trim(),
      phone: phone || null,
      isActive: true,
      isEmailVerified: false
    }
  });

  return user;
}

/**
 * Find user by email
 */
export async function findUserByEmail(email) {
  return await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });
}

/**
 * Find user by ID
 */
export async function findUserById(userId) {
  return await prisma.user.findUnique({
    where: { id: userId }
  });
}

/**
 * Verify user credentials
 */
export async function verifyCredentials(email, password) {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  if (!user.isActive) {
    throw new Error('ACCOUNT_INACTIVE');
  }

  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    throw new Error('INVALID_PASSWORD');
  }

  return user;
}

export const removeRefreshToken = revokeAuthSession;
export const clearAllRefreshTokens = revokeAllAuthSessions;

/**
 * Update user last login
 */
export async function updateLastLogin(userId) {
  return await prisma.user.update({
    where: { id: userId },
    data: { lastLogin: new Date() }
  });
}

/**
 * Update user last activity
 */
export async function updateLastActivity(userId) {
  return await prisma.user.update({
    where: { id: userId },
    data: { lastActivity: new Date() }
  });
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId, data) {
  const { name, phone } = data;
  const updateData: Prisma.UserUpdateInput = {};

  if (name) updateData.name = name.trim();
  if (phone !== undefined) {
    // Check if phone is already used
    if (phone) {
      const existing = await prisma.user.findFirst({
        where: {
          phone,
          id: { not: userId }
        }
      });
      if (existing) {
        throw new Error('DUPLICATE_PHONE');
      }
    }
    updateData.phone = phone || null;
  }

  return await prisma.user.update({
    where: { id: userId },
    data: updateData
  });
}

/**
 * Change user password
 */
export async function changeUserPassword(userId, currentPassword, newPassword) {
  const hashedPassword = await hashPassword(newPassword);
  return withLockedUser(userId, async (tx, user) => {
    if (!(await comparePassword(currentPassword, user.password))) {
      throw new Error('INVALID_CURRENT_PASSWORD');
    }
    await tx.user.update({ where: { id: userId }, data: { password: hashedPassword } });
    await revokeUserSessionsInTransaction(tx, userId);
    return true;
  });
}

/**
 * Generate password reset token
 */
export async function generatePasswordReset(email) {
  const user = await findUserByEmail(email);

  if (!user) {
    // Don't reveal if email exists
    return { success: true, token: null };
  }

  const resetToken = generateResetToken();
  const hashedToken = hashResetToken(resetToken);
  const expiresAt = getResetTokenExpiry();

  // Store reset token (you'd need a passwordResetTokens table or field)
  // For now, we'll update the user with reset token info
  await prisma.user.update({
    where: { id: user.id },
    data: {
      // Add these fields to your Prisma schema if not present
      resetPasswordToken: hashedToken,
      resetPasswordExpires: expiresAt
    }
  });

  return { success: true, token: resetToken };
}

/**
 * Reset password with token
 */
export async function resetPasswordWithToken(token, newPassword) {
  const hashedToken = hashResetToken(token);
  const user = await prisma.user.findFirst({
    where: { resetPasswordToken: hashedToken, resetPasswordExpires: { gt: new Date() } }
  });
  if (!user) throw new Error('INVALID_OR_EXPIRED_TOKEN');
  const hashedPassword = await hashPassword(newPassword);
  return withLockedUser(user.id, async (tx, lockedUser) => {
    // Re-check under the user lock so a reset token is consumed only once.
    if (lockedUser.resetPasswordToken !== hashedToken ||
        !lockedUser.resetPasswordExpires || lockedUser.resetPasswordExpires <= new Date()) {
      throw new Error('INVALID_OR_EXPIRED_TOKEN');
    }
    await tx.user.update({ where: { id: user.id }, data: {
      password: hashedPassword, resetPasswordToken: null, resetPasswordExpires: null
    } });
    await revokeUserSessionsInTransaction(tx, user.id);
    return true;
  });
}

/**
 * Complete user onboarding
 */
export async function completeOnboarding(userId) {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      onboardingComplete: true,
      onboardingStep: 5
    }
  });
}

// ==========================================
// CLEAN USER RESPONSE
// ==========================================

/**
 * Return safe user data (without password)
 */
export function toSafeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified,
    onboardingComplete: user.onboardingComplete,
    onboardingStep: user.onboardingStep,
    preferences: user.preferences,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin
  };
}

export default {
  registerUser,
  findUserByEmail,
  findUserById,
  verifyCredentials,
  removeRefreshToken,
  clearAllRefreshTokens,
  updateLastLogin,
  updateLastActivity,
  updateUserProfile,
  changeUserPassword,
  generatePasswordReset,
  resetPasswordWithToken,
  completeOnboarding,
  toSafeUser
};

// SR
