'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '../lib/api';

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

export default function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
  const [showEditWorkspaceModal, setShowEditWorkspaceModal] = useState(false);
  const [showInviteMemberModal, setShowInviteMemberModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);

  const workspaceMenuRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  // 🔥 sincroniza com localStorage + evento
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

  // carregar workspaces
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

  // fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        workspaceMenuRef.current &&
        !workspaceMenuRef.current.contains(target)
      ) {
        setWorkspaceMenuOpen(false);
      }

      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(target)
      ) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () =>
      document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    localStorage.removeItem('zent_token');
    localStorage.removeItem('zent_user');
    localStorage.removeItem('zent_workspace');
    localStorage.removeItem('zent_workspace_id');

    window.dispatchEvent(new Event('workspace-changed'));

    router.push('/login');
  }

  function handleSwitchWorkspace(ws: Workspace) {
    localStorage.setItem('zent_workspace_id', ws.id);
    localStorage.setItem('zent_workspace', JSON.stringify(ws));

    setWorkspace(ws);
    setWorkspaceMenuOpen(false);

    window.dispatchEvent(new Event('workspace-changed'));

    router.push('/dashboard/projects');
  }

  function handleWorkspaceCreated(newWorkspace: Workspace) {
    setWorkspaces((prev) => [newWorkspace, ...prev]);

    localStorage.setItem('zent_workspace_id', newWorkspace.id);
    localStorage.setItem('zent_workspace', JSON.stringify(newWorkspace));

    setWorkspace(newWorkspace);
    setWorkspaceMenuOpen(false);

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

  const canManageWorkspace =
    workspace?.role === 'OWNER' || workspace?.role === 'ADMIN';

  return (
    <>
      <header className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">

          {/* LEFT */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/projects')}
              className="text-lg font-bold text-white"
            >
              Zent
            </button>

            <div className="hidden h-6 w-px bg-zinc-800 md:block" />

            {/* WORKSPACE */}
            <div className="relative hidden md:block" ref={workspaceMenuRef}>
              <p className="text-xs text-zinc-500">Workspace</p>

              <button
                onClick={() => {
                  setWorkspaceMenuOpen((prev) => !prev);
                  setUserMenuOpen(false);
                }}
                className="text-left text-sm font-medium text-zinc-200 hover:text-white"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-[10px]">
                    {workspace?.logoUrl ? (
                      <img
                        src={workspace.logoUrl}
                        alt={workspace.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      workspace?.name?.charAt(0).toUpperCase()
                    )}
                  </div>

                  {workspace?.name ?? 'Sem workspace'}
                </div>
              </button>

              {workspaceMenuOpen && (
                <div className="absolute left-0 top-12 z-50 w-72 rounded-xl border border-zinc-800 bg-zinc-900 p-2 shadow-2xl">

                  <p className="px-2 py-1 text-xs text-zinc-500">
                    Trocar workspace
                  </p>

                  <div className="mt-1 space-y-1">
                    {workspaces.map((ws) => (
                      <button
                        key={ws.id}
                        onClick={() => handleSwitchWorkspace(ws)}
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${workspace?.id === ws.id
                          ? 'bg-zinc-800 text-white'
                          : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-[10px]">
                              {ws.logoUrl ? (
                                <img
                                  src={ws.logoUrl}
                                  alt={ws.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                ws.name.charAt(0).toUpperCase()
                              )}
                            </div>

                            <span>{ws.name}</span>
                          </div>
                          <span className="text-[10px] text-zinc-500">
                            {ws.role}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-2 space-y-1 border-t border-zinc-800 pt-2">

                    <button
                      onClick={() => {
                        setWorkspaceMenuOpen(false);
                        router.push('/dashboard/workspace/settings');
                      }}
                      className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    >
                      Configurações
                    </button>

                    <button
                      onClick={() => {
                        setWorkspaceMenuOpen(false);
                        setShowMembersModal(true);
                      }}
                      className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    >
                      Ver membros
                    </button>

                    {canManageWorkspace && workspace && (
                      <>
                        <button
                          onClick={() => {
                            setWorkspaceMenuOpen(false);
                            setShowInviteMemberModal(true);
                          }}
                          className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        >
                          Convidar membro
                        </button>

                        <button
                          onClick={() => {
                            setWorkspaceMenuOpen(false);
                            setShowEditWorkspaceModal(true);
                          }}
                          className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        >
                          Editar workspace
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => {
                        setWorkspaceMenuOpen(false);
                        setShowCreateWorkspaceModal(true);
                      }}
                      className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    >
                      + Criar workspace
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className="relative flex items-center gap-3" ref={userMenuRef}>
            <button
              onClick={() => {
                setUserMenuOpen((prev) => !prev);
                setWorkspaceMenuOpen(false);
              }}
              className="flex items-center gap-3 rounded-xl px-2 py-1 hover:bg-zinc-800"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold">
                {userInitial}
              </div>

              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-zinc-200">
                  {user?.name}
                </p>
                <p className="text-xs text-zinc-500">
                  {user?.email}
                </p>
              </div>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-14 z-50 w-56 rounded-xl border border-zinc-800 bg-zinc-900 p-2 shadow-2xl">

                <div className="border-b border-zinc-800 px-3 py-2">
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
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800"
                  >
                    Projetos
                  </button>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-400 hover:bg-zinc-800"
                  >
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MODAIS */}
      {showCreateWorkspaceModal && (
        <CreateWorkspaceModal
          onClose={() => setShowCreateWorkspaceModal(false)}
          onCreated={(ws) => {
            handleWorkspaceCreated(ws);
            setShowCreateWorkspaceModal(false);
          }}
        />
      )}

      {showEditWorkspaceModal && workspace && (
        <EditWorkspaceModal
          workspace={workspace}
          onClose={() => setShowEditWorkspaceModal(false)}
          onSaved={(ws) => {
            handleWorkspaceUpdated(ws);
            setShowEditWorkspaceModal(false);
          }}
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