/**
 * Conversation Manager
 * Handles conversation memory, context tracking, and entity extraction
 */

import conversationMemory from '../data/conversation-memory.js';

// Alias the exports for consistent usage
const { getConversationHistory, addConversation, clearConversation, getConversationContext: getConvContext } = conversationMemory;

/**
 * Intent categories
 */
const INTENTS = {
  GREETING: 'greeting',
  BALANCE: 'balance',
  BUDGET: 'budget',
  CREDITS: 'credits',
  RUNWAY: 'runway',
  PRICING: 'pricing',
  PRODUCTS: 'products',
  ECONOMIC: 'economic',
  NEWS: 'news',
  INSIGHTS: 'insights',
  HELP: 'help',
  UNKNOWN: 'unknown'
};

/**
 * Conversation state
 */
const CONVERSATION_STATE = {
  NEW: 'new',
  ACTIVE: 'active',
  AWAITING_INPUT: 'awaiting_input',
  CLOSED: 'closed'
};

/**
 * Intent detection patterns
 */
const INTENT_PATTERNS = {
  [INTENTS.GREETING]: [
    /^(hi|hello|hey|good morning|good afternoon|good evening)/i,
    /^(what's up|sup|how are you|how do you do)/i
  ],
  [INTENTS.BALANCE]: [
    /balance|how much do i have|what's my balance|current balance|account balance/i,
    /how much money|cash|funds|available/i
  ],
  [INTENTS.BUDGET]: [
    /budget|budget status|how's my budget|budget check/i,
    /spending|expenses|track spending/i
  ],
  [INTENTS.CREDITS]: [
    /credit|who owes|owes me|debtors|people that owe/i,
    /collect|payment pending|outstanding payment/i
  ],
  [INTENTS.RUNWAY]: [
    /runway|how long can i last|burn rate|cash flow/i,
    /how many (months|weeks|days) (can i last|do i have|remaining)/i
  ],
  [INTENTS.PRICING]: [
    /price|pricing|how much should i charge|pricing strategy/i,
    /increase price|lower price|adjust price/i
  ],
  [INTENTS.PRODUCTS]: [
    /product|inventory|stock|what i'm selling/i,
    /best selling|top product|slow moving/i
  ],
  [INTENTS.ECONOMIC]: [
    /economic|economy|market|inflation|fx/i,
    /commodity|fuel|diesel|petrol prices/i
  ],
  [INTENTS.NEWS]: [
    /news|headlines|what's happening|latest/i,
    /economic news|market news/i
  ],
  [INTENTS.INSIGHTS]: [
    /insight|analyze|analysis|tell me about/i,
    /pattern|trend|what do you (think|see|notice)/i
  ],
  [INTENTS.HELP]: [
    /help|what can you do|commands|features/i,
    /how do i|how to/i
  ]
};

/**
 * Extract intent and entities from user message
 */
function extractIntentAndEntities(message) {
  const normalizedMessage = message.toLowerCase().trim();
  let detectedIntent = INTENTS.UNKNOWN;
  let entities = {};

  // Check each intent pattern
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      const match = normalizedMessage.match(pattern);
      if (match) {
        detectedIntent = intent;
        break;
      }
    }
    if (detectedIntent !== INTENTS.UNKNOWN) break;
  }

  // Extract entities
  entities = extractEntities(message);

  return {
    intent: detectedIntent,
    entities,
    confidence: detectedIntent === INTENTS.UNKNOWN ? 0.3 : 0.8
  };
}

/**
 * Extract entities from message (amounts, dates, categories, etc.)
 */
function extractEntities(message) {
  const entities = {};

  // Extract monetary amounts (Naira)
  const moneyMatches = message.match(/₦\s*[\d,]+|[\d,]+\s*₦|[\d,]+\s*naira/gi);
  if (moneyMatches) {
    entities.amounts = moneyMatches.map(m => {
      // Clean and parse the amount
      const cleaned = m.replace(/[₦naira,\s]/gi, '');
      return parseFloat(cleaned);
    });
  }

  // Extract percentages
  const percentMatches = message.match(/\d+\s*%/g);
  if (percentMatches) {
    entities.percentages = percentMatches.map(p => parseFloat(p.replace('%', '')));
  }

  // Extract dates (simple patterns)
  const dateMatches = message.match(
    /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})|(today|tomorrow|yesterday|next week|last week)/gi
  );
  if (dateMatches) {
    entities.dates = dateMatches;
  }

  // Extract time periods
  const timeMatches = message.match(
    /(\d+\s*(days?|weeks?|months?|years?))|(this week|next month|this month)/gi
  );
  if (timeMatches) {
    entities.timePeriods = timeMatches;
  }

  // Extract names (capitalized words - crude but functional)
  const nameMatches = message.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)?\b/g);
  if (nameMatches && nameMatches.length > 0) {
    // Filter out common words
    const commonWords = ['This', 'That', 'The', 'What', 'How', 'When', 'Where', 'Why'];
    entities.names = nameMatches.filter(n => !commonWords.includes(n));
  }

  return entities;
}

/**
 * Load conversation memory for a user
 */
async function loadConversationMemory(phoneNumber) {
  try {
    const conversations = getConversationHistory(phoneNumber, 20);
    return { exchanges: conversations };
  } catch (error) {
    console.error('Failed to load conversation memory:', error);
    return null;
  }
}

/**
 * Save exchange to conversation memory
 */
async function saveToMemory(phoneNumber, exchange) {
  try {
    addConversation(phoneNumber, exchange);

    // Get current conversations
    const conversations = getConversationHistory(phoneNumber);

    // Keep only last 20 exchanges
    if (conversations && conversations.length > 20) {
      const keepExchanges = conversations.slice(-20);
      clearConversation(phoneNumber);
      for (const ex of keepExchanges) {
        addConversation(phoneNumber, ex);
      }
    }
  } catch (error) {
    console.error('Failed to save to memory:', error);
  }
}

/**
 * Get conversation context for response generation
 */
async function getConversationContext(phoneNumber) {
  try {
    const context = getConvContext(phoneNumber);

    if (!context.hasHistory) {
      return {
        isNew: true,
        lastTopic: null,
        lastIntent: null,
        recentExchanges: [],
        entitiesMentioned: []
      };
    }

    const conversations = getConversationHistory(phoneNumber, 5);
    const lastExchange = conversations[conversations.length - 1];
    const lastIntent = lastExchange?.intent;

    // Extract entities from recent exchanges
    const entitiesMentioned = [];
    for (const exchange of conversations) {
      if (exchange.entities) {
        entitiesMentioned.push(...Object.keys(exchange.entities));
      }
    }

    return {
      isNew: false,
      lastTopic: lastExchange?.intent || null,
      lastIntent,
      recentExchanges: conversations,
      entitiesMentioned: [...new Set(entitiesMentioned)],
      conversationState: CONVERSATION_STATE.ACTIVE
    };
  } catch (error) {
    console.error('Failed to get conversation context:', error);
    return {
      isNew: true,
      lastTopic: null,
      lastIntent: null,
      recentExchanges: [],
      entitiesMentioned: []
    };
  }
}

/**
 * Update conversation state (not fully implemented in conversation-memory)
 */
async function updateConversationState(phoneNumber, state) {
  // Conversation state tracking would be enhanced here
  // For now, we just log it
  console.log(`Conversation state for ${phoneNumber}: ${state}`);
}

/**
 * Check if this is a returning user
 */
async function isReturningUser(phoneNumber) {
  const memory = await loadConversationMemory(phoneNumber);
  return memory && memory.exchanges && memory.exchanges.length > 0;
}

/**
 * Get last known financial data from memory
 * Useful for graceful degradation when backend is down
 */
async function getLastKnownFinancialData(phoneNumber) {
  const memory = await loadConversationMemory(phoneNumber);

  if (!memory || !memory.exchanges) {
    return null;
  }

  // Find the most recent exchange that had financial data
  for (let i = memory.exchanges.length - 1; i >= 0; i--) {
    const exchange = memory.exchanges[i];
    if (exchange.context && exchange.context.finance) {
      return exchange.context;
    }
  }

  return null;
}

/**
 * Build context from conversation history
 * Helps maintain continuity across messages
 */
async function buildConversationalContext(phoneNumber, currentIntent) {
  const context = await getConversationContext(phoneNumber);
  const lastKnown = await getLastKnownFinancialData(phoneNumber);

  // Detect topic change
  const topicChanged = context.lastIntent && context.lastIntent !== currentIntent;

  // Determine if this is a follow-up question
  const isFollowUp = !topicChanged && !context.isNew;

  return {
    ...context,
    lastKnownContext: lastKnown,
    topicChanged,
    isFollowUp,
    phoneNumber
  };
}

/**
 * Extract key information for memory storage
 */
function buildMemoryExchange(userMessage, botResponse, intent, entities, context) {
  return {
    timestamp: new Date().toISOString(),
    userMessage,
    botResponse,
    intent,
    entities,
    context: {
      finance: context.finance ? {
        balance: context.finance.balance?.amount,
        budget: context.finance.budget?.percentage
      } : null,
      lastTopic: intent
    }
  };
}

/**
 * Generate contextual follow-up suggestions
 */
function generateFollowUpSuggestions(intent, context) {
  const suggestions = [];

  switch (intent) {
    case INTENTS.BALANCE:
      suggestions.push('Want me to break down where it\'s going?');
      suggestions.push('Should we check your budget status?');
      break;

    case INTENTS.BUDGET:
      suggestions.push('Want to see where you can cut back?');
      suggestions.push('Should I show your spending trends?');
      break;

    case INTENTS.CREDITS:
      suggestions.push('Want me to draft some reminder texts?');
      suggestions.push('Should we follow up on the overdue ones?');
      break;

    case INTENTS.RUNWAY:
      suggestions.push('Want ideas on how to extend it?');
      suggestions.push('Should we look at reducing burn rate?');
      break;

    case INTENTS.ECONOMIC:
      suggestions.push('Want me to explain how this affects you?');
      suggestions.push('Should we adjust your strategy?');
      break;

    default:
      suggestions.push('What else do you want to know?');
      suggestions.push('Anything else on your mind?');
  }

  return suggestions.slice(0, 2); // Return top 2 suggestions
}

/**
 * Check if conversation has been idle too long
 */
async function isConversationIdle(phoneNumber, maxIdleMinutes = 30) {
  const memory = await loadConversationMemory(phoneNumber);

  if (!memory || !memory.exchanges || memory.exchanges.length === 0) {
    return true;
  }

  const lastExchange = memory.exchanges[memory.exchanges.length - 1];
  const lastTime = new Date(lastExchange.timestamp);
  const now = new Date();
  const idleMinutes = (now - lastTime) / (1000 * 60);

  return idleMinutes > maxIdleMinutes;
}

/**
 * Clean up old conversation data
 * Should be called periodically to manage storage
 */
async function cleanupOldConversations(maxAgeDays = 30) {
  try {
    // This would need to be implemented in conversation-memory
    // For now, it's a placeholder
    console.log('Conversation cleanup not yet implemented');
  } catch (error) {
    console.error('Failed to cleanup conversations:', error);
  }
}

export {
  INTENTS,
  CONVERSATION_STATE,
  extractIntentAndEntities,
  extractEntities,
  loadConversationMemory,
  saveToMemory,
  getConversationContext,
  updateConversationState,
  isReturningUser,
  getLastKnownFinancialData,
  buildConversationalContext,
  buildMemoryExchange,
  generateFollowUpSuggestions,
  isConversationIdle,
  cleanupOldConversations
};

// SR
