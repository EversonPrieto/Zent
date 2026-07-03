import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
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
      (client.handshake?.headers?.authorization as string | undefined);

    if (!tokenFromHandshake) return null;

    // If it's Authorization header, strip "Bearer "
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
      throw new ForbiddenException('unauthorized');
    }

    // JwtService.verifyAsync uses the same JWT_SECRET configured in JwtModule
    const payload = await this.jwt.verifyAsync<any>(token);
    const userId = payload?.sub;
    if (!userId) throw new ForbiddenException('unauthorized');
    return String(userId);
  }

  private async assertUserMemberOfWorkspace(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { userId: true },
    });

    if (!membership) throw new ForbiddenException('unauthorized');
  }

  @SubscribeMessage('join')
  async handleJoin(
    @MessageBody() workspaceId: string,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = await this.getUserIdOrThrow(client);

      // membership check before join
      await this.assertUserMemberOfWorkspace(workspaceId, userId);

      const room = this.getRoom(workspaceId);
      this.logger.log(`🟢 usuário entrou na sala: ${room}`);
      client.join(room);
    } catch {
      client.emit('unauthorized');
      // Do not leak existence of workspace; generic behavior
      client.disconnect(true);
    }
  }

  emitActivity(workspaceId: string, activity: any) {
    const room = this.getRoom(workspaceId);
    this.logger.log(`🔥 emitindo activity para ${room}`);
    this.server.to(room).emit('activity:new', activity);
  }
}
