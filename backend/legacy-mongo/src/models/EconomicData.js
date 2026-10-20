/**
 * EconomicData Model Schema
 * Caches external API responses for economic indicators, FX rates, commodities, and news
 */

import mongoose from 'mongoose';
import { ECONOMIC_DATA_TYPES } from '../config/constants.js';

// ==========================================
// ECONOMIC DATA MAIN SCHEMA
// ==========================================
const economicDataSchema = new mongoose.Schema({
  // Data Type
  type: {
    type: String,
    enum: Object.values(ECONOMIC_DATA_TYPES),
    required: true,
    index: true
  },

  // The actual data (flexible structure based on type)
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },

  // Source information
  source: {
    type: String,
    default: 'cached'
  },
  sourceUrl: String,
  apiProvider: String,

  // Validity period
  fetchedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  lastRefreshedAt: Date,

  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isStale: {
    type: Boolean,
    default: false
  },

  // Metadata
  cacheHit: {
    type: Number,
    default: 0
  },
  lastAccessedAt: Date,
  error: String,
  retryCount: {
    type: Number,
    default: 0
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ==========================================
// INDEXES
// ==========================================
economicDataSchema.index({ type: 1, expiresAt: 1 });
economicDataSchema.index({ type: 1, isActive: 1 });
economicDataSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-cleanup

// Compound index for finding active non-expired data
economicDataSchema.index({ type: 1, isActive: 1, expiresAt: { $gt: new Date() } });

// ==========================================
// VIRTUALS
// ==========================================

// Virtual for cache age in seconds
economicDataSchema.virtual('cacheAge').get(function() {
  return Math.floor((Date.now() - this.fetchedAt) / 1000);
});

// Virtual for TTL (time to live) in seconds
economicDataSchema.virtual('ttl').get(function() {
  return Math.max(0, Math.floor((new Date(this.expiresAt) - Date.now()) / 1000));
});

// Virtual for is expired
economicDataSchema.virtual('isExpired').get(function() {
  return new Date() > new Date(this.expiresAt);
});

// Virtual for data freshness percentage
economicDataSchema.virtual('freshness').get(function() {
  if (!this.expiresAt || !this.fetchedAt) return 0;
  const totalLife = new Date(this.expiresAt) - new Date(this.fetchedAt);
  const remaining = new Date(this.expiresAt) - Date.now();
  return Math.max(0, Math.min(100, (remaining / totalLife) * 100));
});

// ==========================================
// INSTANCE METHODS
// ==========================================

/**
 * Check if data is still valid (not expired)
 * @returns {boolean}
 */
economicDataSchema.methods.isValid = function() {
  return this.isActive && new Date() < new Date(this.expiresAt);
};

/**
 * Mark as accessed (increment cache hit counter)
 */
economicDataSchema.methods.markAccessed = function() {
  this.cacheHit = (this.cacheHit || 0) + 1;
  this.lastAccessedAt = new Date();
};

/**
 * Refresh data with new values
 * @param {object} newData - New data to cache
 * @param {number} ttlSeconds - Time to live in seconds
 * @param {string} source - Data source
 */
economicDataSchema.methods.refresh = function(newData, ttlSeconds, source = null) {
  this.data = newData;
  this.expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  this.lastRefreshedAt = new Date();
  this.isStale = false;
  this.error = null;
  this.retryCount = 0;

  if (source) {
    this.source = source;
  }
};

/**
 * Mark as stale (failed to refresh)
 * @param {string} errorMessage - Error message
 */
economicDataSchema.methods.markStale = function(errorMessage = null) {
  this.isStale = true;
  this.error = errorMessage;
  this.retryCount += 1;
};

/**
 * Deactivate cache entry
 */
economicDataSchema.methods.deactivate = function() {
  this.isActive = false;
};

/**
 * Extend expiration time
 * @param {number} ttlSeconds - Additional time to live in seconds
 */
economicDataSchema.methods.extend = function(ttlSeconds) {
  const currentExpiry = new Date(this.expiresAt);
  const now = new Date();
  const newExpiry = currentExpiry > now ? currentExpiry : now;
  this.expiresAt = new Date(newExpiry.getTime() + ttlSeconds * 1000);
  this.isStale = false;
};

// ==========================================
// STATIC METHODS
// ==========================================

/**
 * Find or create economic data cache entry
 * @param {string} type - Data type
 * @param {number} ttlSeconds - Time to live in seconds
 * @returns {Promise<EconomicData>}
 */
economicDataSchema.statics.findOrCreateCache = async function(type, ttlSeconds = 3600) {
  const now = new Date();
  let cache = await this.findOne({
    type,
    isActive: true,
    expiresAt: { $gt: now }
  }).sort({ fetchedAt: -1 });

  if (!cache) {
    cache = await this.create({
      type,
      data: null,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000)
    });
  }

  return cache;
};

/**
 * Find valid (non-expired) cache entry
 * @param {string} type - Data type
 * @returns {Promise<EconomicData|null>}
 */
economicDataSchema.statics.findValid = function(type) {
  return this.findOne({
    type,
    isActive: true,
    expiresAt: { $gt: new Date() }
  }).sort({ fetchedAt: -1 });
};

/**
 * Get all cache statistics
 * @returns {Promise<object>}
 */
economicDataSchema.statics.getCacheStats = async function() {
  const now = new Date();

  const pipeline = [
    {
      $group: {
        _id: '$type',
        totalEntries: { $sum: 1 },
        activeEntries: {
          $sum: { $cond: ['$isActive', 1, 0] }
        },
        expiredEntries: {
          $sum: { $cond: [{ $lt: ['$expiresAt', now] }, 1, 0] }
        },
        staleEntries: {
          $sum: { $cond: ['$isStale', 1, 0] }
        },
        totalCacheHits: { $sum: '$cacheHit' },
        avgFreshness: { $avg: '$freshness' }
      }
    }
  ];

  const results = await this.aggregate(pipeline);

  const stats = {
    byType: {},
    total: {
      totalEntries: 0,
      activeEntries: 0,
      expiredEntries: 0,
      staleEntries: 0,
      totalCacheHits: 0
    }
  };

  results.forEach(result => {
    stats.byType[result._id] = result;
    stats.total.totalEntries += result.totalEntries;
    stats.total.activeEntries += result.activeEntries;
    stats.total.expiredEntries += result.expiredEntries;
    stats.total.staleEntries += result.staleEntries;
    stats.total.totalCacheHits += result.totalCacheHits;
  });

  return stats;
};

/**
 * Clean up expired cache entries
 * @returns {Promise<number>} Number of entries cleaned
 */
economicDataSchema.statics.cleanupExpired = async function() {
  const now = new Date();
  const result = await this.deleteMany({
    $or: [
      { expiresAt: { $lt: now } },
      { isActive: false }
    ]
  });
  return result.deletedCount;
};

/**
 * Mark all entries of a type as stale
 * @param {string} type - Data type
 * @returns {Promise<number>} Number of entries marked
 */
economicDataSchema.statics.markTypeAsStale = async function(type) {
  const result = await this.updateMany(
    { type, isActive: true },
    { isStale: true }
  );
  return result.modifiedCount;
};

/**
 * Get cache health report
 * @returns {Promise<object>}
 */
economicDataSchema.statics.getHealthReport = async function() {
  const types = Object.values(ECONOMIC_DATA_TYPES);
  const report = {
    overall: 'healthy',
    types: {}
  };

  for (const type of types) {
    const cache = await this.findValid(type);
    const staleCount = await this.countDocuments({ type, isStale: true });

    if (!cache) {
      report.types[type] = {
        status: 'missing',
        message: 'No valid cache entry found',
        lastFetched: null
      };
      report.overall = 'degraded';
    } else if (cache.isStale) {
      report.types[type] = {
        status: 'stale',
        message: 'Cache entry marked as stale',
        lastFetched: cache.fetchedAt,
        error: cache.error
      };
      report.overall = 'degraded';
    } else {
      const freshness = cache.freshness;
      let status = 'healthy';
      if (freshness < 20) status = 'expiring';
      else if (freshness < 50) status = 'aging';

      report.types[type] = {
        status,
        freshness: freshness.toFixed(0) + '%',
        ttl: cache.ttl,
        lastFetched: cache.fetchedAt,
        cacheHits: cache.cacheHit
      };
    }
  }

  return report;
};

/**
 * Invalidate cache for a specific type
 * @param {string} type - Data type to invalidate
 * @returns {Promise<number>} Number of entries invalidated
 */
economicDataSchema.statics.invalidateType = async function(type) {
  const result = await this.updateMany(
    { type },
    { isActive: false, isStale: true }
  );
  return result.modifiedCount;
};

// ==========================================
// EXPORT
// ==========================================
export default mongoose.model('EconomicData', economicDataSchema);

// SR
