'use client';

import { useEffect, useCallback } from 'react';
import { socket } from '../lib/socket';

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface UseCommentSyncOptions {
  taskId: string;
  onCommentCreated?: (comment: Comment) => void;
  onCommentDeleted?: (commentId: string) => void;
}

export function useCommentSync({
  taskId,
  onCommentCreated,
  onCommentDeleted,
}: UseCommentSyncOptions) {
  // Entrar na sala da task
  const joinTask = useCallback(() => {
    socket.emit('join-task', taskId);
    console.log('💬 Entrou na task:', taskId);
  }, [taskId]);

  // Sair da sala da task
  const leaveTask = useCallback(() => {
    socket.emit('leave-task', taskId);
    console.log('💬 Saiu da task:', taskId);
  }, [taskId]);

  // Setup listeners
  useEffect(() => {
    joinTask();

    // Listen para novo comentário
    socket.on('comment:created', (comment: Comment) => {
      console.log('✨ Novo comentário:', comment);
      onCommentCreated?.(comment);
    });

    // Listen para comentário deletado
    socket.on('comment:deleted', (commentId: string) => {
      console.log('🗑️ Comentário deletado:', commentId);
      onCommentDeleted?.(commentId);
    });

    return () => {
      leaveTask();
      socket.off('comment:created');
      socket.off('comment:deleted');
    };
  }, [taskId, joinTask, leaveTask, onCommentCreated, onCommentDeleted]);

  return {
    joinTask,
    leaveTask,
  };
}
