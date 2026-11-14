/**
 * SkyRush In-Game System Maintenance Banner & Modal Manager
 * Displays real-time 15-minute countdown tickers, informs players about auto-refunds,
 * and renders a secure glassmorphic maintenance overlay when the system pauses.
 */

export class MaintenanceBanner {
  constructor(socketClient) {
    this.socketClient = socketClient;
    this.targetTime = null;
    this.timerInterval = null;
    this.isMaintenanceActive = false;

    this.bannerEl = null;
    this.modalEl = null;

    this.init();
  }

  init() {
    this.createBannerElement();
    this.createModalElement();

    // Bind socket events
    this.socketClient.on('maintenanceNotice', (data) => this.handleNotice(data));
    this.socketClient.on('maintenanceCancelled', (data) => this.handleCancelled(data));
    this.socketClient.on('maintenanceActive', (data) => this.handleActive(data));
    this.socketClient.on('gameState', (data) => this.handleGameState(data));
  }

  createBannerElement() {
    if (document.getElementById('skyrush-maintenance-banner')) {
      this.bannerEl = document.getElementById('skyrush-maintenance-banner');
      return;
    }

    const banner = document.createElement('div');
    banner.id = 'skyrush-maintenance-banner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 99999;
      display: none;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 10px 16px;
      background: linear-gradient(90deg, rgba(245, 158, 11, 0.95), rgba(217, 119, 6, 0.95));
      backdrop-filter: blur(12px);
      box-shadow: 0 4px 20px rgba(245, 158, 11, 0.4);
      color: #000;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.3px;
      text-transform: uppercase;
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    `;

    banner.innerHTML = `
      <span style="font-size: 16px;">⚠️</span>
      <span id="skyrush-maintenance-msg">SCHEDULED SYSTEM MAINTENANCE IN</span>
      <span id="skyrush-maintenance-timer" style="background: rgba(0,0,0,0.85); color: #fbbf24; padding: 2px 8px; border-radius: 4px; font-family: monospace; font-size: 14px;">15:00</span>
      <span style="font-size: 11px; opacity: 0.85; text-transform: none; font-weight: 500;">(Queued bets will be auto-refunded to balance)</span>
    `;

    document.body.appendChild(banner);
    this.bannerEl = banner;
  }

  createModalElement() {
    if (document.getElementById('skyrush-maintenance-modal')) {
      this.modalEl = document.getElementById('skyrush-maintenance-modal');
      return;
    }

    const modal = document.createElement('div');
    modal.id = 'skyrush-maintenance-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 100000;
      display: none;
      align-items: center;
      justify-content: center;
      background: rgba(10, 14, 23, 0.92);
      backdrop-filter: blur(16px);
      font-family: 'Inter', system-ui, sans-serif;
      padding: 20px;
    `;

    modal.innerHTML = `
      <div style="
        max-width: 460px;
        width: 100%;
        background: linear-gradient(135deg, rgba(26, 32, 48, 0.95), rgba(16, 20, 31, 0.98));
        border: 1px solid rgba(245, 158, 11, 0.3);
        border-radius: 20px;
        padding: 36px 28px;
        text-align: center;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(245, 158, 11, 0.15);
      ">
        <div style="
          width: 68px;
          height: 68px;
          margin: 0 auto 20px;
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
        ">
          🛠️
        </div>

        <h2 style="color: #fff; font-size: 22px; font-weight: 800; margin: 0 0 10px; letter-spacing: -0.5px;">
          System Maintenance
        </h2>

        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          SkyRush is currently undergoing scheduled infrastructure upgrades. Gameplay and betting are temporarily paused.
        </p>

        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: 12px;
          color: #34d399;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 24px;
        ">
          <span>🛡️</span>
          <span>Player balances & funds are 100% secure</span>
        </div>

        <div style="display: flex; align-items: center; justify-content: center; gap: 8px; color: #64748b; font-size: 12px;">
          <div style="width: 8px; height: 8px; background: #fbbf24; border-radius: 50%; animation: pulse 1.5s infinite;"></div>
          <span>Engine reconnecting automatically...</span>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modalEl = modal;
  }

  handleNotice(data) {
    if (!data?.targetTime) return;
    this.targetTime = Number(data.targetTime);
    this.isMaintenanceActive = false;
    this.hideModal();
    this.showBanner();
    this.startTicker();
  }

  handleCancelled() {
    this.targetTime = null;
    this.isMaintenanceActive = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.hideBanner();
    this.hideModal();
  }

  handleActive() {
    this.isMaintenanceActive = true;
    this.hideBanner();
    this.showModal();
  }

  handleGameState(data) {
    if (data?.status === 'maintenance') {
      this.isMaintenanceActive = true;
      this.hideBanner();
      this.showModal();
      return;
    }

    if (data?.maintenance) {
      const { isScheduled, isActive, targetTime } = data.maintenance;
      if (isActive) {
        this.isMaintenanceActive = true;
        this.hideBanner();
        this.showModal();
      } else if (isScheduled && targetTime && targetTime > Date.now()) {
        this.targetTime = Number(targetTime);
        this.showBanner();
        this.startTicker();
        this.hideModal();
      } else if (!isScheduled && !isActive) {
        this.handleCancelled();
      }
    } else if (this.isMaintenanceActive && data?.status !== 'maintenance') {
      this.handleCancelled();
    }
  }

  startTicker() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    const update = () => {
      if (!this.targetTime) return;
      const remainingMs = this.targetTime - Date.now();
      if (remainingMs <= 0) {
        const timerText = document.getElementById('skyrush-maintenance-timer');
        if (timerText) timerText.textContent = '00:00';
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
        }
        return;
      }

      const totalSec = Math.floor(remainingMs / 1000);
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      const formatted = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;

      const timerText = document.getElementById('skyrush-maintenance-timer');
      if (timerText) timerText.textContent = formatted;
    };

    update();
    this.timerInterval = setInterval(update, 1000);
  }

  showBanner() {
    if (this.bannerEl) this.bannerEl.style.display = 'flex';
  }

  hideBanner() {
    if (this.bannerEl) this.bannerEl.style.display = 'none';
  }

  showModal() {
    if (this.modalEl) this.modalEl.style.display = 'flex';
  }

  hideModal() {
    if (this.modalEl) this.modalEl.style.display = 'none';
  }
}
