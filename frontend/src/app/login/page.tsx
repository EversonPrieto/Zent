'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../lib/api';
import { refreshSocketAuth } from '../../lib/socket';
import { useTheme } from '../../hooks/useTheme';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Sparkles,
  Shield,
  Users,
  LayoutDashboard,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { themeClasses } = useTheme();

  const inviteToken = searchParams.get('inviteToken');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message = Array.isArray(data?.message)
          ? data.message.join(', ')
          : data?.message || 'Falha no login';

        throw new Error(message);
      }

      localStorage.setItem('zent_token', data.accessToken);
      refreshSocketAuth();
      localStorage.setItem('zent_user', JSON.stringify(data.user));

      if (inviteToken) {
        await api(`/invites/${inviteToken}/accept`, {
          method: 'POST',
        });
      }

      const workspaces = await api('/workspaces');

      if (workspaces.length > 0) {
        localStorage.setItem('zent_workspace_id', workspaces[0].id);
        localStorage.setItem('zent_workspace', JSON.stringify(workspaces[0]));
        router.push('/dashboard/projects');
      } else {
        router.push('/onboarding/workspace');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    const token = localStorage.getItem('zent_token');

    if (!token) {
      router.push('/');
      return;
    }

    router.back();
  }

  const isFormValid = email.trim() && password.trim();

  return (
    <main className={`min-h-screen overflow-x-hidden ${themeClasses.bg.primary}`}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-5xl px-3 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <button
          type="button"
          onClick={handleBack}
          className={`group inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${themeClasses.bg.subtle} ${themeClasses.border.primary} ${themeClasses.text.secondary} hover:border-violet-500/30 hover:text-violet-400`}
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Voltar</span>
        </button>
      </div>

      <div className="relative z-10 flex min-h-[calc(100vh-64px)] items-center justify-center px-3 py-6 sm:px-4 sm:py-10">
        <div
          className={`grid w-full max-w-5xl overflow-hidden rounded-3xl border shadow-2xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500 lg:grid-cols-2 ${themeClasses.border.primary} ${themeClasses.bg.primary}`}
        >
          <div
            className={`hidden border-r p-8 lg:block lg:p-10 ${themeClasses.border.primary} ${themeClasses.bg.primary}`}
          >
            <div className="mb-6 flex items-center gap-2">
              <img src="/logo.png" alt="Zent" className="h-8 w-8 rounded-lg" />
              <span className={`text-xl font-bold ${themeClasses.text.primary}`}>
                Zent
              </span>
            </div>

            <h1 className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-3xl font-bold text-transparent">
              Bem-vindo de volta
            </h1>

            <p className={`mt-4 leading-relaxed ${themeClasses.text.tertiary}`}>
              Acesse sua workspace e continue organizando seus projetos com mais produtividade e clareza.
            </p>

            {inviteToken && (
              <div className="mt-6 rounded-xl border border-violet-500/20 bg-violet-500/10 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                  <span className="text-sm font-medium text-violet-400">
                    Convite pendente!
                  </span>
                </div>

                <p className={`text-xs ${themeClasses.text.tertiary}`}>
                  Você foi convidado para uma workspace. Após o login, será automaticamente adicionado.
                </p>
              </div>
            )}

            <div className="mt-8 space-y-3">
              {[
                { icon: Users, text: 'Gerencie múltiplas workspaces' },
                { icon: LayoutDashboard, text: 'Organize projetos em Kanban' },
                { icon: Shield, text: 'Controle de permissões por função' },
              ].map((item, idx) => {
                const Icon = item.icon;

                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 text-sm ${themeClasses.text.tertiary}`}
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/10">
                      <Icon className="h-3.5 w-3.5 text-violet-400" />
                    </div>
                    <span>{item.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="min-w-0 p-5 sm:p-6 md:p-8 lg:p-10">
            <div className="mb-6 text-center lg:text-left">
              <div className="mb-4 flex justify-center lg:hidden">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="Zent" className="h-8 w-8 rounded-lg" />
                  <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-xl font-bold text-transparent">
                    Zent
                  </span>
                </div>
              </div>

              <h2 className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
                Entrar
              </h2>

              <p className={`mt-2 text-sm ${themeClasses.text.tertiary}`}>
                Acesse sua conta e workspace
              </p>
            </div>

            {inviteToken && (
              <div className="mb-5 rounded-xl border border-violet-500/20 bg-violet-500/10 p-3 lg:hidden">
                <div className="mb-1 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                  <span className="text-sm font-medium text-violet-400">
                    Convite pendente
                  </span>
                </div>

                <p className={`text-xs leading-relaxed ${themeClasses.text.tertiary}`}>
                  Entre para aceitar automaticamente o convite da workspace.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  className={`mb-2 flex items-center gap-2 text-sm font-medium ${themeClasses.text.secondary}`}
                >
                  <Mail className="h-4 w-4 text-violet-400" />
                  Email
                </label>

                <input
                  className={`w-full rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-4 py-3 text-sm ${themeClasses.text.primary} outline-none transition-all placeholder:text-zinc-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 sm:py-2.5`}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@email.com"
                  autoFocus
                />
              </div>

              <div>
                <label
                  className={`mb-2 flex items-center gap-2 text-sm font-medium ${themeClasses.text.secondary}`}
                >
                  <Lock className="h-4 w-4 text-violet-400" />
                  Senha
                </label>

                <div className="relative">
                  <input
                    className={`w-full rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-4 py-3 pr-10 text-sm ${themeClasses.text.primary} outline-none transition-all placeholder:text-zinc-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 sm:py-2.5`}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${themeClasses.text.tertiary} transition-colors hover:text-violet-400`}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span className="break-words">{error}</span>
                </div>
              )}

              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className={`text-xs ${themeClasses.text.tertiary} transition-colors hover:text-violet-400`}
                >
                  Esqueceu a senha?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-3 font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50 sm:hover:scale-[1.02] disabled:sm:hover:scale-100"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      Entrar
                      <LogIn className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </span>
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className={`text-sm ${themeClasses.text.tertiary}`}>
                Não tem uma conta?{' '}
                <Link
                  href="/signup"
                  className="font-medium text-violet-400 transition-colors hover:text-violet-300 hover:underline"
                >
                  Criar conta gratuita
                </Link>
              </p>
            </div>

            <div className="mt-6 block lg:hidden">
              <div
                className={`rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-4`}
              >
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                  <span className={`text-xs font-medium ${themeClasses.text.tertiary}`}>
                    Grátis por 14 dias
                  </span>
                </div>

                <div className={`grid grid-cols-2 gap-2 text-xs ${themeClasses.text.muted}`}>
                  {['Workspaces', 'Kanban', 'Comentários', 'Permissões'].map((item) => (
                    <div key={item} className="flex min-w-0 items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 flex-shrink-0 text-emerald-400" />
                      <span className="truncate">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <LoginContent />
    </Suspense>
  );
}
