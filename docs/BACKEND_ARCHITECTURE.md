# JOSEPH AI - Dynamic Backend Architecture Plan

## Tech Stack
- **Framework**: Express.js (Node.js)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (Access + Refresh Tokens)
- **Validation**: Joi / Zod
- **Security**: bcrypt, helmet, cors, express-rate-limit

---

## Project Structure

```
joseph-ai/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js              # MongoDB connection
│   │   │   ├── jwt.js             # JWT config & secrets
│   │   │   └── constants.js       # App constants
│   │   ├── models/
│   │   │   ├── User.js            # User schema
│   │   │   ├── Transaction.js     # Transaction schema
│   │   │   ├── Ledger.js          # Ledger (Life/Business) schema
│   │   │   ├── CreditEntry.js     # Credit ledger schema
│   │   │   ├── EconomicData.js    # Cached economic data
│   │   │   └── CategoryRule.js    # Learned categorization rules
│   │   ├── controllers/
│   │   │   ├── authController.js  # Login, Register, Refresh
│   │   │   ├── transactionController.js
│   │   │   ├── ledgerController.js
│   │   │   ├── economicController.js
│   │   │   └── settingsController.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── transactions.js
│   │   │   ├── ledgers.js
│   │   │   ├── economic.js
│   │   │   └── settings.js
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT verification
│   │   │   ├── validation.js      # Input validation
│   │   │   ├── errorHandler.js   # Global error handler
│   │   │   └── rateLimiter.js     # Rate limiting
│   │   ├── services/
│   │   │   ├── transactionService.js    # Business logic
│   │   │   ├── categorizationService.js # 50:30:20 categorizer
│   │   │   ├── creditService.js        # Credit detection
│   │   │   ├── varianceService.js      # Variance analysis
│   │   │   └── economicService.js      # External API integration
│   │   ├── utils/
│   │   │   ├── logger.js
│   │   │   └── helpers.js
│   │   └── app.js                   # Express app setup
│   ├── .env                        # Environment variables
│   ├── .env.example                # Template
│   ├── server.js                   # Entry point
│   └── package.json
├── frontend/                       # Your existing HTML/JS files
│   ├── index.html
│   ├── app.js
│   ├── dataEngine.js
│   └── ...
└── README.md
```

---

## Database Schema Design

### 1. User Model
```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed, required),
  name: String,
  phone: String,
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date,
  isActive: Boolean,
  // Tokens
  refreshTokens: [{
    token: String,
    createdAt: Date,
    expiresAt: Date,
    deviceInfo: Object
  }],
  // Settings
  preferences: {
    currency: String (default: 'NGN'),
    language: String (default: 'en'),
    notifications: Boolean
  }
}
```

### 2. Transaction Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, required, indexed),
  // Original data from webhook
  originalData: Object, // Store raw API data
  // Normalized fields
  externalId: String, // Original transaction ID
  type: Enum ['credit', 'debit'],
  amount: Number (required),
  currency: String (default: 'NGN'),
  narration: String,
  timestamp: Date (indexed),
  // Account info
  accountId: String,
  accountName: String,
  merchant: String,
  // FP&A Classification
  ledger: Enum ['life', 'business'],
  category: Enum ['needs', 'wants', 'savings', null],
  isCreditSale: Boolean,
  creditInfo: {
    customerName: String,
    phone: String,
    items: Array,
    dueDate: Date
  },
  // Splits (for business income)
  split: {
    workingCapital: Number,
    available: Number,
    ratio: Number
  },
  // Confidence & Learning
  fpna: {
    processedAt: Date,
    confidence: Number (0-1),
    needsConfirmation: Boolean
  },
  // Soft delete
  isDeleted: Boolean,
  deletedAt: Date
}
```

### 3. Ledger Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, required, indexed),
  type: Enum ['life', 'business'],
  balance: Number (default: 0),
  // For Life ledger
  monthlyBudget: Number,
  budgetAllocation: {
    needs: Number (default: 0.5),
    wants: Number (default: 0.3),
    savings: Number (default: 0.2)
  },
  burnRate: Number,
  runwayDays: Number,
  // For Business ledger
  workingCapital: Number,
  availableCapital: Number,
  reinvestmentRatio: Number (default: 0.4),
  // Analytics
  totalIncome: Number,
  totalExpenses: Number,
  lastUpdated: Date
}
```

### 4. CreditEntry Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, required, indexed),
  transactionId: ObjectId (ref: Transaction),
  customerName: String,
  phone: String,
  totalCredit: Number,
  amountPaid: Number,
  amountOutstanding: Number,
  dueDate: Date (indexed),
  items: Array,
  status: Enum ['pending', 'partial', 'paid', 'overdue'],
  payments: [{
    amount: Number,
    date: Date,
    method: String,
    notes: String
  }],
  reminders: [{
    sentAt: Date,
    method: String,
    status: String
  }],
  createdAt: Date
}
```

### 5. EconomicData Model (Cache)
```javascript
{
  _id: ObjectId,
  type: Enum ['inflation', 'fx', 'commodities', 'fuel', 'news'],
  data: Object, // The actual data
  source: String,
  fetchedAt: Date,
  expiresAt: Date (indexed),
  isActive: Boolean
}
```

### 6. CategoryRule Model (Learning)
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, indexed),
  pattern: String, // "fuel", "netflix", etc.
  category: Enum ['needs', 'wants', 'savings'],
  confidence: Number (default: 1),
  usageCount: Number (default: 1),
  lastUsed: Date,
  createdAt: Date
}
```

---

## API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Create new user | No |
| POST | `/login` | Login & get tokens | No |
| POST | `/logout` | Invalidate refresh token | Yes |
| POST | `/refresh` | Get new access token | No |
| POST | `/forgot-password` | Initiate password reset | No |
| POST | `/reset-password` | Complete password reset | No |

**Responses:**
- Login/Register: `{ accessToken, refreshToken, user: { id, email, name } }`
- All tokens include `expiresIn`

### Transaction Routes (`/api/transactions`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List transactions (paginated) | Yes |
| POST | `/` | Create transaction manually | Yes |
| POST | `/webhook/:provider` | Receive bank webhook | API Key |
| GET | `/:id` | Get single transaction | Yes |
| PATCH | `/:id` | Update transaction | Yes |
| DELETE | `/:id` | Soft delete transaction | Yes |
| POST | `/:id/confirm` | Confirm AI categorization | Yes |
| GET | `/analytics` | Transaction analytics | Yes |

### Ledger Routes (`/api/ledgers`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get all ledgers (Life + Business) | Yes |
| GET | `/:type` | Get specific ledger | Yes |
| PATCH | `/:type` | Update ledger settings | Yes |
| GET | `/:type/runway` | Calculate runway | Yes |

### Credit Routes (`/api/credit`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List all credit entries | Yes |
| POST | `/` | Create credit entry | Yes |
| GET | `/overdue` | Get overdue credits | Yes |
| POST | `/:id/payment` | Record payment | Yes |
| POST | `/:id/remind` | Send payment reminder | Yes |

### Economic Data Routes (`/api/economic`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/inflation` | Get inflation data | Yes |
| GET | `/fx` | Get FX rates | Yes |
| GET | `/commodities` | Get commodity prices | Yes |
| GET | `/fuel` | Get fuel prices | Yes |
| GET | `/news` | Get economic news | Yes |
| POST | `/refresh` | Force refresh all data | Yes |

### Settings Routes (`/api/settings`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get user settings | Yes |
| PATCH | `/` | Update settings | Yes |
| POST | `/api-keys` | Save API key | Yes |
| DELETE | `/api-keys/:service` | Remove API key | Yes |

---

## Security Implementation

### 1. Password Hashing
```javascript
// bcrypt with salt rounds = 12
const hashedPassword = await bcrypt.hash(password, 12);
```

### 2. JWT Tokens
```javascript
// Access token: 15 minutes
// Refresh token: 7 days
const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
  expiresIn: '15m'
});
const refreshToken = jwt.sign(
  { userId, tokenId },
  process.env.JWT_REFRESH_SECRET,
  { expiresIn: '7d' }
);
```

### 3. Middleware Chain
```javascript
// Protected routes
router.get('/transactions',
  authenticateToken,      // Verify JWT
  rateLimiter,           // Rate limiting
  transactionController.getAll
);

// Webhook endpoints
router.post('/webhook/:provider',
  verifyWebhookSignature, // Verify API signature
  rateLimiter,             // Prevent abuse
  transactionController.webhook
);
```

---

## Environment Variables

```env
# Server
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/joseph-ai
# Or MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/joseph-ai

# JWT
JWT_SECRET=your-super-secret-access-token-key
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key

# External APIs (optional - for dataEngine)
NEWS_API_KEY=
TRADING_ECONOMICS_API_KEY=

# Webhook Security
WEBHOOK_SECRET=your-webhook-signature-secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  // 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Migration Strategy

### Phase 1: Backend Setup (1-2 weeks)
1. Initialize Express project structure
2. Set up MongoDB connection
3. Create all Mongoose models
4. Implement authentication routes
5. Set up middleware

### Phase 2: Core API (2 weeks)
1. Transaction CRUD endpoints
2. Ledger endpoints
3. Credit ledger endpoints
4. Data validation

### Phase 3: Economic Data Integration (1 week)
1. Implement caching service
2. Connect external APIs
3. Background refresh jobs

### Phase 4: Frontend Migration (2-3 weeks)
1. Create API client in frontend
2. Migrate from localStorage to API calls
3. Implement token refresh logic
4. Update all data operations

### Phase 5: Testing & Deployment (1 week)
1. Integration testing
2. Security audit
3. Deploy to production
4. Database backup strategy

---

## Next Steps

Would you like me to:
1. **Initialize the backend project structure** - Create all folders and base files
2. **Implement the authentication system** - Full JWT + bcrypt setup
3. **Create database models** - All Mongoose schemas
4. **Build specific endpoints** - Start with transactions or auth
5. **Create the API client** - Frontend service to call the new backend

Let me know which you'd like to tackle first!
