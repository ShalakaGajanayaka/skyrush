'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, QrCode, Phone, Building2, Copy, CheckCircle2, ShieldCheck } from 'lucide-react';
import { fetchChannels } from '@/lib/api';
import { PaymentChannel } from '@/lib/types';

export default function ChannelsPage() {
  const [channels, setChannels] = useState<PaymentChannel[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    fetchChannels().then(setChannels).catch(console.error);
  }, []);

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label}: ${text}`);
  };

  const getChannelIcon = (type: string) => {
    if (type.includes('ipay')) return <QrCode className="w-6 h-6 text-emerald-400" />;
    if (type.includes('upay')) return <Phone className="w-6 h-6 text-purple-400" />;
    return <Building2 className="w-6 h-6 text-blue-400" />;
  };

  const getBorderColor = (type: string) => {
    if (type.includes('ipay')) return 'border-emerald-500/30 hover:border-emerald-500/50';
    if (type.includes('upay')) return 'border-purple-500/30 hover:border-purple-500/50';
    return 'border-blue-500/30 hover:border-blue-500/50';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-emerald-400" />
          <span>Active Deposit Channels</span>
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Payment accounts displayed to players in the mobile & web game client
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {channels.map((ch) => (
          <div
            key={ch.id}
            className={`rounded-2xl bg-[#0f172a]/70 backdrop-blur-xl border ${getBorderColor(
              ch.type
            )} p-6 shadow-xl shadow-black/30 flex flex-col justify-between transition-all`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
                  {getChannelIcon(ch.type)}
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/[0.05] border border-white/10 text-gray-300">
                  {ch.badge}
                </span>
              </div>

              <h3 className="text-base font-bold text-white mb-1">{ch.name}</h3>
              <p className="text-xs text-gray-400 mb-4">{ch.accountName}</p>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-semibold">Account / Merchant ID</span>
                  <button
                    onClick={() => copyText(ch.accountNumber, ch.name)}
                    className="p-1 hover:text-white transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-blue-400" />
                  </button>
                </div>
                <div className="text-sm font-extrabold text-white font-mono tracking-wide">
                  {ch.accountNumber}
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-white/[0.01] border border-white/[0.03] text-[11px] text-gray-400 leading-relaxed">
                {ch.instructions}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Channel</span>
              </span>
              <span className="text-gray-400 text-[11px]">Instant Verification</span>
            </div>
          </div>
        ))}
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-xs font-bold text-white bg-blue-600/90 border border-blue-500/40 shadow-2xl backdrop-blur-xl animate-slide-up">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
