'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import CreateProjectModal from '../../../components/CreateProjectModal';

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
  const [workspaceId, setWorkspaceId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function loadPage() {
      const token = localStorage.getItem('zent_token');
      const currentWorkspaceId = localStorage.getItem('zent_workspace_id');
      const workspaceRaw = localStorage.getItem('zent_workspace');

      if (!token) {
        router.push('/login');
        return;
      }

      if (!currentWorkspaceId) {
        router.push('/dashboard');
        return;
      }

      const safeWorkspaceId = currentWorkspaceId;
      setWorkspaceId(safeWorkspaceId);

      if (workspaceRaw) {
        try {
          setWorkspace(JSON.parse(workspaceRaw));
        } catch {
          setWorkspace(null);
        }
      } else {
        setWorkspace(null);
      }

      try {
        setLoading(true);
        const data = await api('/projects', {
          workspaceId: safeWorkspaceId,
        });
        setProjects(data);
        setError('');
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Erro ao carregar projetos',
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

  function openProject(projectId: string) {
    router.push(`/dashboard/projects/${projectId}`);
  }

  function handleProjectCreated(createdProject: Project) {
    setProjects((prev) => [createdProject, ...prev]);
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-sm text-zinc-400">Workspace atual</p>
            <h1 className="text-3xl font-bold">
              {workspace?.name ?? 'Projetos'}
            </h1>
            <p className="mt-2 text-zinc-400">
              Gerencie os projetos da workspace selecionada
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black"
          >
            Novo projeto
          </button>
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

              <p className="mt-2 min-h-[40px] text-sm text-zinc-400">
                {project.description || 'Sem descrição'}
              </p>

              <p className="mt-4 text-xs text-zinc-500">
                Atualizado em{' '}
                {new Date(project.updatedAt).toLocaleDateString('pt-BR')}
              </p>
            </button>
          ))}
        </div>
      </div>

      {showModal && workspaceId !== '' && (
        <CreateProjectModal
          workspaceId={workspaceId}
          onClose={() => setShowModal(false)}
          onCreated={(createdProject: Project) => {
            handleProjectCreated(createdProject);
            setShowModal(false);
          }}
        />
      )}
    </main>
  );
}