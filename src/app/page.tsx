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
} from 'lucide-react';
import Link from 'next/link';
import { fetchStats, fetchDeposits } from '@/lib/api';
import { DashboardStats, DepositRequest } from '@/lib/types';
import { useAdminSocket } from '@/lib/socket';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingDeposits: 0,
    approvedDeposits: 0,
    totalDepositedAmount: 0,
    totalSystemBalance: 0,
  });

  const [pendingDeposits, setPendingDeposits] = useState<DepositRequest[]>([]);
  const [recentApproved, setRecentApproved] = useState<DepositRequest[]>([]);
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
  useAdminSocket(() => {
    loadData();
  });

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
            Real-time deposit approvals, player balances, and high-frequency transaction stream
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>PostgreSQL & Redis Sync: Live</span>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Pending Approvals"
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
          title="Deposited Volume"
          value={`LKR ${(stats.totalDepositedAmount || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}`}
          subtitle="Total lifetime volume"
          icon={TrendingUp}
          variant="blue"
        />
        <MetricCard
          title="Registered Players"
          value={stats.totalUsers}
          subtitle="Active aviator accounts"
          icon={Users}
          variant="purple"
        />
        <MetricCard
          title="Total Player Wallets"
          value={`LKR ${(stats.totalSystemBalance || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}`}
          subtitle="Circulating credit balance"
          icon={Wallet}
          variant="amber"
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
              <span className="text-xs text-gray-400">Zero-latency live stream</span>
            </div>

            <PendingDepositsTable
              deposits={pendingDeposits}
              onActionComplete={loadData}
              showToast={showToast}
            />
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
            <span>Approvals atomically credit player wallet and record ledger entry.</span>
            <Link
              href="/deposits"
              className="text-blue-400 hover:text-blue-300 font-bold inline-flex items-center gap-1 transition-all"
            >
              <span>View full history</span>
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
