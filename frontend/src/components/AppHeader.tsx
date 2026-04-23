'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '../lib/api';
import {
  ChevronDown,
  ChevronRight,
  Building2,
  Settings,
  Users,
  Mail,
  Edit2,
  PlusCircle,
  LogOut,
  LayoutDashboard,
  Activity,
  User,
  Crown,
  Shield,
  Eye,
  CheckCircle2,
  Menu,
  X,
  FolderKanban,
  Search,
} from 'lucide-react';

import CreateWorkspaceModal from './CreateWorkspaceModal';
import EditWorkspaceModal from './EditWorkspaceModal';
import InviteMemberModal from './InviteMemberModal';
import WorkspaceMembersModal from './WorkspaceMembersModal';

type Workspace = {
  id: string;
  name: string;
  logoUrl?: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
};

type User = {
  id: string;
  name: string;
  email: string;
};

const roleConfig = {
  OWNER: { icon: Crown, label: 'Proprietário', color: 'from-amber-500 to-orange-500', text: 'text-amber-400', bg: 'bg-amber-500/10' },
  ADMIN: { icon: Shield, label: 'Administrador', color: 'from-blue-500 to-indigo-500', text: 'text-blue-400', bg: 'bg-blue-500/10' },
  MEMBER: { icon: User, label: 'Membro', color: 'from-emerald-500 to-teal-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  VIEWER: { icon: Eye, label: 'Visualizador', color: 'from-zinc-500 to-zinc-600', text: 'text-zinc-400', bg: 'bg-zinc-500/10' },
};

export default function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
  const [showEditWorkspaceModal, setShowEditWorkspaceModal] = useState(false);
  const [showInviteMemberModal, setShowInviteMemberModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);

  const workspaceMenuRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function syncFromStorage() {
      const workspaceRaw = localStorage.getItem('zent_workspace');
      const userRaw = localStorage.getItem('zent_user');

      if (workspaceRaw) {
        try {
          setWorkspace(JSON.parse(workspaceRaw));
        } catch {
          setWorkspace(null);
        }
      } else {
        setWorkspace(null);
      }

      if (userRaw) {
        try {
          setUser(JSON.parse(userRaw));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    }

    syncFromStorage();

    window.addEventListener('workspace-changed', syncFromStorage);

    return () => {
      window.removeEventListener('workspace-changed', syncFromStorage);
    };
  }, [pathname]);

  useEffect(() => {
    async function validateCurrentRole() {
      if (!workspace) return;

      try {
        const workspaces = await api('/workspaces');
        const updatedWorkspace = workspaces.find((w: Workspace) => w.id === workspace.id);

        if (updatedWorkspace && updatedWorkspace.role !== workspace.role) {
          console.log('🔄 AppHeader - Role alterado de', workspace.role, 'para', updatedWorkspace.role);
          
          localStorage.setItem('zent_workspace', JSON.stringify(updatedWorkspace));
          setWorkspace(updatedWorkspace);
          setWorkspaces(workspaces);
        }
      } catch (err) {
      }
    }

    validateCurrentRole();
    const interval = setInterval(validateCurrentRole, 5000);

    return () => clearInterval(interval);
  }, [workspace]);

  useEffect(() => {
    async function loadWorkspaces() {
      try {
        const data = await api('/workspaces');
        setWorkspaces(data);
      } catch {
        setWorkspaces([]);
      }
    }

    loadWorkspaces();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(target)) {
        setWorkspaceMenuOpen(false);
      }

      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }

      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target) && !(event.target as HTMLElement).closest('.mobile-menu-button')) {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    localStorage.clear();
    window.dispatchEvent(new Event('workspace-changed'));
    router.push('/login');
  }

  function handleSwitchWorkspace(ws: Workspace) {
    localStorage.setItem('zent_workspace_id', ws.id);
    localStorage.setItem('zent_workspace', JSON.stringify(ws));

    setWorkspace(ws);
    setWorkspaceMenuOpen(false);
    setMobileMenuOpen(false);

    window.dispatchEvent(new Event('workspace-changed'));
    router.push('/dashboard/projects');
  }

  function handleWorkspaceCreated(newWorkspace: Workspace) {
    setWorkspaces((prev) => [newWorkspace, ...prev.filter((w) => w.id !== newWorkspace.id)]);

    localStorage.setItem('zent_workspace_id', newWorkspace.id);
    localStorage.setItem('zent_workspace', JSON.stringify(newWorkspace));

    setWorkspace(newWorkspace);
    setWorkspaceMenuOpen(false);
    setMobileMenuOpen(false);

    window.dispatchEvent(new Event('workspace-changed'));
    router.push('/dashboard/projects');
  }

  function handleWorkspaceUpdated(updatedWorkspace: Workspace) {
    setWorkspace(updatedWorkspace);

    setWorkspaces((prev) =>
      prev.map((ws) =>
        ws.id === updatedWorkspace.id ? updatedWorkspace : ws,
      ),
    );

    localStorage.setItem('zent_workspace_id', updatedWorkspace.id);
    localStorage.setItem('zent_workspace', JSON.stringify(updatedWorkspace));

    setWorkspaceMenuOpen(false);
    window.dispatchEvent(new Event('workspace-changed'));
  }

  const userInitial = user?.name?.charAt(0).toUpperCase() ?? 'U';
  const canManageWorkspace = workspace?.role === 'OWNER' || workspace?.role === 'ADMIN';
  const roleInfo = workspace ? roleConfig[workspace.role as keyof typeof roleConfig] : null;
  const RoleIcon = roleInfo?.icon;

  const uniqueWorkspaces = workspaces.filter(
    (v, i, a) => a.findIndex((t) => t.id === v.id) === i,
  );

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/projects')}
              className="group flex items-center gap-2"
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 shadow-lg shadow-violet-500/25 transition-all group-hover:scale-105" />
              <span className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent hidden sm:inline">
                Zent
              </span>
            </button>

            <div className="hidden h-6 w-px bg-white/10 md:block" />

            <div className="relative hidden md:block" ref={workspaceMenuRef}>
              {workspace ? (
                <button
                  onClick={() => {
                    setWorkspaceMenuOpen((prev) => !prev);
                    setUserMenuOpen(false);
                  }}
                  className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 transition-all hover:border-white/20 hover:bg-white/10"
                >
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
                    {workspace.logoUrl ? (
                      <img
                        src={workspace.logoUrl}
                        alt={workspace.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Building2 className="h-4 w-4 text-violet-400" />
                    )}
                  </div>

                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">
                      {workspace.name}
                    </p>
                    {RoleIcon && (
                      <div className="flex items-center gap-1">
                        <RoleIcon className="h-3 w-3 text-zinc-400" />
                        <p className="text-xs text-zinc-500">
                          {roleInfo?.label}
                        </p>
                      </div>
                    )}
                  </div>

                  <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${workspaceMenuOpen ? 'rotate-180' : ''}`} />
                </button>
              ) : (
                <button
                  onClick={() => setShowCreateWorkspaceModal(true)}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-300 transition-all hover:border-white/20 hover:bg-white/10"
                >
                  <PlusCircle className="h-4 w-4" />
                  Criar workspace
                </button>
              )}

              {workspaceMenuOpen && workspace && (
                <div className="absolute left-0 top-full mt-2 w-80 rounded-2xl border border-white/10 bg-zinc-900/95 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-2">
                    <p className="text-xs font-medium text-zinc-500">Trocar workspace</p>
                  </div>

                  <div className="max-h-64 space-y-1 overflow-y-auto">
                    {uniqueWorkspaces.map((ws) => {
                      const wsRoleInfo = roleConfig[ws.role as keyof typeof roleConfig];
                      const WsRoleIcon = wsRoleInfo?.icon;
                      const isActive = workspace?.id === ws.id;
                      
                      return (
                        <button
                          key={ws.id}
                          onClick={() => handleSwitchWorkspace(ws)}
                          className={`group relative w-full rounded-xl px-3 py-2 text-left transition-all ${
                            isActive
                              ? 'bg-gradient-to-r from-violet-500/20 to-indigo-500/20'
                              : 'hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
                              {ws.logoUrl ? (
                                <img
                                  src={ws.logoUrl}
                                  alt={ws.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Building2 className="h-4 w-4 text-violet-400" />
                              )}
                            </div>

                            <div className="flex-1">
                              <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-zinc-300'}`}>
                                {ws.name}
                              </p>
                              {WsRoleIcon && (
                                <div className="flex items-center gap-1">
                                  <WsRoleIcon className={`h-3 w-3 ${wsRoleInfo?.text}`} />
                                  <p className={`text-xs ${wsRoleInfo?.text}`}>
                                    {wsRoleInfo?.label}
                                  </p>
                                </div>
                              )}
                            </div>

                            {isActive && (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-2 space-y-1 border-t border-white/10 pt-2">
                    <button
                      onClick={() => {
                        setWorkspaceMenuOpen(false);
                        router.push('/dashboard/workspace/settings');
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-300 transition-all hover:bg-white/5"
                    >
                      <Settings className="h-4 w-4" />
                      Configurações
                    </button>

                    <button
                      onClick={() => {
                        setWorkspaceMenuOpen(false);
                        setShowMembersModal(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-300 transition-all hover:bg-white/5"
                    >
                      <Users className="h-4 w-4" />
                      Ver membros
                    </button>

                    {canManageWorkspace && workspace && (
                      <>
                        <button
                          onClick={() => {
                            setWorkspaceMenuOpen(false);
                            setShowInviteMemberModal(true);
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-300 transition-all hover:bg-white/5"
                        >
                          <Mail className="h-4 w-4" />
                          Convidar membro
                        </button>

                        <button
                          onClick={() => {
                            setWorkspaceMenuOpen(false);
                            setShowEditWorkspaceModal(true);
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-300 transition-all hover:bg-white/5"
                        >
                          <Edit2 className="h-4 w-4" />
                          Editar workspace
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => {
                        setWorkspaceMenuOpen(false);
                        setShowCreateWorkspaceModal(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-violet-400 transition-all hover:bg-white/5"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Criar nova workspace
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="hidden md:flex md:items-center md:gap-4">
            <div className="flex items-center gap-1 mr-2">
              <button
                onClick={() => router.push('/dashboard/overview')}
                title="Dashboard"
                className={`rounded-lg px-3 py-2 text-sm transition-all ${
                  pathname === '/dashboard/overview'
                    ? 'bg-white/10 text-white'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
              </button>
              <button
                onClick={() => router.push('/dashboard/projects')}
                title="Projetos"
                className={`rounded-lg px-3 py-2 text-sm transition-all ${
                  pathname === '/dashboard/projects'
                    ? 'bg-white/10 text-white'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <FolderKanban className="h-4 w-4" />
              </button>
              <button
                onClick={() => router.push('/dashboard/activity')}
                title="Atividade"
                className={`rounded-lg px-3 py-2 text-sm transition-all ${
                  pathname === '/dashboard/activity'
                    ? 'bg-white/10 text-white'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Activity className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={() => router.push('/search')}
              className="rounded-lg px-3 py-2 text-sm transition-all text-zinc-400 hover:bg-white/5 hover:text-white border border-white/10"
              title="Busca Global (Ctrl+K)"
            >
              <Search className="h-4 w-4" />
            </button>

            <button
              onClick={() => router.push('/pricing')}
              className="rounded-lg px-3 py-2 text-sm transition-all text-zinc-400 hover:bg-white/5 hover:text-white"
              title="Planos"
            >
              <Crown className="h-4 w-4" />
            </button>

            {/* Profile Button */}
            <button
              onClick={() => router.push('/dashboard/profile')}
              className={`rounded-lg px-3 py-2 text-sm transition-all ${
                pathname === '/dashboard/profile'
                  ? 'bg-white/10 text-white'
                  : 'text-zinc-400 hover:bg-white/5 hover:text-white'
              }`}
              title="Perfil"
            >
              <User className="h-4 w-4" />
            </button>

            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => {
                  setUserMenuOpen((prev) => !prev);
                  setWorkspaceMenuOpen(false);
                }}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 transition-all hover:border-white/20 hover:bg-white/10"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 text-sm font-semibold text-violet-400">
                  {userInitial}
                </div>

                <div className="hidden text-right lg:block">
                  <p className="text-sm font-medium text-white">
                    {user?.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {user?.email}
                  </p>
                </div>

                <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-white/10 bg-zinc-900/95 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="border-b border-white/10 px-3 py-2">
                    <p className="text-sm font-medium text-white">
                      {user?.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {user?.email}
                    </p>
                  </div>

                  <div className="mt-2 space-y-1">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        router.push('/dashboard/projects');
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-300 transition-all hover:bg-white/5"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Projetos
                    </button>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        router.push('/dashboard/activity');
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-300 transition-all hover:bg-white/5"
                    >
                      <Activity className="h-4 w-4" />
                      Atividade
                    </button>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        router.push('/pricing');
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-violet-400 transition-all hover:bg-violet-500/10"
                    >
                      <Crown className="h-4 w-4" />
                      Planos
                    </button>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        router.push('/dashboard/profile');
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-300 transition-all hover:bg-white/5"
                    >
                      <User className="h-4 w-4" />
                      Perfil
                    </button>

                    <div className="border-t border-white/10 my-2" />

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        router.push('/dashboard');
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-300 transition-all hover:bg-white/10"
                    >
                      <Building2 className="h-4 w-4" />
                      Meus Workspaces
                    </button>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-400 transition-all hover:bg-red-500/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu-button rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="absolute top-full left-0 right-0 z-50 border-t border-white/10 bg-zinc-900/95 p-4 backdrop-blur-xl md:hidden animate-in slide-in-from-top-2 duration-200"
          >
            {workspace && (
              <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
                    {workspace.logoUrl ? (
                      <img
                        src={workspace.logoUrl}
                        alt={workspace.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Building2 className="h-5 w-5 text-violet-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{workspace.name}</p>
                    {RoleIcon && (
                      <div className="flex items-center gap-1">
                        <RoleIcon className="h-3 w-3 text-zinc-400" />
                        <p className="text-xs text-zinc-500">{roleInfo?.label}</p>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-500" />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <button
                onClick={() => {
                  router.push('/dashboard/overview');
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-300 transition-all hover:bg-white/5"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </button>

              <button
                onClick={() => {
                  router.push('/dashboard/projects');
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-300 transition-all hover:bg-white/5"
              >
                <FolderKanban className="h-4 w-4" />
                Projetos
              </button>

              <button
                onClick={() => {
                  router.push('/dashboard/activity');
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-300 transition-all hover:bg-white/5"
              >
                <Activity className="h-4 w-4" />
                Atividade
              </button>

              <button
                onClick={() => {
                  router.push('/pricing');
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-violet-400 transition-all hover:bg-violet-500/10"
              >
                <Crown className="h-4 w-4" />
                Planos
              </button>

              <button
                onClick={() => {
                  router.push('/dashboard/workspace/settings');
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-300 transition-all hover:bg-white/5"
              >
                <Settings className="h-4 w-4" />
                Configurações
              </button>

              <button
                onClick={() => {
                  router.push('/dashboard/profile');
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-300 transition-all hover:bg-white/5"
              >
                <User className="h-4 w-4" />
                Perfil
              </button>

              <button
                onClick={() => {
                  setShowMembersModal(true);
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-300 transition-all hover:bg-white/5"
              >
                <Users className="h-4 w-4" />
                Ver membros
              </button>

              {canManageWorkspace && workspace && (
                <>
                  <button
                    onClick={() => {
                      setShowInviteMemberModal(true);
                      setMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-300 transition-all hover:bg-white/5"
                  >
                    <Mail className="h-4 w-4" />
                    Convidar membro
                  </button>

                  <button
                    onClick={() => {
                      setShowEditWorkspaceModal(true);
                      setMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-300 transition-all hover:bg-white/5"
                  >
                    <Edit2 className="h-4 w-4" />
                    Editar workspace
                  </button>
                </>
              )}

              <button
                onClick={() => {
                  setShowCreateWorkspaceModal(true);
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-violet-400 transition-all hover:bg-white/5"
              >
                <PlusCircle className="h-4 w-4" />
                Criar nova workspace
              </button>

              <div className="my-2 h-px bg-white/10" />

              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-400 transition-all hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 text-sm font-semibold text-violet-400">
                  {userInitial}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-zinc-500">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {showCreateWorkspaceModal && (
        <CreateWorkspaceModal
          onClose={() => setShowCreateWorkspaceModal(false)}
          onCreated={handleWorkspaceCreated}
        />
      )}

      {showEditWorkspaceModal && workspace && (
        <EditWorkspaceModal
          workspace={workspace}
          onClose={() => setShowEditWorkspaceModal(false)}
          onSaved={handleWorkspaceUpdated}
        />
      )}

      {showInviteMemberModal && workspace && (
        <InviteMemberModal
          workspaceId={workspace.id}
          onClose={() => setShowInviteMemberModal(false)}
        />
      )}

      {showMembersModal && workspace && (
        <WorkspaceMembersModal
          workspaceId={workspace.id}
          onClose={() => setShowMembersModal(false)}
        />
      )}
    </>
  );
}