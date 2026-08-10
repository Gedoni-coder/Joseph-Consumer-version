/**
 * Prisma-based Interpretation Controller
 * Handles all Interpretation module endpoints using Prisma/PostgreSQL
 */

import { interpretationService } from '../services/prisma/interpretationService.js';
import { prisma } from '../config/prisma.js';
import { HTTP_STATUS } from '../config/constants.js';

// ==========================================
// OVERVIEW
// ==========================================

/**
 * Get interpretation module overview
 */
export const getInterpretationOverview = async (req, res, next) => {
  try {
    const userId = req.userId;
    const overview = await interpretationService.getInterpretationOverview(userId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      overview
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// INSIGHTS
// ==========================================

/**
 * Get all insights for user
 */
export const getInsights = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { category, severity, actionable, actionStatus, limit = 20 } = req.query;

    const options = {
      limit: parseInt(limit),
      category,
      severity,
      actionable: actionable === 'true',
      actionStatus
    };

    const insights = await interpretationService.getInsights(userId, options);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: insights.length,
      insights
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get actionable insights
 */
export const getActionableInsights = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { actionStatus = 'new', limit = 20 } = req.query;

    const insights = await interpretationService.getActionableInsights(userId, {
      actionStatus,
      limit: parseInt(limit)
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: insights.length,
      insights
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

    const insights = await interpretationService.getInsightsByCategory(userId, category, {
      limit: parseInt(limit)
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      category,
      count: insights.length,
      insights
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

    const insights = await interpretationService.getInsightsBySeverity(userId, severity, {
      limit: parseInt(limit)
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      severity,
      count: insights.length,
      insights
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get insight counts
 */
export const getInsightCounts = async (req, res, next) => {
  try {
    const userId = req.userId;
    const counts = await interpretationService.getInsightCounts(userId);

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

    const insight = await interpretationService.getInsightById(userId, id);

    if (!insight) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Insight not found'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      insight
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Generate insights from current data
 */
export const generateInsights = async (req, res, next) => {
  try {
    const userId = req.userId;
    const newInsights = await interpretationService.generateInsightsFromEconomicData(userId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Generated ${newInsights.length} new insights`,
      insights: newInsights.map(i => ({
        id: i.id,
        title: i.title,
        body: i.body,
        category: i.category,
        severity: i.severity
      }))
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// ACTIONS
// ==========================================

/**
 * Update insight action status
 */
export const updateInsightAction = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { status } = req.body;

    const insight = await interpretationService.updateInsightAction(userId, id, status);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Action status updated',
      insight: {
        id: insight.id,
        actionStatus: insight.status
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

    const result = await interpretationService.toggleInsightPin(userId, id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Insight ${result.isPinned ? 'pinned' : 'unpinned'}`,
      isPinned: result.isPinned
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// DYNAMIC INTERPRETATION
// ==========================================

/**
 * Get Micro Economic Interpretation (Finance Module)
 */
export const getMicroEconomicInterpretation = async (req, res, next) => {
  try {
    const userId = req.userId;
    const interpretation = await interpretationService.getMicroEconomicInterpretation(userId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      interpretation
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get Macro Economic Interpretation (Dream Module)
 */
export const getMacroEconomicInterpretation = async (req, res, next) => {
  try {
    const interpretation = await interpretationService.getMacroEconomicInterpretation();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      interpretation
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

    const rules = await prisma.interpretationRule.findMany({
      where: {
        isEnabled: true,
        ...(category && { category }),
        ...(severity && { severity })
      },
      orderBy: { code: 'asc' }
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: rules.length,
      rules: rules.map(r => ({
        code: r.code,
        name: r.name,
        description: r.description,
        category: r.indicatorCode,
        severity: r.severity,
        conditions: {
          type: r.conditionType,
          operator: r.operator,
          threshold: r.thresholdValue
        },
        actionRequired: !!r.recommendedAction
      }))
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
  getInsightCounts,
  generateInsights,

  // Actions
  updateInsightAction,
  toggleInsightPin,

  // Rules
  getRules,

  // Dynamic Interpretation
  getMicroEconomicInterpretation,
  getMacroEconomicInterpretation
};
