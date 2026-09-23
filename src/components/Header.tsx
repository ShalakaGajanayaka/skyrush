'use client';

import React from 'react';
import { RefreshCw, Bell, Volume2, VolumeX, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export default function Header({
  title = 'Operations Console',
  subtitle = 'Real-time deposits and player balance management',
  onRefresh,
  isRefreshing = false,
  soundEnabled = true,
  onToggleSound,
}: HeaderProps) {
  return (
    <header className="h-16 px-8 border-b border-white/5 bg-[#0d121d]/80 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30">
      <div>
        <h2 className="text-base font-bold text-white tracking-tight">{title}</h2>
        <p className="text-[11px] text-gray-400 font-medium">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Sound Chime Toggle */}
        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'Deposit Alert Sound On' : 'Deposit Alert Sound Muted'}
          className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
            soundEnabled
              ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20'
              : 'bg-white/5 border-white/10 text-gray-400 hover:text-gray-300'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span className="hidden sm:inline">{soundEnabled ? 'Sound On' : 'Muted'}</span>
        </button>

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-gray-200 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span>Refresh</span>
          </button>
        )}

        {/* Security Role Badge */}
        <div className="flex items-center gap-2 pl-3 border-l border-white/10">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-blue-500/20">
            A
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-bold text-white leading-none flex items-center gap-1">
              <span>Super Admin</span>
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-[10px] text-gray-400 font-medium">Session Active</div>
          </div>
        </div>
      </div>
    </header>
  );
}
