'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';

type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

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
};

export default function WorkspaceMembersModal({
  workspaceId,
  onClose,
}: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserRole, setCurrentUserRole] = useState<Role | null>(null);

  useEffect(() => {
    const userRaw = localStorage.getItem('zent_user');
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        setCurrentUserId(user.id);
      } catch {}
    }
  }, []);

  useEffect(() => {
    async function loadMembers() {
      try {
        setLoading(true);
        const data = await api('/workspaces/members', {
          workspaceId,
        });
        setMembers(data);

        const me = data.find((member: Member) => member.user.id === currentUserId);
        if (me) {
          setCurrentUserRole(me.role);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar membros');
      } finally {
        setLoading(false);
      }
    }

    loadMembers();
  }, [workspaceId, currentUserId]);

  function canManage(target: Member) {
    if (!currentUserRole) return false;
    if (target.user.id === currentUserId) return false;

    if (currentUserRole === 'OWNER') {
      return target.role !== 'OWNER';
    }

    if (currentUserRole === 'ADMIN') {
      return target.role !== 'OWNER' && target.role !== 'ADMIN';
    }

    return false;
  }

  async function handleRoleChange(memberId: string, newRole: Role) {
    try {
      const updated = await api(`/workspaces/members/${memberId}`, {
        method: 'PATCH',
        workspaceId,
        body: JSON.stringify({
          role: newRole,
        }),
      });

      setMembers((prev) =>
        prev.map((member) =>
          member.id === memberId ? { ...member, role: updated.role } : member,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar role');
    }
  }

  async function handleRemove(memberId: string) {
    const confirmed = confirm('Tem certeza que deseja remover este membro?');
    if (!confirmed) return;

    try {
      await api(`/workspaces/members/${memberId}`, {
        method: 'DELETE',
        workspaceId,
      });

      setMembers((prev) => prev.filter((member) => member.id !== memberId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover membro');
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-white shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Membros do workspace</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Gerencie quem faz parte deste workspace.
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
        {error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}

        {!loading && !error ? (
          <div className="space-y-3">
            {members.map((member) => {
              const manageable = canManage(member);

              return (
                <div
                  key={member.id}
                  className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium text-white">{member.user.name}</p>
                    <p className="text-sm text-zinc-400">{member.user.email}</p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    {manageable ? (
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(member.id, e.target.value as Role)
                        }
                        className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="MEMBER">MEMBER</option>
                        <option value="VIEWER">VIEWER</option>
                      </select>
                    ) : (
                      <span className="rounded-full bg-zinc-800 px-3 py-2 text-xs text-zinc-300 text-center">
                        {member.role}
                      </span>
                    )}

                    {manageable ? (
                      <button
                        onClick={() => handleRemove(member.id)}
                        className="rounded-lg border border-red-900 px-3 py-2 text-sm text-red-400 hover:bg-zinc-800"
                      >
                        Remover
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}

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