'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useTheme } from '../../hooks/useTheme';
import { ArrowLeft, CheckCircle, AlertCircle, Loader2, Mail } from 'lucide-react';
import { api } from '../../lib/api';

export default function ForgotPasswordPage() {
  const { themeClasses } = useTheme();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api('/auth/forgot-password', {
        method: 'POST',
        body: { email },
      });

      setSuccess(true);
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar link de recuperação');
    } finally {
      setLoading(false);
    }
  };

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
              Email enviado!
            </h1>

            <p className={`mb-4 text-center text-sm leading-relaxed sm:text-base ${themeClasses.text.tertiary}`}>
              Se uma conta com esse email existir, você receberá um link de recuperação em poucos minutos.
            </p>

            <p className={`mb-8 text-center text-sm leading-relaxed ${themeClasses.text.muted}`}>
              Verifique sua pasta de spam caso não receba o email.
            </p>

            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:shadow-violet-500/40 sm:hover:scale-[1.02]"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para login
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
              Recuperar senha
            </h1>

            <p className={`text-sm leading-relaxed sm:text-base ${themeClasses.text.tertiary}`}>
              Digite seu email e enviaremos um link para redefinir sua senha.
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
                htmlFor="email"
                className={`mb-2 flex items-center gap-2 text-sm font-medium ${themeClasses.text.secondary}`}
              >
                <Mail className="h-4 w-4 text-violet-400" />
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@example.com"
                required
                className={`w-full rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-4 py-3 text-sm ${themeClasses.text.primary} outline-none transition-all placeholder:text-zinc-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 sm:py-2.5`}
                disabled={loading}
              />
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
                    Enviando...
                  </>
                ) : (
                  'Enviar link de recuperação'
                )}
              </span>
            </button>
          </form>

          <p className={`mt-6 text-center text-sm ${themeClasses.text.tertiary}`}>
            Lembrou sua senha?{' '}
            <Link
              href="/login"
              className="font-medium text-violet-400 transition-colors hover:text-violet-300 hover:underline"
            >
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
