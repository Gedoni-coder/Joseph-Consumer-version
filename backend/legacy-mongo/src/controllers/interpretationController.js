/**
 * Interpretation Module Controller
 * Generates plain English insights from economic data
 */

import InterpretationRule from '../models/InterpretationRule.js';
import Insight from '../models/Insight.js';
import EconomicIndicator from '../models/EconomicIndicator.js';
import UserThresholdSettings from '../models/UserThresholdSettings.js';
import InsightTemplate from '../models/InsightTemplate.js';
import BusinessProfile from '../models/BusinessProfile.js';
import Ledger from '../models/Ledger.js';
import { HTTP_STATUS, LEDGER_TYPES } from '../config/constants.js';

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get indicator values formatted for interpretation
 */
async function getIndicatorValues(codes) {
  const indicators = await EconomicIndicator.find({
    code: { $in: codes },
    isActive: true,
    isDeleted: false
  });

  const values = {};
  indicators.forEach(ind => {
    values[ind.code] = {
      value: ind.value,
      formatted: ind.formattedValue,
      change: ind.change,
      changePercent: ind.changePercent,
      trend: ind.trend,
      unit: ind.unit,
      previous: ind.previous
    };
  });

  return values;
}

/**
 * Get all relevant indicator codes
 */
function getRelevantIndicatorCodes() {
  return [
    'INFLATION_RATE',
    'FOOD_INFLATION',
    'CORE_INFLATION_RATE',
    'CURRENCY_USD',
    'INTEREST_RATE',
    'GDP_GROWTH_RATE',
    'UNEMPLOYMENT_RATE',
    'INTERBANK_RATE',
    'FOREX_RESERVES'
  ];
}

// ==========================================
// MAIN CONTROLLERS
// ==========================================

/**
 * Get all insights for user
 */
export const getInsights = async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const { category, severity, actionable, actionStatus, limit = 20 } = req.query;

    const options = {
      limit: parseInt(limit),
      category,
      severity,
      actionRequired: actionable === 'true',
      actionStatus: actionStatus
    };

    const insights = await Insight.getActiveForUser(userId, options);

    // Add view tracking
    insights.forEach(insight => {
      if (!insight.viewedAt) {
        insight.markViewed();
      }
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: insights.length,
      insights: insights.map(i => ({
        id: i._id,
        title: i.title,
        body: i.body,
        category: i.category,
        severity: i.severity,
        severityIcon: i.severityIcon,
        insightType: i.insightType,
        affectedArea: i.affectedArea,
        impactLevel: i.impactLevel,
        action: i.actionRequired ? {
          text: i.actionText,
          priority: i.actionPriority,
          status: i.actionStatus,
          urgency: i.actionUrgency
        } : null,
        timeframe: i.timeframe,
        timeAgo: i.timeAgo,
        isPinned: i.isPinned,
        viewedAt: i.viewedAt
      }))
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get insights requiring action
 */
export const getActionableInsights = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { actionStatus = 'pending', limit = 20 } = req.query;

    const insights = await Insight.getActionable(userId, {
      actionStatus,
      limit: parseInt(limit)
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: insights.length,
      insights: insights.map(i => ({
        id: i._id,
        title: i.title,
        body: i.body,
        action: {
          text: i.actionText,
          priority: i.actionPriority,
          status: i.actionStatus,
          urgency: i.actionUrgency
        },
        timeAgo: i.timeAgo,
        timeframe: i.timeframe
      }))
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get insights by category
 */
export const getInsightsByCategory = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { category } = req.params;
    const { limit = 20 } = req.query;

    const insights = await Insight.getByCategory(userId, category, {
      limit: parseInt(limit)
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      category,
      count: insights.length,
      insights: insights.map(i => ({
        id: i._id,
        title: i.title,
        body: i.body,
        severity: i.severity,
        severityIcon: i.severityIcon,
        timeAgo: i.timeAgo
      }))
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get insights by severity
 */
export const getInsightsBySeverity = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { severity } = req.params;
    const { limit = 20 } = req.query;

    const insights = await Insight.getBySeverity(userId, severity, {
      limit: parseInt(limit)
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      severity,
      count: insights.length,
      insights: insights.map(i => ({
        id: i._id,
        title: i.title,
        body: i.body,
        category: i.category,
        timeAgo: i.timeAgo
      }))
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Generate insights from current economic data
 */
export const generateInsights = async (req, res, next) => {
  try {
    const userId = req.userId;

    // Get current indicator values
    const indicatorCodes = getRelevantIndicatorCodes();
    const indicatorValues = await getIndicatorValues(indicatorCodes);

    // Get user threshold settings for custom thresholds
    const userSettings = await UserThresholdSettings.findOrCreate(userId);

    // Build user-specific thresholds object
    const userThresholds = {};
    userSettings.customThresholds.forEach(threshold => {
      userThresholds[threshold.indicatorCode] = {
        gte: threshold.gte,
        gt: threshold.gt,
        lte: threshold.lte,
        lt: threshold.lt,
        between: threshold.between
      };
    });

    // Find matching rules with user-specific thresholds
    const matchingRules = await InterpretationRule.findMatchingRules(
      indicatorValues,
      Object.keys(userThresholds).length > 0 ? userThresholds : null,
      userSettings.disabledRules || []
    );

    // Filter by user's alert preferences
    const enabledRules = matchingRules.filter(rule => {
      return userSettings.areAlertsEnabled(rule.category, rule.severity);
    });

    if (enabledRules.length === 0) {
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'No matching rules for current economic conditions or all alerts disabled',
        insights: []
      });
    }

    // Generate insights
    const newInsights = [];

    // Get user's business context for template customization
    const businessProfile = await BusinessProfile.findOne({ userId, isDeleted: false });
    const businessContext = {
      industry: businessProfile?.industry || 'retail',
      businessType: businessProfile?.businessType || 'retail'
    };

    // Pre-fetch all custom templates for this user
    const ruleCodes = enabledRules.map(r => r.code);
    const templates = await InsightTemplate.find({
      userId: { $in: [userId, null] },
      code: { $in: ruleCodes },
      isDeleted: false
    });

    // Build template lookup
    const templateLookup = {};
    for (const template of templates) {
      if (!templateLookup[template.code] || template.userId) {
        // User template overrides industry/system template
        templateLookup[template.code] = template;
      }
    }

    for (const rule of enabledRules) {
      // Check if insight already exists recently
      const existing = await Insight.findOne({
        userId,
        ruleCode: rule.code,
        generatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      if (!existing) {
        // Get custom template if available
        const customTemplate = templateLookup[rule.code] || null;

        const insight = await Insight.createFromRule(
          userId,
          rule,
          indicatorValues,
          customTemplate,
          businessContext
        );
        newInsights.push(insight);
      }

      // Record that rule was triggered
      rule.recordTrigger();
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Generated ${newInsights.length} new insights`,
      insights: newInsights.map(i => ({
        id: i._id,
        title: i.title,
        body: i.body,
        category: i.category,
        severity: i.severity,
        action: i.actionRequired ? {
          text: i.actionText,
          priority: i.actionPriority
        } : null
      }))
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get insight counts by status
 */
export const getInsightCounts = async (req, res, next) => {
  try {
    const userId = req.userId;

    const counts = await Insight.getCountsByStatus(userId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      counts
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get single insight by ID
 */
export const getInsightById = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const insight = await Insight.findOne({
      _id: id,
      userId
    });

    if (!insight) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Insight not found'
      });
    }

    // Mark as viewed
    if (!insight.viewedAt) {
      insight.markViewed();
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      insight: {
        id: insight._id,
        title: insight.title,
        body: insight.body,
        category: insight.category,
        severity: insight.severity,
        severityIcon: insight.severityIcon,
        insightType: insight.insightType,
        affectedArea: insight.affectedArea,
        impactLevel: insight.impactLevel,
        action: insight.actionRequired ? {
          text: insight.actionText,
          priority: insight.actionPriority,
          status: insight.actionStatus,
          urgency: insight.actionUrgency
        } : null,
        timeframe: insight.timeframe,
        relatedIndicators: insight.relatedIndicators,
        indicatorValues: insight.indicatorValues,
        timeAgo: insight.timeAgo,
        generatedAt: insight.generatedAt,
        isPinned: insight.isPinned,
        viewedAt: insight.viewedAt
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update insight action status
 */
export const updateInsightAction = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { status } = req.body;

    const insight = await Insight.findOne({
      _id: id,
      userId
    });

    if (!insight) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Insight not found'
      });
    }

    if (status === 'in_progress') {
      await insight.startAction();
    } else if (status === 'completed') {
      await insight.completeAction();
    } else if (status === 'dismissed') {
      await insight.dismiss(req.body.reason || 'User dismissed');
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Action status updated',
      insight: {
        id: insight._id,
        actionStatus: insight.actionStatus
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Toggle insight pin
 */
export const toggleInsightPin = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const insight = await Insight.findOne({
      _id: id,
      userId
    });

    if (!insight) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Insight not found'
      });
    }

    insight.isPinned = !insight.isPinned;
    await insight.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Insight ${insight.isPinned ? 'pinned' : 'unpinned'}`,
      isPinned: insight.isPinned
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get interpretation rules
 */
export const getRules = async (req, res, next) => {
  try {
    const { category, severity } = req.query;

    let rules;

    if (category) {
      rules = await InterpretationRule.getByCategory(category);
    } else if (severity) {
      rules = await InterpretationRule.getBySeverity(severity);
    } else {
      rules = await InterpretationRule.getActiveRules();
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: rules.length,
      rules: rules.map(r => ({
        code: r.code,
        name: r.name,
        description: r.description,
        category: r.category,
        severity: r.severity,
        insightType: r.insightType,
        conditions: r.conditions,
        affectedArea: r.affectedArea,
        actionRequired: r.actionRequired,
        timeframe: r.timeframe
      }))
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get overview of interpretation module
 */
export const getInterpretationOverview = async (req, res, next) => {
  try {
    const userId = req.userId;

    // Get counts
    const counts = await Insight.getCountsByStatus(userId);

    // Get recent insights
    const recentInsights = await Insight.getActiveForUser(userId, { limit: 5 });

    // Get actionable insights
    const actionableInsights = await Insight.getActionable(userId, { limit: 3 });

    // Get overdue actions
    const overdueInsights = await Insight.getOverdueActions(userId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      overview: {
        counts,
        recentInsights: recentInsights.map(i => ({
          id: i._id,
          title: i.title,
          severity: i.severity,
          severityIcon: i.severityIcon,
          timeAgo: i.timeAgo,
          actionRequired: i.actionRequired
        })),
        actionableInsights: actionableInsights.map(i => ({
          id: i._id,
          title: i.title,
          action: {
            text: i.actionText,
            priority: i.actionPriority,
            urgency: i.actionUrgency
          }
        })),
        overdueInsights: overdueInsights.map(i => ({
          id: i._id,
          title: i.title,
          action: {
            text: i.actionText,
            priority: i.actionPriority
          },
          daysOverdue: Math.floor((Date.now() - new Date(i.generatedAt).getTime()) / (1000 * 60 * 60 * 24))
        }))
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get Micro Economic Interpretation (Finance Module)
 * Dynamic plain English interpretation of personal finance data
 */
export const getMicroEconomicInterpretation = async (req, res, next) => {
  try {
    const userId = req.userId;

    // Get Life ledger (personal finance)
    const lifeLedger = await Ledger.findOne({
      userId,
      type: LEDGER_TYPES.LIFE,
      isActive: true
    });

    // Get Business ledger if exists
    const businessLedger = await Ledger.findOne({
      userId,
      type: LEDGER_TYPES.BUSINESS,
      isActive: true
    });

    if (!lifeLedger) {
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        interpretation: {
          title: '📘 Finance Module — Plain English Interpretation',
          items: [
            {
              icon: '💡',
              label: 'Getting Started',
              value: 'Set up your budget to see personalized insights',
              context: 'Add your monthly income and expenses to begin tracking'
            }
          ],
          summary: 'No finance data available yet'
        }
      });
    }

    // Calculate Safe-to-Spend (discretionary income)
    const totalBudget = lifeLedger.monthlyBudget || 0;
    const totalSpent = lifeLedger.totalExpenses || 0;
    const remainingBudget = Math.max(0, totalBudget - totalSpent);

    // Calculate unallocated income (income - budgeted expenses)
    const unallocatedIncome = Math.max(0, lifeLedger.totalIncome - totalBudget);
    const safeToSpend = remainingBudget + unallocatedIncome;

    // Build interpretation items using deterministic reasoning
    const items = [];

    // 1. Safe-to-Spend
    const safeToSpendStatus = safeToSpend > 50000 ? 'healthy' : safeToSpend > 10000 ? 'moderate' : 'low';
    items.push({
      icon: safeToSpendStatus === 'healthy' ? '💚' : safeToSpendStatus === 'moderate' ? '💛' : '❤️',
      label: 'Safe-to-Spend (Discretionary)',
      value: `₦${safeToSpend.toLocaleString()}`,
      context: safeToSpendStatus === 'healthy'
        ? 'You have healthy discretionary income for non-essentials'
        : safeToSpendStatus === 'moderate'
        ? 'Moderate discretionary funds available - spend carefully'
        : 'Limited discretionary income - prioritize essentials only',
      recommendation: safeToSpend < 10000 ? 'Review wants spending to free up cash' : null
    });

    // 2. Budget Buckets (50:30:20 breakdown)
    const needsBudget = lifeLedger.categoryTracking?.needs?.budget || 0;
    const wantsBudget = lifeLedger.categoryTracking?.wants?.budget || 0;
    const savingsBudget = lifeLedger.categoryTracking?.savings?.budget || 0;

    const needsSpent = lifeLedger.categoryTracking?.needs?.spent || 0;
    const wantsSpent = lifeLedger.categoryTracking?.wants?.spent || 0;
    const savingsSaved = lifeLedger.categoryTracking?.savings?.saved || 0;

    const needsPercent = needsBudget > 0 ? ((needsSpent / needsBudget) * 100).toFixed(0) : 0;
    const wantsPercent = wantsBudget > 0 ? ((wantsSpent / wantsBudget) * 100).toFixed(0) : 0;
    const savingsPercent = savingsBudget > 0 ? ((savingsSaved / savingsBudget) * 100).toFixed(0) : 0;

    items.push({
      icon: '🪣',
      label: 'Budget Buckets',
      value: `Needs ${needsPercent}% • Wants ${wantsPercent}% • Savings ${savingsPercent}%`,
      context: `Needs: ₦${needsSpent.toLocaleString()} of ₦${needsBudget.toLocaleString()} used`,
      breakdown: [
        { category: 'Needs', spent: needsSpent, budget: needsBudget, percent: needsPercent },
        { category: 'Wants', spent: wantsSpent, budget: wantsBudget, percent: wantsPercent },
        { category: 'Savings', saved: savingsSaved, target: savingsBudget, percent: savingsPercent }
      ],
      recommendation: needsPercent > 100 ? 'Needs spending over budget - review essential expenses' :
                     wantsPercent > 100 ? 'Wants spending over budget - cut discretionary spending' :
                     savingsPercent < 50 ? 'Behind on savings target - prioritize saving' : null
    });

    // 3. Burn Rate
    const dailyBurn = lifeLedger.burnRate || 0;
    const monthlyProjected = dailyBurn * 30;
    items.push({
      icon: dailyBurn > (totalBudget / 30) ? '🔥' : '📉',
      label: 'Burn Rate',
      value: `₦${dailyBurn.toLocaleString()}/day`,
      context: `Projected monthly spend: ₦${monthlyProjected.toLocaleString()}`,
      trend: dailyBurn > 0 ? 'burning' : 'stable',
      recommendation: dailyBurn > (totalBudget / 30)
        ? `Daily burn exceeds budget - reduce by ₦${(dailyBurn - totalBudget / 30).toLocaleString()}/day`
        : dailyBurn === 0 ? 'No spending recorded yet this period' : null
    });

    // 4. Vault (Total Balance)
    items.push({
      icon: lifeLedger.balance > 100000 ? '🏦' : '💰',
      label: 'Vault (Total Balance)',
      value: `₦${lifeLedger.balance.toLocaleString()}`,
      context: `Net cash flow: ₦${lifeLedger.netCashFlow >= 0 ? '+' : ''}${lifeLedger.netCashFlow.toLocaleString()} this month`,
      trend: lifeLedger.netCashFlow >= 0 ? 'positive' : 'negative',
      recommendation: lifeLedger.netCashFlow < 0
        ? 'Negative cash flow - review income and expenses'
        : lifeLedger.balance < 50000
        ? 'Low balance - build emergency fund'
        : null
    });

    // 5. Runway
    const runwayDays = lifeLedger.runwayDays || 0;
    const runwayStatus = runwayDays >= 60 ? 'healthy' : runwayDays >= 30 ? 'moderate' : runwayDays >= 14 ? 'warning' : 'critical';
    const runwayDisplay = runwayDays >= 365
      ? `${Math.floor(runwayDays / 365)}+ years`
      : runwayDays >= 30
      ? `${Math.floor(runwayDays / 30)} months`
      : `${runwayDays} days`;

    items.push({
      icon: runwayStatus === 'healthy' ? '✈️' : runwayStatus === 'moderate' ? '🛫' : runwayStatus === 'warning' ? '⚠️' : '🚨',
      label: 'Runway',
      value: runwayDisplay,
      context: runwayStatus === 'critical'
        ? 'CRITICAL: Less than 2 weeks of cash remaining'
        : runwayStatus === 'warning'
        ? 'WARNING: Less than 1 month of cash remaining'
        : runwayStatus === 'moderate'
        ? 'Moderate runway - monitor spending'
        : 'Healthy runway - you have buffer',
      runwayDays,
      recommendation: runwayStatus === 'critical'
        ? 'IMMEDIATE: Cut all non-essential expenses, find income sources'
        : runwayStatus === 'warning'
        ? 'URGENT: Reduce burn rate or increase income within 30 days'
        : runwayStatus === 'moderate'
        ? 'Consider increasing emergency fund to 3+ months'
        : null
    });

    // 6. Business Ledger (if exists)
    if (businessLedger) {
      items.push({
        icon: '🏢',
        label: 'Business Working Capital',
        value: `₦${businessLedger.workingCapital.toLocaleString()}`,
        context: `Available for withdrawal: ₦${businessLedger.availableCapital.toLocaleString()}`,
        recommendation: businessLedger.availableCapital < 10000
          ? 'Low available capital - consider profit distribution'
          : null
      });
    }

    // Generate overall summary
    const summaryItems = [];
    if (safeToSpend < 10000) summaryItems.push('Low discretionary income');
    if (needsPercent > 100) summaryItems.push('Needs over budget');
    if (runwayStatus === 'critical') summaryItems.push('Critical runway');
    if (lifeLedger.netCashFlow < 0) summaryItems.push('Negative cash flow');

    const summary = summaryItems.length > 0
      ? `Attention: ${summaryItems.join(', ')}`
      : 'Financial health looks good - keep tracking!';

    res.status(HTTP_STATUS.OK).json({
      success: true,
      interpretation: {
        title: '📘 Finance Module — Plain English Interpretation',
        lastUpdated: lifeLedger.updatedAt,
        items,
        summary,
        metrics: {
          safeToSpend,
          burnRate: dailyBurn,
          runwayDays,
          balance: lifeLedger.balance,
          netCashFlow: lifeLedger.netCashFlow
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get Macro Economic Interpretation (Dream Module)
 * Dynamic plain English interpretation of economic indicators
 */
export const getMacroEconomicInterpretation = async (req, res, next) => {
  try {
    const userId = req.userId;

    // Get key economic indicators
    const indicators = await EconomicIndicator.find({
      code: { $in: ['INFLATION_RATE', 'CURRENCY_USD', 'FOOD_INFLATION', 'INTEREST_RATE', 'GDP_GROWTH_RATE'] },
      isActive: true,
      isDeleted: false
    });

    if (indicators.length === 0) {
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        interpretation: {
          title: '🌍 Dream Module — Plain English Interpretation',
          items: [
            {
              icon: '📊',
              label: 'Economic Data',
              value: 'Loading...',
              context: 'Economic indicators will appear here'
            }
          ],
          summary: 'No economic data available yet'
        }
      });
    }

    // Create indicator lookup
    const indicatorMap = {};
    indicators.forEach(ind => {
      indicatorMap[ind.code] = ind;
    });

    // Build interpretation items using deterministic reasoning
    const items = [];

    // 1. Inflation Rate
    const inflation = indicatorMap.INFLATION_RATE;
    if (inflation) {
      const inflationLevel = inflation.value >= 25 ? 'severe' : inflation.value >= 20 ? 'high' : inflation.value >= 15 ? 'elevated' : inflation.value >= 10 ? 'moderate' : 'low';
      const inflationIcon = inflationLevel === 'severe' ? '🔴' : inflationLevel === 'high' ? '🟠' : inflationLevel === 'elevated' ? '🟡' : '🟢';

      items.push({
        icon: inflationIcon,
        label: 'Inflation Rate',
        value: `${inflation.value.toFixed(1)}%`,
        context: inflationLevel === 'severe'
          ? 'Prices rising rapidly - urgent action needed for pricing strategy'
          : inflationLevel === 'high'
          ? 'High inflation - protect margins with price adjustments'
          : inflationLevel === 'elevated'
          ? 'Elevated inflation - monitor costs closely'
          : 'Inflation manageable - no immediate action required',
        trend: inflation.trend,
        change: inflation.changePercent?.toFixed(1) + '% vs last month',
        recommendation: inflation.value >= 20
          ? 'Increase prices to maintain profit margins'
          : inflation.value >= 15
          ? 'Review pricing strategy and negotiate with suppliers'
          : null
      });
    }

    // 2. FX Rate
    const fxRate = indicatorMap.CURRENCY_USD;
    if (fxRate) {
      const fxLevel = fxRate.value >= 1700 ? 'severe' : fxRate.value >= 1600 ? 'high' : fxRate.value >= 1500 ? 'elevated' : 'stable';
      const fxIcon = fxLevel === 'severe' ? '💱' : fxLevel === 'high' ? '💲' : '💵';

      items.push({
        icon: fxIcon,
        label: 'FX Rate (USD/NGN)',
        value: `₦${fxRate.value.toFixed(2)}/$`,
        context: fxLevel === 'severe'
          ? 'Naira significantly weakened - import costs soaring'
          : fxLevel === 'high'
          ? 'Naira under pressure - imported goods getting expensive'
          : fxLevel === 'elevated'
          ? 'Moderate FX pressure - plan for continued volatility'
          : 'FX rate relatively stable',
        trend: fxRate.trend,
        change: fxRate.changePercent?.toFixed(1) + '% vs last month',
        recommendation: fxRate.value >= 1600
          ? 'Hedge currency risk - lock in FX rates for imports'
          : fxRate.value >= 1500
          ? 'Build FX buffer - reduce dependency on imports'
          : null
      });
    }

    // 3. Food Inflation (Groundnut Index proxy)
    const foodInflation = indicatorMap.FOOD_INFLATION;
    if (foodInflation) {
      const foodLevel = foodInflation.value >= 30 ? 'severe' : foodInflation.value >= 25 ? 'high' : foodInflation.value >= 20 ? 'elevated' : 'moderate';
      const foodIcon = foodLevel === 'severe' ? '🥜' : '🌾';

      // Calculate raw material cost impact
      const baseCost = 500; // Base cost per kg
      const currentCost = baseCost * (1 + foodInflation.value / 100);
      const costIncrease = currentCost - baseCost;

      items.push({
        icon: foodIcon,
        label: 'Food Inflation (Raw Materials)',
        value: `${foodInflation.value.toFixed(1)}%`,
        context: `Raw material costs up ₦${costIncrease.toFixed(0)}/kg from baseline`,
        impact: `Current estimated: ₦${currentCost.toFixed(0)}/kg`,
        trend: foodInflation.trend,
        change: foodInflation.changePercent?.toFixed(1) + '% vs last month',
        recommendation: foodInflation.value >= 25
          ? 'Lock in bulk raw material purchases before further hikes'
          : foodInflation.value >= 20
          ? 'Negotiate long-term supplier contracts at fixed rates'
          : null
      });
    }

    // 4. Interest Rate
    const interestRate = indicatorMap.INTEREST_RATE;
    if (interestRate) {
      const rateLevel = interestRate.value >= 25 ? 'high' : interestRate.value >= 20 ? 'elevated' : 'moderate';
      const rateIcon = rateLevel === 'high' ? '📈' : '📊';

      items.push({
        icon: rateIcon,
        label: 'Interest Rate (MPR)',
        value: `${interestRate.value.toFixed(1)}%`,
        context: rateLevel === 'high'
          ? 'High interest rates - borrowing costs elevated'
          : rateLevel === 'elevated'
          ? 'Interest rates elevated - access credit cautiously'
          : 'Interest rates moderate - favorable for credit',
        trend: interestRate.trend,
        change: interestRate.changePercent?.toFixed(1) + '% vs last month',
        recommendation: interestRate.value >= 25
          ? 'Minimize borrowing - prioritize internal funding'
          : interestRate.value >= 20
          ? 'Use credit strategically - focus on high-ROI investments'
          : null
      });
    }

    // 5. GDP Growth
    const gdpGrowth = indicatorMap.GDP_GROWTH_RATE;
    if (gdpGrowth) {
      const growthLevel = gdpGrowth.value >= 3 ? 'growing' : gdpGrowth.value >= 1 ? 'slow' : gdpGrowth.value >= 0 ? 'stagnant' : 'contracting';
      const growthIcon = growthLevel === 'growing' ? '📈' : growthLevel === 'slow' ? '📊' : growthLevel === 'stagnant' ? '➡️' : '📉';

      items.push({
        icon: growthIcon,
        label: 'GDP Growth Rate',
        value: `${gdpGrowth.value.toFixed(1)}%`,
        context: growthLevel === 'growing'
          ? 'Economy expanding - growth opportunities exist'
          : growthLevel === 'slow'
          ? 'Slow growth - conservative approach recommended'
          : growthLevel === 'stagnant'
          ? 'Economy stagnant - focus on efficiency'
          : 'Economy contracting - defensive strategy needed',
        trend: gdpGrowth.trend,
        change: gdpGrowth.changePercent?.toFixed(1) + '% vs last quarter',
        recommendation: gdpGrowth.value < 1
          ? 'Focus on essential products - reduce inventory'
          : gdpGrowth.value >= 3
          ? 'Consider expansion - economy supports growth'
          : null
      });
    }

    // Generate overall economic summary
    const stressIndicators = [];
    let overallStress = 'low';

    if (inflation?.value >= 20) { stressIndicators.push('High Inflation'); overallStress = 'high'; }
    else if (inflation?.value >= 15) { stressIndicators.push('Elevated Inflation'); overallStress = 'moderate'; }

    if (fxRate?.value >= 1600) { stressIndicators.push('FX Pressure'); overallStress = 'high'; }
    else if (fxRate?.value >= 1500 && overallStress !== 'high') { overallStress = 'moderate'; }

    if (foodInflation?.value >= 25) { stressIndicators.push('Food Cost Surge'); overallStress = 'high'; }

    const summary = stressIndicators.length > 0
      ? `Economic Stress: ${stressIndicators.join(', ')}`
      : overallStress === 'low'
      ? 'Economic conditions relatively favorable'
      : 'Economic conditions moderate - stay alert';

    // Calculate overall health score
    let healthScore = 100;
    if (inflation) healthScore -= Math.max(0, (inflation.value - 10) * 2);
    if (fxRate) healthScore -= Math.max(0, (fxRate.value - 1500) / 10);
    if (foodInflation) healthScore -= Math.max(0, (foodInflation.value - 20) * 1.5);
    healthScore = Math.max(0, Math.min(100, healthScore));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      interpretation: {
        title: '🌍 Dream Module — Plain English Interpretation',
        lastUpdated: indicators.reduce((latest, ind) =>
          ind.timestamp > latest ? ind.timestamp : latest, new Date()),
        items,
        summary,
        healthScore,
        overallStress,
        metrics: {
          inflation: inflation?.value,
          fxRate: fxRate?.value,
          foodInflation: foodInflation?.value,
          interestRate: interestRate?.value,
          gdpGrowth: gdpGrowth?.value
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// EXPORTS
// ==========================================
export default {
  // Overview
  getInterpretationOverview,

  // Insights
  getInsights,
  getInsightsByCategory,
  getInsightsBySeverity,
  getActionableInsights,
  getInsightById,
  generateInsights,
  getInsightCounts,

  // Actions
  updateInsightAction,
  toggleInsightPin,

  // Rules
  getRules,

  // Dynamic Scroll Content
  getMicroEconomicInterpretation,
  getMacroEconomicInterpretation
};

// SR
