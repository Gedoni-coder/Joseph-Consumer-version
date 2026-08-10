// @ts-nocheck
/**
 * Preferences Routes
 * API routes for user preferences
 */

import express from 'express';
import * as preferencesController from '../controllers/preferencesController.js';
import { authenticate } from '../middleware/authPrisma.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get user preferences
router.get('/', preferencesController.getPreferences);

// Update user preferences
router.put('/', preferencesController.updatePreferences);

// Reset preferences to defaults
router.post('/reset', preferencesController.resetPreferences);

// Set dark mode
router.put('/dark-mode', preferencesController.setDarkMode);

// Set accent color
router.put('/accent-color', preferencesController.setAccentColor);

// Set font size
router.put('/font-size', preferencesController.setFontSize);

export default router;
