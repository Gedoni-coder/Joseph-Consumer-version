/**
 * Economic Data Controller
 * Handles requests for economic indicators, FX rates, commodities, and news
 */

import economicService from '../services/economicService.js';
import User from '../models/User.js';
import {
  HTTP_STATUS,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  ECONOMIC_DATA_TYPES
} from '../config/constants.js';

// ==========================================
// GET INFLATION DATA
// ==========================================
export const getInflation = async (req, res, next) => {
  try {
    const forceRefresh = req.query.refresh === 'true';

    const result = await economicService.getEconomicData(
      ECONOMIC_DATA_TYPES.INFLATION,
      { forceRefresh }
    );

    res.status(HTTP_STATUS.OK).json({
      type: 'inflation',
      ...result.data,
      meta: {
        cached: result.cached,
        freshness: result.freshness,
        ttl: result.ttl,
        lastFetched: new Date().toISOString()
      }
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET FX RATES
// ==========================================
export const getFXRates = async (req, res, next) => {
  try {
    const forceRefresh = req.query.refresh === 'true';

    const result = await economicService.getEconomicData(
      ECONOMIC_DATA_TYPES.FX,
      { forceRefresh }
    );

    res.status(HTTP_STATUS.OK).json({
      type: 'fx',
      ...result.data,
      meta: {
        cached: result.cached,
        freshness: result.freshness,
        ttl: result.ttl,
        lastFetched: new Date().toISOString()
      }
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET COMMODITY PRICES
// ==========================================
export const getCommodities = async (req, res, next) => {
  try {
    const forceRefresh = req.query.refresh === 'true';

    const result = await economicService.getEconomicData(
      ECONOMIC_DATA_TYPES.COMMODITIES,
      { forceRefresh }
    );

    res.status(HTTP_STATUS.OK).json({
      type: 'commodities',
      ...result.data,
      meta: {
        cached: result.cached,
        freshness: result.freshness,
        ttl: result.ttl,
        lastFetched: new Date().toISOString()
      }
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET FUEL PRICES
// ==========================================
export const getFuelPrices = async (req, res, next) => {
  try {
    const forceRefresh = req.query.refresh === 'true';

    const result = await economicService.getEconomicData(
      ECONOMIC_DATA_TYPES.FUEL,
      { forceRefresh }
    );

    res.status(HTTP_STATUS.OK).json({
      type: 'fuel',
      ...result.data,
      meta: {
        cached: result.cached,
        freshness: result.freshness,
        ttl: result.ttl,
        lastFetched: new Date().toISOString()
      }
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET ECONOMIC NEWS
// ==========================================
export const getNews = async (req, res, next) => {
  try {
    const forceRefresh = req.query.refresh === 'true';

    // Get user's API key if available
    let apiKey = null;
    if (req.userId) {
      const user = await User.findById(req.userId);
      if (user && user.apiKeys && user.apiKeys.newsAPI) {
        apiKey = user.apiKeys.newsAPI;
      }
    }

    const result = await economicService.getEconomicData(
      ECONOMIC_DATA_TYPES.NEWS,
      { apiKey, forceRefresh }
    );

    res.status(HTTP_STATUS.OK).json({
      type: 'news',
      articles: result.data,
      meta: {
        cached: result.cached,
        freshness: result.freshness,
        ttl: result.ttl,
        lastFetched: new Date().toISOString(),
        source: apiKey ? 'NewsAPI (Custom Key)' : 'Fallback'
      }
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET ALL ECONOMIC DATA
// ==========================================
export const getAllEconomicData = async (req, res, next) => {
  try {
    const forceRefresh = req.query.refresh === 'true';

    // Get user's API key if available
    let apiKey = null;
    if (req.userId) {
      const user = await User.findById(req.userId);
      if (user && user.apiKeys && user.apiKeys.newsAPI) {
        apiKey = user.apiKeys.newsAPI;
      }
    }

    const result = await economicService.getAllEconomicData({ apiKey, forceRefresh });

    res.status(HTTP_STATUS.OK).json({
      timestamp: new Date().toISOString(),
      data: result
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// REFRESH ALL ECONOMIC DATA
// ==========================================
export const refreshAllData = async (req, res, next) => {
  try {
    // Get user's API keys
    let apiKey = null;
    if (req.userId) {
      const user = await User.findById(req.userId);
      if (user && user.apiKeys) {
        apiKey = user.apiKeys.newsAPI || null;
      }
    }

    const result = await economicService.refreshAllEconomicData(apiKey);

    res.status(HTTP_STATUS.OK).json(result);

  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET CACHE HEALTH
// ==========================================
export const getCacheHealth = async (req, res, next) => {
  try {
    const health = await economicService.getCacheHealth();

    res.status(HTTP_STATUS.OK).json({
      timestamp: new Date().toISOString(),
      health
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// CLEAR EXPIRED CACHE
// ==========================================
export const clearCache = async (req, res, next) => {
  try {
    const cleared = await economicService.clearExpiredCache();

    res.status(HTTP_STATUS.OK).json({
      message: `Cleared ${cleared} expired cache entries`,
      cleared
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// EXPORTS
// ==========================================
export default {
  getInflation,
  getFXRates,
  getCommodities,
  getFuelPrices,
  getNews,
  getAllEconomicData,
  refreshAllData,
  getCacheHealth,
  clearCache
};

// SR
