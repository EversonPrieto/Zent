'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import {
  Building2,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Users,
  LayoutDashboard,
  Shield,
  Tag
} from 'lucide-react';

export default function WorkspaceOnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Informe o nome do workspace.');
      return;
    }

    if (name.length > 50) {
      setError('O nome do workspace deve ter no máximo 50 caracteres.');
      return;
    }

    try {
      setLoading(true);

      const workspace = await api('/workspaces', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
        }),
      });

      localStorage.setItem('zent_workspace_id', workspace.id);
      localStorage.setItem('zent_workspace', JSON.stringify(workspace));

      router.push('/dashboard/projects');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar workspace');
    } finally {
      setLoading(false);
    }
  }

  const nameLength = name.length;
  const isFormValid = name.trim() && nameLength <= 50;

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-10 md:px-6">
        <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 shadow-2xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="border-b border-white/10 bg-gradient-to-r from-zinc-900 to-zinc-950 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 p-2">
                <Building2 className="h-6 w-6 text-violet-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold md:text-3xl bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                  Crie seu workspace
                </h1>
                <p className="mt-1 text-sm text-zinc-400">
                  Escolha um nome para seu primeiro ambiente no Zent
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { icon: Users, text: 'Gerencie membros' },
                  { icon: LayoutDashboard, text: 'Organize projetos' },
                  { icon: Shield, text: 'Controle permissões' },
                ].map((feature, idx) => {
                  const Icon = feature.icon;
                  return (
                    <div key={idx} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2">
                      <Icon className="h-4 w-4 text-violet-400" />
                      <span className="text-xs text-zinc-400">{feature.text}</span>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                  <Tag className="h-4 w-4 text-violet-400" />
                  Nome do workspace
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: Equipe Zent, Marketing, Desenvolvimento..."
                  autoFocus
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-zinc-500 outline-none transition-all focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                />
                {name && (
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-zinc-500">
                      {nameLength} caracteres
                    </span>
                    {isFormValid && nameLength >= 3 ? (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Nome disponível
                      </span>
                    ) : nameLength > 50 ? (
                      <span className="text-red-400">
                        Máximo 50 caracteres
                      </span>
                    ) : nameLength > 0 && nameLength < 3 ? (
                      <span className="text-amber-400">
                        Mínimo 3 caracteres
                      </span>
                    ) : null}
                  </div>
                )}
              </div>

              {!name && (
                <div className="rounded-lg border border-white/5 bg-white/5 p-3">
                  <p className="text-xs text-zinc-500 mb-2">💡 Sugestões de nomes:</p>
                  <div className="flex flex-wrap gap-2">
                    {['Equipe Design', 'Desenvolvimento', 'Marketing', 'Produto', 'Vendas'].map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setName(suggestion)}
                        className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-400 transition-all hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-violet-400"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-6 py-3 font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Criando workspace...
                    </>
                  ) : (
                    <>
                      Criar workspace
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </span>
              </button>
            </form>

            <div className="mt-6 rounded-lg border border-white/5 bg-white/5 p-4">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-violet-400 mt-0.5" />
                <div className="text-xs text-zinc-500">
                  <p className="mb-1 font-medium text-zinc-400">O que você pode fazer com um workspace?</p>
                  <ul className="space-y-1">
                    <li className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      <span>Criar projetos e organizar tasks no Kanban</span>
                    </li>
                    <li className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      <span>Convidar membros da sua equipe</span>
                    </li>
                    <li className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      <span>Definir permissões por função (Admin, Membro, Visualizador)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}