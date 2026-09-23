'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function useAdminSocket(onNewDeposit?: (deposit: any) => void) {
  const onNewDepositRef = useRef(onNewDeposit);
  onNewDepositRef.current = onNewDeposit;

  useEffect(() => {
    const s = getSocket();

    const handleNewDeposit = (data: any) => {
      if (onNewDepositRef.current) {
        onNewDepositRef.current(data?.deposit || data);
      }
    };

    s.on('newDepositSubmitted', handleNewDeposit);

    return () => {
      s.off('newDepositSubmitted', handleNewDeposit);
    };
  }, []);
}
