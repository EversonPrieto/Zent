'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '../lib/api';
import { disconnectSocket } from '../lib/socket';
import { useTheme } from '../hooks/useTheme';
import { useThemeToggle } from '../hooks/useThemeToggle';
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
  Sun,
  Moon,
} from 'lucide-react';

import CreateWorkspaceModal from './CreateWorkspaceModal';
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

// Constantes auxiliares visuais
const baseButtonClass = 'transition-all duration-200 ease-out';
const baseIconButtonClass = 'rounded-lg p-2 transition-all duration-200 ease-out hover:scale-105 active:scale-95';
const dropdownContainerClass = 'rounded-2xl border shadow-2xl backdrop-blur-xl p-2 animate-in fade-in slide-in-from-top-2 duration-200';
const dropdownItemClass = 'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200';
const navButtonBaseClass = 'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs lg:text-sm font-medium transition-all duration-200 border border-transparent';
const mobileSectionClass = 'rounded-2xl border p-4';
const mobileButtonClass = 'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 w-full';

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
  const [showInviteMemberModal, setShowInviteMemberModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);

  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; type: 'task' | 'comment' | 'mention' }>>([]);

  const workspaceMenuRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  const { themeClasses } = useTheme();
  const { theme, toggleTheme } = useThemeToggle();

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
    const isValidatingRef = { current: false };

    async function validateCurrentRole() {
      if (!workspace?.id) return;
      if (isValidatingRef.current) return;
      isValidatingRef.current = true;

      try {
        const workspaces = await api('/workspaces');
        const updatedWorkspace = workspaces.find(
          (w: Workspace) => w.id === workspace.id,
        );

        if (updatedWorkspace && updatedWorkspace.role !== workspace.role) {
          localStorage.setItem(
            'zent_workspace',
            JSON.stringify(updatedWorkspace),
          );
          setWorkspace(updatedWorkspace);
          setWorkspaces(workspaces);
        }
      } catch (err) {
      } finally {
        isValidatingRef.current = false;
      }
    }

    validateCurrentRole();
    const interval = setInterval(validateCurrentRole, 5000);

    return () => clearInterval(interval);
  }, [workspace?.id, workspace?.role]);

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
      const detail = customEvent.detail as { message?: string; type?: 'task' | 'comment' | 'mention' };
      if (!detail?.message) return;
      const newNotification = {
        id: Date.now().toString(),
        message: detail.message,
        type: detail.type ?? 'task',
      };

      setNotifications((prev) => {
        const updated = [newNotification, ...prev];
        localStorage.setItem('zent_notifications', JSON.stringify(updated.slice(0, 20)));
        return updated;
      });

      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== newNotification.id));
      }, 60000);
    };

    window.addEventListener('add-notification', handleAddNotification);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('add-notification', handleAddNotification);
    };
  }, []);

  function handleLogout() {
    setUser(null);
    setWorkspace(null);
    setWorkspaces([]);
    setUserMenuOpen(false);
    setWorkspaceMenuOpen(false);

    localStorage.removeItem('zent_token');
    disconnectSocket();
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
      localStorage.setItem('zent_notifications', JSON.stringify(updated.slice(0, 20)));
      return updated;
    });

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== newNotification.id));
    }, 60000);
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
      <header className={`sticky top-0 z-50 border-b ${themeClasses.border.primary} ${themeClasses.bg.primary}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 md:px-5 lg:px-6 xl:px-8">
          {/* Left section: Logo + Workspace selector */}
          <div className="flex items-center gap-3 lg:gap-4">
            {/* Logo */}
            <button
              onClick={() => router.push('/dashboard/projects')}
              className={`group flex items-center gap-2.5 ${baseButtonClass} hover:opacity-80`}
            >
              <div className="relative">
                <img
                  src="/logo.png"
                  alt="Zent"
                  className="h-8 w-8 rounded-lg shadow-lg shadow-violet-500/20 transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/10" />
              </div>
              <span className={`text-xl font-bold hidden sm:inline tracking-tight ${themeClasses.text.primary}`}>
                Zent
              </span>
            </button>

            {/* Divider */}
            <div className={`hidden h-6 w-px lg:block ${themeClasses.border.primary}`} />

            {/* Desktop Workspace Selector */}
            <div className="relative hidden md:block" ref={workspaceMenuRef}>
              {workspace ? (
                <button
                  onClick={() => {
                    setWorkspaceMenuOpen((prev) => !prev);
                    setUserMenuOpen(false);
                  }}
                  className={`group flex items-center gap-2.5 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-3 py-2 ${baseButtonClass} hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5`}
                >
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 ring-1 ring-white/5">
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

                  <div className="text-left flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${themeClasses.text.primary}`}>
                      {workspace.name}
                    </p>
                    {RoleIcon && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <RoleIcon className={`h-3 w-3 ${roleInfo?.text}`} />
                        <p className={`text-xs font-medium ${roleInfo?.text}`}>
                          {roleInfo?.label}
                        </p>
                      </div>
                    )}
                  </div>

                  <ChevronDown className={`h-4 w-4 ${themeClasses.text.tertiary} transition-transform duration-300 group-hover:text-violet-400 ${workspaceMenuOpen ? 'rotate-180 text-violet-400' : ''}`} />
                </button>
              ) : (
                <button
                  onClick={() => setShowCreateWorkspaceModal(true)}
                  className={`flex items-center gap-2 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-4 py-2 text-sm font-medium ${themeClasses.text.secondary} ${baseButtonClass} hover:border-violet-500/30 hover:text-violet-400 hover:shadow-lg hover:shadow-violet-500/5`}
                >
                  <PlusCircle className="h-4 w-4" />
                  Criar workspace
                </button>
              )}

              {/* Workspace Dropdown */}
              {workspaceMenuOpen && workspace && (
                <div className={`absolute left-0 top-full mt-2 w-80 ${themeClasses.border.primary} ${themeClasses.bg.secondary} ${dropdownContainerClass}`}>
                  <div className="px-3 py-2">
                    <p className={`text-xs font-semibold uppercase tracking-wider ${themeClasses.text.hint}`}>
                      Trocar workspace
                    </p>
                  </div>

                  <div className="max-h-64 space-y-0.5 overflow-y-auto">
                    {uniqueWorkspaces.map((ws) => {
                      const wsRoleInfo = roleConfig[ws.role as keyof typeof roleConfig];
                      const WsRoleIcon = wsRoleInfo?.icon;
                      const isActive = workspace?.id === ws.id;
                      
                      return (
                        <button
                          key={ws.id}
                          onClick={() => handleSwitchWorkspace(ws)}
                          className={`group relative w-full rounded-xl px-3 py-2.5 text-left ${baseButtonClass} ${
                            isActive
                              ? 'bg-gradient-to-r from-violet-500/15 to-indigo-500/15 ring-1 ring-violet-500/20'
                              : `hover:${themeClasses.bg.subtle}`
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 ring-1 ring-white/5">
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

                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold truncate ${isActive ? 'text-violet-300' : themeClasses.text.primary}`}>
                                {ws.name}
                              </p>
                              {WsRoleIcon && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <WsRoleIcon className={`h-3 w-3 ${wsRoleInfo?.text}`} />
                                  <p className={`text-xs font-medium ${wsRoleInfo?.text}`}>
                                    {wsRoleInfo?.label}
                                  </p>
                                </div>
                              )}
                            </div>

                            {isActive && (
                              <div className="flex-shrink-0 rounded-full bg-emerald-500/10 p-1">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-2 space-y-0.5 border-t border-white/[0.06] pt-2">
                    <button
                      onClick={() => {
                        setWorkspaceMenuOpen(false);
                        router.push('/dashboard/workspace/settings');
                      }}
                      className={`${dropdownItemClass} ${themeClasses.text.secondary} hover:${themeClasses.bg.subtle} hover:text-violet-400`}
                    >
                      <Settings className="h-4 w-4 flex-shrink-0" />
                      <span>Configurações</span>
                    </button>

                    <button
                      onClick={() => {
                        setWorkspaceMenuOpen(false);
                        setShowMembersModal(true);
                      }}
                      className={`${dropdownItemClass} ${themeClasses.text.secondary} hover:${themeClasses.bg.subtle} hover:text-violet-400`}
                    >
                      <Users className="h-4 w-4 flex-shrink-0" />
                      <span>Ver membros</span>
                    </button>

                    {canManageWorkspace && workspace && (
                      <button
                        onClick={() => {
                          setWorkspaceMenuOpen(false);
                          setShowInviteMemberModal(true);
                        }}
                        className={`${dropdownItemClass} ${themeClasses.text.secondary} hover:${themeClasses.bg.subtle} hover:text-violet-400`}
                      >
                        <Mail className="h-4 w-4 flex-shrink-0" />
                        <span>Convidar membro</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setWorkspaceMenuOpen(false);
                        setShowCreateWorkspaceModal(true);
                      }}
                      className={`${dropdownItemClass} text-violet-400 hover:bg-violet-500/10`}
                    >
                      <PlusCircle className="h-4 w-4 flex-shrink-0" />
                      <span>Criar nova workspace</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center/Right section: Navigation + Actions */}
          <div className="hidden md:flex md:items-center md:gap-2 lg:gap-3">
            {/* Navigation Pills */}
            <nav className={`flex items-center gap-1 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-1`}>
              <button
                onClick={() => router.push('/dashboard/overview')}
                title="Visão geral"
                className={`${navButtonBaseClass} ${
                  pathname === '/dashboard/overview'
                    ? `bg-violet-500/20 text-violet-300 border-violet-400/30 shadow-lg shadow-violet-500/10`
                    : `${themeClasses.text.secondary} hover:${themeClasses.bg.subtle} hover:${themeClasses.text.primary}`
                }`}
              >
                <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
                <span className="hidden xl:inline whitespace-nowrap">Visão geral</span>
              </button>

              <button
                onClick={() => router.push('/dashboard/projects')}
                title="Projetos"
                className={`${navButtonBaseClass} ${
                  pathname === '/dashboard/projects'
                    ? `bg-violet-500/20 text-violet-300 border-violet-400/30 shadow-lg shadow-violet-500/10`
                    : `${themeClasses.text.secondary} hover:${themeClasses.bg.subtle} hover:${themeClasses.text.primary}`
                }`}
              >
                <FolderKanban className="h-4 w-4 flex-shrink-0" />
                <span className="hidden xl:inline whitespace-nowrap">Projetos</span>
              </button>

              <button
                onClick={() => router.push('/dashboard/activity')}
                title="Atividade"
                className={`${navButtonBaseClass} ${
                  pathname === '/dashboard/activity'
                    ? `bg-violet-500/20 text-violet-300 border-violet-400/30 shadow-lg shadow-violet-500/10`
                    : `${themeClasses.text.secondary} hover:${themeClasses.bg.subtle} hover:${themeClasses.text.primary}`
                }`}
              >
                <Activity className="h-4 w-4 flex-shrink-0" />
                <span className="hidden xl:inline whitespace-nowrap">Atividade</span>
              </button>
            </nav>

            {/* Search Button */}
            <button
              onClick={() => router.push('/search')}
              className={`${baseIconButtonClass} ${themeClasses.text.secondary} hover:${themeClasses.bg.subtle} hover:text-violet-400`}
              title="Busca Global (Ctrl+K)"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Plans Button */}
            <button
              onClick={() => router.push('/pricing')}
              className={`${baseIconButtonClass} ${themeClasses.text.secondary} hover:${themeClasses.bg.subtle} hover:text-amber-400`}
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
                className={`relative ${baseIconButtonClass} ${themeClasses.text.secondary} hover:${themeClasses.bg.subtle} hover:text-violet-400 ${
                  notificationsOpen ? `text-violet-400 ${themeClasses.bg.subtle}` : ''
                }`}
                title="Notificações"
              >
                <Bell className="h-4 w-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-zinc-900 dark:ring-zinc-100">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <div className={`absolute right-0 top-full mt-2 w-80 ${themeClasses.border.primary} ${themeClasses.bg.secondary} ${dropdownContainerClass}`}>
                  <div className={`border-b ${themeClasses.border.primary} px-4 py-3`}>
                    <div className="flex items-center justify-between">
                      <h3 className={`font-semibold ${themeClasses.text.primary}`}>Notificações</h3>
                      {notifications.length > 0 && (
                        <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-400">
                          {notifications.length}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      <div className="space-y-1 p-2">
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-3 ${baseButtonClass} hover:border-violet-500/20 hover:shadow-md cursor-pointer`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className="mt-0.5 flex-shrink-0">
                                {notif.type === 'task' && <CheckCircle2 className="h-4 w-4 text-violet-400" />}
                                {notif.type === 'comment' && <Mail className="h-4 w-4 text-blue-400" />}
                                {notif.type === 'mention' && <User className="h-4 w-4 text-amber-400" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${themeClasses.text.primary}`}>{notif.message}</p>
                                <p className={`text-xs mt-1 ${themeClasses.text.hint}`}>
                                  {notif.type === 'task' && 'Tarefa'}
                                  {notif.type === 'comment' && 'Comentário'}
                                  {notif.type === 'mention' && 'Menção'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                        <div className={`rounded-full ${themeClasses.bg.subtle} p-3 mb-3`}>
                          <Bell className={`h-6 w-6 ${themeClasses.text.tertiary}`} />
                        </div>
                        <p className={`text-sm font-medium ${themeClasses.text.primary}`}>Sem notificações</p>
                        <p className={`text-xs mt-1 ${themeClasses.text.hint}`}>Você está em dia!</p>
                      </div>
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className={`border-t ${themeClasses.border.primary} p-2`}>
                      <button
                        onClick={() => {
                          setNotifications([]);
                          localStorage.removeItem('zent_notifications');
                        }}
                        className={`w-full rounded-lg py-2 text-sm font-medium ${themeClasses.text.secondary} hover:${themeClasses.bg.subtle} hover:text-red-400 transition-all duration-200`}
                      >
                        Limpar tudo
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`${baseIconButtonClass} ${themeClasses.text.secondary} hover:${themeClasses.bg.subtle} hover:text-amber-400`}
              title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            {/* User Menu */}
            <div className="relative ml-1" ref={userMenuRef}>
              <button
                onClick={() => {
                  setUserMenuOpen((prev) => !prev);
                  setWorkspaceMenuOpen(false);
                }}
                className={`flex items-center gap-2.5 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-3 py-1.5 ${baseButtonClass} hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5 ${userMenuOpen ? 'border-violet-500/40 shadow-lg shadow-violet-500/10' : ''}`}
              >
                <div className="relative">
                  {user?.avatarUrl ? (
                    <img 
                      src={user.avatarUrl} 
                      alt={user.name}
                      className="h-8 w-8 rounded-lg object-cover ring-1 ring-white/10"
                    />
                  ) : (
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 text-sm font-bold ${themeClasses.text.primary} ring-1 ring-white/10`}>
                      {userInitial}
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow-lg dark:border-zinc-900" />
                </div>

                <div className="hidden text-left lg:block min-w-0 max-w-[140px]">
                  <p className={`text-sm font-semibold truncate ${themeClasses.text.primary}`}>
                    {user?.name}
                  </p>
                  <p className={`text-xs ${themeClasses.text.hint} truncate`}>
                    {user?.email}
                  </p>
                </div>

                <ChevronDown className={`h-4 w-4 flex-shrink-0 ${themeClasses.text.tertiary} transition-transform duration-300 ${userMenuOpen ? 'rotate-180 text-violet-400' : ''}`} />
              </button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <div className={`absolute right-0 top-full mt-2 w-64 ${themeClasses.border.primary} ${themeClasses.bg.secondary} ${dropdownContainerClass}`}>
                  <div className={`border-b ${themeClasses.border.primary} px-3 py-3`}>
                    <div className="flex items-center gap-3">
                      {user?.avatarUrl ? (
                        <img 
                          src={user.avatarUrl} 
                          alt={user.name}
                          className="h-10 w-10 rounded-xl object-cover ring-1 ring-white/10"
                        />
                      ) : (
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 text-sm font-bold ${themeClasses.text.primary} ring-1 ring-white/10`}>
                          {userInitial}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${themeClasses.text.primary}`}>
                          {user?.name}
                        </p>
                        <p className={`text-xs ${themeClasses.text.hint} truncate`}>
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 space-y-0.5">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        router.push('/dashboard/projects');
                      }}
                      className={`${dropdownItemClass} ${themeClasses.text.secondary} hover:${themeClasses.bg.subtle} hover:text-violet-400`}
                    >
                      <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
                      <span>Projetos</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        router.push('/dashboard/activity');
                      }}
                      className={`${dropdownItemClass} ${themeClasses.text.secondary} hover:${themeClasses.bg.subtle} hover:text-violet-400`}
                    >
                      <Activity className="h-4 w-4 flex-shrink-0" />
                      <span>Atividade</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        router.push('/pricing');
                      }}
                      className={`${dropdownItemClass} ${themeClasses.text.secondary} hover:${themeClasses.bg.subtle} hover:text-amber-400`}
                    >
                      <Crown className="h-4 w-4 flex-shrink-0" />
                      <span>Planos</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        router.push('/dashboard/profile');
                      }}
                      className={`${dropdownItemClass} ${themeClasses.text.secondary} hover:${themeClasses.bg.subtle} hover:text-violet-400`}
                    >
                      <User className="h-4 w-4 flex-shrink-0" />
                      <span>Perfil</span>
                    </button>

                    <div className={`border-t ${themeClasses.border.primary} my-2`} />

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        router.push('/dashboard');
                      }}
                      className={`${dropdownItemClass} ${themeClasses.text.secondary} hover:${themeClasses.bg.subtle} hover:text-violet-400`}
                    >
                      <Building2 className="h-4 w-4 flex-shrink-0" />
                      <span>Meus Workspaces</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className={`${dropdownItemClass} text-red-400 hover:bg-red-500/10`}
                    >
                      <LogOut className="h-4 w-4 flex-shrink-0" />
                      <span>Sair</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`rounded-lg p-2 transition-all duration-200 md:hidden ${
              mobileMenuOpen 
                ? 'bg-violet-500/10 text-violet-400' 
                : `${themeClasses.text.tertiary} hover:${themeClasses.bg.subtle} hover:${themeClasses.text.primary}`
            }`}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu - Fundo sólido sem transparência */}
        {mobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className={`absolute left-0 right-0 top-full z-50 max-h-[calc(100dvh-60px)] overflow-y-auto border-t ${themeClasses.border.primary} ${themeClasses.bg.primary} md:hidden animate-in slide-in-from-top-2 duration-200`}
          >
            <div className="space-y-4 p-4">
              {/* Current Workspace */}
              {workspace && (
                <div className={`${mobileSectionClass} ${themeClasses.border.primary} ${themeClasses.bg.subtle}`}>
                  <p className={`mb-3 text-xs font-semibold uppercase tracking-wider ${themeClasses.text.hint}`}>
                    Workspace atual
                  </p>

                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 ring-1 ring-white/5">
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

                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-semibold ${themeClasses.text.primary}`}>
                        {workspace.name}
                      </p>

                      {RoleIcon && (
                        <div className="mt-1 flex items-center gap-1.5">
                          <RoleIcon className={`h-3.5 w-3.5 flex-shrink-0 ${roleInfo?.text}`} />
                          <p className={`text-xs font-medium ${roleInfo?.text}`}>
                            {roleInfo?.label}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {uniqueWorkspaces.length > 1 && (
                    <div className="mt-4">
                      <p className={`mb-2 text-xs font-medium ${themeClasses.text.tertiary}`}>
                        Trocar workspace
                      </p>

                      <div className="max-h-40 space-y-1 overflow-y-auto">
                        {uniqueWorkspaces.map((ws) => {
                          const wsRoleInfo = roleConfig[ws.role as keyof typeof roleConfig];
                          const WsRoleIcon = wsRoleInfo?.icon;
                          const isActive = workspace?.id === ws.id;

                          return (
                            <button
                              key={ws.id}
                              onClick={() => handleSwitchWorkspace(ws)}
                              className={`flex w-full min-w-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200 ${
                                isActive
                                  ? 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/20'
                                  : `${themeClasses.text.secondary} hover:${themeClasses.bg.subtle}`
                              }`}
                            >
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
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

                              <div className="min-w-0 flex-1">
                                <p className="truncate font-semibold">{ws.name}</p>

                                {WsRoleIcon && (
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <WsRoleIcon className={`h-3 w-3 flex-shrink-0 ${wsRoleInfo?.text}`} />
                                    <p className={`truncate text-xs font-medium ${wsRoleInfo?.text}`}>
                                      {wsRoleInfo?.label}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {isActive && (
                                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-400" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    router.push('/search');
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-center gap-2 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-4 py-3 text-sm font-medium ${themeClasses.text.secondary} transition-all duration-200 active:scale-95`}
                >
                  <Search className="h-4 w-4" />
                  Buscar
                </button>

                <button
                  onClick={toggleTheme}
                  className={`flex items-center justify-center gap-2 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-4 py-3 text-sm font-medium ${themeClasses.text.secondary} transition-all duration-200 active:scale-95`}
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="h-4 w-4" />
                      Claro
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4" />
                      Escuro
                    </>
                  )}
                </button>
              </div>

              {/* Notifications */}
              {notifications.length > 0 && (
                <div className={`${mobileSectionClass} ${themeClasses.border.primary} ${themeClasses.bg.subtle}`}>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="rounded-lg bg-violet-500/10 p-1.5">
                        <Bell className="h-4 w-4 text-violet-400" />
                      </div>
                      <p className={`text-sm font-semibold ${themeClasses.text.primary}`}>
                        Notificações
                      </p>
                    </div>

                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                      {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                  </div>

                  <div className="max-h-32 space-y-1.5 overflow-y-auto">
                    {notifications.slice(0, 3).map((notif) => (
                      <div
                        key={notif.id}
                        className={`rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.primary} p-3`}
                      >
                        <p className={`line-clamp-2 text-sm ${themeClasses.text.primary}`}>
                          {notif.message}
                        </p>
                        <p className={`mt-1 text-xs ${themeClasses.text.hint}`}>
                          {notif.type === 'task' && '📋 Tarefa'}
                          {notif.type === 'comment' && '💬 Comentário'}
                          {notif.type === 'mention' && '🔔 Menção'}
                        </p>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setNotifications([]);
                      localStorage.removeItem('zent_notifications');
                    }}
                    className={`mt-3 w-full rounded-lg py-2.5 text-sm font-medium ${themeClasses.text.secondary} hover:bg-red-500/10 hover:text-red-400 transition-all duration-200`}
                  >
                    Limpar notificações
                  </button>
                </div>
              )}

              {/* Navigation */}
              <div className={`${mobileSectionClass} ${themeClasses.border.primary} ${themeClasses.bg.subtle}`}>
                <p className={`mb-3 text-xs font-semibold uppercase tracking-wider ${themeClasses.text.hint}`}>
                  Navegação
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      router.push('/dashboard/overview');
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                      pathname === '/dashboard/overview'
                        ? 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/20'
                        : `${themeClasses.text.secondary} hover:${themeClasses.bg.primary}`
                    }`}
                  >
                    <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Dashboard</span>
                  </button>

                  <button
                    onClick={() => {
                      router.push('/dashboard/projects');
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                      pathname === '/dashboard/projects'
                        ? 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/20'
                        : `${themeClasses.text.secondary} hover:${themeClasses.bg.primary}`
                    }`}
                  >
                    <FolderKanban className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Projetos</span>
                  </button>

                  <button
                    onClick={() => {
                      router.push('/dashboard/activity');
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                      pathname === '/dashboard/activity'
                        ? 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/20'
                        : `${themeClasses.text.secondary} hover:${themeClasses.bg.primary}`
                    }`}
                  >
                    <Activity className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Atividade</span>
                  </button>

                  <button
                    onClick={() => {
                      router.push('/pricing');
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium ${themeClasses.text.secondary} transition-all duration-200 hover:${themeClasses.bg.primary} hover:text-amber-400`}
                  >
                    <Crown className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Planos</span>
                  </button>
                </div>
              </div>

              {/* Workspace Actions */}
              <div className={`${mobileSectionClass} ${themeClasses.border.primary} ${themeClasses.bg.subtle}`}>
                <p className={`mb-3 text-xs font-semibold uppercase tracking-wider ${themeClasses.text.hint}`}>
                  Workspace
                </p>

                <div className="space-y-1">
                  <button
                    onClick={() => {
                      router.push('/dashboard/workspace/settings');
                      setMobileMenuOpen(false);
                    }}
                    className={`${mobileButtonClass} ${themeClasses.text.secondary} hover:${themeClasses.bg.primary} hover:text-violet-400`}
                  >
                    <Settings className="h-4 w-4 flex-shrink-0" />
                    <span>Configurações</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMembersModal(true);
                      setMobileMenuOpen(false);
                    }}
                    className={`${mobileButtonClass} ${themeClasses.text.secondary} hover:${themeClasses.bg.primary} hover:text-violet-400`}
                  >
                    <Users className="h-4 w-4 flex-shrink-0" />
                    <span>Ver membros</span>
                  </button>

                  {canManageWorkspace && workspace && (
                    <button
                      onClick={() => {
                        setShowInviteMemberModal(true);
                        setMobileMenuOpen(false);
                      }}
                      className={`${mobileButtonClass} ${themeClasses.text.secondary} hover:${themeClasses.bg.primary} hover:text-violet-400`}
                    >
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span>Convidar membro</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowCreateWorkspaceModal(true);
                      setMobileMenuOpen(false);
                    }}
                    className={`${mobileButtonClass} text-violet-400 hover:bg-violet-500/10`}
                  >
                    <PlusCircle className="h-4 w-4 flex-shrink-0" />
                    <span>Criar nova workspace</span>
                  </button>

                  <button
                    onClick={() => {
                      router.push('/dashboard');
                      setMobileMenuOpen(false);
                    }}
                    className={`${mobileButtonClass} ${themeClasses.text.secondary} hover:${themeClasses.bg.primary} hover:text-violet-400`}
                  >
                    <Building2 className="h-4 w-4 flex-shrink-0" />
                    <span>Meus Workspaces</span>
                  </button>
                </div>
              </div>

              {/* User Section */}
              <div className={`${mobileSectionClass} ${themeClasses.border.primary} ${themeClasses.bg.subtle}`}>
                <div className="flex min-w-0 items-center gap-3">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="h-11 w-11 flex-shrink-0 rounded-xl object-cover ring-1 ring-white/10"
                    />
                  ) : (
                    <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 text-sm font-bold ${themeClasses.text.primary} ring-1 ring-white/10`}>
                      {userInitial}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-semibold ${themeClasses.text.primary}`}>
                      {user?.name}
                    </p>
                    <p className={`text-xs ${themeClasses.text.hint} truncate`}>
                      {user?.email}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      router.push('/dashboard/profile');
                      setMobileMenuOpen(false);
                    }}
                    className={`rounded-lg px-3 py-2 text-xs font-medium ${themeClasses.text.secondary} hover:${themeClasses.bg.primary} hover:text-violet-400 transition-all duration-200`}
                  >
                    Perfil
                  </button>
                </div>

                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 transition-all duration-200 hover:bg-red-500/20 active:scale-95"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
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