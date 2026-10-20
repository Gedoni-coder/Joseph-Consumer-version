/**
 * Business Profile Model
 * Stores business pricing, costs, suppliers, and operational data
 * Used by Strategy module for pricing and procurement recommendations
 */

import mongoose from 'mongoose';

// ==========================================
// PRODUCT SUB-SCHEMA
// ==========================================
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['finished_goods', 'raw_materials', 'packaging', 'services', 'other'],
    default: 'finished_goods'
  },
  // Pricing
  currentPrice: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    trim: true,
    default: 'unit'
  },
  // Costs
  cogs: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  // Cost breakdown
  costBreakdown: {
    rawMaterials: { type: Number, default: 0 },
    labor: { type: Number, default: 0 },
    packaging: { type: Number, default: 0 },
    overhead: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  // Margin
  targetMargin: {
    type: Number,
    default: 20,
    min: 0,
    max: 100
  },
  currentMargin: {
    type: Number,
    default: 0
  },
  // Competitor pricing
  competitorPrice: Number,
  competitorName: String,
  // Demand
  demandLevel: {
    type: String,
    enum: ['low', 'moderate', 'high', 'seasonal'],
    default: 'moderate'
  },
  priceElasticity: {
    type: String,
    enum: ['elastic', 'inelastic', 'unit'],
    default: 'unit'
  }
}, { _id: false });

// ==========================================
// SUPPLIER SUB-SCHEMA
// ==========================================
const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  contactPerson: String,
  phone: String,
  email: String,
  address: String,
  // Products supplied
  products: [{
    name: String,
    sku: String,
    unitPrice: Number,
    unit: String,
    moq: Number // Minimum Order Quantity
  }],
  // Bulk discounts
  bulkDiscounts: [{
    minQty: Number,
    discountPercent: Number,
    description: String
  }],
  // Payment terms
  paymentTerms: {
    type: String,
    enum: ['cash', '7_days', '14_days', '30_days', '60_days'],
    default: '30_days'
  },
  creditLimit: Number,
  // Reliability
  reliability: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  // Lead time
  leadTimeDays: {
    type: Number,
    default: 7
  },
  // Notes
  notes: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// ==========================================
// MAIN SCHEMA
// ==========================================
const businessProfileSchema = new mongoose.Schema({
  // Owner
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
    unique: true
  },

  // Business Identity
  businessName: {
    type: String,
    trim: true,
    maxlength: 200
  },
  businessType: {
    type: String,
    enum: ['manufacturing', 'retail', 'service', 'trading', 'other'],
    default: 'retail'
  },
  industry: {
    type: String,
    trim: true
  },

  // Products
  products: [productSchema],

  // Raw Materials (for manufacturing)
  rawMaterials: [{
    name: String,
    unit: String,
    currentPrice: Number,
    supplierName: String,
    monthlyUsage: Number,
    stockOnHand: Number,
    reorderLevel: Number,
    lastPurchase: Date
  }],

  // Suppliers
  suppliers: [supplierSchema],

  // Pricing Strategy
  pricingStrategy: {
    type: String,
    enum: ['cost_plus', 'competitor_based', 'value_based', 'dynamic'],
    default: 'cost_plus'
  },
  pricingFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'never'],
    default: 'monthly'
  },
  lastPriceReview: Date,

  // Cost Structure
  fixedCosts: {
    type: Number,
    default: 0,
    min: 0
  },
  variableCostRatio: {
    type: Number,
    default: 0.6,
    min: 0,
    max: 1
  },

  // Growth Targets
  monthlyRevenueTarget: Number,
  annualRevenueTarget: Number,
  profitMarginTarget: {
    type: Number,
    default: 20,
    min: 0,
    max: 100
  },

  // Market Position
  marketSegment: {
    type: String,
    enum: ['premium', 'mid_market', 'budget', 'mass_market'],
    default: 'mid_market'
  },
  competitiveAdvantage: String,

  // Operational Settings
  businessDays: {
    type: [String],
    default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  },
  currency: {
    type: String,
    default: 'NGN'
  },

  // Metadata
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isComplete: {
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
businessProfileSchema.index({ userId: 1 }, { unique: true });
businessProfileSchema.index({ businessType: 1 });
businessProfileSchema.index({ isDeleted: 1 });

// ==========================================
// VIRTUALS
// ==========================================

// Virtual for average margin across products
businessProfileSchema.virtual('averageMargin').get(function() {
  if (!this.products || this.products.length === 0) return 0;
  const total = this.products.reduce((sum, p) => sum + (p.currentMargin || 0), 0);
  return total / this.products.length;
});

// Virtual for total monthly costs
businessProfileSchema.virtual('totalMonthlyCosts').get(function() {
  const productCosts = this.products.reduce((sum, p) => sum + (p.cogs || 0), 0);
  return this.fixedCosts + productCosts;
});

// ==========================================
// INSTANCE METHODS
// ==========================================

/**
 * Add product to profile
 */
businessProfileSchema.methods.addProduct = function(productData) {
  const margin = productData.cogs > 0
    ? ((productData.currentPrice - productData.cogs) / productData.currentPrice) * 100
    : 0;

  const product = {
    ...productData,
    currentMargin: margin
  };

  this.products.push(product);
  this.lastUpdated = new Date();
  return this.save();
};

/**
 * Update product
 */
businessProfileSchema.methods.updateProduct = function(productId, updates) {
  const product = this.products.id(productId);
  if (!product) return null;

  Object.assign(product, updates);

  // Recalculate margin if price or COGS changed
  if (updates.currentPrice !== undefined || updates.cogs !== undefined) {
    product.currentMargin = product.cogs > 0
      ? ((product.currentPrice - product.cogs) / product.currentPrice) * 100
      : 0;
  }

  this.lastUpdated = new Date();
  return this.save();
};

/**
 * Remove product
 */
businessProfileSchema.methods.removeProduct = function(productId) {
  this.products = this.products.filter(p => p._id.toString() !== productId);
  this.lastUpdated = new Date();
  return this.save();
};

/**
 * Add supplier
 */
businessProfileSchema.methods.addSupplier = function(supplierData) {
  this.suppliers.push(supplierData);
  this.lastUpdated = new Date();
  return this.save();
};

/**
 * Update pricing recommendations based on current data
 */
businessProfileSchema.methods.updatePricingRecommendations = function() {
  const recommendations = [];

  this.products.forEach(product => {
    const currentMargin = product.currentMargin || 0;
    const targetMargin = product.targetMargin || 20;

    if (currentMargin < targetMargin * 0.8) {
      recommendations.push({
        type: 'price_increase',
        product: product.name,
        currentPrice: product.currentPrice,
        cogs: product.cogs,
        currentMargin,
        targetMargin,
        recommendedPrice: Math.round(product.cogs / (1 - targetMargin / 100)),
        reason: 'Margin below target'
      });
    }
  });

  return recommendations;
};

// ==========================================
// STATIC METHODS
// ==========================================

/**
 * Find or create profile for user
 */
businessProfileSchema.statics.findOrCreate = async function(userId) {
  let profile = await this.findOne({ userId, isDeleted: false });
  if (!profile) {
    profile = await this.create({ userId });
  }
  return profile;
};

/**
 * Get profile with populated recommendations
 */
businessProfileSchema.statics.getWithRecommendations = async function(userId) {
  const profile = await this.findOrCreate(userId);
  const recommendations = profile.updatePricingRecommendations();
  return { profile, recommendations };
};

// ==========================================
// EXPORT
// ==========================================
export default mongoose.model('BusinessProfile', businessProfileSchema);

// SR
