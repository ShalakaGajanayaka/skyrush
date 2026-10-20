import { apiClient } from '../network/api-client.js';
import { socketClient } from '../network/socket-client.js';

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

export class AuthModal {
  constructor(onAuthChanged) {
    this.modal = null;
    this.currentUser = null;
    this.onAuthChanged = onAuthChanged;
    this.initUI();
  }

  initUI() {
    const modalHtml = `
      <div class="pf-modal-backdrop" id="authModal" style="display: none; z-index: 10000;">
        <div class="pf-modal-box" style="max-width: 440px;">
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
            <!-- Active Profile Card -->
            <div id="authProfileCard" style="display: none; background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px; margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-weight: 800; color: #fff; font-size: 16px; letter-spacing: 0.3px;" id="profileUsername">Pilot</span>
                  <button id="btnEditCallsign" title="Change Pilot Call-Sign" style="background: rgba(255,255,255,0.08); border: 1px solid var(--border-subtle); border-radius: 4px; color: var(--text-dim); cursor: pointer; font-size: 11px; padding: 2px 7px; display: inline-flex; align-items: center; gap: 3px;">
                    ✏️ Edit
                  </button>
                </div>
                <span id="profileRoleBadge" style="font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: rgba(34, 197, 94, 0.15); color: #22c55e;">STANDARD</span>
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

              <div style="font-size: 13px; color: var(--text-dim); margin-bottom: 4px;" id="profileEmail">user@example.com</div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.05);">
                <span style="font-size: 12px; color: var(--text-dim);">Flight Wallet Balance:</span>
                <span style="font-size: 16px; font-weight: 800; color: #22c55e;" id="profileBalance">$0.00 USD</span>
              </div>
              <button id="btnSignOut" class="chip-btn" style="width: 100%; margin-top: 12px; padding: 8px; background: rgba(239, 68, 68, 0.15); color: #ef4444; border-color: rgba(239, 68, 68, 0.3);">
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
                  <input type="text" id="loginIdentifier" class="bet-amount-input" style="width: 100%; text-align: left; padding: 10px; background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); font-size: 14px;" placeholder="e.g. pilot@skyrush.cc" required>
                </div>
                <div class="form-group">
                  <label style="font-size: 12px; color: var(--text-dim); font-weight: 600;">Password</label>
                  <input type="password" id="loginPassword" class="bet-amount-input" style="width: 100%; text-align: left; padding: 10px; background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); font-size: 14px;" placeholder="••••••••" required>
                </div>
                <button type="submit" class="main-action-btn btn-idle" style="width: 100%; padding: 10px; margin-top: 6px; font-size: 14px; font-weight: 700; height: 42px;">
                  SIGN IN
                </button>
              </form>

              <!-- Register Form -->
              <form id="formRegister" style="display: none; flex-direction: column; gap: 10px;">
                <div class="form-group">
                  <label style="font-size: 12px; color: var(--text-dim); font-weight: 600;">Email Address</label>
                  <input type="email" id="regEmail" class="bet-amount-input" style="width: 100%; text-align: left; padding: 10px; background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); font-size: 14px;" placeholder="e.g. pilot@skyrush.cc" required>
                </div>

                <!-- Pilot Call-Sign / Username with Shuffle Feature -->
                <div class="form-group">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <label style="font-size: 12px; color: var(--text-dim); font-weight: 600;">Pilot Call-Sign / Username (Optional)</label>
                    <button type="button" id="btnShuffleUsername" style="background: none; border: none; color: #f59e0b; cursor: pointer; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; gap: 3px;">
                      🎲 Shuffle
                    </button>
                  </div>
                  <input type="text" id="regUsername" class="bet-amount-input" style="width: 100%; text-align: left; padding: 10px; background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); font-size: 14px;" placeholder="Leave empty for auto-generated name" maxlength="16">
                  <div style="font-size: 10px; color: #888; margin-top: 3px;">Letters, numbers and underscores only (3-16 chars)</div>
                </div>

                <div class="form-group">
                  <label style="font-size: 12px; color: var(--text-dim); font-weight: 600;">Password (Min 8 Characters)</label>
                  <input type="password" id="regPassword" class="bet-amount-input" style="width: 100%; text-align: left; padding: 10px; background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); font-size: 14px;" placeholder="••••••••" minlength="8" required>
                </div>
                <button type="submit" class="main-action-btn btn-idle" style="width: 100%; padding: 10px; margin-top: 6px; font-size: 14px; font-weight: 700; height: 42px;">
                  CREATE FREE ACCOUNT
                </button>
              </form>
            </div>

            <!-- Quick Dev Pilot Account Button -->
            <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed rgba(255,255,255,0.1); text-align: center;">
              <button id="btnQuickPilot" class="chip-btn" style="width: 100%; padding: 8px 12px; background: rgba(59, 130, 246, 0.15); color: #60a5fa; border-color: rgba(59, 130, 246, 0.3);">
                ⚡ Switch to Funded Pilot Account ($1,000 USD)
              </button>
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
      } else {
        alert(res.message || 'Login failed');
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
      } else {
        alert(res.message || 'Registration failed');
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
        alert('Call-Sign must be between 3 and 16 characters.');
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
        alert(`✅ Call-Sign successfully updated to [${res.username}]!`);
      } else {
        alert(res.message || 'Failed to update username. Name may already be taken.');
      }
    });

    // Quick Dev Pilot account ($1000 prefunded)
    document.getElementById('btnQuickPilot').addEventListener('click', async () => {
      const pilotToken = 'b83bba6036aaf920ce84812f4c0899bc15244c3b28ca51b2';
      apiClient.setToken(pilotToken);
      socketClient.setAuthToken(pilotToken);
      const profile = await apiClient.getProfile();
      if (profile && profile.id) {
        if (this.onAuthChanged) this.onAuthChanged(profile);
      }
      this.hide();
    });

    document.getElementById('btnSignOut').addEventListener('click', async () => {
      await apiClient.logout();
      socketClient.setAuthToken(null);
      if (this.onAuthChanged) this.onAuthChanged(null);
      this.renderAuthState(null);
    });
  }

  async show() {
    if (!this.modal) return;
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
    } else {
      card.style.display = 'none';
      forms.style.display = 'block';
    }
  }
}
