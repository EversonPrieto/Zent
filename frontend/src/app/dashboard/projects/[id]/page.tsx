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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../../../../lib/api';
import TaskModal from '../../../../components/TaskModal';
import CreateTaskModal from '../../../../components/CreateTaskModal';
import ActivityFeed from '../../../../components/ActivityFeed';
import { useTaskSync } from '../../../../hooks/useTaskSync';
import { usePresence } from '../../../../hooks/usePresence';
import { OnlineUsers } from '../../../../components/OnlineUsers';
import { LinearTaskCard } from '../../../../components/LinearTaskCard';
import {
  ArrowLeft,
  LayoutGrid,
  PlusCircle,
  Loader2,
  AlertCircle,
  FolderKanban,
  Circle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flag,
  GripVertical,
  Sparkles,
  Users
} from 'lucide-react';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

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
  // Linear features
  dueDate?: string | null;
  taskLabels?: Array<{ label: { id: string; name: string; color: string } }>;
  taskAssignees?: Array<{ user: { id: string; name: string; avatarUrl: string | null } }>;
  attachments?: Array<{ id: string; fileName: string }>;
};

type TasksResponse = {
  items: Task[];
};

const columns: { key: TaskStatus; label: string; icon: typeof Circle; color: string }[] = [
  { key: 'TODO', label: 'A fazer', icon: Circle, color: 'text-zinc-400' },
  { key: 'IN_PROGRESS', label: 'Em progresso', icon: Clock, color: 'text-blue-400' },
  { key: 'IN_REVIEW', label: 'Em revisão', icon: AlertTriangle, color: 'text-amber-400' },
  { key: 'DONE', label: 'Concluído', icon: CheckCircle2, color: 'text-emerald-400' },
];

const priorityConfig = {
  LOW: { label: 'Baixa', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  MEDIUM: { label: 'Média', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  HIGH: { label: 'Alta', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  URGENT: { label: 'Urgente', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
};

function ColumnEndDropZone({ id }: { id: string }) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: 'column-end' },
  });

  return (
    <div
      ref={setNodeRef}
      className={`mt-3 h-12 rounded-xl border border-dashed transition-all ${isOver ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10'
        }`}
    />
  );
}

function KanbanColumn({
  column,
  tasks,
  onTaskClick,
  onOpenCreateModal,
}: {
  column: { key: TaskStatus; label: string; icon: typeof Circle; color: string };
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onOpenCreateModal: (status: TaskStatus) => void;
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
      className={`rounded-2xl border transition-all ${isOver ? 'border-violet-500 bg-violet-500/5' : 'border-white/10 bg-white/5'
        } backdrop-blur-sm`}
    >
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${column.color}`} />
            <h2 className="font-semibold text-white">{column.label}</h2>
          </div>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
            {tasks.length}
          </span>
        </div>
      </div>

      <div className="p-3">
        <SortableContext
          items={tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3 min-h-[300px] max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar">
            {tasks.map((task) => (
              <LinearTaskCard
                key={task.id}
                task={task}
                onClick={onTaskClick}
              />
            ))}

            {tasks.length === 0 && (
              <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-6 text-center">
                <Sparkles className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">Nenhuma task</p>
                <p className="text-xs text-zinc-600">Arraste ou crie uma nova</p>
              </div>
            )}

            <ColumnEndDropZone id={`${column.key}-end`} />
          </div>
        </SortableContext>

        <button
          onClick={() => onOpenCreateModal(column.key)}
          className="group mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-2.5 text-sm text-zinc-400 transition-all hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-violet-400"
        >
          <PlusCircle className="h-4 w-4 transition-transform group-hover:rotate-90" />
          Nova task
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
  const projectId = params.id as string;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectName, setProjectName] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [createTaskStatus, setCreateTaskStatus] = useState<TaskStatus>('TODO');

  // Presence tracking
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; avatarUrl: string | null } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  // ✨ Hook para sincronização realtime de tasks
  useTaskSync({
    projectId,
    onTaskMoved: (movedTask) => {
      console.log('🔥 Task movida recebida, atualizando estado:', movedTask.id);
      setTasks((prev) =>
        prev.map((t) => (t.id === movedTask.id ? movedTask : t))
      );
    },
    onTaskCreated: (newTask) => {
      console.log('✨ Task criada recebida, adicionando:', newTask.id);
      setTasks((prev) =>
        [...prev, newTask].sort((a, b) => a.position - b.position)
      );
    },
    onTaskUpdated: (updatedTask) => {
      console.log('📝 Task atualizada recebida:', updatedTask.id);
      setTasks((prev) =>
        prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
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
      
      // Carregar usuário atual
      const userRaw = localStorage.getItem('zent_user');
      if (userRaw) {
        try {
          const user = JSON.parse(userRaw);
          setCurrentUser({
            id: user.id,
            name: user.name,
            avatarUrl: user.avatarUrl || null,
          });
        } catch {
          // fail silently
        }
      }

      if (!token) {
        router.push('/login');
        return;
      }

      // Validar e corrigir wsId se necessário
      if (!wsId || wsId === ':1' || wsId.startsWith(':')) {
        try {
          const workspaces = await api('/workspaces');
          if (workspaces && workspaces.length > 0) {
            const validWsId = workspaces[0].id;
            wsId = validWsId;
            localStorage.setItem('zent_workspace_id', validWsId);
            localStorage.setItem('zent_workspace', JSON.stringify(workspaces[0]));
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

  // Presence tracking - só inicializa quando currentUser está disponível
  const { onlineUsers } = usePresence(
    currentUser ? {
      projectId,
      userId: currentUser.id,
      userName: currentUser.name,
      avatarUrl: currentUser.avatarUrl,
    } : {
      projectId,
      userId: '',
      userName: '',
      avatarUrl: null,
    }
  );

  async function loadProjectName(ws: string) {
    try {
      const project = await api(`/projects/${projectId}`, { workspaceId: ws });
      setProjectName(project.name);
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
    return {
      TODO: tasks
        .filter((t) => t.status === 'TODO')
        .sort((a, b) => a.position - b.position),
      IN_PROGRESS: tasks
        .filter((t) => t.status === 'IN_PROGRESS')
        .sort((a, b) => a.position - b.position),
      IN_REVIEW: tasks
        .filter((t) => t.status === 'IN_REVIEW')
        .sort((a, b) => a.position - b.position),
      DONE: tasks
        .filter((t) => t.status === 'DONE')
        .sort((a, b) => a.position - b.position),
    };
  }, [tasks]);

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

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'DONE').length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <button
            onClick={() => router.push('/dashboard/projects')}
            className="group mb-4 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Voltar para projetos
          </button>

          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FolderKanban className="h-5 w-5 text-violet-400" />
                <span className="text-xs text-zinc-500">Projeto</span>
              </div>
              <h1 className="text-3xl font-bold md:text-4xl bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                {projectName || 'Carregando...'}
              </h1>
              <p className="mt-2 text-zinc-400">
                {workspaceName} • Board Kanban
              </p>
            </div>

            {/* Progress Bar */}
            {totalTasks > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{progress}%</p>
                    <p className="text-xs text-zinc-500">Concluído</p>
                  </div>
                  <div className="h-12 w-px bg-white/10" />
                  <div>
                    <p className="text-sm text-white">
                      {completedTasks}/{totalTasks} tasks
                    </p>
                    <div className="mt-1 h-1.5 w-32 rounded-full bg-white/10 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-violet-500" />
            <p className="mt-4 text-zinc-400">Carregando board...</p>
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

        {/* Kanban Board */}
        {!loading && !error && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragEnd={handleDragEnd}
          >
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Kanban Columns */}
              <div className="flex-1 min-w-0">
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                  {columns.map((col) => (
                    <KanbanColumn
                      key={col.key}
                      column={col}
                      tasks={grouped[col.key]}
                      onTaskClick={setSelectedTask}
                      onOpenCreateModal={openCreateTaskModal}
                    />
                  ))}
                </div>
              </div>

              {/* Online Users & Activity Feed */}
              <div className="lg:w-80 flex-shrink-0">
                <div className="sticky top-24">
                  {/* Online Users */}
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm mb-4">
                    {currentUser && (
                      <OnlineUsers 
                        users={onlineUsers} 
                        currentUserId={currentUser.id}
                      />
                    )}
                  </div>

                  {/* Activity Feed */}
                  <div>
                    <div className="mb-3 flex items-center gap-2 px-2">
                      <Users className="h-4 w-4 text-violet-400" />
                      <h3 className="text-sm font-medium text-zinc-400">Atividade recente</h3>
                    </div>
                    <ActivityFeed
                      workspaceId={workspaceId}
                      projectId={projectId}
                    />
                  </div>
                </div>
              </div>
            </div>
          </DndContext>
        )}

        {/* Modals */}
        <TaskModal
          task={selectedTask}
          workspaceId={workspaceId}
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
            onCreated={() => {
              // Task will be added via useTaskSync socket event (single source of truth)
              setShowCreateTaskModal(false);
            }}
          />
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