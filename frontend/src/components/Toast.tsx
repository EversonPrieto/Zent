'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X
} from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

type ToastMessage = {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
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
  duration: number = 4000,
  action?: { label: string; onClick: () => void | Promise<void> }
) {
  const id = String(toastId++);
  const toast: ToastMessage = { id, message, type, duration, action };

  console.log('🍞 Toast.showToast() chamado:', { message, type, id });
  console.log('📢 Callbacks registrados:', toastCallbacks.length);

  toastCallbacks.forEach((callback) => {
    console.log('📤 Chamando callback para toast:', id);
    callback(toast);
  });
}

export function onToastShow(callback: (message: ToastMessage) => void) {
  toastCallbacks.push(callback);
  return () => {
    const index = toastCallbacks.indexOf(callback);
    if (index > -1) toastCallbacks.splice(index, 1);
  };
}

const toastConfig = {
  success: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    glow: 'shadow-emerald-500/20'
  },
  error: {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    glow: 'shadow-red-500/20'
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    glow: 'shadow-amber-500/20'
  },
  info: {
    icon: Info,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    glow: 'shadow-blue-500/20'
  },
};

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

      // Remover após a duração especificada
      const duration = toast.duration || 4000;
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, duration);
    });

    return () => {
      console.log('🍞 Toast component desmontado');
      unsubscribe();
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[9999] space-y-3 pointer-events-auto">
      {toasts.map((toast) => {
        const config = toastConfig[toast.type];
        const Icon = config.icon;
        
        return (
          <div
            key={toast.id}
            className={`
              relative max-w-sm sm:w-96 rounded-xl border backdrop-blur-lg shadow-lg
              animate-in slide-in-from-right-4 fade-in duration-300
              ${config.border} ${config.bg} ${config.glow}
            `}
            style={{
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            <div className="flex items-start gap-3 p-4">
              {/* Icon */}
              <div className="flex-shrink-0">
                <Icon className={`h-5 w-5 ${config.color}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${config.color}`}>
                  {toast.message}
                </p>
                
                {/* Action Button */}
                {toast.action && (
                  <button
                    onClick={async () => {
                      await toast.action?.onClick();
                      removeToast(toast.id);
                    }}
                    className={`mt-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-all hover:opacity-80 ${config.bg} ${config.color}`}
                  >
                    {toast.action.label}
                  </button>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 rounded-lg p-1 text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden rounded-b-xl">
              <div
                className={`h-full rounded-full ${config.bg}`}
                style={{
                  width: '100%',
                  animation: `shrink ${(toast.duration || 4000) / 1000}s linear forwards`
                }}
              />
            </div>
          </div>
        );
      })}

      {/* Custom animations */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}