'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import ManualCreditModal from './ManualCreditModal';
import { useAdminSocket } from '@/lib/socket';
import { fetchStats } from '@/lib/api';
import Login from './Login';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingWithdrawalCount, setPendingWithdrawalCount] = useState(0);
  const [isManualCreditOpen, setIsManualCreditOpen] = useState(false);
  const [prefillUser, setPrefillUser] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isToastError, setIsToastError] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const showToast = useCallback((msg: string, isError: boolean = false) => {
    setToastMessage(msg);
    setIsToastError(isError);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    setIsAuthenticated(!!token);

    const handleUnauthorized = () => {
      setIsAuthenticated(false);
      showToast('⚠️ Session expired or unauthorized. Please log in again.', true);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [showToast]);

  const playNotificationChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      // Audio chime synthesis using Web Audio API
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {}
  }, [soundEnabled]);

  const loadPendingCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const stats = await fetchStats();
      setPendingCount(stats.pendingDeposits || 0);
      setPendingWithdrawalCount(stats.pendingWithdrawals || 0);
    } catch {}
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadPendingCount();
    const interval = setInterval(loadPendingCount, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated, loadPendingCount]);

  // Hook real-time WebSocket for new deposits and withdrawals
  useAdminSocket(
    (deposit) => {
      playNotificationChime();
      setPendingCount((prev) => prev + 1);
      showToast(
        `⚡ New Deposit Submitted: ${deposit.username} - ${deposit.currency} ${deposit.amount} (${deposit.paymentMethod?.toUpperCase() || 'MANUAL'})`
      );
    },
    (withdrawal) => {
      playNotificationChime();
      setPendingWithdrawalCount((prev) => prev + 1);
      showToast(
        `💸 New Withdrawal Requested: ${withdrawal.username} - ${withdrawal.currency} ${withdrawal.amount} (${withdrawal.method?.toUpperCase() || 'PAYOUT'})`
      );
    }
  );

  const handleOpenCredit = (username?: string) => {
    setPrefillUser(username || '');
    setIsManualCreditOpen(true);
  };

  if (isAuthenticated === null) {
    return <div className="min-h-screen bg-[#080c14] flex items-center justify-center text-white"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>;
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex min-h-screen bg-[#080c14] text-gray-100 font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* Background radial glow effects */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_15%_15%,rgba(59,130,246,0.06)_0%,transparent_40%),radial-gradient(circle_at_85%_85%,rgba(139,92,246,0.06)_0%,transparent_40%)]" />

      {/* Main Sidebar */}
      <Sidebar
        pendingCount={pendingCount}
        pendingWithdrawalCount={pendingWithdrawalCount}
        onOpenManualCredit={() => handleOpenCredit()}
      />

      {/* Main Body Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled((prev) => !prev)}
        />

        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Direct Credit Modal */}
      <ManualCreditModal
        isOpen={isManualCreditOpen}
        onClose={() => setIsManualCreditOpen(false)}
        prefillUsername={prefillUser}
        onCreditSuccess={(user, amount) => {
          showToast(`✅ Successfully credited $${Number(amount).toFixed(2)} USD to ${user?.username || prefillUser}!`);
          loadPendingCount();
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl font-semibold text-xs flex items-center gap-3 backdrop-blur-xl border animate-slide-up ${
            isToastError
              ? 'bg-red-600/90 border-red-500/40 text-white'
              : 'bg-emerald-600/90 border-emerald-500/40 text-white'
          }`}
        >
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
