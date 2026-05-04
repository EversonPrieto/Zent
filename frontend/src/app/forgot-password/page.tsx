'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '../../hooks/useTheme';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';

export default function ForgotPasswordPage() {
  const { themeClasses } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900 p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-500/30 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
        </div>

        <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 shadow-2xl backdrop-blur-sm p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-16 h-16 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent mb-4">
            Email Enviado!
          </h1>
          <p className="text-zinc-400 text-center mb-6">
            Se uma conta com esse email existir, você receberá um link de recuperação em poucos minutos.
          </p>
          <p className="text-sm text-zinc-500 text-center mb-8">
            Verifique sua pasta de spam caso não receba o email.
          </p>
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-semibold rounded-xl hover:scale-105 transition shadow-lg shadow-violet-500/25"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 shadow-2xl backdrop-blur-sm p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-violet-400 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent mb-2">
          Recuperar Senha
        </h1>
        <p className="text-zinc-400 mb-6">
          Digite seu email e enviaremos um link para redefinir sua senha.
        </p>

        {error && (
          <div className="flex gap-3 mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@example.com"
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-zinc-500 outline-none transition-all focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-3 font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            <span className="relative z-10">
              {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
            </span>
          </button>
        </form>

        <p className="text-center text-zinc-400 text-sm mt-6">
          Lembrou sua senha?{' '}
          <Link href="/login" className="text-violet-400 hover:underline font-medium transition-colors hover:text-violet-300">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}
