'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';

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

type Props = {
  task: Task | null;
  workspaceId: string;
  onClose: () => void;
  onSaved: (task: Task) => void;
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
}: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!task) return;

    setTitle(task.title);
    setDescription(task.description ?? '');
    setStatus(task.status);
    setPriority(task.priority);
    setError('');
  }, [task]);

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

      await api(`/tasks/${currentTask.id}`, {
        method: 'DELETE',
        workspaceId,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar task');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-white shadow-2xl">
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

          <div className="flex justify-between pt-4">
            <button
              onClick={handleDelete}
              className="text-sm text-red-400 hover:text-red-300"
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
                disabled={loading || !title.trim()}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-60"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}