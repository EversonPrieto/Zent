import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { ActivityService } from '../activity/activity.service';
import { AclService } from 'src/common/acl/acl.service';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private activity: ActivityService,
    private acl: AclService,
  ) {}

  async create(workspaceId: string, dto: CreateProjectDto, userId?: string) {
    // Usa ACL para verificar permissão (ADMIN + OWNER podem criar projetos)
    if (userId) {
      await this.acl.requirePermission('project:create', workspaceId, userId);
    }

    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        workspaceId,
      },
    });

    await this.activity.create({
      type: ActivityType.PROJECT_CREATED,
      description: `Projeto "${project.name}" foi criado`,
      workspaceId,
      projectId: project.id,
      userId,
    });

    return project;
  }

  list(workspaceId: string) {
    return this.prisma.project.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async get(workspaceId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, workspaceId },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado.');
    }

    return project;
  }
}