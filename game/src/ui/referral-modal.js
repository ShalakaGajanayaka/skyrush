import { apiClient } from '../network/api-client.js';
import { notificationManager } from './notification-manager.js';
import confetti from 'canvas-confetti';

export class ReferralModal {
  constructor(getBalance, setBalance) {
    this.getBalance = getBalance;
    this.setBalance = setBalance;
    this.modalEl = null;
    this.stats = null;
    this.init();
  }

  init() {
    this.modalEl = document.createElement('div');
    this.modalEl.className = 'modal-backdrop referral-modal-backdrop';
    this.modalEl.id = 'referralModalBackdrop';
    this.modalEl.style.display = 'none';

    this.modalEl.innerHTML = `
      <div class="modal-card referral-modal-card">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <span class="modal-badge-icon">🤝</span>
            <div>
              <h3>Affiliate & Referrals</h3>
              <p class="modal-subtitle">Earn 5% on friends' 1st deposit + up to 1.0% on every flight!</p>
            </div>
          </div>
          <button class="modal-close" id="btnCloseReferralModal" title="Close">&times;</button>
        </div>

        <div class="modal-body referral-modal-body">
          <!-- 5% FTD Golden Callout Banner -->
          <div class="ref-bonus-callout">
            <div class="callout-header">
              <span class="callout-pill">🔥 5% FTD CASH BONUS</span>
              <span class="callout-sub">Instant On 1st Deposit</span>
            </div>
            <div class="callout-desc">
              When a pilot registers with your code and makes their <strong>First Deposit</strong>, you immediately receive <strong>5.0% cash</strong> in your affiliate wallet!
            </div>
          </div>

          <!-- Tier & Status Badge -->
          <div class="referral-tier-banner">
            <div class="tier-info">
              <span class="tier-tag" id="refTierBadge">BRONZE PILOT</span>
              <span class="tier-rate" id="refTierRate">0.50% Flight Turnover</span>
            </div>
            <div class="tier-desc">Continuous lifetime wager rebates on every single flight round played.</div>
          </div>

          <!-- Share Link Card -->
          <div class="ref-link-card">
            <label class="ref-label">YOUR UNIQUE REFERRAL LINK</label>
            <div class="ref-input-group">
              <input type="text" id="refLinkInput" readonly value="Loading..." />
              <button class="btn-copy-ref" id="btnCopyRefLink">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span id="btnCopyText">Copy</span>
              </button>
            </div>
            <div class="ref-social-share">
              <button class="btn-share-social whatsapp" id="btnShareWhatsApp">
                <span>📱 WhatsApp</span>
              </button>
              <button class="btn-share-social telegram" id="btnShareTelegram">
                <span>✈️ Telegram</span>
              </button>
            </div>
          </div>

          <!-- Metrics Grid (4-box layout) -->
          <div class="ref-stats-grid">
            <div class="ref-stat-box">
              <span class="stat-num" id="refInvitedCount">0</span>
              <span class="stat-name">Invited Pilots</span>
            </div>
            <div class="ref-stat-box highlight">
              <span class="stat-num" id="refClaimableBalance">$0.00</span>
              <span class="stat-name">Claimable Total</span>
            </div>
            <div class="ref-stat-box ftd-box">
              <span class="stat-num" id="refFtdEarnings">$0.00</span>
              <span class="stat-name">5% 1st Deposit Bonus</span>
            </div>
            <div class="ref-stat-box">
              <span class="stat-num" id="refWagerEarnings">$0.00</span>
              <span class="stat-name">Flight Rebates</span>
            </div>
          </div>

          <!-- Claim Button -->
          <div class="ref-claim-section">
            <button class="btn-claim-earnings" id="btnClaimReferral">
              <span>⚡ Transfer Earnings to Game Wallet</span>
            </button>
            <div class="claim-hint">Min transfer threshold: $1.00 USD • Available immediately for flight bets</div>
          </div>

          <!-- Recent Activity -->
          <div class="ref-history-wrap">
            <div class="ref-history-header">Recent Referral Rebates</div>
            <div class="ref-history-list" id="refHistoryList">
              <div class="empty-ref-history">No referral commissions recorded yet. Start sharing your link!</div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.modalEl);
    this.bindEvents();
  }

  bindEvents() {
    this.modalEl.querySelector('#btnCloseReferralModal').addEventListener('click', () => this.hide());
    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) this.hide();
    });

    // Copy referral link
    const copyBtn = this.modalEl.querySelector('#btnCopyRefLink');
    const input = this.modalEl.querySelector('#refLinkInput');
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(input.value);
        copyBtn.querySelector('#btnCopyText').textContent = 'Copied!';
        notificationManager.success('Referral Link Copied', 'Share it with your crew to earn 5% on their 1st deposit!');
        setTimeout(() => {
          copyBtn.querySelector('#btnCopyText').textContent = 'Copy';
        }, 2000);
      } catch {
        input.select();
        document.execCommand('copy');
        notificationManager.success('Referral Link Copied', 'Share it with your friends!');
      }
    });

    // Social share buttons
    this.modalEl.querySelector('#btnShareWhatsApp').addEventListener('click', () => {
      const link = input.value;
      const text = encodeURIComponent(`Join me on SkyRush Aviator! Fly high and win together: ${link}`);
      window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    });

    this.modalEl.querySelector('#btnShareTelegram').addEventListener('click', () => {
      const link = input.value;
      const text = encodeURIComponent(`Play SkyRush Aviator Crash Game with me! ${link}`);
      window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${text}`, '_blank');
    });

    // Claim earnings
    const claimBtn = this.modalEl.querySelector('#btnClaimReferral');
    claimBtn.addEventListener('click', async () => {
      claimBtn.disabled = true;
      claimBtn.innerHTML = '<span>⏳ Transferring...</span>';

      try {
        const res = await apiClient.claimReferralEarnings();
        if (res.success) {
          notificationManager.success('Earnings Claimed!', res.message || 'Transferred to game wallet!');
          if (this.setBalance && typeof res.newBalance === 'number') {
            this.setBalance(res.newBalance);
          }
          confetti({
            particleCount: 90,
            spread: 80,
            origin: { y: 0.6 },
          });
          await this.loadStats();
        } else {
          notificationManager.error('Claim Failed', res.message || 'Could not transfer earnings.');
        }
      } catch (err) {
        notificationManager.error('Claim Error', err?.message || 'Server error claiming earnings.');
      } finally {
        claimBtn.disabled = false;
        claimBtn.innerHTML = '<span>⚡ Transfer Earnings to Game Wallet</span>';
      }
    });
  }

  async show() {
    if (!apiClient.getToken()) {
      notificationManager.warning('Sign In Required', 'Please sign in or create an account to view your affiliate dashboard.');
      if (window.openAuthModal) {
        window.openAuthModal();
      }
      return;
    }

    this.modalEl.style.display = 'flex';
    document.body.classList.add('modal-open');
    await this.loadStats();
  }

  hide() {
    this.modalEl.style.display = 'none';
    document.body.classList.remove('modal-open');
  }

  async loadStats() {
    try {
      const res = await apiClient.getReferralStats();
      if (!res.success && res.error) {
        notificationManager.error('Error', res.message || 'Failed to load affiliate stats');
        return;
      }

      this.stats = res;
      this.render();
    } catch (err) {
      console.error('Failed to load referral stats', err);
    }
  }

  render() {
    if (!this.stats) return;

    const host = window.location.origin;
    const shareUrl = `${host}/?ref=${this.stats.referralCode || ''}`;
    this.modalEl.querySelector('#refLinkInput').value = shareUrl;

    // Tier badge
    const tier = this.stats.referralTier || 'BRONZE';
    const ratePercent = ((this.stats.commissionRate || 0.005) * 100).toFixed(2);
    this.modalEl.querySelector('#refTierBadge').textContent = `${tier} AFFILIATE`;
    this.modalEl.querySelector('#refTierRate').textContent = `${ratePercent}% Flight Turnover`;

    // Metrics
    this.modalEl.querySelector('#refInvitedCount').textContent = this.stats.referredCount || 0;
    this.modalEl.querySelector('#refClaimableBalance').textContent = `$${Number(this.stats.referralBalance || 0).toFixed(2)}`;
    this.modalEl.querySelector('#refFtdEarnings').textContent = `$${Number(this.stats.ftdEarnings || 0).toFixed(2)}`;
    this.modalEl.querySelector('#refWagerEarnings').textContent = `$${Number(this.stats.wagerEarnings || 0).toFixed(2)}`;

    // Claim button disable if under threshold
    const claimBtn = this.modalEl.querySelector('#btnClaimReferral');
    if (Number(this.stats.referralBalance || 0) < 1.0) {
      claimBtn.disabled = true;
      claimBtn.title = 'Need at least $1.00 USD to transfer';
      claimBtn.style.opacity = '0.5';
    } else {
      claimBtn.disabled = false;
      claimBtn.title = 'Click to transfer to game balance';
      claimBtn.style.opacity = '1';
    }

    // Recent activity list
    const listEl = this.modalEl.querySelector('#refHistoryList');
    if (this.stats.recentEarnings && this.stats.recentEarnings.length > 0) {
      listEl.innerHTML = this.stats.recentEarnings
        .map((item) => {
          const date = new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const isFtd = item.type === 'FTD_COMMISSION';
          const badgeText = isFtd
            ? `🎁 5% 1st Deposit ($${Number(item.amount || item.betAmount || 0).toFixed(2)})`
            : `✈️ Flight Wager ($${Number(item.amount || item.betAmount || 0).toFixed(2)})`;
          const badgeClass = isFtd ? 'ref-badge-ftd' : 'ref-flight-badge';

          return `
            <div class="ref-history-item ${isFtd ? 'highlight-ftd' : ''}">
              <div class="history-item-left">
                <span class="${badgeClass}">${badgeText}</span>
                <span class="ref-time">${date}</span>
              </div>
              <div class="ref-history-right">
                <span class="ref-earned-plus">+$${Number(item.earnedAmount).toFixed(4)} USD</span>
              </div>
            </div>
          `;
        })
        .join('');
    } else {
      listEl.innerHTML = `<div class="empty-ref-history">No referral commissions recorded yet. Start sharing your link!</div>`;
    }
  }
}
