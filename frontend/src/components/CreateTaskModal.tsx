'use client';

import { useState } from 'react';
import { api } from '../lib/api';
import { useTheme } from '../hooks/useTheme';
import {
  X,
  Send,
  Clock,
  Flag,
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
  Calendar,
  Users,
  ChevronDown
} from 'lucide-react';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'ABORTED';
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
  dueDate?: string | null;
  taskLabels?: Array<{ label: { id: string; name: string; color: string } }>;
  taskAssignees?: Array<{ user: { id: string; name: string; avatarUrl: string | null } }>;
};

type WorkspaceMember = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
};

type Props = {
  workspaceId: string;
  projectId: string;
  initialStatus: TaskStatus;
  onClose: () => void;
  onCreated: (task: Task) => void;
  projectMembers?: WorkspaceMember[];
};

const priorityOptions: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const statusOptions: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'ABORTED'];

const statusConfig = {
  TODO: { label: 'A fazer', icon: Clock, color: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-zinc-500/20' },
  IN_PROGRESS: { label: 'Em progresso', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  IN_REVIEW: { label: 'Em revisão', icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  DONE: { label: 'Concluído', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  ABORTED: { label: 'Cancelado', icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
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
  projectMembers = [],
}: Props) {
  const { themeClasses } = useTheme();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showAssigneesDropdown, setShowAssigneesDropdown] = useState(false);

  const currentStatusConfig = statusConfig[status];
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
          status,
          projectId,
          dueDate: dueDate || null,
          assigneeIds: selectedAssignees,
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
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm animate-in fade-in duration-200`}>
      <div className={`relative w-full max-w-lg max-h-[90vh] overflow-hidden rounded-2xl border shadow-2xl animate-in slide-in-from-bottom-4 duration-300 flex flex-col ${themeClasses.bg.primary} ${themeClasses.border.primary}`}>
        <div className={`border-b p-6 ${themeClasses.border.primary} ${themeClasses.bg.primary} flex-shrink-0`}>
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
              <h2 className={`text-2xl font-bold ${themeClasses.text.primary}`}>
                Nova task
              </h2>
              <p className={`mt-1 text-sm ${themeClasses.text.tertiary}`}>
                Crie uma nova task para organizar seu trabalho
              </p>
            </div>

            <button
              onClick={onClose}
              className={`rounded-lg p-2 transition-colors ${themeClasses.text.tertiary} hover:${themeClasses.bg.hover} hover:${themeClasses.text.primary} flex-shrink-0`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="p-6 space-y-5">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                <Sparkles className="h-4 w-4 text-violet-400" />
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

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                <Clock className="h-4 w-4 text-violet-400" />
                Status
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none transition-all hover:bg-white/10 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                >
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`h-4 w-4 ${currentStatusConfig.color}`} />
                    <span>{currentStatusConfig.label}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                </button>
                
                {showStatusDropdown && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-2 rounded-xl border border-white/10 bg-zinc-900 shadow-lg">
                    {statusOptions.map((option) => {
                      const config = statusConfig[option];
                      const Icon = config.icon;
                      const isSelected = status === option;
                      
                      return (
                        <button
                          key={option}
                          onClick={() => {
                            setStatus(option);
                            setShowStatusDropdown(false);
                          }}
                          className={`w-full flex items-center gap-2 px-4 py-3 text-sm transition-all first:rounded-t-lg last:rounded-b-lg ${
                            isSelected
                              ? `${config.bg} ${config.color}`
                              : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{config.label}</span>
                          {isSelected && (
                            <div className="ml-auto h-2 w-2 rounded-full bg-emerald-500" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                  <Calendar className="h-4 w-4 text-violet-400" />
                  Data de vencimento
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none transition-all focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                <Users className="h-4 w-4 text-violet-400" />
                Responsáveis
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowAssigneesDropdown(!showAssigneesDropdown)}
                  className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none transition-all hover:bg-white/10 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                >
                  <span className="text-sm">
                    {selectedAssignees.length > 0 ? `${selectedAssignees.length} responsável(is)` : 'Selecione responsáveis...'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                </button>
                
                {showAssigneesDropdown && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-2 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-zinc-900 shadow-lg">
                    {projectMembers && projectMembers.length > 0 ? (
                      projectMembers.map((member: WorkspaceMember) => (
                        <button
                          key={member.id}
                          onClick={() => {
                            setSelectedAssignees(prev => 
                              prev.includes(member.id)
                                ? prev.filter(id => id !== member.id)
                                : [...prev, member.id]
                            );
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 transition-all hover:bg-white/5 first:rounded-t-lg last:rounded-b-lg"
                        >
                          {member.avatarUrl ? (
                            <img
                              src={member.avatarUrl}
                              alt={member.name}
                              className="h-6 w-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-xs font-semibold text-white">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="text-left">
                            <div className="font-medium">{member.name}</div>
                            <div className="text-xs text-zinc-500">{member.email}</div>
                          </div>
                          {selectedAssignees.includes(member.id) && (
                            <div className="ml-auto h-4 w-4 rounded border border-emerald-500 bg-emerald-500/20" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-zinc-500">Nenhum membro disponível</div>
                    )}
                  </div>
                )}
              </div>
              {selectedAssignees.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedAssignees.map(assigneeId => {
                    const member = projectMembers?.find((m: WorkspaceMember) => m.id === assigneeId);
                    return member ? (
                      <div
                        key={assigneeId}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white"
                      >
                        {member.avatarUrl ? (
                          <img
                            src={member.avatarUrl}
                            alt={member.name}
                            className="h-4 w-4 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-4 w-4 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-xs font-semibold text-white">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {member.name}
                        <button
                          onClick={() => setSelectedAssignees(prev => prev.filter(id => id !== assigneeId))}
                          className="ml-1 hover:opacity-75"
                        >
                          ×
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

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

        <div className={`border-t p-6 flex justify-end gap-3 ${themeClasses.border.primary} ${themeClasses.bg.primary} flex-shrink-0`}>
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
      </div>
    </div>
  );
}