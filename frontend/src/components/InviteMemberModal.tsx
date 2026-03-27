'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { getWorkspacePermissions, type Permissions } from '../lib/permissions';

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

  async function handleInvite() {
    if (!email.trim()) {
      setError('Informe o email do usuário.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Use the invitations flow so the recipient chooses to accept/decline.
      await api('/invites', {
        method: 'POST',
        workspaceId,
        body: JSON.stringify({ email, workspaceId, role }),
      });

      // Notify parent with a placeholder pending member so UI updates immediately.
      onInvited?.({
        id: 'pending',
        role,
        user: { id: '', name: email, email },
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao convidar membro');
    } finally {
      setLoading(false);
    }
  }

  // Se o usuário não tem permissão, mostra mensagem
  if (!checkingPerms && !permissions?.canInviteMembers) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-white shadow-2xl">
          <h2 className="mb-4 text-xl font-bold text-red-400">Sem permissão</h2>
          <p className="mb-6 text-sm text-zinc-400">
            Apenas ADMIN e OWNER podem convidar membros.
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-white shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Enviar convite por email</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Envie um convite por email — o destinatário poderá aceitar ou recusar.
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
              placeholder="email@exemplo.com"
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