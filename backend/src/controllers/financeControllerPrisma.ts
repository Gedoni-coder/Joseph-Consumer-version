// @ts-nocheck
/**
 * Prisma-based Finance Controller
 * Handles all Finance module endpoints using Prisma/PostgreSQL
 */

import { financeService } from '../services/financeService';
import { LEDGER_TYPES } from '../config/constants';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants';

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Format number as currency
 */
function formatCurrency(amount, currency = 'NGN') {
  const symbols = { NGN: '₦', USD: '$', GBP: '£', EUR: '€' };
  const symbol = symbols[currency] || '₦';
  return `${symbol}${amount.toLocaleString()}`;
}

// ==========================================
// OVERVIEW
// ==========================================

/**
 * Get complete Finance module overview
 */
export const getFinanceOverview = async (req, res, next) => {
  try {
    const userId = req.userId;
    const overview = await financeService.getFinanceOverview(userId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      overview
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// LEDGERS
// ==========================================

/**
 * Get all ledgers for user
 */
export const getLedgers = async (req, res, next) => {
  try {
    const userId = req.userId;
    const ledgers = await financeService.getLedgers(userId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ledgers
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get specific ledger by type
 */
export const getLedgerByType = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { type } = req.params;

    if (!Object.values(LEDGER_TYPES).includes(type)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid ledger type'
      });
    }

    const ledger = await financeService.getLedgerByType(userId, type);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ledger
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// BUDGET TRACKING (Life Ledger)
// ==========================================

/**
 * Get budget breakdown
 */
export const getBudgetBreakdown = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { period = 'month' } = req.query;

    const result = await financeService.getBudgetBreakdown(userId, period);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...result
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Set budget allocation
 */
export const setBudgetAllocation = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { monthlyBudget, allocation } = req.body;

    // Validate allocation sums to 1
    if (allocation) {
      const total = (allocation.needs || 0) + (allocation.wants || 0) + (allocation.savings || 0);
      if (Math.abs(total - 1) > 0.01) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Allocation must sum to 1 (100%)'
        });
      }
    }

    const result = await financeService.setBudgetAllocation(userId, { monthlyBudget, allocation });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Budget updated successfully',
      budget: result
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// RUNWAY (Life Ledger)
// ==========================================

/**
 * Get runway analysis
 */
export const getRunwayAnalysis = async (req, res, next) => {
  try {
    const userId = req.userId;
    const result = await financeService.getRunwayAnalysis(userId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...result
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// CAPITAL MANAGEMENT (Business Ledger)
// ==========================================

/**
 * Get capital position
 */
export const getCapitalPosition = async (req, res, next) => {
  try {
    const userId = req.userId;
    const result = await financeService.getCapitalPosition(userId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...result
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Set capital targets
 */
export const setCapitalTargets = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { workingCapitalTarget, reinvestmentRatio } = req.body;

    // Validate reinvestment ratio
    if (reinvestmentRatio !== undefined && (reinvestmentRatio < 0 || reinvestmentRatio > 1)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Reinvestment ratio must be between 0 and 1'
      });
    }

    const result = await financeService.setCapitalTargets(userId, { workingCapitalTarget, reinvestmentRatio });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Capital targets updated',
      targets: result
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// CREDIT MONITORING
// ==========================================

/**
 * Get credit overview
 */
export const getCreditOverview = async (req, res, next) => {
  try {
    const userId = req.userId;
    const result = await financeService.getCreditOverview(userId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...result
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get overdue credits
 */
export const getOverdueCredits = async (req, res, next) => {
  try {
    const userId = req.userId;
    const result = await financeService.getOverdueCredits(userId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...result
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get upcoming due credits
 */
export const getUpcomingCredits = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { days = 7 } = req.query;

    const result = await financeService.getUpcomingCredits(userId, parseInt(days));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...result
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Add payment to credit
 */
export const addCreditPayment = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { amount, method, reference, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Valid payment amount is required'
      });
    }

    const result = await financeService.addCreditPayment(userId, id, { amount, method, reference, notes });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Payment recorded',
      payment: result
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// TRANSACTIONS
// ==========================================

/**
 * Get recent transactions for user
 */
export const getTransactions = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { ledgerType, type, limit = 50 } = req.query;
    const { prisma } = await import('../config/prisma');

    const where = {
      userId,
      isDeleted: false,
      ...(type && { type }),
    };

    if (ledgerType) {
      const ledger = await prisma.ledger.findFirst({
        where: { userId, type: ledgerType.toUpperCase() }
      });
      if (ledger) where.ledgerId = ledger.id;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit),
      select: {
        id: true,
        type: true,
        amount: true,
        currency: true,
        narration: true,
        description: true,
        timestamp: true,
        category: true,
        merchant: true,
        beneficiary: true,
        balanceAfter: true,
        ledger: { select: { type: true, name: true } }
      }
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: transactions.length,
      transactions
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// GOALS
// ==========================================

/**
 * Get all financial goals for user
 */
export const getGoals = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { status } = req.query;
    const { prisma } = await import('../config/prisma');

    const goals = await prisma.goal.findMany({
      where: {
        userId,
        isDeleted: false,
        ...(status && { status })
      },
      orderBy: { createdAt: 'desc' },
      include: {
        milestones: true,
        actionItems: { where: { status: 'pending' } }
      }
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: goals.length,
      goals
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Create a new financial goal
 */
export const createGoal = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { title, description, category, targetValue, currentValue, endDate, priority } = req.body;
    const { prisma } = await import('../config/prisma');

    if (!title || !category || !endDate) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'title, category, and endDate are required'
      });
    }

    const goal = await prisma.goal.create({
      data: {
        userId,
        title,
        description,
        category,
        targetValue: parseFloat(targetValue) || 0,
        currentValue: parseFloat(currentValue) || 0,
        endDate: new Date(endDate),
        priority: priority || 'MEDIUM',
        progress: targetValue > 0 ? Math.min(100, ((currentValue || 0) / targetValue) * 100) : 0
      }
    });

    res.status(HTTP_STATUS.CREATED || 201).json({
      success: true,
      message: 'Goal created',
      goal
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update a financial goal
 */
export const updateGoal = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { currentValue, status, title, targetValue, endDate } = req.body;
    const { prisma } = await import('../config/prisma');

    const goal = await prisma.goal.findFirst({ where: { id, userId, isDeleted: false } });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    const tv = targetValue !== undefined ? parseFloat(targetValue) : goal.targetValue;
    const cv = currentValue !== undefined ? parseFloat(currentValue) : goal.currentValue;

    const updated = await prisma.goal.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(status && { status }),
        ...(targetValue !== undefined && { targetValue: tv }),
        ...(currentValue !== undefined && { currentValue: cv }),
        ...(endDate && { endDate: new Date(endDate) }),
        progress: tv > 0 ? Math.min(100, (cv / tv) * 100) : 0,
        updatedAt: new Date()
      }
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Goal updated',
      goal: updated
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// EXPORTS
// ==========================================
export default {
  // Overview
  getFinanceOverview,

  // Ledgers
  getLedgers,
  getLedgerByType,

  // Budget (Life Ledger)
  getBudgetBreakdown,
  setBudgetAllocation,

  // Runway (Life Ledger)
  getRunwayAnalysis,

  // Capital (Business Ledger)
  getCapitalPosition,
  setCapitalTargets,

  // Credits
  getCreditOverview,
  getOverdueCredits,
  getUpcomingCredits,
  addCreditPayment,

  // Transactions
  getTransactions,

  // Goals
  getGoals,
  createGoal,
  updateGoal
};

