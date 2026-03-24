'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';

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
  refresh = 0,
}: {
  workspaceId: string;
  projectId: string;
  refresh?: number;
}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api(
          `/activity?projectId=${projectId}`, // ✅ rota corrigida
          { workspaceId },
        );

        // 🔥 BLINDAGEM (não quebra nunca)
        if (Array.isArray(data)) {
          setActivities(data);
        } else if (Array.isArray(data?.items)) {
          setActivities(data.items);
        } else {
          setActivities([]);
        }
      } catch {
        setActivities([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [workspaceId, projectId, refresh]);

  function formatDate(date: string) {
    const d = new Date(date);

    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="w-full max-w-sm border-l border-zinc-800 bg-zinc-950 p-4">
      <h2 className="mb-4 text-lg font-semibold">Atividade</h2>

      {loading && (
        <p className="text-sm text-zinc-500">Carregando...</p>
      )}

      {!loading && (activities?.length ?? 0) === 0 && (
        <p className="text-sm text-zinc-500">
          Nenhuma atividade ainda.
        </p>
      )}

      <div className="space-y-4">
        {activities?.map((act) => (
          <div
            key={act.id}
            className="rounded-lg border border-zinc-800 p-3"
          >
            <p className="text-sm text-zinc-200">
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