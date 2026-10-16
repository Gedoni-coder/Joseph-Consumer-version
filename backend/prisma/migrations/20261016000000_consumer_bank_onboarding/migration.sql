CREATE TABLE "consumer_bank_link_sessions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "codeHash" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "consumer_bank_link_sessions_codeHash_key" ON "consumer_bank_link_sessions"("codeHash");
CREATE INDEX "consumer_bank_link_sessions_userId_idx" ON "consumer_bank_link_sessions"("userId");
CREATE TABLE "consumer_bank_connections" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "providerAccountId" TEXT NOT NULL,
  "bankName" TEXT NOT NULL DEFAULT 'Connected bank',
  "accountName" TEXT NOT NULL DEFAULT '',
  "last4" TEXT NOT NULL DEFAULT '',
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "balance" BIGINT,
  "status" TEXT NOT NULL DEFAULT 'processing',
  "sandbox" BOOLEAN NOT NULL DEFAULT true,
  "syncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "consumer_bank_connections_providerAccountId_key" ON "consumer_bank_connections"("providerAccountId");
CREATE INDEX "consumer_bank_connections_userId_idx" ON "consumer_bank_connections"("userId");
