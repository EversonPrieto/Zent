import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ActivityGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join')
  handleJoin(
    @MessageBody() workspaceId: string,
    @ConnectedSocket() client: Socket,
  ) {
    console.log('🟢 usuário entrou na sala:', workspaceId);
    client.join(workspaceId);
  }

  emitActivity(workspaceId: string, activity: any) {
    console.log('🔥 emitindo activity:', activity);
    this.server.to(workspaceId).emit('activity:new', activity);
  }
}
