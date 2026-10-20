/**
 * Procurement Service
 * Handles procurement options and inventory transactions
 */

import { prisma } from '../../config/prisma.js';

// ==========================================
// PROCUREMENT OPTION OPERATIONS
// ==========================================

/**
 * Create procurement option
 */
export async function createProcurementOption(supplierId, data) {
  const { name, description, cost, unitCost, quantity, unit, savingsPercent, recommendation } = data;

  return await prisma.procurementOption.create({
    data: {
      supplierId,
      name,
      description,
      cost,
      unitCost,
      quantity,
      unit,
      savingsPercent,
      recommendation
    }
  });
}

/**
 * Get procurement options for supplier
 */
export async function getSupplierProcurementOptions(supplierId) {
  return await prisma.procurementOption.findMany({
    where: { supplierId, isActive: true },
    include: {
      supplier: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Get procurement option by ID
 */
export async function getProcurementOption(optionId) {
  return await prisma.procurementOption.findUnique({
    where: { id: optionId },
    include: {
      supplier: true
    }
  });
}

/**
 * Update procurement option
 */
export async function updateProcurementOption(optionId, data) {
  return await prisma.procurementOption.update({
    where: { id: optionId },
    data
  });
}

/**
 * Deactivate procurement option
 */
export async function deactivateProcurementOption(optionId) {
  return await prisma.procurementOption.update({
    where: { id: optionId },
    data: { isActive: false }
  });
}

/**
 * Compare procurement options
 */
export async function compareProcurementOptions(businessProfileId, materialName) {
  // Get suppliers for this business
  const suppliers = await prisma.supplier.findMany({
    where: { businessProfileId, isActive: true },
    include: {
      procurementOptions: {
        where: { isActive: true }
      }
    }
  });

  // Filter options that match material name
  const options = suppliers
    .flatMap(supplier =>
      supplier.procurementOptions.map(option => ({
        ...option,
        supplierName: supplier.name,
        supplierId: supplier.id
      }))
    )
    .filter(option => option.name.toLowerCase().includes(materialName.toLowerCase()))
    .sort((a, b) => a.unitCost - b.unitCost);

  return options;
}

/**
 * Get best procurement option
 */
export async function getBestProcurementOption(businessProfileId, materialName) {
  const options = await compareProcurementOptions(businessProfileId, materialName);
  return options.length > 0 ? options[0] : null;
}

// ==========================================
// INVENTORY TRANSACTION OPERATIONS
// ==========================================

/**
 * Create inventory transaction
 */
export async function createInventoryTransaction(materialId, data) {
  const { type, quantity, unitCost, reason } = data;

  const totalCost = unitCost ? quantity * unitCost : null;

  return await prisma.inventoryTransaction.create({
    data: {
      materialId,
      type,
      quantity,
      unitCost,
      totalCost,
      reason
    }
  });
}

/**
 * Get inventory transactions for material
 */
export async function getMaterialTransactions(materialId, limit = 50) {
  return await prisma.inventoryTransaction.findMany({
    where: { materialId },
    orderBy: { transactionAt: 'desc' },
    take: limit
  });
}

/**
 * Get transactions by type
 */
export async function getTransactionsByType(materialId, type) {
  return await prisma.inventoryTransaction.findMany({
    where: { materialId, type },
    orderBy: { transactionAt: 'desc' }
  });
}

/**
 * Get transactions by date range
 */
export async function getTransactionsByRange(materialId, startDate, endDate) {
  return await prisma.inventoryTransaction.findMany({
    where: {
      materialId,
      transactionAt: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { transactionAt: 'asc' }
  });
}

/**
 * Calculate current stock
 */
export async function calculateCurrentStock(materialId) {
  const transactions = await prisma.inventoryTransaction.findMany({
    where: { materialId }
  });

  let stock = 0;
  for (const txn of transactions) {
    switch (txn.type) {
      case 'purchase':
        stock += txn.quantity;
        break;
      case 'usage':
      case 'wastage':
        stock -= txn.quantity;
        break;
      case 'adjustment':
        stock = txn.quantity; // Reset to counted value
        break;
    }
  }

  return stock;
}

/**
 * Record stock purchase
 */
export async function recordPurchase(materialId, quantity, unitCost, reason) {
  return await createInventoryTransaction(materialId, {
    type: 'purchase',
    quantity,
    unitCost,
    reason
  });
}

/**
 * Record stock usage
 */
export async function recordUsage(materialId, quantity, reason) {
  return await createInventoryTransaction(materialId, {
    type: 'usage',
    quantity,
    reason
  });
}

/**
 * Record stock wastage
 */
export async function recordWastage(materialId, quantity, reason) {
  return await createInventoryTransaction(materialId, {
    type: 'wastage',
    quantity,
    reason
  });
}

/**
 * Record stock adjustment
 */
export async function recordAdjustment(materialId, quantity, reason) {
  return await createInventoryTransaction(materialId, {
    type: 'adjustment',
    quantity,
    reason
  });
}

/**
 * Get material usage summary
 */
export async function getMaterialUsageSummary(materialId, startDate, endDate) {
  const transactions = await getTransactionsByRange(materialId, startDate, endDate);

  const summary = {
    purchases: 0,
    usage: 0,
    wastage: 0,
    totalCost: 0,
    adjustments: 0
  };

  for (const txn of transactions) {
    switch (txn.type) {
      case 'purchase':
        summary.purchases += txn.quantity;
        summary.totalCost += txn.totalCost || 0;
        break;
      case 'usage':
        summary.usage += txn.quantity;
        break;
      case 'wastage':
        summary.wastage += txn.quantity;
        break;
      case 'adjustment':
        summary.adjustments += 1;
        break;
    }
  }

  return summary;
}

// SR
