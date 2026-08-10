/**
 * Dream Module Routes
 * All routes for the Dream module
 */

import express from 'express';
import dreamController from '../controllers/dreamController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// OVERVIEW (Combined)
// ==========================================

/**
 * @route   GET /api/dream/overview
 * @desc    Get complete Dream module overview
 * @access  Public
 */
router.get('/overview', optionalAuth, dreamController.getDreamOverview);

// ==========================================
// INDICATOR TICKER
// ==========================================

/**
 * @route   GET /api/dream/ticker
 * @desc    Get indicator ticker (5 key indicators)
 * @access  Public
 */
router.get('/ticker', optionalAuth, dreamController.getIndicatorTicker);

// ==========================================
// QUICK STATS
// ==========================================

/**
 * @route   GET /api/dream/stats
 * @desc    Get quick stats (health, volatility, news, events)
 * @access  Public
 */
router.get('/stats', optionalAuth, dreamController.getQuickStats);

// ==========================================
// STRESS TESTER
// ==========================================

/**
 * @route   GET /api/dream/stress-test
 * @desc    Get economic stress tester with projections
 * @access  Public
 * @query   cogs - Current COGS per unit (default: 500)
 * @query   profit - Current profit per unit (default: 1000)
 */
router.get('/stress-test', optionalAuth, dreamController.getStressTester);

// ==========================================
// ECONOMIC FEED
// ==========================================

/**
 * @route   GET /api/dream/feed
 * @desc    Get economic news feed
 * @access  Public
 * @query   limit - Number of items (default: 10)
 * @query   category - Filter by category
 * @query   severity - Filter by severity
 */
router.get('/feed', optionalAuth, dreamController.getEconomicFeed);

// ==========================================
// INDICATORS
// ==========================================

/**
 * @route   GET /api/dream/indicators
 * @desc    Get all indicators grouped by category
 * @access  Public
 * @query   category - Filter by category
 * @query   limit - Max results (default: 100)
 * @query   skip - Skip results (default: 0)
 */
router.get('/indicators', optionalAuth, dreamController.getAllIndicators);

/**
 * @route   GET /api/dream/indicators/category/:category
 * @desc    Get indicators by category
 * @access  Public
 */
router.get('/indicators/category/:category', optionalAuth, dreamController.getIndicatorsByCategory);

/**
 * @route   GET /api/dream/indicators/:code
 * @desc    Get single indicator by code
 * @access  Public
 */
router.get('/indicators/:code', optionalAuth, dreamController.getIndicatorByCode);

// ==========================================
// EVENTS
// ==========================================

/**
 * @route   GET /api/dream/events
 * @desc    Get upcoming economic events
 * @access  Public
 * @query   limit - Max results (default: 10)
 * @query   category - Filter by category
 * @query   importance - Filter by importance (high/medium/low)
 */
router.get('/events', optionalAuth, dreamController.getUpcomingEvents);

/**
 * @route   GET /api/dream/events/:code
 * @desc    Get single event by code
 * @access  Public
 */
router.get('/events/:code', optionalAuth, dreamController.getEventByCode);

// ==========================================
// HEALTH SCORE
// ==========================================

/**
 * @route   GET /api/dream/health
 * @desc    Get economic health score
 * @access  Public
 */
router.get('/health', optionalAuth, dreamController.getHealthScore);

// ==========================================
// EXPORTS
// ==========================================
export default router;
