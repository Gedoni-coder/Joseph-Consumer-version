/**
 * Finance Service - Prisma (PostgreSQL)
 * Mirrors Mongoose financeController functionality
 */

import { prisma } from '../../config/prisma.js';
import { LEDGER_TYPES, CREDIT_STATUS } from '../../config/constants.js';

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function formatCurrency(amount, currency = 'NGN') {
  const symbols = { NGN: '₦', USD: '$', GBP: '£', EUR: '€' };
  const symbol = symbols[currency] || '₦';
  return `${symbol}${amount.toLocaleString()}`;
}

function calculatePercent(value, total) {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

// ==========================================
// LEDGER OPERATIONS
// ==========================================

export const financeService = {
  /**
   * Get all ledgers for user
   */
  async getLedgers(userId) {
    const ledgers = await prisma.ledger.findMany({
      where: {
        userId,
        isActive: true,
        isDeleted: false
      },
      orderBy: { type: 'asc' }
    });

    return ledgers.map(ledger => ({
      id: ledger.id,
      type: ledger.type,
      name: ledger.name,
      currency: ledger.currency,
      balance: ledger.balance,
      totalIncome: ledger.totalIncome,
      totalExpenses: ledger.totalExpenses,
      netCashFlow: ledger.netCashFlow,
      ...(ledger.type === LEDGER_TYPES.LIFE ? {
        monthlyBudget: ledger.monthlyBudget,
        budgetUtilization: this.getBudgetUtilization(ledger),
        burnRate: ledger.burnRate,
        runwayDays: ledger.runwayDays,
        runwayStatus: this.getRunwayStatus(ledger.runwayDays)
      } : {}),
      ...(ledger.type === LEDGER_TYPES.BUSINESS ? {
        workingCapital: ledger.workingCapital,
        availableCapital: ledger.availableCapital,
        businessHealth: this.getBusinessHealth(ledger)
      } : {})
    }));
  },

  /**
   * Get specific ledger by type
   */
  async getLedgerByType(userId, type) {
    let ledger = await prisma.ledger.findFirst({
      where: { userId, type, isActive: true }
    });

    // Create if doesn't exist
    if (!ledger) {
      ledger = await prisma.ledger.create({
        data: {
          userId,
          type,
          name: type === LEDGER_TYPES.LIFE ? 'Personal Ledger' : 'Business Ledger',
          isDefault: true
        }
      });
    }

    const response = {
      id: ledger.id,
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
        allocation: {
          needs: 0.5,
          wants: 0.3,
          savings: 0.2
        },
        utilization: this.getBudgetUtilization(ledger),
        categoryTracking: {
          needs: {
            spent: ledger.spentNeeds,
            budget: ledger.budgetNeeds,
            variance: ledger.spentNeeds - ledger.budgetNeeds
          },
          wants: {
            spent: ledger.spentWants,
            budget: ledger.budgetWants,
            variance: ledger.spentWants - ledger.budgetWants
          },
          savings: {
            saved: ledger.spentSavings,
            target: ledger.budgetSavings,
            variance: ledger.spentSavings - ledger.budgetSavings
          }
        }
      };
      response.runway = {
        burnRate: ledger.burnRate,
        runwayDays: ledger.runwayDays,
        status: this.getRunwayStatus(ledger.runwayDays)
      };
    } else if (ledger.type === LEDGER_TYPES.BUSINESS) {
      response.capital = {
        workingCapital: ledger.workingCapital,
        availableCapital: ledger.availableCapital,
        workingCapitalTarget: ledger.workingCapitalTarget,
        reinvestmentRatio: ledger.reinvestmentRatio
      };
      response.metrics = {
        totalSales: ledger.businessTotalSales,
        totalExpenses: ledger.businessTotalExpenses,
        netProfit: ledger.businessNetProfit,
        profitMargin: ledger.businessProfitMargin,
        averageTransactionValue: ledger.businessAvgTransaction,
        transactionCount: ledger.businessTxnCount,
        creditSalesAmount: ledger.businessCreditSales,
        creditSalesCount: ledger.businessCreditCount,
        creditCollectionRate: ledger.businessCollectionRate
      };
    }

    return response;
  },

  /**
   * Get budget breakdown (Life Ledger)
   */
  async getBudgetBreakdown(userId, period = 'month') {
    const ledger = await prisma.ledger.findFirst({
      where: { userId, type: LEDGER_TYPES.LIFE, isActive: true }
    });

    if (!ledger) {
      ledger = await prisma.ledger.create({
        data: {
          userId,
          type: LEDGER_TYPES.LIFE,
          name: 'Personal Ledger',
          isDefault: true
        }
      });
    }

    const breakdown = {
      monthlyBudget: ledger.monthlyBudget,
      allocation: {
        needs: 0.5,
        wants: 0.3,
        savings: 0.2
      },
      categoryTracking: {
        needs: { spent: ledger.spentNeeds, budget: ledger.budgetNeeds, variance: ledger.spentNeeds - ledger.budgetNeeds },
        wants: { spent: ledger.spentWants, budget: ledger.budgetWants, variance: ledger.spentWants - ledger.budgetWants },
        savings: { saved: ledger.spentSavings, target: ledger.budgetSavings, variance: ledger.spentSavings - ledger.budgetSavings }
      },
      utilization: this.getBudgetUtilization(ledger),
      variance: {
        needs: ledger.spentNeeds - ledger.budgetNeeds,
        wants: ledger.spentWants - ledger.budgetWants,
        savings: ledger.spentSavings - ledger.budgetSavings
      },
      totalSpent: ledger.totalExpenses,
      remaining: Math.max(0, ledger.monthlyBudget - ledger.totalExpenses)
    };

    // Generate recommendations
    const recommendations = [];
    if (breakdown.variance.needs > 0) {
      recommendations.push({
        category: 'needs',
        type: 'over_budget',
        message: `Needs spending is ₦${breakdown.variance.needs.toLocaleString()} over budget`
      });
    }
    if (breakdown.variance.wants > 0) {
      recommendations.push({
        category: 'wants',
        type: 'over_budget',
        message: `Wants spending is ₦${breakdown.variance.wants.toLocaleString()} over budget`
      });
    }

    return { budget: breakdown, recommendations };
  },

  /**
   * Set budget allocation (Life Ledger)
   */
  async setBudgetAllocation(userId, { monthlyBudget, allocation }) {
    const ledger = await prisma.ledger.findFirst({
      where: { userId, type: LEDGER_TYPES.LIFE, isActive: true }
    });

    if (!ledger) {
      throw new Error('Ledger not found');
    }

    const updateData = {};
    if (monthlyBudget !== undefined) {
      updateData.monthlyBudget = monthlyBudget;
      // Update category budgets
      if (allocation) {
        updateData.budgetNeeds = monthlyBudget * allocation.needs;
        updateData.budgetWants = monthlyBudget * allocation.wants;
        updateData.budgetSavings = monthlyBudget * allocation.savings;
      }
    }

    const updated = await prisma.ledger.update({
      where: { id: ledger.id },
      data: updateData
    });

    return {
      monthlyBudget: updated.monthlyBudget,
      allocation: allocation || { needs: 0.5, wants: 0.3, savings: 0.2 },
      categoryTracking: {
        needs: { spent: updated.spentNeeds, budget: updated.budgetNeeds, variance: 0 },
        wants: { spent: updated.spentWants, budget: updated.budgetWants, variance: 0 },
        savings: { spent: updated.spentSavings, budget: updated.budgetSavings, variance: 0 }
      }
    };
  },

  /**
   * Get runway analysis (Life Ledger)
   */
  async getRunwayAnalysis(userId) {
    const ledger = await prisma.ledger.findFirst({
      where: { userId, type: LEDGER_TYPES.LIFE, isActive: true }
    });

    if (!ledger) {
      throw new Error('Ledger not found');
    }

    const runwayAnalysis = {
      balance: ledger.balance,
      burnRate: ledger.burnRate,
      runwayDays: ledger.runwayDays,
      status: this.getRunwayStatus(ledger.runwayDays),
      monthlyExpenses: ledger.totalExpenses,
      dailyAverage: ledger.burnRate
    };

    const runwayByMonth = {
      months: Math.floor(ledger.runwayDays / 30),
      weeks: Math.floor(ledger.runwayDays / 7),
      days: ledger.runwayDays % 7
    };

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
    }

    return {
      runway: runwayAnalysis,
      runwayByMonth,
      risk: { level: riskLevel, color: riskColor },
      recommendations
    };
  },

  /**
   * Get capital position (Business Ledger)
   */
  async getCapitalPosition(userId) {
    const ledger = await prisma.ledger.findFirst({
      where: { userId, type: LEDGER_TYPES.BUSINESS, isActive: true }
    });

    if (!ledger) {
      throw new Error('Business ledger not found');
    }

    const capitalPosition = {
      workingCapital: ledger.workingCapital,
      availableCapital: ledger.availableCapital,
      workingCapitalTarget: ledger.workingCapitalTarget,
      reinvestmentRatio: ledger.reinvestmentRatio,
      balance: ledger.balance
    };

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

    return {
      capital: capitalPosition,
      health: {
        workingCapitalHealth,
        availableRatio,
        status: healthStatus
      },
      recommendations
    };
  },

  /**
   * Set capital targets (Business Ledger)
   */
  async setCapitalTargets(userId, { workingCapitalTarget, reinvestmentRatio }) {
    const ledger = await prisma.ledger.findFirst({
      where: { userId, type: LEDGER_TYPES.BUSINESS, isActive: true }
    });

    if (!ledger) {
      throw new Error('Business ledger not found');
    }

    const updateData = {};
    if (workingCapitalTarget !== undefined) {
      updateData.workingCapitalTarget = workingCapitalTarget;
    }
    if (reinvestmentRatio !== undefined && reinvestmentRatio >= 0 && reinvestmentRatio <= 1) {
      updateData.reinvestmentRatio = reinvestmentRatio;
    }

    const updated = await prisma.ledger.update({
      where: { id: ledger.id },
      data: updateData
    });

    return {
      workingCapitalTarget: updated.workingCapitalTarget,
      reinvestmentRatio: updated.reinvestmentRatio
    };
  },

  /**
   * Get credit overview
   */
  async getCreditOverview(userId) {
    const summary = await prisma.creditEntry.groupBy({
      by: ['status'],
      where: {
        userId,
        isDeleted: false
      },
      _count: true,
      _sum: {
        totalCredit: true,
        amountPaid: true,
        amountOutstanding: true
      }
    });

    const totalCredits = summary.reduce((sum, s) => sum + s._count, 0);
    const totalCreditValue = summary.reduce((sum, s) => sum + (s._sum.totalCredit || 0), 0);
    const totalCollected = summary.reduce((sum, s) => sum + (s._sum.amountPaid || 0), 0);
    const totalOutstanding = summary.reduce((sum, s) => sum + (s._sum.amountOutstanding || 0), 0);

    const overdue = await prisma.creditEntry.aggregate({
      where: {
        userId,
        isDeleted: false,
        status: { not: 'PAID' },
        dueDate: { lt: new Date() }
      },
      _count: true,
      _sum: {
        amountOutstanding: true
      }
    });

    const overview = {
      totalCredits,
      totalCreditValue,
      totalCollected,
      totalOutstanding,
      collectionRate: totalCreditValue > 0 ? Math.round((totalCollected / totalCreditValue) * 100) : 0,
      overdue: {
        count: overdue._count || 0,
        amount: overdue._sum.amountOutstanding || 0
      },
      byStatus: {
        paid: summary.find(s => s.status === 'PAID')?._count || 0,
        partial: summary.find(s => s.status === 'PARTIAL')?._count || 0,
        pending: summary.find(s => s.status === 'PENDING')?._count || 0,
        overdue: overdue._count || 0
      }
    };

    let riskLevel = 'low';
    if (overview.overdue.count > 5 || overview.overdue.amount > overview.totalOutstanding * 0.3) {
      riskLevel = 'high';
    } else if (overview.overdue.count > 2 || overview.overdue.amount > overview.totalOutstanding * 0.15) {
      riskLevel = 'medium';
    }

    const recommendations = [];
    if (overview.overdue.count > 0) {
      recommendations.push({
        priority: 'high',
        action: `Follow up on ${overview.overdue.count} overdue credits`,
        details: `₦${overview.overdue.amount.toLocaleString()} is overdue`
      });
    }

    return { overview, risk: { level: riskLevel }, recommendations };
  },

  /**
   * Get overdue credits
   */
  async getOverdueCredits(userId) {
    const overdueCredits = await prisma.creditEntry.findMany({
      where: {
        userId,
        isDeleted: false,
        status: { not: 'PAID' },
        dueDate: { lt: new Date() }
      },
      orderBy: { dueDate: 'asc' }
    });

    const credits = overdueCredits.map(c => {
      const daysOverdue = Math.max(0, Math.floor((new Date() - new Date(c.dueDate)) / (1000 * 60 * 60 * 24)));
      return {
        id: c.id,
        customer: c.phone ? `${c.customerName} (${c.phone})` : c.customerName,
        amount: c.totalCredit,
        paid: c.amountPaid,
        outstanding: c.amountOutstanding,
        dueDate: c.dueDate,
        daysOverdue,
        priority: this.getCreditPriority(daysOverdue, c.amountOutstanding, c.totalCredit),
        riskLevel: this.getCreditRisk(daysOverdue, c.amountPaid, c.totalCredit)
      };
    }).sort((a, b) => b.daysOverdue - a.daysOverdue);

    return { count: credits.length, credits };
  },

  /**
   * Get upcoming due credits
   */
  async getUpcomingCredits(userId, days = 7) {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);

    const upcomingCredits = await prisma.creditEntry.findMany({
      where: {
        userId,
        isDeleted: false,
        status: { not: 'PAID' },
        dueDate: { gte: now, lte: future }
      },
      orderBy: { dueDate: 'asc' }
    });

    const credits = upcomingCredits.map(c => {
      const daysUntilDue = Math.floor((new Date(c.dueDate) - now) / (1000 * 60 * 60 * 24));
      return {
        id: c.id,
        customer: c.phone ? `${c.customerName} (${c.phone})` : c.customerName,
        amount: c.totalCredit,
        outstanding: c.amountOutstanding,
        dueDate: c.dueDate,
        daysUntilDue,
        status: c.status
      };
    }).sort((a, b) => a.daysUntilDue - b.daysUntilDue);

    return { count: credits.length, credits };
  },

  /**
   * Add payment to credit
   */
  async addCreditPayment(userId, creditId, { amount, method, reference, notes }) {
    const credit = await prisma.creditEntry.findFirst({
      where: { id: creditId, userId, isDeleted: false }
    });

    if (!credit) {
      throw new Error('Credit entry not found');
    }

    if (credit.status === 'PAID') {
      throw new Error('Credit is already fully paid');
    }

    // Create payment record
    await prisma.payment.create({
      data: {
        creditEntryId: creditId,
        amount,
        method: method || 'CASH',
        reference,
        notes,
        recordedBy: userId
      }
    });

    // Update credit entry
    const newAmountPaid = credit.amountPaid + amount;
    const newAmountOutstanding = credit.amountOutstanding - amount;

    let newStatus = credit.status;
    if (newAmountOutstanding <= 0) {
      newStatus = 'PAID';
    } else if (newAmountPaid > 0 && newAmountPaid < credit.totalCredit) {
      newStatus = 'PARTIAL';
    }

    const updated = await prisma.creditEntry.update({
      where: { id: creditId },
      data: {
        amountPaid: newAmountPaid,
        amountOutstanding: Math.max(0, newAmountOutstanding),
        status: newStatus,
        resolvedAt: newStatus === 'PAID' ? new Date() : null,
        resolvedBy: newStatus === CREDIT_STATUS.PAID ? userId : null
      }
    });

    return {
      amount,
      outstanding: updated.amountOutstanding,
      paid: updated.amountPaid,
      progress: Math.round((updated.amountPaid / updated.totalCredit) * 100),
      status: updated.status
    };
  },

  /**
   * Get finance overview
   */
  async getFinanceOverview(userId) {
    // Get ledgers summary
    const ledgers = await prisma.ledger.findMany({
      where: { userId, isActive: true, isDeleted: false }
    });

    const summary = {
      totalBalance: ledgers.reduce((sum, l) => sum + l.balance, 0),
      totalIncome: ledgers.reduce((sum, l) => sum + l.totalIncome, 0),
      totalExpenses: ledgers.reduce((sum, l) => sum + l.totalExpenses, 0),
      netCashFlow: ledgers.reduce((sum, l) => sum + l.netCashFlow, 0),
      minRunway: ledgers.reduce((min, l) => Math.min(min, l.runwayDays), 9999)
    };

    // Get credit summary
    const creditSummary = await this.getCreditOverview(userId);

    // Get recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId, isDeleted: false },
      orderBy: { timestamp: 'desc' },
      take: 5
    });

    const overview = {
      ledgers: summary,
      credits: {
        total: creditSummary.overview.totalCredits,
        outstanding: creditSummary.overview.totalOutstanding,
        overdue: creditSummary.overview.overdue.count,
        collectionRate: creditSummary.overview.collectionRate
      },
      recentTransactions: recentTransactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        ledger: t.ledger,
        category: t.category,
        timestamp: t.timestamp,
        narration: t.narration
      }))
    };

    return { overview };
  },

  // ==========================================
  // HELPER METHODS
  // ==========================================

  getBudgetUtilization(ledger) {
    if (ledger.type === LEDGER_TYPES.LIFE && ledger.monthlyBudget > 0) {
      return {
        overall: ((ledger.totalExpenses / ledger.monthlyBudget) * 100).toFixed(1),
        needs: ledger.budgetNeeds > 0 ? ((ledger.spentNeeds / ledger.budgetNeeds) * 100).toFixed(1) : 0,
        wants: ledger.budgetWants > 0 ? ((ledger.spentWants / ledger.budgetWants) * 100).toFixed(1) : 0,
        savings: ledger.budgetSavings > 0 ? ((ledger.spentSavings / ledger.budgetSavings) * 100).toFixed(1) : 0
      };
    }
    return null;
  },

  getRunwayStatus(runwayDays) {
    if (runwayDays <= 14) return 'critical';
    if (runwayDays <= 21) return 'warning';
    return 'healthy';
  },

  getBusinessHealth(ledger) {
    return {
      profitability: ledger.businessProfitMargin >= 20 ? 'excellent' : ledger.businessProfitMargin >= 10 ? 'good' : 'poor',
      liquidity: ledger.availableCapital > 0 ? 'healthy' : 'constrained',
      growth: ledger.businessTxnCount > 0 ? 'active' : 'dormant'
    };
  },

  getCreditPriority(daysOverdue, outstanding, total) {
    if (daysOverdue > 30 || outstanding > total * 0.5) return 'urgent';
    if (daysOverdue > 14 || outstanding > total * 0.3) return 'high';
    return 'medium';
  },

  getCreditRisk(daysOverdue, paid, total) {
    const progress = (paid / total) * 100;
    if (daysOverdue > 30 || progress < 20) return 'high';
    if (daysOverdue > 14 || progress < 50) return 'medium';
    return 'low';
  }
};

export default financeService;

// SR
