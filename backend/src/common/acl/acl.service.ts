import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

@Injectable()
export class AclService {
  constructor(private prisma: PrismaService) {}

  private readonly permissions = {
    'project:create': ['ADMIN', 'OWNER'],
    'project:delete': ['ADMIN', 'OWNER'],
    'project:update': ['ADMIN', 'OWNER'],
    'workspace:delete': ['OWNER'],
    'workspace:invite': ['ADMIN', 'OWNER'],
    'workspace:update-member': ['ADMIN', 'OWNER'],
    'workspace:remove-member': ['ADMIN', 'OWNER'],
    'task:create': ['MEMBER', 'ADMIN', 'OWNER'],
    'task:edit': ['MEMBER', 'ADMIN', 'OWNER'],
    'task:delete': ['ADMIN', 'OWNER'],
    'task:move': ['MEMBER', 'ADMIN', 'OWNER'],
  };

  async getUserRoleInWorkspace(
    workspaceId: string,
    userId: string,
  ): Promise<Role | null> {
    const membership = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
      },
      select: { role: true },
    });

    return membership?.role || null;
  }

  async checkPermission(
    action: string,
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    const role = await this.getUserRoleInWorkspace(workspaceId, userId);

    if (!role) {
      throw new ForbiddenException('Você não pertence a este workspace.');
    }

    const allowedRoles = this.permissions[action];
    if (!allowedRoles) {
      throw new ForbiddenException('Ação desconhecida.');
    }

    if (!allowedRoles.includes(role)) {
      throw new ForbiddenException(
        `Você não tem permissão para ${this.getActionLabel(action)}.`,
      );
    }
  }

  async hasPermission(
    action: string,
    workspaceId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      await this.checkPermission(action, workspaceId, userId);
      return true;
    } catch {
      return false;
    }
  }

  async requirePermission(
    action: string,
    workspaceId: string,
    userId: string,
  ): Promise<Role> {
    const role = await this.getUserRoleInWorkspace(workspaceId, userId);

    if (!role) {
      throw new ForbiddenException('Você não pertence a este workspace.');
    }

    const allowedRoles = this.permissions[action];
    if (!allowedRoles || !allowedRoles.includes(role)) {
      throw new ForbiddenException(
        `Você não tem permissão para ${this.getActionLabel(action)}.`,
      );
    }

    return role;
  }

  async getUserPermissions(
    workspaceId: string,
    userId: string,
  ): Promise<{
    role: Role | null;
    canCreateProject: boolean;
    canUpdateProject: boolean;
    canDeleteWorkspace: boolean;
    canInviteMembers: boolean;
    canRemoveMembers: boolean;
    canEditTasks: boolean;
  }> {
    const role = await this.getUserRoleInWorkspace(workspaceId, userId);

    return {
      role,
      canCreateProject: role
        ? this.permissions['project:create'].includes(role)
        : false,
      canUpdateProject: role
        ? this.permissions['project:update'].includes(role)
        : false,
      canDeleteWorkspace: role
        ? this.permissions['workspace:delete'].includes(role)
        : false,
      canInviteMembers: role
        ? this.permissions['workspace:invite'].includes(role)
        : false,
      canRemoveMembers: role
        ? this.permissions['workspace:remove-member'].includes(role)
        : false,
      canEditTasks: role ? this.permissions['task:edit'].includes(role) : false,
    };
  }

  private getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      'project:create': 'criar projetos',
      'project:delete': 'deletar projetos',
      'project:update': 'atualizar projetos',
      'workspace:delete': 'deletar workspaces',
      'workspace:invite': 'convidar membros',
      'workspace:update-member': 'alterar roles de membros',
      'workspace:remove-member': 'remover membros',
      'task:create': 'criar tasks',
      'task:edit': 'editar tasks',
      'task:delete': 'deletar tasks',
      'task:move': 'mover tasks',
    };
    return labels[action] || action;
  }
}
