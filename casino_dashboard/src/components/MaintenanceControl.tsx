'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MaintenanceStatus } from '@/lib/types';
import { fetchMaintenanceStatus, scheduleMaintenance, cancelMaintenance } from '@/lib/api';
import {
  AlertTriangle,
  Clock,
  ShieldCheck,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertOctagon,
  Power,
} from 'lucide-react';

interface MaintenanceControlProps {
  onNotification?: (msg: string, isError?: boolean) => void;
}

export function MaintenanceControl({ onNotification }: MaintenanceControlProps) {
  const [status, setStatus] = useState<MaintenanceStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [minutesInput, setMinutesInput] = useState<number>(15);
  const [customMsg, setCustomMsg] = useState<string>('');
  const [remainingSec, setRemainingSec] = useState<number>(0);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchMaintenanceStatus();
      setStatus(data);
      if (data.targetTime && data.targetTime > Date.now()) {
        setRemainingSec(Math.max(0, Math.floor((data.targetTime - Date.now()) / 1000)));
      } else {
        setRemainingSec(0);
      }
    } catch (err: any) {
      console.warn('Could not fetch maintenance status:', err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 10000);
    return () => clearInterval(interval);
  }, [loadStatus]);

  // Local ticker for live MM:SS countdown
  useEffect(() => {
    if (!status?.targetTime || status.targetTime <= Date.now()) {
      return;
    }
    const timer = setInterval(() => {
      const sec = Math.max(0, Math.floor((status.targetTime! - Date.now()) / 1000));
      setRemainingSec(sec);
      if (sec <= 0) {
        clearInterval(timer);
        loadStatus();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [status?.targetTime, loadStatus]);

  // Revert two-step confirmation after 5 seconds if not clicked
  useEffect(() => {
    if (isConfirming) {
      const timeout = setTimeout(() => setIsConfirming(false), 5000);
      return () => clearTimeout(timeout);
    }
  }, [isConfirming]);

  const handleScheduleClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    try {
      setActionLoading(true);
      setIsConfirming(false);
      const res = await scheduleMaintenance(
        minutesInput,
        customMsg.trim() || undefined
      );
      setStatus(res);
      onNotification?.(`✅ Maintenance scheduled successfully for ${minutesInput} minutes!`);
    } catch (err: any) {
      onNotification?.(`❌ Failed to schedule: ${err?.message || 'Error'}`, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setActionLoading(true);
      const res = await cancelMaintenance();
      setStatus(res);
      setIsConfirming(false);
      onNotification?.('✅ Maintenance cancelled. All game rooms resumed normally!');
    } catch (err: any) {
      onNotification?.(`❌ Failed to cancel: ${err?.message || 'Error'}`, true);
    } finally {
      setActionLoading(false);
    }
  };

  const formatCountdown = (totalSec: number) => {
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const isScheduled = Boolean(status?.isScheduled && remainingSec > 0);
  const isActive = Boolean(status?.isActive || (status?.isScheduled && remainingSec <= 0));

  const durationPresets = [5, 15, 30, 60];

  return (
    <div className="rounded-2xl bg-[#0f172a]/80 border border-white/10 p-6 backdrop-blur-xl shadow-xl transition-all">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-amber-400" />
            <span>Scheduled Maintenance Protocol</span>
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Initiate automated warning tickers. When countdown completes, starting new games pauses and queued bets are safely refunded.
          </p>
        </div>

        {/* Dynamic Status Pill */}
        <div className="flex items-center gap-2">
          {isActive ? (
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-500/15 border border-rose-500/40 text-rose-300">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>MAINTENANCE ACTIVE</span>
            </span>
          ) : isScheduled ? (
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 border border-amber-500/40 text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>COUNTDOWN: {formatCountdown(remainingSec)}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>ALL ROOMS ONLINE</span>
            </span>
          )}
        </div>
      </div>

      {/* State A: When Maintenance is SCHEDULED or ACTIVE */}
      {isScheduled || isActive ? (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-rose-500/10 border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black ${
                isActive
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}
            >
              {isActive ? '🛑' : '⏳'}
            </div>

            <div>
              <div className="text-xs uppercase font-extrabold tracking-widest text-amber-400">
                {isActive ? 'System Paused' : 'Cutoff Ticker Active'}
              </div>
              <div className="text-3xl font-black text-white font-mono mt-0.5">
                {isActive ? 'MAINTENANCE IN PROGRESS' : formatCountdown(remainingSec)}
              </div>
              <p className="text-xs text-gray-300 mt-1 max-w-lg">
                {isActive
                  ? 'New games are stopped. Connected players see a maintenance screen. Queued bets have been refunded.'
                  : `In-game warning banner is displayed to all active players. At 00:00, new rounds will freeze and queued bets will be auto-refunded.`}
              </p>
            </div>
          </div>

          <button
            onClick={handleCancel}
            disabled={actionLoading}
            className="w-full md:w-auto px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white border border-white/20 hover:border-white/40 transition shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap active:scale-[0.98]"
          >
            <RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
            <span>{actionLoading ? 'Resuming Games...' : 'Cancel & Resume Games Immediately'}</span>
          </button>
        </div>
      ) : (
        /* State B: When ONLINE (Spacious, 100% Inline Form with Zero Modals) */
        <form onSubmit={handleScheduleClick} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Duration Selector Column (4 cols) */}
            <div className="lg:col-span-5 space-y-2">
              <label className="block text-xs font-semibold text-gray-300 flex items-center justify-between">
                <span>Countdown Duration</span>
                <span className="text-[11px] text-amber-400 font-mono">
                  {minutesInput} Minutes Ticker
                </span>
              </label>

              {/* Preset Chips */}
              <div className="grid grid-cols-4 gap-2">
                {durationPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setMinutesInput(preset)}
                    className={`py-2 rounded-xl text-xs font-bold transition border ${
                      minutesInput === preset
                        ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/20'
                        : 'bg-black/40 text-gray-300 border-white/10 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    {preset}m
                  </button>
                ))}
              </div>

              {/* Custom numeric input */}
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={minutesInput}
                  onChange={(e) => setMinutesInput(Math.max(1, parseInt(e.target.value) || 15))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500 font-mono transition"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-gray-400 font-medium">
                  Minutes
                </span>
              </div>
            </div>

            {/* Custom Message & Trigger Column (7 cols) */}
            <div className="lg:col-span-7 space-y-2">
              <label className="block text-xs font-semibold text-gray-300">
                Custom Player Notice (Optional)
              </label>

              <input
                type="text"
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                placeholder="Scheduled system maintenance will begin in 15 minutes. New rounds will be paused."
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500 transition"
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="text-[11px] text-emerald-400/90 flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Queued bets will be automatically refunded on cutoff</span>
                </div>

                {/* 2-Step Safe Inline Action Button */}
                <button
                  type="submit"
                  disabled={actionLoading || loading}
                  className={`py-2.5 px-5 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 whitespace-nowrap active:scale-[0.98] disabled:opacity-50 ${
                    isConfirming
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 animate-pulse'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-amber-500/20'
                  }`}
                >
                  {isConfirming ? (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      <span>Click to Confirm {minutesInput}m Maintenance!</span>
                    </>
                  ) : (
                    <>
                      <Power className="w-4 h-4" />
                      <span>{actionLoading ? 'Broadcasting...' : `Schedule ${minutesInput}m Maintenance`}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
