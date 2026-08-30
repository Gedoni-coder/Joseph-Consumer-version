// @ts-nocheck
/**
 * Preferences Controller
 * Handles user preferences requests
 */

import {
  getUserPreferences,
  updateUserPreferences,
  resetUserPreferences
} from '../services/userPreferencesService';

export async function getPreferences(req, res, next) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const preferences = await getUserPreferences(userId);
    res.json(preferences);
  } catch (error) {
    next(error);
  }
}

export async function updatePreferences(req, res, next) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const preferences = await updateUserPreferences(userId, req.body);
    res.json(preferences);
  } catch (error) {
    next(error);
  }
}

export async function resetPreferences(req, res, next) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const preferences = await resetUserPreferences(userId);
    res.json(preferences);
  } catch (error) {
    next(error);
  }
}

export async function setDarkMode(req, res, next) {
  try {
    const userId = req.user?.id;
    const { enabled } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const preferences = await updateUserPreferences(userId, { darkMode: enabled });
    res.json(preferences);
  } catch (error) {
    next(error);
  }
}

export async function setAccentColor(req, res, next) {
  try {
    const userId = req.user?.id;
    const { color } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const preferences = await updateUserPreferences(userId, { accentColor: color });
    res.json(preferences);
  } catch (error) {
    next(error);
  }
}

export async function setFontSize(req, res, next) {
  try {
    const userId = req.user?.id;
    const { size } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const preferences = await updateUserPreferences(userId, { fontSize: size });
    res.json(preferences);
  } catch (error) {
    next(error);
  }
}
