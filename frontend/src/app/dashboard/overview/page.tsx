'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useTheme } from '../../../hooks/useTheme';
import { isPro } from '../../../lib/subscription';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  CheckCircle2,
  AlertCircle,
  FolderKanban,
  Loader2,
  Clock,
  Activity,
} from 'lucide-react';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

type UserRef = {
  id?: string;
  name?: string;
  email?: string;
};

type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  createdAt: string;
  projectId?: string;
  assignees?: UserRef[];
  responsible?: UserRef;
};

type ActivityItem = {
  id?: string;
  description?: string;
  message?: string;
  createdAt?: string;
};

type Project = {
  id: string;
  name: string;
  description?: string;
};

type DashboardStats = {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  tasksByStatus: { status: string; count: number }[];
  tasksByPriority: { priority: string; count: number }[];
};

type UserSubscriptionData = {
  plan?: 'free' | 'pro';
  subscriptionEndsAt?: string | null;
};

const statusColors = {
  'A fazer': '#7c3aed',
  'Em progresso': '#0ea5e9',
  'Em revisão': '#f59e0b',
  Concluído: '#10b981',
} as const;

const priorityColors = {
  Baixa: '#6b7280',
  Média: '#f59e0b',
  Alta: '#ef4444',
  Urgente: '#8b0000',
} as const;

const priorityOrder = ['Baixa', 'Média', 'Alta', 'Urgente'] as const;

const statusGradients = {
  'A fazer': 'from-violet-500 to-violet-600',
  'Em progresso': 'from-sky-500 to-sky-600',
  'Em revisão': 'from-amber-500 to-amber-600',
  Concluído: 'from-emerald-500 to-emerald-600',
} as const;

const statCardStyles = {
  total: {
    icon: FolderKanban,
    gradient: 'from-violet-500/20 to-violet-600/10',
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-400',
    borderHover: 'hover:border-violet-500/30',
  },
  progress: {
    icon: Clock,
    gradient: 'from-sky-500/20 to-sky-600/10',
    iconBg: 'bg-sky-500/10',
    iconColor: 'text-sky-400',
    borderHover: 'hover:border-sky-500/30',
  },
  completed: {
    icon: CheckCircle2,
    gradient: 'from-emerald-500/20 to-emerald-600/10',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    borderHover: 'hover:border-emerald-500/30',
  },
  overdue: {
    icon: AlertCircle,
    gradient: 'from-red-500/20 to-red-600/10',
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-400',
    borderHover: 'hover:border-red-500/30',
  },
} as const;

export default function DashboardOverviewPage() {
  const router = useRouter();
  const { themeClasses } = useTheme();

  const [workspaceId, setWorkspaceId] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [hasProAccess, setHasProAccess] = useState(false);

  const calculateStats = useCallback((allTasks: Task[]) => {
    const now = new Date();
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.status === 'DONE').length;
    const inProgressTasks = allTasks.filter((t) => t.status === 'IN_PROGRESS').length;

    const overdueTasks = allTasks.filter((t) => {
      if (t.status === 'DONE' || !t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      return dueDate < now;
    }).length;

    const statusMap: Record<string, number> = {};

    allTasks.forEach((t) => {
      const statusLabel =
        t.status === 'TODO'
          ? 'A fazer'
          : t.status === 'IN_PROGRESS'
            ? 'Em progresso'
            : t.status === 'IN_REVIEW'
              ? 'Em revisão'
              : 'Concluído';

      statusMap[statusLabel] = (statusMap[statusLabel] || 0) + 1;
    });

    const tasksByStatus = Object.entries(statusMap).map(([status, count]) => ({
      status,
      count,
    }));

    const priorityMap: Record<string, number> = {};

    allTasks.forEach((t) => {
      const priorityLabel =
        t.priority === 'LOW'
          ? 'Baixa'
          : t.priority === 'MEDIUM'
            ? 'Média'
            : t.priority === 'HIGH'
              ? 'Alta'
              : 'Urgente';

      priorityMap[priorityLabel] = (priorityMap[priorityLabel] || 0) + 1;
    });

    const tasksByPriority = priorityOrder
      .map((priority) => ({
        priority,
        count: priorityMap[priority] || 0,
      }))
      .filter((item) => item.count > 0);

    setStats({
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      tasksByStatus,
      tasksByPriority,
    });
  }, []);

  const loadDashboardData = useCallback(
    async (wsId: string) => {
      try {
        setLoading(true);
        setError('');

        const projectsData = await api('/projects', { workspaceId: wsId });
        setProjects((projectsData || []) as Project[]);

        const tasksData = await api('/tasks?projectId=&page=1&pageSize=1000', {
          workspaceId: wsId,
        });

        const allTasks = (tasksData.items || tasksData || []) as Task[];
        setTasks(allTasks);

        try {
          const activityData = await api('/activities', { workspaceId: wsId });
          const activities = (activityData.items || activityData || []) as ActivityItem[];
          setActivityFeed(activities.slice(0, 10));
        } catch {
          setActivityFeed([]);
        }

        calculateStats(allTasks);
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    },
    [calculateStats],
  );

  useEffect(() => {
    const token = localStorage.getItem('zent_token');

    if (!token) {
      router.push('/login');
      return;
    }

    const wsId = localStorage.getItem('zent_workspace_id');

    if (!wsId) {
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

    setWorkspaceId(wsId);
    loadDashboardData(wsId);
  }, [router, loadDashboardData]);

  const completionRate = stats
    ? Math.round((stats.completedTasks / Math.max(stats.totalTasks, 1)) * 100)
    : 0;

  const chartCardClass = `rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-5 backdrop-blur-sm transition-shadow duration-300 hover:shadow-lg sm:p-6`;
  const sectionClass = `rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-5 backdrop-blur-sm transition-shadow duration-300 hover:shadow-lg sm:p-6`;

  if (!workspaceId) {
    return null;
  }

  return (
    <main className={`relative min-h-screen overflow-x-hidden ${themeClasses.bg.primary}`}>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-violet-500/10 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[100px]" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/5 blur-[80px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="mb-8 sm:mb-10">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1">
              <h1 className={`text-3xl font-bold tracking-tight sm:text-4xl ${themeClasses.text.primary}`}>
                Dashboard
              </h1>
              <p className={`mt-2 text-sm leading-relaxed sm:text-base ${themeClasses.text.tertiary}`}>
                Visão geral dos seus projetos e tarefas
              </p>
            </div>

            {hasProAccess && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 px-4 py-1.5">
                <span className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                <span className="text-sm font-semibold text-violet-400">Pro</span>
              </div>
            )}
          </div>
        </div>

        {loading && (
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-violet-500 sm:h-14 sm:w-14" />
              <div className="absolute inset-0 h-12 w-12 animate-pulse rounded-full bg-violet-500/20 blur-xl sm:h-14 sm:w-14" />
            </div>
            <p className={`text-sm ${themeClasses.text.tertiary}`}>Carregando dashboard...</p>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 backdrop-blur-sm sm:p-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="rounded-full bg-red-500/10 p-3">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>

              <div>
                <p className="text-lg font-semibold text-red-400">Erro ao carregar dados</p>
                <p className="mt-1 text-sm text-red-400/80">{error}</p>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && stats && (
          <>
            <div className="mb-8 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
              <div
                className={`group relative overflow-hidden rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/5 sm:p-6 ${statCardStyles.total.borderHover}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${statCardStyles.total.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />

                <div className="relative flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-medium uppercase tracking-wider sm:text-sm ${themeClasses.text.tertiary}`}>
                      Total de Tasks
                    </p>
                    <p className={`mt-2 text-3xl font-bold tracking-tight sm:text-4xl ${themeClasses.text.primary}`}>
                      {stats.totalTasks}
                    </p>
                  </div>

                  <div className={`flex-shrink-0 rounded-xl ${statCardStyles.total.iconBg} p-2.5 transition-transform duration-300 group-hover:scale-110 sm:p-3`}>
                    <FolderKanban className={`h-5 w-5 sm:h-6 sm:w-6 ${statCardStyles.total.iconColor}`} />
                  </div>
                </div>
              </div>

              <div
                className={`group relative overflow-hidden rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-500/5 sm:p-6 ${statCardStyles.progress.borderHover}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${statCardStyles.progress.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />

                <div className="relative flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-medium uppercase tracking-wider sm:text-sm ${themeClasses.text.tertiary}`}>
                      Em Progresso
                    </p>
                    <p className={`mt-2 text-3xl font-bold tracking-tight sm:text-4xl ${themeClasses.text.primary}`}>
                      {stats.inProgressTasks}
                    </p>
                  </div>

                  <div className={`flex-shrink-0 rounded-xl ${statCardStyles.progress.iconBg} p-2.5 transition-transform duration-300 group-hover:scale-110 sm:p-3`}>
                    <Clock className={`h-5 w-5 sm:h-6 sm:w-6 ${statCardStyles.progress.iconColor}`} />
                  </div>
                </div>
              </div>

              <div
                className={`group relative overflow-hidden rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/5 sm:p-6 ${statCardStyles.completed.borderHover}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${statCardStyles.completed.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />

                <div className="relative flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-medium uppercase tracking-wider sm:text-sm ${themeClasses.text.tertiary}`}>
                      Concluídas
                    </p>
                    <p className={`mt-2 text-3xl font-bold tracking-tight sm:text-4xl ${themeClasses.text.primary}`}>
                      {stats.completedTasks}
                    </p>
                  </div>

                  <div className={`flex-shrink-0 rounded-xl ${statCardStyles.completed.iconBg} p-2.5 transition-transform duration-300 group-hover:scale-110 sm:p-3`}>
                    <CheckCircle2 className={`h-5 w-5 sm:h-6 sm:w-6 ${statCardStyles.completed.iconColor}`} />
                  </div>
                </div>
              </div>

              <div
                className={`group relative overflow-hidden rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-red-500/5 sm:p-6 ${statCardStyles.overdue.borderHover}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${statCardStyles.overdue.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />

                <div className="relative flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-medium uppercase tracking-wider sm:text-sm ${themeClasses.text.tertiary}`}>
                      Atrasadas
                    </p>
                    <p className={`mt-2 text-3xl font-bold tracking-tight sm:text-4xl ${themeClasses.text.primary}`}>
                      {stats.overdueTasks}
                    </p>
                  </div>

                  <div className={`flex-shrink-0 rounded-xl ${statCardStyles.overdue.iconBg} p-2.5 transition-transform duration-300 group-hover:scale-110 sm:p-3`}>
                    <AlertCircle className={`h-5 w-5 sm:h-6 sm:w-6 ${statCardStyles.overdue.iconColor}`} />
                  </div>
                </div>
              </div>
            </div>

            <div className={`mb-8 ${sectionClass}`}>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className={`text-base font-semibold sm:text-lg ${themeClasses.text.primary}`}>
                  Taxa de Conclusão
                </h3>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">
                    {stats.completedTasks} de {stats.totalTasks} tasks
                  </span>

                  <span className="inline-flex items-center rounded-full bg-violet-500/10 px-3 py-1 text-lg font-bold text-violet-400 sm:text-xl">
                    {completionRate}%
                  </span>
                </div>
              </div>

              <div className={`relative h-4 w-full overflow-hidden rounded-full ${themeClasses.bg.tertiary}`}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 transition-all duration-700 ease-out"
                  style={{ width: `${completionRate}%` }}
                />

                {completionRate > 0 && (
                  <div
                    className="absolute inset-0 animate-shimmer rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    style={{ width: `${completionRate}%` }}
                  />
                )}
              </div>
            </div>

            <div className="mb-8 grid gap-6 lg:grid-cols-2 lg:gap-8">
              {stats.tasksByStatus.length > 0 && (
                <div className={chartCardClass}>
                  <h3 className={`mb-6 text-base font-semibold sm:text-lg ${themeClasses.text.primary}`}>
                    Tasks por Status
                  </h3>

                  <div className="h-[280px] w-full sm:h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats.tasksByStatus}
                        margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" strokeOpacity={0.5} />

                        <XAxis
                          dataKey="status"
                          stroke="#a1a1aa"
                          tick={{ fontSize: 12, fontWeight: 500 }}
                          interval={0}
                          tickFormatter={(value) =>
                            value === 'Em progresso'
                              ? 'Progresso'
                              : value === 'Em revisão'
                                ? 'Revisão'
                                : value
                          }
                        />

                        <YAxis stroke="#a1a1aa" tick={{ fontSize: 12 }} allowDecimals={false} />

                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#18181b',
                            border: '1px solid #3f3f46',
                            borderRadius: '12px',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
                          }}
                          labelStyle={{
                            color: '#ffffff',
                            fontWeight: 600,
                          }}
                          itemStyle={{
                            color: '#a855f7',
                            fontWeight: 600,
                          }}
                          cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                        />

                        <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={60}>
                          {stats.tasksByStatus.map((entry, index) => (
                            <Cell
                              key={`status-cell-${index}`}
                              fill={statusColors[entry.status as keyof typeof statusColors] || '#8b5cf6'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {stats.tasksByPriority.length > 0 && (
                <div className={chartCardClass}>
                  <h3 className={`mb-6 text-base font-semibold sm:text-lg ${themeClasses.text.primary}`}>
                    Tasks por Prioridade
                  </h3>

                  <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center">
                    <div className="h-[260px] w-full sm:h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.tasksByPriority}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={false}
                            outerRadius="80%"
                            innerRadius="50%"
                            fill="#8b5cf6"
                            dataKey="count"
                            paddingAngle={2}
                          >
                            {stats.tasksByPriority.map((entry, index) => (
                              <Cell
                                key={`priority-cell-${index}`}
                                fill={priorityColors[entry.priority as keyof typeof priorityColors] || '#8b5cf6'}
                                stroke="transparent"
                              />
                            ))}
                          </Pie>

                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#18181b',
                              border: '1px solid #3f3f46',
                              borderRadius: '12px',
                              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
                            }}
                            labelStyle={{ color: '#fff', fontWeight: 600 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex flex-col gap-2 sm:gap-3">
                      {stats.tasksByPriority.map((item) => (
                        <div
                          key={item.priority}
                          className={`flex items-center justify-between gap-3 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} px-4 py-2.5 transition-colors hover:border-gray-600`}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              className="h-3 w-3 flex-shrink-0 rounded-full shadow-lg"
                              style={{
                                backgroundColor:
                                  priorityColors[item.priority as keyof typeof priorityColors] || '#8b5cf6',
                                boxShadow: `0 0 8px ${
                                  priorityColors[item.priority as keyof typeof priorityColors] || '#8b5cf6'
                                }40`,
                              }}
                            />

                            <span className={`truncate text-sm font-medium ${themeClasses.text.secondary}`}>
                              {item.priority}
                            </span>
                          </div>

                          <span className={`text-sm font-bold ${themeClasses.text.primary}`}>
                            {item.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {projects.length > 0 ? (
              <div className={`mb-8 ${sectionClass}`}>
                <div className="mb-6 flex items-center justify-between">
                  <h3 className={`text-base font-semibold sm:text-lg ${themeClasses.text.primary}`}>
                    Projetos Ativos
                  </h3>

                  <span className={`text-sm ${themeClasses.text.tertiary}`}>
                    {projects.length} projeto{projects.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {projects.map((project) => {
                    const projectTasks = tasks.filter((t) => t.projectId === project.id);
                    const completed = projectTasks.filter((t) => t.status === 'DONE').length;
                    const rate =
                      projectTasks.length > 0
                        ? Math.round((completed / projectTasks.length) * 100)
                        : 0;

                    return (
                      <div
                        key={project.id}
                        className={`group min-w-0 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} p-5 transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/5`}
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <h4 className={`truncate font-semibold ${themeClasses.text.primary}`}>
                            {project.name}
                          </h4>

                          <span className="flex-shrink-0 rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-semibold text-violet-400">
                            {projectTasks.length}
                          </span>
                        </div>

                        {project.description && (
                          <p className={`mb-4 line-clamp-2 text-sm leading-relaxed ${themeClasses.text.tertiary}`}>
                            {project.description}
                          </p>
                        )}

                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs ${themeClasses.text.tertiary}`}>
                              {completed} de {projectTasks.length} concluídas
                            </span>

                            <span className="text-xs font-bold text-violet-400">
                              {rate}%
                            </span>
                          </div>

                          <div className={`relative h-2 w-full overflow-hidden rounded-full ${themeClasses.bg.tertiary}`}>
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500 group-hover:from-violet-400 group-hover:to-indigo-400"
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className={`mb-8 rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-8 text-center backdrop-blur-sm sm:p-12`}>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 sm:h-20 sm:w-20">
                  <FolderKanban className="h-8 w-8 text-violet-400 sm:h-10 sm:w-10" />
                </div>

                <h3 className={`text-lg font-semibold sm:text-xl ${themeClasses.text.primary}`}>
                  Nenhum projeto encontrado
                </h3>

                <p className={`mx-auto mt-2 max-w-md text-sm leading-relaxed ${themeClasses.text.tertiary}`}>
                  Crie seu primeiro projeto para acompanhar progresso e métricas nesta visão geral.
                </p>
              </div>
            )}

            <div className={sectionClass}>
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-lg bg-violet-500/10 p-2">
                  <Activity className="h-5 w-5 text-violet-400" />
                </div>

                <h3 className={`text-base font-semibold sm:text-lg ${themeClasses.text.primary}`}>
                  Atividade Recente
                </h3>
              </div>

              {activityFeed.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Activity className="h-8 w-8 text-gray-600" />

                  <p className={`text-sm ${themeClasses.text.tertiary}`}>
                    Ainda não há atividades recentes para este workspace.
                  </p>
                </div>
              ) : (
                <ul className="relative space-y-0">
                  {activityFeed.map((activity, idx) => (
                    <li
                      key={activity.id || idx}
                      className={`group relative flex gap-4 border-b ${themeClasses.border.primary} px-4 py-4 transition-colors last:border-b-0 hover:${themeClasses.bg.secondary} sm:px-6`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.5)]" />

                        {idx < activityFeed.length - 1 && (
                          <div className="absolute left-1 top-3 h-full w-px bg-gray-700/50" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className={`text-sm leading-relaxed ${themeClasses.text.primary}`}>
                          {activity.description || activity.message || 'Atividade registrada'}
                        </p>

                        <p className={`mt-1 text-xs font-medium ${themeClasses.text.tertiary}`}>
                          {activity.createdAt
                            ? new Date(activity.createdAt).toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Agora'}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}