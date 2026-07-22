/**
 * Strategy Controller
 * Handles pricing strategy, procurement recommendations, and goal management
 *
 * Features:
 * - Pricing analysis and recommendations
 * - Procurement and supplier optimization
 * - Goal setting and tracking
 * - Strategic recommendations dashboard
 */

import BusinessProfile from '../models/BusinessProfile.js';
import Goal from '../models/Goal.js';
import Ledger from '../models/Ledger.js';
import EconomicIndicator from '../models/EconomicIndicator.js';

// ==========================================
// PRICING STRATEGY
// ==========================================

/**
 * Get pricing overview and recommendations
 */
export const getPricingOverview = async (req, res) => {
  try {
    const userId = req.userId;

    const profile = await BusinessProfile.findOne({ userId, isDeleted: false });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Business profile not found. Please set up your business profile first.'
      });
    }

    // Calculate pricing metrics
    const products = profile.products || [];
    const totalProducts = products.length;

    let healthyMargins = 0;
    let lowMargins = 0;
    let criticalMargins = 0;

    const productAnalysis = products.map(product => {
      const margin = product.currentMargin || 0;
      const target = product.targetMargin || 20;

      let marginStatus = 'healthy';
      if (margin < target * 0.5) {
        marginStatus = 'critical';
        criticalMargins++;
      } else if (margin < target * 0.8) {
        marginStatus = 'low';
        lowMargins++;
      } else {
        healthyMargins++;
      }

      // Calculate recommended price
      const recommendedPrice = product.cogs > 0
        ? Math.round(product.cogs / (1 - target / 100))
        : product.currentPrice;

      return {
        id: product._id,
        name: product.name,
        category: product.category,
        currentPrice: product.currentPrice,
        cogs: product.cogs,
        currentMargin: margin,
        targetMargin: target,
        marginStatus,
        recommendedPrice,
        competitorPrice: product.competitorPrice,
        demandLevel: product.demandLevel,
        priceElasticity: product.priceElasticity,
        gap: recommendedPrice - product.currentPrice,
        gapPercent: product.currentPrice > 0
          ? Math.round(((recommendedPrice - product.currentPrice) / product.currentPrice) * 100)
          : 0
      };
    });

    // Sort by gap (products needing price increases first)
    productAnalysis.sort((a, b) => b.gapPercent - a.gapPercent);

    // Strategy recommendations
    const recommendations = [];

    if (criticalMargins > 0) {
      recommendations.push({
        type: 'urgent',
        title: 'Critical Margins',
        message: `${criticalMargins} product(s) have critically low margins. Immediate price action needed.`,
        action: 'review_pricing'
      });
    }

    if (lowMargins > 0) {
      recommendations.push({
        type: 'warning',
        title: 'Low Margins',
        message: `${lowMargins} product(s) are below target margin.`,
        action: 'adjust_prices'
      });
    }

    const avgMargin = totalProducts > 0
      ? products.reduce((sum, p) => sum + (p.currentMargin || 0), 0) / totalProducts
      : 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalProducts,
          healthyMargins,
          lowMargins,
          criticalMargins,
          averageMargin: Math.round(avgMargin),
          pricingStrategy: profile.pricingStrategy,
          lastPriceReview: profile.lastPriceReview
        },
        products: productAnalysis,
        recommendations
      }
    });

  } catch (error) {
    console.error('Error in getPricingOverview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pricing overview',
      error: error.message
    });
  }
};

/**
 * Get detailed pricing analysis for a product
 */
export const getProductPricing = async (req, res) => {
  try {
    const userId = req.userId;
    const { productId } = req.params;

    const profile = await BusinessProfile.findOne({ userId, isDeleted: false });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Business profile not found'
      });
    }

    const product = profile.products.id(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Calculate various pricing scenarios
    const scenarios = [];
    const pricePoints = [
      { name: 'Current', price: product.currentPrice },
      { name: 'Target Margin', price: Math.round(product.cogs / (1 - (product.targetMargin || 20) / 100)) },
      { name: 'Competitor', price: product.competitorPrice || product.currentPrice }
    ];

    // Filter unique prices
    const uniquePrices = [...new Set(pricePoints.map(p => p.price))];

    uniquePrices.forEach(price => {
      if (price > 0 && price !== product.currentPrice) {
        const margin = ((price - product.cogs) / price) * 100;
        const diff = price - product.currentPrice;
        const diffPercent = (diff / product.currentPrice) * 100;

        scenarios.push({
          name: `₦${price.toLocaleString()}`,
          price,
          margin: Math.round(margin),
          volumeChange: product.priceElasticity === 'elastic'
            ? Math.round(-diffPercent * 1.5)
            : Math.round(-diffPercent * 0.5),
          profitImpact: Math.round(diff * 100) // Assuming 100 units baseline
        });
      }
    });

    // Cost breakdown
    const costBreakdown = product.costBreakdown || {};
    const totalCOGS = product.cogs;
    const breakdown = Object.entries(costBreakdown).map(([key, value]) => ({
      component: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      amount: value,
      percent: totalCOGS > 0 ? Math.round((value / totalCOGS) * 100) : 0
    })).sort((a, b) => b.amount - a.amount);

    res.json({
      success: true,
      data: {
        product: {
          id: product._id,
          name: product.name,
          sku: product.sku,
          category: product.category,
          currentPrice: product.currentPrice,
          cogs: product.cogs,
          currentMargin: product.currentMargin,
          targetMargin: product.targetMargin,
          competitorPrice: product.competitorPrice,
          competitorName: product.competitorName,
          demandLevel: product.demandLevel,
          priceElasticity: product.priceElasticity
        },
        scenarios: scenarios.sort((a, b) => b.margin - a.margin),
        costBreakdown: breakdown,
        recommendations: generatePricingRecommendations(product)
      }
    });

  } catch (error) {
    console.error('Error in getProductPricing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve product pricing',
      error: error.message
    });
  }
};

/**
 * Update product price
 */
export const updateProductPrice = async (req, res) => {
  try {
    const userId = req.userId;
    const { productId } = req.params;
    const { currentPrice, reason } = req.body;

    if (!currentPrice || currentPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid price is required'
      });
    }

    const profile = await BusinessProfile.findOne({ userId, isDeleted: false });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Business profile not found'
      });
    }

    const result = await profile.updateProduct(productId, {
      currentPrice,
      priceUpdateReason: reason
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const updatedProduct = result.products.id(productId);

    res.json({
      success: true,
      message: 'Product price updated successfully',
      data: {
        id: updatedProduct._id,
        name: updatedProduct.name,
        currentPrice: updatedProduct.currentPrice,
        newMargin: updatedProduct.currentMargin
      }
    });

  } catch (error) {
    console.error('Error in updateProductPrice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product price',
      error: error.message
    });
  }
};

/**
 * Add new product
 */
export const addProduct = async (req, res) => {
  try {
    const userId = req.userId;
    const productData = req.body;

    // Validate required fields
    if (!productData.name || !productData.currentPrice) {
      return res.status(400).json({
        success: false,
        message: 'Product name and price are required'
      });
    }

    const profile = await BusinessProfile.findOrCreate(userId);
    await profile.addProduct({
      ...productData,
      cogs: productData.cogs || 0
    });

    res.json({
      success: true,
      message: 'Product added successfully',
      data: {
        name: profile.products[profile.products.length - 1].name,
        margin: profile.products[profile.products.length - 1].currentMargin
      }
    });

  } catch (error) {
    console.error('Error in addProduct:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add product',
      error: error.message
    });
  }
};

// ==========================================
// PROCUREMENT & SUPPLIERS
// ==========================================

/**
 * Get procurement overview
 */
export const getProcurementOverview = async (req, res) => {
  try {
    const userId = req.userId;

    const profile = await BusinessProfile.findOne({ userId, isDeleted: false });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Business profile not found'
      });
    }

    const suppliers = profile.suppliers || [];
    const rawMaterials = profile.rawMaterials || [];

    // Calculate supplier metrics
    const supplierAnalysis = suppliers.map(supplier => {
      const avgRating = supplier.rating || 3;
      const reliabilityScore = {
        high: 100,
        medium: 70,
        low: 40
      }[supplier.reliability] || 50;

      // Calculate overall score
      const overallScore = Math.round((avgRating / 5 * 0.6 + reliabilityScore / 100 * 0.4) * 100);

      return {
        id: supplier._id,
        name: supplier.name,
        contactPerson: supplier.contactPerson,
        email: supplier.email,
        phone: supplier.phone,
        paymentTerms: supplier.paymentTerms,
        leadTimeDays: supplier.leadTimeDays,
        rating: avgRating,
        reliability: supplier.reliability,
        overallScore,
        productCount: supplier.products?.length || 0,
        isActive: supplier.isActive,
        hasBulkDiscounts: supplier.bulkDiscounts?.length > 0
      };
    });

    supplierAnalysis.sort((a, b) => b.overallScore - a.overallScore);

    // Material stock analysis
    const stockAnalysis = rawMaterials.map(material => {
      const stockStatus = material.stockOnHand <= material.reorderLevel
        ? 'critical'
        : material.stockOnHand <= material.reorderLevel * 1.5
          ? 'low'
          : 'healthy';

      return {
        name: material.name,
        unit: material.unit,
        currentPrice: material.currentPrice,
        supplierName: material.supplierName,
        stockOnHand: material.stockOnHand,
        reorderLevel: material.reorderLevel,
        monthlyUsage: material.monthlyUsage,
        stockStatus,
        daysOfStock: material.monthlyUsage > 0
          ? Math.round(material.stockOnHand / material.monthlyUsage * 30)
          : 0,
        lastPurchase: material.lastPurchase
      };
    });

    // Identify items needing reorder
    const needsReorder = stockAnalysis.filter(m => m.stockStatus === 'critical');

    res.json({
      success: true,
      data: {
        summary: {
          totalSuppliers: suppliers.length,
          activeSuppliers: suppliers.filter(s => s.isActive).length,
          totalMaterials: rawMaterials.length,
          needsReorder: needsReorder.length
        },
        suppliers: supplierAnalysis,
        materials: stockAnalysis.sort((a, b) => a.daysOfStock - b.daysOfStock),
        reorderAlerts: needsReorder,
        recommendations: generateProcurementRecommendations(profile)
      }
    });

  } catch (error) {
    console.error('Error in getProcurementOverview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve procurement overview',
      error: error.message
    });
  }
};

/**
 * Get supplier details
 */
export const getSupplierDetails = async (req, res) => {
  try {
    const userId = req.userId;
    const { supplierId } = req.params;

    const profile = await BusinessProfile.findOne({ userId, isDeleted: false });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Business profile not found'
      });
    }

    const supplier = profile.suppliers.id(supplierId);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Calculate bulk discount tiers
    const discountTiers = supplier.bulkDiscounts?.map(d => ({
      minQty: d.minQty,
      discountPercent: d.discountPercent,
      description: d.description,
      effectivePrice: supplier.products[0]?.unitPrice
        ? Math.round(supplier.products[0].unitPrice * (1 - d.discountPercent / 100))
        : null
    })) || [];

    res.json({
      success: true,
      data: {
        supplier: {
          id: supplier._id,
          name: supplier.name,
          contactPerson: supplier.contactPerson,
          email: supplier.email,
          phone: supplier.phone,
          address: supplier.address,
          paymentTerms: supplier.paymentTerms,
          creditLimit: supplier.creditLimit,
          leadTimeDays: supplier.leadTimeDays,
          rating: supplier.rating,
          reliability: supplier.reliability,
          isActive: supplier.isActive,
          notes: supplier.notes
        },
        products: supplier.products || [],
        bulkDiscounts: discountTiers.sort((a, b) => a.minQty - b.minQty)
      }
    });

  } catch (error) {
    console.error('Error in getSupplierDetails:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve supplier details',
      error: error.message
    });
  }
};

/**
 * Add new supplier
 */
export const addSupplier = async (req, res) => {
  try {
    const userId = req.userId;
    const supplierData = req.body;

    if (!supplierData.name) {
      return res.status(400).json({
        success: false,
        message: 'Supplier name is required'
      });
    }

    const profile = await BusinessProfile.findOrCreate(userId);
    await profile.addSupplier(supplierData);

    res.json({
      success: true,
      message: 'Supplier added successfully'
    });

  } catch (error) {
    console.error('Error in addSupplier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add supplier',
      error: error.message
    });
  }
};

/**
 * Update raw material stock
 */
export const updateMaterialStock = async (req, res) => {
  try {
    const userId = req.userId;
    const { materialId } = req.params;
    const { stockOnHand, lastPurchasePrice } = req.body;

    const profile = await BusinessProfile.findOne({ userId, isDeleted: false });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Business profile not found'
      });
    }

    const material = profile.rawMaterials.id(materialId);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    if (stockOnHand !== undefined) material.stockOnHand = stockOnHand;
    if (lastPurchasePrice !== undefined) material.currentPrice = lastPurchasePrice;
    if (stockOnHand !== undefined || lastPurchasePrice !== undefined) {
      material.lastPurchase = new Date();
    }

    await profile.save();

    res.json({
      success: true,
      message: 'Material stock updated successfully',
      data: {
        name: material.name,
        stockOnHand: material.stockOnHand,
        stockStatus: material.stockOnHand <= material.reorderLevel ? 'critical' : 'healthy'
      }
    });

  } catch (error) {
    console.error('Error in updateMaterialStock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update material stock',
      error: error.message
    });
  }
};

// ==========================================
// GOAL MANAGEMENT
// ==========================================

/**
 * Get goals overview
 */
export const getGoalsOverview = async (req, res) => {
  try {
    const userId = req.userId;
    const { category, status } = req.query;

    const query = { userId, isDeleted: false };
    if (category) query.category = category;
    if (status) query.status = status;

    const goals = await Goal.find(query)
      .sort({ priority: -1, endDate: 1 });

    // Calculate summary
    const summary = {
      total: goals.length,
      notStarted: goals.filter(g => g.status === 'not_started').length,
      inProgress: goals.filter(g => g.status === 'in_progress').length,
      onTrack: goals.filter(g => g.status === 'on_track').length,
      atRisk: goals.filter(g => ['at_risk', 'behind'].includes(g.status)).length,
      completed: goals.filter(g => g.status === 'completed').length,
      overdue: goals.filter(g => g.isOverdue).length
    };

    // Group by category
    const byCategory = goals.reduce((acc, goal) => {
      acc[goal.category] = acc[goal.category] || [];
      acc[goal.category].push(formatGoalForResponse(goal));
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        summary,
        goals: goals.map(formatGoalForResponse),
        byCategory
      }
    });

  } catch (error) {
    console.error('Error in getGoalsOverview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve goals',
      error: error.message
    });
  }
};

/**
 * Get goal details
 */
export const getGoalDetails = async (req, res) => {
  try {
    const userId = req.userId;
    const { goalId } = req.params;

    const goal = await Goal.findOne({ _id: goalId, userId, isDeleted: false });
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    // Get linked ledger if any
    let linkedLedger = null;
    if (goal.linkedLedger) {
      linkedLedger = await Ledger.findById(goal.linkedLedger);
    }

    res.json({
      success: true,
      data: {
        goal: formatGoalForResponse(goal),
        linkedLedger,
        milestones: goal.milestones || [],
        actionItems: goal.actionItems || []
      }
    });

  } catch (error) {
    console.error('Error in getGoalDetails:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve goal details',
      error: error.message
    });
  }
};

/**
 * Create new goal
 */
export const createGoal = async (req, res) => {
  try {
    const userId = req.userId;
    const goalData = req.body;

    // Validate required fields
    if (!goalData.title || !goalData.category || !goalData.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Title, category, and end date are required'
      });
    }

    // Set initial status
    goalData.status = goalData.status || 'not_started';
    goalData.startDate = goalData.startDate || new Date();

    const goal = await Goal.create({
      ...goalData,
      userId
    });

    res.status(201).json({
      success: true,
      message: 'Goal created successfully',
      data: formatGoalForResponse(goal)
    });

  } catch (error) {
    console.error('Error in createGoal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create goal',
      error: error.message
    });
  }
};

/**
 * Update goal
 */
export const updateGoal = async (req, res) => {
  try {
    const userId = req.userId;
    const { goalId } = req.params;
    const updates = req.body;

    const goal = await Goal.findOne({ _id: goalId, userId, isDeleted: false });
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    // Handle progress update
    if (updates.currentValue !== undefined) {
      await goal.updateProgress(updates.currentValue, updates.progressNotes);
    } else {
      Object.assign(goal, updates);
      await goal.save();
    }

    res.json({
      success: true,
      message: 'Goal updated successfully',
      data: formatGoalForResponse(goal)
    });

  } catch (error) {
    console.error('Error in updateGoal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update goal',
      error: error.message
    });
  }
};

/**
 * Add action item to goal
 */
export const addActionItem = async (req, res) => {
  try {
    const userId = req.userId;
    const { goalId } = req.params;
    const actionData = req.body;

    if (!actionData.title) {
      return res.status(400).json({
        success: false,
        message: 'Action item title is required'
      });
    }

    const goal = await Goal.findOne({ _id: goalId, userId, isDeleted: false });
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    await goal.addActionItem(actionData);

    res.status(201).json({
      success: true,
      message: 'Action item added successfully'
    });

  } catch (error) {
    console.error('Error in addActionItem:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add action item',
      error: error.message
    });
  }
};

/**
 * Update action item
 */
export const updateActionItem = async (req, res) => {
  try {
    const userId = req.userId;
    const { goalId, actionId } = req.params;
    const updates = req.body;

    const goal = await Goal.findOne({ _id: goalId, userId, isDeleted: false });
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    const result = await goal.updateActionItem(actionId, updates);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Action item not found'
      });
    }

    res.json({
      success: true,
      message: 'Action item updated successfully'
    });

  } catch (error) {
    console.error('Error in updateActionItem:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update action item',
      error: error.message
    });
  }
};

/**
 * Add milestone to goal
 */
export const addMilestone = async (req, res) => {
  try {
    const userId = req.userId;
    const { goalId } = req.params;
    const milestoneData = req.body;

    if (!milestoneData.title) {
      return res.status(400).json({
        success: false,
        message: 'Milestone title is required'
      });
    }

    const goal = await Goal.findOne({ _id: goalId, userId, isDeleted: false });
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    await goal.addMilestone(milestoneData);

    res.status(201).json({
      success: true,
      message: 'Milestone added successfully'
    });

  } catch (error) {
    console.error('Error in addMilestone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add milestone',
      error: error.message
    });
  }
};

/**
 * Complete milestone
 */
export const completeMilestone = async (req, res) => {
  try {
    const userId = req.userId;
    const { goalId, milestoneId } = req.params;

    const goal = await Goal.findOne({ _id: goalId, userId, isDeleted: false });
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    const result = await goal.completeMilestone(milestoneId);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }

    res.json({
      success: true,
      message: 'Milestone completed successfully',
      data: {
        progress: goal.progress,
        status: goal.status
      }
    });

  } catch (error) {
    console.error('Error in completeMilestone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete milestone',
      error: error.message
    });
  }
};

/**
 * Delete goal
 */
export const deleteGoal = async (req, res) => {
  try {
    const userId = req.userId;
    const { goalId } = req.params;

    const goal = await Goal.findOne({ _id: goalId, userId, isDeleted: false });
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    goal.isDeleted = true;
    goal.deletedAt = new Date();
    await goal.save();

    res.json({
      success: true,
      message: 'Goal deleted successfully'
    });

  } catch (error) {
    console.error('Error in deleteGoal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete goal',
      error: error.message
    });
  }
};

// ==========================================
// STRATEGY DASHBOARD
// ==========================================

/**
 * Get complete strategy dashboard
 */
export const getStrategyDashboard = async (req, res) => {
  try {
    const userId = req.userId;

    // Get business profile
    const profile = await BusinessProfile.findOne({ userId, isDeleted: false });

    // Get goals summary
    const goalSummary = await Goal.getSummary(userId);

    // Get active goals
    const activeGoals = await Goal.getActiveGoals(userId, { limit: 5 });

    // Get overdue goals
    const overdueGoals = await Goal.getOverdue(userId);

    // Get goals needing review
    const reviewGoals = await Goal.needingReview(userId);

    // Build dashboard
    const dashboard = {
      businessProfile: {
        isSetup: !!profile,
        isComplete: profile?.isComplete || false,
        productCount: profile?.products?.length || 0,
        supplierCount: profile?.suppliers?.length || 0,
        lastUpdated: profile?.lastUpdated
      },
      pricing: {
        avgMargin: profile?.averageMargin || 0,
        needsReview: profile?.products?.filter(p =>
          (p.currentMargin || 0) < (p.targetMargin || 20) * 0.8
        ).length || 0
      },
      procurement: {
        reorderAlerts: profile?.rawMaterials?.filter(m =>
          m.stockOnHand <= m.reorderLevel
        ).length || 0
      },
      goals: {
        total: goalSummary.total,
        active: goalSummary.active,
        completed: goalSummary.completed,
        atRisk: goalSummary.atRisk,
        overdue: overdueGoals.length,
        needsReview: reviewGoals.length
      },
      recommendations: []
    };

    // Generate recommendations
    if (dashboard.pricing.needsReview > 0) {
      dashboard.recommendations.push({
        type: 'pricing',
        priority: 'high',
        title: 'Review Pricing',
        message: `${dashboard.pricing.needsReview} products have margins below target`
      });
    }

    if (dashboard.procurement.reorderAlerts > 0) {
      dashboard.recommendations.push({
        type: 'procurement',
        priority: 'urgent',
        title: 'Reorder Materials',
        message: `${dashboard.procurement.reorderAlerts} materials need reordering`
      });
    }

    if (dashboard.goals.overdue > 0) {
      dashboard.recommendations.push({
        type: 'goals',
        priority: 'urgent',
        title: 'Overdue Goals',
        message: `${dashboard.goals.overdue} goals are past their deadline`
      });
    }

    if (dashboard.goals.atRisk > 0) {
      dashboard.recommendations.push({
        type: 'goals',
        priority: 'high',
        title: 'At-Risk Goals',
        message: `${dashboard.goals.atRisk} goals need attention`
      });
    }

    if (!dashboard.businessProfile.isSetup) {
      dashboard.recommendations.push({
        type: 'setup',
        priority: 'high',
        title: 'Complete Business Profile',
        message: 'Set up your business profile to enable strategy features'
      });
    }

    res.json({
      success: true,
      data: {
        summary: dashboard,
        activeGoals: activeGoals.slice(0, 5).map(formatGoalForResponse),
        recentActivity: {
          goalsUpdated: activeGoals.length,
          lastReview: profile?.lastPriceReview
        }
      }
    });

  } catch (error) {
    console.error('Error in getStrategyDashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve strategy dashboard',
      error: error.message
    });
  }
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Generate pricing recommendations for a product
 */
function generatePricingRecommendations(product) {
  const recommendations = [];
  const margin = product.currentMargin || 0;
  const target = product.targetMargin || 20;

  if (margin < target * 0.5) {
    recommendations.push({
      type: 'critical',
      message: `Margin is critically low at ${margin.toFixed(1)}%. Consider price increase.`,
      suggestedAction: 'increase_price'
    });
  } else if (margin < target * 0.8) {
    recommendations.push({
      type: 'warning',
      message: `Margin is below target (${margin.toFixed(1)}% vs ${target}%).`,
      suggestedAction: 'review_pricing'
    });
  }

  if (product.competitorPrice && product.currentPrice > product.competitorPrice * 1.2) {
    recommendations.push({
      type: 'info',
      message: `Price is significantly above competitor (${product.competitorName || 'market'}).`,
      suggestedAction: 'review_competitive_position'
    });
  }

  if (product.demandLevel === 'high' && product.priceElasticity === 'inelastic') {
    recommendations.push({
      type: 'opportunity',
      message: 'High demand with inelastic pricing - consider price increase.',
      suggestedAction: 'increase_price'
    });
  }

  return recommendations;
}

/**
 * Generate procurement recommendations
 */
function generateProcurementRecommendations(profile) {
  const recommendations = [];

  // Check for materials needing reorder
  const lowStock = profile.rawMaterials?.filter(m =>
    m.stockOnHand <= m.reorderLevel * 1.5
  ) || [];

  if (lowStock.length > 0) {
    recommendations.push({
      type: 'urgent',
      title: 'Reorder Soon',
      message: `${lowStock.length} materials are at or near reorder level`,
      items: lowStock.map(m => m.name)
    });
  }

  // Check for suppliers with poor ratings
  const poorSuppliers = profile.suppliers?.filter(s =>
    s.rating < 3 || s.reliability === 'low'
  ) || [];

  if (poorSuppliers.length > 0) {
    recommendations.push({
      type: 'warning',
      title: 'Review Supplier Performance',
      message: `${poorSuppliers.length} supplier(s) have low ratings or reliability`,
      items: poorSuppliers.map(s => s.name)
    });
  }

  // Suggest bulk purchasing opportunities
  const bulkOpportunities = profile.suppliers
    ?.filter(s => s.bulkDiscounts?.length > 0)
    .map(s => ({
      supplier: s.name,
      discounts: s.bulkDiscounts
    })) || [];

  if (bulkOpportunities.length > 0) {
    recommendations.push({
      type: 'opportunity',
      title: 'Bulk Discount Opportunities',
      message: `${bulkOpportunities.length} supplier(s) offer volume discounts`,
      items: bulkOpportunities
    });
  }

  return recommendations;
}

/**
 * Format goal for API response
 */
function formatGoalForResponse(goal) {
  return {
    id: goal._id,
    title: goal.title,
    description: goal.description,
    category: goal.category,
    goalType: goal.goalType,
    targetValue: goal.targetValue,
    currentValue: goal.currentValue,
    unit: goal.unit,
    progress: goal.progress,
    status: goal.status,
    priority: goal.priority,
    importance: goal.importance,
    startDate: goal.startDate,
    endDate: goal.endDate,
    daysRemaining: goal.daysRemaining,
    timeProgress: goal.timeProgress,
    isOverdue: goal.isOverdue,
    milestoneCount: goal.milestones?.length || 0,
    completedMilestones: goal.milestones?.filter(m => m.completed).length || 0,
    actionItemCount: goal.actionItems?.length || 0,
    isPinned: goal.isPinned,
    tags: goal.tags || []
  };
}

export default {
  // Pricing
  getPricingOverview,
  getProductPricing,
  updateProductPrice,
  addProduct,

  // Procurement
  getProcurementOverview,
  getSupplierDetails,
  addSupplier,
  updateMaterialStock,

  // Goals
  getGoalsOverview,
  getGoalDetails,
  createGoal,
  updateGoal,
  addActionItem,
  updateActionItem,
  addMilestone,
  completeMilestone,
  deleteGoal,

  // Dashboard
  getStrategyDashboard
};
