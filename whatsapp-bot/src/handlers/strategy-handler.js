/**
 * Strategy Handler
 * Handles all strategy-related queries (pricing, goals, suppliers)
 */

import { apiClient } from '../utils/api-client.js';
import { logger } from '../utils/logger.js';
import { Intents } from './message-handler.js';

const strategyLogger = logger.forContext('Strategy');

/**
 * Handle strategy-related queries
 * @param {string} intent - Detected intent
 * @param {string} phoneNumber - User's phone number
 * @param {string} message - Original message
 * @param {object} userSession - User session data
 */
export async function handleStrategyQuery(intent, phoneNumber, message, userSession) {
  strategyLogger.info('Handling strategy query', { intent, phoneNumber, userId: userSession.userId });

  try {
    switch (intent) {
      case Intents.PRICING:
        return await getPricing(phoneNumber, userSession);

      case Intents.GOALS:
        return await getGoals(phoneNumber, userSession);

      case Intents.SUPPLIERS:
        return await getSuppliers(phoneNumber, userSession);

      case Intents.PRODUCTS:
        return await getProducts(phoneNumber, userSession);

      default:
        return {
          success: false,
          message: `I'm still learning how to handle that strategy query. Try /pricing or /goals.`
        };
    }
  } catch (error) {
    strategyLogger.error('Strategy query failed', {
      intent,
      phoneNumber,
      error: error.message
    });

    return {
      success: false,
      message: `❌ Sorry, I couldn't fetch your strategy data right now.\n\nPlease try again later.`
    };
  }
}

// ==========================================
// PRICING HANDLER
// ==========================================
async function getPricing(phoneNumber, userSession) {
  try {
    const pricing = await apiClient.getPricing(userSession.userId);

    if (!pricing || !pricing.success) {
      throw new Error(pricing?.message || 'Failed to fetch pricing data');
    }

    const data = pricing.data;
    const currency = data.currency || '₦';

    let message = `💲 *Pricing Strategy Overview*\n\n`;

    // Summary
    const summary = data.summary || {};
    message += `📦 Total Products: ${summary.totalProducts || 0}\n`;
    message += `✅ Healthy Margins: ${summary.healthyMargins || 0}\n`;
    message += `⚠️ Low Margins: ${summary.lowMargins || 0}\n`;
    message += `🔴 Critical Margins: ${summary.criticalMargins || 0}\n`;
    message += `📈 Average Margin: ${summary.averageMargin || 0}%\n\n`;

    // Product analysis (top 5)
    if (data.products && data.products.length > 0) {
      message += `*Top Products*\n`;

      const productsToShow = data.products.slice(0, 5);

      for (const product of productsToShow) {
        const status = product.marginStatus === 'healthy' ? '🟢' :
                      product.marginStatus === 'low' ? '🟡' : '🔴';

        message += `${status} ${product.name}:\n`;
        message += `   Current: ${currency}${product.currentPrice?.toLocaleString() || 0}\n`;
        message += `   Margin: ${product.currentMargin || 0}% (target: ${product.targetMargin || 0}%)\n`;

        if (product.gap && product.gap !== 0) {
          const action = product.gap > 0 ? 'Increase to' : 'Decrease to';
          message += `   💡 ${action}: ${currency}${product.recommendedPrice?.toLocaleString() || 0}\n`;
        }
      }
    }

    // Recommendations
    if (data.recommendations && data.recommendations.length > 0) {
      message += `\n💡 *Recommendations*\n`;
      for (const rec of data.recommendations.slice(0, 3)) {
        const emoji = rec.type === 'urgent' ? '🔴' : rec.type === 'warning' ? '🟡' : '💡';
        message += `${emoji} ${rec.title}\n`;
        message += `   ${rec.message}\n`;
      }
    }

    message += `\n💡 Tip: Type /products for full product list.`;

    return { success: true, message };
  } catch (error) {
    strategyLogger.error('Get pricing failed', { error: error.message });
    throw error;
  }
}

// ==========================================
// GOALS HANDLER
// ==========================================
async function getGoals(phoneNumber, userSession) {
  try {
    const goals = await apiClient.getGoals(userSession.userId);

    if (!goals || !goals.success) {
      throw new Error(goals?.message || 'Failed to fetch goals');
    }

    const data = goals.data;
    const currency = data.currency || '₦';

    let message = `🎯 *Goal Progress*\n\n`;

    // Summary
    const summary = data.summary || {};
    message += `📊 Overall Progress: ${summary.overallProgress || 0}%\n`;
    message += `✅ Completed: ${summary.completedGoals || 0}\n`;
    message += `🔄 In Progress: ${summary.inProgressGoals || 0}\n`;
    message += `📋 Total Goals: ${summary.totalGoals || 0}\n\n`;

    // Goals list
    if (data.goals && data.goals.length > 0) {
      const goalsToShow = data.goals.slice(0, 5);

      for (const goal of goalsToShow) {
        const progress = goal.progress || 0;
        const status = goal.status || 'pending';

        const emoji = status === 'completed' ? '✅' :
                     status === 'in-progress' ? '🔄' :
                     status === 'behind' ? '🔴' : '📋';

        message += `${emoji} *${goal.title}*\n`;
        message += `   Progress: ${progress}%\n`;

        if (goal.targetAmount && goal.currentAmount) {
          message += `   ${currency}${goal.currentAmount.toLocaleString()} / ${currency}${goal.targetAmount.toLocaleString()}\n`;
        }

        if (goal.targetDate) {
          const daysLeft = Math.floor((new Date(goal.targetDate) - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysLeft > 0) {
            message += `   ⏰ ${daysLeft} days remaining\n`;
          } else if (daysLeft === 0) {
            message += `   ⏰ Due today!\n`;
          } else {
            message += `   ⏰ Overdue by ${Math.abs(daysLeft)} days\n`;
          }
        }

        message += '\n';
      }
    }

    if (!data.goals || data.goals.length === 0) {
      message += 'No goals set yet. Create your first goal in the JOSEPH AI app!\n\n';
    }

    message += '💡 Tip: Break big goals into smaller milestones for faster progress.';

    return { success: true, message };
  } catch (error) {
    strategyLogger.error('Get goals failed', { error: error.message });
    throw error;
  }
}

// ==========================================
// SUPPLIERS HANDLER
// ==========================================
async function getSuppliers(phoneNumber, userSession) {
  try {
    const suppliers = await apiClient.getProcurement(userSession.userId);

    if (!suppliers || !suppliers.success) {
      throw new Error(suppliers?.message || 'Failed to fetch suppliers');
    }

    const data = suppliers.data;
    const currency = data.currency || '₦';

    let message = `🏭 *Supplier Overview*\n\n`;

    // Summary
    message += `📦 Total Suppliers: ${data.totalSuppliers || 0}\n`;
    message += `💰 Monthly Spend: ${currency}${(data.monthlySpend || 0).toLocaleString()}\n`;
    message += `📈 Active Materials: ${data.activeMaterials || 0}\n\n`;

    // Top suppliers
    if (data.suppliers && data.suppliers.length > 0) {
      message += `*Top Suppliers*\n`;

      for (const supplier of data.suppliers.slice(0, 5)) {
        const reliability = supplier.reliability || 0;
        const emoji = reliability >= 90 ? '🟢' : reliability >= 70 ? '🟡' : '🔴';

        message += `${emoji} ${supplier.name}:\n`;
        message += `   Category: ${supplier.category || 'N/A'}\n`;
        message += `   Reliability: ${reliability}%\n`;
        message += `   Discount: ${supplier.discount || 0}%\n\n`;
      }
    }

    // Low stock alerts
    if (data.lowStock && data.lowStock.length > 0) {
      message += `⚠️ *Low Stock Alerts*\n`;
      for (const item of data.lowStock.slice(0, 5)) {
        const daysLeft = item.daysUntilStockout || 0;
        message += `├─ ${item.name}: ${item.currentStock}${item.unit} (${daysLeft} days left)\n`;
      }
      message += `\n`;
    }

    message += `💡 Tip: Order materials when stock drops below 14 days to avoid shortages.`;

    return { success: true, message };
  } catch (error) {
    strategyLogger.error('Get suppliers failed', { error: error.message });
    throw error;
  }
}

// ==========================================
// PRODUCTS HANDLER
// ==========================================
async function getProducts(phoneNumber, userSession) {
  try {
    const products = await apiClient.getPricing(userSession.userId);

    if (!products || !products.success) {
      throw new Error(products?.message || 'Failed to fetch products');
    }

    const data = products.data;
    const currency = data.currency || '₦';

    let message = `📦 *Product Catalog*\n\n`;

    if (data.products && data.products.length > 0) {
      for (const product of data.products) {
        const status = product.marginStatus === 'healthy' ? '🟢' :
                      product.marginStatus === 'low' ? '🟡' : '🔴';

        message += `${status} *${product.name}*\n`;
        message += `   Price: ${currency}${product.currentPrice?.toLocaleString() || 0}\n`;
        message += `   COGS: ${currency}${product.cogs?.toLocaleString() || 0}\n`;
        message += `   Margin: ${product.currentMargin || 0}%\n`;

        if (product.stock !== undefined) {
          message += `   Stock: ${product.stock} units\n`;
        }

        if (product.demandLevel) {
          const demand = product.demandLevel === 'high' ? '🔥' :
                        product.demandLevel === 'medium' ? '📊' : '📉';
          message += `   Demand: ${demand} ${product.demandLevel}\n`;
        }

        message += '\n';
      }
    } else {
      message += 'No products found. Add products in the JOSEPH AI app.\n\n';
    }

    message += '💡 Tip: Type /pricing for margin analysis and recommendations.';

    return { success: true, message };
  } catch (error) {
    strategyLogger.error('Get products failed', { error: error.message });
    throw error;
  }
}

// SR
