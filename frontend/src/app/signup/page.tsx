'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../hooks/useTheme';
import { refreshSocketAuth } from '../../lib/socket';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  Shield,
  Users,
  LayoutDashboard,
  MessageSquare,
  Loader2,
  ArrowLeft,
  Zap,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function validatePassword(password: string) {
  return {
    minLength: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z\d]/.test(password),
  };
}

export default function SignupPage() {
  const router = useRouter();
  const { themeClasses } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const passwordChecks = useMemo(() => validatePassword(password), [password]);

  const passwordIsValid =
    passwordChecks.minLength &&
    passwordChecks.lowercase &&
    passwordChecks.uppercase &&
    passwordChecks.number &&
    passwordChecks.symbol;

  const passwordsMatch = password === confirmPassword;
  const isFormValid =
    name.trim() && email.trim() && passwordIsValid && passwordsMatch;

  function handleBack() {
    const token = localStorage.getItem('zent_token');

    if (!token) {
      router.push('/');
      return;
    }

    router.back();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Por favor, informe seu nome.');
      return;
    }

    if (!email.trim()) {
      setError('Por favor, informe seu email.');
      return;
    }

    if (!passwordIsValid) {
      setError(
        'A senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula, número e símbolo.',
      );
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    try {
      setLoading(true);

      const signupResponse = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const signupData = await signupResponse.json().catch(() => null);

      if (!signupResponse.ok) {
        const message = Array.isArray(signupData?.message)
          ? signupData.message.join(', ')
          : signupData?.message || 'Erro ao criar conta';

        throw new Error(message);
      }

      const loginResponse = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const loginData = await loginResponse.json().catch(() => null);

      if (!loginResponse.ok) {
        const message = Array.isArray(loginData?.message)
          ? loginData.message.join(', ')
          : loginData?.message || 'Conta criada, mas falha no login automático';

        throw new Error(message);
      }

      localStorage.setItem('zent_token', loginData.accessToken);
      refreshSocketAuth();
      localStorage.setItem('zent_user', JSON.stringify(loginData.user));

      const workspaces = await fetch(`${API_URL}/workspaces`, {
        headers: {
          Authorization: `Bearer ${loginData.accessToken}`,
        },
      }).then((res) => res.json());

      if (workspaces.length > 0) {
        localStorage.setItem('zent_workspace_id', workspaces[0].id);
        localStorage.setItem('zent_workspace', JSON.stringify(workspaces[0]));
        router.push('/dashboard/projects');
      } else {
        router.push('/onboarding/workspace');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  }

  function getPasswordCheckIcon(valid: boolean) {
    return valid ? (
      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
    ) : (
      <XCircle className={`h-3.5 w-3.5 ${themeClasses.text.muted}`} />
    );
  }

  return (
    <main className={`relative min-h-screen overflow-x-hidden ${themeClasses.bg.primary}`}>
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-violet-500/12 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-indigo-500/12 blur-[100px]" />
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/8 blur-[100px]" />
      </div>

      {/* Back Button */}
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-5 sm:px-6 sm:pt-6 lg:px-8">
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
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl items-center justify-center px-4 py-8 sm:px-6 sm:py-12 md:px-6">
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
                Crie sua conta
              </span>
            </h1>

            <p className={`mt-4 text-sm leading-relaxed sm:text-base ${themeClasses.text.tertiary}`}>
              Organize projetos, acompanhe tarefas, mova cards no Kanban e centralize o trabalho do seu time em uma experiência moderna.
            </p>

            <div className="mt-10 space-y-4">
              {[
                { icon: Users, text: 'Workspaces para times e empresas', desc: 'Ambientes isolados por projeto' },
                { icon: LayoutDashboard, text: 'Projetos e tasks com board Kanban', desc: 'Drag and drop intuitivo' },
                { icon: MessageSquare, text: 'Comentários e histórico de atividade', desc: 'Contexto centralizado' },
                { icon: Shield, text: 'Permissões por função', desc: 'Owner, Admin, Member e Viewer' },
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

            <div className={`mt-8 rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.primary}/50 p-5`}>
              <div className="mb-2 flex items-center gap-2.5">
                <div className="rounded-lg bg-violet-500/10 p-1.5">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                </div>
                <span className={`text-sm font-semibold ${themeClasses.text.primary}`}>
                  Grátis por 14 dias
                </span>
              </div>
              <p className={`text-xs leading-relaxed ${themeClasses.text.tertiary}`}>
                Experimente o Zent sem compromisso. Cancelamento a qualquer momento.
              </p>
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
                Criar conta
              </h2>
              <p className={`mt-2 text-sm ${themeClasses.text.tertiary}`}>
                Comece a usar o Zent agora mesmo
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className={`mb-2 flex items-center gap-2 text-sm font-semibold ${themeClasses.text.secondary}`}>
                  <User className="h-4 w-4 text-violet-400" />
                  Nome
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  className={`w-full rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-4 py-3 text-sm ${themeClasses.text.primary} outline-none transition-all duration-200 placeholder:text-zinc-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20`}
                  placeholder="Seu nome completo"
                />
              </div>

              {/* Email */}
              <div>
                <label className={`mb-2 flex items-center gap-2 text-sm font-semibold ${themeClasses.text.secondary}`}>
                  <Mail className="h-4 w-4 text-violet-400" />
                  Email
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className={`w-full rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-4 py-3 text-sm ${themeClasses.text.primary} outline-none transition-all duration-200 placeholder:text-zinc-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20`}
                  placeholder="voce@email.com"
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    className={`w-full rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-4 py-3 pr-11 text-sm ${themeClasses.text.primary} outline-none transition-all duration-200 placeholder:text-zinc-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20`}
                    placeholder="Crie uma senha forte"
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

                {/* Password Requirements */}
                <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {[
                    { key: 'minLength', text: 'Pelo menos 8 caracteres' },
                    { key: 'lowercase', text: 'Uma letra minúscula' },
                    { key: 'uppercase', text: 'Uma letra maiúscula' },
                    { key: 'number', text: 'Um número' },
                    { key: 'symbol', text: 'Um símbolo' },
                  ].map((req) => (
                    <div key={req.key} className="flex min-w-0 items-center gap-2 text-xs">
                      {getPasswordCheckIcon(
                        passwordChecks[req.key as keyof typeof passwordChecks],
                      )}
                      <span
                        className={`truncate font-medium ${
                          passwordChecks[req.key as keyof typeof passwordChecks]
                            ? 'text-emerald-400'
                            : themeClasses.text.muted
                        }`}
                      >
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className={`mb-2 flex items-center gap-2 text-sm font-semibold ${themeClasses.text.secondary}`}>
                  <Lock className="h-4 w-4 text-violet-400" />
                  Confirmar senha
                </label>
                <div className="relative">
                  <input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`w-full rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-4 py-3 pr-11 text-sm ${themeClasses.text.primary} outline-none transition-all duration-200 placeholder:text-zinc-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20`}
                    placeholder="Repita sua senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 ${themeClasses.text.tertiary} transition-all duration-200 hover:text-violet-400 hover:bg-violet-500/10`}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {confirmPassword && (
                  <div className="mt-2 flex items-center gap-2 text-xs font-medium">
                    {passwordsMatch ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald-400" />
                        <span className="text-emerald-400">As senhas coincidem</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3.5 w-3.5 flex-shrink-0 text-red-400" />
                        <span className="text-red-400">As senhas não coincidem</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400 animate-in fade-in slide-in-from-top-1">
                  <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span className="break-words">{error}</span>
                </div>
              )}

              {/* Success */}
              {success && (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400 animate-in fade-in slide-in-from-top-1">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span className="break-words">{success}</span>
                </div>
              )}

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
                      Criando conta...
                    </>
                  ) : (
                    <>
                      Criar conta
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className={`text-sm ${themeClasses.text.tertiary}`}>
                Já tem conta?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-violet-400 transition-colors duration-200 hover:text-violet-300"
                >
                  Entrar
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