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

  // usuário entra na sala da task
  @SubscribeMessage('join-task')
  handleJoinTask(
    @MessageBody() taskId: string,
    @ConnectedSocket() client: Socket,
  ) {
    console.log('🟢 usuário entrou na task:', taskId);
    client.join(`task-${taskId}`);
  }

  // usuário sai da sala da task
  @SubscribeMessage('leave-task')
  handleLeaveTask(
    @MessageBody() taskId: string,
    @ConnectedSocket() client: Socket,
  ) {
    console.log('🔴 usuário saiu da task:', taskId);
    client.leave(`task-${taskId}`);
  }

  // emite novo comentário
  emitCommentCreated(taskId: string, comment: any) {
    console.log('💬 novo comentário:', comment);
    this.server.to(`task-${taskId}`).emit('comment:created', comment);
  }

  // emite comentário deletado
  emitCommentDeleted(taskId: string, commentId: string) {
    console.log('🗑️ comentário deletado:', commentId);
    this.server.to(`task-${taskId}`).emit('comment:deleted', commentId);
  }
}
