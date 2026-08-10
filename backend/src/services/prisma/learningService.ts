// @ts-nocheck
/**
 * Learning Service
 * Handles category learning and account classification
 */

import { prisma } from '../../config/prisma.js';

// ==========================================
// CATEGORY LEARNING OPERATIONS
// ==========================================

/**
 * Learn category pattern
 */
export async function learnCategoryPattern(userId, pattern, category) {
  // Check if pattern already exists
  const existing = await prisma.categoryLearning.findUnique({
    where: { userId_pattern: { userId, pattern } }
  });

  if (existing) {
    // Update existing pattern
    if (existing.category === category) {
      // Reinforce learning
      return await prisma.categoryLearning.update({
        where: { id: existing.id },
        data: {
          usageCount: { increment: 1 },
          confidence: { increment: 0.05 },
          lastUsed: new Date()
        }
      });
    } else {
      // Pattern changed category, reduce confidence
      const newConfidence = Math.max(0.5, existing.confidence - 0.2);
      return await prisma.categoryLearning.update({
        where: { id: existing.id },
        data: {
          category,
          confidence: newConfidence,
          usageCount: { increment: 1 },
          lastUsed: new Date()
        }
      });
    }
  } else {
    // Create new pattern
    return await prisma.categoryLearning.create({
      data: {
        userId,
        pattern,
        category,
        confidence: 1.0,
        usageCount: 1
      }
    });
  }
}

/**
 * Get category for pattern
 */
export async function getCategoryForPattern(userId, pattern) {
  const learning = await prisma.categoryLearning.findUnique({
    where: { userId_pattern: { userId, pattern } }
  });

  if (learning && learning.confidence > 0.7) {
    return { category: learning.category, confidence: learning.confidence };
  }

  return null;
}

/**
 * Get all user learned patterns
 */
export async function getUserLearnedPatterns(userId) {
  return await prisma.categoryLearning.findMany({
    where: { userId },
    orderBy: { usageCount: 'desc' }
  });
}

/**
 * Get patterns by category
 */
export async function getPatternsByCategory(userId, category) {
  return await prisma.categoryLearning.findMany({
    where: { userId, category },
    orderBy: { confidence: 'desc' }
  });
}

/**
 * Delete learning pattern
 */
export async function deleteLearningPattern(learningId) {
  return await prisma.categoryLearning.delete({
    where: { id: learningId }
  });
}

/**
 * Reset all patterns for user
 */
export async function resetUserPatterns(userId) {
  return await prisma.categoryLearning.deleteMany({
    where: { userId }
  });
}

// ==========================================
// ACCOUNT CLASSIFICATION OPERATIONS
// ==========================================

/**
 * Learn account classification
 */
export async function learnAccountClassification(userId, accountId, accountName, ledgerType) {
  const existing = await prisma.accountClassification.findUnique({
    where: { userId_accountId: { userId, accountId } }
  });

  if (existing) {
    return await prisma.accountClassification.update({
      where: { id: existing.id },
      data: {
        accountName,
        ledgerType,
        usageCount: { increment: 1 },
        confidence: { increment: 0.05 },
        lastUsed: new Date()
      }
    });
  } else {
    return await prisma.accountClassification.create({
      data: {
        userId,
        accountId,
        accountName,
        ledgerType,
        confidence: 1.0,
        usageCount: 1
      }
    });
  }
}

/**
 * Get classification for account
 */
export async function getAccountClassification(userId, accountId) {
  return await prisma.accountClassification.findUnique({
    where: { userId_accountId: { userId, accountId } }
  });
}

/**
 * Get classifications by ledger type
 */
export async function getClassificationsByLedgerType(userId, ledgerType) {
  return await prisma.accountClassification.findMany({
    where: { userId, ledgerType, isActive: true },
    orderBy: { confidence: 'desc' }
  });
}

/**
 * Get all user classifications
 */
export async function getUserClassifications(userId) {
  return await prisma.accountClassification.findMany({
    where: { userId, isActive: true },
    orderBy: { usageCount: 'desc' }
  });
}

/**
 * Deactivate classification
 */
export async function deactivateClassification(classificationId) {
  return await prisma.accountClassification.update({
    where: { id: classificationId },
    data: { isActive: false }
  });
}

/**
 * Delete classification
 */
export async function deleteClassification(classificationId) {
  return await prisma.accountClassification.delete({
    where: { id: classificationId }
  });
}
