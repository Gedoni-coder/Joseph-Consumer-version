/**
 * Dream Handler
 * Handles all Dream (Economic Intelligence) module queries
 */

import { apiClient } from '../utils/api-client.js';
import { logger } from '../utils/logger.js';
import { Intents } from './message-handler.js';

const dreamLogger = logger.forContext('Dream');

/**
 * Handle Dream-related queries
 * @param {string} intent - Detected intent
 * @param {string} phoneNumber - User's phone number
 * @param {string} message - Original message
 * @param {object} userSession - User session data
 */
export async function handleDreamQuery(intent, phoneNumber, message, userSession) {
  dreamLogger.info('Handling Dream query', { intent, phoneNumber });

  try {
    switch (intent) {
      case Intents.ECONOMIC:
      case Intents.INDICATORS:
        return await getEconomicIndicators(phoneNumber);

      case Intents.NEWS:
        return await getEconomicNews(phoneNumber);

      case Intents.STRESS_TEST:
        return await getStressTest(phoneNumber);

      default:
        return {
          success: false,
          message: `I'm still learning how to handle that Dream query. Try /economic or /news.`
        };
    }
  } catch (error) {
    dreamLogger.error('Dream query failed', {
      intent,
      phoneNumber,
      error: error.message
    });

    return {
      success: false,
      message: `❌ Sorry, I couldn't fetch economic data right now.\n\nPlease try again later.`
    };
  }
}

// ==========================================
// ECONOMIC INDICATORS HANDLER
// ==========================================
async function getEconomicIndicators(phoneNumber) {
  try {
    const ticker = await apiClient.getEconomicTicker();
    const stats = await apiClient.getQuickStats();

    let message = `📊 *Economic Intelligence*\n\n`;

    // Quick stats
    if (stats && stats.success) {
      const data = stats.data;

      message += `*Market Health*\n`;

      const healthScore = data.healthScore || 0;
      const healthEmoji = healthScore >= 80 ? '🟢' : healthScore >= 60 ? '🟡' : '🔴';
      message += `${healthEmoji} Health Score: ${healthScore}/100\n`;

      const volatility = data.volatility || 'N/A';
      message += `📈 Volatility: ${volatility}\n`;

      const newsCount = data.newsCount || 0;
      message += `📰 News Items: ${newsCount}\n\n`;
    }

    // Key indicators ticker
    if (ticker && ticker.success && ticker.ticker) {
      message += `*Key Indicators*\n`;

      const indicators = ticker.ticker;
      const emojiMap = {
        'INFLATION_RATE': '📈',
        'CURRENCY_USD': '💱',
        'FOOD_INFLATION': '🍲',
        'INTEREST_RATE': '🏦',
        'INTERBANK_RATE': '💹'
      };

      for (const indicator of indicators) {
        const emoji = emojiMap[indicator.code] || '📊';
        const trend = indicator.trendIcon === '↑' ? '📈' :
                     indicator.trendIcon === '↓' ? '📉' : '➡️';

        message += `${emoji} ${indicator.label}:\n`;
        message += `   ${indicator.value} ${trend} ${indicator.change}\n`;
      }
    }

    message += `\n💡 Tip: Type /news for latest economic updates.`;

    return { success: true, message };
  } catch (error) {
    dreamLogger.error('Get economic indicators failed', { error: error.message });
    throw error;
  }
}

// ==========================================
// ECONOMIC NEWS HANDLER
// ==========================================
async function getEconomicNews(phoneNumber) {
  try {
    const news = await apiClient.getEconomicNews(5);

    if (!news || !news.success) {
      throw new Error(news?.message || 'Failed to fetch news');
    }

    let message = `📰 *Economic News Feed*\n\n`;

    if (news.data && news.data.length > 0) {
      for (const article of news.data) {
        const date = new Date(article.publishedAt || Date.now());
        const timeAgo = getTimeAgo(date);

        const impact = article.impact || 'neutral';
        const impactEmoji = impact === 'high' ? '🔴' :
                           impact === 'medium' ? '🟡' : '🟢';

        message += `${impactEmoji} *${article.title}*\n`;
        message += `   ${article.summary?.substring(0, 80) || 'No summary'}...\n`;
        message += `   🕐 ${timeAgo} • ${article.source || 'Unknown'}\n\n`;
      }
    } else {
      message += `No recent economic news available.\n\n`;
    }

    message += `💡 Tip: Type /economic to see key indicators.`;

    return { success: true, message };
  } catch (error) {
    dreamLogger.error('Get economic news failed', { error: error.message });
    throw error;
  }
}

// ==========================================
// STRESS TEST HANDLER
// ==========================================
async function getStressTest(phoneNumber) {
  try {
    // Would call a stress test endpoint when available
    let message = `🧪 *Economic Stress Test*\n\n`;

    message += `*Scenario Analysis*\n\n`;

    message += `📉 *Scenario 1: High Inflation (35%)*\n`;
    message += `├─ Impact: Purchasing power -15%\n`;
    message += `├– Recommendation: Increase prices by 10-15%\n`;
    message += `└─ Action: Review /pricing\n\n`;

    message += `💱 *Scenario 2: FX Devaluation (₦2000/$)*\n`;
    message += `├─ Impact: Import costs +21%\n`;
    message += `├─ Recommendation: Switch to local suppliers\n`;
    message += `└─ Action: Check /suppliers\n\n`;

    message += `🏦 *Scenario 3: Interest Rate Hike (28%)*\n`;
    message += `├─ Impact: Loan costs +12%\n`;
    message += `├─ Recommendation: Reduce debt, improve cash flow\n`;
    message += `└─ Action: Review /runway\n\n`;

    message += `💡 Tip: Build emergency fund covering 3+ months of expenses.`;

    return { success: true, message };
  } catch (error) {
    dreamLogger.error('Get stress test failed', { error: error.message });
    throw error;
  }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get time ago string
 * @param {Date} date - Date to compare
 */
function getTimeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  if (seconds < 60) {
    return 'Just now';
  }

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);

    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }

  return 'Just now';
}
