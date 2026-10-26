import { soundManager } from '../audio/audio-manager.js';
import confetti from 'canvas-confetti';
import { notificationManager } from './notification-manager.js';

export class BetController {
  constructor(panelElement, panelIndex, socketClient, getBalanceCallback, setBalanceCallback) {
    this.panel = panelElement;
    this.index = panelIndex; // 1 or 2
    this.socket = socketClient;
    this.getBalance = getBalanceCallback;
    this.setBalance = setBalanceCallback;

    // Bet configuration
    this.amount = 10.0;
    this.minBet = 1.0;
    this.maxBet = 500.0;

    // States: 'idle' | 'queued' | 'placed' | 'cashed_out'
    this.state = 'idle';
    this.activeBetId = null;
    this.placedAmount = 0;

    // Auto features
    this.autoBet = false;
    this.autoCashout = false;
    this.autoCashoutMultiplier = 2.0;

    this.initUI();
  }

  initUI() {
    this.panel.innerHTML = `
      <div class="bet-panel-inner">
        <!-- Controls Header: Manual vs Auto Mode -->
        <div class="bet-panel-tabs">
          <button class="tab-btn active" data-tab="bet">Bet</button>
          <button class="tab-btn" data-tab="auto">Auto</button>
        </div>

        <div class="bet-panel-main">
          <!-- Left Column: Steppers & Quick Chips -->
          <div class="bet-controls-col">
            <div class="bet-stepper-box">
              <button class="stepper-btn minus-btn">−</button>
              <div class="bet-input-wrapper">
                <span class="currency-symbol">$</span>
                <input type="number" class="bet-amount-input" value="${this.amount.toFixed(2)}" min="1" max="500" step="1">
              </div>
              <button class="stepper-btn plus-btn">+</button>
            </div>

            <!-- Quick Chips: Pure USD [1, 2, 5, 10, 20, 50, 100, 500] -->
            <div class="quick-chips-row">
              <button class="chip-btn" data-val="1">1</button>
              <button class="chip-btn" data-val="2">2</button>
              <button class="chip-btn" data-val="5">5</button>
              <button class="chip-btn active" data-val="10">10</button>
              <button class="chip-btn" data-val="20">20</button>
              <button class="chip-btn" data-val="50">50</button>
              <button class="chip-btn" data-val="100">100</button>
              <button class="chip-btn" data-val="500">500</button>
            </div>

            <!-- Auto Cashout Row (Hidden unless Auto tab or toggled) -->
            <div class="auto-settings-row">
              <label class="auto-toggle-label">
                <input type="checkbox" class="auto-cashout-checkbox">
                <span>Auto Cash Out</span>
              </label>
              <div class="auto-mult-input-wrapper">
                <input type="number" class="auto-mult-input" value="2.00" min="1.01" max="1000" step="0.1">
                <span class="mult-x">x</span>
              </div>
            </div>
          </div>

          <!-- Right Column: Prominent Action Button -->
          <div class="bet-action-col">
            <button class="main-action-btn btn-idle">
              <span class="action-title">BET</span>
              <span class="action-subtitle">$${this.amount.toFixed(2)} USD</span>
            </button>
          </div>
        </div>
      </div>
    `;

    // Cache elements
    this.tabBtns = this.panel.querySelectorAll('.tab-btn');
    this.autoSettingsRow = this.panel.querySelector('.auto-settings-row');
    this.inputAmount = this.panel.querySelector('.bet-amount-input');
    this.btnAction = this.panel.querySelector('.main-action-btn');
    this.btnTitle = this.panel.querySelector('.action-title');
    this.btnSub = this.panel.querySelector('.action-subtitle');
    this.btnMinus = this.panel.querySelector('.minus-btn');
    this.btnPlus = this.panel.querySelector('.plus-btn');
    this.chips = this.panel.querySelectorAll('.chip-btn');
    this.chkAutoCashout = this.panel.querySelector('.auto-cashout-checkbox');
    this.inputAutoMult = this.panel.querySelector('.auto-mult-input');

    this.bindEvents();
    this.syncAutoUI();
  }

  syncAutoUI() {
    if (this.autoCashout) {
      this.autoSettingsRow?.classList.add('is-enabled');
      if (this.inputAutoMult) this.inputAutoMult.disabled = false;
    } else {
      this.autoSettingsRow?.classList.remove('is-enabled');
    }
  }

  bindEvents() {
    // Tab switching (Bet vs Auto Mode)
    this.tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.tabBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        if (tab === 'auto') {
          this.autoBet = true;
          this.autoCashout = true;
          if (this.chkAutoCashout) this.chkAutoCashout.checked = true;
          this.syncAutoUI();
          notificationManager.info(
            'Auto Bet Mode 🤖',
            `Slot ${this.index} will automatically re-bet $${this.amount.toFixed(2)} USD each round.`
          );
        } else {
          this.autoBet = false;
          notificationManager.info(
            'Manual Mode 🕹️',
            `Slot ${this.index} set to manual betting.`
          );
        }
      });
    });

    // Steppers
    this.btnMinus.addEventListener('click', () => {
      this.setAmount(Math.max(this.minBet, this.amount - 1));
    });

    this.btnPlus.addEventListener('click', () => {
      this.setAmount(Math.min(this.maxBet, this.amount + 1));
    });

    // Manual typing
    this.inputAmount.addEventListener('change', (e) => {
      let val = parseFloat(e.target.value) || this.minBet;
      val = Math.max(this.minBet, Math.min(this.maxBet, val));
      this.setAmount(val);
    });

    // Quick Chips
    this.chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const val = parseFloat(chip.dataset.val);
        this.setAmount(val);
      });
    });

    // Auto cashout toggle
    this.chkAutoCashout.addEventListener('change', (e) => {
      this.autoCashout = e.target.checked;
      this.syncAutoUI();
    });

    // Live typing on auto multiplier input
    const updateAutoMult = (valStr) => {
      let val = parseFloat(valStr);
      if (!isNaN(val) && val >= 1.01) {
        this.autoCashoutMultiplier = parseFloat(Math.min(1000, val).toFixed(2));
      }
    };

    this.inputAutoMult.addEventListener('input', (e) => {
      updateAutoMult(e.target.value);
    });

    this.inputAutoMult.addEventListener('change', (e) => {
      updateAutoMult(e.target.value);
      e.target.value = this.autoCashoutMultiplier.toFixed(2);
    });

    // Action button click
    this.btnAction.addEventListener('click', () => this.handleActionClick());
  }

  setAmount(val) {
    this.amount = parseFloat(val.toFixed(2));
    this.inputAmount.value = this.amount.toFixed(2);
    this.chips.forEach(c => {
      if (parseFloat(c.dataset.val) === this.amount) {
        c.classList.add('active');
      } else {
        c.classList.remove('active');
      }
    });

    if (this.state === 'idle') {
      this.btnSub.textContent = `$${this.amount.toFixed(2)} USD`;
    }
  }

  async handleActionClick() {
    if (this.state === 'idle') {
      // Check if user is authenticated
      const isAuth = window.isUserAuthenticated ? window.isUserAuthenticated() : Boolean(localStorage.getItem('skyrush_auth_token'));
      if (!isAuth) {
        notificationManager.info(
          'Sign In Required 🔐',
          'Please sign in or create an account to place bets and win real payouts.'
        );
        if (window.openAuthModal) {
          window.openAuthModal();
        }
        return;
      }

      // Check user balance
      const currentBalance = this.getBalance();
      if (currentBalance < this.amount) {
        // Haptic shake on this bet action button and header balance card
        notificationManager.shake(this.btnAction);
        notificationManager.shake('.balance-card');

        notificationManager.warning(
          'Insufficient Balance',
          `Your balance is $${currentBalance.toFixed(2)} USD. You need $${(this.amount - currentBalance).toFixed(2)} USD more to place this bet.`,
          {
            actionText: '⚡ Top Up Wallet',
            onAction: () => {
              if (window.openDepositModal) {
                window.openDepositModal(this.amount);
              }
            },
            duration: 5000,
          }
        );
        return;
      }

      this.placedAmount = this.amount;
      this.state = 'queued';
      this.updateButtonView();

      const betId = `bet_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      this.activeBetId = betId;

      const res = await this.socket.placeBet({
        id: betId,
        amount: this.placedAmount,
        betIndex: this.index,
        autoCashout: this.autoCashout ? this.autoCashoutMultiplier : null,
      });

      if (res && res.success) {
        if (typeof res.balance === 'number') {
          this.setBalance(res.balance);
        }
        this.activeBetId = res.bet?.id || betId;
        this.state = res.queued ? 'queued' : 'placed';
        this.updateButtonView();
      } else {
        notificationManager.error(
          'Bet Failed',
          res?.message || 'Failed to place bet. Please verify your login session.'
        );
        this.state = 'idle';
        this.activeBetId = null;
        this.updateButtonView();
      }
    } else if (this.state === 'queued') {
      // Cancel queued bet
      const res = await this.socket.cancelBet(this.index);
      if (res && res.success && typeof res.balance === 'number') {
        this.setBalance(res.balance);
      }
      this.state = 'idle';
      this.activeBetId = null;
      this.updateButtonView();
    } else if (this.state === 'placed') {
      // Cashout now!
      this.triggerCashout();
    }
  }

  async triggerCashout(multiplierOverride = null) {
    if (this.state !== 'placed' || !this.activeBetId) return;

    const mult = multiplierOverride || window.currentFlightMultiplier || 1.0;
    const estWin = Number((this.placedAmount * mult).toFixed(2));

    this.state = 'cashed_out';
    soundManager.playCashoutChime();

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (_) {}

    this.btnAction.className = 'main-action-btn btn-won';
    this.btnTitle.textContent = `WON $${estWin.toFixed(2)}`;
    this.btnSub.textContent = `@ ${mult.toFixed(2)}x`;

    this.activeBetId = null;

    const res = await this.socket.cashOut(this.index, mult);
    if (res && res.success) {
      if (typeof res.balance === 'number') {
        this.setBalance(res.balance);
      }
      const finalMult = res.multiplier || mult;
      const finalWin = res.winAmount || Number((this.placedAmount * finalMult).toFixed(2));
      this.btnTitle.textContent = `WON $${finalWin.toFixed(2)}`;
      this.btnSub.textContent = `@ ${finalMult.toFixed(2)}x`;
    } else if (res && !res.success) {
      console.warn('[BetController] Cashout rejected by server:', res.message);
    }
  }

  onRoundWaiting(countdown) {
    if (this.state === 'cashed_out') {
      this.state = 'idle';
      this.activeBetId = null;
      this.updateButtonView();
    }

    if (this.autoBet && this.state === 'idle') {
      this.handleActionClick();
    }
  }

  onRoundPlaying(startTime) {
    if (this.state === 'queued') {
      this.state = 'placed';
      this.updateButtonView();
    }
  }

  onFlightTick(multiplier) {
    if (this.state === 'placed') {
      const currentWin = (this.placedAmount * multiplier).toFixed(2);
      this.btnTitle.textContent = `CASH OUT`;
      if (this.autoCashout) {
        this.btnSub.textContent = `$${currentWin} (Auto ${this.autoCashoutMultiplier.toFixed(2)}x)`;
      } else {
        this.btnSub.textContent = `$${currentWin} USD`;
      }

      // When reaching auto-cashout target, give server-authoritative auto-cashout priority
      if (this.autoCashout && multiplier >= this.autoCashoutMultiplier && this.state === 'placed') {
        this.btnTitle.textContent = `CASHING OUT...`;
        this.btnSub.textContent = `@ ${this.autoCashoutMultiplier.toFixed(2)}x`;
        this.btnAction.classList.add('disabled');

        // Fallback: If server socket event is delayed by more than 1200ms, trigger manual fallback
        if (!this._autoCashoutFallbackTimer) {
          this._autoCashoutFallbackTimer = setTimeout(() => {
            if (this.state === 'placed') {
              this.triggerCashout(this.autoCashoutMultiplier);
            }
            this._autoCashoutFallbackTimer = null;
          }, 1200);
        }
      }
    }
  }

  onAutoCashedOut(data) {
    if (this._autoCashoutFallbackTimer) {
      clearTimeout(this._autoCashoutFallbackTimer);
      this._autoCashoutFallbackTimer = null;
    }
    if (this.state !== 'placed' && this.state !== 'queued') return;
    const mult = Number(data.multiplier) || this.autoCashoutMultiplier || 2.0;
    const finalWin = Number(data.winAmount) || Number((this.placedAmount * mult).toFixed(2));

    this.state = 'cashed_out';
    soundManager.playCashoutChime();

    try {
      confetti({
        particleCount: 55,
        spread: 65,
        origin: { y: 0.8 },
      });
    } catch (_) {}

    this.btnAction.className = 'main-action-btn btn-won';
    this.btnTitle.textContent = `WON $${finalWin.toFixed(2)}`;
    this.btnSub.textContent = `🎯 AUTO @ ${mult.toFixed(2)}x`;

    this.activeBetId = null;

    if (typeof data.balance === 'number') {
      this.setBalance(data.balance);
    }

    notificationManager.success(
      'Auto Cashout Won! 🎯',
      `Auto-cashed out at ${mult.toFixed(2)}x! +$${finalWin.toFixed(2)} USD credited to wallet.`
    );
  }

  onRoundCrashed(finalMultiplier) {
    if (this._autoCashoutFallbackTimer) {
      clearTimeout(this._autoCashoutFallbackTimer);
      this._autoCashoutFallbackTimer = null;
    }
    if (this.state === 'placed') {
      // Player lost
      this.state = 'idle';
      this.activeBetId = null;
      this.btnAction.className = 'main-action-btn btn-lost';
      this.btnTitle.textContent = 'FLEW AWAY';
      this.btnSub.textContent = `@ ${finalMultiplier.toFixed(2)}x`;

      setTimeout(() => {
        if (this.state === 'idle') {
          this.updateButtonView();
        }
      }, 2500);
    } else if (this.state === 'queued') {
      // Remains queued for next round
    } else {
      this.state = 'idle';
      this.activeBetId = null;
      this.updateButtonView();
    }
  }

  updateButtonView() {
    this.btnAction.className = 'main-action-btn';

    if (this.state === 'idle') {
      this.btnAction.classList.add('btn-idle');
      this.btnTitle.textContent = 'BET';
      this.btnSub.textContent = `$${this.amount.toFixed(2)} USD`;
    } else if (this.state === 'queued') {
      this.btnAction.classList.add('btn-queued');
      this.btnTitle.textContent = 'WAITING';
      this.btnSub.textContent = 'CANCEL';
    } else if (this.state === 'placed') {
      this.btnAction.classList.add('btn-cashout');
      this.btnTitle.textContent = 'CASH OUT';
      if (this.autoCashout) {
        this.btnSub.textContent = `$${this.placedAmount.toFixed(2)} • Auto ${this.autoCashoutMultiplier.toFixed(2)}x`;
      } else {
        this.btnSub.textContent = `$${this.placedAmount.toFixed(2)} USD`;
      }
    }
  }
}
