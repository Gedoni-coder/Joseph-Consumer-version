/*
  Warnings:

  - You are about to drop the column `createdAt` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `revokedAt` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `token` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `refresh_tokens` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[token_hash]` on the table `refresh_tokens` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `expires_at` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `family_id` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token_hash` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RefreshTokenRevocationReason" AS ENUM ('ROTATED', 'LOGOUT', 'LOGOUT_ALL', 'PASSWORD_CHANGED', 'PASSWORD_RESET', 'ACCOUNT_SUSPENDED', 'TOKEN_REUSE');

-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_userId_fkey";

-- DropIndex
DROP INDEX "refresh_tokens_expiresAt_idx";

-- DropIndex
DROP INDEX "refresh_tokens_token_idx";

-- DropIndex
DROP INDEX "refresh_tokens_token_key";

-- AlterTable
ALTER TABLE "refresh_tokens" DROP COLUMN "createdAt",
DROP COLUMN "expiresAt",
DROP COLUMN "revokedAt",
DROP COLUMN "token",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expires_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "family_id" TEXT NOT NULL,
ADD COLUMN     "replaced_by_token_id" TEXT,
ADD COLUMN     "revocation_reason" "RefreshTokenRevocationReason",
ADD COLUMN     "revoked_at" TIMESTAMP(3),
ADD COLUMN     "token_hash" TEXT NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_family_id_idx" ON "refresh_tokens"("family_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_replaced_by_token_id_fkey" FOREIGN KEY ("replaced_by_token_id") REFERENCES "refresh_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;
