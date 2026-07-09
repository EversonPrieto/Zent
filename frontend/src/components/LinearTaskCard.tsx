'use client';

import { useTheme } from '../hooks/useTheme';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AlertCircle,
  Calendar,
  CheckSquare,
  Clock,
  GripVertical,
  ListTodo,
  MessageSquare,
  Paperclip,
  Tag,
  Users,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TaskLabel {
  id: string;
  name: string;
  color: string;
}

interface TaskAssignee {
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

interface Attachment {
  id: string;
  fileName: string;
}

export interface LinearTask {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  position: number;
  projectId: string;
  dueDate?: string | null;
  taskLabels?: Array<{ label: TaskLabel }>;
  taskAssignees?: TaskAssignee[];
  attachments?: Attachment[];
  comments?: unknown[];
  _count?: {
    comments?: number;
    attachments?: number;
  };
  [key: string]: any;
}

const priorityConfig = {
  LOW: {
    label: 'Baixa',
    color: 'text-blue-400',
    dot: 'bg-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/25',
    ring: 'group-hover:ring-blue-500/10',
  },
  MEDIUM: {
    label: 'Média',
    color: 'text-amber-400',
    dot: 'bg-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/25',
    ring: 'group-hover:ring-amber-500/10',
  },
  HIGH: {
    label: 'Alta',
    color: 'text-orange-400',
    dot: 'bg-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/25',
    ring: 'group-hover:ring-orange-500/10',
  },
  URGENT: {
    label: 'Urgente',
    color: 'text-red-400',
    dot: 'bg-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/25',
    ring: 'group-hover:ring-red-500/10',
  },
};

const cardBaseClass =
  'group relative cursor-grab rounded-2xl border transition-all duration-200 active:cursor-grabbing';
const metadataIconClass = 'h-3.5 w-3.5 flex-shrink-0';
const smallBadgeClass =
  'inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold leading-none';

function getDueStatus(dueDate: string | null | undefined) {
  if (!dueDate) return null;

  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'overdue',
      label: 'Atrasada',
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      icon: AlertCircle,
    };
  }

  if (diffDays === 0) {
    return {
      status: 'today',
      label: 'Hoje',
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
      icon: Clock,
    };
  }

  if (diffDays <= 3) {
    return {
      status: 'soon',
      label: `${diffDays}d`,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      icon: Clock,
    };
  }

  return {
    status: 'normal',
    label: format(due, 'dd MMM', { locale: ptBR }),
    color: 'text-zinc-400',
    bg: 'bg-zinc-500/10',
    border: 'border-zinc-500/20',
    icon: Calendar,
  };
}

function stripMarkdown(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/^\s*[-*]\s+\[[ xX]\]\s+/gm, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/[#>]/g, '')
    .trim();
}

function getDescriptionPreview(description?: string | null) {
  if (!description) return '';

  const clean = stripMarkdown(description).replace(/\s+/g, ' ').trim();

  return clean.length > 130 ? `${clean.slice(0, 130)}...` : clean;
}

function getChecklistStats(description?: string | null) {
  if (!description) return null;

  const matches = description.match(/^\s*[-*]\s+\[[ xX]\]\s+.+$/gm) || [];
  if (matches.length === 0) return null;

  const done = matches.filter((item) => /\[[xX]\]/.test(item)).length;

  return {
    done,
    total: matches.length,
    percent: Math.round((done / matches.length) * 100),
  };
}

function getCommentCount(task: LinearTask | any) {
  if (Array.isArray(task.comments)) return task.comments.length;
  if (typeof task._count?.comments === 'number') return task._count.comments;
  if (typeof task.commentsCount === 'number') return task.commentsCount;
  return 0;
}

function getAttachmentCount(task: LinearTask | any) {
  if (Array.isArray(task.attachments)) return task.attachments.length;
  if (typeof task._count?.attachments === 'number') return task._count.attachments;
  if (typeof task.attachmentsCount === 'number') return task.attachmentsCount;
  return 0;
}

function getUserInitial(name?: string | null) {
  if (!name) return '?';

  return name.trim().charAt(0).toUpperCase();
}

export function LinearTaskCard({
  task,
  onClick,
}: {
  task: LinearTask | any;
  onClick: (task: LinearTask | any) => void;
}) {
  const { themeClasses } = useTheme();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
  };

  const priority =
    priorityConfig[
    (task.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') || 'MEDIUM'
    ];

  const dueStatus = getDueStatus(task.dueDate);
  const labels = task.taskLabels || [];
  const assignees = task.taskAssignees || [];
  const attachmentCount = getAttachmentCount(task);
  const commentCount = getCommentCount(task);
  const checklistStats = getChecklistStats(task.description);
  const descriptionPreview = getDescriptionPreview(task.description);
  const DueIcon = dueStatus?.icon || Calendar;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(event) => {
        event.stopPropagation();
        onClick(task);
      }}
      className={`${cardBaseClass} border-violet-500/20 ${themeClasses.bg.subtle} p-3.5 shadow-sm hover:-translate-y-0.5 hover:border-violet-500/60 hover:shadow-lg hover:shadow-violet-500/10 hover:ring-4 hover:ring-violet-500/15 ${isDragging
          ? 'z-50 border-violet-400/70 shadow-2xl shadow-violet-500/20 ring-4 ring-violet-400/25'
          : ''
        }`}
    >
      <div className={`absolute inset-y-3 left-0 w-1 rounded-r-full ${priority.dot} opacity-80 transition-opacity group-hover:opacity-100`} />

      <div className="relative min-w-0 space-y-3 pl-2">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 hidden flex-shrink-0 rounded-lg p-1 opacity-0 transition-all duration-200 group-hover:bg-violet-500/10 group-hover:opacity-100 sm:block">
            <GripVertical className={`h-4 w-4 ${themeClasses.text.tertiary}`} />
          </div>

          <div className="min-w-0 flex-1">
            <h3
              className={`line-clamp-2 break-words text-sm font-semibold leading-snug ${themeClasses.text.primary} transition-colors duration-200 group-hover:text-violet-400`}
            >
              {task.title}
            </h3>

            {descriptionPreview && (
              <p className={`mt-1.5 line-clamp-2 break-words text-xs leading-relaxed ${themeClasses.text.tertiary}`}>
                {descriptionPreview}
              </p>
            )}
          </div>

          <div
            className={`flex flex-shrink-0 items-center gap-1.5 rounded-xl border ${priority.bg} ${priority.border} px-2.5 py-1 text-[11px] font-bold ${priority.color}`}
            title={`Prioridade: ${priority.label}`}
          >
            <span className={`h-2 w-2 rounded-full ${priority.dot} shadow-[0_0_8px_currentColor]`} />
            <span className="hidden sm:inline">{priority.label}</span>
          </div>
        </div>

        {checklistStats && (
          <div className={`rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.tertiary} p-2.5`}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className={`flex items-center gap-1.5 text-xs font-semibold ${themeClasses.text.secondary}`}>
                <CheckSquare className="h-3.5 w-3.5 text-violet-400" />
                <span>
                  Checklist {checklistStats.done}/{checklistStats.total}
                </span>
              </div>
              <span className={`text-[11px] font-semibold ${themeClasses.text.tertiary}`}>
                {checklistStats.percent}%
              </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-500/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-300"
                style={{ width: `${checklistStats.percent}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          {dueStatus && (
            <div
              className={`${smallBadgeClass} border ${dueStatus.bg} ${dueStatus.border} ${dueStatus.color}`}
              title="Data de entrega"
            >
              <DueIcon className={metadataIconClass} />
              <span>{dueStatus.label}</span>
            </div>
          )}

          {labels.length > 0 && (
            <div
              className={`${smallBadgeClass} ${themeClasses.bg.tertiary} ${themeClasses.text.secondary}`}
              title={`${labels.length} label${labels.length > 1 ? 's' : ''}`}
            >
              <Tag className={metadataIconClass} />
              <span>{labels.length}</span>
            </div>
          )}

          {assignees.length > 0 && (
            <div
              className={`${smallBadgeClass} ${themeClasses.bg.tertiary} ${themeClasses.text.secondary}`}
              title={`${assignees.length} responsável${assignees.length > 1 ? 'eis' : ''}`}
            >
              <Users className={metadataIconClass} />
              <span>{assignees.length}</span>
            </div>
          )}

          {attachmentCount > 0 && (
            <div
              className={`${smallBadgeClass} ${themeClasses.bg.tertiary} ${themeClasses.text.secondary}`}
              title={`${attachmentCount} anexo${attachmentCount > 1 ? 's' : ''}`}
            >
              <Paperclip className={metadataIconClass} />
              <span>{attachmentCount}</span>
            </div>
          )}

          {commentCount > 0 && (
            <div
              className={`${smallBadgeClass} ${themeClasses.bg.tertiary} ${themeClasses.text.secondary}`}
              title={`${commentCount} comentário${commentCount > 1 ? 's' : ''}`}
            >
              <MessageSquare className={metadataIconClass} />
              <span>{commentCount}</span>
            </div>
          )}

          {checklistStats && (
            <div
              className={`${smallBadgeClass} ${themeClasses.bg.tertiary} ${themeClasses.text.secondary}`}
              title="Itens de checklist"
            >
              <ListTodo className={metadataIconClass} />
              <span>
                {checklistStats.done}/{checklistStats.total}
              </span>
            </div>
          )}
        </div>

        {labels.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {labels.slice(0, 3).map(({ label }: any) => (
              <span
                key={label.id}
                className="inline-flex max-w-[135px] items-center truncate rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none shadow-sm"
                style={{
                  backgroundColor: `${label.color}18`,
                  color: label.color,
                  border: `1px solid ${label.color}35`,
                }}
                title={label.name}
              >
                {label.name}
              </span>
            ))}

            {labels.length > 3 && (
              <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${themeClasses.bg.tertiary} ${themeClasses.text.tertiary}`}>
                +{labels.length - 3}
              </span>
            )}
          </div>
        )}

        {assignees.length > 0 && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center -space-x-2">
              {assignees.slice(0, 4).map(({ user }: any) => (
                <div
                  key={user.id}
                  className={`flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 ${themeClasses.border.primary} ${themeClasses.bg.tertiary} text-[10px] font-bold ${themeClasses.text.primary} shadow-sm transition-transform duration-200 hover:z-10 hover:scale-110`}
                  title={user.name}
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    getUserInitial(user.name)
                  )}
                </div>
              ))}

              {assignees.length > 4 && (
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${themeClasses.border.primary} ${themeClasses.bg.tertiary} text-[10px] font-bold ${themeClasses.text.tertiary} shadow-sm`}
                  title={`${assignees.length - 4} responsáveis adicionais`}
                >
                  +{assignees.length - 4}
                </div>
              )}
            </div>

            <span className={`text-[11px] font-medium ${themeClasses.text.muted}`}>
              Abrir detalhes
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
