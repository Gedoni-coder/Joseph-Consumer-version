/**
 * Interpretation Rule Model
 * Stores rules for generating insights from economic indicators
 * Converts raw economic data into plain English insights
 */

import mongoose from 'mongoose';

// ==========================================
// CONDITION SUB-SCHEMA
// ==========================================
const conditionSchema = new mongoose.Schema({
  indicatorCode: {
    type: String,
    required: true
  },
  operator: {
    type: String,
    enum: ['gt', 'gte', 'lt', 'lte', 'eq', 'ne', 'between', 'outside'],
    required: true
  },
  value: {
    type: Number,
    required: function() {
      return !this.valueMin && !this.valueMax;
    }
  },
  valueMin: Number,
  valueMax: Number,
  // For comparing with other indicators
  compareWith: {
    type: String, // indicator code to compare with
    default: null
  }
}, { _id: false });

// ==========================================
// INSIGHT GENERATION RULE
// ==========================================
const interpretationRuleSchema = new mongoose.Schema({
  // Owner (optional - for user-specific rules)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },

  // Rule Identity
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },

  // Classification
  category: {
    type: String,
    required: true,
    enum: ['inflation', 'fx', 'commodities', 'interest_rates', 'employment', 'growth', 'trade', 'business', 'combined']
  },
  severity: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low', 'info'],
    default: 'medium'
  },
  insightType: {
    type: String,
    enum: ['alert', 'opportunity', 'trend', 'explanation', 'forecast'],
    default: 'explanation'
  },

  // Conditions to trigger this rule
  conditions: [{
    type: conditionSchema,
    required: true
  }],

  // Insight Template
  titleTemplate: {
    type: String,
    required: true,
    trim: true
    // Example: "Inflation at {INFLATION_RATE.value}% is {severity} for your business"
  },
  bodyTemplate: {
    type: String,
    required: true,
    trim: true
    // Example: "With {INFLATION_RATE.value}% inflation, your raw material costs
    //         are likely to rise by {COMMODITY_INFLATION}% over the next {timeframe}."
  },

  // Business Impact
  affectedArea: {
    type: String,
    enum: ['cogs', 'pricing', 'demand', 'logistics', 'labor', 'capital', 'revenue', 'all'],
    default: 'all'
  },
  impactLevel: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'medium'
  },

  // Recommended Action
  actionRequired: {
    type: Boolean,
    default: false
  },
  actionTemplate: {
    type: String,
    trim: true
    // Example: "Consider increasing prices by {recommendedIncrease}% or
    //         lock in supplier contracts before {deadline}."
  },
  actionPriority: {
    type: String,
    enum: ['urgent', 'high', 'medium', 'low', 'informational'],
    default: 'medium'
  },

  // Timeframe for insight relevance
  timeframe: {
    type: String,
    enum: ['immediate', '1_week', '2_weeks', '1_month', '3_months', '6_months', '1_year'],
    default: '1_month'
  },

  // Related indicators to include in insight
  relatedIndicators: [{
    type: String
    // List of indicator codes that provide context
  }],

  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  lastTriggered: Date,
  triggerCount: {
    type: Number,
    default: 0
  },

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
interpretationRuleSchema.index({ code: 1 }, { unique: true });
interpretationRuleSchema.index({ userId: 1, isActive: 1 });
interpretationRuleSchema.index({ category: 1, isActive: 1 });
interpretationRuleSchema.index({ severity: 1, isActive: 1 });
interpretationRuleSchema.index({ insightType: 1, isActive: 1 });
interpretationRuleSchema.index({ isDeleted: 1 });

// ==========================================
// INSTANCE METHODS
// ==========================================

/**
 * Check if conditions match given indicator values
 * @param {object} indicatorValues - Object with indicator codes as keys and values as values
 * @param {object} userThresholds - Optional user-specific thresholds to override defaults
 * @returns {boolean}
 */
interpretationRuleSchema.methods.matchesConditions = function(indicatorValues, userThresholds = null) {
  if (!this.conditions || this.conditions.length === 0) return false;

  // ALL conditions must match (AND logic)
  return this.conditions.every(condition => {
    const value = indicatorValues[condition.indicatorCode]?.value ?? indicatorValues[condition.indicatorCode];

    if (value === undefined || value === null) return false;

    // Get user-specific threshold if available
    let thresholdValue = condition.value;
    let valueMin = condition.valueMin;
    let valueMax = condition.valueMax;

    if (userThresholds && userThresholds[condition.indicatorCode]) {
      const userThreshold = userThresholds[condition.indicatorCode];
      if (userThreshold[condition.operator] !== undefined) {
        thresholdValue = userThreshold[condition.operator];
      }
      if (userThreshold.between) {
        valueMin = userThreshold.between.min;
        valueMax = userThreshold.between.max;
      }
    }

    // Handle comparison with another indicator
    if (condition.compareWith) {
      const compareValue = indicatorValues[condition.compareWith]?.value ?? indicatorValues[condition.compareWith];
      if (compareValue === undefined || compareValue === null) return false;
      return this.compareValues(value, condition.operator, compareValue);
    }

    // Handle range comparisons
    if (condition.operator === 'between') {
      return value >= (valueMin || 0) && value <= (valueMax || 0);
    }
    if (condition.operator === 'outside') {
      return value < (valueMin || 0) || value > (valueMax || 0);
    }

    // Handle standard comparisons
    return this.compareValues(value, condition.operator, thresholdValue);
  });
};

/**
 * Compare two values using operator
 */
interpretationRuleSchema.methods.compareValues = function(value, operator, compareValue) {
  switch (operator) {
    case 'gt': return value > compareValue;
    case 'gte': return value >= compareValue;
    case 'lt': return value < compareValue;
    case 'lte': return value <= compareValue;
    case 'eq': return Math.abs(value - compareValue) < 0.01;
    case 'ne': return Math.abs(value - compareValue) >= 0.01;
    default: return false;
  }
};

/**
 * Generate insight from template with indicator values
 * @param {object} indicatorValues - Object with indicator codes as keys
 * @returns {object} Insight object with title and body
 */
interpretationRuleSchema.methods.generateInsight = function(indicatorValues) {
  const templateData = {};

  // Build template data from indicator values
  Object.keys(indicatorValues).forEach(code => {
    templateData[code] = {
      value: indicatorValues[code].value,
      formatted: indicatorValues[code].formatted,
      change: indicatorValues[code].change,
      trend: indicatorValues[code].trend
    };
  });

  // Add rule-specific data
  templateData.severity = this.severity;
  templateData.timeframe = this.timeframe;

  // Replace placeholders in templates
  const title = this.replacePlaceholders(this.titleTemplate, templateData);
  const body = this.replacePlaceholders(this.bodyTemplate, templateData);
  const action = this.actionTemplate ? this.replacePlaceholders(this.actionTemplate, templateData) : null;

  return {
    ruleCode: this.code,
    title,
    body,
    action: this.actionRequired ? {
      text: action,
      priority: this.actionPriority
    } : null,
    category: this.category,
    severity: this.severity,
    insightType: this.insightType,
    affectedArea: this.affectedArea,
    impactLevel: this.impactLevel,
    timeframe: this.timeframe,
    relatedIndicators: this.relatedIndicators
  };
};

/**
 * Replace placeholders in template with values
 */
interpretationRuleSchema.methods.replacePlaceholders = function(template, data) {
  let result = template;

  // Replace {indicatorCode.value} patterns
  Object.keys(data).forEach(key => {
    const item = data[key];
    if (typeof item === 'object' && item !== null) {
      // Handle indicator objects
      Object.keys(item).forEach(prop => {
        const pattern = new RegExp(`\\{${key}\\.${prop}\\}`, 'g');
        result = result.replace(pattern, item[prop] || '');
      });
    } else {
      // Handle simple values
      const pattern = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(pattern, item || '');
    }
  });

  return result;
};

/**
 * Record that this rule was triggered
 */
interpretationRuleSchema.methods.recordTrigger = function() {
  this.lastTriggered = new Date();
  this.triggerCount = (this.triggerCount || 0) + 1;
  return this.save();
};

// ==========================================
// STATIC METHODS
// ==========================================

/**
 * Get all active rules
 */
interpretationRuleSchema.statics.getActiveRules = function() {
  return this.find({
    isActive: true,
    isDeleted: false
  }).sort({ priority: -1, code: 1 });
};

/**
 * Get rules by category
 */
interpretationRuleSchema.statics.getByCategory = function(category) {
  return this.find({
    category,
    isActive: true,
    isDeleted: false
  }).sort({ priority: -1, severity: 1 });
};

/**
 * Get rules that require action
 */
interpretationRuleSchema.statics.getActionableRules = function() {
  return this.find({
    actionRequired: true,
    isActive: true,
    isDeleted: false
  }).sort({ actionPriority: -1, priority: -1 });
};

/**
 * Get rules by severity
 */
interpretationRuleSchema.statics.getBySeverity = function(severity) {
  return this.find({
    severity,
    isActive: true,
    isDeleted: false
  }).sort({ priority: -1 });
};

/**
 * Find matching rules for given indicator values
 * @param {object} indicatorValues - Object with indicator codes as keys
 * @param {object} userThresholds - Optional user-specific thresholds to override defaults
 * @param {Array} disabledRules - Optional list of disabled rule codes
 */
interpretationRuleSchema.statics.findMatchingRules = async function(indicatorValues, userThresholds = null, disabledRules = []) {
  const rules = await this.getActiveRules();

  // Filter out disabled rules
  const enabledRules = rules.filter(rule => !disabledRules.includes(rule.code));

  return enabledRules.filter(rule => rule.matchesConditions(indicatorValues, userThresholds));
};

/**
 * Generate insights from matching rules
 */
interpretationRuleSchema.statics.generateInsights = async function(indicatorValues) {
  const matchingRules = await this.findMatchingRules(indicatorValues);

  const insights = matchingRules.map(rule => {
    const insight = rule.generateInsight(indicatorValues);
    rule.recordTrigger();
    return insight;
  });

  return insights;
};

// ==========================================
// EXPORT
// ==========================================
export default mongoose.model('InterpretationRule', interpretationRuleSchema);
