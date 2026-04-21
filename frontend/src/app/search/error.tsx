'use client';

import { useEffect } from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';

export default function SearchErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Erro na Busca</h1>
        <p className="text-zinc-400 mb-6">{error.message || 'Ocorreu um erro inesperado'}</p>
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
