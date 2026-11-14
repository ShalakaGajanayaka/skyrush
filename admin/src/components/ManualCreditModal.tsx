'use client';

import React, { useState, useEffect } from 'react';
import { X, DollarSign, User, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { manualCredit } from '@/lib/api';

interface ManualCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreditSuccess: (user: any, amount: number) => void;
  prefillUsername?: string;
}

export default function ManualCreditModal({
  isOpen,
  onClose,
  onCreditSuccess,
  prefillUsername = '',
}: ManualCreditModalProps) {
  const [identifier, setIdentifier] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIdentifier(prefillUsername);
      setAmount('');
      setNote('');
      setError(null);
    }
  }, [isOpen, prefillUsername]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = identifier.trim();
    const numAmount = parseFloat(amount);

    if (!cleanId) {
      setError('Please provide a player username or email');
      return;
    }
    if (!numAmount || numAmount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }
    if (numAmount > 10000) {
      setError('Amount exceeds the maximum security ceiling of $10,000 USD per transaction');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await manualCredit(cleanId, numAmount, note.trim() || 'Direct Next.js Admin Credit');
      onCreditSuccess(res.user, numAmount);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to credit player');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-[#0f172a] border border-white/10 p-6 shadow-2xl shadow-black/80 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Direct Wallet Credit</h3>
            <p className="text-xs text-gray-400">Instantly credit player balance via WebSocket</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2.5 text-xs text-red-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Player Username / Email / Mobile
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. 0771234567 or pilot1"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Credit Amount ($ USD)
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
              <input
                type="number"
                min="0.1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 50"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 text-xs font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Admin Remark / Note (Optional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Direct CDM verification / VIP bonus"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Credit Player Wallet Now</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
