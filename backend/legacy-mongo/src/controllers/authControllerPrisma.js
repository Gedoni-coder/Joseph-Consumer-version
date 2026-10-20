/**
 * Prisma-based Authentication Controller
 * Handles user authentication using Prisma/PostgreSQL
 */

import crypto from 'crypto';
import {
  generateTokenPair,
  generateTokenId,
  verifyRefreshToken
} from '../config/jwt.js';
import authService from '../services/prisma/authService.js';
import {
  HTTP_STATUS,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES
} from '../config/constants.js';

// ==========================================
// REGISTER
// Create a new user account
// ==========================================
export const register = async (req, res, next) => {
  try {
    const { email, password, name, phone } = req.body;

    // Register user
    let user;
    try {
      user = await authService.registerUser({ email, password, name, phone });
    } catch (error) {
      if (error.message === 'DUPLICATE_EMAIL') {
        return res.status(HTTP_STATUS.CONFLICT).json({
          error: ERROR_MESSAGES.ALREADY_EXISTS,
          message: 'An account with this email already exists'
        });
      }
      if (error.message === 'DUPLICATE_PHONE') {
        return res.status(HTTP_STATUS.CONFLICT).json({
          error: ERROR_MESSAGES.ALREADY_EXISTS,
          message: 'An account with this phone number already exists'
        });
      }
      throw error;
    }

    // Generate tokens
    const tokenId = generateTokenId();
    const deviceInfo = {
      deviceId: req.headers['x-device-id'] || crypto.randomBytes(16).toString('hex'),
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    };

    const { accessToken, refreshToken } = generateTokenPair(
      { userId: user.id, email: user.email },
      tokenId
    );

    // Add refresh token
    await authService.addRefreshToken(user.id, refreshToken, deviceInfo);
    await authService.updateLastLogin(user.id);

    // Return response
    res.status(HTTP_STATUS.CREATED).json({
      message: SUCCESS_MESSAGES.REGISTER_SUCCESS,
      user: authService.toSafeUser(user),
      accessToken,
      refreshToken,
      expiresIn: '15m'
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// LOGIN
// Authenticate user and return tokens
// ==========================================
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Verify credentials
    let user;
    try {
      user = await authService.verifyCredentials(email, password);
    } catch (error) {
      if (error.message === 'USER_NOT_FOUND' || error.message === 'INVALID_PASSWORD') {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: ERROR_MESSAGES.INVALID_CREDENTIALS,
          message: ERROR_MESSAGES.INVALID_CREDENTIALS
        });
      }
      if (error.message === 'ACCOUNT_INACTIVE') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          error: ERROR_MESSAGES.FORBIDDEN,
          message: 'Account is inactive. Please contact support.'
        });
      }
      throw error;
    }

    // Generate tokens
    const tokenId = generateTokenId();
    const deviceInfo = {
      deviceId: req.headers['x-device-id'] || crypto.randomBytes(16).toString('hex'),
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    };

    const { accessToken, refreshToken } = generateTokenPair(
      { userId: user.id, email: user.email },
      tokenId
    );

    // Add refresh token
    await authService.addRefreshToken(user.id, refreshToken, deviceInfo);
    await authService.updateLastLogin(user.id);

    // Return response
    res.status(HTTP_STATUS.OK).json({
      message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
      user: authService.toSafeUser(user),
      accessToken,
      refreshToken,
      expiresIn: '15m'
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// LOGOUT
// Invalidate refresh token
// ==========================================
export const logout = async (req, res, next) => {
  try {
    const { refreshToken, logoutAll = false } = req.body;
    const userId = req.userId;

    if (!refreshToken) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: ERROR_MESSAGES.INVALID_INPUT,
        message: 'Refresh token is required'
      });
    }

    if (logoutAll) {
      await authService.clearAllRefreshTokens(userId);
    } else {
      await authService.removeRefreshToken(userId, refreshToken);
    }

    res.status(HTTP_STATUS.OK).json({
      message: SUCCESS_MESSAGES.LOGOUT_SUCCESS
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// REFRESH TOKEN
// Get new access token using refresh token
// ==========================================
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: ERROR_MESSAGES.INVALID_INPUT,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      if (error.message.includes('expired')) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: ERROR_MESSAGES.TOKEN_EXPIRED,
          message: 'Refresh token has expired',
          code: 'REFRESH_TOKEN_EXPIRED'
        });
      }
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: ERROR_MESSAGES.TOKEN_INVALID,
        message: 'Invalid refresh token'
      });
    }

    // Find user
    const user = await authService.findUserById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: ERROR_MESSAGES.TOKEN_INVALID,
        message: 'Invalid refresh token'
      });
    }

    // Generate new token pair
    const newTokenId = generateTokenId();
    const deviceInfo = {
      deviceId: decoded.deviceId,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    };

    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(
      { userId: user.id, email: user.email },
      newTokenId
    );

    // Update tokens
    await authService.removeRefreshToken(user.id, refreshToken);
    await authService.addRefreshToken(user.id, newRefreshToken, deviceInfo);
    await authService.updateLastActivity(user.id);

    res.status(HTTP_STATUS.OK).json({
      message: SUCCESS_MESSAGES.TOKEN_REFRESHED,
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: '15m'
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET CURRENT USER
// Get authenticated user's profile
// ==========================================
export const getCurrentUser = async (req, res, next) => {
  try {
    // User is attached by auth middleware
    const user = req.user;

    res.status(HTTP_STATUS.OK).json({
      user: authService.toSafeUser(user)
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// UPDATE PROFILE
// Update user profile information
// ==========================================
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const userId = req.userId;

    let user;
    try {
      user = await authService.updateUserProfile(userId, { name, phone });
    } catch (error) {
      if (error.message === 'DUPLICATE_PHONE') {
        return res.status(HTTP_STATUS.CONFLICT).json({
          error: ERROR_MESSAGES.ALREADY_EXISTS,
          message: 'Phone number already in use'
        });
      }
      throw error;
    }

    res.status(HTTP_STATUS.OK).json({
      message: 'Profile updated successfully',
      user: authService.toSafeUser(user)
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// CHANGE PASSWORD
// Change user password (requires current password)
// ==========================================
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    try {
      await authService.changeUserPassword(userId, currentPassword, newPassword);
    } catch (error) {
      if (error.message === 'INVALID_CURRENT_PASSWORD') {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: ERROR_MESSAGES.UNAUTHORIZED,
          message: 'Current password is incorrect'
        });
      }
      throw error;
    }

    // Clear all refresh tokens (require re-login on all devices)
    await authService.clearAllRefreshTokens(userId);

    res.status(HTTP_STATUS.OK).json({
      message: 'Password changed successfully. Please login again.'
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// REQUEST PASSWORD RESET
// Initiate password reset process
// ==========================================
export const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    const result = await authService.generatePasswordReset(email);

    // In production, send email with reset token
    // For now, just return success
    console.log('Password reset token:', result.token); // For development only

    res.status(HTTP_STATUS.OK).json({
      message: 'If an account exists with this email, a password reset link will be sent.',
      // Return token in development only
      ...(process.env.NODE_ENV === 'development' && result.token && { resetToken: result.token })
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// RESET PASSWORD
// Complete password reset with token
// ==========================================
export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    try {
      await authService.resetPasswordWithToken(token, newPassword);
    } catch (error) {
      if (error.message === 'INVALID_OR_EXPIRED_TOKEN') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.INVALID_INPUT,
          message: 'Invalid or expired reset token'
        });
      }
      throw error;
    }

    // Clear all refresh tokens (require re-login)
    // Note: We need the user ID for this, but we don't have it from the token
    // You may want to return it from resetPasswordWithToken

    res.status(HTTP_STATUS.OK).json({
      message: 'Password reset successfully. Please login with your new password.'
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// COMPLETE ONBOARDING
// Mark user onboarding as complete
// ==========================================
export const completeOnboarding = async (req, res, next) => {
  try {
    const userId = req.userId;

    const user = await authService.completeOnboarding(userId);

    res.status(HTTP_STATUS.OK).json({
      message: 'Onboarding completed successfully',
      user: authService.toSafeUser(user)
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// EXPORTS
// ==========================================
export default {
  register,
  login,
  logout,
  refreshToken,
  getCurrentUser,
  updateProfile,
  changePassword,
  requestPasswordReset,
  resetPassword,
  completeOnboarding
};

// SR
