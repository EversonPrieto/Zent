'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

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

  function handleLogout() {
    localStorage.removeItem('zent_token');
    localStorage.removeItem('zent_user');
    localStorage.removeItem('zent_workspace');
    localStorage.removeItem('zent_workspace_id');
    router.push('/login');
  }

  return (
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

          <div className="hidden md:block">
            <p className="text-xs text-zinc-500">Workspace</p>
            <p className="text-sm font-medium text-zinc-200">
              {workspace?.name ?? 'Sem workspace'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-zinc-200">
              {user?.name ?? 'Usuário'}
            </p>
            <p className="text-xs text-zinc-500">
              {user?.email ?? ''}
            </p>
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
  );
}