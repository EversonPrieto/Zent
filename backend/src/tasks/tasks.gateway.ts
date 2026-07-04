import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

const getFrontendOrigins = () => {
  const raw = process.env.FRONTEND_URL;

  if (!raw) return ['http://localhost:3001'];

  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

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
@Injectable()
export class TasksGateway {
  private readonly logger = new Logger(TasksGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private getProjectRoom(projectId: string) {
    return `project-${projectId}`;
  }

  private getJwtFromSocket(client: Socket): string | null {
    const tokenFromHandshake =
      (client.handshake?.auth as any)?.token ||
      (client.handshake?.headers as any)?.authorization ||
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

  private async getUserIdFromSocket(client: Socket): Promise<string> {
    const token = this.getJwtFromSocket(client);

    if (!token) {
      throw new ForbiddenException('unauthorized: missing token');
    }

    let decoded: any;

    try {
      decoded = await this.jwt.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      throw new ForbiddenException('unauthorized: invalid token');
    }

    const userId = decoded?.sub ?? decoded?.id ?? decoded?.userId;

    if (!userId) {
      throw new ForbiddenException('unauthorized: missing user id');
    }

    return String(userId);
  }

  private async assertUserCanAccessProject(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
      select: {
        workspaceId: true,
      },
    });

    if (!project) {
      throw new ForbiddenException('unauthorized: project not found');
    }

    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: project.workspaceId,
          userId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('unauthorized: user is not workspace member');
    }
  }

  @SubscribeMessage('join-tasks-room')
  async handleJoinTasksRoom(
    @MessageBody() projectId: string,
    @ConnectedSocket() client: Socket,
  ) {
    console.log('[TasksGateway join-tasks-room]', {
      projectId,
      socketId: client.id,
      hasToken: Boolean(this.getJwtFromSocket(client)),
    });

    try {
      if (!projectId || typeof projectId !== 'string' || !projectId.trim()) {
        throw new ForbiddenException('invalid projectId');
      }

      const validProjectId = projectId.trim();

      const userId = await this.getUserIdFromSocket(client);

      await this.assertUserCanAccessProject(validProjectId, userId);

      const room = this.getProjectRoom(validProjectId);

      client.join(room);

      this.logger.log(`🟢 usuário ${userId} entrou na sala de tasks: ${room}`);

      client.emit('tasks:joined', {
        projectId: validProjectId,
        room,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'unknown tasks join error';

      console.error('[TasksGateway join-tasks-room error]', {
        projectId,
        socketId: client.id,
        message,
      });

      client.emit('tasks:unauthorized', {
        projectId,
        message,
      });

      // IMPORTANTE:
      // Não usar client.disconnect(true) aqui.
      // O mesmo socket também é usado por Presence, ActivityFeed e Comments.
      return;
    }
  }

  emitTaskMoved(
    projectId: string,
    task: any,
    actorUserId: string,
    actorUserName: string,
  ) {
    console.log('🔥 Task movida:', task.id, '→', task.status);

    this.server.to(this.getProjectRoom(projectId)).emit('task:moved', {
      task,
      actorUserId,
      actorUserName,
      projectId,
    });
  }

  emitTaskCreated(
    projectId: string,
    task: any,
    actorUserId: string,
    actorUserName: string,
  ) {
    console.log('✨ Task criada:', task.id);

    this.server.to(this.getProjectRoom(projectId)).emit('task:created', {
      task,
      actorUserId,
      actorUserName,
      projectId,
    });
  }

  emitTaskDeleted(
    projectId: string,
    taskId: string,
    actorUserId: string,
    actorUserName: string,
  ) {
    console.log('🗑️ Task deletada:', taskId);

    this.server.to(this.getProjectRoom(projectId)).emit('task:deleted', {
      taskId,
      actorUserId,
      actorUserName,
      projectId,
    });
  }

  emitTaskUpdated(
    projectId: string,
    task: any,
    actorUserId: string,
    actorUserName: string,
  ) {
    console.log('📝 Task atualizada:', task.id);

    this.server.to(this.getProjectRoom(projectId)).emit('task:updated', {
      task,
      actorUserId,
      actorUserName,
      projectId,
    });
  }
}