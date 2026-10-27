export class ProvablyFairModal {
  constructor() {
    this.modal = null;
    this.initUI();
  }

  initUI() {
    const modalHtml = `
      <div class="pf-modal-backdrop" id="pfModal" style="display: none;">
        <div class="pf-modal-box">
          <div class="pf-modal-header">
            <div class="pf-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>PROVABLY FAIR SETTINGS</span>
            </div>
            <button class="pf-close-btn" id="pfCloseBtn">✕</button>
          </div>

          <div class="pf-modal-body">
            <p class="pf-desc">
              Every round result is completely independent and 100% fair. The multiplier is generated using cryptographic SHA-256 HMAC hashing from the Server Seed and Client Seed before the round begins.
            </p>

            <div class="pf-field-group">
              <label>Current Round Number</label>
              <div class="pf-field-val" id="pfRoundNum">-</div>
            </div>

            <div class="pf-field-group">
              <label>Server Seed (SHA-256 Hash Committed)</label>
              <div class="pf-field-val pf-hash" id="pfServerHash">-</div>
            </div>

            <div class="pf-field-group">
              <label>Client Seed</label>
              <div class="pf-field-val pf-hash" id="pfClientSeed">-</div>
            </div>

            <div class="pf-field-group">
              <label>Previous Round Server Seed (Revealed)</label>
              <div class="pf-field-val pf-hash" id="pfPrevSeed">-</div>
            </div>

            <div class="pf-info-box">
              <span class="pf-badge">100% UNTOUCHABLE</span>
              <span>The game outcome is mathematically sealed before bets open. No operator or player can manipulate the flight.</span>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    this.modal = document.getElementById('pfModal');
    this.closeBtn = document.getElementById('pfCloseBtn');

    this.closeBtn.addEventListener('click', () => this.hide());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.hide();
    });
  }

  show(roundData) {
    // Disabled for now per user request
    return;
  }

  hide() {
    if (this.modal) {
      this.modal.style.display = 'none';
    }
  }
}
