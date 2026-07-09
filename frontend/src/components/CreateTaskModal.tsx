'use client';

import { useState, useEffect, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../lib/api';
import { useTheme } from '../hooks/useTheme';
import { useLabels } from '../hooks/useLabels';

import {
  X,
  Send,
  Clock,
  Flag,
  Tag,
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
  Calendar,
  Users,
  ChevronDown,
  Archive,
  Paperclip,
} from 'lucide-react';

import AttachmentUploader from './AttachmentUploader';

type Attachment = {
  id: string;
  url?: string;
  fileName?: string;
  name?: string;
  fileType?: string;
  size?: number;
};

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
  projectCompleted?: boolean;
};

const priorityOptions: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const statusOptions: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'ABORTED'];

const DEFAULT_LABEL_COLOR = '#8B5CF6';

// Constantes auxiliares visuais
const inputBaseClass = 'w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60';
const labelClass = 'mb-2 flex items-center gap-2 text-sm font-semibold';
const badgeBaseClass = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold';
const primaryButtonClass = 'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-200 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100';

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


export default function CreateTaskModal({
  workspaceId,
  projectId,
  initialStatus,
  onClose,
  onCreated,
  projectMembers = [],
  projectCompleted = false,
}: Props) {
  const { theme, themeClasses } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const statusConfig: Record<
    TaskStatus,
    { label: string; icon: any; color: string; bg: string; border: string; dot: string }
  > =
    theme === 'dark'
      ? {
          TODO: { label: 'A fazer', icon: Clock, color: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-zinc-500/20', dot: 'bg-zinc-400' },
          IN_PROGRESS: { label: 'Em progresso', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', dot: 'bg-blue-400' },
          IN_REVIEW: { label: 'Em revisão', icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-400' },
          DONE: { label: 'Concluído', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
          ABORTED: { label: 'Cancelado', icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', dot: 'bg-red-400' },
        }
      : {
          TODO: { label: 'A fazer', icon: Clock, color: 'text-zinc-600', bg: 'bg-zinc-100', border: 'border-zinc-200', dot: 'bg-zinc-600' },
          IN_PROGRESS: { label: 'Em progresso', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200', dot: 'bg-blue-600' },
          IN_REVIEW: { label: 'Em revisão', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200', dot: 'bg-amber-600' },
          DONE: { label: 'Concluído', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200', dot: 'bg-emerald-600' },
          ABORTED: { label: 'Cancelado', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200', dot: 'bg-red-600' },
        };

  const priorityConfig: Record<
    TaskPriority,
    { label: string; icon: any; color: string; bg: string; border: string; dot: string }
  > =
    theme === 'dark'
      ? {
          LOW: { label: 'Baixa', icon: Flag, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', dot: 'bg-blue-400' },
          MEDIUM: { label: 'Média', icon: Flag, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-400' },
          HIGH: { label: 'Alta', icon: Flag, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', dot: 'bg-orange-400' },
          URGENT: { label: 'Urgente', icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', dot: 'bg-red-400' },
        }
      : {
          LOW: { label: 'Baixa', icon: Flag, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200', dot: 'bg-blue-600' },
          MEDIUM: { label: 'Média', icon: Flag, color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200', dot: 'bg-amber-600' },
          HIGH: { label: 'Alta', icon: Flag, color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-200', dot: 'bg-orange-600' },
          URGENT: { label: 'Urgente', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200', dot: 'bg-red-600' },
        };

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editingLabelName, setEditingLabelName] = useState('');
  const [editingLabelColor, setEditingLabelColor] = useState(DEFAULT_LABEL_COLOR);

  const { labels, loading: labelsLoading, createLabel } = useLabels(workspaceId);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showAssigneesDropdown, setShowAssigneesDropdown] = useState(false);

  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const currentStatusConfig = statusConfig[status];
  const StatusIcon = currentStatusConfig.icon;
  const currentPriorityConfig = priorityConfig[priority];

  const descriptionTextareaId = 'create-task-description-textarea';

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
          dueDate: dueDate ? `${dueDate}T00:00:00.000Z` : null,
          assigneeIds: selectedAssignees,
          labelIds: selectedLabels,
        }),
      });

      onCreated(created);
      setCreatedTaskId(created.id);
      console.log('[CreateTaskModal] task created for attachments', created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar task');
    } finally {
      setLoading(false);
    }
  }

  function handleCloseAfterAttachments() {
    setCreatedTaskId(null);
    setAttachments([]);
    onClose();
  }

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] isolate flex items-center justify-center overflow-hidden bg-black/60 p-3 backdrop-blur-sm animate-in fade-in duration-200 sm:p-6">
      <div
        className={`relative z-[1001] flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border ${themeClasses.border.primary} ${themeClasses.bg.primary} shadow-2xl shadow-black/20 animate-in zoom-in-95 duration-300`}
      >
        {/* Header */}
        <div className={`flex-shrink-0 border-b ${themeClasses.border.primary} px-5 py-4 sm:px-6 sm:py-5`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <div className={`${badgeBaseClass} ${currentStatusConfig.bg} ${currentStatusConfig.border} border`}>
                  <div className={`h-2 w-2 rounded-full ${currentStatusConfig.dot} shadow-[0_0_6px_currentColor]`} />
                  <StatusIcon className={`h-3.5 w-3.5 ${currentStatusConfig.color}`} />
                  <span className={currentStatusConfig.color}>{currentStatusConfig.label}</span>
                </div>
                <Sparkles className="h-4 w-4 text-violet-400" />
              </div>
              <h2 className={`text-xl font-bold tracking-tight sm:text-2xl ${themeClasses.text.primary}`}>
                Nova task
              </h2>
              <p className={`mt-1 text-sm ${themeClasses.text.tertiary}`}>
                Preencha os detalhes da sua nova task
              </p>
            </div>

            <button
              onClick={onClose}
              className={`flex-shrink-0 rounded-xl p-2 transition-all duration-200 ${themeClasses.text.tertiary} hover:bg-zinc-800/50 hover:text-white hover:scale-105 active:scale-95`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-5 sm:px-6 sm:py-6">
          <div className="space-y-5">
            {/* Project Completed Warning */}
            {projectCompleted && (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
                <Archive className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Projeto Finalizado</p>
                  <p className="text-emerald-400/70 mt-0.5">Não é possível criar tasks em um projeto finalizado.</p>
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label className={`${labelClass} ${themeClasses.text.secondary}`}>
                <Sparkles className="h-4 w-4 text-violet-400" />
                Título <span className="text-red-400">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Implementar onboarding, Corrigir bug de login..."
                autoFocus
                disabled={projectCompleted}
                className={`${inputBaseClass} ${themeClasses.border.primary} ${themeClasses.bg.subtle} ${themeClasses.text.primary} placeholder:text-zinc-500`}
              />
            </div>

            {/* Description */}
            <div>
              <label className={`${labelClass} ${themeClasses.text.secondary}`}>
                <FileText className="h-4 w-4 text-violet-400" />
                Descrição
              </label>

              <DescriptionToolbar
                disabled={projectCompleted}
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
                rows={5}
                placeholder={`Escreva a descrição...\n\nExemplos:\n- [ ] arrumar header\n- [x] arrumar landing page\n**texto em negrito**\n- item de lista`}
                disabled={projectCompleted}
                className={`${inputBaseClass} ${themeClasses.border.primary} ${themeClasses.bg.subtle} ${themeClasses.text.primary} placeholder:text-zinc-500 resize-y min-h-[140px] font-mono text-[13px] leading-relaxed`}
              />

              <DescriptionPreview
                value={description}
                themeClasses={themeClasses}
                readOnly={projectCompleted}
                onToggleChecklistItem={toggleChecklistLine}
              />
            </div>

            {/* Status */}
            <div>
              <label className={`${labelClass} ${themeClasses.text.secondary}`}>
                <Clock className="h-4 w-4 text-violet-400" />
                Status
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  disabled={projectCompleted}
                  className={`flex w-full items-center justify-between rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-4 py-3 text-sm ${themeClasses.text.primary} transition-all duration-200 hover:border-violet-500/30 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg ${currentStatusConfig.bg} p-1.5`}>
                      <StatusIcon className={`h-4 w-4 ${currentStatusConfig.color}`} />
                    </div>
                    <span className="font-medium">{currentStatusConfig.label}</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showStatusDropdown ? 'rotate-180' : ''} ${themeClasses.text.tertiary}`} />
                </button>

                {showStatusDropdown && (
                  <div className={`absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} shadow-xl animate-in fade-in slide-in-from-top-2 duration-200`}>
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
                          className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition-all duration-150 ${
                            isSelected
                              ? `${config.bg} ${config.color}`
                              : `${themeClasses.text.secondary} hover:${themeClasses.bg.subtle} hover:text-white`
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="font-medium">{config.label}</span>
                          {isSelected && (
                            <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className={`${labelClass} ${themeClasses.text.secondary}`}>
                <Flag className="h-4 w-4 text-violet-400" />
                Prioridade
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {priorityOptions.map((option) => {
                  const config = priorityConfig[option];
                  const isSelected = priority === option;
                  const Icon = config.icon;

                  return (
                    <button
                      key={option}
                      onClick={() => setPriority(option)}
                      disabled={projectCompleted}
                      className={`group relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all duration-200 ${
                        isSelected
                          ? `${config.bg} ${config.border} shadow-lg`
                          : `${themeClasses.border.primary} ${themeClasses.bg.subtle} hover:border-violet-500/30 hover:shadow-md`
                      } disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      <Icon
                        className={`h-5 w-5 ${config.color} transition-transform duration-200 ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`}
                      />
                      <span className={`text-xs font-semibold ${config.color}`}>
                        {config.label}
                      </span>
                      {isSelected && (
                        <div className={`absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ${themeClasses.bg.primary}`}>
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Due Date & Assignees */}
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
              <div>
                <label className={`${labelClass} ${themeClasses.text.secondary}`}>
                  <Calendar className="h-4 w-4 text-violet-400" />
                  Vencimento
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={projectCompleted}
                  className={`${inputBaseClass} ${themeClasses.border.primary} ${themeClasses.bg.subtle} ${themeClasses.text.primary}`}
                />
              </div>

              <div>
                <label className={`${labelClass} ${themeClasses.text.secondary}`}>
                  <Users className="h-4 w-4 text-violet-400" />
                  Responsáveis
                </label>

                <div className="relative">
                  <button
                    onClick={() => setShowAssigneesDropdown(!showAssigneesDropdown)}
                    disabled={projectCompleted}
                    className={`flex w-full items-center justify-between rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-4 py-3 text-sm transition-all duration-200 hover:border-violet-500/30 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60`}
                  >
                    <span className={`${selectedAssignees.length > 0 ? themeClasses.text.primary : themeClasses.text.tertiary}`}>
                      {selectedAssignees.length > 0
                        ? `${selectedAssignees.length} selecionado${selectedAssignees.length > 1 ? 's' : ''}`
                        : 'Selecionar...'}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showAssigneesDropdown ? 'rotate-180' : ''} ${themeClasses.text.tertiary}`} />
                  </button>

                  {showAssigneesDropdown && !projectCompleted && (
                    <div className={`absolute left-0 right-0 top-full z-10 mt-2 max-h-48 overflow-hidden overflow-y-auto rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} shadow-xl animate-in fade-in slide-in-from-top-2 duration-200`}>
                      {projectMembers && projectMembers.length > 0 ? (
                        projectMembers.map((member: WorkspaceMember) => {
                          const isSelected = selectedAssignees.includes(member.id);
                          return (
                            <button
                              key={member.id}
                              onClick={() => {
                                setSelectedAssignees((prev) =>
                                  prev.includes(member.id)
                                    ? prev.filter((id) => id !== member.id)
                                    : [...prev, member.id],
                                );
                              }}
                              className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition-all duration-150 ${
                                isSelected
                                  ? 'bg-violet-500/10 text-violet-300'
                                  : `${themeClasses.text.secondary} hover:${themeClasses.bg.subtle} hover:text-white`
                              }`}
                            >
                              {member.avatarUrl ? (
                                <img src={member.avatarUrl} alt={member.name} className="h-8 w-8 rounded-full object-cover ring-1 ring-white/10" />
                              ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 text-xs font-bold ring-1 ring-white/10">
                                  {member.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0 flex-1 text-left">
                                <div className={`truncate font-semibold ${themeClasses.text.primary}`}>
                                  {member.name}
                                </div>
                                <div className={`truncate text-xs ${themeClasses.text.tertiary}`}>
                                  {member.email}
                                </div>
                              </div>
                              {isSelected && (
                                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-violet-400" />
                              )}
                            </button>
                          );
                        })
                      ) : (
                        <div className={`px-4 py-6 text-center text-sm ${themeClasses.text.tertiary}`}>
                          Nenhum membro disponível
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Assignees Chips */}
                {selectedAssignees.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selectedAssignees.map((assigneeId) => {
                      const member = projectMembers?.find((m: WorkspaceMember) => m.id === assigneeId);
                      if (!member) return null;

                      return (
                        <span
                          key={assigneeId}
                          className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300"
                        >
                          {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt={member.name} className="h-4 w-4 rounded-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold">{member.name.charAt(0).toUpperCase()}</span>
                          )}
                          <span className="max-w-[100px] truncate">{member.name}</span>
                          <button
                            onClick={() => setSelectedAssignees((prev) => prev.filter((id) => id !== assigneeId))}
                            className="ml-0.5 rounded-full p-0.5 hover:bg-violet-500/20 transition-colors"
                            type="button"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Labels */}
            <div>
              <label className={`${labelClass} ${themeClasses.text.secondary}`}>
                <Tag className="h-4 w-4 text-violet-400" />
                Labels
              </label>

              {labelsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Create Label Button */}
                  {!projectCompleted && (
                    <div className="mb-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingLabelId('__new__');
                          setEditingLabelName('');
                          setEditingLabelColor(DEFAULT_LABEL_COLOR);
                        }}
                        className={`inline-flex items-center gap-2 rounded-xl border border-dashed ${themeClasses.border.primary} px-4 py-2.5 text-xs font-semibold ${themeClasses.text.secondary} transition-all duration-200 hover:border-violet-500/40 hover:text-violet-400 hover:bg-violet-500/5`}
                      >
                        <span className="text-base leading-none">+</span>
                        Nova Label
                      </button>

                      {/* Inline Create Label Form */}
                      {editingLabelId === '__new__' && (
                        <div className={`mt-3 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-4`}>
                          <div className="flex flex-col gap-3 sm:flex-row">
                            <input
                              value={editingLabelName}
                              onChange={(e) => setEditingLabelName(e.target.value)}
                              placeholder="Nome da label"
                              className={`flex-1 ${inputBaseClass} ${themeClasses.border.primary} ${themeClasses.bg.primary} py-2`}
                            />
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={editingLabelColor}
                                onChange={(e) => setEditingLabelColor(e.target.value)}
                                className="h-10 w-12 cursor-pointer rounded-lg border-0 p-1"
                              />
                              <button
                                type="button"
                                disabled={!editingLabelName.trim()}
                                onClick={async () => {
                                  try {
                                    const created = await createLabel(editingLabelName, editingLabelColor);
                                    setSelectedLabels((prev) => [...prev, created.id]);
                                    setEditingLabelId(null);
                                    setEditingLabelName('');
                                    setEditingLabelColor(DEFAULT_LABEL_COLOR);
                                  } catch (e) {
                                    console.error('Erro ao criar label:', e);
                                  }
                                }}
                                className={`${primaryButtonClass} py-2 px-3 text-xs`}
                              >
                                Criar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingLabelId(null);
                                  setEditingLabelName('');
                                  setEditingLabelColor(DEFAULT_LABEL_COLOR);
                                }}
                                className={`rounded-lg px-3 py-2 text-xs font-medium ${themeClasses.text.tertiary} hover:${themeClasses.bg.hover}`}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Labels List */}
                  {labels.length === 0 && !projectCompleted ? (
                    <div className={`rounded-xl border-2 border-dashed ${themeClasses.border.primary} px-4 py-8 text-center`}>
                      <Tag className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                      <p className={`text-sm ${themeClasses.text.tertiary}`}>
                        Nenhuma label disponível
                      </p>
                      <p className={`text-xs ${themeClasses.text.muted} mt-1`}>
                        Crie uma nova label acima
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-44 space-y-1.5 overflow-y-auto custom-scrollbar">
                      {labels.map((label: any) => {
                        const isSelected = selectedLabels.includes(label.id);
                        return (
                          <label
                            key={label.id}
                            className={`flex items-center gap-3 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-4 py-3 cursor-pointer transition-all duration-200 hover:border-violet-500/30 hover:bg-violet-500/5 ${
                              isSelected ? 'border-violet-500/40 bg-violet-500/5 ring-1 ring-violet-500/20' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedLabels((prev) => [...prev, label.id]);
                                } else {
                                  setSelectedLabels((prev) => prev.filter((id) => id !== label.id));
                                }
                              }}
                              disabled={projectCompleted}
                              className="h-4 w-4 rounded border-zinc-600 text-violet-500 focus:ring-violet-500/20 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <div
                              className="h-3 w-3 rounded-full flex-shrink-0 shadow-[0_0_6px_currentColor]"
                              style={{ backgroundColor: label.color }}
                            />
                            <span className={`text-sm font-medium ${themeClasses.text.primary} flex-1 truncate`}>
                              {label.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tip */}
            <div className={`rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-4`}>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-violet-500/10 p-1.5">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                  <p className={`text-xs font-medium ${themeClasses.text.primary}`}>
                    Dica
                  </p>
                  <p className={`text-xs ${themeClasses.text.tertiary} mt-0.5`}>
                    Use <code className="text-violet-400 font-mono">#</code> para mencionar tasks e{' '}
                    <code className="text-violet-400 font-mono">@</code> para mencionar membros.
                  </p>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Attachments (after creation) */}
            {createdTaskId && (
              <div className={`border-t ${themeClasses.border.primary} pt-5`}>
                <label className={`${labelClass} ${themeClasses.text.secondary}`}>
                  <Paperclip className="h-4 w-4 text-violet-400" />
                  Anexos
                </label>
                <p className={`text-xs ${themeClasses.text.tertiary} mb-3`}>
                  Task criada! Adicione anexos ou clique em Concluir.
                </p>

                <AttachmentUploader
                  taskId={createdTaskId}
                  workspaceId={workspaceId}
                  attachments={attachments}
                  onAttachmentAdded={(attachment) => {
                    console.log('[CreateTaskModal] attachment added');
                    setAttachments((prev) => {
                      if (prev.some((a) => a.id === attachment.id)) return prev;
                      return [...prev, attachment];
                    });
                  }}
                  onAttachmentRemoved={(attachmentId) => {
                    console.log('[CreateTaskModal] attachment removed', attachmentId);
                    setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`flex-shrink-0 border-t ${themeClasses.border.primary} px-5 py-4 sm:px-6 sm:py-5`}>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <button
              onClick={onClose}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-all duration-200 ${themeClasses.text.tertiary} hover:text-white hover:bg-zinc-800/50 active:scale-[0.98]`}
            >
              Cancelar
            </button>

            {!createdTaskId ? (
              <button
                onClick={handleCreate}
                disabled={loading || !title.trim() || projectCompleted}
                className={`${primaryButtonClass}`}
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
            ) : (
              <button
                onClick={handleCloseAfterAttachments}
                className={`${primaryButtonClass}`}
              >
                <CheckCircle2 className="h-4 w-4" />
                Concluir
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>,
    document.body,
  );
}