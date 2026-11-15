'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Share2,
  Search,
  RefreshCw,
  Coins,
  Users,
  Award,
  Wallet,
  ArrowUpDown,
  Download,
  X,
  Copy,
  Check,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  ShieldCheck,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  fetchReferralSummary,
  fetchAdminAffiliates,
  fetchAdminAffiliateNetwork,
  updateAffiliateTier,
} from '@/lib/api';
import {
  ReferralSummaryStats,
  AdminAffiliateItem,
  AdminAffiliateNetworkResponse,
  ReferredPilotDetail,
} from '@/lib/types';

export default function ReferralsManagementPage() {
  const [summary, setSummary] = useState<ReferralSummaryStats | null>(null);
  const [affiliates, setAffiliates] = useState<AdminAffiliateItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(true);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('volume');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // Network Connector Drawer
  const [drawerAffiliateId, setDrawerAffiliateId] = useState<string | null>(null);
  const [drawerLoading, setDrawerLoading] = useState<boolean>(false);
  const [networkData, setNetworkData] = useState<AdminAffiliateNetworkResponse | null>(null);

  // Tier Adjustment Modal
  const [tierModalAffiliate, setTierModalAffiliate] = useState<AdminAffiliateItem | null>(null);
  const [targetTier, setTargetTier] = useState<string>('BRONZE');
  const [updatingTier, setUpdatingTier] = useState<boolean>(false);

  // UI Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`Copied: ${text}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Load KPI Summary
  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const data = await fetchReferralSummary();
      setSummary(data);
    } catch (err: any) {
      console.error('Failed to load referral summary', err);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // Load Affiliates Table
  const loadAffiliates = useCallback(
    async (page: number) => {
      setLoading(true);
      try {
        const res = await fetchAdminAffiliates({
          page,
          limit: 15,
          search: searchTerm.trim() || undefined,
          tier: selectedTier !== 'ALL' ? selectedTier : undefined,
          sortBy,
          sortOrder,
        });
        setAffiliates(res.affiliates || []);
        setTotalCount(res.totalCount || 0);
        setTotalPages(res.totalPages || 1);
        setCurrentPage(res.page || 1);
      } catch (err: any) {
        console.error('Failed to load affiliates list', err);
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, selectedTier, sortBy, sortOrder]
  );

  // Initial load
  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // Debounced search / filter trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      loadAffiliates(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedTier, sortBy, sortOrder, loadAffiliates]);

  // Open Connector Drawer
  const handleOpenDrawer = async (affiliateId: string) => {
    setDrawerAffiliateId(affiliateId);
    setDrawerLoading(true);
    try {
      const data = await fetchAdminAffiliateNetwork(affiliateId);
      setNetworkData(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load affiliate network');
      setDrawerAffiliateId(null);
    } finally {
      setDrawerLoading(false);
    }
  };

  // Open Tier Modal
  const handleOpenTierModal = (affiliate: AdminAffiliateItem) => {
    setTierModalAffiliate(affiliate);
    setTargetTier(affiliate.referralTier || 'BRONZE');
  };

  // Submit Tier Update
  const handleSaveTier = async () => {
    if (!tierModalAffiliate) return;
    setUpdatingTier(true);
    try {
      await updateAffiliateTier(tierModalAffiliate.id, targetTier);
      showToast(`✅ Successfully updated ${tierModalAffiliate.username} to ${targetTier} Tier!`);
      setTierModalAffiliate(null);
      loadAffiliates(currentPage);
      loadSummary();
    } catch (err: any) {
      showToast(err.message || 'Failed to update tier');
    } finally {
      setUpdatingTier(false);
    }
  };

  // Export Affiliates Data to CSV
  const handleExportCSV = () => {
    if (affiliates.length === 0) {
      showToast('No affiliate data to export');
      return;
    }

    const headers = [
      'Affiliate ID',
      'Username',
      'Email',
      'Referral Code',
      'Tier',
      'Recruited Pilots',
      'Active Depositors',
      'Total Deposit Volume USD',
      '5% FTD Earned USD',
      'Turnover Rebates USD',
      'Lifetime Total Earned USD',
      'Wallet Balance USD',
      'Status',
      'Registration Date',
    ];

    const rows = affiliates.map((a) => [
      a.id,
      `"${a.username}"`,
      `"${a.email || ''}"`,
      a.referralCode,
      a.referralTier,
      a.referredPilotsCount,
      a.activePilotsCount,
      a.totalVolumeUSD.toFixed(2),
      a.ftdEarnedUSD.toFixed(4),
      a.wagerEarnedUSD.toFixed(4),
      a.totalReferralEarningsUSD.toFixed(4),
      a.referralBalanceUSD.toFixed(4),
      a.isFrozen ? 'FROZEN' : 'ACTIVE',
      new Date(a.createdAt).toISOString(),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `skyrush-affiliates-audit-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📥 Affiliates audit CSV downloaded successfully');
  };

  const getTierBadge = (tier: string) => {
    switch (tier?.toUpperCase()) {
      case 'VIP':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-yellow-300 border border-yellow-500/30">
            <Sparkles className="w-3 h-3 text-yellow-300" />
            VIP (1.50%)
          </span>
        );
      case 'GOLD':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/25">
            <Award className="w-3 h-3 text-amber-300" />
            GOLD (1.00%)
          </span>
        );
      case 'SILVER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-400/15 text-slate-200 border border-slate-400/25">
            <Award className="w-3 h-3 text-slate-300" />
            SILVER (0.75%)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/12 text-orange-300 border border-orange-500/20">
            <Award className="w-3 h-3 text-orange-400" />
            BRONZE (0.50%)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1e293b] text-white text-xs px-4 py-3 rounded-xl shadow-2xl border border-white/10 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Share2 className="w-6 h-6 text-amber-400" />
            <span>Affiliates & Referral Network</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Real-time tracking of player connectors, deposit volumes, 5% FTD bonuses, and flight turnover rebates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              loadSummary();
              loadAffiliates(currentPage);
            }}
            disabled={loading || summaryLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-200 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading || summaryLoading ? 'animate-spin text-amber-400' : ''}`}
            />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-semibold transition-all active:scale-95 border border-emerald-500/25"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Referral Deposit Volume */}
        <div className="rounded-2xl bg-[#0f172a]/70 backdrop-blur-xl border border-white/5 p-5 shadow-xl shadow-black/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Total Ref Deposit Volume
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-white font-mono">
              ${summary ? summary.totalDepositVolumeUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}{' '}
              <span className="text-xs text-gray-400 font-sans font-normal">USD</span>
            </div>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <span>Deposits from recruited pilots</span>
            </p>
          </div>
        </div>

        {/* Card 2: Total Commissions Paid */}
        <div className="rounded-2xl bg-[#0f172a]/70 backdrop-blur-xl border border-white/5 p-5 shadow-xl shadow-black/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Total Commissions Paid
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Coins className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-amber-400 font-mono">
              ${summary ? summary.totalCommissionsPaidUSD.toFixed(2) : '0.00'}{' '}
              <span className="text-xs text-gray-400 font-sans font-normal">USD</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              FTD: ${summary ? summary.totalFtdCommissionsUSD.toFixed(2) : '0.00'} · Rebates: ${summary ? summary.totalWagerCommissionsUSD.toFixed(2) : '0.00'}
            </p>
          </div>
        </div>

        {/* Card 3: Network Relationships */}
        <div className="rounded-2xl bg-[#0f172a]/70 backdrop-blur-xl border border-white/5 p-5 shadow-xl shadow-black/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Network Connectors
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-white font-mono">
              {summary ? summary.totalAffiliates : 0}{' '}
              <span className="text-sm font-semibold text-gray-400 font-sans">Promoters</span>
            </div>
            <p className="text-[11px] text-blue-400 mt-1">
              {summary ? summary.totalReferredPilots : 0} recruited pilots connected
            </p>
          </div>
        </div>

        {/* Card 4: Unclaimed Wallet Liability */}
        <div className="rounded-2xl bg-[#0f172a]/70 backdrop-blur-xl border border-white/5 p-5 shadow-xl shadow-black/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Claimable Liability
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-purple-300 font-mono">
              ${summary ? summary.totalClaimableLiabilityUSD.toFixed(2) : '0.00'}{' '}
              <span className="text-xs text-gray-400 font-sans font-normal">USD</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Awaiting transfer to game wallets
            </p>
          </div>
        </div>
      </div>

      {/* Search, Tier Filters & Sorting Bar */}
      <div className="p-4 rounded-2xl bg-[#0f172a]/70 backdrop-blur-xl border border-white/5 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full lg:max-w-xs">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search username or referral code..."
            className="w-full bg-[#182234] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>

        {/* Tier Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1 hidden sm:inline">
            Tier:
          </span>
          {['ALL', 'BRONZE', 'SILVER', 'GOLD', 'VIP'].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTier(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedTier === t
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.07]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 self-end lg:self-auto">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#182234] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
          >
            <option value="volume">Highest Deposit Volume</option>
            <option value="commission">Highest Earnings</option>
            <option value="pilots">Most Recruited Pilots</option>
            <option value="balance">Highest Wallet Balance</option>
            <option value="createdAt">Registration Date</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
            title="Toggle Sort Order"
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Affiliates Data Table */}
      <div className="rounded-2xl bg-[#0f172a]/70 backdrop-blur-xl border border-white/5 overflow-hidden shadow-xl shadow-black/30">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-white/[0.01]">
                <th className="py-3 px-4">Affiliate Promoter</th>
                <th className="py-3 px-3">Tier</th>
                <th className="py-3 px-3">Pilots Recruited</th>
                <th className="py-3 px-3 text-right">Volume Driven</th>
                <th className="py-3 px-3 text-right">5% FTD Bonus</th>
                <th className="py-3 px-3 text-right">Flight Rebates</th>
                <th className="py-3 px-3 text-right">Lifetime Total</th>
                <th className="py-3 px-3 text-right">Claimable Wallet</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center">
                    <RefreshCw className="w-6 h-6 text-amber-400 animate-spin mx-auto mb-2" />
                    <span className="text-gray-400 font-medium">Loading affiliate connectors...</span>
                  </td>
                </tr>
              ) : affiliates.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center">
                    <Users className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                    <span className="text-gray-400 font-medium">No matching affiliates found</span>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Try clearing search filters or checking registered players.
                    </p>
                  </td>
                </tr>
              ) : (
                affiliates.map((a) => (
                  <tr key={a.id} className="hover:bg-white/[0.02] transition-colors group">
                    {/* Affiliate Promoter Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-extrabold text-xs shadow-md shadow-amber-500/20">
                          {a.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{a.username}</span>
                            {a.isFrozen && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                FROZEN
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="font-mono text-[10px] text-gray-400 bg-white/[0.04] px-1.5 py-0.5 rounded">
                              {a.referralCode}
                            </span>
                            <button
                              onClick={() => copyToClipboard(a.referralCode, a.id)}
                              className="text-gray-400 hover:text-white transition-colors"
                              title="Copy Referral Code"
                            >
                              {copiedKey === a.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Tier */}
                    <td className="py-3 px-3">{getTierBadge(a.referralTier)}</td>

                    {/* Pilots Recruited */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-400" />
                        <span>{a.referredPilotsCount} pilots</span>
                      </div>
                      <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span>{a.activePilotsCount} active depositors</span>
                      </div>
                    </td>

                    {/* Volume Driven */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-white">
                      ${a.totalVolumeUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* 5% FTD Bonus */}
                    <td className="py-3 px-3 text-right font-mono font-semibold text-amber-400">
                      ${a.ftdEarnedUSD.toFixed(4)}
                    </td>

                    {/* Flight Rebates */}
                    <td className="py-3 px-3 text-right font-mono text-gray-300">
                      ${a.wagerEarnedUSD.toFixed(4)}
                    </td>

                    {/* Lifetime Total */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                      ${a.totalReferralEarningsUSD.toFixed(4)}
                    </td>

                    {/* Claimable Wallet */}
                    <td className="py-3 px-3 text-right font-mono text-purple-300">
                      ${a.referralBalanceUSD.toFixed(4)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenDrawer(a.id)}
                          className="px-2.5 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 text-[11px] font-semibold transition-all border border-blue-500/25 flex items-center gap-1"
                          title="Inspect Recruited Pilots Network"
                        >
                          <span>Connectors</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => handleOpenTierModal(a)}
                          className="p-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 transition-colors"
                          title="Adjust Tier"
                        >
                          <Award className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <div className="p-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <div>
            Showing <span className="font-bold text-white">{affiliates.length}</span> of{' '}
            <span className="font-bold text-white">{totalCount}</span> affiliates
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadAffiliates(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
              className="px-3 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-200 font-semibold disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <span className="px-2 font-bold text-white">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => loadAffiliates(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
              className="px-3 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-200 font-semibold disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Slide-Over Connector Drawer (Audit Network) */}
      {drawerAffiliateId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-[#0c111c] border-l border-white/10 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-250">
            {/* Drawer Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-amber-500/20">
                  {networkData?.affiliate.username.charAt(0).toUpperCase() || 'A'}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <span>{networkData?.affiliate.username}</span>
                    {networkData && getTierBadge(networkData.affiliate.referralTier)}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono">
                    Code: <span className="text-amber-400 font-bold">{networkData?.affiliate.referralCode}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setDrawerAffiliateId(null);
                  setNetworkData(null);
                }}
                className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {drawerLoading ? (
                <div className="py-20 text-center">
                  <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-3" />
                  <p className="text-xs text-gray-400">Loading recruited pilots network...</p>
                </div>
              ) : networkData ? (
                <>
                  {/* Summary Banner */}
                  <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase font-bold">Recruited</div>
                      <div className="text-base font-black text-white mt-0.5">
                        {networkData.pilotsCount} pilots
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase font-bold">Total Deposited</div>
                      <div className="text-base font-black text-emerald-400 mt-0.5 font-mono">
                        $
                        {networkData.pilots
                          .reduce((acc, curr) => acc + curr.totalDepositedUSD, 0)
                          .toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase font-bold">Earned from Network</div>
                      <div className="text-base font-black text-amber-400 mt-0.5 font-mono">
                        $
                        {networkData.pilots
                          .reduce((acc, curr) => acc + curr.totalEarnedUSD, 0)
                          .toFixed(4)}
                      </div>
                    </div>
                  </div>

                  {/* Pilots Squadron List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
                      <span>Recruited Pilots Squadron</span>
                      <span>{networkData.pilots.length} records</span>
                    </div>

                    {networkData.pilots.length === 0 ? (
                      <div className="text-center py-12 rounded-xl bg-white/[0.01] border border-white/5">
                        <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <p className="text-xs text-gray-400 font-medium">No pilots recruited yet</p>
                      </div>
                    ) : (
                      networkData.pilots.map((pilot) => (
                        <div
                          key={pilot.id}
                          className="p-3.5 rounded-xl bg-[#141b2a]/70 border border-white/5 space-y-2 hover:border-white/10 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-white text-xs">{pilot.username}</span>
                              {pilot.isFrozen && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300">
                                  SUSPENDED
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 font-mono">
                              Joined: {new Date(pilot.joinedAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5 text-[11px]">
                            <div>
                              <span className="text-gray-400 block text-[10px]">Total Deposited</span>
                              <span
                                className={`font-mono font-bold ${
                                  pilot.totalDepositedUSD > 0 ? 'text-emerald-400' : 'text-gray-500'
                                }`}
                              >
                                ${pilot.totalDepositedUSD.toFixed(2)}{' '}
                                <span className="text-[9px] text-gray-400 font-normal">
                                  ({pilot.approvedDepositsCount} dep)
                                </span>
                              </span>
                            </div>

                            <div>
                              <span className="text-gray-400 block text-[10px]">5% FTD Bonus</span>
                              <span className="font-mono font-semibold text-amber-400">
                                ${pilot.ftdEarnedUSD.toFixed(4)}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-gray-400 block text-[10px]">Lifetime Earned</span>
                              <span className="font-mono font-bold text-white">
                                ${pilot.totalEarnedUSD.toFixed(4)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Tier Adjustment Modal */}
      {tierModalAffiliate && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101726] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
                  <Award className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Adjust Affiliate Tier</h3>
                  <p className="text-xs text-gray-400">Promoter: {tierModalAffiliate.username}</p>
                </div>
              </div>
              <button
                onClick={() => setTierModalAffiliate(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Select Commission Tier:
              </label>

              {[
                { tier: 'BRONZE', rate: '0.50%', desc: 'Default starting tier for all pilots' },
                { tier: 'SILVER', rate: '0.75%', desc: 'Qualified promoters (10+ active pilots)' },
                { tier: 'GOLD', rate: '1.00%', desc: 'Top active affiliates (25+ active pilots)' },
                { tier: 'VIP', rate: '1.50%', desc: 'Official SkyRush Streamers & Super Partners' },
              ].map((opt) => (
                <div
                  key={opt.tier}
                  onClick={() => setTargetTier(opt.tier)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    targetTier === opt.tier
                      ? 'bg-amber-500/15 border-amber-500/50 shadow-lg shadow-amber-500/10'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div>
                    <div className="font-extrabold text-sm text-white flex items-center gap-2">
                      <span>{opt.tier}</span>
                      <span className="text-xs font-mono text-amber-400 font-bold">
                        ({opt.rate} turnover)
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{opt.desc}</div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      targetTier === opt.tier
                        ? 'border-amber-400 bg-amber-400 text-black'
                        : 'border-white/20'
                    }`}
                  >
                    {targetTier === opt.tier && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
              <button
                onClick={() => setTierModalAffiliate(null)}
                className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-gray-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTier}
                disabled={updatingTier}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {updatingTier ? 'Updating...' : 'Save Tier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
