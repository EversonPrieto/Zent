import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

const getFrontendOrigins = () => {
  const raw = process.env.FRONTEND_URL;
  if (!raw) return ['http://localhost:3000'];

  // Accept either a single URL or comma-separated list
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = getFrontendOrigins();

      // allow non-browser clients (no origin)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) return callback(null, true);

      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  },
})
@Injectable()
export class TasksGateway {
  @WebSocketServer()
  server!: Server;

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  private async getUserIdFromSocket(client: Socket): Promise<string> {
    const token =
      (client.handshake?.auth as any)?.token ||
      (client.handshake?.headers as any)?.authorization?.replace(
        /^Bearer\s+/i,
        '',
      ) ||
      null;

    if (!token) throw new ForbiddenException('unauthorized');

    let decoded: any;
    try {
      decoded = await this.jwt.verifyAsync(token);
    } catch {
      throw new ForbiddenException('unauthorized');
    }

    const userId = decoded?.sub;
    if (!userId) throw new ForbiddenException('unauthorized');

    return String(userId);
  }

  @SubscribeMessage('join-tasks-room')
  async handleJoinTasksRoom(
    @MessageBody() projectId: string,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = await this.getUserIdFromSocket(client);

      // Validate: project belongs to a workspace where user is a member
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        select: { workspaceId: true },
      });

      if (!project) throw new ForbiddenException('unauthorized');

      const membership = await this.prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: project.workspaceId, userId } },
        select: { id: true },
      });

      if (!membership) throw new ForbiddenException('unauthorized');

      // Room naming must match emits below
      client.join(`project-${projectId}`);
    } catch {
      client.emit('error', { message: 'unauthorized' });
      client.disconnect(true);
    }
  }

  emitTaskMoved(
    projectId: string,
    task: any,
    actorUserId: string,
    actorUserName: string,
  ) {
    console.log('🔥 Task movida:', task.id, '→', task.status);
    this.server
      .to(`project-${projectId}`)
      .emit('task:moved', { task, actorUserId, actorUserName });
  }

  emitTaskCreated(
    projectId: string,
    task: any,
    actorUserId: string,
    actorUserName: string,
  ) {
    console.log('✨ Task criada:', task.id);
    this.server
      .to(`project-${projectId}`)
      .emit('task:created', { task, actorUserId, actorUserName });
  }

  emitTaskDeleted(
    projectId: string,
    taskId: string,
    actorUserId: string,
    actorUserName: string,
  ) {
    console.log('🗑️ Task deletada:', taskId);
    this.server
      .to(`project-${projectId}`)
      .emit('task:deleted', { taskId, actorUserId, actorUserName });
  }

  emitTaskUpdated(
    projectId: string,
    task: any,
    actorUserId: string,
    actorUserName: string,
  ) {
    console.log('📝 Task atualizada:', task.id);
    this.server
      .to(`project-${projectId}`)
      .emit('task:updated', { task, actorUserId, actorUserName });
  }
}
