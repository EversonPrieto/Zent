'use client';

import { useTheme } from '../hooks/useTheme';

import { OnlineUser } from '../hooks/usePresence';

interface PresenceIndicatorProps {
  user: OnlineUser;
  isCurrentUser?: boolean;
}

export function PresenceIndicator({
  user,
  isCurrentUser,
}: PresenceIndicatorProps) {
  const { theme, themeClasses } = useTheme();
  const timeOnline = new Date().getTime() - new Date(user.joinedAt).getTime();
  const minutes = Math.floor(timeOnline / 60000);
  const seconds = Math.floor((timeOnline % 60000) / 1000);

  const timeString =
    minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${themeClasses.bg.subtle} border ${themeClasses.border.primary}`}>
      <div className="relative">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name || 'User avatar'}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center text-sm font-semibold text-violet-400">
            {(user.name || 'U').charAt(0).toUpperCase()}
          </div>
        )}
        <div className={`absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border ${theme === 'dark' ? 'border-slate-900' : 'border-white'}`}></div>
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${themeClasses.text.primary} truncate`}>
          {user.name}
          {isCurrentUser && ' (você)'}
        </p>

        {user.editingTaskId && (
          <p className={`text-xs truncate ${themeClasses.text.secondary}`}>
            ✏️ Editando task
          </p>
        )}

        <p className={`text-xs ${themeClasses.text.muted}`}>
          Online há {timeString}
        </p>
      </div>
    </div>
  );
}
