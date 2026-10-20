/**
 * Economic Data Updater Service - Prisma (PostgreSQL)
 * Handles dynamic updates of economic indicator values from external sources
 * Mirrors Mongoose economicDataUpdater functionality
 */

import { prisma } from '../../config/prisma.js';
import axios from 'axios';

// ==========================================
// DATA SOURCE CONFIGURATIONS
// ==========================================

const DATA_SOURCES = {
  CBN_API: {
    name: 'Central Bank of Nigeria',
    baseUrl: 'https://www.cbn.gov.ng/api/rates',
    enabled: true,
    rateLimit: 1000
  },
  NBS_API: {
    name: 'National Bureau of Statistics',
    baseUrl: 'https://nbs.org.ng/api',
    enabled: true,
    rateLimit: 2000
  },
  TRADING_ECONOMICS: {
    name: 'Trading Economics',
    baseUrl: 'https://api.tradingeconomics.com',
    enabled: false,
    rateLimit: 500
  },
  FALLBACK: {
    name: 'Manual/Override Values',
    enabled: true
  }
};

// ==========================================
// INDICATOR MAPPING TO DATA SOURCES
// ==========================================

const INDICATOR_SOURCE_MAP = {
  CURRENCY_USD: { source: 'CBN_API', endpoint: '/usd-rate' },
  CURRENCY_EUR: { source: 'CBN_API', endpoint: '/eur-rate' },
  CURRENCY_GBP: { source: 'CBN_API', endpoint: '/gbp-rate' },
  INTEREST_RATE: { source: 'CBN_API', endpoint: '/mpr' },
  INTERBANK_RATE: { source: 'CBN_API', endpoint: '/interbank' },
  TREASURY_BILL_RATE: { source: 'CBN_API', endpoint: '/tbills' },
  INFLATION_RATE: { source: 'NBS_API', endpoint: '/cpi/headline' },
  FOOD_INFLATION: { source: 'NBS_API', endpoint: '/cpi/food' },
  CORE_INFLATION_RATE: { source: 'NBS_API', endpoint: '/cpi/core' },
  STOCK_MARKET: { source: 'FALLBACK', endpoint: null },
  GDP_GROWTH_RATE: { source: 'NBS_API', endpoint: '/gdp/growth' },
  GDP: { source: 'NBS_API', endpoint: '/gdp/total' },
  GDP_PER_CAPITA: { source: 'NBS_API', endpoint: '/gdp/per-capita' },
  UNEMPLOYMENT_RATE: { source: 'NBS_API', endpoint: '/labour/unemployment' }
};

// ==========================================
// UPDATE SERVICE CLASS
// ==========================================

class EconomicDataUpdater {
  constructor() {
    this.updateHistory = [];
    this.lastUpdateTime = null;
    this.updateStats = {
      total: 0,
      success: 0,
      failed: 0,
      sources: {}
    };
    this.lastRequestTime = null;
  }

  /**
   * Update all indicators from available sources
   */
  async updateAllIndicators() {
    const startTime = Date.now();
    const results = {
      updated: [],
      failed: [],
      skipped: [],
      sources: {}
    };

    try {
      // Get all indicators
      const indicators = await prisma.economicIndicator.findMany();

      // Group by source
      const bySource = {};
      indicators.forEach(indicator => {
        const mapping = INDICATOR_SOURCE_MAP[indicator.code];
        const source = mapping?.source || 'FALLBACK';
        if (!bySource[source]) bySource[source] = [];
        bySource[source].push(indicator);
      });

      // Update each source group
      for (const [sourceName, sourceIndicators] of Object.entries(bySource)) {
        const sourceConfig = DATA_SOURCES[sourceName];

        if (!sourceConfig || !sourceConfig.enabled) {
          sourceIndicators.forEach(ind => results.skipped.push({
            code: ind.code,
            reason: `Source ${sourceName} not enabled`
          }));
          continue;
        }

        if (sourceName === 'FALLBACK') {
          sourceIndicators.forEach(ind => results.skipped.push({
            code: ind.code,
            reason: 'Manual/override value - use admin endpoint to update'
          }));
          continue;
        }

        // Fetch from source
        const sourceResults = await this.updateFromSource(sourceName, sourceIndicators);
        results.updated.push(...sourceResults.updated);
        results.failed.push(...sourceResults.failed);
        results.sources[sourceName] = sourceResults;
      }

      // Calculate stats
      this.updateStats.total = indicators.length;
      this.updateStats.success = results.updated.length;
      this.updateStats.failed = results.failed.length;
      this.lastUpdateTime = new Date();

      const duration = Date.now() - startTime;

      // Log update history
      this.updateHistory.push({
        timestamp: new Date(),
        duration,
        results
      });

      // Keep only last 100 history entries
      if (this.updateHistory.length > 100) {
        this.updateHistory = this.updateHistory.slice(-100);
      }

      return {
        success: true,
        duration,
        results,
        stats: this.updateStats
      };

    } catch (error) {
      console.error('Error updating indicators:', error);
      return {
        success: false,
        error: error.message,
        results
      };
    }
  }

  /**
   * Update indicators from a specific source
   */
  async updateFromSource(sourceName, indicators) {
    const results = {
      updated: [],
      failed: [],
      source: sourceName,
      count: indicators.length
    };

    const sourceConfig = DATA_SOURCES[sourceName];

    // Apply rate limiting
    if (this.lastRequestTime && sourceConfig.rateLimit) {
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < sourceConfig.rateLimit) {
        await new Promise(resolve =>
          setTimeout(resolve, sourceConfig.rateLimit - timeSinceLastRequest)
        );
      }
    }

    try {
      // Fetch data from source
      const sourceData = await this.fetchFromSource(sourceName, indicators);

      if (!sourceData) {
        indicators.forEach(ind => results.failed.push({
          code: ind.code,
          reason: 'Failed to fetch from source'
        }));
        return results;
      }

      // Update each indicator
      for (const indicator of indicators) {
        try {
          const newValue = sourceData[indicator.code];

          if (newValue === undefined || newValue === null) {
            results.failed.push({
              code: indicator.code,
              reason: 'No data returned from source'
            });
            continue;
          }

          // Calculate change
          const change = newValue - indicator.value;
          const changePercent = indicator.value > 0
            ? ((newValue - indicator.value) / indicator.value) * 100
            : 0;

          // Determine trend
          let trend = 'stable';
          if (newValue > indicator.value) trend = 'up';
          else if (newValue < indicator.value) trend = 'down';

          // Update indicator
          const updated = await prisma.economicIndicator.update({
            where: { id: indicator.id },
            data: {
              value: newValue,
              change,
              changePercent,
              trend,
              lastUpdated: new Date(),
              // Update highest/lowest would require separate fields
              // For now, we'll store the history in the JSON field
              history: {
                ...(indicator.history || {}),
                lastUpdate: {
                  oldValue: indicator.value,
                  newValue,
                  timestamp: new Date().toISOString()
                }
              }
            }
          });

          results.updated.push({
            code: indicator.code,
            oldValue: indicator.value,
            newValue
          });

        } catch (error) {
          results.failed.push({
            code: indicator.code,
            reason: error.message
          });
        }
      }

    } catch (error) {
      console.error(`Error updating from ${sourceName}:`, error);
    }

    return results;
  }

  /**
   * Fetch data from a specific source
   */
  async fetchFromSource(sourceName, indicators) {
    const sourceConfig = DATA_SOURCES[sourceName];

    if (!sourceConfig || !sourceConfig.enabled) {
      return null;
    }

    try {
      switch (sourceName) {
        case 'CBN_API':
          return await this.fetchCBNData(indicators);
        case 'NBS_API':
          return await this.fetchNBSData(indicators);
        case 'TRADING_ECONOMICS':
          return await this.fetchTradingEconomicsData(indicators);
        default:
          return null;
      }
    } catch (error) {
      console.error(`Error fetching from ${sourceName}:`, error);
      return null;
    }
  }

  /**
   * Fetch data from CBN API
   */
  async fetchCBNData(indicators) {
    const data = {};

    // Mock implementation with recent trends
    const mockCBNData = {
      CURRENCY_USD: 1650,
      INTEREST_RATE: 26.25,
      INTERBANK_RATE: 26.5,
      TREASURY_BILL_RATE: 25.5,
      CURRENCY_EUR: 1782,
      CURRENCY_GBP: 2095
    };

    indicators.forEach(ind => {
      if (mockCBNData[ind.code] !== undefined) {
        data[ind.code] = mockCBNData[ind.code];
      }
    });

    return data;
  }

  /**
   * Fetch data from NBS API
   */
  async fetchNBSData(indicators) {
    const data = {};

    const mockNBSData = {
      INFLATION_RATE: 34.6,
      FOOD_INFLATION: 40.9,
      CORE_INFLATION_RATE: 28.5,
      GDP_GROWTH_RATE: 2.98,
      GDP: 472,
      GDP_PER_CAPITA: 2184,
      UNEMPLOYMENT_RATE: 5.8
    };

    indicators.forEach(ind => {
      if (mockNBSData[ind.code] !== undefined) {
        data[ind.code] = mockNBSData[ind.code];
      }
    });

    return data;
  }

  /**
   * Fetch data from Trading Economics API
   */
  async fetchTradingEconomicsData(indicators) {
    // Requires API key
    return null;
  }

  /**
   * Manually update a specific indicator value
   */
  async updateIndicator(code, value, source = 'MANUAL', metadata = {}) {
    try {
      const indicator = await prisma.economicIndicator.findUnique({
        where: { code }
      });

      if (!indicator) {
        throw new Error(`Indicator ${code} not found`);
      }

      const oldValue = indicator.value;
      const change = value - oldValue;
      const changePercent = oldValue > 0 ? ((value - oldValue) / oldValue) * 100 : 0;

      let trend = 'stable';
      if (value > oldValue) trend = 'up';
      else if (value < oldValue) trend = 'down';

      const updated = await prisma.economicIndicator.update({
        where: { code },
        data: {
          value,
          change,
          changePercent,
          trend,
          lastUpdated: new Date(),
          history: {
            ...(indicator.history || {}),
            lastUpdate: {
              oldValue,
              newValue: value,
              timestamp: new Date().toISOString(),
              source,
              metadata
            }
          }
        }
      });

      return {
        success: true,
        indicator: code,
        oldValue,
        newValue: value
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get update statistics
   */
  getStats() {
    return {
      lastUpdate: this.lastUpdateTime,
      stats: this.updateStats,
      historyCount: this.updateHistory.length
    };
  }

  /**
   * Get update history
   */
  getHistory(limit = 10) {
    return this.updateHistory.slice(-limit);
  }
}

// ==========================================
// EXPORTS
// ==========================================

export default new EconomicDataUpdater();
export { DATA_SOURCES, INDICATOR_SOURCE_MAP };

// SR
