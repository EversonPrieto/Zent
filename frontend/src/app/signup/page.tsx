'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Loader2
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

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const passwordChecks = useMemo(
        () => validatePassword(password),
        [password],
    );

    const passwordIsValid =
        passwordChecks.minLength &&
        passwordChecks.lowercase &&
        passwordChecks.uppercase &&
        passwordChecks.number &&
        passwordChecks.symbol;

    const passwordsMatch = password === confirmPassword;
    const isFormValid = name.trim() && email.trim() && passwordIsValid && passwordsMatch;

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
            localStorage.setItem('zent_user', JSON.stringify(loginData.user));

            const workspaces = await fetch(`${API_URL}/workspaces`, {
                headers: {
                    Authorization: `Bearer ${loginData.accessToken}`,
                },
            }).then(res => res.json());

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
            <XCircle className="h-3.5 w-3.5 text-zinc-500" />
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-500/30 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
            </div>

            <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10 md:px-6">
                <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 shadow-2xl backdrop-blur-sm lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Left Column - Info */}
                    <div className="hidden border-r border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 p-8 lg:block lg:p-10">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500" />
                            <span className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                                Zent
                            </span>
                        </div>

                        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                            Crie sua conta
                        </h1>
                        <p className="mt-4 text-zinc-400 leading-relaxed">
                            Organize projetos, acompanhe tarefas, mova cards no Kanban e
                            centralize o trabalho do seu time em uma experiência moderna.
                        </p>

                        <div className="mt-8 space-y-3">
                            {[
                                { icon: Users, text: 'Workspaces para times e empresas' },
                                { icon: LayoutDashboard, text: 'Projetos e tasks com board Kanban' },
                                { icon: MessageSquare, text: 'Comentários e histórico de atividade' },
                                { icon: Shield, text: 'Permissões por função' },
                            ].map((item, idx) => {
                                const Icon = item.icon;
                                return (
                                    <div key={idx} className="flex items-center gap-3 text-sm text-zinc-400">
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/10">
                                            <Icon className="h-3.5 w-3.5 text-violet-400" />
                                        </div>
                                        <span>{item.text}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="h-4 w-4 text-violet-400" />
                                <span className="text-xs font-medium text-zinc-400">Grátis por 14 dias</span>
                            </div>
                            <p className="text-xs text-zinc-500">
                                Experimente o Zent sem compromisso. Cancelamento a qualquer momento.
                            </p>
                        </div>
                    </div>

                    {/* Right Column - Form */}
                    <div className="p-6 md:p-8 lg:p-10">
                        <div className="mb-6 text-center lg:text-left">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                                Criar conta
                            </h2>
                            <p className="mt-2 text-sm text-zinc-400">
                                Comece a usar o Zent agora mesmo.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name Field */}
                            <div>
                                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                                    <User className="h-4 w-4 text-violet-400" />
                                    Nome
                                </label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    type="text"
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-zinc-500 outline-none transition-all focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                                    placeholder="Seu nome completo"
                                />
                            </div>

                            {/* Email Field */}
                            <div>
                                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                                    <Mail className="h-4 w-4 text-violet-400" />
                                    Email
                                </label>
                                <input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    type="email"
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-zinc-500 outline-none transition-all focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                                    placeholder="voce@email.com"
                                />
                            </div>

                            {/* Password Field */}
                            <div>
                                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                                    <Lock className="h-4 w-4 text-violet-400" />
                                    Senha
                                </label>
                                <div className="relative">
                                    <input
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        type={showPassword ? 'text' : 'password'}
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-white placeholder:text-zinc-500 outline-none transition-all focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                                        placeholder="Crie uma senha forte"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>

                                {/* Password Requirements */}
                                <div className="mt-3 space-y-1.5">
                                    {[
                                        { key: 'minLength', text: 'Pelo menos 8 caracteres' },
                                        { key: 'lowercase', text: 'Uma letra minúscula' },
                                        { key: 'uppercase', text: 'Uma letra maiúscula' },
                                        { key: 'number', text: 'Um número' },
                                        { key: 'symbol', text: 'Um símbolo' },
                                    ].map((req) => (
                                        <div key={req.key} className="flex items-center gap-2 text-xs">
                                            {getPasswordCheckIcon(passwordChecks[req.key as keyof typeof passwordChecks])}
                                            <span className={passwordChecks[req.key as keyof typeof passwordChecks] ? 'text-zinc-300' : 'text-zinc-500'}>
                                                {req.text}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Confirm Password Field */}
                            <div>
                                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                                    <Lock className="h-4 w-4 text-violet-400" />
                                    Confirmar senha
                                </label>
                                <div className="relative">
                                    <input
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-white placeholder:text-zinc-500 outline-none transition-all focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                                        placeholder="Repita sua senha"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {confirmPassword && (
                                    <div className="mt-2 flex items-center gap-2 text-xs">
                                        {passwordsMatch ? (
                                            <>
                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                                <span className="text-emerald-400">As senhas coincidem</span>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="h-3.5 w-3.5 text-red-400" />
                                                <span className="text-red-400">As senhas não coincidem</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Error/Success Messages */}
                            {error && (
                                <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400 animate-in fade-in slide-in-from-top-1">
                                    <XCircle className="h-4 w-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-400 animate-in fade-in slide-in-from-top-1">
                                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                                    {success}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading || !isFormValid}
                                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-3 font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
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
                                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </>
                                    )}
                                </span>
                            </button>
                        </form>

                        {/* Login Link */}
                        <div className="mt-6 text-center">
                            <p className="text-sm text-zinc-400">
                                Já tem conta?{' '}
                                <Link 
                                    href="/login" 
                                    className="font-medium text-violet-400 transition-colors hover:text-violet-300 hover:underline"
                                >
                                    Entrar
                                </Link>
                            </p>
                        </div>

                        {/* Mobile Features */}
                        <div className="mt-6 block lg:hidden">
                            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="h-4 w-4 text-violet-400" />
                                    <span className="text-xs font-medium text-zinc-400">Grátis por 14 dias</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-500">
                                    <div className="flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                        <span>Workspaces</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                        <span>Kanban</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                        <span>Comentários</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                        <span>Permissões</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}