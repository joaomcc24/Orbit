-- CreateEnum
CREATE TYPE "MonitorStatus" AS ENUM ('PENDING');

-- CreateTable
CREATE TABLE "Monitor" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "interval" INTEGER NOT NULL,
    "status" "MonitorStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workspaceId" UUID NOT NULL,

    CONSTRAINT "Monitor_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Monitor_interval_check" CHECK ("interval" IN (30, 60, 300))
);

-- CreateIndex
CREATE INDEX "Monitor_workspaceId_idx" ON "Monitor"("workspaceId");

-- AddForeignKey
ALTER TABLE "Monitor" ADD CONSTRAINT "Monitor_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
