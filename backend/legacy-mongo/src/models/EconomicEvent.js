/**
 * Economic Event Model
 * Stores upcoming economic events (CBN meetings, releases, etc.)
 */

import mongoose from 'mongoose';

// ==========================================
// SUB-SCHEMAS
// ==========================================

// Event reminder sub-schema
const reminderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  remindAt: {
    type: Date,
    required: true
  },
  notified: {
    type: Boolean,
    default: false
  },
  notifiedAt: Date
}, { _id: false });

// ==========================================
// MAIN SCHEMA
// ==========================================
const economicEventSchema = new mongoose.Schema({
  // Owner (optional - for user-specific events)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },

  // Event Identity
  code: {
    type: String,
    required: true,
    trim: true
    // Examples: "CBN_MPC_JUL2026", "INFLATION_RELEASE_JUL2026"
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
    // Examples: "CBN MPC Meeting", "Inflation Rate Release"
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
    enum: ['mpc', 'inflation', 'gdp', 'employment', 'trade', 'budget', 'policy', 'holiday', 'other']
  },
  importance: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  source: {
    type: String,
    enum: ['CBN', 'NBS', 'FMF', 'Official', 'Manual'],
    default: 'Manual'
  },

  // Timing
  eventDate: {
    type: Date,
    required: true,
    index: true
  },
  eventTime: {
    type: String,
    trim: true
    // Example: "9:00 AM"
  },
  duration: {
    type: String,
    trim: true
    // Example: "2 days", "1 hour"
  },
  isAllDay: {
    type: Boolean,
    default: false
  },

  // Expected Outcomes
  expectedValue: {
    type: Number
  },
  expectedRange: {
    min: Number,
    max: Number
  },
  consensus: {
    type: String,
    trim: true
  },
  previousValue: {
    type: Number
  },
  affectedIndicators: [{
    type: String,
    trim: true
    // Examples: ["INFLATION", "INTEREST_RATE", "FX_RATE"]
  }],

  // Actual Results (filled after event)
  actualValue: {
    type: Number
  },
  actualReleasedAt: Date,
  actualSource: {
    type: String,
    trim: true
  },
  surprise: {
    type: String,
    enum: ['better', 'worse', 'as_expected'],
    default: null
  },

  // Status
  status: {
    type: String,
    enum: ['upcoming', 'in_progress', 'completed', 'cancelled', 'postponed'],
    default: 'upcoming'
  },
  reminderSent: {
    type: Boolean,
    default: false
  },

  // Reminders
  reminders: [reminderSchema],

  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    type: String,
    trim: true
    // Example: "Monthly", "Quarterly"
  },
  nextOccurrence: Date,

  // Location (for physical events)
  location: {
    type: String,
    trim: true
  },
  isVirtual: {
    type: Boolean,
    default: true
  },
  meetingUrl: {
    type: String,
    trim: true
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
economicEventSchema.index({ userId: 1, isActive: 1, eventDate: 1 });
economicEventSchema.index({ category: 1, isActive: 1, eventDate: 1 });
economicEventSchema.index({ importance: 1, isActive: 1, eventDate: 1 });
economicEventSchema.index({ status: 1, eventDate: 1 });
economicEventSchema.index({ eventDate: 1, status: 1 });
economicEventSchema.index({ isDeleted: 1 });

// Compound index for upcoming events
economicEventSchema.index({ isActive: 1, status: 1, eventDate: 1 });

// ==========================================
// VIRTUALS
// ==========================================

// Virtual for days until event
economicEventSchema.virtual('daysUntil').get(function() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const eventDay = new Date(this.eventDate);
  eventDay.setHours(0, 0, 0, 0);
  const diff = eventDay - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Virtual for urgency
economicEventSchema.virtual('urgency').get(function() {
  const days = this.daysUntil;

  if (this.status !== 'upcoming') return 'past';

  if (days <= 3) return 'critical';
  if (days <= 7) return 'high';
  if (days <= 14) return 'medium';
  return 'low';
});

// Virtual for urgency color
economicEventSchema.virtual('urgencyColor').get(function() {
  const urgency = this.urgency;

  switch (urgency) {
    case 'critical': return 'red';
    case 'high': return 'orange';
    case 'medium': return 'yellow';
    case 'low': return 'green';
    default: return 'gray';
  }
});

// Virtual for formatted date
economicEventSchema.virtual('formattedDate').get(function() {
  const date = new Date(this.eventDate);
  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
});

// Virtual for is past
economicEventSchema.virtual('isPast').get(function() {
  return new Date() > this.eventDate;
});

// ==========================================
// INSTANCE METHODS
// ==========================================

/**
 * Add reminder for user
 * @param {ObjectId} userId - User ID
 * @param {Date} remindAt - When to remind
 */
economicEventSchema.methods.addReminder = function(userId, remindAt) {
  const existing = this.reminders.find(r => r.userId.toString() === userId.toString());
  if (existing) {
    existing.remindAt = remindAt;
    existing.notified = false;
    existing.notifiedAt = undefined;
  } else {
    this.reminders.push({ userId, remindAt });
  }
  return this.save();
};

/**
 * Remove reminder for user
 * @param {ObjectId} userId - User ID
 */
economicEventSchema.methods.removeReminder = function(userId) {
  this.reminders = this.reminders.filter(r => r.userId.toString() !== userId.toString());
  return this.save();
};

/**
 * Mark event as completed with results
 * @param {number} actualValue - Actual value
 * @param {string} actualSource - Source of actual data
 */
economicEventSchema.methods.markCompleted = function(actualValue, actualSource = 'Manual') {
  this.status = 'completed';
  this.actualValue = actualValue;
  this.actualReleasedAt = new Date();
  this.actualSource = actualSource;

  // Calculate surprise
  if (this.expectedValue) {
    const diff = actualValue - this.expectedValue;
    const pctDiff = Math.abs(diff / this.expectedValue) * 100;

    if (pctDiff < 2) {
      this.surprise = 'as_expected';
    } else if ((this.expectedValue > 0 && diff < 0) || (this.expectedValue < 0 && diff > 0)) {
      this.surprise = this.isGoodSurprise() ? 'better' : 'worse';
    } else {
      this.surprise = this.isGoodSurprise() ? 'better' : 'worse';
    }
  }

  // If recurring, schedule next occurrence
  if (this.isRecurring) {
    this.scheduleNext();
  }

  return this.save();
};

/**
 * Determine if surprise is good or bad
 */
economicEventSchema.methods.isGoodSurprise = function() {
  // This is category-specific logic
  // For inflation, lower is better
  // For GDP, higher is better
  // etc.
  switch (this.category) {
    case 'inflation':
      return this.actualValue < this.expectedValue;
    case 'gdp':
    case 'employment':
      return this.actualValue > this.expectedValue;
    default:
      return this.actualValue >= this.expectedValue;
  }
};

/**
 * Schedule next occurrence for recurring events
 */
economicEventSchema.methods.scheduleNext = function() {
  const current = new Date(this.eventDate);

  switch (this.recurringPattern) {
    case 'Monthly':
      current.setMonth(current.getMonth() + 1);
      break;
    case 'Quarterly':
      current.setMonth(current.getMonth() + 3);
      break;
    case 'Yearly':
      current.setFullYear(current.getFullYear() + 1);
      break;
    default:
      return this;
  }

  this.nextOccurrence = current;
  return this;
};

// ==========================================
// STATIC METHODS
// ==========================================

/**
 * Get upcoming events
 * @param {object} options - Query options
 * @returns {Promise<Array>}
 */
economicEventSchema.statics.getUpcoming = async function(options = {}) {
  const query = {
    isActive: true,
    isDeleted: false,
    status: 'upcoming',
    eventDate: { $gte: new Date() }
  };

  if (options.userId) {
    query.userId = options.userId;
  }

  if (options.category) {
    query.category = options.category;
  }

  if (options.importance) {
    query.importance = options.importance;
  }

  const events = await this.find(query)
    .sort({ eventDate: 1, importance: -1 })
    .limit(options.limit || 20);

  return events;
};

/**
 * Get next event (closest upcoming)
 * @returns {Promise<object>}
 */
economicEventSchema.statics.getNext = async function() {
  return this.findOne({
    isActive: true,
    isDeleted: false,
    status: 'upcoming',
    eventDate: { $gte: new Date() }
  }).sort({ eventDate: 1 });
};

/**
 * Get events in date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>}
 */
economicEventSchema.statics.getInRange = async function(startDate, endDate) {
  return this.find({
    isActive: true,
    isDeleted: false,
    eventDate: { $gte: startDate, $lte: endDate }
  }).sort({ eventDate: 1 });
};

/**
 * Get events needing reminders
 * @returns {Promise<Array>}
 */
economicEventSchema.statics.getNeedingReminders = async function() {
  const now = new Date();

  return this.find({
    isActive: true,
    isDeleted: false,
    status: 'upcoming',
    'reminders.remindAt': { $lte: now },
    'reminders.notified': false
  });
};

/**
 * Get recent past events (for comparison)
 * @param {number} days - Days to look back
 * @returns {Promise<Array>}
 */
economicEventSchema.statics.getRecentPast = async function(days = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return this.find({
    isActive: true,
    isDeleted: false,
    status: 'completed',
    actualReleasedAt: { $gte: cutoff }
  }).sort({ actualReleasedAt: -1 })
    .limit(10);
};

/**
 * Get events by indicator
 * @param {string} indicatorCode - Indicator code
 * @returns {Promise<Array>}
 */
economicEventSchema.statics.getByIndicator = async function(indicatorCode) {
  return this.find({
    isActive: true,
    isDeleted: false,
    affectedIndicators: indicatorCode
  }).sort({ eventDate: -1 });
};

/**
 * Clean up old completed events
 * @param {number} daysToKeep - Days to keep old events
 * @returns {Promise<number>} - Number of events archived
 */
economicEventSchema.statics.cleanupOld = async function(daysToKeep = 90) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysToKeep);

  const result = await this.updateMany(
    {
      isActive: true,
      status: 'completed',
      actualReleasedAt: { $lt: cutoff },
      isRecurring: false
    },
    { isActive: false }
  );

  return result.modifiedCount;
};

// ==========================================
// EXPORT
// ==========================================
export default mongoose.model('EconomicEvent', economicEventSchema);
