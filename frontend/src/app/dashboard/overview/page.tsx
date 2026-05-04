'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useTheme } from '../../../hooks/useTheme';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  TrendingUp,
  Calendar,
  Users,
  FolderKanban,
  Loader2,
  Clock,
} from 'lucide-react';

type Task = {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string | null;
  createdAt: string;
  assignees?: any[];
  responsible?: any;
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
  recentActivity: any[];
};

export default function DashboardOverviewPage() {
  const router = useRouter();
  const [workspaceId, setWorkspaceId] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);

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

    setWorkspaceId(wsId);
    loadDashboardData(wsId);
  }, [router]);

  async function loadDashboardData(wsId: string) {
    try {
      setLoading(true);
      setError('');

      const projectsData = await api('/projects', { workspaceId: wsId });
      setProjects(projectsData || []);

      const tasksData = await api(`/tasks?projectId=&page=1&pageSize=1000`, {
        workspaceId: wsId,
      });

      const allTasks = tasksData.items || tasksData || [];
      setTasks(allTasks);

      try {
        const activityData = await api('/activities', { workspaceId: wsId });
        const activities = activityData.items || activityData || [];
        setActivityFeed(activities.slice(0, 10));
      } catch {
      }

      calculateStats(allTasks);
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  function calculateStats(allTasks: Task[]) {
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
      recentActivity: [],
    });
  }

  const statusColors = {
    'A fazer': '#7c3aed',
    'Em progresso': '#0ea5e9',
    'Em revisão': '#f59e0b',
    'Concluído': '#10b981',
  };

  const priorityColors = {
    'Baixa': '#6b7280',
    'Média': '#f59e0b',
    'Alta': '#ef4444',
    'Urgente': '#8b0000',
  };

  const completionRate = stats
    ? Math.round((stats.completedTasks / Math.max(stats.totalTasks, 1)) * 100)
    : 0;

  if (!workspaceId) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-zinc-400 mt-2">Visão geral dos seus projetos e tarefas</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-violet-500" />
          </div>
        )}

        {error && !loading && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
            <p className="text-red-400 font-medium">{error}</p>
          </div>
        )}

        {!loading && !error && stats && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm font-medium">Total de Tasks</p>
                    <p className="text-3xl font-bold text-white mt-2">{stats.totalTasks}</p>
                  </div>
                  <div className="rounded-lg bg-violet-500/20 p-3">
                    <FolderKanban className="h-6 w-6 text-violet-400" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm font-medium">Em Progresso</p>
                    <p className="text-3xl font-bold text-white mt-2">{stats.inProgressTasks}</p>
                  </div>
                  <div className="rounded-lg bg-blue-500/20 p-3">
                    <Clock className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm font-medium">Concluídas</p>
                    <p className="text-3xl font-bold text-white mt-2">{stats.completedTasks}</p>
                  </div>
                  <div className="rounded-lg bg-emerald-500/20 p-3">
                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm font-medium">Atrasadas</p>
                    <p className="text-3xl font-bold text-white mt-2">{stats.overdueTasks}</p>
                  </div>
                  <div className="rounded-lg bg-red-500/20 p-3">
                    <AlertCircle className="h-6 w-6 text-red-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Taxa de Conclusão</h3>
                <span className="text-2xl font-bold text-violet-400">{completionRate}%</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-2 mb-8">
              {stats.tasksByStatus && stats.tasksByStatus.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">Tasks por Status</h3>
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
                            key={`cell-${index}`}
                            fill={statusColors[entry.status as keyof typeof statusColors] || '#8b5cf6'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {stats.tasksByPriority && stats.tasksByPriority.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">Tasks por Prioridade</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats.tasksByPriority}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) => `${entry.priority}: ${entry.count}`}
                        outerRadius={100}
                        fill="#8b5cf6"
                        dataKey="count"
                      >
                        {stats.tasksByPriority.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
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

            {projects.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white mb-4">Projetos Ativos</h3>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {projects.map((project) => {
                    const projectTasks = tasks.filter(
                      (t) => t.id === project.id || t.createdAt?.includes(project.id)
                    );
                    const completed = projectTasks.filter((t) => t.status === 'DONE').length;
                    const rate = projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;

                    return (
                      <div
                        key={project.id}
                        className="rounded-lg border border-white/10 bg-white/5 p-4 hover:border-violet-500/50 transition-colors"
                      >
                        <h4 className="font-semibold text-white truncate">{project.name}</h4>
                        {project.description && (
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{project.description}</p>
                        )}
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-zinc-400">{completed} concluídas</span>
                            <span className="text-xs font-semibold text-violet-400">{rate}%</span>
                          </div>
                          <div className="w-full bg-zinc-800 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full rounded-full transition-all"
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
