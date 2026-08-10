-- CreateEnum
CREATE TYPE "MonitorCheckResult" AS ENUM ('UP', 'DOWN');

-- CreateEnum
CREATE TYPE "MonitorCheckFailureReason" AS ENUM ('HTTP_STATUS', 'TIMEOUT', 'DNS', 'CONNECTION', 'TLS', 'REDIRECT', 'BLOCKED_TARGET');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MonitorStatus" ADD VALUE 'UP';
ALTER TYPE "MonitorStatus" ADD VALUE 'DOWN';

-- AlterTable
ALTER TABLE "Monitor" ADD COLUMN     "lastCheckedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "MonitorCheck" (
    "id" UUID NOT NULL,
    "result" "MonitorCheckResult" NOT NULL,
    "failureReason" "MonitorCheckFailureReason",
    "targetUrl" TEXT NOT NULL,
    "httpStatusCode" INTEGER,
    "responseTimeMs" INTEGER NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL,
    "errorMessage" TEXT,
    "monitorId" UUID NOT NULL,

    CONSTRAINT "MonitorCheck_pkey" PRIMARY KEY ("id")
);

-- Keep completed check rows internally consistent even if a future worker
-- writes outside the Nest service.
ALTER TABLE "MonitorCheck"
    ADD CONSTRAINT "MonitorCheck_targetUrl_length_check"
        CHECK (char_length("targetUrl") BETWEEN 1 AND 2048),
    ADD CONSTRAINT "MonitorCheck_responseTimeMs_nonnegative_check"
        CHECK ("responseTimeMs" >= 0),
    ADD CONSTRAINT "MonitorCheck_httpStatusCode_range_check"
        CHECK ("httpStatusCode" IS NULL OR "httpStatusCode" BETWEEN 100 AND 599),
    ADD CONSTRAINT "MonitorCheck_result_consistency_check"
        CHECK (
            ("result" = 'UP' AND "failureReason" IS NULL AND "httpStatusCode" BETWEEN 200 AND 399)
            OR
            ("result" = 'DOWN' AND "failureReason" IS NOT NULL)
        ),
    ADD CONSTRAINT "MonitorCheck_httpFailure_status_check"
        CHECK ("failureReason" IS DISTINCT FROM 'HTTP_STATUS' OR "httpStatusCode" BETWEEN 400 AND 599),
    ADD CONSTRAINT "MonitorCheck_errorMessage_length_check"
        CHECK ("errorMessage" IS NULL OR char_length("errorMessage") <= 500);

-- CreateIndex
CREATE INDEX "MonitorCheck_monitorId_checkedAt_idx" ON "MonitorCheck"("monitorId", "checkedAt" DESC);

-- AddForeignKey
ALTER TABLE "MonitorCheck" ADD CONSTRAINT "MonitorCheck_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
