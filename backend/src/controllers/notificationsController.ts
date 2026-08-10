// @ts-nocheck
/**
 * Notifications Controller
 * Handles notification settings requests
 */

import {
  getNotificationSettings,
  updateNotificationSettings,
  toggleAllNotifications
} from '../services/prisma/notificationSettingsService.js';

export async function getSettings(req, res, next) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const settings = await getNotificationSettings(userId);
    res.json(settings);
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const settings = await updateNotificationSettings(userId, req.body);
    res.json(settings);
  } catch (error) {
    next(error);
  }
}

export async function toggleAll(req, res, next) {
  try {
    const userId = req.user?.id;
    const { enabled } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const settings = await toggleAllNotifications(userId, enabled);
    res.json(settings);
  } catch (error) {
    next(error);
  }
}

export async function setThreshold(req, res, next) {
  try {
    const userId = req.user?.id;
    const { threshold } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const settings = await updateNotificationSettings(userId, { lowBalanceThreshold: threshold });
    res.json(settings);
  } catch (error) {
    next(error);
  }
}
