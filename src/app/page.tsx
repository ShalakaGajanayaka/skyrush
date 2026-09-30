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
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  History,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { fetchStats, fetchDeposits, adjustGlobalPool, fetchPoolLogs } from '@/lib/api';
import { DashboardStats, DepositRequest, PoolAuditLog } from '@/lib/types';
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
    pendingGlobalPool: null,
    companyNetProfit: 0,
  });

  const [pendingDeposits, setPendingDeposits] = useState<DepositRequest[]>([]);
  const [recentApproved, setRecentApproved] = useState<DepositRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isToastError, setIsToastError] = useState(false);

  // Pool adjustment modal states
  const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);
  const [poolActionTab, setPoolActionTab] = useState<'TOP_UP' | 'PROFIT_SKIM' | 'SET_TARGET'>('TOP_UP');
  const [poolInputAmount, setPoolInputAmount] = useState<string>('');
  const [poolNote, setPoolNote] = useState<string>('');
  const [isSubmittingPool, setIsSubmittingPool] = useState(false);
  const [auditLogs, setAuditLogs] = useState<PoolAuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

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
      const [statsData, pendingData, approvedData] = await Promise.all([
        fetchStats(),
        fetchDeposits('PENDING', 50),
        fetchDeposits('APPROVED', 5),
      ]);
      setStats(statsData);
      setPendingDeposits(pendingData);
      setRecentApproved(approvedData);
    } catch (err: any) {
      if (err?.message !== 'Unauthorized') {
        console.error('Error fetching dashboard data:', err);
      }
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
    },
    (poolData) => {
      if (poolData?.globalPool !== undefined) {
        setStats((prev) => ({
          ...prev,
          globalPool: poolData.globalPool,
          pendingGlobalPool: poolData.pendingGlobalPool ?? null,
        }));
      }
    }
  );

  const openPoolModal = async () => {
    setPoolActionTab('TOP_UP');
    setPoolInputAmount('');
    setPoolNote('');
    setIsPoolModalOpen(true);
    setLoadingLogs(true);
    try {
      const logs = await fetchPoolLogs(5);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load pool audit logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleAdjustPool = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(poolInputAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid positive amount', true);
      return;
    }

    const currentPool = stats.globalPool || 0;
    if (poolActionTab === 'PROFIT_SKIM' && currentPool - amt < 20) {
      showToast(`Cannot skim: Resulting pool ($ ${(currentPool - amt).toLocaleString()} USD) must stay at or above safety floor $20.00 USD`, true);
      return;
    }
    if (poolActionTab === 'SET_TARGET' && amt < 20) {
      showToast('Target pool must be at least $20.00 USD', true);
      return;
    }

    setIsSubmittingPool(true);
    try {
      const res = await adjustGlobalPool({
        action: poolActionTab,
        amount: amt,
        note: poolNote.trim() || undefined,
        adminUser: 'Super Admin',
      });
      if (res.pending) {
        showToast(`Scheduled: Global Pool will update to $ ${(res.target ?? amt).toLocaleString()} USD on Next Round ✈️`);
      } else {
        showToast(`Success: Global Pool buffer adjusted to $ ${res.globalPool.toLocaleString()} USD`);
      }
      setIsPoolModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to adjust pool buffer', true);
    } finally {
      setIsSubmittingPool(false);
    }
  };

  // Live preview calculation for the modal
  const numInput = parseFloat(poolInputAmount) || 0;
  const currentPoolVal = stats.globalPool || 0;
  let previewTarget = currentPoolVal;
  if (poolActionTab === 'TOP_UP') previewTarget = currentPoolVal + numInput;
  else if (poolActionTab === 'PROFIT_SKIM') previewTarget = currentPoolVal - numInput;
  else if (poolActionTab === 'SET_TARGET') previewTarget = numInput;

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
            onClick={openPoolModal}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/40 text-amber-400 hover:border-amber-400 hover:from-amber-500/30 text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Manage Pool Buffer</span>
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
          value={`$ ${(stats.companyNetProfit || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })} USD`}
          subtitle="Realized revenue: Deposits - Payouts - Balances"
          icon={DollarSign}
          variant="emerald"
          highlight={true}
        />
        <MetricCard
          title="Global Pool"
          value={`$ ${(stats.globalPool || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })} USD`}
          subtitle={
            stats.pendingGlobalPool
              ? `⏳ Staged Next Round: $ ${stats.pendingGlobalPool.toLocaleString()} USD`
              : "Active liability buffer in Redis"
          }
          icon={Coins}
          variant="amber"
          highlight={true}
        />
        <MetricCard
          title="Deposited Volume"
          value={`$ ${(stats.totalDepositedAmount || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })} USD`}
          subtitle="Total lifetime volume"
          icon={TrendingUp}
          variant="blue"
        />
        <MetricCard
          title="Circulating Wallets"
          value={`$ ${(stats.totalSystemBalance || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })} USD`}
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
          value={`$ ${(stats.totalWithdrawnAmount || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })} USD`}
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

      {/* Adjust Global Pool Modal (Full Enterprise Design) */}
      {isPoolModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xl rounded-3xl bg-[#0b1222] border border-amber-500/30 p-6 shadow-2xl shadow-black/60 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Global Pool Buffer Manager</h3>
                  <p className="text-[11px] text-gray-400">
                    Real-time liability buffer & payout solvency control
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPoolModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Pool & Capacity Snapshot */}
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900/80 border border-amber-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80">
                    Current Active Buffer (In Redis)
                  </span>
                  <div className="text-2xl font-black text-white mt-0.5 flex flex-wrap items-center gap-2">
                    <span>$ {(stats.globalPool || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</span>
                    {stats.pendingGlobalPool && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                        ⏳ Next Round: $ {stats.pendingGlobalPool.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Safety Floor Limit
                  </span>
                  <div className="text-xs font-mono font-bold text-emerald-400 mt-1">
                    Min $20.00 USD
                  </div>
                </div>
              </div>

              {/* Multiplier capacity indicator */}
              <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-[11px] text-gray-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Current buffer safely supports up to{' '}
                  <strong className="text-amber-400">
                    {((stats.globalPool || 0) / 2).toFixed(1)}x multiplier
                  </strong>{' '}
                  on a $2.00 USD single bet before triggering dynamic liability crash.
                </span>
              </div>
            </div>

            {/* Operation Mode Tabs */}
            <div className="mt-5 grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-900 border border-white/5">
              <button
                type="button"
                onClick={() => {
                  setPoolActionTab('TOP_UP');
                  setPoolInputAmount('');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  poolActionTab === 'TOP_UP'
                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Quick Top-Up</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPoolActionTab('PROFIT_SKIM');
                  setPoolInputAmount('');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  poolActionTab === 'PROFIT_SKIM'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>Profit Skim</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPoolActionTab('SET_TARGET');
                  setPoolInputAmount('');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  poolActionTab === 'SET_TARGET'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Set Target</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAdjustPool} className="mt-4 space-y-4">
              {/* Presets */}
              {poolActionTab === 'TOP_UP' && (
                <div>
                  <span className="block text-[11px] font-semibold text-gray-400 mb-2">
                    Quick Inject Presets ($ USD):
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {[25, 50, 100, 250].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setPoolInputAmount(preset.toString())}
                        className="py-1.5 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-emerald-400 text-xs font-mono font-bold transition-colors cursor-pointer"
                      >
                        +${preset}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {poolActionTab === 'PROFIT_SKIM' && (
                <div>
                  <span className="block text-[11px] font-semibold text-gray-400 mb-2">
                    Quick Skim Presets ($ USD):
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 25, 50, 100].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setPoolInputAmount(preset.toString())}
                        className="py-1.5 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-amber-400 text-xs font-mono font-bold transition-colors cursor-pointer"
                      >
                        -${preset}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  {poolActionTab === 'TOP_UP' && 'Amount to Add ($ USD)'}
                  {poolActionTab === 'PROFIT_SKIM' && 'Amount to Skim / Extract ($ USD)'}
                  {poolActionTab === 'SET_TARGET' && 'New Target Pool Buffer ($ USD)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={poolActionTab === 'SET_TARGET' ? 20 : 1}
                  value={poolInputAmount}
                  onChange={(e) => setPoolInputAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-amber-400"
                  placeholder={poolActionTab === 'SET_TARGET' ? 'Min 20' : 'e.g. 50'}
                  required
                />
              </div>

              {/* Reason / Note */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Audit Reason / Note (Optional)
                </label>
                <input
                  type="text"
                  value={poolNote}
                  onChange={(e) => setPoolNote(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  placeholder="e.g. Weekend reserve injection, Skimming week 3 profit"
                />
              </div>

              {/* Dynamic Preview & Warnings */}
              {numInput > 0 && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                    previewTarget < 20
                      ? 'bg-red-500/10 border-red-500/30 text-red-300'
                      : 'bg-white/[0.03] border-white/10 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {previewTarget < 20 ? (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-amber-400" />
                    )}
                    <span>Resulting Buffer:</span>
                  </div>
                  <span className="font-mono font-bold text-white text-sm">
                    $ {previewTarget.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsPoolModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPool || (numInput > 0 && previewTarget < 5000)}
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 transition-colors disabled:opacity-40 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  {isSubmittingPool ? 'Updating Redis...' : 'Confirm & Save'}
                </button>
              </div>
            </form>

            {/* Audit History Snapshot */}
            <div className="mt-5 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                  <History className="w-3.5 h-3.5 text-amber-400" />
                  <span>Recent Audit Trail (PostgreSQL)</span>
                </div>
                <span className="text-[10px] text-gray-500 font-mono">Immutable ledger</span>
              </div>

              {loadingLogs ? (
                <p className="text-xs text-gray-500 py-2">Loading audit history...</p>
              ) : auditLogs.length === 0 ? (
                <p className="text-[11px] text-gray-500 py-2 text-center bg-slate-900/50 rounded-xl">
                  No manual pool adjustments recorded yet.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2 rounded-lg bg-slate-900/70 border border-white/5 flex items-center justify-between text-[11px]"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                            log.action === 'TOP_UP'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : log.action === 'PROFIT_SKIM'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}
                        >
                          {log.action}
                        </span>
                        <span className="text-gray-300 font-medium">
                          {log.note || `${log.adminUser} adjustment`}
                        </span>
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-mono font-bold ${
                            Number(log.delta) >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {Number(log.delta) >= 0 ? '+' : ''}
                          $ {Number(log.delta).toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                        </div>
                        <div className="text-[9px] text-gray-500">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
