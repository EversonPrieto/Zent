'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';

type Member = {
  id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
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
};

export default function WorkspaceMembersModal({
  workspaceId,
  onClose,
}: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadMembers() {
      try {
        setLoading(true);
        const data = await api('/workspaces/members', {
          workspaceId,
        });
        setMembers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar membros');
      } finally {
        setLoading(false);
      }
    }

    loadMembers();
  }, [workspaceId]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-white shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Membros do workspace</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Veja quem faz parte deste workspace.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            Fechar
          </button>
        </div>

        {loading ? <p>Carregando membros...</p> : null}
        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        {!loading && !error ? (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-4"
              >
                <div>
                  <p className="font-medium text-white">{member.user.name}</p>
                  <p className="text-sm text-zinc-400">{member.user.email}</p>
                </div>

                <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                  {member.role}
                </span>
              </div>
            ))}

            {members.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Nenhum membro encontrado.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}