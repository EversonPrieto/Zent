'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';

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

    try {
      setLoading(true);

      const workspace = await api('/workspaces', {
        method: 'POST',
        body: JSON.stringify({
          name,
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

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-10">
        <div className="w-full rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
          <h1 className="text-3xl font-bold">Crie seu workspace</h1>
          <p className="mt-3 text-zinc-400">
            Antes de começar, escolha o nome do seu primeiro ambiente no Zent.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1 block text-sm text-zinc-300">
                Nome do workspace
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Equipe Zent"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 outline-none focus:border-zinc-500"
              />
            </div>

            {error ? <p className="text-sm text-red-400">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-white px-5 py-2 font-medium text-black disabled:opacity-60"
            >
              {loading ? 'Criando workspace...' : 'Criar workspace'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}