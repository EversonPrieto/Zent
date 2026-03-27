'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { getWorkspacePermissions, type Permissions } from '../lib/permissions';

type Project = {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  workspaceId: string;
  onClose: () => void;
  onCreated: (project: Project) => void;
};

export default function CreateProjectModal({
  workspaceId,
  onClose,
  onCreated,
}: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [checkingPerms, setCheckingPerms] = useState(true);

  useEffect(() => {
    async function loadPermissions() {
      try {
        const perms = await getWorkspacePermissions(workspaceId);
        setPermissions(perms);
      } catch (err) {
        console.error('Erro ao carregar permissões:', err);
        setPermissions(null);
      } finally {
        setCheckingPerms(false);
      }
    }

    loadPermissions();
  }, [workspaceId]);

  async function handleCreate() {
    if (!name.trim()) {
      setError('Informe o nome do projeto.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const project = await api('/projects', {
        method: 'POST',
        workspaceId,
        body: JSON.stringify({
          name,
          description,
        }),
      });

      onCreated(project);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar projeto');
    } finally {
      setLoading(false);
    }
  }

  // Se o usuário não tem permissão, mostra mensagem
  if (!checkingPerms && !permissions?.canCreateProject) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-white shadow-2xl">
          <h2 className="mb-4 text-xl font-bold text-red-400">Sem permissão</h2>
          <p className="mb-6 text-sm text-zinc-400">
            Apenas ADMIN e OWNER podem criar projetos.
          </p>
          <button
            onClick={onClose}
            className="w-full rounded-lg px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-white shadow-2xl">
        <h2 className="mb-4 text-xl font-bold">Novo projeto</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-zinc-300">
              Nome do projeto
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Zent Core"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-300">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do projeto"
              rows={4}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 outline-none focus:border-zinc-500"
            />
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <div className="flex justify-end gap-2">
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
              {loading ? 'Criando...' : 'Criar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}