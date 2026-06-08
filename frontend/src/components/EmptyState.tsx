'use client';

import { useTheme } from '../hooks/useTheme';
import React from 'react';
import {
  Users,
  FolderKanban,
  CheckCircle2,
  MessageSquare,
  Search,
  PlusCircle,
  Sparkles,
  Building2,
  LayoutDashboard,
  Mail,
  Clock,
  AlertCircle
} from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'centered';
}

const iconSizes = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
};

const containerSizes = {
  sm: 'py-6 px-4',
  md: 'py-12 px-6',
  lg: 'py-16 px-8',
};

const titleSizes = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-xl',
};

const descriptionSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  size = 'md',
  variant = 'default',
}: EmptyStateProps) {
  const { themeClasses } = useTheme();

  const variantStyles = {
    default: `border border-dashed ${themeClasses.border.primary} ${themeClasses.bg.subtle}`,
    compact: `border ${themeClasses.border.primary} ${themeClasses.bg.subtle}`,
    centered: 'border-none bg-transparent',
  };

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 rounded-2xl text-center transition-all ${variantStyles[variant]} ${containerSizes[size]}`}
    >
      <div className={`rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 p-4 ${iconSizes[size]} flex items-center justify-center`}>
        {icon || <Sparkles className={`${iconSizes[size]} text-violet-400`} />}
      </div>

      <div className="max-w-md space-y-2">
        <h3 className={`font-semibold ${themeClasses.text.primary} ${titleSizes[size]}`}>
          {title}
        </h3>
        {description && (
          <p className={`${themeClasses.text.tertiary} ${descriptionSizes[size]}`}>
            {description}
          </p>
        )}
      </div>

      {action && (
        <button
          onClick={action.onClick}
          className="group mt-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 hover:shadow-violet-500/40"
        >
          {action.icon || <PlusCircle className="h-4 w-4 transition-transform group-hover:rotate-90" />}
          {action.label}
        </button>
      )}
    </div>
  );
}

export function EmptyMembers({ onInvite }: { onInvite?: () => void }) {
  return (
    <EmptyState
      icon={<Users className="h-12 w-12 text-violet-400" />}
      title="Nenhum membro ainda"
      description="Convide pessoas para começar a colaborar neste workspace"
      action={onInvite ? { 
        label: 'Convidar membro', 
        onClick: onInvite,
        icon: <Mail className="h-4 w-4" />
      } : undefined}
      size="md"
    />
  );
}

export function EmptyProjects({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={<FolderKanban className="h-12 w-12 text-violet-400" />}
      title="Nenhum projeto criado"
      description="Crie seu primeiro projeto para começar a gerenciar tarefas"
      action={onCreate ? { 
        label: 'Criar projeto', 
        onClick: onCreate,
        icon: <PlusCircle className="h-4 w-4" />
      } : undefined}
      size="md"
    />
  );
}

export function EmptyTasks({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={<CheckCircle2 className="h-12 w-12 text-violet-400" />}
      title="Nenhuma tarefa"
      description="Crie uma tarefa para começar a gerenciar seu trabalho"
      action={onCreate ? { 
        label: 'Criar tarefa', 
        onClick: onCreate,
        icon: <PlusCircle className="h-4 w-4" />
      } : undefined}
      size="md"
    />
  );
}

export function EmptyComments() {
  return (
    <EmptyState
      icon={<MessageSquare className="h-8 w-8 text-violet-400" />}
      title="Sem comentários"
      description="Seja o primeiro a comentar"
      size="sm"
      variant="compact"
    />
  );
}

export function EmptySearch() {
  return (
    <EmptyState
      icon={<Search className="h-12 w-12 text-violet-400" />}
      title="Nenhum resultado encontrado"
      description="Tente ajustar seus filtros ou termos de busca"
      size="md"
    />
  );
}

export function EmptyWorkspace({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={<Building2 className="h-12 w-12 text-violet-400" />}
      title="Nenhum workspace encontrado"
      description="Crie seu primeiro workspace para começar a organizar seu trabalho"
      action={onCreate ? { 
        label: 'Criar workspace', 
        onClick: onCreate,
        icon: <PlusCircle className="h-4 w-4" />
      } : undefined}
      size="lg"
    />
  );
}

export function EmptyActivity() {
  return (
    <EmptyState
      icon={<Clock className="h-12 w-12 text-violet-400" />}
      title="Nenhuma atividade recente"
      description="Atividades aparecerão aqui conforme você e sua equipe trabalharem"
      size="md"
    />
  );
}

export function EmptyNotifications() {
  return (
    <EmptyState
      icon={<AlertCircle className="h-12 w-12 text-violet-400" />}
      title="Nenhuma notificação"
      description="Você está em dia! Novas notificações aparecerão aqui"
      size="md"
    />
  );
}

export function EmptyDashboard() {
  return (
    <EmptyState
      icon={<LayoutDashboard className="h-12 w-12 text-violet-400" />}
      title="Bem-vindo ao Zent!"
      description="Comece criando um workspace para organizar seus projetos"
      size="lg"
      variant="centered"
    />
  );
}

export function EmptyStateSkeleton() {
  const { themeClasses } = useTheme();

  return (
    <div className={`flex flex-col items-center justify-center gap-4 rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-12 text-center`}>
      <div className="h-12 w-12 animate-pulse rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20" />
      <div className="space-y-2">
        <div className={`h-5 w-32 animate-pulse rounded ${themeClasses.bg.hover} mx-auto`} />
        <div className={`h-4 w-48 animate-pulse rounded ${themeClasses.bg.subtle} mx-auto`} />
      </div>
      <div className={`h-9 w-32 animate-pulse rounded-xl ${themeClasses.bg.hover}`} />
    </div>
  );
}