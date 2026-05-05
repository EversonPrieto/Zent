'use client';

import { useTheme } from '../../../hooks/useTheme';

export default function ProfileErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { themeClasses } = useTheme();
  
  return (
    <main className={`min-h-screen pt-20 px-4 flex items-center justify-center ${themeClasses.bg.primary}`}>
      <div className="text-center">
        <h2 className={`text-2xl font-bold mb-4 ${themeClasses.text.primary}`}>Oops! Erro no Perfil</h2>
        <p className={`mb-6 ${themeClasses.text.tertiary}`}>{error.message}</p>
        <button
          onClick={() => reset()}
          className="px-6 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white font-medium transition-all"
        >
          Tentar Novamente
        </button>
      </div>
    </main>
  );
}
