/**
 * Transaction Model Schema
 * Stores all financial transactions with FP&A classification metadata
 */

import mongoose from 'mongoose';
import {
  TRANSACTION_TYPES,
  LEDGER_TYPES,
  TRANSACTION_CATEGORIES,
  CURRENCIES,
  WEBHOOK_PROVIDERS
} from '../config/constants.js';

// ==========================================
// CREDIT INFO SUB-SCHEMA
// ==========================================
const creditInfoSchema = new mongoose.Schema({
  customerName: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  items: [{
    name: String,
    qty: Number,
    unit: String,
    unitPrice: Number
  }],
  dueDate: Date
}, { _id: false });

// ==========================================
// TRANSACTION SPLIT SUB-SCHEMA
// ==========================================
const splitSchema = new mongoose.Schema({
  workingCapital: {
    type: Number,
    default: 0
  },
  available: {
    type: Number,
    default: 0
  },
  ratio: {
    type: Number,
    default: 0.4,
    min: 0,
    max: 1
  }
}, { _id: false });

// ==========================================
// FP&A METADATA SUB-SCHEMA
// ==========================================
const fpnaSchema = new mongoose.Schema({
  processedAt: {
    type: Date,
    default: Date.now
  },
  processingSource: {
    type: String,
    enum: ['automated', 'manual', 'webhook', 'import'],
    default: 'manual'
  },
  confidence: {
    type: Number,
    default: 0.5,
    min: 0,
    max: 1
  },
  needsConfirmation: {
    type: Boolean,
    default: false
  },
  varianceFlags: [{
    type: String
  }],
  reviewedAt: Date,
  reviewedBy: mongoose.Schema.Types.ObjectId
}, { _id: false });

// ==========================================
// ORIGINAL DATA SUB-SCHEMA (for audit trail)
// ==========================================
const originalDataSchema = new mongoose.Schema({
  provider: {
    type: String,
    enum: Object.values(WEBHOOK_PROVIDERS),
    default: WEBHOOK_PROVIDERS.CUSTOM
  },
  rawPayload: mongoose.Schema.Types.Mixed,
  receivedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false, strict: false });

// ==========================================
// TRANSACTION MAIN SCHEMA
// ==========================================
const transactionSchema = new mongoose.Schema({
  // Owner
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Original webhook data (optional, for audit)
  originalData: originalDataSchema,

  // Core transaction fields
  externalId: {
    type: String,
    index: true,
    sparse: true // Allows null values
  },
  type: {
    type: String,
    enum: Object.values(TRANSACTION_TYPES),
    required: [true, 'Transaction type is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    enum: Object.keys(CURRENCIES),
    default: CURRENCIES.NGN.code
  },
  narration: {
    type: String,
    trim: true,
    maxlength: 500
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },

  // Account information
  accountId: String,
  accountName: String,
  accountType: String,
  merchant: String,
  beneficiary: String,

  // Balance after transaction (if available)
  balanceAfter: Number,
  balanceBefore: Number,

  // FP&A Classification
  ledger: {
    type: String,
    enum: Object.values(LEDGER_TYPES),
    required: true
  },
  category: {
    type: String,
    enum: [...Object.values(TRANSACTION_CATEGORIES), null],
    default: null
  },
  tags: [String],

  // Credit Sale Detection
  isCreditSale: {
    type: Boolean,
    default: false
  },
  creditInfo: {
    type: creditInfoSchema,
    default: null
  },

  // Business Income Split (for business credit transactions)
  split: {
    type: splitSchema,
    default: null
  },

  // FP&A Processing Metadata
  fpna: {
    type: fpnaSchema,
    default: () => ({})
  },

  // Linked credit entry (if applicable)
  creditEntryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CreditEntry'
  },

  // Attachment/Receipt
  hasAttachment: {
    type: Boolean,
    default: false
  },
  attachmentUrl: String,
  attachmentType: String,

  // Notes
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },

  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: mongoose.Schema.Types.ObjectId,

  // Confirmed by user (categorization feedback)
  isConfirmed: {
    type: Boolean,
    default: false
  },
  confirmedAt: Date,

  // Import batch (for bulk imports)
  batchId: String,
  importId: String

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ==========================================
// INDEXES
// ==========================================
transactionSchema.index({ userId: 1, timestamp: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, ledger: 1 });
transactionSchema.index({ userId: 1, category: 1 });
transactionSchema.index({ userId: 1, isCreditSale: 1 });
transactionSchema.index({ externalId: 1, userId: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ isDeleted: 1 });
transactionSchema.index({ creditEntryId: 1 });

// Compound index for common queries
transactionSchema.index({ userId: 1, timestamp: -1, isDeleted: 1 });

// ==========================================
// VIRTUALS
// ==========================================

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return this.type === TRANSACTION_TYPES.DEBIT
    ? -Math.abs(this.amount)
    : this.amount;
});

// Virtual for category display name
transactionSchema.virtual('categoryDisplay').get(function() {
  const displayNames = {
    needs: 'Needs (50%)',
    wants: 'Wants (30%)',
    savings: 'Savings (20%)'
  };
  return this.category ? displayNames[this.category] : 'Uncategorized';
});

// Virtual for whether transaction needs review
transactionSchema.virtual('needsReview').get(function() {
  return this.fpna?.needsConfirmation && !this.isConfirmed;
});

// ==========================================
// INSTANCE METHODS
// ==========================================

/**
 * Soft delete transaction
 */
transactionSchema.methods.softDelete = function(deletedBy) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
};

/**
 * Restore soft-deleted transaction
 */
transactionSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = undefined;
  this.deletedBy = undefined;
};

/**
 * Confirm transaction categorization
 * @param {string} confirmedCategory - Category to confirm
 * @param {string} userId - User confirming the category
 */
transactionSchema.methods.confirmCategorization = function(confirmedCategory, userId) {
  this.category = confirmedCategory;
  this.isConfirmed = true;
  this.confirmedAt = new Date();
  this.fpna.needsConfirmation = false;
  this.fpna.reviewedAt = new Date();
  this.fpna.reviewedBy = userId;
};

/**
 * Update confidence score
 * @param {number} score - New confidence score (0-1)
 */
transactionSchema.methods.updateConfidence = function(score) {
  this.fpna.confidence = Math.max(0, Math.min(1, score));
};

/**
 * Mark as credit sale
 * @param {object} creditInfo - Credit sale information
 */
transactionSchema.methods.markAsCreditSale = function(creditInfo) {
  this.isCreditSale = true;
  this.creditInfo = creditInfo;
};

/**
 * Apply business income split
 * @param {number} ratio - Reinvestment ratio (0-1)
 */
transactionSchema.methods.applySplit = function(ratio) {
  if (this.ledger !== LEDGER_TYPES.BUSINESS || this.type !== TRANSACTION_TYPES.CREDIT) {
    throw new Error('Split can only be applied to business credit transactions');
  }

  const workingCapital = Math.round(this.amount * ratio);
  const available = this.amount - workingCapital;

  this.split = {
    workingCapital,
    available,
    ratio
  };
};

/**
 * Add variance flag
 * @param {string} flag - Flag to add
 */
transactionSchema.methods.addVarianceFlag = function(flag) {
  if (!this.fpna.varianceFlags.includes(flag)) {
    this.fpna.varianceFlags.push(flag);
  }
};

/**
 * Clear variance flags
 */
transactionSchema.methods.clearVarianceFlags = function() {
  this.fpna.varianceFlags = [];
};

// ==========================================
// STATIC METHODS
// ==========================================

/**
 * Find non-deleted transactions by user
 * @param {string} userId - User ID
 * @param {object} options - Query options
 * @returns {Promise<Query>}
 */
transactionSchema.statics.findUserTransactions = function(userId, options = {}) {
  const query = this.find({
    userId,
    isDeleted: false
  });

  if (options.startDate) {
    query.where('timestamp').gte(options.startDate);
  }
  if (options.endDate) {
    query.where('timestamp').lte(options.endDate);
  }
  if (options.type) {
    query.where('type').equals(options.type);
  }
  if (options.ledger) {
    query.where('ledger').equals(options.ledger);
  }
  if (options.category) {
    query.where('category').equals(options.category);
  }

  return query.sort({ timestamp: -1 });
};

/**
 * Get transaction statistics for user
 * @param {string} userId - User ID
 * @param {object} options - Query options
 * @returns {Promise<object>} Statistics
 */
transactionSchema.statics.getUserStatistics = async function(userId, options = {}) {
  const matchQuery = {
    userId,
    isDeleted: false
  };

  if (options.startDate) {
    matchQuery.timestamp = { ...matchQuery.timestamp, $gte: options.startDate };
  }
  if (options.endDate) {
    matchQuery.timestamp = { ...matchQuery.timestamp, $lte: options.endDate };
  }

  const pipeline = [
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalIncome: {
          $sum: { $cond: [{ $eq: ['$type', TRANSACTION_TYPES.CREDIT] }, '$amount', 0] }
        },
        totalExpenses: {
          $sum: { $cond: [{ $eq: ['$type', TRANSACTION_TYPES.DEBIT] }, '$amount', 0] }
        },
        businessIncome: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$type', TRANSACTION_TYPES.CREDIT] }, { $eq: ['$ledger', LEDGER_TYPES.BUSINESS] }] },
              '$amount',
              0
            ]
          }
        },
        personalIncome: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$type', TRANSACTION_TYPES.CREDIT] }, { $eq: ['$ledger', LEDGER_TYPES.LIFE] }] },
              '$amount',
              0
            ]
          }
        },
        creditSalesCount: {
          $sum: { $cond: ['$isCreditSale', 1, 0] }
        },
        creditSalesAmount: {
          $sum: { $cond: ['$isCreditSale', '$amount', 0] }
        }
      }
    }
  ];

  const [result] = await this.aggregate(pipeline);
  return result || {
    totalTransactions: 0,
    totalIncome: 0,
    totalExpenses: 0,
    businessIncome: 0,
    personalIncome: 0,
    creditSalesCount: 0,
    creditSalesAmount: 0
  };
};

/**
 * Find duplicate transactions by external ID
 * @param {string} userId - User ID
 * @param {string} externalId - External transaction ID
 * @returns {Promise<Transaction|null>}
 */
transactionSchema.statics.findByExternalId = function(userId, externalId) {
  return this.findOne({ userId, externalId, isDeleted: false });
};

/**
 * Find transactions needing confirmation
 * @param {string} userId - User ID
 * @returns {Promise<Query>}
 */
transactionSchema.statics.findNeedingConfirmation = function(userId) {
  return this.find({
    userId,
    isDeleted: false,
    'fpna.needsConfirmation': true,
    isConfirmed: false
  });
};

// ==========================================
// EXPORT
// ==========================================
export default mongoose.model('Transaction', transactionSchema);

// SR
