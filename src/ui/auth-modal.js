import { apiClient } from '../network/api-client.js';
import { socketClient } from '../network/socket-client.js';

export class AuthModal {
  constructor(onAuthChanged) {
    this.modal = null;
    this.onAuthChanged = onAuthChanged;
    this.initUI();
  }

  initUI() {
    const modalHtml = `
      <div class="pf-modal-backdrop" id="authModal" style="display: none; z-index: 10000;">
        <div class="pf-modal-box" style="max-width: 420px;">
          <div class="pf-modal-header">
            <div class="pf-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e51b24" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span id="authModalTitle">PLAYER ACCOUNT</span>
            </div>
            <button class="pf-close-btn" id="authCloseBtn">✕</button>
          </div>

          <div class="pf-modal-body">
            <!-- Active Profile Card -->
            <div id="authProfileCard" style="display: none; background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px; margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-weight: 700; color: #fff; font-size: 15px;" id="profileUsername">Pilot</span>
                <span id="profileRoleBadge" style="font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: rgba(34, 197, 94, 0.15); color: #22c55e;">STANDARD</span>
              </div>
              <div style="font-size: 13px; color: var(--text-dim); margin-bottom: 4px;" id="profileEmail">user@example.com</div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.05);">
                <span style="font-size: 12px; color: var(--text-dim);">Server Wallet:</span>
                <span style="font-size: 16px; font-weight: 800; color: #22c55e;" id="profileBalance">$0.00 USD</span>
              </div>
              <button id="btnSignOut" class="chip-btn" style="width: 100%; margin-top: 12px; padding: 8px; background: rgba(239, 68, 68, 0.15); color: #ef4444; border-color: rgba(239, 68, 68, 0.3);">
                Sign Out / Switch Account
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
                  <input type="text" id="loginIdentifier" class="bet-amount-input" style="width: 100%; text-align: left; padding: 10px; background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); font-size: 14px;" placeholder="e.g. player1@skyrush.cc" required>
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
      const res = await apiClient.register(email, pass, 'USD');
      if (res.success && res.token) {
        socketClient.setAuthToken(res.token);
        if (this.onAuthChanged) this.onAuthChanged(res.user);
        this.hide();
      } else {
        alert(res.message || 'Registration failed');
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
    const card = document.getElementById('authProfileCard');
    const forms = document.getElementById('authFormsContainer');
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
