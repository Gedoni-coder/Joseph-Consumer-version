/**
 * Finance Module Controller
 * Handles all Finance module endpoints including:
 * - Budget tracking (50:30:20 rule)
 * - Capital management (Working capital, Available capital)
 * - Runway calculations
 * - Credit monitoring
 */

import Ledger from '../models/Ledger.js';
import Transaction from '../models/Transaction.js';
import CreditEntry from '../models/CreditEntry.js';
import { LEDGER_TYPES, TRANSACTION_TYPES, CREDIT_STATUS } from '../config/constants.js';
import { HTTP_STATUS } from '../config/constants.js';

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

/**
 * Calculate percentage
 */
function calculatePercent(value, total) {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Get date range for period
 */
function getDateRange(period) {
  const now = new Date();
  const start = new Date();
  const end = new Date();

  switch (period) {
    case 'month':
      start.setDate(1);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      break;
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      start.setMonth(quarter * 3, 1);
      end.setMonth((quarter + 1) * 3, 0);
      break;
    case 'year':
      start.setMonth(0, 1);
      end.setMonth(11, 31);
      break;
    default:
      start.setDate(1);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
  }

  return { start, end };
}

/**
 * Update ledger metrics from transactions
 */
async function updateLedgerMetrics(ledger, period = 'month') {
  const { start, end } = getDateRange(period);

  // Get transactions for period
  const transactions = await Transaction.findUserTransactions(ledger.userId, {
    startDate: start,
    endDate: end,
    ledger: ledger.type === LEDGER_TYPES.LIFE ? LEDGER_TYPES.LIFE : LEDGER_TYPES.BUSINESS
  });

  // Calculate totals
  let totalIncome = 0;
  let totalExpenses = 0;
  let creditSalesAmount = 0;
  let creditSalesCount = 0;

  transactions.forEach(t => {
    if (t.type === TRANSACTION_TYPES.CREDIT) {
      totalIncome += t.amount;
      if (t.isCreditSale) {
        creditSalesAmount += t.amount;
        creditSalesCount++;
      }
    } else {
      totalExpenses += t.amount;
    }
  });

  // Update ledger
  ledger.totalIncome = totalIncome;
  ledger.totalExpenses = totalExpenses;
  ledger.calculateNetCashFlow();

  // Update business metrics
  if (ledger.type === LEDGER_TYPES.BUSINESS) {
    ledger.updateBusinessMetrics({
      totalSales: totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      creditSalesAmount,
      creditSalesCount,
      outstandingCredit: 0 // Will be calculated from CreditEntry
    });
  }

  // Update burn rate for life ledger
  if (ledger.type === LEDGER_TYPES.LIFE) {
    const daysInPeriod = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    ledger.updateBurnRate(totalExpenses, daysInPeriod);
  }

  await ledger.save();
  return ledger;
}

// ==========================================
// LEDGERS
// ==========================================

/**
 * Get all ledgers for user
 */
export const getLedgers = async (req, res, next) => {
  try {
    const userId = req.userId;

    const ledgers = await Ledger.find({
      userId,
      isActive: true,
      isDeleted: false
    }).sort({ type: 1 });

    const result = ledgers.map(ledger => ({
      id: ledger._id,
      type: ledger.type,
      name: ledger.name,
      currency: ledger.currency,
      balance: ledger.balance,
      totalIncome: ledger.totalIncome,
      totalExpenses: ledger.totalExpenses,
      netCashFlow: ledger.netCashFlow,
      ...(ledger.type === LEDGER_TYPES.LIFE ? {
        monthlyBudget: ledger.monthlyBudget,
        budgetUtilization: ledger.budgetUtilization,
        burnRate: ledger.burnRate,
        runwayDays: ledger.runwayDays,
        runwayStatus: ledger.runwayStatus
      } : {}),
      ...(ledger.type === LEDGER_TYPES.BUSINESS ? {
        workingCapital: ledger.workingCapital,
        availableCapital: ledger.availableCapital,
        businessHealth: ledger.businessHealth
      } : {})
    }));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ledgers: result
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

    let ledger = await Ledger.findOne({
      userId,
      type,
      isActive: true
    });

    // Create if doesn't exist
    if (!ledger) {
      ledger = await Ledger.findOrCreate(userId, type);
    }

    // Update metrics
    ledger = await updateLedgerMetrics(ledger);

    const response = {
      id: ledger._id,
      type: ledger.type,
      name: ledger.name,
      currency: ledger.currency,
      balance: ledger.balance,
      totalIncome: ledger.totalIncome,
      totalExpenses: ledger.totalExpenses,
      netCashFlow: ledger.netCashFlow,
      createdAt: ledger.createdAt,
      updatedAt: ledger.updatedAt
    };

    // Add type-specific details
    if (ledger.type === LEDGER_TYPES.LIFE) {
      response.budget = {
        monthlyBudget: ledger.monthlyBudget,
        allocation: ledger.budgetAllocation,
        utilization: ledger.budgetUtilization,
        categoryTracking: ledger.categoryTracking
      };
      response.runway = {
        burnRate: ledger.burnRate,
        runwayDays: ledger.runwayDays,
        status: ledger.runwayStatus
      };
    } else if (ledger.type === LEDGER_TYPES.BUSINESS) {
      response.capital = {
        workingCapital: ledger.workingCapital,
        availableCapital: ledger.availableCapital,
        workingCapitalTarget: ledger.workingCapitalTarget,
        reinvestmentRatio: ledger.reinvestmentRatio
      };
      response.metrics = ledger.businessMetrics;
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ledger: response
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

    let ledger = await Ledger.findOne({
      userId,
      type: LEDGER_TYPES.LIFE,
      isActive: true
    });

    if (!ledger) {
      ledger = await Ledger.findOrCreate(userId, LEDGER_TYPES.LIFE);
    }

    // Update metrics
    ledger = await updateLedgerMetrics(ledger, period);

    const breakdown = {
      monthlyBudget: ledger.monthlyBudget,
      allocation: ledger.budgetAllocation,
      categoryTracking: ledger.categoryTracking,
      utilization: ledger.budgetUtilization,
      variance: {
        needs: ledger.categoryTracking.needs.variance,
        wants: ledger.categoryTracking.wants.variance,
        savings: ledger.categoryTracking.savings.variance
      },
      totalSpent: ledger.totalExpenses,
      remaining: Math.max(0, ledger.monthlyBudget - ledger.totalExpenses)
    };

    // Add recommendations
    const recommendations = [];
    const needsVariance = ledger.categoryTracking.needs.variance;
    const wantsVariance = ledger.categoryTracking.wants.variance;

    if (needsVariance > 0) {
      recommendations.push({
        category: 'needs',
        type: 'over_budget',
        message: `Needs spending is ₦${needsVariance.toLocaleString()} over budget`
      });
    }
    if (wantsVariance > 0) {
      recommendations.push({
        category: 'wants',
        type: 'over_budget',
        message: `Wants spending is ₦${wantsVariance.toLocaleString()} over budget`
      });
    }
    if (ledger.burnRate > ledger.monthlyBudget / 30) {
      recommendations.push({
        category: 'burn_rate',
        type: 'high_burn',
        message: 'Daily burn rate exceeds daily budget allocation'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      budget: breakdown,
      recommendations
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

    let ledger = await Ledger.findOne({
      userId,
      type: LEDGER_TYPES.LIFE,
      isActive: true
    });

    if (!ledger) {
      ledger = await Ledger.findOrCreate(userId, LEDGER_TYPES.LIFE);
    }

    // Update budget
    if (monthlyBudget !== undefined) {
      ledger.monthlyBudget = monthlyBudget;
    }

    // Update allocation
    if (allocation) {
      const total = (allocation.needs || 0) + (allocation.wants || 0) + (allocation.savings || 0);
      if (Math.abs(total - 1) > 0.01) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Allocation must sum to 1 (100%)'
        });
      }
      ledger.budgetAllocation = allocation;
    }

    // Reset category tracking with new budgets
    ledger.resetCategoryTracking();

    await ledger.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Budget updated successfully',
      budget: {
        monthlyBudget: ledger.monthlyBudget,
        allocation: ledger.budgetAllocation,
        categoryTracking: ledger.categoryTracking
      }
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

    let ledger = await Ledger.findOne({
      userId,
      type: LEDGER_TYPES.LIFE,
      isActive: true
    });

    if (!ledger) {
      ledger = await Ledger.findOrCreate(userId, LEDGER_TYPES.LIFE);
    }

    // Update metrics
    ledger = await updateLedgerMetrics(ledger);

    const runwayAnalysis = {
      balance: ledger.balance,
      burnRate: ledger.burnRate,
      runwayDays: ledger.runwayDays,
      status: ledger.runwayStatus,
      monthlyExpenses: ledger.totalExpenses,
      dailyAverage: ledger.burnRate
    };

    // Calculate runway by month
    const runwayByMonth = {
      months: Math.floor(ledger.runwayDays / 30),
      weeks: Math.floor(ledger.runwayDays / 7),
      days: ledger.runwayDays % 7
    };

    // Risk assessment
    let riskLevel = 'low';
    let riskColor = 'green';
    if (ledger.runwayDays <= 14) {
      riskLevel = 'critical';
      riskColor = 'red';
    } else if (ledger.runwayDays <= 30) {
      riskLevel = 'high';
      riskColor = 'orange';
    } else if (ledger.runwayDays <= 60) {
      riskLevel = 'medium';
      riskColor = 'yellow';
    }

    const recommendations = [];
    if (ledger.runwayDays <= 14) {
      recommendations.push({
        priority: 'urgent',
        action: 'Immediate expense reduction required',
        details: 'Runway is below 14 days. Cut all non-essential expenses immediately.'
      });
    } else if (ledger.runwayDays <= 30) {
      recommendations.push({
        priority: 'high',
        action: 'Reduce expenses or increase income',
        details: 'Runway is below 30 days. Review budget and find cost cuts.'
      });
    } else if (ledger.runwayDays > 180) {
      recommendations.push({
        priority: 'info',
        action: 'Consider investment opportunities',
        details: 'Runway is healthy. Excess funds could be invested.'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      runway: runwayAnalysis,
      runwayByMonth,
      risk: {
        level: riskLevel,
        color: riskColor
      },
      recommendations
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

    let ledger = await Ledger.findOne({
      userId,
      type: LEDGER_TYPES.BUSINESS,
      isActive: true
    });

    if (!ledger) {
      ledger = await Ledger.findOrCreate(userId, LEDGER_TYPES.BUSINESS);
    }

    // Update metrics
    ledger = await updateLedgerMetrics(ledger);

    const capitalPosition = {
      workingCapital: ledger.workingCapital,
      availableCapital: ledger.availableCapital,
      workingCapitalTarget: ledger.workingCapitalTarget,
      reinvestmentRatio: ledger.reinvestmentRatio,
      balance: ledger.balance
    };

    // Calculate health metrics
    const workingCapitalHealth = ledger.workingCapitalTarget > 0
      ? Math.round((ledger.workingCapital / ledger.workingCapitalTarget) * 100)
      : 0;

    const availableRatio = ledger.balance > 0
      ? Math.round((ledger.availableCapital / ledger.balance) * 100)
      : 0;

    let healthStatus = 'healthy';
    if (workingCapitalHealth < 50) healthStatus = 'constrained';
    else if (workingCapitalHealth < 80) healthStatus = 'adequate';

    const recommendations = [];
    if (workingCapitalHealth < 50) {
      recommendations.push({
        priority: 'high',
        action: 'Rebuild working capital',
        details: 'Working capital is below 50% of target. Reduce available capital withdrawals.'
      });
    }
    if (availableRatio > 70) {
      recommendations.push({
        priority: 'medium',
        action: 'Excess available capital',
        details: 'Consider reinvesting available capital into business growth.'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      capital: capitalPosition,
      health: {
        workingCapitalHealth,
        availableRatio,
        status: healthStatus
      },
      recommendations
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

    let ledger = await Ledger.findOne({
      userId,
      type: LEDGER_TYPES.BUSINESS,
      isActive: true
    });

    if (!ledger) {
      ledger = await Ledger.findOrCreate(userId, LEDGER_TYPES.BUSINESS);
    }

    // Update targets
    if (workingCapitalTarget !== undefined) {
      ledger.workingCapitalTarget = workingCapitalTarget;
    }
    if (reinvestmentRatio !== undefined && reinvestmentRatio >= 0 && reinvestmentRatio <= 1) {
      ledger.reinvestmentRatio = reinvestmentRatio;
    }

    await ledger.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Capital targets updated',
      targets: {
        workingCapitalTarget: ledger.workingCapitalTarget,
        reinvestmentRatio: ledger.reinvestmentRatio
      }
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

    const summary = await CreditEntry.getUserCreditSummary(userId);

    const overview = {
      totalCredits: summary.totalCredits,
      totalCreditValue: summary.totalCreditValue,
      totalCollected: summary.totalCollected,
      totalOutstanding: summary.totalOutstanding,
      collectionRate: summary.totalCreditValue > 0
        ? Math.round((summary.totalCollected / summary.totalCreditValue) * 100)
        : 0,
      overdue: {
        count: summary.overdueCount,
        amount: summary.overdueAmount
      },
      byStatus: {
        paid: summary.paidCount,
        partial: summary.partialCount,
        pending: summary.pendingCount,
        overdue: summary.overdueCount
      }
    };

    // Risk assessment
    let riskLevel = 'low';
    if (summary.overdueCount > 5 || summary.overdueAmount > summary.totalOutstanding * 0.3) {
      riskLevel = 'high';
    } else if (summary.overdueCount > 2 || summary.overdueAmount > summary.totalOutstanding * 0.15) {
      riskLevel = 'medium';
    }

    const recommendations = [];
    if (summary.overdueCount > 0) {
      recommendations.push({
        priority: 'high',
        action: `Follow up on ${summary.overdueCount} overdue credits`,
        details: `₦${summary.overdueAmount.toLocaleString()} is overdue`
      });
    }
    if (overview.collectionRate < 70) {
      recommendations.push({
        priority: 'medium',
        action: 'Improve collection rate',
        details: 'Collection rate is below 70%. Review credit policies.'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      overview,
      risk: {
        level: riskLevel
      },
      recommendations
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

    const overdueCredits = await CreditEntry.findOverdue(userId);

    const credits = overdueCredits.map(c => ({
      id: c._id,
      customer: c.customerDisplay,
      amount: c.totalCredit,
      paid: c.amountPaid,
      outstanding: c.amountOutstanding,
      dueDate: c.dueDate,
      daysOverdue: c.daysOverdue,
      priority: c.priority,
      riskLevel: c.riskLevel
    })).sort((a, b) => b.daysOverdue - a.daysOverdue);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: credits.length,
      credits
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

    const upcomingCredits = await CreditEntry.findUpcoming(userId, parseInt(days));

    const credits = upcomingCredits.map(c => ({
      id: c._id,
      customer: c.customerDisplay,
      amount: c.totalCredit,
      outstanding: c.amountOutstanding,
      dueDate: c.dueDate,
      daysUntilDue: c.daysUntilDue,
      status: c.status
    })).sort((a, b) => a.daysUntilDue - b.daysUntilDue);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: credits.length,
      credits
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

    const credit = await CreditEntry.findOne({
      _id: id,
      userId,
      isDeleted: false
    });

    if (!credit) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Credit entry not found'
      });
    }

    if (credit.status === CREDIT_STATUS.PAID) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Credit is already fully paid'
      });
    }

    // Add payment
    credit.addPayment(amount, {
      method,
      reference,
      notes,
      recordedBy: userId
    });

    await credit.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Payment recorded',
      payment: {
        amount,
        outstanding: credit.amountOutstanding,
        paid: credit.amountPaid,
        progress: credit.paymentProgress,
        status: credit.status
      }
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// FINANCE OVERVIEW
// ==========================================

/**
 * Get complete Finance module overview
 */
export const getFinanceOverview = async (req, res, next) => {
  try {
    const userId = req.userId;

    // Get ledgers summary
    const ledgers = await Ledger.getUserLedgers(userId);
    const summary = await Ledger.getUserLedgerSummary(userId);

    // Get credit summary
    const creditSummary = await CreditEntry.getUserCreditSummary(userId);

    // Get recent transactions
    const recentTransactions = await Transaction.findUserTransactions(userId, {
      limit: 5
    });

    const overview = {
      ledgers: summary,
      credits: {
        total: creditSummary.totalCredits,
        outstanding: creditSummary.totalOutstanding,
        overdue: creditSummary.overdueCount,
        collectionRate: creditSummary.totalCreditValue > 0
          ? Math.round((creditSummary.totalCollected / creditSummary.totalCreditValue) * 100)
          : 0
      },
      recentTransactions: recentTransactions.map(t => ({
        id: t._id,
        type: t.type,
        amount: t.amount,
        ledger: t.ledger,
        category: t.category,
        timestamp: t.timestamp,
        narration: t.narration
      }))
    };

    res.status(HTTP_STATUS.OK).json({
      success: true,
      overview
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
  addCreditPayment
};

// SR
