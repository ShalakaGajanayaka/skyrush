'use client';

import React, { useState, useEffect, useCallback } from 'react';
import MetricCard from '@/components/MetricCard';
import PendingDepositsTable from '@/components/PendingDepositsTable';
import {
  Clock,
  CheckCircle,
  TrendingUp,
  Users,
  Wallet,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Coins,
  DollarSign,
  Sliders,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { fetchStats, fetchDeposits, updateGlobalPool } from '@/lib/api';
import { DashboardStats, DepositRequest } from '@/lib/types';
import { useAdminSocket } from '@/lib/socket';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingDeposits: 0,
    approvedDeposits: 0,
    totalDepositedAmount: 0,
    totalSystemBalance: 0,
    pendingWithdrawals: 0,
    paidWithdrawals: 0,
    totalWithdrawnAmount: 0,
    globalPool: 0,
    companyNetProfit: 0,
  });

  const [pendingDeposits, setPendingDeposits] = useState<DepositRequest[]>([]);
  const [recentApproved, setRecentApproved] = useState<DepositRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isToastError, setIsToastError] = useState(false);

  // Pool adjustment modal
  const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);
  const [poolInput, setPoolInput] = useState('');
  const [isSubmittingPool, setIsSubmittingPool] = useState(false);

  const showToast = useCallback((msg: string, isError = false) => {
    setToastMessage(msg);
    setIsToastError(isError);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [statsData, pendingData, approvedData] = await Promise.all([
        fetchStats(),
        fetchDeposits('PENDING', 50),
        fetchDeposits('APPROVED', 5),
      ]);
      setStats(statsData);
      setPendingDeposits(pendingData);
      setRecentApproved(approvedData);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Hook real-time WebSocket for live reload
  useAdminSocket(
    () => {
      loadData();
    },
    () => {
      loadData();
    }
  );

  const handleUpdatePool = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(poolInput);
    if (isNaN(amt) || amt < 0) {
      showToast('Please enter a valid amount', true);
      return;
    }
    setIsSubmittingPool(true);
    try {
      const res = await updateGlobalPool(amt);
      showToast(`Global Pool liability buffer updated to LKR ${res.globalPool.toLocaleString()}`);
      setIsPoolModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update pool', true);
    } finally {
      setIsSubmittingPool(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Title & Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Executive Mission Control</span>
            <Sparkles className="w-5 h-5 text-amber-400" />
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Real-time deposit approvals, client withdrawals queue, and high-frequency ledger stream
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setPoolInput((stats.globalPool || 0).toString());
              setIsPoolModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Adjust Pool Buffer</span>
          </button>

          <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>PostgreSQL & Redis Sync: Live</span>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid: 8 Cards (4x2 Responsive) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Net House Profit"
          value={`LKR ${(stats.companyNetProfit || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}`}
          subtitle="Realized revenue: Deposits - Payouts - Balances"
          icon={DollarSign}
          variant="emerald"
          highlight={true}
        />
        <MetricCard
          title="Global Pool"
          value={`LKR ${(stats.globalPool || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}`}
          subtitle="Redis persisted liability buffer"
          icon={Coins}
          variant="amber"
          highlight={true}
        />
        <MetricCard
          title="Deposited Volume"
          value={`LKR ${(stats.totalDepositedAmount || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}`}
          subtitle="Total lifetime volume"
          icon={TrendingUp}
          variant="blue"
        />
        <MetricCard
          title="Circulating Wallets"
          value={`LKR ${(stats.totalSystemBalance || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}`}
          subtitle="Active player balance"
          icon={Wallet}
          variant="purple"
        />
        <MetricCard
          title="Pending Deposits"
          value={stats.pendingDeposits}
          subtitle={stats.pendingDeposits > 0 ? 'Action required in queue' : 'All deposits cleared'}
          icon={Clock}
          variant="amber"
          highlight={stats.pendingDeposits > 0}
        />
        <MetricCard
          title="Approved Deposits"
          value={stats.approvedDeposits}
          subtitle="Processed successfully"
          icon={CheckCircle}
          variant="emerald"
        />
        <MetricCard
          title="Pending Withdrawals"
          value={stats.pendingWithdrawals || 0}
          subtitle={
            (stats.pendingWithdrawals || 0) > 0 ? 'Payout queue awaiting action' : 'All payouts cleared'
          }
          icon={TrendingUp}
          variant="red"
          highlight={(stats.pendingWithdrawals || 0) > 0}
        />
        <MetricCard
          title="Paid Withdrawals"
          value={`LKR ${(stats.totalWithdrawnAmount || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}`}
          subtitle={`${stats.paidWithdrawals || 0} payouts sent`}
          icon={Wallet}
          variant="blue"
        />
      </div>

      {/* Main Grid: Pending Table & Quick Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Pending Queue */}
        <div className="lg:col-span-2 rounded-2xl bg-[#0f172a]/70 backdrop-blur-xl border border-white/5 p-6 shadow-xl shadow-black/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-base font-bold text-white">⚡ Pending Deposit Queue</span>
                {stats.pendingDeposits > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-500 text-black animate-bounce">
                    {stats.pendingDeposits} PENDING
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500 font-mono">Zero-latency live stream</span>
            </div>

            <PendingDepositsTable
              deposits={pendingDeposits}
              onActionComplete={loadData}
              showToast={showToast}
            />
          </div>

          <div className="pt-4 border-t border-white/5 mt-4 flex items-center justify-between">
            <span className="text-xs text-gray-400">Review pending slips before manual confirmation</span>
            <Link
              href="/deposits"
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>Full Deposit History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right 1 Col: Quick Info & Recent Activity */}
        <div className="space-y-6">
          {/* Quick Notice Card */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border border-blue-500/20 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs mb-2">
              <ShieldAlert className="w-4 h-4" />
              <span>Real-Time Operator Verification</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              When a player sends an iPay QR or UPay transfer and submits the reference slip, review it here.
              Clicking <b className="text-emerald-400">Approve</b> pushes the balance directly to the player&apos;s
              open game screen within milliseconds via Socket.IO!
            </p>
          </div>

          {/* Recent Approved Snapshot */}
          <div className="rounded-2xl bg-[#0f172a]/70 backdrop-blur-xl border border-white/5 p-5 shadow-xl shadow-black/30">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              Recently Approved Credits
            </h3>
            {recentApproved.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">No approved deposits yet</p>
            ) : (
              <div className="space-y-2.5">
                {recentApproved.map((d) => (
                  <div
                    key={d.id}
                    className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{d.username}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{d.referenceNumber}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-emerald-400">
                        +{d.currency} {Number(d.amount).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-gray-400 uppercase">{d.paymentMethod}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Adjust Global Pool Modal */}
      {isPoolModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-[#0f172a] border border-amber-500/30 p-6 shadow-2xl shadow-amber-500/10">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Adjust Global Pool Buffer</h3>
              </div>
              <button
                onClick={() => setIsPoolModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePool} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Pool Buffer Amount (LKR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={poolInput}
                  onChange={(e) => setPoolInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-amber-400"
                  placeholder="e.g. 50000"
                  required
                />
                <p className="text-[11px] text-gray-400 mt-1.5">
                  This value is persisted directly into Redis and represents the company liability buffer used to cap multipliers and cover player payouts.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsPoolModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPool}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 transition-colors disabled:opacity-50"
                >
                  {isSubmittingPool ? 'Saving...' : 'Save to Redis'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Local Toast Alert */}
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
