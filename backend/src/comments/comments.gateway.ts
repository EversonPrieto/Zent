import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
})
export class CommentsGateway {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private async getUserIdFromHandshake(client: Socket): Promise<string | null> {
    try {
      const token =
        (client.handshake?.auth as any)?.token ??
        (() => {
          const authHeader = client.handshake?.headers?.authorization;
          if (typeof authHeader !== 'string') return null;
          if (!authHeader.toLowerCase().startsWith('bearer ')) return null;
          return authHeader.slice(7);
        })();

      if (!token) return null;

      const decoded = await this.jwt.verifyAsync(token);
      return decoded?.sub ? String(decoded.sub) : null;
    } catch {
      return null;
    }
  }

  private async isUserMemberOfTaskWorkspace(
    userId: string,
    taskId: string,
  ): Promise<boolean> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId },
      select: {
        project: {
          select: {
            workspaceId: true,
          },
        },
      },
    });

    if (!task?.project?.workspaceId) return false;

    const membership = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId: task.project.workspaceId,
        userId,
      },
      select: { id: true },
    });

    return !!membership;
  }

  @SubscribeMessage('join-task')
  async handleJoinTask(
    @MessageBody() taskId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = await this.getUserIdFromHandshake(client);

    if (!userId) {
      client.emit('unauthorized');
      client.disconnect(true);
      return;
    }

    const allowed = await this.isUserMemberOfTaskWorkspace(userId, taskId);
    if (!allowed) {
      client.emit('unauthorized');
      client.disconnect(true);
      return;
    }

    client.join(`task-${taskId}`);
  }

  @SubscribeMessage('leave-task')
  handleLeaveTask(
    @MessageBody() taskId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`task-${taskId}`);
  }

  emitCommentCreated(
    taskId: string,
    comment: any,
    actorUserId: string,
    actorUserName: string,
  ) {
    this.server.to(`task-${taskId}`).emit('comment:created', {
      comment,
      actorUserId,
      actorUserName,
    });
  }

  emitCommentDeleted(
    taskId: string,
    commentId: string,
    actorUserId: string,
    actorUserName: string,
  ) {
    this.server.to(`task-${taskId}`).emit('comment:deleted', {
      commentId,
      actorUserId,
      actorUserName,
    });
  }
}
