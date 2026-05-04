import { useState, useEffect, useCallback } from 'react';
import { socket } from '../lib/socket.js';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const disconnect = useCallback(() => {
    socket.disconnect();
  }, []);

  return { isConnected, disconnect };
}
