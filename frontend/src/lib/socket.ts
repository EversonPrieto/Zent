import { io } from 'socket.io-client';

const getToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('zent_token') : null;

export const socket = io(
  process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000',
  {
    transports: ['websocket'],
    auth: {
      token: getToken(),
    },
  }
);
