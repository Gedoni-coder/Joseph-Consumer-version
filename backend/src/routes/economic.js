/**
 * Economic Data Routes
 * Endpoints for fetching economic indicators, FX rates, commodities, and news
 */

import express from 'express';
import economicController from '../controllers/economicController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// PUBLIC ROUTES (Optional Authentication)
// - User API keys are used if authenticated
// ==========================================

/**
 * @route   GET /api/economic/inflation
 * @desc    Get current inflation rate and trend
 * @access  Public (Auth optional for API keys)
 * @query   ?refresh=true - Force refresh from API
 * @returns { inflation data }
 */
router.get('/inflation', optionalAuth, economicController.getInflation);

/**
 * @route   GET /api/economic/fx
 * @desc    Get current FX rates (USD, GBP, EUR to NGN)
 * @access  Public (Auth optional for API keys)
 * @query   ?refresh=true - Force refresh from API
 * @returns { fx rates }
 */
router.get('/fx', optionalAuth, economicController.getFXRates);

/**
 * @route   GET /api/economic/commodities
 * @desc    Get commodity prices (groundnut, rice, beans, palm oil)
 * @access  Public (Auth optional for API keys)
 * @query   ?refresh=true - Force refresh from API
 * @returns { commodity prices }
 */
router.get('/commodities', optionalAuth, economicController.getCommodities);

/**
 * @route   GET /api/economic/fuel
 * @desc    Get fuel prices (petrol, diesel, kerosene)
 * @access  Public (Auth optional for API keys)
 * @query   ?refresh=true - Force refresh from API
 * @returns { fuel prices }
 */
router.get('/fuel', optionalAuth, economicController.getFuelPrices);

/**
 * @route   GET /api/economic/news
 * @desc    Get economic news and market updates
 * @access  Public (Auth optional for custom API key)
 * @query   ?refresh=true - Force refresh from API
 * @returns { news articles }
 */
router.get('/news', optionalAuth, economicController.getNews);

/**
 * @route   GET /api/economic/all
 * @desc    Get all economic data in one request
 * @access  Public (Auth optional for API keys)
 * @query   ?refresh=true - Force refresh from API
 * @returns { all economic data }
 */
router.get('/all', optionalAuth, economicController.getAllEconomicData);

// ==========================================
// PROTECTED ROUTES (Authentication Required)
// ==========================================

/**
 * @route   POST /api/economic/refresh
 * @desc    Force refresh all economic data from APIs
 * @access  Private
 * @returns { refreshed economic data }
 */
router.post('/refresh', authenticate, economicController.refreshAllData);

/**
 * @route   GET /api/economic/health
 * @desc    Get cache health report
 * @access  Private
 * @returns { cache health status }
 */
router.get('/health', authenticate, economicController.getCacheHealth);

/**
 * @route   DELETE /api/economic/cache
 * @desc    Clear expired cache entries
 * @access  Private
 * @returns { cleared count }
 */
router.delete('/cache', authenticate, economicController.clearCache);

// ==========================================
// EXPORT
// ==========================================
export default router;
