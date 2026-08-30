// @ts-nocheck
/**
 * Pricing Service
 * Handles product pricing history and competitor pricing
 */

import { prisma } from '../config/prisma';

// ==========================================
// PRODUCT PRICE HISTORY OPERATIONS
// ==========================================

/**
 * Record price change
 */
export async function recordPriceChange(productId, data) {
  const { price, cost, margin, reason } = data;

  // Calculate margin if not provided
  let calculatedMargin = margin;
  if (calculatedMargin === undefined && cost) {
    calculatedMargin = ((price - cost) / price) * 100;
  }

  return await prisma.productPriceHistory.create({
    data: {
      productId,
      price,
      cost,
      margin: calculatedMargin,
      reason
    }
  });
}

/**
 * Get product price history
 */
export async function getProductPriceHistory(productId, limit = 50) {
  return await prisma.productPriceHistory.findMany({
    where: { productId },
    orderBy: { effectiveAt: 'desc' },
    take: limit
  });
}

/**
 * Get latest price for product
 */
export async function getLatestPrice(productId) {
  return await prisma.productPriceHistory.findFirst({
    where: { productId },
    orderBy: { effectiveAt: 'desc' }
  });
}

/**
 * Get price changes by date range
 */
export async function getPriceChangesByRange(productId, startDate, endDate) {
  return await prisma.productPriceHistory.findMany({
    where: {
      productId,
      effectiveAt: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { effectiveAt: 'asc' }
  });
}

/**
 * Delete price history record
 */
export async function deletePriceRecord(recordId) {
  return await prisma.productPriceHistory.delete({
    where: { id: recordId }
  });
}

// ==========================================
// COMPETITOR PRICE OPERATIONS
// ==========================================

/**
 * Record competitor price
 */
export async function recordCompetitorPrice(productId, data) {
  const { competitorName, price } = data;

  return await prisma.competitorPrice.create({
    data: {
      productId,
      competitorName,
      price
    }
  });
}

/**
 * Get competitor prices for product
 */
export async function getCompetitorPrices(productId, limit = 20) {
  return await prisma.competitorPrice.findMany({
    where: { productId },
    orderBy: { recordedAt: 'desc' },
    take: limit
  });
}

/**
 * Get latest competitor prices
 */
export async function getLatestCompetitorPrices(productId) {
  // Get unique competitors with their latest price
  const prices = await prisma.competitorPrice.findMany({
    where: { productId },
    orderBy: { recordedAt: 'desc' }
  });

  // Group by competitor and take latest
  const latestByCompetitor = {};
  for (const price of prices) {
    if (!latestByCompetitor[price.competitorName]) {
      latestByCompetitor[price.competitorName] = price;
    }
  }

  return Object.values(latestByCompetitor);
}

/**
 * Get competitor price history
 */
export async function getCompetitorPriceHistory(productId, competitorName, limit = 50) {
  return await prisma.competitorPrice.findMany({
    where: {
      productId,
      competitorName
    },
    orderBy: { recordedAt: 'desc' },
    take: limit
  });
}

/**
 * Update competitor price
 */
export async function updateCompetitorPrice(priceId, data) {
  return await prisma.competitorPrice.update({
    where: { id: priceId },
    data
  });
}

/**
 * Delete competitor price
 */
export async function deleteCompetitorPrice(priceId) {
  return await prisma.competitorPrice.delete({
    where: { id: priceId }
  });
}

/**
 * Get price comparison with competitors
 */
export async function getPriceComparison(productId) {
  const product = await prisma.product.findUnique({
    where: { id: productId }
  });

  const competitorPrices = await getLatestCompetitorPrices(productId);

  return {
    productPrice: product?.currentPrice,
    competitors: competitorPrices.map(cp => ({
      name: cp.competitorName,
      price: cp.price,
      difference: cp.price - (product?.currentPrice || 0),
      recordedAt: cp.recordedAt
    }))
  };
}
