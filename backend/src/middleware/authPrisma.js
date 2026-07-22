/**
 * Prisma-based Authentication Middleware
 * JWT token verification and user authentication
 */

import { verifyAccessToken, extractTokenFromHeader } from '../config/jwt.js';
import { prisma } from '../config/prisma.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants.js';

// ==========================================
// AUTH MIDDLEWARE
// Verifies JWT token and attaches user to request
// ==========================================
export const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: ERROR_MESSAGES.UNAUTHORIZED,
        message: 'No authentication token provided'
      });
    }

    // Verify access token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      if (error.message.includes('expired')) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: ERROR_MESSAGES.TOKEN_EXPIRED,
          message: 'Access token has expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: ERROR_MESSAGES.TOKEN_INVALID,
        message: 'Invalid authentication token'
      });
    }

    // Find user by ID
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || !user.isActive) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: ERROR_MESSAGES.UNAUTHORIZED,
        message: 'User not found or inactive'
      });
    }

    // Update last activity
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActivity: new Date() }
    });

    // Attach user to request
    req.user = user;
    req.userId = user.id;

    next();

  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: ERROR_MESSAGES.INTERNAL_ERROR,
      message: 'Authentication failed'
    });
  }
};

// ==========================================
// OPTIONAL AUTH MIDDLEWARE
// Attaches user if token present, but doesn't require it
// ==========================================
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return next(); // Proceed without user
    }

    // Try to verify token
    try {
      const decoded = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (user && user.isActive) {
        req.user = user;
        req.userId = user.id;
      }
    } catch (tokenError) {
      // Invalid token, proceed without user
    }

    next();

  } catch (error) {
    console.error('Optional auth error:', error);
    next(); // Proceed without user on error
  }
};

// ==========================================
// ROLE BASED AUTH MIDDLEWARE
// Checks if user has required role
// Usage: after authenticate middleware
// ==========================================
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: ERROR_MESSAGES.UNAUTHORIZED,
        message: 'Authentication required'
      });
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        error: ERROR_MESSAGES.FORBIDDEN,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// ==========================================
// OWNER CHECK MIDDLEWARE
// Checks if user owns the resource
// Usage: after authenticate middleware
// Assumes req.resource.userId exists
// ==========================================
export const isOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      error: ERROR_MESSAGES.UNAUTHORIZED,
      message: 'Authentication required'
    });
  }

  // Admin can access anything
  if (req.user.role === 'admin') {
    return next();
  }

  // Check if user owns the resource
  const resourceUserId = req.resource?.userId || req.params.userId;
  if (resourceUserId && resourceUserId.toString() !== req.user.id.toString()) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      error: ERROR_MESSAGES.FORBIDDEN,
      message: 'Access denied: you do not own this resource'
    });
  }

  next();
};

// ==========================================
// VERIFY EMAIL MIDDLEWARE
// Checks if user's email is verified
// Usage: after authenticate middleware
// ==========================================
export const requireVerifiedEmail = (req, res, next) => {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      error: ERROR_MESSAGES.UNAUTHORIZED,
      message: 'Authentication required'
    });
  }

  if (!req.user.isEmailVerified) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      error: ERROR_MESSAGES.FORBIDDEN,
      message: 'Email verification required',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }

  next();
};

// ==========================================
// CHECK ONBOARDING MIDDLEWARE
// Checks if user has completed onboarding
// Usage: after authenticate middleware
// ==========================================
export const requireOnboarding = (req, res, next) => {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      error: ERROR_MESSAGES.UNAUTHORIZED,
      message: 'Authentication required'
    });
  }

  if (!req.user.onboardingComplete) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      error: 'Onboarding required',
      message: 'Please complete onboarding to continue',
      code: 'ONBOARDING_REQUIRED',
      onboardingStep: req.user.onboardingStep || 0
    });
  }

  next();
};

// ==========================================
// EXPORTS
// ==========================================
export default {
  authenticate,
  optionalAuth,
  authorize,
  isOwner,
  requireVerifiedEmail,
  requireOnboarding
};
