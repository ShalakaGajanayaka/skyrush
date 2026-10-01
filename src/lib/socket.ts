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

export function useAdminSocket(
  onNewDeposit?: (deposit: any) => void,
  onNewWithdrawal?: (withdrawal: any) => void,
  onPoolUpdated?: (poolData: any) => void,
) {
  const onNewDepositRef = useRef(onNewDeposit);
  onNewDepositRef.current = onNewDeposit;

  const onNewWithdrawalRef = useRef(onNewWithdrawal);
  onNewWithdrawalRef.current = onNewWithdrawal;

  const onPoolUpdatedRef = useRef(onPoolUpdated);
  onPoolUpdatedRef.current = onPoolUpdated;

  useEffect(() => {
    const s = getSocket();

    const joinAdminRoom = () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
      if (token) {
        s.emit('subscribeAdmin', { token });
      }
    };

    if (s.connected) {
      joinAdminRoom();
    }
    s.on('connect', joinAdminRoom);

    const handleNewDeposit = (data: any) => {
      if (onNewDepositRef.current) {
        onNewDepositRef.current(data?.deposit || data);
      }
    };

    const handleNewWithdrawal = (data: any) => {
      if (onNewWithdrawalRef.current) {
        onNewWithdrawalRef.current(data?.withdrawal || data);
      }
    };

    const handlePoolUpdated = (data: any) => {
      if (onPoolUpdatedRef.current) {
        onPoolUpdatedRef.current(data);
      }
    };

    s.on('newDepositSubmitted', handleNewDeposit);
    s.on('newWithdrawalSubmitted', handleNewWithdrawal);
    s.on('globalPoolUpdated', handlePoolUpdated);

    return () => {
      s.off('connect', joinAdminRoom);
      s.off('newDepositSubmitted', handleNewDeposit);
      s.off('newWithdrawalSubmitted', handleNewWithdrawal);
      s.off('globalPoolUpdated', handlePoolUpdated);
    };
  }, []);
}
