import { Injectable } from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityGateway } from './activity.gateway';

type CreateActivityInput = {
  type: ActivityType;
  description: string;
  workspaceId: string;
  projectId?: string;
  taskId?: string;
  userId?: string;
};

@Injectable()
export class ActivityService {
  constructor(
    private prisma: PrismaService,
    private gateway: ActivityGateway,
  ) {}

  async create(data: CreateActivityInput) {
    try {
      const activity = await this.prisma.activityLog.create({
        data,
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      });

      console.log('🔥 activity criada:', activity);

      this.gateway.emitActivity(data.workspaceId, activity);

      return activity;
    } catch (err) {
      console.error('❌ erro ao criar activity:', err);
      throw err;
    }
  }

  async list(workspaceId: string, projectId?: string, taskId?: string) {
    const items = await this.prisma.activityLog.findMany({
      where: {
        workspaceId,
        ...(projectId ? { projectId } : {}),
        ...(taskId ? { taskId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    return { items };
  }

  async listByWorkspace(workspaceId: string, projectId?: string) {
    const items = await this.prisma.activityLog.findMany({
      where: {
        workspaceId,
        ...(projectId ? { projectId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    return { items }; // ⚠️ IMPORTANTE pro frontend
  }
}