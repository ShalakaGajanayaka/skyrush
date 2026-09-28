'use client';

import React, { useState, useEffect } from 'react';
import { X, RotateCcw, ShieldAlert, CheckCircle, AlertTriangle, Coins, SlidersHorizontal, ArrowDownRight } from 'lucide-react';
import { adjustUserBalance } from '@/lib/api';
import { User } from '@/lib/types';

interface BalanceAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess: (updatedUser: User, message: string) => void;
}

type ActionType = 'RESET_ZERO' | 'SET_AMOUNT' | 'DEDUCT';

export default function BalanceAdjustmentModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}: BalanceAdjustmentModalProps) {
  const [action, setAction] = useState<ActionType>('RESET_ZERO');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('Testing Balance Reset / Rebalancing');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      setAction('RESET_ZERO');
      setAmount('');
      setReason('Testing Balance Reset / Rebalancing');
      setConfirmed(false);
      setError(null);
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const currentBalance = Number(user.balance || 0);

  const calculatePreviewNewBalance = () => {
    if (action === 'RESET_ZERO') return 0;
    const num = parseFloat(amount) || 0;
    if (action === 'SET_AMOUNT') return Math.max(0, num);
    if (action === 'DEDUCT') return Math.max(0, currentBalance - num);
    return currentBalance;
  };

  const previewBalance = calculatePreviewNewBalance();
  const delta = previewBalance - currentBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed && action === 'RESET_ZERO') {
      setError('Please tick the confirmation checkbox to wipe this account balance.');
      return;
    }

    if (action !== 'RESET_ZERO') {
      const num = parseFloat(amount);
      if (isNaN(num) || num < 0) {
        setError('Please enter a valid amount.');
        return;
      }
      if (action === 'DEDUCT' && num <= 0) {
        setError('Deduct amount must be greater than zero.');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const res = await adjustUserBalance(user.id, {
        action,
        amount: action === 'RESET_ZERO' ? undefined : parseFloat(amount),
        reason: reason.trim() || 'Administrative Balance Adjustment',
      });

      onSuccess(res.user, `Successfully updated ${user.username}'s balance to ${user.currency || 'LKR'} ${res.newBalance.toFixed(2)}`);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to adjust balance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-[#0f172a] border border-white/10 shadow-2xl p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>Adjust Player Balance</span>
              </h3>
              <p className="text-xs text-gray-400">
                Wipe test data or rebalance <span className="text-amber-300 font-bold">{user.username}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Balance Display */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-400 block font-semibold">Current Wallet Balance</span>
            <span className="text-base font-extrabold text-white flex items-center gap-1.5 mt-0.5">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>{user.currency || 'LKR'} {currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-gray-400 block font-semibold">After Adjustment</span>
            <span className={`text-base font-extrabold flex items-center justify-end gap-1 mt-0.5 ${
              previewBalance === 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              <span>{user.currency || 'LKR'} {previewBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </span>
            <span className={`text-[10px] font-bold block ${delta < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {delta >= 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action Type Selector */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-black/40 border border-white/5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setAction('RESET_ZERO')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              action === 'RESET_ZERO'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to 0</span>
          </button>
          <button
            type="button"
            onClick={() => setAction('SET_AMOUNT')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              action === 'SET_AMOUNT'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Set Target</span>
          </button>
          <button
            type="button"
            onClick={() => setAction('DEDUCT')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              action === 'DEDUCT'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Deduct</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Action-Specific Inputs */}
          {action === 'RESET_ZERO' ? (
            <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Balance Wipe Warning</span>
              </div>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                This will clear <span className="font-bold text-white">{user.username}</span>&apos;s current balance of <span className="font-mono text-rose-300 font-bold">{user.currency || 'LKR'} {currentBalance.toFixed(2)}</span> down to <span className="font-bold text-white">0.00</span>. This will immediately improve Net House Profit.
              </p>
              <label className="flex items-center gap-2 pt-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="rounded border-gray-600 text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <span className="text-[11px] font-semibold text-rose-200">
                  I confirm resetting this testing balance to 0.00
                </span>
              </label>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-300">
                {action === 'SET_AMOUNT' ? 'Target New Balance Amount' : 'Amount to Deduct from Wallet'}
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                required
              />
              <div className="flex items-center gap-1.5 pt-1">
                {[0, 1000, 5000, 10000, 50000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      if (action === 'SET_AMOUNT') setAmount(preset.toString());
                      else setAmount(Math.min(currentBalance, preset).toString());
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-[10px] font-mono text-gray-300 border border-white/5 transition-all"
                  >
                    {preset === 0 ? '0' : `${(preset / 1000)}k`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-300">Audit Reason / Note</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Test account rebalancing before launch"
              className="w-full px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-semibold text-xs transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (action === 'RESET_ZERO' && !confirmed)}
              className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2 text-white ${
                action === 'RESET_ZERO'
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                  : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
              }`}
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Processing...' : (action === 'RESET_ZERO' ? 'Wipe Balance to 0' : 'Apply Adjustment')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
