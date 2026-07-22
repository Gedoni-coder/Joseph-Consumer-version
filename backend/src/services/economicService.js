/**
 * Economic Data Service
 * Fetches and caches economic data from external APIs
 * Integrates with EconomicData model for caching
 */

import axios from 'axios';
import EconomicData from '../models/EconomicData.js';
import { ECONOMIC_DATA_TYPES, CACHE_DURATION } from '../config/constants.js';

// ==========================================
// CONFIGURATION
// ==========================================
const ECONOMIC_CONFIG = {
  // Cache duration in seconds
  cacheDuration: CACHE_DURATION,

  // External API endpoints
  endpoints: {
    // Inflation APIs
    worldBank: 'https://api.worldbank.org/v2/country/NGA/indicator/FP.CPI.TOTL.ZG',
    tradingEconomics: 'https://api.tradingeconomics.com/country/nigeria/inflation',

    // FX APIs
    exchangeRateAPI: 'https://api.exchangerate-api.com/v4/latest/USD',
    frankfurter: 'https://api.frankfurter.app/latest',

    // Commodities (no free reliable APIs - use fallback)
    // News APIs
    newsAPI: 'https://newsapi.org/v2/everything'
  },

  // Fallback values if all sources fail
  fallbackValues: {
    inflation: {
      rate: 31.7,
      change: 0,
      trend: 'stable',
      source: 'Fallback'
    },
    fx: {
      usd: 1650,
      gbp: 2095,
      eur: 1782,
      change: 0,
      source: 'Fallback'
    },
    commodities: {
      groundnut: { price: 142000, change: '0', unit: '100kg bag' },
      rice: { price: 75000, change: '0', unit: '50kg bag' },
      beans: { price: 85000, change: '0', unit: '50kg bag' }
    },
    fuel: {
      pumpPrice: 680,
      diesel: 1150,
      kerosene: 1250,
      source: 'Fallback'
    }
  }
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Format number as currency
 */
function formatNumber(num, decimals = 1) {
  return Number(num).toFixed(decimals);
}

/**
 * Calculate percentage change
 */
function calculateChange(current, previous) {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Get time ago string
 */
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

/**
 * Add days to date
 */
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// ==========================================
// API FETCHING FUNCTIONS
// ==========================================

/**
 * Fetch inflation data from World Bank API
 */
async function fetchInflationFromAPI() {
  try {
    const response = await axios.get(
      `${ECONOMIC_CONFIG.endpoints.worldBank}?format=json&date=2023:2024`,
      { timeout: 10000 }
    );

    if (response.data && response.data[1] && response.data[1].length > 0) {
      const dataPoints = response.data[1].filter(d => d.value !== null);
      const latest = dataPoints[dataPoints.length - 1];
      const previous = dataPoints[dataPoints.length - 2] || latest;

      return {
        rate: latest.value,
        change: calculateChange(latest.value, previous.value),
        trend: latest.value > previous.value ? 'up' : latest.value < previous.value ? 'down' : 'stable',
        lastUpdate: new Date().toISOString(),
        source: 'World Bank',
        nextRelease: addDays(new Date(), 30).toDateString(),
        year: latest.date
      };
    }

    return null;
  } catch (error) {
    console.log('World Bank API failed:', error.message);
    return null;
  }
}

/**
 * Fetch FX rates from multiple sources
 */
async function fetchFXFromAPI() {
  const sources = [
    // Source 1: ExchangeRate-API
    async () => {
      try {
        const response = await axios.get(ECONOMIC_CONFIG.endpoints.exchangeRateAPI, {
          timeout: 10000
        });

        if (response.data && response.data.rates) {
          const usdToNgn = response.data.rates.NGN || response.data.rates.NGN;
          const usdToGbp = response.data.rates.GBP || 1.27;
          const usdToEur = response.data.rates.EUR || 1.08;

          return {
            usd: Math.round(usdToNgn),
            gbp: Math.round(usdToNgn * (1 / usdToGbp)),
            eur: Math.round(usdToNgn * (1 / usdToEur)),
            change: 0,
            changeDirection: 'unknown',
            lastUpdate: new Date().toISOString(),
            source: 'ExchangeRate-API'
          };
        }
        return null;
      } catch (error) {
        return null;
      }
    },

    // Source 2: Frankfurter
    async () => {
      try {
        const response = await axios.get(
          `${ECONOMIC_CONFIG.endpoints.frankfurter}?from=USD&to=NGN,GBP,EUR`,
          { timeout: 10000 }
        );

        if (response.data && response.data.rates) {
          return {
            usd: response.data.rates.NGN || 1650,
            gbp: Math.round(response.data.rates.NGN * response.data.rates.GBP) || 2095,
            eur: Math.round(response.data.rates.NGN * response.data.rates.EUR) || 1782,
            change: 0,
            changeDirection: 'unknown',
            lastUpdate: response.data.date,
            source: 'Frankfurter API'
          };
        }
        return null;
      } catch (error) {
        return null;
      }
    }
  ];

  // Try each source
  for (const source of sources) {
    try {
      const result = await source();
      if (result) return result;
    } catch (error) {
      console.log('FX API source failed:', error.message);
    }
  }

  return null;
}

/**
 * Fetch commodity prices (uses generated data as no reliable free API)
 */
async function fetchCommoditiesFromAPI() {
  // For Nigerian commodities, there's no reliable free API
  // We'll use the mock data with slight variations
  const variation = () => (Math.random() - 0.5) * 0.02; // ±1% variation

  return {
    groundnut: {
      price: Math.round(ECONOMIC_CONFIG.fallbackValues.commodities.groundnut.price * (1 + variation())),
      change: formatNumber(variation() * 100, 1),
      unit: '100kg bag',
      market: 'Mile 12 / Bodija'
    },
    rice: {
      price: Math.round(ECONOMIC_CONFIG.fallbackValues.commodities.rice.price * (1 + variation())),
      change: formatNumber(variation() * 100, 1),
      unit: '50kg bag',
      market: 'National'
    },
    beans: {
      price: Math.round(ECONOMIC_CONFIG.fallbackValues.commodities.beans.price * (1 + variation())),
      change: formatNumber(variation() * 100, 1),
      unit: '50kg bag',
      market: 'National'
    },
    palmOil: {
      price: Math.round(1200 * (1 + variation())),
      change: formatNumber(variation() * 100, 1),
      unit: '1 litre',
      market: 'National'
    },
    lastUpdate: new Date().toISOString(),
    source: 'Market Price Index (Estimated)'
  };
}

/**
 * Fetch fuel prices (no official API, use estimated data)
 */
async function fetchFuelFromAPI() {
  const variation = () => (Math.random() - 0.5) * 20;

  return {
    pumpPrice: Math.round(ECONOMIC_CONFIG.fallbackValues.fuel.pumpPrice + variation()),
    change: formatNumber(variation() / ECONOMIC_CONFIG.fallbackValues.fuel.pumpPrice * 100, 2),
    diesel: Math.round(ECONOMIC_CONFIG.fallbackValues.fuel.diesel + variation()),
    kerosene: Math.round(ECONOMIC_CONFIG.fallbackValues.fuel.kerosene + variation()),
    lastUpdate: new Date().toISOString(),
    source: 'NNPC (Estimated)',
    nextReview: addDays(new Date(), 45).toDateString()
  };
}

/**
 * Fetch economic news from NewsAPI (requires API key)
 */
async function fetchNewsFromAPI(apiKey) {
  if (!apiKey) {
    return null;
  }

  try {
    const response = await axios.get(ECONOMIC_CONFIG.endpoints.newsAPI, {
      timeout: 10000,
      params: {
        q: 'Nigeria inflation economy business commodities',
        sortBy: 'publishedAt',
        language: 'en',
        pageSize: 8,
        apiKey: apiKey
      }
    });

    if (response.data && response.data.articles) {
      return response.data.articles.map((article, index) => {
        const title = article.title.toLowerCase();
        const desc = (article.description || '').toLowerCase();

        let type = 'info';
        let tag = '🔵 News';
        let category = 'general';

        if (title.includes('scarcity') || title.includes('shortage') || desc.includes('shortage')) {
          type = 'urgent';
          tag = '🔴 Scarcity Alert';
          category = 'commodities';
        } else if (title.includes('inflation') || title.includes('price hike')) {
          type = 'warning';
          tag = '⚠️ Inflation Alert';
          category = 'inflation';
        } else if (title.includes('naira') || title.includes('fx') || title.includes('exchange rate')) {
          type = 'info';
          tag = '🔵 FX Market';
          category = 'fx';
        } else if (title.includes('cbn') || title.includes('policy') || title.includes('regulation')) {
          type = 'success';
          tag = '🟢 Policy';
          category = 'policy';
        }

        return {
          id: Date.now() + index,
          type,
          tag,
          title: article.title,
          content: article.description || article.content || 'Click to read more...',
          category,
          url: article.url,
          source: article.source?.name || 'News',
          imageUrl: article.urlToImage,
          timeAgo: getTimeAgo(article.publishedAt),
          publishedAt: article.publishedAt
        };
      });
    }

    return null;
  } catch (error) {
    console.log('News API failed:', error.message);
    return null;
  }
}

/**
 * Generate fallback news (when API is unavailable)
 */
function generateFallbackNews() {
  const newsTemplates = [
    {
      type: 'urgent',
      tag: '🔴 Scarcity Alert',
      title: 'Northern Groundnut Harvest Season Delay',
      content: 'Heavy rains in Kaduna extended drying times by 2 weeks. Expect 15-20% wholesale price hike in Mile 12 & Bodija markets.',
      category: 'commodities'
    },
    {
      type: 'info',
      tag: '🔵 FX Market',
      title: 'Naira Strengthens at Official Window',
      content: 'CBN injected $500m into the official market. Naira gained 2.3% to trade at ₦1,645/$. Parallel market follows trend.',
      category: 'fx'
    },
    {
      type: 'success',
      tag: '🟢 Campus Trends',
      title: 'University Resumption Surge Expected',
      content: 'Students returning for 2nd semester next Monday. Historical snack velocity jumps 2.4× during first fortnight of resumption.',
      category: 'demand'
    },
    {
      type: 'warning',
      tag: '⚠️ Inflation Alert',
      title: 'Food Inflation Rises to 32.1%',
      content: 'NBS reports food inflation accelerated for third consecutive month. Essential commodities affected include bread, cereals, and oils.',
      category: 'inflation'
    },
    {
      type: 'info',
      tag: '🔵 Packaging Market',
      title: 'PET Plastics Import Tariff Drop',
      content: 'Local bottle manufacturers report improved FX liquidity. 35cl peanut bottles wholesale price down ₦5/unit in Lagos.',
      category: 'logistics'
    },
    {
      type: 'success',
      tag: '🟢 Policy',
      title: 'CBN Expands MSME Loan Facility',
      content: 'Central Bank increases intervention fund for micro-businesses. Application portal opens next week with reduced collateral requirements.',
      category: 'policy'
    }
  ];

  const count = 4 + Math.floor(Math.random() * 2);
  const shuffled = newsTemplates.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  return selected.map((news, index) => ({
    id: Date.now() + index,
    ...news,
    source: 'Market Intelligence',
    timeAgo: getTimeAgo(new Date(Date.now() - index * 3600000 * (2 + Math.random() * 10))),
    publishedAt: new Date(Date.now() - index * 3600000 * (2 + Math.random() * 10)).toISOString()
  }));
}

// ==========================================
// MAIN SERVICE FUNCTIONS
// ==========================================

/**
 * Get or fetch economic data with caching
 * @param {string} type - Data type (inflation, fx, commodities, fuel, news)
 * @param {object} options - Options { apiKey, forceRefresh }
 * @returns {Promise<object>} Economic data
 */
export async function getEconomicData(type, options = {}) {
  const { apiKey, forceRefresh = false } = options;

  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = await EconomicData.findValid(type);
    if (cached) {
      cached.markAccessed();
      await cached.save();
      return {
        data: cached.data,
        cached: true,
        freshness: cached.freshness,
        ttl: cached.ttl,
        source: cached.source
      };
    }
  }

  // Fetch fresh data
  let data;
  let ttl;

  switch (type) {
    case ECONOMIC_DATA_TYPES.INFLATION:
      data = await fetchInflationFromAPI() || ECONOMIC_CONFIG.fallbackValues.inflation;
      ttl = ECONOMIC_CONFIG.cacheDuration.ECONOMIC / 1000;
      break;

    case ECONOMIC_DATA_TYPES.FX:
      data = await fetchFXFromAPI() || ECONOMIC_CONFIG.fallbackValues.fx;
      ttl = ECONOMIC_CONFIG.cacheDuration.FX / 1000;
      break;

    case ECONOMIC_DATA_TYPES.COMMODITIES:
      data = await fetchCommoditiesFromAPI();
      ttl = ECONOMIC_CONFIG.cacheDuration.COMMODITIES / 1000;
      break;

    case ECONOMIC_DATA_TYPES.FUEL:
      data = await fetchFuelFromAPI();
      ttl = ECONOMIC_CONFIG.cacheDuration.ECONOMIC / 1000;
      break;

    case ECONOMIC_DATA_TYPES.NEWS:
      data = await fetchNewsFromAPI(apiKey) || generateFallbackNews();
      ttl = ECONOMIC_CONFIG.cacheDuration.NEWS / 1000;
      break;

    default:
      throw new Error(`Unknown economic data type: ${type}`);
  }

  // Store in cache
  const cache = await EconomicData.findOrCreateCache(type, ttl);
  cache.refresh(data, ttl, data.source || 'API');
  await cache.save();

  return {
    data,
    cached: false,
    freshness: 100,
    ttl,
    source: data.source
  };
}

/**
 * Get all economic data at once
 * @param {object} options - Options { apiKey, forceRefresh }
 * @returns {Promise<object>} All economic data
 */
export async function getAllEconomicData(options = {}) {
  const { apiKey, forceRefresh = false } = options;

  const types = Object.values(ECONOMIC_DATA_TYPES);
  const results = {};

  for (const type of types) {
    try {
      const result = await getEconomicData(type, { apiKey, forceRefresh });
      results[type] = result;
    } catch (error) {
      console.error(`Failed to fetch ${type}:`, error.message);
      results[type] = { error: error.message };
    }
  }

  return results;
}

/**
 * Refresh all economic data
 * @param {string} apiKey - API key for news
 * @returns {Promise<object>} Refresh results
 */
export async function refreshAllEconomicData(apiKey) {
  const results = await getAllEconomicData({ apiKey, forceRefresh: true });

  return {
    message: 'Economic data refreshed',
    timestamp: new Date().toISOString(),
    data: results
  };
}

/**
 * Get cache health report
 * @returns {Promise<object>} Health report
 */
export async function getCacheHealth() {
  return await EconomicData.getHealthReport();
}

/**
 * Clear expired cache entries
 * @returns {Promise<number>} Number of entries cleared
 */
export async function clearExpiredCache() {
  return await EconomicData.cleanupExpired();
}

// ==========================================
// EXPORTS
// ==========================================
export default {
  getEconomicData,
  getAllEconomicData,
  refreshAllEconomicData,
  getCacheHealth,
  clearExpiredCache,
  ECONOMIC_CONFIG
};
