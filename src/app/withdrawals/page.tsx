'use client';

import React, { useState, useEffect, useCallback } from 'react';
import WithdrawalsTable from '@/components/WithdrawalsTable';
import { ArrowUpRight, RefreshCw, Filter, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { fetchWithdrawals } from '@/lib/api';
import { WithdrawalRequest } from '@/lib/types';
import { useAdminSocket } from '@/lib/socket';

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isToastError, setIsToastError] = useState(false);

  const showToast = useCallback((msg: string, isError = false) => {
    setToastMessage(msg);
    setIsToastError(isError);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  const loadData = useCallback(async () => {
    if (typeof window !== 'undefined' && !localStorage.getItem('admin_token')) {
      setLoading(false);
      return;
    }
    try {
      const data = await fetchWithdrawals(filter, 100);
      setWithdrawals(data);
    } catch (err: any) {
      if (err?.message !== 'Unauthorized') {
        showToast(err.message || 'Failed to load withdrawals', true);
      }
    } finally {
      setLoading(false);
    }
  }, [filter, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Hook real-time updates from WebSocket
  useAdminSocket(
    undefined,
    () => {
      loadData();
    }
  );

  const pendingCount = withdrawals.filter((w) => w.status === 'PENDING').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <ArrowUpRight className="w-6 h-6 text-rose-400" />
            <span>Withdrawals & Payout Requests</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Review client withdrawal requests, view bank/wallet payout credentials, and mark payouts as fulfilled or refunded.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-gray-200 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-3">
        {[
          { key: 'ALL', label: 'All Requests' },
          { key: 'PENDING', label: 'Pending Payout', badge: pendingCount > 0 ? pendingCount : undefined },
          { key: 'PAID', label: 'Paid / Completed' },
          { key: 'REJECTED', label: 'Rejected & Refunded' },
        ].map((tab) => {
          const isActive = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-md shadow-blue-600/10'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.03]'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Content Table */}
      <div className="rounded-2xl bg-[#0f172a]/70 backdrop-blur-xl border border-white/5 p-6 shadow-xl shadow-black/30">
        <WithdrawalsTable
          withdrawals={withdrawals}
          onActionComplete={loadData}
          showToast={showToast}
        />
      </div>

      {/* Toast Notification */}
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
