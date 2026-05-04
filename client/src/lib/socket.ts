import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || (import.meta.env.DEV ? 'http://localhost:3001' : undefined);

export const socket = io(SERVER_URL, {
  autoConnect: false,
});

export type TypedSocket = typeof socket;
