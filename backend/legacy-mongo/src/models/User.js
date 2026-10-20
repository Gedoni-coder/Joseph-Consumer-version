/**
 * User Model Schema
 * Manages user accounts, authentication, refresh tokens, and preferences
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  USER_ROLES,
  CURRENCIES
} from '../config/constants.js';

// ==========================================
// REFRESH TOKEN SUB-SCHEMA
// ==========================================
const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true
  },
  deviceId: String,
  deviceInfo: {
    userAgent: String,
    ip: String,
    lastUsed: Date
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 604800 // Auto-delete after 7 days (index TTL)
  }
}, { _id: false });

// ==========================================
// PREFERENCES SUB-SCHEMA
// ==========================================
const preferencesSchema = new mongoose.Schema({
  currency: {
    type: String,
    enum: Object.keys(CURRENCIES),
    default: CURRENCIES.NGN.code
  },
  language: {
    type: String,
    default: 'en'
  },
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    alerts: {
      type: Boolean,
      default: true
    },
    marketing: {
      type: Boolean,
      default: false
    }
  },
  budget: {
    enabled: {
      type: Boolean,
      default: true
    },
    monthlyAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    allocation: {
      needs: {
        type: Number,
        default: 0.5,
        min: 0,
        max: 1
      },
      wants: {
        type: Number,
        default: 0.3,
        min: 0,
        max: 1
      },
      savings: {
        type: Number,
        default: 0.2,
        min: 0,
        max: 1
      }
    }
  }
}, { _id: false });

// ==========================================
// USER MAIN SCHEMA
// ==========================================
const userSchema = new mongoose.Schema({
  // Basic Info
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't return password by default
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[\d\s\-\+\(\)]+$/, 'Please enter a valid phone number']
  },

  // Account Status
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    default: USER_ROLES.USER
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,

  // WhatsApp Authentication (for WhatsApp bot)
  whatsappOTP: String,
  whatsappOTPExpiry: Date,
  whatsappLinkedAt: Date,

  // Authentication Tokens
  refreshTokens: [refreshTokenSchema],

  // User Preferences
  preferences: {
    type: preferencesSchema,
    default: () => ({})
  },

  // Business Settings
  businessSettings: {
    reinvestmentRatio: {
      type: Number,
      default: 0.4,
      min: 0,
      max: 1
    },
    workingCapitalTarget: {
      type: Number,
      default: 0,
      min: 0
    }
  },

  // API Keys (for external services)
  apiKeys: {
    newsAPI: String,
    tradingEconomics: String,
    fmdq: String
  },

  // Timestamps
  lastLogin: Date,
  lastActivity: Date,
  onboardingComplete: {
    type: Boolean,
    default: false
  },
  onboardingStep: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ==========================================
// INDEXES
// ==========================================
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'refreshTokens.token': 1 });

// ==========================================
// VIRTUALS
// ==========================================

// Virtual for user's full identifier
userSchema.virtual('identifier').get(function() {
  return this.email || this.phone;
});

// Virtual for account age in days
userSchema.virtual('accountAgeDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// ==========================================
// PRE-SAVE HOOKS
// ==========================================

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash if password was modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ==========================================
// INSTANCE METHODS
// ==========================================

/**
 * Compare plain password with hashed password
 * @param {string} candidatePassword - Plain text password to verify
 * @returns {Promise<boolean>} True if passwords match
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

/**
 * Add refresh token to user's token list
 * @param {string} token - Refresh token to add
 * @param {object} deviceInfo - Device information
 */
userSchema.methods.addRefreshToken = function(token, deviceInfo = {}) {
  // Remove any existing token for this device
  if (deviceInfo.deviceId) {
    this.refreshTokens = this.refreshTokens.filter(
      t => t.deviceId !== deviceInfo.deviceId
    );
  }

  // Add new token
  this.refreshTokens.push({
    token,
    deviceId: deviceInfo.deviceId,
    deviceInfo: {
      userAgent: deviceInfo.userAgent,
      ip: deviceInfo.ip,
      lastUsed: new Date()
    }
  });

  // Keep only last 5 tokens per user
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }
};

/**
 * Remove refresh token from user's token list
 * @param {string} token - Refresh token to remove
 * @returns {boolean} True if token was found and removed
 */
userSchema.methods.removeRefreshToken = function(token) {
  const initialLength = this.refreshTokens.length;
  this.refreshTokens = this.refreshTokens.filter(t => t.token !== token);
  return this.refreshTokens.length < initialLength;
};

/**
 * Clear all refresh tokens (logout from all devices)
 */
userSchema.methods.clearAllRefreshTokens = function() {
  this.refreshTokens = [];
};

/**
 * Check if refresh token exists for user
 * @param {string} token - Refresh token to check
 * @returns {boolean}
 */
userSchema.methods.hasRefreshToken = function(token) {
  return this.refreshTokens.some(t => t.token === token);
};

/**
 * Update last login timestamp
 */
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  this.lastActivity = new Date();
};

/**
 * Update last activity timestamp
 */
userSchema.methods.updateLastActivity = function() {
  this.lastActivity = new Date();
};

/**
 * Generate password reset token
 * @returns {string} Reset token
 */
userSchema.methods.generatePasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
  return resetToken;
};

/**
 * Clear password reset token
 */
userSchema.methods.clearPasswordResetToken = function() {
  this.passwordResetToken = undefined;
  this.passwordResetExpires = undefined;
};

/**
 * Generate email verification token
 * @returns {string} Verification token
 */
userSchema.methods.generateEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = verificationToken;
  return verificationToken;
};

/**
 * Mark email as verified
 */
userSchema.methods.verifyEmail = function() {
  this.isEmailVerified = true;
  this.emailVerificationToken = undefined;
};

/**
 * Deactivate user account
 */
userSchema.methods.deactivate = function() {
  this.isActive = false;
  this.clearAllRefreshTokens();
};

/**
 * Activate user account
 */
userSchema.methods.activate = function() {
  this.isActive = true;
};

// ==========================================
// STATIC METHODS
// ==========================================

/**
 * Find user by email (with password field)
 * @param {string} email - User email
 * @returns {Promise<User>}
 */
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() }).select('+password');
};

/**
 * Find active user by ID
 * @param {string} id - User ID
 * @returns {Promise<User>}
 */
userSchema.statics.findActiveById = function(id) {
  return this.findOne({ _id: id, isActive: true });
};

/**
 * Find user by password reset token
 * @param {string} token - Hashed reset token
 * @returns {Promise<User>}
 */
userSchema.statics.findByPasswordResetToken = function(token) {
  return this.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: Date.now() }
  }).select('+password');
};

/**
 * Find user by email verification token
 * @param {string} token - Verification token
 * @returns {Promise<User>}
 */
userSchema.statics.findByVerificationToken = function(token) {
  return this.findOne({ emailVerificationToken: token, isActive: true });
};

// ==========================================
// EXPORT
// ==========================================
export default mongoose.model('User', userSchema);

// SR
