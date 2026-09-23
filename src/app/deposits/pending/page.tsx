'use client';

import React, { useState, useEffect, useCallback } from 'react';
import PendingDepositsTable from '@/components/PendingDepositsTable';
import { Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { fetchDeposits } from '@/lib/api';
import { DepositRequest } from '@/lib/types';
import { useAdminSocket } from '@/lib/socket';

export default function PendingDepositsPage() {
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isToastError, setIsToastError] = useState(false);

  const showToast = useCallback((msg: string, isError = false) => {
    setToastMessage(msg);
    setIsToastError(isError);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchDeposits('PENDING', 100);
      setDeposits(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load pending deposits', true);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useAdminSocket(() => {
    loadData();
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-400" />
            <span>Pending Deposit Approvals</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Review and verify client payment slips and credit balances directly to player accounts
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-gray-200 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      <div className="rounded-2xl bg-[#0f172a]/70 backdrop-blur-xl border border-white/5 p-6 shadow-xl shadow-black/30">
        <PendingDepositsTable
          deposits={deposits}
          onActionComplete={loadData}
          showToast={showToast}
        />
      </div>

      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-xs font-bold text-white shadow-2xl backdrop-blur-xl border animate-slide-up ${
            isToastError ? 'bg-red-600/90 border-red-500/40' : 'bg-emerald-600/90 border-emerald-500/40'
          }`}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
