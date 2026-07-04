import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TasksGateway } from '../tasks/tasks.gateway';

@Injectable()
export class LabelsService {
  constructor(
    private prisma: PrismaService,
    private tasksGateway: TasksGateway,
  ) {}

  private async findLabelInWorkspaceOrThrow(id: string, workspaceId: string) {
    const label = await this.prisma.label.findFirst({
      where: {
        id,
        workspaceId,
      },
    });

    if (!label) {
      throw new NotFoundException('Label não encontrada.');
    }

    return label;
  }

  async getLabels(workspaceId: string) {
    return this.prisma.label.findMany({
      where: { workspaceId },
      orderBy: { name: 'asc' },
    });
  }

  async createLabel(workspaceId: string, name: string, color: string) {
    const cleanName = name?.trim();

    if (!cleanName) {
      throw new BadRequestException('Nome do label é obrigatório.');
    }

    if (!color?.trim()) {
      throw new BadRequestException('Cor do label é obrigatória.');
    }

    return this.prisma.label.create({
      data: {
        name: cleanName,
        color: color.trim(),
        workspaceId,
      },
    });
  }

  async updateLabel(
    id: string,
    workspaceId: string,
    data: { name?: string; color?: string },
    userId?: string,
  ) {
    await this.findLabelInWorkspaceOrThrow(id, workspaceId);

    const cleanName = data.name === undefined ? undefined : data.name.trim();
    const cleanColor = data.color === undefined ? undefined : data.color.trim();

    if (data.name !== undefined && !cleanName) {
      throw new BadRequestException('Nome do label não pode ficar vazio.');
    }

    if (data.color !== undefined && !cleanColor) {
      throw new BadRequestException('Cor do label não pode ficar vazia.');
    }

    const updated = await this.prisma.label.update({
      where: { id },
      data: {
        name: cleanName,
        color: cleanColor,
      },
    });

    const actor = userId
      ? await this.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true },
        })
      : null;

    // Atualiza em realtime as tasks que possuem essa label.
    const taskLabels = await this.prisma.taskLabel.findMany({
      where: {
        labelId: id,
        task: {
          project: {
            workspaceId,
          },
        },
      },
      select: {
        task: {
          select: {
            id: true,
            projectId: true,
            status: true,
            title: true,
            description: true,
            priority: true,
            position: true,
            assigneeId: true,
            dueDate: true,
            createdAt: true,
            updatedAt: true,
            taskLabels: {
              include: {
                label: {
                  select: {
                    id: true,
                    name: true,
                    color: true,
                  },
                },
              },
            },
            taskAssignees: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    for (const taskLabel of taskLabels) {
      this.tasksGateway.emitTaskUpdated(
        taskLabel.task.projectId,
        taskLabel.task,
        actor?.id ?? userId ?? 'unknown',
        actor?.name ?? 'Usuário',
      );
    }

    return updated;
  }

  async deleteLabel(id: string, workspaceId: string) {
    await this.findLabelInWorkspaceOrThrow(id, workspaceId);

    await this.prisma.$transaction([
      this.prisma.taskLabel.deleteMany({
        where: {
          labelId: id,
          task: {
            project: {
              workspaceId,
            },
          },
        },
      }),
      this.prisma.label.delete({
        where: { id },
      }),
    ]);

    return { message: 'Label deletada com sucesso.' };
  }
}