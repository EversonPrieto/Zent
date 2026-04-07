import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LabelsService {
  constructor(private prisma: PrismaService) {}

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

  async updateLabel(id: string, workspaceId: string, data: { name?: string; color?: string }) {
    // Verificar se label pertence ao workspace
    const label = await this.prisma.label.findUnique({ where: { id } });
    if (!label || label.workspaceId !== workspaceId) {
      throw new ForbiddenException('Acesso negado');
    }

    return this.prisma.label.update({
      where: { id },
      data: {
        name: data.name ? data.name.trim() : undefined,
        color: data.color,
      },
    });
  }

  async deleteLabel(id: string, workspaceId: string) {
    const label = await this.prisma.label.findUnique({ where: { id } });
    if (!label || label.workspaceId !== workspaceId) {
      throw new ForbiddenException('Acesso negado');
    }

    return this.prisma.label.delete({ where: { id } });
  }
}
