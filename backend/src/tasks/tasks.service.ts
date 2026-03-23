import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActivityType, TaskPriority, TaskStatus } from '@prisma/client';

import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { ActivityService } from 'src/activity/activity.service';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private activity: ActivityService,
  ) {}

  private async ensureProjectInWorkspace(projectId: string, workspaceId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId },
      select: { id: true },
    });

    if (!project) {
      throw new ForbiddenException('Projeto não pertence a este workspace.');
    }
  }

  async create(workspaceId: string, dto: CreateTaskDto, userId?: string) {
    await this.ensureProjectInWorkspace(dto.projectId, workspaceId);

    const status = dto.status ?? TaskStatus.TODO;

    const last = await this.prisma.task.findFirst({
      where: {
        projectId: dto.projectId,
        status,
        project: { workspaceId },
      },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const position = last ? last.position + 1024 : 1024;

    const task = await this.prisma.task.create({
      data: {
        projectId: dto.projectId,
        title: dto.title,
        description: dto.description,
        status,
        priority: dto.priority ?? TaskPriority.MEDIUM,
        assigneeId: dto.assigneeId,
        position,
      },
    });

    await this.activity.create({
      type: ActivityType.TASK_CREATED,
      description: `criou a task "${task.title}"`,
      workspaceId,
      projectId: task.projectId,
      taskId: task.id,
      userId,
    });

    return task;
  }

  async list(workspaceId: string, query: any) {
    const page = Math.max(parseInt(query.page ?? '1', 10), 1);
    const pageSize = Math.min(
      Math.max(parseInt(query.pageSize ?? '20', 10), 1),
      100,
    );

    const skip = (page - 1) * pageSize;

    const where: any = {
      project: { workspaceId },
    };

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
        orderBy: [{ position: 'asc' }],
        include: {
          project: { select: { id: true, name: true } },
          assignee: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      }),
      this.prisma.task.count({ where }),
    ]);

    return { page, pageSize, total, items };
  }

  async get(workspaceId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id,
        project: { workspaceId },
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    if (!task) throw new NotFoundException('Task não encontrada.');

    return task;
  }

  async update(
    workspaceId: string,
    id: string,
    dto: UpdateTaskDto,
    userId?: string,
  ) {
    const existingTask = await this.prisma.task.findFirst({
      where: {
        id,
        project: { workspaceId },
      },
      select: {
        id: true,
        title: true,
        projectId: true,
      },
    });

    if (!existingTask) throw new NotFoundException('Task não encontrada.');

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        assigneeId:
          dto.assigneeId === undefined ? undefined : dto.assigneeId,
      },
    });

    await this.activity.create({
      type: ActivityType.TASK_UPDATED,
      description: `editou a task "${updatedTask.title}"`,
      workspaceId,
      projectId: existingTask.projectId,
      taskId: updatedTask.id,
      userId,
    });

    return updatedTask;
  }

  async move(
    workspaceId: string,
    taskId: string,
    dto: MoveTaskDto,
    userId?: string,
  ) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        project: { workspaceId },
      },
      select: {
        id: true,
        title: true,
        projectId: true,
        status: true,
        position: true,
      },
    });

    if (!task) throw new NotFoundException('Task não encontrada.');

    const getNeighbor = async (id: string) => {
      const neighbor = await this.prisma.task.findFirst({
        where: {
          id,
          projectId: task.projectId,
          status: dto.status,
          project: { workspaceId },
        },
        select: { position: true },
      });

      if (!neighbor) {
        throw new BadRequestException(`Task inválida: ${id}`);
      }

      return neighbor;
    };

    const before = dto.beforeId ? await getNeighbor(dto.beforeId) : null;
    const after = dto.afterId ? await getNeighbor(dto.afterId) : null;

    let newPosition: number;

    if (before && after) {
      newPosition = (before.position + after.position) / 2;
    } else if (before) {
      newPosition = before.position + 1024;
    } else if (after) {
      newPosition = after.position / 2;
    } else {
      const last = await this.prisma.task.findFirst({
        where: {
          projectId: task.projectId,
          status: dto.status,
          project: { workspaceId },
        },
        orderBy: { position: 'desc' },
        select: { position: true },
      });

      newPosition = last ? last.position + 1024 : 1024;
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: task.id },
      data: {
        status: dto.status,
        position: newPosition,
      },
    });

    await this.activity.create({
      type: ActivityType.TASK_MOVED,
      description: `moveu a task "${task.title}" para ${dto.status}`,
      workspaceId,
      projectId: task.projectId,
      taskId: task.id,
      userId,
    });

    return updatedTask;
  }

  async delete(workspaceId: string, id: string, userId?: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id,
        project: { workspaceId },
      },
      select: {
        id: true,
        title: true,
        projectId: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task não encontrada.');
    }

    await this.prisma.task.delete({
      where: { id },
    });

    await this.activity.create({
      type: ActivityType.TASK_DELETED,
      description: `removeu a task "${task.title}"`,
      workspaceId,
      projectId: task.projectId,
      taskId: task.id,
      userId,
    });

    return { message: 'Task removida com sucesso.' };
  }
}