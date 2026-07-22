/**
 * WhatsApp Bot Configuration
 * Centralized configuration management
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// ==========================================
// BOT CONFIGURATION
// ==========================================
export const config = {
  // Bot Info
  botName: process.env.BOT_NAME || 'JOSEPH AI',
  botPhoneNumber: process.env.BOT_PHONE_NUMBER,

  // Backend API
  backend: {
    apiUrl: process.env.BACKEND_API_URL || 'http://localhost:4000/api',
    apiKey: process.env.BACKEND_API_KEY,
    timeout: parseInt(process.env.BACKEND_TIMEOUT || '30000')
  },

  // Sessions
  sessions: {
    dir: process.env.SESSIONS_DIR || path.join(__dirname, '../../sessions'),
    id: process.env.SESSION_ID || 'joseph-ai-bot'
  },

  // Bot Behavior
  behavior: {
    autoRead: process.env.AUTO_READ === 'true',
    autoTyping: process.env.AUTO_TYPING !== 'false',
    messageDelay: parseInt(process.env.MESSAGE_DELAY_MS || '1000')
  },

  // Rate Limiting
  rateLimit: {
    maxMessagesPerMinute: parseInt(process.env.MAX_MESSAGES_PER_MINUTE || '20'),
    windowMs: 60000
  },

  // Features
  features: {
    dream: process.env.ENABLE_DREAM_MODULE !== 'false',
    strategy: process.env.ENABLE_STRATEGY_MODULE !== 'false',
    finance: process.env.ENABLE_FINANCE_MODULE !== 'false',
    interpretation: process.env.ENABLE_INTERPRETATION_MODULE !== 'false',
    groups: process.env.GROUPS_ENABLED === 'true'
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE
  },

  // Security
  security: {
    allowedNumbers: process.env.ALLOWED_NUMBERS || '*',
    adminNumbers: process.env.ADMIN_NUMBERS ? process.env.ADMIN_NUMBERS.split(',') : []
  },

  // Message Templates
  messages: {
    welcome: process.env.WELCOME_MESSAGE || 'Welcome to JOSEPH AI! 🎈 I\'m your personal economist.',
    help: process.env.HELP_MESSAGE || 'Available commands: /balance, /budget, /goals, /economic, /help'
  }
};

// ==========================================
// VALIDATION
// ==========================================
export function validateConfig() {
  const errors = [];

  if (!config.backend.apiUrl) {
    errors.push('BACKEND_API_URL is required');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }

  return true;
}

// Export for convenience
export default config;
