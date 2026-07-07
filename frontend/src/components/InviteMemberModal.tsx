'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useTheme } from '../hooks/useTheme';
import { getWorkspacePermissions, type Permissions } from '../lib/permissions';
import {
  X,
  Mail,
  Send,
  Shield,
  User,
  Eye,
  AlertCircle,
  Loader2,
  Sparkles,
  CheckCircle2,
  Lock,
} from 'lucide-react';

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

const roleConfig = {
  ADMIN: {
    label: 'Administrador',
    icon: Shield,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    description: 'Pode gerenciar membros, projetos e tasks',
  },
  MEMBER: {
    label: 'Membro',
    icon: User,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    description: 'Pode criar e editar tasks',
  },
  VIEWER: {
    label: 'Visualizador',
    icon: Eye,
    color: 'text-zinc-400',
    bg: 'bg-zinc-500/10',
    border: 'border-zinc-500/20',
    description: 'Apenas visualiza, não pode editar',
  },
};

const roleOptions: Role[] = ['ADMIN', 'MEMBER', 'VIEWER'];
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function InviteMemberModal({
  workspaceId,
  onClose,
  onInvited,
}: Props) {
  const { themeClasses } = useTheme();

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

    if (!emailRegex.test(email)) {
      setError('Informe um email válido.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await api('/invites', {
        method: 'POST',
        workspaceId,
        body: JSON.stringify({ email: email.trim(), workspaceId, role }),
      });

      onInvited?.({
        id: 'pending',
        role,
        user: { id: '', name: email, email: email.trim() },
      });

      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao convidar membro';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const isFormValid = email.trim() && emailRegex.test(email);

  if (!checkingPerms && !permissions?.canInviteMembers) {
    return (
      <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-hidden bg-black/70 p-2 backdrop-blur-sm animate-in fade-in duration-200 sm:items-center sm:p-4">
        <div
          className={`relative flex max-h-[calc(100dvh-1rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border shadow-2xl animate-in slide-in-from-bottom-4 duration-300 sm:max-h-[90vh] ${themeClasses.bg.primary} ${themeClasses.border.primary}`}
        >
          <div className={`flex-shrink-0 border-b p-4 sm:p-6 ${themeClasses.border.primary} ${themeClasses.bg.primary}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex-shrink-0 rounded-lg bg-red-500/10 p-2">
                  <Lock className="h-5 w-5 text-red-400" />
                </div>

                <h2 className="truncate bg-gradient-to-r from-red-400 to-red-300 bg-clip-text text-lg font-bold text-transparent sm:text-xl">
                  Sem permissão
                </h2>
              </div>

              <button
                onClick={onClose}
                className={`flex-shrink-0 rounded-lg p-2 transition-colors ${themeClasses.text.tertiary} hover:${themeClasses.bg.hover} hover:${themeClasses.text.primary}`}
                aria-label="Fechar modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-red-500/10 p-3">
                <Lock className="h-8 w-8 text-red-400" />
              </div>

              <h3 className={`mb-2 text-lg font-semibold ${themeClasses.text.primary}`}>
                Acesso restrito
              </h3>

              <p className={`mb-6 text-sm ${themeClasses.text.tertiary}`}>
                Apenas <span className="font-medium text-violet-400">ADMIN</span> e{' '}
                <span className="font-medium text-violet-400">OWNER</span> podem convidar membros.
              </p>

              <button
                onClick={onClose}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${themeClasses.border.primary} ${themeClasses.bg.secondary} ${themeClasses.text.secondary} hover:${themeClasses.bg.hover} hover:${themeClasses.text.primary}`}
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-hidden bg-black/70 p-2 backdrop-blur-sm animate-in fade-in duration-200 sm:items-center sm:p-4">
      <div
        className={`relative flex max-h-[calc(100dvh-1rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border shadow-2xl animate-in slide-in-from-bottom-4 duration-300 sm:max-h-[90vh] ${themeClasses.bg.primary} ${themeClasses.border.primary}`}
      >
        <div className={`flex-shrink-0 border-b p-4 sm:p-6 ${themeClasses.border.primary} ${themeClasses.bg.primary}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex-shrink-0 rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 p-2">
                <Mail className="h-5 w-5 text-violet-400" />
              </div>

              <div className="min-w-0">
                <h2 className={`truncate text-lg font-bold sm:text-xl ${themeClasses.text.primary}`}>
                  Convidar membro
                </h2>

                <p className={`mt-1 text-sm leading-snug ${themeClasses.text.tertiary}`}>
                  Envie um convite por email para colaborar
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`flex-shrink-0 rounded-lg p-2 transition-colors ${themeClasses.text.tertiary} hover:${themeClasses.bg.hover} hover:${themeClasses.text.primary}`}
              aria-label="Fechar modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-5 p-4 sm:p-6">
            <div>
              <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${themeClasses.text.secondary}`}>
                <Mail className="h-4 w-4 flex-shrink-0 text-violet-400" />
                Email do convidado
              </label>

              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                type="email"
                autoFocus
                className={`w-full rounded-xl border px-4 py-2.5 outline-none transition-all focus:border-violet-500 focus:ring-1 focus:ring-violet-500 ${themeClasses.input}`}
              />

              {email && emailRegex.test(email) && (
                <div className="mt-2 flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Email válido</span>
                </div>
              )}
            </div>

            <div>
              <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${themeClasses.text.secondary}`}>
                <Shield className="h-4 w-4 flex-shrink-0 text-violet-400" />
                Permissão
              </label>

              <div className="grid gap-2">
                {roleOptions.map((option) => {
                  const config = roleConfig[option];
                  const Icon = config.icon;
                  const isSelected = role === option;

                  return (
                    <button
                      key={option}
                      onClick={() => setRole(option)}
                      className={`group relative flex items-start gap-3 rounded-xl border p-3 transition-all ${
                        isSelected
                          ? `${config.bg} ${config.border} border-opacity-100`
                          : `${themeClasses.border.primary} ${themeClasses.bg.secondary} hover:${themeClasses.bg.hover}`
                      }`}
                    >
                      <div className={`flex-shrink-0 rounded-lg p-1.5 ${isSelected ? config.bg : themeClasses.bg.hover}`}>
                        <Icon className={`h-4 w-4 ${config.color}`} />
                      </div>

                      <div className="min-w-0 flex-1 text-left">
                        <p className={`text-sm font-medium ${config.color}`}>
                          {config.label}
                        </p>

                        <p className={`text-xs leading-snug ${themeClasses.text.hint}`}>
                          {config.description}
                        </p>
                      </div>

                      {isSelected && (
                        <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-black/10" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={`rounded-lg border p-3 ${themeClasses.bg.secondary} ${themeClasses.border.secondary}`}>
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-400" />

                <div className={`min-w-0 text-xs ${themeClasses.text.hint}`}>
                  <p className={`mb-1 font-medium ${themeClasses.text.secondary}`}>
                    O que acontece depois?
                  </p>

                  <ul className="space-y-1">
                    <li className="flex items-start gap-1">
                      <CheckCircle2 className="mt-0.5 h-3 w-3 flex-shrink-0 text-emerald-400" />
                      <span>O convidado receberá um email com o link de acesso</span>
                    </li>

                    <li className="flex items-start gap-1">
                      <CheckCircle2 className="mt-0.5 h-3 w-3 flex-shrink-0 text-emerald-400" />
                      <span>Ele poderá aceitar ou recusar o convite</span>
                    </li>

                    <li className="flex items-start gap-1">
                      <CheckCircle2 className="mt-0.5 h-3 w-3 flex-shrink-0 text-emerald-400" />
                      <span>Após aceitar, será adicionado automaticamente</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <p className={`text-center text-xs ${themeClasses.text.hint}`}>
              O convite será enviado para{' '}
              <span className="break-all text-violet-400">
                {email || 'email informado'}
              </span>
            </p>
          </div>
        </div>

        <div className={`flex flex-shrink-0 flex-col-reverse gap-2 border-t p-4 sm:flex-row sm:justify-end sm:gap-3 sm:p-6 ${themeClasses.border.primary} ${themeClasses.bg.primary}`}>
          <button
            onClick={onClose}
            className={`w-full rounded-lg px-4 py-2 text-sm transition-all ${themeClasses.text.tertiary} hover:${themeClasses.bg.hover} hover:${themeClasses.text.primary} sm:w-auto`}
          >
            Cancelar
          </button>

          <button
            onClick={handleInvite}
            disabled={loading || !isFormValid}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                Enviar convite
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
