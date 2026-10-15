-- CreateTable
CREATE TABLE "consumer_plans" (
    "userId" TEXT NOT NULL,
    "daily" BIGINT NOT NULL,
    "reserve" BIGINT NOT NULL,
    "horizon" INTEGER NOT NULL DEFAULT 30,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consumer_plans_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "money_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "balance" BIGINT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "money_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consumer_commitments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "dueDate" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consumer_commitments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_snapshots" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "engineVersion" TEXT NOT NULL,
    "rulesVersion" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "inputs" JSONB NOT NULL,
    "result" JSONB NOT NULL,

    CONSTRAINT "financial_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consumer_consents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consumer_consents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "money_accounts_userId_idx" ON "money_accounts"("userId");

-- CreateIndex
CREATE INDEX "consumer_commitments_userId_dueDate_idx" ON "consumer_commitments"("userId", "dueDate");

-- CreateIndex
CREATE INDEX "financial_snapshots_userId_generatedAt_idx" ON "financial_snapshots"("userId", "generatedAt");

-- CreateIndex
CREATE INDEX "consumer_consents_userId_createdAt_idx" ON "consumer_consents"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "consumer_plans" ADD CONSTRAINT "consumer_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "money_accounts" ADD CONSTRAINT "money_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumer_commitments" ADD CONSTRAINT "consumer_commitments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_snapshots" ADD CONSTRAINT "financial_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumer_consents" ADD CONSTRAINT "consumer_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
