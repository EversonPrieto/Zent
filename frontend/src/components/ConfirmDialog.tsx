'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Trash2,
  X,
} from 'lucide-react';

import { useTheme } from '../hooks/useTheme';

type ConfirmAction = 'delete' | 'warning' | 'confirm';

type ConfirmOptions = {
  title: string;
  message: string;
  action?: ConfirmAction;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
};

type Resolver = (value: boolean) => void;

let confirmHandler:
  | ((options: ConfirmOptions) => Promise<boolean>)
  | null = null;

export function showConfirm(
  options: ConfirmOptions,
): Promise<boolean> {
  if (confirmHandler) {
    return confirmHandler(options);
  }

  const fallbackMessage = `${options.title}\n\n${options.message}`;

  return Promise.resolve(
    window.confirm(fallbackMessage),
  );
}

export default function ConfirmDialog() {
  const { themeClasses } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [options, setOptions] =
    useState<ConfirmOptions | null>(null);

  const resolverRef = useRef<Resolver | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    confirmHandler = (
      nextOptions: ConfirmOptions,
    ) => {
      setOptions(nextOptions);

      return new Promise<boolean>((resolve) => {
        resolverRef.current = resolve;
      });
    };

    return () => {
      confirmHandler = null;
    };
  }, []);

  useEffect(() => {
    if (!options) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        close(false);
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      );
    };
  }, [options]);

  function close(value: boolean) {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setOptions(null);
  }

  if (!mounted || !options) {
    return null;
  }

  const isDangerous =
    options.isDangerous ||
    options.action === 'delete';

  const Icon = isDangerous
    ? Trash2
    : options.action === 'warning'
      ? AlertTriangle
      : CheckCircle2;

  return createPortal(
    <div className="fixed inset-0 z-[2000] isolate flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative z-[2001] w-full max-w-md overflow-hidden rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.primary} shadow-2xl shadow-black/40 animate-in zoom-in-95 slide-in-from-bottom-3 duration-200`}
      >
        <div
          className={`border-b ${themeClasses.border.primary} px-5 py-4`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${
                  isDangerous
                    ? 'bg-red-500/10 text-red-400'
                    : 'bg-violet-500/10 text-violet-400'
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <h2
                  className={`text-base font-bold ${themeClasses.text.primary}`}
                >
                  {options.title}
                </h2>

                <p
                  className={`mt-0.5 text-xs ${themeClasses.text.tertiary}`}
                >
                  Confirme para continuar
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => close(false)}
              className={`rounded-lg p-2 ${themeClasses.text.tertiary} transition-all hover:bg-violet-500/10 hover:text-violet-400`}
              aria-label="Fechar confirmação"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="px-5 py-5">
          <p
            className={`whitespace-pre-line text-sm leading-relaxed ${themeClasses.text.secondary}`}
          >
            {options.message}
          </p>
        </div>

        <div
          className={`flex flex-col-reverse gap-2 border-t ${themeClasses.border.primary} px-5 py-4 sm:flex-row sm:justify-end`}
        >
          <button
            type="button"
            onClick={() => close(false)}
            className={`inline-flex items-center justify-center rounded-xl border ${themeClasses.border.primary} px-4 py-2.5 text-sm font-semibold ${themeClasses.text.secondary} transition-all hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-400`}
          >
            {options.cancelLabel || 'Cancelar'}
          </button>

          <button
            type="button"
            onClick={() => close(true)}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all active:scale-[0.98] ${
              isDangerous
                ? 'bg-red-500 shadow-red-500/20 hover:bg-red-600 hover:shadow-red-500/30'
                : 'bg-gradient-to-r from-violet-500 to-indigo-500 shadow-violet-500/20 hover:shadow-violet-500/30'
            }`}
          >
            <Icon className="h-4 w-4" />

            {options.confirmLabel || 'Confirmar'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}