import { FlightCanvas } from './engine/flight-canvas.js';
import { SocketClient, socketClient } from './network/socket-client.js';
import { apiClient } from './network/api-client.js';
import { soundManager } from './audio/audio-manager.js';
import { BetController } from './ui/bet-controller.js';
import { LiveBetsFeed } from './ui/live-bets.js';
import { ProvablyFairModal } from './ui/provably-fair-modal.js';
import { AuthModal } from './ui/auth-modal.js';
import { DepositModal } from './ui/deposit-modal.js';
import { notificationManager } from './ui/notification-manager.js';
import confetti from 'canvas-confetti';

// Application State
let currentBalance = 0.00;
let lastProvablyFairRound = null;
let currentUser = null;
window.currentFlightMultiplier = 1.00;

// Helper to verify if the client has an active, authenticated pilot session
const isUserSignedIn = () => Boolean(currentUser && currentUser.id && apiClient.getToken());
window.isUserAuthenticated = isUserSignedIn;

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 [SkyRush] Initializing High-Performance Aviator Web Engine...');

  // 0. Purge legacy hardcoded mock tokens from previous dev versions
  const savedToken = localStorage.getItem('skyrush_auth_token');
  const LEGACY_MOCK_TOKEN = 'b83bba6036aaf920ce84812f4c0899bc15244c3b28ca51b2';
  if (savedToken === LEGACY_MOCK_TOKEN) {
    console.log('🧹 [Auth] Purging legacy developer mock token from localStorage.');
    localStorage.removeItem('skyrush_auth_token');
    apiClient.setToken(null);
    socketClient.setAuthToken(null);
  }

  // 1. Audio initialization on first user interaction
  const initAudioOnGesture = () => {
    soundManager.init();
    window.removeEventListener('click', initAudioOnGesture);
    window.removeEventListener('keydown', initAudioOnGesture);
  };
  window.addEventListener('click', initAudioOnGesture);
  window.addEventListener('keydown', initAudioOnGesture);

  // 2. Initialize Hardware-Accelerated Flight Canvas with Server-Authoritative Clock Synchronization
  const canvasEl = document.getElementById('flightCanvas');
  const flightCanvas = new FlightCanvas(canvasEl, {
    clockProvider: () => socketClient.getServerTime(),
  });

  // 3. Initialize Provably Fair Modal
  const pfModal = new ProvablyFairModal();
  document.getElementById('btnProvablyFair').addEventListener('click', () => {
    pfModal.show(lastProvablyFairRound);
  });

  // 4. Initialize Player Auth Modal
  const authModal = new AuthModal((user) => {
    currentUser = user && user.id ? user : null;
    if (currentUser && typeof currentUser.balance === 'number') {
      setBalance(currentUser.balance);
    } else {
      currentUser = null;
      setBalance(0);
      apiClient.setToken(null);
      socketClient.setAuthToken(null);
    }
  });
  const btnUserAccount = document.getElementById('btnUserAccount');
  if (btnUserAccount) {
    btnUserAccount.addEventListener('click', () => {
      authModal.show();
    });
  }

  // 5. Initialize Live Bets Sidebar
  const sidebarEl = document.getElementById('sidebarBets');
  const liveBetsFeed = new LiveBetsFeed(sidebarEl);

  // 6. User Balance helpers
  const getBalance = () => currentBalance;
  const setBalance = (val) => {
    currentBalance = Number(val) || 0;
    updateBalanceDisplay();
  };

  function updateBalanceDisplay() {
    const el = document.getElementById('userBalanceText');
    const balanceCard = document.getElementById('headerBalanceCard') || document.querySelector('.balance-card');
    if (el) {
      el.textContent = `$${currentBalance.toFixed(2)} USD`;
    }
    if (balanceCard) {
      if (currentBalance <= 0) {
        balanceCard.classList.add('has-zero-balance');
      } else {
        balanceCard.classList.remove('has-zero-balance');
      }
    }
  }
  updateBalanceDisplay();

  // 6.1 Initialize Deposit & Cashier Modal with Smart Auth Routing
  const depositModal = new DepositModal(getBalance, setBalance);
  authModal.setCashierOpener((targetTab = 'deposit') => {
    authModal.hide();
    setTimeout(() => {
      depositModal.show(0, targetTab);
    }, 150);
  });

  function handleWalletAction(targetAmount = 0) {
    // Strictly verify if the user is authenticated
    if (!isUserSignedIn()) {
      // User is NOT signed in -> MUST open Auth Modal!
      notificationManager.info(
        'Sign In Required 🔐',
        'Please sign in or create an account to deposit funds and start playing.'
      );
      authModal.show((user) => {
        if (user && user.id) {
          currentUser = user;
          setTimeout(() => {
            depositModal.show(targetAmount);
          }, 350);
        }
      });
      return;
    }

    // User IS signed in -> direct to Binance Cashier
    depositModal.show(targetAmount);
  }

  window.openDepositModal = (targetAmount = 0) => handleWalletAction(targetAmount);
  window.openAuthModal = () => authModal.show();

  const balanceCard = document.getElementById('headerBalanceCard') || document.querySelector('.balance-card');
  if (balanceCard) {
    balanceCard.style.cursor = 'pointer';
    balanceCard.title = 'Click to Top-Up / Deposit';
    balanceCard.addEventListener('click', () => {
      handleWalletAction();
    });
  }

  // 7. Initialize Dual Bet Controllers
  const panel1El = document.getElementById('betPanel1');
  const panel2El = document.getElementById('betPanel2');

  const betCtrl1 = new BetController(panel1El, 1, socketClient, getBalance, setBalance);
  const betCtrl2 = new BetController(panel2El, 2, socketClient, getBalance, setBalance);

  // 8. Audio Toggle Button
  const btnAudio = document.getElementById('btnAudioToggle');
  const audioIcon = document.getElementById('audioIcon');
  btnAudio.addEventListener('click', () => {
    const isMuted = soundManager.toggleMute();
    if (isMuted) {
      btnAudio.style.opacity = '0.4';
      audioIcon.innerHTML = `
        <line x1="1" y1="1" x2="23" y2="23"/>
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      `;
    } else {
      btnAudio.style.opacity = '1.0';
      audioIcon.innerHTML = `
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
      `;
    }
  });

  // 9. Connection Badge Handler
  const connBadge = document.getElementById('connBadge');
  socketClient.on('connectionChange', (isConnected) => {
    if (isConnected) {
      connBadge.className = 'connection-badge';
      connBadge.querySelector('.text').textContent = 'LIVE';
    } else {
      connBadge.className = 'connection-badge offline';
      connBadge.querySelector('.text').textContent = 'RECONNECTING';
    }
  });

  // 10. Handle Server Telemetry Events
  socketClient.on('gameState', (data) => {
    const { status, countdown, currentMultiplier, crashPoint, bets, provablyFair } = data;

    if (provablyFair) {
      lastProvablyFairRound = provablyFair;
    }

    if (status === 'waiting') {
      flightCanvas.setWaitingState(countdown);
      betCtrl1.onRoundWaiting(countdown);
      betCtrl2.onRoundWaiting(countdown);
      soundManager.playCountdownTick();

      if (bets) {
        liveBetsFeed.setBets(bets);
      }
    } else if (status === 'playing') {
      flightCanvas.setPlayingState(data.startTime, currentMultiplier || 1.0);
      betCtrl1.onRoundPlaying(data.startTime);
      betCtrl2.onRoundPlaying(data.startTime);

      if (bets) {
        liveBetsFeed.setBets(bets);
      }
    } else if (status === 'crashed') {
      const finalCrash = crashPoint || currentMultiplier || 1.0;
      flightCanvas.setCrashedState(finalCrash);
      betCtrl1.onRoundCrashed(finalCrash);
      betCtrl2.onRoundCrashed(finalCrash);
    }
  });

  socketClient.on('flightSync', (data) => {
    const mult = data ? data.multiplier : 1.0;
    const numMult = Number(mult) || 1.0;
    window.currentFlightMultiplier = numMult;

    flightCanvas.updateAuthoritativeMultiplier(numMult);
    betCtrl1.onFlightTick(numMult);
    betCtrl2.onFlightTick(numMult);
  });

  socketClient.on('newLiveBet', (bet) => liveBetsFeed.addBet(bet));
  socketClient.on('newLiveBetsBatch', (batch) => liveBetsFeed.addBatch(batch));
  socketClient.on('betCashedOut', (data) => {
    liveBetsFeed.markCashedOut(data.id, data.multiplier, data.winAmount);
  });
  socketClient.on('betCancelled', (data) => liveBetsFeed.removeBet(data.id));

  // Authoritative server-triggered auto-cashout success
  socketClient.on('autoCashoutSuccess', (data) => {
    if (data?.betIndex === 1) betCtrl1.onAutoCashedOut(data);
    if (data?.betIndex === 2) betCtrl2.onAutoCashedOut(data);
  });

  socketClient.on('balanceUpdate', (data) => {
    if (data && typeof data.balance === 'number') {
      const prev = currentBalance;
      const next = data.balance;
      setBalance(next);

      // If balance was credited by Admin approval, trigger celebratory notification
      if (next > prev) {
        const credited = next - prev;
        notificationManager.success(
          'Deposit Approved! 🚀',
          `+$${credited.toFixed(2)} USD successfully credited to your flight wallet! New balance: $${next.toFixed(2)} USD.`
        );
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.2 },
        });
      }
    }
  });

  // 11. Connect to Backend Socket.IO Server
  socketClient.init();

  // 12. Synchronize Authoritative Profile & Balance from Backend
  try {
    const token = apiClient.getToken();
    if (token) {
      const profile = await apiClient.getProfile();
      if (profile && profile.id) {
        currentUser = profile;
        if (typeof profile.balance === 'number') {
          setBalance(profile.balance);
        }
        console.log(`👤 [Auth] Synchronized wallet with server for [${profile.username}]: $${profile.balance} USD`);
      } else {
        // Stale or invalid token on backend -> purge!
        console.warn('[Auth] Stale or unauthenticated session token detected. Clearing session...');
        apiClient.setToken(null);
        socketClient.setAuthToken(null);
        currentUser = null;
        setBalance(0);
      }
    } else {
      currentUser = null;
      setBalance(0);
    }
  } catch (err) {
    console.warn('[Auth] Profile sync initial fetch fallback:', err);
    currentUser = null;
    setBalance(0);
  }

  console.log('✅ [SkyRush] Aviator Web Engine ready and connected to backend.');
});
