// @ts-nocheck
/**
 * Variance Alert Service
 * Handles variance analysis and alerts
 */

import { prisma } from '../config/prisma';

// ==========================================
// VARIANCE ALERT OPERATIONS
// ==========================================

/**
 * Create variance alert
 */
export async function createVarianceAlert(userId, data) {
  const { type, priority, title, message, impact, directive } = data;

  return await prisma.varianceAlert.create({
    data: {
      userId,
      type,
      priority: priority || 'medium',
      title,
      message,
      impact,
      directive,
      resolved: false
    }
  });
}

/**
 * Get user variance alerts
 */
export async function getVarianceAlerts(userId, filters = {}) {
  const { resolved, type, priority, limit = 50 } = filters;

  const where = { userId };
  if (resolved !== undefined) where.resolved = resolved;
  if (type) where.type = type;
  if (priority) where.priority = priority;

  return await prisma.varianceAlert.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}

/**
 * Get unresolved alerts
 */
export async function getUnresolvedAlerts(userId) {
  return await prisma.varianceAlert.findMany({
    where: { userId, resolved: false },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
  });
}

/**
 * Resolve alert
 */
export async function resolveAlert(alertId) {
  return await prisma.varianceAlert.update({
    where: { id: alertId },
    data: { resolved: true, resolvedAt: new Date() }
  });
}

/**
 * Bulk resolve alerts
 */
export async function bulkResolveAlerts(alertIds) {
  return await prisma.varianceAlert.updateMany({
    where: { id: { in: alertIds } },
    data: { resolved: true, resolvedAt: new Date() }
  });
}

/**
 * Delete alert
 */
export async function deleteAlert(alertId) {
  return await prisma.varianceAlert.delete({
    where: { id: alertId }
  });
}

/**
 * Get alerts by type
 */
export async function getAlertsByType(userId, type) {
  return await prisma.varianceAlert.findMany({
    where: { userId, type },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Clean up old resolved alerts (older than 30 days)
 */
export async function cleanupOldAlerts() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return await prisma.varianceAlert.deleteMany({
    where: {
      resolved: true,
      resolvedAt: { lt: thirtyDaysAgo }
    }
  });
}
