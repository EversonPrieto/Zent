'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { io, Socket } from 'socket.io-client';

type Activity = {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
  } | null;
};

export default function ActivityFeed({
  workspaceId,
  projectId,
}: {
  workspaceId: string;
  projectId: string;
}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;

    let socket: Socket;

    async function load() {
      try {
        const data = await api(
          `/activities?projectId=${projectId}`,
          { workspaceId },
        );

        // ✅ CORREÇÃO AQUI
        setActivities(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Erro ao carregar atividades:', err);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    }

    load();

    socket = io('http://localhost:3000', {
      transports: ['websocket'],
    });

    socket.emit('join', workspaceId);

    socket.on('activity:new', (newActivity: Activity) => {
      console.log('🔥 Nova activity recebida:', newActivity);

      setActivities((prev) => {
        const exists = prev.some((a) => a.id === newActivity.id);
        if (exists) return prev;
        return [newActivity, ...prev];
      });
    });

    socket.on('connect', () => {
      console.log('🟢 Socket conectado:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('🔴 Socket desconectado');
    });

    return () => {
      socket.off('activity:new');
      socket.disconnect();
    };
  }, [workspaceId, projectId]);

  function formatDate(date: string) {
    return new Date(date).toLocaleString('pt-BR');
  }

  return (
    <div className="w-full max-w-sm border-l border-zinc-800 bg-zinc-950 p-4">
      <h2 className="mb-4 text-lg font-semibold">Atividade</h2>

      {loading && (
        <p className="text-sm text-zinc-500">Carregando...</p>
      )}

      {!loading && activities.length === 0 && (
        <p className="text-sm text-zinc-500">
          Nenhuma atividade ainda.
        </p>
      )}

      <div className="space-y-4">
        {activities.map((act) => (
          <div
            key={act.id}
            className="text-sm border-b border-zinc-800 pb-2"
          >
            <p className="text-zinc-200">
              <span className="font-medium">
                {act.user?.name ?? 'Alguém'}
              </span>{' '}
              {act.description}
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              {formatDate(act.createdAt)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}