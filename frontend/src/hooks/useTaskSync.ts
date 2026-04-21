'use client';

import { useEffect } from 'react';
import { socket } from '../lib/socket';

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
  useEffect(() => {
    if (!projectId) return;

    socket.emit('join-tasks-room', projectId);
    console.log('🟢 Conectado à sala de tasks:', projectId);

    const handleTaskMoved = (task: Task) => {
      console.log('🔥 Task movida recebida:', task.id, '→', task.status);
      onTaskMoved?.(task);
    };

    const handleTaskCreated = (task: Task) => {
      console.log('✨ Task criada recebida:', task.id);
      onTaskCreated?.(task);
    };

    const handleTaskUpdated = (task: Task) => {
      console.log('📝 Task atualizada recebida:', task.id);
      onTaskUpdated?.(task);
    };

    const handleTaskDeleted = (taskId: string) => {
      console.log('🗑️ Task deletada recebida:', taskId);
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
