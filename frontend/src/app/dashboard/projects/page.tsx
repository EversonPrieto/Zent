'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useTheme } from '../../../hooks/useTheme';
import { getWorkspacePermissions, type Permissions } from '../../../lib/permissions';
import CreateProjectModal from '../../../components/CreateProjectModal';
import EditProjectModal from '../../../components/EditProjectModal';
import {
  FolderKanban,
  PlusCircle,
  Calendar,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
  Building2,
  Users,
  Archive,
  Pencil,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

type Project = {
  id: string;
  name: string;
  description?: string | null;
  completed: boolean;
  completedAt?: string | null;
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [checkingPerms, setCheckingPerms] = useState(true);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'updated_desc' | 'created_desc' | 'name_asc'>('updated_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

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
        const data = await api('/projects', { workspaceId: safeWorkspaceId });
        setProjects(Array.isArray(data) ? data : []);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar projetos');
      } finally {
        setLoading(false);
      }
    }

    loadPage();

    function handleWorkspaceChanged() {
      loadPage();
    }

    window.addEventListener('workspace-changed', handleWorkspaceChanged);
    return () => window.removeEventListener('workspace-changed', handleWorkspaceChanged);
  }, [router]);

  useEffect(() => {
    async function loadPermissions() {
      if (!workspaceId) return;
      try {
        const perms = await getWorkspacePermissions(workspaceId);
        setPermissions(perms);
      } catch (err) {
        console.error('Erro ao carregar permissões:', err);
      } finally {
        setCheckingPerms(false);
      }
    }
    loadPermissions();
  }, [workspaceId]);

  function openProject(projectId: string) {
    router.push(`/dashboard/projects/${projectId}`);
  }

  function handleProjectCreated(createdProject: Project) {
    setProjects((prev) => [createdProject, ...prev]);
  }

  function handleEditProject(project: Project) {
    setSelectedProject(project);
    setShowEditModal(true);
  }

  function handleProjectUpdated(updated: Project) {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setShowEditModal(false);
    setSelectedProject(null);
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

  const projectStats = useMemo(() => {
    const today = new Date().toDateString();
    const total = projects.length;
    const createdToday = projects.filter((p) => new Date(p.createdAt).toDateString() === today).length;
    const completed = projects.filter((p) => p.completed).length;
    const active = total - completed;
    return { total, createdToday, completed, active };
  }, [projects]);

  const filteredAndSortedProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = projects.filter((project) => {
      const matchesQuery =
        normalizedQuery === '' ||
        project.name.toLowerCase().includes(normalizedQuery) ||
        (project.description ?? '').toLowerCase().includes(normalizedQuery);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && !project.completed) ||
        (statusFilter === 'completed' && project.completed);

      return matchesQuery && matchesStatus;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name, 'pt-BR');
      if (sortBy === 'created_desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return sorted;
  }, [projects, query, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedProjects.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedProjects = filteredAndSortedProjects.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter, sortBy]);

  const canCreateProject = !!permissions?.canCreateProject;

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
              <Building2 className="mr-1.5 h-3.5 w-3.5 text-violet-400" />
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

            {!checkingPerms && canCreateProject && (
              <button
                onClick={() => setShowModal(true)}
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-2.5 font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 hover:shadow-violet-500/40"
              >
                <PlusCircle className="h-4 w-4 transition-transform group-hover:rotate-90" />
                Novo projeto
              </button>
            )}
          </div>
        </div>

        {!loading && !error && projects.length > 0 && (
          <>
            <div className="mb-6 grid gap-1.5 md:grid-cols-[minmax(0,1fr)_170px_170px] md:items-center">
              <div className={`flex items-center gap-2 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} px-3 py-2`}>
                <Search className={`h-4 w-4 ${themeClasses.text.secondary}`} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por nome ou descrição"
                  className={`w-full bg-transparent text-sm outline-none ${themeClasses.text.primary}`}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'completed')}
                className={`w-full rounded-lg border ${themeClasses.border.primary} ${themeClasses.bg.secondary} px-2.5 py-1.5 text-sm ${themeClasses.text.primary}`}
              >
                <option value="all">Todos</option>
                <option value="active">Ativos</option>
                <option value="completed">Concluídos</option>
              </select>

              <div className={`flex w-full items-center gap-1 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} px-2.5 py-1.5`}>
                <ArrowUpDown className={`h-4 w-4 ${themeClasses.text.secondary}`} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'updated_desc' | 'created_desc' | 'name_asc')}
                  className={`w-full bg-transparent text-sm outline-none ${themeClasses.text.primary}`}
                >
                  <option value="updated_desc" className="bg-zinc-900 text-zinc-100">Atualizados recentemente</option>
                  <option value="created_desc" className="bg-zinc-900 text-zinc-100">Criados recentemente</option>
                  <option value="name_asc" className="bg-zinc-900 text-zinc-100">Nome (A-Z)</option>
                </select>
              </div>
            </div>

            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className={`rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} p-4 backdrop-blur-sm`}>
                <div className="flex items-center justify-between">
                  <FolderKanban className="h-5 w-5 text-violet-400" />
                  <span className={`text-2xl font-bold ${themeClasses.text.primary}`}>{projectStats.total}</span>
                </div>
                <p className={`mt-2 text-sm ${themeClasses.text.secondary}`}>Total de projetos</p>
              </div>

              <div className={`rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} p-4 backdrop-blur-sm`}>
                <div className="flex items-center justify-between">
                  <Calendar className="h-5 w-5 text-emerald-400" />
                  <span className={`text-2xl font-bold ${themeClasses.text.primary}`}>{projectStats.createdToday}</span>
                </div>
                <p className={`mt-2 text-sm ${themeClasses.text.secondary}`}>Criados hoje</p>
              </div>

              <div className={`rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} p-4 backdrop-blur-sm`}>
                <div className="flex items-center justify-between">
                  <Users className="h-5 w-5 text-blue-400" />
                  <span className={`text-2xl font-bold ${themeClasses.text.primary}`}>{projectStats.active}</span>
                </div>
                <p className={`mt-2 text-sm ${themeClasses.text.secondary}`}>Projetos ativos</p>
              </div>

              <div className={`rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} p-4 backdrop-blur-sm`}>
                <div className="flex items-center justify-between">
                  <Archive className="h-5 w-5 text-amber-400" />
                  <span className={`text-2xl font-bold ${themeClasses.text.primary}`}>{projectStats.completed}</span>
                </div>
                <p className={`mt-2 text-sm ${themeClasses.text.secondary}`}>Projetos concluídos</p>
              </div>
            </div>
          </>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-violet-500" />
            <p className={`mt-4 ${themeClasses.text.secondary}`}>Carregando projetos...</p>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center backdrop-blur-sm">
            <div className="mb-4 inline-flex items-center justify-center rounded-full bg-red-500/20 p-3">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <p className="font-medium text-red-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/30"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className={`rounded-3xl border ${themeClasses.border.primary} bg-gradient-to-br from-violet-500/5 to-indigo-500/5 p-12 text-center backdrop-blur-sm`}>
            <div className="mb-6 inline-flex items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 p-4">
              <FolderKanban className="h-12 w-12 text-violet-400" />
            </div>
            <h3 className={`mb-2 text-2xl font-semibold ${themeClasses.text.primary}`}>Nenhum projeto encontrado</h3>
            <p className={`${themeClasses.text.secondary} mx-auto mb-8 max-w-md`}>
              Comece criando seu primeiro projeto para organizar as tarefas da sua equipe.
            </p>
            {canCreateProject && (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-6 py-3 font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 hover:shadow-violet-500/40"
              >
                <PlusCircle className="h-5 w-5" />
                Criar primeiro projeto
              </button>
            )}
          </div>
        )}

        {!loading && !error && projects.length > 0 && (
          <>
            {paginatedProjects.length === 0 ? (
              <div className={`rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} p-10 text-center`}>
                <p className={`text-sm ${themeClasses.text.secondary}`}>
                  Nenhum projeto encontrado para os filtros atuais.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {paginatedProjects.map((project) => (
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
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
                            <FolderKanban className="h-5 w-5 text-violet-400" />
                          </div>
                          {project.completed && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                              <Archive className="h-3 w-3" />
                              Finalizado
                            </span>
                          )}
                        </div>
                        {!checkingPerms && permissions?.canUpdateProject && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProject(project);
                            }}
                            className={`cursor-pointer rounded-lg p-1 opacity-0 transition-opacity group-hover:opacity-100 ${themeClasses.text.secondary} ${themeClasses.bg.hover}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <h2 className={`text-xl font-semibold transition-colors group-hover:text-violet-400 ${themeClasses.text.primary}`}>
                        {project.name}
                      </h2>

                      <p className={`mt-2 min-h-[40px] line-clamp-2 text-sm ${themeClasses.text.secondary}`}>
                        {project.description || 'Sem descrição'}
                      </p>

                      <div className={`mt-4 flex items-center justify-between border-t pt-3 ${themeClasses.border.primary}`}>
                        <div className={`flex items-center gap-1.5 text-xs ${themeClasses.text.secondary}`}>
                          <Clock className="h-3 w-3" />
                          <span>Atualizado {getRelativeDate(project.updatedAt)}</span>
                        </div>

                        <div className="flex items-center gap-1 text-xs text-violet-400 opacity-0 transition-all group-hover:gap-2 group-hover:opacity-100">
                          <span>Abrir</span>
                          <ArrowRight className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 flex flex-col items-center gap-4">
              <p className={`text-sm ${themeClasses.text.secondary}`}>
                Mostrando{' '}
                <span className="font-medium text-violet-400">
                  {filteredAndSortedProjects.length === 0 ? 0 : startIndex + 1}-
                  {Math.min(startIndex + pageSize, filteredAndSortedProjects.length)}
                </span>{' '}
                de <span className="font-medium text-violet-400">{filteredAndSortedProjects.length}</span> projetos
              </p>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm transition-colors disabled:opacity-40 ${themeClasses.border.primary} ${themeClasses.bg.secondary} ${themeClasses.text.secondary}`}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>

                <span className={`px-3 text-sm ${themeClasses.text.secondary}`}>
                  Página {currentPage} de {totalPages}
                </span>

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm transition-colors disabled:opacity-40 ${themeClasses.border.primary} ${themeClasses.bg.secondary} ${themeClasses.text.secondary}`}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
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

      {showEditModal && selectedProject && workspaceId !== '' && (
        <EditProjectModal
          workspaceId={workspaceId}
          project={selectedProject}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProject(null);
          }}
          onUpdated={handleProjectUpdated}
        />
      )}
    </main>
  );
}
