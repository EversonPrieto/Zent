'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useTheme } from '../../../hooks/useTheme';
import CreateProjectModal from '../../../components/CreateProjectModal';
import {
  FolderKanban,
  PlusCircle,
  Calendar,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
  Building2,
  MoreHorizontal,
  Users,
  CheckCircle2,
  Star
} from 'lucide-react';

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
  const { themeClasses } = useTheme();

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

  function getRelativeDate(date: string) {
    const now = new Date();
    const updated = new Date(date);
    const diffDays = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'hoje';
    if (diffDays === 1) return 'ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    return updated.toLocaleDateString('pt-BR');
  }

  return (
    <main className={`min-h-screen ${themeClasses.bg.primary}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <div className="mb-8 md:mb-12">
          <div className="mb-4 flex items-center gap-2">
            <div className={`inline-flex items-center rounded-full border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-3 py-1 text-sm backdrop-blur-sm`}>
              <Building2 className="h-3.5 w-3.5 mr-1.5 text-violet-400" />
              <span className={`text-xs ${themeClasses.text.secondary}`}>Workspace atual</span>
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className={`text-3xl font-bold md:text-4xl ${themeClasses.text.primary}`}>
                {workspace?.name ?? 'Projetos'}
              </h1>
              <p className={`mt-2 ${themeClasses.text.secondary}`}>
                Gerencie os projetos da workspace selecionada
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-2.5 font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 hover:shadow-violet-500/40"
            >
              <PlusCircle className="h-4 w-4 transition-transform group-hover:rotate-90" />
              Novo projeto
            </button>
          </div>
        </div>

        {!loading && !error && projects.length > 0 && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className={`rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} p-4 backdrop-blur-sm`}>
              <div className="flex items-center justify-between">
                <FolderKanban className="h-5 w-5 text-violet-400" />
                <span className={`text-2xl font-bold ${themeClasses.text.primary}`}>{projects.length}</span>
              </div>
              <p className={`mt-2 text-sm ${themeClasses.text.secondary}`}>Total de projetos</p>
            </div>
            
            <div className={`rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} p-4 backdrop-blur-sm`}>
              <div className="flex items-center justify-between">
                <Calendar className="h-5 w-5 text-emerald-400" />
                <span className={`text-2xl font-bold ${themeClasses.text.primary}`}>
                  {projects.filter(p => new Date(p.createdAt).toDateString() === new Date().toDateString()).length}
                </span>
              </div>
              <p className={`mt-2 text-sm ${themeClasses.text.secondary}`}>Criados hoje</p>
            </div>
            
            <div className={`rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} p-4 backdrop-blur-sm`}>
              <div className="flex items-center justify-between">
                <Users className="h-5 w-5 text-blue-400" />
                <span className={`text-2xl font-bold ${themeClasses.text.primary}`}>—</span>
              </div>
              <p className={`mt-2 text-sm ${themeClasses.text.secondary}`}>Membros ativos</p>
            </div>
            
            <div className={`rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} p-4 backdrop-blur-sm`}>
              <div className="flex items-center justify-between">
                <Star className="h-5 w-5 text-amber-400" />
                <span className={`text-2xl font-bold ${themeClasses.text.primary}`}>—</span>
              </div>
              <p className={`mt-2 text-sm ${themeClasses.text.secondary}`}>Projetos favoritos</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-violet-500" />
            <p className={`mt-4 ${themeClasses.text.secondary}`}>Carregando projetos...</p>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center backdrop-blur-sm">
            <div className="inline-flex items-center justify-center rounded-full bg-red-500/20 p-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <p className="text-red-400 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-400 hover:bg-red-500/30 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className={`rounded-3xl border ${themeClasses.border.primary} bg-gradient-to-br from-violet-500/5 to-indigo-500/5 p-12 text-center backdrop-blur-sm`}>
            <div className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 p-4 mb-6">
              <FolderKanban className="h-12 w-12 text-violet-400" />
            </div>
            <h3 className={`text-2xl font-semibold mb-2 ${themeClasses.text.primary}`}>Nenhum projeto encontrado</h3>
            <p className={`${themeClasses.text.secondary} mb-8 max-w-md mx-auto`}>
              Comece criando seu primeiro projeto para organizar as tarefas da sua equipe.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-6 py-3 font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 hover:shadow-violet-500/40"
            >
              <PlusCircle className="h-5 w-5" />
              Criar primeiro projeto
            </button>
          </div>
        )}

        {!loading && !error && projects.length > 0 && (
          <>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => openProject(project.id)}
                  className={`group relative cursor-pointer rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} p-5 transition-all hover:scale-105 hover:border-violet-500/50 hover:shadow-2xl hover:shadow-violet-500/10 focus:outline-none focus:ring-2 focus:ring-violet-500`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openProject(project.id);
                    }
                  }}
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 opacity-0 transition-opacity group-hover:opacity-100" />
                  
                  <div className="relative">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
                        <FolderKanban className="h-5 w-5 text-violet-400" />
                      </div>
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className={`rounded-lg p-1 ${themeClasses.text.secondary} opacity-0 transition-opacity group-hover:opacity-100 ${themeClasses.bg.hover} cursor-pointer`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                          }
                        }}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </div>
                    </div>

                    <h2 className={`text-xl font-semibold ${themeClasses.text.primary} group-hover:text-violet-400 transition-colors`}>
                      {project.name}
                    </h2>

                    <p className={`mt-2 min-h-[40px] text-sm ${themeClasses.text.secondary} line-clamp-2`}>
                      {project.description || 'Sem descrição'}
                    </p>

                    <div className={`mt-4 flex items-center justify-between border-t ${themeClasses.border.primary} pt-3`}>
                      <div className={`flex items-center gap-1.5 text-xs ${themeClasses.text.secondary}`}>
                        <Clock className="h-3 w-3" />
                        <span>Atualizado {getRelativeDate(project.updatedAt)}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs text-violet-400 opacity-0 transition-all group-hover:opacity-100 group-hover:gap-2">
                        <span>Abrir</span>
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <p className={`text-sm ${themeClasses.text.secondary}`}>
                Mostrando <span className="text-violet-400 font-medium">{projects.length}</span>{' '}
                {projects.length === 1 ? 'projeto' : 'projetos'} nesta workspace
              </p>
            </div>
          </>
        )}
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