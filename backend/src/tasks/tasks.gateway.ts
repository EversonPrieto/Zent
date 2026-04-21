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
export class TasksGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join-tasks-room')
  handleJoinTasksRoom(
    @MessageBody() projectId: string,
    @ConnectedSocket() client: Socket,
  ) {
    console.log('🟢 Usuário entrou na sala de tasks:', projectId);
    client.join(`project-${projectId}`);
  }

  emitTaskMoved(projectId: string, task: any) {
    console.log('🔥 Task movida:', task.id, '→', task.status);
    this.server.to(`project-${projectId}`).emit('task:moved', task);
  }

  emitTaskCreated(projectId: string, task: any) {
    console.log('✨ Task criada:', task.id);
    this.server.to(`project-${projectId}`).emit('task:created', task);
  }

  emitTaskDeleted(projectId: string, taskId: string) {
    console.log('🗑️ Task deletada:', taskId);
    this.server.to(`project-${projectId}`).emit('task:deleted', taskId);
  }

  emitTaskUpdated(projectId: string, task: any) {
    console.log('📝 Task atualizada:', task.id);
    this.server.to(`project-${projectId}`).emit('task:updated', task);
  }
}
