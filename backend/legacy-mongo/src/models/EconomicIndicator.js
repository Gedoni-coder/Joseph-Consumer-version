/**
 * Economic Indicator Model
 * Stores current and historical values for 85+ economic indicators
 */

import mongoose from 'mongoose';
import { HTTP_STATUS } from '../config/constants.js';

// ==========================================
// SUB-SCHEMAS
// ==========================================

// Value history sub-schema
const valueHistorySchema = new mongoose.Schema({
  value: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  source: String
}, { _id: false });

// ==========================================
// MAIN SCHEMA
// ==========================================
const economicIndicatorSchema = new mongoose.Schema({
  // Owner (optional - for user-specific overrides)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },

  // Indicator Identity
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['overview', 'gdp', 'labour', 'prices', 'money', 'trade', 'government', 'business', 'commodities', 'energy']
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },

  // Current Value
  value: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String,
    default: 'manual'
  },

  // Historical Context
  previous: {
    type: Number,
    default: null
  },
  highest: {
    type: Number,
    default: null
  },
  lowest: {
    type: Number,
    default: null
  },
  highestDate: {
    type: Date,
    default: null
  },
  lowestDate: {
    type: Date,
    default: null
  },

  // Change Calculations
  change: {
    type: Number,
    default: 0
  },
  changePercent: {
    type: Number,
    default: 0
  },
  trend: {
    type: String,
    enum: ['up', 'down', 'stable'],
    default: 'stable'
  },

  // Metadata
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  priority: {
    type: Number,
    default: 0, // Higher = more important
    min: 0,
    max: 10
  },
  lastFetched: {
    type: Date,
    default: Date.now
  },
  nextFetch: {
    type: Date,
    default: function() {
      // Default: fetch daily
      const now = new Date();
      now.setDate(now.getDate() + 1);
      return now;
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },

  // Value History (for charts)
  history: [valueHistorySchema],

  // Tags for filtering
  tags: [String],

  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ==========================================
// INDEXES
// ==========================================
economicIndicatorSchema.index({ code: 1 }, { unique: true });
economicIndicatorSchema.index({ category: 1, isActive: 1 });
economicIndicatorSchema.index({ userId: 1, category: 1 });
economicIndicatorSchema.index({ timestamp: -1 });
economicIndicatorSchema.index({ nextFetch: 1, isActive: 1 });
economicIndicatorSchema.index({ priority: -1 });
economicIndicatorSchema.index({ isDeleted: 1 });

// Compound index for overview query
economicIndicatorSchema.index({ category: 1, priority: -1, isActive: 1 });

// ==========================================
// VIRTUALS
// ==========================================

// Virtual for formatted value
economicIndicatorSchema.virtual('formattedValue').get(function() {
  if (!this.value) return 'N/A';

  // Format based on unit
  switch (this.unit) {
    case 'percent':
      return `${this.value.toFixed(2)}%`;
    case 'NGN/USD':
      return `₦${this.value.toLocaleString()}/$`;
    case 'points':
      return `${this.value.toLocaleString()} points`;
    case 'NGN Million':
      return `₦${this.value.toLocaleString()} Million`;
    case 'USD Billion':
      return `$${this.value.toLocaleString()} Billion`;
    case 'NGN/Month':
      return `₦${this.value.toLocaleString()}/Month`;
    case 'BBL/D/1K':
      return `${this.value.toLocaleString()} BBL/D/1K`;
    default:
      return this.value.toLocaleString();
  }
});

// Virtual for formatted change
economicIndicatorSchema.virtual('formattedChange').get(function() {
  if (this.changePercent === 0) return '0%';
  const sign = this.changePercent > 0 ? '+' : '';
  return `${sign}${this.changePercent.toFixed(2)}%`;
});

// Virtual for trend icon
economicIndicatorSchema.virtual('trendIcon').get(function() {
  switch (this.trend) {
    case 'up': return '↑';
    case 'down': return '↓';
    default: return '→';
  }
});

// Virtual for status level (based on value)
economicIndicatorSchema.virtual('statusLevel').get(function() {
  // This will be computed based on category-specific thresholds
  // Override in category-specific logic
  return 'moderate';
});

// ==========================================
// INSTANCE METHODS
// ==========================================

/**
 * Update indicator value
 * @param {number} newValue - New value
 * @param {object} options - Additional options
 */
economicIndicatorSchema.methods.updateValue = function(newValue, options = {}) {
  const oldValue = this.value;

  // Store old value as previous
  this.previous = oldValue;
  this.value = newValue;
  this.timestamp = options.timestamp || new Date();
  this.source = options.source || this.source;
  this.lastFetched = new Date();

  // Calculate change
  this.change = newValue - oldValue;
  if (oldValue !== 0) {
    this.changePercent = ((newValue - oldValue) / Math.abs(oldValue)) * 100;
  }

  // Determine trend
  if (this.change > 0.001) {
    this.trend = 'up';
  } else if (this.change < -0.001) {
    this.trend = 'down';
  } else {
    this.trend = 'stable';
  }

  // Update highest/lowest
  if (!this.highest || newValue > this.highest) {
    this.highest = newValue;
    this.highestDate = this.timestamp;
  }
  if (!this.lowest || newValue < this.lowest) {
    this.lowest = newValue;
    this.lowestDate = this.timestamp;
  }

  // Add to history
  this.history.push({
    value: newValue,
    timestamp: this.timestamp,
    source: this.source
  });

  // Keep only last 365 history entries
  if (this.history.length > 365) {
    this.history = this.history.slice(-365);
  }

  return this.save();
};

/**
 * Check if indicator needs refresh
 * @returns {boolean}
 */
economicIndicatorSchema.methods.needsRefresh = function() {
  return new Date() >= this.nextFetch;
};

/**
 * Calculate next fetch time based on frequency
 */
economicIndicatorSchema.methods.scheduleNextFetch = function() {
  const now = new Date();
  const next = new Date(now);

  switch (this.frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setDate(next.getDate() + 1);
  }

  this.nextFetch = next;
  return this.save();
};

// ==========================================
// STATIC METHODS
// ==========================================

/**
 * Get indicators by category
 * @param {string} category - Category code
 * @param {object} options - Query options
 * @returns {Promise<Array>}
 */
economicIndicatorSchema.statics.getByCategory = async function(category, options = {}) {
  const query = {
    category,
    isActive: true,
    isDeleted: false
  };

  if (options.userId) {
    query.userId = options.userId;
  }

  const indicators = await this.find(query)
    .sort({ priority: -1, code: 1 })
    .limit(options.limit || 100);

  return indicators;
};

/**
 * Get overview indicators (high priority only)
 * @returns {Promise<Array>}
 */
economicIndicatorSchema.statics.getOverview = async function() {
  const overviewCodes = [
    'FX_RATE',
    'STOCK_MARKET',
    'GDP_GROWTH',
    'INFLATION',
    'INTEREST_RATE',
    'UNEMPLOYMENT'
  ];

  return this.find({
    code: { $in: overviewCodes },
    isActive: true,
    isDeleted: false
  }).sort({ code: 1 });
};

/**
 * Get single indicator by code
 * @param {string} code - Indicator code
 * @returns {Promise<object>}
 */
economicIndicatorSchema.statics.getByCode = function(code) {
  return this.findOne({
    code: code.toUpperCase(),
    isActive: true,
    isDeleted: false
  });
};

/**
 * Get all indicators that need refresh
 * @returns {Promise<Array>}
 */
economicIndicatorSchema.statics.getNeedingRefresh = function() {
  return this.find({
    nextFetch: { $lte: new Date() },
    isActive: true,
    isDeleted: false
  });
};

/**
 * Bulk update indicators
 * @param {Array} updates - Array of {code, value, ...}
 * @returns {Promise<object>}
 */
economicIndicatorSchema.statics.bulkUpdate = async function(updates) {
  const results = {
    updated: 0,
    failed: 0,
    errors: []
  };

  for (const update of updates) {
    try {
      const indicator = await this.findOne({ code: update.code });
      if (indicator) {
        await indicator.updateValue(update.value, {
          source: update.source,
          timestamp: update.timestamp
        });
        await indicator.scheduleNextFetch();
        results.updated++;
      } else {
        results.failed++;
        results.errors.push(`${update.code}: Not found`);
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`${update.code}: ${error.message}`);
    }
  }

  return results;
};

/**
 * Get economic health score
 * @returns {Promise<number>}
 */
economicIndicatorSchema.statics.getHealthScore = async function() {
  // Get key indicators
  const inflation = await this.getByCode('INFLATION');
  const gdpGrowth = await this.getByCode('GDP_GROWTH');
  const fxRate = await this.getByCode('FX_RATE');
  const unemployment = await this.getByCode('UNEMPLOYMENT');

  let score = 100;

  // Inflation impact (lower is better)
  if (inflation) {
    if (inflation.value > 20) score -= 20;
    else if (inflation.value > 15) score -= 10;
    else if (inflation.value > 10) score -= 5;
  }

  // GDP growth impact (positive is better)
  if (gdpGrowth) {
    if (gdpGrowth.value < 0) score -= 15;
    else if (gdpGrowth.value < 2) score -= 5;
    else if (gdpGrowth.value > 5) score += 5;
  }

  // FX rate stability (lower is better)
  if (fxRate && fxRate.value > 1500) score -= 10;

  // Unemployment (lower is better)
  if (unemployment) {
    if (unemployment.value > 10) score -= 15;
    else if (unemployment.value > 5) score -= 5;
  }

  return Math.max(0, Math.min(100, score));
};

// ==========================================
// EXPORT
// ==========================================
export default mongoose.model('EconomicIndicator', economicIndicatorSchema);

// SR
