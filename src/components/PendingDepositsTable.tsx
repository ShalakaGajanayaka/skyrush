'use client';

import React, { useState } from 'react';
import { DepositRequest } from '@/lib/types';
import { Check, X, Copy, QrCode, Phone, Building2, Clock, CheckCircle2 } from 'lucide-react';
import { approveDeposit, rejectDeposit } from '@/lib/api';

interface PendingDepositsTableProps {
  deposits: DepositRequest[];
  onActionComplete: () => void;
  showToast: (msg: string, isError?: boolean) => void;
}

export default function PendingDepositsTable({
  deposits,
  onActionComplete,
  showToast,
}: PendingDepositsTableProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const copyRef = (ref: string) => {
    navigator.clipboard.writeText(ref);
    showToast(`Copied Reference: ${ref}`);
  };

  const handleApprove = async (deposit: DepositRequest) => {
    if (
      !confirm(
        `Are you sure you want to APPROVE deposit of ${deposit.currency} ${Number(deposit.amount).toFixed(
          2
        )} for ${deposit.username}? Their wallet will be credited immediately.`
      )
    ) {
      return;
    }

    setProcessingId(deposit.id);
    try {
      await approveDeposit(deposit.id, 'Next.js Admin');
      showToast(`✅ Approved! Credited ${deposit.currency} ${deposit.amount} to ${deposit.username}`);
      onActionComplete();
    } catch (err: any) {
      showToast(err.message || 'Failed to approve', true);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (deposit: DepositRequest) => {
    const reason = prompt('Please enter reason for rejection (optional):', 'Invalid Reference / Slip not found');
    if (reason === null) return;

    setProcessingId(deposit.id);
    try {
      await rejectDeposit(deposit.id, reason, 'Next.js Admin');
      showToast(`Deposit rejected for ${deposit.username}`);
      onActionComplete();
    } catch (err: any) {
      showToast(err.message || 'Failed to reject', true);
    } finally {
      setProcessingId(null);
    }
  };

  const getChannelBadge = (method: string) => {
    const m = (method || '').toLowerCase();
    if (m.includes('ipay')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
          <QrCode className="w-3 h-3" />
          <span>iPay LK</span>
        </span>
      );
    }
    if (m.includes('upay')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/25">
          <Phone className="w-3 h-3" />
          <span>UPay LK</span>
        </span>
      );
    }
    if (m.includes('bank')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/25">
          <Building2 className="w-3 h-3" />
          <span>Commercial Bank</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-500/10 text-gray-300 border border-gray-500/20">
        {method.toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (' + d.toLocaleDateString() + ')';
    } catch {
      return dateStr;
    }
  };

  if (!deposits || deposits.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-white">All Caught Up!</h4>
        <p className="text-xs text-gray-400 mt-1">There are no pending deposit approvals at this moment.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-white/5 text-gray-400 text-[11px] font-bold uppercase tracking-wider">
            <th className="py-3 px-4">Player</th>
            <th className="py-3 px-4">Amount</th>
            <th className="py-3 px-4">Method</th>
            <th className="py-3 px-4">Reference / Slip</th>
            <th className="py-3 px-4">Submitted Time</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.03]">
          {deposits.map((d) => (
            <tr key={d.id} className="hover:bg-white/[0.02] transition-colors group">
              <td className="py-3.5 px-4">
                <div className="font-bold text-white">{d.username}</div>
                <div className="text-[11px] text-gray-400 font-mono">{d.email || d.userId}</div>
              </td>
              <td className="py-3.5 px-4">
                <span className="text-sm font-extrabold text-emerald-400">
                  {d.currency} {Number(d.amount).toFixed(2)}
                </span>
              </td>
              <td className="py-3.5 px-4">{getChannelBadge(d.paymentMethod)}</td>
              <td className="py-3.5 px-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 font-mono text-xs font-semibold">
                  <span>{d.referenceNumber}</span>
                  <button
                    onClick={() => copyRef(d.referenceNumber)}
                    className="p-1 hover:text-white transition-colors"
                    title="Copy Reference"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </td>
              <td className="py-3.5 px-4 text-gray-400">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>{formatDate(d.createdAt)}</span>
                </div>
              </td>
              <td className="py-3.5 px-4 text-right">
                <div className="inline-flex items-center gap-2">
                  <button
                    disabled={processingId === d.id}
                    onClick={() => handleApprove(d)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    disabled={processingId === d.id}
                    onClick={() => handleReject(d)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
