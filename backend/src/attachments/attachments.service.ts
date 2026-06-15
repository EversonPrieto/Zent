import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttachmentsService {
  constructor(private prisma: PrismaService) {}

  async addAttachment(
    taskId: string,
    url: string,
    fileName: string,
    fileType: string,
    size?: number,
  ) {
    return this.prisma.attachment.create({
      data: {
        taskId,
        url,
        fileName,
        fileType,
        size,
      },
    });
  }

  async getAttachments(taskId: string) {
    return this.prisma.attachment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteAttachment(id: string, taskId: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
    });
    if (!attachment || attachment.taskId !== taskId) {
      throw new ForbiddenException('Acesso negado');
    }

    return this.prisma.attachment.delete({ where: { id } });
  }
}
