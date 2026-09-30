'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, ShieldAlert, Zap, CheckCircle, Video, Award, Coins } from 'lucide-react';
import { updateUserMarketingStatus, manualCredit } from '@/lib/api';
import { User } from '@/lib/types';

interface MarketingModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess: (updatedUser: User) => void;
}

export default function MarketingModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}: MarketingModalProps) {
  const [isMarketing, setIsMarketing] = useState(false);
  const [isMarketingAutoWin, setIsMarketingAutoWin] = useState(false);
  const [promoAmount, setPromoAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [creditLoading, setCreditLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      setIsMarketing(!!user.isMarketing);
      setIsMarketingAutoWin(!!user.isMarketingAutoWin);
      setPromoAmount('');
      setError(null);
      setStatusNotice(null);
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleSaveSettings = async () => {
    setLoading(true);
    setError(null);
    setStatusNotice(null);

    try {
      const res = await updateUserMarketingStatus(
        user.id,
        isMarketing,
        isMarketing ? isMarketingAutoWin : false,
      );
      setStatusNotice(`Marketing configuration updated successfully for ${user.username}!`);
      onSuccess(res.user);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Failed to update marketing status');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPromoBalance = async (presetAmt?: number) => {
    const amt = presetAmt !== undefined ? presetAmt : parseFloat(promoAmount);
    if (!amt || amt <= 0) {
      setError('Please provide a valid promotional balance amount');
      return;
    }

    setCreditLoading(true);
    setError(null);
    try {
      const res = await manualCredit(user.username, amt, 'Promotional Marketing Balance Injection');
      setStatusNotice(`Successfully credited $${amt.toLocaleString()} USD to ${user.username}!`);
      if (res.user) {
        onSuccess(res.user);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to inject promotional balance');
    } finally {
      setCreditLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0f172a] border border-purple-500/20 shadow-2xl shadow-purple-950/40 p-6 md:p-8 space-y-6 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>Marketing & Influencer Studio</span>
              </h3>
              <p className="text-xs text-gray-400">
                Configure promotional settings for <span className="text-purple-300 font-bold">{user.username}</span>
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

        {/* User Stats Snapshot */}
        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs">
          <div>
            <span className="text-gray-400 block text-[11px]">Current Wallet Balance</span>
            <span className="text-sm font-black text-emerald-400 flex items-center gap-1 mt-0.5">
              <Coins className="w-4 h-4" />
              <span>{user.currency || 'USD'} {Number(user.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </span>
          </div>
          <div className="text-right">
            <span className="text-gray-400 block text-[11px]">Games Played</span>
            <span className="text-white font-bold">{user.gamesPlayed || 0} rounds</span>
          </div>
        </div>

        {/* Feature Switches */}
        <div className="space-y-4">
          {/* Switch 1: Marketing Account Role */}
          <div
            onClick={() => {
              const next = !isMarketing;
              setIsMarketing(next);
              if (!next) setIsMarketingAutoWin(false);
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-3.5 ${
              isMarketing
                ? 'bg-purple-950/20 border-purple-500/40 shadow-lg shadow-purple-950/20'
                : 'bg-white/[0.01] border-white/5 hover:border-white/10'
            }`}
          >
            <div className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
              isMarketing
                ? 'bg-purple-600 border-purple-400 text-white'
                : 'bg-transparent border-gray-600 text-transparent'
            }`}>
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-purple-400" />
                  <span>Designate as Marketing & Streamer Account</span>
                </span>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                  isMarketing ? 'bg-purple-500/20 text-purple-300' : 'bg-gray-800 text-gray-500'
                }`}>
                  {isMarketing ? 'Active' : 'Disabled'}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                Tags account for promotional creation. Activates <span className="text-purple-300 font-semibold">Zero-Withdrawal Lock</span> to prevent real money extraction.
              </p>
            </div>
          </div>

          {/* Switch 2: Guaranteed Auto-Win */}
          <div
            onClick={() => {
              if (!isMarketing) {
                setIsMarketing(true);
              }
              setIsMarketingAutoWin(!isMarketingAutoWin);
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-3.5 ${
              isMarketingAutoWin
                ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-950/20'
                : 'bg-white/[0.01] border-white/5 hover:border-white/10'
            }`}
          >
            <div className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
              isMarketingAutoWin
                ? 'bg-amber-500 border-amber-300 text-black'
                : 'bg-transparent border-gray-600 text-transparent'
            }`}>
              <Zap className="w-3.5 h-3.5 fill-black" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Guaranteed Smart Auto-Win Engine</span>
                </span>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                  isMarketingAutoWin ? 'bg-amber-500/20 text-amber-300' : 'bg-gray-800 text-gray-500'
                }`}>
                  {isMarketingAutoWin ? 'Auto-Win ON' : 'Off'}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                Guarantees an exciting multiplier curve (2.8x - 14.5x) and automatically cashes out at ~85% of flight before crash. Perfect for recording high-energy wins!
              </p>
            </div>
          </div>
        </div>

        {/* Quick Promo Credit Section */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
          <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-emerald-400" />
            <span>Inject Promotional Balance in USD ($) (Demo Play Funds)</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={promoAmount}
              onChange={(e) => setPromoAmount(e.target.value)}
              placeholder="e.g. 500"
              className="flex-1 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
            <button
              type="button"
              onClick={() => handleAddPromoBalance()}
              disabled={creditLoading}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all disabled:opacity-50"
            >
              {creditLoading ? 'Injecting...' : 'Credit'}
            </button>
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            {[50, 100, 250, 500].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleAddPromoBalance(amt)}
                disabled={creditLoading}
                className="px-2 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-[10px] font-mono text-gray-300 border border-white/5 transition-all"
              >
                +${amt}
              </button>
            ))}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {statusNotice && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{statusNotice}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-semibold text-xs transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs transition-all shadow-lg shadow-purple-600/30 active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Save Marketing Mode'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
