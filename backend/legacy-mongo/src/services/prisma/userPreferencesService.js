/**
 * User Preferences Service
 * Handles user preference operations
 */

import { prisma } from '../../config/prisma.js';

// ==========================================
// USER PREFERENCES OPERATIONS
// ==========================================

/**
 * Get or create user preferences
 */
export async function getUserPreferences(userId) {
  let preferences = await prisma.userPreferences.findUnique({
    where: { userId }
  });

  // Create if doesn't exist
  if (!preferences) {
    preferences = await prisma.userPreferences.create({
      data: { userId }
    });
  }

  return preferences;
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(userId, data) {
  const { darkMode, accentColor, fontSize, dateFormat } = data;

  return await prisma.userPreferences.upsert({
    where: { userId },
    update: {
      ...(darkMode !== undefined && { darkMode }),
      ...(accentColor !== undefined && { accentColor }),
      ...(fontSize !== undefined && { fontSize }),
      ...(dateFormat !== undefined && { dateFormat })
    },
    create: {
      userId,
      darkMode: darkMode ?? false,
      accentColor: accentColor ?? 'navy',
      fontSize: fontSize ?? 'medium',
      dateFormat: dateFormat ?? 'dmy'
    }
  });
}

/**
 * Reset user preferences to defaults
 */
export async function resetUserPreferences(userId) {
  return await prisma.userPreferences.upsert({
    where: { userId },
    update: {
      darkMode: false,
      accentColor: 'navy',
      fontSize: 'medium',
      dateFormat: 'dmy'
    },
    create: {
      userId,
      darkMode: false,
      accentColor: 'navy',
      fontSize: 'medium',
      dateFormat: 'dmy'
    }
  });
}

// SR
