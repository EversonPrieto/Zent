'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { showToast } from './Toast';
import { SkeletonMember, SkeletonModalHeader } from './Skeleton';
import { EmptyMembers } from './EmptyState';
import { showConfirm } from './ConfirmDialog';

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
      // Guardar o role anterior para poder desfazer
      const member = members.find((m) => m.id === memberId);
      const previousRole = member?.role;

      const updated = await api(`/workspaces/members/${memberId}`, {
        method: 'PATCH',
        workspaceId,
        body: JSON.stringify({
          role: newRole,
        }),
      });

      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId ? { ...m, role: updated.role } : m,
        ),
      );

      // 🔥 Se o membro alterado é o usuário atual, atualizar localStorage
      if (memberId === currentUserId) {
        console.log('🎯 Mudança detectada no usuário atual! Atualizando localStorage...');
        const workspaceRaw = localStorage.getItem('zent_workspace');
        if (workspaceRaw) {
          try {
            const workspace = JSON.parse(workspaceRaw);
            workspace.role = updated.role;
            localStorage.setItem('zent_workspace', JSON.stringify(workspace));
            console.log('✅ WorkspaceMembersModal - Role atualizado no localStorage para:', updated.role);
            
            // Disparar evento para atualizar AppHeader e outros componentes
            window.dispatchEvent(new Event('workspace-changed'));
            console.log('✅ WorkspaceMembersModal - Evento "workspace-changed" disparado');
          } catch (err) {
            console.error('Erro ao atualizar localStorage:', err);
          }
        }
      }

      // 🎉 SEMPRE mostrar notificação visual com botão de desfazer (para qualquer membro que foi alterado)
      const memberName = member?.user.name || 'Membro';
      console.log('🍞 Chamando showToast para mudança de role:', memberName, '->', updated.role);
      showToast(
        `Cargo de ${memberName} alterado para ${updated.role}! 🎉`,
        'success',
        15000, // 15 segundos para dar tempo de clicar em "Desfazer"
        {
          label: 'Desfazer',
          onClick: async () => {
            if (!previousRole) return;
            
            try {
              console.log('↩️ Desfazendo mudança de role para:', previousRole);
              
              // Reverter a mudança
              const reverted = await api(`/workspaces/members/${memberId}`, {
                method: 'PATCH',
                workspaceId,
                body: JSON.stringify({
                  role: previousRole,
                }),
              });

              // Atualizar a lista de membros
              setMembers((prev) =>
                prev.map((m) =>
                  m.id === memberId ? { ...m, role: reverted.role } : m,
                ),
              );

              // Atualizar localStorage se for o usuário atual
              if (memberId === currentUserId) {
                const wsRaw = localStorage.getItem('zent_workspace');
                if (wsRaw) {
                  const ws = JSON.parse(wsRaw);
                  ws.role = reverted.role;
                  localStorage.setItem('zent_workspace', JSON.stringify(ws));
                  
                  // Disparar evento de atualização
                  window.dispatchEvent(new Event('workspace-changed'));
                }
              }

              // Mostrar confirmação
              showToast(
                `Cargo revertido para ${previousRole}! ✅`,
                'info',
                4000
              );

              console.log('✅ Mudança revertida com sucesso');
            } catch (err) {
              console.error('Erro ao desfazer:', err);
              showToast(
                'Erro ao desfazer mudança',
                'error',
                4000
              );
            }
          },
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar role');
    }
  }

  async function handleRemove(memberId: string) {
    const confirmed = await showConfirm({
      title: 'Remover membro',
      message: 'Tem certeza que deseja remover este membro do workspace? Esta ação não pode ser desfeita.',
      action: 'remove',
      confirmLabel: 'Remover',
      isDangerous: true,
    });

    if (!confirmed) return;

    try {
      await api(`/workspaces/members/${memberId}`, {
        method: 'DELETE',
        workspaceId,
      });

      setMembers((prev) => prev.filter((member) => member.id !== memberId));
      showToast('Membro removido com sucesso', 'success', 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover membro');
      showToast(
        err instanceof Error ? err.message : 'Erro ao remover membro',
        'error',
        4000
      );
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-white shadow-2xl">
        {loading ? (
          <>
            <SkeletonModalHeader />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonMember key={i} />
              ))}
            </div>
          </>
        ) : (
          <>
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

            {error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}

            {members.length === 0 ? (
              <EmptyMembers />
            ) : (
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
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}