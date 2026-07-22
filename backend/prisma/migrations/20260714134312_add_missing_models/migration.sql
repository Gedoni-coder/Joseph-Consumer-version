-- AlterTable
ALTER TABLE "users" ADD COLUMN "bio" TEXT;
ALTER TABLE "users" ADD COLUMN "dob" DATETIME;

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "darkMode" BOOLEAN NOT NULL DEFAULT false,
    "accentColor" TEXT NOT NULL DEFAULT 'navy',
    "fontSize" TEXT NOT NULL DEFAULT 'medium',
    "dateFormat" TEXT NOT NULL DEFAULT 'dmy',
    CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notification_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "lowBalanceThreshold" REAL NOT NULL DEFAULT 5000,
    "spendingAlert" BOOLEAN NOT NULL DEFAULT true,
    "goalUpdates" BOOLEAN NOT NULL DEFAULT true,
    "runwayWarning" BOOLEAN NOT NULL DEFAULT true,
    "creditReminders" BOOLEAN NOT NULL DEFAULT true,
    "economicAlerts" BOOLEAN NOT NULL DEFAULT true,
    "priceMovementAlerts" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "notification_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" DATETIME,
    CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "deviceInfo" TEXT,
    "deviceType" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "lastActive" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "strategy_recommendations" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "viewedAt" DATETIME,
    CONSTRAINT "strategy_recommendations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "variance_alerts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "impact" TEXT,
    "directive" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "variance_alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "category_learnings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "confidence" REAL NOT NULL DEFAULT 1.0,
    "usageCount" INTEGER NOT NULL DEFAULT 1,
    "lastUsed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "category_learnings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "account_classifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "ledgerType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "confidence" REAL NOT NULL DEFAULT 1.0,
    "usageCount" INTEGER NOT NULL DEFAULT 1,
    "lastUsed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "account_classifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "api_configurations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "newsApiKey" TEXT,
    "fmdqApiKey" TEXT,
    "commoditiesApiKey" TEXT,
    "cbnApiKey" TEXT,
    "useRealAPIs" BOOLEAN NOT NULL DEFAULT true,
    "useBackendAPI" BOOLEAN NOT NULL DEFAULT true,
    "dataRefreshInterval" INTEGER NOT NULL DEFAULT 3600,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "api_configurations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "loyaltyLevel" TEXT NOT NULL DEFAULT 'regular',
    "totalPurchases" REAL NOT NULL DEFAULT 0,
    "totalCredit" REAL NOT NULL DEFAULT 0,
    "lastPurchaseAt" DATETIME,
    "lastContactAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "customers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "customer_interactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "summary" TEXT,
    "notes" TEXT,
    "interactionAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "customer_interactions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_price_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "cost" REAL,
    "margin" REAL,
    "reason" TEXT,
    "effectiveAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_price_history_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "competitor_prices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "competitorName" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "competitor_prices_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "procurement_options" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cost" REAL NOT NULL,
    "unitCost" REAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT,
    "savingsPercent" REAL,
    "recommendation" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "procurement_options_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "inventory_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "materialId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unitCost" REAL,
    "totalCost" REAL,
    "reason" TEXT,
    "transactionAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_transactions_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "raw_materials" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_business_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
INSERT INTO "new_business_profiles" ("annualRevenueTarget", "businessDays", "businessName", "businessType", "competitiveAdvantage", "createdAt", "currency", "deletedAt", "fixedCosts", "id", "industry", "isComplete", "isDeleted", "lastPriceReview", "lastUpdated", "marketSegment", "monthlyRevenueTarget", "pricingFrequency", "pricingStrategy", "profitMarginTarget", "updatedAt", "userId", "variableCostRatio") SELECT "annualRevenueTarget", "businessDays", "businessName", "businessType", "competitiveAdvantage", "createdAt", "currency", "deletedAt", "fixedCosts", "id", "industry", "isComplete", "isDeleted", "lastPriceReview", "lastUpdated", "marketSegment", "monthlyRevenueTarget", "pricingFrequency", "pricingStrategy", "profitMarginTarget", "updatedAt", "userId", "variableCostRatio" FROM "business_profiles";
DROP TABLE "business_profiles";
ALTER TABLE "new_business_profiles" RENAME TO "business_profiles";
CREATE UNIQUE INDEX "business_profiles_userId_key" ON "business_profiles"("userId");
CREATE TABLE "new_credit_entries" (
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
    "customerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "credit_entries_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "ledgers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "credit_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "credit_entries_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_credit_entries" ("address", "amountOutstanding", "amountPaid", "createdAt", "creditPeriod", "customerName", "deletedAt", "dueDate", "email", "id", "isDeleted", "lastReminderSent", "ledgerId", "nextReminderDate", "notes", "paymentTerms", "phone", "priority", "reminderEnabled", "reminderFrequency", "resolvedAt", "resolvedBy", "riskLevel", "status", "tags", "totalCredit", "transactionId", "updatedAt", "userId") SELECT "address", "amountOutstanding", "amountPaid", "createdAt", "creditPeriod", "customerName", "deletedAt", "dueDate", "email", "id", "isDeleted", "lastReminderSent", "ledgerId", "nextReminderDate", "notes", "paymentTerms", "phone", "priority", "reminderEnabled", "reminderFrequency", "resolvedAt", "resolvedBy", "riskLevel", "status", "tags", "totalCredit", "transactionId", "updatedAt", "userId" FROM "credit_entries";
DROP TABLE "credit_entries";
ALTER TABLE "new_credit_entries" RENAME TO "credit_entries";
CREATE UNIQUE INDEX "credit_entries_transactionId_key" ON "credit_entries"("transactionId");
CREATE INDEX "credit_entries_userId_status_idx" ON "credit_entries"("userId", "status");
CREATE INDEX "credit_entries_userId_dueDate_idx" ON "credit_entries"("userId", "dueDate");
CREATE INDEX "credit_entries_status_dueDate_idx" ON "credit_entries"("status", "dueDate");
CREATE INDEX "credit_entries_isDeleted_idx" ON "credit_entries"("isDeleted");
CREATE TABLE "new_products" (
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
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "products_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "business_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_products" ("businessProfileId", "category", "cogs", "competitorName", "competitorPrice", "costLabor", "costOther", "costOverhead", "costPackaging", "costRawMaterials", "createdAt", "currentMargin", "currentPrice", "demandLevel", "id", "name", "priceElasticity", "sku", "targetMargin", "unit", "updatedAt") SELECT "businessProfileId", "category", "cogs", "competitorName", "competitorPrice", "costLabor", "costOther", "costOverhead", "costPackaging", "costRawMaterials", "createdAt", "currentMargin", "currentPrice", "demandLevel", "id", "name", "priceElasticity", "sku", "targetMargin", "unit", "updatedAt" FROM "products";
DROP TABLE "products";
ALTER TABLE "new_products" RENAME TO "products";
CREATE INDEX "products_businessProfileId_isActive_idx" ON "products"("businessProfileId", "isActive");
CREATE TABLE "new_raw_materials" (
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
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "raw_materials_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "business_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_raw_materials" ("businessProfileId", "createdAt", "currentPrice", "id", "lastPurchase", "monthlyUsage", "name", "reorderLevel", "stockOnHand", "supplierName", "unit", "updatedAt") SELECT "businessProfileId", "createdAt", "currentPrice", "id", "lastPurchase", "monthlyUsage", "name", "reorderLevel", "stockOnHand", "supplierName", "unit", "updatedAt" FROM "raw_materials";
DROP TABLE "raw_materials";
ALTER TABLE "new_raw_materials" RENAME TO "raw_materials";
CREATE INDEX "raw_materials_businessProfileId_isActive_idx" ON "raw_materials"("businessProfileId", "isActive");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

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
CREATE INDEX "product_price_history_productId_effectiveAt_idx" ON "product_price_history"("productId", "effectiveAt");

-- CreateIndex
CREATE INDEX "competitor_prices_productId_recordedAt_idx" ON "competitor_prices"("productId", "recordedAt");

-- CreateIndex
CREATE INDEX "procurement_options_supplierId_isActive_idx" ON "procurement_options"("supplierId", "isActive");

-- CreateIndex
CREATE INDEX "inventory_transactions_materialId_transactionAt_idx" ON "inventory_transactions"("materialId", "transactionAt");
