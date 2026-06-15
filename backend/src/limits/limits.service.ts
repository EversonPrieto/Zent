import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type PlanType = 'free' | 'pro';

export interface PlanLimits {
  workspaces: number;
  projectsPerWorkspace: number;
  tasksPerProject: number;
  teamMembers: number;
  storageGB: number;
}

const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    workspaces: 1,
    projectsPerWorkspace: 3,
    tasksPerProject: 50,
    teamMembers: 5,
    storageGB: 1,
  },
  pro: {
    workspaces: 10,
    projectsPerWorkspace: 100,
    tasksPerProject: 10000,
    teamMembers: 50,
    storageGB: 100,
  },
};

@Injectable()
export class LimitsService {
  constructor(private prisma: PrismaService) {}

  private getPlanLimits(plan: PlanType): PlanLimits {
    return PLAN_LIMITS[plan];
  }

  async checkWorkspaceLimit(userId: string): Promise<void> {
    try {
      console.log(
        `[LimitsService] Checking workspace limit for user: ${userId}`,
      );

      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new BadRequestException('Usuário não encontrado');
      }

      console.log(`[LimitsService] User plan: ${user.plan}`);

      const plan = (user.plan || 'free') as PlanType;
      const limits = this.getPlanLimits(plan);

      const count = await this.prisma.workspaceMember.count({
        where: { userId, workspace: { members: { some: { role: 'OWNER' } } } },
      });

      console.log(
        `[LimitsService] User workspaces (owned): ${count}, limit: ${limits.workspaces}`,
      );

      if (count >= limits.workspaces) {
        throw new BadRequestException(
          `Você atingiu o limite de ${limits.workspaces} workspace(s) do plano ${plan}. Upgrade para Pro para ter mais!`,
        );
      }

      console.log(`[LimitsService] Workspace limit check passed`);
    } catch (error) {
      console.error(`[LimitsService] Error in checkWorkspaceLimit:`, error);
      throw error;
    }
  }

  async checkProjectLimit(userId: string, workspaceId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Usuário não encontrado');
    }

    const plan = (user.plan || 'free') as PlanType;
    const limits = this.getPlanLimits(plan);

    // Verify user has access to workspace
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });

    if (!membership) {
      throw new BadRequestException('Você não tem acesso a este workspace');
    }

    const count = await this.prisma.project.count({
      where: { workspaceId },
    });

    if (count >= limits.projectsPerWorkspace) {
      throw new BadRequestException(
        `Você atingiu o limite de ${limits.projectsPerWorkspace} projeto(s) por workspace. Upgrade para Pro para ter mais!`,
      );
    }
  }

  async checkTaskLimit(userId: string, projectId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Usuário não encontrado');
    }

    const plan = (user.plan || 'free') as PlanType;
    const limits = this.getPlanLimits(plan);

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { workspace: { include: { members: true } } },
    });

    if (!project) {
      throw new BadRequestException('Projeto não encontrado');
    }

    const count = await this.prisma.task.count({
      where: { projectId },
    });

    if (count >= limits.tasksPerProject) {
      throw new BadRequestException(
        `Você atingiu o limite de ${limits.tasksPerProject} tarefa(s) por projeto. Upgrade para Pro para ter mais!`,
      );
    }
  }

  async checkTeamMemberLimit(
    userId: string,
    workspaceId: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Usuário não encontrado');
    }

    const plan = (user.plan || 'free') as PlanType;
    const limits = this.getPlanLimits(plan);

    // Verify user has access to workspace
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });

    if (!membership) {
      throw new BadRequestException('Você não tem acesso a este workspace');
    }

    const count = await this.prisma.workspaceMember.count({
      where: { workspaceId },
    });

    if (count >= limits.teamMembers) {
      throw new BadRequestException(
        `Você atingiu o limite de ${limits.teamMembers} membro(s) da equipe. Upgrade para Pro para ter mais!`,
      );
    }
  }

  async getUserPlanLimits(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Usuário não encontrado');
    }

    const plan = (user.plan || 'free') as PlanType;
    return this.getPlanLimits(plan);
  }

  async getUserUsage(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Usuário não encontrado');
    }

    const workspaceCount = await this.prisma.workspaceMember.count({
      where: { userId, workspace: { members: { some: { role: 'OWNER' } } } },
    });

    const workspaces = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: { workspace: true },
    });

    const projectCounts: Record<string, number> = {};
    const taskCounts: Record<string, number> = {};

    for (const ws of workspaces) {
      const projectCount = await this.prisma.project.count({
        where: { workspaceId: ws.workspaceId },
      });
      projectCounts[ws.workspaceId] = projectCount;

      const projects = await this.prisma.project.findMany({
        where: { workspaceId: ws.workspaceId },
        select: { id: true },
      });

      for (const project of projects) {
        const taskCount = await this.prisma.task.count({
          where: { projectId: project.id },
        });
        taskCounts[project.id] = taskCount;
      }
    }

    return {
      workspaces: workspaceCount,
      workspaceDetails: workspaces.map((ws) => ({
        id: ws.workspaceId,
        name: ws.workspace.name,
        projects: projectCounts[ws.workspaceId] || 0,
        members: workspaces.filter((m) => m.workspaceId === ws.workspaceId)
          .length,
      })),
      totalProjects: Object.values(projectCounts).reduce((a, b) => a + b, 0),
      totalTasks: Object.values(taskCounts).reduce((a, b) => a + b, 0),
    };
  }
}
