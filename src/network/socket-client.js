import { io } from 'socket.io-client';
import { apiClient } from './api-client.js';

export class SocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.serverUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3000'
      : window.location.origin;

    this.authToken = localStorage.getItem('skyrush_auth_token') || localStorage.getItem('token') || null;
    this.currentUser = null;
    this.activeRoom = 'standard';

    // Clock sync offset in ms
    this.serverClockOffset = 0;

    // Callbacks registry
    this.listeners = {
      connectionChange: [],
      gameState: [],
      flightSync: [],
      newLiveBet: [],
      newLiveBetsBatch: [],
      betCashedOut: [],
      betCancelled: [],
      balanceUpdate: [],
      userSubscribed: [],
    };
  }

  setAuthToken(token) {
    this.authToken = token;
    if (token) {
      localStorage.setItem('skyrush_auth_token', token);
      if (this.socket && this.isConnected) {
        this.socket.emit('subscribeUser', { token });
      }
    } else {
      localStorage.removeItem('skyrush_auth_token');
      this.currentUser = null;
      this.activeRoom = 'standard';
      if (this.socket && this.isConnected) {
        this.socket.emit('unsubscribeUser');
      }
    }
  }

  init() {
    if (this.socket) {
      this.socket.disconnect();
    }

    const socketOptions = {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    };

    if (this.authToken) {
      socketOptions.auth = { token: this.authToken };
      socketOptions.query = { token: this.authToken };
    }

    this.socket = io(this.serverUrl, socketOptions);

    this.socket.on('connect', () => {
      console.log('⚡ [Socket] Connected to SkyRush Engine at', this.serverUrl);
      this.isConnected = true;
      this.notify('connectionChange', true);

      // 1. Initial clock sync
      this.syncClock();

      // 2. Authoritative room & user subscription
      if (this.authToken) {
        this.socket.emit('subscribeUser', { token: this.authToken });
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('⚠️ [Socket] Disconnected from server:', reason);
      this.isConnected = false;
      this.notify('connectionChange', false);
    });

    this.socket.on('connect_error', (err) => {
      console.error('❌ [Socket] Connection error:', err.message);
      this.isConnected = false;
      this.notify('connectionChange', false);
    });

    // Handle pong clock sync
    this.socket.on('pongSync', (data) => {
      const t1 = Date.now();
      const t0 = data?.clientSendTime || t1;
      const serverReceive = data?.serverReceiveTime || t1;
      const rtt = t1 - t0;
      const estimatedServerTime = serverReceive + (rtt / 2.0);
      const newOffset = estimatedServerTime - t1;

      if (this.serverClockOffset === 0) {
        this.serverClockOffset = newOffset;
      } else {
        this.serverClockOffset = (this.serverClockOffset * 0.7) + (newOffset * 0.3);
      }
    });

    // Handle user subscription feedback (Authoritative room assignment from Redis/Postgres)
    this.socket.on('userSubscribed', (data) => {
      if (data?.success) {
        this.currentUser = {
          username: data.username,
          isMarketing: !!data.isMarketing,
          room: data.room || 'standard',
        };
        this.activeRoom = data.room || 'standard';
        console.log(`👤 [Socket] Authenticated [${data.username}], assigned to [room:${this.activeRoom}]`);
      } else {
        console.warn('⚠️ [Socket] Session token expired or invalid:', data?.error);
        this.currentUser = null;
      }
      this.notify('userSubscribed', data);
    });

    // Handle authoritative game state broadcast
    this.socket.on('gameState', (data) => {
      if (!data) return;
      // Room guard: Ignore packets belonging to other room
      const incomingRoom = data.room || 'standard';
      const isMarketing = this.currentUser?.isMarketing === true;
      if (isMarketing && incomingRoom === 'standard') return;
      if (!isMarketing && incomingRoom === 'marketing') return;

      this.notify('gameState', data);
    });

    // Handle high-frequency flight multiplier ticks
    this.socket.on('flightSync', (data) => {
      if (!data) return;
      const incomingRoom = data.room || 'standard';
      const isMarketing = this.currentUser?.isMarketing === true;
      if (isMarketing && incomingRoom === 'standard') return;
      if (!isMarketing && incomingRoom === 'marketing') return;

      this.notify('flightSync', data);
    });

    // Live Bets stream
    this.socket.on('newLiveBet', (data) => this.notify('newLiveBet', data));
    this.socket.on('newLiveBetsBatch', (data) => this.notify('newLiveBetsBatch', data));
    this.socket.on('betCashedOut', (data) => this.notify('betCashedOut', data));
    this.socket.on('betCancelled', (data) => this.notify('betCancelled', data));

    // Balance update events
    this.socket.on('userBalanceUpdated', (data) => {
      if (data && typeof data.balance === 'number') {
        this.notify('balanceUpdate', data);
      }
    });

    // Recurring clock sync (every 15s)
    setInterval(() => {
      if (this.isConnected) {
        this.syncClock();
      }
    }, 15000);
  }

  syncClock() {
    if (this.socket && this.isConnected) {
      this.socket.emit('pingSync', { clientSendTime: Date.now() });
    }
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  notify(event, payload) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => {
        try {
          cb(payload);
        } catch (e) {
          console.error(`Error in listener for ${event}:`, e);
        }
      });
    }
  }

  // --- Financial Actions (Unified with authoritative REST API) ---

  async placeBet(betData) {
    const betIndex = betData.betIndex || 1;
    const amount = betData.amount || 1.0;
    return apiClient.placeBet(betIndex, amount);
  }

  async cancelBet(betIndexOrId) {
    const betIndex = typeof betIndexOrId === 'number' ? betIndexOrId : (betIndexOrId?.betIndex || 1);
    return apiClient.cancelBet(betIndex);
  }

  async cashOut(betIndexOrId, multiplier = null) {
    const betIndex = typeof betIndexOrId === 'number' ? betIndexOrId : (betIndexOrId?.betIndex || 1);
    return apiClient.cashOut(betIndex);
  }
}

export const socketClient = new SocketClient();
