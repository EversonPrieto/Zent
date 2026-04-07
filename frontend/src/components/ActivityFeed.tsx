'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { io, Socket } from 'socket.io-client';
import {
  Activity,
  Clock,
  User,
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
  Sparkles
} from 'lucide-react';

type Activity = {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
  } | null;
};

// Função para obter o ícone baseado no tipo de atividade
function getActivityIcon(type: string) {
  const iconMap: Record<string, { icon: typeof Activity; color: string; bg: string }> = {
    'TASK_CREATED': { icon: PlusCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    'TASK_UPDATED': { icon: Edit2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    'TASK_DELETED': { icon: Trash2, color: 'text-red-400', bg: 'bg-red-500/10' },
    'TASK_STATUS_CHANGED': { icon: CheckCircle2, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    'COMMENT_CREATED': { icon: MessageSquare, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    'PROJECT_CREATED': { icon: FolderKanban, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    'MEMBER_ADDED': { icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  };
  
  return iconMap[type] || { icon: Activity, color: 'text-zinc-400', bg: 'bg-zinc-500/10' };
}

// Função para formatar data relativa
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
  return activityDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function ActivityFeed({
  workspaceId,
  projectId,
}: {
  workspaceId: string;
  projectId: string;
}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;

    let socket: Socket;

    async function load() {
      try {
        setError(null);
        const data = await api(
          `/activities?projectId=${projectId}`,
          { workspaceId },
        );

        setActivities(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Erro ao carregar atividades:', err);
        setError('Erro ao carregar atividades');
        setActivities([]);
      } finally {
        setLoading(false);
      }
    }

    load();

    // Socket connection
    try {
      socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socket.on('connect', () => {
        console.log('🟢 Socket conectado:', socket.id);
        setSocketConnected(true);
        socket.emit('join', workspaceId);
      });

      socket.on('disconnect', () => {
        console.log('🔴 Socket desconectado');
        setSocketConnected(false);
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        setSocketConnected(false);
      });

      socket.on('activity:new', (newActivity: Activity) => {
        console.log('🔥 Nova activity recebida:', newActivity);

        setActivities((prev) => {
          const exists = prev.some((a) => a.id === newActivity.id);
          if (exists) return prev;
          
          // Adicionar nova atividade no topo e limitar a 50 itens
          const newActivities = [newActivity, ...prev];
          return newActivities.slice(0, 50);
        });
      });
    } catch (err) {
      console.error('Failed to connect to socket:', err);
    }

    return () => {
      if (socket) {
        socket.off('activity:new');
        socket.disconnect();
      }
    };
  }, [workspaceId, projectId]);

  function formatDate(date: string) {
    return new Date(date).toLocaleString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });
  }

  const hasActivities = activities.length > 0;

  return (
    <div className="w-full lg:w-80 flex-shrink-0">
      <div className="sticky top-24">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-violet-400" />
            <h3 className="text-sm font-semibold text-white">Atividade recente</h3>
            {hasActivities && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-zinc-400">
                {activities.length}
              </span>
            )}
          </div>
          
          {/* Connection Status */}
          {socketConnected ? (
            <div className="flex items-center gap-1 text-xs text-emerald-400" title="Conexão em tempo real ativa">
              <Wifi className="h-3 w-3" />
              <span className="hidden sm:inline">Live</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-zinc-500" title="Conexão em tempo real inativa">
              <WifiOff className="h-3 w-3" />
              <span className="hidden sm:inline">Offline</span>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center">
            <p className="text-xs text-red-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-xs text-red-400 hover:text-red-300"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && !hasActivities && (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-6 text-center">
            <Sparkles className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">
              Nenhuma atividade ainda
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              Atividades aparecerão aqui em tempo real
            </p>
          </div>
        )}

        {/* Activities List */}
        {!loading && !error && hasActivities && (
          <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 custom-scrollbar">
            {activities.map((act, index) => {
              const { icon: Icon, color, bg } = getActivityIcon(act.type);
              const isNew = index === 0 && !loading;
              
              return (
                <div
                  key={act.id}
                  className={`group relative rounded-xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 p-3 transition-all hover:scale-[1.02] hover:border-white/20 hover:shadow-lg ${
                    isNew ? 'animate-in slide-in-from-top-2 fade-in duration-300' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${bg}`}>
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Description */}
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        <span className="font-medium text-white">
                          {act.user?.name ?? 'Alguém'}
                        </span>{' '}
                        {act.description}
                      </p>

                      {/* Timestamp */}
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-zinc-500" />
                        <p className="text-[10px] text-zinc-500">
                          {getRelativeDate(act.createdAt)}
                        </p>
                        <span className="text-zinc-600">•</span>
                        <p className="text-[10px] text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          {formatDate(act.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Hover indicator line */}
                  <div className="absolute left-0 top-0 h-full w-0.5 rounded-full bg-gradient-to-b from-violet-500 to-indigo-500 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom scrollbar styles */}
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