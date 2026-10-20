import economicService from '../services/prisma/economicService';
import { prisma } from '../config/prisma';
import {
  ECONOMIC_DATA_TYPES,
  HTTP_STATUS
} from '../config/constants';

const getUserNewsApiKey = async (userId?: string) => {
  if (!userId) {
    return null;
  }

  const config = await prisma.apiConfiguration.findUnique({
    where: { userId }
  });

  return config?.newsApiKey ?? null;
};

const sendEconomicResult = (res, type: string, result) =>
  res.status(HTTP_STATUS.OK).json({
    type,
    ...result.data,
    meta: {
      cached: result.cached,
      freshness: result.freshness,
      ttl: result.ttl,
      lastFetched: new Date().toISOString(),
      source: result.source
    }
  });

export const getInflation = async (req, res, next) => {
  try {
    const result = await economicService.getEconomicData(
      ECONOMIC_DATA_TYPES.INFLATION,
      { forceRefresh: req.query.refresh === 'true' }
    );

    return sendEconomicResult(res, 'inflation', result);
  } catch (error) {
    return next(error);
  }
};

export const getFXRates = async (req, res, next) => {
  try {
    const result = await economicService.getEconomicData(
      ECONOMIC_DATA_TYPES.FX,
      { forceRefresh: req.query.refresh === 'true' }
    );

    return sendEconomicResult(res, 'fx', result);
  } catch (error) {
    return next(error);
  }
};

export const getCommodities = async (req, res, next) => {
  try {
    const result = await economicService.getEconomicData(
      ECONOMIC_DATA_TYPES.COMMODITIES,
      { forceRefresh: req.query.refresh === 'true' }
    );

    return sendEconomicResult(res, 'commodities', result);
  } catch (error) {
    return next(error);
  }
};

export const getFuelPrices = async (req, res, next) => {
  try {
    const result = await economicService.getEconomicData(
      ECONOMIC_DATA_TYPES.FUEL,
      { forceRefresh: req.query.refresh === 'true' }
    );

    return sendEconomicResult(res, 'fuel', result);
  } catch (error) {
    return next(error);
  }
};

export const getNews = async (req, res, next) => {
  try {
    const apiKey = await getUserNewsApiKey(req.userId);
    const result = await economicService.getEconomicData(
      ECONOMIC_DATA_TYPES.NEWS,
      { apiKey, forceRefresh: req.query.refresh === 'true' }
    );

    return res.status(HTTP_STATUS.OK).json({
      type: 'news',
      articles: result.data,
      meta: {
        cached: result.cached,
        freshness: result.freshness,
        ttl: result.ttl,
        lastFetched: new Date().toISOString(),
        source: apiKey ? 'NewsAPI (Custom Key)' : result.source
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const getAllEconomicData = async (req, res, next) => {
  try {
    const apiKey = await getUserNewsApiKey(req.userId);
    const result = await economicService.getAllEconomicData({
      apiKey,
      forceRefresh: req.query.refresh === 'true'
    });

    return res.status(HTTP_STATUS.OK).json({
      timestamp: new Date().toISOString(),
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

export const refreshAllData = async (req, res, next) => {
  try {
    const apiKey = await getUserNewsApiKey(req.userId);
    const result = await economicService.refreshAllEconomicData(apiKey);
    return res.status(HTTP_STATUS.OK).json(result);
  } catch (error) {
    return next(error);
  }
};

export const getCacheHealth = async (_req, res, next) => {
  try {
    const health = await economicService.getCacheHealth();
    return res.status(HTTP_STATUS.OK).json({
      timestamp: new Date().toISOString(),
      health
    });
  } catch (error) {
    return next(error);
  }
};

export const clearCache = async (_req, res, next) => {
  try {
    const cleared = await economicService.clearExpiredCache();
    return res.status(HTTP_STATUS.OK).json({
      message: `Cleared ${cleared} expired cache entries`,
      cleared
    });
  } catch (error) {
    return next(error);
  }
};

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
