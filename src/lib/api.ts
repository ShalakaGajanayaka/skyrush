import { DashboardStats, DepositRequest, User, PaymentChannel } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function fetchStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/admin/api/stats`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch statistics');
  return res.json();
}

export async function fetchDeposits(status?: string, limit: number = 100): Promise<DepositRequest[]> {
  const query = new URLSearchParams();
  if (status && status !== 'ALL') query.set('status', status);
  query.set('limit', limit.toString());

  const res = await fetch(`${API_BASE}/admin/api/deposits?${query.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch deposits');
  return res.json();
}

export async function approveDeposit(id: string, adminUser: string = 'Next.js Admin'): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/api/deposits/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminUser }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to approve deposit');
  return data;
}

export async function rejectDeposit(id: string, reason?: string, adminUser: string = 'Next.js Admin'): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/api/deposits/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason, adminUser }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to reject deposit');
  return data;
}

export async function manualCredit(identifier: string, amount: number, note?: string, adminUser: string = 'Next.js Admin'): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/api/manual-credit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

  const res = await fetch(`${API_BASE}/admin/api/users?${query.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function fetchChannels(): Promise<PaymentChannel[]> {
  const res = await fetch(`${API_BASE}/admin/channels`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch channels');
  const data = await res.json();
  return data.channels || [];
}
