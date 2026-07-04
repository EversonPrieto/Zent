import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

import { PrismaService } from 'src/prisma/prisma.service';

const getFrontendOrigins = () => {
  const raw = process.env.FRONTEND_URL;

  if (!raw) return ['http://localhost:3001'];

  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

@Injectable()
@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = getFrontendOrigins();

      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) return callback(null, true);

      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  },
})
export class CommentsGateway {
  private readonly logger = new Logger(CommentsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private getTaskRoom(taskId: string) {
    return `task-${taskId}`;
  }

  private getJwtFromSocket(client: Socket): string | null {
    const tokenFromHandshake =
      (client.handshake?.auth as any)?.token ||
      client.handshake?.headers?.authorization ||
      null;

    if (!tokenFromHandshake) return null;

    if (typeof tokenFromHandshake === 'string') {
      if (tokenFromHandshake.toLowerCase().startsWith('bearer ')) {
        return tokenFromHandshake.slice('bearer '.length);
      }

      return tokenFromHandshake;
    }

    return null;
  }

  private async getUserIdFromHandshake(client: Socket): Promise<string | null> {
    try {
      const token = this.getJwtFromSocket(client);

      if (!token) return null;

      const decoded = await this.jwt.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });


      const userId = decoded?.sub ?? decoded?.id ?? decoded?.userId;

      return userId ? String(userId) : null;
    } catch {
      return null;
    }
  }

  private async isUserMemberOfTaskWorkspace(
    userId: string,
    taskId: string,
  ): Promise<boolean> {
    if (!taskId || typeof taskId !== 'string' || !taskId.trim()) {
      return false;
    }

    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
      },
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
      select: {
        id: true,
      },
    });

    return Boolean(membership);
  }

  @SubscribeMessage('join-task')
  async handleJoinTask(
    @MessageBody() taskId: string,
    @ConnectedSocket() client: Socket,
  ) {
    console.log('[CommentsGateway join-task]', {
      taskId,
      socketId: client.id,
      hasToken: Boolean(this.getJwtFromSocket(client)),
    });

    try {
      if (!taskId || typeof taskId !== 'string' || !taskId.trim()) {
        client.emit('comments:join-error', {
          taskId,
          message: 'invalid taskId',
        });

        return;
      }

      const validTaskId = taskId.trim();

      const userId = await this.getUserIdFromHandshake(client);

      if (!userId) {
        client.emit('comments:unauthorized', {
          taskId: validTaskId,
          message: 'unauthorized: missing or invalid token',
        });

        return;
      }

      const allowed = await this.isUserMemberOfTaskWorkspace(
        userId,
        validTaskId,
      );

      if (!allowed) {
        client.emit('comments:unauthorized', {
          taskId: validTaskId,
          message: 'unauthorized: user is not workspace member',
        });

        return;
      }

      const room = this.getTaskRoom(validTaskId);

      client.join(room);

      this.logger.log(`🟢 usuário ${userId} entrou na sala de comments: ${room}`);

      client.emit('comments:joined', {
        taskId: validTaskId,
        room,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'unknown comments join error';

      console.error('[CommentsGateway join-task error]', {
        taskId,
        socketId: client.id,
        message,
      });

      client.emit('comments:join-error', {
        taskId,
        message,
      });

      // IMPORTANTE:
      // Não usar client.disconnect(true) aqui.
      // O mesmo socket também é usado por Presence, ActivityFeed e Tasks.
      return;
    }
  }

  @SubscribeMessage('leave-task')
  handleLeaveTask(
    @MessageBody() taskId: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (!taskId || typeof taskId !== 'string' || !taskId.trim()) {
      return;
    }

    const validTaskId = taskId.trim();
    const room = this.getTaskRoom(validTaskId);

    client.leave(room);

    console.log('[CommentsGateway leave-task]', {
      taskId: validTaskId,
      socketId: client.id,
      room,
    });
  }

  emitCommentCreated(
    taskId: string,
    comment: any,
    actorUserId: string,
    actorUserName: string,
  ) {
    this.server.to(this.getTaskRoom(taskId)).emit('comment:created', {
      comment,
      actorUserId,
      actorUserName,
      taskId,
    });
  }

  emitCommentDeleted(
    taskId: string,
    commentId: string,
    actorUserId: string,
    actorUserName: string,
  ) {
    this.server.to(this.getTaskRoom(taskId)).emit('comment:deleted', {
      commentId,
      actorUserId,
      actorUserName,
      taskId,
    });
  }
}