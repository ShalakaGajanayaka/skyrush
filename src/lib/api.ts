import { DashboardStats, DepositRequest, WithdrawalRequest, User, PaymentChannel, PoolAuditLog } from './types';

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

export async function fetchStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/admin/api/stats`, { 
    cache: 'no-store',
    headers: getAuthHeaders()
  });
  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error('Failed to fetch statistics');
  return res.json();
}

export async function fetchDeposits(status?: string, limit: number = 100): Promise<DepositRequest[]> {
  const query = new URLSearchParams();
  if (status && status !== 'ALL') query.set('status', status);
  query.set('limit', limit.toString());

  const res = await fetch(`${API_BASE}/admin/api/deposits?${query.toString()}`, { 
    cache: 'no-store',
    headers: getAuthHeaders()
  });
  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error('Failed to fetch deposits');
  return res.json();
}

export async function fetchWithdrawals(status?: string, limit: number = 100): Promise<WithdrawalRequest[]> {
  const query = new URLSearchParams();
  if (status && status !== 'ALL') query.set('status', status);
  query.set('limit', limit.toString());

  const res = await fetch(`${API_BASE}/admin/api/withdrawals?${query.toString()}`, { 
    cache: 'no-store',
    headers: getAuthHeaders()
  });
  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error('Failed to fetch withdrawals');
  return res.json();
}

export async function approveWithdrawal(id: string, adminNote?: string, adminUser: string = 'Next.js Admin'): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/api/withdrawals/${id}/approve`, {
    method: 'POST',
    headers: getAuthHeaders() as Record<string, string>,
    body: JSON.stringify({ adminNote, adminUser }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to approve withdrawal');
  return data;
}

export async function rejectWithdrawal(id: string, reason?: string, adminUser: string = 'Next.js Admin'): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/api/withdrawals/${id}/reject`, {
    method: 'POST',
    headers: getAuthHeaders() as Record<string, string>,
    body: JSON.stringify({ reason, adminUser }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to reject withdrawal');
  return data;
}

export async function approveDeposit(id: string, adminUser: string = 'Next.js Admin'): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/api/deposits/${id}/approve`, {
    method: 'POST',
    headers: getAuthHeaders() as Record<string, string>,
    body: JSON.stringify({ adminUser }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to approve deposit');
  return data;
}

export async function rejectDeposit(id: string, reason?: string, adminUser: string = 'Next.js Admin'): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/api/deposits/${id}/reject`, {
    method: 'POST',
    headers: getAuthHeaders() as Record<string, string>,
    body: JSON.stringify({ reason, adminUser }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to reject deposit');
  return data;
}

export async function manualCredit(identifier: string, amount: number, note?: string, adminUser: string = 'Next.js Admin'): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/api/manual-credit`, {
    method: 'POST',
    headers: getAuthHeaders() as Record<string, string>,
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

  const res = await fetch(`${API_BASE}/admin/api/users?${query.toString()}`, { 
    cache: 'no-store',
    headers: getAuthHeaders()
  });
  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function fetchChannels(): Promise<PaymentChannel[]> {
  const res = await fetch(`${API_BASE}/admin/channels`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch channels');
  const data = await res.json();
  return data.channels || [];
}

export async function updateGlobalPool(amount: number): Promise<{ success: boolean; globalPool: number }> {
  const res = await fetch(`${API_BASE}/admin/api/pool/set`, {
    method: 'POST',
    headers: getAuthHeaders() as Record<string, string>,
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
}): Promise<{ success: boolean; globalPool: number; auditLog: PoolAuditLog }> {
  const res = await fetch(`${API_BASE}/admin/api/pool/adjust`, {
    method: 'POST',
    headers: getAuthHeaders() as Record<string, string>,
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to adjust pool');
  return data;
}

export async function fetchPoolLogs(limit: number = 10): Promise<PoolAuditLog[]> {
  const res = await fetch(`${API_BASE}/admin/api/pool/logs?limit=${limit}`, {
    cache: 'no-store',
    headers: getAuthHeaders(),
  });
  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error('Failed to fetch pool logs');
  return res.json();
}
