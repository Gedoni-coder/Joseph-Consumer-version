/**
 * WhatsApp Bot using whatsapp-web.js
 * Uses real Chrome browser (Puppeteer) - same TLS as browser WhatsApp Web
 */

import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const botLogger = {
  info: (msg, data = {}) => console.log(`[INFO] ${msg}`, data),
  error: (msg, data = {}) => console.error(`[ERROR] ${msg}`, data),
  warn: (msg, data = {}) => console.warn(`[WARN] ${msg}`, data),
  debug: (msg, data = {}) => console.log(`[DEBUG] ${msg}`, data)
};

// Track if QR has been shown
let qrShown = false;

// WhatsApp Web.js Client
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: path.join(__dirname, 'sessions-browser')
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  }
});

// QR Code event
client.on('qr', async (qr) => {
  if (qrShown) {
    console.log('🔄 QR code refreshed (waiting for scan)...');
    return;
  }
  qrShown = true;

  console.log('\n' + '='.repeat(60));
  console.log('📱 SCAN THIS QR CODE TO LINK WHATSAPP');
  console.log('='.repeat(60) + '\n');

  try {
    const qrCode = await qrcode.toString(qr, { type: 'terminal', small: true });
    console.log(qrCode);
  } catch (err) {
    console.log('QR Code data:', qr);
    console.log('QR Code display failed, but the data is above.');
  }

  console.log('\n' + '='.repeat(60));
  console.log('📱 Open WhatsApp on your phone');
  console.log('   Go to Settings → Linked Devices → Link a Device');
  console.log('   Scan the QR code above');
  console.log('='.repeat(60) + '\n');

  console.log('Waiting for QR scan...\n');
});

// Ready event
client.on('ready', () => {
  botLogger.info('✅ Bot connected successfully!');
  botLogger.info('Bot is now ready to receive messages');

  const info = client.info;
  botLogger.info('Bot info', {
    pushname: info.pushname,
    number: info.wid.user
  });
});

// Authentication failure
client.on('auth_failure', (msg) => {
  botLogger.error('Authentication failed', { error: msg });
});

// Disconnected
client.on('disconnected', (reason) => {
  botLogger.warn('Client disconnected', { reason });

  if (reason === 'TOKEN_REVOKED') {
    botLogger.error('Session revoked. Need to scan QR code again.');
    client.initialize();
  }
});

// Message received
client.on('message', async (message) => {
  try {
    const phoneNumber = message.from.split('@')[0];
    const messageText = message.body;

    botLogger.info('Received message', {
      from: phoneNumber,
      message: messageText.substring(0, 50)
    });

    // Simple echo for testing
    if (messageText.toLowerCase() === 'ping') {
      await message.reply('Pong! 🏓');
    }

    // Help command
    if (messageText.toLowerCase() === '/help' || messageText.toLowerCase() === 'help') {
      await message.reply(
        '🤖 *JOSEPH AI Bot*\n\n' +
        'Available commands:\n' +
        '• /help - Show this help\n' +
        '• ping - Test the bot\n\n' +
        'More features coming soon!'
      );
    }

  } catch (error) {
    botLogger.error('Message handling failed', {
      error: error.message
    });
  }
});

// Start the bot
console.log('Starting JOSEPH AI WhatsApp Bot (Browser Mode)...');
client.initialize();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await client.destroy();
  process.exit(0);
});
