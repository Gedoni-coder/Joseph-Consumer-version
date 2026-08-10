// @ts-nocheck
/**
 * Strategy Recommendation Service
 * Handles AI-generated strategy recommendations
 */

import { prisma } from '../../config/prisma';

// ==========================================
// STRATEGY RECOMMENDATION OPERATIONS
// ==========================================

/**
 * Create strategy recommendation
 */
export async function createRecommendation(userId, data) {
  const { title, message, impact, type, priority, category, source } = data;

  return await prisma.strategyRecommendation.create({
    data: {
      userId,
      title,
      message,
      impact,
      type: type || 'info',
      priority: priority || 'medium',
      category,
      source,
      status: 'new',
      viewed: false
    }
  });
}

/**
 * Get user recommendations
 */
export async function getUserRecommendations(userId, filters = {}) {
  const { status, viewed, type, category, limit = 20 } = filters;

  const where = { userId };
  if (status) where.status = status;
  if (viewed !== undefined) where.viewed = viewed;
  if (type) where.type = type;
  if (category) where.category = category;

  return await prisma.strategyRecommendation.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}

/**
 * Get unread recommendations
 */
export async function getUnreadRecommendations(userId) {
  return await prisma.strategyRecommendation.findMany({
    where: { userId, viewed: false },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Mark recommendation as viewed
 */
export async function markRecommendationViewed(recommendationId) {
  return await prisma.strategyRecommendation.update({
    where: { id: recommendationId },
    data: { viewed: true, viewedAt: new Date() }
  });
}

/**
 * Update recommendation status
 */
export async function updateRecommendationStatus(recommendationId, status) {
  return await prisma.strategyRecommendation.update({
    where: { id: recommendationId },
    data: { status }
  });
}

/**
 * Delete recommendation
 */
export async function deleteRecommendation(recommendationId) {
  return await prisma.strategyRecommendation.delete({
    where: { id: recommendationId }
  });
}

/**
 * Get recommendations by priority
 */
export async function getRecommendationsByPriority(userId, priority) {
  return await prisma.strategyRecommendation.findMany({
    where: { userId, priority },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Bulk mark as viewed
 */
export async function bulkMarkViewed(userId, recommendationIds) {
  return await prisma.strategyRecommendation.updateMany({
    where: {
      id: { in: recommendationIds },
      userId
    },
    data: { viewed: true, viewedAt: new Date() }
  });
}
