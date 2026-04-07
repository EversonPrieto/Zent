'use client';

import { useState } from 'react';
import { api } from '../lib/api';
import {
  X,
  PlusCircle,
  Send,
  Clock,
  Flag,
  AlertCircle,
  CheckCircle2,
  Tag,
  FileText,
  Loader2,
  Sparkles
} from 'lucide-react';

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
  workspaceId: string;
  projectId: string;
  initialStatus: TaskStatus;
  onClose: () => void;
  onCreated: (task: Task) => void;
};

const priorityOptions: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const statusConfig = {
  TODO: { label: 'A fazer', icon: Clock, color: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-zinc-500/20' },
  IN_PROGRESS: { label: 'Em progresso', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  IN_REVIEW: { label: 'Em revisão', icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  DONE: { label: 'Concluído', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
};

const priorityConfig = {
  LOW: { label: 'Baixa', icon: Flag, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  MEDIUM: { label: 'Média', icon: Flag, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  HIGH: { label: 'Alta', icon: Flag, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  URGENT: { label: 'Urgente', icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
};

export default function CreateTaskModal({
  workspaceId,
  projectId,
  initialStatus,
  onClose,
  onCreated,
}: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentStatusConfig = statusConfig[initialStatus];
  const StatusIcon = currentStatusConfig.icon;
  const currentPriorityConfig = priorityConfig[priority];
  const PriorityIcon = currentPriorityConfig.icon;

  async function handleCreate() {
    if (!title.trim()) {
      setError('Informe o título da task.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const created = await api('/tasks', {
        method: 'POST',
        workspaceId,
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          priority,
          status: initialStatus,
          projectId,
        }),
      });

      onCreated(created);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar task');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="border-b border-white/10 bg-gradient-to-r from-zinc-900 to-zinc-950 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className={`inline-flex items-center gap-1.5 rounded-full ${currentStatusConfig.bg} px-2.5 py-1`}>
                  <StatusIcon className={`h-3 w-3 ${currentStatusConfig.color}`} />
                  <span className={`text-xs font-medium ${currentStatusConfig.color}`}>
                    {currentStatusConfig.label}
                  </span>
                </div>
                <Sparkles className="h-4 w-4 text-violet-400" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                Nova task
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                Crie uma nova task para organizar seu trabalho
              </p>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-5">
            {/* Title Field */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                <Tag className="h-4 w-4 text-violet-400" />
                Título
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Implementar onboarding, Corrigir bug de login..."
                autoFocus
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-zinc-500 outline-none transition-all focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              />
            </div>

            {/* Description Field */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                <FileText className="h-4 w-4 text-violet-400" />
                Descrição
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Descreva os detalhes da task, requisitos, etc..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-zinc-500 outline-none transition-all focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none"
              />
            </div>

            {/* Priority Field */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                <Flag className="h-4 w-4 text-violet-400" />
                Prioridade
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {priorityOptions.map((option) => {
                  const config = priorityConfig[option];
                  const Icon = config.icon;
                  const isSelected = priority === option;
                  
                  return (
                    <button
                      key={option}
                      onClick={() => setPriority(option)}
                      className={`group relative flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all ${
                        isSelected
                          ? `${config.bg} ${config.border} border-opacity-100`
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${config.color} ${isSelected ? 'scale-110' : ''} transition-transform`} />
                      <span className={`text-xs font-medium ${config.color}`}>
                        {config.label}
                      </span>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-zinc-900" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm text-zinc-400 transition-all hover:bg-white/10 hover:text-white"
              >
                Cancelar
              </button>

              <button
                onClick={handleCreate}
                disabled={loading || !title.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Criar task
                  </>
                )}
              </button>
            </div>

            {/* Tip */}
            <div className="mt-2 rounded-lg border border-white/5 bg-white/5 p-3">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-violet-400 mt-0.5" />
                <p className="text-xs text-zinc-500">
                  Dica: Você pode usar <span className="text-violet-400">#</span> para mencionar tasks e{' '}
                  <span className="text-violet-400">@</span> para mencionar membros da equipe.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}