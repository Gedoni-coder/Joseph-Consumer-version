/**
 * JWT Configuration and Token Management
 * Handles token creation, verification, and refresh token management
 */

import jwt from 'jsonwebtoken';

// ==========================================
// CONFIGURATION
// ==========================================
const JWT_CONFIG = {
  ACCESS_TOKEN_SECRET: process.env.JWT_SECRET,
  REFRESH_TOKEN_SECRET: process.env.JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  REFRESH_TOKEN_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
};

// Validate secrets on startup
if (!JWT_CONFIG.ACCESS_TOKEN_SECRET || JWT_CONFIG.ACCESS_TOKEN_SECRET.length < 32) {
  console.warn('⚠️  WARNING: JWT_SECRET is too short or not set. Use at least 32 characters.');
}
if (!JWT_CONFIG.REFRESH_TOKEN_SECRET || JWT_CONFIG.REFRESH_TOKEN_SECRET.length < 32) {
  console.warn('⚠️  WARNING: JWT_REFRESH_SECRET is too short or not set. Use at least 32 characters.');
}

// ==========================================
// TOKEN CREATION
// ==========================================

/**
 * Generate access token
 * @param {object} payload - Data to encode in token (typically { userId, email })
 * @returns {string} JWT access token
 */
export function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_CONFIG.ACCESS_TOKEN_SECRET, {
    expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
    issuer: 'joseph-ai',
    audience: 'joseph-ai-users'
  });
}

/**
 * Generate refresh token
 * @param {object} payload - Data to encode (typically { userId, tokenId })
 * @returns {string} JWT refresh token
 */
export function generateRefreshToken(payload) {
  return jwt.sign(payload, JWT_CONFIG.REFRESH_TOKEN_SECRET, {
    expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRES_IN,
    issuer: 'joseph-ai',
    audience: 'joseph-ai-refresh'
  });
}

/**
 * Generate both access and refresh tokens
 * @param {object} userPayload - User data for tokens
 * @param {string} tokenId - Unique ID for refresh token
 * @returns {object} { accessToken, refreshToken }
 */
export function generateTokenPair(userPayload, tokenId) {
  const accessToken = generateAccessToken({
    userId: userPayload.userId,
    email: userPayload.email
  });

  const refreshToken = generateRefreshToken({
    userId: userPayload.userId,
    tokenId: tokenId
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN
  };
}

// ==========================================
// TOKEN VERIFICATION
// ==========================================

/**
 * Verify access token
 * @param {string} token - JWT access token
 * @returns {object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_CONFIG.ACCESS_TOKEN_SECRET, {
      issuer: 'joseph-ai',
      audience: 'joseph-ai-users'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Access token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid access token');
    }
    throw error;
  }
}

/**
 * Verify refresh token
 * @param {string} token - JWT refresh token
 * @returns {object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_CONFIG.REFRESH_TOKEN_SECRET, {
      issuer: 'joseph-ai',
      audience: 'joseph-ai-refresh'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
}

/**
 * Decode token without verification (useful for expiration check)
 * @param {string} token - JWT token
 * @returns {object|null} Decoded token or null if invalid
 */
export function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
}

/**
 * Check if token is expired without verification
 * @param {string} token - JWT token
 * @returns {boolean}
 */
export function isTokenExpired(token) {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }
  return Date.now() >= decoded.exp * 1000;
}

/**
 * Get time until token expiration
 * @param {string} token - JWT token
 * @returns {number|null} Seconds until expiration, or null if invalid
 */
export function getTokenExpiresIn(token) {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return null;
  }
  const expiresIn = decoded.exp * 1000 - Date.now();
  return Math.max(0, Math.floor(expiresIn / 1000));
}

// ==========================================
// TOKEN ID GENERATION
// ==========================================

/**
 * Generate unique token ID for refresh tokens
 * @returns {string} Unique token ID
 */
export function generateTokenId() {
  return `tok_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// ==========================================
// EXTRACT TOKEN FROM REQUEST
// ==========================================

/**
 * Extract JWT from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Extracted token or null
 */
export function extractTokenFromHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

// ==========================================
// EXPORTS
// ==========================================
export default {
  JWT_CONFIG,
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  isTokenExpired,
  getTokenExpiresIn,
  generateTokenId,
  extractTokenFromHeader
};

// SR
