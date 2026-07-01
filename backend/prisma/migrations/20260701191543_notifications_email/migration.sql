-- CreateEnum
CREATE TYPE "EmailDigestStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "EmailTaskMovedDigest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "lastTaskId" TEXT,
    "lastActionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "EmailDigestStatus" NOT NULL DEFAULT 'PENDING',
    "lastError" TEXT,
    "nextSendAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTaskMovedDigest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailTaskMovedDigest_workspaceId_userId_status_idx" ON "EmailTaskMovedDigest"("workspaceId", "userId", "status");

-- CreateIndex
CREATE INDEX "EmailTaskMovedDigest_nextSendAt_idx" ON "EmailTaskMovedDigest"("nextSendAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailTaskMovedDigest_workspaceId_userId_key" ON "EmailTaskMovedDigest"("workspaceId", "userId");
