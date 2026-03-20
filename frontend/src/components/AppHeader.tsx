'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '../lib/api';
import CreateWorkspaceModal from './CreateWorkspaceModal';

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
  const [open, setOpen] = useState(false);
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const workspaceRaw = localStorage.getItem('zent_workspace');
    const userRaw = localStorage.getItem('zent_user');

    if (workspaceRaw) {
      try {
        setWorkspace(JSON.parse(workspaceRaw));
      } catch {
        setWorkspace(null);
      }
    }

    if (userRaw) {
      try {
        setUser(JSON.parse(userRaw));
      } catch {
        setUser(null);
      }
    }
  }, [pathname]);

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
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    localStorage.removeItem('zent_token');
    localStorage.removeItem('zent_user');
    localStorage.removeItem('zent_workspace');
    localStorage.removeItem('zent_workspace_id');
    router.push('/login');
  }

  function handleSwitchWorkspace(ws: Workspace) {
    localStorage.setItem('zent_workspace_id', ws.id);
    localStorage.setItem('zent_workspace', JSON.stringify(ws));
    setWorkspace(ws);
    setOpen(false);

    window.dispatchEvent(new Event('workspace-changed'));
    router.push('/dashboard/projects');
  }

  function handleWorkspaceCreated(newWorkspace: Workspace) {
    setWorkspaces((prev) => [newWorkspace, ...prev]);
    localStorage.setItem('zent_workspace_id', newWorkspace.id);
    localStorage.setItem('zent_workspace', JSON.stringify(newWorkspace));
    setWorkspace(newWorkspace);
    setOpen(false);

    window.dispatchEvent(new Event('workspace-changed'));
    router.push('/dashboard/projects');
  }

  return (
    <>
      <header className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/projects')}
              className="text-lg font-bold text-white"
            >
              Zent
            </button>

            <div className="hidden h-6 w-px bg-zinc-800 md:block" />

            <div className="relative hidden md:block" ref={menuRef}>
              <p className="text-xs text-zinc-500">Workspace</p>

              <button
                onClick={() => setOpen((prev) => !prev)}
                className="text-left text-sm font-medium text-zinc-200 hover:text-white"
              >
                {workspace?.name ?? 'Sem workspace'}
              </button>

              {open && (
                <div className="absolute left-0 top-12 z-50 w-64 rounded-xl border border-zinc-800 bg-zinc-900 p-2 shadow-2xl">
                  <p className="px-2 py-1 text-xs text-zinc-500">
                    Trocar workspace
                  </p>

                  <div className="mt-1 space-y-1">
                    {workspaces.map((ws) => (
                      <button
                        key={ws.id}
                        onClick={() => handleSwitchWorkspace(ws)}
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                          workspace?.id === ws.id
                            ? 'bg-zinc-800 text-white'
                            : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span>{ws.name}</span>
                          <span className="text-[10px] text-zinc-500">
                            {ws.role}
                          </span>
                        </div>
                      </button>
                    ))}

                    {workspaces.length === 0 && (
                      <p className="px-3 py-2 text-sm text-zinc-500">
                        Nenhuma workspace encontrada.
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setOpen(false);
                      setShowCreateWorkspaceModal(true);
                    }}
                    className="mt-2 w-full rounded-lg border border-zinc-700 px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    + Criar workspace
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-zinc-200">
                {user?.name ?? 'Usuário'}
              </p>
              <p className="text-xs text-zinc-500">{user?.email ?? ''}</p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {showCreateWorkspaceModal && (
        <CreateWorkspaceModal
          onClose={() => setShowCreateWorkspaceModal(false)}
          onCreated={(workspace) => {
            handleWorkspaceCreated(workspace);
            setShowCreateWorkspaceModal(false);
          }}
        />
      )}
    </>
  );
}