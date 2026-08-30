/**
 * Prisma-based Authentication Service
 * Handles user authentication using Prisma/PostgreSQL
 */

import bcrypt from "bcrypt";
import crypto from "crypto";
import type { Prisma, RefreshTokenRevocationReason } from "@prisma/client";
import { appLogger } from "@app-core/logger";
import {
  generateAccessToken,
  generateOpaqueToken,
  hashToken,
} from "../../config/jwt";
import authRepository from "./auth.repository";

export const REFRESH_TOKEN_COOKIE_NAME = "joseph_refresh_token";
const REFRESH_TOKEN_TTL_DAYS = 7;
const REFRESH_TOKEN_TTL_MS = REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
const ACCESS_TOKEN_EXPIRES_IN = "15m";

export type AuthAuditContext = {
  ip?: string;
  userAgent?: string | string[];
};

export type RegisterInput = {
  email: string;
  password: string;
  name: string;
  phone?: string | null;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type ChangePasswordInput = {
  userId: string;
  currentPassword: string;
  newPassword: string;
};

export type UpdateUserProfileInput = {
  name?: string;
  phone?: string | null;
};

export type AuthSessionResult = {
  user: ReturnType<typeof toSafeUser>;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
};

export type RefreshSessionResult = {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
};

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
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash reset token for storage
 */
function hashResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Shared refresh-cookie settings for login and registration.
 */
export function getRefreshTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: REFRESH_TOKEN_TTL_MS,
    path: "/api/auth",
  };
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
  const existingUser = await authRepository.findUserByEmail(email);

  if (existingUser) {
    throw new Error("DUPLICATE_EMAIL");
  }

  // Check if phone number already exists
  if (phone) {
    const existingPhone = await authRepository.findUserByPhone(phone);
    if (existingPhone) {
      throw new Error("DUPLICATE_PHONE");
    }
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await authRepository.createUser({
    email: email.toLowerCase(),
    password: hashedPassword,
    name: name.trim(),
    phone: phone || null,
    isActive: true,
    isEmailVerified: false,
  });

  return user;
}

/**
 * Find user by email
 */
export async function findUserByEmail(email) {
  return await authRepository.findUserByEmail(email);
}

/**
 * Find user by ID
 */
export async function findUserById(userId) {
  return await authRepository.findUserById(userId);
}

/**
 * Verify user credentials
 */
export async function verifyCredentials(email, password) {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  if (!user.isActive) {
    throw new Error("ACCOUNT_INACTIVE");
  }

  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    throw new Error("INVALID_PASSWORD");
  }

  return user;
}

/**
 * Create a new refresh session family for a successful login.
 */
export async function createRefreshSession(userId) {
  const refreshToken = generateOpaqueToken();
  const tokenHash = hashToken(refreshToken);
  const familyId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  const tokenRecord = await authRepository.createRefreshToken({
    familyId,
    userId,
    tokenHash,
    expiresAt,
  });

  return {
    refreshToken,
    tokenRecord,
    expiresAt,
  };
}

function buildAccessTokenForUser(user) {
  return generateAccessToken({ userId: user.id, email: user.email });
}

async function createAuthenticatedSession(user) {
  // Login/register share this path so every web session gets the same JWT + cookie setup.
  const accessToken = buildAccessTokenForUser(user);
  const { refreshToken } = await createRefreshSession(user.id);
  await updateLastLogin(user.id);

  return {
    user: toSafeUser(user),
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  };
}

/**
 * Register a user and start a refresh-token-backed web session.
 */
export async function registerWithSession(
  data: RegisterInput,
): Promise<AuthSessionResult> {
  const user = await registerUser(data);
  return await createAuthenticatedSession(user);
}

/**
 * Verify credentials and start a refresh-token-backed web session.
 */
export async function loginWithSession(
  data: LoginInput,
): Promise<AuthSessionResult> {
  const user = await verifyCredentials(data.email, data.password);
  return await createAuthenticatedSession(user);
}

function logSecurityAuditEvent(event, auditEvent) {
  // Audit metadata only. Never include the raw refresh token or its hash in logs.
  appLogger.warn(
    {
      event,
      userId: auditEvent.userId,
      familyId: auditEvent.familyId,
      refreshTokenId: auditEvent.refreshTokenId,
      replacedByTokenId: auditEvent.replacedByTokenId,
      revocationReason: auditEvent.revocationReason,
      revokedCount: auditEvent.revokedCount,
      ip: auditEvent.ip,
      userAgent: auditEvent.userAgent,
      detectedAt: auditEvent.detectedAt || auditEvent.revokedAt,
    },
    "SECURITY-AUDIT",
  );
}

async function revokeTokenFamilyByHash(
  tokenHash: string,
  reason: RefreshTokenRevocationReason,
  auditContext: AuthAuditContext = {},
) {
  const now = new Date();

  const result = await authRepository.runAuthTransaction(async (tx) => {
    const currentToken = await authRepository.findRefreshTokenByHash(
      tokenHash,
      tx,
    );

    if (!currentToken) {
      return { status: "invalid", revokedCount: 0 };
    }

    // Current-device logout revokes the whole family created by that login.
    const revocation = await authRepository.revokeActiveRefreshTokensByFamily(
      currentToken.familyId,
      reason,
      now,
      tx,
    );

    return {
      status: "ok",
      userId: currentToken.userId,
      familyId: currentToken.familyId,
      refreshTokenId: currentToken.id,
      revokedCount: revocation.count,
      revokedAt: now.toISOString(),
    };
  });

  if (result.status === "ok") {
    logSecurityAuditEvent("AUTH_REFRESH_TOKEN_FAMILY_REVOKED", {
      ...result,
      revocationReason: reason,
      ip: auditContext.ip,
      userAgent: auditContext.userAgent,
    });
  }

  return result;
}

/**
 * Rotate an existing refresh session. The raw refresh token is never stored;
 * only its SHA-256 hash is used for database lookup.
 */
export async function rotateRefreshSession(
  refreshToken: string,
  auditContext: AuthAuditContext = {},
) {
  // The client sends the raw opaque token, but the database only stores its hash.
  const tokenHash = hashToken(refreshToken);
  const newRefreshToken = generateOpaqueToken();
  const newTokenHash = hashToken(newRefreshToken);
  const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  const now = new Date();

  const result = await authRepository.runAuthTransaction(async (tx) => {
    const currentToken = await authRepository.findRefreshTokenByHash(
      tokenHash,
      tx,
    );

    if (!currentToken) {
      return { status: "invalid" };
    }

    // A token with a replacement was already rotated. Seeing it again indicates reuse.
    if (currentToken.replacedByTokenId) {
      // Revoke the active token family so a stolen old token cannot keep the session alive.
      await authRepository.revokeActiveRefreshTokensByFamily(
        currentToken.familyId,
        "TOKEN_REUSE",
        now,
        tx,
      );

      return {
        status: "reused",
        auditEvent: {
          userId: currentToken.userId,
          familyId: currentToken.familyId,
          refreshTokenId: currentToken.id,
          replacedByTokenId: currentToken.replacedByTokenId,
          detectedAt: now.toISOString(),
        },
      };
    }

    if (currentToken.revokedAt) {
      return { status: "invalid" };
    }

    if (currentToken.expiresAt <= now) {
      return { status: "expired" };
    }

    const user = await authRepository.findUserById(currentToken.userId, tx);

    if (!user || !user.isActive) {
      return { status: "invalid" };
    }

    // Create the replacement before revoking the current token so the linkage can be recorded.
    const replacementToken = await authRepository.createRefreshToken(
      {
        familyId: currentToken.familyId,
        userId: currentToken.userId,
        tokenHash: newTokenHash,
        expiresAt: newExpiresAt,
      },
      tx,
    );

    // Only one simultaneous refresh can rotate this token; later attempts fail this condition.
    const rotation = await authRepository.markRefreshTokenRotated(
      currentToken.id,
      replacementToken.id,
      now,
      tx,
    );

    if (rotation.count !== 1) {
      // Another request rotated this token first, so discard this losing replacement.
      await authRepository.deleteRefreshTokenById(replacementToken.id, tx);

      const rotatedToken = await authRepository.findRefreshTokenByHash(
        tokenHash,
        tx,
      );

      if (!rotatedToken?.replacedByTokenId) {
        return { status: "invalid" };
      }

      // Treat the losing concurrent attempt as reuse and revoke the active family.
      await authRepository.revokeActiveRefreshTokensByFamily(
        currentToken.familyId,
        "TOKEN_REUSE",
        now,
        tx,
      );

      return {
        status: "reused",
        auditEvent: {
          userId: currentToken.userId,
          familyId: currentToken.familyId,
          refreshTokenId: currentToken.id,
          replacedByTokenId: rotatedToken.replacedByTokenId,
          detectedAt: now.toISOString(),
        },
      };
    }

    await authRepository.updateUserById(user.id, { lastActivity: now }, tx);

    return {
      status: "ok",
      refreshToken: newRefreshToken,
      tokenRecord: replacementToken,
      user,
    };
  });

  if (result.status === "reused" && result.auditEvent) {
    logSecurityAuditEvent("AUTH_REFRESH_TOKEN_REUSE", {
      ...result.auditEvent,
      revocationReason: "TOKEN_REUSE",
      ip: auditContext.ip,
      userAgent: auditContext.userAgent,
    });
  }

  if (result.status === "expired") {
    throw new Error("REFRESH_TOKEN_EXPIRED");
  }

  if (result.status === "reused") {
    throw new Error("REFRESH_TOKEN_REUSED");
  }

  if (result.status !== "ok") {
    throw new Error("REFRESH_TOKEN_INVALID");
  }

  return result;
}

/**
 * Rotate the refresh session and issue a new short-lived access token.
 */
export async function refreshWebSession(
  refreshToken: string,
  auditContext: AuthAuditContext = {},
): Promise<RefreshSessionResult> {
  const rotation = await rotateRefreshSession(refreshToken, auditContext);

  return {
    accessToken: buildAccessTokenForUser(rotation.user),
    refreshToken: rotation.refreshToken,
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  };
}

/**
 * Add refresh token to user
 */
export async function addRefreshToken(userId, _refreshToken, _deviceInfo) {
  // Store refresh token in database
  // Note: For Prisma, we'd need a RefreshToken model or use JSON field
  // For now, we'll return success - you may want to implement proper token storage
  return await authRepository.updateUserById(userId, { lastLogin: new Date() });
}

/**
 * Remove refresh token
 */
export async function removeRefreshToken(
  userId,
  refreshToken,
  reason: RefreshTokenRevocationReason = "LOGOUT",
  auditContext: AuthAuditContext = {},
) {
  const tokenHash = hashToken(refreshToken);
  const currentToken = await authRepository.findRefreshTokenByHash(tokenHash);

  if (!currentToken || currentToken.userId !== userId) {
    return { status: "invalid", revokedCount: 0 };
  }

  return await revokeTokenFamilyByHash(tokenHash, reason, auditContext);
}

/**
 * Clear all refresh tokens
 */
export async function clearAllRefreshTokens(
  userId,
  reason: RefreshTokenRevocationReason = "LOGOUT_ALL",
  auditContext: AuthAuditContext = {},
) {
  const now = new Date();

  const revocation = await authRepository.revokeActiveRefreshTokensByUser(
    userId,
    reason,
    now,
  );

  logSecurityAuditEvent("AUTH_REFRESH_TOKENS_REVOKED", {
    userId,
    revocationReason: reason,
    revokedCount: revocation.count,
    revokedAt: now.toISOString(),
    ip: auditContext.ip,
    userAgent: auditContext.userAgent,
  });

  return {
    status: "ok",
    userId,
    revokedCount: revocation.count,
  };
}

/**
 * Revoke the refresh-token family represented by an opaque cookie token.
 */
export async function revokeRefreshTokenFamily(
  refreshToken,
  reason: RefreshTokenRevocationReason = "LOGOUT",
  auditContext: AuthAuditContext = {},
) {
  return await revokeTokenFamilyByHash(
    hashToken(refreshToken),
    reason,
    auditContext,
  );
}

/**
 * Revoke every active refresh token for the user represented by the cookie token.
 */
export async function revokeAllRefreshTokensForSession(
  refreshToken,
  reason: RefreshTokenRevocationReason = "LOGOUT_ALL",
  auditContext: AuthAuditContext = {},
) {
  const tokenHash = hashToken(refreshToken);
  const currentToken = await authRepository.findRefreshTokenByHash(tokenHash);

  if (!currentToken) {
    return { status: "invalid", revokedCount: 0 };
  }

  return await clearAllRefreshTokens(currentToken.userId, reason, auditContext);
}

/**
 * Revoke active refresh tokens after account suspension.
 */
export async function revokeRefreshTokensForAccountSuspension(
  userId,
  auditContext: AuthAuditContext = {},
) {
  return await clearAllRefreshTokens(userId, "ACCOUNT_SUSPENDED", auditContext);
}

/**
 * Revoke the refresh session represented by the current browser cookie.
 */
export async function logoutWebSession(
  refreshToken: string | null,
  logoutAll = false,
  auditContext: AuthAuditContext = {},
) {
  if (!refreshToken) {
    return { status: "ok", revokedCount: 0 };
  }

  if (logoutAll) {
    return await revokeAllRefreshTokensForSession(
      refreshToken,
      "LOGOUT_ALL",
      auditContext,
    );
  }

  return await revokeRefreshTokenFamily(refreshToken, "LOGOUT", auditContext);
}

/**
 * Update user last login
 */
export async function updateLastLogin(userId) {
  return await authRepository.updateUserById(userId, { lastLogin: new Date() });
}

/**
 * Update user last activity
 */
export async function updateLastActivity(userId) {
  return await authRepository.updateUserById(userId, {
    lastActivity: new Date(),
  });
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId, data: UpdateUserProfileInput) {
  const { name, phone } = data;
  const updateData: Prisma.UserUpdateInput = {};

  if (name) updateData.name = name.trim();
  if (phone !== undefined) {
    // Check if phone is already used
    if (phone) {
      const existing = await authRepository.findUserByPhoneExcept(
        phone,
        userId,
      );
      if (existing) {
        throw new Error("DUPLICATE_PHONE");
      }
    }
    updateData.phone = phone || null;
  }

  return await authRepository.updateUserById(userId, updateData);
}

/**
 * Change user password
 */
export async function changeUserPassword(userId, currentPassword, newPassword) {
  const user = await findUserById(userId);

  const isValid = await comparePassword(currentPassword, user.password);
  if (!isValid) {
    throw new Error("INVALID_CURRENT_PASSWORD");
  }

  const hashedPassword = await hashPassword(newPassword);

  await authRepository.updateUserById(userId, { password: hashedPassword });

  return true;
}

/**
 * Change a password and revoke refresh sessions in one application operation.
 */
export async function changePasswordAndRevokeSessions(
  data: ChangePasswordInput,
  auditContext: AuthAuditContext = {},
) {
  const user = await findUserById(data.userId);

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  const isValid = await comparePassword(data.currentPassword, user.password);
  if (!isValid) {
    throw new Error("INVALID_CURRENT_PASSWORD");
  }

  const hashedPassword = await hashPassword(data.newPassword);
  const now = new Date();

  const result = await authRepository.runAuthTransaction(async (tx) => {
    await authRepository.updateUserById(
      data.userId,
      { password: hashedPassword },
      tx,
    );

    // A password change invalidates refresh sessions on every device.
    const revocation = await authRepository.revokeActiveRefreshTokensByUser(
      data.userId,
      "PASSWORD_CHANGED",
      now,
      tx,
    );

    return {
      userId: data.userId,
      revokedCount: revocation.count,
      revokedAt: now.toISOString(),
    };
  });

  logSecurityAuditEvent("AUTH_REFRESH_TOKENS_REVOKED", {
    ...result,
    revocationReason: "PASSWORD_CHANGED",
    ip: auditContext.ip,
    userAgent: auditContext.userAgent,
  });

  return result;
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
  await authRepository.updateUserById(user.id, {
    resetPasswordToken: hashedToken,
    resetPasswordExpires: expiresAt,
  });

  return { success: true, token: resetToken };
}

/**
 * Reset password with token
 */
export async function resetPasswordWithToken(
  token,
  newPassword,
  auditContext: AuthAuditContext = {},
) {
  const hashedToken = hashResetToken(token);

  const user = await authRepository.findUserByResetToken(
    hashedToken,
    new Date(),
  );

  if (!user) {
    throw new Error("INVALID_OR_EXPIRED_TOKEN");
  }

  const hashedPassword = await hashPassword(newPassword);
  const now = new Date();

  const result = await authRepository.runAuthTransaction(async (tx) => {
    await authRepository.updateUserById(
      user.id,
      {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
      tx,
    );

    // A successful password reset invalidates refresh sessions on every device.
    const revocation = await authRepository.revokeActiveRefreshTokensByUser(
      user.id,
      "PASSWORD_RESET",
      now,
      tx,
    );

    return {
      userId: user.id,
      revokedCount: revocation.count,
      revokedAt: now.toISOString(),
    };
  });

  logSecurityAuditEvent("AUTH_REFRESH_TOKENS_REVOKED", {
    ...result,
    revocationReason: "PASSWORD_RESET",
    ip: auditContext.ip,
    userAgent: auditContext.userAgent,
  });

  return result;
}

/**
 * Complete user onboarding
 */
export async function completeOnboarding(userId) {
  return await authRepository.updateUserById(userId, {
    onboardingComplete: true,
    onboardingStep: 5,
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
    lastLogin: user.lastLogin,
  };
}

export default {
  REFRESH_TOKEN_COOKIE_NAME,
  registerWithSession,
  loginWithSession,
  registerUser,
  findUserByEmail,
  findUserById,
  verifyCredentials,
  createRefreshSession,
  rotateRefreshSession,
  refreshWebSession,
  getRefreshTokenCookieOptions,
  addRefreshToken,
  removeRefreshToken,
  revokeRefreshTokenFamily,
  revokeAllRefreshTokensForSession,
  revokeRefreshTokensForAccountSuspension,
  logoutWebSession,
  clearAllRefreshTokens,
  updateLastLogin,
  updateLastActivity,
  updateUserProfile,
  changeUserPassword,
  changePasswordAndRevokeSessions,
  generatePasswordReset,
  resetPasswordWithToken,
  completeOnboarding,
  toSafeUser,
};
