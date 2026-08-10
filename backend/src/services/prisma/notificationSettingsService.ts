// @ts-nocheck
/**
 * Notification Settings Service
 * Handles notification preference operations
 */

import { prisma } from '../../config/prisma';

// ==========================================
// NOTIFICATION SETTINGS OPERATIONS
// ==========================================

/**
 * Get or create notification settings
 */
export async function getNotificationSettings(userId) {
  let settings = await prisma.notificationSettings.findUnique({
    where: { userId }
  });

  // Create if doesn't exist
  if (!settings) {
    settings = await prisma.notificationSettings.create({
      data: { userId }
    });
  }

  return settings;
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(userId, data) {
  const {
    pushNotifications,
    emailNotifications,
    lowBalanceThreshold,
    spendingAlert,
    goalUpdates,
    runwayWarning,
    creditReminders,
    economicAlerts,
    priceMovementAlerts
  } = data;

  return await prisma.notificationSettings.upsert({
    where: { userId },
    update: {
      ...(pushNotifications !== undefined && { pushNotifications }),
      ...(emailNotifications !== undefined && { emailNotifications }),
      ...(lowBalanceThreshold !== undefined && { lowBalanceThreshold }),
      ...(spendingAlert !== undefined && { spendingAlert }),
      ...(goalUpdates !== undefined && { goalUpdates }),
      ...(runwayWarning !== undefined && { runwayWarning }),
      ...(creditReminders !== undefined && { creditReminders }),
      ...(economicAlerts !== undefined && { economicAlerts }),
      ...(priceMovementAlerts !== undefined && { priceMovementAlerts })
    },
    create: {
      userId,
      pushNotifications: pushNotifications ?? true,
      emailNotifications: emailNotifications ?? true,
      lowBalanceThreshold: lowBalanceThreshold ?? 5000,
      spendingAlert: spendingAlert ?? true,
      goalUpdates: goalUpdates ?? true,
      runwayWarning: runwayWarning ?? true,
      creditReminders: creditReminders ?? true,
      economicAlerts: economicAlerts ?? true,
      priceMovementAlerts: priceMovementAlerts ?? true
    }
  });
}

/**
 * Toggle all notifications on/off
 */
export async function toggleAllNotifications(userId, enabled) {
  return await prisma.notificationSettings.upsert({
    where: { userId },
    update: {
      pushNotifications: enabled,
      emailNotifications: enabled,
      spendingAlert: enabled,
      goalUpdates: enabled,
      runwayWarning: enabled,
      creditReminders: enabled,
      economicAlerts: enabled,
      priceMovementAlerts: enabled
    },
    create: {
      userId,
      pushNotifications: enabled,
      emailNotifications: enabled,
      lowBalanceThreshold: 5000,
      spendingAlert: enabled,
      goalUpdates: enabled,
      runwayWarning: enabled,
      creditReminders: enabled,
      economicAlerts: enabled,
      priceMovementAlerts: enabled
    }
  });
}
