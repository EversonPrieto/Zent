'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useTheme } from '../hooks/useTheme';
import { showToast } from './Toast';
import { SkeletonMember, SkeletonModalHeader } from './Skeleton';
import { EmptyMembers } from './EmptyState';
import { showConfirm } from './ConfirmDialog';
import {
  X,
  Users,
  Crown,
  Shield,
  User,
  Eye,
  Trash2,
  ChevronDown,
  Mail,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';

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

const roleConfig = {
  OWNER: { 
    label: 'Proprietário', 
    icon: Crown, 
    color: 'text-amber-400', 
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    description: 'Controle total sobre o workspace'
  },
  ADMIN: { 
    label: 'Administrador', 
    icon: Shield, 
    color: 'text-blue-400', 
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    description: 'Gerencia membros e projetos'
  },
  MEMBER: { 
    label: 'Membro', 
    icon: User, 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    description: 'Cria e edita tasks'
  },
  VIEWER: { 
    label: 'Visualizador', 
    icon: Eye, 
    color: 'text-zinc-400', 
    bg: 'bg-zinc-500/10',
    border: 'border-zinc-500/20',
    description: 'Apenas visualiza'
  },
};

const roleOptions: Role[] = ['ADMIN', 'MEMBER', 'VIEWER'];

export default function WorkspaceMembersModal({
  workspaceId,
  onClose,
}: Props) {
  const { themeClasses } = useTheme();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserRole, setCurrentUserRole] = useState<Role | null>(null);
  const [changingRole, setChangingRole] = useState<string | null>(null);

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
    setChangingRole(memberId);
    
    try {
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

      if (memberId === currentUserId) {
        const workspaceRaw = localStorage.getItem('zent_workspace');
        if (workspaceRaw) {
          try {
            const workspace = JSON.parse(workspaceRaw);
            workspace.role = updated.role;
            localStorage.setItem('zent_workspace', JSON.stringify(workspace));
            
            window.dispatchEvent(new Event('workspace-changed'));
          } catch (err) {
            console.error('Erro ao atualizar localStorage:', err);
          }
        }
      }

      const memberName = member?.user.name || 'Membro';
      const roleLabel = roleConfig[updated.role as keyof typeof roleConfig]?.label || updated.role;
      showToast(
        `Cargo de ${memberName} alterado para ${roleLabel}! 🎉`,
        'success',
        15000,
        {
          label: 'Desfazer',
          onClick: async () => {
            if (!previousRole) return;
            
            try {
              const reverted = await api(`/workspaces/members/${memberId}`, {
                method: 'PATCH',
                workspaceId,
                body: JSON.stringify({
                  role: previousRole,
                }),
              });

              setMembers((prev) =>
                prev.map((m) =>
                  m.id === memberId ? { ...m, role: reverted.role } : m,
                ),
              );

              if (memberId === currentUserId) {
                const wsRaw = localStorage.getItem('zent_workspace');
                if (wsRaw) {
                  const ws = JSON.parse(wsRaw);
                  ws.role = reverted.role;
                  localStorage.setItem('zent_workspace', JSON.stringify(ws));
                  window.dispatchEvent(new Event('workspace-changed'));
                }
              }

              const revertLabel = roleConfig[previousRole as keyof typeof roleConfig]?.label || previousRole;
              showToast(
                `Cargo revertido para ${revertLabel}! ✅`,
                'info',
                4000
              );
            } catch (err) {
              showToast('Erro ao desfazer mudança', 'error', 4000);
            }
          },
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar role');
      showToast('Erro ao alterar cargo', 'error', 4000);
    } finally {
      setChangingRole(null);
    }
  }

  async function handleRemove(memberId: string) {
    const member = members.find((m) => m.id === memberId);
    
    const confirmed = await showConfirm({
      title: 'Remover membro',
      message: `Tem certeza que deseja remover "${member?.user.name}" do workspace? Esta ação não pode ser desfeita.`,
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

  const ownerCount = members.filter(m => m.role === 'OWNER').length;
  const adminCount = members.filter(m => m.role === 'ADMIN').length;
  const memberCount = members.filter(m => m.role === 'MEMBER').length;
  const viewerCount = members.filter(m => m.role === 'VIEWER').length;

  return (
    <div className={`fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm animate-in fade-in duration-200`}>
      <div className={`relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border shadow-2xl animate-in slide-in-from-bottom-4 duration-300 ${themeClasses.border.primary} bg-gradient-to-br ${themeClasses.bg.secondary}`}>
        <div className={`sticky top-0 z-10 border-b bg-gradient-to-r p-6 ${themeClasses.border.primary} ${themeClasses.bg.secondary}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 p-2">
                <Users className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                  Membros do workspace
                </h2>
                <p className={`mt-1 text-sm ${themeClasses.text.tertiary}`}>
                  Gerencie quem faz parte deste workspace.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`rounded-lg p-2 transition-colors ${themeClasses.text.tertiary} hover:${themeClasses.bg.tertiary} hover:${themeClasses.text.primary}`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {!loading && members.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              <div className={`rounded-lg border px-3 py-1.5 ${themeClasses.border.primary} ${themeClasses.bg.tertiary}`}>
                <span className={`text-xs ${themeClasses.text.tertiary}`}>Total</span>
                <p className={`text-lg font-bold ${themeClasses.text.primary}`}>{members.length}</p>
              </div>
              <div className={`rounded-lg border px-3 py-1.5 ${themeClasses.border.primary} ${themeClasses.bg.subtle}`}>
                <span className={`text-xs ${themeClasses.text.muted}`}>Proprietários</span>
                <p className="text-lg font-bold text-amber-400">{ownerCount}</p>
              </div>
              <div className={`rounded-lg border px-3 py-1.5 ${themeClasses.border.primary} ${themeClasses.bg.subtle}`}>
                <span className={`text-xs ${themeClasses.text.muted}`}>Administradores</span>
                <p className="text-lg font-bold text-blue-400">{adminCount}</p>
              </div>
              <div className={`rounded-lg border px-3 py-1.5 ${themeClasses.border.primary} ${themeClasses.bg.subtle}`}>
                <span className={`text-xs ${themeClasses.text.muted}`}>Membros</span>
                <p className="text-lg font-bold text-emerald-400">{memberCount}</p>
              </div>
              <div className={`rounded-lg border px-3 py-1.5 ${themeClasses.border.primary} ${themeClasses.bg.subtle}`}>
                <span className={`text-xs ${themeClasses.text.muted}`}>Visualizadores</span>
                <p className={`text-lg font-bold ${themeClasses.text.tertiary}`}>{viewerCount}</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] custom-scrollbar">
          {loading ? (
            <>
              <SkeletonModalHeader />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonMember key={i} />
                ))}
              </div>
            </>
          ) : error ? (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          ) : members.length === 0 ? (
            <EmptyMembers />
          ) : (
            <div className="space-y-3">
              {members.map((member) => {
                const manageable = canManage(member);
                const roleInfo = roleConfig[member.role as keyof typeof roleConfig];
                const RoleIcon = roleInfo?.icon;
                const isCurrentUser = member.user.id === currentUserId;
                const isChanging = changingRole === member.id;

                return (
                  <div
                    key={member.id}
                    className={`group rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} p-4 transition-all hover:${themeClasses.border.hover} hover:shadow-lg`}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${roleInfo.bg}`}>
                          {member.user.avatarUrl ? (
                            <img
                              src={member.user.avatarUrl}
                              alt={member.user.name}
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-semibold text-white">
                              {member.user.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <p className={`font-medium ${themeClasses.text.primary}`}>
                              {member.user.name}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-violet-400">(você)</span>
                              )}
                            </p>
                          </div>
                          <div className="mt-1 flex items-center gap-1.5">
                            <Mail className={`h-3 w-3 ${themeClasses.text.muted}`} />
                            <p className={`text-sm ${themeClasses.text.tertiary}`}>{member.user.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        {manageable ? (
                          <div className="relative">
                            <select
                              value={member.role}
                              onChange={(e) =>
                                handleRoleChange(member.id, e.target.value as Role)
                              }
                              disabled={isChanging}
                              className={`appearance-none rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-4 py-2 pr-8 text-sm ${themeClasses.text.primary} outline-none transition-all focus:border-violet-500 focus:ring-1 focus:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                              {roleOptions.map((role) => (
                                <option key={role} value={role} className={themeClasses.bg.primary}>
                                  {roleConfig[role as keyof typeof roleConfig]?.label || role}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                            {isChanging && (
                              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50">
                                <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className={`inline-flex items-center gap-1.5 rounded-full ${roleInfo.bg} px-3 py-1.5`}>
                            <RoleIcon className={`h-3.5 w-3.5 ${roleInfo.color}`} />
                            <span className={`text-xs font-medium ${roleInfo.color}`}>
                              {roleInfo.label}
                            </span>
                          </div>
                        )}

                        {manageable && (
                          <button
                            onClick={() => handleRemove(member.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400 transition-all hover:bg-red-500/20 hover:text-red-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remover
                          </button>
                        )}
                      </div>
                    </div>

                    <div className={`mt-3 flex items-center gap-2 pt-2 border-t ${themeClasses.border.secondary}`}>
                      <CheckCircle2 className={`h-3 w-3 ${roleInfo.color}`} />
                      <p className={`text-xs ${themeClasses.text.muted}`}>{roleInfo.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}