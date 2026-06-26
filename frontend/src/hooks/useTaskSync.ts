'use client';

import { useEffect } from 'react';
import { socket } from '../lib/socket';
import { useNotifications } from './useNotifications';

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  position: number;
  projectId: string;
  assigneeId?: string | null;
  createdAt: string;
  updatedAt: string;
};

interface UseTaskSyncProps {
  projectId: string;
  onTaskMoved?: (task: Task) => void;
  onTaskCreated?: (task: Task) => void;
  onTaskUpdated?: (task: Task) => void;
  onTaskDeleted?: (taskId: string) => void;
}

export function useTaskSync({
  projectId,
  onTaskMoved,
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
}: UseTaskSyncProps) {
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!projectId) return;

    const currentUserRaw = localStorage.getItem('zent_user');
    const currentUserId = currentUserRaw
      ? (JSON.parse(currentUserRaw)?.id as string | undefined)
      : undefined;

    socket.emit('join-tasks-room', projectId);
    console.log('🟢 Conectado à sala de tasks:', projectId);

    const handleTaskMoved = (payload: any) => {
      const task = payload?.task as Task | undefined;
      const actorUserId = payload?.actorUserId as string | undefined;
      const actorUserName = payload?.actorUserName as string | undefined;

      if (!task) return;

      console.log('🔥 Task movida recebida:', task.id, '→', task.status);

      // Não notificar quem executou a ação
      if (!currentUserId || actorUserId !== currentUserId) {
        const actorLabel = actorUserName ?? 'Usuário';
        addNotification(
          `✅ ${actorLabel} moveu "${task.title}" para ${task.status}.`,
          'task'
        );
      }

      onTaskMoved?.(task);
    };

    const handleTaskCreated = (payload: any) => {
      const task = payload?.task as Task | undefined;
      const actorUserId = payload?.actorUserId as string | undefined;
      const actorUserName = payload?.actorUserName as string | undefined;

      if (!task) return;

      console.log('✨ Task criada recebida:', task.id);

      if (!currentUserId || actorUserId !== currentUserId) {
        const actorLabel = actorUserName ?? 'Usuário';
        addNotification(`🆕 ${actorLabel} criou "${task.title}".`, 'task');
      }

      onTaskCreated?.(task);
    };

    const handleTaskUpdated = (payload: any) => {
      const task = payload?.task as Task | undefined;
      const actorUserId = payload?.actorUserId as string | undefined;
      const actorUserName = payload?.actorUserName as string | undefined;

      if (!task) return;

      console.log('📝 Task atualizada recebida:', task.id);

      if (!currentUserId || actorUserId !== currentUserId) {
        const actorLabel = actorUserName ?? 'Usuário';
        addNotification(`✏️ ${actorLabel} atualizou "${task.title}".`, 'task');
      }

      onTaskUpdated?.(task);
    };

    const handleTaskDeleted = (payload: any) => {
      const taskId = payload?.taskId as string | undefined;
      const actorUserId = payload?.actorUserId as string | undefined;
      const actorUserName = payload?.actorUserName as string | undefined;

      if (!taskId) return;

      console.log('🗑️ Task deletada recebida:', taskId);

      if (!currentUserId || actorUserId !== currentUserId) {
        const actorLabel = actorUserName ?? 'Usuário';
        addNotification(`🗑️ ${actorLabel} removeu a tarefa (id: ${taskId}).`, 'task');
      }

      onTaskDeleted?.(taskId);
    };

    socket.on('task:moved', handleTaskMoved);
    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:deleted', handleTaskDeleted);

    return () => {
      socket.off('task:moved', handleTaskMoved);
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:deleted', handleTaskDeleted);
    };
  }, [projectId, onTaskMoved, onTaskCreated, onTaskUpdated, onTaskDeleted]);
}
