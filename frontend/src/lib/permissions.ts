import { api } from './api';

export type Permissions = {
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER' | null;
  canCreateProject: boolean;
  canDeleteWorkspace: boolean;
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canEditTasks: boolean;
};

/**
 * Obtém as permissões do usuário para um workspace
 */
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
      canDeleteWorkspace: false,
      canInviteMembers: false,
      canRemoveMembers: false,
      canEditTasks: false,
    };
  }
}

/**
 * Verifica se o usuário pode criar projetos
 */
export async function canCreateProject(workspaceId: string): Promise<boolean> {
  const perms = await getWorkspacePermissions(workspaceId);
  return perms.canCreateProject;
}

/**
 * Verifica se o usuário pode deletar o workspace
 */
export async function canDeleteWorkspace(workspaceId: string): Promise<boolean> {
  const perms = await getWorkspacePermissions(workspaceId);
  return perms.canDeleteWorkspace;
}

/**
 * Verifica se o usuário pode convidar membros
 */
export async function canInviteMembers(workspaceId: string): Promise<boolean> {
  const perms = await getWorkspacePermissions(workspaceId);
  return perms.canInviteMembers;
}

/**
 * Verifica se o usuário pode remover membros
 */
export async function canRemoveMembers(workspaceId: string): Promise<boolean> {
  const perms = await getWorkspacePermissions(workspaceId);
  return perms.canRemoveMembers;
}

/**
 * Verifica se o usuário pode editar tasks
 */
export async function canEditTasks(workspaceId: string): Promise<boolean> {
  const perms = await getWorkspacePermissions(workspaceId);
  return perms.canEditTasks;
}
