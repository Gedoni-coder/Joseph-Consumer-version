/**
 * Economic News Model
 * Stores news articles affecting business operations
 */

import mongoose from 'mongoose';

// ==========================================
// MAIN SCHEMA
// ==========================================
const economicNewsSchema = new mongoose.Schema({
  // Owner (optional - for user-specific filtering)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
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
  summary: {
    type: String,
    trim: true,
    maxlength: 500
  },

  // Classification
  category: {
    type: String,
    required: true,
    enum: [
      'scarcity_alert',
      'packaging',
      'campus_trends',
      'policy',
      'weather',
      'transport',
      'energy',
      'market',
      'other'
    ]
  },
  tag: {
    type: String,
    required: true
    // Examples: "🔴 Scarcity Alert", "🔵 Packaging Market", "🟢 Campus Trends"
  },
  severity: {
    type: String,
    enum: ['urgent', 'info', 'success'],
    default: 'info'
  },

  // Relevance
  affectedCommodities: [{
    type: String,
    trim: true
    // Examples: ["groundnut", "pet_bottles", "fuel"]
  }],
  affectedRegions: [{
    type: String,
    trim: true
    // Examples: ["kaduna", "lagos", "abuja", "all"]
  }],
  affectedSectors: [{
    type: String,
    trim: true
    // Examples: ["agriculture", "manufacturing", "retail"]
  }],

  // Timing
  publishedAt: {
    type: Date,
    required: true
  },
  expiresAt: {
    type: Date,
    // When this news is no longer relevant
  },
  displayUntil: {
    type: Date,
    // When to stop showing in UI (default 30 days)
    default: function() {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date;
    }
  },

  // Source
  source: {
    type: String,
    enum: ['manual', 'api', 'scraper', 'user'],
    default: 'manual'
  },
  sourceUrl: {
    type: String,
    trim: true
  },
  author: {
    type: String,
    trim: true
  },

  // Impact Assessment
  impactLevel: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  impactDescription: {
    type: String,
    trim: true,
    maxlength: 500
  },
  priceImpact: {
    type: String,
    enum: ['increase', 'decrease', 'neutral', 'unknown'],
    default: 'neutral'
  },
  estimatedImpactPercent: {
    type: Number,
    min: 0,
    max: 100
  },

  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  pinOrder: {
    type: Number,
    default: 0
  },
  viewCount: {
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
economicNewsSchema.index({ userId: 1, isActive: 1, publishedAt: -1 });
economicNewsSchema.index({ category: 1, isActive: 1, publishedAt: -1 });
economicNewsSchema.index({ severity: 1, isActive: 1, publishedAt: -1 });
economicNewsSchema.index({ affectedCommodities: 1 });
economicNewsSchema.index({ expiresAt: 1, isActive: 1 });
economicNewsSchema.index({ isPinned: -1, pinOrder: 1 });
economicNewsSchema.index({ isDeleted: 1 });

// Compound index for recent news
economicNewsSchema.index({ isActive: 1, publishedAt: -1, expiresAt: { $gt: new Date() } });

// ==========================================
// VIRTUALS
// ==========================================

// Virtual for formatted time ago
economicNewsSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.publishedAt;
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

// Virtual for whether news is expired
economicNewsSchema.virtual('isExpired').get(function() {
  return this.expiresAt && new Date() > this.expiresAt;
});

// Virtual for severity emoji
economicNewsSchema.virtual('severityIcon').get(function() {
  switch (this.severity) {
    case 'urgent': return '🔴';
    case 'info': return '🔵';
    case 'success': return '🟢';
    default: return '⚪';
  }
});

// ==========================================
// INSTANCE METHODS
// ==========================================

/**
 * Increment view count
 */
economicNewsSchema.methods.incrementView = function() {
  this.viewCount = (this.viewCount || 0) + 1;
  return this.save();
};

/**
 * Pin/Unpin news
 * @param {boolean} pinned - Whether to pin
 */
economicNewsSchema.methods.setPin = function(pinned) {
  this.isPinned = pinned;
  if (pinned) {
    // Set pinOrder to current timestamp for ordering
    this.pinOrder = Date.now();
  }
  return this.save();
};

/**
 * Check if news is still relevant
 * @returns {boolean}
 */
economicNewsSchema.methods.isRelevant = function() {
  const now = new Date();

  // Check if expired
  if (this.expiresAt && now > this.expiresAt) {
    return false;
  }

  // Check if past display until
  if (now > this.displayUntil) {
    return false;
  }

  return true;
};

// ==========================================
// STATIC METHODS
// ==========================================

/**
 * Get active news
 * @param {object} options - Query options
 * @returns {Promise<Array>}
 */
economicNewsSchema.statics.getActive = async function(options = {}) {
  const query = {
    isActive: true,
    isDeleted: false,
    publishedAt: { $lte: new Date() }
  };

  // Filter by display until
  query.displayUntil = { $gt: new Date() };

  if (options.userId) {
    query.userId = options.userId;
  }

  if (options.category) {
    query.category = options.category;
  }

  if (options.severity) {
    query.severity = options.severity;
  }

  if (options.commodity) {
    query.affectedCommodities = options.commodity;
  }

  if (options.region) {
    query.affectedRegions = options.region;
  }

  const news = await this.find(query)
    .sort({ isPinned: -1, pinOrder: -1, publishedAt: -1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0);

  return news;
};

/**
 * Get recent news (last N hours)
 * @param {number} hours - Hours to look back
 * @returns {Promise<Array>}
 */
economicNewsSchema.statics.getRecent = async function(hours = 24) {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - hours);

  return this.find({
    isActive: true,
    isDeleted: false,
    publishedAt: { $gte: cutoff },
    displayUntil: { $gt: new Date() }
  }).sort({ publishedAt: -1 })
    .limit(10);
};

/**
 * Get news count by category
 * @returns {Promise<object>}
 */
economicNewsSchema.statics.getCountsByCategory = async function() {
  const pipeline = [
    {
      $match: {
        isActive: true,
        isDeleted: false,
        publishedAt: { $lte: new Date() },
        displayUntil: { $gt: new Date() }
      }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    }
  ];

  const results = await this.aggregate(pipeline);

  // Convert to object
  const counts = {};
  results.forEach(r => {
    counts[r._id] = r.count;
  });

  return counts;
};

/**
 * Clean up expired news
 * @returns {Promise<number>} - Number of news items deactivated
 */
economicNewsSchema.statics.cleanupExpired = async function() {
  const result = await this.updateMany(
    {
      isActive: true,
      $or: [
        { expiresAt: { $lt: new Date() } },
        { displayUntil: { $lt: new Date() } }
      ]
    },
    { isActive: false }
  );

  return result.modifiedCount;
};

/**
 * Get urgent news (high severity, recent)
 * @returns {Promise<Array>}
 */
economicNewsSchema.statics.getUrgent = async function() {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 72); // Last 3 days

  return this.find({
    isActive: true,
    isDeleted: false,
    severity: 'urgent',
    publishedAt: { $gte: cutoff }
  }).sort({ publishedAt: -1 })
    .limit(5);
};

// ==========================================
// EXPORT
// ==========================================
export default mongoose.model('EconomicNews', economicNewsSchema);
