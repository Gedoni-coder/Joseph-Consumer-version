# DREAM MODULE - Database Schema & API Design

## Overview
The Dream module fetches, caches, and serves 85+ economic indicators for Nigeria. Data is sourced from external APIs (Trading Economics, CBN, etc.) and cached locally.

---

## Database Schema

### 1. EconomicIndicators Collection

Stores current and historical values for all 85+ indicators.

```javascript
{
  _id: ObjectId,
  userId: ObjectId,  // Optional: for user-specific overrides
  
  // Indicator Identity
  code: String,      // e.g., "INF", "FX_RATE", "GDP_GROWTH", "UNEMPLOYMENT"
  category: String,  // e.g., "overview", "gdp", "labour", "prices", "money", "trade", "government", "business"
  name: String,     // e.g., "Inflation Rate", "GDP Growth Rate"
  description: String,
  
  // Current Value
  value: Number,
  unit: String,     // e.g., "percent", "NGN Million", "USD Billion"
  timestamp: Date,
  source: String,   // e.g., "trading_economics", "cbn", "nbs"
  
  // Historical Context
  previous: Number,
  highest: Number,
  lowest: Number,
  highestDate: Date,
  lowestDate: Date,
  
  // Change Calculations
  change: Number,   // value - previous
  changePercent: Number,
  trend: String,   // "up", "down", "stable"
  
  // Metadata
  frequency: String,  // "daily", "monthly", "quarterly"
  lastFetched: Date,
  nextFetch: Date,
  isActive: Boolean,
  
  // Audit
  createdAt: Date,
  updatedAt: Date
}
```

### 2. IndicatorCategories Collection

Defines indicator categories and their metadata.

```javascript
{
  _id: ObjectId,
  code: String,      // e.g., "overview", "gdp", "labour"
  name: String,     // e.g., "GDP", "Labour Market"
  description: String,
  icon: String,     // Emoji icon for UI
  color: String,    // Theme color
  order: Number,    // Display order
  indicators: [String],  // Array of indicator codes
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 3. EconomicNews Collection

Stores news articles affecting the business.

```javascript
{
  _id: ObjectId,
  userId: ObjectId,  // Optional: for user-specific filtering
  
  // Content
  title: String,
  body: String,
  summary: String,
  
  // Classification
  category: String,  // e.g., "scarcity_alert", "packaging", "campus_trends", "policy", "weather"
  tag: String,      // e.g., "🔴 Scarcity Alert", "🔵 Packaging Market", "🟢 Campus Trends"
  severity: String, // "urgent", "info", "success"
  
  // Relevance
  affectedCommodities: [String],  // e.g., ["groundnut", "pet_bottles"]
  affectedRegions: [String],      // e.g., ["kaduna", "lagos", "all"]
  
  // Timing
  publishedAt: Date,
  expiresAt: Date,   // When this news is no longer relevant
  
  // Source
  source: String,    // e.g., "manual", "api", "scraper"
  sourceUrl: String,
  
  // Impact
  impactLevel: String,  // "high", "medium", "low"
  impactDescription: String,
  
  // Metadata
  isActive: Boolean,
  isPinned: Boolean,
  pinOrder: Number,
  
  createdAt: Date,
  updatedAt: Date
}
```

### 4. EconomicEvents Collection

Upcoming economic calendar events.

```javascript
{
  _id: ObjectId,
  
  // Event Details
  name: String,     // e.g., "CBN MPC Meeting"
  description: String,
  category: String,  // e.g., "monetary_policy", "fiscal", "economic_data", "holiday"
  
  // Timing
  eventDate: Date,
  daysUntil: Number,  // Calculated: eventDate - now
  
  // Expected Impact
  impactLevel: String,  // "high", "medium", "low"
  affectedIndicators: [String],  // e.g., ["INF", "FX_RATE", "INTEREST_RATE"]
  
  // Location
  location: String,
  
  // Metadata
  isActive: Boolean,
  isCompleted: Boolean,
  
  createdAt: Date,
  updatedAt: Date
}
```

### 5. EconomicDataCache Collection

Cache for external API responses to reduce calls.

```javascript
{
  _id: ObjectId,
  
  // Cache Key
  key: String,      // e.g., "trading_economics:inflation", "commodities:groundnut"
  
  // Cached Data
  data: Schema.Types.Mixed,
  
  // Metadata
  source: String,
  fetchedAt: Date,
  expiresAt: Date,
  
  // Stats
  hitCount: Number,
  
  createdAt: Date,
  updatedAt: Date
}
```

### 6. UserIndicatorPreferences Collection

User's customized indicator selections and alerts.

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  
  // Favorite Indicators
  favoriteIndicators: [String],
  
  // Alert Thresholds
  alertThresholds: {
    indicatorCode: {
      upper: Number,
      lower: Number,
      enabled: Boolean
    }
  },
  
  // Display Preferences
  dashboardLayout: {
    pinned: [String],
    order: [String]
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Endpoints

### Indicator Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/economic/indicators` | Get all indicators | Yes |
| GET | `/api/economic/indicators/:code` | Get single indicator | Yes |
| GET | `/api/economic/indicators/category/:category` | Get indicators by category | Yes |
| GET | `/api/economic/overview` | Get overview stats (ticker) | Yes |
| POST | `/api/economic/refresh` | Force refresh all indicators | Yes |

### News Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/economic/news` | Get all news | Yes |
| GET | `/api/economic/news/:category` | Get news by category | Yes |
| POST | `/api/economic/news` | Create news (admin) | Yes |
| PATCH | `/api/economic/news/:id` | Update news | Yes |
| DELETE | `/api/economic/news/:id` | Delete news | Yes |

### Events Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/economic/events` | Get upcoming events | Yes |
| GET | `/api/economic/events/upcoming` | Get events within N days | Yes |
| POST | `/api/economic/events` | Create event (admin) | Yes |
| PATCH | `/api/economic/events/:id` | Update event | Yes |
| DELETE | `/api/economic/events/:id` | Delete event | Yes |

### User Preferences Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/economic/preferences` | Get user preferences | Yes |
| PATCH | `/api/economic/preferences` | Update preferences | Yes |
| POST | `/api/economic/favorites/:code` | Add favorite indicator | Yes |
| DELETE | `/api/economic/favorites/:code` | Remove favorite | Yes |

---

## Response Formats

### Get Overview (Ticker)
```json
{
  "success": true,
  "data": {
    "currency": {
      "value": 1370,
      "previous": 1370,
      "highest": 1718,
      "lowest": 73.1,
      "unit": "NGN/USD",
      "change": 0,
      "changePercent": 0,
      "trend": "stable",
      "timestamp": "2026-07-26T00:00:00Z"
    },
    "stockMarket": {
      "value": 229240,
      "previous": 224322,
      "highest": 254067,
      "lowest": 4792,
      "unit": "points",
      "change": 4918,
      "changePercent": 2.19,
      "trend": "up",
      "timestamp": "2026-07-26T00:00:00Z"
    },
    "inflationRate": {
      "value": 15.93,
      "previous": 15.69,
      "highest": 47.56,
      "lowest": -2.49,
      "unit": "percent",
      "change": 0.24,
      "changePercent": 1.53,
      "trend": "up",
      "timestamp": "2026-05-26T00:00:00Z"
    }
    // ... more indicators
  },
  "meta": {
    "lastUpdated": "2026-07-26T09:00:00Z",
    "nextUpdate": "2026-07-27T09:00:00Z",
    "source": "trading_economics"
  }
}
```

### Get News
```json
{
  "success": true,
  "data": [
    {
      "_id": "news_001",
      "title": "Northern Groundnut Harvest Season Delay",
      "body": "Heavy rains in Kaduna extended drying times by 2 weeks...",
      "summary": "Expect 15-20% wholesale price hike in Mile 12 & Bodija markets.",
      "category": "scarcity_alert",
      "tag": "🔴 Scarcity Alert",
      "severity": "urgent",
      "affectedCommodities": ["groundnut"],
      "affectedRegions": ["kaduna", "lagos", "bodija"],
      "publishedAt": "2026-07-24T07:00:00Z",
      "expiresAt": "2026-08-07T00:00:00Z",
      "impactLevel": "high",
      "impactDescription": "Raw material costs expected to rise 15-20%"
    }
  ],
  "meta": {
    "total": 8,
    "last24Hours": 3
  }
}
```

### Get Events
```json
{
  "success": true,
  "data": [
    {
      "_id": "event_001",
      "name": "CBN MPC Meeting",
      "description": "Monetary Policy Committee meeting to decide interest rates",
      "category": "monetary_policy",
      "eventDate": "2026-08-01T00:00:00Z",
      "daysUntil": 6,
      "impactLevel": "high",
      "affectedIndicators": ["INTEREST_RATE", "FX_RATE", "INFLATION"],
      "location": "Abuja, Nigeria"
    }
  ]
}
```

---

## 85 Indicators Mapping

### Overview (7 indicators)
- Currency (NGN/USD)
- Stock Market (NGX ASI)
- GDP Growth Rate
- GDP Annual Growth Rate
- Unemployment Rate
- Inflation Rate
- Interest Rate

### GDP (14 indicators)
- GDP Growth Rate
- GDP Annual Growth Rate
- GDP
- GDP Constant Prices
- Gross Fixed Capital Formation
- GDP per Capita
- GDP per Capita PPP
- Full Year GDP Growth
- GDP Growth Non Oil Sector
- GDP Growth Oil Sector
- GDP from Agriculture
- GDP from Construction
- GDP from Manufacturing
- GDP from Mining
- GDP from Public Administration
- GDP from Services
- GDP from Transport
- GDP from Utilities

### Labour (4 indicators)
- Unemployment Rate
- Population
- Employment Rate
- Minimum Wages

### Prices (12 indicators)
- Inflation Rate
- Consumer Price Index CPI
- Core Consumer Prices
- Core Inflation Rate
- Food Inflation
- CPI Clothing
- CPI Education
- CPI Food
- CPI Recreation and Culture
- CPI Restaurants and Hotels
- CPI Housing Utilities
- CPI Transportation
- GDP Deflator
- Inflation Rate MoM

### Money (11 indicators)
- Interest Rate
- Cash Reserve Ratio
- Interbank Rate
- Money Supply M0
- Money Supply M1
- Money Supply M2
- Foreign Exchange Reserves
- Deposit Interest Rate
- Lending Rate
- Money Supply M3

### Trade (14 indicators)
- Balance of Trade
- Current Account
- Current Account to GDP
- Exports
- Imports
- Terms of Trade
- Capital Flows
- Foreign Direct Investment
- Crude Oil Production
- External Debt
- Non Oil Exports
- Oil Exports
- Remittances
- Terrorism Index

### Government (11 indicators)
- Government Debt to GDP
- Government Budget
- Government Revenues
- Corruption Index
- Corruption Rank
- Credit Rating
- Government Debt
- Government Spending
- Military Expenditure

### Business (4 indicators)
- Corporate Tax Rate
- Personal Income Tax Rate
- Sales Tax Rate
- Withholding Tax Rate

---

## Implementation Order

1. **Phase 1**: Create database models (Mongoose schemas)
2. **Phase 2**: Build EconomicData service (fetch from external APIs)
3. **Phase 3**: Create API endpoints (routes + controllers)
4. **Phase 4**: Build frontend integration (replace hardcoded values)
5. **Phase 5**: Implement caching and background refresh jobs
