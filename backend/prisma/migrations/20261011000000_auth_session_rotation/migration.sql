-- Additive session-family metadata. Historical tokens have no session binding
-- and are rejected by the new service. Users must sign in again after rollout.
ALTER TABLE "user_sessions" ADD COLUMN "revokedAt" TIMESTAMP(3);
ALTER TABLE "refresh_tokens" ADD COLUMN "sessionId" TEXT;
ALTER TABLE "refresh_tokens" ADD COLUMN "parentId" TEXT;
CREATE UNIQUE INDEX "refresh_tokens_parentId_key" ON "refresh_tokens"("parentId");
CREATE INDEX "refresh_tokens_userId_sessionId_idx" ON "refresh_tokens"("userId", "sessionId");
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "user_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "refresh_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;
