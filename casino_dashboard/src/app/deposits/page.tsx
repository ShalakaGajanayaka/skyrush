'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { History, Search, RefreshCw, Filter, QrCode, Phone, Building2, Check, X, Clock, Coins } from 'lucide-react';
import { fetchDeposits } from '@/lib/api';
import { DepositRequest } from '@/lib/types';

export default function DepositHistoryPage() {
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (typeof window !== 'undefined' && !localStorage.getItem('admin_token')) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchDeposits(filterStatus, 150);
      setDeposits(data);
    } catch (err: any) {
      if (err?.message !== 'Unauthorized') {
        console.error('Failed to load history', err);
      }
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = deposits.filter((d) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      d.username.toLowerCase().includes(term) ||
      d.referenceNumber.toLowerCase().includes(term) ||
      (d.email && d.email.toLowerCase().includes(term))
    );
  });

  const getStatusBadge = (status: string) => {
    if (status === 'APPROVED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/12 text-emerald-400 border-none">
          <Check className="w-3 h-3" />
          <span>APPROVED</span>
        </span>
      );
    }
    if (status === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/12 text-rose-400 border-none">
          <X className="w-3 h-3" />
          <span>REJECTED</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/12 text-amber-400 border-none">
        <Clock className="w-3 h-3" />
        <span>PENDING</span>
      </span>
    );
  };

  const getMethodBadge = (method: string) => {
    const m = (method || '').toLowerCase();
    if (m.includes('binance') || m.includes('usdt') || m.includes('crypto')) {
      return (
        <span className="text-amber-400 font-semibold flex items-center gap-1.5">
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <span>Binance / USDT</span>
        </span>
      );
    }
    if (m.includes('ipay')) {
      return <span className="text-emerald-400 font-semibold flex items-center gap-1"><QrCode className="w-3 h-3" /> iPay LK</span>;
    }
    if (m.includes('upay')) {
      return <span className="text-purple-400 font-semibold flex items-center gap-1"><Phone className="w-3 h-3" /> UPay LK</span>;
    }
    if (m.includes('bank')) {
      return <span className="text-blue-400 font-semibold flex items-center gap-1"><Building2 className="w-3 h-3" /> Bank Transfer</span>;
    }
    return <span className="text-amber-400 font-semibold">MANUAL CREDIT</span>;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-blue-400" />
            <span>Deposit Logs & History</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Complete audit trail of all processed, approved, and rejected deposit transactions
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-200 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#0f172a]/70 backdrop-blur-xl border border-white/5 shadow-lg">
        <div className="flex items-center gap-1.5">
          {['ALL', 'APPROVED', 'REJECTED', 'PENDING'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === st
                  ? 'bg-blue-500/15 text-blue-400 font-bold border-none'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.04] border-none'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search player, reference..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-all"
          />
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-2xl bg-[#0f172a]/70 backdrop-blur-xl border border-white/5 p-6 shadow-xl shadow-black/30 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/5 text-gray-400 text-[11px] font-bold uppercase tracking-wider">
              <th className="py-3 px-4">Transaction ID</th>
              <th className="py-3 px-4">Player</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Channel</th>
              <th className="py-3 px-4">Reference Slip</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Admin Note / Approver</th>
              <th className="py-3 px-4">Date & Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-500">
                  No deposits found matching the current criteria.
                </td>
              </tr>
            ) : (
              filtered.map((d) => (
                <tr key={d.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 font-mono text-gray-400 text-[11px]">
                    {d.id.substring(0, 8)}...
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-white">{d.username}</div>
                    <div className="text-[10px] text-gray-400">{d.email || '-'}</div>
                  </td>
                  <td className="py-3 px-4 font-extrabold text-white text-sm">
                    {d.currency} {Number(d.amount).toFixed(2)}
                  </td>
                  <td className="py-3 px-4">{getMethodBadge(d.paymentMethod)}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md font-mono text-[11px] bg-blue-500/10 text-blue-300 border-none">
                      {d.referenceNumber}
                    </span>
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(d.status)}</td>
                  <td className="py-3 px-4 text-gray-400 text-[11px]">
                    {d.adminNote ? (
                      <span className="text-gray-300">{d.adminNote}</span>
                    ) : (
                      <span>{d.approvedBy ? `By ${d.approvedBy}` : '-'}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-[11px]">
                    {new Date(d.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
