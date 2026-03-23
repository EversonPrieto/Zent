'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';

type Activity = {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
  project?: {
    id: string;
    name: string;
  } | null;
  task?: {
    id: string;
    title: string;
    status: string;
  } | null;
};

type Workspace = {
  id: string;
  name: string;
  logoUrl?: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
};

export default function ActivityPage() {
  const router = useRouter();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPage() {
      const token = localStorage.getItem('zent_token');
      const workspaceId = localStorage.getItem('zent_workspace_id');
      const workspaceRaw = localStorage.getItem('zent_workspace');

      if (!token) {
        router.push('/login');
        return;
      }

      if (!workspaceId) {
        router.push('/dashboard');
        return;
      }

      if (workspaceRaw) {
        try {
          setWorkspace(JSON.parse(workspaceRaw));
        } catch {
          setWorkspace(null);
        }
      }

      try {
        setLoading(true);

        const data = await api('/activity', {
          workspaceId,
        });

        setActivities(data);
        setError('');
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Erro ao carregar atividades',
        );
      } finally {
        setLoading(false);
      }
    }

    loadPage();

    function handleWorkspaceChanged() {
      loadPage();
    }

    window.addEventListener('workspace-changed', handleWorkspaceChanged);

    return () => {
      window.removeEventListener('workspace-changed', handleWorkspaceChanged);
    };
  }, [router]);

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="mb-2 text-sm text-zinc-400">Workspace</p>
          <h1 className="text-3xl font-bold">
            {workspace?.name ?? 'Atividade'}
          </h1>
          <p className="mt-2 text-zinc-400">
            Histórico de atividades do workspace
          </p>
        </div>

        {loading ? <p>Carregando atividades...</p> : null}
        {error ? <p className="text-red-400">{error}</p> : null}

        {!loading && !error && activities.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-zinc-300">Nenhuma atividade encontrada.</p>
          </div>
        ) : null}

        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-white">
                  {activity.user?.name?.charAt(0).toUpperCase() ?? 'S'}
                </div>

                <div className="flex-1">
                  <p className="text-sm text-zinc-300">
                    <span className="font-medium text-white">
                      {activity.user?.name ?? 'Sistema'}
                    </span>{' '}
                    {activity.description}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-500">
                    <span>
                      {new Date(activity.createdAt).toLocaleString('pt-BR')}
                    </span>

                    {activity.project ? (
                      <span>Projeto: {activity.project.name}</span>
                    ) : null}

                    {activity.task ? (
                      <span>Task: {activity.task.title}</span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}