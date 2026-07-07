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
    <div
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-violet-500/5 ${
        isCurrentUser
          ? 'bg-violet-500/5 ring-1 ring-violet-500/20'
          : `${themeClasses.bg.subtle} border ${themeClasses.border.primary}`
      }`}
      title={`${user.name}${isCurrentUser ? ' (você)' : ''}`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name || 'User avatar'}
            className="h-8 w-8 rounded-full object-cover ring-2 ring-white/10"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 text-xs font-bold text-violet-400 ring-2 ring-white/10">
            {(user.name || 'U').charAt(0).toUpperCase()}
          </div>
        )}
        
        {/* Online Dot */}
        <div
          className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 bg-emerald-500 shadow-lg ${
            theme === 'dark' ? 'border-zinc-900' : 'border-white'
          }`}
        />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-semibold ${themeClasses.text.primary}`}>
          {user.name}
          {isCurrentUser && (
            <span className="ml-1.5 text-xs font-medium text-violet-400">(você)</span>
          )}
        </p>

        {user.editingTaskId ? (
          <p className={`truncate text-xs font-medium text-amber-400`}>
            ✏️ Editando task
          </p>
        ) : (
          <p className={`truncate text-xs ${themeClasses.text.tertiary}`}>
            Online há {timeString}
          </p>
        )}
      </div>
    </div>
  );
}