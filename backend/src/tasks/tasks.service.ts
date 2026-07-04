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
import { AclService } from 'src/common/acl/acl.service';
import { TasksGateway } from './tasks.gateway';
import { LimitsService } from 'src/limits/limits.service';
import { EmailTaskMovedDigestService } from 'src/notifications/email-task-moved/email-task-moved-digest.service';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private activity: ActivityService,
    private acl: AclService,
    private tasksGateway: TasksGateway,
    private limits: LimitsService,
    private emailTaskMovedDigestService: EmailTaskMovedDigestService,
  ) { }

  private uniqueIds(ids?: Array<string | null | undefined>) {
    return [...new Set((ids ?? []).filter((id): id is string => Boolean(id)))];
  }

  private async ensureProjectInWorkspace(
    projectId: string,
    workspaceId: string,
  ) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId },
      select: { id: true },
    });

    if (!project) {
      throw new ForbiddenException('Projeto não pertence a este workspace.');
    }
  }

  private async ensureLabelsInWorkspace(
    workspaceId: string,
    labelIds?: string[],
  ) {
    const uniqueLabelIds = this.uniqueIds(labelIds);

    if (uniqueLabelIds.length === 0) return;

    const labelsCount = await this.prisma.label.count({
      where: {
        id: { in: uniqueLabelIds },
        workspaceId,
      },
    });

    if (labelsCount !== uniqueLabelIds.length) {
      throw new ForbiddenException(
        'Uma ou mais labels não pertencem a este workspace.',
      );
    }
  }

  private async ensureUsersInWorkspace(workspaceId: string, userIds?: string[]) {
    const uniqueUserIds = this.uniqueIds(userIds);

    if (uniqueUserIds.length === 0) return;

    const membersCount = await this.prisma.workspaceMember.count({
      where: {
        workspaceId,
        userId: { in: uniqueUserIds },
      },
    });

    if (membersCount !== uniqueUserIds.length) {
      throw new ForbiddenException(
        'Um ou mais usuários não pertencem a este workspace.',
      );
    }
  }

  async create(workspaceId: string, dto: CreateTaskDto, userId?: string) {
    await this.ensureProjectInWorkspace(dto.projectId, workspaceId);

    await this.ensureLabelsInWorkspace(workspaceId, dto.labelIds);

    await this.ensureUsersInWorkspace(
      workspaceId,
      this.uniqueIds([dto.assigneeId, ...(dto.assigneeIds ?? [])]),
    );

    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, workspaceId },
      select: { id: true, completed: true },
    });

    if (project?.completed) {
      throw new ForbiddenException(
        'Projeto está finalizado. Reabra o projeto para criar tasks.',
      );
    }

    // Check task limit
    if (userId) {
      await this.limits.checkTaskLimit(userId, dto.projectId);
    }

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
        dueDate: dto.dueDate
          ? new Date(
            dto.dueDate.endsWith('Z')
              ? dto.dueDate
              : `${dto.dueDate}T00:00:00.000Z`,
          )
          : null,
        position,
        taskLabels:
          dto.labelIds && dto.labelIds.length > 0
            ? {
              create: this.uniqueIds(dto.labelIds).map((labelId) => ({
                labelId,
              })),
            }
            : undefined,
        taskAssignees:
          dto.assigneeIds && dto.assigneeIds.length > 0
            ? {
              create: this.uniqueIds(dto.assigneeIds).map((userId) => ({
                userId,
              })),
            }
            : undefined,
      },
      include: {
        taskLabels: {
          include: {
            label: true,
          },
        },
        taskAssignees: {
          include: {
            user: true,
          },
        },
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

    const actor = userId
      ? await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true },
      })
      : null;

    this.tasksGateway.emitTaskCreated(
      task.projectId,
      task,
      actor?.id ?? userId ?? 'unknown',
      actor?.name ?? 'Usuário',
    );

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
          taskLabels: {
            include: {
              label: { select: { id: true, name: true, color: true } },
            },
          },
          taskAssignees: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatarUrl: true },
              },
            },
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
        taskLabels: {
          include: {
            label: { select: { id: true, name: true, color: true } },
          },
        },
        taskAssignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
        attachments: {
          select: {
            id: true,
            url: true,
            fileName: true,
            fileType: true,
            size: true,
            createdAt: true,
          },
        },
        comments: true,
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
    if (userId) {
      await this.acl.requirePermission('task:edit', workspaceId, userId);
    }

    const existingTask = await this.prisma.task.findFirst({
      where: {
        id,
        project: { workspaceId },
      },
      select: {
        id: true,
        title: true,
        projectId: true,
        project: { select: { id: true, completed: true } },
      },
    });

    if (!existingTask) throw new NotFoundException('Task não encontrada.');

    if (existingTask.project.completed) {
      throw new ForbiddenException(
        'Projeto está finalizado. Reabra o projeto para editar as tasks.',
      );
    }

    if (dto.assigneeId) {
      await this.ensureUsersInWorkspace(workspaceId, [dto.assigneeId]);
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        assigneeId: dto.assigneeId === undefined ? undefined : dto.assigneeId,
        dueDate:
          dto.dueDate === undefined
            ? undefined
            : dto.dueDate
              ? new Date(
                dto.dueDate.endsWith('Z')
                  ? dto.dueDate
                  : `${dto.dueDate}T00:00:00.000Z`,
              )
              : null,
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

    this.tasksGateway.emitTaskUpdated(
      existingTask.projectId,
      updatedTask,
      userId ?? 'unknown',
      userId
        ? (await this.prisma.user.findUnique({
          where: { id: userId },
          select: { name: true },
        }))?.name ?? 'Usuário'
        : 'Usuário',
    );

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
        project: { select: { id: true, completed: true } },
      },
    });

    if (!task) throw new NotFoundException('Task não encontrada.');

    if (task.project.completed) {
      throw new ForbiddenException(
        'Projeto está finalizado. Reabra o projeto para editar as tasks.',
      );
    }

    const getNeighbor = async (id: string) => {
      const neighbor = await this.prisma.task.findFirst({
        where: {
          id,
          projectId: task.projectId,
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

    this.tasksGateway.emitTaskMoved(
      task.projectId,
      updatedTask,
      userId ?? 'unknown',
      userId
        ? (await this.prisma.user.findUnique({
          where: { id: userId },
          select: { name: true },
        }))?.name ?? 'Usuário'
        : 'Usuário',
    );

    // Enfileirar digest por email (anti-spam é feito no worker)
    try {
      const members = await this.prisma.workspaceMember.findMany({
        where: { workspaceId },
        select: {
          userId: true,
          user: {
            select: {
              id: true,
              emailNotificationsEnabled: true,
            },
          },
        },
      });

      const fromStatus = task.status ? String(task.status) : '—';
      const toStatus = dto.status ? String(dto.status) : '—';

      const recipientUserIds = members
        .filter((m) => m.user?.emailNotificationsEnabled)
        .map((m) => m.userId);

      for (const recipientUserId of recipientUserIds) {
        await this.emailTaskMovedDigestService.enqueue({
          userId: recipientUserId,
          workspaceId,
          taskId: task.id,
          taskTitle: task.title ?? null,
          actorUserId: userId ?? null,
          fromStatus,
          toStatus,
        });
      }
    } catch (err) {
      // Fail-safe: não deixar a mudança da task quebrar por erro na notificação
      console.error('[TasksService.move] enqueue email digest failed:', err);
    }

    return updatedTask;
  }

  async delete(workspaceId: string, id: string, userId?: string) {
    if (userId) {
      await this.acl.requirePermission('task:delete', workspaceId, userId);
    }

    const task = await this.prisma.task.findFirst({
      where: {
        id,
        project: { workspaceId },
      },
      select: {
        id: true,
        title: true,
        projectId: true,
        project: { select: { id: true, completed: true } },
      },
    });

    if (!task) {
      throw new NotFoundException('Task não encontrada.');
    }

    if (task.project.completed) {
      throw new ForbiddenException(
        'Projeto está finalizado. Reabra o projeto para editar as tasks.',
      );
    }

    await this.activity.create({
      type: 'TASK_DELETED',
      description: `removeu a task "${task.title}"`,
      workspaceId,
      projectId: task.projectId,
      taskId: task.id,
      userId,
    });

    await this.prisma.task.delete({
      where: { id },
    });

    this.tasksGateway.emitTaskDeleted(
      task.projectId,
      task.id,
      userId ?? 'unknown',
      userId
        ? (await this.prisma.user.findUnique({
          where: { id: userId },
          select: { name: true },
        }))?.name ?? 'Usuário'
        : 'Usuário',
    );

    return { message: 'Task removida com sucesso.' };
  }

  async addLabel(workspaceId: string, taskId: string, labelId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, project: { workspaceId } },
      select: {
        id: true,
        projectId: true,
        project: { select: { id: true, completed: true } },
      },
    });

    if (!task) throw new NotFoundException('Task não encontrada.');

    if (task.project.completed) {
      throw new ForbiddenException(
        'Projeto está finalizado. Reabra o projeto para editar.',
      );
    }

    const label = await this.prisma.label.findFirst({
      where: { id: labelId, workspaceId },
    });

    if (!label) throw new NotFoundException('Label não encontrado.');

    const exists = await this.prisma.taskLabel.findUnique({
      where: { taskId_labelId: { taskId, labelId } },
    });

    if (exists) return { message: 'Label já adicionado.' };

    await this.prisma.taskLabel.create({
      data: { taskId, labelId },
    });

    return this.get(workspaceId, taskId);
  }

  async removeLabel(workspaceId: string, taskId: string, labelId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, project: { workspaceId } },
      select: {
        id: true,
        projectId: true,
        project: { select: { id: true, completed: true } },
      },
    });

    if (!task) throw new NotFoundException('Task não encontrada.');

    if (task.project.completed) {
      throw new ForbiddenException(
        'Projeto está finalizado. Reabra o projeto para editar.',
      );
    }

    const label = await this.prisma.label.findFirst({
      where: { id: labelId, workspaceId },
      select: { id: true },
    });

    if (!label) throw new NotFoundException('Label não encontrado.');

    await this.prisma.taskLabel.deleteMany({
      where: {
        taskId,
        labelId,
      },
    });

    return this.get(workspaceId, taskId);
  }

  async addAssignee(workspaceId: string, taskId: string, userId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, project: { workspaceId } },
      select: {
        id: true,
        projectId: true,
        project: { select: { id: true, completed: true } },
      },
    });

    if (!task) throw new NotFoundException('Task não encontrada.');

    if (task.project.completed) {
      throw new ForbiddenException(
        'Projeto está finalizado. Reabra o projeto para editar.',
      );
    }

    const member = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId, userId },
    });

    if (!member) throw new ForbiddenException('Usuário não está no workspace.');

    const exists = await this.prisma.taskAssignee.findUnique({
      where: { taskId_userId: { taskId, userId } },
    });

    if (exists) return { message: 'Usuário já é assignee.' };

    await this.prisma.taskAssignee.create({
      data: { taskId, userId },
    });

    return this.get(workspaceId, taskId);
  }

  async removeAssignee(workspaceId: string, taskId: string, userId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, project: { workspaceId } },
      select: {
        id: true,
        projectId: true,
        project: { select: { id: true, completed: true } },
      },
    });

    if (!task) throw new NotFoundException('Task não encontrada.');

    if (task.project.completed) {
      throw new ForbiddenException(
        'Projeto está finalizado. Reabra o projeto para editar.',
      );
    }

    await this.prisma.taskAssignee.deleteMany({
      where: {
        taskId,
        userId,
      },
    });

    return this.get(workspaceId, taskId);
  }

  async addAttachment(
    workspaceId: string,
    taskId: string,
    data: {
      url: string;
      fileName?: string;
      fileType?: string;
      size?: number;
    },
  ) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, project: { workspaceId } },
      select: {
        id: true,
        projectId: true,
        project: { select: { id: true, completed: true } },
      },
    });

    if (!task) throw new NotFoundException('Task não encontrada.');

    if (task.project.completed) {
      throw new ForbiddenException(
        'Projeto está finalizado. Reabra o projeto para editar.',
      );
    }

    await this.prisma.attachment.create({
      data: {
        taskId,
        url: data.url,
        fileName: data.fileName ?? 'Anexo',
        fileType: data.fileType ?? 'application/octet-stream',
        size: data.size,
      },
    });

    return this.get(workspaceId, taskId);
  }

  async removeAttachment(
    workspaceId: string,
    taskId: string,
    attachmentId: string,
  ) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, project: { workspaceId } },
      select: {
        id: true,
        projectId: true,
        project: { select: { id: true, completed: true } },
      },
    });

    if (!task) throw new NotFoundException('Task não encontrada.');

    if (task.project.completed) {
      throw new ForbiddenException(
        'Projeto está finalizado. Reabra o projeto para editar.',
      );
    }

    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment || attachment.taskId !== taskId) {
      throw new ForbiddenException('Anexo não encontrado.');
    }

    await this.prisma.attachment.delete({
      where: { id: attachmentId },
    });

    return this.get(workspaceId, taskId);
  }
}