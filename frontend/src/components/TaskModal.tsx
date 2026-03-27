'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { getWorkspacePermissions, type Permissions } from '../lib/permissions';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  projectId: string;
  assigneeId?: string | null;
  createdAt: string;
  updatedAt: string;
};

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  } | null;
};

type Activity = {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  } | null;
};

type Props = {
  task: Task | null;
  workspaceId: string;
  onClose: () => void;
  onSaved: (task: Task) => void;
  onDeleted?: (taskId: string) => void;
};

const statusOptions: TaskStatus[] = [
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'DONE',
];

const priorityOptions: TaskPriority[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
];

export default function TaskModal({
  task,
  workspaceId,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [checkingPerms, setCheckingPerms] = useState(true);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  useEffect(() => {
    async function loadPermissions() {
      try {
        // Validar workspaceId - se for inválido, não fazer a chamada
        if (!workspaceId || workspaceId.trim() === '' || workspaceId === ':1' || workspaceId.startsWith(':')) {
          console.warn('TaskModal - Invalid workspaceId:', workspaceId);
          console.log('Attempting to fix workspaceId from localStorage...');
          
          // Tentar recuperar do localStorage
          const storedId = typeof window !== 'undefined' ? localStorage.getItem('zent_workspace_id') : null;
          if (storedId && storedId !== ':1' && !storedId.startsWith(':')) {
            console.log('TaskModal - Using workspaceId from localStorage:', storedId);
            // não pode setWorkspaceId aqui (seria loop infinito), então apenas retornar
            setPermissions(null);
            setCheckingPerms(false);
            return;
          }
          
          setPermissions(null);
          setCheckingPerms(false);
          return;
        }

        console.log('TaskModal - workspaceId:', workspaceId, 'type:', typeof workspaceId);
        const perms = await getWorkspacePermissions(workspaceId);
        setPermissions(perms);
      } catch (err) {
        console.error('Erro ao carregar permissões:', err);
        setPermissions(null);
      } finally {
        setCheckingPerms(false);
      }
    }

    loadPermissions();
  }, [workspaceId]);

  useEffect(() => {
    if (!task) return;

    setTitle(task.title);
    setDescription(task.description ?? '');
    setStatus(task.status);
    setPriority(task.priority);
    setError('');
  }, [task]);

  useEffect(() => {
    if (!task) {
      setComments([]);
      return;
    }

    let cancelled = false;

    async function loadComments() {
      try {
        setCommentsLoading(true);

        const data = await api(`/tasks/${task!.id}/comments`, {
          workspaceId,
        });

        if (!cancelled) {
          setComments(data);
        }
      } catch {
        if (!cancelled) {
          setComments([]);
        }
      } finally {
        if (!cancelled) {
          setCommentsLoading(false);
        }
      }
    }

    loadComments();

    return () => {
      cancelled = true;
    };
  }, [task, workspaceId]);

  useEffect(() => {
    if (!task) {
      setActivities([]);
      return;
    }

    let cancelled = false;

    async function loadActivities() {
      try {
        setActivitiesLoading(true);

        const data = await api(`/activity?taskId=${currentTask.id}`, {
          workspaceId,
        });

        if (!cancelled) {
          setActivities(data);
        }
      } catch {
        if (!cancelled) {
          setActivities([]);
        }
      } finally {
        if (!cancelled) {
          setActivitiesLoading(false);
        }
      }
    }

    loadActivities();

    return () => {
      cancelled = true;
    };
  }, [task, workspaceId]);

  if (!task) return null;

  const currentTask = task;

  async function handleSave() {
    if (!title.trim()) return;

    try {
      setLoading(true);
      setError('');

      const updated = await api(`/tasks/${currentTask.id}`, {
        method: 'PATCH',
        workspaceId,
        body: JSON.stringify({
          title,
          description,
          status,
          priority,
        }),
      });

      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar task');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    const confirmDelete = confirm('Tem certeza que deseja deletar esta task?');
    if (!confirmDelete) return;

    try {
      setLoading(true);
      setError('');

      await api(`/tasks/${currentTask.id}`, {
        method: 'DELETE',
        workspaceId,
      });

      setComments([]);
      setActivities([]);
      setNewComment('');
      onDeleted?.(currentTask.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar task');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddComment() {
    if (!newComment.trim()) return;

    try {
      setError('');

      const created = await api(`/tasks/${currentTask.id}/comments`, {
        method: 'POST',
        workspaceId,
        body: JSON.stringify({
          content: newComment,
        }),
      });

      setComments((prev) => [...prev, created]);
      setNewComment('');

      // recarrega activity pra já aparecer o log novo
      try {
        const activityData = await api(`/activity?taskId=${currentTask.id}`, {
          workspaceId,
        });
        setActivities(activityData);
      } catch {}
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar comentário');
    }
  }

  async function handleDeleteComment(commentId: string) {
    try {
      setError('');

      await api(`/comments/${commentId}`, {
        method: 'DELETE',
        workspaceId,
      });

      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar comentário');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-white shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Detalhes da task</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Edite as informações da task
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            Fechar
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-zinc-300">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-300">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 outline-none focus:border-zinc-500"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-zinc-300">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 outline-none focus:border-zinc-500"
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-zinc-300">Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 outline-none focus:border-zinc-500"
              >
                {priorityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          {!checkingPerms && !permissions?.canEditTasks && (
            <div className="rounded-lg border border-red-900 bg-red-900/20 p-3 text-sm text-red-400">
              Você não tem permissão para editar tasks. Apenas MEMBER+ podem editar.
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button
              onClick={handleDelete}
              disabled={!permissions?.canEditTasks || checkingPerms}
              className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Deletar task
            </button>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                Cancelar
              </button>

              <button
                onClick={handleSave}
                disabled={loading || !title.trim() || !permissions?.canEditTasks || checkingPerms}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-60"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-4">
            <h3 className="mb-3 font-semibold">Comentários</h3>

            {commentsLoading ? (
              <p className="text-sm text-zinc-400">Carregando comentários...</p>
            ) : (
              <div className="max-h-60 space-y-3 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="rounded-lg bg-zinc-800 p-3">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>{comment.user?.name ?? 'Usuário'}</span>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        deletar
                      </button>
                    </div>
                    <p className="mt-1 text-sm">{comment.content}</p>
                  </div>
                ))}

                {comments.length === 0 && (
                  <p className="text-sm text-zinc-500">
                    Ainda não há comentários nesta task.
                  </p>
                )}
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                placeholder="Escreva um comentário..."
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-zinc-500"
              />

              <button
                onClick={handleAddComment}
                className="rounded-lg bg-white px-3 py-2 text-sm text-black"
              >
                Enviar
              </button>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-4">
            <h3 className="mb-3 font-semibold">Atividade</h3>

            {activitiesLoading ? (
              <p className="text-sm text-zinc-400">Carregando atividade...</p>
            ) : (
              <div className="max-h-52 space-y-3 overflow-y-auto">
                {activities.map((activity) => (
                  <div key={activity.id} className="rounded-lg bg-zinc-800 p-3">
                    <p className="text-sm text-zinc-300">
                      <span className="font-medium text-white">
                        {activity.user?.name ?? 'Sistema'}
                      </span>{' '}
                      {activity.description}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {new Date(activity.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                ))}

                {activities.length === 0 && (
                  <p className="text-sm text-zinc-500">
                    Nenhuma atividade ainda.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}