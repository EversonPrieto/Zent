'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';

type Project = {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

type Workspace = {
  id: string;
  name: string;
  logoUrl?: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
};

export default function ProjectsPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
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
      setWorkspace(JSON.parse(workspaceRaw));
    }

    async function loadProjects() {
      try {
        const data = await api('/projects', { workspaceId: workspaceId! });
        setProjects(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar projetos');
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, [router]);

  function openProject(projectId: string) {
    router.push(`/dashboard/projects/${projectId}`);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm text-zinc-400 mb-2">Workspace atual</p>
          <h1 className="text-3xl font-bold">
            {workspace?.name ?? 'Projetos'}
          </h1>
          <p className="text-zinc-400 mt-2">
            Gerencie os projetos da workspace selecionada
          </p>
        </div>

        {loading ? <p>Carregando projetos...</p> : null}
        {error ? <p className="text-red-400">{error}</p> : null}

        {!loading && !error && projects.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-zinc-300">Nenhum projeto encontrado.</p>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => openProject(project.id)}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-left transition hover:border-zinc-600 hover:bg-zinc-800"
            >
              <h2 className="text-lg font-semibold">{project.name}</h2>

              <p className="mt-2 text-sm text-zinc-400 min-h-[40px]">
                {project.description || 'Sem descrição'}
              </p>

              <p className="mt-4 text-xs text-zinc-500">
                Atualizado em {new Date(project.updatedAt).toLocaleDateString('pt-BR')}
              </p>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}