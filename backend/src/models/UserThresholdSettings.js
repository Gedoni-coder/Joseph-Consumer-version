/**
 * User Threshold Settings Model
 * Stores user-customizable thresholds for economic alerts
 * Users can override default interpretation rule thresholds
 */

import mongoose from 'mongoose';

// ==========================================
// THRESHOLD VALUE SUB-SCHEMA
// ==========================================

const thresholdValueSchema = new mongoose.Schema({
  indicatorCode: {
    type: String,
    required: true
  },
  // Threshold values
  critical: Number,  // Critical level
  high: Number,     // High level
  moderate: Number, // Moderate level
  low: Number,      // Low level

  // Custom comparison values
  gte: Number,      // Greater than or equal
  gt: Number,       // Greater than
  lte: Number,      // Less than or equal
  lt: Number,       // Less than
  between: {        // Between range
    min: Number,
    max: Number
  },

  // For comparison with other indicators
  compareWith: String,

  // Override settings
  isCustom: {
    type: Boolean,
    default: true
  },

  // Notes
  notes: String

}, { _id: true });

// ==========================================
// MAIN SCHEMA
// ==========================================

const userThresholdSettingsSchema = new mongoose.Schema({
  // Owner
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
    unique: true
  },

  // Alert preferences
  alertPreferences: {
    // Enable/disable alerts by severity
    criticalAlerts: {
      type: Boolean,
      default: true
    },
    highAlerts: {
      type: Boolean,
      default: true
    },
    mediumAlerts: {
      type: Boolean,
      default: true
    },
    lowAlerts: {
      type: Boolean,
      default: false
    },
    infoAlerts: {
      type: Boolean,
      default: false
    },

    // Enable/disable by category
    inflationAlerts: {
      type: Boolean,
      default: true
    },
    currencyAlerts: {
      type: Boolean,
      default: true
    },
    interestRateAlerts: {
      type: Boolean,
      default: true
    },
    growthAlerts: {
      type: Boolean,
      default: true
    },
    employmentAlerts: {
      type: Boolean,
      default: true
    },

    // Notification timing
    immediateNotifications: {
      type: Boolean,
      default: true
    },
    dailyDigest: {
      type: Boolean,
      default: true
    },
    weeklyDigest: {
      type: Boolean,
      default: true
    }
  },

  // Custom thresholds for specific indicators
  customThresholds: [thresholdValueSchema],

  // Rule overrides - disable/enable specific interpretation rules
  disabledRules: [{
    type: String // Rule code
  }],

  // Custom rule adjustments
  ruleAdjustments: [{
    ruleCode: String,
    severity: String, // Override severity
    actionPriority: String, // Override action priority
    notes: String
  }],

  // Default risk tolerance
  riskTolerance: {
    type: String,
    enum: ['conservative', 'moderate', 'aggressive'],
    default: 'moderate'
  },

  // Business context (for better recommendations)
  businessContext: {
    // Cost structure sensitivity
    highCogsSensitivity: {
      type: Boolean,
      default: false
    },
    importDependent: {
      type: Boolean,
      default: false
    },
    fxExposed: {
      type: Boolean,
      default: false
    },
    interestRateSensitive: {
      type: Boolean,
      default: false
    }
  },

  // Metadata
  lastUpdated: {
    type: Date,
    default: Date.now
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ==========================================
// INDEXES
// ==========================================

userThresholdSettingsSchema.index({ userId: 1 }, { unique: true });

// ==========================================
// INSTANCE METHODS
// ==========================================

/**
 * Get threshold for an indicator
 */
userThresholdSettingsSchema.methods.getThreshold = function(indicatorCode, operator = 'gte', defaultThreshold = null) {
  const custom = this.customThresholds.find(t => t.indicatorCode === indicatorCode);

  if (!custom) {
    return defaultThreshold;
  }

  // Return based on operator
  switch (operator) {
    case 'gte':
      return custom.gte !== undefined ? custom.gte : defaultThreshold;
    case 'gt':
      return custom.gt !== undefined ? custom.gt : defaultThreshold;
    case 'lte':
      return custom.lte !== undefined ? custom.lte : defaultThreshold;
    case 'lt':
      return custom.lt !== undefined ? custom.lt : defaultThreshold;
    case 'between':
      return custom.between || defaultThreshold;
    default:
      return defaultThreshold;
  }
};

/**
 * Set custom threshold for an indicator
 */
userThresholdSettingsSchema.methods.setThreshold = function(thresholdData) {
  const existingIndex = this.customThresholds.findIndex(
    t => t.indicatorCode === thresholdData.indicatorCode
  );

  if (existingIndex >= 0) {
    // Update existing
    Object.assign(this.customThresholds[existingIndex], thresholdData);
  } else {
    // Add new
    this.customThresholds.push(thresholdData);
  }

  this.lastUpdated = new Date();
  return this.save();
};

/**
 * Check if a rule is disabled
 */
userThresholdSettingsSchema.methods.isRuleDisabled = function(ruleCode) {
  return this.disabledRules.includes(ruleCode);
};

/**
 * Check if alerts are enabled for a category/severity
 */
userThresholdSettingsSchema.methods.areAlertsEnabled = function(category, severity) {
  // Check severity
  switch (severity) {
    case 'critical':
      if (!this.alertPreferences.criticalAlerts) return false;
      break;
    case 'high':
      if (!this.alertPreferences.highAlerts) return false;
      break;
    case 'medium':
      if (!this.alertPreferences.mediumAlerts) return false;
      break;
    case 'low':
      if (!this.alertPreferences.lowAlerts) return false;
      break;
    case 'info':
      if (!this.alertPreferences.infoAlerts) return false;
      break;
  }

  // Check category
  switch (category) {
    case 'inflation':
      return this.alertPreferences.inflationAlerts;
    case 'currency':
      return this.alertPreferences.currencyAlerts;
    case 'interest_rate':
      return this.alertPreferences.interestRateAlerts;
    case 'growth':
      return this.alertPreferences.growthAlerts;
    case 'employment':
      return this.alertPreferences.employmentAlerts;
    default:
      return true;
  }
};

/**
 * Apply presets based on risk tolerance
 */
userThresholdSettingsSchema.methods.applyRiskPreset = function() {
  const tolerance = this.riskTolerance;

  // Conservative: Lower thresholds (more sensitive)
  if (tolerance === 'conservative') {
    this.setThreshold({
      indicatorCode: 'INFLATION_RATE',
      gte: 15, // More sensitive - alert at 15% instead of 20%
      notes: 'Conservative preset'
    });
    this.setThreshold({
      indicatorCode: 'CURRENCY_USD',
      gte: 1500, // More sensitive
      notes: 'Conservative preset'
    });
  }
  // Aggressive: Higher thresholds (less sensitive)
  else if (tolerance === 'aggressive') {
    this.setThreshold({
      indicatorCode: 'INFLATION_RATE',
      gte: 25, // Less sensitive - alert at 25% instead of 20%
      notes: 'Aggressive preset'
    });
    this.setThreshold({
      indicatorCode: 'CURRENCY_USD',
      gte: 1800, // Less sensitive
      notes: 'Aggressive preset'
    });
  }
  // Moderate: Use default thresholds (no custom)

  return this.save();
};

// ==========================================
// STATIC METHODS
// ==========================================

/**
 * Find or create settings for user
 */
userThresholdSettingsSchema.statics.findOrCreate = async function(userId) {
  let settings = await this.findOne({ userId });
  if (!settings) {
    settings = await this.create({ userId });
  }
  return settings;
};

/**
 * Get default thresholds for all rules
 */
userThresholdSettingsSchema.statics.getDefaultThresholds = function() {
  return {
    INFLATION_RATE: {
      critical: 20,
      high: 15,
      moderate: 12,
      operator: 'gte'
    },
    CURRENCY_USD: {
      critical: 1700,
      high: 1500,
      moderate: 1300,
      operator: 'gte'
    },
    INTEREST_RATE: {
      critical: 25,
      high: 22,
      moderate: 18,
      operator: 'gte'
    },
    FOOD_INFLATION: {
      critical: 35,
      high: 25,
      moderate: 20,
      operator: 'gte'
    },
    GDP_GROWTH_RATE: {
      critical: 0,
      high: 2,
      moderate: 3,
      operator: 'lt' // Lower is bad
    },
    UNEMPLOYMENT_RATE: {
      critical: 8,
      high: 6,
      moderate: 4,
      operator: 'gte'
    }
  };
};

// ==========================================
// EXPORT
// ==========================================

export default mongoose.model('UserThresholdSettings', userThresholdSettingsSchema);
