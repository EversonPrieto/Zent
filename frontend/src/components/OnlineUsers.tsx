// src/components/OnlineUsers.tsx
'use client';

import { useTheme } from '../hooks/useTheme';
import { OnlineUser } from '../hooks/usePresence';
import { Users, Wifi } from 'lucide-react';

interface OnlineUsersProps {
  users: OnlineUser[];
  currentUserId: string;
}

export function OnlineUsers({ users, currentUserId }: OnlineUsersProps) {
  const { themeClasses } = useTheme();

  if (!users || users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-500/10">
          <Users className="h-6 w-6 text-zinc-500" />
        </div>
        <p className={`text-sm font-medium ${themeClasses.text.primary}`}>
          Ninguém online
        </p>
        <p className={`mt-1 text-xs ${themeClasses.text.tertiary}`}>
          Membros online aparecerão aqui
        </p>
      </div>
    );
  }

  const seenIds = new Set<string>();
  const uniqueUsers = users.filter((u) => {
    if (!u.id || seenIds.has(u.id)) return false;
    seenIds.add(u.id);
    return true;
  });

  const sortedUsers = [
    ...uniqueUsers.filter((u) => u.id === currentUserId),
    ...uniqueUsers.filter((u) => u.id !== currentUserId),
  ];

  const shouldScroll = sortedUsers.length > 5;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-emerald-500/10 p-1.5">
            <Wifi className="h-4 w-4 text-emerald-400" />
          </div>
          <h3 className={`text-sm font-semibold ${themeClasses.text.primary}`}>
            Online
          </h3>
        </div>
        <span className={`rounded-full ${themeClasses.bg.subtle} px-2.5 py-0.5 text-xs font-semibold ${themeClasses.text.tertiary}`}>
          {sortedUsers.length}
        </span>
      </div>

      <div className={`space-y-1 ${shouldScroll ? 'max-h-[220px] overflow-y-auto custom-scrollbar pr-1' : ''}`}>
        {sortedUsers.map((user) => {
          const userName = (user as any).userName || (user as any).name || 'Usuário';
          const avatarUrl = (user as any).avatarUrl || null;

          return (
            <div
              key={user.id}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-violet-500/5 ${
                user.id === currentUserId ? 'bg-violet-500/5 ring-1 ring-violet-500/20' : ''
              }`}
              title={`${userName}${user.id === currentUserId ? ' (você)' : ''}`}
            >
              <div className="relative flex-shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={userName}
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-white/10"
                  />
                ) : (
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 text-xs font-bold ring-2 ring-white/10 ${themeClasses.text.primary}`}>
                    {userName?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 shadow-lg dark:border-zinc-900" />
              </div>

              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-semibold ${themeClasses.text.primary}`}>
                  {userName}
                  {user.id === currentUserId && (
                    <span className="ml-1.5 text-xs font-medium text-violet-400">(você)</span>
                  )}
                </p>
                <p className={`truncate text-xs ${themeClasses.text.tertiary}`}>
                  Online agora
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}