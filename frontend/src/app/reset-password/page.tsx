'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTheme } from '../../hooks/useTheme';
import { ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { themeClasses } = useTheme();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não correspondem');
      return;
    }

    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres');
      return;
    }

    setLoading(true);

    try {
      await api('/auth/reset-password', {
        method: 'PATCH',
        body: {
          token,
          newPassword: password,
        },
      });

      setSuccess(true);
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Erro ao redefinir senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <main className={`min-h-screen overflow-x-hidden ${themeClasses.bg.primary}`}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-violet-500/30 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
        </div>

        <div className="relative z-10 flex min-h-screen items-center justify-center px-3 py-8 sm:px-4">
          <div
            className={`w-full max-w-md rounded-3xl border ${themeClasses.border.primary} ${themeClasses.bg.primary} p-5 shadow-2xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500 sm:p-8`}
          >
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-amber-500/10 p-4">
                <AlertCircle className="h-12 w-12 text-amber-400 sm:h-16 sm:w-16" />
              </div>
            </div>

            <h1 className="mb-4 bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-center text-2xl font-bold text-transparent sm:text-3xl">
              Link inválido
            </h1>

            <p className={`mb-8 text-center text-sm leading-relaxed sm:text-base ${themeClasses.text.tertiary}`}>
              O link de recuperação está faltando ou expirou. Solicite um novo link.
            </p>

            <Link
              href="/forgot-password"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:shadow-violet-500/40 sm:hover:scale-[1.02]"
            >
              Solicitar novo link
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className={`min-h-screen overflow-x-hidden ${themeClasses.bg.primary}`}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-violet-500/30 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
        </div>

        <div className="relative z-10 flex min-h-screen items-center justify-center px-3 py-8 sm:px-4">
          <div
            className={`w-full max-w-md rounded-3xl border ${themeClasses.border.primary} ${themeClasses.bg.primary} p-5 shadow-2xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500 sm:p-8`}
          >
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-emerald-500/10 p-4">
                <CheckCircle className="h-12 w-12 text-emerald-400 sm:h-16 sm:w-16" />
              </div>
            </div>

            <h1 className="mb-4 bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-center text-2xl font-bold text-transparent sm:text-3xl">
              Senha redefinida!
            </h1>

            <p className={`mb-8 text-center text-sm leading-relaxed sm:text-base ${themeClasses.text.tertiary}`}>
              Sua senha foi redefinida com sucesso. Você pode fazer login com sua nova senha agora.
            </p>

            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:shadow-violet-500/40 sm:hover:scale-[1.02]"
            >
              <ArrowLeft className="h-4 w-4" />
              Ir para login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`min-h-screen overflow-x-hidden ${themeClasses.bg.primary}`}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-3 py-8 sm:px-4">
        <div
          className={`w-full max-w-md rounded-3xl border ${themeClasses.border.primary} ${themeClasses.bg.primary} p-5 shadow-2xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500 sm:p-8`}
        >
          <Link
            href="/login"
            className={`mb-6 inline-flex items-center gap-2 text-sm ${themeClasses.text.tertiary} transition hover:text-violet-400`}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>

          <div className="mb-6">
            <h1 className="mb-2 bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
              Redefinir senha
            </h1>

            <p className={`text-sm leading-relaxed sm:text-base ${themeClasses.text.tertiary}`}>
              Digite sua nova senha abaixo.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
              <p className="break-words text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className={`mb-2 block text-sm font-medium ${themeClasses.text.secondary}`}
              >
                Nova senha
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className={`w-full rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-4 py-3 pr-10 text-sm ${themeClasses.text.primary} outline-none transition-all placeholder:text-zinc-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 sm:py-2.5`}
                  disabled={loading}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${themeClasses.text.tertiary} transition hover:text-violet-400 disabled:opacity-50`}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <p className={`mt-1 text-xs ${themeClasses.text.muted}`}>
                Mínimo 8 caracteres
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className={`mb-2 block text-sm font-medium ${themeClasses.text.secondary}`}
              >
                Confirmar senha
              </label>

              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className={`w-full rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-4 py-3 pr-10 text-sm ${themeClasses.text.primary} outline-none transition-all placeholder:text-zinc-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 sm:py-2.5`}
                  disabled={loading}
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${themeClasses.text.tertiary} transition hover:text-violet-400 disabled:opacity-50`}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-3 font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50 sm:hover:scale-[1.02] disabled:sm:hover:scale-100"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Redefinindo...
                  </>
                ) : (
                  'Redefinir senha'
                )}
              </span>
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950">
          <div className="text-zinc-400">Carregando...</div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
