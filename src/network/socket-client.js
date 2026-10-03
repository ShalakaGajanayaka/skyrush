import { io } from 'socket.io-client';

export class SocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.serverUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3000'
      : window.location.origin;

    this.authToken = localStorage.getItem('skyrush_auth_token') || null;
    this.currentUser = null;
    this.activeRoom = 'standard';

    // Clock sync
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
    };
  }

  setAuthToken(token) {
    this.authToken = token;
    if (token) {
      localStorage.setItem('skyrush_auth_token', token);
    } else {
      localStorage.removeItem('skyrush_auth_token');
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
    }

    this.socket = io(this.serverUrl, socketOptions);

    this.socket.on('connect', () => {
      console.log('⚡ [Socket] Connected to SkyRush Engine at', this.serverUrl);
      this.isConnected = true;
      this.notify('connectionChange', true);

      // Perform initial clock sync
      this.syncClock();

      // Subscribe to personal socket room if logged in
      if (this.currentUser && this.currentUser.id) {
        this.socket.emit('subscribeUser', {
          userId: this.currentUser.id,
          username: this.currentUser.username,
        });
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('⚠️ [Socket] Disconnected:', reason);
      this.isConnected = false;
      this.notify('connectionChange', false);
    });

    this.socket.on('connect_error', (err) => {
      console.error('❌ [Socket] Connection error:', err.message);
      this.isConnected = false;
      this.notify('connectionChange', false);
    });

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

    this.socket.on('gameState', (data) => {
      if (!data) return;
      // Room guard: Ignore cross-room packets
      const incomingRoom = data.room || 'standard';
      const isMarketing = this.currentUser?.isMarketing === true;
      if (isMarketing && incomingRoom === 'standard') return;
      if (!isMarketing && incomingRoom === 'marketing') return;

      this.notify('gameState', data);
    });

    this.socket.on('flightSync', (data) => {
      if (!data) return;
      const incomingRoom = data.room || 'standard';
      const isMarketing = this.currentUser?.isMarketing === true;
      if (isMarketing && incomingRoom === 'standard') return;
      if (!isMarketing && incomingRoom === 'marketing') return;

      this.notify('flightSync', data);
    });

    this.socket.on('newLiveBet', (data) => this.notify('newLiveBet', data));
    this.socket.on('newLiveBetsBatch', (data) => this.notify('newLiveBetsBatch', data));
    this.socket.on('betCashedOut', (data) => this.notify('betCashedOut', data));
    this.socket.on('betCancelled', (data) => this.notify('betCancelled', data));
    this.socket.on('userBalanceUpdated', (data) => this.notify('balanceUpdate', data));

    // Clock sync interval (every 15s)
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

  placeBet(betData) {
    return new Promise((resolve) => {
      if (!this.socket || !this.isConnected) {
        resolve({ success: false, message: 'Offline. Please check connection.' });
        return;
      }
      this.socket.emit('placeBet', betData, (response) => {
        resolve(response || { success: true });
      });
    });
  }

  cancelBet(betId) {
    return new Promise((resolve) => {
      if (!this.socket || !this.isConnected) {
        resolve({ success: false });
        return;
      }
      this.socket.emit('cancelBet', { id: betId }, (response) => {
        resolve(response || { success: true });
      });
    });
  }

  cashOut(betId, multiplier) {
    return new Promise((resolve) => {
      if (!this.socket || !this.isConnected) {
        resolve({ success: false });
        return;
      }
      this.socket.emit('cashOut', { id: betId, multiplier }, (response) => {
        resolve(response || { success: true });
      });
    });
  }
}

export const socketClient = new SocketClient();
