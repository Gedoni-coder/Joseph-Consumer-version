/**
 * Response Engine
 * Generates intelligent responses using JOSEPH's voice
 * Integrates conversation memory, context, and personality
 */

import { buildResponse, generateProactiveMessage } from './joseph-voice.js';
import { getDegradationMessage, extractRelevantData } from './context-builder.js';
import { generateFollowUpSuggestions } from './conversation-manager.js';

/**
 * Response types
 */
const RESPONSE_TYPES = {
  GREETING: 'greeting',
  DATA: 'data',
  INSIGHT: 'insight',
  ERROR: 'error',
  CONFIRMATION: 'confirmation',
  PROACTIVE: 'proactive'
};

/**
 * Build a complete response with JOSEPH's voice
 * This is the main entry point for response generation
 */
async function buildResponseFromContext(
  intent,
  fullContext,
  conversationalContext,
  toneOverride = null
) {
  // Check if we have errors
  if (fullContext.errors && fullContext.errors.length > 0) {
    const degradation = getDegradationMessage(
      fullContext,
      conversationalContext.lastKnownContext
    );

    if (degradation) {
      // Use graceful degradation message
      const message = buildResponse('backend_error', degradation, { toneOverride });
      return {
        type: RESPONSE_TYPES.ERROR,
        message,
        suggestions: ['Try again in a moment', 'What else can I help with?'],
        hasData: false
      };
    }
  }

  // Extract relevant data based on intent
  const relevant = extractRelevantData(fullContext, intent);

  // Build response based on intent
  let response;
  let responseType;

  switch (intent) {
    case 'balance':
      response = buildBalanceResponse(relevant.data, conversationalContext);
      responseType = RESPONSE_TYPES.DATA;
      break;

    case 'budget':
      response = buildBudgetResponse(relevant.data, conversationalContext);
      responseType = RESPONSE_TYPES.DATA;
      break;

    case 'credits':
      response = buildCreditsResponse(relevant.data, conversationalContext);
      responseType = RESPONSE_TYPES.DATA;
      break;

    case 'runway':
      response = buildRunwayResponse(relevant.data, conversationalContext);
      responseType = RESPONSE_TYPES.DATA;
      break;

    case 'pricing':
      response = buildPricingResponse(relevant.data, conversationalContext);
      responseType = RESPONSE_TYPES.DATA;
      break;

    case 'products':
      response = buildProductsResponse(relevant.data, conversationalContext);
      responseType = RESPONSE_TYPES.DATA;
      break;

    case 'economic':
    case 'news':
      response = buildEconomicResponse(relevant.data, conversationalContext);
      responseType = RESPONSE_TYPES.DATA;
      break;

    case 'insights':
      response = buildInsightResponse(relevant.data, conversationalContext);
      responseType = RESPONSE_TYPES.INSIGHT;
      break;

    case 'greeting':
      response = buildGreetingResponse(conversationalContext);
      responseType = RESPONSE_TYPES.GREETING;
      break;

    default:
      response = buildDefaultResponse(conversationalContext);
      responseType = RESPONSE_TYPES.DATA;
  }

  // Add follow-up suggestions
  const suggestions = generateFollowUpSuggestions(intent, conversationalContext);

  return {
    type: responseType,
    message: response,
    suggestions,
    hasData: true,
    contextUsed: {
      intent,
      hasFinance: !!fullContext.finance,
      hasStrategy: !!fullContext.strategy,
      hasDream: !!fullContext.dream,
      isFollowUp: conversationalContext.isFollowUp
    }
  };
}

/**
 * Build balance response
 */
function buildBalanceResponse(data, conversationalContext) {
  const { balance, budget } = data;

  if (!balance) {
    return buildResponse('backend_error', {
      errorType: 'no_data',
      lastTopic: 'your balance'
    });
  }

  // Calculate days in month and daily average
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const dayOfMonth = today.getDate();
  const daysLeft = daysInMonth - dayOfMonth;

  // Get budget percentage if available
  let percentage = 50; // Default
  if (budget && budget.spent && budget.total) {
    percentage = (budget.spent / budget.total) * 100;
  }

  return buildResponse('balance', {
    balance: balance.amount || balance,
    daysLeft,
    percentage,
    dailyBurn: balance.dailyAverage || (balance.amount / daysLeft)
  });
}

/**
 * Build budget response
 */
function buildBudgetResponse(data, conversationalContext) {
  const { budget } = data;

  if (!budget || !budget.total) {
    return buildResponse('backend_error', {
      errorType: 'no_data',
      lastTopic: 'your budget'
    });
  }

  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - today.getDate();

  const percentage = (budget.spent / budget.total) * 100;
  const remaining = budget.total - budget.spent;
  const dailyRemaining = remaining / daysLeft;

  // Determine status
  let status;
  if (percentage >= 90) status = 'critical';
  else if (percentage >= 75) status = 'concerning';
  else status = 'on_track';

  return buildResponse('budget', {
    percentage: Math.round(percentage),
    daysLeft,
    remaining: remaining.toFixed(2),
    status,
    projectedOverspend: percentage > 100 ? ((percentage - 100) / 100 * budget.total).toFixed(2) : 0
  });
}

/**
 * Build credits response
 */
function buildCreditsResponse(data, conversationalContext) {
  const { credits } = data;

  if (!credits || !credits.list) {
    return "I don't have any credit information for you yet. Want me to help you set up tracking?";
  }

  const totalAmount = credits.total || 0;
  const overdueAmount = credits.overdue || 0;
  const overduePayers = credits.list.filter(c => c.daysOverdue > 0);

  // Format payer list
  const payers = credits.list.map(c => c.name).join(', ');
  const latePayers = overduePayers.map(c => `${c.name} (${c.daysOverdue}d late)`).join(', ');

  return buildResponse('credits', {
    amount: totalAmount,
    amount_late: overdueAmount,
    payers: credits.list.length > 0 ? `${credits.list.length} people` : 'no one',
    late_payers: latePayers || 'none',
    totalAmount,
    overdueAmount
  });
}

/**
 * Build runway response
 */
function buildRunwayResponse(data, conversationalContext) {
  const { runway } = data;

  if (!runway) {
    return "I can't calculate your runway yet. Need more data on your burn rate.";
  }

  const months = runway.months || 0;
  const weeks = Math.ceil(months * 4);

  return buildResponse('runway', {
    months: Math.ceil(months),
    weeks,
    dailyBurn: runway.dailyBurn || 0
  });
}

/**
 * Build pricing response
 */
function buildPricingResponse(data, conversationalContext) {
  const { pricing, products } = data;

  if (!pricing) {
    return "I don't have pricing data yet. Want me to help you set it up?";
  }

  const currentPrice = pricing.current || 0;
  const suggestedPrice = pricing.suggested || currentPrice;
  const competitorPrice = pricing.competitorAverage || 0;

  const potentialGain = suggestedPrice - currentPrice;
  const potentialIncrease = currentPrice > 0 ? ((potentialGain / currentPrice) * 100).toFixed(1) : 0;

  return buildResponse('strategy', {
    current_price: `₦${currentPrice.toLocaleString()}`,
    suggested_price: `₦${suggestedPrice.toLocaleString()}`,
    competitor_price: `₦${competitorPrice.toLocaleString()}`,
    potential_gain: `₦${potentialGain.toLocaleString()}`,
    potential_increase: `${potentialIncrease}%`
  });
}

/**
 * Build products response
 */
function buildProductsResponse(data, conversationalContext) {
  const { products } = data;

  if (!products || !products.list) {
    return "I don't have your product data yet. Let's get that set up.";
  }

  const sorted = [...products.list].sort((a, b) => b.sales - a.sales);
  const winners = sorted.slice(0, 3).map(p => p.name).join(', ');
  const losers = sorted.slice(-3).map(p => p.name).join(', ');

  return `Your winners: ${winners}. What's not pulling weight: ${losers}. Want me to dive deeper into any of these?`;
}

/**
 * Build economic/news response
 */
function buildEconomicResponse(data, conversationalContext) {
  const { indicators, news, events } = data;

  const items = [];

  if (indicators && indicators.length > 0) {
    items.push(...indicators.slice(0, 2));
  }

  if (news && news.length > 0) {
    items.push(...news.slice(0, 2));
  }

  if (items.length === 0) {
    return "Nothing urgent on my radar right now. The economic landscape is fairly calm for your business.";
  }

  // Build a summary of top items
  return items.map(item => {
    const severity = item.severity || 'neutral';
    const type = severity === 'high' ? 'warning' : severity === 'opportunity' ? 'opportunity' : 'neutral';

    return buildResponse('economic', {
      headline: item.headline || item.title,
      impact: item.implication || item.description,
      severity: type,
      recommendation: item.recommendation || 'Worth keeping an eye on'
    });
  }).join('\n\n');
}

/**
 * Build insight response
 */
function buildInsightResponse(data, conversationalContext) {
  const { insights } = data;

  if (!insights || insights.length === 0) {
    return "Here's what I'm seeing: Your spending is consistent, which is good. But I think we could optimize a few things. Want me to show you where?";
  }

  const topInsight = insights[0];

  return buildResponse('dream', {
    insight: topInsight.title || topInsight.description,
    implication: topInsight.implication || 'This affects your bottom line',
    alert: topInsight.severity === 'high'
  });
}

/**
 * Build greeting response
 */
function buildGreetingResponse(conversationalContext) {
  const { isNew, lastTopic, isReturningUser } = conversationalContext;

  if (isNew) {
    return "Hey! I'm JOSEPH, your financial partner in crime. I'm here to help you track, plan, and grow. What's on your mind?";
  }

  if (lastTopic) {
    return buildResponse('greeting', {
      last_topic: lastTopic,
      type: 'returning'
    });
  }

  return "Good to see you again. What are we looking at today?";
}

/**
 * Build default response when intent is unclear
 */
function buildDefaultResponse(conversationalContext) {
  return "I'm not quite sure what you're asking. Try asking about your balance, budget, who owes you, or your runway. Or just say 'help' if you're lost.";
}

/**
 * Generate a proactive message
 * For example: warning about budget, celebrating milestone
 */
function generateProactiveAlert(type, data) {
  return generateProactiveMessage(type, data);
}

/**
 * Format multiple data points into a coherent message
 */
function formatMultiPointResponse(points) {
  if (!points || points.length === 0) {
    return null;
  }

  if (points.length === 1) {
    return points[0];
  }

  // Join multiple points with conversational connectors
  return points.join(' | ');
}

/**
 * Add personality to a plain text response
 * Used for simple responses that don't need full template system
 */
function addPersonality(text, tone = 'casual') {
  // Add shared ownership language
  let personalized = text
    .replace(/your balance/gi, 'our balance')
    .replace(/your budget/gi, 'our budget')
    .replace(/your money/gi, 'our money');

  // Add tone-specific flavor
  const tonePrefixes = {
    celebratory: ['✅ ', 'Nice! ', 'Here we go: '],
    encouraging: ['Hey! ', 'Look: ', 'So: '],
    warning: ['⚠️ ', 'Heads up: ', 'Quick note: '],
    urgent: ['🚨 ', 'IMPORTANT: ', 'We need to talk: '],
    casual: ['', '', ''],
    serious: ['Here\'s the situation: ', 'Let\'s be real: ', 'The truth: ']
  };

  const prefixes = tonePrefixes[tone] || tonePrefixes.casual;
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];

  return prefix + personalized;
}

export {
  RESPONSE_TYPES,
  buildResponseFromContext,
  buildBalanceResponse,
  buildBudgetResponse,
  buildCreditsResponse,
  buildRunwayResponse,
  buildPricingResponse,
  buildProductsResponse,
  buildEconomicResponse,
  buildInsightResponse,
  buildGreetingResponse,
  buildDefaultResponse,
  generateProactiveAlert,
  formatMultiPointResponse,
  addPersonality
};

// SR
