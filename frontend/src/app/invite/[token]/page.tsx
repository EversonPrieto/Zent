'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useTheme } from '../../../hooks/useTheme';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Building2,
  Mail,
  User,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Users,
  LayoutDashboard,
  Shield
} from 'lucide-react';

type Invite = {
  workspace: {
    id: string;
    name: string;
  };
  invitedBy: {
    id: string;
    name: string;
    email: string;
  };
};

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { themeClasses } = useTheme();

  const token = params?.token as string;

  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    const fetchInvite = async () => {
      try {
        const data = await api(`/invites/${token}`);
        setInvite(data);
      } catch {
        setError('Convite inválido ou expirado');
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [token, router]);

  const handleAccept = async () => {
    const user = localStorage.getItem('zent_user');

    if (!user) {
      router.push(`/login?inviteToken=${token}`);
      return;
    }

    try {
      setAccepting(true);
      await api(`/invites/${token}/accept`, {
        method: 'POST',
      });

      router.push('/dashboard/projects');
    } catch {
      setError('Erro ao aceitar convite. Tente novamente.');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-violet-500 mx-auto mb-4" />
            <p className="text-zinc-400">Carregando convite...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="rounded-full bg-red-500/10 p-3 w-fit mx-auto mb-4">
              <XCircle className="h-12 w-12 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Convite inválido</h1>
            <p className="text-zinc-400 mb-6">{error}</p>
            <button
              onClick={() => router.push('/dashboard/projects')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-6 py-3 text-white font-medium shadow-lg shadow-violet-500/25 transition-all hover:scale-105"
            >
              Ir para o dashboard
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!invite) return null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 shadow-2xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="border-b border-white/10 bg-gradient-to-r from-zinc-900 to-zinc-950 p-6 md:p-8 text-center">
            <div className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 p-3 mb-4">
              <Sparkles className="h-8 w-8 text-violet-400" />
            </div>
            <h1 className="text-2xl font-bold md:text-3xl bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Você foi convidado! 🎉
            </h1>
            <p className="mt-2 text-zinc-400">
              Junte-se ao time e comece a colaborar
            </p>
          </div>

          <div className="p-6 md:p-8">
            <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 p-2">
                  <Building2 className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Workspace</p>
                  <p className="text-lg font-semibold text-white">{invite.workspace.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 p-2">
                  <User className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Convidado por</p>
                  <p className="text-md font-medium text-white">{invite.invitedBy.name}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Mail className="h-3 w-3 text-zinc-500" />
                    <p className="text-xs text-zinc-500">{invite.invitedBy.email}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              {[
                { icon: Users, text: 'Colabore com sua equipe' },
                { icon: LayoutDashboard, text: 'Organize projetos em Kanban' },
                { icon: Shield, text: 'Controle de permissões' },
              ].map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div key={idx} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2">
                    <Icon className="h-4 w-4 text-violet-400" />
                    <span className="text-xs text-zinc-400">{feature.text}</span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleAccept}
              disabled={accepting}
              className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-6 py-3 font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {accepting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Aceitando convite...
                  </>
                ) : (
                  <>
                    Aceitar convite
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </span>
            </button>

            <div className="mt-6 rounded-lg border border-white/5 bg-white/5 p-4">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-violet-400 mt-0.5" />
                <div className="text-xs text-zinc-500">
                  <p className="mb-1 font-medium text-zinc-400">Ao aceitar este convite, você:</p>
                  <ul className="space-y-1">
                    <li className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      <span>Passará a fazer parte do workspace {invite.workspace.name}</span>
                    </li>
                    <li className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      <span>Poderá visualizar e colaborar nos projetos</span>
                    </li>
                    <li className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      <span>Receberá notificações das atividades</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-zinc-500">
                Já tem uma conta? Faça login para aceitar o convite.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}