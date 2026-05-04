'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { useTheme } from '../../hooks/useTheme';
import CreateWorkspaceModal from '../../components/CreateWorkspaceModal';
import { 
  Building2, 
  Users, 
  Crown, 
  Shield, 
  User, 
  Eye,
  ArrowRight,
  Loader2,
  PlusCircle
} from 'lucide-react';

type Workspace = {
  id: string;
  name: string;
  logoUrl?: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
};

const roleConfig = {
  OWNER: { icon: Crown, label: 'Proprietário', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  ADMIN: { icon: Shield, label: 'Administrador', color: 'from-blue-500 to-indigo-500', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  MEMBER: { icon: User, label: 'Membro', color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  VIEWER: { icon: Eye, label: 'Visualizador', color: 'from-zinc-500 to-zinc-600', bg: 'bg-zinc-500/10', text: 'text-zinc-400' },
};

export default function DashboardPage() {
  const router = useRouter();
  const { themeClasses } = useTheme();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('zent_token');

    if (!token) {
      router.push('/login');
      return;
    }

    async function loadWorkspaces() {
      try {
        const data = await api('/workspaces');
        setWorkspaces(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar workspaces');
      } finally {
        setLoading(false);
      }
    }

    loadWorkspaces();
  }, [router]);

  function selectWorkspace(workspace: Workspace) {
    localStorage.setItem('zent_workspace_id', workspace.id);
    localStorage.setItem('zent_workspace', JSON.stringify(workspace));
    router.push('/dashboard/projects');
  }

  const handleWorkspaceCreated = (newWorkspace: Workspace) => {
    setWorkspaces([...workspaces, newWorkspace]);
    localStorage.setItem('zent_workspace_id', newWorkspace.id);
    localStorage.setItem('zent_workspace', JSON.stringify(newWorkspace));
    setShowCreateModal(false);
    router.push('/dashboard/projects');
  };

  const getRoleInfo = (role: Workspace['role']) => {
    return roleConfig[role as keyof typeof roleConfig] || roleConfig.VIEWER;
  };

  return (
    <main className={`min-h-screen ${themeClasses.bg.primary}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="mb-12 text-center md:text-left">
          <div className={`inline-flex items-center rounded-full border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-4 py-1.5 text-sm backdrop-blur-sm mb-6`}>
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Dashboard
          </div>
          
          <h1 className={`text-4xl md:text-5xl font-bold ${themeClasses.text.primary}`}>
            Suas workspaces
          </h1>
          <p className={`mt-4 text-lg ${themeClasses.text.secondary} max-w-2xl mx-auto md:mx-0`}>
            Escolha uma workspace para continuar e gerenciar seus projetos
          </p>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-violet-500" />
            <p className={`mt-4 ${themeClasses.text.secondary}`}>Carregando suas workspaces...</p>
          </div>
        )}

        {error && !loading && (
          <div className={`rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center backdrop-blur-sm`}>
            <div className="inline-flex items-center justify-center rounded-full bg-red-500/20 p-3 mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-red-400 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-400 hover:bg-red-500/30 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && workspaces.length === 0 && (
          <div className={`rounded-3xl border ${themeClasses.border.primary} bg-gradient-to-br from-violet-500/5 to-indigo-500/5 p-12 text-center backdrop-blur-sm`}>
            <div className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 p-4 mb-6">
              <Building2 className="h-12 w-12 text-violet-400" />
            </div>
            <h3 className={`text-2xl font-semibold mb-2 ${themeClasses.text.primary}`}>Nenhuma workspace encontrada</h3>
            <p className={`${themeClasses.text.secondary} mb-8 max-w-md mx-auto`}>
              Você ainda não participa de nenhuma workspace. Crie uma nova workspace para começar a organizar seus projetos.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-6 py-3 font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 hover:shadow-violet-500/40"
            >
              <PlusCircle className="h-5 w-5" />
              Criar primeira workspace
            </button>
          </div>
        )}

        {!loading && !error && workspaces.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((workspace) => {
              const RoleIcon = getRoleInfo(workspace.role).icon;
              const roleInfo = getRoleInfo(workspace.role);
              
              return (
                <button
                  key={workspace.id}
                  onClick={() => selectWorkspace(workspace)}
                  className={`group relative text-left rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} p-6 transition-all hover:scale-105 hover:border-violet-500/50 hover:shadow-2xl hover:shadow-violet-500/10 focus:outline-none focus:ring-2 focus:ring-violet-500`}
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 opacity-0 transition-opacity group-hover:opacity-100" />
                  
                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
                        {workspace.logoUrl ? (
                          <img
                            src={workspace.logoUrl}
                            alt={workspace.name}
                            className="h-8 w-8 rounded-lg object-cover"
                          />
                        ) : (
                          <Building2 className="h-6 w-6 text-violet-400" />
                        )}
                      </div>

                      <div className={`inline-flex items-center gap-1.5 rounded-full ${roleInfo.bg} px-2.5 py-1 backdrop-blur-sm`}>
                        <RoleIcon className={`h-3 w-3 ${roleInfo.text}`} />
                        <span className={`text-xs font-medium ${roleInfo.text}`}>
                          {roleInfo.label}
                        </span>
                      </div>
                    </div>

                    <h2 className={`text-xl font-semibold ${themeClasses.text.primary} group-hover:text-violet-400 transition-colors`}>
                      {workspace.name}
                    </h2>

                    <p className={`mt-2 text-sm ${themeClasses.text.secondary}`}>
                      Clique para acessar esta workspace e gerenciar seus projetos
                    </p>

                    <div className="mt-4 flex items-center gap-1 text-sm text-violet-400 opacity-0 transition-all group-hover:opacity-100 group-hover:gap-2">
                      <span>Acessar workspace</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </button>
              );
            })}

            <button
              onClick={() => setShowCreateModal(true)}
              className={`group relative text-left rounded-2xl border border-dashed ${themeClasses.border.primary} ${themeClasses.bg.secondary} p-6 transition-all hover:border-violet-500/50 hover:bg-violet-500/5 focus:outline-none focus:ring-2 focus:ring-violet-500`}
            >
              <div className="relative flex flex-col items-center justify-center text-center">
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${themeClasses.bg.subtle} transition-colors group-hover:bg-violet-500/20`}>
                  <PlusCircle className={`h-6 w-6 ${themeClasses.text.secondary} group-hover:text-violet-400 transition-colors`} />
                </div>
                <h3 className={`text-lg font-semibold ${themeClasses.text.primary} group-hover:text-violet-400 transition-colors`}>
                  Criar nova workspace
                </h3>
                <p className={`mt-2 text-sm ${themeClasses.text.secondary}`}>
                  Adicione um novo espaço para sua equipe
                </p>
              </div>
            </button>
          </div>
        )}

        {!loading && !error && workspaces.length > 0 && (
          <div className="mt-12 text-center">
            <p className={`text-sm ${themeClasses.text.secondary}`}>
              Você tem acesso a <span className="text-violet-400 font-medium">{workspaces.length}</span>{' '}
              {workspaces.length === 1 ? 'workspace' : 'workspaces'}
            </p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateWorkspaceModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleWorkspaceCreated}
        />
      )}
    </main>
  );
}