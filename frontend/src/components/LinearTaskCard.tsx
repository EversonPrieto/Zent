'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Calendar, Tag, Users, Paperclip, Flag, Clock, AlertTriangle } from 'lucide-react';
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
  // Campos opcionais para compatibilidade com tipos antigos
  [key: string]: any;
}

const priorityConfig = {
  LOW: { label: 'Baixa', color: 'text-blue-400', dot: 'bg-blue-400' },
  MEDIUM: { label: 'Média', color: 'text-amber-400', dot: 'bg-amber-400' },
  HIGH: { label: 'Alta', color: 'text-orange-400', dot: 'bg-orange-400' },
  URGENT: { label: 'Urgente', color: 'text-red-400', dot: 'bg-red-400' },
};

function getDueStatus(dueDate: string | null | undefined) {
  if (!dueDate) return null;

  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { status: 'overdue', label: 'Atrasada', color: 'text-red-400' };
  if (diffDays === 0) return { status: 'today', label: 'Hoje', color: 'text-yellow-400' };
  if (diffDays <= 3) return { status: 'soon', label: `${diffDays}d`, color: 'text-amber-400' };
  return { status: 'normal', label: format(due, 'dd MMM', { locale: ptBR }), color: 'text-zinc-400' };
}

export function LinearTaskCard({
  task,
  onClick,
}: {
  task: LinearTask | any;
  onClick: (task: LinearTask | any) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priority = priorityConfig[(task.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') || 'MEDIUM'];
  const dueStatus = getDueStatus(task.dueDate);
  const labels = task.taskLabels || [];
  const assignees = task.taskAssignees || [];
  const attachmentCount = task.attachments?.length || 0;

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
      className="group relative rounded-lg border border-white/10 bg-white/5 p-3 cursor-grab active:cursor-grabbing transition-all hover:border-white/20 hover:bg-white/10"
    >
      <div className="relative space-y-2">
        {/* Header com título e prioridade */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <GripVertical className="h-4 w-4 text-zinc-600 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100" />
            <h3 className="font-medium text-white group-hover:text-violet-400 transition-colors line-clamp-2 text-sm">
              {task.title}
            </h3>
          </div>
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 text-xs font-medium flex-shrink-0 ${priority.color}`}>
            <div className={`h-1.5 w-1.5 rounded-full ${priority.dot}`} />
            {priority.label}
          </div>
        </div>

        {/* Meta info: due date, labels, assignees, attachments */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-zinc-400 px-6">
          {/* Due Date */}
          {dueStatus && (
            <div className={`flex items-center gap-1 ${dueStatus.color}`}>
              <Calendar className="h-3 w-3" />
              <span>{dueStatus.label}</span>
            </div>
          )}

          {/* Labels */}
          {labels.length > 0 && (
            <div className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              <span>{labels.length}</span>
            </div>
          )}

          {/* Assignees */}
          {assignees.length > 0 && (
            <div className="flex items-center gap-0.5">
              <Users className="h-3 w-3" />
              <span>{assignees.length}</span>
            </div>
          )}

          {/* Attachments */}
          {attachmentCount > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              <span>{attachmentCount}</span>
            </div>
          )}
        </div>

        {/* Labels chips (se houver espaço) */}
        {labels.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap px-6">
            {labels.slice(0, 2).map(({ label }: any) => (
              <span
                key={label.id}
                className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                style={{ backgroundColor: label.color + '20', color: label.color }}
              >
                {label.name}
              </span>
            ))}
            {labels.length > 2 && (
              <span className="text-[10px] text-zinc-500">+{labels.length - 2}</span>
            )}
          </div>
        )}

        {/* Avatares de assignees */}
        {assignees.length > 0 && (
          <div className="flex items-center gap-1 px-6">
            {assignees.slice(0, 3).map(({ user }: any) => (
              <div
                key={user.id}
                className="h-6 w-6 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white"
                title={user.name}
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
            ))}
            {assignees.length > 3 && (
              <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                +{assignees.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
