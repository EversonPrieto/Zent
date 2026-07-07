'use client';

import { useTheme } from '../hooks/useTheme';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Calendar,
  Tag,
  Users,
  Paperclip,
  AlertCircle,
  Clock,
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
  [key: string]: any;
}

const priorityConfig = {
  LOW: { label: 'Baixa', color: 'text-blue-400', dot: 'bg-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  MEDIUM: { label: 'Média', color: 'text-amber-400', dot: 'bg-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  HIGH: { label: 'Alta', color: 'text-orange-400', dot: 'bg-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  URGENT: { label: 'Urgente', color: 'text-red-400', dot: 'bg-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
};

// Constantes auxiliares visuais
const cardBaseClass = 'group relative cursor-grab rounded-xl border transition-all duration-200 active:cursor-grabbing';
const metadataIconClass = 'h-3 w-3 flex-shrink-0';
const avatarClass = 'flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 border-white dark:border-zinc-800 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 text-[10px] font-bold shadow-sm transition-transform duration-200 hover:scale-110 hover:z-10';

function getDueStatus(dueDate: string | null | undefined) {
  if (!dueDate) return null;

  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: 'overdue', label: 'Atrasada', color: 'text-red-400', bg: 'bg-red-500/10', icon: AlertCircle };
  }

  if (diffDays === 0) {
    return { status: 'today', label: 'Hoje', color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: Clock };
  }

  if (diffDays <= 3) {
    return { status: 'soon', label: `${diffDays}d`, color: 'text-amber-400', bg: 'bg-amber-500/10', icon: Clock };
  }

  return {
    status: 'normal',
    label: format(due, 'dd MMM', { locale: ptBR }),
    color: 'text-zinc-400',
    bg: 'bg-zinc-500/10',
    icon: Calendar,
  };
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
    opacity: isDragging ? 0.4 : 1,
    scale: isDragging ? '1.02' : '1',
  };

  const priority =
    priorityConfig[
      (task.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') || 'MEDIUM'
    ];

  const dueStatus = getDueStatus(task.dueDate);
  const labels = task.taskLabels || [];
  const assignees = task.taskAssignees || [];
  const attachmentCount = task.attachments?.length || 0;
  const DueIcon = dueStatus?.icon || Calendar;

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
      className={`${cardBaseClass} ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-3 hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/5 hover:-translate-y-0.5 ${
        isDragging
          ? 'border-violet-400/50 shadow-2xl shadow-violet-500/20 ring-2 ring-violet-400/30 z-50'
          : ''
      }`}
    >
      {/* Priority Indicator Bar */}
      <div className={`absolute left-0 top-0 h-full w-1 rounded-l-xl ${priority.dot} opacity-60 group-hover:opacity-100 transition-opacity`} />

      <div className="relative space-y-2.5 pl-2">
        {/* Title Row */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            {/* Drag Handle */}
            <div className="mt-0.5 flex-shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <GripVertical className={`h-4 w-4 ${themeClasses.text.tertiary}`} />
            </div>

            {/* Title */}
            <h3
              className={`min-w-0 text-sm font-semibold leading-snug line-clamp-2 ${themeClasses.text.primary} transition-colors duration-200 group-hover:text-violet-400`}
            >
              {task.title}
            </h3>
          </div>

          {/* Priority Badge */}
          <div
            className={`flex w-fit flex-shrink-0 items-center gap-1.5 rounded-lg ${priority.bg} ${priority.border} px-2.5 py-1 text-xs font-semibold ${priority.color} border transition-all duration-200 group-hover:shadow-sm`}
          >
            <div className={`h-2 w-2 rounded-full ${priority.dot} shadow-[0_0_6px_currentColor]`} />
            {priority.label}
          </div>
        </div>

        {/* Metadata Row */}
        <div className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs ${themeClasses.text.tertiary} pl-0 sm:pl-6`}>
          {/* Due Date */}
          {dueStatus && (
            <div className={`flex items-center gap-1.5 rounded-md ${dueStatus.bg} px-2 py-0.5 ${dueStatus.color} font-medium`}>
              <DueIcon className={metadataIconClass} />
              <span>{dueStatus.label}</span>
            </div>
          )}

          {/* Labels Count */}
          {labels.length > 0 && (
            <div className={`flex items-center gap-1.5 ${themeClasses.text.secondary}`}>
              <Tag className={metadataIconClass} />
              <span className="font-medium">{labels.length}</span>
            </div>
          )}

          {/* Assignees Count */}
          {assignees.length > 0 && (
            <div className={`flex items-center gap-1.5 ${themeClasses.text.secondary}`}>
              <Users className={metadataIconClass} />
              <span className="font-medium">{assignees.length}</span>
            </div>
          )}

          {/* Attachments Count */}
          {attachmentCount > 0 && (
            <div className={`flex items-center gap-1.5 ${themeClasses.text.secondary}`}>
              <Paperclip className={metadataIconClass} />
              <span className="font-medium">{attachmentCount}</span>
            </div>
          )}
        </div>

        {/* Labels */}
        {labels.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pl-0 sm:pl-6">
            {labels.slice(0, 3).map(({ label }: any) => (
              <span
                key={label.id}
                className="inline-flex max-w-[120px] items-center truncate rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none shadow-sm transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: `${label.color}15`,
                  color: label.color,
                  border: `1px solid ${label.color}30`,
                }}
                title={label.name}
              >
                {label.name}
              </span>
            ))}

            {labels.length > 3 && (
              <span className={`text-[11px] font-semibold ${themeClasses.text.tertiary} px-1`}>
                +{labels.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Assignees Avatars */}
        {assignees.length > 0 && (
          <div className="flex items-center gap-0.5 pl-0 sm:pl-6">
            <div className="flex items-center -space-x-2">
              {assignees.slice(0, 4).map(({ user }: any) => (
                <div
                  key={user.id}
                  className={avatarClass}
                  title={user.name}
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
              ))}
            </div>

            {assignees.length > 4 && (
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full ${themeClasses.bg.subtle} text-[10px] font-bold ${themeClasses.text.tertiary} border-2 border-white dark:border-zinc-800 shadow-sm ml-1`}
              >
                +{assignees.length - 4}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}