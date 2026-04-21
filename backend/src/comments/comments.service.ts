import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ActivityService } from 'src/activity/activity.service';
import { CommentsGateway } from './comments.gateway';

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private activity: ActivityService,
    private gateway: CommentsGateway,
  ) { }

  async create(
    workspaceId: string,
    userId: string,
    taskId: string,
    dto: CreateCommentDto,
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
      },
    });

    if (!task) {
      throw new ForbiddenException('Task não pertence a este workspace');
    }

    const comment = await this.prisma.comment.create({
      data: {
        content: dto.content,
        taskId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    await this.activity.create({
      type: ActivityType.COMMENT_CREATED,
      description: `Comentário adicionado na task "${task.title}"`,
      workspaceId,
      projectId: task.projectId,
      taskId: task.id,
      userId,
    });

    this.gateway.emitCommentCreated(taskId, comment);

    return comment;
  }

  async list(workspaceId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        project: { workspaceId },
      },
      select: { id: true },
    });

    if (!task) {
      throw new ForbiddenException('Task não pertence a este workspace');
    }

    return this.prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async delete(workspaceId: string, commentId: string, userId: string) {
    const comment = await this.prisma.comment.findFirst({
      where: {
        id: commentId,
        task: {
          project: { workspaceId },
        },
      },
      select: {
        id: true,
        userId: true,
        taskId: true,
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comentário não encontrado');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('Você não pode apagar este comentário');
    }

    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    await this.activity.create({
      type: 'COMMENT_DELETED',
      description: `removeu um comentário da task "${comment.task.title}"`,
      workspaceId,
      projectId: comment.task.projectId,
      taskId: comment.task.id,
      userId,
    });

    this.gateway.emitCommentDeleted(comment.taskId, commentId);

    return { message: 'Comentário removido' };
  }
}