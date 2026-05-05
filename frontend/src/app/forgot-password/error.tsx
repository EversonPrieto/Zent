'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export default function ForgotPasswordError({
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
      <div className={`w-full max-w-md rounded-lg shadow-lg p-8 ${themeClasses.bg.secondary} border ${themeClasses.border.primary}`}>
        <div className="flex justify-center mb-6">
          <AlertTriangle className="w-16 h-16 text-red-500" />
        </div>
        <h1 className={`text-2xl font-bold text-center mb-4 ${themeClasses.text.primary}`}>
          Algo deu errado
        </h1>
        <p className={`text-center mb-8 ${themeClasses.text.tertiary}`}>
          Ocorreu um erro ao carregar a página. Tente novamente.
        </p>
        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Tentar Novamente
          </button>
          <Link
            href="/login"
            className={`w-full inline-flex items-center justify-center px-6 py-3 font-semibold rounded-lg transition ${themeClasses.bg.tertiary} hover:brightness-110 ${themeClasses.text.primary}`}
          >
            Voltar para Login
          </Link>
        </div>
      </div>
    </div>
  );
}
