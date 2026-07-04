import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface OnlineUser {
  id: string;
  name: string;
  avatarUrl: string;
  joinedAt: Date;
  editingTaskId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class PresenceGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private onlineUsers = new Map<string, Map<string, OnlineUser>>();

  private socketMap = new Map<string, { projectId: string; userId: string }>();

  handleDisconnect(client: Socket) {
    const socketInfo = this.socketMap.get(client.id);
    if (socketInfo) {
      this.removeUserFromProject(socketInfo.projectId, socketInfo.userId);
      this.socketMap.delete(client.id);
    }
  }

  @SubscribeMessage('join-project')
  handleJoinProject(
    @MessageBody()
    data: {
      projectId: string;
      userId: string;
      name: string;
      avatarUrl: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('[PresenceGateway join-project]', data);
    console.log(
      `🟢 usuário ${data.name} (${data.userId}) entrou no projeto ${data.projectId}`,
    );
    console.log(`   Dados recebidos:`, JSON.stringify(data));

    if (!data.projectId || !data.userId) {
      console.error('❌ Erro: projectId ou userId vazio!', data);
      return;
    }

    client.join(`project-presence-${data.projectId}`);
    this.socketMap.set(client.id, {
      projectId: data.projectId,
      userId: data.userId,
    });

    if (!this.onlineUsers.has(data.projectId)) {
      this.onlineUsers.set(data.projectId, new Map());
    }

    const projectUsers = this.onlineUsers.get(data.projectId);
    if (projectUsers) {
      projectUsers.set(data.userId, {
        id: data.userId,
        name: data.name,
        avatarUrl: data.avatarUrl,
        joinedAt: new Date(),
      });
      console.log(
        `   Total de usuários no projeto ${data.projectId}:`,
        projectUsers.size,
      );
    }

    this.broadcastPresence(data.projectId);
  }

  @SubscribeMessage('leave-project')
  handleLeaveProject(
    @MessageBody() projectId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const socketInfo = this.socketMap.get(client.id);
    if (socketInfo) {
      console.log(`🔴 usuário saiu do projeto ${projectId}`);
      this.removeUserFromProject(projectId, socketInfo.userId);
      this.socketMap.delete(client.id);
    }
  }

  @SubscribeMessage('editing-task')
  handleEditingTask(
    @MessageBody() data: { projectId: string; userId: string; taskId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const projectUsers = this.onlineUsers.get(data.projectId);
    if (projectUsers) {
      const user = projectUsers.get(data.userId);
      if (user) {
        user.editingTaskId = data.taskId;

        console.log(`✏️ ${user.name} está editando task ${data.taskId}`);
        this.broadcastPresence(data.projectId);
      }
    }
  }

  @SubscribeMessage('stop-editing-task')
  handleStopEditingTask(
    @MessageBody() data: { projectId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const projectUsers = this.onlineUsers.get(data.projectId);
    if (projectUsers) {
      const user = projectUsers.get(data.userId);
      if (user) {
        delete user.editingTaskId;

        console.log(`⏹️ ${user.name} parou de editar`);
        this.broadcastPresence(data.projectId);
      }
    }
  }

  private removeUserFromProject(projectId: string, userId: string) {
    const projectUsers = this.onlineUsers.get(projectId);
    if (projectUsers) {
      projectUsers.delete(userId);
      if (projectUsers.size === 0) {
        this.onlineUsers.delete(projectId);
      } else {
        this.broadcastPresence(projectId);
      }
    }
  }

  private broadcastPresence(projectId: string) {
    const users = Array.from(
      (this.onlineUsers.get(projectId) || new Map()).values(),
    );
    console.log('[PresenceGateway emit presence:updated]', {
      projectId,
      usersCount: users.length,
      users,
    });
    console.log(
      `👀 transmitindo ${users.length} usuários online para sala project-presence-${projectId}`,
    );
    if (users.length > 0) {
      console.log(
        `   Usuários: ${users.map((u) => `${u.name}(${u.id})`).join(', ')}`,
      );
    }
    this.server
      .to(`project-presence-${projectId}`)
      .emit('presence:updated', { users });
  }
}
