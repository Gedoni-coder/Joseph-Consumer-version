/**
 * Ledger Model Schema
 * Manages Life (Personal) and Business ledgers with balances, budgets, and analytics
 */

import mongoose from 'mongoose';
import {
  LEDGER_TYPES,
  TRANSACTION_TYPES,
  BUDGET_ALLOCATION,
  CURRENCIES
} from '../config/constants.js';

// ==========================================
// BUDGET ALLOCATION SUB-SCHEMA
// ==========================================
const budgetAllocationSchema = new mongoose.Schema({
  needs: {
    type: Number,
    default: BUDGET_ALLOCATION.NEEDS,
    min: 0,
    max: 1
  },
  wants: {
    type: Number,
    default: BUDGET_ALLOCATION.WANTS,
    min: 0,
    max: 1
  },
  savings: {
    type: Number,
    default: BUDGET_ALLOCATION.SAVINGS,
    min: 0,
    max: 1
  }
}, { _id: false });

// ==========================================
// CATEGORY TRACKING SUB-SCHEMA (for Life ledger)
// ==========================================
const categoryTrackingSchema = new mongoose.Schema({
  needs: {
    spent: { type: Number, default: 0 },
    budget: { type: Number, default: 0 },
    variance: { type: Number, default: 0 }
  },
  wants: {
    spent: { type: Number, default: 0 },
    budget: { type: Number, default: 0 },
    variance: { type: Number, default: 0 }
  },
  savings: {
    saved: { type: Number, default: 0 },
    target: { type: Number, default: 0 },
    variance: { type: Number, default: 0 }
  }
}, { _id: false });

// ==========================================
// BUSINESS METRICS SUB-SCHEMA (for Business ledger)
// ==========================================
const businessMetricsSchema = new mongoose.Schema({
  totalSales: { type: Number, default: 0 },
  totalExpenses: { type: Number, default: 0 },
  netProfit: { type: Number, default: 0 },
  profitMargin: { type: Number, default: 0 },
  averageTransactionValue: { type: Number, default: 0 },
  transactionCount: { type: Number, default: 0 },
  creditSalesAmount: { type: Number, default: 0 },
  creditSalesCount: { type: Number, default: 0 },
  creditCollectionRate: { type: Number, default: 0 }
}, { _id: false });

// ==========================================
// LEDGER MAIN SCHEMA
// ==========================================
const ledgerSchema = new mongoose.Schema({
  // Owner
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Ledger Type
  type: {
    type: String,
    enum: Object.values(LEDGER_TYPES),
    required: true
  },

  // Account Name
  name: {
    type: String,
    required: true,
    trim: true
  },

  // Currency
  currency: {
    type: String,
    enum: Object.keys(CURRENCIES),
    default: CURRENCIES.NGN.code
  },

  // Balances
  balance: {
    type: Number,
    default: 0,
    min: 0
  },

  // For LIFE Ledger
  monthlyBudget: {
    type: Number,
    default: 0,
    min: 0
  },
  budgetAllocation: {
    type: budgetAllocationSchema,
    default: () => ({})
  },
  categoryTracking: {
    type: categoryTrackingSchema,
    default: () => ({})
  },
  burnRate: {
    type: Number,
    default: 0,
    min: 0
  },

  // For BUSINESS Ledger
  workingCapital: {
    type: Number,
    default: 0,
    min: 0
  },
  availableCapital: {
    type: Number,
    default: 0,
    min: 0
  },
  reinvestmentRatio: {
    type: Number,
    default: 0.4,
    min: 0,
    max: 1
  },
  workingCapitalTarget: {
    type: Number,
    default: 0,
    min: 0
  },
  businessMetrics: {
    type: businessMetricsSchema,
    default: () => ({})
  },

  // Common for both
  totalIncome: {
    type: Number,
    default: 0
  },
  totalExpenses: {
    type: Number,
    default: 0
  },
  netCashFlow: {
    type: Number,
    default: 0
  },
  runwayDays: {
    type: Number,
    default: 0,
    min: 0
  },
  lastTransactionAt: Date,

  // Analytics period
  analyticsPeriod: {
    type: String,
    enum: ['month', 'quarter', 'year', 'all'],
    default: 'month'
  },
  periodStart: Date,
  periodEnd: Date,

  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },

  // Notes
  description: {
    type: String,
    trim: true,
    maxlength: 500
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ==========================================
// INDEXES
// ==========================================
ledgerSchema.index({ userId: 1, type: 1 }, { unique: true });
ledgerSchema.index({ userId: 1, isActive: 1 });
ledgerSchema.index({ type: 1, balance: -1 });

// ==========================================
// VIRTUALS
// ==========================================

// Virtual for runway status
ledgerSchema.virtual('runwayStatus').get(function() {
  if (this.runwayDays <= 14) return 'critical';
  if (this.runwayDays <= 21) return 'warning';
  return 'healthy';
});

// Virtual for budget utilization (Life ledger)
ledgerSchema.virtual('budgetUtilization').get(function() {
  if (this.type === LEDGER_TYPES.LIFE && this.monthlyBudget > 0) {
    return {
      overall: ((this.totalExpenses / this.monthlyBudget) * 100).toFixed(1),
      needs: this.categoryTracking.needs.budget > 0
        ? ((this.categoryTracking.needs.spent / this.categoryTracking.needs.budget) * 100).toFixed(1)
        : 0,
      wants: this.categoryTracking.wants.budget > 0
        ? ((this.categoryTracking.wants.spent / this.categoryTracking.wants.budget) * 100).toFixed(1)
        : 0,
      savings: this.categoryTracking.savings.target > 0
        ? ((this.categoryTracking.savings.saved / this.categoryTracking.savings.target) * 100).toFixed(1)
        : 0
    };
  }
  return null;
});

// Virtual for business health (Business ledger)
ledgerSchema.virtual('businessHealth').get(function() {
  if (this.type === LEDGER_TYPES.BUSINESS) {
    const metrics = this.businessMetrics;
    return {
      profitability: metrics.profitMargin >= 20 ? 'excellent' : metrics.profitMargin >= 10 ? 'good' : 'poor',
      liquidity: this.availableCapital > 0 ? 'healthy' : 'constrained',
      growth: metrics.transactionCount > 0 ? 'active' : 'dormant'
    };
  }
  return null;
});

// ==========================================
// INSTANCE METHODS
// ==========================================

/**
 * Update balance based on transaction
 * @param {number} amount - Transaction amount
 * @param {string} type - Transaction type (credit/debit)
 */
ledgerSchema.methods.updateBalance = function(amount, type) {
  if (type === TRANSACTION_TYPES.CREDIT) {
    this.balance += amount;
  } else {
    this.balance = Math.max(0, this.balance - amount);
  }
  this.lastTransactionAt = new Date();
};

/**
 * Calculate runway days
 * @param {number} burnRate - Daily burn rate (optional)
 */
ledgerSchema.methods.calculateRunway = function(burnRate = null) {
  const rate = burnRate || this.burnRate;
  if (rate <= 0) {
    this.runwayDays = 9999; // Infinite runway
  } else {
    this.runwayDays = Math.max(0, Math.floor(this.balance / rate));
  }
};

/**
 * Update burn rate (daily average spending)
 * @param {number} totalExpenses - Total expenses in period
 * @param {number} days - Number of days in period
 */
ledgerSchema.methods.updateBurnRate = function(totalExpenses, days = 30) {
  this.burnRate = days > 0 ? totalExpenses / days : 0;
  this.calculateRunway();
};

/**
 * Apply business income split
 * @param {number} amount - Income amount
 */
ledgerSchema.methods.applyBusinessSplit = function(amount) {
  if (this.type !== LEDGER_TYPES.BUSINESS) {
    throw new Error('Split only applies to business ledger');
  }

  const workingCapital = Math.round(amount * this.reinvestmentRatio);
  const available = amount - workingCapital;

  this.workingCapital += workingCapital;
  this.availableCapital += available;
};

/**
 * Deduct from business capital
 * @param {number} amount - Amount to deduct
 */
ledgerSchema.methods.deductBusinessCapital = function(amount) {
  if (this.type !== LEDGER_TYPES.BUSINESS) {
    throw new Error('Capital deduction only applies to business ledger');
  }

  // Deduct from available first
  const fromAvailable = Math.min(amount, this.availableCapital);
  this.availableCapital -= fromAvailable;
  this.workingCapital -= (amount - fromAvailable);
};

/**
 * Update category spending (Life ledger)
 * @param {string} category - Category (needs/wants/savings)
 * @param {number} amount - Spent amount
 */
ledgerSchema.methods.updateCategorySpending = function(category, amount) {
  if (this.type !== LEDGER_TYPES.LIFE) return;

  if (this.categoryTracking[category]) {
    this.categoryTracking[category].spent += amount;
    this.categoryTracking[category].variance =
      this.categoryTracking[category].spent - this.categoryTracking[category].budget;
  }
};

/**
 * Reset category tracking for new period
 */
ledgerSchema.methods.resetCategoryTracking = function() {
  if (this.type === LEDGER_TYPES.LIFE) {
    const budget = this.monthlyBudget;
    const alloc = this.budgetAllocation;

    this.categoryTracking = {
      needs: { spent: 0, budget: budget * alloc.needs, variance: 0 },
      wants: { spent: 0, budget: budget * alloc.wants, variance: 0 },
      savings: { spent: 0, budget: budget * alloc.savings, variance: 0 }
    };
  }
};

/**
 * Update business metrics
 * @param {object} metrics - Metrics to update
 */
ledgerSchema.methods.updateBusinessMetrics = function(metrics) {
  if (this.type !== LEDGER_TYPES.BUSINESS) return;

  if (metrics.totalSales !== undefined) this.businessMetrics.totalSales = metrics.totalSales;
  if (metrics.totalExpenses !== undefined) this.businessMetrics.totalExpenses = metrics.totalExpenses;
  if (metrics.netProfit !== undefined) this.businessMetrics.netProfit = metrics.netProfit;
  if (metrics.profitMargin !== undefined) this.businessMetrics.profitMargin = metrics.profitMargin;
  if (metrics.transactionCount !== undefined) this.businessMetrics.transactionCount = metrics.transactionCount;
  if (metrics.creditSalesAmount !== undefined) this.businessMetrics.creditSalesAmount = metrics.creditSalesAmount;
  if (metrics.creditSalesCount !== undefined) this.businessMetrics.creditSalesCount = metrics.creditSalesCount;

  // Calculate derived metrics
  if (metrics.totalSales > 0) {
    this.businessMetrics.profitMargin = (this.businessMetrics.netProfit / metrics.totalSales) * 100;
    this.businessMetrics.averageTransactionValue = metrics.totalSales / this.businessMetrics.transactionCount;
  }

  // Calculate credit collection rate
  if (this.businessMetrics.creditSalesAmount > 0) {
    const collected = this.businessMetrics.creditSalesAmount - metrics.outstandingCredit;
    this.businessMetrics.creditCollectionRate = (collected / this.businessMetrics.creditSalesAmount) * 100;
  }
};

/**
 * Calculate net cash flow
 */
ledgerSchema.methods.calculateNetCashFlow = function() {
  this.netCashFlow = this.totalIncome - this.totalExpenses;
};

/**
 * Update analytics period
 * @param {string} period - Period type (month/quarter/year/all)
 */
ledgerSchema.methods.setAnalyticsPeriod = function(period) {
  this.analyticsPeriod = period;
  const now = new Date();

  switch (period) {
    case 'month':
      this.periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      this.periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      this.periodStart = new Date(now.getFullYear(), quarter * 3, 1);
      this.periodEnd = new Date(now.getFullYear(), quarter * 3 + 3, 0);
      break;
    case 'year':
      this.periodStart = new Date(now.getFullYear(), 0, 1);
      this.periodEnd = new Date(now.getFullYear(), 11, 31);
      break;
    case 'all':
      this.periodStart = null;
      this.periodEnd = null;
      break;
  }
};

// ==========================================
// STATIC METHODS
// ==========================================

/**
 * Find or create ledger for user
 * @param {string} userId - User ID
 * @param {string} type - Ledger type
 * @returns {Promise<Ledger>}
 */
ledgerSchema.statics.findOrCreate = async function(userId, type) {
  let ledger = await this.findOne({ userId, type });
  if (!ledger) {
    ledger = await this.create({
      userId,
      type,
      name: type === LEDGER_TYPES.LIFE ? 'Personal Ledger' : 'Business Ledger',
      isDefault: true
    });
  }
  return ledger;
};

/**
 * Get all ledgers for user
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
ledgerSchema.statics.getUserLedgers = function(userId) {
  return this.find({ userId, isActive: true });
};

/**
 * Get summary of both ledgers for user
 * @param {string} userId - User ID
 * @returns {Promise<object>}
 */
ledgerSchema.statics.getUserLedgerSummary = async function(userId) {
  const ledgers = await this.find({ userId, isActive: true });
  const summary = {
    totalBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    netCashFlow: 0,
    minRunway: 9999,
    ledgers: {}
  };

  ledgers.forEach(ledger => {
    summary.totalBalance += ledger.balance;
    summary.totalIncome += ledger.totalIncome;
    summary.totalExpenses += ledger.totalExpenses;
    summary.netCashFlow += ledger.netCashFlow;
    summary.minRunway = Math.min(summary.minRunway, ledger.runwayDays);
    summary.ledgers[ledger.type] = {
      balance: ledger.balance,
      runwayDays: ledger.runwayDays,
      name: ledger.name
    };
  });

  return summary;
};

// ==========================================
// EXPORT
// ==========================================
export default mongoose.model('Ledger', ledgerSchema);

// SR
