/**
 * Insight Model
 * Stores generated insights from interpretation rules
 * These are the "plain English" insights presented to users
 */

import mongoose from 'mongoose';
import InsightTemplate from './InsightTemplate.js';

// ==========================================
// MAIN SCHEMA
// ==========================================
const insightSchema = new mongoose.Schema({
  // Owner
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },

  // Source
  ruleCode: {
    type: String,
    required: true
  },
  ruleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterpretationRule'
  },

  // Content
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  body: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
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
    required: true
  },
  insightType: {
    type: String,
    enum: ['alert', 'opportunity', 'trend', 'explanation', 'forecast'],
    required: true
  },

  // Business Impact
  affectedArea: {
    type: String,
    enum: ['cogs', 'pricing', 'demand', 'logistics', 'labor', 'capital', 'revenue', 'all']
  },
  impactLevel: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low']
  },

  // Recommended Action
  actionRequired: {
    type: Boolean,
    default: false
  },
  actionText: {
    type: String,
    trim: true
  },
  actionPriority: {
    type: String,
    enum: ['urgent', 'high', 'medium', 'low', 'informational']
  },
  actionStatus: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'dismissed'],
    default: 'pending'
  },
  actionCompletedAt: Date,

  // Context
  timeframe: {
    type: String,
    enum: ['immediate', '1_week', '2_weeks', '1_month', '3_months', '6_months', '1_year']
  },
  relatedIndicators: [{
    type: String
  }],
  indicatorValues: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
    // Stores the actual indicator values that triggered this insight
  },

  // Timestamps
  generatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    index: true
  },
  displayUntil: {
    type: Date,
    // When to stop showing this insight
    default: function() {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date;
    }
  },

  // User Interaction
  viewedAt: Date,
  viewCount: {
    type: Number,
    default: 0
  },
  dismissedAt: Date,
  dismissReason: {
    type: String,
    trim: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
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
insightSchema.index({ userId: 1, isActive: 1, generatedAt: -1 });
insightSchema.index({ category: 1, isActive: 1, generatedAt: -1 });
insightSchema.index({ severity: 1, isActive: 1, generatedAt: -1 });
insightSchema.index({ actionStatus: 1, actionRequired: true });
insightSchema.index({ displayUntil: 1, isActive: 1 });
insightSchema.index({ expiresAt: 1, isActive: 1 });
insightSchema.index({ isDeleted: 1 });

// ==========================================
// VIRTUALS
// ==========================================

// Virtual for time ago
insightSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.generatedAt;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  } else {
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  }
});

// Virtual for severity icon
insightSchema.virtual('severityIcon').get(function() {
  switch (this.severity) {
    case 'critical': return '🔴';
    case 'high': return '🟠';
    case 'medium': return '🟡';
    case 'low': return '🟢';
    case 'info': return '🔵';
    default: return '⚪';
  }
});

// Virtual for is expired
insightSchema.virtual('isExpired').get(function() {
  return this.expiresAt && new Date() > this.expiresAt;
});

// Virtual for action urgency
insightSchema.virtual('actionUrgency').get(function() {
  if (!this.actionRequired) return null;

  const now = new Date();
  const generated = new Date(this.generatedAt);
  const hoursSince = (now - generated) / (1000 * 60 * 60);

  if (this.actionPriority === 'urgent') return 'immediate';
  if (this.actionPriority === 'high' && hoursSince > 24) return 'overdue';
  if (this.actionPriority === 'medium' && hoursSince > 72) return 'overdue';
  return 'on_track';
});

// ==========================================
// INSTANCE METHODS
// ==========================================

/**
 * Mark insight as viewed
 */
insightSchema.methods.markViewed = function() {
  this.viewedAt = new Date();
  this.viewCount = (this.viewCount || 0) + 1;
  return this.save();
};

/**
 * Dismiss insight
 */
insightSchema.methods.dismiss = function(reason) {
  this.dismissedAt = new Date();
  this.dismissReason = reason;
  this.isActive = false;
  return this.save();
};

/**
 * Complete the action
 */
insightSchema.methods.completeAction = function() {
  this.actionStatus = 'completed';
  this.actionCompletedAt = new Date();
  return this.save();
};

/**
 * Start working on the action
 */
insightSchema.methods.startAction = function() {
  this.actionStatus = 'in_progress';
  return this.save();
};

/**
 * Check if insight should still be displayed
 */
insightSchema.methods.shouldDisplay = function() {
  if (!this.isActive) return false;
  if (this.isDeleted) return false;
  if (this.dismissedAt) return false;

  const now = new Date();
  if (this.expiresAt && now > this.expiresAt) return false;
  if (now > this.displayUntil) return false;

  return true;
};

// ==========================================
// STATIC METHODS
// ==========================================

/**
 * Get active insights for user
 */
insightSchema.statics.getActiveForUser = function(userId, options = {}) {
  const query = {
    userId,
    isActive: true,
    isDeleted: false,
    displayUntil: { $gt: new Date() }
  };

  if (options.category) query.category = options.category;
  if (options.severity) query.severity = options.severity;
  if (options.actionRequired) query.actionRequired = true;
  if (options.actionStatus) query.actionStatus = options.actionStatus;

  return this.find(query)
    .sort({ isPinned: -1, generatedAt: -1 })
    .limit(options.limit || 20);
};

/**
 * Get insights requiring action
 */
insightSchema.statics.getActionable = function(userId, options = {}) {
  return this.getActiveForUser(userId, {
    ...options,
    actionRequired: true,
    actionStatus: options.actionStatus || 'pending'
  });
};

/**
 * Get insights by category
 */
insightSchema.statics.getByCategory = function(userId, category, options = {}) {
  return this.getActiveForUser(userId, { ...options, category });
};

/**
 * Get insights by severity
 */
insightSchema.statics.getBySeverity = function(userId, severity, options = {}) {
  return this.getActiveForUser(userId, { ...options, severity });
};

/**
 * Get pinned insights
 */
insightSchema.statics.getPinned = function(userId) {
  return this.find({
    userId,
    isPinned: true,
    isActive: true,
    isDeleted: false
  }).sort({ generatedAt: -1 });
};

/**
 * Get overdue actions
 */
insightSchema.statics.getOverdueActions = function(userId) {
  const urgent = new Date();
  urgent.setHours(urgent.getHours() - 24);

  const high = new Date();
  high.setHours(high.getHours() - 72);

  return this.find({
    userId,
    actionRequired: true,
    actionStatus: { $in: ['pending', 'in_progress'] },
    $or: [
      { actionPriority: 'urgent', generatedAt: { $lt: urgent } },
      { actionPriority: 'high', generatedAt: { $lt: high } }
    ],
    isActive: true,
    isDeleted: false
  }).sort({ actionPriority: -1, generatedAt: -1 });
};

/**
 * Create insight from rule with optional custom template
 */
insightSchema.statics.createFromRule = async function(userId, rule, indicatorValues, customTemplate = null, businessContext = {}) {
  let insight = rule.generateInsight(indicatorValues);

  // Apply custom template if provided
  if (customTemplate) {
    const { industry, businessType } = businessContext;

    // Get industry-specific variables
    const variables = customTemplate.industryVariables || {};

    // Apply template with variables
    const customContent = customTemplate.applyVariables(indicatorValues, variables);

    insight = {
      ...insight,
      title: customContent.titleTemplate,
      body: customContent.bodyTemplate,
      actionText: customContent.actionTemplate
    };

    // Apply dynamic severity if configured
    const dynamicSeverity = customTemplate.calculateSeverity(indicatorValues, insight.severity);
    insight.severity = dynamicSeverity;

    // Apply dynamic affected area if configured
    const dynamicArea = customTemplate.getAffectedArea(businessType, insight.affectedArea);
    insight.affectedArea = dynamicArea;

    // Apply priority adjustment
    insight.priority = (rule.priority || 0) + (customTemplate.priorityAdjustment || 0);
  }

  return this.create({
    userId,
    ruleCode: rule.code,
    ruleId: rule._id,
    ...insight,
    indicatorValues
  });
};

/**
 * Clean up old insights
 */
insightSchema.statics.cleanupOld = async function(daysToKeep = 90) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysToKeep);

  const result = await this.updateMany(
    {
      isActive: true,
      generatedAt: { $lt: cutoff },
      isPinned: false,
      actionStatus: 'completed'
    },
    { isActive: false }
  );

  return result.modifiedCount;
};

/**
 * Get insights count by status
 */
insightSchema.statics.getCountsByStatus = async function(userId) {
  const pipeline = [
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        isActive: true,
        isDeleted: false,
        displayUntil: { $gt: new Date() }
      }
    },
    {
      $facet: {
        total: [{ $count: 'count' }],
        actionable: [
          { $match: { actionRequired: true, actionStatus: 'pending' } },
          { $count: 'count' }
        ],
        overdue: [
          {
            $match: {
              actionRequired: true,
              actionStatus: { $in: ['pending', 'in_progress'] },
              $or: [
                { actionPriority: 'urgent', generatedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
                { actionPriority: 'high', generatedAt: { $lt: new Date(Date.now() - 72 * 60 * 60 * 1000) } }
              ]
            }
          },
          { $count: 'count' }
        ],
        bySeverity: [
          {
            $group: {
              _id: '$severity',
              count: { $sum: 1 }
            }
          }
        ]
      }
    }
  ];

  const results = await this.aggregate(pipeline);
  const data = results[0] || {};

  return {
    total: data.total?.[0]?.count || 0,
    actionable: data.actionable?.[0]?.count || 0,
    overdue: data.overdue?.[0]?.count || 0,
    bySeverity: (data.bySeverity || []).reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {})
  };
};

// ==========================================
// EXPORT
// ==========================================
export default mongoose.model('Insight', insightSchema);
