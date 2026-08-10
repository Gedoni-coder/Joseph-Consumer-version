// @ts-nocheck
/**
 * Admin Routes
 * Routes for managing economic data, user settings, and insight templates
 *
 * Endpoints:
 * - GET    /api/admin/indicators              - Get all indicators
 * - PUT    /api/admin/indicators/:code        - Update single indicator
 * - POST   /api/admin/indicators/batch        - Batch update indicators
 * - POST   /api/admin/refresh                 - Refresh from external sources
 * - GET    /api/admin/stats                   - Get update statistics
 * - GET    /api/admin/sources                  - Get data sources
 * - PUT    /api/admin/sources/:source          - Update source config
 * - GET    /api/admin/thresholds               - Get user threshold settings
 * - PUT    /api/admin/thresholds               - Update threshold settings
 * - PUT    /api/admin/thresholds/:indicatorCode - Set custom threshold
 * - DELETE /api/admin/thresholds/:indicatorCode - Remove custom threshold
 * - PUT    /api/admin/rules/:ruleCode/toggle   - Toggle rule enabled/disabled
 * - GET    /api/admin/templates                - Get all insight templates
 * - GET    /api/admin/templates/:ruleCode     - Get template for rule
 * - PUT    /api/admin/templates/:ruleCode     - Create/update custom template
 * - DELETE /api/admin/templates/:templateId   - Delete custom template
 * - POST   /api/admin/templates/:ruleCode/reset - Reset to default
 * - GET    /api/admin/templates/:ruleCode/preview - Preview template
 * - POST   /api/admin/templates/seed          - Seed industry templates
 */

import express from 'express';
import {
  updateIndicator,
  batchUpdateIndicators,
  refreshFromSources,
  getUpdateStats,
  getAllIndicators,
  getThresholdSettings,
  updateThresholdSettings,
  setCustomThreshold,
  removeCustomThreshold,
  toggleRule,
  getDataSources,
  updateDataSource,
  getTemplates,
  getTemplate,
  upsertTemplate,
  deleteTemplate,
  resetTemplate,
  previewTemplate,
  seedIndustryTemplates
} from '../controllers/adminController';
import { authenticate } from '../middleware/authPrisma';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Some routes require admin access (optional - comment out if not needed)
// router.use(requireAdmin);

// ==========================================
// INDICATOR MANAGEMENT
// ==========================================

/**
 * @route   GET /api/admin/indicators
 * @desc    Get all economic indicators for management
 * @access  Private (Admin)
 * @query   category - Filter by category
 * @query   source - Filter by data source
 */
router.get('/indicators', getAllIndicators);

/**
 * @route   PUT /api/admin/indicators/:code
 * @desc    Update a single indicator value
 * @access  Private (Admin)
 * @body    { value: number, source?: string, metadata?: object }
 */
router.put('/indicators/:code', updateIndicator);

/**
 * @route   POST /api/admin/indicators/batch
 * @desc    Batch update multiple indicators
 * @access  Private (Admin)
 * @body    { updates: [{ code, value, source, metadata }] }
 */
router.post('/indicators/batch', batchUpdateIndicators);

/**
 * @route   POST /api/admin/refresh
 * @desc    Trigger refresh from external data sources
 * @access  Private (Admin)
 * @query   sources - Comma-separated list of sources to refresh (optional)
 */
router.post('/refresh', refreshFromSources);

/**
 * @route   GET /api/admin/stats
 * @desc    Get data update statistics
 * @access  Private (Admin)
 */
router.get('/stats', getUpdateStats);

// ==========================================
// DATA SOURCE MANAGEMENT
// ==========================================

/**
 * @route   GET /api/admin/sources
 * @desc    Get all data sources and their status
 * @access  Private (Admin)
 */
router.get('/sources', getDataSources);

/**
 * @route   PUT /api/admin/sources/:source
 * @desc    Update data source configuration
 * @access  Private (Admin)
 * @body    { enabled?: boolean, rateLimit?: number, apiKey?: string }
 */
router.put('/sources/:source', updateDataSource);

// ==========================================
// THRESHOLD SETTINGS MANAGEMENT
// ==========================================

/**
 * @route   GET /api/admin/thresholds
 * @desc    Get user threshold settings
 * @access  Private
 */
router.get('/thresholds', getThresholdSettings);

/**
 * @route   PUT /api/admin/thresholds
 * @desc    Update user threshold settings
 * @access  Private
 * @body    {
 *   alertPreferences?: object,
 *   riskTolerance?: string,
 *   businessContext?: object,
 *   customThreshold?: object,
 *   applyPreset?: boolean
 * }
 */
router.put('/thresholds', updateThresholdSettings);

/**
 * @route   PUT /api/admin/thresholds/:indicatorCode
 * @desc    Set custom threshold for an indicator
 * @access  Private
 * @body    { gte?: number, gt?: number, lte?: number, lt?: number, between?: {min, max} }
 */
router.put('/thresholds/:indicatorCode', setCustomThreshold);

/**
 * @route   DELETE /api/admin/thresholds/:indicatorCode
 * @desc    Remove custom threshold (revert to default)
 * @access  Private
 */
router.delete('/thresholds/:indicatorCode', removeCustomThreshold);

/**
 * @route   PUT /api/admin/rules/:ruleCode/toggle
 * @desc    Toggle interpretation rule enabled/disabled
 * @access  Private
 * @body    { disabled: boolean }
 */
router.put('/rules/:ruleCode/toggle', toggleRule);

// ==========================================
// TEMPLATE MANAGEMENT
// ==========================================

/**
 * @route   GET /api/admin/templates
 * @desc    Get all insight templates for user
 * @access  Private
 * @query   type - Filter by type (user/industry/system)
 * @query   industry - Filter by industry
 */
router.get('/templates', getTemplates);

/**
 * @route   GET /api/admin/templates/:ruleCode
 * @desc    Get template for a specific rule (with user/industry fallback)
 * @access  Private
 */
router.get('/templates/:ruleCode', getTemplate);

/**
 * @route   PUT /api/admin/templates/:ruleCode
 * @desc    Create or update custom template for a rule
 * @access  Private
 * @body    {
 *   titleTemplate: string,
 *   bodyTemplate: string,
 *   actionTemplate: string,
 *   industryVariables?: object,
 *   severityConfig?: object,
 *   affectedAreaConfig?: object,
 *   priorityAdjustment?: number
 * }
 */
router.put('/templates/:ruleCode', upsertTemplate);

/**
 * @route   POST /api/admin/templates/:ruleCode/reset
 * @desc    Reset template to default (deletes user custom template)
 * @access  Private
 */
router.post('/templates/:ruleCode/reset', resetTemplate);

/**
 * @route   GET /api/admin/templates/:ruleCode/preview
 * @desc    Preview template with sample data
 * @access  Private
 * @query   industry - Industry to preview for (default: user's industry)
 */
router.get('/templates/:ruleCode/preview', previewTemplate);

/**
 * @route   DELETE /api/admin/templates/:templateId
 * @desc    Delete user custom template
 * @access  Private
 */
router.delete('/templates/:templateId', deleteTemplate);

/**
 * @route   POST /api/admin/templates/seed
 * @desc    Seed industry-specific templates (admin operation)
 * @access  Private (Admin)
 */
router.post('/templates/seed', seedIndustryTemplates);

export default router;
