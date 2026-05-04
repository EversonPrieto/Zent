'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useTheme } from '../hooks/useTheme';
import { getWorkspacePermissions, type Permissions } from '../lib/permissions';
import { useCommentSync } from '../hooks/useCommentSync';
import { usePresence } from '../hooks/usePresence';
import { useLabels } from '../hooks/useLabels';
import { showToast } from './Toast';
import { showConfirm } from './ConfirmDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  X,
  Save,
  Trash2,
  Send,
  MessageSquare,
  Activity,
  Clock,
  Flag,
  AlertCircle,
  CheckCircle2,
  User,
  Edit2,
  Calendar,
  Tag,
  Loader2,
  Lock,
  Users,
  Paperclip,
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
  dueDate?: string | null;
  taskLabels?: Array<{ label: { id: string; name: string; color: string } }>;
  taskAssignees?: Array<{ user: { id: string; name: string; avatarUrl: string | null } }>;
  attachments?: Array<{ id: string; fileName: string }>;
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

export default function TaskModal({
  task,
  workspaceId,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const { themeClasses } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [checkingPerms, setCheckingPerms] = useState(true);

  const [dueDate, setDueDate] = useState<string>('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  const { labels, loading: labelsLoading } = useLabels(workspaceId);
  const [availableAssignees, setAvailableAssignees] = useState<any[]>([]);

  useEffect(() => {
    async function loadPermissions() {
      try {
        if (!workspaceId || workspaceId.trim() === '' || workspaceId === ':1' || workspaceId.startsWith(':')) {
          const storedId = typeof window !== 'undefined' ? localStorage.getItem('zent_workspace_id') : null;
          if (storedId && storedId !== ':1' && !storedId.startsWith(':')) {
            setPermissions(null);
            setCheckingPerms(false);
            return;
          }
          
          setPermissions(null);
          setCheckingPerms(false);
          return;
        }

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
    setDueDate(task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '');
    setSelectedLabels(task.taskLabels?.map((tl: any) => tl.label.id) || []);
    setSelectedAssignees(task.taskAssignees?.map((ta: any) => ta.user.id) || []);
    setError('');

    async function loadMembers() {
      try {
        const members = await api('/workspaces/members', { workspaceId });
        setAvailableAssignees(members);
      } catch (err) {
        console.error('Erro ao carregar members:', err);
      }
    }
    loadMembers();
  }, [task, workspaceId]);

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

        const response = await api(`/activities?taskId=${currentTask?.id}`, {
          workspaceId,
        });

        if (!cancelled) {
          const activityList = response.items || response;
          setActivities(Array.isArray(activityList) ? activityList : []);
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

  useCommentSync({
    taskId: task?.id || '',
    onCommentCreated: (comment) => {
      const formatted: Comment = {
        ...comment,
        createdAt: typeof comment.createdAt === 'string' 
          ? comment.createdAt 
          : comment.createdAt.toISOString(),
      };
      setComments((prev) => [...prev, formatted]);
      showToast('Novo comentário! ✨');
    },
    onCommentDeleted: (commentId) => {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    },
  });

  if (!task) return null;

  const currentTask = task;

  const canEdit = permissions?.canEditTasks && !checkingPerms;
  const currentStatusConfig = statusConfig[status];
  const currentPriorityConfig = priorityConfig[priority];
  const StatusIcon = currentStatusConfig.icon;
  const PriorityIcon = currentPriorityConfig.icon;

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
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        }),
      });

      const currentLabelIds = updated.taskLabels?.map((tl: any) => tl.label.id) || [];
      for (const labelId of selectedLabels) {
        if (!currentLabelIds.includes(labelId)) {
          try {
            await api(`/tasks/${updated.id}/labels/${labelId}`, {
              method: 'POST',
              workspaceId,
            });
          } catch (err) {
            console.error('Erro ao adicionar label:', err);
          }
        }
      }
      for (const labelId of currentLabelIds) {
        if (!selectedLabels.includes(labelId)) {
          try {
            await api(`/tasks/${updated.id}/labels/${labelId}`, {
              method: 'DELETE',
              workspaceId,
            });
          } catch (err) {
            console.error('Erro ao remover label:', err);
          }
        }
      }

      const currentAssigneeIds = updated.taskAssignees?.map((ta: any) => ta.user.id) || [];
      for (const assigneeId of selectedAssignees) {
        if (!currentAssigneeIds.includes(assigneeId)) {
          try {
            await api(`/tasks/${updated.id}/assignees/${assigneeId}`, {
              method: 'POST',
              workspaceId,
            });
          } catch (err) {
            console.error('Erro ao adicionar assignee:', err);
          }
        }
      }
      for (const assigneeId of currentAssigneeIds) {
        if (!selectedAssignees.includes(assigneeId)) {
          try {
            await api(`/tasks/${updated.id}/assignees/${assigneeId}`, {
              method: 'DELETE',
              workspaceId,
            });
          } catch (err) {
            console.error('Erro ao remover assignee:', err);
          }
        }
      }

      const finalTask = await api(`/tasks/${updated.id}`, {
        workspaceId,
      });

      try {
        const activityResponse = await api(`/activities?taskId=${currentTask.id}`, {
          workspaceId,
        });
        const activityList = activityResponse.items || activityResponse;
        setActivities(Array.isArray(activityList) ? activityList : []);
      } catch (err) {
        console.error('Erro ao recarregar atividades:', err);
      }

      showToast('Task atualizada com sucesso', 'success', 3000);
      onSaved(finalTask);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar task';
      setError(message);
      showToast(message, 'error', 4000);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    const confirmed = await showConfirm({
      title: 'Deletar task',
      message: `Tem certeza que deseja deletar a task "${currentTask.title}"? Esta ação não pode ser desfeita.`,
      action: 'delete',
      confirmLabel: 'Deletar',
      isDangerous: true,
    });

    if (!confirmed) return;

    try {
      setLoading(true);
      setError('');

      await api(`/tasks/${currentTask.id}`, {
        method: 'DELETE',
        workspaceId,
      });

      showToast('Task deletada com sucesso', 'success', 3000);
      setComments([]);
      setActivities([]);
      setNewComment('');
      onDeleted?.(currentTask.id);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar task';
      setError(message);
      showToast(message, 'error', 4000);
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

      setNewComment('');

      try {
        const activityData = await api(`/activity?taskId=${currentTask.id}`, {
          workspaceId,
        });
        setActivities(activityData);
      } catch {}
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar comentário';
      setError(message);
      showToast(message, 'error', 4000);
    }
  }

  async function handleDeleteComment(commentId: string) {
    const confirmed = await showConfirm({
      title: 'Deletar comentário',
      message: 'Tem certeza que deseja deletar este comentário?',
      action: 'delete',
      confirmLabel: 'Deletar',
      isDangerous: true,
    });

    if (!confirmed) return;

    try {
      setError('');

      await api(`/comments/${commentId}`, {
        method: 'DELETE',
        workspaceId,
      });

      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      showToast('Comentário deletado com sucesso', 'success', 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar comentário';
      setError(message);
      showToast(message, 'error', 4000);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        <div className="sticky top-0 z-10 border-b border-white/10 bg-gradient-to-r from-zinc-900 to-zinc-950 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className={`inline-flex items-center gap-1.5 rounded-full ${currentStatusConfig.bg} px-2.5 py-1`}>
                  <StatusIcon className={`h-3 w-3 ${currentStatusConfig.color}`} />
                  <span className={`text-xs font-medium ${currentStatusConfig.color}`}>
                    {currentStatusConfig.label}
                  </span>
                </div>
                <div className={`inline-flex items-center gap-1.5 rounded-full ${currentPriorityConfig.bg} px-2.5 py-1`}>
                  <PriorityIcon className={`h-3 w-3 ${currentPriorityConfig.color}`} />
                  <span className={`text-xs font-medium ${currentPriorityConfig.color}`}>
                    {currentPriorityConfig.label}
                  </span>
                </div>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                {currentTask.title}
              </h2>
              <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Criado {new Date(currentTask.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Atualizado {new Date(currentTask.updatedAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
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
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                    <Edit2 className="h-4 w-4" />
                    Título
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={!canEdit}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none transition-all focus:border-violet-500 focus:ring-1 focus:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Título da task"
                  />
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                    <Tag className="h-4 w-4" />
                    Descrição
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={!canEdit}
                    rows={5}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none transition-all focus:border-violet-500 focus:ring-1 focus:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Descreva os detalhes da task..."
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                      <Clock className="h-4 w-4" />
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as TaskStatus)}
                      disabled={!canEdit}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none transition-all focus:border-violet-500 focus:ring-1 focus:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {statusOptions.map((option) => (
                        <option key={option} value={option} className="bg-zinc-900">
                          {statusConfig[option].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                      <Flag className="h-4 w-4" />
                      Prioridade
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as TaskPriority)}
                      disabled={!canEdit}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none transition-all focus:border-violet-500 focus:ring-1 focus:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {priorityOptions.map((option) => (
                        <option key={option} value={option} className="bg-zinc-900">
                          {priorityConfig[option].label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                      <Calendar className="h-4 w-4" />
                      Data de Entrega
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      disabled={!canEdit}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none transition-all focus:border-violet-500 focus:ring-1 focus:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                      <Users className="h-4 w-4" />
                      Responsáveis
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {availableAssignees.map((member: any) => (
                        <label key={member.user?.id || member.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2.5 cursor-pointer hover:bg-white/10 transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedAssignees.includes(member.user?.id || member.id)}
                            onChange={(e) => {
                              const userId = member.user?.id || member.id;
                              if (e.target.checked) {
                                setSelectedAssignees([...selectedAssignees, userId]);
                              } else {
                                setSelectedAssignees(selectedAssignees.filter(id => id !== userId));
                              }
                            }}
                            disabled={!canEdit}
                            className="cursor-pointer disabled:cursor-not-allowed"
                          />
                          <span className="text-sm text-white">{member.user?.name || member.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                    <Tag className="h-4 w-4" />
                    Labels
                  </label>
                  {labelsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {labels.map((label: any) => (
                        <label key={label.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2.5 cursor-pointer hover:bg-white/10 transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedLabels.includes(label.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedLabels([...selectedLabels, label.id]);
                              } else {
                                setSelectedLabels(selectedLabels.filter(id => id !== label.id));
                              }
                            }}
                            disabled={!canEdit}
                            className="cursor-pointer disabled:cursor-not-allowed"
                          />
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: label.color }}
                          />
                          <span className="text-sm text-white">{label.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {!checkingPerms && !permissions?.canEditTasks && (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-400">
                    <Lock className="h-4 w-4 flex-shrink-0" />
                    Você não tem permissão para editar tasks. Apenas MEMBER+ podem editar.
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 pt-6">
                <div className="mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-violet-400" />
                  <h3 className="text-lg font-semibold">Comentários</h3>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-zinc-400">
                    {comments.length}
                  </span>
                </div>

                {commentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                  </div>
                ) : (
                  <div className="max-h-64 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                    {comments.map((comment) => (
                      <div key={comment.id} className="group rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-white/20">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
                              <User className="h-4 w-4 text-violet-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">
                                {comment.user?.name ?? 'Usuário'}
                              </p>
                              <p className="text-xs text-zinc-500">
                                {new Date(comment.createdAt).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="rounded-lg p-1 text-zinc-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="mt-2 text-sm text-zinc-300">{comment.content}</p>
                      </div>
                    ))}

                    {comments.length === 0 && (
                      <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-8 text-center">
                        <MessageSquare className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                        <p className="text-sm text-zinc-500">
                          Nenhum comentário ainda
                        </p>
                        <p className="text-xs text-zinc-600">
                          Seja o primeiro a comentar
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                    placeholder="Escreva um comentário..."
                    disabled={!canEdit}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-all focus:border-violet-500 focus:ring-1 focus:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || !canEdit}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <Send className="h-4 w-4" />
                    Enviar
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-violet-400" />
                  <h3 className="text-lg font-semibold">Atividade</h3>
                </div>

                {activitiesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {activities.map((activity) => (
                      <div key={activity.id} className="rounded-xl border border-white/10 bg-white/5 p-3 transition-all hover:border-white/20">
                        <div className="flex items-start gap-2">
                          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
                            <Activity className="h-3 w-3 text-violet-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-zinc-300">
                              <span className="font-medium text-white">
                                {activity.user?.name ?? 'Sistema'}
                              </span>{' '}
                              {activity.description}
                            </p>
                            <p className="mt-1 text-[10px] text-zinc-500">
                              {new Date(activity.createdAt).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {activities.length === 0 && (
                      <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-8 text-center">
                        <Activity className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                        <p className="text-sm text-zinc-500">
                          Nenhuma atividade ainda
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-6">
            <button
              onClick={handleDelete}
              disabled={!canEdit || loading}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-red-400 transition-all hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Deletar task
            </button>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm text-zinc-400 transition-all hover:bg-white/10 hover:text-white"
              >
                Cancelar
              </button>

              <button
                onClick={handleSave}
                disabled={loading || !title.trim() || !canEdit}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
}