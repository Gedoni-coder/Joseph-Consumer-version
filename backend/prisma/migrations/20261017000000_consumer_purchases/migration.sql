CREATE TABLE "consumer_purchases" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "amount" BIGINT NOT NULL CHECK ("amount" > 0 AND "amount" <= 1000000000000),
  "occurredOn" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "consumer_purchases_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "consumer_purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "consumer_purchases_userId_requestId_key" ON "consumer_purchases"("userId", "requestId");
CREATE INDEX "consumer_purchases_userId_occurredOn_createdAt_idx" ON "consumer_purchases"("userId", "occurredOn", "createdAt");
