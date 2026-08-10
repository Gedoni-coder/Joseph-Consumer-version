-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLogin" DATETIME,
    "lastActivity" DATETIME,
    "resetPasswordToken" TEXT,
    "resetPasswordExpires" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "onboardingStep" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "language" TEXT NOT NULL DEFAULT 'en',
    "notifications" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "ledgers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "balance" REAL NOT NULL DEFAULT 0,
    "totalIncome" REAL NOT NULL DEFAULT 0,
    "totalExpenses" REAL NOT NULL DEFAULT 0,
    "netCashFlow" REAL NOT NULL DEFAULT 0,
    "runwayDays" INTEGER NOT NULL DEFAULT 0,
    "monthlyBudget" REAL,
    "budgetNeeds" REAL NOT NULL DEFAULT 0,
    "budgetWants" REAL NOT NULL DEFAULT 0,
    "budgetSavings" REAL NOT NULL DEFAULT 0,
    "spentNeeds" REAL NOT NULL DEFAULT 0,
    "spentWants" REAL NOT NULL DEFAULT 0,
    "spentSavings" REAL NOT NULL DEFAULT 0,
    "burnRate" REAL NOT NULL DEFAULT 0,
    "workingCapital" REAL NOT NULL DEFAULT 0,
    "availableCapital" REAL NOT NULL DEFAULT 0,
    "workingCapitalTarget" REAL,
    "reinvestmentRatio" REAL NOT NULL DEFAULT 0.4,
    "businessTotalSales" REAL NOT NULL DEFAULT 0,
    "businessTotalExpenses" REAL NOT NULL DEFAULT 0,
    "businessNetProfit" REAL NOT NULL DEFAULT 0,
    "businessProfitMargin" REAL NOT NULL DEFAULT 0,
    "businessAvgTransaction" REAL NOT NULL DEFAULT 0,
    "businessTxnCount" INTEGER NOT NULL DEFAULT 0,
    "businessCreditSales" REAL NOT NULL DEFAULT 0,
    "businessCreditCount" INTEGER NOT NULL DEFAULT 0,
    "businessCollectionRate" REAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ledgers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "externalId" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'custom',
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "narration" TEXT,
    "description" TEXT,
    "timestamp" DATETIME NOT NULL,
    "accountId" TEXT,
    "accountName" TEXT,
    "merchant" TEXT,
    "beneficiary" TEXT,
    "balanceAfter" REAL,
    "balanceBefore" REAL,
    "category" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "isCreditSale" BOOLEAN NOT NULL DEFAULT false,
    "creditCustomer" TEXT,
    "creditPhone" TEXT,
    "creditDueDate" DATETIME,
    "splitWorkingCapital" REAL,
    "splitAvailable" REAL,
    "splitRatio" REAL,
    "fpnaProcessedAt" DATETIME,
    "fpnaSource" TEXT NOT NULL DEFAULT 'manual',
    "fpnaConfidence" REAL NOT NULL DEFAULT 0.5,
    "fpnaNeedsConfirm" BOOLEAN NOT NULL DEFAULT false,
    "fpnaReviewedAt" DATETIME,
    "creditEntryId" TEXT,
    "hasAttachment" BOOLEAN NOT NULL DEFAULT false,
    "attachmentUrl" TEXT,
    "attachmentType" TEXT,
    "notes" TEXT,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" DATETIME,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "deletedBy" TEXT,
    "batchId" TEXT,
    "importId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "transactions_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "ledgers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "transactions_creditEntryId_fkey" FOREIGN KEY ("creditEntryId") REFERENCES "credit_entries" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "credit_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "transactionId" TEXT,
    "customerName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "totalCredit" REAL NOT NULL,
    "amountPaid" REAL NOT NULL DEFAULT 0,
    "amountOutstanding" REAL NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "creditPeriod" INTEGER NOT NULL DEFAULT 7,
    "paymentTerms" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "resolvedAt" DATETIME,
    "resolvedBy" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reminderFrequency" INTEGER NOT NULL DEFAULT 3,
    "lastReminderSent" DATETIME,
    "nextReminderDate" DATETIME,
    "notes" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "credit_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "credit_entries_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "ledgers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creditEntryId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT NOT NULL DEFAULT 'CASH',
    "reference" TEXT,
    "notes" TEXT,
    "recordedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payments_creditEntryId_fkey" FOREIGN KEY ("creditEntryId") REFERENCES "credit_entries" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creditEntryId" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "response" TEXT,
    "nextReminder" DATETIME,
    CONSTRAINT "reminders_creditEntryId_fkey" FOREIGN KEY ("creditEntryId") REFERENCES "credit_entries" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "credit_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creditEntryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT,
    "unitPrice" REAL,
    "totalPrice" REAL,
    CONSTRAINT "credit_items_creditEntryId_fkey" FOREIGN KEY ("creditEntryId") REFERENCES "credit_entries" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "business_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "businessName" TEXT,
    "businessType" TEXT NOT NULL DEFAULT 'retail',
    "industry" TEXT,
    "pricingStrategy" TEXT NOT NULL DEFAULT 'cost_plus',
    "pricingFrequency" TEXT NOT NULL DEFAULT 'monthly',
    "lastPriceReview" DATETIME,
    "fixedCosts" REAL NOT NULL DEFAULT 0,
    "variableCostRatio" REAL NOT NULL DEFAULT 0.6,
    "monthlyRevenueTarget" REAL,
    "annualRevenueTarget" REAL,
    "profitMarginTarget" REAL NOT NULL DEFAULT 20,
    "marketSegment" TEXT NOT NULL DEFAULT 'mid_market',
    "competitiveAdvantage" TEXT,
    "businessDays" TEXT NOT NULL DEFAULT '["monday","tuesday","wednesday","thursday","friday","saturday"]',
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "business_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "category" TEXT NOT NULL DEFAULT 'finished_goods',
    "currentPrice" REAL NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'unit',
    "cogs" REAL NOT NULL DEFAULT 0,
    "costRawMaterials" REAL,
    "costLabor" REAL,
    "costPackaging" REAL,
    "costOverhead" REAL,
    "costOther" REAL,
    "targetMargin" REAL NOT NULL DEFAULT 20,
    "currentMargin" REAL NOT NULL DEFAULT 0,
    "competitorPrice" REAL,
    "competitorName" TEXT,
    "demandLevel" TEXT NOT NULL DEFAULT 'moderate',
    "priceElasticity" TEXT NOT NULL DEFAULT 'unit',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "products_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "business_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "paymentTerms" TEXT NOT NULL DEFAULT '30_days',
    "creditLimit" REAL,
    "reliability" TEXT NOT NULL DEFAULT 'medium',
    "rating" REAL NOT NULL DEFAULT 3,
    "leadTimeDays" INTEGER NOT NULL DEFAULT 7,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "suppliers_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "business_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "supplier_products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "unitPrice" REAL,
    "unit" TEXT,
    "moq" INTEGER,
    CONSTRAINT "supplier_products_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "supplier_discounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierId" TEXT NOT NULL,
    "minQty" INTEGER NOT NULL,
    "discountPercent" REAL NOT NULL,
    "description" TEXT,
    CONSTRAINT "supplier_discounts_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "raw_materials" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "currentPrice" REAL,
    "supplierName" TEXT,
    "monthlyUsage" REAL,
    "stockOnHand" REAL,
    "reorderLevel" REAL,
    "lastPurchase" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "raw_materials_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "business_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "ledgerId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "goalType" TEXT NOT NULL DEFAULT 'numeric',
    "targetValue" REAL,
    "currentValue" REAL NOT NULL DEFAULT 0,
    "unit" TEXT,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME NOT NULL,
    "progress" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "importance" TEXT NOT NULL DEFAULT 'should_have',
    "outcomeNotes" TEXT,
    "outcomeRating" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "goals_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "ledgers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "goalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetValue" REAL,
    "currentValue" REAL NOT NULL DEFAULT 0,
    "unit" TEXT,
    "dueDate" DATETIME,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "milestones_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "action_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "goalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignedTo" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dueDate" DATETIME,
    "completedAt" DATETIME,
    "estimatedCost" REAL,
    "actualCost" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "action_items_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "economic_indicators" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "unit" TEXT,
    "change" REAL,
    "changePercent" REAL,
    "trend" TEXT,
    "source" TEXT,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "thresholdLow" REAL,
    "thresholdHigh" REAL,
    "status" TEXT,
    "history" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "economic_news" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "source" TEXT,
    "url" TEXT,
    "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "impact" TEXT,
    "affectedSectors" TEXT NOT NULL DEFAULT '[]',
    "relevance" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "economic_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" DATETIME NOT NULL,
    "category" TEXT,
    "importance" TEXT,
    "expectedValue" REAL,
    "actualValue" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "insights" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "validUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "interpretation_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "indicatorCode" TEXT,
    "conditionType" TEXT NOT NULL,
    "operator" TEXT,
    "thresholdValue" REAL,
    "insightTemplate" TEXT NOT NULL,
    "severity" TEXT,
    "recommendedAction" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "insight_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ruleCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "titleTemplate" TEXT NOT NULL,
    "bodyTemplate" TEXT NOT NULL,
    "actionTemplate" TEXT,
    "variables" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_threshold_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "customThresholds" TEXT,
    "notifyOnThreshold" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnNewEvents" BOOLEAN NOT NULL DEFAULT true,
    "notificationMethods" TEXT NOT NULL DEFAULT '["in_app"]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "economic_data_cache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'cached',
    "sourceUrl" TEXT,
    "apiProvider" TEXT,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "lastRefreshedAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isStale" BOOLEAN NOT NULL DEFAULT false,
    "cacheHit" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" DATETIME,
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "category_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "confidence" REAL NOT NULL DEFAULT 1,
    "usageCount" INTEGER NOT NULL DEFAULT 1,
    "lastUsed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

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
