import { SERVER_BASE_URL, resolveServerUrl } from '../config/environment.js';

// API Client for SkyRush Server Communication (REST Endpoints)
export class ApiClient {
  constructor(customBaseUrl = null) {
    this.baseUrl = customBaseUrl || SERVER_BASE_URL || resolveServerUrl();
  }

  getToken() {
    return localStorage.getItem('skyrush_auth_token') || null;
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('skyrush_auth_token', token);
    } else {
      localStorage.removeItem('skyrush_auth_token');
    }
  }

  getHeaders(extraHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...extraHeaders,
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = this.getHeaders(options.headers);
    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          message: data.message || `Request failed with status ${response.status}`,
          error: data.error || 'Server error',
          data,
        };
      }
      if (Array.isArray(data)) {
        return {
          success: true,
          status: response.status,
          data,
        };
      }
      return {
        success: true,
        status: response.status,
        ...data,
      };
    } catch (err) {
      console.error(`[API] Error calling ${path}:`, err);
      return {
        success: false,
        message: err.message || 'Network connection failed. Backend unreachable.',
        error: err.name,
      };
    }
  }

  // --- Financial & Betting Actions (Authoritative) ---

  async placeBet(betIndex, amount, autoCashout = null) {
    return this.request('/auth/game-bet', {
      method: 'POST',
      body: JSON.stringify({
        betIndex: Number(betIndex),
        amount: Number(amount),
        autoCashout: autoCashout != null ? Number(autoCashout) : null,
      }),
    });
  }

  async cancelBet(betIndex) {
    return this.request('/auth/game-cancel-bet', {
      method: 'POST',
      body: JSON.stringify({
        betIndex: Number(betIndex),
      }),
    });
  }

  async cashOut(betIndex) {
    return this.request('/auth/game-cashout', {
      method: 'POST',
      body: JSON.stringify({
        betIndex: Number(betIndex),
      }),
    });
  }

  async submitDeposit(amount, paymentMethod = 'binance_usdt', referenceNumber = '') {
    const token = this.getToken();
    return this.request('/admin/deposit-request', {
      method: 'POST',
      body: JSON.stringify({
        token,
        amount: Number(amount),
        currency: 'USD',
        paymentMethod: paymentMethod || 'binance_usdt',
        referenceNumber: referenceNumber || `REF-${Date.now().toString(36).toUpperCase()}`,
      }),
    });
  }

  async submitWithdrawal(amount, method = 'binance_usdt', payoutDetails = {}) {
    const token = this.getToken();
    return this.request('/admin/withdrawal-request', {
      method: 'POST',
      body: JSON.stringify({
        token,
        amount: Number(amount),
        currency: 'USD',
        method: method || 'binance_usdt',
        payoutDetails,
      }),
    });
  }

  // --- Auth & User Profile ---

  async getProfile() {
    return this.request('/auth/profile', {
      method: 'GET',
    });
  }

  async login(identifier, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: identifier,
        password,
      }),
    });
    if (res.success && res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async register(identifier, password, currency = 'USD', username = null) {
    const payload = {
      email: identifier,
      password,
      currency,
    };
    if (username && typeof username === 'string' && username.trim()) {
      payload.username = username.trim();
    }

    const res = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.success && res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async renameUser(newUsername) {
    return this.request('/auth/rename', {
      method: 'POST',
      body: JSON.stringify({
        newUsername: newUsername.trim(),
      }),
    });
  }

  async logout() {
    const res = await this.request('/auth/logout', {
      method: 'POST',
    });
    this.setToken(null);
    return res;
  }

  // --- Provably Fair Auditing ---

  async getProvablyFairCurrent() {
    return this.request('/game/provably-fair/current', {
      method: 'GET',
    });
  }

  async verifyRound(serverSeed, clientSeed, nonce) {
    const query = new URLSearchParams({
      serverSeed,
      clientSeed,
      nonce: String(nonce),
    }).toString();
    return this.request(`/game/provably-fair/verify?${query}`, {
      method: 'GET',
    });
  }

  // --- Financial & Flight Records ---

  async getMyHistory() {
    const token = this.getToken();
    if (!token) return { success: false, deposits: [], withdrawals: [] };
    const res = await this.request(`/admin/my-history?token=${encodeURIComponent(token)}`, {
      method: 'GET',
    });
    return {
      success: !!res.success,
      deposits: Array.isArray(res.deposits) ? res.deposits : [],
      withdrawals: Array.isArray(res.withdrawals) ? res.withdrawals : [],
    };
  }

  async getBetHistory() {
    const res = await this.request('/auth/bet-history', {
      method: 'GET',
    });
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  }

  async cancelWithdrawal(withdrawalId) {
    const token = this.getToken();
    if (!token) return { success: false, message: 'Please log in' };
    return this.request('/admin/withdrawal-cancel', {
      method: 'POST',
      body: JSON.stringify({
        token,
        withdrawalId,
      }),
    });
  }
}

export const apiClient = new ApiClient();
