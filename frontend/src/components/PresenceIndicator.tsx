'use client';

import Image from 'next/image';
import { OnlineUser } from '../hooks/usePresence';

interface PresenceIndicatorProps {
  user: OnlineUser;
  isCurrentUser?: boolean;
}

export function PresenceIndicator({
  user,
  isCurrentUser,
}: PresenceIndicatorProps) {
  // Calcular tempo online
  const timeOnline = new Date().getTime() - new Date(user.joinedAt).getTime();
  const minutes = Math.floor(timeOnline / 60000);
  const seconds = Math.floor((timeOnline % 60000) / 1000);

  const timeString =
    minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
      <div className="relative">
        <Image
          src={user.avatarUrl || '/avatar-placeholder.png'}
          alt={user.name || 'User avatar'}
          width={32}
          height={32}
          className="rounded-full"
        />
        <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-slate-900"></div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
          {user.name}
          {isCurrentUser && ' (você)'}
        </p>

        {user.editingTaskId && (
          <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
            ✏️ Editando task
          </p>
        )}

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Online há {timeString}
        </p>
      </div>
    </div>
  );
}
