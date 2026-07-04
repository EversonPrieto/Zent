import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttachmentsService {
  constructor(private prisma: PrismaService) {}

  private async findTaskInWorkspaceOrThrow(taskId: string, workspaceId: string) {
    if (!taskId || !taskId.trim()) {
      throw new BadRequestException('Task ID é obrigatório.');
    }

    if (!workspaceId || !workspaceId.trim()) {
      throw new BadRequestException('Workspace ID é obrigatório.');
    }

    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          workspaceId,
        },
      },
      select: {
        id: true,
        project: {
          select: {
            completed: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task não encontrada.');
    }

    if (task.project.completed) {
      throw new ForbiddenException(
        'Projeto está finalizado. Reabra o projeto para editar anexos.',
      );
    }

    return task;
  }

  async addAttachment(
    workspaceId: string,
    taskId: string,
    url: string,
    fileName: string,
    fileType: string,
    size?: number,
  ) {
    await this.findTaskInWorkspaceOrThrow(taskId, workspaceId);

    if (!url?.trim()) {
      throw new BadRequestException('URL do anexo é obrigatória.');
    }

    return this.prisma.attachment.create({
      data: {
        taskId,
        url: url.trim(),
        fileName: fileName?.trim() || 'Anexo',
        fileType: fileType?.trim() || 'application/octet-stream',
        size,
      },
    });
  }

  async getAttachments(workspaceId: string, taskId: string) {
    await this.findTaskInWorkspaceOrThrow(taskId, workspaceId);

    return this.prisma.attachment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteAttachment(workspaceId: string, taskId: string, id: string) {
    await this.findTaskInWorkspaceOrThrow(taskId, workspaceId);

    const attachment = await this.prisma.attachment.findFirst({
      where: {
        id,
        taskId,
        task: {
          project: {
            workspaceId,
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (!attachment) {
      throw new NotFoundException('Anexo não encontrado.');
    }

    await this.prisma.attachment.delete({
      where: { id },
    });

    return { message: 'Anexo removido com sucesso.' };
  }
}