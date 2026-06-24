'use client';

import { useTheme } from '../hooks/useTheme';

import { OnlineUser } from '../hooks/usePresence';
import { PresenceIndicator } from './PresenceIndicator';

interface OnlineUsersProps {
  users: OnlineUser[];
  currentUserId: string;
}

export function OnlineUsers({ users, currentUserId }: OnlineUsersProps) {
  const { themeClasses } = useTheme();

  if (!users || users.length === 0) {
    return (
      <div className={`text-center text-sm ${themeClasses.text.muted} py-4`}>
        Ninguém online no momento
      </div>
    );
  }

  const seenIds = new Set<string>();
  const uniqueUsers = users.filter((u) => {
    if (!u.id || seenIds.has(u.id)) {
      return false;
    }
    seenIds.add(u.id);
    return true;
  });

  const sortedUsers = [
    ...uniqueUsers.filter((u) => u.id === currentUserId),
    ...uniqueUsers.filter((u) => u.id !== currentUserId),
  ];

  const shouldScroll = sortedUsers.length > 4;

  return (
    <div className="space-y-2">
      <div className={`text-sm font-semibold ${themeClasses.text.secondary} px-3`}>
        👥 Online ({sortedUsers.length})
      </div>

      <div
        className={`space-y-2 px-2 ${shouldScroll ? 'max-h-[170px] overflow-y-auto pr-1' : ''}`}
      >
        {sortedUsers.length > 0 ? (
          sortedUsers.map((user) => (
            <PresenceIndicator
              key={user.id}
              user={user}
              isCurrentUser={user.id === currentUserId}
            />
          ))
        ) : (
          <div className={`text-center text-sm ${themeClasses.text.muted} py-2`}>
            Ninguém online
          </div>
        )}
      </div>
    </div>
  );
}
