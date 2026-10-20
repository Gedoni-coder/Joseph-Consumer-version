/**
 * Prisma-based Interpretation Service
 * Handles insights generation and interpretation using Prisma/PostgreSQL
 */

import { prisma } from '../../config/prisma.js';

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function formatTimeAgo(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

function getSeverityIcon(severity) {
  const icons = {
    critical: '🔴',
    high: '🟠',
    warning: '🟡',
    info: '🔵',
    success: '🟢'
  };
  return icons[severity] || '⚪';
}

// ==========================================
// INSIGHTS
// ==========================================

export const interpretationService = {
  /**
   * Get all insights for user
   */
  async getInsights(userId, options = {}) {
    const where = { userId };
    if (options.category) where.category = options.category;
    if (options.severity) where.severity = options.severity;
    if (options.actionable === true) where.isActionable = true;
    if (options.actionStatus) {
      where.actionStatus = options.actionStatus;
    }

    const insights = await prisma.insight.findMany({
      where,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: options.limit || 20
    });

    return insights.map(i => ({
      id: i.id,
      title: i.title,
      body: i.body,
      category: i.category,
      severity: i.severity,
      severityIcon: getSeverityIcon(i.severity),
      isActionable: i.isActionable,
      recommendedAction: i.recommendedAction,
      actionStatus: i.status,
      sourceType: i.sourceType,
      sourceId: i.sourceId,
      isPinned: i.isPinned,
      isRead: i.isRead,
      timeAgo: formatTimeAgo(i.createdAt),
      validUntil: i.validUntil
    }));
  },

  /**
   * Get actionable insights
   */
  async getActionableInsights(userId, options = {}) {
    const insights = await prisma.insight.findMany({
      where: {
        userId,
        isActionable: true,
        status: options.actionStatus || 'new'
      },
      orderBy: [{ severity: 'desc' }, { createdAt: 'asc' }],
      take: options.limit || 20
    });

    return insights.map(i => ({
      id: i.id,
      title: i.title,
      body: i.body,
      severity: i.severity,
      severityIcon: getSeverityIcon(i.severity),
      recommendedAction: i.recommendedAction,
      actionStatus: i.status,
      urgency: this.calculateUrgency(i),
      timeAgo: formatTimeAgo(i.createdAt)
    }));
  },

  /**
   * Get insights by category
   */
  async getInsightsByCategory(userId, category, options = {}) {
    const insights = await prisma.insight.findMany({
      where: { userId, category },
      orderBy: { createdAt: 'desc' },
      take: options.limit || 20
    });

    return insights.map(i => ({
      id: i.id,
      title: i.title,
      body: i.body,
      severity: i.severity,
      severityIcon: getSeverityIcon(i.severity),
      timeAgo: formatTimeAgo(i.createdAt)
    }));
  },

  /**
   * Get insights by severity
   */
  async getInsightsBySeverity(userId, severity, options = {}) {
    const insights = await prisma.insight.findMany({
      where: { userId, severity },
      orderBy: { createdAt: 'desc' },
      take: options.limit || 20
    });

    return insights.map(i => ({
      id: i.id,
      title: i.title,
      body: i.body,
      category: i.category,
      timeAgo: formatTimeAgo(i.createdAt)
    }));
  },

  /**
   * Get insight counts by status
   */
  async getInsightCounts(userId) {
    const insights = await prisma.insight.findMany({
      where: { userId }
    });

    return {
      total: insights.length,
      new: insights.filter(i => i.status === 'new').length,
      pending: insights.filter(i => i.status === 'pending').length,
      inProgress: insights.filter(i => i.status === 'in_progress').length,
      completed: insights.filter(i => i.status === 'completed').length,
      dismissed: insights.filter(i => i.status === 'dismissed').length,
      unread: insights.filter(i => !i.isRead).length,
      actionable: insights.filter(i => i.isActionable && i.status !== 'completed').length,
      pinned: insights.filter(i => i.isPinned).length
    };
  },

  /**
   * Get insight by ID
   */
  async getInsightById(userId, insightId) {
    const insight = await prisma.insight.findFirst({
      where: { id: insightId, userId }
    });

    if (!insight) return null;

    // Mark as read
    await prisma.insight.update({
      where: { id: insightId },
      data: { isRead: true }
    });

    return {
      id: insight.id,
      title: insight.title,
      body: insight.body,
      category: insight.category,
      severity: insight.severity,
      severityIcon: getSeverityIcon(insight.severity),
      isActionable: insight.isActionable,
      recommendedAction: insight.recommendedAction,
      actionStatus: insight.status,
      sourceType: insight.sourceType,
      sourceId: insight.sourceId,
      isPinned: insight.isPinned,
      isRead: true,
      validUntil: insight.validUntil,
      createdAt: insight.createdAt,
      updatedAt: insight.updatedAt
    };
  },

  /**
   * Create insight
   */
  async createInsight(userId, insightData) {
    return await prisma.insight.create({
      data: {
        userId,
        ...insightData
      }
    });
  },

  /**
   * Update insight action status
   */
  async updateInsightAction(userId, insightId, status) {
    return await prisma.insight.update({
      where: { id: insightId, userId },
      data: { status }
    });
  },

  /**
   * Toggle insight pin
   */
  async toggleInsightPin(userId, insightId) {
    const insight = await prisma.insight.findFirst({
      where: { id: insightId, userId }
    });

    if (!insight) throw new Error('Insight not found');

    const updated = await prisma.insight.update({
      where: { id: insightId },
      data: { isPinned: !insight.isPinned }
    });

    return { isPinned: updated.isPinned };
  },

  /**
   * Get interpretation overview
   */
  async getInterpretationOverview(userId) {
    const [counts, recentInsights, actionableInsights] = await Promise.all([
      this.getInsightCounts(userId),
      prisma.insight.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.insight.findMany({
        where: { userId, isActionable: true, status: 'new' },
        orderBy: [{ severity: 'desc' }, { createdAt: 'asc' }],
        take: 3
      })
    ]);

    // Get overdue insights (created more than 7 days ago, still pending)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const overdueInsights = await prisma.insight.findMany({
      where: {
        userId,
        isActionable: true,
        status: { in: ['new', 'pending'] },
        createdAt: { lt: sevenDaysAgo }
      },
      orderBy: { createdAt: 'asc' }
    });

    return {
      counts,
      recentInsights: recentInsights.map(i => ({
        id: i.id,
        title: i.title,
        severity: i.severity,
        severityIcon: getSeverityIcon(i.severity),
        timeAgo: formatTimeAgo(i.createdAt),
        isActionable: i.isActionable
      })),
      actionableInsights: actionableInsights.map(i => ({
        id: i.id,
        title: i.title,
        severity: i.severity,
        recommendedAction: i.recommendedAction
      })),
      overdueInsights: overdueInsights.map(i => ({
        id: i.id,
        title: i.title,
        severity: i.severity,
        daysOverdue: Math.floor((Date.now() - new Date(i.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      }))
    };
  },

  /**
   * Generate insights from economic data
   */
  async generateInsightsFromEconomicData(userId) {
    // Get recent economic news
    const recentNews = await prisma.economicNews.findMany({
      where: {
        isActive: true,
        publishedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      },
      orderBy: { publishedAt: 'desc' }
    });

    const newInsights = [];

    for (const news of recentNews) {
      // Check if insight already exists
      const existing = await prisma.insight.findFirst({
        where: {
          userId,
          sourceType: 'economic_news',
          sourceId: news.id
        }
      });

      if (!existing) {
        const insight = await prisma.insight.create({
          data: {
            userId,
            title: news.title,
            body: news.body || news.summary,
            category: news.category || 'market',
            severity: news.severity === 'urgent' ? 'high' : news.severity === 'success' ? 'success' : 'info',
            isActionable: news.impactLevel === 'high',
            recommendedAction: this.generateActionFromNews(news),
            sourceType: 'economic_news',
            sourceId: news.id,
            status: 'new'
          }
        });
        newInsights.push(insight);
      }
    }

    return newInsights;
  },

  /**
   * Get economic indicators for interpretation
   */
  async getEconomicIndicators() {
    return await prisma.economicIndicator.findMany({
      where: { isActive: true },
      orderBy: { category: 'asc' }
    });
  },

  /**
   * Get macro economic interpretation
   */
  async getMacroEconomicInterpretation() {
    const indicators = await this.getEconomicIndicators();

    const keyIndicators = {
      inflation: indicators.find(i => i.code === 'INFLATION_RATE'),
      fxRate: indicators.find(i => i.code === 'CURRENCY_USD'),
      foodInflation: indicators.find(i => i.code === 'FOOD_INFLATION'),
      interestRate: indicators.find(i => i.code === 'INTEREST_RATE'),
      gdpGrowth: indicators.find(i => i.code === 'GDP_GROWTH_RATE')
    };

    const items = [];

    // Inflation
    if (keyIndicators.inflation) {
      const inflation = keyIndicators.inflation;
      items.push({
        icon: inflation.value >= 25 ? '🔴' : inflation.value >= 15 ? '🟠' : '🟢',
        label: 'Inflation Rate',
        value: `${inflation.value.toFixed(1)}%`,
        context: inflation.value >= 25 ? 'High inflation - protect margins' : 'Inflation manageable',
        trend: inflation.trend,
        recommendation: inflation.value >= 20 ? 'Review pricing strategy' : null
      });
    }

    // FX Rate
    if (keyIndicators.fxRate) {
      const fx = keyIndicators.fxRate;
      items.push({
        icon: fx.value >= 1600 ? '💱' : '💵',
        label: 'FX Rate (USD/NGN)',
        value: `₦${fx.value.toFixed(2)}/$`,
        context: fx.value >= 1600 ? 'Naira under pressure' : 'FX rate stable',
        trend: fx.trend,
        recommendation: fx.value >= 1600 ? 'Hedge currency risk' : null
      });
    }

    return {
      title: '🌍 Economic Overview',
      items,
      lastUpdated: indicators.reduce((latest, ind) =>
        ind.lastUpdated > latest ? ind.lastUpdated : latest, new Date())
    };
  },

  /**
   * Get micro economic interpretation (Finance)
   */
  async getMicroEconomicInterpretation(userId) {
    const ledgers = await prisma.ledger.findMany({
      where: { userId, isActive: true }
    });

    const items = [];

    const lifeLedger = ledgers.find(l => l.type === 'LIFE');
    const businessLedger = ledgers.find(l => l.type === 'BUSINESS');

    if (lifeLedger) {
      // Safe-to-Spend
      const remainingBudget = Math.max(0, (lifeLedger.monthlyBudget || 0) - lifeLedger.totalExpenses);
      items.push({
        icon: remainingBudget > 20000 ? '💚' : '💛',
        label: 'Safe-to-Spend',
        value: `₦${remainingBudget.toLocaleString()}`,
        context: remainingBudget > 20000 ? 'Healthy discretionary income' : 'Limited funds'
      });

      // Runway
      const runwayDays = lifeLedger.runwayDays || 0;
      items.push({
        icon: runwayDays >= 30 ? '✈️' : '⚠️',
        label: 'Runway',
        value: `${runwayDays} days`,
        context: runwayDays >= 30 ? 'Healthy runway' : 'Low runway - monitor spending'
      });
    }

    if (businessLedger) {
      items.push({
        icon: '🏢',
        label: 'Working Capital',
        value: `₦${businessLedger.workingCapital.toLocaleString()}`,
        context: `Available: ₦${businessLedger.availableCapital.toLocaleString()}`
      });
    }

    return {
      title: '📘 Financial Health',
      items,
      lastUpdated: new Date()
    };
  },

  // ==========================================
  // HELPER METHODS
  // ==========================================

  calculateUrgency(insight) {
    const hoursSinceCreation = (Date.now() - new Date(insight.createdAt).getTime()) / 3600000;

    if (insight.severity === 'critical') return 'urgent';
    if (insight.severity === 'high' && hoursSinceCreation > 24) return 'urgent';
    if (insight.severity === 'high' || hoursSinceCreation > 72) return 'high';
    return 'normal';
  },

  generateActionFromNews(news) {
    if (!news.impactDescription) return null;

    const actions = {
      scarcity_alert: 'Review inventory and consider alternative suppliers',
      packaging: 'Maintain current prices to improve margins',
      campus_trends: 'Prepare extra stock for resumption period',
      fuel: 'Factor fuel costs into delivery pricing',
      policy: 'Monitor for policy changes affecting operations'
    };

    return actions[news.category] || 'Review impact on your business';
  }
};

export default interpretationService;

// SR
