# JOSEPH AI WhatsApp Bot

WhatsApp bot for JOSEPH AI - bringing financial intelligence to your WhatsApp.

## 📚 Table of Contents

- [Setup History](#setup-history)
- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Configuration](#-configuration)
- [Bot Commands](#-bot-commands)
- [Backend Integration](#-backend-integration)
- [Troubleshooting](#-troubleshooting)
- [Development](#-development)

---

## 📖 Setup History

### Initial Implementation Attempt

The bot was initially built using **@whiskeysockets/baileys** (v6.7.23), a lightweight WhatsApp Web API library.

**Issues Encountered:**
- **Connection Error 405**: WhatsApp servers consistently rejected connections with `CB:failure` event
- **Root Cause**: WhatsApp's TLS fingerprinting detected the difference between:
  - Real browser TLS handshake (which works)
  - Node.js TLS handshake (which was being blocked)

**Network Context:**
- User connection: **Starlink (satellite internet)** + **TP-Link router**
- WhatsApp Web in browser worked fine
- Baileys library connections were rejected

### Solution: Browser-Based Bot

**Switched to whatsapp-web.js** (v1.34.7) which uses:
- **Puppeteer** to run a real headless Chrome browser
- Same TLS fingerprint as browser WhatsApp Web
- Successfully bypasses WhatsApp's security checks

**Migration Details:**
- Date: July 13, 2026
- Old approach: Baileys with direct WebSocket connection
- New approach: whatsapp-web.js with headless Chrome
- Result: ✅ Successfully connected and tested

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ (currently running on v24.14.0)
- **WhatsApp account** (to link the bot)
- **JOSEPH AI backend** running (optional for basic commands)

### Installation

1. **Install dependencies:**
   ```bash
   cd whatsapp-bot
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` with your settings:**
   ```env
   BOT_NAME=JOSEPH AI
   BACKEND_API_URL=http://localhost:4000/api
   SESSIONS_DIR=./sessions
   ```

### Running the Bot

**Option 1: Full Bot (Recommended)**
```bash
node browser-bot-qr.js
```

**Option 2: Check Connection Status**
```bash
node check-status.js
```

**Option 3: Using npm scripts**
```bash
npm start          # Run original Baileys bot (has connection issues)
```

### First-Time Setup

1. **Start the bot:**
   ```bash
   node browser-bot-qr.js
   ```

2. **QR Code will appear:**
   - Saved as `whatsapp-qr.html` and opened in browser
   - Also saved as `whatsapp-qr.png`

3. **Link your WhatsApp:**
   - Open WhatsApp on your phone
   - Go to **Settings** → **Linked Devices** → **Link a Device**
   - Scan the QR code

4. **Bot is now ready!** 🎉

---

## 🏗️ Architecture

### Current Setup (whatsapp-web.js)

```
whatsapp-bot/
├── browser-bot-qr.js          # Main bot entry point (✅ ACTIVE)
├── check-status.js            # Connection status checker
├── src/
│   ├── config/
│   │   └── index.js           # Configuration (Baileys - not active)
│   ├── handlers/
│   │   ├── auth-handler.js    # Authentication handler
│   │   ├── message-handler.js # Message processing & routing
│   │   ├── finance-handler.js # Finance module
│   │   ├── strategy-handler.js # Strategy module
│   │   ├── dream-handler.js   # Economic module
│   │   └── interpretation-handler.js # Interpretation module
│   ├── utils/
│   │   ├── api-client.js      # Backend API client
│   │   └── logger.js          # Logging utility
│   └── index.js               # Original Baileys entry (not active)
├── sessions-browser/          # WhatsApp session storage (gitignored)
│   └── session/               # Chrome profile data
├── .env.example               # Environment template
├── .env                       # Environment config (gitignored)
├── package.json               # Dependencies
└── README.md                  # This file
```

### Technology Stack

| Component | Library | Version | Purpose |
|-----------|---------|---------|---------|
| **WhatsApp Client** | whatsapp-web.js | 1.34.7 | Main WhatsApp integration |
| **Browser Automation** | Puppeteer | bundled | Headless Chrome |
| **QR Code Generation** | qrcode | 1.5.4 | QR code for linking |
| **API Client** | axios | 1.18.1 | Backend communication |
| **Environment** | dotenv | 16.6.1 | Config management |

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BOT_NAME` | Display name for the bot | `JOSEPH AI` |
| `BOT_PHONE_NUMBER` | Bot's WhatsApp number | Auto-detected |
| `BACKEND_API_URL` | JOSEPH AI backend API | `http://localhost:4000/api` |
| `BACKEND_API_KEY` | API authentication key | Optional |
| `BACKEND_TIMEOUT` | API request timeout (ms) | `30000` |
| `SESSIONS_DIR` | Session storage directory | `./sessions` |
| `SESSION_ID` | Session identifier | `joseph-ai-bot` |

### Behavior Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `AUTO_READ` | Auto-read incoming messages | `false` |
| `AUTO_TYPING` | Show typing indicator | `true` |
| `MESSAGE_DELAY_MS` | Delay between messages (ms) | `1000` |
| `LOG_LEVEL` | Logging verbosity | `info` |
| `LOG_FILE` | Log file path | `./logs/bot.log` |

### Feature Flags

| Variable | Description | Default |
|----------|-------------|---------|
| `ENABLE_DREAM_MODULE` | Economic module | `true` |
| `ENABLE_STRATEGY_MODULE` | Strategy module | `true` |
| `ENABLE_FINANCE_MODULE` | Finance module | `true` |
| `ENABLE_INTERPRETATION_MODULE` | Interpretation module | `true` |
| `GROUPS_ENABLED` | Support group messages | `false` |

### Security Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `ALLOWED_NUMBERS` | Restrict to specific numbers | `*` (all) |
| `ADMIN_NUMBERS` | Admin phone numbers | Comma-separated list |

---

## 💬 Bot Commands

### Currently Implemented

| Command | Response | Status |
|---------|----------|--------|
| `ping` | Pong! 🏓 JOSEPH AI Bot is running! | ✅ Working |
| `help` or `/help` | Show available commands | ✅ Working |

### Planned Commands (Handlers Ready)

#### Account Management
- `/start` - Get started with the bot
- `/login` - Verify your account
- `/settings` - Update preferences

#### Finance Module
- `/balance` - Check your balance
- `/budget` - View budget breakdown
- `/runway` - Cash runway analysis
- `/credits` - Credit sales status

#### Strategy Module
- `/pricing` - Pricing overview
- `/goals` - Goal progress
- `/suppliers` - Supplier information

#### Economic Module (Dream)
- `/economic` - Economic indicators
- `/news` - Latest economic news
- `/stress` - Stress test scenarios

#### Interpretation Module
- `/insights` - Your insights
- `/alerts` - Actionable alerts
- `/recommend` - Recommendations

---

## 🔌 Backend Integration

### API Endpoints Used

The bot communicates with JOSEPH AI backend through REST API:

#### Authentication
```
POST /api/auth/verify-phone    # Verify user phone number
POST /api/auth/send-otp        # Send OTP code
POST /api/auth/verify-otp      # Verify OTP code
GET  /api/auth/user/phone      # Get user by phone number
```

#### Finance
```
GET /api/finance/ledgers       # Get user ledgers
GET /api/finance/budget        # Get budget breakdown
GET /api/finance/runway        # Get runway analysis
GET /api/finance/credits       # Get credit overview
```

#### Strategy
```
GET /api/strategy/pricing      # Get pricing overview
GET /api/strategy/goals        # Get goals
GET /api/strategy/procurement  # Get procurement info
```

#### Economic (Dream)
```
GET /api/dream/ticker          # Get economic ticker
GET /api/dream/stats           # Get quick stats
GET /api/dream/feed            # Get economic news
```

#### Interpretation
```
GET /api/interpret/insights            # Get insights
GET /api/interpret/insights/actionable # Get actionable insights
```

---

## 🐛 Troubleshooting

### Connection Issues

**Problem: Bot shows "NOT CONNECTED - QR code required"**
- **Solution**: The session may have expired. Delete the `sessions-browser` folder and restart:
  ```bash
  rm -rf sessions-browser
  node browser-bot-qr.js
  ```

**Problem: QR code doesn't display in terminal**
- **Solution**: The bot now saves QR as HTML file that opens in browser automatically

**Problem: "Connection Failure" error (Baileys only)**
- **Cause**: WhatsApp detects non-browser TLS fingerprint
- **Solution**: Use `browser-bot-qr.js` instead of `npm start`

### Network-Specific Issues

**For Starlink/Satellite Internet Users:**
- WhatsApp Web in browser: ✅ Works
- Baileys library: ❌ Blocked (Error 405)
- whatsapp-web.js: ✅ Works (uses real browser)

### Session Issues

**Problem: "TOKEN_REVOKED" error**
- **Cause**: WhatsApp session was revoked (phone number changed, WhatsApp reinstalled, etc.)
- **Solution**: Clear sessions and rescan QR code

**Problem: Bot disconnected frequently**
- **Cause**: Network instability or session corruption
- **Solution**: 
  1. Check internet connection stability
  2. Delete `sessions-browser` folder
  3. Restart bot

### Message Issues

**Problem: Bot receives but doesn't respond**
- **Check**:
  1. Bot process is still running
  2. No rate limit warnings in logs
  3. Backend API is accessible (if using API commands)

**Problem: Commands not recognized**
- **Cause**: Message handler not processing correctly
- **Solution**: Check logs for errors, verify message format

---

## 🛠️ Development

### Project Setup

```bash
# Clone the repository
git clone <repo-url>
cd JOSEPHAIFAMILY/whatsapp-bot

# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Edit .env with your settings
nano .env
```

### Testing

```bash
# Check connection status
node check-status.js

# Test basic functionality
node browser-bot-qr.js
# Then send "ping" to the bot
```

### Bot Management

```bash
# Start bot (background)
node browser-bot-qr.js &

# Check if running
ps aux | grep node

# Stop bot
kill <process-id>
# Or press Ctrl+C if running in foreground
```

### Session Management

```bash
# View session files
ls -la sessions-browser/session/

# Backup session (before making changes)
cp -r sessions-browser sessions-browser.backup

# Clear session (force QR rescan)
rm -rf sessions-browser
```

### Adding New Commands

1. **Create handler function** in appropriate handler file:
   ```javascript
   // In handlers/message-handler.js or create new handler
   export async function handleNewCommand(phoneNumber, params, context) {
     // Your logic here
     return { message: 'Response text' };
   }
   ```

2. **Add command mapping** in `browser-bot-qr.js`:
   ```javascript
   if (messageText.toLowerCase() === '/newcommand') {
     const response = await handleNewCommand(phoneNumber, params, context);
     await message.reply(response.message);
   }
   ```

3. **Test** by sending the command to the bot

### Logging

Logs are written to console with structured formatting:
- `[INFO]` - General information
- `[ERROR]` - Error messages
- `[WARN]` - Warnings
- `[DEBUG]` - Debug information (when LOG_LEVEL=debug)

---

## 📝 License

MIT

---

## 📞 Support

For issues or questions:
- Check this README first
- Review troubleshooting section
- Check bot logs for error messages
- Verify backend API is accessible

---

**JOSEPH AI** - Economic Operating System for Everyone

*Last Updated: July 13, 2026*
*Working Configuration: whatsapp-web.js v1.34.7 with headless Chrome*
