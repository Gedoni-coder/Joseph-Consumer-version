// @ts-nocheck
/**
 * Customer Service
 * Handles customer relationship management
 */

import { prisma } from '../../config/prisma';

// ==========================================
// CUSTOMER OPERATIONS
// ==========================================

/**
 * Create customer
 */
export async function createCustomer(userId, data) {
  const { name, phone, email, address, notes, loyaltyLevel } = data;

  return await prisma.customer.create({
    data: {
      userId,
      name,
      phone,
      email,
      address,
      notes,
      loyaltyLevel: loyaltyLevel || 'regular'
    }
  });
}

/**
 * Get customer by ID
 */
export async function getCustomer(customerId) {
  return await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      interactions: {
        orderBy: { interactionAt: 'desc' },
        take: 10
      },
      creditEntries: {
        where: { isDeleted: false },
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  });
}

/**
 * Get all user customers
 */
export async function getUserCustomers(userId, filters = {}) {
  const { loyaltyLevel, search, limit = 50 } = filters;

  const where = { userId };
  if (loyaltyLevel) where.loyaltyLevel = loyaltyLevel;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { email: { contains: search, mode: 'insensitive' } }
    ];
  }

  return await prisma.customer.findMany({
    where,
    orderBy: { lastPurchaseAt: 'desc' },
    take: limit
  });
}

/**
 * Update customer
 */
export async function updateCustomer(customerId, data) {
  const { name, phone, email, address, notes, loyaltyLevel } = data;

  return await prisma.customer.update({
    where: { id: customerId },
    data: {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
      ...(address !== undefined && { address }),
      ...(notes !== undefined && { notes }),
      ...(loyaltyLevel !== undefined && { loyaltyLevel })
    }
  });
}

/**
 * Delete customer
 */
export async function deleteCustomer(customerId) {
  return await prisma.customer.delete({
    where: { id: customerId }
  });
}

/**
 * Update customer purchase stats
 */
export async function updatePurchaseStats(customerId, purchaseAmount) {
  return await prisma.customer.update({
    where: { id: customerId },
    data: {
      totalPurchases: { increment: purchaseAmount },
      lastPurchaseAt: new Date()
    }
  });
}

/**
 * Update customer credit stats
 */
export async function updateCreditStats(customerId, creditAmount) {
  return await prisma.customer.update({
    where: { id: customerId },
    data: {
      totalCredit: { increment: creditAmount }
    }
  });
}

/**
 * Get top customers by purchases
 */
export async function getTopCustomers(userId, limit = 10) {
  return await prisma.customer.findMany({
    where: { userId },
    orderBy: { totalPurchases: 'desc' },
    take: limit
  });
}

/**
 * Get customers by loyalty level
 */
export async function getCustomersByLoyalty(userId, loyaltyLevel) {
  return await prisma.customer.findMany({
    where: { userId, loyaltyLevel },
    orderBy: { totalPurchases: 'desc' }
  });
}

/**
 * Search customers
 */
export async function searchCustomers(userId, query) {
  return await prisma.customer.findMany({
    where: {
      userId,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query } },
        { email: { contains: query, mode: 'insensitive' } }
      ]
    },
    orderBy: { lastPurchaseAt: 'desc' }
  });
}

// ==========================================
// CUSTOMER INTERACTION OPERATIONS
// ==========================================

/**
 * Create customer interaction
 */
export async function createInteraction(customerId, data) {
  const { type, direction, summary, notes } = data;

  return await prisma.customerInteraction.create({
    data: {
      customerId,
      type,
      direction,
      summary,
      notes
    }
  });
}

/**
 * Get customer interactions
 */
export async function getCustomerInteractions(customerId, limit = 20) {
  return await prisma.customerInteraction.findMany({
    where: { customerId },
    orderBy: { interactionAt: 'desc' },
    take: limit
  });
}

/**
 * Update interaction
 */
export async function updateInteraction(interactionId, data) {
  return await prisma.customerInteraction.update({
    where: { id: interactionId },
    data
  });
}

/**
 * Delete interaction
 */
export async function deleteInteraction(interactionId) {
  return await prisma.customerInteraction.delete({
    where: { id: interactionId }
  });
}

/**
 * Get recent interactions for user
 */
export async function getRecentInteractions(userId, limit = 20) {
  return await prisma.customerInteraction.findMany({
    where: {
      customer: { userId }
    },
    include: {
      customer: true
    },
    orderBy: { interactionAt: 'desc' },
    take: limit
  });
}

// SR
