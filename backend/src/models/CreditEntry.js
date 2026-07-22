/**
 * CreditEntry Model Schema
 * Manages credit sales with customer info, payment tracking, and reminders
 */

import mongoose from 'mongoose';
import { CREDIT_STATUS } from '../config/constants.js';

// ==========================================
// PAYMENT SUB-SCHEMA
// ==========================================
const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    default: Date.now
  },
  method: {
    type: String,
    enum: ['cash', 'transfer', 'pos', 'other'],
    default: 'cash'
  },
  reference: String,
  notes: {
    type: String,
    trim: true
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { _id: true });

// ==========================================
// REMINDER SUB-SCHEMA
// ==========================================
const reminderSchema = new mongoose.Schema({
  sentAt: {
    type: Date,
    default: Date.now
  },
  method: {
    type: String,
    enum: ['sms', 'whatsapp', 'call', 'email', 'in-app'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed'],
    default: 'sent'
  },
  response: String,
  nextReminder: Date
}, { _id: true });

// ==========================================
// ITEM SUB-SCHEMA
// ==========================================
const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unit: {
    type: String,
    trim: true
  },
  unitPrice: {
    type: Number,
    min: 0
  },
  totalPrice: {
    type: Number,
    min: 0
  }
}, { _id: false });

// ==========================================
// CREDIT ENTRY MAIN SCHEMA
// ==========================================
const creditEntrySchema = new mongoose.Schema({
  // Owner
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Linked transaction
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    index: true
  },

  // Customer Information
  customerName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  phone: {
    type: String,
    trim: true,
    index: true
  },
  email: String,
  address: String,

  // Credit Details
  items: [itemSchema],
  totalCredit: {
    type: Number,
    required: true,
    min: 0
  },
  amountPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  amountOutstanding: {
    type: Number,
    required: true,
    min: 0
  },

  // Payment Terms
  dueDate: {
    type: Date,
    required: true,
    index: true
  },
  creditPeriod: {
    type: Number, // in days
    default: 7,
    min: 1
  },
  paymentTerms: String,

  // Status
  status: {
    type: String,
    enum: Object.values(CREDIT_STATUS),
    default: CREDIT_STATUS.PENDING,
    index: true
  },

  // Payment History
  payments: [paymentSchema],

  // Reminders
  reminders: [reminderSchema],
  reminderEnabled: {
    type: Boolean,
    default: true
  },
  reminderFrequency: {
    type: Number,
    default: 3, // days
    min: 1
  },
  lastReminderSent: Date,
  nextReminderDate: Date,

  // Priority/Risk
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },

  // Notes & Tags
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  tags: [String],

  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,

  // Resolved details
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ==========================================
// INDEXES
// ==========================================
creditEntrySchema.index({ userId: 1, status: 1 });
creditEntrySchema.index({ userId: 1, dueDate: 1 });
creditEntrySchema.index({ userId: 1, customerName: 1 });
creditEntrySchema.index({ userId: 1, phone: 1 });
creditEntrySchema.index({ status: 1, dueDate: 1 }); // For finding overdue
creditEntrySchema.index({ isDeleted: 1 });

// Compound index for overdue query
creditEntrySchema.index({ status: 1, dueDate: 1, isDeleted: 1 });

// ==========================================
// VIRTUALS
// ==========================================

// Virtual for payment progress percentage
creditEntrySchema.virtual('paymentProgress').get(function() {
  if (this.totalCredit === 0) return 0;
  return Math.round((this.amountPaid / this.totalCredit) * 100);
});

// Virtual for days overdue
creditEntrySchema.virtual('daysOverdue').get(function() {
  if (this.status === CREDIT_STATUS.PAID) return 0;
  const now = new Date();
  const due = new Date(this.dueDate);
  return Math.max(0, Math.floor((now - due) / (1000 * 60 * 60 * 24)));
});

// Virtual for is overdue
creditEntrySchema.virtual('isOverdue').get(function() {
  return this.status !== CREDIT_STATUS.PAID && new Date() > new Date(this.dueDate);
});

// Virtual for days until due
creditEntrySchema.virtual('daysUntilDue').get(function() {
  if (this.status === CREDIT_STATUS.PAID) return 0;
  const now = new Date();
  const due = new Date(this.dueDate);
  return Math.floor((due - now) / (1000 * 60 * 60 * 24));
});

// Virtual for customer display
creditEntrySchema.virtual('customerDisplay').get(function() {
  return this.phone ? `${this.customerName} (${this.phone})` : this.customerName;
});

// ==========================================
// INSTANCE METHODS
// ==========================================

/**
 * Add payment to credit entry
 * @param {number} amount - Payment amount
 * @param {object} paymentDetails - Additional payment details
 * @returns {object} Updated credit entry
 */
creditEntrySchema.methods.addPayment = function(amount, paymentDetails = {}) {
  if (amount <= 0) {
    throw new Error('Payment amount must be positive');
  }
  if (amount > this.amountOutstanding) {
    throw new Error('Payment amount exceeds outstanding balance');
  }

  this.amountPaid += amount;
  this.amountOutstanding -= amount;

  // Add to payment history
  this.payments.push({
    amount,
    date: new Date(),
    method: paymentDetails.method || 'cash',
    reference: paymentDetails.reference,
    notes: paymentDetails.notes,
    recordedBy: paymentDetails.recordedBy
  });

  // Update status
  this.updateStatus();

  return this;
};

/**
 * Update status based on payment and due date
 */
creditEntrySchema.methods.updateStatus = function() {
  if (this.amountOutstanding <= 0) {
    this.status = CREDIT_STATUS.PAID;
    this.resolvedAt = new Date();
  } else if (this.amountPaid > 0 && this.amountPaid < this.totalCredit) {
    this.status = CREDIT_STATUS.PARTIAL;
  } else if (new Date() > new Date(this.dueDate)) {
    this.status = CREDIT_STATUS.OVERDUE;
  } else {
    this.status = CREDIT_STATUS.PENDING;
  }

  return this.status;
};

/**
 * Record reminder sent
 * @param {string} method - Reminder method
 * @returns {object}
 */
creditEntrySchema.methods.addReminder = function(method) {
  const reminder = {
    sentAt: new Date(),
    method,
    status: 'sent'
  };

  this.reminders.push(reminder);
  this.lastReminderSent = new Date();

  // Calculate next reminder date
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + this.reminderFrequency);
  this.nextReminderDate = nextDate;

  return reminder;
};

/**
 * Mark as paid in full
 * @param {string} userId - User resolving the credit
 */
creditEntrySchema.methods.markAsPaid = function(userId) {
  this.status = CREDIT_STATUS.PAID;
  this.amountOutstanding = 0;
  this.amountPaid = this.totalCredit;
  this.resolvedAt = new Date();
  this.resolvedBy = userId;
};

/**
 * Write off bad debt
 * @param {string} reason - Reason for write-off
 * @param {string} userId - User writing off
 */
creditEntrySchema.methods.writeOff = function(reason, userId) {
  this.status = CREDIT_STATUS.PAID; // Technically resolved
  this.amountOutstanding = 0;
  this.resolvedAt = new Date();
  this.resolvedBy = userId;
  this.notes = `WRITTEN OFF: ${reason}. Original: ${this.notes || ''}`;
};

/**
 * Update customer information
 * @param {object} customerInfo - Customer details
 */
creditEntrySchema.methods.updateCustomer = function(customerInfo) {
  if (customerInfo.name) this.customerName = customerInfo.name;
  if (customerInfo.phone) this.phone = customerInfo.phone;
  if (customerInfo.email) this.email = customerInfo.email;
  if (customerInfo.address) this.address = customerInfo.address;
};

/**
 * Calculate risk level based on payment history
 */
creditEntrySchema.methods.assessRisk = function() {
  const daysOverdue = this.daysOverdue;
  const paymentProgress = this.paymentProgress;

  if (daysOverdue > 30 || paymentProgress < 20) {
    this.riskLevel = 'high';
    this.priority = 'urgent';
  } else if (daysOverdue > 14 || paymentProgress < 50) {
    this.riskLevel = 'medium';
    this.priority = 'high';
  } else {
    this.riskLevel = 'low';
    this.priority = 'medium';
  }
};

/**
 * Soft delete credit entry
 */
creditEntrySchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
};

// ==========================================
// STATIC METHODS
// ==========================================

/**
 * Find overdue credits for user
 * @param {string} userId - User ID
 * @returns {Promise<Query>}
 */
creditEntrySchema.statics.findOverdue = function(userId) {
  return this.find({
    userId,
    isDeleted: false,
    status: { $ne: CREDIT_STATUS.PAID },
    dueDate: { $lt: new Date() }
  });
};

/**
 * Find upcoming due credits (next N days)
 * @param {string} userId - User ID
 * @param {number} days - Days to look ahead
 * @returns {Promise<Query>}
 */
creditEntrySchema.statics.findUpcoming = function(userId, days = 7) {
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + days);

  return this.find({
    userId,
    isDeleted: false,
    status: { $ne: CREDIT_STATUS.PAID },
    dueDate: { $gte: now, $lte: future }
  });
};

/**
 * Find credits needing reminders
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
creditEntrySchema.statics.findNeedingReminders = function(userId) {
  const now = new Date();

  return this.find({
    userId,
    isDeleted: false,
    status: { $ne: CREDIT_STATUS.PAID },
    reminderEnabled: true,
    $or: [
      { nextReminderDate: { $lte: now } },
      { nextReminderDate: { $exists: false } }
    ]
  });
};

/**
 * Get credit summary for user
 * @param {string} userId - User ID
 * @returns {Promise<object>}
 */
creditEntrySchema.statics.getUserCreditSummary = async function(userId) {
  const pipeline = [
    {
      $match: {
        userId,
        isDeleted: false
      }
    },
    {
      $group: {
        _id: null,
        totalCredits: { $sum: 1 },
        totalCreditValue: { $sum: '$totalCredit' },
        totalCollected: { $sum: '$amountPaid' },
        totalOutstanding: { $sum: '$amountOutstanding' },
        overdueCount: {
          $sum: {
            $cond: [
              { $and: [{ $ne: ['$status', CREDIT_STATUS.PAID] }, { $lt: ['$dueDate', new Date()] }] },
              1,
              0
            ]
          }
        },
        overdueAmount: {
          $sum: {
            $cond: [
              { $and: [{ $ne: ['$status', CREDIT_STATUS.PAID] }, { $lt: ['$dueDate', new Date()] }] },
              '$amountOutstanding',
              0
            ]
          }
        },
        paidCount: {
          $sum: { $cond: [{ $eq: ['$status', CREDIT_STATUS.PAID] }, 1, 0] }
        },
        partialCount: {
          $sum: { $cond: [{ $eq: ['$status', CREDIT_STATUS.PARTIAL] }, 1, 0] }
        },
        pendingCount: {
          $sum: { $cond: [{ $eq: ['$status', CREDIT_STATUS.PENDING] }, 1, 0] }
        }
      }
    }
  ];

  const [result] = await this.aggregate(pipeline);
  return result || {
    totalCredits: 0,
    totalCreditValue: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    overdueCount: 0,
    overdueAmount: 0,
    paidCount: 0,
    partialCount: 0,
    pendingCount: 0
  };
};

/**
 * Find by customer phone or name
 * @param {string} userId - User ID
 * @param {string} identifier - Phone or name
 * @returns {Promise<Query>}
 */
creditEntrySchema.statics.findByCustomer = function(userId, identifier) {
  return this.find({
    userId,
    isDeleted: false,
    $or: [
      { phone: identifier },
      { customerName: { $regex: identifier, $options: 'i' } }
    ]
  });
};

// ==========================================
// EXPORT
// ==========================================
export default mongoose.model('CreditEntry', creditEntrySchema);
