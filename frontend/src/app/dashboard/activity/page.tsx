'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useTheme } from '../../../hooks/useTheme';
import { isPro } from '../../../lib/subscription';
import {
  Activity,
  Clock,
  Calendar,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Edit2,
  PlusCircle,
  Trash2,
  Users,
  Building2,
  Loader2,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

type ActivityType =
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_DELETED'
  | 'TASK_STATUS_CHANGED'
  | 'COMMENT_CREATED'
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'PROJECT_DELETED'
  | 'MEMBER_ADDED'
  | 'MEMBER_REMOVED'
  | string;

type ActivityItem = {
  id: string;
  type: ActivityType;
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

type UserSubscriptionData = {
  plan?: 'free' | 'pro';
  subscriptionEndsAt?: string | null;
};

type ActivityFilter = 'all' | 'tasks' | 'projects' | 'members';

function getActivityIcon(type: string) {
  const iconMap: Record<string, { icon: typeof Activity; color: string; bg: string }> = {
    TASK_CREATED: { icon: PlusCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    TASK_UPDATED: { icon: Edit2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    TASK_DELETED: { icon: Trash2, color: 'text-red-400', bg: 'bg-red-500/10' },
    TASK_STATUS_CHANGED: { icon: CheckCircle2, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    COMMENT_CREATED: { icon: MessageSquare, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    PROJECT_CREATED: { icon: FolderKanban, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    PROJECT_UPDATED: { icon: FolderKanban, color: 'text-sky-400', bg: 'bg-sky-500/10' },
    PROJECT_DELETED: { icon: FolderKanban, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    MEMBER_ADDED: { icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    MEMBER_REMOVED: { icon: Users, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  };

  return iconMap[type] || { icon: Activity, color: 'text-zinc-400', bg: 'bg-zinc-500/10' };
}

function getRelativeDate(date: string) {
  const now = new Date();
  const activityDate = new Date(date);
  const diffMs = now.getTime() - activityDate.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'agora mesmo';
  if (diffMins < 60) return `${diffMins} min atrás`;
  if (diffHours < 24) return `${diffHours} h atrás`;
  if (diffDays === 1) return 'ontem';
  if (diffDays < 7) return `${diffDays} dias atrás`;
  return activityDate.toLocaleDateString('pt-BR');
}

function normalizeActivities(raw: unknown): ActivityItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => item && typeof item === 'object')
    .map((item) => item as ActivityItem)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function isTaskActivity(activity: ActivityItem) {
  return activity.type.startsWith('TASK_') || (activity.type === 'COMMENT_CREATED' && !!activity.task);
}

function isProjectActivity(activity: ActivityItem) {
  return activity.type.startsWith('PROJECT_') || (!!activity.project && !activity.task);
}

function isMemberActivity(activity: ActivityItem) {
  return activity.type === 'MEMBER_ADDED' || activity.type === 'MEMBER_REMOVED';
}

export default function ActivityPage() {
  const router = useRouter();
  const { themeClasses } = useTheme();

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [hasProAccess, setHasProAccess] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 10;

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

      const userData = localStorage.getItem('zent_user');
      if (userData) {
        try {
          const parsed = JSON.parse(userData) as UserSubscriptionData;
          setHasProAccess(
            isPro({
              plan: parsed.plan || 'free',
              subscriptionEndsAt: parsed.subscriptionEndsAt || null,
            }),
          );
        } catch (err) {
          console.error('Error parsing user data:', err);
        }
      }

      if (workspaceRaw) {
        try {
          setWorkspace(JSON.parse(workspaceRaw) as Workspace);
        } catch {
          setWorkspace(null);
        }
      }

      try {
        setLoading(true);
        const response = await api('/activities', { workspaceId });
        const rawList = (response as { items?: unknown }).items ?? response;
        setActivities(normalizeActivities(rawList));
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar atividades');
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

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      if (filter === 'all') return true;
      if (filter === 'tasks') return isTaskActivity(activity);
      if (filter === 'projects') return isProjectActivity(activity);
      if (filter === 'members') return isMemberActivity(activity);
      return true;
    });
  }, [activities, filter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const totalPages = Math.max(1, Math.ceil(filteredActivities.length / pageSize));

  const paginatedActivities = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredActivities.slice(start, start + pageSize);
  }, [filteredActivities, currentPage]);

  const groupedActivities = useMemo(() => {
    return paginatedActivities.reduce((groups, activity) => {
      const date = new Date(activity.createdAt).toLocaleDateString('pt-BR');
      if (!groups[date]) groups[date] = [];
      groups[date].push(activity);
      return groups;
    }, {} as Record<string, ActivityItem[]>);
  }, [paginatedActivities]);

  const todayCount = useMemo(() => {
    const today = new Date().toDateString();
    return activities.filter((a) => new Date(a.createdAt).toDateString() === today).length;
  }, [activities]);

  const taskCount = useMemo(() => activities.filter(isTaskActivity).length, [activities]);
  const projectCount = useMemo(() => activities.filter(isProjectActivity).length, [activities]);
  const memberCount = useMemo(() => activities.filter(isMemberActivity).length, [activities]);

  const filterOptions: { value: ActivityFilter; label: string; icon: typeof Activity }[] = [
    { value: 'all', label: 'Todas', icon: Activity },
    { value: 'tasks', label: 'Tasks', icon: CheckCircle2 },
    { value: 'projects', label: 'Projetos', icon: FolderKanban },
    { value: 'members', label: 'Membros', icon: Users },
  ];

  return (
    <main className={themeClasses.bg.primary}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
        <div className="mb-8 md:mb-12">
          <div className="mb-4 flex items-center gap-2">
            <div className={`inline-flex items-center rounded-full border px-3 py-1 text-sm backdrop-blur-sm ${themeClasses.border.primary} ${themeClasses.bg.tertiary}`}>
              <Activity className="mr-1.5 h-3.5 w-3.5 text-violet-400" />
              <span className={`text-xs ${themeClasses.text.tertiary}`}>Histórico</span>
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                {workspace?.logoUrl ? (
                  <img
                    src={workspace.logoUrl}
                    alt={workspace.name}
                    className="h-8 w-8 rounded-lg object-cover"
                  />
                ) : (
                  <Building2 className="h-6 w-6 text-violet-400" />
                )}
                <span className={`text-sm ${themeClasses.text.tertiary}`}>Workspace</span>
              </div>
              <h1 className={`text-3xl font-bold md:text-4xl ${themeClasses.text.primary}`}>
                {workspace?.name ?? 'Atividade'}
                {hasProAccess && (
                  <span className="ml-3 rounded-full border border-violet-500/30 bg-gradient-to-r from-violet-500/20 to-indigo-500/20 px-3 py-1 text-sm font-semibold text-violet-400">
                    Pro
                  </span>
                )}
              </h1>
              <p className={`mt-2 ${themeClasses.text.tertiary}`}>
                Histórico de atividades do workspace
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-2xl border px-4 py-2 backdrop-blur-sm ${themeClasses.border.primary} ${themeClasses.bg.tertiary}`}>
                <p className={`text-2xl font-bold ${themeClasses.text.primary}`}>{activities.length}</p>
                <p className={`text-xs ${themeClasses.text.tertiary}`}>Total</p>
              </div>
              <div className={`rounded-2xl border px-4 py-2 backdrop-blur-sm ${themeClasses.border.primary} ${themeClasses.bg.tertiary}`}>
                <p className={`text-2xl font-bold ${themeClasses.text.primary}`}>{todayCount}</p>
                <p className={`text-xs ${themeClasses.text.tertiary}`}>Hoje</p>
              </div>
              <div className={`rounded-2xl border px-4 py-2 backdrop-blur-sm ${themeClasses.border.primary} ${themeClasses.bg.tertiary}`}>
                <p className={`text-2xl font-bold ${themeClasses.text.primary}`}>{taskCount}</p>
                <p className={`text-xs ${themeClasses.text.tertiary}`}>Tasks</p>
              </div>
              <div className={`rounded-2xl border px-4 py-2 backdrop-blur-sm ${themeClasses.border.primary} ${themeClasses.bg.tertiary}`}>
                <p className={`text-2xl font-bold ${themeClasses.text.primary}`}>{projectCount + memberCount}</p>
                <p className={`text-xs ${themeClasses.text.tertiary}`}>Projetos/Membros</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {filterOptions.map((option) => {
            const Icon = option.icon;
            const isActive = filter === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-500/25'
                    : `border ${themeClasses.border.primary} ${themeClasses.bg.tertiary} ${themeClasses.text.tertiary}`
                }`}
              >
                <Icon className="h-4 w-4" />
                {option.label}
              </button>
            );
          })}
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-violet-500" />
            <p className={`mt-4 ${themeClasses.text.tertiary}`}>Carregando atividades...</p>
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

        {!loading && !error && filteredActivities.length === 0 && (
          <div className={`rounded-3xl border bg-gradient-to-br p-12 text-center backdrop-blur-sm ${themeClasses.border.primary} ${themeClasses.bg.secondary}`}>
            <div className="mb-6 inline-flex items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 p-4">
              <Activity className="h-12 w-12 text-violet-400" />
            </div>
            <h3 className={`mb-2 text-2xl font-semibold ${themeClasses.text.primary}`}>Nenhuma atividade encontrada</h3>
            <p className={`mx-auto mb-2 max-w-md ${themeClasses.text.tertiary}`}>
              {filter === 'all'
                ? 'Ainda não há atividades registradas nesta workspace.'
                : `Não encontramos atividades para o filtro selecionado.`}
            </p>
          </div>
        )}

        {!loading && !error && filteredActivities.length > 0 && (
          <div className="space-y-8">
            {Object.entries(groupedActivities).map(([date, dateActivities]) => (
              <div key={date}>
                <div className={`sticky top-0 z-10 -mt-2 mb-4 bg-gradient-to-b pt-2 pb-1 ${themeClasses.bg.primary}`}>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-violet-400" />
                    <h3 className={`text-sm font-semibold ${themeClasses.text.tertiary}`}>
                      {date === new Date().toLocaleDateString('pt-BR') ? 'Hoje' : date}
                    </h3>
                    <div className={`h-px flex-1 ${themeClasses.border.primary}`} />
                    <span className={`text-xs ${themeClasses.text.tertiary}`}>
                      {dateActivities.length} {dateActivities.length === 1 ? 'atividade' : 'atividades'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {dateActivities.map((activity) => {
                    const { icon: Icon, color, bg } = getActivityIcon(activity.type);

                    return (
                      <div
                        key={activity.id}
                        className={`group relative rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} p-5 transition-all hover:scale-[1.01] hover:border-violet-500/30 hover:shadow-xl`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${bg}`}>
                            {activity.user?.avatarUrl ? (
                              <img
                                src={activity.user.avatarUrl}
                                alt={activity.user.name}
                                className="h-full w-full rounded-full object-cover"
                              />
                            ) : (
                              <Icon className={`h-5 w-5 ${color}`} />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className={`text-sm ${themeClasses.text.secondary}`}>
                              <span className={`font-medium ${themeClasses.text.primary}`}>
                                {activity.user?.name ?? 'Sistema'}
                              </span>{' '}
                              {activity.description}
                            </p>

                            <div className={`mt-2 flex flex-wrap items-center gap-3 text-xs ${themeClasses.text.muted}`}>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{getRelativeDate(activity.createdAt)}</span>
                              </div>

                              {activity.project && (
                                <div className="flex items-center gap-1">
                                  <FolderKanban className="h-3 w-3" />
                                  <span>{activity.project.name}</span>
                                </div>
                              )}

                              {activity.task && (
                                <div className="flex items-center gap-1">
                                  <ChevronRight className="h-3 w-3" />
                                  <span>{activity.task.title}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border px-4 py-3 sm:flex-row">
              <p className={`text-sm ${themeClasses.text.tertiary}`}>
                Mostrando {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredActivities.length)} de {filteredActivities.length}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>
                <span className={`text-sm ${themeClasses.text.secondary}`}>
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
