'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import {
  Activity,
  Clock,
  Calendar,
  User,
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
  ChevronRight
} from 'lucide-react';

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

// Função para obter o ícone baseado no tipo de atividade
function getActivityIcon(type: string) {
  const iconMap: Record<string, { icon: typeof Activity; color: string; bg: string }> = {
    'TASK_CREATED': { icon: PlusCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    'TASK_UPDATED': { icon: Edit2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    'TASK_DELETED': { icon: Trash2, color: 'text-red-400', bg: 'bg-red-500/10' },
    'TASK_STATUS_CHANGED': { icon: CheckCircle2, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    'COMMENT_CREATED': { icon: MessageSquare, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    'PROJECT_CREATED': { icon: FolderKanban, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    'MEMBER_ADDED': { icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  };
  
  return iconMap[type] || { icon: Activity, color: 'text-zinc-400', bg: 'bg-zinc-500/10' };
}

// Função para formatar data relativa
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

export default function ActivityPage() {
  const router = useRouter();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'tasks' | 'projects' | 'members'>('all');

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

  // Filtrar atividades
  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    if (filter === 'tasks') return activity.task !== undefined;
    if (filter === 'projects') return activity.project !== undefined;
    if (filter === 'members') return activity.type === 'MEMBER_ADDED' || activity.type === 'MEMBER_REMOVED';
    return true;
  });

  // Agrupar atividades por data
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = new Date(activity.createdAt).toLocaleDateString('pt-BR');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, Activity[]>);

  const filterOptions = [
    { value: 'all', label: 'Todas', icon: Activity },
    { value: 'tasks', label: 'Tasks', icon: CheckCircle2 },
    { value: 'projects', label: 'Projetos', icon: FolderKanban },
    { value: 'members', label: 'Membros', icon: Users },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <div className="mb-4 flex items-center gap-2">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm backdrop-blur-sm">
              <Activity className="h-3.5 w-3.5 mr-1.5 text-violet-400" />
              <span className="text-xs text-zinc-400">Histórico</span>
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {workspace?.logoUrl ? (
                  <img
                    src={workspace.logoUrl}
                    alt={workspace.name}
                    className="h-8 w-8 rounded-lg object-cover"
                  />
                ) : (
                  <Building2 className="h-6 w-6 text-violet-400" />
                )}
                <span className="text-sm text-zinc-500">Workspace</span>
              </div>
              <h1 className="text-3xl font-bold md:text-4xl bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                {workspace?.name ?? 'Atividade'}
              </h1>
              <p className="mt-2 text-zinc-400">
                Histórico de atividades do workspace
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
                <p className="text-2xl font-bold text-white">{activities.length}</p>
                <p className="text-xs text-zinc-500">Total de atividades</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
                <p className="text-2xl font-bold text-white">
                  {activities.filter(a => new Date(a.createdAt).toDateString() === new Date().toDateString()).length}
                </p>
                <p className="text-xs text-zinc-500">Hoje</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {filterOptions.map((option) => {
            const Icon = option.icon;
            const isActive = filter === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setFilter(option.value as typeof filter)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-500/25'
                    : 'border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {option.label}
              </button>
            );
          })}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-violet-500" />
            <p className="mt-4 text-zinc-400">Carregando atividades...</p>
          </div>
        )}

        {/* Error State */}
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

        {/* Empty State */}
        {!loading && !error && filteredActivities.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 p-12 text-center backdrop-blur-sm">
            <div className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 p-4 mb-6">
              <Activity className="h-12 w-12 text-violet-400" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">Nenhuma atividade encontrada</h3>
            <p className="text-zinc-400 mb-8 max-w-md mx-auto">
              {filter === 'all' 
                ? 'Ainda não há atividades registradas nesta workspace.'
                : `Nenhuma atividade do tipo "${filter}" encontrada.`}
            </p>
          </div>
        )}

        {/* Activities List */}
        {!loading && !error && filteredActivities.length > 0 && (
          <div className="space-y-8">
            {Object.entries(groupedActivities).map(([date, dateActivities]) => (
              <div key={date}>
                {/* Date Header */}
                <div className="sticky top-0 z-10 mb-4 -mt-2 bg-gradient-to-b from-zinc-950 to-transparent pt-2 pb-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-violet-400" />
                    <h3 className="text-sm font-semibold text-zinc-400">
                      {date === new Date().toLocaleDateString('pt-BR') ? 'Hoje' : date}
                    </h3>
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-xs text-zinc-500">
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
                        className="group relative rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 p-5 transition-all hover:scale-[1.02] hover:border-white/20 hover:shadow-xl"
                      >
                        <div className="flex items-start gap-4">
                          {/* Avatar/Icon */}
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

                          <div className="flex-1 min-w-0">
                            {/* Description */}
                            <p className="text-sm text-zinc-300">
                              <span className="font-medium text-white">
                                {activity.user?.name ?? 'Sistema'}
                              </span>{' '}
                              {activity.description}
                            </p>

                            {/* Metadata */}
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                              <div className="flex items-center gap-1 text-zinc-500">
                                <Clock className="h-3 w-3" />
                                <span>{getRelativeDate(activity.createdAt)}</span>
                              </div>
                              
                              {activity.project && (
                                <div className="flex items-center gap-1 text-zinc-500">
                                  <FolderKanban className="h-3 w-3" />
                                  <span>{activity.project.name}</span>
                                </div>
                              )}

                              {activity.task && (
                                <div className="flex items-center gap-1 text-zinc-500">
                                  <ChevronRight className="h-3 w-3" />
                                  <span>{activity.task.title}</span>
                                </div>
                              )}
                            </div>

                            {/* Full date tooltip on hover */}
                            <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-[10px] text-zinc-600">
                                {new Date(activity.createdAt).toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-sm text-zinc-500">
                Mostrando {filteredActivities.length} {filteredActivities.length === 1 ? 'atividade' : 'atividades'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </main>
  );
}