'use client';

import { useEffect, useCallback, useState } from 'react';
import { socket } from '../lib/socket';

export interface OnlineUser {
  id: string;
  name: string;
  avatarUrl: string | null;
  joinedAt: Date;
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

  const joinProject = useCallback(() => {
    if (!userId) {
      console.warn('⚠️ Não foi possível entrar no projeto - userId vazio');
      return;
    }
    
    socket.emit('join-project', {
      projectId,
      userId,
      name: userName,
      avatarUrl,
    });
    console.log('🟢 Entrou no projeto:', projectId, 'userId:', userId);
  }, [projectId, userId, userName, avatarUrl]);

  const leaveProject = useCallback(() => {
    socket.emit('leave-project', projectId);
    console.log('🔴 Saiu do projeto:', projectId);
  }, [projectId]);

  const startEditingTask = useCallback(
    (taskId: string) => {
      socket.emit('editing-task', {
        projectId,
        userId,
        taskId,
      });
      console.log(`✏️ Começou a editar task ${taskId}`);
    },
    [projectId, userId]
  );

  const stopEditingTask = useCallback(() => {
    socket.emit('stop-editing-task', {
      projectId,
      userId,
    });
    console.log(`⏹️ Parou de editar task`);
  }, [projectId, userId]);

  useEffect(() => {

    if (!userId || !userName) {
      console.warn('⚠️ Não será possível entrar no projeto - userId ou userName vazio');
      return;
    }

    const handleConnect = () => {
      console.log('🔌 Socket conectado, entrando no projeto...');
      joinProject();
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.once('connect', handleConnect);
    }

    const handlePresenceUpdated = (data: { users: OnlineUser[] }) => {
      console.log('👀 Usuários online recebidos:', data.users.length, data.users.map(u => `${u.name}(${u.id})`));
      setOnlineUsers(data.users);

      const editing: Record<string, string> = {};
      data.users.forEach((user) => {
        if (user.editingTaskId) {
          editing[user.id] = user.editingTaskId;
        }
      });
      setEditingUsers(editing);

      onPresenceUpdated?.(data.users);
    };

    socket.on('presence:updated', handlePresenceUpdated);

    return () => {
      leaveProject();
      socket.off('presence:updated', handlePresenceUpdated);
      socket.off('connect', handleConnect);
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
