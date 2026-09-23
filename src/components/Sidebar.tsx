'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Clock,
  History,
  Users,
  CreditCard,
  Plane,
  PlusCircle,
  Radio,
} from 'lucide-react';

interface SidebarProps {
  pendingCount?: number;
  onOpenManualCredit?: () => void;
}

export default function Sidebar({ pendingCount = 0, onOpenManualCredit }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
    },
    {
      label: 'Pending Approvals',
      href: '/deposits/pending',
      icon: Clock,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      label: 'Deposit History',
      href: '/deposits',
      icon: History,
    },
    {
      label: 'Players Directory',
      href: '/players',
      icon: Users,
    },
    {
      label: 'Payment Channels',
      href: '/channels',
      icon: CreditCard,
    },
  ];

  return (
    <aside className="w-64 bg-[#0d121d]/90 backdrop-blur-xl border-r border-white/5 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-40">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center shadow-lg shadow-red-500/25">
            <Plane className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              SkyRush Aviator
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Admin Portal
            </p>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="p-4">
          <button
            onClick={onOpenManualCredit}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl font-semibold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Direct Credit Wallet</span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* System Status Footer */}
      <div className="p-4 m-3 rounded-xl bg-white/[0.02] border border-white/5">
        <div className="flex items-center gap-2 text-[11px] font-medium text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold">Engine Connected</span>
        </div>
        <div className="mt-1 text-[10px] text-gray-400">
          Port: 3000 (WebSocket Active)
        </div>
      </div>
    </aside>
  );
}
