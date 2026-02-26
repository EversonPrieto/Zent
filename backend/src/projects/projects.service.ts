import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  create(workspaceId: string, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        workspaceId,
      },
    });
  }

  list(workspaceId: string) {
    return this.prisma.project.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, description: true, createdAt: true, updatedAt: true },
    });
  }

  async get(workspaceId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, workspaceId },
      select: { id: true, name: true, description: true, createdAt: true, updatedAt: true },
    });

    if (!project) throw new NotFoundException('Projeto não encontrado.');
    return project;
  }
}