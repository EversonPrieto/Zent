import { api } from './api';

export type Permissions = {
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER' | null;
  canCreateProject: boolean;
  canUpdateProject: boolean;
  canDeleteWorkspace: boolean;
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canEditTasks: boolean;
};

export async function getWorkspacePermissions(workspaceId: string): Promise<Permissions> {
  try {
    return await api(`/workspaces/permissions/${workspaceId}`, {
      workspaceId,
    });
  } catch (error) {
    console.error('Erro ao obter permissões:', error);
    return {
      role: null,
      canCreateProject: false,
      canUpdateProject: false,
      canDeleteWorkspace: false,
      canInviteMembers: false,
      canRemoveMembers: false,
      canEditTasks: false,
    };
  }
}

export async function canCreateProject(workspaceId: string): Promise<boolean> {
  const perms = await getWorkspacePermissions(workspaceId);
  return perms.canCreateProject;
}

export async function canDeleteWorkspace(workspaceId: string): Promise<boolean> {
  const perms = await getWorkspacePermissions(workspaceId);
  return perms.canDeleteWorkspace;
}

export async function canInviteMembers(workspaceId: string): Promise<boolean> {
  const perms = await getWorkspacePermissions(workspaceId);
  return perms.canInviteMembers;
}

export async function canRemoveMembers(workspaceId: string): Promise<boolean> {
  const perms = await getWorkspacePermissions(workspaceId);
  return perms.canRemoveMembers;
}

export async function canEditTasks(workspaceId: string): Promise<boolean> {
  const perms = await getWorkspacePermissions(workspaceId);
  return perms.canEditTasks;
}
