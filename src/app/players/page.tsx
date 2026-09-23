'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, Search, RefreshCw, PlusCircle, Trophy, Gamepad2, Coins } from 'lucide-react';
import { fetchUsers } from '@/lib/api';
import { User } from '@/lib/types';
import ManualCreditModal from '@/components/ManualCreditModal';

export default function PlayersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = useCallback(async (searchQuery = '') => {
    setLoading(true);
    try {
      const data = await fetchUsers(searchQuery, 100);
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users', err);
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
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-gray-200 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
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
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
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
              <th className="py-3 px-4">Base Currency</th>
              <th className="py-3 px-4">Wallet Balance</th>
              <th className="py-3 px-4">Games Played</th>
              <th className="py-3 px-4">Total Won</th>
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
                      <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 font-bold flex items-center justify-center text-xs">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <span>{u.username}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-gray-400 text-[11px]">
                    {u.email || u.phoneNumber || '-'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      {u.currency || 'LKR'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-sm font-extrabold text-emerald-400 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" />
                      <span>
                        {u.currency || 'LKR'} {Number(u.balance || 0).toFixed(2)}
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
                    <div className="flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      <span>
                        {u.currency || 'LKR'} {Number(u.totalWon || 0).toFixed(2)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleOpenCredit(u.username)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold text-xs transition-all active:scale-95"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Credit</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ManualCreditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        prefillUsername={selectedUser}
        onCreditSuccess={(user, amount) => {
          showToast(`✅ Successfully credited ${amount} to ${user?.username || selectedUser}!`);
          loadData(searchTerm);
        }}
      />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-xs font-bold text-white bg-emerald-600/90 border border-emerald-500/40 shadow-2xl backdrop-blur-xl animate-slide-up">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
