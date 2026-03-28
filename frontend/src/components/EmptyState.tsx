'use client';

import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  size?: 'sm' | 'md' | 'lg';
}

const iconSizes = {
  sm: 'text-3xl',
  md: 'text-5xl',
  lg: 'text-6xl',
};

const containerSizes = {
  sm: 'py-4',
  md: 'py-8',
  lg: 'py-12',
};

const titleSizes = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

const descriptionSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  size = 'md',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-zinc-700 bg-zinc-950/50 px-4 text-center ${containerSizes[size]}`}>
      <div className={iconSizes[size]}>{icon}</div>
      <div>
        <h3 className={`font-semibold text-zinc-300 ${titleSizes[size]}`}>
          {title}
        </h3>
        {description && (
          <p className={`mt-1 text-zinc-500 ${descriptionSizes[size]}`}>
            {description}
          </p>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Variações pré-configuradas
export function EmptyMembers({ onInvite }: { onInvite?: () => void }) {
  return (
    <EmptyState
      icon="👥"
      title="Nenhum membro ainda"
      description="Convide pessoas para começar a colaborar neste workspace"
      action={onInvite ? { label: 'Convidar membro', onClick: onInvite } : undefined}
      size="md"
    />
  );
}

export function EmptyProjects({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon="📁"
      title="Nenhum projeto criado"
      description="Crie seu primeiro projeto para começar a gerenciar tarefas"
      action={onCreate ? { label: 'Criar projeto', onClick: onCreate } : undefined}
      size="md"
    />
  );
}

export function EmptyTasks({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon="✓"
      title="Nenhuma tarefa"
      description="Crie uma tarefa para começar a gerenciar seu trabalho"
      action={onCreate ? { label: 'Criar tarefa', onClick: onCreate } : undefined}
      size="md"
    />
  );
}

export function EmptyComments() {
  return (
    <EmptyState
      icon="💬"
      title="Sem comentários"
      description="Seja o primeiro a comentar"
      size="sm"
    />
  );
}

export function EmptySearch() {
  return (
    <EmptyState
      icon="🔍"
      title="Nenhum resultado"
      description="Tente ajustar seus filtros ou termos de busca"
      size="md"
    />
  );
}
