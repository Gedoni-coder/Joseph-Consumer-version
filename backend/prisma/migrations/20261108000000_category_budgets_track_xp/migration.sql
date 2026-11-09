ALTER TABLE "consumer_purchases"
  ADD COLUMN "category" TEXT NOT NULL DEFAULT 'uncategorized',
  ADD COLUMN "xpEligible" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE TABLE "consumer_category_budgets" (
  "userId" TEXT NOT NULL,
  "weekStart" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "amount" BIGINT NOT NULL CHECK ("amount" >= 0 AND "amount" <= 1000000000000),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "consumer_category_budgets_pkey" PRIMARY KEY ("userId", "weekStart", "category"),
  CONSTRAINT "consumer_category_budgets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "consumer_xp_entries" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "rule" TEXT NOT NULL,
  "sourceKey" TEXT NOT NULL,
  "revision" INTEGER NOT NULL,
  "weekStart" TEXT NOT NULL,
  "baseMilliXp" INTEGER NOT NULL,
  "boosterMilliXp" INTEGER NOT NULL DEFAULT 0,
  "rulesVersion" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "consumer_xp_entries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "consumer_xp_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "consumer_xp_entries_userId_rule_sourceKey_revision_key" ON "consumer_xp_entries"("userId", "rule", "sourceKey", "revision");
CREATE INDEX "consumer_xp_entries_userId_weekStart_idx" ON "consumer_xp_entries"("userId", "weekStart");
CREATE TABLE "consumer_weekly_reviews" (
  "userId" TEXT NOT NULL,
  "weekStart" TEXT NOT NULL,
  "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "consumer_weekly_reviews_pkey" PRIMARY KEY ("userId", "weekStart"),
  CONSTRAINT "consumer_weekly_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- SR
