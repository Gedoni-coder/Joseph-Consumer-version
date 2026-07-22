/**
 * Baileys Provider
 * Implements the BaseProvider interface using @whiskeysockets/baileys.
 * This is the active provider for development (no Meta Business account needed).
 *
 * Connects via WhatsApp Web protocol — scan a QR code to link your number.
 */

import makeWASocket, {
  useMultiFileAuthState,
  Browsers,
  DisconnectReason
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import qrcode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';
import { BaseProvider } from './base-provider.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const providerLogger = logger.forContext('BaileysProvider');

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BASE_DELAY_MS = 5000;

export class BaileysProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this._sock = null;
    this._reconnectAttempts = 0;
    this._isConnecting = false;
  }

  // ==========================================
  // PUBLIC INTERFACE
  // ==========================================

  async connect() {
    if (this._isConnecting) {
      providerLogger.warn('Already connecting — ignoring duplicate call');
      return;
    }
    this._isConnecting = true;
    await this._startSocket();
  }

  async disconnect() {
    if (this._sock) {
      try {
        await this._sock.end();
        providerLogger.info('Baileys socket closed');
      } catch (err) {
        providerLogger.error('Socket close error', { error: err.message });
      }
      this._sock = null;
    }
  }

  async sendMessage(to, text, options = {}) {
    if (!this._sock) {
      providerLogger.error('Cannot send — socket not connected');
      return;
    }

    // Baileys uses JID format: "number@s.whatsapp.net"
    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;

    // Optional delay for natural feel
    const delay = this.config.behavior?.messageDelay ?? 1000;
    if (delay > 0) await this._delay(delay);

    await this._sock.sendMessage(jid, { text, ...options });
    providerLogger.debug('Message sent', { to, length: text.length });
  }

  async sendTyping(to) {
    if (!this._sock) return;
    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
    try {
      await this._sock.sendPresenceUpdate('composing', jid);
    } catch {
      // Non-critical — silently ignore
    }
  }

  // ==========================================
  // INTERNAL SOCKET LIFECYCLE
  // ==========================================

  async _startSocket() {
    const sessionsDir = this.config.sessions?.dir
      ?? path.join(__dirname, '../../../sessions');

    const { state, saveCreds } = await useMultiFileAuthState(sessionsDir);

    this._sock = makeWASocket({
      browser: Browsers.ubuntu('Chrome'),
      auth: state,
      logger: pino({ level: 'silent' }), // suppress Baileys internal logs
      markOnlineOnConnect: false,
      generateHighQualityLinkPreview: true,
      defaultQueryTimeoutMs: undefined
    });

    // Save credentials on update
    this._sock.ev.on('creds.update', saveCreds);

    // Connection state changes
    this._sock.ev.on('connection.update', async (update) => {
      await this._handleConnectionUpdate(update);
    });

    // Incoming messages
    this._sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type === 'notify') {
        for (const message of messages) {
          this._handleIncomingMessage(message);
        }
      }
    });

    providerLogger.info('Baileys socket initialised — waiting for connection');
  }

  async _handleConnectionUpdate({ connection, lastDisconnect, qr }) {
    // Show QR code in terminal
    if (qr) {
      console.log('\n' + '='.repeat(60));
      console.log('📱 SCAN QR CODE TO LINK WHATSAPP');
      console.log('='.repeat(60) + '\n');
      try {
        const qrString = await qrcode.toString(qr, { type: 'terminal', small: true });
        console.log(qrString);
      } catch {
        console.log('QR (raw):', qr);
      }
      console.log('\n' + '='.repeat(60));
      console.log('   Open WhatsApp → Settings → Linked Devices → Link a Device');
      console.log('='.repeat(60) + '\n');
    }

    if (connection === 'open') {
      this._reconnectAttempts = 0;
      this._isConnecting = false;
      const botNumber = this._sock.user?.id?.split('@')[0] ?? 'unknown';
      providerLogger.info('✅ Connected to WhatsApp', { number: botNumber });
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error instanceof Boom)
        ? lastDisconnect.error.output?.statusCode
        : null;

      const loggedOut = statusCode === DisconnectReason.loggedOut;

      providerLogger.error('Connection closed', {
        statusCode,
        reason: lastDisconnect?.error?.message
      });

      if (!loggedOut && this._reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        this._reconnectAttempts++;
        const waitMs = RECONNECT_BASE_DELAY_MS * this._reconnectAttempts;
        providerLogger.info(`Reconnecting in ${waitMs / 1000}s… (${this._reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
        await this._delay(waitMs);
        this._isConnecting = false;
        await this.connect();
      } else {
        providerLogger.error('Max reconnect attempts reached or logged out — exiting');
        process.exit(1);
      }
    }
  }

  _handleIncomingMessage(message) {
    if (message.key.fromMe) return; // ignore our own messages

    const remoteJid = message.key.remoteJid;
    const phoneNumber = remoteJid.split('@')[0];

    // Extract text from all common message types
    const text =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      message.message?.buttonsResponseMessage?.selectedButtonId ||
      message.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
      '';

    if (!text) return;

    providerLogger.info('Message received', {
      from: phoneNumber,
      preview: text.substring(0, 50)
    });

    // Dispatch to the registered callback
    this._dispatch(phoneNumber, text, {
      jid: remoteJid,
      timestamp: message.messageTimestamp,
      rawMessage: message
    });
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
