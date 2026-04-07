'use client';

import { useEffect, useState } from 'react';
import {
  Trash2,
  UserMinus,
  LogOut,
  Archive,
  AlertTriangle,
  X,
  CheckCircle2,
  Loader2
} from 'lucide-react';

export type ConfirmAction = 'delete' | 'remove' | 'leave' | 'archive' | 'custom';

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  action: ConfirmAction;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
  isLoading?: boolean;
}

// Gerenciador global de confirm dialog
let confirmState: ConfirmDialogState | null = null;
const confirmCallbacks: ((state: ConfirmDialogState | null) => void)[] = [];

export function onConfirmDialog(callback: (state: ConfirmDialogState | null) => void) {
  confirmCallbacks.push(callback);
  return () => {
    const index = confirmCallbacks.indexOf(callback);
    if (index > -1) confirmCallbacks.splice(index, 1);
  };
}

function notifyConfirmDialog(state: ConfirmDialogState | null) {
  confirmState = state;
  confirmCallbacks.forEach((cb) => cb(state));
}

// Helper para mostrar confirm dialog
export async function showConfirm(options: {
  title: string;
  message: string;
  action?: ConfirmAction;
  confirmLabel?: string;
  isDangerous?: boolean;
}): Promise<boolean> {
  return new Promise((resolve) => {
    notifyConfirmDialog({
      isOpen: true,
      title: options.title,
      message: options.message,
      action: options.action || 'custom',
      confirmLabel: options.confirmLabel || 'Confirmar',
      isDangerous: options.isDangerous ?? true,
      isLoading: false,
      onConfirm: () => {
        notifyConfirmDialog(null);
        resolve(true);
      },
      onCancel: () => {
        notifyConfirmDialog(null);
        resolve(false);
      },
    });
  });
}

const actionConfig = {
  delete: {
    icon: Trash2,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    glow: 'shadow-red-500/25',
    label: 'Deletar'
  },
  remove: {
    icon: UserMinus,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    glow: 'shadow-orange-500/25',
    label: 'Remover'
  },
  leave: {
    icon: LogOut,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    glow: 'shadow-amber-500/25',
    label: 'Sair'
  },
  archive: {
    icon: Archive,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    glow: 'shadow-blue-500/25',
    label: 'Arquivar'
  },
  custom: {
    icon: AlertTriangle,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    glow: 'shadow-violet-500/25',
    label: 'Confirmar'
  },
};

// Componente ConfirmDialog
export default function ConfirmDialog() {
  const [state, setState] = useState<ConfirmDialogState | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const unsubscribe = onConfirmDialog((newState) => {
      if (newState) {
        setIsClosing(false);
        setState(newState);
      } else {
        setIsClosing(true);
        setTimeout(() => setState(null), 200);
      }
    });

    return unsubscribe;
  }, []);

  if (!state) return null;

  const config = actionConfig[state.action];
  const Icon = config.icon;

  const handleConfirm = () => {
    setIsClosing(true);
    setTimeout(() => {
      state.onConfirm();
    }, 150);
  };

  const handleCancel = () => {
    setIsClosing(true);
    setTimeout(() => {
      state.onCancel();
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 shadow-2xl transition-all duration-200 ${
          isClosing ? 'animate-out fade-out slide-out-to-bottom-4 scale-95' : 'animate-in slide-in-from-bottom-4 fade-in duration-300'
        }`}
      >
        {/* Header with gradient */}
        <div className={`border-b border-white/10 bg-gradient-to-r from-zinc-900 to-zinc-950 p-6 ${config.bg}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg ${config.bg} p-2`}>
                <Icon className={`h-6 w-6 ${config.color}`} />
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                  {state.title}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  {state.message}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning message for dangerous actions */}
          {state.isDangerous && (
            <div className={`mb-6 rounded-lg border ${config.border} ${config.bg} p-3`}>
              <div className="flex items-start gap-2">
                <AlertTriangle className={`h-4 w-4 ${config.color} mt-0.5 flex-shrink-0`} />
                <p className="text-xs text-zinc-400">
                  Esta ação não pode ser desfeita. Tenha certeza antes de continuar.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={state.isLoading}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={state.isLoading}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 ${
                state.isDangerous
                  ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/25 hover:shadow-red-500/40'
                  : 'bg-gradient-to-r from-violet-500 to-indigo-500 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40'
              }`}
            >
              {state.isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processando...
                </div>
              ) : (
                state.confirmLabel
              )}
            </button>
          </div>

          {/* Keyboard hint */}
          <div className="mt-4 flex justify-center gap-3 text-center text-xs text-zinc-600">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px]">Enter</kbd>
              <span>para confirmar</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px]">Esc</kbd>
              <span>para cancelar</span>
            </span>
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('keydown', function(e) {
              if (e.key === 'Escape') {
                const confirmButton = document.querySelector('[data-confirm-cancel]');
                if (confirmButton) confirmButton.click();
              }
              if (e.key === 'Enter') {
                const confirmButton = document.querySelector('[data-confirm-confirm]');
                if (confirmButton) confirmButton.click();
              }
            });
          `,
        }}
      />
    </div>
  );
}