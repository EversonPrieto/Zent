'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { api } from '../lib/api';
import { ensureSocketConnected, socket } from '../lib/socket';
import {
  Activity as ActivityIcon,
  Clock,
  CheckCircle2,
  PlusCircle,
  Edit2,
  Trash2,
  MessageSquare,
  FolderKanban,
  Users,
  Loader2,
  Wifi,
  WifiOff,
  Sparkles,
} from 'lucide-react';

type ActivityItem = {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  workspaceId?: string;
  projectId?: string;
  user?: {
    id: string;
    name: string;
  } | null;
};

type ActivityJoinResponse = {
  ok?: boolean;
  workspaceId?: string;
  room?: string;
  message?: string;
};

function getActivityIcon(type: string) {
  const iconMap: Record<
    string,
    { icon: typeof ActivityIcon; color: string; bg: string }
  > = {
    TASK_CREATED: {
      icon: PlusCircle,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    TASK_UPDATED: {
      icon: Edit2,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    TASK_DELETED: {
      icon: Trash2,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
    },
    TASK_STATUS_CHANGED: {
      icon: CheckCircle2,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
    },
    TASK_MOVED: {
      icon: CheckCircle2,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
    },
    COMMENT_CREATED: {
      icon: MessageSquare,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    PROJECT_CREATED: {
      icon: FolderKanban,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
    },
    MEMBER_ADDED: {
      icon: Users,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
  };

  return (
    iconMap[type] || {
      icon: ActivityIcon,
      color: 'text-zinc-400',
      bg: 'bg-zinc-500/10',
    }
  );
}

function translateActivityDescription(description: string) {
  return description
    .replaceAll('in_review', 'EM REVISÃO')
    .replaceAll('IN_REVIEW', 'EM REVISÃO')
    .replaceAll('in_progress', 'EM PROGRESSO')
    .replaceAll('IN_PROGRESS', 'EM PROGRESSO')
    .replaceAll('todo', 'A FAZER')
    .replaceAll('TODO', 'A FAZER')
    .replaceAll('done', 'CONCLUÍDO')
    .replaceAll('DONE', 'CONCLUÍDO')
    .replaceAll('aborted', 'CANCELADO')
    .replaceAll('ABORTED', 'CANCELADO');
}

function getRelativeDate(date: string) {
  const now = new Date();
  const activityDate = new Date(date);
  const diffMs = now.getTime() - activityDate.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return 'ontem';
  if (diffDays < 7) return `${diffDays}d`;

  return activityDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
}

export default function ActivityFeed({
  workspaceId,
  projectId,
}: {
  workspaceId: string;
  projectId: string;
}) {
  const { themeClasses } = useTheme();

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [joinedActivityRoom, setJoinedActivityRoom] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadActivities = useCallback(
    async (showLoading = false) => {
      if (!workspaceId || !projectId) return;

      try {
        if (showLoading) setLoading(true);

        setError(null);

        const data = await api(`/activities?projectId=${projectId}`, {
          workspaceId,
        });

        setActivities(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Erro ao carregar atividades:', err);
        setError('Erro ao carregar atividades');
        setActivities([]);
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [workspaceId, projectId],
  );

  useEffect(() => {
    if (!workspaceId || !projectId) return;

    loadActivities(true);

    const emitActivityJoin = () => {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('zent_token')
          : null;

      console.log('[ActivityFeed activity:join emit]', {
        workspaceId,
        projectId,
        socketConnected: socket.connected,
        socketId: socket.id,
        hasToken: Boolean(token),
      });

      if (!token) {
        setSocketConnected(socket.connected);
        setJoinedActivityRoom(false);
        return;
      }

      socket.emit(
        'activity:join',
        {
          workspaceId,
        },
        (response: ActivityJoinResponse) => {
          console.log('[ActivityFeed activity:join ack]', response);

          if (response?.ok && response.workspaceId === workspaceId) {
            setSocketConnected(true);
            setJoinedActivityRoom(true);
            return;
          }

          setJoinedActivityRoom(false);
        },
      );
    };

    const handleConnect = () => {
      console.log('🟢 Socket conectado no ActivityFeed:', socket.id);

      setSocketConnected(true);

      emitActivityJoin();
    };

    const handleDisconnect = () => {
      console.log('🔴 Socket desconectado no ActivityFeed');

      setSocketConnected(false);
      setJoinedActivityRoom(false);
    };

    const handleConnectError = (error: Error) => {
      console.error('❌ Socket connection error no ActivityFeed:', error);

      setSocketConnected(false);
      setJoinedActivityRoom(false);
    };

    const handleActivityJoined = (data: ActivityJoinResponse) => {
      console.log('[ActivityFeed activity:joined]', data);

      if (data?.workspaceId !== workspaceId) return;

      setSocketConnected(true);
      setJoinedActivityRoom(true);
    };

    const handleActivityUnauthorized = (data: ActivityJoinResponse) => {
      console.warn('[ActivityFeed activity:unauthorized]', data);

      if (data?.workspaceId && data.workspaceId !== workspaceId) return;

      setJoinedActivityRoom(false);
    };

    const handleActivityNew = (newActivity: ActivityItem) => {
      console.log('🔥 Nova activity recebida:', newActivity);

      if (!newActivity?.id) return;

      if (newActivity.projectId && newActivity.projectId !== projectId) {
        return;
      }

      if (newActivity.workspaceId && newActivity.workspaceId !== workspaceId) {
        return;
      }

      setActivities((prev) => {
        const exists = prev.some((activity) => activity.id === newActivity.id);
        if (exists) return prev;

        const newActivities = [newActivity, ...prev];

        return newActivities.slice(0, 50);
      });

      setSocketConnected(true);
      setJoinedActivityRoom(true);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('activity:joined', handleActivityJoined);
    socket.on('activity:unauthorized', handleActivityUnauthorized);
    socket.on('activity:new', handleActivityNew);

    const connectStarted = ensureSocketConnected();

    if (socket.connected) {
      setSocketConnected(true);
      emitActivityJoin();
    } else if (!connectStarted) {
      console.warn('[ActivityFeed] socket não iniciou conexão');
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('activity:joined', handleActivityJoined);
      socket.off('activity:unauthorized', handleActivityUnauthorized);
      socket.off('activity:new', handleActivityNew);
    };
  }, [workspaceId, projectId, loadActivities]);

  function formatDate(date: string) {
    return new Date(date).toLocaleString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });
  }

  const hasActivities = activities.length > 0;
  const isLive = socketConnected && joinedActivityRoom;

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ActivityIcon className="h-4 w-4 flex-shrink-0 text-violet-400" />

          <h3 className={`text-sm font-medium ${themeClasses.text.primary}`}>
            N° de Atividades
          </h3>

          {hasActivities && (
            <span
              className={`rounded-full ${themeClasses.bg.subtle} px-2 py-0.5 text-xs ${themeClasses.text.tertiary}`}
            >
              {activities.length}
            </span>
          )}
        </div>

        {isLive ? (
          <div
            className="flex items-center gap-1 text-xs text-emerald-400"
            title="Conexão em tempo real ativa"
          >
            <Wifi className="h-3 w-3" />
            <span className="hidden sm:inline">Live</span>
          </div>
        ) : (
          <div
            className={`flex items-center gap-1 text-xs ${themeClasses.text.muted}`}
            title="Conexão em tempo real inativa"
          >
            <WifiOff className="h-3 w-3" />
            <span className="hidden sm:inline">Offline</span>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center">
          <p className="text-xs text-red-400">{error}</p>

          <button
            onClick={() => loadActivities(true)}
            className="mt-2 text-xs text-red-400 hover:text-red-300"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && !error && !hasActivities && (
        <div
          className={`rounded-xl border border-dashed ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-6 text-center`}
        >
          <Sparkles
            className={`mx-auto mb-2 h-8 w-8 ${themeClasses.text.muted}`}
          />

          <p className={`text-sm ${themeClasses.text.tertiary}`}>
            Nenhuma atividade ainda
          </p>

          <p className={`mt-1 text-xs ${themeClasses.text.muted}`}>
            Atividades aparecerão aqui em tempo real
          </p>
        </div>
      )}

      {!loading && !error && hasActivities && (
        <div className="custom-scrollbar max-h-[400px] space-y-2 overflow-y-auto overflow-x-hidden pr-1">
          {activities.map((act, index) => {
            const { icon: Icon, color, bg } = getActivityIcon(act.type);
            const isNew = index === 0 && !loading;

            return (
              <div
                key={act.id}
                className={`group relative rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} p-3 transition-all hover:scale-[1.02] hover:${themeClasses.border.hover} hover:shadow-lg ${
                  isNew
                    ? 'animate-in slide-in-from-top-2 fade-in duration-300'
                    : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  <div
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${bg}`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${color}`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`break-words text-xs ${themeClasses.text.secondary} leading-relaxed`}
                    >
                      <span
                        className={`font-medium ${themeClasses.text.primary}`}
                      >
                        {act.user?.name ?? 'Alguém'}
                      </span>{' '}
                      {translateActivityDescription(act.description)}
                    </p>

                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Clock
                        className={`h-3 w-3 ${themeClasses.text.muted} flex-shrink-0`}
                      />

                      <p className={`text-[10px] ${themeClasses.text.muted}`}>
                        {getRelativeDate(act.createdAt)}
                      </p>

                      <span className={themeClasses.text.muted}>•</span>

                      <p
                        className={`text-[10px] ${themeClasses.text.muted} opacity-0 transition-opacity group-hover:opacity-100`}
                      >
                        {formatDate(act.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="absolute left-0 top-0 h-full w-0.5 rounded-full bg-gradient-to-b from-violet-500 to-indigo-500 opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}