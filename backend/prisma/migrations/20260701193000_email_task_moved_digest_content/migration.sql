-- Alterações para armazenar conteúdo do digest de TASK_MOVED
ALTER TABLE "EmailTaskMovedDigest"
ADD COLUMN IF NOT EXISTS "lastTaskTitle" TEXT;
ALTER TABLE "EmailTaskMovedDigest"
ADD COLUMN IF NOT EXISTS "actorName" TEXT;
ALTER TABLE "EmailTaskMovedDigest"
ADD COLUMN IF NOT EXISTS "fromStatus" TEXT NOT NULL DEFAULT '—';
ALTER TABLE "EmailTaskMovedDigest"
ADD COLUMN IF NOT EXISTS "toStatus" TEXT NOT NULL DEFAULT '—';
