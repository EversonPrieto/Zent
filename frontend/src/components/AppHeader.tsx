'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '../lib/api';
import { useTheme } from '../hooks/useTheme';
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
  Bell,
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
  avatarUrl?: string | null;
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
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
  const [showEditWorkspaceModal, setShowEditWorkspaceModal] = useState(false);
  const [showInviteMemberModal, setShowInviteMemberModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);

  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; type: 'task' | 'comment' | 'mention' }>>([]);

  const workspaceMenuRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  const { themeClasses } = useTheme();

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

    const savedNotifications = localStorage.getItem('zent_notifications');
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch {
        setNotifications([]);
      }
    }
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

      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setMobileMenuOpen(false);
      }

      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    const handleAddNotification = (event: Event) => {
      const customEvent = event as CustomEvent;
      addNotification(customEvent.detail.message, customEvent.detail.type);
    };

    window.addEventListener('add-notification', handleAddNotification);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('add-notification', handleAddNotification);
    };
  }, []);

  function handleLogout() {
    // Manter configurações de usuário, limpar apenas dados de sessão
    localStorage.removeItem('zent_token');
    localStorage.removeItem('zent_user');
    localStorage.removeItem('zent_workspace_id');
    localStorage.removeItem('zent_workspace');
    localStorage.removeItem('zent_notifications');
    window.dispatchEvent(new Event('workspace-changed'));
    router.push('/login');
  }

  function addNotification(message: string, type: 'task' | 'comment' | 'mention' = 'task') {
    const newNotification = {
      id: Date.now().toString(),
      message,
      type,
    };
    
    setNotifications((prev) => {
      const updated = [newNotification, ...prev];
      localStorage.setItem('zent_notifications', JSON.stringify(updated.slice(0, 20))); // Manter últimas 20
      return updated;
    });

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== newNotification.id));
    }, 10000);
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
      <header className={`sticky top-0 z-50 border-b ${themeClasses.border.primary} ${themeClasses.bg.primary} backdrop-blur-xl`}>
        <div className={`mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6`}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/projects')}
              className="group flex items-center gap-2"
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 shadow-lg shadow-violet-500/25 transition-all group-hover:scale-105" />
              <span className={`text-xl font-bold hidden sm:inline ${themeClasses.text.primary}`}>
                Zent
              </span>
            </button>

            <div className={`hidden h-6 w-px md:block ${themeClasses.border.primary}`} />

            <div className="relative hidden md:block" ref={workspaceMenuRef}>
              {workspace ? (
                <button
                  onClick={() => {
                    setWorkspaceMenuOpen((prev) => !prev);
                    setUserMenuOpen(false);
                  }}
                  className={`group flex items-center gap-3 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-3 py-1.5 transition-all ${themeClasses.border.hover} ${themeClasses.bg.hover}`}
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
                    <p className={`text-sm font-semibold ${themeClasses.text.primary}`}>
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
                  className={`flex items-center gap-2 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-3 py-1.5 text-sm ${themeClasses.text.secondary} transition-all ${themeClasses.border.hover} ${themeClasses.bg.hover}`}
                >
                  <PlusCircle className="h-4 w-4" />
                  Criar workspace
                </button>
              )}

              {workspaceMenuOpen && workspace && (
                <div className={`absolute left-0 top-full mt-2 w-80 rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} p-2 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200`}>
                  <div className="px-3 py-2">
                    <p className={`text-xs font-medium ${themeClasses.text.hint}`}>Trocar workspace</p>
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
                              : themeClasses.bg.hover
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
                              <p className={`text-sm font-medium ${isActive ? themeClasses.text.primary : themeClasses.text.secondary}`}>
                                {ws.name}
                              </p>
                              {WsRoleIcon && (
                                  <div className="flex items-center gap-1">
                                  <WsRoleIcon className={`h-3 w-3 ${wsRoleInfo?.text}`} />
                                  <p className={`text-xs ${themeClasses.text.tertiary}`}>
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
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm ${themeClasses.text.secondary} transition-all ${themeClasses.bg.hover}`}
                    >
                      <Settings className="h-4 w-4" />
                      Configurações
                    </button>

                    <button
                      onClick={() => {
                        setWorkspaceMenuOpen(false);
                        setShowMembersModal(true);
                      }}
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm ${themeClasses.text.secondary} transition-all ${themeClasses.bg.hover}`}
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
                          className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm ${themeClasses.text.secondary} transition-all ${themeClasses.bg.hover}`}
                        >
                          <Mail className="h-4 w-4" />
                          Convidar membro
                        </button>

                        <button
                          onClick={() => {
                            setWorkspaceMenuOpen(false);
                            setShowEditWorkspaceModal(true);
                          }}
                          className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm ${themeClasses.text.secondary} transition-all ${themeClasses.bg.hover}`}
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
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm ${themeClasses.accent.violet.split(' ')[1] || themeClasses.text.primary} transition-all ${themeClasses.bg.hover}`}
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
                    ? `${themeClasses.bg.hover} ${themeClasses.text.primary}`
                    : `${themeClasses.text.secondary} ${themeClasses.bg.hover} ${themeClasses.text.primary}`
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
              </button>
              <button
                onClick={() => router.push('/dashboard/projects')}
                title="Projetos"
                className={`rounded-lg px-3 py-2 text-sm transition-all ${
                  pathname === '/dashboard/projects'
                    ? `${themeClasses.bg.hover} ${themeClasses.text.primary}`
                    : `${themeClasses.text.secondary} ${themeClasses.bg.hover} ${themeClasses.text.primary}`
                }`}
              >
                <FolderKanban className="h-4 w-4" />
              </button>
              <button
                onClick={() => router.push('/dashboard/activity')}
                title="Atividade"
                className={`rounded-lg px-3 py-2 text-sm transition-all ${
                  pathname === '/dashboard/activity'
                    ? `${themeClasses.bg.hover} ${themeClasses.text.primary}`
                    : `${themeClasses.text.secondary} ${themeClasses.bg.hover} ${themeClasses.text.primary}`
                }`}
              >
                <Activity className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={() => router.push('/search')}
              className={`rounded-lg px-3 py-2 text-sm transition-all ${themeClasses.text.secondary} ${themeClasses.bg.hover} border ${themeClasses.border.primary}`}
              title="Busca Global (Ctrl+K)"
            >
              <Search className="h-4 w-4" />
            </button>

            <button
              onClick={() => router.push('/pricing')}
              className={`rounded-lg px-3 py-2 text-sm transition-all ${themeClasses.text.secondary} ${themeClasses.bg.hover} ${themeClasses.text.primary}`}
              title="Planos"
            >
              <Crown className="h-4 w-4" />
            </button>

            {/* Notifications Button */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => {
                  setNotificationsOpen((prev) => !prev);
                  setUserMenuOpen(false);
                }}
                className={`relative rounded-lg px-3 py-2 text-sm transition-all ${themeClasses.text.secondary} ${themeClasses.bg.hover}`}
                title="Notificações"
              >
                <Bell className="h-4 w-4" />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>

                {notificationsOpen && (
                <div className={`absolute right-0 top-full mt-2 w-80 rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200`}>
                  <div className={`border-b ${themeClasses.border.primary} px-4 py-3`}>
                    <h3 className={`font-semibold ${themeClasses.text.primary}`}>Notificações</h3>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      <div className="space-y-2 p-2">
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`rounded-lg ${themeClasses.bg.subtle} border ${themeClasses.border.primary} p-3 ${themeClasses.bg.hover} transition-all cursor-pointer`}
                          >
                            <p className={`text-sm ${themeClasses.text.primary}`}>{notif.message}</p>
                            <p className={`text-xs ${themeClasses.text.hint} mt-1`}>
                              {notif.type === 'task' && '📋 Tarefa'}
                              {notif.type === 'comment' && '💬 Comentário'}
                              {notif.type === 'mention' && '🔔 Menção'}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <Bell className={`h-8 w-8 mx-auto mb-2 ${themeClasses.text.tertiary}`} />
                        <p className={`text-sm ${themeClasses.text.hint}`}>Sem notificações</p>
                      </div>
                    )}
                  </div>

                  {notifications.length > 0 && (
                      <div className={`border-t ${themeClasses.border.primary} p-2`}>
                      <button
                        onClick={() => setNotifications([])}
                        className={`w-full py-2 rounded-lg text-sm ${themeClasses.text.secondary} ${themeClasses.bg.hover} transition-all`}
                      >
                        Limpar tudo
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => {
                  setUserMenuOpen((prev) => !prev);
                  setWorkspaceMenuOpen(false);
                }}
                className={`flex items-center gap-3 rounded-xl transition-all px-2 py-1 ${themeClasses.bg.hover}`}
              >
                <div className="relative">
                  {user?.avatarUrl ? (
                    <img 
                      src={user.avatarUrl} 
                      alt={user.name}
                      className="h-8 w-8 rounded-lg object-cover"
                    />
                  ) : (
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${themeClasses.bg.subtle} text-sm font-semibold ${themeClasses.text.primary}`}>
                      {userInitial}
                    </div>
                  )}
                  <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 ${themeClasses.bg.primary} shadow-lg`} />
                </div>

                <div className="hidden text-right lg:block">
                  <p className={`text-sm font-medium ${themeClasses.text.primary}`}>
                    {user?.name}
                  </p>
                  <p className={`text-xs ${themeClasses.text.hint}`}>
                    {user?.email}
                  </p>
                </div>

                <ChevronDown className={`h-4 w-4 ${themeClasses.text.secondary} transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className={`absolute right-0 top-full mt-2 w-64 rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} p-2 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200`}>
                  <div className={`border-b ${themeClasses.border.primary} px-3 py-2`}>
                    <p className={`text-sm font-medium ${themeClasses.text.primary}`}>
                      {user?.name}
                    </p>
                    <p className={`${themeClasses.text.hint} text-xs`}>
                      {user?.email}
                    </p>
                  </div>

                  <div className="mt-2 space-y-1">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        router.push('/dashboard/projects');
                      }}
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm ${themeClasses.text.secondary} transition-all ${themeClasses.bg.hover}`}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Projetos
                    </button>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        router.push('/dashboard/activity');
                      }}
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm ${themeClasses.text.secondary} transition-all ${themeClasses.bg.hover}`}
                    >
                      <Activity className="h-4 w-4" />
                      Atividade
                    </button>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        router.push('/pricing');
                      }}
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm ${themeClasses.text.secondary} transition-all ${themeClasses.bg.hover}`}
                    >
                      <Crown className="h-4 w-4" />
                      Planos
                    </button>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        router.push('/dashboard/profile');
                      }}
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm ${themeClasses.text.secondary} transition-all ${themeClasses.bg.hover}`}
                    >
                      <User className="h-4 w-4" />
                      Perfil
                    </button>

                    <div className={`border-t ${themeClasses.border.primary} my-2`} />

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        router.push('/dashboard');
                      }}
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm ${themeClasses.text.secondary} transition-all ${themeClasses.bg.hover}`}
                    >
                      <Building2 className="h-4 w-4" />
                      Meus Workspaces
                    </button>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-400 transition-all hover:bg-red-500/10`}
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
            className={`mobile-menu-button rounded-lg p-2 transition-colors md:hidden ${themeClasses.text.tertiary} hover:${themeClasses.bg.hover} hover:${themeClasses.text.primary}`}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className={`absolute top-full left-0 right-0 z-50 border-t ${themeClasses.border.primary} ${themeClasses.bg.primary} p-4 backdrop-blur-xl md:hidden animate-in slide-in-from-top-2 duration-200`}
          >
            {workspace && (
              <div className={`mb-4 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-3`}>
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
                    <p className={`font-semibold ${themeClasses.text.primary}`}>{workspace.name}</p>
                    {RoleIcon && (
                      <div className="flex items-center gap-1">
                        <RoleIcon className="h-3 w-3 text-zinc-400" />
                        <p className={`${themeClasses.text.hint} text-xs`}>{roleInfo?.label}</p>
                      </div>
                    )}
                  </div>
                  <ChevronRight className={`h-4 w-4 ${themeClasses.text.hint}`} />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <button
                onClick={() => {
                  router.push('/dashboard/overview');
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${themeClasses.text.secondary} transition-all ${themeClasses.bg.hover}`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </button>

              <button
                onClick={() => {
                  router.push('/dashboard/projects');
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${themeClasses.text.secondary} transition-all ${themeClasses.bg.hover}`}
              >
                <FolderKanban className="h-4 w-4" />
                Projetos
              </button>

              <button
                onClick={() => {
                  router.push('/dashboard/activity');
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${themeClasses.text.secondary} transition-all ${themeClasses.bg.hover}`}
              >
                <Activity className="h-4 w-4" />
                Atividade
              </button>

              <button
                onClick={() => {
                  router.push('/pricing');
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${themeClasses.text.secondary} transition-all ${themeClasses.bg.hover}`}
              >
                <Crown className="h-4 w-4" />
                Planos
              </button>

              <button
                onClick={() => {
                  router.push('/dashboard/workspace/settings');
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${themeClasses.text.secondary} transition-all ${themeClasses.bg.hover}`}
              >
                <Settings className="h-4 w-4" />
                Configurações
              </button>

              <button
                onClick={() => {
                  router.push('/dashboard/profile');
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${themeClasses.text.secondary} transition-all ${themeClasses.bg.hover}`}
              >
                <User className="h-4 w-4" />
                Perfil
              </button>

              <button
                onClick={() => {
                  setShowMembersModal(true);
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${themeClasses.text.secondary} transition-all ${themeClasses.bg.hover}`}
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
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${themeClasses.text.secondary} transition-all ${themeClasses.bg.hover}`}
                  >
                    <Mail className="h-4 w-4" />
                    Convidar membro
                  </button>

                  <button
                    onClick={() => {
                      setShowEditWorkspaceModal(true);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${themeClasses.text.secondary} transition-all ${themeClasses.bg.hover}`}
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
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${themeClasses.text.secondary} transition-all ${themeClasses.bg.hover}`}
              >
                <PlusCircle className="h-4 w-4" />
                Criar nova workspace
              </button>

              <div className={`my-2 h-px ${themeClasses.border.primary}`} />

              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-400 transition-all hover:bg-red-500/10`}
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>

            <div className={`mt-4 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-3`}>
              <div className="flex items-center gap-3">
                {user?.avatarUrl ? (
                  <img 
                    src={user.avatarUrl} 
                    alt={user.name}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${themeClasses.bg.subtle} text-sm font-semibold ${themeClasses.text.primary}`}>
                    {userInitial}
                  </div>
                )}
                <div>
                  <p className={`text-sm font-medium ${themeClasses.text.primary}`}>{user?.name}</p>
                  <p className={`${themeClasses.text.hint} text-xs`}>{user?.email}</p>
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