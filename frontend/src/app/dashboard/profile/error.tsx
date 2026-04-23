'use client';

export default function ProfileErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-900 pt-20 px-4 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Oops! Erro no Perfil</h2>
        <p className="text-zinc-400 mb-6">{error.message}</p>
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
