'use client';

import { useEffect, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../lib/api';
import { useTheme } from '../hooks/useTheme';
import { getWorkspacePermissions, type Permissions } from '../lib/permissions';
import { useCommentSync } from '../hooks/useCommentSync';
import { usePresence } from '../hooks/usePresence';
import { useLabels } from '../hooks/useLabels';
import AttachmentUploader from './AttachmentUploader';
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
  Archive,
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
  attachments?: Array<{ id: string; name?: string; fileName?: string; fileType?: string; url?: string; size?: number; createdAt?: string }>;
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
  projectCompleted?: boolean;
};

const statusOptions: TaskStatus[] = [
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'DONE',
  'ABORTED',
];

const priorityOptions: TaskPriority[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
];

// Constantes auxiliares visuais
const inputBaseClass = 'w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60';
const labelClass = 'mb-2 flex items-center gap-2 text-sm font-semibold';
const sectionTitleClass = 'flex items-center gap-2.5 text-lg font-semibold';
const badgeBaseClass = 'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200';
const primaryButtonClass = 'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-200 hover:shadow-violet-500/40 sm:hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:sm:hover:scale-100 sm:px-5';
const secondaryButtonClass = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-zinc-800/50 active:scale-[0.98] sm:px-5';

function renderInlineMarkdown(text: string, themeClasses: any) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={`${part}-${index}`} className={themeClasses.text.primary}>
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function DescriptionPreview({
  value,
  themeClasses,
  readOnly = false,
  onToggleChecklistItem,
}: {
  value: string;
  themeClasses: any;
  readOnly?: boolean;
  onToggleChecklistItem?: (lineIndex: number) => void;
}) {
  if (!value.trim()) return null;

  const lines = value.split('\n');

  return (
    <div className={`mt-3 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-3`}>
      <div className={`mb-2 text-xs font-semibold ${themeClasses.text.tertiary}`}>
        Prévia formatada
      </div>

      <div className={`space-y-1.5 text-sm leading-relaxed ${themeClasses.text.secondary}`}>
        {lines.map((line, lineIndex) => {
          const checklistMatch = line.match(/^(\s*)[-*]\s+\[([ xX])\]\s*(.*)$/);

          if (checklistMatch) {
            const checked = checklistMatch[2].toLowerCase() === 'x';
            const content = checklistMatch[3] || 'Item sem texto';

            return (
              <div key={`${line}-${lineIndex}`} className="flex items-start gap-2">
                <button
                  type="button"
                  onClick={() => onToggleChecklistItem?.(lineIndex)}
                  disabled={readOnly || !onToggleChecklistItem}
                  className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-all ${
                    checked
                      ? 'border-violet-500 bg-violet-500'
                      : `border-zinc-500/60 ${themeClasses.bg.tertiary} hover:border-violet-500`
                  } disabled:cursor-not-allowed disabled:opacity-70`}
                  title={checked ? 'Marcar como pendente' : 'Marcar como concluído'}
                >
                  {checked && <span className="text-[10px] font-bold leading-none text-white">✓</span>}
                </button>

                <span className={`min-w-0 break-words ${checked ? `line-through ${themeClasses.text.tertiary}` : themeClasses.text.secondary}`}>
                  {renderInlineMarkdown(content, themeClasses)}
                </span>
              </div>
            );
          }

          const bulletMatch = line.match(/^(\s*)[-*]\s+(.*)$/);

          if (bulletMatch) {
            return (
              <div key={`${line}-${lineIndex}`} className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-400" />
                <span className="min-w-0 break-words">
                  {renderInlineMarkdown(bulletMatch[2] || 'Item sem texto', themeClasses)}
                </span>
              </div>
            );
          }

          if (!line.trim()) {
            return <div key={`${line}-${lineIndex}`} className="h-2" />;
          }

          return (
            <p key={`${line}-${lineIndex}`} className="break-words">
              {renderInlineMarkdown(line, themeClasses)}
            </p>
          );
        })}
      </div>
    </div>
  );
}

function DescriptionToolbar({
  disabled,
  themeClasses,
  onBold,
  onChecklist,
  onList,
}: {
  disabled?: boolean;
  themeClasses: any;
  onBold: () => void;
  onChecklist: () => void;
  onList: () => void;
}) {
  return (
    <div className={`mb-2 flex flex-wrap items-center gap-2 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-2`}>
      <button
        type="button"
        onClick={onBold}
        disabled={disabled}
        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${themeClasses.text.secondary} hover:bg-violet-500/10 hover:text-violet-400 disabled:cursor-not-allowed disabled:opacity-50`}
        title="Negrito"
      >
        B
      </button>

      <button
        type="button"
        onClick={onChecklist}
        disabled={disabled}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${themeClasses.text.secondary} hover:bg-violet-500/10 hover:text-violet-400 disabled:cursor-not-allowed disabled:opacity-50`}
        title="Inserir checklist"
      >
        ☑ Checklist
      </button>

      <button
        type="button"
        onClick={onList}
        disabled={disabled}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${themeClasses.text.secondary} hover:bg-violet-500/10 hover:text-violet-400 disabled:cursor-not-allowed disabled:opacity-50`}
        title="Inserir lista"
      >
        • Lista
      </button>

      <span className={`ml-auto hidden text-[11px] ${themeClasses.text.muted} sm:inline`}>
        **negrito** · - [ ] checklist · - lista
      </span>
    </div>
  );
}


export default function TaskModal({
  task,
  workspaceId,
  onClose,
  onSaved,
  onDeleted,
  projectCompleted = false,
}: Props) {
  const { theme, themeClasses } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const statusConfig = theme === 'dark' ? {
    TODO: { label: 'A fazer', icon: Clock, color: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-zinc-500/20', dot: 'bg-zinc-400' },
    IN_PROGRESS: { label: 'Em progresso', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', dot: 'bg-blue-400' },
    IN_REVIEW: { label: 'Em revisão', icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-400' },
    DONE: { label: 'Concluído', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
    ABORTED: { label: 'Cancelado', icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', dot: 'bg-red-400' },
  } : {
    TODO: { label: 'A fazer', icon: Clock, color: 'text-zinc-600', bg: 'bg-zinc-100', border: 'border-zinc-200', dot: 'bg-zinc-600' },
    IN_PROGRESS: { label: 'Em progresso', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200', dot: 'bg-blue-600' },
    IN_REVIEW: { label: 'Em revisão', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200', dot: 'bg-amber-600' },
    DONE: { label: 'Concluído', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200', dot: 'bg-emerald-600' },
    ABORTED: { label: 'Cancelado', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200', dot: 'bg-red-600' },
  };

  const priorityConfig = theme === 'dark' ? {
    LOW: { label: 'Baixa', icon: Flag, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', dot: 'bg-blue-400' },
    MEDIUM: { label: 'Média', icon: Flag, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-400' },
    HIGH: { label: 'Alta', icon: Flag, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', dot: 'bg-orange-400' },
    URGENT: { label: 'Urgente', icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', dot: 'bg-red-400' },
  } : {
    LOW: { label: 'Baixa', icon: Flag, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200', dot: 'bg-blue-600' },
    MEDIUM: { label: 'Média', icon: Flag, color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200', dot: 'bg-amber-600' },
    HIGH: { label: 'Alta', icon: Flag, color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-200', dot: 'bg-orange-600' },
    URGENT: { label: 'Urgente', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200', dot: 'bg-red-600' },
  };

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
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [commentDeleting, setCommentDeleting] = useState(false);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  const {
    labels,
    loading: labelsLoading,
    createLabel,
    updateLabel,
  } = useLabels(workspaceId);

  const DEFAULT_LABEL_COLOR = '#8B5CF6';
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(DEFAULT_LABEL_COLOR);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editingLabelName, setEditingLabelName] = useState('');
  const [editingLabelColor, setEditingLabelColor] = useState(DEFAULT_LABEL_COLOR);

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
    setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '');
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

    async function refreshTaskDetails() {
      const taskId = task?.id;
      if (!taskId) return;

      try {
        const fresh = await api(`/tasks/${taskId}`, { workspaceId });
        onSaved(fresh);
      } catch (err) {
        console.error('Erro ao recarregar detalhes da task (para anexos):', err);
      }
    }

    loadMembers();
    refreshTaskDetails();
  }, [task?.id, workspaceId]);

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

  if (!mounted || !task) return null;

  const currentTask = task;

  const canEdit = permissions?.canEditTasks && !checkingPerms && !projectCompleted;

  const isReadOnly = projectCompleted;

  async function refreshTaskAttachments() {
    try {
      const refreshed = await api(`/tasks/${currentTask.id}`, { workspaceId });
      onSaved(refreshed);
    } catch (err) {
      console.error('Erro ao recarregar anexos da task:', err);
    }
  }

  const currentStatusConfig = statusConfig[status];
  const currentPriorityConfig = priorityConfig[priority];
  const StatusIcon = currentStatusConfig.icon;
  const PriorityIcon = currentPriorityConfig.icon;

  const descriptionTextareaId = 'task-description-textarea';

  function focusDescription(cursorPosition?: number) {
    window.setTimeout(() => {
      const textarea = document.getElementById(descriptionTextareaId) as HTMLTextAreaElement | null;
      if (!textarea) return;

      textarea.focus();

      if (typeof cursorPosition === 'number') {
        textarea.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 0);
  }

  function insertDescriptionAround(beforeText: string, afterText: string, placeholder: string) {
    const textarea = document.getElementById(descriptionTextareaId) as HTMLTextAreaElement | null;
    const start = textarea?.selectionStart ?? description.length;
    const end = textarea?.selectionEnd ?? description.length;
    const selectedText = description.slice(start, end) || placeholder;

    const nextDescription =
      description.slice(0, start) +
      beforeText +
      selectedText +
      afterText +
      description.slice(end);

    setDescription(nextDescription);
    focusDescription(start + beforeText.length + selectedText.length);
  }

  function insertDescriptionLine(line: string) {
    const prefix = description.length === 0 || description.endsWith('\n') ? '' : '\n';
    const nextDescription = `${description}${prefix}${line}`;

    setDescription(nextDescription);
    focusDescription(nextDescription.length);
  }

  function toggleChecklistLine(lineIndex: number) {
    setDescription((current) =>
      current
        .split('\n')
        .map((line, index) => {
          if (index !== lineIndex) return line;

          if (/\[[xX]\]/.test(line)) {
            return line.replace(/\[[xX]\]/, '[ ]');
          }

          return line.replace(/\[ \]/, '[x]');
        })
        .join('\n'),
    );
  }

  function handleDescriptionKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
      event.preventDefault();
      insertDescriptionAround('**', '**', 'texto em negrito');
      return;
    }

    if (event.key !== 'Enter' || event.shiftKey) return;

    const textarea = event.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start !== end) return;

    const beforeCursor = description.slice(0, start);
    const afterCursor = description.slice(start);
    const currentLineStart = beforeCursor.lastIndexOf('\n') + 1;
    const currentLine = beforeCursor.slice(currentLineStart);

    const checklistMatch = currentLine.match(/^(\s*)[-*]\s+\[[ xX]\]\s*(.*)$/);

    if (checklistMatch) {
      event.preventDefault();

      if (!checklistMatch[2].trim()) {
        const nextDescription = description.slice(0, currentLineStart) + afterCursor;
        setDescription(nextDescription);
        focusDescription(currentLineStart);
        return;
      }

      const insertText = `\n${checklistMatch[1]}- [ ] `;
      const nextDescription = beforeCursor + insertText + afterCursor;

      setDescription(nextDescription);
      focusDescription(start + insertText.length);
      return;
    }

    const listMatch = currentLine.match(/^(\s*)[-*]\s+(.*)$/);

    if (listMatch) {
      event.preventDefault();

      if (!listMatch[2].trim()) {
        const nextDescription = description.slice(0, currentLineStart) + afterCursor;
        setDescription(nextDescription);
        focusDescription(currentLineStart);
        return;
      }

      const insertText = `\n${listMatch[1]}- `;
      const nextDescription = beforeCursor + insertText + afterCursor;

      setDescription(nextDescription);
      focusDescription(start + insertText.length);
    }
  }


  async function handleSave() {
    if (!title.trim()) return;

    try {
      setLoading(true);
      setError('');

      const beforeTask = await api(`/tasks/${currentTask.id}`, {
        workspaceId,
      });

      const currentLabelIds =
        beforeTask.taskLabels?.map((tl: any) => tl.label.id) || [];

      const currentAssigneeIds =
        beforeTask.taskAssignees?.map((ta: any) => ta.user.id) || [];

      const updated = await api(`/tasks/${currentTask.id}`, {
        method: 'PATCH',
        workspaceId,
        body: {
          title,
          description,
          status,
          priority,
          dueDate: dueDate ? `${dueDate}T00:00:00.000Z` : null,
        },
      });

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

      onSaved(finalTask);

      try {
        const activityResponse = await api(
          `/activities?taskId=${currentTask.id}`,
          {
            workspaceId,
          },
        );

        const activityList = activityResponse.items || activityResponse;
        setActivities(Array.isArray(activityList) ? activityList : []);
      } catch (err) {
        console.error('Erro ao recarregar atividades:', err);
      }

      showToast('Task atualizada com sucesso', 'success', 3000);
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
    if (!newComment.trim() || commentSubmitting) return;

    try {
      setError('');
      setCommentSubmitting(true);

      const created = await api(`/tasks/${currentTask.id}/comments`, {
        method: 'POST',
        workspaceId,
        body: JSON.stringify({
          content: newComment,
        }),
      });

      setNewComment('');

      try {
        const activityData = await api(`/activities?taskId=${currentTask.id}`, {
          workspaceId,
        });
        const activityList = activityData?.items || activityData;
        if (Array.isArray(activityList)) {
          setActivities(activityList);
        }
      } catch (err) {
        console.error('Erro ao carregar atividades:', err);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar comentário';
      setError(message);
      showToast(message, 'error', 4000);
    } finally {
      setCommentSubmitting(false);
    }
  }

  function handleDeleteComment(commentId: string) {
    setCommentToDelete(commentId);
  }

  function closeCommentDeleteConfirm() {
    if (commentDeleting) return;
    setCommentToDelete(null);
  }

  async function confirmDeleteComment() {
    if (!commentToDelete || commentDeleting) return;

    try {
      setError('');
      setCommentDeleting(true);

      await api(`/comments/${commentToDelete}`, {
        method: 'DELETE',
        workspaceId,
      });

      setComments((prev) =>
        prev.filter((comment) => comment.id !== commentToDelete),
      );

      setCommentToDelete(null);
      showToast('Comentário deletado com sucesso', 'success', 3000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao deletar comentário';
      setError(message);
      showToast(message, 'error', 4000);
    } finally {
      setCommentDeleting(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[1000] isolate flex items-start justify-center overflow-hidden bg-black/60 p-2 backdrop-blur-sm animate-in fade-in duration-200 sm:items-center sm:p-6">
      <div className={`relative z-[1001] flex max-h-[calc(100dvh-1rem)] w-full max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.primary} shadow-2xl shadow-black/20 animate-in slide-in-from-bottom-6 duration-300 sm:max-h-[92vh] sm:max-w-5xl sm:rounded-3xl`}>
        {/* Header */}
        <div className={`flex-shrink-0 border-b ${themeClasses.border.primary} ${themeClasses.bg.primary} px-4 py-4 sm:px-8 sm:py-6`}>
          <div className="flex min-w-0 items-start justify-between gap-3 sm:gap-6">
            <div className="min-w-0 flex-1">
              {/* Status & Priority Badges */}
              <div className="mb-3 flex flex-wrap items-center gap-2 sm:mb-4">
                <div className={`${badgeBaseClass} ${currentStatusConfig.bg} ${currentStatusConfig.border} border`}>
                  <div className={`h-2 w-2 rounded-full ${currentStatusConfig.dot} shadow-[0_0_6px_currentColor]`} />
                  <StatusIcon className={`h-3.5 w-3.5 ${currentStatusConfig.color}`} />
                  <span className={`${currentStatusConfig.color}`}>
                    {currentStatusConfig.label}
                  </span>
                </div>
                
                <div className={`${badgeBaseClass} ${currentPriorityConfig.bg} ${currentPriorityConfig.border} border`}>
                  <div className={`h-2 w-2 rounded-full ${currentPriorityConfig.dot} shadow-[0_0_6px_currentColor]`} />
                  <PriorityIcon className={`h-3.5 w-3.5 ${currentPriorityConfig.color}`} />
                  <span className={`${currentPriorityConfig.color}`}>
                    {currentPriorityConfig.label}
                  </span>
                </div>
              </div>

              {/* Title */}
              <h2 className="break-words text-xl font-bold tracking-tight sm:text-3xl">
                <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                  {currentTask.title}
                </span>
              </h2>

              {/* Metadata */}
              <div className={`mt-3 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-medium ${themeClasses.text.tertiary}`}>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Criado em {format(new Date(currentTask.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Atualizado {format(new Date(currentTask.updatedAt), "dd/MM/yyyy", { locale: ptBR })}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`flex-shrink-0 rounded-xl p-2.5 transition-all duration-200 ${themeClasses.text.tertiary} hover:bg-zinc-800/50 hover:text-white hover:scale-105 active:scale-95`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-4 py-5 sm:px-8 sm:py-8">
          <div className="grid min-w-0 gap-6 lg:grid-cols-3 lg:gap-10">
            {/* Main Content */}
            <div className="min-w-0 space-y-6 lg:col-span-2 lg:space-y-8">
              {/* Form Fields */}
              <div className="min-w-0 space-y-5 sm:space-y-6">
                {/* Title Input */}
                <div>
                  <label className={`${labelClass} ${themeClasses.text.secondary}`}>
                    <Edit2 className="h-4 w-4 text-violet-400" />
                    Título
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={!canEdit}
                    className={`${inputBaseClass} ${themeClasses.border.primary} ${themeClasses.bg.subtle} ${themeClasses.text.primary}`}
                    placeholder="Título da task"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className={`${labelClass} ${themeClasses.text.secondary}`}>
                    <Tag className="h-4 w-4 text-violet-400" />
                    Descrição
                  </label>

                  <DescriptionToolbar
                    disabled={!canEdit}
                    themeClasses={themeClasses}
                    onBold={() => insertDescriptionAround('**', '**', 'texto em negrito')}
                    onChecklist={() => insertDescriptionLine('- [ ] novo item')}
                    onList={() => insertDescriptionLine('- novo item')}
                  />

                  <textarea
                    id={descriptionTextareaId}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onKeyDown={handleDescriptionKeyDown}
                    disabled={!canEdit}
                    rows={6}
                    className={`${inputBaseClass} ${themeClasses.border.primary} ${themeClasses.bg.subtle} ${themeClasses.text.primary} resize-y min-h-[150px] font-mono text-[13px] leading-relaxed`}
                    placeholder={`Descreva os detalhes da task...\n\nExemplos:\n- [ ] arrumar header\n- [x] arrumar landing page\n**texto em negrito**\n- item de lista`}
                  />

                  <DescriptionPreview
                    value={description}
                    themeClasses={themeClasses}
                    readOnly={!canEdit}
                    onToggleChecklistItem={toggleChecklistLine}
                  />
                </div>

                {/* Status & Priority Grid */}
                <div className="grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
                  <div>
                    <label className={`${labelClass} ${themeClasses.text.secondary}`}>
                      <Clock className="h-4 w-4 text-violet-400" />
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as TaskStatus)}
                      disabled={!canEdit}
                      className={`${inputBaseClass} ${themeClasses.border.primary} ${themeClasses.bg.subtle} ${themeClasses.text.primary} cursor-pointer`}
                    >
                      {statusOptions.map((option) => (
                        <option key={option} value={option} className={themeClasses.bg.secondary}>
                          {statusConfig[option].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`${labelClass} ${themeClasses.text.secondary}`}>
                      <Flag className="h-4 w-4 text-violet-400" />
                      Prioridade
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as TaskPriority)}
                      disabled={!canEdit}
                      className={`${inputBaseClass} ${themeClasses.border.primary} ${themeClasses.bg.subtle} ${themeClasses.text.primary} cursor-pointer`}
                    >
                      {priorityOptions.map((option) => (
                        <option key={option} value={option} className={themeClasses.bg.secondary}>
                          {priorityConfig[option].label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Due Date & Assignees */}
                <div className="grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
                  <div>
                    <label className={`${labelClass} ${themeClasses.text.secondary}`}>
                      <Calendar className="h-4 w-4 text-violet-400" />
                      Data de Entrega
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      disabled={!canEdit}
                      className={`${inputBaseClass} ${themeClasses.border.primary} ${themeClasses.bg.subtle} ${themeClasses.text.primary}`}
                    />
                  </div>

                  <div>
                    <label className={`${labelClass} ${themeClasses.text.secondary}`}>
                      <Users className="h-4 w-4 text-violet-400" />
                      Responsáveis
                    </label>
                    <div className="max-h-48 space-y-1.5 overflow-y-auto custom-scrollbar rounded-xl border border-transparent">
                      {availableAssignees.map((member: any) => {
                        const memberId = member.user?.id || member.id;
                        const memberName = member.user?.name || member.name;
                        const memberAvatar = member.user?.avatarUrl;
                        const isSelected = selectedAssignees.includes(memberId);

                        return (
                          <label
                            key={memberId}
                            className={`flex items-center gap-3 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-4 py-3 cursor-pointer transition-all duration-200 hover:border-violet-500/30 hover:bg-violet-500/5 ${
                              isSelected ? 'border-violet-500/40 bg-violet-500/5 ring-1 ring-violet-500/20' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAssignees([...selectedAssignees, memberId]);
                                } else {
                                  setSelectedAssignees(selectedAssignees.filter(id => id !== memberId));
                                }
                              }}
                              disabled={!canEdit}
                              className="h-4 w-4 rounded border-zinc-600 text-violet-500 focus:ring-violet-500/20 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <div className="flex min-w-0 flex-1 items-center gap-2.5">
                              {memberAvatar ? (
                                <img
                                  src={memberAvatar}
                                  alt={memberName}
                                  className="h-7 w-7 rounded-full object-cover ring-1 ring-white/10"
                                />
                              ) : (
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 text-xs font-bold ring-1 ring-white/10">
                                  {memberName?.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className={`text-sm font-medium truncate ${themeClasses.text.primary}`}>
                                {memberName}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Labels */}
                <div>
                  <label className={`${labelClass} ${themeClasses.text.secondary}`}>
                    <Tag className="h-4 w-4 text-violet-400" />
                    Labels
                  </label>
                  {labelsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                      {canEdit && !isReadOnly && (
                        <div className="mb-3">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLabelId('__new__');
                              setEditingLabelName('');
                              setEditingLabelColor(DEFAULT_LABEL_COLOR);
                            }}
                            disabled={loading}
                            className={`inline-flex items-center gap-2 rounded-xl border border-dashed ${themeClasses.border.primary} px-4 py-2.5 text-xs font-semibold ${themeClasses.text.secondary} transition-all duration-200 hover:border-violet-500/40 hover:text-violet-400 hover:bg-violet-500/5 disabled:opacity-60`}
                          >
                            <span className="text-base leading-none">+</span>
                            Nova Label
                          </button>

                          {editingLabelId === '__new__' && (
                            <div className={`mt-3 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-4`}>
                              <div className="grid gap-3 sm:grid-cols-2">
                                <input
                                  value={newLabelName}
                                  onChange={(e) => setNewLabelName(e.target.value)}
                                  disabled={!canEdit}
                                  placeholder="Nome da label"
                                  className={`${inputBaseClass} ${themeClasses.border.primary} ${themeClasses.bg.primary} py-2.5`}
                                />
                                <div className="flex items-center gap-3">
                                  <input
                                    type="color"
                                    value={newLabelColor}
                                    onChange={(e) => setNewLabelColor(e.target.value)}
                                    disabled={!canEdit}
                                    className="h-10 w-14 cursor-pointer rounded-lg border-0 p-1"
                                  />
                                  <span className="text-xs text-zinc-500">Cor</span>
                                </div>
                              </div>

                              <div className="mt-3 flex gap-2">
                                <button
                                  onClick={async () => {
                                    const name = newLabelName.trim();
                                    if (!name) {
                                      setError('Informe um nome para a label.');
                                      return;
                                    }
                                    try {
                                      setLoading(true);
                                      setError('');
                                      const created = await createLabel(name, newLabelColor);
                                      setSelectedLabels((prev) => (prev.includes(created.id) ? prev : [...prev, created.id]));
                                      setNewLabelName('');
                                      setNewLabelColor(DEFAULT_LABEL_COLOR);
                                      setEditingLabelId(null);
                                    } catch (e) {
                                      const msg = e instanceof Error ? e.message : 'Erro ao criar label';
                                      setError(msg);
                                    } finally {
                                      setLoading(false);
                                    }
                                  }}
                                  disabled={loading || !newLabelName.trim() || !canEdit}
                                  className={`flex-1 ${primaryButtonClass} py-2 text-xs`}
                                >
                                  <Send className="h-3.5 w-3.5" />
                                  Criar
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingLabelId(null);
                                    setError('');
                                  }}
                                  disabled={loading || !canEdit}
                                  className={`flex-1 ${secondaryButtonClass} py-2 text-xs ${themeClasses.text.tertiary}`}
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {labels.map((label: any) => {
                        const isEditing = editingLabelId === label.id;
                        const isChecked = selectedLabels.includes(label.id);

                        return (
                          <div key={label.id}>
                            {!isEditing ? (
                              <label
                                className={`flex items-center gap-3 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-4 py-3 cursor-pointer transition-all duration-200 hover:border-violet-500/30 hover:bg-violet-500/5 ${
                                  isChecked ? 'border-violet-500/40 bg-violet-500/5 ring-1 ring-violet-500/20' : ''
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedLabels([...selectedLabels, label.id]);
                                    } else {
                                      setSelectedLabels(selectedLabels.filter((id) => id !== label.id));
                                    }
                                  }}
                                  disabled={!canEdit}
                                  className="h-4 w-4 rounded border-zinc-600 text-violet-500 focus:ring-violet-500/20 cursor-pointer disabled:cursor-not-allowed"
                                />
                                <div
                                  className="h-3.5 w-3.5 rounded-full flex-shrink-0 shadow-[0_0_6px_currentColor]"
                                  style={{ backgroundColor: label.color }}
                                />
                                <span className={`text-sm font-medium ${themeClasses.text.primary} flex-1 truncate`}>
                                  {label.name}
                                </span>

                                {canEdit && !isReadOnly && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setEditingLabelId(label.id);
                                      setEditingLabelName(label.name);
                                      setEditingLabelColor(label.color);
                                      setError('');
                                    }}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-medium ${themeClasses.text.tertiary} hover:text-violet-400 hover:bg-violet-500/10 transition-all duration-200`}
                                  >
                                    Editar
                                  </button>
                                )}
                              </label>
                            ) : (
                              <div className={`rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-4`}>
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <input
                                    value={editingLabelName}
                                    onChange={(e) => setEditingLabelName(e.target.value)}
                                    disabled={!canEdit}
                                    placeholder="Nome da label"
                                    className={`${inputBaseClass} ${themeClasses.border.primary} ${themeClasses.bg.primary} py-2.5`}
                                  />
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="color"
                                      value={editingLabelColor}
                                      onChange={(e) => setEditingLabelColor(e.target.value)}
                                      disabled={!canEdit}
                                      className="h-10 w-14 cursor-pointer rounded-lg border-0 p-1"
                                    />
                                    <span className="text-xs text-zinc-500">Cor</span>
                                  </div>
                                </div>
                                <div className="mt-3 flex gap-2">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const name = editingLabelName.trim();
                                      if (!name) {
                                        setError('Informe um nome para a label.');
                                        return;
                                      }
                                      try {
                                        setLoading(true);
                                        setError('');
                                        await updateLabel(label.id, name, editingLabelColor);
                                        setEditingLabelId(null);
                                      } catch (e) {
                                        const msg = e instanceof Error ? e.message : 'Erro ao atualizar label';
                                        setError(msg);
                                      } finally {
                                        setLoading(false);
                                      }
                                    }}
                                    disabled={loading || !canEdit}
                                    className={`flex-1 ${primaryButtonClass} py-2 text-xs`}
                                  >
                                    <Save className="h-3.5 w-3.5" />
                                    Salvar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingLabelId(null);
                                      setError('');
                                    }}
                                    disabled={loading || !canEdit}
                                    className={`flex-1 ${secondaryButtonClass} py-2 text-xs ${themeClasses.text.tertiary}`}
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {/* Permissions Warning */}
                {!checkingPerms && !permissions?.canEditTasks && (
                  <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-400">
                    <Lock className="h-4 w-4 flex-shrink-0" />
                    Você não tem permissão para editar tasks. Apenas MEMBER+ podem editar.
                  </div>
                )}

                {/* Project Completed Warning */}
                {isReadOnly && (
                  <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
                    <Archive className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Projeto Finalizado</p>
                      <p className="text-emerald-400/70 mt-0.5">Este projeto está finalizado. Aguarde até que um ADMIN reabra para editar.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Attachments & Comments Section */}
              <div className={`border-t ${themeClasses.border.primary} pt-8`}>
                {/* Attachments */}
                {(canEdit && !isReadOnly) || (currentTask.attachments && currentTask.attachments.length > 0) ? (
                  <div className="mb-8">
                    <div className={sectionTitleClass}>
                      <Paperclip className="h-5 w-5 text-violet-400" />
                      <h3 className={`${themeClasses.text.primary}`}>Anexos</h3>
                    </div>

                    <div className="mt-4">
                      <AttachmentUploader
                        taskId={currentTask.id}
                        workspaceId={workspaceId}
                        attachments={currentTask.attachments || []}
                        onAttachmentAdded={() => {
                          refreshTaskAttachments();
                        }}
                        onAttachmentRemoved={() => {
                          refreshTaskAttachments();
                        }}
                      />
                    </div>
                  </div>
                ) : null}

                {/* Comments */}
                <div>
                  <div className={`${sectionTitleClass} mb-4`}>
                    <MessageSquare className="h-5 w-5 text-violet-400" />
                    <h3 className={`${themeClasses.text.primary}`}>Comentários</h3>
                    <span className={`rounded-full ${themeClasses.bg.subtle} px-2.5 py-0.5 text-xs font-semibold ${themeClasses.text.tertiary}`}>
                      {comments.length}
                    </span>
                  </div>

                  {commentsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                    </div>
                  ) : (
                    <div className="max-h-80 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                      {comments.map((comment) => (
                        <div
                          key={comment.id}
                          className={`group rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-4 transition-all duration-200 hover:border-violet-500/20 hover:shadow-md`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              {comment.user?.avatarUrl ? (
                                <img
                                  src={comment.user.avatarUrl}
                                  alt={comment.user?.name || 'Avatar do usuário'}
                                  className="h-9 w-9 rounded-full object-cover ring-2 ring-white/10"
                                />
                              ) : (
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 ring-2 ring-white/10">
                                  <User className="h-4 w-4 text-violet-400" />
                                </div>
                              )}
                              <div>
                                <p className={`break-words text-sm font-semibold ${themeClasses.text.primary}`}>
                                  {comment.user?.name ?? 'Usuário'}
                                </p>
                                <p className={`break-words text-xs ${themeClasses.text.tertiary}`}>
                                  {format(new Date(comment.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className={`flex-shrink-0 rounded-lg p-1.5 ${themeClasses.text.tertiary} opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400`}
                              title="Deletar comentário"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className={`mt-3 break-words text-sm leading-relaxed ${themeClasses.text.secondary}`}>
                            {comment.content}
                          </p>
                        </div>
                      ))}

                      {comments.length === 0 && (
                        <div className={`rounded-xl border-2 border-dashed ${themeClasses.border.primary} px-6 py-12 text-center`}>
                          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10`}>
                            <MessageSquare className="h-8 w-8 text-violet-400" />
                          </div>
                          <p className={`break-words text-sm font-medium ${themeClasses.text.primary}`}>
                            Nenhum comentário ainda
                          </p>
                          <p className={`mt-1 text-xs ${themeClasses.text.tertiary}`}>
                            Seja o primeiro a comentar
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Comment Input */}
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
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
                      className={`flex-1 ${inputBaseClass} ${themeClasses.border.primary} ${themeClasses.bg.subtle} ${themeClasses.text.primary}`}
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || !canEdit || commentSubmitting}
                      className={`${primaryButtonClass} sm:w-auto`}
                    >
                      {commentSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Enviar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Sidebar */}
            <div className="min-w-0 lg:col-span-1">
              <div className="min-w-0 lg:sticky lg:top-24">
                <div className={`${sectionTitleClass} mb-4`}>
                  <Activity className="h-5 w-5 text-violet-400" />
                  <h3 className={`${themeClasses.text.primary}`}>Atividade</h3>
                </div>

                {activitiesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {(Array.isArray(activities) ? activities : []).map((activity) => (
                      <div
                        key={activity.id}
                        className={`rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-3.5 transition-all duration-200 hover:border-violet-500/20 hover:shadow-sm`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 ring-1 ring-white/5">
                            <Activity className="h-3.5 w-3.5 text-violet-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`break-words text-sm ${themeClasses.text.secondary}`}>
                              <span className={`font-semibold ${themeClasses.text.primary}`}>
                                {activity.user?.name ?? 'Sistema'}
                              </span>{' '}
                              {activity.description}
                            </p>
                            <p className={`mt-1.5 break-words text-xs ${themeClasses.text.tertiary}`}>
                              {format(new Date(activity.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {activities.length === 0 && (
                      <div className={`rounded-xl border-2 border-dashed ${themeClasses.border.primary} px-4 py-12 text-center`}>
                        <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10`}>
                          <Activity className="h-7 w-7 text-violet-400" />
                        </div>
                        <p className={`break-words text-sm font-medium ${themeClasses.text.primary}`}>
                          Nenhuma atividade ainda
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className={`mt-6 flex min-w-0 flex-col gap-3 border-t ${themeClasses.border.primary} pt-5 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:pt-6`}>
            <button
              onClick={handleDelete}
              disabled={!canEdit || loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-red-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <Trash2 className="h-4 w-4" />
              Deletar task
            </button>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
              <button
                onClick={onClose}
                className={`${secondaryButtonClass} ${themeClasses.text.tertiary} hover:text-white w-full sm:w-auto`}
              >
                Cancelar
              </button>

              <button
                onClick={handleSave}
                disabled={loading || !title.trim() || !canEdit}
                className={`${primaryButtonClass} w-full sm:w-auto`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar alterações
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {commentToDelete && (
        <div className="absolute inset-0 z-[1002] isolate flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`relative z-[1003] w-full max-w-md overflow-hidden rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.primary} shadow-2xl shadow-black/40 animate-in zoom-in-95 slide-in-from-bottom-3 duration-200`}
          >
            <div className={`border-b ${themeClasses.border.primary} px-5 py-4`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                    <Trash2 className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <h2 className={`text-base font-bold ${themeClasses.text.primary}`}>
                      Deletar comentário
                    </h2>
                    <p className={`mt-0.5 text-xs ${themeClasses.text.tertiary}`}>
                      Confirme para continuar
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeCommentDeleteConfirm}
                  disabled={commentDeleting}
                  className={`rounded-lg p-2 ${themeClasses.text.tertiary} transition-all hover:bg-violet-500/10 hover:text-violet-400 disabled:cursor-not-allowed disabled:opacity-50`}
                  aria-label="Fechar confirmação"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="px-5 py-5">
              <p className={`whitespace-pre-line text-sm leading-relaxed ${themeClasses.text.secondary}`}>
                Tem certeza que deseja deletar este comentário?
              </p>
            </div>

            <div className={`flex flex-col-reverse gap-2 border-t ${themeClasses.border.primary} px-5 py-4 sm:flex-row sm:justify-end`}>
              <button
                type="button"
                onClick={closeCommentDeleteConfirm}
                disabled={commentDeleting}
                className={`inline-flex items-center justify-center rounded-xl border ${themeClasses.border.primary} px-4 py-2.5 text-sm font-semibold ${themeClasses.text.secondary} transition-all hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-400 disabled:cursor-not-allowed disabled:opacity-50`}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmDeleteComment}
                disabled={commentDeleting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition-all hover:bg-red-600 hover:shadow-red-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {commentDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deletando...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Deletar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>,
    document.body,
  );
}