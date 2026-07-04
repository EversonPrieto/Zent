import { Injectable, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type PermissionAction =
  | 'project:create'
  | 'project:delete'
  | 'project:update'
  | 'workspace:delete'
  | 'workspace:invite'
  | 'workspace:update-member'
  | 'workspace:remove-member'
  | 'task:create'
  | 'task:edit'
  | 'task:delete'
  | 'task:move';

@Injectable()
export class AclService {
  constructor(private prisma: PrismaService) {}

  private readonly permissions: Record<PermissionAction, Role[]> = {
    'project:create': [Role.ADMIN, Role.OWNER],
    'project:delete': [Role.ADMIN, Role.OWNER],
    'project:update': [Role.ADMIN, Role.OWNER],

    'workspace:delete': [Role.OWNER],
    'workspace:invite': [Role.ADMIN, Role.OWNER],
    'workspace:update-member': [Role.ADMIN, Role.OWNER],
    'workspace:remove-member': [Role.ADMIN, Role.OWNER],

    'task:create': [Role.MEMBER, Role.ADMIN, Role.OWNER],
    'task:edit': [Role.MEMBER, Role.ADMIN, Role.OWNER],
    'task:delete': [Role.ADMIN, Role.OWNER],
    'task:move': [Role.MEMBER, Role.ADMIN, Role.OWNER],
  };

  async getUserRoleInWorkspace(
    workspaceId: string,
    userId: string,
  ): Promise<Role | null> {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      select: {
        role: true,
      },
    });

    return membership?.role ?? null;
  }

  async checkPermission(
    action: PermissionAction,
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    const role = await this.getUserRoleInWorkspace(workspaceId, userId);

    if (!role) {
      throw new ForbiddenException('Você não pertence a este workspace.');
    }

    const allowedRoles = this.permissions[action];

    if (!allowedRoles.includes(role)) {
      throw new ForbiddenException(
        `Você não tem permissão para ${this.getActionLabel(action)}.`,
      );
    }
  }

  async hasPermission(
    action: PermissionAction,
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
    action: PermissionAction,
    workspaceId: string,
    userId: string,
  ): Promise<Role> {
    const role = await this.getUserRoleInWorkspace(workspaceId, userId);

    if (!role) {
      throw new ForbiddenException('Você não pertence a este workspace.');
    }

    const allowedRoles = this.permissions[action];

    if (!allowedRoles.includes(role)) {
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
    canDeleteProject: boolean;
    canDeleteWorkspace: boolean;
    canInviteMembers: boolean;
    canRemoveMembers: boolean;
    canEditTasks: boolean;
    canDeleteTasks: boolean;
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
      canDeleteProject: role
        ? this.permissions['project:delete'].includes(role)
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
      canDeleteTasks: role
        ? this.permissions['task:delete'].includes(role)
        : false,
    };
  }

  private getActionLabel(action: PermissionAction): string {
    const labels: Record<PermissionAction, string> = {
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

    return labels[action];
  }
}