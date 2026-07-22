/**
 * WhatsApp Bot using whatsapp-web.js
 * Saves QR code as image file
 */

import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const botLogger = {
  info: (msg, data = {}) => console.log(`[INFO] ${msg}`, data),
  error: (msg, data = {}) => console.error(`[ERROR] ${msg}`, data),
  warn: (msg, data = {}) => console.warn(`[WARN] ${msg}`, data),
  debug: (msg, data = {}) => console.log(`[DEBUG] ${msg}`, data)
};

let qrShown = false;

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: path.join(__dirname, 'sessions-browser')
  }),
  puppeteer: {
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-default-apps',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding'
    ]
  }
});

client.on('qr', async (qr) => {
  if (qrShown) {
    console.log('🔄 QR code refreshed...');
    return;
  }
  qrShown = true;

  console.log('\n' + '='.repeat(60));
  console.log('📱 GENERATING QR CODE...');
  console.log('='.repeat(60) + '\n');

  try {
    // Save as PNG
    const qrPath = path.join(__dirname, 'whatsapp-qr.png');
    await qrcode.toFile(qrPath, qr);
    console.log('✅ QR Code saved to:');
    console.log(`   ${qrPath}\n`);

    // Also save as HTML for easy viewing
    const qrDataUrl = await qrcode.toDataURL(qr);
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>WhatsApp QR Code</title>
    <style>
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: Arial, sans-serif;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
        }
        img {
            margin: 20px 0;
            border: 2px solid #25D366;
            border-radius: 10px;
        }
        .instructions {
            color: #666;
            margin-top: 20px;
            font-size: 14px;
        }
        .refresh {
            margin-top: 20px;
            color: #25D366;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 JOSEPH AI WhatsApp Bot</h1>
        <img src="${qrDataUrl}" alt="QR Code" />
        <div class="instructions">
            <p>Open WhatsApp on your phone</p>
            <p>Settings → Linked Devices → Link a Device</p>
            <p>Scan this QR code</p>
        </div>
        <p class="refresh">Waiting for scan...</p>
    </div>
    <script>
        // Refresh every 30 seconds
        setTimeout(() => location.reload(), 30000);
    </script>
</body>
</html>
    `;

    const htmlPath = path.join(__dirname, 'whatsapp-qr.html');
    fs.writeFileSync(htmlPath, htmlContent);
    console.log('✅ QR Code HTML saved to:');
    console.log(`   ${htmlPath}\n`);

    console.log('='.repeat(60));
    console.log('📱 Open the HTML file in your browser to see the QR code');
    console.log('   Then scan it with your WhatsApp phone app');
    console.log('='.repeat(60) + '\n');

    // Try to open the HTML file automatically (Windows)
    try {
      const { exec } = await import('child_process');
      exec(`start "" "${htmlPath}"`);
      console.log('🌐 Opening QR code in browser...\n');
    } catch (e) {
      console.log('💡 Manually open the HTML file in your browser\n');
    }

  } catch (err) {
    console.error('Failed to generate QR code:', err);
  }

  console.log('Waiting for QR scan...\n');
});

client.on('ready', () => {
  console.log('\n' + '='.repeat(60));
  console.log('✅ Bot connected successfully!');
  console.log('='.repeat(60) + '\n');

  const info = client.info;
  console.log('Bot Number:', info.wid.user);
  console.log('Bot Name:', info.pushname);
  console.log('\nBot is ready to receive messages!\n');

  // Clean up QR files
  try {
    fs.unlinkSync(path.join(__dirname, 'whatsapp-qr.png'));
    fs.unlinkSync(path.join(__dirname, 'whatsapp-qr.html'));
  } catch (e) {
    // Ignore if files don't exist
  }
});

client.on('auth_failure', (msg) => {
  console.error('\n❌ Authentication failed:', msg);
});

client.on('disconnected', (reason) => {
  console.warn('\n⚠️  Bot disconnected:', reason);
  if (reason === 'TOKEN_REVOKED') {
    console.log('Session revoked. Please scan QR again.');
  }
});

// Import JOSEPH handler
import { josephHandler, handleHelp, handleStatus } from './src/handlers/joseph-handler.js';

client.on('message', async (message) => {
  try {
    const phoneNumber = message.from.split('@')[0];
    const messageText = message.body.trim();

    console.log(`\n📩 Message from ${phoneNumber}: ${messageText.substring(0, 50)}`);

    // Handle special commands
    if (messageText.toLowerCase() === 'ping') {
      await message.reply('Pong! 🏓\n\nJOSEPH is online and ready.');
      return;
    }

    if (messageText.toLowerCase() === '/help' || messageText.toLowerCase() === 'help') {
      const helpResponse = await handleHelp(phoneNumber);
      await message.reply(helpResponse.message);
      return;
    }

    if (messageText.toLowerCase() === '/status' || messageText.toLowerCase() === 'status') {
      const statusResponse = handleStatus();
      await message.reply(statusResponse.message);
      return;
    }

    // Handle all other messages with JOSEPH
    const startTime = Date.now();
    const josephResponse = await josephHandler(messageText, phoneNumber);
    const processingTime = Date.now() - startTime;

    console.log(`✅ Response generated in ${processingTime}ms`);
    console.log(`   Intent: ${josephResponse.metadata?.intent || 'unknown'}`);
    console.log(`   Has Data: ${josephResponse.hasData ? 'Yes' : 'No'}`);

    // Send the response
    await message.reply(josephResponse.message);

    // If there are suggestions, send them as a follow-up
    if (josephResponse.suggestions && josephResponse.suggestions.length > 0) {
      const suggestionsText = '\n\n💡 ' + josephResponse.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n');
      await message.reply(suggestionsText);
    }

  } catch (error) {
    console.error('Message error:', error.message);
    console.error(error.stack);

    // Send a graceful error message
    try {
      await message.reply(
        'Look, something went sideways on my end. I\'ll bounce back - try me again in a sec.\n\n' +
        'If this keeps happening, just say "status" to check if I\'m online.'
      );
    } catch (replyError) {
      console.error('Failed to send error reply:', replyError.message);
    }
  }
});

console.log('Starting JOSEPH AI WhatsApp Bot (Browser Mode)...');
console.log('QR code will be saved to file and opened in browser...\n');

client.initialize();

process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await client.destroy();
  process.exit(0);
});
