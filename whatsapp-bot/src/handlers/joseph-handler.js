/**
 * JOSEPH Handler
 * Main entry point for JOSEPH conversations
 * Coordinates conversation manager, context builder, and response engine
 * This is where JOSEPH comes to life
 */

import {
  extractIntentAndEntities,
  buildConversationalContext,
  saveToMemory,
  buildMemoryExchange,
  isReturningUser
} from '../core/conversation-manager.js';

import {
  buildUserContext,
  buildQuickContext,
  clearContextCache
} from '../core/context-builder.js';

import {
  buildResponseFromContext
} from '../core/response-engine.js';

import { getUserSession, isAuthenticated } from './auth-handler.js';

/**
 * Main JOSEPH conversation handler
 * This is the brain - coordinates everything to produce intelligent responses
 */
export async function josephHandler(message, phoneNumber) {
  const startTime = Date.now();

  try {
    // Step 1: Extract intent and entities
    const { intent, entities, confidence } = extractIntentAndEntities(message);

    // Step 2: Build conversational context (memory-based)
    const conversationalContext = await buildConversationalContext(
      phoneNumber,
      intent
    );

    // Step 3: Check if user is authenticated
    let userId;
    try {
      const session = getUserSession(phoneNumber);
      userId = session?.userId;

      if (!userId && conversationalContext.isNew) {
        // New user, send onboarding flow
        const onboardingResponse = await handleOnboarding(phoneNumber, message);
        await saveToMemory(phoneNumber, {
          timestamp: new Date().toISOString(),
          userMessage: message,
          botResponse: onboardingResponse.message,
          intent: 'onboarding',
          entities,
          context: null
        });

        return onboardingResponse;
      }
    } catch (authError) {
      console.error('Auth error:', authError);
    }

    // Step 4: Build full user context from backend
    let fullContext;
    try {
      // Try to get full context first
      fullContext = await buildUserContext(phoneNumber, userId);
    } catch (contextError) {
      console.error('Context build failed:', contextError);

      // Fallback to quick context
      try {
        fullContext = await buildQuickContext(userId);
        fullContext.errors = [{
          type: 'context_build',
          message: 'Using cached data',
          error: contextError.message
        }];
      } catch (quickError) {
        // Complete failure - return error response
        fullContext = {
          errors: [{ type: 'complete_failure', message: 'Cannot fetch data' }]
        };
      }
    }

    // Step 5: Generate response using JOSEPH's voice
    const response = await buildResponseFromContext(
      intent,
      fullContext,
      conversationalContext
    );

    // Step 6: Save exchange to memory
    await saveToMemory(phoneNumber, {
      timestamp: new Date().toISOString(),
      userMessage: message,
      botResponse: response.message,
      intent,
      entities,
      context: fullContext
    });

    // Step 7: Add metadata
    response.metadata = {
      processingTime: Date.now() - startTime,
      intent,
      confidence,
      userId,
      hasContext: !!fullContext.profile,
      hasErrors: (fullContext.errors?.length || 0) > 0
    };

    return response;

  } catch (error) {
    console.error('JOSEPH handler error:', error);

    // Return graceful error response
    return {
      type: 'error',
      message: `Look, something went sideways on my end. ${error.message}. I'll bounce back - try me again in a sec.`,
      suggestions: ['Try again', 'What were we talking about?'],
      hasData: false,
      metadata: {
        processingTime: Date.now() - startTime,
        error: error.message
      }
    };
  }
}

/**
 * Handle onboarding for new users
 */
async function handleOnboarding(phoneNumber, message) {
  const isName = /^[A-Z][a-z]+(?:\s[A-Z][a-z]+)?$/.test(message.trim());

  if (isName) {
    return {
      type: 'onboarding',
      message: `Nice to meet you, ${message}! I'm JOSEPH - your financial partner in crime.

I'm here to help you track your money, make smarter decisions, and grow your business.

To get started, I'll need to connect your accounts. Can you give me:

1. Your email address (for account setup)
2. Or, if you already have an account, just share your phone number and I'll find you.

What works best for you?`,
      suggestions: ['Share email', 'I have an account'],
      hasData: false,
      nextStep: 'authentication'
    };
  }

  return {
    type: 'onboarding',
    message: `Hey! I'm JOSEPH - your new financial partner in crime.

I noticed you're new here. Before we dive into the numbers, I need to know who I'm talking to.

What's your name?`,
    suggestions: ['Share my name'],
    hasData: false,
    nextStep: 'name_collection'
  };
}

/**
 * Handle help requests
 */
export async function handleHelp(phoneNumber) {
  const isReturning = await isReturningUser(phoneNumber);

  const helpMessage = isReturning
    ? `Here's what I can help you with:

💰 **Financial Status**
- "What's my balance?" - See where we stand
- "Budget status" - Check our spending
- "Who owes me?" - Track credits
- "Runway check" - How long can we last?

📊 **Business Intelligence**
- "Pricing" - Review and optimize prices
- "Products" - See what's selling
- "Economic news" - Market updates
- "Insights" - What I'm noticing

Just ask me anything, and I'll give it to you straight.

What do you want to know?`

    : `Welcome! Here's how I can help:

💰 **Money Stuff**
- "What's my balance?" - Check your funds
- "Budget status" - Track spending
- "Who owes me?" - See credits

📊 **Business Stuff**
- "Pricing" - Optimize your prices
- "Products" - See what's selling
- "News" - Economic updates

I'm your partner in this - I'll tell you like it is, help you spot problems, and celebrate your wins.

What do you want to know?`;

  return {
    type: 'help',
    message: helpMessage,
    suggestions: isReturning
      ? ['Balance check', 'Budget status', 'What do you see?']
      : ['Tell me about you', 'How does this work?'],
    hasData: false
  };
}

/**
 * Handle quick balance check (lightweight, no full context)
 */
export async function handleQuickBalance(phoneNumber, userId) {
  try {
    const context = await buildQuickContext(userId);
    const balance = context.finance?.balance;

    if (!balance) {
      return {
        type: 'error',
        message: "I can't pull your balance right now. The system's being uncooperative. Hang tight - I'll keep trying.",
        hasData: false
      };
    }

    return {
      type: 'balance',
      message: `We're sitting at ₦${balance.amount?.toLocaleString() || '0'}. Want me to break it down?`,
      hasData: true,
      data: { balance }
    };

  } catch (error) {
    return {
      type: 'error',
      message: `Heads up - having trouble reaching your data. I'll keep trying in the background.`,
      hasData: false
    };
  }
}

/**
 * Clear all context and memory for a user (reset conversation)
 */
export async function resetConversation(phoneNumber) {
  try {
    // Clear conversation memory
    const { clearConversation } = await import('../data/conversation-memory.js');
    clearConversation(phoneNumber);

    // Clear backend context cache
    clearContextCache(phoneNumber);

    return {
      type: 'success',
      message: "Conversation reset. Starting fresh. What's on your mind?",
      hasData: false
    };
  } catch (error) {
    return {
      type: 'error',
      message: `Couldn't reset. ${error.message}`,
      hasData: false
    };
  }
}

/**
 * Handle status/health check
 */
export function handleStatus() {
  return {
    type: 'status',
    message: `JOSEPH is online and ready.

I'm your financial partner in crime - firm when needed, always in your corner.

Current status: ✅ Operational
What do you need?`,
    hasData: false
  };
}

/**
 * Handle unknown/unrecognized messages
 */
export function handleUnknown(message, conversationalContext) {
  const isFollowUp = conversationalContext.isFollowUp;

  if (isFollowUp) {
    return {
      type: 'clarification',
      message: `I'm not following. Can you rephrase that?

Or if you're done with this topic, just say "balance", "budget", "credits", or "news" to start fresh.`,
      suggestions: ['Start over', 'Help'],
      hasData: false
    };
  }

  return {
    type: 'unknown',
    message: `I'm not sure what you mean. Try asking about:
- Your balance
- Budget status
- Who owes you
- Economic news

Or say "help" if you're lost.`,
    suggestions: ['Help', 'Balance check'],
    hasData: false
  };
}

export default {
  josephHandler,
  handleHelp,
  handleQuickBalance,
  resetConversation,
  handleStatus,
  handleUnknown
};
