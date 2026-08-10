/**
 * CategoryRule Model Schema
 * Stores learned categorization patterns from user confirmations
 * Enables ML-lite transaction auto-categorization
 */

import mongoose from 'mongoose';
import { TRANSACTION_CATEGORIES } from '../config/constants.js';

// ==========================================
// CATEGORY RULE MAIN SCHEMA
// ==========================================
const categoryRuleSchema = new mongoose.Schema({
  // Owner
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Pattern to match (keyword, phrase, or regex)
  pattern: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },

  // Suggested category
  category: {
    type: String,
    enum: Object.values(TRANSACTION_CATEGORIES),
    required: true
  },

  // Confidence in this rule (0-1)
  confidence: {
    type: Number,
    default: 1.0,
    min: 0,
    max: 1
  },

  // Usage statistics
  usageCount: {
    type: Number,
    default: 1,
    min: 1
  },
  successCount: {
    type: Number,
    default: 1,
    min: 0
  },
  rejectionCount: {
    type: Number,
    default: 0,
    min: 0
  },

  // Timestamps
  lastUsed: {
    type: Date,
    default: Date.now
  },
  lastConfirmed: {
    type: Date,
    default: Date.now
  },

  // Pattern type
  patternType: {
    type: String,
    enum: ['keyword', 'merchant', 'regex', 'narration'],
    default: 'keyword'
  },

  // Matching context
  matchContext: {
    caseSensitive: {
      type: Boolean,
      default: false
    },
    wholeWord: {
      type: Boolean,
      default: true
    },
    requiresAmount: {
      type: Boolean,
      default: false
    },
    minAmount: Number,
    maxAmount: Number
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isSystem: {
    type: Boolean,
    default: false
  }, // System rules vs user-learned

  // Notes
  notes: {
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
categoryRuleSchema.index({ userId: 1, pattern: 1 }, { unique: true });
categoryRuleSchema.index({ userId: 1, category: 1 });
categoryRuleSchema.index({ userId: 1, isActive: 1 });
categoryRuleSchema.index({ userId: 1, lastUsed: -1 });
categoryRuleSchema.index({ pattern: 1, isActive: 1 });

// Compound index for finding applicable rules
categoryRuleSchema.index({ userId: 1, isActive: 1, patternType: 1 });

// ==========================================
// VIRTUALS
// ==========================================

// Virtual for success rate
categoryRuleSchema.virtual('successRate').get(function() {
  if (this.usageCount === 0) return 0;
  return Math.round((this.successCount / this.usageCount) * 100);
});

// Virtual for rule strength (based on usage and confidence)
categoryRuleSchema.virtual('strength').get(function() {
  // Strength combines usage count, confidence, and success rate
  const usageScore = Math.min(1, this.usageCount / 10); // Max out at 10 uses
  const successScore = this.successRate / 100;
  return Math.round((usageScore * 0.4 + this.confidence * 0.3 + successScore * 0.3) * 100);
});

// Virtual for rule status
categoryRuleSchema.virtual('ruleStatus').get(function() {
  if (!this.isActive) return 'inactive';
  if (this.successRate < 50) return 'weak';
  if (this.successRate < 75) return 'moderate';
  if (this.usageCount < 3) return 'learning';
  return 'strong';
});

// ==========================================
// INSTANCE METHODS
// ==========================================

/**
 * Record usage of this rule
 * @param {boolean} success - Whether the categorization was correct
 */
categoryRuleSchema.methods.recordUsage = function(success = true) {
  this.usageCount += 1;
  this.lastUsed = new Date();

  if (success) {
    this.successCount += 1;
    this.lastConfirmed = new Date();
    // Increase confidence
    this.confidence = Math.min(1, this.confidence + 0.05);
  } else {
    this.rejectionCount += 1;
    // Decrease confidence
    this.confidence = Math.max(0.3, this.confidence - 0.1);
  }
};

/**
 * Test if a transaction narration matches this pattern
 * @param {string} text - Text to test against
 * @returns {boolean}
 */
categoryRuleSchema.methods.matches = function(text) {
  if (!this.isActive) return false;

  const testText = this.matchContext.caseSensitive ? text : text.toLowerCase();
  const pattern = this.matchContext.caseSensitive ? this.pattern : this.pattern.toLowerCase();

  // Check amount constraints
  if (this.matchContext.requiresAmount || this.matchContext.minAmount || this.matchContext.maxAmount) {
    // Would need to pass amount separately
    // For now, skip amount check
  }

  // Match based on pattern type
  switch (this.patternType) {
    case 'regex':
      try {
        const regex = new RegExp(pattern, this.matchContext.caseSensitive ? '' : 'i');
        return regex.test(testText);
      } catch (e) {
        return false;
      }

    case 'wholeWord':
      if (this.matchContext.wholeWord) {
        const wordRegex = new RegExp(`\\b${pattern}\\b`, this.matchContext.caseSensitive ? '' : 'i');
        return wordRegex.test(testText);
      }
      return testText.includes(pattern);

    default:
      if (this.matchContext.wholeWord) {
        return testText.includes(` ${pattern} `) || testText.startsWith(`${pattern} `) || testText.endsWith(` ${pattern}`);
      }
      return testText.includes(pattern);
  }
};

/**
 * Boost rule confidence
 * @param {number} amount - Amount to boost (0-0.1)
 */
categoryRuleSchema.methods.boostConfidence = function(amount = 0.05) {
  this.confidence = Math.min(1, this.confidence + amount);
};

/**
 * Reduce rule confidence
 * @param {number} amount - Amount to reduce (0-0.1)
 */
categoryRuleSchema.methods.reduceConfidence = function(amount = 0.1) {
  this.confidence = Math.max(0.3, this.confidence - amount);
};

/**
 * Deactivate rule (if confidence is too low)
 */
categoryRuleSchema.methods.deactivate = function() {
  this.isActive = false;
};

/**
 * Reactivate rule
 */
categoryRuleSchema.methods.reactivate = function() {
  this.isActive = true;
  this.confidence = Math.max(0.5, this.confidence);
};

/**
 * Update pattern
 * @param {string} newPattern - New pattern string
 */
categoryRuleSchema.methods.updatePattern = function(newPattern) {
  this.pattern = newPattern.toLowerCase().trim();
  this.usageCount = 1;
  this.successCount = 1;
  this.rejectionCount = 0;
  this.confidence = 1.0;
  this.lastConfirmed = new Date();
};

// ==========================================
// STATIC METHODS
// ==========================================

/**
 * Find applicable rules for a transaction
 * @param {string} userId - User ID
 * @param {string} narration - Transaction narration
 * @returns {Promise<Array>} Sorted by strength (descending)
 */
categoryRuleSchema.statics.findApplicableRules = async function(userId, narration) {
  const rules = await this.find({
    userId,
    isActive: true
  });

  // Filter and sort by matching
  const matchingRules = rules
    .filter(rule => rule.matches(narration))
    .sort((a, b) => b.strength - a.strength);

  return matchingRules;
};

/**
 * Get or create rule for pattern
 * @param {string} userId - User ID
 * @param {string} pattern - Pattern string
 * @param {string} category - Category
 * @returns {Promise<CategoryRule>}
 */
categoryRuleSchema.statics.findOrCreate = async function(userId, pattern, category) {
  let rule = await this.findOne({ userId, pattern: pattern.toLowerCase() });

  if (!rule) {
    rule = await this.create({
      userId,
      pattern: pattern.toLowerCase(),
      category
    });
  }

  return rule;
};

/**
 * Learn from user confirmation
 * @param {string} userId - User ID
 * @param {string} pattern - Pattern to learn
 * @param {string} category - Confirmed category
 * @returns {Promise<CategoryRule>}
 */
categoryRuleSchema.statics.learn = async function(userId, pattern, category) {
  const rule = await this.findOrCreate(userId, pattern, category);

  // Update if category changed
  if (rule.category !== category) {
    rule.category = category;
    rule.usageCount = 1;
    rule.successCount = 1;
    rule.rejectionCount = 0;
    rule.confidence = 1.0;
  } else {
    rule.recordUsage(true);
  }

  await rule.save();
  return rule;
};

/**
 * Get rule statistics for user
 * @param {string} userId - User ID
 * @returns {Promise<object>}
 */
categoryRuleSchema.statics.getUserStats = async function(userId) {
  const pipeline = [
    { $match: { userId } },
    {
      $group: {
        _id: null,
        totalRules: { $sum: 1 },
        activeRules: { $sum: { $cond: ['$isActive', 1, 0] } },
        totalUsage: { $sum: '$usageCount' },
        avgConfidence: { $avg: '$confidence' },
        byCategory: {
          $push: {
            category: '$category',
            count: 1
          }
        }
      }
    }
  ];

  const [result] = await this.aggregate(pipeline);

  if (!result) {
    return {
      totalRules: 0,
      activeRules: 0,
      totalUsage: 0,
      avgConfidence: 0,
      byCategory: {}
    };
  }

  // Count by category
  const byCategory = {};
  result.byCategory.forEach(item => {
    byCategory[item.category] = (byCategory[item.category] || 0) + 1;
  });

  return {
    totalRules: result.totalRules,
    activeRules: result.activeRules,
    totalUsage: result.totalUsage,
    avgConfidence: result.avgConfidence.toFixed(2),
    byCategory
  };
};

/**
 * Find weak rules (low confidence or success rate)
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
categoryRuleSchema.statics.findWeakRules = function(userId) {
  return this.find({
    userId,
    isActive: true,
    $or: [
      { confidence: { $lt: 0.5 } },
      { usageCount: { $gt: 5 }, successCount: { $lt: 3 } }
    ]
  });
};

/**
 * Find strong rules (high confidence and usage)
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
categoryRuleSchema.statics.findStrongRules = function(userId) {
  return this.find({
    userId,
    isActive: true,
    confidence: { $gte: 0.8 },
    usageCount: { $gte: 5 }
  });
};

/**
 * Bulk import rules
 * @param {string} userId - User ID
 * @param {Array} rules - Array of { pattern, category } objects
 * @returns {Promise<object>} Import results
 */
categoryRuleSchema.statics.bulkImport = async function(userId, rules) {
  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const ruleData of rules) {
    try {
      const existing = await this.findOne({
        userId,
        pattern: ruleData.pattern.toLowerCase()
      });

      if (existing) {
        if (existing.category !== ruleData.category) {
          existing.category = ruleData.category;
          existing.usageCount = 1;
          existing.successCount = 1;
          existing.rejectionCount = 0;
          existing.confidence = 1.0;
          await existing.save();
          updated++;
        }
      } else {
        await this.create({
          userId,
          pattern: ruleData.pattern.toLowerCase(),
          category: ruleData.category,
          patternType: ruleData.patternType || 'keyword'
        });
        created++;
      }
    } catch (error) {
      failed++;
    }
  }

  return { created, updated, failed, total: rules.length };
};

// ==========================================
// EXPORT
// ==========================================
export default mongoose.model('CategoryRule', categoryRuleSchema);
