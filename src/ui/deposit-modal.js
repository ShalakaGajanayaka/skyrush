/**
 * SkyRush Binance Cashier & Wallet Top-Up Component
 * Manual Peer-to-Merchant Clearing Model via Binance Pay / USDT.
 * Supports:
 *  - Binance Crypto Deposit (Min $5.00 USD)
 *  - Binance Crypto Withdrawal (Min $7.00 USD)
 * Physical review and manual approval by SkyRush administrators.
 */
import { apiClient } from '../network/api-client.js';
import { notificationManager } from './notification-manager.js';

export class DepositModal {
  constructor(getBalance, setBalance) {
    this.getBalance = getBalance;
    this.setBalance = setBalance;
    this.modal = null;
    this.requiredAmount = 0;
    this.activeTab = 'deposit'; // 'deposit' | 'withdraw'
    
    // Official SkyRush Binance Merchant Configuration
    this.binancePayId = '548934240';
    this.merchantNickname = 'SkyRush-Official';
    this.acceptedCurrency = 'USDT';

    // Platform Limits
    this.minDepositUSD = 5.0;
    this.minWithdrawUSD = 7.0;

    this.initUI();
  }

  initUI() {
    const modalHtml = `
      <div class="pf-modal-backdrop" id="depositModal" style="display: none; z-index: 10000;">
        <div class="pf-modal-box binance-cashier-modal" style="max-width: 490px;">
          <!-- Modal Header with Navigation Tabs -->
          <div class="pf-modal-header" style="border-bottom: 1px solid rgba(240, 185, 11, 0.2); flex-direction: column; align-items: stretch; gap: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
              <div class="pf-title" style="display: flex; align-items: center; gap: 8px;">
                <svg width="24" height="24" viewBox="0 0 1024 1024" fill="#F0B90B">
                  <path d="M512 0C229.2 0 0 229.2 0 512s229.2 512 512 512 512-229.2 512-512S794.8 0 512 0zm0 188.4l111.9 111.9-111.9 111.9-111.9-111.9L512 188.4zM245.9 454.5l111.9-111.9 111.9 111.9-111.9 111.9-111.9-111.9zm154.2 154.2l111.9-111.9 111.9 111.9-111.9 111.9-111.9-111.9zm266-154.2l111.9-111.9 111.9 111.9-111.9 111.9-111.9-111.9z"/>
                </svg>
                <span style="font-weight: 800; letter-spacing: 0.3px; color: #fff;">
                  BINANCE <span style="color: #F0B90B;">CASHIER</span>
                </span>
              </div>
              <button class="pf-close-btn" id="depositCloseBtn" title="Close Cashier">✕</button>
            </div>

            <!-- Dual Cashier Navigation Tabs -->
            <div class="bet-panel-tabs cashier-nav-tabs" style="display: flex; gap: 8px; width: 100%; margin: 0;">
              <button type="button" class="tab-btn active" id="tabCashierDeposit" style="flex: 1; padding: 8px; font-size: 13px; font-weight: 700;">
                ⚡ Binance Deposit
              </button>
              <button type="button" class="tab-btn" id="tabCashierWithdraw" style="flex: 1; padding: 8px; font-size: 13px; font-weight: 700;">
                💸 Binance Withdraw
              </button>
            </div>
          </div>

          <div class="pf-modal-body" style="padding-top: 14px;">
            <!-- ======================================================== -->
            <!-- SECTION 1: BINANCE DEPOSIT TAB                           -->
            <!-- ======================================================== -->
            <div id="cashierDepositSection">
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

                <!-- Binance Pay QR Code Display -->
                <div class="binance-qr-section">
                  <div class="binance-qr-frame">
                    <img 
                      src="/binance-qr.png" 
                      alt="Binance Pay QR Code" 
                      class="binance-qr-img" 
                      onerror="if(!this._triedJpeg){this._triedJpeg=true;this.src='/binance-qr.jpeg';}"
                    />
                  </div>
                  <div class="binance-qr-subtext">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F0B90B" stroke-width="2.2">
                      <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
                      <rect x="7" y="7" width="10" height="10" rx="1"/>
                    </svg>
                    <span>Scan with <b>Binance App</b> or use Pay ID below</span>
                  </div>
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

              <!-- Visual Instructions -->
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
                  <span>Send amount (min $5) and copy the <b>Binance Order ID / TxID</b> from receipt.</span>
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
                    <span style="font-size: 11px; color: #F0B90B; font-weight: 700;">Min: $5.00 USD</span>
                  </div>

                  <!-- Quick Chips Grid ($5, $10, $25, $50, $100) -->
                  <div class="deposit-chips-grid">
                    <button type="button" class="deposit-chip-btn" data-amt="5">$5</button>
                    <button type="button" class="deposit-chip-btn active" data-amt="10">$10</button>
                    <button type="button" class="deposit-chip-btn" data-amt="25">$25</button>
                    <button type="button" class="deposit-chip-btn" data-amt="50">$50</button>
                    <button type="button" class="deposit-chip-btn" data-amt="100">$100</button>
                  </div>

                  <input type="number" id="inputBinanceAmount" class="bet-amount-input" 
                    style="width: 100%; text-align: left; padding: 10px; background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); font-size: 15px; font-weight: 700; color: #F0B90B;" 
                    value="10" min="5" step="any" required>
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
                  ⚡ SUBMIT DEPOSIT FOR ADMIN APPROVAL
                </button>
              </form>
            </div>

            <!-- ======================================================== -->
            <!-- SECTION 2: BINANCE WITHDRAWAL TAB                        -->
            <!-- ======================================================== -->
            <div id="cashierWithdrawSection" style="display: none;">
              <!-- Available Balance Bar -->
              <div class="deposit-balance-overview" style="border-left: 3px solid #10b981;">
                <div>
                  <div class="overview-label">AVAILABLE TO WITHDRAW</div>
                  <div class="overview-val" style="color: #10b981;" id="withdrawCurrentBal">$0.00 USD</div>
                </div>
                <div style="text-align: right;">
                  <div class="overview-label" style="color: #F0B90B;">MINIMUM PAYOUT</div>
                  <div class="overview-val" style="color: #F0B90B; font-size: 14px;">$7.00 USD</div>
                </div>
              </div>

              <!-- Payout Channel Badge -->
              <div class="binance-merchant-card" style="padding: 12px; margin-bottom: 12px;">
                <div class="merchant-badge-row" style="margin-bottom: 0;">
                  <span class="binance-pill">
                    <span class="binance-dot"></span> Payout via Binance Pay / USDT
                  </span>
                  <span class="merchant-verified-tag" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border-color: rgba(16, 185, 129, 0.3);">
                    ✓ 0% Platform Fee
                  </span>
                </div>
              </div>

              <!-- Withdrawal Form -->
              <form id="formBinanceWithdraw" style="display: flex; flex-direction: column; gap: 12px;">
                <!-- Withdrawal Amount Selection -->
                <div class="form-group">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <label style="font-size: 12px; color: var(--text-dim); font-weight: 700;">
                      WITHDRAWAL AMOUNT (USD / USDT)
                    </label>
                    <span style="font-size: 11px; color: #10b981; font-weight: 700;">Min: $7.00 USD</span>
                  </div>

                  <!-- Quick Chips Grid ($7, $15, $30, $50, $100, MAX) -->
                  <div class="deposit-chips-grid" id="withdrawChipsGrid" style="grid-template-columns: repeat(6, 1fr);">
                    <button type="button" class="deposit-chip-btn active" data-wamt="7">$7</button>
                    <button type="button" class="deposit-chip-btn" data-wamt="15">$15</button>
                    <button type="button" class="deposit-chip-btn" data-wamt="30">$30</button>
                    <button type="button" class="deposit-chip-btn" data-wamt="50">$50</button>
                    <button type="button" class="deposit-chip-btn" data-wamt="100">$100</button>
                    <button type="button" class="deposit-chip-btn" data-wamt="MAX" style="color: #F0B90B;">MAX</button>
                  </div>

                  <input type="number" id="inputWithdrawAmount" class="bet-amount-input" 
                    style="width: 100%; text-align: left; padding: 10px; background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); font-size: 15px; font-weight: 700; color: #10b981;" 
                    value="7" min="7" step="any" required>
                </div>

                <!-- Recipient Binance Pay ID or Crypto Address -->
                <div class="form-group">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <label style="font-size: 12px; color: var(--text-dim); font-weight: 700;">
                      YOUR BINANCE PAY ID OR USDT ADDRESS <span style="color: #ef4444;">*</span>
                    </label>
                    <span style="font-size: 11px; color: var(--text-muted);">TRC20 / BEP20 / Pay ID</span>
                  </div>
                  <input type="text" id="inputWithdrawRecipient" class="bet-amount-input" 
                    style="width: 100%; text-align: left; padding: 10px; background: var(--bg-input); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: var(--radius-sm); font-size: 14px; font-family: monospace; letter-spacing: 0.5px; color: #fff;" 
                    placeholder="e.g. 548934240 or 0x3a... / T..." required maxlength="96">
                </div>

                <!-- Recipient Nickname (Optional) -->
                <div class="form-group">
                  <label style="font-size: 12px; color: var(--text-dim); font-weight: 600; margin-bottom: 6px; display: block;">
                    BINANCE ACCOUNT NICKNAME (OPTIONAL)
                  </label>
                  <input type="text" id="inputWithdrawNickname" class="bet-amount-input" 
                    style="width: 100%; text-align: left; padding: 10px; background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); font-size: 14px; color: #fff;" 
                    placeholder="e.g. SkyPilot99" maxlength="32">
                </div>

                <!-- Escrow Security Note -->
                <div class="binance-security-footer" style="border-left-color: #10b981; margin-top: 4px;">
                  🔒 <b>Escrow Protection:</b> Funds are reserved in escrow upon submission. Once verified by our financial desk, USDT is transferred directly to your Binance wallet.
                </div>

                <!-- Submit Withdrawal Button -->
                <button type="submit" id="btnSubmitBinanceWithdraw" class="btn-binance-action" style="background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);">
                  💸 SUBMIT WITHDRAWAL REQUEST
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

    // 1-Click Copy Handlers
    this.setupCopyButton('btnCopyPayId', this.binancePayId, 'Binance Pay ID');
    this.setupCopyButton('btnCopyNickname', this.merchantNickname, 'Merchant Nickname');

    // Tab Switching Handlers
    const tabDeposit = document.getElementById('tabCashierDeposit');
    const tabWithdraw = document.getElementById('tabCashierWithdraw');
    const sectionDeposit = document.getElementById('cashierDepositSection');
    const sectionWithdraw = document.getElementById('cashierWithdrawSection');

    tabDeposit.addEventListener('click', () => {
      this.switchTab('deposit');
    });

    tabWithdraw.addEventListener('click', () => {
      this.switchTab('withdraw');
    });

    // Quick chip selection for Binance Deposit Amount ($5, $10, $25, $50, $100)
    const inputBinanceAmount = document.getElementById('inputBinanceAmount');
    const chipsBinance = sectionDeposit.querySelectorAll('.deposit-chip-btn');
    chipsBinance.forEach(chip => {
      chip.addEventListener('click', () => {
        chipsBinance.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        inputBinanceAmount.value = chip.getAttribute('data-amt');
      });
    });

    // Quick chip selection for Binance Withdrawal Amount ($7, $15, $30, $50, $100, MAX)
    const inputWithdrawAmount = document.getElementById('inputWithdrawAmount');
    const chipsWithdraw = sectionWithdraw.querySelectorAll('.deposit-chip-btn');
    chipsWithdraw.forEach(chip => {
      chip.addEventListener('click', () => {
        chipsWithdraw.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const val = chip.getAttribute('data-wamt');
        if (val === 'MAX') {
          const curBal = Math.max(0, this.getBalance());
          inputWithdrawAmount.value = curBal.toFixed(2);
        } else {
          inputWithdrawAmount.value = val;
        }
      });
    });

    // Handle Official Binance Deposit Submission
    const formBinance = document.getElementById('formBinanceDeposit');
    formBinance.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleBinanceDepositSubmit();
    });

    // Handle Official Binance Withdrawal Submission
    const formWithdraw = document.getElementById('formBinanceWithdraw');
    formWithdraw.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleBinanceWithdrawSubmit();
    });
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    const tabDeposit = document.getElementById('tabCashierDeposit');
    const tabWithdraw = document.getElementById('tabCashierWithdraw');
    const sectionDeposit = document.getElementById('cashierDepositSection');
    const sectionWithdraw = document.getElementById('cashierWithdrawSection');

    if (tabName === 'deposit') {
      tabDeposit.classList.add('active');
      tabWithdraw.classList.remove('active');
      sectionDeposit.style.display = 'block';
      sectionWithdraw.style.display = 'none';
    } else {
      tabWithdraw.classList.add('active');
      tabDeposit.classList.remove('active');
      sectionWithdraw.style.display = 'block';
      sectionDeposit.style.display = 'none';

      // Update available balance on withdraw tab
      const cur = this.getBalance();
      const elWithdrawBal = document.getElementById('withdrawCurrentBal');
      if (elWithdrawBal) elWithdrawBal.textContent = `$${cur.toFixed(2)} USD`;
    }
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

    // Minimum $5 USD validation
    if (!amount || amount < this.minDepositUSD) {
      notificationManager.warning(
        'Minimum Deposit Required',
        `Minimum Binance deposit amount is $${this.minDepositUSD.toFixed(2)} USD / USDT.`
      );
      inputAmount.focus();
      return;
    }

    if (!reference || reference.length < 5) {
      notificationManager.warning(
        'Order ID Required',
        'Please enter a valid Binance Order ID or TxID from your payment slip.'
      );
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
      console.error('[DepositModal] Deposit submission failed:', err);
      notificationManager.error('Connection Error', 'Could not reach server. Please check your network.');
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = originalBtnText;
    }
  }

  async handleBinanceWithdrawSubmit() {
    const inputAmount = document.getElementById('inputWithdrawAmount');
    const inputRecipient = document.getElementById('inputWithdrawRecipient');
    const inputNickname = document.getElementById('inputWithdrawNickname');
    const btnSubmit = document.getElementById('btnSubmitBinanceWithdraw');

    const amount = Number(inputAmount.value);
    const recipient = inputRecipient.value.trim();
    const nickname = inputNickname.value.trim();
    const curBalance = this.getBalance();

    // Minimum $7 USD validation
    if (!amount || amount < this.minWithdrawUSD) {
      notificationManager.warning(
        'Minimum Withdrawal Required',
        `Minimum withdrawal amount is $${this.minWithdrawUSD.toFixed(2)} USD / USDT.`
      );
      inputAmount.focus();
      return;
    }

    // Insufficient Balance check
    if (amount > curBalance) {
      notificationManager.warning(
        'Insufficient Balance',
        `Cannot withdraw $${amount.toFixed(2)} USD. Your available balance is $${curBalance.toFixed(2)} USD.`
      );
      inputAmount.focus();
      return;
    }

    // Valid Recipient detail
    if (!recipient || recipient.length < 5) {
      notificationManager.warning(
        'Binance Recipient Required',
        'Please enter your valid Binance Pay ID or USDT wallet address (TRC20/BEP20).'
      );
      inputRecipient.focus();
      return;
    }

    btnSubmit.disabled = true;
    const originalBtnText = btnSubmit.innerHTML;
    btnSubmit.innerHTML = `⏳ Reserving Escrow...`;

    try {
      const payoutDetails = {
        payId: recipient,
        walletAddress: recipient,
        nickname: nickname || undefined,
        network: 'USDT (Binance Pay / TRC20 / BEP20)',
      };

      const res = await apiClient.submitWithdrawal(amount, 'binance_usdt', payoutDetails);

      if (res && res.success) {
        // Escrow deduction: balance is held immediately
        const newBal = Math.max(0, curBalance - amount);
        this.setBalance(newBal);

        this.hide();
        inputRecipient.value = '';
        inputNickname.value = '';

        notificationManager.show({
          type: 'success',
          title: 'Withdrawal Submitted! 💸',
          message: `Your withdrawal request for $${amount.toFixed(2)} USD is under review. Funds are secured in escrow.`,
          duration: 7000,
        });

        // Sync fresh profile in background
        apiClient.getProfile().then(p => {
          if (p && typeof p.balance === 'number') {
            this.setBalance(p.balance);
          }
        }).catch(() => {});
      } else {
        notificationManager.error(
          'Withdrawal Failed',
          res?.message || 'Failed to submit withdrawal request. Please check your balance and pending limits.'
        );
      }
    } catch (err) {
      console.error('[DepositModal] Withdrawal submission failed:', err);
      notificationManager.error('Connection Error', 'Could not reach server. Please check your network.');
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = originalBtnText;
    }
  }

  show(targetBetAmount = 0, initialTab = 'deposit') {
    if (!this.modal) return;
    const cur = this.getBalance();
    this.requiredAmount = targetBetAmount;

    const elCurrent = document.getElementById('depositCurrentBal');
    if (elCurrent) elCurrent.textContent = `$${cur.toFixed(2)} USD`;

    const elWithdrawBal = document.getElementById('withdrawCurrentBal');
    if (elWithdrawBal) elWithdrawBal.textContent = `$${cur.toFixed(2)} USD`;

    const defContainer = document.getElementById('depositDeficitContainer');
    const elNeeded = document.getElementById('depositNeededVal');

    if (targetBetAmount > cur) {
      defContainer.style.display = 'block';
      const deficit = targetBetAmount - cur;
      elNeeded.textContent = `$${deficit.toFixed(2)} USD`;

      // Pre-set Binance deposit amount to match or round up the deficit nicely (min $5)
      const roundAmt = Math.max(5, Math.ceil(deficit / 5) * 5);
      const inputBinance = document.getElementById('inputBinanceAmount');
      if (inputBinance) inputBinance.value = roundAmt;
    } else {
      defContainer.style.display = 'none';
    }

    this.switchTab(initialTab);
    this.modal.style.display = 'flex';
  }

  hide() {
    if (this.modal) {
      this.modal.style.display = 'none';
    }
  }
}
