'use client';

import { useEffect, useRef } from 'react';
import { ensureSocketConnected, socket } from '../lib/socket';
import { useNotifications } from './useNotifications';

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'ABORTED';
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

  const callbacksRef = useRef({
    onTaskMoved,
    onTaskCreated,
    onTaskUpdated,
    onTaskDeleted,
    addNotification,
  });

  useEffect(() => {
    callbacksRef.current = {
      onTaskMoved,
      onTaskCreated,
      onTaskUpdated,
      onTaskDeleted,
      addNotification,
    };
  }, [onTaskMoved, onTaskCreated, onTaskUpdated, onTaskDeleted, addNotification]);

  useEffect(() => {
    if (!projectId) return;

    const getCurrentUserId = () => {
      try {
        const currentUserRaw = localStorage.getItem('zent_user');

        if (!currentUserRaw) return undefined;

        return JSON.parse(currentUserRaw)?.id as string | undefined;
      } catch {
        return undefined;
      }
    };

    const joinTasksRoom = () => {
      if (!projectId) return;

      console.log('[useTaskSync join-tasks-room emit]', {
        projectId,
        socketConnected: socket.connected,
        socketId: socket.id,
      });

      socket.emit('join-tasks-room', projectId);

      console.log('🟢 Conectado à sala de tasks:', projectId);
    };

    const handleConnect = () => {
      joinTasksRoom();
    };

    const handleTaskMoved = (payload: any) => {
      const task = payload?.task as Task | undefined;
      const actorUserId = payload?.actorUserId as string | undefined;
      const actorUserName = payload?.actorUserName as string | undefined;

      if (!task) return;
      if (task.projectId && task.projectId !== projectId) return;

      console.log('🔥 Task movida recebida:', task.id, '→', task.status);

      const currentUserId = getCurrentUserId();

      if (!currentUserId || actorUserId !== currentUserId) {
        const actorLabel = actorUserName ?? 'Usuário';

        callbacksRef.current.addNotification(
          `✅ ${actorLabel} moveu "${task.title}" para ${task.status}.`,
          'task',
        );
      }

      callbacksRef.current.onTaskMoved?.(task);
    };

    const handleTaskCreated = (payload: any) => {
      const task = payload?.task as Task | undefined;
      const actorUserId = payload?.actorUserId as string | undefined;
      const actorUserName = payload?.actorUserName as string | undefined;

      if (!task) return;
      if (task.projectId && task.projectId !== projectId) return;

      console.log('✨ Task criada recebida:', task.id);

      const currentUserId = getCurrentUserId();

      if (!currentUserId || actorUserId !== currentUserId) {
        const actorLabel = actorUserName ?? 'Usuário';

        callbacksRef.current.addNotification(
          `🆕 ${actorLabel} criou "${task.title}".`,
          'task',
        );
      }

      callbacksRef.current.onTaskCreated?.(task);
    };

    const handleTaskUpdated = (payload: any) => {
      const task = payload?.task as Task | undefined;
      const actorUserId = payload?.actorUserId as string | undefined;
      const actorUserName = payload?.actorUserName as string | undefined;

      if (!task) return;
      if (task.projectId && task.projectId !== projectId) return;

      console.log('📝 Task atualizada recebida:', task.id);

      const currentUserId = getCurrentUserId();

      if (!currentUserId || actorUserId !== currentUserId) {
        const actorLabel = actorUserName ?? 'Usuário';

        callbacksRef.current.addNotification(
          `✏️ ${actorLabel} atualizou "${task.title}".`,
          'task',
        );
      }

      callbacksRef.current.onTaskUpdated?.(task);
    };

    const handleTaskDeleted = (payload: any) => {
      const taskId = payload?.taskId as string | undefined;
      const actorUserId = payload?.actorUserId as string | undefined;
      const actorUserName = payload?.actorUserName as string | undefined;
      const payloadProjectId = payload?.projectId as string | undefined;

      if (!taskId) return;
      if (payloadProjectId && payloadProjectId !== projectId) return;

      console.log('🗑️ Task deletada recebida:', taskId);

      const currentUserId = getCurrentUserId();

      if (!currentUserId || actorUserId !== currentUserId) {
        const actorLabel = actorUserName ?? 'Usuário';

        callbacksRef.current.addNotification(
          `🗑️ ${actorLabel} removeu a tarefa.`,
          'task',
        );
      }

      callbacksRef.current.onTaskDeleted?.(taskId);
    };

    socket.on('connect', handleConnect);
    socket.on('task:moved', handleTaskMoved);
    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:deleted', handleTaskDeleted);

    const connectStarted = ensureSocketConnected();

    if (socket.connected) {
      joinTasksRoom();
    } else if (!connectStarted) {
      console.warn('[useTaskSync] socket não iniciou conexão');
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('task:moved', handleTaskMoved);
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:deleted', handleTaskDeleted);
    };
  }, [projectId]);
}