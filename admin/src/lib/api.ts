import {
  DashboardStats,
  DepositRequest,
  WithdrawalRequest,
  User,
  PaymentChannel,
  PoolAuditLog,
  MaintenanceStatus,
  PlayerDetailedHistoryResponse,
  ReferralSummaryStats,
  AdminAffiliatesResponse,
  AdminAffiliateNetworkResponse,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function getAuthHeaders(): HeadersInit {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token');
    if (token) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
    }
  }
  return { 'Content-Type': 'application/json' };
}

/**
 * Enterprise Auth Fetch Wrapper:
 * Intercepts 401 Unauthorized responses, clears invalid/expired tokens from localStorage,
 * and broadcasts 'auth:unauthorized' to automatically reset AdminShell to Login screen.
 */
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  if (typeof window !== 'undefined' && !localStorage.getItem('admin_token')) {
    window.dispatchEvent(new Event('auth:unauthorized'));
    throw new Error('Unauthorized');
  }

  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {})
  };
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    throw new Error('Unauthorized');
  }
  return res;
}

export async function fetchStats(): Promise<DashboardStats> {
  const res = await authFetch(`${API_BASE}/admin/api/stats`, { 
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch statistics');
  return res.json();
}

export async function fetchDeposits(status?: string, limit: number = 100): Promise<DepositRequest[]> {
  const query = new URLSearchParams();
  if (status && status !== 'ALL') query.set('status', status);
  query.set('limit', limit.toString());

  const res = await authFetch(`${API_BASE}/admin/api/deposits?${query.toString()}`, { 
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch deposits');
  return res.json();
}

export async function fetchWithdrawals(status?: string, limit: number = 100): Promise<WithdrawalRequest[]> {
  const query = new URLSearchParams();
  if (status && status !== 'ALL') query.set('status', status);
  query.set('limit', limit.toString());

  const res = await authFetch(`${API_BASE}/admin/api/withdrawals?${query.toString()}`, { 
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch withdrawals');
  return res.json();
}

export async function approveWithdrawal(id: string, adminNote?: string, adminUser: string = 'Next.js Admin'): Promise<any> {
  const res = await authFetch(`${API_BASE}/admin/api/withdrawals/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ adminNote, adminUser }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to approve withdrawal');
  return data;
}

export async function rejectWithdrawal(id: string, reason?: string, adminUser: string = 'Next.js Admin'): Promise<any> {
  const res = await authFetch(`${API_BASE}/admin/api/withdrawals/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason, adminUser }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to reject withdrawal');
  return data;
}

export async function approveDeposit(id: string, adminUser: string = 'Next.js Admin'): Promise<any> {
  const res = await authFetch(`${API_BASE}/admin/api/deposits/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ adminUser }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to approve deposit');
  return data;
}

export async function rejectDeposit(id: string, reason?: string, adminUser: string = 'Next.js Admin'): Promise<any> {
  const res = await authFetch(`${API_BASE}/admin/api/deposits/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason, adminUser }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to reject deposit');
  return data;
}

export async function manualCredit(identifier: string, amount: number, note?: string, adminUser: string = 'Next.js Admin'): Promise<any> {
  const res = await authFetch(`${API_BASE}/admin/api/manual-credit`, {
    method: 'POST',
    body: JSON.stringify({ identifier, amount, note, adminUser }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to credit player');
  return data;
}

export async function fetchUsers(search?: string, limit: number = 50): Promise<User[]> {
  const query = new URLSearchParams();
  if (search) query.set('search', search);
  query.set('limit', limit.toString());

  const res = await authFetch(`${API_BASE}/admin/api/users?${query.toString()}`, { 
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function fetchChannels(): Promise<PaymentChannel[]> {
  const res = await authFetch(`${API_BASE}/admin/channels`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch channels');
  const data = await res.json();
  return data.channels || [];
}

export async function updateGlobalPool(amount: number): Promise<{ success: boolean; globalPool: number }> {
  const res = await authFetch(`${API_BASE}/admin/api/pool/set`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update pool');
  return data;
}

export async function adjustGlobalPool(params: {
  action: 'TOP_UP' | 'PROFIT_SKIM' | 'SET_TARGET';
  amount: number;
  note?: string;
  adminUser?: string;
}): Promise<{
  success: boolean;
  globalPool: number;
  pending?: boolean;
  target?: number;
  appliedRound?: string;
  auditLog: PoolAuditLog;
}> {
  const res = await authFetch(`${API_BASE}/admin/api/pool/adjust`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to adjust pool');
  return data;
}

export async function fetchPoolLogs(limit: number = 10): Promise<PoolAuditLog[]> {
  const res = await authFetch(`${API_BASE}/admin/api/pool/logs?limit=${limit}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch pool logs');
  return res.json();
}

export async function updateUserMarketingStatus(
  userId: string,
  isMarketing: boolean,
  isMarketingAutoWin: boolean,
): Promise<{ success: boolean; message: string; user: User }> {
  const res = await authFetch(`${API_BASE}/admin/api/users/${userId}/marketing`, {
    method: 'POST',
    body: JSON.stringify({ isMarketing, isMarketingAutoWin }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update marketing status');
  return data;
}

export async function adjustUserBalance(
  userId: string,
  params: {
    action: 'RESET_ZERO' | 'SET_AMOUNT' | 'DEDUCT';
    amount?: number;
    reason?: string;
  },
): Promise<{ success: boolean; message: string; oldBalance: number; newBalance: number; delta: number; user: User }> {
  const res = await authFetch(`${API_BASE}/admin/api/users/${userId}/adjust-balance`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to adjust balance');
  return data;
}

export interface MarketingRadarData {
  room: string;
  roundNumber: number;
  status: 'waiting' | 'playing' | 'crashed';
  countdown: number;
  targetStartTime: number;
  startTime: number;
  currentMultiplier: number;
  crashPoint: number;
  safeCashoutTarget: number;
  estFlightDuration: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  activeAutoWinBetsCount: number;
  activeBetsCount: number;
  serverTime: number;
}

export async function fetchMarketingRadarPreview(key?: string): Promise<MarketingRadarData> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (key && key.trim()) {
    headers['X-Streamer-Key'] = key.trim();
  }

  const res = await fetch(`${API_BASE}/admin/api/marketing/preview`, {
    headers,
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Unauthorized or failed to fetch radar telemetry');
  }
  const json = await res.json();
  return json.data;
}

export async function fetchMaintenanceStatus(): Promise<MaintenanceStatus> {
  const res = await authFetch(`${API_BASE}/admin/api/system/maintenance/status`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch maintenance status');
  return res.json();
}

export async function scheduleMaintenance(minutes: number = 15, message?: string): Promise<MaintenanceStatus> {
  const res = await authFetch(`${API_BASE}/admin/api/system/maintenance/schedule`, {
    method: 'POST',
    body: JSON.stringify({ minutes, message }),
  });
  if (!res.ok) throw new Error('Failed to schedule maintenance');
  return res.json();
}

export async function cancelMaintenance(): Promise<MaintenanceStatus> {
  const res = await authFetch(`${API_BASE}/admin/api/system/maintenance/cancel`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to cancel maintenance');
  return res.json();
}

export async function broadcastAnnouncement(payload: { title?: string; message: string; type?: string }): Promise<{ success: boolean }> {
  const res = await authFetch(`${API_BASE}/admin/api/system/broadcast`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to broadcast announcement');
  return res.json();
}

export async function fetchPlayerHistory(
  userId: string,
  options: {
    type?: 'all' | 'bets' | 'deposits' | 'withdrawals';
    page?: number;
    limit?: number;
    status?: string;
  } = {}
): Promise<PlayerDetailedHistoryResponse> {
  const query = new URLSearchParams();
  if (options.type) query.set('type', options.type);
  if (options.page) query.set('page', options.page.toString());
  if (options.limit) query.set('limit', options.limit.toString());
  if (options.status && options.status !== 'ALL') query.set('status', options.status);

  const res = await authFetch(`${API_BASE}/admin/api/users/${encodeURIComponent(userId)}/history?${query.toString()}`, {
    cache: 'no-store'
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch player history');
  }
  return res.json();
}

export async function fetchReferralSummary(): Promise<ReferralSummaryStats> {
  const res = await authFetch(`${API_BASE}/admin/api/referrals/summary`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch referral summary');
  return res.json();
}

export async function fetchAdminAffiliates(options: {
  page?: number;
  limit?: number;
  search?: string;
  tier?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
} = {}): Promise<AdminAffiliatesResponse> {
  const query = new URLSearchParams();
  if (options.page) query.set('page', options.page.toString());
  if (options.limit) query.set('limit', options.limit.toString());
  if (options.search) query.set('search', options.search);
  if (options.tier && options.tier !== 'ALL') query.set('tier', options.tier);
  if (options.sortBy) query.set('sortBy', options.sortBy);
  if (options.sortOrder) query.set('sortOrder', options.sortOrder);

  const res = await authFetch(`${API_BASE}/admin/api/referrals/affiliates?${query.toString()}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch affiliates list');
  return res.json();
}

export async function fetchAdminAffiliateNetwork(userId: string): Promise<AdminAffiliateNetworkResponse> {
  const res = await authFetch(`${API_BASE}/admin/api/referrals/affiliate/${encodeURIComponent(userId)}/network`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch affiliate network');
  }
  return res.json();
}

export async function updateAffiliateTier(userId: string, tier: string): Promise<{ success: boolean; message: string }> {
  const res = await authFetch(`${API_BASE}/admin/api/referrals/affiliate/${encodeURIComponent(userId)}/tier`, {
    method: 'PATCH',
    body: JSON.stringify({ tier }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update affiliate tier');
  }
  return res.json();
}

