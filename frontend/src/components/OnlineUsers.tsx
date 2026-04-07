'use client';

import { OnlineUser } from '../hooks/usePresence';
import { PresenceIndicator } from './PresenceIndicator';

interface OnlineUsersProps {
  users: OnlineUser[];
  currentUserId: string;
}

export function OnlineUsers({ users, currentUserId }: OnlineUsersProps) {
  if (!users || users.length === 0) {
    return (
      <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">
        Ninguém online no momento
      </div>
    );
  }

  // Remover duplicatas usando Set de IDs
  const seenIds = new Set<string>();
  const uniqueUsers = users.filter((u) => {
    if (!u.id || seenIds.has(u.id)) {
      return false;
    }
    seenIds.add(u.id);
    return true;
  });

  // Ordenar: usuário atual primeiro, depois os outros
  const sortedUsers = [
    ...uniqueUsers.filter((u) => u.id === currentUserId),
    ...uniqueUsers.filter((u) => u.id !== currentUserId),
  ];

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 px-3">
        👥 Online ({sortedUsers.length})
      </div>

      <div className="space-y-2 px-2">
        {sortedUsers.length > 0 ? (
          sortedUsers.map((user) => (
            <PresenceIndicator
              key={user.id}
              user={user}
              isCurrentUser={user.id === currentUserId}
            />
          ))
        ) : (
          <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-2">
            Ninguém online
          </div>
        )}
      </div>
    </div>
  );
}
