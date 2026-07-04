import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

const getToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('zent_token') : null;

let lastConnectedToken: string | null = null;

export const socket: Socket = io(SOCKET_URL, {
  transports: ['websocket'],
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 500,
  auth: {
    token: null,
  },
});

export function ensureSocketConnected() {
  if (typeof window === 'undefined') return false;

  const token = getToken();

  socket.auth = {
    ...(socket.auth as Record<string, unknown>),
    token,
  };

  if (!token) {
    console.warn('[socket] Sem token, não vou conectar');
    return false;
  }

  // Se já está conectado, mas foi conectado com outro token,
  // precisa reconectar para atualizar o handshake do Socket.IO.
  if (socket.connected && lastConnectedToken !== token) {
    console.warn('[socket] token mudou, reconectando socket...', {
      socketId: socket.id,
      hadToken: Boolean(lastConnectedToken),
      hasToken: Boolean(token),
    });

    socket.disconnect();
    socket.connect();

    lastConnectedToken = token;

    return true;
  }

  if (!socket.connected) {
    console.log('[socket] conectando...', {
      url: SOCKET_URL,
      active: socket.active,
      connected: socket.connected,
      socketId: socket.id,
      hasToken: Boolean(token),
    });

    socket.connect();

    lastConnectedToken = token;
  }

  return true;
}

export function refreshSocketAuth() {
  if (typeof window === 'undefined') return;

  const token = getToken();

  socket.auth = {
    ...(socket.auth as Record<string, unknown>),
    token,
  };

  lastConnectedToken = token;

  if (!token) {
    if (socket.connected || socket.active) {
      socket.disconnect();
    }

    return;
  }

  if (socket.connected || socket.active) {
    socket.disconnect();
  }

  socket.connect();
}

export function disconnectSocket() {
  socket.auth = {
    ...(socket.auth as Record<string, unknown>),
    token: null,
  };

  lastConnectedToken = null;

  if (socket.connected || socket.active) {
    socket.disconnect();
  }
}