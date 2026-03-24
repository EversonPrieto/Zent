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
};

type TasksResponse = {
  items: Task[];
};

const columns: { key: TaskStatus; label: string }[] = [
  { key: 'TODO', label: 'A fazer' },
  { key: 'IN_PROGRESS', label: 'Em progresso' },
  { key: 'IN_REVIEW', label: 'Em revisão' },
  { key: 'DONE', label: 'Concluído' },
];

function SortableTaskCard({
  task,
  onClick,
}: {
  task: Task;
  onClick: (task: Task) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onClick(task);
      }}
      className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium">{task.title}</h3>
        <span className="rounded-full bg-zinc-800 px-2 py-1 text-[10px] text-zinc-300">
          {task.priority}
        </span>
      </div>

      <p className="mt-2 text-sm text-zinc-400 break-words whitespace-pre-wrap">
        {task.description || 'Sem descrição'}
      </p>
    </div>
  );
}

function ColumnEndDropZone({ id }: { id: string }) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: 'column-end' },
  });

  return (
    <div
      ref={setNodeRef}
      className={`mt-3 h-12 rounded-xl border border-dashed transition ${isOver ? 'border-green-500 bg-green-500/10' : 'border-zinc-700'
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
  column: { key: TaskStatus; label: string };
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

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border p-4 transition ${isOver ? 'border-zinc-500 bg-zinc-800' : 'border-zinc-800 bg-zinc-900'
        }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">{column.label}</h2>
        <span className="rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-300">
          {tasks.length}
        </span>
      </div>

      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3 min-h-[250px]">
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onClick={onTaskClick}
            />
          ))}

          {tasks.length === 0 && (
            <div className="rounded-xl border border-dashed border-zinc-700 p-4 text-sm text-zinc-500">
              Nenhuma task
            </div>
          )}

          <ColumnEndDropZone id={`${column.key}-end`} />
        </div>
      </SortableContext>

      <button
        onClick={() => onOpenCreateModal(column.key)}
        className="mt-3 text-sm text-zinc-400 hover:text-white"
      >
        + Nova task
      </button>
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
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [createTaskStatus, setCreateTaskStatus] = useState<TaskStatus>('TODO');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  useEffect(() => {
    async function loadBoard() {
      const token = localStorage.getItem('zent_token');
      const wsId = localStorage.getItem('zent_workspace_id');
      const workspaceRaw = localStorage.getItem('zent_workspace');

      if (!token) {
        router.push('/login');
        return;
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

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard/projects')}
            className="mb-4 text-sm text-zinc-400 hover:text-white"
          >
            ← Voltar para projetos
          </button>

          <p className="text-sm text-zinc-400">Workspace</p>
          <h1 className="text-3xl font-bold">{workspaceName || 'Projeto'}</h1>
          <p className="mt-2 text-zinc-400">Board Kanban do projeto</p>
        </div>

        {loading ? <p>Carregando board...</p> : null}
        {error ? <p className="mb-4 text-red-400">{error}</p> : null}

        {!loading && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4">

              {/* KANBAN */}
              <div className="grid flex-1 gap-4 lg:grid-cols-4">
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

              {/* ACTIVITY (lado direito) */}
              <ActivityFeed
                workspaceId={workspaceId}
                projectId={projectId}
              />
            </div>
          </DndContext>
        )}

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
            onCreated={(createdTask) => {
              setTasks((prev) =>
                [...prev, createdTask].sort((a, b) => a.position - b.position),
              );
              setShowCreateTaskModal(false);
            }}
          />
        )}
      </div>
    </main>
  );
}