'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MaintenanceStatus } from '@/lib/types';
import { fetchMaintenanceStatus, scheduleMaintenance, cancelMaintenance } from '@/lib/api';

interface MaintenanceControlProps {
  onNotification?: (msg: string, isError?: boolean) => void;
}

export function MaintenanceControl({ onNotification }: MaintenanceControlProps) {
  const [status, setStatus] = useState<MaintenanceStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [minutesInput, setMinutesInput] = useState<number>(15);
  const [customMsg, setCustomMsg] = useState<string>('');
  const [remainingSec, setRemainingSec] = useState<number>(0);

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

  const handleSchedule = async () => {
    try {
      setActionLoading(true);
      const res = await scheduleMaintenance(
        minutesInput,
        customMsg.trim() || undefined
      );
      setStatus(res);
      setShowConfirmModal(false);
      onNotification?.(`✅ Maintenance scheduled successfully for ${minutesInput} minutes!`);
    } catch (err: any) {
      onNotification?.(`❌ Failed: ${err?.message || 'Error'}`, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setActionLoading(true);
      const res = await cancelMaintenance();
      setStatus(res);
      onNotification?.('✅ Maintenance cancelled. Game operations resumed normally!');
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

  const isScheduled = status?.isScheduled && remainingSec > 0;
  const isActive = status?.isActive || (status?.isScheduled && remainingSec <= 0);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
      {/* Background ambient indicator glow */}
      <div
        className={`absolute -right-16 -top-16 w-44 h-44 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          isActive
            ? 'bg-rose-500/20'
            : isScheduled
            ? 'bg-amber-500/20'
            : 'bg-emerald-500/10'
        }`}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>🛠️</span>
              <span>System Maintenance & Player Notice</span>
            </h3>

            {/* Dynamic Status Pill */}
            {isActive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 border border-rose-500/30 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>MAINTENANCE ACTIVE</span>
              </span>
            ) : isScheduled ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>COUNTDOWN: {formatCountdown(remainingSec)}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>ALL ROOMS ONLINE</span>
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {isActive
              ? 'New rounds are paused. Connected players see a maintenance screen. Queued bets have been refunded.'
              : isScheduled
              ? `Real-time warning banner displayed on players' screens. At 00:00, new game rounds will freeze and queued bets will be auto-refunded to user balances.`
              : 'Games are running 24/7 with zero interruption. Use this control before deploying database migrations or server reboots.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {isScheduled || isActive ? (
            <button
              onClick={handleCancel}
              disabled={actionLoading}
              className="px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600 transition shadow-lg disabled:opacity-50 flex items-center gap-2"
            >
              <span>🔄</span>
              <span>{actionLoading ? 'Cancelling...' : 'Cancel & Resume Games'}</span>
            </button>
          ) : (
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={loading || actionLoading}
              className="px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 hover:border-amber-500/50 transition shadow-lg shadow-amber-500/5 flex items-center gap-2"
            >
              <span>⚠️</span>
              <span>Schedule 15m Maintenance</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h4 className="text-base font-bold text-white flex items-center gap-2 mb-2">
              <span>⚠️</span>
              <span>Confirm Scheduled Maintenance</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              All connected game players will immediately receive a live countdown notice. When the countdown completes, starting new games will pause, and any queued bets for the next round will be <strong>automatically refunded to players' balances</strong>.
            </p>

            <div className="space-y-3 mb-6">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Countdown Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={minutesInput}
                  onChange={(e) => setMinutesInput(Math.max(1, parseInt(e.target.value) || 15))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Custom Notice Message (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Scheduled system maintenance in progress. New games will be paused."
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSchedule}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-black transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {actionLoading ? 'Broadcasting...' : 'Broadcast & Start Countdown'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
