/**
 * Prisma-based Authentication Controller
 * Handles HTTP concerns for authentication routes.
 */

import authService from "./auth.service";
import {
  HTTP_STATUS,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
} from "../../config/constants";

const setRefreshTokenCookie = (res, refreshToken) => {
  // The raw refresh token only leaves the server through this HttpOnly cookie.
  res.cookie(
    authService.REFRESH_TOKEN_COOKIE_NAME,
    refreshToken,
    authService.getRefreshTokenCookieOptions(),
  );
};

const clearRefreshTokenCookie = (res) => {
  const cookieOptions = { ...authService.getRefreshTokenCookieOptions() };
  // Clearing must use the same path/security attributes as the original cookie.
  delete cookieOptions.maxAge;
  res.clearCookie(authService.REFRESH_TOKEN_COOKIE_NAME, cookieOptions);
};

const getCookieValue = (req, cookieName) => {
  // This project does not currently use cookie-parser, so read the Cookie header directly.
  const cookieHeader = req.headers.cookie;

  if (!cookieHeader) {
    return null;
  }

  const cookie = cookieHeader
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${cookieName}=`));

  if (!cookie) {
    return null;
  }

  try {
    return decodeURIComponent(cookie.slice(cookieName.length + 1));
  } catch (_error) {
    return cookie.slice(cookieName.length + 1);
  }
};

const getAuditContext = (req) => ({
  // Keep audit context separate from auth decisions and never include token material.
  ip: req.ip || req.connection.remoteAddress,
  userAgent: req.headers["user-agent"],
});

// ==========================================
// REGISTER
// Create a new user account
// ==========================================
export const register = async (req, res, next) => {
  try {
    const { email, password, name, phone } = req.body;

    let session;
    try {
      session = await authService.registerWithSession({
        email,
        password,
        name,
        phone,
      });
    } catch (error) {
      if (error.message === "DUPLICATE_EMAIL") {
        return res.status(HTTP_STATUS.CONFLICT).json({
          error: ERROR_MESSAGES.ALREADY_EXISTS,
          message: "An account with this email already exists",
        });
      }
      if (error.message === "DUPLICATE_PHONE") {
        return res.status(HTTP_STATUS.CONFLICT).json({
          error: ERROR_MESSAGES.ALREADY_EXISTS,
          message: "An account with this phone number already exists",
        });
      }
      throw error;
    }

    setRefreshTokenCookie(res, session.refreshToken);

    res.status(HTTP_STATUS.CREATED).json({
      message: SUCCESS_MESSAGES.REGISTER_SUCCESS,
      user: session.user,
      accessToken: session.accessToken,
      expiresIn: session.expiresIn,
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

    let session;
    try {
      session = await authService.loginWithSession({ email, password });
    } catch (error) {
      if (
        error.message === "USER_NOT_FOUND" ||
        error.message === "INVALID_PASSWORD"
      ) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: ERROR_MESSAGES.INVALID_CREDENTIALS,
          message: ERROR_MESSAGES.INVALID_CREDENTIALS,
        });
      }
      if (error.message === "ACCOUNT_INACTIVE") {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          error: ERROR_MESSAGES.FORBIDDEN,
          message: "Account is inactive. Please contact support.",
        });
      }
      throw error;
    }

    setRefreshTokenCookie(res, session.refreshToken);

    res.status(HTTP_STATUS.OK).json({
      message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
      user: session.user,
      accessToken: session.accessToken,
      expiresIn: session.expiresIn,
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
    const { logoutAll = false } = req.body || {};
    const refreshToken = getCookieValue(
      req,
      authService.REFRESH_TOKEN_COOKIE_NAME,
    );

    await authService.logoutWebSession(
      refreshToken,
      logoutAll,
      getAuditContext(req),
    );
    clearRefreshTokenCookie(res);

    res.status(HTTP_STATUS.OK).json({
      message: SUCCESS_MESSAGES.LOGOUT_SUCCESS,
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
    const refreshToken = getCookieValue(
      req,
      authService.REFRESH_TOKEN_COOKIE_NAME,
    );

    if (!refreshToken) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: ERROR_MESSAGES.INVALID_INPUT,
        message: "Refresh token is required",
      });
    }

    let session;
    try {
      session = await authService.refreshWebSession(
        refreshToken,
        getAuditContext(req),
      );
    } catch (error) {
      if (error.message === "REFRESH_TOKEN_EXPIRED") {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: ERROR_MESSAGES.TOKEN_EXPIRED,
          message: "Refresh token has expired",
          code: "REFRESH_TOKEN_EXPIRED",
        });
      }

      if (error.message === "REFRESH_TOKEN_REUSED") {
        // Reuse means the refresh family was revoked; remove the stale browser cookie too.
        clearRefreshTokenCookie(res);
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: ERROR_MESSAGES.TOKEN_INVALID,
          message: "Refresh token reuse detected. Please log in again.",
          code: "REFRESH_TOKEN_REUSE_DETECTED",
        });
      }

      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: ERROR_MESSAGES.TOKEN_INVALID,
        message: "Invalid refresh token",
      });
    }

    setRefreshTokenCookie(res, session.refreshToken);

    res.status(HTTP_STATUS.OK).json({
      message: SUCCESS_MESSAGES.TOKEN_REFRESHED,
      accessToken: session.accessToken,
      expiresIn: session.expiresIn,
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
      user: authService.toSafeUser(user),
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
      if (error.message === "DUPLICATE_PHONE") {
        return res.status(HTTP_STATUS.CONFLICT).json({
          error: ERROR_MESSAGES.ALREADY_EXISTS,
          message: "Phone number already in use",
        });
      }
      throw error;
    }

    res.status(HTTP_STATUS.OK).json({
      message: "Profile updated successfully",
      user: authService.toSafeUser(user),
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
      await authService.changePasswordAndRevokeSessions(
        { userId, currentPassword, newPassword },
        getAuditContext(req),
      );
    } catch (error) {
      if (error.message === "INVALID_CURRENT_PASSWORD") {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: ERROR_MESSAGES.UNAUTHORIZED,
          message: "Current password is incorrect",
        });
      }
      if (error.message === "USER_NOT_FOUND") {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: ERROR_MESSAGES.UNAUTHORIZED,
          message: "User not found or inactive",
        });
      }
      throw error;
    }

    clearRefreshTokenCookie(res);

    res.status(HTTP_STATUS.OK).json({
      message: "Password changed successfully. Please login again.",
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
    res.status(HTTP_STATUS.OK).json({
      message:
        "If an account exists with this email, a password reset link will be sent.",
      // Return token in development only
      ...(process.env.NODE_ENV === "development" &&
        result.token && { resetToken: result.token }),
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
      await authService.resetPasswordWithToken(
        token,
        newPassword,
        getAuditContext(req),
      );
    } catch (error) {
      if (error.message === "INVALID_OR_EXPIRED_TOKEN") {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.INVALID_INPUT,
          message: "Invalid or expired reset token",
        });
      }
      throw error;
    }

    clearRefreshTokenCookie(res);

    res.status(HTTP_STATUS.OK).json({
      message:
        "Password reset successfully. Please login with your new password.",
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
      message: "Onboarding completed successfully",
      user: authService.toSafeUser(user),
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
  completeOnboarding,
};
