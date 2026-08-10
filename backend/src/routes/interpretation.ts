// @ts-nocheck
/**
 * Interpretation Module Routes
 * All routes for the Interpretation module
 */

import express from 'express';
import interpretationController from '../controllers/interpretationControllerPrisma';
import { authenticate } from '../middleware/authPrisma';

const router = express.Router();

// ==========================================
// OVERVIEW
// ==========================================

/**
 * @route   GET /api/interpret/overview
 * @desc    Get complete Interpretation module overview
 * @access  Private (requires auth)
 */
router.get('/overview', authenticate, interpretationController.getInterpretationOverview);

// ==========================================
// INSIGHTS
// ==========================================

/**
 * @route   GET /api/interpret/insights
 * @desc    Get all insights for user
 * @access  Private
 * @query   category - Filter by category
 * @query   severity - Filter by severity
 * @query   actionable - Filter actionable insights (true/false)
 * @query   actionStatus - Filter by action status (pending/in_progress/completed)
 * @query   limit - Max results (default: 20)
 */
router.get('/insights', authenticate, interpretationController.getInsights);

/**
 * @route   GET /api/interpret/insights/actionable
 * @desc    Get insights requiring action
 * @access  Private
 * @query   actionStatus - Filter by action status (default: pending)
 * @query   limit - Max results (default: 20)
 */
router.get('/insights/actionable', authenticate, interpretationController.getActionableInsights);

/**
 * @route   GET /api/interpret/insights/category/:category
 * @desc    Get insights by category
 * @access  Private
 */
router.get('/insights/category/:category', authenticate, interpretationController.getInsightsByCategory);

/**
 * @route   GET /api/interpret/insights/severity/:severity
 * @desc    Get insights by severity
 * @access  Private
 */
router.get('/insights/severity/:severity', authenticate, interpretationController.getInsightsBySeverity);

/**
 * @route   GET /api/interpret/insights/counts
 * @desc    Get insight counts by status
 * @access  Private
 */
router.get('/insights/counts', authenticate, interpretationController.getInsightCounts);

/**
 * @route   GET /api/interpret/insights/:id
 * @desc    Get single insight by ID
 * @access  Private
 */
router.get('/insights/:id', authenticate, interpretationController.getInsightById);

/**
 * @route   POST /api/interpret/generate
 * @desc    Generate new insights from current economic data
 * @access  Private
 */
router.post('/generate', authenticate, interpretationController.generateInsights);

// ==========================================
// INSIGHT ACTIONS
// ==========================================

/**
 * @route   PUT /api/interpret/insights/:id/action
 * @desc    Update insight action status
 * @access  Private
 * @body    status - New status (in_progress/completed/dismissed)
 * @body    reason - Reason for dismissal (optional)
 */
router.put('/insights/:id/action', authenticate, interpretationController.updateInsightAction);

/**
 * @route   PUT /api/interpret/insights/:id/pin
 * @desc    Toggle insight pin status
 * @access  Private
 */
router.put('/insights/:id/pin', authenticate, interpretationController.toggleInsightPin);

// ==========================================
// RULES
// ==========================================

/**
 * @route   GET /api/interpret/rules
 * @desc    Get all interpretation rules
 * @access  Private
 * @query   category - Filter by category
 * @query   severity - Filter by severity
 */
router.get('/rules', authenticate, interpretationController.getRules);

// ==========================================
// DYNAMIC SCROLL CONTENT
// ==========================================

/**
 * @route   GET /api/interpret/micro
 * @desc    Get Micro Economic Interpretation (Finance Module data)
 * @access  Private
 * Returns dynamic plain English interpretation of:
 * - Safe-to-Spend (discretionary income)
 * - Budget Buckets (50:30:20 breakdown)
 * - Burn Rate
 * - Vault (total balance)
 * - Runway
 */
router.get('/micro', authenticate, interpretationController.getMicroEconomicInterpretation);

/**
 * @route   GET /api/interpret/macro
 * @desc    Get Macro Economic Interpretation (Dream Module data)
 * @access  Private
 * Returns dynamic plain English interpretation of:
 * - Inflation Rate
 * - FX Rate
 * - Food Inflation
 * - Interest Rate
 * - GDP Growth
 */
router.get('/macro', authenticate, interpretationController.getMacroEconomicInterpretation);

// ==========================================
// EXPORTS
// ==========================================
export default router;
