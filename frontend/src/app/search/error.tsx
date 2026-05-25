'use client';

import { useEffect } from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export default function SearchErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { themeClasses } = useTheme();
  
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className={`min-h-screen flex items-center justify-center px-4 ${themeClasses.bg.primary}`}>
      <div className={`max-w-md w-full rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center ${themeClasses.border.primary}`}>
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h1 className={`text-2xl font-bold mb-2 ${themeClasses.text.primary}`}>Erro na Busca</h1>
        <p className={`mb-6 ${themeClasses.text.tertiary}`}>{error.message || 'Ocorreu um erro inesperado'}</p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2 font-medium text-white hover:scale-105 transition-transform"
        >
          <RotateCw className="h-4 w-4" />
          Tentar Novamente
        </button>
      </div>
    </main>
  );
}
