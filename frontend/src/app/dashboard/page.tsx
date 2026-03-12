'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

type Workspace = {
  id: string;
  name: string;
  logoUrl?: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
};

export default function DashboardPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('zent_token');

    if (!token) {
      router.push('/login');
      return;
    }

    async function loadWorkspaces() {
      try {
        const data = await api('/workspaces');
        setWorkspaces(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar workspaces');
      } finally {
        setLoading(false);
      }
    }

    loadWorkspaces();
  }, [router]);

  function selectWorkspace(workspace: Workspace) {
    localStorage.setItem('zent_workspace_id', workspace.id);
    localStorage.setItem('zent_workspace', JSON.stringify(workspace));
    router.push('/dashboard/projects');
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-2">Suas workspaces</h1>
        <p className="text-zinc-400 mb-8">Escolha uma workspace para continuar</p>

        {loading ? <p>Carregando...</p> : null}
        {error ? <p className="text-red-400">{error}</p> : null}

        {!loading && !error && workspaces.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-zinc-300">Você ainda não possui workspaces.</p>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {workspaces.map((workspace) => (
            <button
              key={workspace.id}
              onClick={() => selectWorkspace(workspace)}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-left transition hover:border-zinc-600 hover:bg-zinc-800"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{workspace.name}</h2>
                <span className="text-xs rounded-full bg-zinc-800 px-2 py-1 text-zinc-300">
                  {workspace.role}
                </span>
              </div>

              <p className="mt-3 text-sm text-zinc-400">
                Clique para abrir esta workspace
              </p>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}