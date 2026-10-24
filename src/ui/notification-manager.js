/**
 * SkyRush In-Game Notification & Toast System
 * High-performance, non-blocking UI alert component designed for live 60fps canvas games.
 */
import { soundManager } from '../audio/audio-manager.js';

class NotificationManager {
  constructor() {
    this.container = null;
    this.activeToasts = new Set();
    this.initContainer();
  }

  initContainer() {
    if (document.getElementById('skyrush-toast-container')) {
      this.container = document.getElementById('skyrush-toast-container');
      return;
    }
    const container = document.createElement('div');
    container.id = 'skyrush-toast-container';
    container.className = 'skyrush-toast-container';
    document.body.appendChild(container);
    this.container = container;
  }

  /**
   * Display a high-impact, themed in-game toast
   * @param {Object} options
   * @param {'warning' | 'error' | 'success' | 'info'} options.type
   * @param {string} options.title
   * @param {string} options.message
   * @param {string} [options.actionText]
   * @param {Function} [options.onAction]
   * @param {number} [options.duration] - In milliseconds (default: 4500)
   * @param {string|HTMLElement} [options.shakeElement] - Element to shake
   */
  show({
    type = 'info',
    title = '',
    message = '',
    actionText = null,
    onAction = null,
    duration = 4500,
    shakeElement = null,
  }) {
    if (!this.container) this.initContainer();

    // Trigger visual element shake if requested
    if (shakeElement) {
      this.shake(shakeElement);
    }

    // Play subtle audio cue if sound is enabled
    try {
      if (soundManager && typeof soundManager.playCountdownTick === 'function') {
        soundManager.playCountdownTick();
      }
    } catch (_) {}

    const toast = document.createElement('div');
    toast.className = `skyrush-toast ${type}`;

    // Select dynamic icon SVG
    let iconSvg = '';
    if (type === 'warning') {
      iconSvg = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      `;
    } else if (type === 'error') {
      iconSvg = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e51b24" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      `;
    } else if (type === 'success') {
      iconSvg = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      `;
    } else {
      iconSvg = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
      `;
    }

    const actionHtml = actionText
      ? `<button class="toast-action-btn" type="button">${actionText}</button>`
      : '';

    toast.innerHTML = `
      <div class="toast-icon-wrapper">${iconSvg}</div>
      <div class="toast-content-wrapper">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div class="toast-message">${message}</div>
        ${actionHtml}
      </div>
      <button class="toast-close-btn" type="button" aria-label="Close notification">✕</button>
      <div class="toast-progress-bar" style="animation-duration: ${duration}ms;"></div>
    `;

    // Hook Close Button
    const closeBtn = toast.querySelector('.toast-close-btn');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.dismiss(toast);
    });

    // Hook Action Button
    if (actionText && onAction) {
      const actBtn = toast.querySelector('.toast-action-btn');
      actBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.dismiss(toast);
        try {
          onAction();
        } catch (err) {
          console.error('[NotificationManager] Action handler failed:', err);
        }
      });
    }

    // Auto-dismiss Timer
    const dismissTimer = setTimeout(() => {
      this.dismiss(toast);
    }, duration);

    toast._dismissTimer = dismissTimer;

    // Pause on hover
    toast.addEventListener('mouseenter', () => {
      clearTimeout(toast._dismissTimer);
      const bar = toast.querySelector('.toast-progress-bar');
      if (bar) bar.style.animationPlayState = 'paused';
    });

    toast.addEventListener('mouseleave', () => {
      const bar = toast.querySelector('.toast-progress-bar');
      if (bar) bar.style.animationPlayState = 'running';
      toast._dismissTimer = setTimeout(() => {
        this.dismiss(toast);
      }, 1500);
    });

    this.container.prepend(toast);
    this.activeToasts.add(toast);

    return toast;
  }

  dismiss(toast) {
    if (!toast || toast.classList.contains('dismissing')) return;
    toast.classList.add('dismissing');
    if (toast._dismissTimer) clearTimeout(toast._dismissTimer);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
      this.activeToasts.delete(toast);
    }, 280);
  }

  /**
   * Helper to trigger a rhythmic haptic shake animation on an element
   */
  shake(target) {
    let el = null;
    if (typeof target === 'string') {
      el = document.querySelector(target);
    } else if (target instanceof HTMLElement) {
      el = target;
    }
    if (!el) return;

    el.classList.remove('skyrush-shake');
    // Force DOM reflow to re-trigger animation cleanly
    void el.offsetWidth;
    el.classList.add('skyrush-shake');
    setTimeout(() => el.classList.remove('skyrush-shake'), 650);
  }

  warning(title, message, options = {}) {
    return this.show({ type: 'warning', title, message, ...options });
  }

  error(title, message, options = {}) {
    return this.show({ type: 'error', title, message, ...options });
  }

  success(title, message, options = {}) {
    return this.show({ type: 'success', title, message, ...options });
  }

  info(title, message, options = {}) {
    return this.show({ type: 'info', title, message, ...options });
  }
}

export const notificationManager = new NotificationManager();
window.notificationManager = notificationManager;
