'use client';

import { useState } from 'react';
import { api } from '../lib/api';

type Workspace = {
  id: string;
  name: string;
  logoUrl?: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
};

type Props = {
  onClose: () => void;
  onCreated: (workspace: Workspace) => void;
};

export default function CreateWorkspaceModal({
  onClose,
  onCreated,
}: Props) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!name.trim()) {
      setError('Informe o nome do workspace.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const workspace = await api('/workspaces', {
        method: 'POST',
        body: JSON.stringify({
          name,
        }),
      });

      onCreated(workspace);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar workspace');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-white shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Novo workspace</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Crie um novo ambiente para seu time.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            Fechar
          </button>
        </div>

        <div className="space-y-4">
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

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              Cancelar
            </button>

            <button
              onClick={handleCreate}
              disabled={loading}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-60"
            >
              {loading ? 'Criando...' : 'Criar workspace'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}