// @ts-nocheck
/**
 * Authentication Routes
 * Endpoints for user authentication and profile management
 */

import express from 'express';
import authController from '../controllers/authControllerPrisma.js';
import { authenticate } from '../middleware/authPrisma.js';
import {
  validateRegister,
  validateLogin,
  validateRefreshToken
} from '../middleware/validation.js';

const router = express.Router();

// ==========================================
// PUBLIC ROUTES (No Authentication Required)
// ==========================================

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account
 * @access  Public
 * @body    { email, password, name, phone? }
 * @returns { user, accessToken, refreshToken }
 */
router.post('/register', validateRegister, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login with email and password
 * @access  Public
 * @body    { email, password }
 * @returns { user, accessToken, refreshToken }
 */
router.post('/login', validateLogin, authController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Get new access token using refresh token
 * @access  Public
 * @body    { refreshToken }
 * @returns { accessToken, refreshToken }
 */
router.post('/refresh', validateRefreshToken, authController.refreshToken);

/**
 * @route   POST /api/auth/request-password-reset
 * @desc    Request password reset email
 * @access  Public
 * @body    { email }
 * @returns { message }
 */
router.post('/request-password-reset', authController.requestPasswordReset);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 * @body    { token, newPassword }
 * @returns { message }
 */
router.post('/reset-password', authController.resetPassword);

// ==========================================
// PROTECTED ROUTES (Authentication Required)
// ==========================================

/**
 * @route   POST /api/auth/logout
 * @desc    Logout and invalidate refresh token
 * @access  Private
 * @body    { refreshToken, logoutAll? }
 * @returns { message }
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 * @returns { user }
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * @route   PATCH /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 * @body    { name?, phone? }
 * @returns { user }
 */
router.patch('/profile', authenticate, authController.updateProfile);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password (requires current password)
 * @access  Private
 * @body    { currentPassword, newPassword }
 * @returns { message }
 */
router.post('/change-password', authenticate, authController.changePassword);

/**
 * @route   POST /api/auth/complete-onboarding
 * @desc    Mark onboarding as complete
 * @access  Private
 * @returns { user }
 */
router.post('/complete-onboarding', authenticate, authController.completeOnboarding);

// ==========================================
// EXPORT
// ==========================================
export default router;
