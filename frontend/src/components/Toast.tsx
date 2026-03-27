'use client';

import { useEffect, useState } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

type ToastMessage = {
  id: string;
  message: string;
  type: ToastType;
  action?: {
    label: string;
    onClick: () => void | Promise<void>;
  };
};

let toastId = 0;
const toastCallbacks: ((message: ToastMessage) => void)[] = [];

export function showToast(
  message: string,
  type: ToastType = 'info',
  duration: number = 3000,
  action?: { label: string; onClick: () => void | Promise<void> }
) {
  const id = String(toastId++);
  const toast: ToastMessage = { id, message, type, action };

  console.log('🍞 Toast.showToast() chamado:', { message, type, id });
  console.log('📢 Callbacks registrados:', toastCallbacks.length);

  toastCallbacks.forEach((callback) => {
    console.log('📤 Chamando callback para toast:', id);
    callback(toast);
  });

  if (duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }
}

export function removeToast(id: string) {
  // Aqui você pode implementar a remoção se necessário
}

export function onToastShow(callback: (message: ToastMessage) => void) {
  toastCallbacks.push(callback);
  return () => {
    const index = toastCallbacks.indexOf(callback);
    if (index > -1) toastCallbacks.splice(index, 1);
  };
}

export default function Toast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    console.log('🍞 Toast component montado');

    const unsubscribe = onToastShow((toast) => {
      console.log('📨 Toast recebido no component:', toast);
      setToasts((prev) => {
        const updated = [...prev, toast];
        console.log('🎂 Toasts atualizados:', updated.length);
        return updated;
      });

      // Remover após 3 segundos
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 3000);
    });

    return () => {
      console.log('🍞 Toast component desmontado');
      unsubscribe();
    };
  }, []);

  const getColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'border-green-900 bg-green-900/20 text-green-400';
      case 'error':
        return 'border-red-900 bg-red-900/20 text-red-400';
      case 'warning':
        return 'border-yellow-900 bg-yellow-900/20 text-yellow-400';
      case 'info':
      default:
        return 'border-blue-900 bg-blue-900/20 text-blue-400';
    }
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] space-y-2 pointer-events-auto">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            rounded-lg border px-4 py-3 text-sm font-medium
            animate-in fade-in slide-in-from-right-4 duration-300
            ${getColor(toast.type)}
          `}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getIcon(toast.type)}</span>
              <span>{toast.message}</span>
            </div>
            {toast.action && (
              <button
                onClick={toast.action.onClick}
                className="whitespace-nowrap rounded px-2 py-1 text-xs font-semibold hover:opacity-80 transition-opacity bg-white/10 hover:bg-white/20"
              >
                {toast.action.label}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
