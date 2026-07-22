/**
 * JOSEPH AI WhatsApp Bot — Entry Point
 *
 * This file is intentionally provider-agnostic.
 * It does NOT import Baileys or Meta directly.
 * All transport logic lives in src/providers/.
 *
 * To switch providers, change ONE line in .env:
 *   WHATSAPP_PROVIDER=baileys   ← current (development)
 *   WHATSAPP_PROVIDER=meta      ← future  (production)
 */

import dotenv from 'dotenv';
dotenv.config();

import { config, validateConfig } from './config/index.js';
import { createProvider }         from './providers/index.js';
import { logger }                 from './utils/logger.js';
import { processMessage }         from './handlers/message-handler.js';

const botLogger = logger.forContext('Bot');

// ==========================================
// RATE LIMITING (shared, provider-agnostic)
// ==========================================
const messageTimestamps = new Map();

function checkRateLimit(phoneNumber) {
  const now = Date.now();
  const timestamps = messageTimestamps.get(phoneNumber) || [];
  const valid = timestamps.filter(t => now - t < config.rateLimit.windowMs);

  if (valid.length >= config.rateLimit.maxMessagesPerMinute) return false;

  valid.push(now);
  messageTimestamps.set(phoneNumber, valid);
  return true;
}

// ==========================================
// BOT INITIALISATION
// ==========================================

async function startBot() {
  // Validate env/config before doing anything
  validateConfig();

  botLogger.info('═══════════════════════════════════════');
  botLogger.info('  JOSEPH AI WhatsApp Bot starting up   ');
  botLogger.info(`  Provider: ${process.env.WHATSAPP_PROVIDER || 'baileys'}  `);
  botLogger.info('═══════════════════════════════════════');

  // Create the active provider (Baileys or Meta — decided by .env)
  const provider = createProvider(config);

  // Register message handler
  provider.onMessage(async (phoneNumber, text, meta) => {
    if (!checkRateLimit(phoneNumber)) {
      botLogger.warn('Rate limit exceeded', { phoneNumber });
      return;
    }

    botLogger.info('Processing message', {
      from: phoneNumber,
      preview: text.substring(0, 50)
    });

    try {
      // Show typing indicator (best-effort — Meta no-ops this)
      await provider.sendTyping(phoneNumber);

      // Route message through the existing handler system
      const response = await processMessage(phoneNumber, text, meta);

      // Send reply
      if (response?.message) {
        await provider.sendMessage(phoneNumber, response.message, response.options ?? {});
      }
    } catch (err) {
      botLogger.error('Message processing failed', {
        phoneNumber,
        error: err.message,
        stack: err.stack
      });
    }
  });

  // Connect the provider
  await provider.connect();

  // ==========================================
  // GRACEFUL SHUTDOWN
  // ==========================================
  async function shutdown(signal) {
    botLogger.info(`${signal} received — shutting down gracefully`);
    await provider.disconnect();
    process.exit(0);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

// ==========================================
// START
// ==========================================
startBot().catch(err => {
  console.error('💥 Fatal bot error:', err.message);
  process.exit(1);
});
