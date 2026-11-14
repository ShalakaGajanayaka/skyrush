'use client';

import React, { useState } from 'react';
import {
  Sliders,
  Server,
  Database,
  Cpu,
  ShieldCheck,
  Radio,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';
import { MaintenanceControl } from '@/components/MaintenanceControl';
import { broadcastAnnouncement } from '@/lib/api';

export default function SystemOperationsPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isToastError, setIsToastError] = useState(false);

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('System Notice');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastType, setBroadcastType] = useState<'info' | 'warning' | 'success'>('info');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const showToast = (msg: string, isError: boolean = false) => {
    setToastMessage(msg);
    setIsToastError(isError);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) {
      showToast('Please enter an announcement message.', true);
      return;
    }

    try {
      setIsBroadcasting(true);
      await broadcastAnnouncement({
        title: broadcastTitle.trim() || undefined,
        message: broadcastMsg.trim(),
        type: broadcastType,
      });
      showToast('📢 Announcement successfully broadcasted to all active players!');
      setBroadcastMsg('');
    } catch (err: any) {
      showToast(`❌ Failed to broadcast: ${err?.message || 'Error'}`, true);
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-[999999] px-5 py-3 rounded-xl border text-sm font-semibold shadow-2xl backdrop-blur-xl flex items-center gap-2 transition-all ${
            isToastError
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-300'
              : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
          }`}
        >
          {isToastError ? (
            <AlertCircle className="w-5 h-5 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          )}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sliders className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                System Operations & Maintenance Control
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Centralized mission control for platform maintenance schedules, player announcements, and core health telemetry.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Infrastructure Telemetry: Normal</span>
          </div>
        </div>
      </div>

      {/* Infrastructure Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-[#0f172a]/70 border border-white/5 p-5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Game Engine</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-black text-white">WebSocket Core</div>
          <div className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>engine.skyrush.cc (Active)</span>
          </div>
        </div>

        <div className="rounded-2xl bg-[#0f172a]/70 border border-white/5 p-5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Database Ledger</span>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-lg font-black text-white">PostgreSQL 16</div>
          <div className="text-[11px] text-blue-400 font-semibold mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>ACID Transactions Live</span>
          </div>
        </div>

        <div className="rounded-2xl bg-[#0f172a]/70 border border-white/5 p-5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">In-Memory Cache</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg font-black text-white">Redis 7 Core</div>
          <div className="text-[11px] text-purple-400 font-semibold mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <span>Distributed Token Mutex</span>
          </div>
        </div>

        <div className="rounded-2xl bg-[#0f172a]/70 border border-white/5 p-5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Provably Fair RNG</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-black text-white">HMAC-SHA256</div>
          <div className="text-[11px] text-amber-400 font-semibold mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>97.0% RTP Verified</span>
          </div>
        </div>
      </div>

      {/* Section 1: Dedicated Maintenance Control Hub */}
      <MaintenanceControl onNotification={showToast} />

      {/* Section 2: Live In-Game Player Announcement Broadcaster */}
      <div className="rounded-2xl bg-[#0f172a]/80 border border-white/10 p-6 backdrop-blur-xl shadow-xl">
        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />
              <span>Live In-Game Player Announcement</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Broadcast an immediate notification banner or alert directly to the screens of all connected players in real-time.
            </p>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Realtime Sockets
          </span>
        </div>

        <form onSubmit={handleSendBroadcast} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Banner Title
              </label>
              <input
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="e.g. System Notice"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Alert Type
              </label>
              <select
                value={broadcastType}
                onChange={(e) => setBroadcastType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="info">🔵 Informational (Blue)</option>
                <option value="warning">🟡 Operational Warning (Amber)</option>
                <option value="success">🟢 Promotional / Success (Emerald)</option>
              </select>
            </div>

            <div className="md:col-span-1 flex items-end">
              <button
                type="submit"
                disabled={isBroadcasting}
                className="w-full py-2.5 px-5 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/25 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{isBroadcasting ? 'Broadcasting...' : 'Broadcast to All Players'}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Message Content
            </label>
            <textarea
              rows={2}
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
              placeholder="e.g. High withdrawal volume detected. All manual cashouts are proceeding normally."
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
        </form>
      </div>

      {/* Section 3: DevOps Standard Operating Procedure (SOP) Reference */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800/80 p-6">
        <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Operator Standard Operating Procedure (SOP) for System Updates</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-400">
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="font-bold text-white block mb-1">1. Schedule 15m Maintenance</span>
            Click "Schedule 15m Maintenance". In-game live ticker alerts all connected players with a countdown.
          </div>
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="font-bold text-white block mb-1">2. Auto-Refund & Freeze</span>
            At 00:00, all queued bets are auto-refunded to player balances. Final flight crashes safely, pausing new rounds.
          </div>
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="font-bold text-white block mb-1">3. Hot Reload & Resume</span>
            Run <code className="text-amber-300 font-mono">bash update_server.sh</code> on VPS, then click "Cancel & Resume Games".
          </div>
        </div>
      </div>
    </div>
  );
}
