# JOSEPH AI - Backend API

The backend server for JOSEPH AI - Family Finance & Business Management application.

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18 or higher
- **MongoDB** (local instance or MongoDB Atlas account)

### Installation

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Update the values as needed:
   ```bash
   cp .env.example .env
   ```

4. **Update MongoDB connection:**
   Edit `.env` and set your `MONGODB_URI`:
   ```env
   # For local MongoDB:
   MONGODB_URI=mongodb://localhost:27017/joseph-ai

   # Or MongoDB Atlas:
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/joseph-ai
   ```

5. **Generate secure JWT secrets:**
   ```bash
   node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
   node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
   ```
   Copy the outputs to your `.env` file.

6. **Start the server:**
   ```bash
   # Production mode
   npm start

   # Development mode (with auto-reload)
   npm run dev
   ```

The server will start on `http://localhost:4000`

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── db.js        # MongoDB connection
│   │   ├── jwt.js       # JWT configuration
│   │   └── constants.js # App constants
│   ├── models/          # Mongoose schemas
│   │   ├── User.js
│   │   ├── Transaction.js
│   │   ├── Ledger.js
│   │   ├── CreditEntry.js
│   │   ├── EconomicData.js
│   │   └── CategoryRule.js
│   ├── routes/          # API routes (to be implemented)
│   ├── controllers/     # Route controllers (to be implemented)
│   ├── middleware/      # Express middleware (to be implemented)
│   ├── services/        # Business logic (to be implemented)
│   ├── utils/           # Helper functions (to be implemented)
│   └── app.js           # Express app setup
├── .env                 # Environment variables (create this)
├── .env.example         # Environment template
├── .gitignore
├── server.js            # Entry point
├── package.json
└── README.md
```

## 🔗 API Endpoints

### Health Check
- `GET /health` - Server health status

### API Root
- `GET /api` - API information and available endpoints

### Authentication (Pending Implementation)
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login and get tokens
- `POST /api/auth/logout` - Logout (invalidate refresh token)
- `POST /api/auth/refresh` - Refresh access token

### Transactions (Pending Implementation)
- `GET /api/transactions` - List user transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/:id` - Get single transaction
- `PATCH /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Ledgers (Pending Implementation)
- `GET /api/ledgers` - Get all ledgers
- `GET /api/ledgers/:type` - Get specific ledger
- `PATCH /api/ledgers/:type` - Update ledger settings

### Credit (Pending Implementation)
- `GET /api/credit` - List credit entries
- `POST /api/credit` - Create credit entry
- `POST /api/credit/:id/payment` - Record payment

### Economic Data (Pending Implementation)
- `GET /api/economic/inflation` - Get inflation data
- `GET /api/economic/fx` - Get FX rates
- `GET /api/economic/commodities` - Get commodity prices
- `GET /api/economic/news` - Get economic news

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Access Token**: Short-lived (15 minutes), sent with each request
2. **Refresh Token**: Long-lived (7 days), used to get new access tokens

### Request Format
```bash
curl -H "Authorization: Bearer <access_token>" http://localhost:4000/api/transactions
```

### Token Refresh
When the access token expires, use the refresh token to get a new one:

```bash
POST /api/auth/refresh
{
  "refreshToken": "<refresh_token>"
}
```

## 🗄️ Database Models

### User
- Accounts with authentication
- Refresh token management
- User preferences and settings

### Transaction
- Financial transactions with FP&A classification
- Support for credit sales detection
- Category learning from user confirmations

### Ledger
- Life (Personal) and Business ledgers
- Budget tracking (50:30:20 rule)
- Business metrics and capital management

### CreditEntry
- Credit sales tracking
- Payment history
- Reminder management

### EconomicData
- Cached external API responses
- Automatic expiration and cleanup
- Support for inflation, FX, commodities, fuel, news

### CategoryRule
- Learned categorization patterns
- Confidence scoring
- Success rate tracking

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `4000` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/joseph-ai` |
| `JWT_SECRET` | JWT secret key | (must be set) |
| `JWT_REFRESH_SECRET` | Refresh token secret | (must be set) |
| `ACCESS_TOKEN_EXPIRES_IN` | Access token TTL | `15m` |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token TTL | `7d` |

## 🛠️ Development

### Running in Development Mode
```bash
npm run dev
```
This starts the server with auto-reload on file changes.

### Database Operations

#### Clear Database (Development Only)
```bash
node -e "import('./src/config/db.js').then(m => m.clearDatabase())"
```

#### Connect to MongoDB Shell
```bash
mongosh joseph-ai
# or
mongo joseph-ai
```

## 📝 Next Steps

The backend structure is complete. Next phases:

1. **Authentication System** - Implement JWT auth routes and middleware
2. **Transaction API** - CRUD operations for transactions
3. **Ledger API** - Ledger management and analytics
4. **Credit API** - Credit sales and payment tracking
5. **Economic Data Service** - External API integration with caching
6. **Frontend Integration** - Update frontend to use new API

## 📄 License

MIT

---

**JOSEPH AI** - Family Finance & Business Management
