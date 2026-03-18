'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError('');
        setSuccess('');

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
                    name,
                    email,
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
                    email,
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


            // 🔥 NOVO (ESSENCIAL)
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

    function checkClass(valid: boolean) {
        return valid ? 'text-green-400' : 'text-zinc-500';
    }

    return (
        <main className="min-h-screen bg-zinc-950 text-white">
            <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-10">
                <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl lg:grid-cols-2">
                    <div className="hidden border-r border-zinc-800 bg-zinc-950 p-10 lg:block">
                        <h1 className="text-3xl font-bold">Crie sua conta no Zent</h1>
                        <p className="mt-4 text-zinc-400">
                            Organize projetos, acompanhe tarefas, mova cards no Kanban e
                            centralize o trabalho do seu time em uma experiência moderna.
                        </p>

                        <div className="mt-8 space-y-3 text-sm text-zinc-400">
                            <p>✓ Workspaces para times e empresas</p>
                            <p>✓ Projetos e tasks com board Kanban</p>
                            <p>✓ Comentários e histórico de atividade</p>
                            <p>✓ Permissões por função</p>
                        </div>
                    </div>

                    <div className="p-8 md:p-10">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold">Criar conta</h2>
                            <p className="mt-2 text-sm text-zinc-400">
                                Comece a usar o Zent agora.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm text-zinc-300">Nome</label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    type="text"
                                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 outline-none focus:border-zinc-500"
                                    placeholder="Seu nome"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm text-zinc-300">Email</label>
                                <input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    type="email"
                                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 outline-none focus:border-zinc-500"
                                    placeholder="voce@email.com"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm text-zinc-300">Senha</label>
                                <input
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    type="password"
                                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 outline-none focus:border-zinc-500"
                                    placeholder="Crie uma senha forte"
                                />

                                <div className="mt-3 space-y-1 text-xs">
                                    <p className={checkClass(passwordChecks.minLength)}>
                                        • Pelo menos 8 caracteres
                                    </p>
                                    <p className={checkClass(passwordChecks.lowercase)}>
                                        • Uma letra minúscula
                                    </p>
                                    <p className={checkClass(passwordChecks.uppercase)}>
                                        • Uma letra maiúscula
                                    </p>
                                    <p className={checkClass(passwordChecks.number)}>
                                        • Um número
                                    </p>
                                    <p className={checkClass(passwordChecks.symbol)}>
                                        • Um símbolo
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm text-zinc-300">
                                    Confirmar senha
                                </label>
                                <input
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    type="password"
                                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 outline-none focus:border-zinc-500"
                                    placeholder="Repita sua senha"
                                />
                            </div>

                            {error ? <p className="text-sm text-red-400">{error}</p> : null}
                            {success ? <p className="text-sm text-green-400">{success}</p> : null}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-xl bg-white px-4 py-2 font-medium text-black disabled:opacity-60"
                            >
                                {loading ? 'Criando conta...' : 'Criar conta'}
                            </button>
                        </form>

                        <p className="mt-6 text-sm text-zinc-400">
                            Já tem conta?{' '}
                            <Link href="/login" className="text-white hover:underline">
                                Entrar
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}