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
              <p class="modal-subtitle">Invite friends & earn up to 1.0% on every bet they make</p>
            </div>
          </div>
          <button class="modal-close" id="btnCloseReferralModal" title="Close">&times;</button>
        </div>

        <div class="modal-body referral-modal-body">
          <!-- Tier & Status Badge -->
          <div class="referral-tier-banner">
            <div class="tier-info">
              <span class="tier-tag" id="refTierBadge">BRONZE PILOT</span>
              <span class="tier-rate" id="refTierRate">0.50% Wager Commission</span>
            </div>
            <div class="tier-desc">Share your link and earn continuous passive rewards on every flight!</div>
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

          <!-- Metrics Row -->
          <div class="ref-stats-grid">
            <div class="ref-stat-box">
              <span class="stat-num" id="refInvitedCount">0</span>
              <span class="stat-name">Invited Pilots</span>
            </div>
            <div class="ref-stat-box highlight">
              <span class="stat-num" id="refClaimableBalance">$0.00</span>
              <span class="stat-name">Claimable Earnings</span>
            </div>
            <div class="ref-stat-box">
              <span class="stat-num" id="refTotalEarnings">$0.00</span>
              <span class="stat-name">Lifetime Total</span>
            </div>
          </div>

          <!-- Claim Button -->
          <div class="ref-claim-section">
            <button class="btn-claim-earnings" id="btnClaimReferral">
              <span>⚡ Transfer Earnings to Game Wallet</span>
            </button>
            <div class="claim-hint">Min transfer threshold: $1.00 USD</div>
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
        notificationManager.success('Referral Link Copied', 'Share it with your crew to earn commissions!');
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
            particleCount: 80,
            spread: 70,
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
    this.modalEl.querySelector('#refTierRate').textContent = `${ratePercent}% Wager Commission`;

    // Metrics
    this.modalEl.querySelector('#refInvitedCount').textContent = this.stats.referredCount || 0;
    this.modalEl.querySelector('#refClaimableBalance').textContent = `$${Number(this.stats.referralBalance || 0).toFixed(2)}`;
    this.modalEl.querySelector('#refTotalEarnings').textContent = `$${Number(this.stats.totalReferralEarnings || 0).toFixed(2)}`;

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
          return `
            <div class="ref-history-item">
              <div class="history-item-left">
                <span class="ref-flight-badge">✈️ Flight Wager ($${Number(item.betAmount).toFixed(2)})</span>
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

