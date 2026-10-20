# Dual ORM Setup - Mongoose & Prisma

> Historical module reference. These contracts are not the deployed consumer API. For current runtime boundaries, see [Consumer implementation](CONSUMER_LOCAL_IMPLEMENTATION.md).

## Overview

Your backend now supports **both MongoDB (Mongoose) and PostgreSQL (Prisma)**! You can switch between them using a single environment variable.

---

## 🎯 Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Controllers                      │
│  (financeController, strategyController, etc.)     │
└────────────────────┬────────────────────────────────┘
                     │
              ┌──────┴──────┐
              │             │
         ┌────▼────┐   ┌───▼────────┐
         │ Mongoose │   │  Prisma    │
         │ Services │   │  Services  │
         └────┬────┘   └───┬────────┘
              │            │
         ┌────▼────┐   ┌───▼────────┐
         │ MongoDB │   │ PostgreSQL │
         │ (Atlas) │   │   (Neon)   │
         └─────────┘   └────────────┘
```

---

## 📋 Prisma Models Implemented

| Model | Purpose | Relations |
|-------|---------|-----------|
| User | Authentication | ledgers, transactions, credits, goals, businessProfile |
| Ledger | Life/Business ledgers | transactions, credits, goals |
| Transaction | Financial transactions | ledger, creditEntry |
| CreditEntry | Credit tracking | ledger, payments, reminders, items |
| Goal | Strategic goals | ledger, milestones, actionItems |
| BusinessProfile | Products, suppliers | products, suppliers, rawMaterials |
| Product | Pricing & costs | businessProfile |
| Supplier | Supplier management | products, bulkDiscounts |
| RawMaterial | Stock tracking | businessProfile |
| EconomicIndicator | Economic data | - |
| EconomicNews | News feed | - |
| EconomicEvent | Events calendar | - |
| Insight | Interpretation module | - |

---

## 🚀 Quick Setup

### Step 1: Choose Your Database

**Option A: MongoDB (Mongoose) - No Setup Needed**
- Uses existing MongoDB code
- Get free cluster at: https://www.mongodb.com/cloud/atlas
- Set `DB_TYPE=mongodb` in `.env`

**Option B: PostgreSQL (Prisma) - Neon (Recommended)**
- Free PostgreSQL database
- Great for Prisma
- Set `DB_TYPE=postgresql` in `.env`

### Step 2: Set Up Neon (PostgreSQL)

1. **Sign up at https://neon.tech** (free, no credit card required)

2. **Create a project:**
   - Click "New Project"
   - Select a region closest to you
   - Click "Create Project"

3. **Get connection string:**
   - Copy the "Connection string" from your project dashboard
   - It looks like:
   ```
   postgresql://johndoe:lost-password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

4. **Update `.env`:**
   ```env
   DB_TYPE=postgresql
   DATABASE_URL=your-neon-connection-string
   ```

### Step 3: Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

---

## 📁 File Structure

```
backend/
├── prisma/
│   └── schema.prisma          # All Prisma models
├── src/
│   ├── config/
│   │   ├── prisma.js          # Prisma client setup
│   │   └── database.js        # ORM selector
│   ├── services/
│   │   ├── prisma/             # Prisma services
│   │   │   ├── financeService.js
│   │   │   └── strategyService.js
│   │   └── mongoose/           # Mongoose services (existing)
│   │       └── ...             # Already implemented
│   └── controllers/
│       └── ...                 # Work with both ORMs
└── .env                        # DB_TYPE selection
```

---

## 🔧 Configuration

### Environment Variables (.env)

```env
# ==========================================
# DATABASE SELECTION
# ==========================================
DB_TYPE=postgresql    # Options: mongodb | postgresql

# --- MongoDB Configuration ---
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/joseph-ai

# --- PostgreSQL Configuration ---
DATABASE_URL=postgresql://user:pass@host:5432/database
```

---

## 💻 Usage Examples

### For Your Team (Prisma/PostgreSQL)

```javascript
import { prisma } from '../config/prisma.js';

// Get ledgers
const ledgers = await prisma.ledger.findMany({
  where: { userId: req.userId },
  orderBy: { balance: 'desc' }
});

// Create goal
const goal = await prisma.goal.create({
  data: {
    userId,
    title: 'Build Emergency Fund',
    category: 'SAVINGS',
    targetValue: 500000,
    unit: '₦',
    endDate: new Date('2025-12-31')
  }
});

// Update transaction
const updated = await prisma.transaction.update({
  where: { id: transactionId },
  data: { amount: newAmount }
});
```

### Existing Code (Mongoose/MongoDB)

```javascript
import Ledger from '../models/Ledger.js';

// Get ledgers
const ledgers = await Ledger.find({ userId: req.userId });

// Create goal
const goal = await Goal.create({ /* ... */ });

// Update transaction
const updated = await Transaction.findByIdAndUpdate(
  transactionId,
  { amount: newAmount }
);
```

---

## 🎨 Prisma Query Examples

### Basic Queries

```javascript
// Find all ledgers for user
const ledgers = await prisma.ledger.findMany({
  where: { userId: 'user-id' }
});

// Find single record
const ledger = await prisma.ledger.findFirst({
  where: { userId, type: 'LIFE' }
});

// Create record
const newLedger = await prisma.ledger.create({
  data: {
    userId,
    type: 'LIFE',
    name: 'Personal Ledger'
  }
});

// Update record
const updated = await prisma.ledger.update({
  where: { id: ledgerId },
  data: { balance: 100000 }
});

// Delete record (soft delete)
await prisma.ledger.update({
  where: { id: ledgerId },
  data: { isDeleted: true, deletedAt: new Date() }
});
```

### Advanced Queries

```javascript
// With relations
const userWithLedgers = await prisma.user.findFirst({
  where: { id: userId },
  include: {
    ledgers: true,
    goals: true
  }
});

// Aggregation
const summary = await prisma.creditEntry.groupBy({
  by: ['status'],
  _count: true,
  _sum: {
    totalCredit: true,
    amountPaid: true
  }
});

// Transactions
const total = await prisma.ledger.aggregate({
  _sum: { balance: true }
});
```

---

## 🔄 Switching Between ORMs

### From MongoDB to PostgreSQL

1. Sign up for Neon and get connection string
2. Update `.env`:
   ```env
   DB_TYPE=postgresql
   DATABASE_URL=your-neon-connection-string
   ```
3. Run: `npx prisma db push`
4. Restart server

### From PostgreSQL to MongoDB

1. Sign up for MongoDB Atlas
2. Update `.env`:
   ```env
   DB_TYPE=mongodb
   MONGODB_URI=your-mongodb-connection-string
   ```
3. Restart server

---

## 📊 Model Mapping (Mongoose → Prisma)

| Mongoose | Prisma | Notes |
|----------|--------|-------|
| `new Schema({...})` | `model ModelName {...}` | Schema definition |
| `ref: 'User'` | `User @relation(...)` | Relations |
| `default: Date.now` | `@default(now())` | Default values |
| `index: true` | `@@index(...)` | Indexes |
| `enum: [...]` | `enum EnumName {...}` | Enums |
| `ObjectId` | `String @default(uuid())` | Primary keys |
| `Number` | `Float` | Numbers |
| `Array` | `TypeName[]` | Arrays |

---

## 🛠️ Prisma Commands

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Open Prisma Studio (GUI)
npx prisma studio

# Pull schema from existing database
npx prisma db pull

# Reset database
npx prisma migrate reset

# Format schema
npx prisma format
```

---

## 🧪 Testing

### Test Prisma Connection

```bash
# Set DB_TYPE to postgresql in .env
DB_TYPE=postgresql

# Run server
npm run dev
```

### Test with Prisma Studio (Database GUI)

```bash
npx prisma studio
# Opens at http://localhost:5555
```

---

## ✅ Checklist

- [x] Prisma schema created with all models
- [x] Prisma client configured (downgraded to v6.19.3 for compatibility)
- [x] Finance service (Prisma) implemented
- [x] Strategy service (Prisma) implemented
- [x] Economic service (Prisma) implemented
- [x] Economic Data Updater (Prisma) implemented
- [x] Database selector configured
- [x] Environment variables updated
- [x] Neon database connected
- [x] Prisma db push completed (24 tables created)
- [x] Server running with PostgreSQL support
- [x] Seed script created

---

## 🎓 Setup Completed!

Your backend now supports **both MongoDB (Mongoose) and PostgreSQL (Prisma)**!

**To switch databases:**
```env
# Use PostgreSQL/Neon
DB_TYPE=postgresql

# Use MongoDB
DB_TYPE=mongodb
```

**Current Status:**
- ✅ Prisma v6.19.3 (PostgreSQL support)
- ✅ Neon database connected
- ✅ 24 tables created
- ✅ Server running on http://localhost:4000
- ✅ 5 Prisma services implemented

---

## 💡 Tips

- **Use Prisma Studio** to visually explore your database
- **Use `npx prisma format`** to keep schema clean
- **Generate types** with `npx prisma generate` for autocomplete
- **Switch DB types** anytime with just one env variable

---

## 🆘 Troubleshooting

**"Prisma Client is not generated"**
```bash
npx prisma generate
```

**"Connection refused"**
- Check DATABASE_URL in `.env`
- Verify Neon project is active

**"Schema mismatch"**
```bash
npx prisma db push
```
