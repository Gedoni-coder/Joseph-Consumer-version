/**
 * Admin Controller
 * Handles admin operations for managing economic data and user settings
 *
 * Features:
 * - Update economic indicator values
 * - Trigger data refresh from external sources
 * - Manage user threshold settings
 * - View update statistics
 */

import EconomicIndicator from '../models/EconomicIndicator.js';
import UserThresholdSettings from '../models/UserThresholdSettings.js';
import InsightTemplate from '../models/InsightTemplate.js';
import BusinessProfile from '../models/BusinessProfile.js';
import economicDataUpdater from '../services/economicDataUpdater.js';

// ==========================================
// ECONOMIC INDICATOR MANAGEMENT
// ==========================================

/**
 * Update a single economic indicator value
 */
export const updateIndicator = async (req, res) => {
  try {
    const { code } = req.params;
    const { value, source, metadata } = req.body;

    if (value === undefined || value === null) {
      return res.status(400).json({
        success: false,
        message: 'Value is required'
      });
    }

    const result = await economicDataUpdater.updateIndicator(
      code,
      value,
      source || 'ADMIN',
      metadata
    );

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json({
      success: true,
      message: `Indicator ${code} updated successfully`,
      data: result
    });

  } catch (error) {
    console.error('Error in updateIndicator:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update indicator',
      error: error.message
    });
  }
};

/**
 * Batch update multiple indicators
 */
export const batchUpdateIndicators = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { code, value, source }

    if (!Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        message: 'Updates must be an array'
      });
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
      const result = await economicDataUpdater.updateIndicator(
        update.code,
        update.value,
        update.source || 'ADMIN',
        update.metadata
      );

      if (result.success) {
        results.push(result);
      } else {
        errors.push(result);
      }
    }

    res.json({
      success: true,
      message: `Updated ${results.length} indicators`,
      data: {
        updated: results.length,
        failed: errors.length,
        results,
        errors
      }
    });

  } catch (error) {
    console.error('Error in batchUpdateIndicators:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to batch update indicators',
      error: error.message
    });
  }
};

/**
 * Trigger refresh from external data sources
 */
export const refreshFromSources = async (req, res) => {
  try {
    const { sources } = req.query; // Optional: specific sources to refresh

    const result = await economicDataUpdater.updateAllIndicators();

    res.json({
      success: result.success,
      message: result.success
        ? 'Data refresh completed'
        : 'Data refresh completed with errors',
      data: result
    });

  } catch (error) {
    console.error('Error in refreshFromSources:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh data',
      error: error.message
    });
  }
};

/**
 * Get update statistics
 */
export const getUpdateStats = async (req, res) => {
  try {
    const stats = economicDataUpdater.getStats();
    const history = economicDataUpdater.getHistory(10);

    res.json({
      success: true,
      data: {
        ...stats,
        recentHistory: history
      }
    });

  } catch (error) {
    console.error('Error in getUpdateStats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get update stats',
      error: error.message
    });
  }
};

/**
 * Get all indicators for admin management
 */
export const getAllIndicators = async (req, res) => {
  try {
    const { category, source } = req.query;

    const query = {};
    if (category) query.category = category;
    if (source) query.dataSource = source;

    const indicators = await EconomicIndicator.find(query)
      .sort({ category: 1, priority: -1 });

    res.json({
      success: true,
      data: indicators
    });

  } catch (error) {
    console.error('Error in getAllIndicators:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get indicators',
      error: error.message
    });
  }
};

// ==========================================
// USER THRESHOLD SETTINGS MANAGEMENT
// ==========================================

/**
 * Get user threshold settings
 */
export const getThresholdSettings = async (req, res) => {
  try {
    const { userId } = req.user;

    const settings = await UserThresholdSettings.findOrCreate(userId);

    // Get default thresholds for comparison
    const defaults = UserThresholdSettings.getDefaultThresholds();

    res.json({
      success: true,
      data: {
        settings,
        defaults,
        hasCustomSettings: settings.customThresholds.length > 0
      }
    });

  } catch (error) {
    console.error('Error in getThresholdSettings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get threshold settings',
      error: error.message
    });
  }
};

/**
 * Update user threshold settings
 */
export const updateThresholdSettings = async (req, res) => {
  try {
    const { userId } = req.user;
    const updates = req.body;

    const settings = await UserThresholdSettings.findOrCreate(userId);

    // Update alert preferences if provided
    if (updates.alertPreferences) {
      Object.assign(settings.alertPreferences, updates.alertPreferences);
    }

    // Update risk tolerance if provided
    if (updates.riskTolerance) {
      settings.riskTolerance = updates.riskTolerance;
    }

    // Update business context if provided
    if (updates.businessContext) {
      Object.assign(settings.businessContext, updates.businessContext);
    }

    // Update custom thresholds if provided
    if (updates.customThreshold) {
      await settings.setThreshold(updates.customThreshold);
    }

    // Apply preset if requested
    if (updates.applyPreset) {
      await settings.applyRiskPreset();
    }

    await settings.save();

    res.json({
      success: true,
      message: 'Threshold settings updated',
      data: settings
    });

  } catch (error) {
    console.error('Error in updateThresholdSettings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update threshold settings',
      error: error.message
    });
  }
};

/**
 * Set custom threshold for an indicator
 */
export const setCustomThreshold = async (req, res) => {
  try {
    const { userId } = req.user;
    const { indicatorCode } = req.params;
    const thresholdData = {
      indicatorCode,
      ...req.body
    };

    const settings = await UserThresholdSettings.findOrCreate(userId);
    await settings.setThreshold(thresholdData);

    res.json({
      success: true,
      message: `Custom threshold set for ${indicatorCode}`,
      data: {
        indicatorCode,
        threshold: thresholdData
      }
    });

  } catch (error) {
    console.error('Error in setCustomThreshold:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set custom threshold',
      error: error.message
    });
  }
};

/**
 * Remove custom threshold (revert to default)
 */
export const removeCustomThreshold = async (req, res) => {
  try {
    const { userId } = req.user;
    const { indicatorCode } = req.params;

    const settings = await UserThresholdSettings.findOrCreate(userId);
    settings.customThresholds = settings.customThresholds.filter(
      t => t.indicatorCode !== indicatorCode
    );
    await settings.save();

    res.json({
      success: true,
      message: `Custom threshold removed for ${indicatorCode}`
    });

  } catch (error) {
    console.error('Error in removeCustomThreshold:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove custom threshold',
      error: error.message
    });
  }
};

/**
 * Toggle rule disabled status
 */
export const toggleRule = async (req, res) => {
  try {
    const { userId } = req.user;
    const { ruleCode } = req.params;
    const { disabled } = req.body;

    const settings = await UserThresholdSettings.findOrCreate(userId);

    const existingIndex = settings.disabledRules.findIndex(r => r === ruleCode);

    if (disabled) {
      if (existingIndex < 0) {
        settings.disabledRules.push(ruleCode);
      }
    } else {
      if (existingIndex >= 0) {
        settings.disabledRules.splice(existingIndex, 1);
      }
    }

    await settings.save();

    res.json({
      success: true,
      message: `Rule ${ruleCode} ${disabled ? 'disabled' : 'enabled'}`
    });

  } catch (error) {
    console.error('Error in toggleRule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle rule',
      error: error.message
    });
  }
};

// ==========================================
// DATA SOURCE MANAGEMENT
// ==========================================

/**
 * Get data source status
 */
export const getDataSources = async (req, res) => {
  try {
    const { DATA_SOURCES } = await import('../services/economicDataUpdater.js');

    const sources = Object.entries(DATA_SOURCES).map(([key, config]) => ({
      key,
      name: config.name,
      enabled: config.enabled,
      rateLimit: config.rateLimit
    }));

    res.json({
      success: true,
      data: sources
    });

  } catch (error) {
    console.error('Error in getDataSources:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get data sources',
      error: error.message
    });
  }
};

/**
 * Update data source configuration
 */
export const updateDataSource = async (req, res) => {
  try {
    const { source } = req.params;
    const { enabled, rateLimit, apiKey } = req.body;

    const { DATA_SOURCES } = await import('../services/economicDataUpdater.js');

    if (!DATA_SOURCES[source]) {
      return res.status(404).json({
        success: false,
        message: 'Data source not found'
      });
    }

    if (enabled !== undefined) DATA_SOURCES[source].enabled = enabled;
    if (rateLimit !== undefined) DATA_SOURCES[source].rateLimit = rateLimit;
    if (apiKey) DATA_SOURCES[source].apiKey = apiKey;

    res.json({
      success: true,
      message: `Data source ${source} updated`,
      data: {
        source,
        config: DATA_SOURCES[source]
      }
    });

  } catch (error) {
    console.error('Error in updateDataSource:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update data source',
      error: error.message
    });
  }
};

// ==========================================
// TEMPLATE MANAGEMENT
// ==========================================

/**
 * Get all templates for user
 */
export const getTemplates = async (req, res) => {
  try {
    const { userId } = req.user;
    const { type, industry } = req.query;

    const query = {
      $or: [
        { userId },
        { userId: null, type: 'industry' },
        { userId: null, type: 'system' }
      ],
      isDeleted: false
    };

    if (type) query.type = type;
    if (industry) query.industry = industry;

    const templates = await InsightTemplate.find(query)
      .sort({ type: 1, industry: 1, code: 1 });

    res.json({
      success: true,
      data: templates
    });

  } catch (error) {
    console.error('Error in getTemplates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get templates',
      error: error.message
    });
  }
};

/**
 * Get template for a specific rule
 */
export const getTemplate = async (req, res) => {
  try {
    const { userId } = req.user;
    const { ruleCode } = req.params;

    // Get user's business context
    const businessProfile = await BusinessProfile.findOne({ userId, isDeleted: false });
    const industry = businessProfile?.industry || 'retail';

    const template = await InsightTemplate.findTemplate(ruleCode, userId, industry);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      data: template
    });

  } catch (error) {
    console.error('Error in getTemplate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get template',
      error: error.message
    });
  }
};

/**
 * Create or update custom template
 */
export const upsertTemplate = async (req, res) => {
  try {
    const { userId } = req.user;
    const { code } = req.params;
    const templateData = req.body;

    // Get business context if not provided
    const businessProfile = await BusinessProfile.findOne({ userId, isDeleted: false });

    const existing = await InsightTemplate.findOne({
      userId,
      code,
      isDeleted: false
    });

    if (existing) {
      // Update existing
      Object.assign(existing, templateData);
      existing.lastUpdated = new Date();
      await existing.save();

      res.json({
        success: true,
        message: 'Template updated',
        data: existing
      });
    } else {
      // Create new
      const template = await InsightTemplate.create({
        userId,
        code,
        type: 'user',
        industry: templateData.industry || businessProfile?.industry || 'retail',
        templates: {
          titleTemplate: templateData.titleTemplate,
          bodyTemplate: templateData.bodyTemplate,
          actionTemplate: templateData.actionTemplate
        },
        severityConfig: templateData.severityConfig,
        affectedAreaConfig: templateData.affectedAreaConfig,
        priorityAdjustment: templateData.priorityAdjustment,
        industryVariables: templateData.industryVariables,
        notes: templateData.notes
      });

      res.status(201).json({
        success: true,
        message: 'Template created',
        data: template
      });
    }

  } catch (error) {
    console.error('Error in upsertTemplate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save template',
      error: error.message
    });
  }
};

/**
 * Delete custom template
 */
export const deleteTemplate = async (req, res) => {
  try {
    const { userId } = req.user;
    const { templateId } = req.params;

    const template = await InsightTemplate.findOne({
      _id: templateId,
      userId
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Can only delete user templates
    if (template.type !== 'user') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete system or industry templates'
      });
    }

    template.isDeleted = true;
    template.deletedAt = new Date();
    await template.save();

    res.json({
      success: true,
      message: 'Template deleted'
    });

  } catch (error) {
    console.error('Error in deleteTemplate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete template',
      error: error.message
    });
  }
};

/**
 * Reset template to default (delete user template)
 */
export const resetTemplate = async (req, res) => {
  try {
    const { userId } = req.user;
    const { ruleCode } = req.params;

    const template = await InsightTemplate.findOne({
      userId,
      code: ruleCode
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'No custom template found'
      });
    }

    template.isDeleted = true;
    template.deletedAt = new Date();
    await template.save();

    res.json({
      success: true,
      message: 'Template reset to default'
    });

  } catch (error) {
    console.error('Error in resetTemplate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset template',
      error: error.message
    });
  }
};

/**
 * Get industry template preview
 */
export const previewTemplate = async (req, res) => {
  try {
    const { userId } = req.user;
    const { ruleCode } = req.params;
    const { industry } = req.query;

    const previewIndustry = industry || 'retail';

    // Get the template
    const template = await InsightTemplate.findTemplate(ruleCode, null, previewIndustry);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found for this industry'
      });
    }

    // Get sample indicator values for preview
    const sampleIndicatorValues = {
      INFLATION_RATE: { value: 18.5, trend: 'up', unit: 'percent' },
      CURRENCY_USD: { value: 1550, trend: 'up', unit: 'NGN/USD' },
      INTEREST_RATE: { value: 26.5, trend: 'stable', unit: 'percent' },
      FOOD_INFLATION: { value: 22.3, trend: 'up', unit: 'percent' },
      GDP_GROWTH_RATE: { value: 2.5, trend: 'down', unit: 'percent' }
    };

    // Get industry variables
    const defaults = InsightTemplate.getIndustryDefaults(previewIndustry);
    const variables = defaults[ruleCode]?.industryVariables || {};

    // Apply template
    const preview = template.applyVariables(sampleIndicatorValues, variables);

    res.json({
      success: true,
      data: {
        industry: previewIndustry,
        ruleCode,
        templates: template.templates,
        preview,
        industryVariables: variables
      }
    });

  } catch (error) {
    console.error('Error in previewTemplate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to preview template',
      error: error.message
    });
  }
};

/**
 * Seed industry templates
 */
export const seedIndustryTemplates = async (req, res) => {
  try {
    const result = await InsightTemplate.seedIndustryTemplates();

    res.json({
      success: true,
      message: `Seeded ${result.seeded} industry templates`,
      data: result
    });

  } catch (error) {
    console.error('Error in seedIndustryTemplates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed templates',
      error: error.message
    });
  }
};

export default {
  // Indicator management
  updateIndicator,
  batchUpdateIndicators,
  refreshFromSources,
  getUpdateStats,
  getAllIndicators,

  // Threshold settings
  getThresholdSettings,
  updateThresholdSettings,
  setCustomThreshold,
  removeCustomThreshold,
  toggleRule,

  // Data sources
  getDataSources,
  updateDataSource,

  // Template management
  getTemplates,
  getTemplate,
  upsertTemplate,
  deleteTemplate,
  resetTemplate,
  previewTemplate,
  seedIndustryTemplates
};
