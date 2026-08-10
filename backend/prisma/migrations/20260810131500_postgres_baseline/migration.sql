-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'user');

-- CreateEnum
CREATE TYPE "LedgerType" AS ENUM ('LIFE', 'BUSINESS');

-- CreateEnum
CREATE TYPE "TxnType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "TxnCategory" AS ENUM ('NEEDS', 'WANTS', 'SAVINGS');

-- CreateEnum
CREATE TYPE "CreditStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TRANSFER', 'POS', 'OTHER');

-- CreateEnum
CREATE TYPE "ReminderMethod" AS ENUM ('SMS', 'WHATSAPP', 'CALL', 'EMAIL', 'IN_APP');

-- CreateEnum
CREATE TYPE "GoalCategory" AS ENUM ('REVENUE', 'SAVINGS', 'EXPANSION', 'COST_REDUCTION', 'EFFICIENCY', 'QUALITY', 'OTHER');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'ON_TRACK', 'AT_RISK', 'BEHIND', 'COMPLETED', 'PAUSED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "name" TEXT,
    "phone" TEXT,
    "dob" TIMESTAMP(3),
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),
    "lastActivity" TIMESTAMP(3),
    "resetPasswordToken" TEXT,
    "resetPasswordExpires" TIMESTAMP(3),
    "whatsappOTP" TEXT,
    "whatsappOTPExpiry" TIMESTAMP(3),
    "whatsappLinkToken" TEXT,
    "whatsappLinkTokenExpiry" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "onboardingStep" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "language" TEXT NOT NULL DEFAULT 'en',
    "notifications" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "darkMode" BOOLEAN NOT NULL DEFAULT false,
    "accentColor" TEXT NOT NULL DEFAULT 'navy',
    "fontSize" TEXT NOT NULL DEFAULT 'medium',
    "dateFormat" TEXT NOT NULL DEFAULT 'dmy',

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "lowBalanceThreshold" DOUBLE PRECISION NOT NULL DEFAULT 5000,
    "spendingAlert" BOOLEAN NOT NULL DEFAULT true,
    "goalUpdates" BOOLEAN NOT NULL DEFAULT true,
    "runwayWarning" BOOLEAN NOT NULL DEFAULT true,
    "creditReminders" BOOLEAN NOT NULL DEFAULT true,
    "economicAlerts" BOOLEAN NOT NULL DEFAULT true,
    "priceMovementAlerts" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceInfo" TEXT,
    "deviceType" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategy_recommendations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "impact" TEXT,
    "type" TEXT NOT NULL DEFAULT 'info',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "viewed" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'new',
    "category" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "viewedAt" TIMESTAMP(3),

    CONSTRAINT "strategy_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variance_alerts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "impact" TEXT,
    "directive" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "variance_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_learnings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "category" "TxnCategory" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "usageCount" INTEGER NOT NULL DEFAULT 1,
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_learnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_classifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "ledgerType" "LedgerType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "usageCount" INTEGER NOT NULL DEFAULT 1,
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_classifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_configurations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "newsApiKey" TEXT,
    "fmdqApiKey" TEXT,
    "commoditiesApiKey" TEXT,
    "cbnApiKey" TEXT,
    "useRealAPIs" BOOLEAN NOT NULL DEFAULT true,
    "useBackendAPI" BOOLEAN NOT NULL DEFAULT true,
    "dataRefreshInterval" INTEGER NOT NULL DEFAULT 3600,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "loyaltyLevel" TEXT NOT NULL DEFAULT 'regular',
    "totalPurchases" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCredit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastPurchaseAt" TIMESTAMP(3),
    "lastContactAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_interactions" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "summary" TEXT,
    "notes" TEXT,
    "interactionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledgers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "LedgerType" NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalIncome" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalExpenses" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netCashFlow" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "runwayDays" INTEGER NOT NULL DEFAULT 0,
    "monthlyBudget" DOUBLE PRECISION,
    "budgetNeeds" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "budgetWants" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "budgetSavings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "spentNeeds" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "spentWants" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "spentSavings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "burnRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "workingCapital" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "availableCapital" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "workingCapitalTarget" DOUBLE PRECISION,
    "reinvestmentRatio" DOUBLE PRECISION NOT NULL DEFAULT 0.4,
    "businessTotalSales" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "businessTotalExpenses" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "businessNetProfit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "businessProfitMargin" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "businessAvgTransaction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "businessTxnCount" INTEGER NOT NULL DEFAULT 0,
    "businessCreditSales" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "businessCreditCount" INTEGER NOT NULL DEFAULT 0,
    "businessCollectionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "externalId" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'custom',
    "type" "TxnType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "narration" TEXT,
    "description" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "accountId" TEXT,
    "accountName" TEXT,
    "merchant" TEXT,
    "beneficiary" TEXT,
    "balanceAfter" DOUBLE PRECISION,
    "balanceBefore" DOUBLE PRECISION,
    "category" "TxnCategory",
    "tags" TEXT NOT NULL DEFAULT '[]',
    "isCreditSale" BOOLEAN NOT NULL DEFAULT false,
    "creditCustomer" TEXT,
    "creditPhone" TEXT,
    "creditDueDate" TIMESTAMP(3),
    "splitWorkingCapital" DOUBLE PRECISION,
    "splitAvailable" DOUBLE PRECISION,
    "splitRatio" DOUBLE PRECISION,
    "fpnaProcessedAt" TIMESTAMP(3),
    "fpnaSource" TEXT NOT NULL DEFAULT 'manual',
    "fpnaConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "fpnaNeedsConfirm" BOOLEAN NOT NULL DEFAULT false,
    "fpnaReviewedAt" TIMESTAMP(3),
    "creditEntryId" TEXT,
    "hasAttachment" BOOLEAN NOT NULL DEFAULT false,
    "attachmentUrl" TEXT,
    "attachmentType" TEXT,
    "notes" TEXT,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "batchId" TEXT,
    "importId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "transactionId" TEXT,
    "customerName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "totalCredit" DOUBLE PRECISION NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountOutstanding" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "creditPeriod" INTEGER NOT NULL DEFAULT 7,
    "paymentTerms" TEXT,
    "status" "CreditStatus" NOT NULL DEFAULT 'PENDING',
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reminderFrequency" INTEGER NOT NULL DEFAULT 3,
    "lastReminderSent" TIMESTAMP(3),
    "nextReminderDate" TIMESTAMP(3),
    "notes" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "customerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "creditEntryId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "reference" TEXT,
    "notes" TEXT,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL,
    "creditEntryId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" "ReminderMethod" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "response" TEXT,
    "nextReminder" TIMESTAMP(3),

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_items" (
    "id" TEXT NOT NULL,
    "creditEntryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT,
    "unitPrice" DOUBLE PRECISION,
    "totalPrice" DOUBLE PRECISION,

    CONSTRAINT "credit_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT,
    "businessPhone" TEXT,
    "businessEmail" TEXT,
    "businessAddress" TEXT,
    "businessCity" TEXT,
    "businessState" TEXT,
    "businessCategory" TEXT DEFAULT 'retail',
    "businessType" TEXT DEFAULT 'micro',
    "businessType2" TEXT DEFAULT 'retail',
    "industry" TEXT,
    "pricingStrategy" TEXT NOT NULL DEFAULT 'cost_plus',
    "pricingFrequency" TEXT NOT NULL DEFAULT 'monthly',
    "lastPriceReview" TIMESTAMP(3),
    "fixedCosts" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "variableCostRatio" DOUBLE PRECISION NOT NULL DEFAULT 0.6,
    "monthlyRevenueTarget" DOUBLE PRECISION,
    "annualRevenueTarget" DOUBLE PRECISION,
    "profitMarginTarget" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "marketSegment" TEXT NOT NULL DEFAULT 'mid_market',
    "competitiveAdvantage" TEXT,
    "businessDays" TEXT NOT NULL DEFAULT '["monday","tuesday","wednesday","thursday","friday","saturday"]',
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "businessProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "category" TEXT NOT NULL DEFAULT 'finished_goods',
    "currentPrice" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'unit',
    "cogs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costRawMaterials" DOUBLE PRECISION,
    "costLabor" DOUBLE PRECISION,
    "costPackaging" DOUBLE PRECISION,
    "costOverhead" DOUBLE PRECISION,
    "costOther" DOUBLE PRECISION,
    "targetMargin" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "currentMargin" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "competitorPrice" DOUBLE PRECISION,
    "competitorName" TEXT,
    "demandLevel" TEXT NOT NULL DEFAULT 'moderate',
    "priceElasticity" TEXT NOT NULL DEFAULT 'unit',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_price_history" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "cost" DOUBLE PRECISION,
    "margin" DOUBLE PRECISION,
    "reason" TEXT,
    "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitor_prices" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "competitorName" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competitor_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "businessProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "paymentTerms" TEXT NOT NULL DEFAULT '30_days',
    "creditLimit" DOUBLE PRECISION,
    "reliability" TEXT NOT NULL DEFAULT 'medium',
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 3,
    "leadTimeDays" INTEGER NOT NULL DEFAULT 7,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_products" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "unitPrice" DOUBLE PRECISION,
    "unit" TEXT,
    "moq" INTEGER,

    CONSTRAINT "supplier_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_discounts" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "minQty" INTEGER NOT NULL,
    "discountPercent" DOUBLE PRECISION NOT NULL,
    "description" TEXT,

    CONSTRAINT "supplier_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurement_options" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cost" DOUBLE PRECISION NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT,
    "savingsPercent" DOUBLE PRECISION,
    "recommendation" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procurement_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_materials" (
    "id" TEXT NOT NULL,
    "businessProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "currentPrice" DOUBLE PRECISION,
    "supplierName" TEXT,
    "monthlyUsage" DOUBLE PRECISION,
    "stockOnHand" DOUBLE PRECISION,
    "reorderLevel" DOUBLE PRECISION,
    "lastPurchase" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raw_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_transactions" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitCost" DOUBLE PRECISION,
    "totalCost" DOUBLE PRECISION,
    "reason" TEXT,
    "transactionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ledgerId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "GoalCategory" NOT NULL,
    "goalType" TEXT NOT NULL DEFAULT 'numeric',
    "targetValue" DOUBLE PRECISION,
    "currentValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "GoalStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "importance" TEXT NOT NULL DEFAULT 'should_have',
    "outcomeNotes" TEXT,
    "outcomeRating" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetValue" DOUBLE PRECISION,
    "currentValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT,
    "dueDate" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_items" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignedTo" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "estimatedCost" DOUBLE PRECISION,
    "actualCost" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "action_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "economic_indicators" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "change" DOUBLE PRECISION,
    "changePercent" DOUBLE PRECISION,
    "trend" TEXT,
    "source" TEXT,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "thresholdLow" DOUBLE PRECISION,
    "thresholdHigh" DOUBLE PRECISION,
    "status" TEXT,
    "history" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "economic_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "economic_news" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "source" TEXT,
    "url" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "impact" TEXT,
    "affectedSectors" TEXT NOT NULL DEFAULT '[]',
    "relevance" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "economic_news_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "economic_events" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "category" TEXT,
    "importance" TEXT,
    "expectedValue" DOUBLE PRECISION,
    "actualValue" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "economic_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insights" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT,
    "severity" TEXT,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "isActionable" BOOLEAN NOT NULL DEFAULT false,
    "recommendedAction" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interpretation_rules" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "indicatorCode" TEXT,
    "conditionType" TEXT NOT NULL,
    "operator" TEXT,
    "thresholdValue" DOUBLE PRECISION,
    "insightTemplate" TEXT NOT NULL,
    "severity" TEXT,
    "recommendedAction" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interpretation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insight_templates" (
    "id" TEXT NOT NULL,
    "ruleCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "titleTemplate" TEXT NOT NULL,
    "bodyTemplate" TEXT NOT NULL,
    "actionTemplate" TEXT,
    "variables" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insight_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_threshold_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customThresholds" TEXT,
    "notifyOnThreshold" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnNewEvents" BOOLEAN NOT NULL DEFAULT true,
    "notificationMethods" TEXT NOT NULL DEFAULT '["in_app"]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_threshold_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "economic_data_cache" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB,
    "source" TEXT NOT NULL DEFAULT 'cached',
    "sourceUrl" TEXT,
    "apiProvider" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastRefreshedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isStale" BOOLEAN NOT NULL DEFAULT false,
    "cacheHit" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" TIMESTAMP(3),
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "economic_data_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_rules" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "category" "TxnCategory" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "usageCount" INTEGER NOT NULL DEFAULT 1,
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_whatsappLinkToken_key" ON "users"("whatsappLinkToken");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_settings_userId_key" ON "notification_settings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "user_sessions_userId_lastActive_idx" ON "user_sessions"("userId", "lastActive");

-- CreateIndex
CREATE INDEX "user_sessions_expiresAt_idx" ON "user_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "strategy_recommendations_userId_status_idx" ON "strategy_recommendations"("userId", "status");

-- CreateIndex
CREATE INDEX "strategy_recommendations_userId_viewed_idx" ON "strategy_recommendations"("userId", "viewed");

-- CreateIndex
CREATE INDEX "variance_alerts_userId_resolved_idx" ON "variance_alerts"("userId", "resolved");

-- CreateIndex
CREATE INDEX "variance_alerts_userId_type_idx" ON "variance_alerts"("userId", "type");

-- CreateIndex
CREATE INDEX "category_learnings_userId_category_idx" ON "category_learnings"("userId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "category_learnings_userId_pattern_key" ON "category_learnings"("userId", "pattern");

-- CreateIndex
CREATE INDEX "account_classifications_userId_ledgerType_idx" ON "account_classifications"("userId", "ledgerType");

-- CreateIndex
CREATE UNIQUE INDEX "account_classifications_userId_accountId_key" ON "account_classifications"("userId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "api_configurations_userId_key" ON "api_configurations"("userId");

-- CreateIndex
CREATE INDEX "customers_userId_loyaltyLevel_idx" ON "customers"("userId", "loyaltyLevel");

-- CreateIndex
CREATE INDEX "customers_userId_lastPurchaseAt_idx" ON "customers"("userId", "lastPurchaseAt");

-- CreateIndex
CREATE INDEX "customer_interactions_customerId_interactionAt_idx" ON "customer_interactions"("customerId", "interactionAt");

-- CreateIndex
CREATE INDEX "ledgers_userId_isActive_idx" ON "ledgers"("userId", "isActive");

-- CreateIndex
CREATE INDEX "ledgers_type_balance_idx" ON "ledgers"("type", "balance");

-- CreateIndex
CREATE UNIQUE INDEX "ledgers_userId_type_key" ON "ledgers"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_externalId_key" ON "transactions"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_creditEntryId_key" ON "transactions"("creditEntryId");

-- CreateIndex
CREATE INDEX "transactions_userId_timestamp_idx" ON "transactions"("userId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "transactions_userId_type_idx" ON "transactions"("userId", "type");

-- CreateIndex
CREATE INDEX "transactions_externalId_userId_idx" ON "transactions"("externalId", "userId");

-- CreateIndex
CREATE INDEX "transactions_isDeleted_idx" ON "transactions"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "credit_entries_transactionId_key" ON "credit_entries"("transactionId");

-- CreateIndex
CREATE INDEX "credit_entries_userId_status_idx" ON "credit_entries"("userId", "status");

-- CreateIndex
CREATE INDEX "credit_entries_userId_dueDate_idx" ON "credit_entries"("userId", "dueDate");

-- CreateIndex
CREATE INDEX "credit_entries_status_dueDate_idx" ON "credit_entries"("status", "dueDate");

-- CreateIndex
CREATE INDEX "credit_entries_isDeleted_idx" ON "credit_entries"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "business_profiles_userId_key" ON "business_profiles"("userId");

-- CreateIndex
CREATE INDEX "products_businessProfileId_isActive_idx" ON "products"("businessProfileId", "isActive");

-- CreateIndex
CREATE INDEX "product_price_history_productId_effectiveAt_idx" ON "product_price_history"("productId", "effectiveAt");

-- CreateIndex
CREATE INDEX "competitor_prices_productId_recordedAt_idx" ON "competitor_prices"("productId", "recordedAt");

-- CreateIndex
CREATE INDEX "procurement_options_supplierId_isActive_idx" ON "procurement_options"("supplierId", "isActive");

-- CreateIndex
CREATE INDEX "raw_materials_businessProfileId_isActive_idx" ON "raw_materials"("businessProfileId", "isActive");

-- CreateIndex
CREATE INDEX "inventory_transactions_materialId_transactionAt_idx" ON "inventory_transactions"("materialId", "transactionAt");

-- CreateIndex
CREATE INDEX "goals_userId_status_idx" ON "goals"("userId", "status");

-- CreateIndex
CREATE INDEX "goals_userId_category_idx" ON "goals"("userId", "category");

-- CreateIndex
CREATE INDEX "goals_userId_priority_idx" ON "goals"("userId", "priority");

-- CreateIndex
CREATE INDEX "goals_isDeleted_idx" ON "goals"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "economic_indicators_code_key" ON "economic_indicators"("code");

-- CreateIndex
CREATE INDEX "economic_indicators_category_idx" ON "economic_indicators"("category");

-- CreateIndex
CREATE INDEX "economic_indicators_code_idx" ON "economic_indicators"("code");

-- CreateIndex
CREATE INDEX "economic_news_publishedAt_idx" ON "economic_news"("publishedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "economic_events_code_key" ON "economic_events"("code");

-- CreateIndex
CREATE INDEX "economic_events_eventDate_idx" ON "economic_events"("eventDate");

-- CreateIndex
CREATE INDEX "insights_userId_status_idx" ON "insights"("userId", "status");

-- CreateIndex
CREATE INDEX "insights_userId_severity_idx" ON "insights"("userId", "severity");

-- CreateIndex
CREATE INDEX "insights_userId_isPinned_idx" ON "insights"("userId", "isPinned");

-- CreateIndex
CREATE UNIQUE INDEX "interpretation_rules_code_key" ON "interpretation_rules"("code");

-- CreateIndex
CREATE UNIQUE INDEX "insight_templates_ruleCode_name_key" ON "insight_templates"("ruleCode", "name");

-- CreateIndex
CREATE UNIQUE INDEX "user_threshold_settings_userId_key" ON "user_threshold_settings"("userId");

-- CreateIndex
CREATE INDEX "economic_data_cache_type_expiresAt_idx" ON "economic_data_cache"("type", "expiresAt");

-- CreateIndex
CREATE INDEX "economic_data_cache_type_isActive_idx" ON "economic_data_cache"("type", "isActive");

-- CreateIndex
CREATE INDEX "economic_data_cache_expiresAt_idx" ON "economic_data_cache"("expiresAt");

-- CreateIndex
CREATE INDEX "category_rules_userId_pattern_idx" ON "category_rules"("userId", "pattern");

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_recommendations" ADD CONSTRAINT "strategy_recommendations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variance_alerts" ADD CONSTRAINT "variance_alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_learnings" ADD CONSTRAINT "category_learnings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_classifications" ADD CONSTRAINT "account_classifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_configurations" ADD CONSTRAINT "api_configurations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_interactions" ADD CONSTRAINT "customer_interactions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledgers" ADD CONSTRAINT "ledgers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_creditEntryId_fkey" FOREIGN KEY ("creditEntryId") REFERENCES "credit_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "ledgers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_entries" ADD CONSTRAINT "credit_entries_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "ledgers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_entries" ADD CONSTRAINT "credit_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_entries" ADD CONSTRAINT "credit_entries_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_creditEntryId_fkey" FOREIGN KEY ("creditEntryId") REFERENCES "credit_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_creditEntryId_fkey" FOREIGN KEY ("creditEntryId") REFERENCES "credit_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_items" ADD CONSTRAINT "credit_items_creditEntryId_fkey" FOREIGN KEY ("creditEntryId") REFERENCES "credit_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_profiles" ADD CONSTRAINT "business_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_price_history" ADD CONSTRAINT "product_price_history_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitor_prices" ADD CONSTRAINT "competitor_prices_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_products" ADD CONSTRAINT "supplier_products_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_discounts" ADD CONSTRAINT "supplier_discounts_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_options" ADD CONSTRAINT "procurement_options_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_materials" ADD CONSTRAINT "raw_materials_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "raw_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "ledgers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
