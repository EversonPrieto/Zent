-- DropForeignKey
ALTER TABLE "WorkspaceInvite" DROP CONSTRAINT "WorkspaceInvite_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "WorkspaceInvite" DROP CONSTRAINT "WorkspaceInvite_invitedById_fkey";

-- AddForeignKey
ALTER TABLE "WorkspaceInvite" ADD CONSTRAINT "WorkspaceInvite_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceInvite" ADD CONSTRAINT "WorkspaceInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
