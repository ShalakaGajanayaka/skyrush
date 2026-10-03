// Web Audio API Sound Synthesizer - Instant Zero-Latency, Zero-File Dependency
class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.engineOsc = null;
    this.engineGain = null;
    this.isFlying = false;

    // Load sound preference
    this.muted = localStorage.getItem('skyrush_sound_muted') === 'true';
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('skyrush_sound_muted', this.muted);
    if (this.muted) {
      this.stopFlightSound();
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  playCountdownTick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (_) {}
  }

  startFlightSound() {
    if (this.muted) return;
    this.init();
    if (!this.ctx || this.isFlying) return;

    try {
      this.isFlying = true;
      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();

      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(80, this.ctx.currentTime); // Low engine hum

      // Lowpass filter for propeller rumble
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, this.ctx.currentTime);

      this.engineGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      this.engineGain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 0.5);

      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc.start();
    } catch (_) {}
  }

  updateFlightMultiplier(multiplier) {
    if (this.muted || !this.isFlying || !this.engineOsc || !this.ctx) return;
    try {
      // Scale engine pitch upwards as multiplier rises (80Hz up to 260Hz)
      const targetFreq = Math.min(280, 80 + (multiplier - 1.0) * 18);
      this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
    } catch (_) {}
  }

  stopFlightSound() {
    if (this.engineOsc) {
      try {
        this.engineGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
        setTimeout(() => {
          if (this.engineOsc) {
            this.engineOsc.stop();
            this.engineOsc.disconnect();
            this.engineOsc = null;
          }
        }, 120);
      } catch (_) {
        this.engineOsc = null;
      }
    }
    this.isFlying = false;
  }

  playCashoutChime() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      // Golden dual-tone victory chime
      const t = this.ctx.currentTime;
      const notes = [587.33, 880.0, 1174.66]; // D5, A5, D6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.08);

        gain.gain.setValueAtTime(0.12, t + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.08);
        osc.stop(t + idx * 0.08 + 0.45);
      });
    } catch (_) {}
  }

  playCrashSound() {
    this.stopFlightSound();
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      // Deep explosion thud
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.35);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.45);
    } catch (_) {}
  }
}

export const soundManager = new SoundManager();
