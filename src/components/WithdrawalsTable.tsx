'use client';

import React, { useState } from 'react';
import { WithdrawalRequest } from '@/lib/types';
import { approveWithdrawal, rejectWithdrawal } from '@/lib/api';
import {
  CheckCircle,
  XCircle,
  Clock,
  Building,
  Smartphone,
  Eye,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';

interface WithdrawalsTableProps {
  withdrawals: WithdrawalRequest[];
  onActionComplete: () => void;
  showToast: (msg: string, isError?: boolean) => void;
}

export default function WithdrawalsTable({
  withdrawals,
  onActionComplete,
  showToast,
}: WithdrawalsTableProps) {
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    type: 'approve' | 'reject';
    withdrawal: WithdrawalRequest;
  } | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleApprove = async () => {
    if (!confirmModal) return;
    setProcessing(true);
    try {
      await approveWithdrawal(confirmModal.withdrawal.id, adminNote || 'Paid via Bank/Gateway Transfer');
      showToast(`✅ Withdrawal #${confirmModal.withdrawal.id.slice(0, 8)} marked as PAID!`);
      setConfirmModal(null);
      setAdminNote('');
      onActionComplete();
    } catch (err: any) {
      showToast(err.message || 'Failed to approve withdrawal', true);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!confirmModal) return;
    if (!adminNote.trim()) {
      showToast('Please provide a reason for rejection (refund to player)', true);
      return;
    }
    setProcessing(true);
    try {
      await rejectWithdrawal(confirmModal.withdrawal.id, adminNote);
      showToast(`↩️ Withdrawal #${confirmModal.withdrawal.id.slice(0, 8)} REJECTED & Refunded to player balance!`);
      setConfirmModal(null);
      setAdminNote('');
      onActionComplete();
    } catch (err: any) {
      showToast(err.message || 'Failed to reject withdrawal', true);
    } finally {
      setProcessing(false);
    }
  };

  const renderPayoutDetails = (details: any, method: string) => {
    if (!details || typeof details !== 'object') {
      return <span className="text-gray-400 italic">No details provided</span>;
    }

    if (method.toUpperCase() === 'BANK') {
      return (
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-1.5 text-gray-300">
            <Building className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="font-semibold text-white">{details.bankName || 'Bank'}</span>
            {details.branchName && (
              <span className="text-[11px] text-gray-400">({details.branchName})</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {details.accountNumber}
            </span>
            <button
              onClick={() => copyToClipboard(details.accountNumber, 'acc')}
              className="text-gray-400 hover:text-white transition-colors"
              title="Copy Account Number"
            >
              {copiedKey === 'acc' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <div className="text-[11px] text-gray-400">
            A/C Holder: <span className="text-gray-200 font-medium">{details.accountHolder || 'N/A'}</span>
          </div>
        </div>
      );
    }

    // iPay / UPay / Wallet
    return (
      <div className="space-y-1 text-xs">
        <div className="flex items-center gap-1.5 text-purple-300">
          <Smartphone className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span className="font-semibold">{method.toUpperCase()} Mobile Wallet</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-purple-200 font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
            {details.mobileNumber || details.accountNumber}
          </span>
          <button
            onClick={() => copyToClipboard(details.mobileNumber || details.accountNumber, 'mobile')}
            className="text-gray-400 hover:text-white transition-colors"
            title="Copy Number"
          >
            {copiedKey === 'mobile' ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
        {details.accountHolder && (
          <div className="text-[11px] text-gray-400">
            Holder: <span className="text-gray-200 font-medium">{details.accountHolder}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="overflow-x-auto">
      {withdrawals.length === 0 ? (
        <div className="text-center py-14">
          <ArrowUpRight className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm font-medium">No withdrawal requests found</p>
          <p className="text-xs text-gray-400 mt-1">
            New payout requests will appear here in real-time as players submit them.
          </p>
        </div>
      ) : (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <th className="py-3 px-4">Player</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Method & Payout Details</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Requested At</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] text-xs">
            {withdrawals.map((req) => {
              const isPending = req.status === 'PENDING';
              const isPaid = req.status === 'PAID';
              const isRejected = req.status === 'REJECTED';

              return (
                <tr
                  key={req.id}
                  className="hover:bg-white/[0.02] transition-colors group"
                >
                  {/* Player info */}
                  <td className="py-4 px-4">
                    <div className="font-bold text-white text-sm">{req.username}</div>
                    <div className="text-[11px] text-gray-400">{req.email || req.userId.slice(0, 8)}</div>
                    <div className="text-[10px] font-mono text-gray-400 mt-0.5">
                      ID: {req.id.slice(0, 8)}
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="py-4 px-4">
                    <div className="font-extrabold text-base text-rose-400 flex items-center gap-1">
                      <span>-</span>
                      <span>{Number(req.amount).toFixed(2)}</span>
                      <span className="text-[10px] text-rose-300 font-semibold uppercase">
                        {req.currency}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400">Escrowed</span>
                  </td>

                  {/* Payout Details */}
                  <td className="py-4 px-4 min-w-[240px]">
                    {renderPayoutDetails(req.payoutDetails, req.method)}
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-4">
                    {isPending && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        <Clock className="w-3 h-3 animate-spin" />
                        PENDING PAYOUT
                      </span>
                    )}
                    {isPaid && (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle className="w-3 h-3" />
                          PAID
                        </span>
                        {req.adminNote && (
                          <div className="text-[10px] text-gray-400 italic">
                            {req.adminNote}
                          </div>
                        )}
                      </div>
                    )}
                    {isRejected && (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/15 text-red-300 border border-red-500/30">
                          <XCircle className="w-3 h-3" />
                          REFUNDED
                        </span>
                        {req.adminNote && (
                          <div className="text-[10px] text-red-400/80 italic">
                            Reason: {req.adminNote}
                          </div>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Requested Date */}
                  <td className="py-4 px-4 text-gray-400">
                    <div>{new Date(req.createdAt).toLocaleDateString()}</div>
                    <div className="text-[10px] text-gray-400">
                      {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-right">
                    {isPending ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setConfirmModal({ type: 'approve', withdrawal: req });
                            setAdminNote('');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-lg text-xs shadow-md shadow-emerald-600/20 transition-all"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Mark as Paid</span>
                        </button>

                        <button
                          onClick={() => {
                            setConfirmModal({ type: 'reject', withdrawal: req });
                            setAdminNote('');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 active:scale-95 text-red-300 font-bold rounded-lg text-xs border border-red-500/30 transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject & Refund</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs italic">Completed</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#0f172a] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              {confirmModal.type === 'approve' ? (
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-white">
                  {confirmModal.type === 'approve'
                    ? 'Confirm Payout Completed'
                    : 'Reject & Refund Withdrawal'}
                </h3>
                <p className="text-xs text-gray-400">
                  Player: <span className="text-white font-semibold">{confirmModal.withdrawal.username}</span> |{' '}
                  Amount: <span className="text-rose-400 font-bold">{confirmModal.withdrawal.currency} {confirmModal.withdrawal.amount}</span>
                </p>
              </div>
            </div>

            {/* Payout Details summary */}
            <div className="p-3.5 bg-white/[0.03] border border-white/5 rounded-xl space-y-1.5 text-xs">
              <div className="text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                Payout Destination:
              </div>
              {renderPayoutDetails(confirmModal.withdrawal.payoutDetails, confirmModal.withdrawal.method)}
            </div>

            {confirmModal.type === 'approve' ? (
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Transfer Reference / Note (Optional)
                </label>
                <input
                  type="text"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="e.g. Sent via Commercial Bank Ref #827361"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-400 text-xs focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Once marked as paid, the player will be notified immediately on their game screen.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Reason for Rejection <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="e.g. Invalid bank account number or name mismatch. Funds refunded to wallet."
                  rows={3}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-400 text-xs focus:outline-none focus:border-red-500"
                />
                <p className="text-[11px] text-red-400/90 mt-1">
                  ⚠️ The held amount ({confirmModal.withdrawal.currency} {confirmModal.withdrawal.amount}) will be automatically refunded back to the player's wallet balance.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                disabled={processing}
                className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-gray-300 text-xs font-semibold transition-all disabled:opacity-50"
              >
                Cancel
              </button>

              {confirmModal.type === 'approve' ? (
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={processing}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
                >
                  {processing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Paid</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={processing || !adminNote.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all disabled:opacity-50"
                >
                  {processing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Reject & Refund</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
