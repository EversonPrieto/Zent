'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  Loader2,
  Sparkles,
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
    dot: 'bg-amber-400',
    description: 'Controle total sobre o workspace',
  },
  ADMIN: {
    label: 'Administrador',
    icon: Shield,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    dot: 'bg-blue-400',
    description: 'Gerencia membros e projetos',
  },
  MEMBER: {
    label: 'Membro',
    icon: User,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-400',
    description: 'Cria e edita tasks',
  },
  VIEWER: {
    label: 'Visualizador',
    icon: Eye,
    color: 'text-zinc-400',
    bg: 'bg-zinc-500/10',
    border: 'border-zinc-500/20',
    dot: 'bg-zinc-400',
    description: 'Apenas visualiza',
  },
};

const roleOptions: Role[] = ['ADMIN', 'MEMBER', 'VIEWER'];

// Constantes auxiliares visuais
const statCardClass = 'rounded-xl border px-4 py-3 transition-all duration-200 hover:shadow-md';

export default function WorkspaceMembersModal({
  workspaceId,
  onClose,
}: Props) {
  const { themeClasses } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserRole, setCurrentUserRole] = useState<Role | null>(null);
  const [changingRole, setChangingRole] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
                4000,
              );
            } catch {
              showToast('Erro ao desfazer mudança', 'error', 4000);
            }
          },
        },
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
        4000,
      );
    }
  }

  if (!mounted) return null;

  const ownerCount = members.filter((m) => m.role === 'OWNER').length;
  const adminCount = members.filter((m) => m.role === 'ADMIN').length;
  const memberCount = members.filter((m) => m.role === 'MEMBER').length;
  const viewerCount = members.filter((m) => m.role === 'VIEWER').length;

  return createPortal(
    <div className="fixed inset-0 z-[2147483647] isolate flex items-center justify-center overflow-hidden bg-black/60 p-3 backdrop-blur-sm animate-in fade-in duration-200 sm:p-6">
      <div
        className={`relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border ${themeClasses.border.primary} ${themeClasses.bg.primary} shadow-2xl shadow-black/20 animate-in zoom-in-95 duration-300`}
      >
        {/* Header */}
        <div className={`flex-shrink-0 border-b ${themeClasses.border.primary} px-5 py-4 sm:px-6 sm:py-5`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-violet-500/10 p-2">
                  <Users className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <h2 className={`text-xl font-bold tracking-tight ${themeClasses.text.primary}`}>
                    Membros do workspace
                  </h2>
                  <p className={`mt-1 text-sm ${themeClasses.text.tertiary}`}>
                    Gerencie quem faz parte deste workspace
                  </p>
                </div>
              </div>

              {/* Stats Cards */}
              {!loading && members.length > 0 && (
                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className={`${statCardClass} ${themeClasses.border.primary} ${themeClasses.bg.subtle}`}>
                    <span className={`text-xs font-medium ${themeClasses.text.tertiary}`}>Total</span>
                    <p className={`text-2xl font-bold mt-1 ${themeClasses.text.primary}`}>{members.length}</p>
                  </div>

                  <div className={`${statCardClass} border-amber-500/20 bg-amber-500/5`}>
                    <span className="text-xs font-medium text-amber-400/70">Proprietários</span>
                    <p className="text-2xl font-bold mt-1 text-amber-400">{ownerCount}</p>
                  </div>

                  <div className={`${statCardClass} border-blue-500/20 bg-blue-500/5`}>
                    <span className="text-xs font-medium text-blue-400/70">Admins</span>
                    <p className="text-2xl font-bold mt-1 text-blue-400">{adminCount}</p>
                  </div>

                  <div className={`${statCardClass} border-emerald-500/20 bg-emerald-500/5`}>
                    <span className="text-xs font-medium text-emerald-400/70">Membros</span>
                    <p className="text-2xl font-bold mt-1 text-emerald-400">{memberCount}</p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className={`flex-shrink-0 rounded-xl p-2 transition-all duration-200 ${themeClasses.text.tertiary} hover:bg-zinc-800/50 hover:text-white hover:scale-105 active:scale-95`}
              aria-label="Fechar modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="custom-scrollbar flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
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
            <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-4 text-sm text-red-400">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : members.length === 0 ? (
            <EmptyMembers />
          ) : (
            <div className="space-y-3">
              {members.map((member) => {
                const manageable = canManage(member);
                const roleInfo = roleConfig[member.role as keyof typeof roleConfig];
                const RoleIcon = roleInfo.icon;
                const isCurrentUser = member.user.id === currentUserId;
                const isChanging = changingRole === member.id;

                return (
                  <div
                    key={member.id}
                    className={`group rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-4 transition-all duration-200 hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      {/* User Info */}
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="relative flex-shrink-0">
                          <div className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full ${roleInfo.bg} ring-2 ring-white/10`}>
                            {member.user.avatarUrl ? (
                              <img
                                src={member.user.avatarUrl}
                                alt={member.user.name}
                                className="h-full w-full rounded-full object-cover"
                              />
                            ) : (
                              <span className={`text-sm font-bold ${roleInfo.color}`}>
                                {member.user.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-900 ${roleInfo.dot} shadow-lg`} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className={`font-semibold truncate ${themeClasses.text.primary}`}>
                              {member.user.name}
                            </p>
                            {isCurrentUser && (
                              <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-semibold text-violet-400 ring-1 ring-violet-500/20">
                                você
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-1.5">
                            <Mail className={`h-3.5 w-3.5 flex-shrink-0 ${themeClasses.text.tertiary}`} />
                            <p className={`text-sm truncate ${themeClasses.text.tertiary}`}>
                              {member.user.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:flex-shrink-0">
                        {manageable ? (
                          <div className="relative w-full sm:w-auto">
                            <select
                              value={member.role}
                              onChange={(e) =>
                                handleRoleChange(member.id, e.target.value as Role)
                              }
                              disabled={isChanging}
                              className={`w-full appearance-none rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.primary} pl-4 pr-10 py-2.5 text-sm font-medium ${themeClasses.text.primary} outline-none transition-all duration-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto cursor-pointer`}
                            >
                              {roleOptions.map((role) => {
                                const optConfig = roleConfig[role as keyof typeof roleConfig];
                                return (
                                  <option key={role} value={role} className={themeClasses.bg.primary}>
                                    {optConfig?.label || role}
                                  </option>
                                );
                              })}
                            </select>

                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

                            {isChanging && (
                              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 backdrop-blur-sm">
                                <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className={`inline-flex items-center gap-2 rounded-full ${roleInfo.bg} ${roleInfo.border} border px-3 py-1.5`}>
                            <div className={`h-2 w-2 rounded-full ${roleInfo.dot} shadow-[0_0_6px_currentColor]`} />
                            <RoleIcon className={`h-3.5 w-3.5 ${roleInfo.color}`} />
                            <span className={`text-xs font-semibold ${roleInfo.color}`}>
                              {roleInfo.label}
                            </span>
                          </div>
                        )}

                        {manageable && (
                          <button
                            onClick={() => handleRemove(member.id)}
                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-sm font-medium text-red-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-300 active:scale-[0.98] sm:w-auto"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remover
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <div className={`mt-3 flex items-center gap-2 border-t ${themeClasses.border.primary} pt-3`}>
                      <CheckCircle2 className={`h-3.5 w-3.5 flex-shrink-0 ${roleInfo.color}`} />
                      <p className={`text-xs ${themeClasses.text.tertiary}`}>{roleInfo.description}</p>
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
          background: transparent;
          border-radius: 10px;
          margin: 4px 0;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
          border: 2px solid transparent;
          background-clip: padding-box;
        }
      `}</style>
    </div>,
    document.body,
  );
}