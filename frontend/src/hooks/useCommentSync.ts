'use client';

import { useCallback, useEffect, useRef } from 'react';
import { ensureSocketConnected, socket } from '../lib/socket';
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
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface UseCommentSyncOptions {
  taskId: string;
  onCommentCreated?: (comment: Comment) => void;
  onCommentDeleted?: (commentId: string) => void;
}

function getValidTaskId(taskId: string) {
  if (!taskId || typeof taskId !== 'string') return null;

  const trimmedTaskId = taskId.trim();

  return trimmedTaskId.length > 0 ? trimmedTaskId : null;
}

export function useCommentSync({
  taskId,
  onCommentCreated,
  onCommentDeleted,
}: UseCommentSyncOptions) {
  const { addNotification } = useNotifications();

  const callbacksRef = useRef({
    onCommentCreated,
    onCommentDeleted,
    addNotification,
  });

  useEffect(() => {
    callbacksRef.current = {
      onCommentCreated,
      onCommentDeleted,
      addNotification,
    };
  }, [onCommentCreated, onCommentDeleted, addNotification]);

  const joinTask = useCallback(() => {
    const validTaskId = getValidTaskId(taskId);

    if (!validTaskId) {
      return;
    }

    if (!socket.connected) {
      ensureSocketConnected();
      return;
    }

    socket.emit('join-task', validTaskId);

    console.log('💬 Entrou na task:', validTaskId);
  }, [taskId]);

  const leaveTask = useCallback(() => {
    const validTaskId = getValidTaskId(taskId);

    if (!validTaskId) {
      return;
    }

    if (!socket.connected) {
      return;
    }

    socket.emit('leave-task', validTaskId);

    console.log('💬 Saiu da task:', validTaskId);
  }, [taskId]);

  useEffect(() => {
    const validTaskId = getValidTaskId(taskId);

    if (!validTaskId) {
      return;
    }

    const getCurrentUserId = () => {
      try {
        const currentUserRaw = localStorage.getItem('zent_user');

        if (!currentUserRaw) return null;

        return JSON.parse(currentUserRaw)?.id as string | null;
      } catch {
        return null;
      }
    };

    const handleConnect = () => {
      socket.emit('join-task', validTaskId);

      console.log('💬 Entrou na task:', validTaskId);
    };

    const handleCommentCreated = (payload: any) => {
      const actorUserId = payload?.actorUserId as string | undefined;
      const actorUserName = payload?.actorUserName as string | undefined;
      const comment = payload?.comment as Comment | undefined;

      if (!comment) return;
      if (comment.taskId && comment.taskId !== validTaskId) return;

      console.log('✨ Novo comentário:', comment);

      const currentUserId = getCurrentUserId();

      if (!currentUserId || actorUserId !== currentUserId) {
        const actorLabel = actorUserName ?? 'Usuário';

        callbacksRef.current.addNotification(
          `💬 ${actorLabel} comentou na task "${comment.taskId}".`,
          'comment',
        );
      }

      callbacksRef.current.onCommentCreated?.(comment);
    };

    const handleCommentDeleted = (payload: any) => {
      const actorUserId = payload?.actorUserId as string | undefined;
      const actorUserName = payload?.actorUserName as string | undefined;
      const commentId = payload?.commentId as string | undefined;
      const payloadTaskId = payload?.taskId as string | undefined;

      if (!commentId) return;
      if (payloadTaskId && payloadTaskId !== validTaskId) return;

      console.log('🗑️ Comentário deletado:', commentId);

      const currentUserId = getCurrentUserId();

      if (!currentUserId || actorUserId !== currentUserId) {
        const actorLabel = actorUserName ?? 'Usuário';

        callbacksRef.current.addNotification(
          `💬 ${actorLabel} removeu um comentário.`,
          'comment',
        );
      }

      callbacksRef.current.onCommentDeleted?.(commentId);
    };

    socket.on('connect', handleConnect);
    socket.on('comment:created', handleCommentCreated);
    socket.on('comment:deleted', handleCommentDeleted);

    const connectStarted = ensureSocketConnected();

    if (socket.connected) {
      handleConnect();
    } else if (!connectStarted) {
      console.warn('[useCommentSync] socket não iniciou conexão');
    }

    return () => {
      if (socket.connected) {
        socket.emit('leave-task', validTaskId);

        console.log('💬 Saiu da task:', validTaskId);
      }

      socket.off('connect', handleConnect);
      socket.off('comment:created', handleCommentCreated);
      socket.off('comment:deleted', handleCommentDeleted);
    };
  }, [taskId]);

  return {
    joinTask,
    leaveTask,
  };
}