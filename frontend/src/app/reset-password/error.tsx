'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export default function ResetPasswordError({
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
    <div className={`min-h-screen flex items-center justify-center p-4 ${themeClasses.bg.primary}`}>
      <div className={`w-full max-w-md ${themeClasses.bg.primary} rounded-lg shadow-lg p-8 ${themeClasses.border.primary}`}>
        <div className="flex justify-center mb-6">
          <AlertTriangle className="w-16 h-16 text-red-500" />
        </div>
        <h1 className={`text-2xl font-bold text-center mb-4 ${themeClasses.text.primary}`}>
          Algo deu errado
        </h1>
        <p className={`text-center mb-8 ${themeClasses.text.tertiary}`}>
          Ocorreu um erro ao carregar a página. Tente novamente ou solicite um novo link de recuperação.
        </p>
        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Tentar Novamente
          </button>
          <Link
            href="/forgot-password"
            className={`w-full inline-flex items-center justify-center px-6 py-3 font-semibold rounded-lg transition ${themeClasses.bg.tertiary} ${themeClasses.text.primary}`}
          >
            Solicitar Novo Link
          </Link>
        </div>
      </div>
    </div>
  );
}
