/**
 * Message Handler
 * Processes incoming WhatsApp messages and routes to appropriate handlers
 */

import { logger } from '../utils/logger.js';
import { isAuthenticated, getUserSession, handleAuthRequest, verifyOTP } from './auth-handler.js';
import { handleFinanceQuery } from './finance-handler.js';
import { handleStrategyQuery } from './strategy-handler.js';
import { handleDreamQuery } from './dream-handler.js';
import { handleInterpretationQuery } from './interpretation-handler.js';

const msgLogger = logger.forContext('MessageHandler');

// ==========================================
// INTENT DEFINITIONS
// ==========================================
const Intents = {
  // Auth intents
  HELLO: 'hello',
  AUTHENTICATE: 'authenticate',
  VERIFY_OTP: 'verify_otp',
  LINK: 'link',

  // Finance intents
  BALANCE: 'balance',
  BUDGET: 'budget',
  RUNWAY: 'runway',
  CREDITS: 'credits',
  SPEND: 'spend',

  // Strategy intents
  PRICING: 'pricing',
  GOALS: 'goals',
  SUPPLIERS: 'suppliers',
  PRODUCTS: 'products',

  // Dream intents
  ECONOMIC: 'economic',
  NEWS: 'news',
  INDICATORS: 'indicators',
  STRESS_TEST: 'stress_test',

  // Interpretation intents
  INSIGHTS: 'insights',
  ALERTS: 'alerts',
  RECOMMENDATIONS: 'recommendations',

  // General intents
  HELP: 'help',
  SETTINGS: 'settings',
  UNKNOWN: 'unknown'
};

// ==========================================
// INTENT PATTERNS
// ==========================================
const IntentPatterns = {
  [Intents.HELLO]: /^(hi|hello|hey|start|begin|ola)/i,
  [Intents.AUTHENTICATE]: /^(login|sign\s*in|verify|auth)/i,
  [Intents.VERIFY_OTP]: /^\d{4,6}$/,
  [Intents.LINK]: /^LINK_[a-zA-Z0-9]+$/i,
  [Intents.BALANCE]: /^(balance|bal|account|my\s*money|wallet)/i,
  [Intents.BUDGET]: /^(budget|spending|expense|allocation)/i,
  [Intents.RUNWAY]: /^(runway|burn\s*rate|days\s*left|survival)/i,
  [Intents.CREDITS]: /^(credit|debt|owed|receivables)/i,
  [Intents.PRICING]: /^(price|pricing|margin|cost)/i,
  [Intents.GOALS]: /^(goal|target|milestone|objective)/i,
  [Intents.ECONOMIC]: /^(economic|market|inflation|fx|rate)/i,
  [Intents.NEWS]: /^(news|update|headline)/i,
  [Intents.INSIGHTS]: /^(insight|advice|recommend|analysis)/i,
  [Intents.HELP]: /^(help|\?|commands|what\s*can\s*you\s*do)/i
};

// ==========================================
// STATE MACHINE
// ==========================================
const conversationStates = new Map(); // phoneNumber -> { state, data, lastActivity }

/**
 * Process incoming message and determine response
 * @param {string} phoneNumber - Sender's phone number
 * @param {string} message - Message text
 * @param {object} metadata - Additional message metadata
 */
export async function processMessage(phoneNumber, message, metadata = {}) {
  msgLogger.info('Processing message', {
    phoneNumber,
    message: message.substring(0, 50),
    isAuthenticated: isAuthenticated(phoneNumber)
  });

  const trimmedMessage = message.trim();
  const conversationState = conversationStates.get(phoneNumber) || { state: 'idle', data: {} };

  try {
    // ==========================================
    // CHECK AUTHENTICATION FIRST
    // ==========================================
    if (!isAuthenticated(phoneNumber)) {
      const response = await handleUnauthenticatedUser(phoneNumber, trimmedMessage, conversationState);
      return response;
    }

    // ==========================================
    // AUTHENTICATED USER FLOWS
    // ==========================================
    const userSession = getUserSession(phoneNumber);

    // Check for ongoing conversation state
    if (conversationState.state !== 'idle') {
      const response = await handleOngoingConversation(phoneNumber, trimmedMessage, conversationState, userSession);
      return response;
    }

    // Detect intent and route
    const intent = detectIntent(trimmedMessage);
    msgLogger.debug('Intent detected', { phoneNumber, intent });

    const response = await routeByIntent(intent, phoneNumber, trimmedMessage, userSession, metadata);

    // Update last activity
    conversationState.lastActivity = new Date().toISOString();
    conversationStates.set(phoneNumber, conversationState);

    return response;
  } catch (error) {
    msgLogger.error('Message processing failed', {
      phoneNumber,
      error: error.message,
      stack: error.stack
    });

    return {
      success: false,
      message: `❌ Sorry, something went wrong processing your request.\n\nPlease try again or type /help.`,
      error: error.message
    };
  }
}

// ==========================================
// UNAUTHENTICATED USER HANDLER
// ==========================================
async function handleUnauthenticatedUser(phoneNumber, message, conversationState) {
  msgLogger.info('Handling unauthenticated user', { phoneNumber, message });

  // Handle LINK token
  if (IntentPatterns.LINK.test(message)) {
    const { handleLinkRequest } = await import('./auth-handler.js');
    return await handleLinkRequest(phoneNumber, message);
  }

  // Check if this is a greeting/start
  if (IntentPatterns.HELLO.test(message)) {
    return {
      success: true,
      message: `👋 Welcome to *JOSEPH AI*! 🎈\n\n` +
               `I'm your personal economist, here to help you manage your business finances.\n\n` +
               `To get started, I need to verify your account.\n` +
               `What's the phone number registered with JOSEPH AI?\n\n` +
               `Format: +234 XXX XXX XXXX`,
      nextStep: 'await_phone',
      setConversationState: { state: 'awaiting_phone', data: {} }
    };
  }

  // Check if awaiting phone number
  if (conversationState.state === 'awaiting_phone') {
    const phonePattern = /^\+?\d{10,15}$/;
    if (phonePattern.test(message.replace(/\s/g, ''))) {
      const result = await handleAuthRequest(message);

      if (result.success) {
        conversationStates.set(phoneNumber, {
          state: 'awaiting_otp',
          data: { phone: message },
          lastActivity: new Date().toISOString()
        });
      }

      return result;
    } else {
      return {
        success: false,
        message: `❌ Invalid phone number format.\n\n` +
                 `Please use format: +234 XXX XXX XXXX\n\n` +
                 `Example: +234 801 234 5678`,
        nextStep: 'await_phone'
      };
    }
  }

  // Check if awaiting OTP
  if (conversationState.state === 'awaiting_otp') {
    if (/^\d{4,6}$/.test(message)) {
      const result = await verifyOTP(conversationState.data.phone, message);

      if (result.success) {
        conversationStates.delete(phoneNumber);
      }

      return result;
    } else {
      return {
        success: false,
        message: `❌ Invalid OTP format.\n\n` +
                 `Please enter the 4-6 digit code sent to your phone.`,
        nextStep: 'await_otp'
      };
    }
  }

  // Default message for unauthenticated users
  return {
    success: false,
    message: `👋 Welcome to *JOSEPH AI*! 🎈\n\n` +
             `I'm your personal economist, here to help you manage your business finances.\n\n` +
             `To get started, please verify your account by sending:\n\n` +
             `"Hi" or "Start"\n\n` +
             `Or contact support if you're having trouble accessing your account.`,
    nextStep: 'greet'
  };
}

// ==========================================
// ONGOING CONVERSATION HANDLER
// ==========================================
async function handleOngoingConversation(phoneNumber, message, conversationState, userSession) {
  msgLogger.info('Handling ongoing conversation', {
    phoneNumber,
    state: conversationState.state
  });

  // Handle different conversation states
  switch (conversationState.state) {
    case 'awaiting_otp':
      if (/^\d{4,6}$/.test(message)) {
        const result = await verifyOTP(conversationState.data.phone, message);
        if (result.success) {
          conversationStates.delete(phoneNumber);
        }
        return result;
      }
      break;

    case 'setting_budget':
      // Handle budget setting flow
      // ... implementation
      break;

    default:
      msgLogger.warn('Unknown conversation state', { state: conversationState.state });
  }

  // Clear state and route normally
  conversationStates.set(phoneNumber, { state: 'idle', data: {} });

  const intent = detectIntent(message);
  return await routeByIntent(intent, phoneNumber, message, userSession);
}

// ==========================================
// INTENT DETECTION
// ==========================================
function detectIntent(message) {
  // Check each pattern
  for (const [intent, pattern] of Object.entries(IntentPatterns)) {
    if (pattern.test(message)) {
      return intent;
    }
  }

  return Intents.UNKNOWN;
}

// ==========================================
// ROUTE BY INTENT
// ==========================================
async function routeByIntent(intent, phoneNumber, message, userSession, metadata) {
  msgLogger.debug('Routing by intent', { intent, phoneNumber });

  switch (intent) {
    // Auth-related
    case Intents.HELLO:
      return {
        success: true,
        message: `👋 Hey ${userSession.name}!\n\n` +
                 `How can I help you today?\n\n` +
                 `Here are some things you can ask me:\n` +
                 `💰 /balance - Check your balance\n` +
                 `📊 /budget - View budget status\n` +
                 `🎯 /goals - Goal progress\n` +
                 `📰 /news - Economic updates\n` +
                 `💡 /insights - Get insights\n\n` +
                 `Or just ask me anything!`
      };

    case Intents.HELP:
      return {
        success: true,
        message: generateHelpMessage()
      };

    // Finance queries
    case Intents.BALANCE:
    case Intents.BUDGET:
    case Intents.RUNWAY:
    case Intents.CREDITS:
    case Intents.SPEND:
      return await handleFinanceQuery(intent, phoneNumber, message, userSession);

    // Strategy queries
    case Intents.PRICING:
    case Intents.GOALS:
    case Intents.SUPPLIERS:
    case Intents.PRODUCTS:
      return await handleStrategyQuery(intent, phoneNumber, message, userSession);

    // Dream queries
    case Intents.ECONOMIC:
    case Intents.NEWS:
    case Intents.INDICATORS:
    case Intents.STRESS_TEST:
      return await handleDreamQuery(intent, phoneNumber, message, userSession);

    // Interpretation queries
    case Intents.INSIGHTS:
    case Intents.ALERTS:
    case Intents.RECOMMENDATIONS:
      return await handleInterpretationQuery(intent, phoneNumber, message, userSession);

    // Unknown intent
    default:
      return {
        success: true,
        message: `🤔 I'm not sure what you mean by "${message}".\n\n` +
                 `Here are some things you can ask me:\n\n` +
                 `💰 "What's my balance?"\n` +
                 `📊 "How's my budget?"\n` +
                 `🎯 "Show me my goals"\n` +
                 `📰 "Latest economic news"\n` +
                 `💡 "Any insights for me?"\n\n` +
                 `Type /help for more options.`
      };
  }
}

// ==========================================
// HELP MESSAGE GENERATOR
// ==========================================
function generateHelpMessage() {
  return `📚 *JOSEPH AI Bot Commands*\n\n` +
         `🏠 *Account*\n` +
         `├─ /start - Get started\n` +
         `├─ /login - Verify your account\n` +
         `└─ /settings - Update preferences\n\n` +
         `💰 *Finance*\n` +
         `├─ /balance - Check your balance\n` +
         `├─ /budget - View budget breakdown\n` +
         `├─ /runway - Cash runway analysis\n` +
         `└─ /credits - Credit sales status\n\n` +
         `🎯 *Strategy*\n` +
         `├─ /pricing - Pricing overview\n` +
         `├─ /goals - Goal progress\n` +
         `└─ /suppliers - Supplier info\n\n` +
         `📊 *Dream (Economic)*\n` +
         `├─ /economic - Economic indicators\n` +
         `├─ /news - Latest economic news\n` +
         `└─ /stress - Stress test\n\n` +
         `💡 *Interpretation*\n` +
         `├─ /insights - Your insights\n` +
         `├─ /alerts - Actionable alerts\n` +
         `└─ /recommend - Recommendations\n\n` +
         `❓ *Need more help?*\n` +
         `Just ask me a question! I'm pretty smart. 😎`;
}

// Export intent definitions for use in other handlers
export { Intents, IntentPatterns };

// SR
