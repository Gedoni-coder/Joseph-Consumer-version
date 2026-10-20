/**
 * Simple WhatsApp Bot Status Checker
 */

import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Checking WhatsApp Bot connection status...\n');

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: path.join(__dirname, 'sessions-browser')
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  }
});

let statusShown = false;

client.on('qr', () => {
  if (!statusShown) {
    statusShown = true;
    console.log('❌ NOT CONNECTED - QR code required');
    console.log('📱 Please scan the QR code to link your WhatsApp\n');
  }
});

client.on('ready', () => {
  console.log('✅ BOT IS CONNECTED!\n');
  console.log('Bot Information:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Name:', client.info.pushname);
  console.log('Number:', client.info.wid.user);
  console.log('Platform:', client.info.platform);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('💡 The bot is ready to receive and send messages!\n');

  setTimeout(() => {
    console.log('Status check complete. Bot is still running...');
    console.log('Press Ctrl+C to stop\n');
  }, 2000);
});

client.on('auth_failure', () => {
  console.log('❌ AUTHENTICATION FAILED');
  console.log('💡 Session may be expired. Try clearing sessions folder.\n');
});

client.on('disconnected', (reason) => {
  console.log('⚠️  BOT DISCONNECTED:', reason);
  if (reason === 'TOKEN_REVOKED') {
    console.log('💡 Session was revoked. Need to scan QR code again.\n');
  }
});

// Initialize
try {
  client.initialize();

  // Timeout check
  setTimeout(() => {
    if (!statusShown && !client.info) {
      console.log('⏳ Still checking connection...');
      console.log('💡 If this takes too long, the bot may need a QR scan.\n');
    }
  }, 10000);
} catch (error) {
  console.error('❌ Error:', error.message);
}

// Graceful exit
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down...');
  await client.destroy();
  process.exit(0);
});

// SR
