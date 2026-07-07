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
  Zap,
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
    <main className={`relative min-h-screen overflow-x-hidden ${themeClasses.bg.primary}`}>
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-violet-500/12 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-indigo-500/12 blur-[100px]" />
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/8 blur-[100px]" />
      </div>

      {/* Back Button */}
      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 pt-5 sm:px-6 sm:pt-6 lg:px-8">
        <button
          type="button"
          onClick={handleBack}
          className={`group inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${themeClasses.bg.subtle} ${themeClasses.border.primary} ${themeClasses.text.secondary} hover:border-violet-500/30 hover:text-violet-400 hover:shadow-md`}
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
          <span>Voltar</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className={`grid w-full max-w-5xl overflow-hidden rounded-3xl border ${themeClasses.border.primary} ${themeClasses.bg.primary} shadow-2xl shadow-black/10 animate-in fade-in zoom-in-95 duration-500 lg:grid-cols-2`}>
          {/* Left Panel - Info */}
          <div className={`hidden border-r ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-8 lg:flex lg:flex-col lg:justify-center lg:p-12`}>
            <div className="mb-8 flex items-center gap-3">
              <div className="rounded-xl bg-violet-500/10 p-2">
                <img src="/logo.png" alt="Zent" className="h-8 w-8 rounded-lg" />
              </div>
              <div>
                <span className={`text-xl font-bold tracking-tight ${themeClasses.text.primary}`}>
                  Zent
                </span>
                <p className={`text-xs ${themeClasses.text.tertiary}`}>Gestão para times modernos</p>
              </div>
            </div>

            <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
                Bem-vindo de volta
              </span>
            </h1>

            <p className={`mt-4 text-sm leading-relaxed sm:text-base ${themeClasses.text.tertiary}`}>
              Acesse sua workspace e continue organizando seus projetos com mais produtividade e clareza.
            </p>

            {inviteToken && (
              <div className="mt-6 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
                <div className="mb-2 flex items-center gap-2.5">
                  <div className="rounded-lg bg-violet-500/10 p-1.5">
                    <Sparkles className="h-4 w-4 text-violet-400" />
                  </div>
                  <span className="text-sm font-semibold text-violet-400">
                    Convite pendente!
                  </span>
                </div>
                <p className={`text-xs leading-relaxed ${themeClasses.text.tertiary}`}>
                  Você foi convidado para uma workspace. Após o login, será automaticamente adicionado.
                </p>
              </div>
            )}

            <div className="mt-10 space-y-4">
              {[
                { icon: Users, text: 'Gerencie múltiplas workspaces', desc: 'Ambientes isolados para cada time' },
                { icon: LayoutDashboard, text: 'Organize projetos em Kanban', desc: 'Drag and drop intuitivo' },
                { icon: Shield, text: 'Controle de permissões por função', desc: 'Owner, Admin, Member e Viewer' },
              ].map((item, idx) => {
                const Icon = item.icon;

                return (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-white/5">
                      <Icon className="h-4 w-4 text-violet-400" />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${themeClasses.text.primary}`}>
                        {item.text}
                      </p>
                      <p className={`mt-0.5 text-xs ${themeClasses.text.tertiary}`}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="min-w-0 p-6 sm:p-8 lg:p-12">
            {/* Mobile Logo - alinhado à esquerda */}
            <div className="mb-6 flex justify-start lg:hidden">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-violet-500/10 p-2">
                  <img src="/logo.png" alt="Zent" className="h-8 w-8 rounded-lg" />
                </div>
                <div>
                  <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-xl font-bold text-transparent">
                    Zent
                  </span>
                  <p className={`text-xs ${themeClasses.text.tertiary}`}>Gestão para times modernos</p>
                </div>
              </div>
            </div>

            {/* Title - alinhado à esquerda */}
            <div className="mb-6 text-left">
              <h2 className={`text-2xl font-bold tracking-tight sm:text-3xl ${themeClasses.text.primary}`}>
                Entrar na conta
              </h2>
              <p className={`mt-2 text-sm ${themeClasses.text.tertiary}`}>
                Acesse sua conta e workspace
              </p>
            </div>

            {/* Invite Banner Mobile */}
            {inviteToken && (
              <div className="mb-5 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 lg:hidden">
                <div className="mb-1.5 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                  <span className="text-sm font-semibold text-violet-400">
                    Convite pendente
                  </span>
                </div>
                <p className={`text-xs leading-relaxed ${themeClasses.text.tertiary}`}>
                  Entre para aceitar automaticamente o convite da workspace.
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className={`mb-2 flex items-center gap-2 text-sm font-semibold ${themeClasses.text.secondary}`}>
                  <Mail className="h-4 w-4 text-violet-400" />
                  Email
                </label>
                <input
                  className={`w-full rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-4 py-3 text-sm ${themeClasses.text.primary} outline-none transition-all duration-200 placeholder:text-zinc-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20`}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@email.com"
                  autoFocus
                />
              </div>

              {/* Password */}
              <div>
                <label className={`mb-2 flex items-center gap-2 text-sm font-semibold ${themeClasses.text.secondary}`}>
                  <Lock className="h-4 w-4 text-violet-400" />
                  Senha
                </label>
                <div className="relative">
                  <input
                    className={`w-full rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-4 py-3 pr-11 text-sm ${themeClasses.text.primary} outline-none transition-all duration-200 placeholder:text-zinc-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20`}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 ${themeClasses.text.tertiary} transition-all duration-200 hover:text-violet-400 hover:bg-violet-500/10`}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span className="break-words">{error}</span>
                </div>
              )}

              {/* Forgot Password */}
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className={`text-xs font-medium ${themeClasses.text.tertiary} transition-colors duration-200 hover:text-violet-400`}
                >
                  Esqueceu a senha?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-200 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
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
                      <LogIn className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Signup Link */}
            <div className="mt-6 text-center">
              <p className={`text-sm ${themeClasses.text.tertiary}`}>
                Não tem uma conta?{' '}
                <Link
                  href="/signup"
                  className="font-semibold text-violet-400 transition-colors duration-200 hover:text-violet-300"
                >
                  Criar conta gratuita
                </Link>
              </p>
            </div>

            {/* Mobile Features */}
            <div className="mt-6 block lg:hidden">
              <div className={`rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-4`}>
                <div className="mb-3 flex items-center gap-2">
                  <div className="rounded-lg bg-violet-500/10 p-1">
                    <Zap className="h-4 w-4 text-violet-400" />
                  </div>
                  <span className={`text-xs font-semibold ${themeClasses.text.secondary}`}>
                    Tudo que você precisa
                  </span>
                </div>
                <div className={`grid grid-cols-2 gap-2 text-xs font-medium ${themeClasses.text.tertiary}`}>
                  {['Workspaces', 'Kanban', 'Comentários', 'Permissões'].map((item) => (
                    <div key={item} className="flex min-w-0 items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald-400" />
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