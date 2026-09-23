'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'emerald' | 'amber' | 'blue' | 'purple' | 'red';
  highlight?: boolean;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'blue',
  highlight = false,
}: MetricCardProps) {
  const colorMap = {
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      glow: 'from-emerald-500/10 to-transparent',
      text: 'text-emerald-400',
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400',
      glow: 'from-amber-500/10 to-transparent',
      text: 'text-amber-400',
    },
    blue: {
      border: 'border-blue-500/20 hover:border-blue-500/40',
      iconBg: 'bg-blue-500/10 text-blue-400',
      glow: 'from-blue-500/10 to-transparent',
      text: 'text-blue-400',
    },
    purple: {
      border: 'border-purple-500/20 hover:border-purple-500/40',
      iconBg: 'bg-purple-500/10 text-purple-400',
      glow: 'from-purple-500/10 to-transparent',
      text: 'text-purple-400',
    },
    red: {
      border: 'border-red-500/20 hover:border-red-500/40',
      iconBg: 'bg-red-500/10 text-red-400',
      glow: 'from-red-500/10 to-transparent',
      text: 'text-red-400',
    },
  };

  const c = colorMap[variant];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-[#0f172a]/60 backdrop-blur-xl border ${c.border} p-5 shadow-lg shadow-black/20 transition-all hover:translate-y-[-2px] ${
        highlight ? 'ring-2 ring-amber-500/30' : ''
      }`}
    >
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${c.glow}`} />

      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
          {title}
        </span>
        <div className={`w-8 h-8 rounded-lg ${c.iconBg} flex items-center justify-center`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl font-black tracking-tight text-white">{value}</div>
        {subtitle && (
          <p className="mt-1 text-[11px] font-medium text-gray-400">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
