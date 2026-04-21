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
export class CommentsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join-task')
  handleJoinTask(
    @MessageBody() taskId: string,
    @ConnectedSocket() client: Socket,
  ) {
    console.log('🟢 usuário entrou na task:', taskId);
    client.join(`task-${taskId}`);
  }

  @SubscribeMessage('leave-task')
  handleLeaveTask(
    @MessageBody() taskId: string,
    @ConnectedSocket() client: Socket,
  ) {
    console.log('🔴 usuário saiu da task:', taskId);
    client.leave(`task-${taskId}`);
  }

  emitCommentCreated(taskId: string, comment: any) {
    console.log('💬 novo comentário:', comment);
    this.server.to(`task-${taskId}`).emit('comment:created', comment);
  }

  emitCommentDeleted(taskId: string, commentId: string) {
    console.log('🗑️ comentário deletado:', commentId);
    this.server.to(`task-${taskId}`).emit('comment:deleted', commentId);
  }
}
