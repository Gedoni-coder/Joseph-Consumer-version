// @ts-nocheck
/**
 * Prisma-based Strategy Controller
 * Handles all Strategy module endpoints using Prisma/PostgreSQL
 */

import { strategyService } from '../services/prisma/strategyService';
import { HTTP_STATUS } from '../config/constants';

// ==========================================
// DASHBOARD
// ==========================================

/**
 * Get Strategy module dashboard
 */
export const getStrategyDashboard = async (req, res, next) => {
  try {
    const userId = req.userId;
    const dashboard = await strategyService.getStrategyDashboard(userId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...dashboard
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// PRICING STRATEGY
// ==========================================

/**
 * Get pricing overview
 */
export const getPricingOverview = async (req, res, next) => {
  try {
    const userId = req.userId;
    const result = await strategyService.getPricingOverview(userId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...result
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get product pricing details
 */
export const getProductPricing = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { productId } = req.params;

    const result = await strategyService.getProductPricing(userId, productId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...result
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update product price
 */
export const updateProductPrice = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { productId } = req.params;
    const { currentPrice, reason } = req.body;

    if (!currentPrice || currentPrice <= 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Valid price is required'
      });
    }

    const result = await strategyService.updateProductPrice(userId, productId, { currentPrice, reason });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Price updated successfully',
      product: result
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Add new product
 */
export const addProduct = async (req, res, next) => {
  try {
    const userId = req.userId;
    const productData = req.body;

    if (!productData.name || !productData.currentPrice) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Product name and price are required'
      });
    }

    const result = await strategyService.addProduct(userId, productData);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Product added successfully',
      product: result
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// PROCUREMENT & SUPPLIERS
// ==========================================

/**
 * Get procurement overview
 */
export const getProcurementOverview = async (req, res, next) => {
  try {
    const userId = req.userId;
    const result = await strategyService.getProcurementOverview(userId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...result
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get supplier details
 */
export const getSupplierDetails = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { supplierId } = req.params;

    const result = await strategyService.getSupplierDetails(userId, supplierId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...result
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Add supplier
 */
export const addSupplier = async (req, res, next) => {
  try {
    const userId = req.userId;
    const supplierData = req.body;

    if (!supplierData.name) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Supplier name is required'
      });
    }

    const result = await strategyService.addSupplier(userId, supplierData);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      ...result
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update material stock
 */
export const updateMaterialStock = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { materialId } = req.params;
    const { stockOnHand, lastPurchasePrice } = req.body;

    const result = await strategyService.updateMaterialStock(userId, materialId, { stockOnHand, lastPurchasePrice });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Material stock updated',
      material: result
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// GOAL MANAGEMENT
// ==========================================

/**
 * Get goals overview
 */
export const getGoalsOverview = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { category, status } = req.query;

    const result = await strategyService.getGoalsOverview(userId, { category, status });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...result
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get goal details
 */
export const getGoalDetails = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { goalId } = req.params;

    const result = await strategyService.getGoalDetails(userId, goalId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...result
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Create goal
 */
export const createGoal = async (req, res, next) => {
  try {
    const userId = req.userId;
    const goalData = req.body;

    if (!goalData.title || !goalData.category || !goalData.endDate) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Title, category, and end date are required'
      });
    }

    const result = await strategyService.createGoal(userId, goalData);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Goal created successfully',
      goal: result
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update goal
 */
export const updateGoal = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { goalId } = req.params;
    const updates = req.body;

    const result = await strategyService.updateGoal(userId, goalId, updates);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Goal updated successfully',
      goal: result
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Delete goal
 */
export const deleteGoal = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { goalId } = req.params;

    await strategyService.deleteGoal(userId, goalId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Goal deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Add action item to goal
 */
export const addActionItem = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { goalId } = req.params;
    const actionData = req.body;

    if (!actionData.title) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Action item title is required'
      });
    }

    const result = await strategyService.addActionItem(userId, goalId, actionData);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      ...result
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update action item
 */
export const updateActionItem = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { goalId, actionId } = req.params;
    const updates = req.body;

    const result = await strategyService.updateActionItem(userId, goalId, actionId, updates);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...result
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Add milestone to goal
 */
export const addMilestone = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { goalId } = req.params;
    const milestoneData = req.body;

    if (!milestoneData.title) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Milestone title is required'
      });
    }

    const result = await strategyService.addMilestone(userId, goalId, milestoneData);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      ...result
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Complete milestone
 */
export const completeMilestone = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { goalId, milestoneId } = req.params;

    const result = await strategyService.completeMilestone(userId, goalId, milestoneId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Milestone completed',
      ...result
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// EXPORTS
// ==========================================
export default {
  // Dashboard
  getStrategyDashboard,

  // Pricing
  getPricingOverview,
  getProductPricing,
  updateProductPrice,
  addProduct,

  // Procurement
  getProcurementOverview,
  getSupplierDetails,
  addSupplier,
  updateMaterialStock,

  // Goals
  getGoalsOverview,
  getGoalDetails,
  createGoal,
  updateGoal,
  deleteGoal,
  addActionItem,
  updateActionItem,
  addMilestone,
  completeMilestone
};
