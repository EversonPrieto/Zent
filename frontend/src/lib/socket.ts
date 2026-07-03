import { io, Socket } from 'socket.io-client';

const getToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('zent_token') : null;

export const socket: Socket = io(
  process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000',
  {
    transports: ['websocket'],
    auth: {
      token: getToken(),
    },
  },
);

export function refreshSocketAuth() {
  if (typeof window === 'undefined') return;

  const token = getToken();

  socket.auth = {
    ...(socket.auth as Record<string, unknown>),
    token,
  };

  if (socket.connected) {
    socket.disconnect();
  }

  if (token) {
    socket.connect();
  }
}

export function disconnectSocket() {
  socket.auth = {
    ...(socket.auth as Record<string, unknown>),
    token: null,
  };

  if (socket.connected || socket.active) {
    socket.disconnect();
  }
}
