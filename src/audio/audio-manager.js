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
      const t = this.ctx.currentTime;

      // 1. Deep Sub-Bass Punch (Oscillator: 180Hz -> 20Hz)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(24, t + 0.5);

      // Lowpass filter for heavy thud
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, t);
      filter.frequency.exponentialRampToValueAtTime(60, t + 0.45);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.6);

      // 2. Explosion White Noise Burst (Crackling debris)
      const bufferSize = this.ctx.sampleRate * 0.4;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(800, t);
      noiseFilter.frequency.exponentialRampToValueAtTime(120, t + 0.35);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.25, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      whiteNoise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      whiteNoise.start(t);
      whiteNoise.stop(t + 0.4);
    } catch (_) {}
  }
}

export const soundManager = new SoundManager();
