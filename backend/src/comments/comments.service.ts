import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(workspaceId: string, userId: string, taskId: string, dto: CreateCommentDto) {

    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        project: { workspaceId }
      }
    });

    if (!task) throw new ForbiddenException('Task não pertence a este workspace');

    return this.prisma.comment.create({
      data: {
        content: dto.content,
        taskId,
        userId
      }
    });
  }

  async list(workspaceId: string, taskId: string) {

    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        project: { workspaceId }
      }
    });

    if (!task) throw new ForbiddenException();

    return this.prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });
  }

  async delete(workspaceId: string, commentId: string, userId: string) {

    const comment = await this.prisma.comment.findFirst({
      where: {
        id: commentId,
        task: {
          project: { workspaceId }
        }
      }
    });

    if (!comment) throw new NotFoundException();

    if (comment.userId !== userId) {
      throw new ForbiddenException('Você não pode apagar este comentário');
    }

    await this.prisma.comment.delete({
      where: { id: commentId }
    });

    return { message: 'Comentário removido' };
  }
}