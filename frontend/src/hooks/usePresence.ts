'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { ensureSocketConnected, socket } from '../lib/socket';

export interface OnlineUser {
  id: string;
  name: string;
  avatarUrl: string | null;
  joinedAt: Date | string;
  editingTaskId?: string;
}

interface UsePresenceOptions {
  projectId: string;
  userId: string;
  userName: string;
  avatarUrl: string | null;
  onPresenceUpdated?: (users: OnlineUser[]) => void;
}

export function usePresence({
  projectId,
  userId,
  userName,
  avatarUrl,
  onPresenceUpdated,
}: UsePresenceOptions) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [editingUsers, setEditingUsers] = useState<Record<string, string>>({});
  const warnedOnceRef = useRef(false);

  const joinProject = useCallback(() => {
    if (!projectId || !userId || !userName) {
      console.warn('⚠️ Não foi possível entrar no projeto - dados vazios', {
        projectId,
        userId,
        userName,
      });
      return;
    }

    console.log('[Presence join-project emit]', {
      projectId,
      userId,
      userName,
      socketConnected: socket.connected,
      socketId: socket.id,
    });

    socket.emit('join-project', {
      projectId,
      userId,
      name: userName,
      avatarUrl,
    });

    console.log('🟢 Entrou no projeto:', projectId, 'userId:', userId);
  }, [projectId, userId, userName, avatarUrl]);

  const leaveProject = useCallback(() => {
    if (!projectId) return;

    socket.emit('leave-project', projectId);
    console.log('🔴 Saiu do projeto:', projectId);
  }, [projectId]);

  const startEditingTask = useCallback(
    (taskId: string) => {
      if (!projectId || !userId || !taskId) return;

      socket.emit('editing-task', {
        projectId,
        userId,
        taskId,
      });

      console.log(`✏️ Começou a editar task ${taskId}`);
    },
    [projectId, userId],
  );

  const stopEditingTask = useCallback(() => {
    if (!projectId || !userId) return;

    socket.emit('stop-editing-task', {
      projectId,
      userId,
    });

    console.log('⏹️ Parou de editar task');
  }, [projectId, userId]);

  useEffect(() => {
    const missingValues =
      !projectId ||
      !userId ||
      !userName ||
      userId.trim().length === 0 ||
      userName.trim().length === 0;

    if (missingValues) {
      setOnlineUsers([]);
      setEditingUsers({});

      if (!warnedOnceRef.current) {
        console.warn('⚠️ Presence desativado: projectId/userId/userName vazio', {
          projectId,
          userId,
          userName,
        });
        warnedOnceRef.current = true;
      }

      return;
    }

    warnedOnceRef.current = false;

    const handleConnect = () => {
      console.log('🔌 Socket conectado, entrando no projeto...', {
        socketId: socket.id,
      });

      joinProject();
    };

    const handleDisconnect = () => {
      console.log('🔌 Socket desconectado no Presence');
      setOnlineUsers([]);
      setEditingUsers({});
    };

    const handlePresenceUpdated = (data: { users: OnlineUser[] }) => {
      const users = Array.isArray(data?.users) ? data.users : [];

      console.log('👀 Usuários online recebidos:', users);

      setOnlineUsers(users);

      const editing: Record<string, string> = {};

      users.forEach((user) => {
        if (user.editingTaskId) {
          editing[user.id] = user.editingTaskId;
        }
      });

      setEditingUsers(editing);

      onPresenceUpdated?.(users);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('presence:updated', handlePresenceUpdated);

    const connectStarted = ensureSocketConnected();

    if (socket.connected) {
      handleConnect();
    } else if (!connectStarted) {
      console.warn('[Presence] socket não iniciou conexão');
    }

    return () => {
      leaveProject();

      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('presence:updated', handlePresenceUpdated);
    };
  }, [projectId, userId, userName, joinProject, leaveProject, onPresenceUpdated]);

  return {
    onlineUsers,
    editingUsers,
    joinProject,
    leaveProject,
    startEditingTask,
    stopEditingTask,
  };
}