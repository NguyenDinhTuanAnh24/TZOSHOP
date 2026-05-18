/*
  Warnings:

  - You are about to drop the column `cacheCreditMultiplier` on the `AiModel` table. All the data in the column will be lost.
  - You are about to drop the column `inputCreditMultiplier` on the `AiModel` table. All the data in the column will be lost.
  - You are about to drop the column `outputCreditMultiplier` on the `AiModel` table. All the data in the column will be lost.
  - You are about to drop the column `upstreamName` on the `AiModel` table. All the data in the column will be lost.
  - You are about to drop the `ProviderKey` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[payosOrderCode]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `providerId` to the `AiModel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `upstreamModel` to the `AiModel` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CouponScope" AS ENUM ('GLOBAL', 'ASSIGNED');

-- CreateEnum
CREATE TYPE "UpstreamEndpointType" AS ENUM ('CHAT_COMPLETIONS', 'RESPONSES');

-- AlterEnum
ALTER TYPE "CreditLedgerType" ADD VALUE 'ADMIN_GRANT';

-- AlterTable
ALTER TABLE "AiModel" DROP COLUMN "cacheCreditMultiplier",
DROP COLUMN "inputCreditMultiplier",
DROP COLUMN "outputCreditMultiplier",
DROP COLUMN "upstreamName",
ADD COLUMN     "inputCreditRate" DECIMAL(65,30) NOT NULL DEFAULT 1,
ADD COLUMN     "outputCreditRate" DECIMAL(65,30) NOT NULL DEFAULT 1,
ADD COLUMN     "providerId" TEXT NOT NULL,
ADD COLUMN     "supportsAgent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "supportsStreaming" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "supportsTools" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "upstreamEndpointType" "UpstreamEndpointType" NOT NULL DEFAULT 'CHAT_COMPLETIONS',
ADD COLUMN     "upstreamModel" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "CreditBucket" ADD COLUMN     "expiringSoonAlertSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lowCreditsAlertSent" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "expiresAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "CreditLedger" ADD COLUMN     "note" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "couponCode" TEXT,
ADD COLUMN     "couponId" TEXT,
ADD COLUMN     "discountAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "originalAmount" INTEGER,
ADD COLUMN     "paymentExpiredAt" TIMESTAMP(3),
ADD COLUMN     "payosCheckoutUrl" TEXT,
ADD COLUMN     "payosOrderCode" BIGINT,
ADD COLUMN     "payosPaymentLinkId" TEXT,
ADD COLUMN     "payosQrCode" TEXT,
ADD COLUMN     "payosStatus" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "isContactOnly" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "durationDays" DROP NOT NULL;

-- AlterTable
ALTER TABLE "UsageLog" ADD COLUMN     "creditsUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "errorCode" TEXT,
ADD COLUMN     "httpStatus" INTEGER,
ALTER COLUMN "status" SET DEFAULT 'SUCCESS';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lockedAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "ProviderKey";

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "discountPercent" INTEGER NOT NULL,
    "minOrderAmount" INTEGER NOT NULL DEFAULT 0,
    "maxDiscountVnd" INTEGER,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "scope" "CouponScope" NOT NULL DEFAULT 'GLOBAL',
    "usageLimitTotal" INTEGER,
    "usageLimitPerUser" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouponAssignment" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedById" TEXT,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouponAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouponRedemption" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "originalAmount" INTEGER NOT NULL,
    "discountAmount" INTEGER NOT NULL,
    "finalAmount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouponRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiFamily" "ApiFamily" NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "encryptedApiKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuthAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "email" TEXT,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OAuthAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "roleTarget" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "href" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "dedupeKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CouponAssignment_couponId_userId_key" ON "CouponAssignment"("couponId", "userId");

-- CreateIndex
CREATE INDEX "CouponRedemption_couponId_idx" ON "CouponRedemption"("couponId");

-- CreateIndex
CREATE INDEX "CouponRedemption_userId_idx" ON "CouponRedemption"("userId");

-- CreateIndex
CREATE INDEX "CouponRedemption_orderId_idx" ON "CouponRedemption"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccount_provider_providerAccountId_key" ON "OAuthAccount"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccount_userId_provider_key" ON "OAuthAccount"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");

-- CreateIndex
CREATE INDEX "AuditLog_adminUserId_idx" ON "AuditLog"("adminUserId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_roleTarget_idx" ON "Notification"("roleTarget");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_dedupeKey_idx" ON "Notification"("dedupeKey");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_userId_dedupeKey_key" ON "Notification"("userId", "dedupeKey");

-- CreateIndex
CREATE INDEX "AiModel_apiFamily_idx" ON "AiModel"("apiFamily");

-- CreateIndex
CREATE INDEX "AiModel_providerId_idx" ON "AiModel"("providerId");

-- CreateIndex
CREATE INDEX "AiModel_isActive_idx" ON "AiModel"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Order_payosOrderCode_key" ON "Order"("payosOrderCode");

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponAssignment" ADD CONSTRAINT "CouponAssignment_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponAssignment" ADD CONSTRAINT "CouponAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponAssignment" ADD CONSTRAINT "CouponAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiModel" ADD CONSTRAINT "AiModel_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "AiProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthAccount" ADD CONSTRAINT "OAuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
