/**
 * Notifications Routes
 * API routes for notification settings
 */

import express from 'express';
import * as notificationsController from '../controllers/notificationsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get notification settings
router.get('/', notificationsController.getSettings);

// Update notification settings
router.put('/', notificationsController.updateSettings);

// Toggle all notifications
router.put('/toggle-all', notificationsController.toggleAll);

// Set low balance threshold
router.put('/threshold', notificationsController.setThreshold);

export default router;

// SR
