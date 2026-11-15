'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  PlusCircle,
  Trophy,
  Gamepad2,
  Coins,
  Sparkles,
  Video,
  Zap,
  RotateCcw,
  History,
  Ban,
  Unlock,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  X,
  Check,
} from 'lucide-react';
import { fetchUsers, freezePlayer, unfreezePlayer } from '@/lib/api';
import { User } from '@/lib/types';
import ManualCreditModal from '@/components/ManualCreditModal';
import MarketingModal from '@/components/MarketingModal';
import BalanceAdjustmentModal from '@/components/BalanceAdjustmentModal';
import PlayerHistoryDrawer from '@/components/PlayerHistoryDrawer';

export default function PlayersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [marketingUser, setMarketingUser] = useState<User | null>(null);
  const [isMarketingModalOpen, setIsMarketingModalOpen] = useState(false);
  const [adjustUser, setAdjustUser] = useState<User | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [historyUser, setHistoryUser] = useState<User | null>(null);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Ban & Unban Management State
  const [banUser, setBanUser] = useState<User | null>(null);
  const [banReasonPreset, setBanReasonPreset] = useState<string>('Referral Bonus Exploitation / Multi-Accounting');
  const [banCustomReason, setBanCustomReason] = useState<string>('');
  const [isSubmittingBan, setIsSubmittingBan] = useState<boolean>(false);

  const [unbanUser, setUnbanUser] = useState<User | null>(null);
  const [isSubmittingUnban, setIsSubmittingUnban] = useState<boolean>(false);

  const handleOpenBan = (u: User) => {
    setBanUser(u);
    setBanReasonPreset('Referral Bonus Exploitation / Multi-Accounting');
    setBanCustomReason('');
  };

  const handleConfirmBan = async () => {
    if (!banUser) return;
    const finalReason = banCustomReason.trim()
      ? `${banReasonPreset} - ${banCustomReason.trim()}`
      : banReasonPreset;

    setIsSubmittingBan(true);
    try {
      await freezePlayer(banUser.id, finalReason);
      showToast(`⛔ Player ${banUser.username} has been BANNED and live sessions disconnected!`);
      setBanUser(null);
      loadData(searchTerm);
    } catch (err: any) {
      showToast(err.message || 'Failed to ban player');
    } finally {
      setIsSubmittingBan(false);
    }
  };

  const handleOpenUnban = (u: User) => {
    setUnbanUser(u);
  };

  const handleConfirmUnban = async () => {
    if (!unbanUser) return;
    setIsSubmittingUnban(true);
    try {
      await unfreezePlayer(unbanUser.id);
      showToast(`✅ Player ${unbanUser.username} has been UNBANNED and access restored!`);
      setUnbanUser(null);
      loadData(searchTerm);
    } catch (err: any) {
      showToast(err.message || 'Failed to unban player');
    } finally {
      setIsSubmittingUnban(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = useCallback(async (searchQuery = '') => {
    if (typeof window !== 'undefined' && !localStorage.getItem('admin_token')) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchUsers(searchQuery, 100);
      setUsers(data);
    } catch (err: any) {
      if (err?.message !== 'Unauthorized') {
        console.error('Failed to load users', err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, loadData]);

  const handleOpenCredit = (username: string) => {
    setSelectedUser(username);
    setIsModalOpen(true);
  };

  const handleOpenMarketing = (u: User) => {
    setMarketingUser(u);
    setIsMarketingModalOpen(true);
  };

  const handleOpenHistory = (u: User) => {
    setHistoryUser(u);
    setIsHistoryDrawerOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-400" />
            <span>Registered Players Directory</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Real-time player wallet balances, gameplay history, and direct deposit adjustments
          </p>
        </div>

        <button
          onClick={() => loadData(searchTerm)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-200 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="p-4 rounded-2xl bg-[#0f172a]/70 backdrop-blur-xl border border-white/5 shadow-lg flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by username, email, or phone number..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
          />
        </div>
        <div className="text-xs text-gray-400 font-semibold hidden sm:block">
          Showing <span className="text-white font-bold">{users.length}</span> players
        </div>
      </div>

      {/* Players Directory Table */}
      <div className="rounded-2xl bg-[#0f172a]/70 backdrop-blur-xl border border-white/5 p-6 shadow-xl shadow-black/30 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/5 text-gray-400 text-[11px] font-bold uppercase tracking-wider">
              <th className="py-3 px-4">Player Username</th>
              <th className="py-3 px-4">Contact / Identifier</th>
              <th className="py-3 px-4">Role / Tag</th>
              <th className="py-3 px-4">Wallet Balance ($ USD)</th>
              <th className="py-3 px-4">Games Played</th>
              <th className="py-3 px-4">Total Won ($ USD)</th>
              <th className="py-3 px-4 text-right">Quick Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-500">
                  No players found matching &quot;{searchTerm}&quot;.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/12 text-purple-300 font-bold flex items-center justify-center text-xs border-none">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <span>{u.username}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-gray-400 text-[11px]">
                    {u.email || u.phoneNumber || '-'}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {u.isFrozen ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-black text-[10px] bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            title={u.freezeReason || 'Suspended by Administrator'}
                          >
                            <Ban className="w-3 h-3 text-rose-400" />
                            <span>BANNED</span>
                          </span>
                        ) : u.isMarketing ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-extrabold text-[10px] bg-purple-500/15 text-purple-300 border-none">
                            <Video className="w-3 h-3 text-purple-400" />
                            <span>MARKETING</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full font-medium text-[10px] bg-white/[0.05] text-gray-400 border-none">
                            Player
                          </span>
                        )}
                        {u.isMarketing && u.isMarketingAutoWin && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-extrabold text-[9px] bg-amber-500/15 text-amber-300 border-none">
                            <Zap className="w-2.5 h-2.5 fill-amber-300" />
                            <span>AUTO-WIN</span>
                          </span>
                        )}
                      </div>
                      {u.isFrozen && u.freezeReason && (
                        <span className="text-[10px] text-gray-400 truncate max-w-[170px]" title={u.freezeReason}>
                          {u.freezeReason}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-sm font-extrabold text-emerald-400 flex items-center gap-1 font-mono">
                      <Coins className="w-3.5 h-3.5" />
                      <span>
                        ${Number(u.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                      </span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-gray-300 font-medium">
                    <div className="flex items-center gap-1">
                      <Gamepad2 className="w-3 h-3 text-gray-400" />
                      <span>{u.gamesPlayed || 0}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-amber-400">
                    <div className="flex items-center gap-1 font-mono">
                      <Trophy className="w-3 h-3 text-amber-400" />
                      <span>
                        ${Number(u.totalWon || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {/* Ban / Unban Toggle Button */}
                      {u.isFrozen ? (
                        <button
                          onClick={() => handleOpenUnban(u)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold text-xs border border-emerald-500/25 transition-all active:scale-95"
                          title="Unban Player & Restore Account Access"
                        >
                          <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Unban</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenBan(u)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold text-xs border border-rose-500/25 transition-all active:scale-95"
                          title="Ban Player & Disconnect Live Sessions"
                        >
                          <Ban className="w-3.5 h-3.5 text-rose-400" />
                          <span>Ban</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenHistory(u)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-bold text-xs border-none transition-all active:scale-95"
                        title="View Bet, Deposit & Withdrawal History"
                      >
                        <History className="w-3.5 h-3.5 text-cyan-400" />
                        <span>History</span>
                      </button>
                      <button
                        onClick={() => {
                          setAdjustUser(u);
                          setIsAdjustModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs border-none transition-all active:scale-95"
                        title="Adjust or Reset Balance to Zero"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                        <span>Adjust</span>
                      </button>
                      <button
                        onClick={() => handleOpenMarketing(u)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-bold text-xs border-none transition-all active:scale-95"
                        title="Marketing & Influencer Studio Settings"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>Studio</span>
                      </button>
                      <button
                        onClick={() => handleOpenCredit(u.username)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs border-none transition-all active:scale-95"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Credit</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PlayerHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        user={historyUser}
      />

      <ManualCreditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        prefillUsername={selectedUser}
        onCreditSuccess={(user, amount) => {
          showToast(`✅ Successfully credited $${Number(amount).toFixed(2)} USD to ${user?.username || selectedUser}!`);
          loadData(searchTerm);
        }}
      />

      <MarketingModal
        isOpen={isMarketingModalOpen}
        onClose={() => setIsMarketingModalOpen(false)}
        user={marketingUser}
        onSuccess={(updatedUser) => {
          showToast(`✅ Marketing mode updated for ${updatedUser.username}!`);
          loadData(searchTerm);
        }}
      />

      <BalanceAdjustmentModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        user={adjustUser}
        onSuccess={(updatedUser, message) => {
          showToast(`✅ ${message}`);
          loadData(searchTerm);
        }}
      />

      {/* 1. Ban Player Account Modal */}
      {banUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111726] border border-rose-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Ban Player Account</h3>
                  <p className="text-xs text-rose-400 font-bold">Target: {banUser.username}</p>
                </div>
              </div>
              <button
                onClick={() => setBanUser(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-gray-300 space-y-1">
              <div className="font-bold text-rose-300 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Security Enforcement Action</span>
              </div>
              <p className="text-[11px] leading-relaxed text-gray-400">
                Banning this player will immediately terminate any active game flights, disconnect all sessions, and lock their wallet balance of{' '}
                <strong className="text-white">${Number(banUser.balance || 0).toFixed(2)} USD</strong>.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                  Reason for Ban:
                </label>
                <select
                  value={banReasonPreset}
                  onChange={(e) => setBanReasonPreset(e.target.value)}
                  className="w-full bg-[#182234] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/50"
                >
                  <option value="Referral Bonus Exploitation / Multi-Accounting">Referral Bonus Exploitation / Multi-Accounting</option>
                  <option value="Invalid / Replayed Deposit Reference Slip">Invalid / Replayed Deposit Reference Slip</option>
                  <option value="Automated Script / Bot Arbitrage Usage">Automated Script / Bot Arbitrage Usage</option>
                  <option value="Suspicious Chargeback / Payment Irregularity">Suspicious Chargeback / Payment Irregularity</option>
                  <option value="Violation of Platform Fair Play & Terms">Violation of Platform Fair Play & Terms</option>
                  <option value="Manual Administrative Security Suspension">Manual Administrative Security Suspension</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                  Additional Operator Remarks (Optional):
                </label>
                <textarea
                  value={banCustomReason}
                  onChange={(e) => setBanCustomReason(e.target.value)}
                  placeholder="e.g. Matched duplicate referral IP with 5 accounts..."
                  rows={2}
                  className="w-full bg-[#182234] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500/50"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
              <button
                onClick={() => setBanUser(null)}
                className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-gray-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBan}
                disabled={isSubmittingBan}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>{isSubmittingBan ? 'Banning...' : 'Confirm & Ban Account'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Unban Player Account Modal */}
      {unbanUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111726] border border-emerald-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Unban Player Account</h3>
                  <p className="text-xs text-emerald-400 font-bold">Target: {unbanUser.username}</p>
                </div>
              </div>
              <button
                onClick={() => setUnbanUser(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-gray-300">
              <p className="text-xs leading-relaxed">
                Are you sure you want to unban <strong className="text-white">{unbanUser.username}</strong>?
                This will lift all security blocks, unfreeze their wallet, and allow them to log in and play normally.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
              <button
                onClick={() => setUnbanUser(null)}
                className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-gray-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUnban}
                disabled={isSubmittingUnban}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>{isSubmittingUnban ? 'Restoring...' : 'Confirm & Unban Player'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-xs font-bold text-white bg-emerald-600/90 border border-emerald-500/40 shadow-2xl backdrop-blur-xl animate-slide-up">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
