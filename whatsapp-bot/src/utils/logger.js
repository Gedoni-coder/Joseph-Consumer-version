/**
 * Logger Utility
 * Structured logging for the WhatsApp bot
 */

import { config } from '../config/index.js';

const LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

class Logger {
  constructor(context = 'Bot') {
    this.context = context;
    this.level = LEVELS[config.logging.level] || LEVELS.info;
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase();

    const baseMessage = `[${timestamp}] [${this.context}] ${levelUpper}: ${message}`;

    if (Object.keys(meta).length > 0) {
      return baseMessage + ' ' + JSON.stringify(meta);
    }

    return baseMessage;
  }

  error(message, meta = {}) {
    if (this.level >= LEVELS.error) {
      console.error(this.formatMessage('error', message, meta));
    }
  }

  warn(message, meta = {}) {
    if (this.level >= LEVELS.warn) {
      console.warn(this.formatMessage('warn', message, meta));
    }
  }

  info(message, meta = {}) {
    if (this.level >= LEVELS.info) {
      console.log(this.formatMessage('info', message, meta));
    }
  }

  debug(message, meta = {}) {
    if (this.level >= LEVELS.debug) {
      console.log(this.formatMessage('debug', message, meta));
    }
  }

  // Context-specific loggers
  forContext(newContext) {
    return new Logger(newContext);
  }
}

// Create default logger instance
export const logger = new Logger();

// Create context-specific logger
export function createLogger(context) {
  return new Logger(context);
}

export default logger;
