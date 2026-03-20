'use client';

import { useState } from 'react';
import { api } from '../lib/api';

type Role = 'ADMIN' | 'MEMBER' | 'VIEWER';

type Member = {
  id: string;
  role: Role;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
};

type Props = {
  workspaceId: string;
  onClose: () => void;
  onInvited?: (member: Member) => void;
};

export default function InviteMemberModal({
  workspaceId,
  onClose,
  onInvited,
}: Props) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('MEMBER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleInvite() {
    if (!email.trim()) {
      setError('Informe o email do usuário.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const invited = await api('/workspaces/members', {
        method: 'POST',
        workspaceId,
        body: JSON.stringify({
          email,
          role,
        }),
      });

      onInvited?.(invited);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao convidar membro');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-white shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Convidar membro</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Adicione um usuário existente ao workspace.
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
            <label className="mb-1 block text-sm text-zinc-300">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@email.com"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-300">Permissão</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 outline-none focus:border-zinc-500"
            >
              <option value="ADMIN">ADMIN</option>
              <option value="MEMBER">MEMBER</option>
              <option value="VIEWER">VIEWER</option>
            </select>
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
              onClick={handleInvite}
              disabled={loading}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-60"
            >
              {loading ? 'Convidando...' : 'Convidar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}