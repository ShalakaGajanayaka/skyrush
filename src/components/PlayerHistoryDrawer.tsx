'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  History,
  Gamepad2,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Coins,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  Zap,
  ShieldAlert,
  Calendar,
  Filter,
} from 'lucide-react';
import { fetchPlayerHistory } from '@/lib/api';
import { User, PlayerDetailedHistoryResponse } from '@/lib/types';

interface PlayerHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

type TabType = 'bets' | 'deposits' | 'withdrawals';

export default function PlayerHistoryDrawer({
  isOpen,
  onClose,
  user,
}: PlayerHistoryDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('bets');
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<PlayerDetailedHistoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPlayerHistory(user.id, {
        type: activeTab,
        status: statusFilter,
        limit: 100,
      });
      setData(res);
    } catch (err: any) {
      console.error('Failed to fetch player history', err);
      setError(err?.message || 'Failed to load player history records');
    } finally {
      setLoading(false);
    }
  }, [user, activeTab, statusFilter]);

  useEffect(() => {
    if (isOpen && user) {
      loadHistory();
    } else {
      setData(null);
      setError(null);
    }
  }, [isOpen, user, activeTab, statusFilter, loadHistory]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const summary = data?.summary;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-md flex justify-end animate-fade-in">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sliding Drawer Container */}
      <div className="relative w-full max-w-5xl bg-[#0e131f] border-l border-white/10 h-full flex flex-col shadow-2xl z-10 overflow-hidden animate-slide-left">
        
        {/* TOP HEADER */}
        <div className="px-6 py-5 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-cyan-500/20">
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>{user.username}</span>
                </h3>
                {user.isFrozen && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    FROZEN
                  </span>
                )}
                {user.isMarketing && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 fill-purple-300" />
                    <span>MARKETING</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                <button
                  onClick={() => handleCopy(user.id, 'user_id')}
                  className="font-mono text-[11px] text-gray-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                  title="Click to copy User ID"
                >
                  <span>ID: {user.id.slice(0, 10)}...</span>
                  {copiedId === 'user_id' ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
                {user.email && <span>• {user.email}</span>}
                <span>• Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Wallet Balance</div>
              <div className="text-base font-black text-emerald-400 font-mono">
                ${Number(user.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-gray-400 hover:text-white transition-all active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 360° FINANCIAL SUMMARY BANNER */}
        {summary && (
          <div className="px-6 py-4 bg-gradient-to-r from-cyan-950/20 via-indigo-950/20 to-purple-950/20 border-b border-white/[0.08]">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Total Deposited */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <div className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
                  <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                  <span>Approved In</span>
                </div>
                <div className="text-sm font-black text-emerald-400 font-mono mt-1">
                  ${summary.totalDepositedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">{summary.totalApprovedDepositsCount} deposits</div>
              </div>

              {/* Total Withdrawn */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <div className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3 text-amber-400" />
                  <span>Paid Out</span>
                </div>
                <div className="text-sm font-black text-amber-400 font-mono mt-1">
                  ${summary.totalWithdrawnAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">{summary.totalPaidWithdrawalsCount} payouts</div>
              </div>

              {/* Net Cash Flow */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <div className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
                  {summary.netCashFlow >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-cyan-400" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-rose-400" />
                  )}
                  <span>Net Cashflow</span>
                </div>
                <div className={`text-sm font-black font-mono mt-1 ${summary.netCashFlow >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
                  {summary.netCashFlow >= 0 ? '+' : ''}${summary.netCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">Deposits - Payouts</div>
              </div>

              {/* Total Wagered */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <div className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
                  <Gamepad2 className="w-3 h-3 text-indigo-400" />
                  <span>Total Wagered</span>
                </div>
                <div className="text-sm font-black text-indigo-300 font-mono mt-1">
                  ${summary.totalWageredAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">{summary.totalBetsCount} bets recorded</div>
              </div>

              {/* Total Won */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <div className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
                  <Coins className="w-3 h-3 text-amber-300" />
                  <span>Player Won</span>
                </div>
                <div className="text-sm font-black text-amber-300 font-mono mt-1">
                  ${summary.totalWonAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">Total cashed out</div>
              </div>

              {/* Casino Net GGR */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <div className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
                  <Coins className="w-3 h-3 text-purple-400" />
                  <span>House GGR</span>
                </div>
                <div className={`text-sm font-black font-mono mt-1 ${summary.netGGR >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {summary.netGGR >= 0 ? '+' : ''}${summary.netGGR.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">Platform Net Revenue</div>
              </div>
            </div>
          </div>
        )}

        {/* TABS & FILTER BAR */}
        <div className="px-6 py-3 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-4 bg-[#0a0e18]">
          {/* Tab Selector */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <button
              onClick={() => {
                setActiveTab('bets');
                setStatusFilter('ALL');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'bets'
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Bet History</span>
              {data?.counts?.bets !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${activeTab === 'bets' ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-300'}`}>
                  {data.counts.bets}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('deposits');
                setStatusFilter('ALL');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'deposits'
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Deposit History</span>
              {data?.counts?.deposits !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${activeTab === 'deposits' ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-300'}`}>
                  {data.counts.deposits}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('withdrawals');
                setStatusFilter('ALL');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'withdrawals'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Withdrawal History</span>
              {data?.counts?.withdrawals !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${activeTab === 'withdrawals' ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-300'}`}>
                  {data.counts.withdrawals}
                </span>
              )}
            </button>
          </div>

          {/* Status & Refresh Controls */}
          <div className="flex items-center gap-3">
            {(activeTab === 'deposits' || activeTab === 'withdrawals') && (
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white/[0.05] border border-white/[0.08] text-xs font-semibold text-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">All Statuses</option>
                  {activeTab === 'deposits' ? (
                    <>
                      <option value="APPROVED">Approved</option>
                      <option value="PENDING">Pending</option>
                      <option value="REJECTED">Rejected</option>
                    </>
                  ) : (
                    <>
                      <option value="PAID">Paid / Completed</option>
                      <option value="PENDING">Pending</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="CANCELLED">Cancelled</option>
                    </>
                  )}
                </select>
              </div>
            )}

            <button
              onClick={loadHistory}
              disabled={loading}
              className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white transition-all active:scale-95 disabled:opacity-50"
              title="Refresh Records"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* CONTENT TABLE AREA */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {error && (
            <div className="p-4 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
              <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
              <p className="text-xs font-semibold">Loading real-time records from PostgreSQL database...</p>
            </div>
          ) : (
            <>
              {/* ---------------- 1. BET HISTORY TAB ---------------- */}
              {activeTab === 'bets' && (
                <div>
                  {(!data?.bets || data.bets.length === 0) ? (
                    <div className="text-center py-20 text-gray-500">
                      <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-30 text-cyan-400" />
                      <p className="text-sm font-bold text-gray-400">No bets placed yet</p>
                      <p className="text-xs text-gray-500 mt-1">This player has not placed any bets in crash rounds.</p>
                    </div>
                  ) : (
                    <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-white/[0.01]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-white/[0.03] text-gray-400 font-bold uppercase tracking-wider text-[10px] border-b border-white/[0.06]">
                          <tr>
                            <th className="py-3 px-4">Date & Time</th>
                            <th className="py-3 px-4">Bet Amount</th>
                            <th className="py-3 px-4">Crash Point</th>
                            <th className="py-3 px-4">Cashout Multiplier</th>
                            <th className="py-3 px-4">Payout</th>
                            <th className="py-3 px-4">Net Profit</th>
                            <th className="py-3 px-4 text-center">Outcome</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {data.bets.map((bet) => {
                            const betAmt = Number(bet.betAmount || 0);
                            const winAmt = Number(bet.winAmount || 0);
                            const mult = bet.cashOutMultiplier ? Number(bet.cashOutMultiplier) : null;
                            const isWin = winAmt > 0 && mult !== null;
                            const profit = isWin ? winAmt - betAmt : -betAmt;

                            return (
                              <tr key={bet.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="py-3 px-4 text-gray-300 font-mono text-[11px]">
                                  {new Date(bet.createdAt).toLocaleString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                  })}
                                </td>
                                <td className="py-3 px-4 font-bold text-white font-mono">
                                  ${betAmt.toFixed(2)} {bet.currency || 'USD'}
                                </td>
                                <td className="py-3 px-4 font-mono font-bold text-rose-400">
                                  {Number(bet.crashPoint || 0).toFixed(2)}x
                                </td>
                                <td className="py-3 px-4 font-mono font-bold">
                                  {mult ? (
                                    <span className="text-cyan-400">{mult.toFixed(2)}x</span>
                                  ) : (
                                    <span className="text-gray-500 font-normal">Crashed</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 font-mono font-bold text-amber-300">
                                  ${winAmt.toFixed(2)}
                                </td>
                                <td className="py-3 px-4 font-mono font-black">
                                  <span className={profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                    {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  {isWin ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>WON</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                      <XCircle className="w-3 h-3" />
                                      <span>BUSTED</span>
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ---------------- 2. DEPOSIT HISTORY TAB ---------------- */}
              {activeTab === 'deposits' && (
                <div>
                  {(!data?.deposits || data.deposits.length === 0) ? (
                    <div className="text-center py-20 text-gray-500">
                      <ArrowDownLeft className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-400" />
                      <p className="text-sm font-bold text-gray-400">No deposit records found</p>
                      <p className="text-xs text-gray-500 mt-1">No deposits match the selected criteria for this account.</p>
                    </div>
                  ) : (
                    <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-white/[0.01]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-white/[0.03] text-gray-400 font-bold uppercase tracking-wider text-[10px] border-b border-white/[0.06]">
                          <tr>
                            <th className="py-3 px-4">Date & Time</th>
                            <th className="py-3 px-4">Reference #</th>
                            <th className="py-3 px-4">Amount</th>
                            <th className="py-3 px-4">Method / Channel</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Audit / Approved By</th>
                            <th className="py-3 px-4">Admin Note</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {data.deposits.map((dep) => {
                            const isApproved = dep.status === 'APPROVED';
                            const isPending = dep.status === 'PENDING';

                            return (
                              <tr key={dep.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="py-3 px-4 text-gray-300 font-mono text-[11px]">
                                  {new Date(dep.createdAt).toLocaleString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </td>
                                <td className="py-3 px-4 font-mono font-bold text-gray-300">
                                  <button
                                    onClick={() => handleCopy(dep.referenceNumber, dep.id)}
                                    className="hover:text-cyan-300 flex items-center gap-1 transition-colors"
                                    title="Click to copy Reference #"
                                  >
                                    <span>{dep.referenceNumber}</span>
                                    {copiedId === dep.id ? (
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3 opacity-40" />
                                    )}
                                  </button>
                                </td>
                                <td className="py-3 px-4 font-mono font-extrabold text-emerald-400 text-sm">
                                  ${Number(dep.amount || 0).toFixed(2)} {dep.currency || 'USD'}
                                </td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-gray-300 font-medium text-[11px] uppercase">
                                    {dep.paymentMethod || 'manual'}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  {isApproved && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>APPROVED</span>
                                    </span>
                                  )}
                                  {isPending && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                      <Clock className="w-3 h-3" />
                                      <span>PENDING</span>
                                    </span>
                                  )}
                                  {!isApproved && !isPending && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                      <XCircle className="w-3 h-3" />
                                      <span>REJECTED</span>
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-gray-400 text-[11px]">
                                  {dep.approvedBy ? (
                                    <div>
                                      <span className="text-gray-200 font-semibold">{dep.approvedBy}</span>
                                      {dep.approvedAt && (
                                        <div className="text-[10px] text-gray-500">
                                          {new Date(dep.approvedAt).toLocaleDateString()}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-600">—</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-gray-400 text-[11px] max-w-xs truncate">
                                  {dep.adminNote || '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ---------------- 3. WITHDRAWAL HISTORY TAB ---------------- */}
              {activeTab === 'withdrawals' && (
                <div>
                  {(!data?.withdrawals || data.withdrawals.length === 0) ? (
                    <div className="text-center py-20 text-gray-500">
                      <ArrowUpRight className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-400" />
                      <p className="text-sm font-bold text-gray-400">No withdrawal requests found</p>
                      <p className="text-xs text-gray-500 mt-1">This user has not submitted any payout requests.</p>
                    </div>
                  ) : (
                    <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-white/[0.01]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-white/[0.03] text-gray-400 font-bold uppercase tracking-wider text-[10px] border-b border-white/[0.06]">
                          <tr>
                            <th className="py-3 px-4">Date & Time</th>
                            <th className="py-3 px-4">Amount</th>
                            <th className="py-3 px-4">Method</th>
                            <th className="py-3 px-4">Payout Account / Address</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Processed By</th>
                            <th className="py-3 px-4">Admin Note</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {data.withdrawals.map((w) => {
                            const isPaid = w.status === 'PAID';
                            const isPending = w.status === 'PENDING';
                            const isRejected = w.status === 'REJECTED';

                            // Format payout details nicely
                            let detailsDisplay = w.payoutDetails;
                            try {
                              if (typeof w.payoutDetails === 'string' && w.payoutDetails.startsWith('{')) {
                                const parsed = JSON.parse(w.payoutDetails);
                                detailsDisplay = parsed.accountNumber || parsed.address || parsed.wallet || w.payoutDetails;
                              }
                            } catch {}

                            return (
                              <tr key={w.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="py-3 px-4 text-gray-300 font-mono text-[11px]">
                                  {new Date(w.createdAt).toLocaleString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </td>
                                <td className="py-3 px-4 font-mono font-extrabold text-amber-400 text-sm">
                                  ${Number(w.amount || 0).toFixed(2)} {w.currency || 'USD'}
                                </td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-gray-300 font-medium text-[11px] uppercase">
                                    {w.method || 'bank_transfer'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-mono text-[11px] text-gray-300 max-w-xs truncate" title={w.payoutDetails}>
                                  {detailsDisplay}
                                </td>
                                <td className="py-3 px-4">
                                  {isPaid && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>PAID</span>
                                    </span>
                                  )}
                                  {isPending && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                      <Clock className="w-3 h-3" />
                                      <span>PENDING</span>
                                    </span>
                                  )}
                                  {isRejected && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                      <XCircle className="w-3 h-3" />
                                      <span>REJECTED</span>
                                    </span>
                                  )}
                                  {!isPaid && !isPending && !isRejected && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gray-500/15 text-gray-400 border border-gray-500/30">
                                      <span>{w.status}</span>
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-gray-400 text-[11px]">
                                  {w.processedBy ? (
                                    <div>
                                      <span className="text-gray-200 font-semibold">{w.processedBy}</span>
                                      {w.processedAt && (
                                        <div className="text-[10px] text-gray-500">
                                          {new Date(w.processedAt).toLocaleDateString()}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-600">—</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-gray-400 text-[11px] max-w-xs truncate">
                                  {w.adminNote || '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* FOOTER BAR */}
        <div className="px-6 py-3 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Connected to PostgreSQL Database</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-gray-300 font-bold transition-all"
          >
            Close Sheet
          </button>
        </div>

      </div>
    </div>
  );
}
