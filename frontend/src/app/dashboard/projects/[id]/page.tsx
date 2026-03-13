'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  position: number;
  projectId: string;
  assigneeId?: string | null;
  createdAt: string;
  updatedAt: string;
};

type TasksResponse = {
  page: number;
  pageSize: number;
  total: number;
  items: Task[];
};

const columns: { key: TaskStatus; label: string }[] = [
  { key: 'TODO', label: 'A fazer' },
  { key: 'IN_PROGRESS', label: 'Em progresso' },
  { key: 'IN_REVIEW', label: 'Em revisão' },
  { key: 'DONE', label: 'Concluído' },
];

export default function ProjectBoardPage() {
  const params = useParams();
  const router = useRouter();

  const projectId = params.id as string;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [workspaceName, setWorkspaceName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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
        const parsed = JSON.parse(workspaceRaw);
        setWorkspaceName(parsed.name ?? '');
      } catch {}
    }

    async function loadTasks() {
      try {
        const data: TasksResponse = await api(
          `/tasks?projectId=${projectId}&page=1&pageSize=100`,
          { workspaceId: workspaceId! },
        );

        const ordered = [...data.items].sort((a, b) => a.position - b.position);
        setTasks(ordered);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar tasks');
      } finally {
        setLoading(false);
      }
    }

    loadTasks();
  }, [projectId, router]);

  const grouped = useMemo(() => {
    return {
      TODO: tasks.filter((task) => task.status === 'TODO'),
      IN_PROGRESS: tasks.filter((task) => task.status === 'IN_PROGRESS'),
      IN_REVIEW: tasks.filter((task) => task.status === 'IN_REVIEW'),
      DONE: tasks.filter((task) => task.status === 'DONE'),
    };
  }, [tasks]);

  return (
    <main className="min-h-screen bg-zinc-950 text-white px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard/projects')}
            className="mb-4 text-sm text-zinc-400 hover:text-white"
          >
            ← Voltar para projetos
          </button>

          <p className="text-sm text-zinc-400">Workspace</p>
          <h1 className="text-3xl font-bold">{workspaceName || 'Projeto'}</h1>
          <p className="mt-2 text-zinc-400">Board Kanban do projeto</p>
        </div>

        {loading ? <p>Carregando board...</p> : null}
        {error ? <p className="text-red-400">{error}</p> : null}

        {!loading && !error ? (
          <div className="grid gap-4 lg:grid-cols-4">
            {columns.map((column) => (
              <div
                key={column.key}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-semibold">{column.label}</h2>
                  <span className="rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-300">
                    {grouped[column.key].length}
                  </span>
                </div>

                <div className="space-y-3">
                  {grouped[column.key].map((task) => (
                    <div
                      key={task.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-medium">{task.title}</h3>
                        <span className="rounded-full bg-zinc-800 px-2 py-1 text-[10px] text-zinc-300">
                          {task.priority}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-zinc-400">
                        {task.description || 'Sem descrição'}
                      </p>
                    </div>
                  ))}

                  {grouped[column.key].length === 0 ? (
                    <div className="rounded-xl border border-dashed border-zinc-700 p-4 text-sm text-zinc-500">
                      Nenhuma task
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}