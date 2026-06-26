'use client';

import { useEffect, useCallback } from 'react';
import { socket } from '../lib/socket';
import { useNotifications } from './useNotifications';

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
  const { addNotification } = useNotifications();

  const joinTask = useCallback(() => {
    socket.emit('join-task', taskId);
    console.log('💬 Entrou na task:', taskId);
  }, [taskId]);

  const leaveTask = useCallback(() => {
    socket.emit('leave-task', taskId);
    console.log('💬 Saiu da task:', taskId);
  }, [taskId]);

  useEffect(() => {
    joinTask();

    const currentUserRaw = localStorage.getItem('zent_user');
    const currentUserId = currentUserRaw ? (JSON.parse(currentUserRaw)?.id as string) : null;

    socket.on('comment:created', (payload: any) => {
      const actorUserId = payload?.actorUserId as string | undefined;
      const actorUserName = payload?.actorUserName as string | undefined;
      const comment = payload?.comment as Comment | undefined;

      if (!comment) return;

      console.log('✨ Novo comentário:', comment);

      // Não notificar quem fez a ação
      if (!currentUserId || actorUserId !== currentUserId) {
        const actorLabel = actorUserName ? `${actorUserName}` : 'Usuário';
        addNotification(`💬 ${actorLabel} comentou na task "${comment.taskId}".`, 'comment');
      }

      onCommentCreated?.(comment);
    });

    socket.on('comment:deleted', (payload: any) => {
      const actorUserId = payload?.actorUserId as string | undefined;
      const actorUserName = payload?.actorUserName as string | undefined;
      const commentId = payload?.commentId as string | undefined;

      if (!commentId) return;

      console.log('🗑️ Comentário deletado:', commentId);

      // Não notificar quem fez a ação
      if (!currentUserId || actorUserId !== currentUserId) {
        const actorLabel = actorUserName ? `${actorUserName}` : 'Usuário';
        addNotification(`💬 ${actorLabel} removeu um comentário (${commentId}).`, 'comment');
      }

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
