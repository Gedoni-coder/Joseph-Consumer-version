/**
 * Finance Handler
 * Handles all finance-related queries
 */

import { apiClient } from '../utils/api-client.js';
import { logger } from '../utils/logger.js';
import { Intents } from './message-handler.js';

const financeLogger = logger.forContext('Finance');

/**
 * Handle finance-related queries
 * @param {string} intent - Detected intent
 * @param {string} phoneNumber - User's phone number
 * @param {string} message - Original message
 * @param {object} userSession - User session data
 */
export async function handleFinanceQuery(intent, phoneNumber, message, userSession) {
  financeLogger.info('Handling finance query', { intent, phoneNumber, userId: userSession.userId });

  try {
    switch (intent) {
      case Intents.BALANCE:
        return await getBalance(phoneNumber, userSession);

      case Intents.BUDGET:
        return await getBudget(phoneNumber, userSession);

      case Intents.RUNWAY:
        return await getRunway(phoneNumber, userSession);

      case Intents.CREDITS:
        return await getCredits(phoneNumber, userSession);

      default:
        return {
          success: false,
          message: `I'm still learning how to handle that finance query. Try /balance or /budget.`
        };
    }
  } catch (error) {
    financeLogger.error('Finance query failed', {
      intent,
      phoneNumber,
      error: error.message
    });

    return {
      success: false,
      message: `❌ Sorry, I couldn't fetch your finance data right now.\n\nPlease try again later.`
    };
  }
}

// ==========================================
// BALANCE HANDLER
// ==========================================
async function getBalance(phoneNumber, userSession) {
  try {
    const ledgers = await apiClient.getLedgers(userSession.userId);

    if (!ledgers || !ledgers.success || !ledgers.data || ledgers.data.length === 0) {
      return {
        success: true,
        message: `💰 *Your Balance*\n\n` +
                 `No ledgers found. Please set up your account in the JOSEPH AI app first.`
      };
    }

    let message = `💰 *Your Balance*\n\n`;

    for (const ledger of ledgers.data) {
      const currency = ledger.currency || '₦';
      const balance = ledger.balance || 0;
      const name = ledger.name || ledger.type;

      message += `${name.charAt(0).toUpperCase() + name.slice(1)} Ledger:\n`;
      message += `├─ Balance: ${currency}${balance.toLocaleString()}\n`;

      if (ledger.type === 'business') {
        const workingCapital = ledger.workingCapital || 0;
        const availableCapital = ledger.availableCapital || 0;

        message += `├─ Working Capital: ${currency}${workingCapital.toLocaleString()}\n`;
        message += `└─ Available: ${currency}${availableCapital.toLocaleString()}\n`;
      } else {
        const budgetUsed = ledger.totalExpenses || 0;
        const budgetTotal = ledger.monthlyBudget || 0;
        const percentage = budgetTotal > 0 ? Math.round((budgetUsed / budgetTotal) * 100) : 0;

        message += `├─ Budget Used: ${percentage}%\n`;
        message += `└─ Remaining: ${currency}${(budgetTotal - budgetUsed).toLocaleString()}\n`;
      }

      message += `\n`;
    }

    message += `💡 Tip: Type /budget for detailed breakdown.`;

    return { success: true, message };
  } catch (error) {
    throw error;
  }
}

// ==========================================
// BUDGET HANDLER
// ==========================================
async function getBudget(phoneNumber, userSession) {
  try {
    const budget = await apiClient.getBudget(userSession.userId);

    if (!budget || !budget.success) {
      throw new Error(budget?.message || 'Failed to fetch budget');
    }

    const data = budget.data;
    const currency = data.currency || '₦';

    let message = `📊 *Budget Breakdown*\n\n`;
    message += `Monthly Budget: ${currency}${(data.monthlyBudget || 0).toLocaleString()}\n\n`;

    // 50:30:20 breakdown
    const allocation = data.allocation || { needs: 50, wants: 30, savings: 20 };

    message += `*Allocation (50:30:20)*\n`;
    message += `├─ Needs (50%): ${currency}${((data.monthlyBudget || 0) * 0.5).toLocaleString()}\n`;
    message += `├─ Wants (30%): ${currency}${((data.monthlyBudget || 0) * 0.3).toLocaleString()}\n`;
    message += `└─ Savings (20%): ${currency}${((data.monthlyBudget || 0) * 0.2).toLocaleString()}\n\n`;

    // Spending by category
    if (data.categories) {
      message += `*Spending This Month*\n`;

      const categories = [
        { key: 'needs', emoji: '🏠', label: 'Needs' },
        { key: 'wants', emoji: '🎮', label: 'Wants' },
        { key: 'savings', emoji: '💰', label: 'Savings' }
      ];

      for (const cat of categories) {
        const spent = data.categories[cat.key]?.spent || 0;
        const budget = data.categories[cat.key]?.budget || 0;
        const percentage = budget > 0 ? Math.round((spent / budget) * 100) : 0;

        const status = percentage >= 100 ? '🔴' : percentage >= 80 ? '🟡' : '🟢';

        message += `${status} ${cat.emoji} ${cat.label}:\n`;
        message += `   Spent: ${currency}${spent.toLocaleString()} / ${currency}${budget.toLocaleString()} (${percentage}%)\n`;
      }
    }

    // Variance warnings
    if (data.variances && data.variances.length > 0) {
      message += `\n⚠️ *Alerts*\n`;
      for (const variance of data.variances) {
        message += `├─ ${variance.message}\n`;
      }
    }

    message += `\n💡 Tip: Type /runway to see how long your cash will last.`;

    return { success: true, message };
  } catch (error) {
    throw error;
  }
}

// ==========================================
// RUNWAY HANDLER
// ==========================================
async function getRunway(phoneNumber, userSession) {
  try {
    const runway = await apiClient.getRunway(userSession.userId);

    if (!runway || !runway.success) {
      throw new Error(runway?.message || 'Failed to fetch runway');
    }

    const data = runway.data;
    const currency = data.currency || '₦';

    let message = `🛫 *Cash Runway Analysis*\n\n`;
    message += `Current Balance: ${currency}${(data.balance || 0).toLocaleString()}\n`;
    message += `Daily Burn Rate: ${currency}${(data.burnRate || 0).toLocaleString()}\n`;

    const runwayDays = data.runwayDays || 0;
    const runwayWeeks = Math.floor(runwayDays / 7);
    const runwayMonths = Math.floor(runwayDays / 30);

    message += `\n⏳ *Runway*\n`;
    message += `├─ Days: ${runwayDays.toLocaleString()} days\n`;
    message += `├─ Weeks: ${runwayWeeks} weeks\n`;
    message += `└─ Months: ${runwayMonths} months\n\n`;

    // Status
    let status, statusEmoji;
    if (runwayDays < 14) {
      status = 'Critical';
      statusEmoji = '🔴';
    } else if (runwayDays < 30) {
      status = 'Warning';
      statusEmoji = '🟡';
    } else {
      status = 'Healthy';
      statusEmoji = '🟢';
    }

    message += `${statusEmoji} Status: ${status}\n\n`;

    // Projections
    if (data.projections) {
      message += `*Projections*\n`;
      message += `├─ 30 days: ${currency}${(data.projections.day30 || 0).toLocaleString()}\n`;
      message += `├─ 60 days: ${currency}${(data.projections.day60 || 0).toLocaleString()}\n`;
      message += `└─ 90 days: ${currency}${(data.projections.day90 || 0).toLocaleString()}\n\n`;
    }

    // Recommendations
    if (status !== 'Healthy') {
      message += `💡 *Recommendations*\n`;
      if (runwayDays < 14) {
        message += `├─ Immediate: Reduce non-essential spending\n`;
        message += `├─ Review: Check for overdue credits\n`;
        message += `└─ Action: Type /credits to chase payments\n`;
      } else if (runwayDays < 30) {
        message += `├─ Monitor: Track spending closely\n`;
        message += `└─ Plan: Consider pricing adjustments\n`;
      }
    }

    return { success: true, message };
  } catch (error) {
    throw error;
  }
}

// ==========================================
// CREDITS HANDLER
// ==========================================
async function getCredits(phoneNumber, userSession) {
  try {
    const credits = await apiClient.getCredits(userSession.userId);

    if (!credits || !credits.success) {
      throw new Error(credits?.message || 'Failed to fetch credits');
    }

    const data = credits.data;
    const currency = data.currency || '₦';

    let message = `📝 *Credit Sales Overview*\n\n`;

    // Summary
    const totalCredit = data.totalCredit || 0;
    const totalPaid = data.totalPaid || 0;
    const totalOutstanding = totalCredit - totalPaid;

    message += `Total Credit Sales: ${currency}${totalCredit.toLocaleString()}\n`;
    message += `Total Collected: ${currency}${totalPaid.toLocaleString()}\n`;
    message += `*Outstanding: ${currency}${totalOutstanding.toLocaleString()}*\n\n`;

    // Overdue credits
    if (data.overdue && data.overdue.length > 0) {
      message += `🔴 *Overdue Credits*\n`;
      for (const credit of data.overdue.slice(0, 5)) {
        const daysOverdue = Math.floor((Date.now() - new Date(credit.dueDate)) / (1000 * 60 * 60 * 24));
        message += `├─ ${credit.customerName}: ${currency}${credit.amountOutstanding.toLocaleString()} (${daysOverdue} days overdue)\n`;
      }
      message += `\n`;
    }

    // Upcoming credits
    if (data.upcoming && data.upcoming.length > 0) {
      message += `📅 *Upcoming Collections*\n`;
      for (const credit of data.upcoming.slice(0, 5)) {
        const daysUntilDue = Math.floor((new Date(credit.dueDate) - Date.now()) / (1000 * 60 * 60 * 24));
        message += `├─ ${credit.customerName}: ${currency}${credit.amountOutstanding.toLocaleString()} (due in ${daysUntilDue} days)\n`;
      }
      message += `\n`;
    }

    // Collection rate
    const collectionRate = totalCredit > 0 ? Math.round((totalPaid / totalCredit) * 100) : 0;
    message += `📊 Collection Rate: ${collectionRate}%\n\n`;

    if (collectionRate < 80) {
      message += `💡 Tip: Your collection rate is below 80%. Consider sending payment reminders to overdue customers.\n`;
    }

    return { success: true, message };
  } catch (error) {
    throw error;
  }
}
