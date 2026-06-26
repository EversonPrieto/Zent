import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TasksGateway } from '../tasks/tasks.gateway';

@Injectable()
export class LabelsService {
  constructor(
    private prisma: PrismaService,
    private tasksGateway: TasksGateway,
  ) {}

  async getLabels(workspaceId: string) {
    return this.prisma.label.findMany({
      where: { workspaceId },
      orderBy: { name: 'asc' },
    });
  }

  async createLabel(workspaceId: string, name: string, color: string) {
    if (!name.trim()) {
      throw new Error('Nome do label é obrigatório');
    }

    return this.prisma.label.create({
      data: {
        name: name.trim(),
        color,
        workspaceId,
      },
    });
  }

  async updateLabel(
    id: string,
    workspaceId: string,
    data: { name?: string; color?: string },
  ) {
    const label = await this.prisma.label.findUnique({ where: { id } });
    if (!label || label.workspaceId !== workspaceId) {
      throw new ForbiddenException('Acesso negado');
    }

    const updated = await this.prisma.label.update({
      where: { id },
      data: {
        name: data.name ? data.name.trim() : undefined,
        color: data.color,
      },
    });

    // Atualiza realtime as tasks que possuem essa label (usando room project-<projectId>)
    const taskLabels = await this.prisma.taskLabel.findMany({
      where: {
        labelId: id,
        task: { project: { workspaceId } },
      },
      select: {
        task: {
          select: {
            id: true,
            projectId: true,
            status: true,
            title: true,
            priority: true,
            position: true,
            taskLabels: {
              include: {
                label: { select: { id: true, name: true, color: true } },
              },
            },
          },
        },
      },
    });

    for (const tl of taskLabels) {
      this.tasksGateway.emitTaskUpdated(
        tl.task.projectId,
        {
          id: tl.task.id,
          projectId: tl.task.projectId,
          status: tl.task.status,
          title: tl.task.title,
          priority: tl.task.priority,
          position: tl.task.position,
          taskLabels: tl.task.taskLabels.map((x) => ({ label: x.label })),
        },
        'unknown',
        'Usuário',
      );
    }

    return updated;
  }

  async deleteLabel(id: string, workspaceId: string) {
    const label = await this.prisma.label.findUnique({ where: { id } });
    if (!label || label.workspaceId !== workspaceId) {
      throw new ForbiddenException('Acesso negado');
    }

    return this.prisma.label.delete({ where: { id } });
  }
}
