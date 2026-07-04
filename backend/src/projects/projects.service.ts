import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ActivityService } from '../activity/activity.service';
import { AclService } from 'src/common/acl/acl.service';
import { LimitsService } from 'src/limits/limits.service';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private activity: ActivityService,
    private acl: AclService,
    private limits: LimitsService,
  ) {}

  private async findProjectOrThrow(workspaceId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, workspaceId },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado.');
    }

    return project;
  }

  async create(workspaceId: string, dto: CreateProjectDto, userId?: string) {
    if (userId) {
      await this.acl.requirePermission('project:create', workspaceId, userId);
      await this.limits.checkProjectLimit(userId, workspaceId);
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
        completed: true,
        completedAt: true,
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
        completed: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado.');
    }

    return project;
  }

  async update(
    workspaceId: string,
    id: string,
    dto: UpdateProjectDto,
    userId: string,
  ) {
    await this.acl.requirePermission('project:update', workspaceId, userId);

    const project = await this.findProjectOrThrow(workspaceId, id);

    const wasCompleted = project.completed;
    const isCompleting = dto.completed === true && !wasCompleted;
    const isReopening = dto.completed === false && wasCompleted;

    const updated = await this.prisma.project.update({
      where: { id: project.id },
      data: {
        name: dto.name ?? project.name,
        description:
          dto.description !== undefined ? dto.description : project.description,
        completed: dto.completed ?? project.completed,
        completedAt: isCompleting
          ? new Date()
          : isReopening
            ? null
            : project.completedAt,
      },
    });

    if (isCompleting) {
      await this.activity.create({
        type: ActivityType.PROJECT_CREATED,
        description: `Projeto "${updated.name}" foi finalizado`,
        workspaceId,
        projectId: updated.id,
        userId,
      });
    } else if (isReopening) {
      await this.activity.create({
        type: ActivityType.PROJECT_CREATED,
        description: `Projeto "${updated.name}" foi reaberto`,
        workspaceId,
        projectId: updated.id,
        userId,
      });
    }

    return updated;
  }

  async delete(workspaceId: string, id: string, userId: string) {
    await this.acl.requirePermission('project:delete', workspaceId, userId);

    const project = await this.prisma.project.findFirst({
      where: { id, workspaceId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado.');
    }

    // Importante: não crie ActivityLog referenciando projectId após deletar o projeto.
    // O schema usa FK e quebra a constraint quando o projeto já foi removido.
    await this.prisma.project.delete({
      where: { id: project.id },
    });

    return { message: 'Projeto deletado com sucesso.' };
  }
}