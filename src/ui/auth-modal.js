import { apiClient } from '../network/api-client.js';
import { socketClient } from '../network/socket-client.js';
import { notificationManager } from './notification-manager.js';

// High-Entropy Client-Side Gaming Call-Sign Generator (Matches Backend Procedural Pool)
const CLIENT_ADJECTIVES = [
  'Apex', 'Cyber', 'Neon', 'Shadow', 'Lucky', 'Hyper', 'Vortex', 'Cosmic',
  'Thunder', 'Silver', 'Golden', 'Phantom', 'Blaze', 'Iron', 'Turbo', 'Frost',
  'Alpha', 'Dark', 'Mystic', 'Rapid', 'Silent', 'Aero', 'Solar', 'Sonic',
  'Viper', 'Nova', 'Swift', 'Atomic', 'Crimson', 'Titan', 'Ghost', 'Stellar',
  'Quantum', 'Electric', 'Brave', 'Wild', 'Mighty', 'Epic', 'Fierce', 'Omega',
  'Storm', 'Blazing', 'Velocity', 'Savage', 'Prime', 'Rogue', 'Venom', 'Astral',
  'Flash', 'Zenith', 'Striker', 'Glitch', 'Dynamo', 'Cobalt'
];

const CLIENT_NOUNS = [
  'Falcon', 'Pilot', 'Rider', 'Ace', 'Hawk', 'Wolf', 'Captain', 'Viper',
  'Rocket', 'Hunter', 'Striker', 'Eagle', 'Ghost', 'Blazer', 'Titan', 'Jet',
  'Storm', 'Flyer', 'Phoenix', 'Dragon', 'Raven', 'Knight', 'Avenger', 'Corsair',
  'Baron', 'Fox', 'Lynx', 'Cobra', 'Panther', 'Jaguar', 'Hornet', 'Specter',
  'Navigator', 'Ranger', 'Spitfire', 'Mirage', 'Glider', 'Comet', 'Meteor', 'Bomber',
  'SkyWalker', 'Overlord', 'Drifter', 'Turbine', 'Prophet', 'Nomad',
  'Sentinel', 'Tempest', 'Thunderbolt', 'Maverick'
];

export function generateRandomCallSign() {
  const adj = CLIENT_ADJECTIVES[Math.floor(Math.random() * CLIENT_ADJECTIVES.length)];
  const noun = CLIENT_NOUNS[Math.floor(Math.random() * CLIENT_NOUNS.length)];
  const style = Math.random();

  if (style < 0.35) {
    return `${adj}${noun}`;
  } else if (style < 0.75) {
    const num = Math.floor(10 + Math.random() * 90);
    return `${adj}${noun}${num}`;
  } else {
    const num = Math.floor(1 + Math.random() * 99);
    return `${adj}${noun}_${num < 10 ? '0' + num : num}`;
  }
}

/**
 * Cryptographically Secure Password Generator
 * Generates an entropy-rich password (uppercase, lowercase, numbers, safe symbols)
 * using window.crypto.getRandomValues.
 */
export function generateSecurePassword(length = 10) {
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowers = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%&*';
  const allChars = uppers + lowers + digits + symbols;

  const cryptoObj = window.crypto || window.msCrypto;
  const getRandomChar = (charset) => {
    if (cryptoObj && cryptoObj.getRandomValues) {
      const arr = new Uint32Array(1);
      cryptoObj.getRandomValues(arr);
      return charset[arr[0] % charset.length];
    }
    return charset[Math.floor(Math.random() * charset.length)];
  };

  // Guarantee at least 1 of each character class
  const result = [
    getRandomChar(uppers),
    getRandomChar(lowers),
    getRandomChar(digits),
    getRandomChar(symbols),
  ];

  for (let i = result.length; i < length; i++) {
    result.push(getRandomChar(allChars));
  }

  // Cryptographic array shuffle
  for (let i = result.length - 1; i > 0; i--) {
    let j = 0;
    if (cryptoObj && cryptoObj.getRandomValues) {
      const arr = new Uint32Array(1);
      cryptoObj.getRandomValues(arr);
      j = arr[0] % (i + 1);
    } else {
      j = Math.floor(Math.random() * (i + 1));
    }
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.join('');
}

export class AuthModal {
  constructor(onAuthChanged, onOpenCashier = null) {
    this.modal = null;
    this.currentUser = null;
    this.onAuthChanged = onAuthChanged;
    this.onOpenCashier = onOpenCashier;
    this.pendingSuccessCallback = null;
    this.currentRecordsTab = 'bets'; // 'bets' | 'deposits' | 'withdrawals'
    this.cachedHistory = {
      bets: null,
      deposits: null,
      withdrawals: null,
    };
    this.initUI();
  }

  setCashierOpener(onOpenCashier) {
    this.onOpenCashier = onOpenCashier;
  }

  initUI() {
    const modalHtml = `
      <div class="pf-modal-backdrop" id="authModal" style="display: none; z-index: 10000;">
        <div class="pf-modal-box pilot-station-modal" style="max-width: 520px; width: 94%;">
          <div class="pf-modal-header">
            <div class="pf-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e51b24" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span id="authModalTitle">PILOT STATION</span>
            </div>
            <button class="pf-close-btn" id="authCloseBtn">✕</button>
          </div>

          <div class="pf-modal-body">
            <!-- Active Profile & Pilot Dashboard -->
            <div id="authProfileCard" style="display: none;">
              <!-- Identity Hero -->
              <div class="pilot-identity-hero">
                <div class="pilot-hero-top">
                  <div class="pilot-callsign-wrap">
                    <div class="pilot-avatar-icon">🧑‍✈️</div>
                    <div>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-weight: 800; color: #fff; font-size: 16px; letter-spacing: 0.3px;" id="profileUsername">Pilot</span>
                        <button id="btnEditCallsign" title="Change Pilot Call-Sign" class="pilot-edit-btn">
                          ✏️ Edit
                        </button>
                      </div>
                      <div id="profileEmail" class="pilot-email-text">user@example.com</div>
                    </div>
                  </div>
                  <span id="profileRoleBadge" class="pilot-role-badge">STANDARD</span>
                </div>

                <!-- Inline Rename / Call-Sign Change Box -->
                <div id="inlineRenameBox" style="display: none; margin-bottom: 12px; background: rgba(0,0,0,0.35); border: 1px solid rgba(229, 27, 36, 0.3); border-radius: var(--radius-sm); padding: 10px;">
                  <div style="font-size: 11px; color: var(--text-dim); margin-bottom: 6px; display: flex; justify-content: space-between;">
                    <span>New Call-Sign (3-16 Alphanumeric):</span>
                    <button type="button" id="btnShuffleRename" style="background: none; border: none; color: #f59e0b; cursor: pointer; font-size: 11px; font-weight: 700;">🎲 Suggest</button>
                  </div>
                  <div style="display: flex; gap: 6px;">
                    <input type="text" id="inputNewCallsign" class="bet-amount-input" style="flex: 1; text-align: left; padding: 6px 10px; background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); font-size: 13px;" maxlength="16" placeholder="e.g. ShadowFalcon77">
                    <button type="button" id="btnSaveCallsign" class="chip-btn active" style="padding: 6px 12px; font-size: 12px; font-weight: 700;">Save</button>
                    <button type="button" id="btnCancelRename" class="chip-btn" style="padding: 6px 10px; font-size: 12px;">✕</button>
                  </div>
                </div>

                <!-- Balance & Cashier Quick Actions -->
                <div class="pilot-balance-row">
                  <div class="pilot-balance-info">
                    <span class="pilot-balance-label">FLIGHT WALLET</span>
                    <span id="profileBalance" class="pilot-balance-value">$0.00 USD</span>
                  </div>
                  <div class="pilot-cashier-actions">
                    <button type="button" id="btnQuickDeposit" class="pilot-quick-btn deposit" title="Deposit funds via Binance Pay">
                      <svg width="15" height="15" viewBox="0 0 1024 1024" fill="#F0B90B"><path d="M512 0C229.2 0 0 229.2 0 512s229.2 512 512 512 512-229.2 512-512S794.8 0 512 0zm0 188.4l111.9 111.9-111.9 111.9-111.9-111.9L512 188.4zM245.9 454.5l111.9-111.9 111.9 111.9-111.9 111.9-111.9-111.9zm154.2 154.2l111.9-111.9 111.9 111.9-111.9 111.9-111.9-111.9zm266-154.2l111.9-111.9 111.9 111.9-111.9 111.9-111.9-111.9z"/></svg>
                      <span>Deposit</span>
                    </button>
                    <button type="button" id="btnQuickWithdraw" class="pilot-quick-btn withdraw" title="Withdraw funds via Binance">
                      <span>💸</span>
                      <span>Withdraw</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- History Records Panel -->
              <div class="pilot-records-section">
                <div class="pilot-records-header">
                  <span class="pilot-records-title">FLIGHT & FINANCIAL RECORDS</span>
                  <button type="button" id="btnRefreshHistory" class="pilot-refresh-btn" title="Refresh Records">
                    🔄 Refresh
                  </button>
                </div>

                <!-- Segmented Tabs for History -->
                <div class="pilot-records-tabs">
                  <button type="button" class="pilot-rec-tab active" data-tab="bets" id="tabRecBets">
                    🎮 Bet History
                  </button>
                  <button type="button" class="pilot-rec-tab" data-tab="deposits" id="tabRecDeposits">
                    💳 Deposits
                  </button>
                  <button type="button" class="pilot-rec-tab" data-tab="withdrawals" id="tabRecWithdrawals">
                    💸 Withdrawals
                  </button>
                </div>

                <!-- Records List Scrollable Container -->
                <div id="pilotRecordsList" class="pilot-records-list">
                  <!-- Rendered dynamically -->
                </div>
              </div>

              <button id="btnSignOut" class="pilot-signout-btn">
                Sign Out / Switch Pilot Account
              </button>
            </div>

            <!-- Auth Forms (Login / Register Tabs) -->
            <div id="authFormsContainer">
              <div class="bet-panel-tabs" style="margin-bottom: 14px;">
                <button class="tab-btn active" id="tabAuthLogin">Sign In</button>
                <button class="tab-btn" id="tabAuthRegister">Register</button>
              </div>

              <!-- Login Form -->
              <form id="formLogin" style="display: flex; flex-direction: column; gap: 10px;">
                <div class="form-group">
                  <label style="font-size: 12px; color: var(--text-dim); font-weight: 600;">Email or Mobile Number</label>
                  <input type="text" id="loginIdentifier" class="bet-amount-input" style="width: 100%; text-align: left; padding: 10px; background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); font-size: 14px;" required>
                </div>
                <div class="form-group">
                  <label style="font-size: 12px; color: var(--text-dim); font-weight: 600;">Password</label>
                  <input type="password" id="loginPassword" class="bet-amount-input" style="width: 100%; text-align: left; padding: 10px; background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); font-size: 14px;" required>
                </div>
                <button type="submit" class="main-action-btn btn-idle" style="width: 100%; padding: 10px; margin-top: 6px; font-size: 14px; font-weight: 700; height: 42px;">
                  SIGN IN
                </button>
              </form>

              <!-- Register Form -->
              <form id="formRegister" style="display: none; flex-direction: column; gap: 10px;">
                <div class="form-group">
                  <label style="font-size: 12px; color: var(--text-dim); font-weight: 600;">Email Address</label>
                  <input type="email" id="regEmail" class="bet-amount-input" style="width: 100%; text-align: left; padding: 10px; background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); font-size: 14px;" required>
                </div>

                <!-- Pilot Call-Sign / Username with Shuffle Feature -->
                <div class="form-group">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <label style="font-size: 12px; color: var(--text-dim); font-weight: 600;">Pilot Call-Sign / Username (Optional)</label>
                    <button type="button" id="btnShuffleUsername" style="background: none; border: none; color: #f59e0b; cursor: pointer; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; gap: 3px;">
                      🎲 Shuffle
                    </button>
                  </div>
                  <input type="text" id="regUsername" class="bet-amount-input" style="width: 100%; text-align: left; padding: 10px; background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); font-size: 14px;" maxlength="16">
                  <div style="font-size: 10px; color: #888; margin-top: 3px;">Letters, numbers and underscores only (3-16 chars)</div>
                </div>

                <div class="form-group">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <label style="font-size: 12px; color: var(--text-dim); font-weight: 600;">Password (Min 8 Characters)</label>
                    <button type="button" id="btnGeneratePassword" class="auth-text-action-btn" title="Auto-generate a strong password">
                      🔑 Auto-Generate
                    </button>
                  </div>
                  <div style="position: relative; display: flex; align-items: center;">
                    <input type="password" id="regPassword" class="bet-amount-input" style="width: 100%; text-align: left; padding: 10px 42px 10px 10px; background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); font-size: 14px;" minlength="8" required>
                    <button type="button" id="btnToggleRegPassword" class="auth-pwd-eye-btn" title="Show/Hide Password">
                      👁️
                    </button>
                  </div>
                </div>
                <button type="submit" class="main-action-btn btn-idle" style="width: 100%; padding: 10px; margin-top: 6px; font-size: 14px; font-weight: 700; height: 42px;">
                  CREATE FREE ACCOUNT
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    this.modal = document.getElementById('authModal');
    this.closeBtn = document.getElementById('authCloseBtn');

    this.closeBtn.addEventListener('click', () => this.hide());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.hide();
    });

    // Tab switching
    const tabLogin = document.getElementById('tabAuthLogin');
    const tabRegister = document.getElementById('tabAuthRegister');
    const formLogin = document.getElementById('formLogin');
    const formRegister = document.getElementById('formRegister');

    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      formLogin.style.display = 'flex';
      formRegister.style.display = 'none';
    });

    tabRegister.addEventListener('click', () => {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      formRegister.style.display = 'flex';
      formLogin.style.display = 'none';
    });

    // 🎲 Shuffle Call-Sign in Register Form
    const regUsernameInput = document.getElementById('regUsername');
    document.getElementById('btnShuffleUsername').addEventListener('click', () => {
      regUsernameInput.value = generateRandomCallSign();
      regUsernameInput.focus();
    });

    // 🔑 Auto-Generate Secure Password in Register Form
    const regPasswordInput = document.getElementById('regPassword');
    const btnGeneratePassword = document.getElementById('btnGeneratePassword');
    const btnToggleRegPassword = document.getElementById('btnToggleRegPassword');

    btnGeneratePassword.addEventListener('click', async () => {
      const strongPass = generateSecurePassword(10);
      regPasswordInput.value = strongPass;
      regPasswordInput.type = 'text'; // Reveal generated password so user can see it immediately
      btnToggleRegPassword.textContent = '🙈';
      btnToggleRegPassword.title = 'Hide Password';
      regPasswordInput.focus();

      try {
        await navigator.clipboard.writeText(strongPass);
        notificationManager.success(
          'Password Generated & Copied! 📋',
          `Generated: [${strongPass}]. Copied to clipboard, keep it safe!`
        );
      } catch (_) {
        notificationManager.info('Password Generated! 🔑', `Generated: [${strongPass}]. Please save it!`);
      }
    });

    // 👁️ Toggle Password Visibility (Show/Hide)
    btnToggleRegPassword.addEventListener('click', () => {
      if (regPasswordInput.type === 'password') {
        regPasswordInput.type = 'text';
        btnToggleRegPassword.textContent = '🙈';
        btnToggleRegPassword.title = 'Hide Password';
      } else {
        regPasswordInput.type = 'password';
        btnToggleRegPassword.textContent = '👁️';
        btnToggleRegPassword.title = 'Show Password';
      }
    });

    // Form handlers
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const identifier = document.getElementById('loginIdentifier').value.trim();
      const pass = document.getElementById('loginPassword').value;
      const res = await apiClient.login(identifier, pass);
      if (res.success && res.token) {
        socketClient.setAuthToken(res.token);
        if (this.onAuthChanged) this.onAuthChanged(res.user);
        this.hide();
        notificationManager.success('Welcome Back!', `Signed in as [${res.user?.username || identifier}].`);
        if (typeof this.pendingSuccessCallback === 'function') {
          const cb = this.pendingSuccessCallback;
          this.pendingSuccessCallback = null;
          cb(res.user);
        }
      } else {
        notificationManager.error('Sign In Failed', res.message || 'Login failed. Please check credentials.');
      }
    });

    formRegister.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('regEmail').value.trim();
      const pass = document.getElementById('regPassword').value;
      const chosenUsername = document.getElementById('regUsername').value.trim() || null;

      const res = await apiClient.register(email, pass, 'USD', chosenUsername);
      if (res.success && res.token) {
        socketClient.setAuthToken(res.token);
        if (this.onAuthChanged) this.onAuthChanged(res.user);
        this.hide();
        notificationManager.success('Pilot Registered!', `Welcome to SkyRush, [${res.user?.username || 'Pilot'}]!`);
        if (typeof this.pendingSuccessCallback === 'function') {
          const cb = this.pendingSuccessCallback;
          this.pendingSuccessCallback = null;
          cb(res.user);
        }
      } else {
        notificationManager.error('Registration Failed', res.message || 'Registration failed.');
      }
    });

    // Inline Rename UI Handling
    const inlineRenameBox = document.getElementById('inlineRenameBox');
    const inputNewCallsign = document.getElementById('inputNewCallsign');

    document.getElementById('btnEditCallsign').addEventListener('click', () => {
      inlineRenameBox.style.display = inlineRenameBox.style.display === 'none' ? 'block' : 'none';
      if (inlineRenameBox.style.display === 'block') {
        inputNewCallsign.value = this.currentUser?.username || '';
        inputNewCallsign.focus();
      }
    });

    document.getElementById('btnCancelRename').addEventListener('click', () => {
      inlineRenameBox.style.display = 'none';
    });

    document.getElementById('btnShuffleRename').addEventListener('click', () => {
      inputNewCallsign.value = generateRandomCallSign();
      inputNewCallsign.focus();
    });

    document.getElementById('btnSaveCallsign').addEventListener('click', async () => {
      const newCallsign = inputNewCallsign.value.trim();
      if (!newCallsign || newCallsign.length < 3 || newCallsign.length > 16) {
        notificationManager.warning('Invalid Call-Sign', 'Call-Sign must be between 3 and 16 characters.');
        return;
      }

      const res = await apiClient.renameUser(newCallsign);
      if (res.success && res.username) {
        this.currentUser = res;
        this.renderAuthState(res);
        inlineRenameBox.style.display = 'none';

        // Re-authenticate socket with the new handle
        const token = apiClient.getToken();
        if (token) {
          socketClient.setAuthToken(token);
        }

        if (this.onAuthChanged) this.onAuthChanged(res);
        notificationManager.success('Call-Sign Updated', `Call-Sign successfully updated to [${res.username}]!`);
      } else {
        notificationManager.error('Update Failed', res.message || 'Failed to update username. Name may already be taken.');
      }
    });

    // Quick Cashier Navigation
    const btnQuickDeposit = document.getElementById('btnQuickDeposit');
    if (btnQuickDeposit) {
      btnQuickDeposit.addEventListener('click', () => {
        this.hide();
        if (this.onOpenCashier) {
          this.onOpenCashier('deposit');
        }
      });
    }

    const btnQuickWithdraw = document.getElementById('btnQuickWithdraw');
    if (btnQuickWithdraw) {
      btnQuickWithdraw.addEventListener('click', () => {
        this.hide();
        if (this.onOpenCashier) {
          this.onOpenCashier('withdraw');
        }
      });
    }

    // Refresh History Records
    const btnRefreshHistory = document.getElementById('btnRefreshHistory');
    if (btnRefreshHistory) {
      btnRefreshHistory.addEventListener('click', () => {
        this.loadHistory(this.currentRecordsTab, true);
      });
    }

    // History Segmented Tabs - always fetch fresh records on click
    const tabRecBets = document.getElementById('tabRecBets');
    const tabRecDeposits = document.getElementById('tabRecDeposits');
    const tabRecWithdrawals = document.getElementById('tabRecWithdrawals');

    if (tabRecBets) {
      tabRecBets.addEventListener('click', () => this.loadHistory('bets', true));
    }
    if (tabRecDeposits) {
      tabRecDeposits.addEventListener('click', () => this.loadHistory('deposits', true));
    }
    if (tabRecWithdrawals) {
      tabRecWithdrawals.addEventListener('click', () => this.loadHistory('withdrawals', true));
    }

    // Global listener for deposit / withdrawal submissions from cashier
    window.addEventListener('skyrush:financial-update', (e) => {
      this.invalidateHistory();
    });

    document.getElementById('btnSignOut').addEventListener('click', async () => {
      await apiClient.logout();
      socketClient.setAuthToken(null);
      this.cachedHistory = { bets: null, deposits: null, withdrawals: null };
      if (this.onAuthChanged) this.onAuthChanged(null);
      this.renderAuthState(null);
    });
  }

  async show(onSuccessCallback = null) {
    if (!this.modal) return;
    this.pendingSuccessCallback = onSuccessCallback;
    const profile = await apiClient.getProfile();
    this.renderAuthState(profile && profile.id ? profile : null);
    this.modal.style.display = 'flex';
  }

  hide() {
    if (this.modal) {
      this.modal.style.display = 'none';
    }
  }

  renderAuthState(user) {
    this.currentUser = user;
    const card = document.getElementById('authProfileCard');
    const forms = document.getElementById('authFormsContainer');
    const inlineRename = document.getElementById('inlineRenameBox');
    if (inlineRename) inlineRename.style.display = 'none';

    if (user && user.id) {
      card.style.display = 'block';
      forms.style.display = 'none';
      document.getElementById('profileUsername').textContent = user.username || 'Pilot';
      document.getElementById('profileEmail').textContent = user.email || 'Mobile User';
      document.getElementById('profileBalance').textContent = `$${Number(user.balance || 0).toFixed(2)} USD`;
      const roleBadge = document.getElementById('profileRoleBadge');
      if (user.isMarketing) {
        roleBadge.textContent = 'STREAMER';
        roleBadge.style.color = '#f59e0b';
        roleBadge.style.background = 'rgba(245, 158, 11, 0.15)';
      } else {
        roleBadge.textContent = 'STANDARD';
        roleBadge.style.color = '#22c55e';
        roleBadge.style.background = 'rgba(34, 197, 94, 0.15)';
      }

      // Automatically load current history tab with live data
      this.loadHistory(this.currentRecordsTab, true);
    } else {
      card.style.display = 'none';
      forms.style.display = 'block';
      this.cachedHistory = { bets: null, deposits: null, withdrawals: null };
    }
  }

  invalidateHistory(targetTab = null) {
    if (targetTab) {
      this.cachedHistory[targetTab] = null;
    } else {
      this.cachedHistory = { bets: null, deposits: null, withdrawals: null };
    }
    const card = document.getElementById('authProfileCard');
    if (card && card.style.display !== 'none') {
      this.loadHistory(this.currentRecordsTab, true);
    }
  }

  async loadHistory(tabName, forceRefresh = false) {
    this.currentRecordsTab = tabName;
    const listEl = document.getElementById('pilotRecordsList');
    if (!listEl) return;

    // Update active tab buttons
    ['bets', 'deposits', 'withdrawals'].forEach((t) => {
      const btn = document.getElementById(`tabRec${t.charAt(0).toUpperCase() + t.slice(1)}`);
      if (btn) {
        if (t === tabName) btn.classList.add('active');
        else btn.classList.remove('active');
      }
    });

    if (forceRefresh) {
      this.cachedHistory[tabName] = null;
    }

    // Only use cached results if forceRefresh is false AND the cache contains existing non-empty records
    if (!forceRefresh && Array.isArray(this.cachedHistory[tabName]) && this.cachedHistory[tabName].length > 0) {
      this.renderHistoryTab(tabName, this.cachedHistory[tabName]);
      return;
    }

    listEl.innerHTML = `
      <div style="text-align: center; padding: 28px 16px; color: var(--text-dim); font-size: 13px;">
        <span style="display: inline-block; animation: spin 1s linear infinite; margin-right: 6px;">⏳</span> Loading ${tabName}...
      </div>
    `;

    try {
      if (tabName === 'bets') {
        const bets = await apiClient.getBetHistory();
        this.cachedHistory.bets = bets;
        this.renderHistoryTab('bets', bets);
      } else {
        const hist = await apiClient.getMyHistory();
        this.cachedHistory.deposits = hist.deposits || [];
        this.cachedHistory.withdrawals = hist.withdrawals || [];
        this.renderHistoryTab(tabName, this.cachedHistory[tabName] || []);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
      listEl.innerHTML = `
        <div style="text-align: center; padding: 24px 16px; color: #ef4444; font-size: 12px;">
          Failed to load records. <button id="btnRetryLoadHistory" style="background: none; border: none; color: #f59e0b; text-decoration: underline; cursor: pointer; font-weight: 700;">Retry</button>
        </div>
      `;
      const retryBtn = document.getElementById('btnRetryLoadHistory');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => this.loadHistory(tabName, true));
      }
    }
  }

  renderHistoryTab(tabName, items) {
    const listEl = document.getElementById('pilotRecordsList');
    if (!listEl) return;

    if (!items || items.length === 0) {
      let emptyMsg = 'No flight records yet.';
      let emptyHint = 'Place a bet and take to the skies!';
      if (tabName === 'deposits') {
        emptyMsg = 'No deposit records found.';
        emptyHint = 'Top up via Binance Pay to fund your flight wallet.';
      } else if (tabName === 'withdrawals') {
        emptyMsg = 'No withdrawal requests found.';
        emptyHint = 'Your cash-out payouts will appear here.';
      }

      listEl.innerHTML = `
        <div style="text-align: center; padding: 28px 16px; color: var(--text-dim);">
          <div style="font-size: 26px; margin-bottom: 6px; opacity: 0.6;">📭</div>
          <div style="font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 4px;">${emptyMsg}</div>
          <div style="font-size: 11px;">${emptyHint}</div>
        </div>
      `;
      return;
    }

    let html = '';
    if (tabName === 'bets') {
      html = items.map((item) => {
        const betAmt = Number(item.betAmount || 0);
        const winAmt = Number(item.winAmount || 0);
        const cashMult = item.cashOutMultiplier ? Number(item.cashOutMultiplier) : null;
        const crashPt = Number(item.crashPoint || 0);
        const isWin = cashMult !== null && cashMult > 0 && winAmt > 0;
        const dateStr = this.formatRecordDate(item.createdAt);

        return `
          <div class="rec-card">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="rec-mult-pill ${isWin ? 'win' : 'loss'}">
                ${isWin ? `${cashMult.toFixed(2)}x` : `${crashPt.toFixed(2)}x`}
              </span>
              <div>
                <div style="font-size: 12px; font-weight: 700; color: #fff;">
                  Bet: $${betAmt.toFixed(2)} USD
                </div>
                <div style="font-size: 10px; color: var(--text-dim);">
                  ${isWin ? `Cashed at ${cashMult.toFixed(2)}x (Crashed ${crashPt.toFixed(2)}x)` : `Crashed at ${crashPt.toFixed(2)}x`}
                </div>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 13px; font-weight: 800; color: ${isWin ? '#22c55e' : '#ef4444'};">
                ${isWin ? `+$${winAmt.toFixed(2)}` : `-$${betAmt.toFixed(2)}`}
              </div>
              <div style="font-size: 10px; color: var(--text-dim); margin-top: 2px;">${dateStr}</div>
            </div>
          </div>
        `;
      }).join('');
    } else if (tabName === 'deposits') {
      html = items.map((item) => {
        const amt = Number(item.amount || 0);
        const status = (item.status || 'PENDING').toUpperCase();
        const ref = item.referenceNumber || item.reference || item.txid || (item.id ? item.id.slice(0, 10) : 'BINANCE');
        const dateStr = this.formatRecordDate(item.createdAt);
        let badgeClass = 'status-pending';
        if (status === 'APPROVED' || status === 'COMPLETED' || status === 'SUCCESS') badgeClass = 'status-approved';
        else if (status === 'REJECTED' || status === 'FAILED') badgeClass = 'status-rejected';

        return `
          <div class="rec-card">
            <div>
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                <span style="font-size: 12px; font-weight: 700; color: #fff;">Binance Deposit</span>
                <span class="rec-badge ${badgeClass}">${status}</span>
              </div>
              <div style="font-size: 11px; color: var(--text-dim); display: flex; align-items: center; gap: 4px;">
                <span>Ref: <strong style="color: #cbd5e1;">${ref}</strong></span>
                <button type="button" class="btn-copy-ref" data-copy="${ref}" title="Copy Order Reference" style="background: none; border: none; color: #F0B90B; cursor: pointer; font-size: 10px; padding: 0 2px;">📋</button>
              </div>
              <div style="font-size: 10px; color: var(--text-dim); margin-top: 2px;">${dateStr}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 14px; font-weight: 800; color: #F0B90B;">
                +$${amt.toFixed(2)} <span style="font-size: 10px;">USD</span>
              </div>
            </div>
          </div>
        `;
      }).join('');
    } else if (tabName === 'withdrawals') {
      html = items.map((item) => {
        const amt = Number(item.amount || 0);
        const status = (item.status || 'PENDING').toUpperCase();
        const dateStr = this.formatRecordDate(item.createdAt);
        let payoutInfo = 'Binance Pay';
        if (item.payoutDetails) {
          try {
            const details = typeof item.payoutDetails === 'string' ? JSON.parse(item.payoutDetails || '{}') : item.payoutDetails;
            if (details.binancePayId) payoutInfo = `Pay ID: ${details.binancePayId}`;
            else if (details.usdtAddress) payoutInfo = `USDT: ${details.usdtAddress.slice(0, 6)}...${details.usdtAddress.slice(-4)}`;
          } catch {}
        }

        let badgeClass = 'status-pending';
        if (status === 'PAID' || status === 'APPROVED' || status === 'SUCCESS') badgeClass = 'status-approved';
        else if (status === 'CANCELLED') badgeClass = 'status-cancelled';
        else if (status === 'REJECTED' || status === 'FAILED') badgeClass = 'status-rejected';

        const canCancel = status === 'PENDING';

        return `
          <div class="rec-card" id="withdrawal-card-${item.id}">
            <div>
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                <span style="font-size: 12px; font-weight: 700; color: #fff;">Binance Withdrawal</span>
                <span class="rec-badge ${badgeClass}">${status}</span>
              </div>
              <div style="font-size: 11px; color: var(--text-dim);">${payoutInfo}</div>
              <div style="font-size: 10px; color: var(--text-dim); margin-top: 2px;">${dateStr}</div>
            </div>
            <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
              <div style="font-size: 14px; font-weight: 800; color: #10b981; display: flex; align-items: center; gap: 3px;">
                <span style="font-size: 13px; opacity: 0.85;">↗</span> $${amt.toFixed(2)} <span style="font-size: 10px; color: var(--text-dim); font-weight: 600;">USD</span>
              </div>
              ${canCancel ? `
                <button type="button" class="btn-cancel-withdrawal" data-id="${item.id}" data-amount="${amt.toFixed(2)}" title="Cancel this pending payout request">
                  ✕ Cancel Request
                </button>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    listEl.innerHTML = html;

    // Attach 1-click copy handler
    listEl.querySelectorAll('.btn-copy-ref').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const text = btn.getAttribute('data-copy');
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text).then(() => {
            notificationManager.success('Copied', `Copied reference: ${text}`);
            const orig = btn.textContent;
            btn.textContent = '✓';
            setTimeout(() => { btn.textContent = orig; }, 1500);
          });
        }
      });
    });

    // Attach Cancel Withdrawal handlers
    listEl.querySelectorAll('.btn-cancel-withdrawal').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const amount = btn.getAttribute('data-amount');

        if (!confirm(`Cancel this $${amount} USD withdrawal request and restore funds to your flight wallet balance?`)) {
          return;
        }

        btn.disabled = true;
        btn.textContent = 'Cancelling...';

        try {
          const res = await apiClient.cancelWithdrawal(id);
          if (res.success) {
            notificationManager.success(
              'Withdrawal Cancelled 💸',
              `$${amount} USD has been restored to your playable wallet balance!`
            );
            if (typeof res.newBalance === 'number') {
              if (this.currentUser) {
                this.currentUser.balance = res.newBalance;
              }
              if (this.onAuthChanged) {
                this.onAuthChanged(this.currentUser);
              }
              const balEl = document.getElementById('profileBalance');
              if (balEl) balEl.textContent = `$${Number(res.newBalance).toFixed(2)} USD`;
            }
            // Reload withdrawals
            this.loadHistory('withdrawals', true);
          } else {
            notificationManager.error('Cancellation Failed', res.message || 'Could not cancel withdrawal.');
            btn.disabled = false;
            btn.textContent = '✕ Cancel Request';
          }
        } catch (err) {
          console.error('Error cancelling withdrawal:', err);
          notificationManager.error('Error', 'Network or server error while cancelling withdrawal.');
          btn.disabled = false;
          btn.textContent = '✕ Cancel Request';
        }
      });
    });
  }

  formatRecordDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const time = `${hours}:${minutes}`;
    if (isToday) return `Today ${time}`;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${time}`;
  }
}
