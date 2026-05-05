'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../../../hooks/useTheme';

export default function ProjectBoardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const { themeClasses } = useTheme();

  useEffect(() => {
    console.error('Project board error:', error);
  }, [error]);

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${themeClasses.bg.primary}`}>
      <div className="w-full max-w-md">
        <div className={`rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center backdrop-blur-sm ${themeClasses.border.primary}`}>
          <div className="inline-flex items-center justify-center rounded-full bg-red-500/20 p-3 mb-4">
            <AlertCircle className="h-6 w-6 text-red-400" />
          </div>
          <h2 className={`text-xl font-bold mb-2 ${themeClasses.text.primary}`}>Erro ao carregar board</h2>
          <p className={`text-sm mb-6 ${themeClasses.text.tertiary}`}>
            {error.message || 'Erro ao carregar o board do projeto'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-500/20 px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-500/30 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
            <button
              onClick={reset}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/30 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
