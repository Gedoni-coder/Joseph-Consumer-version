import { prisma } from '../config/prisma';
import { HTTP_STATUS } from '../config/constants';

const formatValue = (value: number | null | undefined, unit?: string | null) => {
  if (value === null || value === undefined) return 'N/A';

  switch (unit) {
    case 'percent':
      return `${value.toFixed(2)}%`;
    case 'NGN/USD':
      return `NGN ${value.toLocaleString()}/$`;
    case 'points':
      return `${value.toLocaleString()} points`;
    case 'NGN Million':
      return `NGN ${value.toLocaleString()} Million`;
    case 'USD Billion':
      return `$${value.toLocaleString()} Billion`;
    default:
      return value.toLocaleString();
  }
};

const getTrendInfo = (trend?: string | null) => {
  switch (trend) {
    case 'up':
      return { icon: 'up', label: 'Rising' };
    case 'down':
      return { icon: 'down', label: 'Falling' };
    default:
      return { icon: 'stable', label: 'Stable' };
  }
};

const getStressLevel = (indicator) => {
  const stressRules = {
    INFLATION_RATE: { high: 20, moderate: 15 },
    CURRENCY_USD: { high: 1600, moderate: 1500 },
    INTEREST_RATE: { high: 25, moderate: 20 },
    UNEMPLOYMENT_RATE: { high: 8, moderate: 5 }
  };
  const rule = stressRules[indicator.code];

  if (!rule) return { level: 'Moderate', color: 'orange' };
  if (indicator.value >= rule.high) return { level: 'High', color: 'red' };
  if (indicator.value >= rule.moderate) return { level: 'Moderate', color: 'orange' };
  return { level: 'Low', color: 'green' };
};

const calculateHealthScore = async () => {
  const indicators = await prisma.economicIndicator.findMany({
    where: {
      code: { in: ['INFLATION_RATE', 'GDP_GROWTH_RATE', 'CURRENCY_USD', 'UNEMPLOYMENT_RATE'] }
    }
  });

  let score = 75;
  for (const indicator of indicators) {
    if (indicator.code === 'INFLATION_RATE' && indicator.value > 20) score -= 20;
    if (indicator.code === 'GDP_GROWTH_RATE' && indicator.value < 2) score -= 10;
    if (indicator.code === 'CURRENCY_USD' && indicator.value > 1500) score -= 10;
    if (indicator.code === 'UNEMPLOYMENT_RATE' && indicator.value > 8) score -= 15;
  }

  return Math.max(0, Math.min(100, score));
};

export const getIndicatorTicker = async (req, res, next) => {
  try {
    const defaultCodes = [
      'INFLATION_RATE',
      'CURRENCY_USD',
      'FOOD_INFLATION',
      'INTEREST_RATE',
      'INTERBANK_RATE'
    ];
    const indicatorCodes = req.query.codes
      ? String(req.query.codes).split(',')
      : defaultCodes;

    const indicators = await prisma.economicIndicator.findMany({
      where: { code: { in: indicatorCodes } }
    });

    const ticker = indicators.map((indicator) => {
      const trend = getTrendInfo(indicator.trend);
      return {
        code: indicator.code,
        label: indicator.name,
        value: formatValue(indicator.value, indicator.unit),
        rawValue: indicator.value,
        change: formatValue(indicator.changePercent, 'percent'),
        trendIcon: trend.icon,
        trendLabel: trend.label
      };
    });

    return res.status(HTTP_STATUS.OK).json({ success: true, ticker });
  } catch (error) {
    return next(error);
  }
};

export const getQuickStats = async (_req, res, next) => {
  try {
    const healthScore = await calculateHealthScore();
    const inflation = await prisma.economicIndicator.findUnique({
      where: { code: 'INFLATION_RATE' }
    });
    const recentNewsCount = await prisma.economicNews.count({
      where: { publishedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
    });
    const nextEvent = await prisma.economicEvent.findFirst({
      where: { eventDate: { gte: new Date() } },
      orderBy: { eventDate: 'asc' }
    });

    const daysUntil = nextEvent
      ? Math.ceil((nextEvent.eventDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      : null;
    const volatility = inflation && inflation.value > 15 ? 'High' : 'Low';

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      stats: [
        {
          id: 'economic_health',
          label: 'Economic Health',
          value: healthScore,
          indicator: healthScore >= 70 ? 'green' : healthScore >= 50 ? 'orange' : 'red'
        },
        {
          id: 'market_volatility',
          label: 'Market Volatility',
          value: volatility,
          indicator: volatility === 'High' ? 'slate' : 'green'
        },
        {
          id: 'news_stories',
          label: 'News Stories',
          value: recentNewsCount,
          indicator: 'blue'
        },
        {
          id: 'next_event',
          label: 'Next Event',
          value: daysUntil === null ? 'None' : `${daysUntil} Days`,
          indicator: daysUntil !== null && daysUntil <= 7 ? 'orange' : 'gray',
          sub: nextEvent?.name ?? 'No upcoming events',
          eventId: nextEvent?.id ?? null
        }
      ],
      healthScore
    });
  } catch (error) {
    return next(error);
  }
};

export const getStressTester = async (req, res, next) => {
  try {
    const userCOGS = req.query.cogs ? Number(req.query.cogs) : 500;
    const userProfit = req.query.profit ? Number(req.query.profit) : 1000;
    const indicators = await prisma.economicIndicator.findMany({
      where: { code: { in: ['INFLATION_RATE', 'CURRENCY_USD', 'FOOD_INFLATION'] } }
    });

    const stressIndicators = indicators.map((indicator) => {
      const stress = getStressLevel(indicator);
      const trend = getTrendInfo(indicator.trend);
      return {
        label: indicator.name,
        value: `${stress.level} (${formatValue(indicator.value, indicator.unit)})`,
        trend: `${trend.icon} ${trend.label}`,
        stressLevel: stress.level,
        stressColor: stress.color
      };
    });
    const inflation = indicators.find((indicator) => indicator.code === 'INFLATION_RATE');
    const inflationRate = inflation ? inflation.value / 100 : 0.16;
    const projectedCOGS = userCOGS * (1 + inflationRate);
    const projectedProfit = userProfit - (projectedCOGS - userCOGS);
    const profitImpact = userProfit ? ((userProfit - projectedProfit) / userProfit) * 100 : 0;

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      stressTester: {
        meta: {
          badge: 'Feature 1',
          title: 'Economic Stress Tester',
          pill: 'Auto-Updated Daily',
          description: 'Live economic stress projections based on current market conditions',
          lastUpdated: new Date().toISOString(),
          isLive: true
        },
        indicators: stressIndicators,
        projections: {
          badge: profitImpact > 15 ? 'High Risk' : profitImpact > 8 ? 'Moderate Risk' : 'Low Risk',
          currentCOGS: `NGN ${userCOGS}/unit`,
          projectedCOGS: `NGN ${projectedCOGS.toFixed(0)}/unit`,
          currentProfit: `NGN ${userProfit}/unit`,
          projectedProfit: `NGN ${projectedProfit.toFixed(0)}/unit`,
          profitImpact: `${profitImpact.toFixed(1)}%`
        },
        recommendations: [
          { order: 1, action: 'Review prices against current inflation pressure' },
          { order: 2, action: 'Lock in bulk purchases before cost increases' },
          { order: 3, action: 'Optimize batch sizes to reduce waste' }
        ]
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const getEconomicFeed = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit || 10);
    const category = req.query.category ? String(req.query.category) : undefined;
    const news = await prisma.economicNews.findMany({
      where: category ? { affectedSectors: { contains: category } } : undefined,
      orderBy: { publishedAt: 'desc' },
      take: limit
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      meta: {
        badge: 'Feature 2',
        title: 'Local Commodity & Economic Feed',
        pill: 'Market Radar',
        count: news.length
      },
      feed: news.map((item) => ({
        id: item.id,
        headline: item.title,
        body: item.summary,
        source: item.source,
        url: item.url,
        category: item.affectedSectors,
        severity: item.impact,
        publishedAt: item.publishedAt
      }))
    });
  } catch (error) {
    return next(error);
  }
};

export const getIndicatorsByCategory = async (req, res, next) => {
  try {
    const indicators = await prisma.economicIndicator.findMany({
      where: { category: req.params.category },
      orderBy: [{ category: 'asc' }, { code: 'asc' }]
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      category: req.params.category,
      count: indicators.length,
      indicators
    });
  } catch (error) {
    return next(error);
  }
};

export const getAllIndicators = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit || 100);
    const skip = Number(req.query.skip || 0);
    const where = req.query.category ? { category: String(req.query.category) } : {};
    const [indicators, total] = await Promise.all([
      prisma.economicIndicator.findMany({
        where,
        orderBy: [{ category: 'asc' }, { code: 'asc' }],
        take: limit,
        skip
      }),
      prisma.economicIndicator.count({ where })
    ]);

    const grouped = indicators.reduce((acc, indicator) => {
      acc[indicator.category] ??= [];
      acc[indicator.category].push(indicator);
      return acc;
    }, {});

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      total,
      categories: Object.keys(grouped),
      indicators: grouped
    });
  } catch (error) {
    return next(error);
  }
};

export const getIndicatorByCode = async (req, res, next) => {
  try {
    const indicator = await prisma.economicIndicator.findUnique({
      where: { code: String(req.params.code).toUpperCase() }
    });

    if (!indicator) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: `Indicator ${req.params.code} not found`
      });
    }

    return res.status(HTTP_STATUS.OK).json({ success: true, indicator });
  } catch (error) {
    return next(error);
  }
};

export const getUpcomingEvents = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit || 10);
    const events = await prisma.economicEvent.findMany({
      where: { eventDate: { gte: new Date() } },
      orderBy: { eventDate: 'asc' },
      take: limit
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    return next(error);
  }
};

export const getEventByCode = async (req, res, next) => {
  try {
    const event = await prisma.economicEvent.findUnique({
      where: { code: String(req.params.code).toUpperCase() }
    });

    if (!event) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: `Event ${req.params.code} not found`
      });
    }

    return res.status(HTTP_STATUS.OK).json({ success: true, event });
  } catch (error) {
    return next(error);
  }
};

export const getHealthScore = async (_req, res, next) => {
  try {
    const score = await calculateHealthScore();
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      healthScore: {
        score,
        status: score < 50 ? 'critical' : score < 70 ? 'moderate' : 'healthy',
        color: score < 50 ? 'red' : score < 70 ? 'orange' : 'green',
        calculatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const getDreamOverview = async (req, res, next) => {
  try {
    const [ticker, stats, stress, feed, health] = await Promise.all([
      prisma.economicIndicator.findMany({
        where: {
          code: {
            in: ['INFLATION_RATE', 'CURRENCY_USD', 'FOOD_INFLATION', 'INTEREST_RATE', 'INTERBANK_RATE']
          }
        }
      }),
      calculateHealthScore(),
      prisma.economicIndicator.findMany({
        where: { code: { in: ['INFLATION_RATE', 'CURRENCY_USD', 'FOOD_INFLATION'] } }
      }),
      prisma.economicNews.findMany({ orderBy: { publishedAt: 'desc' }, take: 5 }),
      calculateHealthScore()
    ]);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      overview: {
        timestamp: new Date().toISOString(),
        ticker,
        quickStats: { healthScore: stats },
        stressTester: stress,
        economicFeed: feed,
        healthScore: health,
        inputs: {
          cogs: req.query.cogs ?? null,
          profit: req.query.profit ?? null
        }
      }
    });
  } catch (error) {
    return next(error);
  }
};

export default {
  getDreamOverview,
  getIndicatorTicker,
  getQuickStats,
  getStressTester,
  getEconomicFeed,
  getAllIndicators,
  getIndicatorsByCategory,
  getIndicatorByCode,
  getUpcomingEvents,
  getEventByCode,
  getHealthScore
};

// SR
