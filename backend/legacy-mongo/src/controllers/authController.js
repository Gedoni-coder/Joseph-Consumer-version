/**
 * Authentication Controller
 * Handles user registration, login, logout, and token management
 */

import crypto from 'crypto';
import User from '../models/User.js';
import {
  generateTokenPair,
  generateTokenId,
  verifyRefreshToken
} from '../config/jwt.js';
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

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        error: ERROR_MESSAGES.ALREADY_EXISTS,
        message: 'An account with this email already exists'
      });
    }

    // Check if phone number already exists
    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          error: ERROR_MESSAGES.ALREADY_EXISTS,
          message: 'An account with this phone number already exists'
        });
      }
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
      name: name.trim(),
      phone: phone || undefined,
      role: 'user',
      isActive: true,
      isEmailVerified: false // Email verification can be added later
    });

    await user.save();

    // Generate tokens
    const tokenId = generateTokenId();
    const deviceInfo = {
      deviceId: req.headers['x-device-id'] || crypto.randomBytes(16).toString('hex'),
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    };

    const { accessToken, refreshToken } = generateTokenPair(
      { userId: user._id, email: user.email },
      tokenId
    );

    // Add refresh token to user
    user.addRefreshToken(refreshToken, deviceInfo);
    user.updateLastLogin();
    await user.save();

    // Return response
    res.status(HTTP_STATUS.CREATED).json({
      message: SUCCESS_MESSAGES.REGISTER_SUCCESS,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        onboardingComplete: user.onboardingComplete,
        onboardingStep: user.onboardingStep
      },
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

    // Find user by email (with password field)
    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: ERROR_MESSAGES.INVALID_CREDENTIALS,
        message: ERROR_MESSAGES.INVALID_CREDENTIALS
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        error: ERROR_MESSAGES.FORBIDDEN,
        message: 'Account is inactive. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: ERROR_MESSAGES.INVALID_CREDENTIALS,
        message: ERROR_MESSAGES.INVALID_CREDENTIALS
      });
    }

    // Generate tokens
    const tokenId = generateTokenId();
    const deviceInfo = {
      deviceId: req.headers['x-device-id'] || crypto.randomBytes(16).toString('hex'),
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    };

    const { accessToken, refreshToken } = generateTokenPair(
      { userId: user._id, email: user.email },
      tokenId
    );

    // Add refresh token to user
    user.addRefreshToken(refreshToken, deviceInfo);
    user.updateLastLogin();
    await user.save();

    // Return response
    res.status(HTTP_STATUS.OK).json({
      message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        onboardingComplete: user.onboardingComplete,
        onboardingStep: user.onboardingStep,
        preferences: user.preferences
      },
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

    if (!refreshToken) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: ERROR_MESSAGES.INVALID_INPUT,
        message: 'Refresh token is required'
      });
    }

    // Find user by refresh token
    const user = await User.findOne({
      'refreshTokens.token': refreshToken
    });

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: ERROR_MESSAGES.TOKEN_INVALID,
        message: 'Invalid refresh token'
      });
    }

    if (logoutAll) {
      // Clear all refresh tokens (logout from all devices)
      user.clearAllRefreshTokens();
    } else {
      // Remove only this refresh token
      user.removeRefreshToken(refreshToken);
    }

    await user.save();

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
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: ERROR_MESSAGES.TOKEN_INVALID,
        message: 'Invalid refresh token'
      });
    }

    // Check if refresh token exists for user
    if (!user.hasRefreshToken(refreshToken)) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: ERROR_MESSAGES.TOKEN_INVALID,
        message: 'Refresh token not found or revoked'
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
      { userId: user._id, email: user.email },
      newTokenId
    );

    // Replace old refresh token with new one
    user.removeRefreshToken(refreshToken);
    user.addRefreshToken(newRefreshToken, deviceInfo);
    user.updateLastActivity();
    await user.save();

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
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        onboardingComplete: user.onboardingComplete,
        onboardingStep: user.onboardingStep,
        preferences: user.preferences,
        businessSettings: user.businessSettings,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
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
    const user = req.user;

    // Update fields
    if (name) user.name = name.trim();
    if (phone !== undefined) {
      // Check if phone is already used by another user
      if (phone) {
        const existing = await User.findOne({ phone, _id: { $ne: user._id } });
        if (existing) {
          return res.status(HTTP_STATUS.CONFLICT).json({
            error: ERROR_MESSAGES.ALREADY_EXISTS,
            message: 'Phone number already in use'
          });
        }
      }
      user.phone = phone || undefined;
    }

    await user.save();

    res.status(HTTP_STATUS.OK).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone
      }
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
    const user = await User.findById(req.userId).select('+password');

    // Verify current password
    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: ERROR_MESSAGES.UNAUTHORIZED,
        message: 'Current password is incorrect'
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    // Clear all refresh tokens (require re-login on all devices)
    user.clearAllRefreshTokens();
    await user.save();

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

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists or not
      return res.status(HTTP_STATUS.OK).json({
        message: 'If an account exists with this email, a password reset link will be sent.'
      });
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // In production, send email with reset token
    // For now, just return success
    // TODO: Implement email sending

    console.log('Password reset token:', resetToken); // For development only

    res.status(HTTP_STATUS.OK).json({
      message: 'If an account exists with this email, a password reset link will be sent.',
      // Return token in development only
      ...(process.env.NODE_ENV === 'development' && { resetToken })
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

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findByPasswordResetToken(hashedToken);
    if (!user) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: ERROR_MESSAGES.INVALID_INPUT,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    user.password = newPassword;
    user.clearPasswordResetToken();
    user.clearAllRefreshTokens(); // Require re-login
    await user.save();

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
    const user = req.user;

    user.onboardingComplete = true;
    user.onboardingStep = 5;
    await user.save();

    res.status(HTTP_STATUS.OK).json({
      message: 'Onboarding completed successfully',
      user: {
        id: user._id,
        onboardingComplete: user.onboardingComplete,
        onboardingStep: user.onboardingStep
      }
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
