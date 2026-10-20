/**
 * Goal Model
 * Stores strategic goals with progress tracking
 * Used by Strategy module for goal setting and monitoring
 */

import mongoose from 'mongoose';

// ==========================================
// MILESTONE SUB-SCHEMA
// ==========================================
const milestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  targetValue: Number,
  currentValue: {
    type: Number,
    default: 0
  },
  unit: String,
  dueDate: Date,
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  notes: String
}, { _id: true });

// ==========================================
// ACTION ITEM SUB-SCHEMA
// ==========================================
const actionItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  assignedTo: {
    type: String,
    trim: true
  },
  priority: {
    type: String,
    enum: ['urgent', 'high', 'medium', 'low'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'blocked', 'cancelled'],
    default: 'pending'
  },
  dueDate: Date,
  completedAt: Date,
  estimatedCost: Number,
  actualCost: Number,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

// ==========================================
// MAIN SCHEMA
// ==========================================
const goalSchema = new mongoose.Schema({
  // Owner
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Goal Identity
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },

  // Classification
  category: {
    type: String,
    required: true,
    enum: ['revenue', 'savings', 'expansion', 'cost_reduction', 'efficiency', 'quality', 'other']
  },
  goalType: {
    type: String,
    enum: ['numeric', 'milestone', 'habit', 'deadline'],
    default: 'numeric'
  },

  // Target
  targetValue: {
    type: Number,
    required: function() {
      return this.goalType === 'numeric';
    }
  },
  currentValue: {
    type: Number,
    default: 0
  },
  unit: {
    type: String,
    trim: true
    // Examples: '₦', '%', 'units', 'customers'
  },

  // Dates
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },

  // Progress
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'on_track', 'at_risk', 'behind', 'completed', 'paused', 'cancelled'],
    default: 'not_started'
  },

  // Milestones
  milestones: [milestoneSchema],

  // Action Items
  actionItems: [actionItemSchema],

  // Priority & Importance
  priority: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'medium'
  },
  importance: {
    type: String,
    enum: ['must_have', 'should_have', 'nice_to_have'],
    default: 'should_have'
  },

  // Linked Items
  linkedLedger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ledger'
  },
  kpiCode: String, // Link to economic indicator

  // Dependencies
  dependsOn: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal'
  }],
  blocks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal'
  }],

  // Tracking
  lastProgressUpdate: Date,
  lastReviewed: Date,
  nextReviewDate: Date,

  // Outcome
  outcomeNotes: String,
  outcomeRating: {
    type: String,
    enum: ['exceeded', 'met', 'partially_met', 'not_met'],
    default: null
  },

  // Metadata
  tags: [String],
  isPublic: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
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
goalSchema.index({ userId: 1, status: 1 });
goalSchema.index({ userId: 1, category: 1 });
goalSchema.index({ userId: 1, priority: 1 });
goalSchema.index({ userId: 1, endDate: 1 });
goalSchema.index({ isDeleted: 1 });

// ==========================================
// VIRTUALS
// ==========================================

// Virtual for days remaining
goalSchema.virtual('daysRemaining').get(function() {
  if (!this.endDate) return 0;
  const now = new Date();
  const end = new Date(this.endDate);
  return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
});

// Virtual for days elapsed
goalSchema.virtual('daysElapsed').get(function() {
  const now = new Date();
  const start = new Date(this.startDate);
  return Math.floor((now - start) / (1000 * 60 * 60 * 24));
});

// Virtual for time progress percentage
goalSchema.virtual('timeProgress').get(function() {
  if (!this.startDate || !this.endDate) return 0;
  const total = new Date(this.endDate) - new Date(this.startDate);
  const elapsed = new Date() - new Date(this.startDate);
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
});

// Virtual for progress status color
goalSchema.virtual('statusColor').get(function() {
  switch (this.status) {
    case 'completed': return 'green';
    case 'on_track': return 'green';
    case 'at_risk': return 'orange';
    case 'behind': return 'red';
    case 'in_progress': return 'blue';
    case 'not_started': return 'gray';
    case 'paused': return 'yellow';
    case 'cancelled': return 'gray';
    default: return 'gray';
  }
});

// Virtual for is overdue
goalSchema.virtual('isOverdue').get(function() {
  return this.endDate && new Date() > this.endDate && this.status !== 'completed';
});

// ==========================================
// INSTANCE METHODS
// ==========================================

/**
 * Update goal progress
 */
goalSchema.methods.updateProgress = function(newValue, notes) {
  this.currentValue = newValue;
  this.lastProgressUpdate = new Date();

  // Calculate progress percentage
  if (this.targetValue > 0) {
    this.progress = Math.min(100, Math.round((newValue / this.targetValue) * 100));
  }

  // Update status based on progress vs time
  const timeProgress = this.timeProgress;
  const valueProgress = this.progress;

  if (valueProgress >= 100) {
    this.status = 'completed';
  } else if (this.status === 'not_started') {
    this.status = 'in_progress';
  } else if (timeProgress > 75 && valueProgress < timeProgress - 20) {
    this.status = 'behind';
  } else if (timeProgress > 50 && valueProgress < timeProgress - 15) {
    this.status = 'at_risk';
  } else if (valueProgress >= timeProgress) {
    this.status = 'on_track';
  } else {
    this.status = 'in_progress';
  }

  if (notes) {
    this.notes = notes;
  }

  return this.save();
};

/**
 * Add action item
 */
goalSchema.methods.addActionItem = function(actionData) {
  const action = {
    ...actionData,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  this.actionItems.push(action);
  return this.save();
};

/**
 * Update action item status
 */
goalSchema.methods.updateActionItem = function(actionId, updates) {
  const action = this.actionItems.id(actionId);
  if (!action) return null;

  Object.assign(action, updates);
  action.updatedAt = new Date();

  if (updates.status === 'completed' && !action.completedAt) {
    action.completedAt = new Date();
  }

  return this.save();
};

/**
 * Add milestone
 */
goalSchema.methods.addMilestone = function(milestoneData) {
  const milestone = {
    ...milestoneData,
    completed: false
  };
  this.milestones.push(milestone);
  return this.save();
};

/**
 * Complete milestone
 */
goalSchema.methods.completeMilestone = function(milestoneId) {
  const milestone = this.milestones.id(milestoneId);
  if (!milestone) return null;

  milestone.completed = true;
  milestone.completedAt = new Date();

  // Update goal progress based on completed milestones
  const totalMilestones = this.milestones.length;
  const completedMilestones = this.milestones.filter(m => m.completed).length;
  if (totalMilestones > 0) {
    this.progress = Math.round((completedMilestones / totalMilestones) * 100);
  }

  return this.save();
};

/**
 * Mark goal as complete
 */
goalSchema.methods.markComplete = function(outcome, notes) {
  this.status = 'completed';
  this.progress = 100;
  this.outcomeRating = outcome;
  if (notes) {
    this.outcomeNotes = notes;
  }
  return this.save();
};

/**
 * Pause goal
 */
goalSchema.methods.pause = function(reason) {
  this.status = 'paused';
  if (reason) {
    this.notes = `Paused: ${reason}`;
  }
  return this.save();
};

/**
 * Resume goal
 */
goalSchema.methods.resume = function() {
  if (this.status === 'paused') {
    this.status = 'in_progress';
  }
  return this.save();
};

// ==========================================
// STATIC METHODS
// ==========================================

/**
 * Get active goals for user
 */
goalSchema.statics.getActiveGoals = function(userId, options = {}) {
  const query = {
    userId,
    isDeleted: false,
    status: { $nin: ['completed', 'cancelled'] }
  };

  if (options.category) query.category = options.category;
  if (options.priority) query.priority = options.priority;

  return this.find(query)
    .sort({ priority: -1, endDate: 1 });
};

/**
 * Get goals by status
 */
goalSchema.statics.getByStatus = function(userId, status) {
  return this.find({
    userId,
    status,
    isDeleted: false
  }).sort({ endDate: 1 });
};

/**
 * Get overdue goals
 */
goalSchema.statics.getOverdue = function(userId) {
  return this.find({
    userId,
    isDeleted: false,
    status: { $nin: ['completed', 'cancelled'] },
    endDate: { $lt: new Date() }
  }).sort({ endDate: 1 });
};

/**
 * Get goals needing review
 */
goalSchema.statics.needingReview = function(userId) {
  const now = new Date();
  return this.find({
    userId,
    isDeleted: false,
    status: { $nin: ['completed', 'cancelled', 'not_started'] },
    $or: [
      { nextReviewDate: { $lte: now } },
      { nextReviewDate: { $exists: false } }
    ]
  }).sort({ priority: -1 });
};

/**
 * Get goal summary
 */
goalSchema.statics.getSummary = async function(userId) {
  const pipeline = [
    {
      $match: {
        userId,
        isDeleted: false
      }
    },
    {
      $facet: {
        total: [{ $count: 'count' }],
        active: [
          { $match: { status: { $nin: ['completed', 'cancelled', 'paused'] } } },
          { $count: 'count' }
        ],
        completed: [
          { $match: { status: 'completed' } },
          { $count: 'count' }
        ],
        overdue: [
          {
            $match: {
              status: { $nin: ['completed', 'cancelled'] },
              endDate: { $lt: new Date() }
            }
          },
          { $count: 'count' }
        ],
        atRisk: [
          { $match: { status: 'at_risk' } },
          { $count: 'count' }
        ],
        byCategory: [
          {
            $group: {
              _id: '$category',
              count: { $sum: 1 }
            }
          }
        ],
        byPriority: [
          {
            $group: {
              _id: '$priority',
              count: { $sum: 1 }
            }
          }
        ]
      }
    }
  ];

  const [result] = await this.aggregate(pipeline);

  return {
    total: result.total?.[0]?.count || 0,
    active: result.active?.[0]?.count || 0,
    completed: result.completed?.[0]?.count || 0,
    overdue: result.overdue?.[0]?.count || 0,
    atRisk: result.atRisk?.[0]?.count || 0,
    byCategory: (result.byCategory || []).reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    byPriority: (result.byPriority || []).reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {})
  };
};

// ==========================================
// EXPORT
// ==========================================
export default mongoose.model('Goal', goalSchema);

// SR
