/**
 * SkyRush Deposit & Cashier Modal Component
 * Provides seamless in-game wallet funding without disrupting gameplay.
 */
import { apiClient } from '../network/api-client.js';
import { notificationManager } from './notification-manager.js';

export class DepositModal {
  constructor(getBalance, setBalance) {
    this.getBalance = getBalance;
    this.setBalance = setBalance;
    this.modal = null;
    this.requiredAmount = 0;
    this.initUI();
  }

  initUI() {
    const modalHtml = `
      <div class="pf-modal-backdrop" id="depositModal" style="display: none; z-index: 10000;">
        <div class="pf-modal-box" style="max-width: 460px;">
          <div class="pf-modal-header">
            <div class="pf-title">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.2">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
              <span>PILOT CASHIER & TOP-UP</span>
            </div>
            <button class="pf-close-btn" id="depositCloseBtn">✕</button>
          </div>

          <div class="pf-modal-body">
            <!-- Balance Overview Card -->
            <div class="deposit-balance-overview">
              <div>
                <div class="overview-label">CURRENT BALANCE</div>
                <div class="overview-val" id="depositCurrentBal">$0.00 USD</div>
              </div>
              <div id="depositDeficitContainer" style="display: none; text-align: right;">
                <div class="overview-label" style="color: #f59e0b;">NEEDED FOR BET</div>
                <div class="overview-val" style="color: #f59e0b;" id="depositNeededVal">$0.00 USD</div>
              </div>
            </div>

            <!-- Tab Select: Quick Practice vs Official Deposit -->
            <div class="bet-panel-tabs" style="margin-bottom: 14px;">
              <button class="tab-btn active" id="tabDepositInstant">⚡ Instant Reload</button>
              <button class="tab-btn" id="tabDepositOfficial">🏦 Official Deposit</button>
            </div>

            <!-- TAB 1: Instant Reload (Demo / Play Balance) -->
            <div id="paneDepositInstant">
              <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 10px;">
                Choose an instant credit amount to immediately resume flight betting:
              </div>

              <!-- Quick Presets -->
              <div class="deposit-chips-grid">
                <button type="button" class="deposit-chip-btn" data-amt="25">+$25</button>
                <button type="button" class="deposit-chip-btn" data-amt="50">+$50</button>
                <button type="button" class="deposit-chip-btn active" data-amt="100">+$100</button>
                <button type="button" class="deposit-chip-btn" data-amt="500">+$500</button>
                <button type="button" class="deposit-chip-btn" data-amt="1000">+$1,000</button>
              </div>

              <div class="form-group" style="margin-top: 12px; margin-bottom: 14px;">
                <label style="font-size: 12px; color: var(--text-dim); font-weight: 600;">Custom Amount (USD)</label>
                <input type="number" id="inputInstantAmount" class="bet-amount-input" style="width: 100%; text-align: left; padding: 10px; background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); font-size: 15px; font-weight: 700; color: #22c55e;" value="100" min="1" step="1">
              </div>

              <button type="button" id="btnConfirmInstantReload" class="main-action-btn btn-idle" style="width: 100%; padding: 12px; font-size: 14px; font-weight: 800; height: 46px; background: linear-gradient(135deg, #16a34a, #22c55e); border: none;">
                ⚡ CREDIT WALLET NOW
              </button>
            </div>

            <!-- TAB 2: Official Deposit Request (Admin / Real Gateway) -->
            <div id="paneDepositOfficial" style="display: none;">
              <form id="formOfficialDeposit" style="display: flex; flex-direction: column; gap: 10px;">
                <div class="form-group">
                  <label style="font-size: 12px; color: var(--text-dim); font-weight: 600;">Deposit Amount ($ USD)</label>
                  <input type="number" id="officialDepositAmount" class="bet-amount-input" style="width: 100%; text-align: left; padding: 10px; background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); font-size: 14px;" placeholder="50.00" min="5" step="1" required>
                </div>

                <div class="form-group">
                  <label style="font-size: 12px; color: var(--text-dim); font-weight: 600;">Payment Method</label>
                  <select id="officialDepositMethod" class="bet-amount-input" style="width: 100%; text-align: left; padding: 10px; background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); font-size: 13px; color: #fff;">
                    <option value="USDT (TRC20)">USDT (TRC20) - Instant Blockchain</option>
                    <option value="Binance Pay">Binance Pay (Zero Fees)</option>
                    <option value="Bank CDM / Transfer">Bank CDM / Wire Transfer</option>
                    <option value="Credit / Debit Card">Credit / Debit Card</option>
                  </select>
                </div>

                <div class="form-group">
                  <label style="font-size: 12px; color: var(--text-dim); font-weight: 600;">Transaction / Slip Reference</label>
                  <input type="text" id="officialDepositRef" class="bet-amount-input" style="width: 100%; text-align: left; padding: 10px; background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); font-size: 13px;" placeholder="e.g. TXID-98314125 or Bank Slip No" required>
                </div>

                <button type="submit" id="btnSubmitOfficialDeposit" class="main-action-btn btn-idle" style="width: 100%; padding: 10px; margin-top: 4px; font-size: 14px; font-weight: 700; height: 42px;">
                  SUBMIT FOR APPROVAL
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    this.modal = document.getElementById('depositModal');

    // Close button & backdrop handlers
    const closeBtn = document.getElementById('depositCloseBtn');
    closeBtn.addEventListener('click', () => this.hide());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.hide();
    });

    // Tab switching
    const tabInstant = document.getElementById('tabDepositInstant');
    const tabOfficial = document.getElementById('tabDepositOfficial');
    const paneInstant = document.getElementById('paneDepositInstant');
    const paneOfficial = document.getElementById('paneDepositOfficial');

    tabInstant.addEventListener('click', () => {
      tabInstant.classList.add('active');
      tabOfficial.classList.remove('active');
      paneInstant.style.display = 'block';
      paneOfficial.style.display = 'none';
    });

    tabOfficial.addEventListener('click', () => {
      tabOfficial.classList.add('active');
      tabInstant.classList.remove('active');
      paneInstant.style.display = 'none';
      paneOfficial.style.display = 'block';
    });

    // Quick chip selectors
    const inputInstantAmount = document.getElementById('inputInstantAmount');
    const chips = this.modal.querySelectorAll('.deposit-chip-btn');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        inputInstantAmount.value = chip.getAttribute('data-amt');
      });
    });

    // Handle Instant Reload Button
    const btnInstant = document.getElementById('btnConfirmInstantReload');
    btnInstant.addEventListener('click', () => {
      const amt = Number(inputInstantAmount.value);
      if (!amt || amt <= 0) {
        notificationManager.warning('Invalid Amount', 'Please specify a valid top-up amount.');
        return;
      }

      const cur = this.getBalance();
      const updated = cur + amt;
      this.setBalance(updated);

      this.hide();
      notificationManager.success(
        'Wallet Reloaded! 💰',
        `Successfully credited +$${amt.toFixed(2)} USD to your flight wallet! Current balance: $${updated.toFixed(2)} USD.`
      );
    });

    // Handle Official Deposit Submission
    const formOfficial = document.getElementById('formOfficialDeposit');
    formOfficial.addEventListener('click', (e) => e.stopPropagation());
    formOfficial.addEventListener('submit', async (e) => {
      e.preventDefault();
      const amt = Number(document.getElementById('officialDepositAmount').value);
      const method = document.getElementById('officialDepositMethod').value;
      const ref = document.getElementById('officialDepositRef').value.trim();

      if (!amt || amt < 5) {
        notificationManager.warning('Minimum Deposit', 'Minimum official deposit is $5.00 USD.');
        return;
      }

      const btnSubmit = document.getElementById('btnSubmitOfficialDeposit');
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Submitting...';

      try {
        const res = await apiClient.submitDeposit(amt, method, ref);
        if (res && res.success) {
          this.hide();
          notificationManager.success(
            'Deposit Submitted! 🚀',
            res.message || 'Your deposit was submitted to administration for verification.'
          );
        } else {
          // If unauthenticated or failed, let user know
          notificationManager.warning(
            'Deposit Notice',
            res.message || 'Deposit received. If running in demo mode, use the Instant Reload tab.'
          );
        }
      } catch (err) {
        notificationManager.error('Deposit Error', 'Failed to submit deposit. Please check connection.');
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'SUBMIT FOR APPROVAL';
      }
    });
  }

  show(targetBetAmount = 0) {
    if (!this.modal) return;
    const cur = this.getBalance();
    this.requiredAmount = targetBetAmount;

    const elCurrent = document.getElementById('depositCurrentBal');
    if (elCurrent) elCurrent.textContent = `$${cur.toFixed(2)} USD`;

    const defContainer = document.getElementById('depositDeficitContainer');
    const elNeeded = document.getElementById('depositNeededVal');

    if (targetBetAmount > cur) {
      defContainer.style.display = 'block';
      elNeeded.textContent = `$${(targetBetAmount - cur).toFixed(2)} USD`;
      // Pre-set instant amount to round up the deficit nicely
      const deficit = targetBetAmount - cur;
      const roundAmt = Math.max(10, Math.ceil(deficit / 10) * 10);
      const inputInstant = document.getElementById('inputInstantAmount');
      if (inputInstant) inputInstant.value = roundAmt;
    } else {
      defContainer.style.display = 'none';
    }

    this.modal.style.display = 'flex';
  }

  hide() {
    if (this.modal) {
      this.modal.style.display = 'none';
    }
  }
}
