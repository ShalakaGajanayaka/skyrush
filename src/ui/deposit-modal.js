/**
 * SkyRush Binance Cashier & Wallet Top-Up Component
 * Manual Peer-to-Merchant Clearing Model via Binance Pay / USDT.
 * No automated Binance APIs - verification is physically reviewed and approved by administrators.
 */
import { apiClient } from '../network/api-client.js';
import { notificationManager } from './notification-manager.js';

export class DepositModal {
  constructor(getBalance, setBalance) {
    this.getBalance = getBalance;
    this.setBalance = setBalance;
    this.modal = null;
    this.requiredAmount = 0;
    
    // Official SkyRush Binance Merchant Configuration
    this.binancePayId = '548934240';
    this.merchantNickname = 'SkyRush-Official';
    this.acceptedCurrency = 'USDT';

    this.initUI();
  }

  initUI() {
    const modalHtml = `
      <div class="pf-modal-backdrop" id="depositModal" style="display: none; z-index: 10000;">
        <div class="pf-modal-box binance-cashier-modal" style="max-width: 480px;">
          <!-- Modal Header -->
          <div class="pf-modal-header" style="border-bottom: 1px solid rgba(240, 185, 11, 0.2);">
            <div class="pf-title" style="display: flex; align-items: center; gap: 8px;">
              <svg width="24" height="24" viewBox="0 0 1024 1024" fill="#F0B90B">
                <path d="M512 0C229.2 0 0 229.2 0 512s229.2 512 512 512 512-229.2 512-512S794.8 0 512 0zm0 188.4l111.9 111.9-111.9 111.9-111.9-111.9L512 188.4zM245.9 454.5l111.9-111.9 111.9 111.9-111.9 111.9-111.9-111.9zm154.2 154.2l111.9-111.9 111.9 111.9-111.9 111.9-111.9-111.9zm266-154.2l111.9-111.9 111.9 111.9-111.9 111.9-111.9-111.9z"/>
              </svg>
              <span style="font-weight: 800; letter-spacing: 0.3px; color: #fff;">
                BINANCE <span style="color: #F0B90B;">CRYPTO DEPOSIT</span>
              </span>
            </div>
            <button class="pf-close-btn" id="depositCloseBtn" title="Close Cashier">✕</button>
          </div>

          <div class="pf-modal-body" style="padding-top: 14px;">
            <!-- Balance Overview Bar -->
            <div class="deposit-balance-overview">
              <div>
                <div class="overview-label">CURRENT BALANCE</div>
                <div class="overview-val" id="depositCurrentBal">$0.00 USD</div>
              </div>
              <div id="depositDeficitContainer" style="display: none; text-align: right;">
                <div class="overview-label" style="color: #F0B90B;">DEFICIT FOR BET</div>
                <div class="overview-val" style="color: #F0B90B;" id="depositNeededVal">$0.00 USD</div>
              </div>
            </div>

            <!-- Merchant Info Card -->
            <div class="binance-merchant-card">
              <div class="merchant-badge-row">
                <span class="binance-pill">
                  <span class="binance-dot"></span> Binance Pay / USDT
                </span>
                <span class="merchant-verified-tag">✓ Verified Merchant</span>
              </div>

              <!-- Pay ID Row with 1-Click Copy -->
              <div class="binance-info-row">
                <div>
                  <div class="info-label">BINANCE PAY ID</div>
                  <div class="info-value" id="valBinancePayId">${this.binancePayId}</div>
                </div>
                <button type="button" class="btn-copy-code" id="btnCopyPayId" title="Copy Binance Pay ID">
                  📋 Copy ID
                </button>
              </div>

              <!-- Recipient Nickname Row -->
              <div class="binance-info-row" style="margin-top: 8px;">
                <div>
                  <div class="info-label">RECIPIENT NICKNAME</div>
                  <div class="info-value" style="color: #fff; font-weight: 700;">${this.merchantNickname}</div>
                </div>
                <button type="button" class="btn-copy-code" id="btnCopyNickname" title="Copy Nickname">
                  📋 Copy Name
                </button>
              </div>
            </div>

            <!-- Visual Instructions (Accordion / Step Guide) -->
            <div class="binance-guide-box">
              <div class="guide-step">
                <span class="step-num">1</span>
                <span>Open <b>Binance App</b> ➔ Tap <b>Pay</b> (or Transfer to Pay ID).</span>
              </div>
              <div class="guide-step">
                <span class="step-num">2</span>
                <span>Enter Pay ID <b>${this.binancePayId}</b> & verify name is <b>${this.merchantNickname}</b>.</span>
              </div>
              <div class="guide-step">
                <span class="step-num">3</span>
                <span>Send amount and copy the <b>Binance Order ID / TxID</b> from payment receipt.</span>
              </div>
            </div>

            <!-- Form for submitting Binance Transfer Reference -->
            <form id="formBinanceDeposit" style="margin-top: 14px; display: flex; flex-direction: column; gap: 12px;">
              <!-- Deposit Amount Selection -->
              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <label style="font-size: 12px; color: var(--text-dim); font-weight: 700;">
                    DEPOSIT AMOUNT (USD / USDT)
                  </label>
                  <span style="font-size: 11px; color: #F0B90B; font-weight: 600;">1 USDT = $1.00 USD</span>
                </div>

                <!-- Quick Chips Grid -->
                <div class="deposit-chips-grid">
                  <button type="button" class="deposit-chip-btn" data-amt="10">$10</button>
                  <button type="button" class="deposit-chip-btn active" data-amt="25">$25</button>
                  <button type="button" class="deposit-chip-btn" data-amt="50">$50</button>
                  <button type="button" class="deposit-chip-btn" data-amt="100">$100</button>
                  <button type="button" class="deposit-chip-btn" data-amt="250">$250</button>
                </div>

                <input type="number" id="inputBinanceAmount" class="bet-amount-input" 
                  style="width: 100%; text-align: left; padding: 10px; background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); font-size: 15px; font-weight: 700; color: #F0B90B;" 
                  value="25" min="1" step="any" required>
              </div>

              <!-- Binance Order ID / TxID Field -->
              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <label style="font-size: 12px; color: var(--text-dim); font-weight: 700;">
                    BINANCE ORDER ID OR TXID <span style="color: #ef4444;">*</span>
                  </label>
                  <span style="font-size: 11px; color: var(--text-muted);">From payment slip</span>
                </div>
                <input type="text" id="inputBinanceTxId" class="bet-amount-input" 
                  style="width: 100%; text-align: left; padding: 10px; background: var(--bg-input); border: 1px solid rgba(240, 185, 11, 0.3); border-radius: var(--radius-sm); font-size: 14px; font-family: monospace; letter-spacing: 0.5px; color: #fff;" 
                  placeholder="e.g. 21984029148 or 0x3a8f..." required maxlength="96">
              </div>

              <!-- Submit Button -->
              <button type="submit" id="btnSubmitBinanceDeposit" class="btn-binance-action">
                ⚡ SUBMIT FOR ADMIN APPROVAL
              </button>
            </form>
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

    // 1-Click Copy Handlers
    this.setupCopyButton('btnCopyPayId', this.binancePayId, 'Binance Pay ID');
    this.setupCopyButton('btnCopyNickname', this.merchantNickname, 'Merchant Nickname');

    // Quick chip selection for Binance Amount
    const inputBinanceAmount = document.getElementById('inputBinanceAmount');
    const chipsBinance = this.modal.querySelectorAll('.deposit-chip-btn');
    chipsBinance.forEach(chip => {
      chip.addEventListener('click', () => {
        chipsBinance.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        inputBinanceAmount.value = chip.getAttribute('data-amt');
      });
    });

    // Handle Official Binance Form Submission
    const formBinance = document.getElementById('formBinanceDeposit');
    formBinance.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleBinanceDepositSubmit();
    });
  }

  setupCopyButton(btnId, textToCopy, label) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await navigator.clipboard.writeText(textToCopy);
        const originalText = btn.textContent;
        btn.textContent = '✓ Copied!';
        btn.classList.add('copied');
        notificationManager.info('Copied!', `${label} copied to clipboard.`);
        setTimeout(() => {
          btn.textContent = originalText;
          btn.classList.remove('copied');
        }, 2000);
      } catch (err) {
        notificationManager.warning('Copy Failed', `Please manually copy: ${textToCopy}`);
      }
    });
  }

  async handleBinanceDepositSubmit() {
    const inputAmount = document.getElementById('inputBinanceAmount');
    const inputTxId = document.getElementById('inputBinanceTxId');
    const btnSubmit = document.getElementById('btnSubmitBinanceDeposit');

    const amount = Number(inputAmount.value);
    const reference = inputTxId.value.trim();

    // Validation
    if (!amount || amount < 1.0) {
      notificationManager.warning('Minimum Deposit', 'Minimum Binance deposit is $1.00 USD.');
      return;
    }

    if (!reference || reference.length < 5) {
      notificationManager.warning('Order ID Required', 'Please enter a valid Binance Order ID or TxID from your payment slip.');
      inputTxId.focus();
      return;
    }

    btnSubmit.disabled = true;
    const originalBtnText = btnSubmit.innerHTML;
    btnSubmit.innerHTML = `⏳ Verifying with Server...`;

    try {
      const res = await apiClient.submitDeposit(amount, 'binance_usdt', reference);

      if (res && res.success) {
        this.hide();
        inputTxId.value = ''; // clear input

        notificationManager.show({
          type: 'success',
          title: 'Deposit Submitted! 🟡',
          message: `Request for $${amount.toFixed(2)} USD (Ref: ${reference.substring(0, 16)}...) sent to SkyRush Admin. Verification takes 2-5 minutes.`,
          duration: 6500,
        });
      } else {
        const errorMsg = res?.message || 'Failed to submit deposit request. Please try again.';
        if (errorMsg.toLowerCase().includes('unique') || errorMsg.toLowerCase().includes('reference')) {
          notificationManager.error('Duplicate Order ID', 'This Binance Order ID has already been submitted.');
        } else {
          notificationManager.warning('Deposit Notice', errorMsg);
        }
      }
    } catch (err) {
      console.error('[DepositModal] Submission failed:', err);
      notificationManager.error('Connection Error', 'Could not reach server. Please check your network.');
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = originalBtnText;
    }
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
      const deficit = targetBetAmount - cur;
      elNeeded.textContent = `$${deficit.toFixed(2)} USD`;

      // Pre-set Binance amount to match or round up the deficit nicely
      const roundAmt = Math.max(10, Math.ceil(deficit / 10) * 10);
      const inputBinance = document.getElementById('inputBinanceAmount');
      if (inputBinance) inputBinance.value = roundAmt;
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
