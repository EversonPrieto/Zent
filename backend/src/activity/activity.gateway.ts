import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  Ack,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
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
export class ActivityGateway {
  private readonly logger = new Logger(ActivityGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private getRoom(workspaceId: string) {
    return `workspace-${workspaceId}`;
  }

  private getJwtFromSocket(client: Socket): string | null {
    const tokenFromHandshake =
      client.handshake?.auth?.token ||
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

  private async getUserIdOrThrow(client: Socket): Promise<string> {
    const token = this.getJwtFromSocket(client);

    if (!token) {
      throw new ForbiddenException('unauthorized: missing token');
    }

    let payload: any;

    try {
      payload = await this.jwt.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      throw new ForbiddenException('unauthorized: invalid token');
    }

    const userId = payload?.sub ?? payload?.id ?? payload?.userId;

    if (!userId) {
      throw new ForbiddenException('unauthorized: missing user id in token');
    }

    return String(userId);
  }

  private async assertUserMemberOfWorkspace(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      select: {
        userId: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('unauthorized: user is not workspace member');
    }
  }

  private async joinWorkspaceRoom(
    client: Socket,
    workspaceId: string | undefined | null,
    sourceEvent: string,
  ) {
    console.log(`[ActivityGateway ${sourceEvent}]`, {
      workspaceId,
      socketId: client.id,
      hasToken: Boolean(this.getJwtFromSocket(client)),
    });

    try {
      if (!workspaceId || typeof workspaceId !== 'string') {
        throw new ForbiddenException('invalid workspaceId');
      }

      const validWorkspaceId = workspaceId.trim();

      if (!validWorkspaceId) {
        throw new ForbiddenException('invalid workspaceId');
      }

      const userId = await this.getUserIdOrThrow(client);

      await this.assertUserMemberOfWorkspace(validWorkspaceId, userId);

      const room = this.getRoom(validWorkspaceId);

      client.join(room);

      this.logger.log(`🟢 usuário ${userId} entrou na sala: ${room}`);

      const response = {
        ok: true,
        workspaceId: validWorkspaceId,
        room,
      };

      client.emit('activity:joined', response);

      return response;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'unknown activity join error';

      console.error(`[ActivityGateway ${sourceEvent} error]`, {
        workspaceId,
        socketId: client.id,
        message,
      });

      const response = {
        ok: false,
        workspaceId,
        message,
      };

      client.emit('activity:unauthorized', response);

      // Não usar client.disconnect(true) aqui.
      // O socket também é usado por Presence, Tasks e Comments.
      return response;
    }
  }

  @SubscribeMessage('activity:join')
  async handleActivityJoin(
    @MessageBody() data: { workspaceId?: string } | string,
    @ConnectedSocket() client: Socket,
    @Ack() ack?: (response: any) => void,
  ) {
    const workspaceId = typeof data === 'string' ? data : data?.workspaceId;

    const response = await this.joinWorkspaceRoom(
      client,
      workspaceId,
      'activity:join',
    );

    ack?.(response);

    return response;
  }

  // Compatibilidade com o evento antigo
  @SubscribeMessage('join')
  async handleLegacyJoin(
    @MessageBody() workspaceId: string,
    @ConnectedSocket() client: Socket,
    @Ack() ack?: (response: any) => void,
  ) {
    const response = await this.joinWorkspaceRoom(client, workspaceId, 'join');

    ack?.(response);

    return response;
  }

  emitActivity(workspaceId: string, activity: any) {
    const room = this.getRoom(workspaceId);

    console.log('[ActivityGateway emit activity:new]', {
      workspaceId,
      activityId: activity?.id,
      projectId: activity?.projectId,
      room,
    });

    this.logger.log(`🔥 emitindo activity para ${room}`);

    this.server.to(room).emit('activity:new', activity);
  }
}