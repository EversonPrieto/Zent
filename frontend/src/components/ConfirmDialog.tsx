'use client';

import { useEffect, useState } from 'react';

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

// Componente ConfirmDialog
export default function ConfirmDialog() {
  const [state, setState] = useState<ConfirmDialogState | null>(null);

  useEffect(() => {
    const unsubscribe = onConfirmDialog((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, []);

  if (!state) return null;

  const getIcon = (action: ConfirmAction) => {
    switch (action) {
      case 'delete':
        return '🗑️';
      case 'remove':
        return '👋';
      case 'leave':
        return '🚪';
      case 'archive':
        return '📦';
      default:
        return '⚠️';
    }
  };

  const getButtonColor = (isDangerous?: boolean) => {
    if (isDangerous) {
      return 'bg-red-600 hover:bg-red-700';
    }
    return 'bg-blue-600 hover:bg-blue-700';
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-white shadow-2xl">
        {/* Header com ícone */}
        <div className="mb-4 flex items-center gap-3">
          <span className="text-3xl">{getIcon(state.action)}</span>
          <h2 className="text-lg font-bold">{state.title}</h2>
        </div>

        {/* Mensagem */}
        <p className="mb-6 text-sm text-zinc-300">{state.message}</p>

        {/* Botões */}
        <div className="flex gap-3">
          <button
            onClick={state.onCancel}
            className="flex-1 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={state.onConfirm}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${getButtonColor(state.isDangerous)}`}
          >
            {state.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
