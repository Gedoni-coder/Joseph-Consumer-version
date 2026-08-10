/**
 * Data Scheduler Service
 * Handles scheduled updates of economic indicator values
 *
 * Features:
 * - Daily automatic refresh from external sources
 * - Configurable refresh intervals
 * - Error handling and retry logic
 * - Update history tracking
 */

import economicDataUpdater from './economicDataUpdater.js';

// ==========================================
// SCHEDULER CONFIGURATION
// ==========================================

const SCHEDULE_CONFIG = {
  // Daily refresh at 6 AM WAT (West Africa Time)
  dailyRefresh: {
    hour: 6, // 6 AM
    minute: 0,
    timezone: 'Africa/Lagos',
    enabled: true
  },

  // Additional refresh at 2 PM for high-frequency indicators
  middayRefresh: {
    hour: 14, // 2 PM
    minute: 0,
    timezone: 'Africa/Lagos',
    enabled: false
  },

  // Retry failed updates after
  retryIntervalMinutes: 30,
  maxRetries: 3
};

// ==========================================
// SCHEDULER STATE
// ==========================================

let schedulerInterval = null;
let isRunning = false;
let lastRunTime = null;
let runCount = 0;

// ==========================================
// SCHEDULER FUNCTIONS
// ==========================================

/**
 * Start the data update scheduler
 */
export function startScheduler() {
  if (schedulerInterval) {
    console.log('Data scheduler already running');
    return;
  }

  console.log('Starting economic data scheduler...');

  // Calculate interval until next scheduled run
  const intervalMs = calculateNextInterval();

  // Run immediately on start
  runScheduledUpdate();

  // Set up recurring interval
  schedulerInterval = setInterval(() => {
    runScheduledUpdate();
  }, intervalMs);

  console.log(`Data scheduler started. Next run in ${Math.round(intervalMs / 1000 / 60)} minutes`);
}

/**
 * Stop the data update scheduler
 */
export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('Data scheduler stopped');
  }
}

/**
 * Calculate milliseconds until next scheduled run
 */
function calculateNextInterval() {
  const config = SCHEDULE_CONFIG.dailyRefresh;
  if (!config.enabled) {
    // Default to 24 hours if not enabled
    return 24 * 60 * 60 * 1000;
  }

  const now = new Date();
  const target = new Date();

  // Set target time
  target.setHours(config.hour, config.minute, 0, 0);

  // If target time has passed today, schedule for tomorrow
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  return target.getTime() - now.getTime();
}

/**
 * Run scheduled update
 */
async function runScheduledUpdate() {
  if (isRunning) {
    console.log('Scheduled update already in progress, skipping');
    return;
  }

  isRunning = true;
  lastRunTime = new Date();
  runCount++;

  console.log(`[${lastRunTime.toISOString()}] Running scheduled economic data update #${runCount}`);

  try {
    const result = await economicDataUpdater.updateAllIndicators();

    if (result.success) {
      console.log(`Scheduled update completed: ${result.results?.updated?.length || 0} indicators updated`);
    } else {
      console.error(`Scheduled update completed with errors: ${result.error}`);

      // Retry logic
      if (runCount <= SCHEDULE_CONFIG.maxRetries) {
        const retryMs = SCHEDULE_CONFIG.retryIntervalMinutes * 60 * 1000;
        console.log(`Retrying in ${SCHEDULE_CONFIG.retryIntervalMinutes} minutes...`);

        setTimeout(() => {
          runScheduledUpdate();
        }, retryMs);
      }
    }

  } catch (error) {
    console.error('Error in scheduled update:', error);
  } finally {
    isRunning = false;
  }
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus() {
  return {
    isRunning: !!schedulerInterval,
    isUpdating: isRunning,
    lastRunTime,
    runCount,
    config: SCHEDULE_CONFIG,
    nextRunTime: schedulerInterval
      ? new Date(Date.now() + calculateNextInterval())
      : null
  };
}

/**
 * Manually trigger a scheduled update
 */
export async function triggerManualUpdate() {
  console.log('Manual update triggered');
  return await runScheduledUpdate();
}

// ==========================================
// AUTO-START (can be disabled by environment)
// ==========================================

if (process.env.AUTO_START_SCHEDULER !== 'false') {
  // Start scheduler after a short delay to allow app to initialize
  setTimeout(() => {
    startScheduler();
  }, 5000);
}

export default {
  startScheduler,
  stopScheduler,
  getSchedulerStatus,
  triggerManualUpdate
};
