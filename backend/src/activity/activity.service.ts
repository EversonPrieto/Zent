import { Injectable } from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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
  constructor(private prisma: PrismaService) {}

  async create(data: CreateActivityInput) {
    return this.prisma.activityLog.create({
      data,
    });
  }

  async listByWorkspace(workspaceId: string) {
    return this.prisma.activityLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        project: {
          select: { id: true, name: true },
        },
        task: {
          select: { id: true, title: true, status: true },
        },
      },
    });
  }
}