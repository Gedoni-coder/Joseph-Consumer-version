/**
 * Interpretation Handler
 * Handles all Interpretation module queries (insights, alerts, recommendations)
 */

import { apiClient } from '../utils/api-client.js';
import { logger } from '../utils/logger.js';
import { Intents } from './message-handler.js';

const interpretationLogger = logger.forContext('Interpretation');

/**
 * Handle Interpretation-related queries
 * @param {string} intent - Detected intent
 * @param {string} phoneNumber - User's phone number
 * @param {string} message - Original message
 * @param {object} userSession - User session data
 */
export async function handleInterpretationQuery(intent, phoneNumber, message, userSession) {
  interpretationLogger.info('Handling Interpretation query', {
    intent,
    phoneNumber,
    userId: userSession.userId
  });

  try {
    switch (intent) {
      case Intents.INSIGHTS:
      case Intents.RECOMMENDATIONS:
        return await getInsights(phoneNumber, userSession);

      case Intents.ALERTS:
        return await getAlerts(phoneNumber, userSession);

      default:
        return {
          success: false,
          message: `I'm still learning how to handle that interpretation query. Try /insights or /alerts.`
        };
    }
  } catch (error) {
    interpretationLogger.error('Interpretation query failed', {
      intent,
      phoneNumber,
      error: error.message
    });

    return {
      success: false,
      message: `❌ Sorry, I couldn't fetch insights right now.\n\nPlease try again later.`
    };
  }
}

// ==========================================
// INSIGHTS HANDLER
// ==========================================
async function getInsights(phoneNumber, userSession) {
  try {
    const insights = await apiClient.getInsights(userSession.userId);

    if (!insights || !insights.success) {
      throw new Error(insights?.message || 'Failed to fetch insights');
    }

    let message = `💡 *Your Insights*\n\n`;

    const data = insights.data;

    // Summary
    const summary = data.summary || {};
    message += `📊 Total Insights: ${summary.totalInsights || 0}\n`;
    message += `✅ Read: ${summary.readInsights || 0}\n`;
    message += `🆕 New: ${summary.unreadInsights || 0}\n`;
    message += `⚠️ Action Required: ${summary.actionableInsights || 0}\n\n`;

    // Insights list
    if (data.insights && data.insights.length > 0) {
      const insightsToShow = data.insights.slice(0, 5);

      for (const insight of insightsToShow) {
        const severity = insight.severity || 'info';
        const emoji = severity === 'critical' ? '🔴' :
                     severity === 'high' ? '🟠' :
                     severity === 'medium' ? '🟡' : '🔵';

        const isPinned = insight.isPinned ? '📌' : '';
        const isActionable = insight.requiresAction ? '⚡' : '';

        message += `${emoji} ${isPinned}${isActionable} *${insight.title}*\n`;
        message += `   ${insight.summary?.substring(0, 80) || 'No summary'}...\n`;

        if (insight.category) {
          message += `   🏷️ ${insight.category}\n`;
        }

        if (insight.requiresAction && insight.action) {
          message += `   💡 ${insight.action}\n`;
        }

        message += '\n';
      }
    } else {
      message += 'No insights available right now. I\'ll let you know when I have something for you!\n\n';
    }

    message += '💡 Tip: Type /alerts to see insights requiring action.';

    return { success: true, message };
  } catch (error) {
    interpretationLogger.error('Get insights failed', {
      userId: userSession.userId,
      error: error.message
    });
    throw error;
  }
}

// ==========================================
// ALERTS HANDLER
// ==========================================
async function getAlerts(phoneNumber, userSession) {
  try {
    const actionableInsights = await apiClient.getActionableInsights(userSession.userId);

    if (!actionableInsights || !actionableInsights.success) {
      throw new Error(actionableInsights?.message || 'Failed to fetch alerts');
    }

    let message = `⚡ *Actionable Alerts*\n\n`;

    const data = actionableInsights.data;

    if (data.insights && data.insights.length > 0) {
      message += `You have ${data.insights.length} action(s) requiring attention:\n\n`;

      // Group by severity
      const critical = data.insights.filter(i => i.severity === 'critical');
      const high = data.insights.filter(i => i.severity === 'high');
      const medium = data.insights.filter(i => i.severity === 'medium');

      if (critical.length > 0) {
        message += `🔴 *Critical*\n`;
        for (const alert of critical) {
          message += `├─ ${alert.title}\n`;
          message += `   ${alert.action || 'Review this alert'}\n\n`;
        }
      }

      if (high.length > 0) {
        message += `🟠 *High Priority*\n`;
        for (const alert of high) {
          message += `├─ ${alert.title}\n`;
          message += `   ${alert.action || 'Review this alert'}\n\n`;
        }
      }

      if (medium.length > 0) {
        message += `🟡 *Medium Priority*\n`;
        for (const alert of medium) {
          message += `├─ ${alert.title}\n`;
          message += `   ${alert.action || 'Review this alert'}\n\n`;
        }
      }

      message += `💡 Respond to alerts to keep your finances healthy!\n`;
    } else {
      message += `✅ *All caught up!*\n\n`;
      message += `No urgent actions needed right now. Great job staying on top of things!\n\n`;
    }

    message += `💡 Tip: Type /insights to see all your insights.`;

    return { success: true, message };
  } catch (error) {
    interpretationLogger.error('Get alerts failed', {
      userId: userSession.userId,
      error: error.message
    });
    throw error;
  }
}

// SR
