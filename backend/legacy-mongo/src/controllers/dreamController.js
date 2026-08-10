/**
 * Dream Module Controller
 * Handles all Dream module endpoints including:
 * - Economic Indicators (85+ indicators)
 * - Economic News
 * - Economic Events
 * - Stress Testing
 * - Market Health
 */

import EconomicIndicator from '../models/EconomicIndicator.js';
import EconomicNews from '../models/EconomicNews.js';
import EconomicEvent from '../models/EconomicEvent.js';
import { HTTP_STATUS } from '../config/constants.js';

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Format number as currency
 */
function formatValue(value, unit) {
  if (value === null || value === undefined) return 'N/A';

  switch (unit) {
    case 'percent':
      return `${value.toFixed(2)}%`;
    case 'NGN/USD':
      return `₦${value.toLocaleString()}/$`;
    case 'points':
      return `${value.toLocaleString()} points`;
    case 'NGN Million':
      return `₦${value.toLocaleString()} Million`;
    case 'USD Billion':
      return `$${value.toLocaleString()} Billion`;
    case 'NGN/Month':
      return `₦${value.toLocaleString()}/Month`;
    case 'BBL/D/1K':
      return `${value.toLocaleString()} BBL/D/1K`;
    case 'Million':
      return `${value.toLocaleString()} Million`;
    default:
      return value.toLocaleString();
  }
}

/**
 * Get trend icon and direction
 */
function getTrendInfo(trend) {
  switch (trend) {
    case 'up': return { icon: '↑', label: 'Rising' };
    case 'down': return { icon: '↓', label: 'Falling' };
    default: return { icon: '→', label: 'Stable' };
  }
}

/**
 * Get stress level from indicator value
 */
function getStressLevel(indicator) {
  const value = indicator.value;
  const code = indicator.code;

  // Define stress thresholds
  const stressRules = {
    INFLATION_RATE: { high: 20, moderate: 15 },
    FX_RATE: { high: 1600, moderate: 1500 },
    INTEREST_RATE: { high: 25, moderate: 20 },
    UNEMPLOYMENT_RATE: { high: 8, moderate: 5 }
  };

  const rule = stressRules[code];
  if (!rule) return { level: 'moderate', color: 'orange' };

  if (value >= rule.high) return { level: 'High', color: 'red' };
  if (value >= rule.moderate) return { level: 'Moderate', color: 'orange' };
  return { level: 'Low', color: 'green' };
}

// ==========================================
// INDICATOR TICKER (Section 1)
// ==========================================

/**
 * Get indicator ticker for Dream module
 */
export const getIndicatorTicker = async (req, res, next) => {
  try {
    const { codes } = req.query;

    // Default ticker indicators
    const defaultCodes = [
      'INFLATION_RATE',
      'CURRENCY_USD',
      'FOOD_INFLATION',
      'INTEREST_RATE',
      'INTERBANK_RATE'
    ];

    const indicatorCodes = codes ? codes.split(',') : defaultCodes;

    const indicators = await EconomicIndicator.find({
      code: { $in: indicatorCodes },
      isActive: true,
      isDeleted: false
    });

    const ticker = indicators.map(ind => {
      const trend = getTrendInfo(ind.trend);
      return {
        code: ind.code,
        label: ind.name,
        value: formatValue(ind.value, ind.unit),
        rawValue: ind.value,
        change: ind.formattedChange || formatValue(ind.changePercent, 'percent'),
        trendIcon: trend.icon,
        trendLabel: trend.label
      };
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ticker
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// QUICK STATS (Section 2)
// ==========================================

/**
 * Get quick stats for Dream module
 */
export const getQuickStats = async (req, res, next) => {
  try {
    // Get economic health score
    const healthScore = await EconomicIndicator.getHealthScore();

    // Get market volatility (using inflation + fx rate variance)
    const inflation = await EconomicIndicator.getByCode('INFLATION_RATE');
    const fxRate = await EconomicIndicator.getByCode('CURRENCY_USD');

    let volatility = 'Low';
    let volatilityColor = 'green';
    let volatilitySub = 'Below 30-day average';

    if (inflation && inflation.value > 15) {
      volatility = 'High';
      volatilityColor = 'slate';
      volatilitySub = 'Above 30-day average';
    } else if (inflation && inflation.value > 10) {
      volatility = 'Moderate';
      volatilityColor = 'yellow';
    }

    // Get news count (last 24 hours)
    const recentNewsCount = await EconomicNews.getRecent(24);

    // Get next event
    const nextEvent = await EconomicEvent.getNext();

    // Build stats
    const stats = [
      {
        id: 'economic_health',
        label: 'Economic Health',
        value: healthScore,
        indicator: healthScore >= 70 ? 'green' : healthScore >= 50 ? 'orange' : 'red',
        sub: healthScore >= 70 ? 'Stable • Monitor' : healthScore >= 50 ? 'Moderate Stress • Monitor' : 'High Stress • Action Needed'
      },
      {
        id: 'market_volatility',
        label: 'Market Volatility',
        value: volatility,
        indicator: volatilityColor,
        sub: volatilitySub
      },
      {
        id: 'news_stories',
        label: 'News Stories',
        value: recentNewsCount.length,
        indicator: 'blue',
        sub: 'Last 24 hours'
      },
      {
        id: 'next_event',
        label: 'Next Event',
        value: nextEvent ? `${nextEvent.daysUntil} Days` : 'None',
        indicator: nextEvent ? nextEvent.urgencyColor : 'gray',
        sub: nextEvent ? nextEvent.title : 'No upcoming events',
        eventId: nextEvent ? nextEvent._id : null
      }
    ];

    res.status(HTTP_STATUS.OK).json({
      success: true,
      stats,
      healthScore
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// ECONOMIC STRESS TESTER (Section 3)
// ==========================================

/**
 * Get economic stress tester data
 */
export const getStressTester = async (req, res, next) => {
  try {
    // Get current user's COGS and profit if available
    const userCOGS = req.query.cogs ? parseFloat(req.query.cogs) : 500;
    const userProfit = req.query.profit ? parseFloat(req.query.profit) : 1000;

    // Get key stress indicators
    const inflation = await EconomicIndicator.getByCode('INFLATION_RATE');
    const fxRate = await EconomicIndicator.getByCode('CURRENCY_USD');
    const foodInflation = await EconomicIndicator.getByCode('FOOD_INFLATION');

    // Build stress indicators
    const stressIndicators = [];

    if (inflation) {
      const stress = getStressLevel(inflation);
      const trend = getTrendInfo(inflation.trend);
      stressIndicators.push({
        icon: '📈',
        label: 'Inflation Pressure',
        value: `${stress.level} (${formatValue(inflation.value, 'percent')})`,
        trend: `${trend.icon} ${trend.label}`,
        stressLevel: stress.level,
        stressColor: stress.color
      });
    }

    if (fxRate) {
      const stress = getStressLevel(fxRate);
      const trend = getTrendInfo(fxRate.trend);
      stressIndicators.push({
        icon: '💱',
        label: 'FX Rate Impact',
        value: `${stress.level} (${formatValue(fxRate.value, fxRate.unit)})`,
        trend: `${trend.icon} ${trend.label}`,
        stressLevel: stress.level,
        stressColor: stress.color
      });
    }

    if (foodInflation) {
      const stress = getStressLevel(foodInflation);
      const trend = getTrendInfo(foodInflation.trend);
      stressIndicators.push({
        icon: '🥜',
        label: 'Raw Material Cost',
        value: `₦${(foodInflation.value * 10).toFixed(0)}/kg (${trend.icon}${foodInflation.changePercent.toFixed(1)}%)`,
        trend: `${trend.icon} ${trend.label}`,
        stressLevel: stress.level,
        stressColor: stress.color
      });
    }

    // Calculate projections
    const inflationRate = inflation ? inflation.value / 100 : 0.16;
    const projectedCOGS = userCOGS * (1 + inflationRate);
    const projectedProfit = userProfit - (projectedCOGS - userCOGS);

    // Determine risk level
    const profitImpact = ((userProfit - projectedProfit) / userProfit) * 100;
    let riskLevel = 'Low Risk';
    let riskColor = 'green';

    if (profitImpact > 15) {
      riskLevel = 'High Risk';
      riskColor = 'red';
    } else if (profitImpact > 8) {
      riskLevel = 'Moderate Risk';
      riskColor = 'orange';
    }

    // Build projections
    const projections = {
      badge: riskLevel,
      badgeColor: riskColor,
      currentCOGS: `₦${userCOGS}/unit`,
      projectedCOGS: `₦${projectedCOGS.toFixed(0)}/unit`,
      currentProfit: `₦${userProfit}/unit`,
      projectedProfit: `₦${projectedProfit.toFixed(0)}/unit`,
      profitImpact: `${profitImpact.toFixed(1)}%`
    };

    // Generate recommendations
    const recommendations = [];
    if (inflation && inflation.value > 15) {
      recommendations.push({
        order: 1,
        action: 'Increase price by ₦50-₦100 to maintain margins'
      });
    }
    if (fxRate && fxRate.value > 1500) {
      recommendations.push({
        order: 2,
        action: 'Lock in bulk groundnut purchases before further hikes'
      });
    }
    recommendations.push({
      order: 3,
      action: 'Optimize roasting batch sizes to reduce fuel waste'
    });

    // Determine overall stress level
    const overallStress = stressIndicators.length > 0
      ? stressIndicators.every(s => s.stressLevel === 'Low') ? 'Low' :
        stressIndicators.some(s => s.stressLevel === 'High') ? 'High' : 'Moderate'
      : 'Moderate';

    const response = {
      success: true,
      stressTester: {
        meta: {
          badge: 'Feature 1',
          title: 'Economic Stress Tester',
          pill: 'Auto-Updated Daily',
          description: 'Live economic stress projections based on current market conditions',
          lastUpdated: new Date().toLocaleString(),
          isLive: true
        },
        indicators: stressIndicators,
        projections,
        recommendations,
        overallStress
      }
    };

    res.status(HTTP_STATUS.OK).json(response);

  } catch (error) {
    next(error);
  }
};

// ==========================================
// COMMODITY & ECONOMIC FEED (Section 4)
// ==========================================

/**
 * Get commodity and economic feed (news)
 */
export const getEconomicFeed = async (req, res, next) => {
  try {
    const { limit = 10, category, severity } = req.query;

    const options = {
      limit: parseInt(limit),
      category,
      severity
    };

    const news = await EconomicNews.getActive(options);

    const feedItems = news.map(item => ({
      id: item._id,
      tag: item.tag,
      timeAgo: item.timeAgo,
      headline: item.title,
      body: item.body,
      category: item.category,
      severity: item.severity,
      severityIcon: item.severityIcon,
      source: item.source,
      url: item.sourceUrl,
      impactLevel: item.impactLevel,
      affectedCommodities: item.affectedCommodities
    }));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      meta: {
        badge: 'Feature 2',
        title: 'Local Commodity & Economic Feed',
        pill: 'Market Radar',
        description: 'Real-time local market intelligence affecting your business',
        count: feedItems.length
      },
      feed: feedItems
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// INDICATORS BY CATEGORY
// ==========================================

/**
 * Get all indicators by category
 */
export const getIndicatorsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;

    const indicators = await EconomicIndicator.getByCategory(category);

    const categorized = indicators.map(ind => {
      const trend = getTrendInfo(ind.trend);
      const stress = getStressLevel(ind);

      return {
        code: ind.code,
        name: ind.name,
        description: ind.description,
        category: ind.category,
        value: ind.value,
        formattedValue: ind.formattedValue,
        unit: ind.unit,
        previous: ind.previous,
        highest: ind.highest,
        lowest: ind.lowest,
        change: ind.change,
        changePercent: ind.changePercent,
        formattedChange: ind.formattedChange,
        trend: ind.trend,
        trendIcon: trend.icon,
        trendLabel: trend.label,
        stressLevel: stress.level,
        stressColor: stress.color,
        lastUpdated: ind.timestamp,
        frequency: ind.frequency,
        priority: ind.priority
      };
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      category,
      count: categorized.length,
      indicators: categorized
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get all indicators with filtering
 */
export const getAllIndicators = async (req, res, next) => {
  try {
    const { category, limit = 100, skip = 0 } = req.query;

    const query = {
      isActive: true,
      isDeleted: false
    };

    if (category) {
      query.category = category;
    }

    const indicators = await EconomicIndicator.find(query)
      .sort({ category: 1, priority: -1, code: 1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await EconomicIndicator.countDocuments(query);

    // Group by category
    const grouped = {};
    indicators.forEach(ind => {
      if (!grouped[ind.category]) {
        grouped[ind.category] = [];
      }
      grouped[ind.category].push({
        code: ind.code,
        name: ind.name,
        value: ind.value,
        formattedValue: ind.formattedValue,
        unit: ind.unit,
        changePercent: ind.changePercent,
        formattedChange: ind.formattedChange,
        trend: ind.trend,
        priority: ind.priority
      });
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      total,
      categories: Object.keys(grouped),
      indicators: grouped
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get single indicator by code
 */
export const getIndicatorByCode = async (req, res, next) => {
  try {
    const { code } = req.params;

    const indicator = await EconomicIndicator.getByCode(code);

    if (!indicator) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: `Indicator ${code} not found`
      });
    }

    const trend = getTrendInfo(indicator.trend);
    const stress = getStressLevel(indicator);

    const response = {
      success: true,
      indicator: {
        code: indicator.code,
        name: indicator.name,
        description: indicator.description,
        category: indicator.category,
        value: indicator.value,
        formattedValue: indicator.formattedValue,
        unit: indicator.unit,
        previous: indicator.previous,
        highest: indicator.highest,
        lowest: indicator.lowest,
        highestDate: indicator.highestDate,
        lowestDate: indicator.lowestDate,
        change: indicator.change,
        changePercent: indicator.changePercent,
        formattedChange: indicator.formattedChange,
        trend: indicator.trend,
        trendIcon: trend.icon,
        trendLabel: trend.label,
        stressLevel: stress.level,
        stressColor: stress.color,
        timestamp: indicator.timestamp,
        lastFetched: indicator.lastFetched,
        frequency: indicator.frequency,
        priority: indicator.priority,
        source: indicator.source,
        tags: indicator.tags,
        history: indicator.history.slice(-30) // Last 30 data points
      }
    };

    res.status(HTTP_STATUS.OK).json(response);

  } catch (error) {
    next(error);
  }
};

// ==========================================
// EVENTS
// ==========================================

/**
 * Get upcoming events
 */
export const getUpcomingEvents = async (req, res, next) => {
  try {
    const { limit = 10, category, importance } = req.query;

    const options = {
      limit: parseInt(limit),
      category,
      importance
    };

    const events = await EconomicEvent.getUpcoming(options);

    const eventList = events.map(event => ({
      id: event._id,
      code: event.code,
      title: event.title,
      description: event.description,
      category: event.category,
      importance: event.importance,
      eventDate: event.eventDate,
      formattedDate: event.formattedDate,
      eventTime: event.eventTime,
      daysUntil: event.daysUntil,
      urgency: event.urgency,
      urgencyColor: event.urgencyColor,
      status: event.status,
      expectedValue: event.expectedValue,
      previousValue: event.previousValue,
      affectedIndicators: event.affectedIndicators,
      isVirtual: event.isVirtual,
      location: event.location
    }));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: eventList.length,
      events: eventList
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get single event by code
 */
export const getEventByCode = async (req, res, next) => {
  try {
    const { code } = req.params;

    const event = await EconomicEvent.findOne({
      code: code.toUpperCase(),
      isActive: true,
      isDeleted: false
    });

    if (!event) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: `Event ${code} not found`
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      event
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// HEALTH SCORE
// ==========================================

/**
 * Get economic health score
 */
export const getHealthScore = async (req, res, next) => {
  try {
    const score = await EconomicIndicator.getHealthScore();

    // Get components
    const inflation = await EconomicIndicator.getByCode('INFLATION_RATE');
    const gdpGrowth = await EconomicIndicator.getByCode('GDP_GROWTH_RATE');
    const fxRate = await EconomicIndicator.getByCode('CURRENCY_USD');
    const unemployment = await EconomicIndicator.getByCode('UNEMPLOYMENT_RATE');

    const components = [];
    if (inflation) {
      const stress = getStressLevel(inflation);
      components.push({
        name: 'Inflation',
        value: inflation.value,
        formatted: formatValue(inflation.value, inflation.unit),
        impact: inflation.value > 20 ? -20 : inflation.value > 15 ? -10 : inflation.value > 10 ? -5 : 0,
        stress: stress.level
      });
    }
    if (gdpGrowth) {
      const stress = getStressLevel(gdpGrowth);
      components.push({
        name: 'GDP Growth',
        value: gdpGrowth.value,
        formatted: formatValue(gdpGrowth.value, gdpGrowth.unit),
        impact: gdpGrowth.value < 0 ? -15 : gdpGrowth.value < 2 ? -5 : gdpGrowth.value > 5 ? 5 : 0,
        stress: stress.level
      });
    }
    if (fxRate) {
      const stress = getStressLevel(fxRate);
      components.push({
        name: 'FX Rate',
        value: fxRate.value,
        formatted: formatValue(fxRate.value, fxRate.unit),
        impact: fxRate.value > 1500 ? -10 : 0,
        stress: stress.level
      });
    }
    if (unemployment) {
      const stress = getStressLevel(unemployment);
      components.push({
        name: 'Unemployment',
        value: unemployment.value,
        formatted: formatValue(unemployment.value, unemployment.unit),
        impact: unemployment.value > 10 ? -15 : unemployment.value > 5 ? -5 : 0,
        stress: stress.level
      });
    }

    // Determine overall status
    let status = 'healthy';
    let color = 'green';
    if (score < 50) {
      status = 'critical';
      color = 'red';
    } else if (score < 70) {
      status = 'moderate';
      color = 'orange';
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      healthScore: {
        score,
        status,
        color,
        components,
        calculatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// OVERVIEW (All sections combined)
// ==========================================

/**
 * Get complete Dream module overview
 */
export const getDreamOverview = async (req, res, next) => {
  try {
    const { cogs, profit } = req.query;

    // Get all sections in parallel
    const [
      tickerResult,
      statsResult,
      stressResult,
      feedResult,
      healthResult
    ] = await Promise.allSettled([
      getIndicatorTicker({ query: {} }, { json: () => {} }),
      getQuickStats({ query: {} }, { json: () => {} }),
      getStressTester({ query: { cogs, profit } }, { json: () => {} }),
      getEconomicFeed({ query: { limit: 5 } }, { json: () => {} }),
      EconomicIndicator.getHealthScore()
    ]);

    const overview = {
      timestamp: new Date().toISOString(),
      ticker: tickerResult.status === 'fulfilled' ? tickerResult.value.ticker : [],
      quickStats: statsResult.status === 'fulfilled' ? statsResult.value.stats : [],
      stressTester: stressResult.status === 'fulfilled' ? stressResult.value.stressTester : null,
      economicFeed: feedResult.status === 'fulfilled' ? feedResult.value.feed : [],
      healthScore: typeof healthResult === 'number' ? healthResult : 72
    };

    res.status(HTTP_STATUS.OK).json({
      success: true,
      overview
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
  getDreamOverview,
  getIndicatorTicker,
  getQuickStats,
  getStressTester,
  getEconomicFeed,

  // Indicators
  getAllIndicators,
  getIndicatorsByCategory,
  getIndicatorByCode,

  // Events
  getUpcomingEvents,
  getEventByCode,

  // Health
  getHealthScore
};
