/**
 * Diagnostic script to test WhatsApp connection
 */

console.log('Loading modules...');

import makeWASocket from '@whiskeysockets/baileys';
import { useMultiFileAuthState } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import qrcode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';

console.log('Modules loaded successfully');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = pino({ level: 'debug' });

async function testConnection() {
  console.log('Starting WhatsApp connection test...\n');

  const { state, saveCreds } = await useMultiFileAuthState(
    path.join(__dirname, 'sessions')
  );

  const socketConfig = {
    version: [2, 2434, 2129936335],
    browser: ['Chrome (Linux)', '', ''],
    auth: state,
    logger,
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: true
  };

  const sock = makeWASocket(socketConfig);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n' + '='.repeat(60));
      console.log('QR CODE RECEIVED:');
      console.log('='.repeat(60) + '\n');

      try {
        const qrCode = await qrcode.toString(qr, { type: 'terminal', small: true });
        console.log(qrCode);
      } catch (err) {
        console.log('QR Code:', qr);
      }

      console.log('\nScan this with your WhatsApp app\n');
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error instanceof Boom
        ? lastDisconnect.error.output.statusCode
        : 'unknown';

      console.error('\n❌ Connection closed');
      console.error('Status Code:', statusCode);
      console.error('Error:', lastDisconnect?.error?.message);
      console.error('Data:', lastDisconnect?.error?.data);

      if (statusCode === 401) {
        console.log('\n⚠️  Need to scan QR code again');
      } else if (statusCode === 429) {
        console.log('\n⚠️  Rate limited - wait a few minutes');
      } else if (statusCode === 515) {
        console.log('\n⚠️  Multi-device not enabled or account issue');
      }

      process.exit(1);
    }

    if (connection === 'open') {
      console.log('\n✅ Connected successfully!');
      console.log('Bot number:', sock.user.id.split('@')[0]);
      await sock.end();
      process.exit(0);
    }
  });

  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('CB:failure', (node) => {
    console.error('\n❌ Server rejected connection');
    console.error('Reason code:', node.attrs?.reason);
    console.error('Full node:', node);
  });
}

testConnection().catch(console.error);

// SR
