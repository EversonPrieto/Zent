import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskPriority, TaskStatus } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  private async ensureProjectInWorkspace(projectId: string, workspaceId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId },
      select: { id: true },
    });

    if (!project) throw new ForbiddenException('Projeto não pertence a este workspace.');
  }

  async create(workspaceId: string, dto: CreateTaskDto) {
    await this.ensureProjectInWorkspace(dto.projectId, workspaceId);

    return this.prisma.task.create({
      data: {
        projectId: dto.projectId,
        title: dto.title,
        description: dto.description,
        status: dto.status ?? TaskStatus.TODO,
        priority: dto.priority ?? TaskPriority.MEDIUM,
        assigneeId: dto.assigneeId,
        position: dto.position ?? 0,
      },
    });
  }

  async list(workspaceId: string, query: any) {
    const page = Math.max(parseInt(query.page ?? '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(query.pageSize ?? '20', 10), 1), 100);
    const skip = (page - 1) * pageSize;

    const where: any = { project: { workspaceId } };

    if (query.projectId) where.projectId = query.projectId;
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.assigneeId) where.assigneeId = query.assigneeId;

    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ updatedAt: 'desc' }],
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      }),
      this.prisma.task.count({ where }),
    ]);

    return { page, pageSize, total, items };
  }

  async get(workspaceId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, project: { workspaceId } },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    if (!task) throw new NotFoundException('Task não encontrada.');
    return task;
  }

  async update(workspaceId: string, id: string, dto: UpdateTaskDto) {
    const exists = await this.prisma.task.findFirst({
      where: { id, project: { workspaceId } },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Task não encontrada.');

    return this.prisma.task.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        assigneeId: dto.assigneeId === undefined ? undefined : dto.assigneeId,
        position: dto.position,
      },
    });
  }
}