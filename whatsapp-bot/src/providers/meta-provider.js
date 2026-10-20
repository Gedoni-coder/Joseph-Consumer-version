/**
 * Meta Cloud API Provider
 * Implements the BaseProvider interface using Meta's official WhatsApp Cloud API.
 *
 * ─── HOW TO ACTIVATE ────────────────────────────────────────────────────────
 * 1. Create a Meta Business account at https://business.facebook.com
 * 2. Create a WhatsApp Business app at https://developers.facebook.com
 * 3. Get your credentials from the dashboard
 * 4. Add these to whatsapp-bot/.env:
 *      META_ACCESS_TOKEN=your_permanent_token
 *      META_PHONE_NUMBER_ID=your_phone_number_id
 *      META_WEBHOOK_VERIFY_TOKEN=choose_any_secret_string
 * 5. Change WHATSAPP_PROVIDER=meta in .env
 * 6. Expose your local server via ngrok or deploy to production so Meta can
 *    reach your webhook at: POST /api/whatsapp/webhook
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Unlike Baileys (which connects outbound), Meta uses an INBOUND webhook model:
 *   - Meta sends messages TO your backend via HTTP POST
 *   - You send messages FROM your backend via Meta's REST API
 *
 * No QR code needed. No session files. No reconnect logic.
 */

import axios from 'axios';
import express from 'express';
import { BaseProvider } from './base-provider.js';
import { logger } from '../utils/logger.js';

const providerLogger = logger.forContext('MetaProvider');

const META_API_BASE = 'https://graph.facebook.com/v19.0';

export class MetaProvider extends BaseProvider {
  constructor(config) {
    super(config);

    this._accessToken    = process.env.META_ACCESS_TOKEN;
    this._phoneNumberId  = process.env.META_PHONE_NUMBER_ID;
    this._verifyToken    = process.env.META_WEBHOOK_VERIFY_TOKEN || 'joseph-ai-webhook';
    this._webhookPort    = parseInt(process.env.META_WEBHOOK_PORT || '4001');

    this._webhookApp     = null;
    this._webhookServer  = null;
  }

  // ==========================================
  // PUBLIC INTERFACE
  // ==========================================

  async connect() {
    this._validateCredentials();
    await this._startWebhookServer();
    providerLogger.info('✅ Meta Cloud API provider ready', {
      phoneNumberId: this._phoneNumberId,
      webhookPort: this._webhookPort
    });
  }

  async disconnect() {
    if (this._webhookServer) {
      await new Promise(resolve => this._webhookServer.close(resolve));
      providerLogger.info('Meta webhook server stopped');
    }
  }

  async sendMessage(to, text, options = {}) {
    this._validateCredentials();

    // Strip any non-digit characters (e.g. leading +)
    const phoneNumber = to.replace(/\D/g, '');

    try {
      await axios.post(
        `${META_API_BASE}/${this._phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phoneNumber,
          type: 'text',
          text: { body: text, preview_url: false }
        },
        {
          headers: {
            Authorization: `Bearer ${this._accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      providerLogger.debug('Message sent via Meta API', { to: phoneNumber, length: text.length });
    } catch (err) {
      const detail = err.response?.data ?? err.message;
      providerLogger.error('Meta API send failed', { to: phoneNumber, error: detail });
      throw err;
    }
  }

  async sendTyping(to) {
    // Meta Cloud API does not support typing indicators for standard messages.
    // This is intentionally a no-op.
  }

  // ==========================================
  // WEBHOOK SERVER
  // Meta delivers incoming messages via HTTP POST to this server.
  // In production, point your Meta App webhook URL to:
  //   https://your-domain.com/webhook   (or expose via ngrok locally)
  // ==========================================

  async _startWebhookServer() {
    this._webhookApp = express();
    this._webhookApp.use(express.json());

    // Webhook verification handshake (Meta calls this once during setup)
    this._webhookApp.get('/webhook', (req, res) => {
      const mode      = req.query['hub.mode'];
      const token     = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      if (mode === 'subscribe' && token === this._verifyToken) {
        providerLogger.info('Meta webhook verified ✅');
        return res.status(200).send(challenge);
      }

      providerLogger.warn('Meta webhook verification failed', { token });
      return res.sendStatus(403);
    });

    // Incoming message events from Meta
    this._webhookApp.post('/webhook', (req, res) => {
      res.sendStatus(200); // Acknowledge immediately (Meta requires < 5s response)

      try {
        const body = req.body;
        if (body.object !== 'whatsapp_business_account') return;

        for (const entry of body.entry ?? []) {
          for (const change of entry.changes ?? []) {
            const value = change.value;
            for (const message of value?.messages ?? []) {
              const phoneNumber = message.from;
              const text =
                message.text?.body ||          // standard text
                message.interactive?.button_reply?.title || // button reply
                message.interactive?.list_reply?.title ||   // list reply
                '';

              if (!text) continue;

              providerLogger.info('Message received via Meta webhook', {
                from: phoneNumber,
                preview: text.substring(0, 50)
              });

              this._dispatch(phoneNumber, text, {
                messageId: message.id,
                timestamp: message.timestamp,
                rawMessage: message
              });
            }
          }
        }
      } catch (err) {
        providerLogger.error('Webhook processing error', { error: err.message });
      }
    });

    await new Promise((resolve, reject) => {
      this._webhookServer = this._webhookApp.listen(this._webhookPort, (err) => {
        if (err) return reject(err);
        providerLogger.info(`Meta webhook server listening`, { port: this._webhookPort });
        resolve();
      });
    });
  }

  _validateCredentials() {
    const missing = [];
    if (!this._accessToken)   missing.push('META_ACCESS_TOKEN');
    if (!this._phoneNumberId) missing.push('META_PHONE_NUMBER_ID');

    if (missing.length > 0) {
      throw new Error(
        `Meta Cloud API provider is missing required environment variables:\n` +
        missing.map(v => `  - ${v}`).join('\n') + '\n\n' +
        `See whatsapp-bot/src/providers/meta-provider.js for setup instructions.`
      );
    }
  }
}

// SR
