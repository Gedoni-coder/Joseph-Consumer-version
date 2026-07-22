# JOSEPH AI WhatsApp Bot - Quick Setup Guide

## ⚡ Quick Start (3 Steps)

### 1️⃣ Start the Bot
```bash
cd C:\Users\HP\Desktop\JOSEPHAIFAMILY\whatsapp-bot
node browser-bot-qr.js
```

### 2️⃣ Scan QR Code
- QR code opens in browser automatically
- Or open `whatsapp-qr.html` manually
- Scan with WhatsApp: Settings → Linked Devices → Link a Device

### 3️⃣ Test It
Send "ping" to your WhatsApp number (2347073735341)
Should reply: "Pong! 🏓"

---

## 📋 Current Status

| Component | Status |
|-----------|--------|
| Bot Connection | ✅ Connected (2347073735341) |
| Library | whatsapp-web.js v1.34.7 |
| Working Commands | `ping`, `help` |
| Session | Saved in `sessions-browser/` |

---

## 🔄 Daily Usage

### Start Bot
```bash
node browser-bot-qr.js
```

### Check Status
```bash
node check-status.js
```

### Stop Bot
Press `Ctrl+C` in the terminal

---

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| Bot won't connect | Delete `sessions-browser` folder, restart |
| QR code not showing | Opens in browser automatically |
| Connection error 405 | Use `browser-bot-qr.js`, NOT `npm start` |

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `browser-bot-qr.js` | Main bot - use this |
| `check-status.js` | Check connection status |
| `.env` | Configuration settings |
| `README.md` | Full documentation |

---

## 🆘 Need Help?

1. Check `README.md` for detailed docs
2. Run `node check-status.js` to diagnose
3. Look for error messages in terminal

---

*JOSEPH AI WhatsApp Bot v1.0.0*
*Working since July 13, 2026*
