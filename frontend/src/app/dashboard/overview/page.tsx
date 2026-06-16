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

    const tasksByPriority = Object.entries(priorityMap).map(([priority, count]) => ({
      priority,
      count,
    }));

    setStats({
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      tasksByStatus,
      tasksByPriority,
    });
  }, []);

  const loadDashboardData = useCallback(async (wsId: string) => {
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
  }, [calculateStats]);

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
        setHasProAccess(isPro({
          plan: parsed.plan || 'free',
          subscriptionEndsAt: parsed.subscriptionEndsAt || null,
        }));
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }

    setWorkspaceId(wsId);
    loadDashboardData(wsId);
  }, [router, loadDashboardData]);

  const statusColors = {
    'A fazer': '#7c3aed',
    'Em progresso': '#0ea5e9',
    'Em revisão': '#f59e0b',
    'Concluído': '#10b981',
  };

  const priorityColors = {
    Baixa: '#6b7280',
    Média: '#f59e0b',
    Alta: '#ef4444',
    Urgente: '#8b0000',
  };

  const completionRate = stats
    ? Math.round((stats.completedTasks / Math.max(stats.totalTasks, 1)) * 100)
    : 0;

  if (!workspaceId) {
    return null;
  }

  return (
    <main className={`min-h-screen ${themeClasses.bg.primary}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className={`text-3xl font-bold sm:text-4xl ${themeClasses.text.primary}`}>
              Dashboard
            </h1>
            {hasProAccess && (
              <div className="rounded-full border border-violet-500/30 bg-gradient-to-r from-violet-500/20 to-indigo-500/20 px-3 py-1 text-sm font-semibold text-violet-400">
                Pro
              </div>
            )}
          </div>
          <p className={`mt-2 ${themeClasses.text.tertiary}`}>
            Visão geral dos seus projetos e tarefas
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-violet-500" />
          </div>
        )}

        {error && !loading && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
            <p className="font-medium text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && stats && (
          <>
            <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className={`rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-6 backdrop-blur-sm`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${themeClasses.text.tertiary}`}>Total de Tasks</p>
                    <p className={`mt-2 text-3xl font-bold ${themeClasses.text.primary}`}>{stats.totalTasks}</p>
                  </div>
                  <div className="rounded-lg bg-violet-500/20 p-3">
                    <FolderKanban className="h-6 w-6 text-violet-400" />
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-6 backdrop-blur-sm`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${themeClasses.text.tertiary}`}>Em Progresso</p>
                    <p className={`mt-2 text-3xl font-bold ${themeClasses.text.primary}`}>{stats.inProgressTasks}</p>
                  </div>
                  <div className="rounded-lg bg-blue-500/20 p-3">
                    <Clock className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-6 backdrop-blur-sm`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${themeClasses.text.tertiary}`}>Concluídas</p>
                    <p className={`mt-2 text-3xl font-bold ${themeClasses.text.primary}`}>{stats.completedTasks}</p>
                  </div>
                  <div className="rounded-lg bg-emerald-500/20 p-3">
                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-6 backdrop-blur-sm`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${themeClasses.text.tertiary}`}>Atrasadas</p>
                    <p className={`mt-2 text-3xl font-bold ${themeClasses.text.primary}`}>{stats.overdueTasks}</p>
                  </div>
                  <div className="rounded-lg bg-red-500/20 p-3">
                    <AlertCircle className="h-6 w-6 text-red-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className={`mb-8 rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-6 backdrop-blur-sm`}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>Taxa de Conclusão</h3>
                <span className="text-2xl font-bold text-violet-400">{completionRate}%</span>
              </div>
              <div className={`h-3 w-full overflow-hidden rounded-full ${themeClasses.bg.tertiary}`}>
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>

            <div className="mb-8 grid gap-8 lg:grid-cols-2">
              {stats.tasksByStatus.length > 0 && (
                <div className={`rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-6 backdrop-blur-sm`}>
                  <h3 className={`mb-4 text-lg font-semibold ${themeClasses.text.primary}`}>Tasks por Status</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.tasksByStatus}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="status" stroke="#a1a1aa" />
                      <YAxis stroke="#a1a1aa" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181b',
                          border: '1px solid #3f3f46',
                          borderRadius: '8px',
                        }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
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
              )}

              {stats.tasksByPriority.length > 0 && (
                <div className={`rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-6 backdrop-blur-sm`}>
                  <h3 className={`mb-4 text-lg font-semibold ${themeClasses.text.primary}`}>Tasks por Prioridade</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats.tasksByPriority}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        outerRadius={100}
                        fill="#8b5cf6"
                        dataKey="count"
                      >
                        {stats.tasksByPriority.map((entry, index) => (
                          <Cell
                            key={`priority-cell-${index}`}
                            fill={priorityColors[entry.priority as keyof typeof priorityColors] || '#8b5cf6'}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181b',
                          border: '1px solid #3f3f46',
                          borderRadius: '8px',
                        }}
                        labelStyle={{ color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {projects.length > 0 ? (
              <div className={`rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-6 backdrop-blur-sm`}>
                <h3 className={`mb-4 text-lg font-semibold ${themeClasses.text.primary}`}>Projetos Ativos</h3>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {projects.map((project) => {
                    const projectTasks = tasks.filter((t) => t.projectId === project.id);
                    const completed = projectTasks.filter((t) => t.status === 'DONE').length;
                    const rate = projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;

                    return (
                      <div
                        key={project.id}
                        className={`rounded-lg border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-4 transition-colors hover:border-violet-500/50`}
                      >
                        <h4 className={`truncate font-semibold ${themeClasses.text.primary}`}>{project.name}</h4>
                        {project.description && (
                          <p className={`mt-1 line-clamp-2 text-xs ${themeClasses.text.tertiary}`}>{project.description}</p>
                        )}
                        <div className="mt-3">
                          <div className="mb-1 flex items-center justify-between">
                            <span className={`text-xs ${themeClasses.text.tertiary}`}>{completed} concluídas</span>
                            <span className="text-xs font-semibold text-violet-400">{rate}%</span>
                          </div>
                          <div className={`h-2 w-full rounded-full ${themeClasses.bg.tertiary}`}>
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all"
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
              <div className={`rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-8 text-center`}>
                <FolderKanban className="mx-auto mb-3 h-10 w-10 text-violet-400" />
                <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>Nenhum projeto encontrado</h3>
                <p className={`mt-2 text-sm ${themeClasses.text.tertiary}`}>
                  Crie seu primeiro projeto para acompanhar progresso e métricas nesta visão geral.
                </p>
              </div>
            )}

            <div className={`mt-8 rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-6 backdrop-blur-sm`}>
              <div className="mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-violet-400" />
                <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>Atividade Recente</h3>
              </div>

              {activityFeed.length === 0 ? (
                <p className={`text-sm ${themeClasses.text.tertiary}`}>
                  Ainda não há atividades recentes para este workspace.
                </p>
              ) : (
                <ul className="space-y-3">
                  {activityFeed.map((activity, idx) => (
                    <li
                      key={activity.id || idx}
                      className={`rounded-lg border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-4 py-3`}
                    >
                      <p className={`text-sm ${themeClasses.text.primary}`}>
                        {activity.description || activity.message || 'Atividade registrada'}
                      </p>
                      <p className={`mt-1 text-xs ${themeClasses.text.tertiary}`}>
                        {activity.createdAt ? new Date(activity.createdAt).toLocaleString('pt-BR') : 'Agora'}
                      </p>
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
