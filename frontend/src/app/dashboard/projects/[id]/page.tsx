'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { api } from '../../../../lib/api';
import { useTheme } from '../../../../hooks/useTheme';
import TaskModal from '../../../../components/TaskModal';
import CreateTaskModal from '../../../../components/CreateTaskModal';
import TaskFiltersModal, {
  type TaskFilters,
} from '../../../../components/TaskFiltersModal';
import ActivityFeed from '../../../../components/ActivityFeed';
import { useTaskSync } from '../../../../hooks/useTaskSync';
import { usePresence } from '../../../../hooks/usePresence';
import { OnlineUsers } from '../../../../components/OnlineUsers';
import { LinearTaskCard } from '../../../../components/LinearTaskCard';
import {
  ArrowLeft,
  PlusCircle,
  Loader2,
  AlertCircle,
  FolderKanban,
  Circle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flag,
  Sparkles,
  Users,
  Filter,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Archive,
  Activity,
} from 'lucide-react';
import EditProjectModal from '../../../../components/EditProjectModal';
import { useLabels } from '../../../../hooks/useLabels';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'ABORTED';

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  position: number;
  projectId: string;
  assigneeId?: string | null;
  createdAt: string;
  updatedAt: string;
  dueDate?: string | null;
  taskLabels?: Array<{ label: { id: string; name: string; color: string } }>;
  taskAssignees?: Array<{
    user: { id: string; name: string; avatarUrl: string | null };
  }>;
  attachments?: Array<{
    id: string;
    fileName?: string;
    fileType?: string;
    url?: string;
    name?: string;
    size?: number;
    createdAt?: string;
  }>;
};

type TasksResponse = {
  items: Task[];
};

const columns: {
  key: TaskStatus;
  label: string;
  icon: typeof Circle;
  color: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
}[] = [
  {
    key: 'TODO',
    label: 'A fazer',
    icon: Circle,
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-500/5',
    borderColor: 'border-zinc-500/20',
    dotColor: 'bg-zinc-400',
  },
  {
    key: 'IN_PROGRESS',
    label: 'Em progresso',
    icon: Clock,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/5',
    borderColor: 'border-blue-500/20',
    dotColor: 'bg-blue-400',
  },
  {
    key: 'IN_REVIEW',
    label: 'Em revisão',
    icon: AlertTriangle,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/5',
    borderColor: 'border-amber-500/20',
    dotColor: 'bg-amber-400',
  },
  {
    key: 'DONE',
    label: 'Concluído',
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/5',
    borderColor: 'border-emerald-500/20',
    dotColor: 'bg-emerald-400',
  },
  {
    key: 'ABORTED',
    label: 'Cancelado',
    icon: AlertCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/5',
    borderColor: 'border-red-500/20',
    dotColor: 'bg-red-400',
  },
];

// Constantes auxiliares visuais
const sectionHeaderClass = 'flex items-center gap-2 text-xs font-semibold uppercase tracking-wider';
const statBadgeClass = 'rounded-full px-2.5 py-0.5 text-sm font-semibold';
const baseButtonClass = 'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95';
const sidebarCardClass = 'rounded-2xl border backdrop-blur-sm overflow-hidden';

function ColumnEndDropZone({
  id,
  themeClasses,
}: {
  id: string;
  themeClasses: any;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: 'column-end' },
  });

  return (
    <div
      ref={setNodeRef}
      className={`mt-3 h-16 rounded-xl border-2 border-dashed transition-all duration-300 ${
        isOver
          ? 'border-emerald-400 bg-emerald-500/10 scale-105'
          : `${themeClasses.border.primary} hover:border-violet-500/30`
      }`}
    />
  );
}

function KanbanColumn({
  column,
  tasks,
  onTaskClick,
  onOpenCreateModal,
  themeClasses,
}: {
  column: { key: TaskStatus; label: string; icon: typeof Circle; color: string; bgColor: string; borderColor: string; dotColor: string };
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onOpenCreateModal: (status: TaskStatus) => void;
  themeClasses: any;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.key,
    data: {
      type: 'column',
      status: column.key,
    },
  });

  const Icon = column.icon;

  return (
    <div
      ref={setNodeRef}
      className={`flex h-full w-[82vw] min-w-[280px] max-w-[360px] flex-none flex-col rounded-2xl border transition-all duration-300 sm:w-[340px] sm:min-w-[320px] md:w-[360px] lg:w-[330px] xl:w-[340px] ${
        isOver
          ? 'border-violet-400 bg-violet-500/5 shadow-xl shadow-violet-500/10 ring-1 ring-violet-400/30'
          : `${themeClasses.border.primary} ${column.bgColor} ${column.borderColor} hover:shadow-lg hover:shadow-black/5`
      }`}
    >
      {/* Column Header */}
      <div className={`flex-shrink-0 border-b ${themeClasses.border.primary} px-5 py-4`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className={`flex-shrink-0 rounded-lg ${column.color.replace('text', 'bg')}/10 p-2`}>
              <Icon className={`h-5 w-5 ${column.color}`} />
            </div>
            <div className="min-w-0">
              <h2 className={`truncate text-base font-semibold ${themeClasses.text.primary}`}>
                {column.label}
              </h2>
            </div>
          </div>

          <div className={`flex-shrink-0 ${statBadgeClass} ${themeClasses.bg.subtle} ${themeClasses.text.secondary}`}>
            {tasks.length}
          </div>
        </div>
      </div>

      {/* Column Body */}
      <div className="flex min-h-0 flex-1 flex-col p-3">
        <SortableContext
          items={tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="custom-scrollbar flex-1 space-y-2.5 overflow-y-auto overscroll-contain pr-1.5">
            {tasks.map((task) => (
              <LinearTaskCard key={task.id} task={task} onClick={onTaskClick} />
            ))}

            {tasks.length === 0 && (
              <div className={`rounded-xl border-2 border-dashed ${themeClasses.border.primary} px-4 py-10 text-center transition-all duration-300 hover:border-violet-500/30`}>
                <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${column.color.replace('text', 'bg')}/10`}>
                  <Sparkles className={`h-7 w-7 ${column.color}`} />
                </div>
                <p className={`text-sm font-medium ${themeClasses.text.primary}`}>
                  Nenhuma task
                </p>
                <p className={`mt-1 text-xs ${themeClasses.text.tertiary}`}>
                  Arraste tasks para cá ou crie uma nova
                </p>
              </div>
            )}

            <ColumnEndDropZone
              id={`${column.key}-end`}
              themeClasses={themeClasses}
            />
          </div>
        </SortableContext>

        {/* Add Task Button */}
        <button
          onClick={() => onOpenCreateModal(column.key)}
          className={`group mt-3 flex w-full flex-shrink-0 items-center justify-center gap-2.5 rounded-xl border-2 border-dashed ${themeClasses.border.primary} py-3 text-sm font-medium ${themeClasses.text.secondary} transition-all duration-300 hover:border-violet-500/60 hover:bg-violet-500/5 hover:text-violet-400 hover:shadow-md hover:shadow-violet-500/10 active:scale-[0.98]`}
        >
          <PlusCircle className="h-4 w-4 transition-all duration-300 group-hover:rotate-90 group-hover:scale-110" />
          <span className="transition-all duration-300 group-hover:tracking-wide">
            Nova task
          </span>
        </button>
      </div>
    </div>
  );
}

function findTaskStatus(tasks: Task[], taskId: string): TaskStatus | null {
  const task = tasks.find((t) => t.id === taskId);
  return task?.status ?? null;
}

export default function ProjectBoardPage() {
  const params = useParams();
  const router = useRouter();
  const { themeClasses } = useTheme();
  const projectId = params.id as string;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState<string | null>(
    null,
  );
  const [projectCompleted, setProjectCompleted] = useState(false);
  const [projectCreatedAt, setProjectCreatedAt] = useState('');
  const [projectUpdatedAt, setProjectUpdatedAt] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [createTaskStatus, setCreateTaskStatus] = useState<TaskStatus>('TODO');
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [filters, setFilters] = useState<TaskFilters>({});
  const [availableAssignees, setAvailableAssignees] = useState<
    Array<{ id: string; name: string; avatarUrl: string | null }>
  >([]);
  const { labels: availableLabels } = useLabels(workspaceId);
  const [projectMembers, setProjectMembers] = useState<
    Array<{ id: string; name: string; email: string; avatarUrl: string | null }>
  >([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null>(null);

  const [urgencySortEnabled, setUrgencySortEnabled] = useState(false);

  const priorityWeight: Record<string, number> = {
    URGENT: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
    none: 0,
  };

  function sortTasksByPriority(
    tasksToSort: Task[],
    ascending = false,
  ): Task[] {
    return [...tasksToSort].sort((a, b) => {
      const weightA = priorityWeight[a.priority] ?? priorityWeight.none;
      const weightB = priorityWeight[b.priority] ?? priorityWeight.none;
      return ascending ? weightA - weightB : weightB - weightA;
    });
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  useTaskSync({
    projectId,
    onTaskMoved: (movedTask) => {
      console.log('🔥 Task movida recebida, atualizando estado:', movedTask.id);
      setTasks((prev) =>
        prev.map((t) => (t.id === movedTask.id ? { ...t, ...movedTask } : t)),
      );
    },
    onTaskCreated: (newTask) => {
      console.log('✨ Task criada recebida, adicionando:', newTask.id);
      setTasks((prev) =>
        [...prev, newTask].sort((a, b) => a.position - b.position),
      );
    },
    onTaskUpdated: (updatedTask) => {
      console.log('📝 Task atualizada recebida:', updatedTask.id);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === updatedTask.id ? { ...t, ...updatedTask } : t,
        ),
      );
    },
    onTaskDeleted: (deletedTaskId) => {
      console.log('🗑️ Task deletada recebida:', deletedTaskId);
      setTasks((prev) => prev.filter((t) => t.id !== deletedTaskId));
      if (selectedTask?.id === deletedTaskId) {
        setSelectedTask(null);
      }
    },
  });

  useEffect(() => {
    async function loadBoard() {
      const token = localStorage.getItem('zent_token');
      let wsId: string | null = localStorage.getItem('zent_workspace_id');
      const workspaceRaw = localStorage.getItem('zent_workspace');

      const userRaw = localStorage.getItem('zent_user');
      if (userRaw) {
        try {
          const user = JSON.parse(userRaw);
          setCurrentUser({
            id: user.id,
            name: user.name,
            avatarUrl: user.avatarUrl || null,
          });
        } catch {}
      }

      if (!token) {
        router.push('/login');
        return;
      }

      if (!wsId || wsId === ':1' || wsId.startsWith(':')) {
        try {
          const workspaces = await api('/workspaces');
          if (workspaces && workspaces.length > 0) {
            const validWsId = workspaces[0].id;
            wsId = validWsId;
            localStorage.setItem('zent_workspace_id', validWsId);
            localStorage.setItem(
              'zent_workspace',
              JSON.stringify(workspaces[0]),
            );
          } else {
            router.push('/onboarding/workspace');
            return;
          }
        } catch (err) {
          router.push('/dashboard');
          return;
        }
      }

      if (!wsId) {
        router.push('/dashboard');
        return;
      }

      setWorkspaceId(wsId);

      if (workspaceRaw) {
        try {
          const parsed = JSON.parse(workspaceRaw);
          setWorkspaceName(parsed.name ?? '');
        } catch {
          setWorkspaceName('');
        }
      }

      await loadTasks(wsId);
      await loadProjectName(wsId);
    }

    loadBoard();

    function handleWorkspaceChanged() {
      router.push('/dashboard/projects');
    }

    window.addEventListener('workspace-changed', handleWorkspaceChanged);

    return () => {
      window.removeEventListener('workspace-changed', handleWorkspaceChanged);
    };
  }, [projectId, router]);

  const { onlineUsers } = usePresence(
    currentUser
      ? {
          projectId,
          userId: currentUser.id,
          userName: currentUser.name,
          avatarUrl: currentUser.avatarUrl,
        }
      : {
          projectId,
          userId: '',
          userName: '',
          avatarUrl: null,
        },
  );

  console.log('[Kanban debug]', {
    workspaceId,
    projectId,
    currentUser,
    onlineUsers,
  });

  async function loadProjectName(ws: string) {
    try {
      const project = await api(`/projects/${projectId}`, { workspaceId: ws });
      setProjectName(project.name);
      setProjectDescription(project.description || null);
      setProjectCompleted(project.completed || false);
      setProjectCreatedAt(project.createdAt || '');
      setProjectUpdatedAt(project.updatedAt || '');
    } catch {
      setProjectName('Projeto');
    }
  }

  async function loadTasks(ws: string) {
    try {
      const data: TasksResponse = await api(
        `/tasks?projectId=${projectId}&page=1&pageSize=100`,
        { workspaceId: ws },
      );

      setTasks(data.items.sort((a, b) => a.position - b.position));

      try {
        const members = await api(`/workspaces/members`, { workspaceId: ws });
        if (members && Array.isArray(members)) {
          const membersList = members.map((m: any) => ({
            id: m.user.id,
            name: m.user.name,
            email: m.user.email,
            avatarUrl: m.user.avatarUrl || null,
          }));
          setProjectMembers(membersList);

          setAvailableAssignees(
            membersList.map((m) => ({
              id: m.id,
              name: m.name,
              avatarUrl: m.avatarUrl,
            })),
          );
        }
      } catch (err) {
        console.log('Erro ao carregar membros do workspace:', err);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar tasks');
    } finally {
      setLoading(false);
    }
  }

  function openCreateTaskModal(status: TaskStatus) {
    setCreateTaskStatus(status);
    setShowCreateTaskModal(true);
  }

  const grouped = useMemo(() => {
    let filteredTasks = tasks;

    if (filters.searchTerm) {
      filteredTasks = filteredTasks.filter((t) =>
        t.title.toLowerCase().includes(filters.searchTerm!.toLowerCase()),
      );
    }

    if (filters.status && filters.status.length > 0) {
      filteredTasks = filteredTasks.filter((t) =>
        filters.status!.includes(t.status),
      );
    }

    if (filters.priority && filters.priority.length > 0) {
      filteredTasks = filteredTasks.filter((t) =>
        filters.priority!.includes(t.priority),
      );
    }

    if (filters.assigneeIds && filters.assigneeIds.length > 0) {
      filteredTasks = filteredTasks.filter((t) =>
        t.taskAssignees?.some((a) =>
          filters.assigneeIds!.includes(a.user.id),
        ),
      );
    }

    if (filters.dueDateFrom) {
      filteredTasks = filteredTasks.filter(
        (t) =>
          t.dueDate && new Date(t.dueDate) >= new Date(filters.dueDateFrom!),
      );
    }

    if (filters.labelIds && filters.labelIds.length > 0) {
      filteredTasks = filteredTasks.filter((t) =>
        t.taskLabels?.some((tl) => filters.labelIds!.includes(tl.label.id)),
      );
    }

    if (filters.dueDateTo) {
      filteredTasks = filteredTasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) <= new Date(filters.dueDateTo!),
      );
    }

    return {
      TODO: (() => {
        const columnTasks = filteredTasks.filter((t) => t.status === 'TODO');
        return urgencySortEnabled
          ? sortTasksByPriority(columnTasks)
          : columnTasks.sort((a, b) => a.position - b.position);
      })(),
      IN_PROGRESS: (() => {
        const columnTasks = filteredTasks.filter(
          (t) => t.status === 'IN_PROGRESS',
        );
        return urgencySortEnabled
          ? sortTasksByPriority(columnTasks)
          : columnTasks.sort((a, b) => a.position - b.position);
      })(),
      IN_REVIEW: (() => {
        const columnTasks = filteredTasks.filter(
          (t) => t.status === 'IN_REVIEW',
        );
        return urgencySortEnabled
          ? sortTasksByPriority(columnTasks)
          : columnTasks.sort((a, b) => a.position - b.position);
      })(),
      DONE: (() => {
        const columnTasks = filteredTasks.filter((t) => t.status === 'DONE');
        return urgencySortEnabled
          ? sortTasksByPriority(columnTasks)
          : columnTasks.sort((a, b) => a.position - b.position);
      })(),
      ABORTED: (() => {
        const columnTasks = filteredTasks.filter((t) => t.status === 'ABORTED');
        return urgencySortEnabled
          ? sortTasksByPriority(columnTasks)
          : columnTasks.sort((a, b) => a.position - b.position);
      })(),
    };
  }, [tasks, filters, urgencySortEnabled]);

  function getDestinationStatus(overId: string): TaskStatus | null {
    if (columns.some((col) => col.key === overId)) return overId as TaskStatus;
    if (overId.endsWith('-end')) return overId.replace('-end', '') as TaskStatus;
    return findTaskStatus(tasks, overId);
  }

  function optimisticReorder(
    currentTasks: Task[],
    activeId: string,
    destinationStatus: TaskStatus,
    overId: string,
  ) {
    const activeTask = currentTasks.find((t) => t.id === activeId);
    if (!activeTask) return currentTasks;

    const remaining = currentTasks.filter((t) => t.id !== activeId);

    const destinationTasks = remaining
      .filter((t) => t.status === destinationStatus)
      .sort((a, b) => a.position - b.position);

    const movedTask: Task = { ...activeTask, status: destinationStatus };

    let newDestinationTasks: Task[];

    if (columns.some((col) => col.key === overId) || overId.endsWith('-end')) {
      newDestinationTasks = [...destinationTasks, movedTask];
    } else {
      const index = destinationTasks.findIndex((t) => t.id === overId);
      newDestinationTasks = [
        ...destinationTasks.slice(0, index),
        movedTask,
        ...destinationTasks.slice(index),
      ];
    }

    return [
      ...remaining.filter((t) => t.status !== destinationStatus),
      ...newDestinationTasks.map((t, i) => ({
        ...t,
        position: (i + 1) * 1024,
      })),
    ];
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const destinationStatus = getDestinationStatus(overId);
    if (!destinationStatus) return;

    const previous = tasks;
    const next = optimisticReorder(tasks, activeId, destinationStatus, overId);

    setTasks(next);

    const list = next
      .filter((t) => t.status === destinationStatus)
      .sort((a, b) => a.position - b.position);

    let before: Task | null = null;
    let after: Task | null = null;

    if (overId.endsWith('-end')) {
      before = list.length > 1 ? list[list.length - 2] : null;
    } else {
      const i = list.findIndex((t) => t.id === activeId);
      before = i > 0 ? list[i - 1] : null;
      after = i < list.length - 1 ? list[i + 1] : null;
    }

    try {
      await api(`/tasks/${activeId}/move`, {
        method: 'PATCH',
        workspaceId,
        body: JSON.stringify({
          status: destinationStatus,
          beforeId: before?.id,
          afterId: after?.id,
        }),
      });
    } catch {
      setTasks(previous);
    }
  }

  const activeTasks = tasks.filter((t) => t.status !== 'ABORTED');
  const totalTasks = activeTasks.length;
  const completedTasks = activeTasks.filter((t) => t.status === 'DONE').length;
  const abortedTasks = tasks.filter((t) => t.status === 'ABORTED').length;
  const progress =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <main className={`min-h-screen overflow-x-hidden ${themeClasses.bg.primary}`}>
      {/* Background Decorativo */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-violet-500/5 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full px-4 py-6 md:px-6 md:py-8">
        {/* Header Section */}
        <div className="mb-8 w-full">
          {/* Back Button */}
          <button
            onClick={() => router.push('/dashboard/projects')}
            className={`group mb-6 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 ${themeClasses.text.tertiary} hover:${themeClasses.bg.subtle} hover:${themeClasses.text.primary}`}
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
            Voltar para projetos
          </button>

          {/* Title and Actions Row */}
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            {/* Project Info */}
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-lg bg-violet-500/10 px-3 py-1.5">
                  <FolderKanban className="h-4 w-4 flex-shrink-0 text-violet-400" />
                  <span className={`text-xs font-semibold ${themeClasses.text.secondary}`}>
                    Projeto
                  </span>
                </div>
                
                {projectCompleted && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
                    <Archive className="h-3.5 w-3.5" />
                    Finalizado
                  </span>
                )}
              </div>

              <div className="flex min-w-0 items-start gap-3">
                <h1 className={`min-w-0 break-words text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl ${themeClasses.text.primary}`}>
                  {projectName || 'Carregando...'}
                </h1>
                <button
                  onClick={() => setShowEditModal(true)}
                  className={`mt-1.5 flex-shrink-0 rounded-xl p-2.5 transition-all duration-200 ${themeClasses.text.tertiary} hover:${themeClasses.bg.subtle} hover:text-violet-400 hover:shadow-md`}
                  title="Editar projeto"
                >
                  <Pencil className="h-5 w-5" />
                </button>
              </div>

              <p className={`mt-3 text-sm sm:text-base ${themeClasses.text.tertiary}`}>
                {workspaceName} • Board Kanban
              </p>
            </div>

            {/* Actions and Progress */}
            <div className="flex flex-col gap-4 xl:items-end">
              {/* Action Buttons */}
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap xl:w-auto xl:justify-end">
                <button
                  onClick={() => setShowFiltersModal(true)}
                  className={`${baseButtonClass} w-full border border-violet-500/30 bg-violet-500/5 px-5 py-2.5 text-violet-400 hover:border-violet-500/50 hover:bg-violet-500/10 hover:shadow-lg hover:shadow-violet-500/10 sm:w-auto`}
                >
                  <Filter className="h-4 w-4" />
                  Filtrar Tasks
                  {Object.keys(filters).length > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-violet-500/30 px-2 py-0.5 text-xs font-bold">
                      {Object.values(filters).filter((v) => v).length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setUrgencySortEnabled(!urgencySortEnabled)}
                  className={`${baseButtonClass} w-full border-2 px-5 py-2.5 font-semibold sm:w-auto ${
                    urgencySortEnabled
                      ? 'border-red-500 bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'border-red-500/50 bg-red-500 text-white hover:border-red-400 hover:bg-red-600'
                  }`}
                  title={
                    urgencySortEnabled
                      ? 'Desativar ordenação por urgência'
                      : 'Ativar ordenação por urgência'
                  }
                >
                  <Flag className="h-4 w-4" />
                  {urgencySortEnabled ? 'URGÊNCIA ATIVA' : 'Ativar URGÊNCIA'}
                </button>
              </div>

              {/* Progress Card */}
              {totalTasks > 0 && (
                <div className={`w-full rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-5 backdrop-blur-sm transition-all duration-300 hover:shadow-lg xl:w-80`}>
                  <div className="flex items-center gap-5">
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <svg className="h-16 w-16 -rotate-90">
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="6"
                            className="text-zinc-700/30"
                          />
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="6"
                            strokeLinecap="round"
                            className="text-violet-500"
                            strokeDasharray={`${(progress / 100) * 176} 176`}
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className={`text-lg font-bold ${themeClasses.text.primary}`}>
                            {progress}%
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium ${themeClasses.text.primary}`}>
                        Progresso do Projeto
                      </p>
                      <p className={`mt-1 text-sm ${themeClasses.text.secondary}`}>
                        {completedTasks}/{totalTasks} tasks concluídas
                      </p>
                      {abortedTasks > 0 && (
                        <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-red-400">
                          <AlertCircle className="h-3.5 w-3.5" />
                          {abortedTasks} canceladas
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative">
              <Loader2 className="h-14 w-14 animate-spin text-violet-500" />
              <div className="absolute inset-0 h-14 w-14 animate-pulse rounded-full bg-violet-500/20 blur-xl" />
            </div>
            <p className={`mt-6 text-sm font-medium ${themeClasses.text.tertiary}`}>
              Carregando board...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="mx-auto max-w-2xl rounded-2xl border border-red-500/20 bg-red-500/5 p-10 text-center backdrop-blur-sm">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/10">
              <AlertCircle className="h-10 w-10 text-red-400" />
            </div>
            <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>
              Erro ao carregar o board
            </h3>
            <p className="mt-2 text-sm text-red-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 rounded-xl bg-red-500/10 px-6 py-2.5 text-sm font-medium text-red-400 transition-all duration-200 hover:bg-red-500/20 active:scale-95"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Board Content */}
        {!loading && !error && (
          <div className="flex w-full flex-col gap-6 xl:flex-row">
            {/* Kanban Board */}
            <div className="min-w-0 flex-1">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragEnd={handleDragEnd}
              >
                <div className="-mx-4 overflow-x-auto overflow-y-hidden px-4 pb-6 md:-mx-6 md:px-6 xl:mx-0 xl:px-0">
                  <div className="flex h-[calc(100vh-350px)] min-h-[540px] w-max gap-5 sm:h-[calc(100vh-320px)] md:h-[calc(100vh-280px)] lg:h-[calc(100vh-260px)] xl:h-[calc(100vh-240px)] xl:min-h-[580px]">
                    {columns.map((col) => (
                      <KanbanColumn
                        key={col.key}
                        column={col}
                        tasks={grouped[col.key]}
                        onTaskClick={setSelectedTask}
                        onOpenCreateModal={openCreateTaskModal}
                        themeClasses={themeClasses}
                      />
                    ))}
                  </div>
                </div>
              </DndContext>
            </div>

            {/* Sidebar */}
            <div
              className={`hidden flex-shrink-0 flex-col transition-all duration-300 ease-in-out xl:flex ${
                sidebarCollapsed ? 'w-16' : 'w-80'
              }`}
            >
              <div className="sticky top-24 h-[calc(100vh-240px)] space-y-4 overflow-y-auto">
                {/* Toggle Button */}
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className={`flex w-full items-center justify-center rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-2.5 transition-all duration-200 hover:border-violet-500/30 hover:shadow-md`}
                  title={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
                >
                  {sidebarCollapsed ? (
                    <ChevronLeft className={`h-5 w-5 ${themeClasses.text.tertiary}`} />
                  ) : (
                    <ChevronRight className={`h-5 w-5 ${themeClasses.text.tertiary}`} />
                  )}
                </button>

                {/* Online Users Card */}
                <div
                  className={`${sidebarCardClass} ${themeClasses.border.primary} ${themeClasses.bg.secondary} ${
                    sidebarCollapsed ? 'hidden' : 'block'
                  }`}
                >
                  <div className={`border-b ${themeClasses.border.primary} px-5 py-4`}>
                    <div className="flex items-center gap-2.5">
                      <div className="rounded-lg bg-violet-500/10 p-2">
                        <Users className="h-4 w-4 text-violet-400" />
                      </div>
                      <h3 className={`text-sm font-semibold ${themeClasses.text.primary}`}>
                        Online
                      </h3>
                    </div>
                  </div>
                  <div className="p-5">
                    {currentUser && (
                      <OnlineUsers
                        users={onlineUsers}
                        currentUserId={currentUser.id}
                      />
                    )}
                  </div>
                </div>

                {/* Activity Feed Card */}
                <div
                  className={`${sidebarCardClass} ${themeClasses.border.primary} ${themeClasses.bg.secondary} flex-1 ${
                    sidebarCollapsed ? 'hidden' : 'block'
                  }`}
                >
                  <div className={`border-b ${themeClasses.border.primary} px-5 py-4`}>
                    <div className="flex items-center gap-2.5">
                      <div className="rounded-lg bg-violet-500/10 p-2">
                        <Activity className="h-4 w-4 text-violet-400" />
                      </div>
                      <h3 className={`text-sm font-semibold ${themeClasses.text.primary}`}>
                        Atividade recente
                      </h3>
                    </div>
                  </div>
                  <div className="p-5">
                    {typeof workspaceId === 'string' &&
                    workspaceId.length > 0 &&
                    typeof projectId === 'string' &&
                    projectId.length > 0 ? (
                      <>
                        {console.log('[Kanban ActivityFeed props]', {
                          workspaceId,
                          projectId,
                        })}
                        <ActivityFeed
                          workspaceId={workspaceId}
                          projectId={projectId}
                        />
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        <TaskModal
          task={selectedTask}
          workspaceId={workspaceId}
          projectCompleted={projectCompleted}
          onClose={() => setSelectedTask(null)}
          onSaved={(updatedTask) => {
            setTasks((prev) =>
              prev.map((task) =>
                task.id === updatedTask.id ? updatedTask : task,
              ),
            );
            setSelectedTask(updatedTask);
          }}
          onDeleted={(taskId) => {
            setTasks((prev) => prev.filter((task) => task.id !== taskId));
            setSelectedTask(null);
          }}
        />

        {showCreateTaskModal && workspaceId !== '' && (
          <CreateTaskModal
            workspaceId={workspaceId}
            projectId={projectId}
            initialStatus={createTaskStatus}
            onClose={() => setShowCreateTaskModal(false)}
            onCreated={(created: any) => {
              const createdTask = created?.task ?? created;

              if (!createdTask?.id) return;

              setTasks((prev) => {
                if (prev.some((t) => t.id === createdTask.id)) return prev;
                return [...prev, createdTask].sort(
                  (a, b) => a.position - b.position,
                );
              });
            }}
            projectMembers={projectMembers}
            projectCompleted={projectCompleted}
          />
        )}

        <TaskFiltersModal
          isOpen={showFiltersModal}
          onClose={() => setShowFiltersModal(false)}
          onApplyFilters={(newFilters) => {
            setFilters(newFilters);
            setShowFiltersModal(false);
          }}
          availableAssignees={availableAssignees}
          availableLabels={availableLabels}
        />

        {showEditModal && workspaceId !== '' && (
          <EditProjectModal
            workspaceId={workspaceId}
            project={{
              id: projectId,
              name: projectName,
              description: projectDescription,
              completed: projectCompleted,
              completedAt: null,
              createdAt: projectCreatedAt,
              updatedAt: projectUpdatedAt,
            }}
            onClose={() => setShowEditModal(false)}
            onUpdated={(updated) => {
              setProjectName(updated.name);
              setProjectDescription(updated.description ?? null);
              setProjectCompleted(updated.completed);
              setProjectUpdatedAt(updated.updatedAt);
              setShowEditModal(false);
            }}
          />
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 10px;
          margin: 4px 0;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
          border: 2px solid transparent;
          background-clip: padding-box;
        }
      `}</style>
    </main>
  );
}