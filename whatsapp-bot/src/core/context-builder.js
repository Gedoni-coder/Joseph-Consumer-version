/**
 * Context Builder
 * Fetches relevant data from backend and builds user context
 * Handles graceful degradation when backend is unavailable
 */

import { apiClient } from '../utils/api-client.js';

/**
 * Cache for frequently accessed data
 * Reduces backend calls and provides fallback data
 */
const contextCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached context if available and fresh
 */
function getCachedContext(userId, contextType) {
  const key = `${userId}_${contextType}`;
  const cached = contextCache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  return null;
}

/**
 * Cache context data
 */
function setCachedContext(userId, contextType, data) {
  const key = `${userId}_${contextType}`;
  contextCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Clear cache for a specific user or all users
 */
function clearCache(userId = null) {
  if (userId) {
    // Clear all cache entries for this user
    for (const key of contextCache.keys()) {
      if (key.startsWith(`${userId}_`)) {
        contextCache.delete(key);
      }
    }
  } else {
    contextCache.clear();
  }
}

/**
 * Build complete user context for conversation
 * Includes profile, financial data, and relevant indicators
 */
async function buildUserContext(phoneNumber, userId = null) {
  const context = {
    phoneNumber,
    userId,
    profile: null,
    finance: null,
    strategy: null,
    dream: null,
    lastFetch: null,
    errors: []
  };

  // If no userId, try to get it from phone number
  if (!userId) {
    try {
      const userIdFromPhone = await getUserIdFromPhone(phoneNumber);
      if (userIdFromPhone) {
        userId = userIdFromPhone;
        context.userId = userId;
      }
    } catch (error) {
      context.errors.push({
        type: 'user_lookup',
        message: 'Could not identify user from phone number',
        error: error.message
      });
    }
  }

  // If still no userId, return minimal context
  if (!userId) {
    context.lastFetch = new Date().toISOString();
    return context;
  }

  // Fetch all relevant context data in parallel
  const results = await Promise.allSettled([
    getUserProfile(userId),
    getFinanceContext(userId),
    getStrategyContext(userId),
    getDreamContext(userId)
  ]);

  // Process results
  if (results[0].status === 'fulfilled') {
    context.profile = results[0].value;
  } else {
    context.errors.push({
      type: 'profile_fetch',
      message: 'Failed to fetch user profile',
      error: results[0].reason?.message || 'Unknown error'
    });
  }

  if (results[1].status === 'fulfilled') {
    context.finance = results[1].value;
  } else {
    context.errors.push({
      type: 'finance_fetch',
      message: 'Failed to fetch financial data',
      error: results[1].reason?.message || 'Unknown error'
    });
  }

  if (results[2].status === 'fulfilled') {
    context.strategy = results[2].value;
  } else {
    context.errors.push({
      type: 'strategy_fetch',
      message: 'Failed to fetch strategy data',
      error: results[2].reason || 'Unknown error'
    });
  }

  if (results[3].status === 'fulfilled') {
    context.dream = results[3].value;
  } else {
    context.errors.push({
      type: 'dream_fetch',
      message: 'Failed to fetch dream data',
      error: results[3].reason?.message || 'Unknown error'
    });
  }

  context.lastFetch = new Date().toISOString();

  return context;
}

/**
 * Get user ID from phone number
 */
async function getUserIdFromPhone(phoneNumber) {
  try {
    const result = await apiClient.getUserByPhone(phoneNumber);
    return result?.id || result?.userId;
  } catch (error) {
    if (error.status === 404) {
      return null; // User not found
    }
    return null;
  }
}

/**
 * Get user profile data
 */
async function getUserProfile(userId) {
  const cached = getCachedContext(userId, 'profile');
  if (cached) return cached;

  try {
    // For now, return a basic profile since the API doesn't have a dedicated endpoint
    const result = {
      id: userId,
      businessCategories: ['general'],
      createdAt: new Date().toISOString()
    };

    // Cache the result
    setCachedContext(userId, 'profile', result);

    return result;
  } catch (error) {
    // If backend is down, return cached data if available
    const fallback = getCachedContext(userId, 'profile');
    if (fallback) {
      return { ...fallback, _stale: true };
    }
    throw error;
  }
}

/**
 * Get financial context
 * Includes balance, budget, credits, runway
 */
async function getFinanceContext(userId) {
  const cached = getCachedContext(userId, 'finance');
  if (cached) return cached;

  try {
    const [balance, budget, credits, runway] = await Promise.allSettled([
      apiClient.getLedgers(userId).catch(() => null),
      apiClient.getBudget(userId).catch(() => null),
      apiClient.getCredits(userId).catch(() => null),
      apiClient.getRunway(userId).catch(() => null)
    ]);

    const finance = {
      balance: balance.status === 'fulfilled' ? balance.value : null,
      budget: budget.status === 'fulfilled' ? budget.value : null,
      credits: credits.status === 'fulfilled' ? credits.value : null,
      runway: runway.status === 'fulfilled' ? runway.value : null,
      lastFetch: new Date().toISOString()
    };

    // Cache the result
    setCachedContext(userId, 'finance', finance);

    return finance;
  } catch (error) {
    // If backend is down, return cached data if available
    const fallback = getCachedContext(userId, 'finance');
    if (fallback) {
      return { ...fallback, _stale: true };
    }
    throw error;
  }
}

/**
 * Get strategy context
 * Includes pricing, products, suppliers, goals
 */
async function getStrategyContext(userId) {
  const cached = getCachedContext(userId, 'strategy');
  if (cached) return cached;

  try {
    const [pricing, goals] = await Promise.allSettled([
      apiClient.getPricing(userId).catch(() => null),
      apiClient.getGoals(userId).catch(() => null)
    ]);

    const strategy = {
      pricing: pricing.status === 'fulfilled' ? pricing.value : null,
      products: null, // No dedicated endpoint yet
      suppliers: null, // No dedicated endpoint yet
      goals: goals.status === 'fulfilled' ? goals.value : null,
      lastFetch: new Date().toISOString()
    };

    // Cache the result
    setCachedContext(userId, 'strategy', strategy);

    return strategy;
  } catch (error) {
    // If backend is down, return cached data if available
    const fallback = getCachedContext(userId, 'strategy');
    if (fallback) {
      return { ...fallback, _stale: true };
    }
    throw error;
  }
}

/**
 * Get dream context
 * Includes economic indicators, news, events, insights
 */
async function getDreamContext(userId) {
  const cached = getCachedContext(userId, 'dream');
  if (cached) return cached;

  try {
    const [ticker, news, insights] = await Promise.allSettled([
      apiClient.getEconomicTicker().catch(() => null),
      apiClient.getEconomicNews(5).catch(() => null),
      apiClient.getInsights(userId).catch(() => null)
    ]);

    const dream = {
      indicators: ticker.status === 'fulfilled' ? ticker.value : null,
      news: news.status === 'fulfilled' ? news.value : null,
      events: null, // No dedicated endpoint yet
      insights: insights.status === 'fulfilled' ? insights.value : null,
      lastFetch: new Date().toISOString()
    };

    // Cache the result
    setCachedContext(userId, 'dream', dream);

    return dream;
  } catch (error) {
    // If backend is down, return cached data if available
    const fallback = getCachedContext(userId, 'dream');
    if (fallback) {
      return { ...fallback, _stale: true };
    }
    throw error;
  }
}

/**
 * Get contextual economic indicators based on user profile
 * Returns only indicators relevant to user's business type
 */
async function getContextualIndicators(userProfile) {
  if (!userProfile || !userProfile.businessCategories) {
    return [];
  }

  try {
    // Use the economic ticker endpoint
    const ticker = await apiClient.getEconomicTicker();
    return ticker || [];
  } catch (error) {
    console.error('Failed to fetch contextual indicators:', error.message);
    return [];
  }
}

/**
 * Get relevant economic context for a conversation
 * Filters indicators based on conversation topic
 */
async function getEconomicContext(topic, userProfile = null) {
  try {
    let indicators = [];

    // If we have user profile, get contextual indicators
    if (userProfile) {
      indicators = await getContextualIndicators(userProfile);
    } else {
      // Get general indicators
      const ticker = await apiClient.getEconomicTicker();
      indicators = ticker || [];
    }

    // Filter based on topic relevance
    const topicKeywords = {
      pricing: ['price', 'cost', 'inflation', 'fx', 'commodity'],
      products: ['demand', 'seasonal', 'event', 'holiday'],
      budget: ['fuel', 'transport', 'inflation'],
      runway: ['fx', 'inflation', 'economic'],
      credits: ['economic', 'inflation']
    };

    const keywords = topicKeywords[topic] || [];

    if (keywords.length > 0) {
      indicators = indicators.filter(indicator => {
        const indicatorText = (
          (indicator.title || '') + (indicator.description || '') + (indicator.category || '')
        ).toLowerCase();

        return keywords.some(keyword => indicatorText.includes(keyword));
      });
    }

    // Return only high-priority indicators
    return indicators.filter(i => i.priority === 'high').slice(0, 3);
  } catch (error) {
    console.error('Failed to fetch economic context:', error.message);
    return [];
  }
}

/**
 * Build minimal context for quick responses
 * Used when full context isn't needed
 */
async function buildQuickContext(userId) {
  try {
    const [balance, budget] = await Promise.allSettled([
      apiClient.getLedgers(userId).catch(() => null),
      apiClient.getBudget(userId).catch(() => null)
    ]);

    return {
      finance: {
        balance: balance.status === 'fulfilled' ? balance.value : null,
        budget: budget.status === 'fulfilled' ? budget.value : null
      }
    };
  } catch (error) {
    return { finance: { balance: null, budget: null } };
  }
}

/**
 * Check if context data is stale
 */
function isContextStale(context) {
  if (!context.lastFetch) return true;

  const fetchTime = new Date(context.lastFetch);
  const now = new Date();
  const ageMinutes = (now - fetchTime) / (1000 * 60);

  return ageMinutes > 10; // Consider stale after 10 minutes
}

/**
 * Get graceful degradation message based on what data is available
 */
function getDegradationMessage(context, lastKnownContext = null) {
  const errors = context.errors || [];

  if (errors.length === 0) {
    return null; // No errors
  }

  // Check if we have any cached data
  const hasCachedData = lastKnownContext && !isContextStale(lastKnownContext);

  if (hasCachedData) {
    return {
      type: 'stale_data',
      message: 'connection',
      lastBalance: lastKnownContext.finance?.balance?.amount || 'Unknown',
      lastTopic: lastKnownContext.lastTopic || 'your finances'
    };
  }

  // Check if this is a new user
  const userNotFoundError = errors.find(e => e.type === 'user_lookup');
  if (userNotFoundError) {
    return {
      type: 'no_data',
      message: 'no_data'
    };
  }

  // General connection error
  return {
    type: 'connection_error',
    message: 'connection',
    missingPart: errors[0]?.type || 'data'
  };
}

/**
 * Extract relevant data points for response generation
 * Filters context to only what's needed for the current topic
 */
function extractRelevantData(fullContext, topic) {
  const relevant = {
    topic,
    data: {}
  };

  switch (topic) {
    case 'balance':
    case 'budget':
      if (fullContext.finance) {
        relevant.data.balance = fullContext.finance.balance;
        relevant.data.budget = fullContext.finance.budget;
      }
      break;

    case 'credits':
      if (fullContext.finance) {
        relevant.data.credits = fullContext.finance.credits;
        relevant.data.balance = fullContext.finance.balance;
      }
      break;

    case 'runway':
      if (fullContext.finance) {
        relevant.data.runway = fullContext.finance.runway;
        relevant.data.balance = fullContext.finance.balance;
      }
      break;

    case 'pricing':
    case 'products':
      if (fullContext.strategy) {
        relevant.data.pricing = fullContext.strategy.pricing;
        relevant.data.products = fullContext.strategy.products;
      }
      break;

    case 'economic':
    case 'news':
      if (fullContext.dream) {
        relevant.data.indicators = fullContext.dream.indicators;
        relevant.data.news = fullContext.dream.news;
        relevant.data.events = fullContext.dream.events;
      }
      break;

    case 'insights':
      if (fullContext.dream) {
        relevant.data.insights = fullContext.dream.insights;
      }
      break;

    default:
      // Return all available data
      relevant.data = fullContext;
  }

  return relevant;
}

export {
  buildUserContext,
  getUserProfile,
  getFinanceContext,
  getStrategyContext,
  getDreamContext,
  getContextualIndicators,
  getEconomicContext,
  buildQuickContext,
  isContextStale,
  getDegradationMessage,
  extractRelevantData,
  clearCache as clearContextCache,
  getCachedContext
};

// SR
