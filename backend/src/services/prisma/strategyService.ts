// @ts-nocheck
/**
 * Strategy Service - Prisma (PostgreSQL)
 * Mirrors Mongoose strategyController functionality
 */

import { prisma } from '../../config/prisma';

// ==========================================
// PRICING STRATEGY
// ==========================================

export const strategyService = {
  /**
   * Get pricing overview
   */
  async getPricingOverview(userId) {
    const profile = await prisma.businessProfile.findFirst({
      where: { userId, isDeleted: false },
      include: {
        products: true
      }
    });

    if (!profile) {
      return {
        summary: {
          totalProducts: 0,
          healthyMargins: 0,
          lowMargins: 0,
          criticalMargins: 0,
          averageMargin: 0,
          pricingStrategy: null,
          lastPriceReview: null
        },
        products: [],
        recommendations: [
          {
            type: 'setup',
            title: 'Set up Business Profile',
            message: 'Create a business profile to start tracking products and pricing'
          }
        ]
      };
    }

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
        id: product.id,
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

    return {
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
    };
  },

  /**
   * Get product pricing details
   */
  async getProductPricing(userId, productId) {
    const profile = await prisma.businessProfile.findFirst({
      where: { userId, isDeleted: false },
      include: {
        products: {
          where: { id: productId }
        }
      }
    });

    if (!profile) {
      throw new Error('Business profile not found');
    }

    const product = profile.products[0];
    if (!product) {
      throw new Error('Product not found');
    }

    // Calculate pricing scenarios
    const scenarios = [];
    const pricePoints = [
      { name: 'Current', price: product.currentPrice },
      { name: 'Target Margin', price: Math.round(product.cogs / (1 - (product.targetMargin || 20) / 100)) },
      { name: 'Competitor', price: product.competitorPrice || product.currentPrice }
    ];

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
          profitImpact: Math.round(diff * 100)
        });
      }
    });

    // Cost breakdown
    const breakdown = [
      { component: 'Raw Materials', amount: product.costRawMaterials || 0, percent: product.cogs > 0 ? Math.round(((product.costRawMaterials || 0) / product.cogs) * 100) : 0 },
      { component: 'Labor', amount: product.costLabor || 0, percent: product.cogs > 0 ? Math.round(((product.costLabor || 0) / product.cogs) * 100) : 0 },
      { component: 'Packaging', amount: product.costPackaging || 0, percent: product.cogs > 0 ? Math.round(((product.costPackaging || 0) / product.cogs) * 100) : 0 },
      { component: 'Overhead', amount: product.costOverhead || 0, percent: product.cogs > 0 ? Math.round(((product.costOverhead || 0) / product.cogs) * 100) : 0 }
    ].sort((a, b) => b.amount - a.amount);

    return {
      product: {
        id: product.id,
        name: product.name,
        category: product.category,
        currentPrice: product.currentPrice,
        cogs: product.cogs,
        currentMargin: product.currentMargin,
        targetMargin: product.targetMargin,
        competitorPrice: product.competitorPrice
      },
      scenarios: scenarios.sort((a, b) => b.margin - a.margin),
      costBreakdown: breakdown,
      recommendations: this.generatePricingRecommendations(product)
    };
  },

  /**
   * Update product price
   */
  async updateProductPrice(userId, productId, { currentPrice, reason }) {
    if (!currentPrice || currentPrice <= 0) {
      throw new Error('Valid price is required');
    }

    const profile = await prisma.businessProfile.findFirst({
      where: { userId, isDeleted: false },
      include: {
        products: {
          where: { id: productId }
        }
      }
    });

    if (!profile || !profile.products[0]) {
      throw new Error('Product not found');
    }

    // Recalculate margin
    const product = profile.products[0];
    const newMargin = product.cogs > 0
      ? ((currentPrice - product.cogs) / currentPrice) * 100
      : 0;

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        currentPrice,
        currentMargin: newMargin,
        updatedAt: new Date()
      }
    });

    // Update business profile lastUpdated
    await prisma.businessProfile.update({
      where: { id: profile.id },
      data: { lastUpdated: new Date() }
    });

    return {
      id: updated.id,
      name: updated.name,
      currentPrice: updated.currentPrice,
      newMargin: updated.currentMargin
    };
  },

  /**
   * Add new product
   */
  async addProduct(userId, productData) {
    if (!productData.name || !productData.currentPrice) {
      throw new Error('Product name and price are required');
    }

    let profile = await prisma.businessProfile.findFirst({
      where: { userId, isDeleted: false }
    });

    if (!profile) {
      profile = await prisma.businessProfile.create({
        data: { userId }
      });
    }

    const margin = productData.cogs > 0
      ? ((productData.currentPrice - productData.cogs) / productData.currentPrice) * 100
      : 0;

    const product = await prisma.product.create({
      data: {
        businessProfileId: profile.id,
        ...productData,
        cogs: productData.cogs || 0,
        currentMargin: margin
      }
    });

    await prisma.businessProfile.update({
      where: { id: profile.id },
      data: { lastUpdated: new Date() }
    });

    return {
      name: product.name,
      margin: product.currentMargin
    };
  },

  // ==========================================
  // PROCUREMENT & SUPPLIERS
  // ==========================================

  /**
   * Get procurement overview
   */
  async getProcurementOverview(userId) {
    const profile = await prisma.businessProfile.findFirst({
      where: { userId, isDeleted: false },
      include: {
        suppliers: {
          include: {
            products: true,
            bulkDiscounts: true
          }
        },
        rawMaterials: true
      }
    });

    if (!profile) {
      return {
        summary: {
          totalSuppliers: 0,
          activeSuppliers: 0,
          totalMaterials: 0,
          needsReorder: 0
        },
        suppliers: [],
        materials: [],
        reorderAlerts: [],
        recommendations: [
          {
            type: 'setup',
            title: 'Set up Business Profile',
            message: 'Create a business profile to start tracking suppliers and materials'
          }
        ]
      };
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

      const overallScore = Math.round((avgRating / 5 * 0.6 + reliabilityScore / 100 * 0.4) * 100);

      return {
        id: supplier.id,
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
    }).sort((a, b) => b.overallScore - a.overallScore);

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

    const needsReorder = stockAnalysis.filter(m => m.stockStatus === 'critical');

    return {
      summary: {
        totalSuppliers: suppliers.length,
        activeSuppliers: suppliers.filter(s => s.isActive).length,
        totalMaterials: rawMaterials.length,
        needsReorder: needsReorder.length
      },
      suppliers: supplierAnalysis,
      materials: stockAnalysis.sort((a, b) => a.daysOfStock - b.daysOfStock),
      reorderAlerts: needsReorder,
      recommendations: this.generateProcurementRecommendations(profile)
    };
  },

  /**
   * Get supplier details
   */
  async getSupplierDetails(userId, supplierId) {
    const profile = await prisma.businessProfile.findFirst({
      where: { userId, isDeleted: false },
      include: {
        suppliers: {
          where: { id: supplierId },
          include: {
            products: true,
            bulkDiscounts: true
          }
        }
      }
    });

    if (!profile || !profile.suppliers[0]) {
      throw new Error('Supplier not found');
    }

    const supplier = profile.suppliers[0];

    const discountTiers = supplier.bulkDiscounts?.map(d => ({
      minQty: d.minQty,
      discountPercent: d.discountPercent,
      description: d.description,
      effectivePrice: supplier.products[0]?.unitPrice
        ? Math.round(supplier.products[0].unitPrice * (1 - d.discountPercent / 100))
        : null
    })) || [];

    return {
      supplier: {
        id: supplier.id,
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
    };
  },

  /**
   * Add supplier
   */
  async addSupplier(userId, supplierData) {
    if (!supplierData.name) {
      throw new Error('Supplier name is required');
    }

    let profile = await prisma.businessProfile.findFirst({
      where: { userId, isDeleted: false }
    });

    if (!profile) {
      profile = await prisma.businessProfile.create({
        data: { userId }
      });
    }

    await prisma.supplier.create({
      data: {
        businessProfileId: profile.id,
        ...supplierData
      }
    });

    await prisma.businessProfile.update({
      where: { id: profile.id },
      data: { lastUpdated: new Date() }
    });

    return { message: 'Supplier added successfully' };
  },

  /**
   * Update material stock
   */
  async updateMaterialStock(userId, materialId, { stockOnHand, lastPurchasePrice }) {
    const profile = await prisma.businessProfile.findFirst({
      where: { userId, isDeleted: false },
      include: {
        rawMaterials: {
          where: { id: materialId }
        }
      }
    });

    if (!profile || !profile.rawMaterials[0]) {
      throw new Error('Material not found');
    }

    const updateData = {};
    if (stockOnHand !== undefined) {
      updateData.stockOnHand = stockOnHand;
    }
    if (lastPurchasePrice !== undefined) {
      updateData.currentPrice = lastPurchasePrice;
    }
    if (stockOnHand !== undefined || lastPurchasePrice !== undefined) {
      updateData.lastPurchase = new Date();
    }

    const updated = await prisma.rawMaterial.update({
      where: { id: materialId },
      data: updateData
    });

    return {
      name: updated.name,
      stockOnHand: updated.stockOnHand,
      stockStatus: updated.stockOnHand <= updated.reorderLevel ? 'critical' : 'healthy'
    };
  },

  // ==========================================
  // GOAL MANAGEMENT
  // ==========================================

  /**
   * Get goals overview
   */
  async getGoalsOverview(userId, { category, status } = {}) {
    const where = {
      userId,
      isDeleted: false
    };
    if (category) where.category = category;
    if (status) where.status = status;

    const goals = await prisma.goal.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { endDate: 'asc' }]
    });

    // Calculate summary
    const summary = {
      total: goals.length,
      notStarted: goals.filter(g => g.status === 'NOT_STARTED').length,
      inProgress: goals.filter(g => g.status === 'IN_PROGRESS').length,
      onTrack: goals.filter(g => g.status === 'ON_TRACK').length,
      atRisk: goals.filter(g => ['AT_RISK', 'BEHIND'].includes(g.status)).length,
      completed: goals.filter(g => g.status === 'COMPLETED').length,
      overdue: goals.filter(g => new Date() > new Date(g.endDate) && g.status !== 'COMPLETED').length
    };

    // Group by category
    const byCategory = goals.reduce((acc, goal) => {
      acc[goal.category] = acc[goal.category] || [];
      acc[goal.category].push(this.formatGoalForResponse(goal));
      return acc;
    }, {});

    return {
      summary,
      goals: goals.map(g => this.formatGoalForResponse(g)),
      byCategory
    };
  },

  /**
   * Get goal details
   */
  async getGoalDetails(userId, goalId) {
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId, isDeleted: false },
      include: {
        milestones: true,
        actionItems: true
      }
    });

    if (!goal) {
      throw new Error('Goal not found');
    }

    return {
      goal: this.formatGoalForResponse(goal),
      milestones: goal.milestones || [],
      actionItems: goal.actionItems || []
    };
  },

  /**
   * Create goal
   */
  async createGoal(userId, goalData) {
    if (!goalData.title || !goalData.category || !goalData.endDate) {
      throw new Error('Title, category, and end date are required');
    }

    const goal = await prisma.goal.create({
      data: {
        userId,
        ...goalData,
        status: goalData.status || 'NOT_STARTED',
        startDate: goalData.startDate || new Date()
      }
    });

    return this.formatGoalForResponse(goal);
  },

  /**
   * Update goal
   */
  async updateGoal(userId, goalId, updates) {
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId, isDeleted: false }
    });

    if (!goal) {
      throw new Error('Goal not found');
    }

    let newStatus = goal.status;
    let newProgress = goal.progress;

    // Handle progress update
    if (updates.currentValue !== undefined) {
      newProgress = goal.targetValue > 0
        ? Math.min(100, Math.round((updates.currentValue / goal.targetValue) * 100))
        : 0;

      // Auto-update status based on progress
      if (newProgress >= 100) {
        newStatus = 'COMPLETED';
      } else if (goal.status === 'NOT_STARTED') {
        newStatus = 'IN_PROGRESS';
      }

      updates.currentValue = updates.currentValue;
      updates.progress = newProgress;
      updates.status = newStatus;
    }

    const updated = await prisma.goal.update({
      where: { id: goalId },
      data: {
        ...updates,
        lastProgressUpdate: updates.currentValue !== undefined ? new Date() : goal.lastProgressUpdate
      }
    });

    return this.formatGoalForResponse(updated);
  },

  /**
   * Add action item
   */
  async addActionItem(userId, goalId, actionData) {
    if (!actionData.title) {
      throw new Error('Action item title is required');
    }

    await prisma.actionItem.create({
      data: {
        goalId,
        ...actionData
      }
    });

    return { message: 'Action item added successfully' };
  },

  /**
   * Update action item
   */
  async updateActionItem(userId, goalId, actionId, updates) {
    const actionItem = await prisma.actionItem.findFirst({
      where: { id: actionId, goalId }
    });

    if (!actionItem) {
      throw new Error('Action item not found');
    }

    await prisma.actionItem.update({
      where: { id: actionId },
      data: {
        ...updates,
        completedAt: updates.status === 'completed' && !actionItem.completedAt ? new Date() : actionItem.completedAt
      }
    });

    return { message: 'Action item updated successfully' };
  },

  /**
   * Add milestone
   */
  async addMilestone(userId, goalId, milestoneData) {
    if (!milestoneData.title) {
      throw new Error('Milestone title is required');
    }

    await prisma.milestone.create({
      data: {
        goalId,
        ...milestoneData
      }
    });

    return { message: 'Milestone added successfully' };
  },

  /**
   * Complete milestone
   */
  async completeMilestone(userId, goalId, milestoneId) {
    const milestone = await prisma.milestone.findFirst({
      where: { id: milestoneId, goalId }
    });

    if (!milestone) {
      throw new Error('Milestone not found');
    }

    await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        completed: true,
        completedAt: new Date()
      }
    });

    // Update goal progress based on completed milestones
    const goal = await prisma.goal.findFirst({
      where: { id: goalId },
      include: { milestones: true }
    });

    if (goal) {
      const totalMilestones = goal.milestones.length;
      const completedMilestones = goal.milestones.filter(m => m.completed).length;
      const newProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

      await prisma.goal.update({
        where: { id: goalId },
        data: { progress: newProgress }
      });

      return {
        progress: newProgress,
        status: goal.status
      };
    }

    return {};
  },

  /**
   * Delete goal
   */
  async deleteGoal(userId, goalId) {
    await prisma.goal.update({
      where: { id: goalId, userId },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    return { message: 'Goal deleted successfully' };
  },

  /**
   * Get strategy dashboard
   */
  async getStrategyDashboard(userId) {
    // Get business profile
    const profile = await prisma.businessProfile.findFirst({
      where: { userId, isDeleted: false },
      include: {
        products: true,
        suppliers: true,
        rawMaterials: true
      }
    });

    // Get goals summary
    const goals = await prisma.goal.findMany({
      where: { userId, isDeleted: false }
    });

    const summary = {
      total: goals.length,
      active: goals.filter(g => !['COMPLETED', 'CANCELLED', 'PAUSED'].includes(g.status)).length,
      completed: goals.filter(g => g.status === 'COMPLETED').length,
      atRisk: goals.filter(g => ['AT_RISK', 'BEHIND'].includes(g.status)).length,
      overdue: goals.filter(g => new Date() > new Date(g.endDate) && g.status !== 'COMPLETED').length
    };

    const activeGoals = goals
      .filter(g => !['COMPLETED', 'CANCELLED', 'PAUSED'].includes(g.status))
      .slice(0, 5)
      .map(g => this.formatGoalForResponse(g));

    const dashboard = {
      businessProfile: {
        isSetup: !!profile,
        isComplete: profile?.isComplete || false,
        productCount: profile?.products?.length || 0,
        supplierCount: profile?.suppliers?.length || 0,
        lastUpdated: profile?.lastUpdated
      },
      pricing: {
        avgMargin: profile?.products?.length > 0
          ? profile.products.reduce((sum, p) => sum + (p.currentMargin || 0), 0) / profile.products.length
          : 0,
        needsReview: profile?.products?.filter(p => (p.currentMargin || 0) < (p.targetMargin || 20) * 0.8).length || 0
      },
      procurement: {
        reorderAlerts: profile?.rawMaterials?.filter(m => (m.stockOnHand || 0) <= (m.reorderLevel || 0)).length || 0
      },
      goals: {
        ...summary,
        needsReview: goals.filter(g => new Date() > new Date(g.nextReviewDate || g.createdAt)).length
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

    if (!dashboard.businessProfile.isSetup) {
      dashboard.recommendations.push({
        type: 'setup',
        priority: 'high',
        title: 'Complete Business Profile',
        message: 'Set up your business profile to enable strategy features'
      });
    }

    return {
      summary: dashboard,
      activeGoals,
      recentActivity: {
        goalsUpdated: activeGoals.length,
        lastReview: profile?.lastPriceReview
      }
    };
  },

  // ==========================================
  // HELPER METHODS
  // ==========================================

  formatGoalForResponse(goal) {
    const now = new Date();
    const endDate = new Date(goal.endDate);
    const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    const startDate = new Date(goal.startDate);
    const timeProgress = Math.min(100, Math.round(((now - startDate) / (endDate - startDate)) * 100));

    return {
      id: goal.id,
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
      daysRemaining,
      timeProgress,
      isOverdue: now > endDate && goal.status !== 'COMPLETED',
      milestoneCount: 0, // Would need to count relations
      completedMilestones: 0,
      actionItemCount: 0,
      isPinned: goal.isPinned,
      tags: goal.tags || []
    };
  },

  generatePricingRecommendations(product) {
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

    return recommendations;
  },

  generateProcurementRecommendations(profile) {
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

    return recommendations;
  }
};

export default strategyService;
