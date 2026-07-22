# JOSEPH AI WhatsApp Bot - Technical Specification

**Version:** 2.0  
**Date:** July 21, 2026  
**Architecture:** Provider Pattern (Baileys / Meta Cloud API — switchable)  
**Status:** ✅ IMPLEMENTED — Provider architecture active

---

## 📋 Implementation Status Summary

### ✅ Architecture Milestones

| Milestone | Status | Date | Notes |
|-----------|--------|------|-------|
| **Phase 0 — Foundation** | ✅ Complete | Jul 13, 2026 | WhatsApp connection via whatsapp-web.js |
| **Migration to Baileys** | ✅ Complete | Jul 21, 2026 | Replaced whatsapp-web.js with `@whiskeysockets/baileys` |
| **Provider Architecture** | ✅ Complete | Jul 21, 2026 | Abstract provider interface for seamless switching |
| **Meta Cloud API Scaffold** | ✅ Complete | Jul 21, 2026 | Ready to activate — just add Meta credentials |
| **Backend Prisma Migration** | ✅ Complete | Jul 21, 2026 | WhatsApp routes moved from Mongoose to Prisma |

### 🔄 Migration History

| Phase | Framework | Outcome | Reason |
|-------|-----------|---------|--------|
| **v0.1** | `@whiskeysockets/baileys` v6.7.23 | ❌ Error 405 | WhatsApp TLS fingerprinting blocked Node.js |
| **v0.2** | `whatsapp-web.js` v1.34.7 | ✅ Working | Puppeteer provides real browser TLS fingerprint |
| **v1.0** | Provider Architecture (Baileys default) | ✅ Current | Decoupled transport from business logic |
| **v2.0 (future)** | Meta Cloud API | 🔜 Ready | Single `.env` change to activate |

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Bot Purpose & Vision](#bot-purpose--vision)
3. [User Personas](#user-personas)
4. [Bot Architecture](#bot-architecture)
5. [Provider System](#provider-system)
6. [User Connection Model](#user-connection-model)
7. [Core Features](#core-features)
8. [Conversation Flows](#conversation-flows)
9. [Intents & Commands](#intents--commands)
10. [Data Access & Security](#data-access--security)
11. [API Endpoints Required](#api-endpoints-required)
12. [Technical Specifications](#technical-specifications)
13. [Implementation Phases](#implementation-phases)
14. [Success Metrics](#success-metrics)
15. [Troubleshooting Guide](#troubleshooting-guide)

---

## Executive Summary

The JOSEPH AI WhatsApp Bot is an intelligent financial assistant that brings FP&A (Financial Planning & Analysis) insights directly to users' WhatsApp. It serves as a conversational bridge between the user and the JOSEPH AI platform, enabling users to access their financial data, receive insights, and get recommendations without opening the app.

**Key Differentiator:** Unlike generic chatbots, this bot has deep context of the user's business operations, spending habits, goals, and economic environment — allowing it to function as a personal economist.

### What Changed in v2.0

The bot's **transport layer** has been fully decoupled from its **business logic** using a **Provider Pattern**. This means:

- The bot runs on **Baileys** today (free, no Meta Business account needed).
- It can switch to **Meta Cloud API** in production by changing **one `.env` variable**.
- Zero code changes are required to switch providers.
- All message handling, authentication, and feature logic remains identical regardless of provider.

---

## Bot Purpose & Vision

### Primary Purpose
To deliver actionable financial insights and facilitate natural language interaction with the user's FP&A data through WhatsApp.

### Vision Statement
> "Every micro-merchant deserves a personal economist in their pocket. One that understands their business, tracks their progress, and proactively guides them toward financial health — all without leaving WhatsApp."

### Core Value Propositions
1. **Accessibility:** No need to open the app — insights come to you
2. **Proactivity:** Bot initiates conversations with timely alerts
3. **Context-Aware:** Understands user's business, habits, and goals
4. **Action-Oriented:** Doesn't just inform — guides toward action
5. **Economic Intelligence:** Incorporates macroeconomic context into recommendations

---

## User Personas

### Primary Persona: "Chinedu the Studentpreneur"
- **Age:** 22-28
- **Occupation:** University student running a small business (snacks, cosmetics, reselling)
- **Tech Comfort:** Medium — uses WhatsApp daily, basic app usage
- **Financial Literacy:** Low-Medium — understands revenue/profit but not advanced metrics
- **Pain Points:**
  - Forgets to track expenses
  - Doesn't know true margins
  - Struggles with credit collection
  - Makes pricing decisions based on gut feel
  - Misses economic trends affecting business

### Secondary Persona: "Fatima the Micro-Merchant"
- **Age:** 30-45
- **Occupation:** Small shop owner, food vendor, or trader
- **Tech Comfort:** Low-Medium — WhatsApp is primary digital tool
- **Financial Literacy:** Low — tracks cash flow intuitively
- **Pain Points:**
  - No formal bookkeeping
  - Cash flow volatility
  - Inventory mismanagement
  - No visibility into business health

---

## Bot Architecture

### v2.0 Architecture — Provider Pattern

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        WHATSAPP PLATFORM                                 │
│                                                                          │
│   ┌───────────────────────────────────────────────────────────────────┐  │
│   │                      USER'S WHATSAPP                              │  │
│   └───────────────────────────────────────────────────────────────────┘  │
│                                   ↑                                      │
│                                   │ Messages                             │
│                                   ↓                                      │
│ ┌─────────────────────────────────────────────────────────────────────┐  │
│ │                    PROVIDER LAYER  (.env toggle)                     │  │
│ │                                                                     │  │
│ │  ┌──────────────────────┐    OR    ┌──────────────────────────┐    │  │
│ │  │  BaileysProvider     │          │  MetaProvider             │    │  │
│ │  │  (Development)       │          │  (Production)             │    │  │
│ │  │                      │          │                            │    │  │
│ │  │  - QR code linking   │          │  - Webhook inbound model  │    │  │
│ │  │  - WhatsApp Web      │          │  - Meta REST API outbound │    │  │
│ │  │    protocol           │          │  - No QR needed           │    │  │
│ │  │  - Session files     │          │  - No session files       │    │  │
│ │  │  - Reconnect logic   │          │  - express webhook server │    │  │
│ │  └──────────────────────┘          └──────────────────────────┘    │  │
│ │                    ↑ implements                                      │  │
│ │              ┌───────────────────┐                                   │  │
│ │              │  BaseProvider     │  (Abstract Interface)             │  │
│ │              │  - connect()      │                                   │  │
│ │              │  - disconnect()   │                                   │  │
│ │              │  - sendMessage()  │                                   │  │
│ │              │  - sendTyping()   │                                   │  │
│ │              │  - onMessage()    │                                   │  │
│ │              └───────────────────┘                                   │  │
│ └─────────────────────────────────────────────────────────────────────┘  │
│                                   │                                      │
│                    Normalised events (phoneNumber, text, meta)            │
│                                   ↓                                      │
│ ┌─────────────────────────────────────────────────────────────────────┐  │
│ │                   BOT CORE  (Provider-Agnostic)                     │  │
│ │                                                                     │  │
│ │  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐   │  │
│ │  │  Message Handler  │  │  Auth Handler    │  │  Rate Limiter  │   │  │
│ │  │  - Intent detect  │  │  - OTP flow      │  │  - Per-user    │   │  │
│ │  │  - State machine  │  │  - Session store  │  │    throttle    │   │  │
│ │  │  - Route to       │  │  - Phone verify   │  │                │   │  │
│ │  │    handler        │  │                    │  │                │   │  │
│ │  └──────────────────┘  └──────────────────┘  └────────────────┘   │  │
│ │                                                                     │  │
│ │  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐   │  │
│ │  │  Finance Handler  │  │  Strategy Handler│  │  Dream Handler │   │  │
│ │  │  - Balance        │  │  - Pricing        │  │  - Economic    │   │  │
│ │  │  - Budget         │  │  - Goals          │  │  - News        │   │  │
│ │  │  - Runway         │  │  - Suppliers      │  │  - Indicators  │   │  │
│ │  │  - Credits        │  │  - Products       │  │  - Stress Test │   │  │
│ │  └──────────────────┘  └──────────────────┘  └────────────────┘   │  │
│ │                                                                     │  │
│ │  ┌──────────────────┐                                               │  │
│ │  │ Interpretation   │                                               │  │
│ │  │  - Insights       │                                               │  │
│ │  │  - Alerts         │                                               │  │
│ │  │  - Recommendations│                                               │  │
│ │  └──────────────────┘                                               │  │
│ └─────────────────────────────────────────────────────────────────────┘  │
│                                   │                                      │
│                                   │ API Calls                            │
│                                   ↓                                      │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                      JOSEPH AI BACKEND API                               │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  Finance     │  │  Strategy    │  │  Dream        │  │  Auth       │ │
│  │  Module      │  │  Module      │  │  Module      │  │  Module     │ │
│  │              │  │              │  │              │  │             │ │
│  │ - Budget     │  │ - Pricing    │  │ - Economic   │  │ - User      │ │
│  │ - Ledgers    │  │ - Products   │  │   Indicators │  │   Identity  │ │
│  │ - Burn Rate  │  │ - Suppliers  │  │ - News       │  │ - Sessions  │ │
│  │ - Credits    │  │ - Goals      │  │ - Events     │  │ - Phone     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                    DATABASE (Prisma — SQLite / PostgreSQL)          │  │
│  │  - Users, Ledgers, Transactions, Goals, Products, etc.              │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

### Project Structure (v2.0)

```
whatsapp-bot/
├── src/
│   ├── index.js                    # ✅ Main entry point (provider-agnostic)
│   ├── config/
│   │   └── index.js                # Configuration loader (no provider deps)
│   ├── providers/
│   │   ├── base-provider.js        # ✅ Abstract interface (connect, send, etc.)
│   │   ├── baileys-provider.js     # ✅ Baileys implementation (development)
│   │   ├── meta-provider.js        # ✅ Meta Cloud API implementation (production)
│   │   └── index.js                # ✅ Provider Factory — reads .env to pick provider
│   ├── handlers/
│   │   ├── auth-handler.js         # Authentication & OTP flow
│   │   ├── message-handler.js      # Intent detection & routing
│   │   ├── finance-handler.js      # Balance, budget, runway, credits
│   │   ├── strategy-handler.js     # Pricing, goals, suppliers, products
│   │   ├── dream-handler.js        # Economic indicators, news, stress tests
│   │   └── interpretation-handler.js # Insights, alerts, recommendations
│   ├── utils/
│   │   ├── api-client.js           # Backend API client (axios)
│   │   └── logger.js               # Structured logging utility
│   ├── core/                       # Core business logic modules
│   └── data/                       # Data access and models
├── browser-bot-qr.js               # Legacy v0.2 entry (whatsapp-web.js — deprecated)
├── check-status.js                 # Diagnostic: check connection status
├── test-connection.js              # Diagnostic: test connection
├── sessions/                       # Baileys session storage (gitignored)
├── sessions-browser/               # Legacy whatsapp-web.js sessions (gitignored)
├── .env                            # Environment config (gitignored)
├── .env.example                    # Environment template
├── package.json                    # Dependencies
├── SETUP_GUIDE.md                  # Setup instructions
└── README.md                       # Documentation
```

---

## Provider System

### Overview

The Provider System is the core architectural decision in v2.0. It decouples **how** messages are sent/received (the transport) from **what** the bot does with them (the business logic).

### How It Works

```
.env file:
  WHATSAPP_PROVIDER=baileys   ← Change this to switch providers
                    OR
  WHATSAPP_PROVIDER=meta

            ↓

Provider Factory (src/providers/index.js):
  Reads WHATSAPP_PROVIDER → Instantiates the correct class

            ↓

Bot Core (src/index.js):
  Calls provider.connect()
  Registers provider.onMessage(callback)
  Uses provider.sendMessage(to, text) to reply
  
  ↑ ZERO code changes needed. Same interface regardless of provider.
```

### BaseProvider Interface

Every provider **must** implement these methods:

| Method | Signature | Description |
|--------|-----------|-------------|
| `connect()` | `async connect()` | Establish connection to WhatsApp |
| `disconnect()` | `async disconnect()` | Gracefully shut down |
| `sendMessage()` | `async sendMessage(to, text, options)` | Send a text message |
| `sendTyping()` | `async sendTyping(to)` | Show typing indicator (best-effort) |
| `onMessage()` | `onMessage(callback)` | Register the incoming message handler |

The callback registered via `onMessage` always receives normalised arguments:
```javascript
callback(phoneNumber: string, text: string, meta: object)
```

### Provider: Baileys (Development)

| Property | Detail |
|----------|--------|
| **Library** | `@whiskeysockets/baileys` |
| **Connection Model** | Outbound — connects to WhatsApp Web servers via WebSocket |
| **Authentication** | QR code scan (links a phone number) |
| **Session Storage** | Local files in `sessions/` directory |
| **Reconnect** | Exponential backoff, max 5 attempts |
| **Typing Indicator** | ✅ Supported via presence update |
| **Cost** | Free |
| **Requirements** | A phone number with WhatsApp installed |

### Provider: Meta Cloud API (Production)

| Property | Detail |
|----------|--------|
| **API** | Meta Graph API v19.0 |
| **Connection Model** | Inbound — Meta POSTs to your webhook |
| **Authentication** | Meta Business account + Access Token |
| **Session Storage** | None (stateless — token-based) |
| **Reconnect** | Not applicable (webhook model) |
| **Typing Indicator** | ❌ Not supported for standard messages |
| **Cost** | Pay-per-message after free tier |
| **Requirements** | Meta Business account, verified phone number, webhook URL |

### Switching Providers

To switch from Baileys to Meta Cloud API:

1. **Get Meta credentials** from [developers.facebook.com](https://developers.facebook.com)
2. **Update `.env`:**
   ```env
   WHATSAPP_PROVIDER=meta
   META_ACCESS_TOKEN=your_permanent_token
   META_PHONE_NUMBER_ID=your_phone_number_id
   META_WEBHOOK_VERIFY_TOKEN=choose_any_secret_string
   META_WEBHOOK_PORT=4001
   ```
3. **Expose your webhook** — Meta needs to reach `POST /webhook` on your server:
   - Development: Use ngrok → `ngrok http 4001`
   - Production: Deploy behind a reverse proxy with HTTPS
4. **Restart the bot** — `npm start`

No code changes. No handler rewrites. The bot behaves identically.

---

## User Connection Model

### How Each User Gets Their Own "Unique Bot"

The JOSEPH AI bot operates on a **single-bot, multi-user session** model. There is one bot instance running, but each user gets a completely isolated, personalised experience:

```
┌──────────────────────────────────────────────────────────┐
│                   SINGLE BOT INSTANCE                     │
│                  (One WhatsApp number)                     │
│                                                           │
│   userSessions Map (in-memory):                           │
│   ┌─────────────────────────────────────────────────┐    │
│   │  "+2348012345678" → { userId, name, prefs... }   │    │
│   │  "+2349087654321" → { userId, name, prefs... }   │    │
│   │  "+2347012345678" → { userId, name, prefs... }   │    │
│   └─────────────────────────────────────────────────┘    │
│                                                           │
│   conversationStates Map (in-memory):                     │
│   ┌─────────────────────────────────────────────────┐    │
│   │  "+2348012345678" → { state: "idle" }            │    │
│   │  "+2349087654321" → { state: "awaiting_otp" }    │    │
│   │  "+2347012345678" → { state: "setting_budget" }  │    │
│   └─────────────────────────────────────────────────┘    │
│                                                           │
│   Each user's data is fetched from the backend API        │
│   using their linked userId, so every response is         │
│   personalised to THEIR business data.                    │
└──────────────────────────────────────────────────────────┘
```

### User Onboarding Flow (Common Entry Point)

Every user connects to the bot through the **same WhatsApp number** (the bot's number). The flow is:

```
User                          Bot                          Backend API
 │                             │                              │
 │  Messages "Hi" to bot       │                              │
 │  number on WhatsApp ───────►│                              │
 │                             │ Welcome! What's your         │
 │  ◄──────────────────────────│ JOSEPH AI phone number?      │
 │                             │                              │
 │  Sends "+234 801 234 5678" ─►│                              │
 │                             │── getUserByPhone() ─────────►│
 │                             │◄───── user record ───────────│
 │                             │── sendOTP() ─────────────────►│
 │                             │◄───── OTP sent ──────────────│
 │  ◄──────────────────────────│ OTP sent! Enter code.        │
 │                             │                              │
 │  Sends "123456" ────────────►│                              │
 │                             │── verifyOTP() ───────────────►│
 │                             │◄───── verified ──────────────│
 │                             │                              │
 │  ◄──────────────────────────│ ✅ Welcome back, Chinedu!     │
 │                             │ Session created. Ready.       │
 │                             │                              │
 │  "What's my balance?" ─────►│                              │
 │                             │── getBalance(userId) ────────►│
 │                             │◄───── balance data ──────────│
 │  ◄──────────────────────────│ 💰 Your balance is ₦45,000   │
```

### What Makes Each User's Experience "Unique"

| Aspect | How It Works |
|--------|-------------|
| **Identity** | Phone number → maps to `userId` in backend via OTP verification |
| **Session** | `userSessions` Map keyed by phone number — stores `userId`, `name`, `preferences` |
| **Conversation State** | `conversationStates` Map — tracks where each user is in a multi-step flow |
| **Data** | All API calls include the user's `userId` — backend returns only that user's data |
| **Preferences** | Stored in session — language, notification frequency, etc. |
| **Rate Limiting** | Per-phone-number rate limiter — independent for each user |

### Important: "Unique Bot" ≠ Separate Instances

The bot does **not** spin up a separate process or container per user. Instead:
- **One bot process** serves all users through one WhatsApp number.
- **Isolation** is achieved through per-user Maps (`userSessions`, `conversationStates`) and per-user API calls to the backend.
- This is the standard pattern used by all major WhatsApp bots (e.g., banking bots, customer service bots).

### Future Enhancement: Multi-Instance / Multi-Number

If the system scales to a point where one number isn't sufficient (WhatsApp rate limits), the architecture supports horizontal scaling:
- Run multiple bot instances, each with a different phone number.
- Use a load balancer or routing layer to distribute users across instances.
- The Provider Pattern makes this easy — each instance just connects with different credentials.

---

## Core Features

### Currently Implemented ✅

#### 1. Provider-Agnostic Bot Core
- **Entry point** (`src/index.js`) imports zero provider-specific code
- Factory pattern selects provider at startup based on `.env`
- Rate limiting, message routing, and all handlers are fully shared

#### 2. Baileys Provider (Active)
- QR code generation with terminal display
- Session persistence across restarts in `sessions/`
- Auto-reconnect with exponential backoff (max 5 attempts)
- Graceful shutdown on SIGTERM/SIGINT

#### 3. Meta Cloud API Provider (Scaffold — Ready to Activate)
- Express webhook server for inbound messages
- Webhook verification handshake (GET `/webhook`)
- Message sending via Meta Graph API v19.0
- Credential validation with clear error messages

#### 4. Authentication System
- Phone-based OTP verification flow
- In-memory session store (`userSessions` Map)
- Conversation state machine for multi-step flows
- Phone number normalization (Nigerian format default)

#### 5. Message Handler & Intent Detection
- Regex-based intent detection (13 intent patterns)
- Conversation state machine for multi-step interactions
- Routing to domain-specific handlers (Finance, Strategy, Dream, Interpretation)

### Planned Features (Handlers Ready)

#### 6. Financial Status Check
**Supported Queries:**
- "How's my business?" / "What's my balance?" / "Am I on track?"

#### 7. Budget Tracking
**Feature:** Real-time budget monitoring and alerts

#### 8. Business Analytics
**Feature:** Deep dive into business performance

#### 9. Credit Management
**Feature:** Track and collect overdue payments

#### 10. Goals Tracking
**Feature:** Monitor and update financial goals

#### 11. Economic Intelligence
**Feature:** Relevant economic updates and impact analysis

#### 12. Proactive Alerts
**Feature:** Bot initiates conversations with timely notifications

#### 13. Insights & Recommendations
**Feature:** AI-powered insights based on user data

---

## Intents & Commands

### Intent Detection System

The message handler uses regex patterns to detect user intent:

| Intent | Pattern | Example Messages |
|--------|---------|-----------------|
| `hello` | `/^(hi\|hello\|hey\|start\|begin\|ola)/i` | "Hi", "Hello", "Start" |
| `authenticate` | `/^(login\|sign\s*in\|verify\|auth)/i` | "Login", "Verify" |
| `verify_otp` | `/^\d{4,6}$/` | "123456" |
| `balance` | `/^(balance\|bal\|account\|my\s*money\|wallet)/i` | "Balance", "My money" |
| `budget` | `/^(budget\|spending\|expense\|allocation)/i` | "Budget", "Spending" |
| `runway` | `/^(runway\|burn\s*rate\|days\s*left\|survival)/i` | "Runway", "Burn rate" |
| `credits` | `/^(credit\|debt\|owed\|receivables)/i` | "Credits", "Owed" |
| `pricing` | `/^(price\|pricing\|margin\|cost)/i` | "Pricing", "Margins" |
| `goals` | `/^(goal\|target\|milestone\|objective)/i` | "Goals", "Targets" |
| `economic` | `/^(economic\|market\|inflation\|fx\|rate)/i` | "Economic", "Inflation" |
| `news` | `/^(news\|update\|headline)/i` | "News", "Updates" |
| `insights` | `/^(insight\|advice\|recommend\|analysis)/i` | "Insights", "Advice" |
| `help` | `/^(help\|\?\|commands\|what\s*can\s*you\s*do)/i` | "Help", "?" |

### Command Reference

```
📚 JOSEPH AI Bot Commands

🏠 Account
├─ /start     - Get started
├─ /login     - Verify your account
└─ /settings  - Update preferences

💰 Finance
├─ /balance   - Check your balance
├─ /budget    - View budget breakdown
├─ /runway    - Cash runway analysis
└─ /credits   - Credit sales status

🎯 Strategy
├─ /pricing   - Pricing overview
├─ /goals     - Goal progress
└─ /suppliers - Supplier info

📊 Dream (Economic)
├─ /economic  - Economic indicators
├─ /news      - Latest economic news
└─ /stress    - Stress test

💡 Interpretation
├─ /insights   - Your insights
├─ /alerts     - Actionable alerts
└─ /recommend  - Recommendations
```

---

## Technical Specifications

### Technology Stack

| Component | Library | Version | Purpose |
|-----------|---------|---------|---------|
| **WhatsApp (Dev)** | @whiskeysockets/baileys | latest | Baileys provider |
| **WhatsApp (Prod)** | Meta Cloud API | v19.0 | Meta provider |
| **Error Handling** | @hapi/boom | latest | Baileys disconnect reason codes |
| **QR Code** | qrcode | 1.5.4 | Terminal QR display for Baileys |
| **HTTP Client** | axios | 1.18.1 | Backend & Meta API communication |
| **Webhook Server** | express | latest | Meta webhook endpoint |
| **Logging** | pino | latest | Structured logging (silent for Baileys internals) |
| **Environment** | dotenv | 16.6.1 | Config management |
| **Runtime** | Node.js | 18+ | ES Modules, async/await |

### Environment Variables

```env
# ═══════════════════════════════════════════════
# PROVIDER SELECTION (change this ONE line to switch)
# ═══════════════════════════════════════════════
WHATSAPP_PROVIDER=baileys          # Options: "baileys" | "meta"

# ═══════════════════════════════════════════════
# META CLOUD API CREDENTIALS (only needed if WHATSAPP_PROVIDER=meta)
# ═══════════════════════════════════════════════
META_ACCESS_TOKEN=                 # Permanent token from Meta Business
META_PHONE_NUMBER_ID=              # Phone Number ID from Meta dashboard
META_WEBHOOK_VERIFY_TOKEN=joseph-ai-webhook  # Any secret string for webhook handshake
META_WEBHOOK_PORT=4001             # Port for the webhook server

# ═══════════════════════════════════════════════
# BOT CONFIGURATION
# ═══════════════════════════════════════════════
BOT_NAME=JOSEPH AI
BOT_PHONE_NUMBER=

# Backend API
BACKEND_API_URL=http://localhost:4000/api
BACKEND_API_KEY=
BACKEND_TIMEOUT=30000

# Session Management (Baileys only)
SESSIONS_DIR=./sessions
SESSION_ID=joseph-ai-bot

# Bot Behavior
AUTO_READ=false
AUTO_TYPING=true
MESSAGE_DELAY_MS=1000

# Rate Limiting
MAX_MESSAGES_PER_MINUTE=20
GROUPS_ENABLED=false

# Feature Flags
ENABLE_DREAM_MODULE=true
ENABLE_STRATEGY_MODULE=true
ENABLE_FINANCE_MODULE=true
ENABLE_INTERPRETATION_MODULE=true

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/bot.log

# Security
ALLOWED_NUMBERS=*
ADMIN_NUMBERS=
```

---

## Implementation Phases

### ✅ Phase 0: Foundation (COMPLETED July 13, 2026)
**Goal:** Establish working WhatsApp connection

- [x] Set up whatsapp-web.js project structure
- [x] Configure headless Chrome connection
- [x] Implement QR code generation
- [x] Create session management
- [x] Build basic message handler
- [x] Implement `ping` and `help` commands
- [x] Test connection with real WhatsApp

### ✅ Phase 0.5: Provider Architecture (COMPLETED July 21, 2026)
**Goal:** Decouple transport from business logic for production readiness

- [x] Design `BaseProvider` abstract interface
- [x] Implement `BaileysProvider` with full lifecycle (connect, reconnect, QR, send)
- [x] Implement `MetaProvider` scaffold (webhook server, API send, credential validation)
- [x] Build `ProviderFactory` with `.env` toggle
- [x] Rewrite `src/index.js` to be fully provider-agnostic
- [x] Decouple `config/index.js` from any provider-specific imports
- [x] Migrate backend `whatsapp.js` routes from Mongoose to Prisma
- [x] Update documentation

**Deliverables:**
- ✅ Seamless `baileys` ↔ `meta` switching via `.env`
- ✅ Zero code changes required to switch providers
- ✅ Meta provider ready to activate with credentials

### 🔄 Phase 1: Authentication (IN PROGRESS)
**Goal:** Implement phone-based authentication

- [x] Implement phone verification flow (handler ready)
- [x] Create OTP system (handler ready)
- [x] Build conversation state machine
- [ ] Connect to backend Auth API (end-to-end)
- [ ] Test authentication end-to-end

### 📋 Phase 2: Core Features (PLANNED)
**Goal:** Add all query handlers

- [ ] Implement finance handler (balance, budget, runway, credits)
- [ ] Implement strategy handler (pricing, goals, suppliers)
- [ ] Implement dream handler (economic, news, indicators)
- [ ] Implement interpretation handler (insights, alerts, recommendations)
- [ ] Add NLP intent recognition improvements
- [ ] Build response templates

### 📋 Phase 3: Actions & Transactions (PLANNED)
**Goal:** Enable user actions via chat

- [ ] Implement transaction logging
- [ ] Implement reminder creation
- [ ] Implement credit status updates
- [ ] Implement goal creation
- [ ] Add confirmation flows
- [ ] Add undo functionality

### 📋 Phase 4: Proactive Features (PLANNED)
**Goal:** Bot initiates conversations

- [ ] Implement daily/weekly summaries
- [ ] Implement budget alerts
- [ ] Implement credit reminders
- [ ] Implement inventory alerts
- [ ] Implement goal progress updates
- [ ] Implement scheduling system

### 📋 Phase 5: Intelligence Layer (PLANNED)
**Goal:** Add AI-powered insights

- [ ] Connect to Interpretation API
- [ ] Implement insights handler
- [ ] Add recommendation engine
- [ ] Implement contextual suggestions
- [ ] Add trend analysis
- [ ] Implement predictive alerts

---

## Troubleshooting Guide

### Provider-Specific Issues

#### Baileys Provider

**Problem:** QR code not appearing
```
Solution:
1. Check that WHATSAPP_PROVIDER=baileys in .env
2. Delete the sessions/ folder
3. Restart with: node src/index.js
4. QR code prints directly to terminal
```

**Problem:** Connection error 405 (WhatsApp TLS rejection)
```
Cause: WhatsApp detects non-browser TLS fingerprint
Note: This was a historical issue with earlier Baileys versions.
Current Baileys config uses Browsers.ubuntu('Chrome') to mitigate.
If this recurs, consider switching to Meta provider.
```

**Problem:** Frequent disconnections
```
Solution:
1. The bot auto-reconnects (max 5 attempts with backoff)
2. If all attempts fail, delete sessions/ and restart
3. Check internet stability (especially on satellite/Starlink)
```

#### Meta Provider

**Problem:** Webhook verification fails
```
Solution:
1. Ensure META_WEBHOOK_VERIFY_TOKEN in .env matches the token
   you entered in the Meta App dashboard
2. Ensure your webhook URL is accessible from the internet
3. Check that META_WEBHOOK_PORT is not blocked by firewall
```

**Problem:** Messages not being received
```
Solution:
1. Verify webhook URL is configured in Meta App dashboard
2. Check that the webhook server is running (port 4001 by default)
3. Confirm META_ACCESS_TOKEN has not expired
4. Check Meta App dashboard for delivery errors
```

**Problem:** "Meta Cloud API provider is missing required environment variables"
```
Solution:
1. Set META_ACCESS_TOKEN in .env
2. Set META_PHONE_NUMBER_ID in .env
3. Get these from: https://developers.facebook.com → Your App → WhatsApp
```

### General Issues

**Problem:** Bot starts but doesn't respond to messages
```
Solution:
1. Check LOG_LEVEL=debug in .env for verbose output
2. Verify the user is sending to the correct bot number
3. Check ALLOWED_NUMBERS setting (use * for all)
4. Verify the message handler callback is registered
```

**Problem:** Rate limit errors
```
Solution:
1. Increase MAX_MESSAGES_PER_MINUTE in .env
2. Default is 20 messages per minute per user
```

### Diagnostic Tools

```bash
# Check connection status
node check-status.js

# Test connection
node test-connection.js

# View Baileys session data
ls -la sessions/

# Start the bot (v2.0 entry point)
node src/index.js

# Legacy entry point (whatsapp-web.js — deprecated)
node browser-bot-qr.js
```

---

## Success Metrics

### Technical Metrics

| Metric | Target | Current |
|--------|--------|---------|
| **Uptime** | >99.5% | TBD |
| **Error Rate** | <1% | 0% (basic commands) |
| **Connection Success** | 100% | ✅ 100% (Baileys) |
| **Provider Switch Time** | <1 minute | ✅ ~30 seconds (env change + restart) |
| **Message Response** | <2 seconds | ✅ <1 second |
| **Reconnect Success** | >95% | ✅ Auto-reconnect with backoff |

### Engagement Metrics (Target)

- **Daily Active Users:** 500+ by Month 3
- **Messages per User/Day:** 3-5 interactions
- **Session Duration:** 2-3 minutes average

### Business Impact Metrics (Target)

- **Credit Collection Improvement:** +25% recovery rate
- **Budget Adherence:** +15% improvement
- **Goal Achievement:** +20% more goals met
- **User Retention:** >60% after 3 months

---

## Quick Reference

### Key Files

| File | Purpose | Status |
|------|---------|--------|
| `src/index.js` | Main entry point (provider-agnostic) | ✅ ACTIVE |
| `src/providers/base-provider.js` | Abstract provider interface | ✅ ACTIVE |
| `src/providers/baileys-provider.js` | Baileys implementation | ✅ ACTIVE |
| `src/providers/meta-provider.js` | Meta Cloud API implementation | ✅ READY |
| `src/providers/index.js` | Provider Factory | ✅ ACTIVE |
| `src/handlers/message-handler.js` | Intent detection & routing | ✅ ACTIVE |
| `src/handlers/auth-handler.js` | OTP authentication flow | ✅ ACTIVE |
| `.env` | Configuration (provider toggle here) | ✅ ACTIVE |
| `browser-bot-qr.js` | Legacy whatsapp-web.js entry | ⚠️ DEPRECATED |

### Current Status

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Bot Status:        ✅ ACTIVE
Architecture:      Provider Pattern v2.0
Active Provider:   Baileys (development)
Ready Providers:   Baileys, Meta Cloud API
Entry Point:       src/index.js
Provider Toggle:   WHATSAPP_PROVIDER in .env
Last Updated:      July 21, 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Appendix: Implementation History

### July 13, 2026 - Initial Implementation (v0.2)

**Network Context:**
- User Internet: Starlink (satellite) + TP-Link router
- WhatsApp Web in browser: Working
- Initial Baileys implementation: Failed with error 405

**Root Cause Analysis:**
- WhatsApp's TLS fingerprinting detected Node.js connections
- Browser TLS handshake accepted, direct Node.js rejected

**Solution:**
- Migrated from `@whiskeysockets/baileys` to `whatsapp-web.js`
- Used Puppeteer with headless Chrome for real browser TLS

### July 21, 2026 - Provider Architecture (v2.0)

**Motivation:**
- User requested ability to switch from Baileys to official Meta API seamlessly
- Need for production-ready architecture without vendor lock-in

**Changes:**
1. Created `BaseProvider` abstract interface with `connect()`, `disconnect()`, `sendMessage()`, `sendTyping()`, `onMessage()`
2. Implemented `BaileysProvider` — wraps `@whiskeysockets/baileys` with QR code, reconnect, and session management
3. Implemented `MetaProvider` — Express webhook server + Meta Graph API v19.0 for message sending
4. Built `ProviderFactory` — reads `WHATSAPP_PROVIDER` from `.env` and instantiates the correct class
5. Rewrote `src/index.js` — zero provider-specific imports; all logic flows through the `BaseProvider` interface
6. Decoupled `config/index.js` — removed any Baileys-specific imports that would crash when using Meta
7. Migrated backend WhatsApp routes from Mongoose to Prisma

**Result:**
- ✅ Single `.env` variable toggles between Baileys and Meta
- ✅ All handlers, auth, rate limiting, and business logic are shared
- ✅ Meta provider ready to activate when Meta Business account is obtained

---

**Document Owner:** JOSEPH AI Development Team  
**Last Updated:** July 21, 2026  
**Next Review:** August 1, 2026
