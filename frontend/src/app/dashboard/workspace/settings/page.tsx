'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';

type Workspace = {
  id: string;
  name: string;
  logoUrl?: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
};

export default function WorkspaceSettingsPage() {
  const router = useRouter();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const workspaceRaw = localStorage.getItem('zent_workspace');

    if (!workspaceRaw) {
      router.push('/dashboard/projects');
      return;
    }

    try {
      const parsed = JSON.parse(workspaceRaw);
      setWorkspace(parsed);
      setName(parsed.name);
    } catch {
      router.push('/dashboard/projects');
    }
  }, [router]);

  async function handleSave() {
    if (!workspace) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const updated = await api('/workspaces/current', {
        method: 'PATCH',
        workspaceId: workspace.id,
        body: JSON.stringify({ name }),
      });

      localStorage.setItem('zent_workspace_id', updated.id);
      localStorage.setItem('zent_workspace', JSON.stringify(updated));

      setWorkspace(updated);
      setName(updated.name);
      setSuccess('Workspace atualizado com sucesso!');

      window.dispatchEvent(new Event('workspace-changed'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!workspace) return;

    const confirmed = confirm(
      'Tem certeza que deseja deletar este workspace? Essa ação não pode ser desfeita.',
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await api(`/workspaces/${workspace.id}`, {
        method: 'DELETE',
        workspaceId: workspace.id,
      });

      localStorage.removeItem('zent_workspace');
      localStorage.removeItem('zent_workspace_id');

      window.dispatchEvent(new Event('workspace-changed'));

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar');
    } finally {
      setLoading(false);
    }
  }

  if (!workspace) return null;

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Configurações do workspace</h1>
          <p className="mt-2 text-zinc-400">
            Gerencie as configurações do seu workspace.
          </p>
        </div>

        <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold">Informações</h2>

          <div>
            <label className="mb-1 block text-sm text-zinc-300">
              Nome do workspace
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 outline-none focus:border-zinc-500"
              placeholder="Nome do workspace"
            />
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {success ? <p className="text-sm text-green-400">{success}</p> : null}

          <button
            onClick={handleSave}
            disabled={loading}
            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-60"
          >
            {loading ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold">Membros</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Gerencie os membros e permissões do workspace pelo menu superior.
          </p>
        </div>

        {workspace.role === 'OWNER' && (
          <div className="rounded-2xl border border-red-900 bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold text-red-400">
              Zona de perigo
            </h2>

            <p className="mt-2 text-sm text-zinc-400">
              Deletar o workspace remove projetos, tasks e acessos relacionados.
            </p>

            <button
              onClick={handleDelete}
              disabled={loading}
              className="mt-4 rounded-xl border border-red-900 px-4 py-2 text-sm text-red-400 hover:bg-zinc-800 disabled:opacity-60"
            >
              Deletar workspace
            </button>
          </div>
        )}
      </div>
    </main>
  );
}