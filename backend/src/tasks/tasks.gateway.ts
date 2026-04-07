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

  // Usuário entra na sala do projeto
  @SubscribeMessage('join-tasks-room')
  handleJoinTasksRoom(
    @MessageBody() projectId: string,
    @ConnectedSocket() client: Socket,
  ) {
    console.log('🟢 Usuário entrou na sala de tasks:', projectId);
    client.join(`project-${projectId}`);
  }

  // Emitir quando task é movida
  emitTaskMoved(projectId: string, task: any) {
    console.log('🔥 Task movida:', task.id, '→', task.status);
    this.server.to(`project-${projectId}`).emit('task:moved', task);
  }

  // Emitir quando task é criada
  emitTaskCreated(projectId: string, task: any) {
    console.log('✨ Task criada:', task.id);
    this.server.to(`project-${projectId}`).emit('task:created', task);
  }

  // Emitir quando task é deletada
  emitTaskDeleted(projectId: string, taskId: string) {
    console.log('🗑️ Task deletada:', taskId);
    this.server.to(`project-${projectId}`).emit('task:deleted', taskId);
  }

  // Emitir quando task é atualizada
  emitTaskUpdated(projectId: string, task: any) {
    console.log('📝 Task atualizada:', task.id);
    this.server.to(`project-${projectId}`).emit('task:updated', task);
  }
}
