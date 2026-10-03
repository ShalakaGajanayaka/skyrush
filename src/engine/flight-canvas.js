import { soundManager } from '../audio/audio-manager.js';

export class FlightCanvas {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d', { alpha: false });
    this.options = options;

    // Dimensions
    this.width = 800;
    this.height = 500;
    this.dpr = window.devicePixelRatio || 1;

    // Game State: 'waiting' | 'playing' | 'crashed'
    this.status = 'waiting';
    this.countdown = 10;
    this.multiplier = 1.00;
    this.crashPoint = null;
    this.startTime = 0;
    this.flightTime = 0;

    // Crash animation state
    this.crashedAtMultiplier = 1.00;
    this.flewAwayProgress = 0;

    // Particles for smoke trail
    this.particles = [];
    this.maxParticles = 60;

    // Plane flight coordinates (normalized 0..1)
    this.planeNormX = 0;
    this.planeNormY = 0;
    this.planeAngle = 0;
    this.propellerAngle = 0;

    // Grid scrolling offset
    this.gridOffsetX = 0;
    this.gridOffsetY = 0;

    // Setup resize observer
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.canvas.parentElement);
    this.handleResize();

    // Start 60 FPS animation loop
    this.lastFrameTime = performance.now();
    this.rafId = requestAnimationFrame(this.loop.bind(this));
  }

  handleResize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    this.width = Math.max(320, rect.width);
    this.height = Math.max(260, rect.height);

    this.dpr = Math.min(2, window.devicePixelRatio || 1); // Cap at 2x for high performance
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;

    this.ctx.scale(this.dpr, this.dpr);
  }

  setWaitingState(countdown) {
    if (this.status !== 'waiting') {
      soundManager.stopFlightSound();
    }
    this.status = 'waiting';
    this.countdown = countdown;
    this.multiplier = 1.00;
    this.crashPoint = null;
    this.particles = [];
    this.flewAwayProgress = 0;
  }

  setPlayingState(startTime, initialMultiplier = 1.00) {
    if (this.status !== 'playing') {
      soundManager.startFlightSound();
    }
    this.status = 'playing';
    this.startTime = startTime || Date.now();
    this.multiplier = initialMultiplier;
    this.crashPoint = null;
    this.flewAwayProgress = 0;
  }

  setCrashedState(finalMultiplier) {
    if (this.status !== 'crashed') {
      soundManager.playCrashSound();
    }
    this.status = 'crashed';
    this.crashedAtMultiplier = finalMultiplier || this.multiplier;
    this.multiplier = this.crashedAtMultiplier;
    this.flewAwayProgress = 0;
  }

  updateAuthoritativeMultiplier(targetMultiplier) {
    if (this.status === 'playing') {
      // Soft nudge towards server multiplier
      const diff = targetMultiplier - this.multiplier;
      if (Math.abs(diff) > 0.05) {
        this.multiplier += diff * 0.35;
      } else {
        this.multiplier = targetMultiplier;
      }
      soundManager.updateFlightMultiplier(this.multiplier);
    }
  }

  loop(currentTime) {
    const dt = Math.min(0.1, (currentTime - this.lastFrameTime) / 1000);
    this.lastFrameTime = currentTime;

    this.update(dt);
    this.render();

    this.rafId = requestAnimationFrame(this.loop.bind(this));
  }

  update(dt) {
    this.propellerAngle += dt * 35; // Propeller rotation

    if (this.status === 'playing') {
      // Continuous client curve extrapolation (deterministic Aviator equation)
      const elapsedSec = Math.max(0, (Date.now() - this.startTime) / 1000);
      this.flightTime = elapsedSec;

      // Aviator exponential curve: grows faster as time passes
      const targetM = 1.00 + (elapsedSec * 0.08) + Math.pow(elapsedSec * 0.28, 1.75);
      if (targetM > this.multiplier) {
        this.multiplier += (targetM - this.multiplier) * 0.25;
      }

      // Normalized coordinates inside the canvas stage (0.05 to 0.85)
      // Progressively moves towards top-right
      const progress = Math.min(1.0, elapsedSec / 15.0);
      this.planeNormX = 0.12 + Math.pow(progress, 0.7) * 0.70;
      this.planeNormY = 0.12 + Math.pow(progress, 0.85) * 0.65;

      // Add gentle floating turbulence
      const wobble = Math.sin(currentTimeSec() * 4) * 0.015;
      this.planeNormY += wobble;

      // Tangent flight angle (degrees)
      this.planeAngle = Math.min(32, 12 + progress * 16);

      // Scroll background grid
      this.gridOffsetX = (this.gridOffsetX + dt * 45 * Math.max(1, this.multiplier * 0.3)) % 60;
      this.gridOffsetY = (this.gridOffsetY + dt * 25 * Math.max(1, this.multiplier * 0.2)) % 60;

      // Emit smoke trail particle
      if (Math.random() < 0.65) {
        const px = this.planeNormX * this.width;
        const py = this.height - (this.planeNormY * this.height);
        this.particles.push({
          x: px - 18,
          y: py + 8 + (Math.random() - 0.5) * 4,
          vx: -(15 + Math.random() * 25),
          vy: 5 + Math.random() * 8,
          size: 4 + Math.random() * 5,
          alpha: 0.6,
          life: 0,
          maxLife: 0.65 + Math.random() * 0.35,
        });
      }
    } else if (this.status === 'crashed') {
      // Plane accelerates up and to the right off-screen
      this.flewAwayProgress += dt * 2.2;
      this.planeNormX += dt * 1.8;
      this.planeNormY += dt * 1.5;
      this.planeAngle = Math.min(55, this.planeAngle + dt * 40);
    } else if (this.status === 'waiting') {
      // Idle at bottom left
      this.planeNormX = 0.12;
      this.planeNormY = 0.12 + Math.sin(currentTimeSec() * 2.5) * 0.01;
      this.planeAngle = 8;
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.size += dt * 8;
      p.alpha = Math.max(0, 0.6 * (1 - p.life / p.maxLife));
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // 1. Clear background (Deep Aviator Charcoal)
    ctx.fillStyle = '#0f141c';
    ctx.fillRect(0, 0, w, h);

    // 2. Draw Subtle Perspective Grid Lines
    this.renderGrid(ctx, w, h);

    // 3. Render Flight Curve & Glowing Gradient Under Curve (when playing or crashed)
    if (this.status === 'playing' || this.status === 'crashed') {
      this.renderFlightTrajectory(ctx, w, h);
    }

    // 4. Render Particle Smoke Trail
    this.renderSmokeParticles(ctx);

    // 5. Render Animated Red Propeller Plane
    if (this.status === 'waiting' || this.status === 'playing' || (this.status === 'crashed' && this.flewAwayProgress < 1.2)) {
      this.renderAirplane(ctx, w, h);
    }

    // 6. Center Multiplier & Status Text
    this.renderCenterHUD(ctx, w, h);
  }

  renderGrid(ctx, w, h) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;

    // Vertical grid lines
    const startX = -this.gridOffsetX;
    for (let x = startX; x < w; x += 60) {
      if (x < 0) continue;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Horizontal grid lines
    const startY = this.gridOffsetY;
    for (let y = startY; y < h; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Bottom and left axis guides
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(30, 0);
    ctx.lineTo(30, h - 30);
    ctx.lineTo(w, h - 30);
    ctx.stroke();

    ctx.restore();
  }

  renderFlightTrajectory(ctx, w, h) {
    const originX = 30;
    const originY = h - 30;

    const planeX = Math.min(w + 50, this.planeNormX * w);
    const planeY = Math.max(-50, h - (this.planeNormY * h));

    // Control point for smooth ascending bezier curve
    const cpX = originX + (planeX - originX) * 0.65;
    const cpY = originY - (originY - planeY) * 0.15;

    ctx.save();

    // Fill under curve with glowing red gradient
    const grad = ctx.createLinearGradient(0, planeY, 0, originY);
    grad.addColorStop(0, 'rgba(229, 27, 36, 0.35)');
    grad.addColorStop(0.5, 'rgba(229, 27, 36, 0.12)');
    grad.addColorStop(1, 'rgba(229, 27, 36, 0.00)');

    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.quadraticCurveTo(cpX, cpY, planeX, planeY);
    ctx.lineTo(planeX, originY);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Glowing Red Flight Path Stroke
    ctx.shadowColor = '#e51b24';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#e51b24';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.quadraticCurveTo(cpX, cpY, planeX, planeY);
    ctx.stroke();

    // Pulsing lead dot at plane connection
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(planeX, planeY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderSmokeParticles(ctx) {
    ctx.save();
    for (const p of this.particles) {
      ctx.fillStyle = `rgba(240, 60, 60, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderAirplane(ctx, w, h) {
    const px = this.planeNormX * w;
    const py = h - (this.planeNormY * h);
    const angleRad = (this.planeAngle * Math.PI) / 180;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(-angleRad);

    // Procedurally render Iconic Aviator Red Aircraft (High-DPI Vector precision)
    // Scale factor
    const s = Math.min(1.2, Math.max(0.8, w / 700));
    ctx.scale(s, s);

    // 1. Aircraft Wings & Shadow
    ctx.fillStyle = '#991118';
    ctx.beginPath();
    ctx.moveTo(-15, -4);
    ctx.lineTo(-2, -18);
    ctx.lineTo(14, -4);
    ctx.closePath();
    ctx.fill();

    // 2. Main Aerodynamic Fuselage (Iconic Red)
    ctx.shadowColor = 'rgba(229, 27, 36, 0.4)';
    ctx.shadowBlur = 10;
    const fuselageGrad = ctx.createLinearGradient(-30, 0, 30, 0);
    fuselageGrad.addColorStop(0, '#bd131c');
    fuselageGrad.addColorStop(0.5, '#e51b24');
    fuselageGrad.addColorStop(1, '#ff3842');

    ctx.fillStyle = fuselageGrad;
    ctx.beginPath();
    ctx.moveTo(-28, 0);
    ctx.quadraticCurveTo(-15, -10, 15, -7);
    ctx.quadraticCurveTo(28, -2, 32, 0);
    ctx.quadraticCurveTo(28, 4, 15, 6);
    ctx.quadraticCurveTo(-15, 6, -28, 0);
    ctx.closePath();
    ctx.fill();

    // 3. Tail Fin (Rudder)
    ctx.fillStyle = '#b31219';
    ctx.beginPath();
    ctx.moveTo(-28, 0);
    ctx.lineTo(-34, -14);
    ctx.lineTo(-24, -14);
    ctx.lineTo(-18, 0);
    ctx.closePath();
    ctx.fill();

    // 4. Cockpit Glass (Cyan Tint)
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(4, -5);
    ctx.lineTo(16, -4);
    ctx.lineTo(18, 0);
    ctx.lineTo(6, 0);
    ctx.closePath();
    ctx.fill();

    // 5. Lower Wing
    ctx.fillStyle = '#e51b24';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(-12, 2);
    ctx.lineTo(2, 14);
    ctx.lineTo(14, 2);
    ctx.closePath();
    ctx.fill();

    // 6. Spinning Propeller Disc
    ctx.save();
    ctx.translate(33, 0);
    ctx.rotate(this.propellerAngle);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 1.5, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Propeller Nose Cone
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  renderCenterHUD(ctx, w, h) {
    const cx = w * 0.5;
    const cy = h * 0.46;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (this.status === 'playing') {
      // Big Glowing Multiplier (Aviator Signature Bold Font)
      const multStr = `${this.multiplier.toFixed(2)}x`;
      const fontSize = Math.min(76, Math.max(48, w * 0.08));

      ctx.font = `800 ${fontSize}px 'Outfit', 'Inter', -apple-system, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
      ctx.shadowBlur = 16;
      ctx.fillText(multStr, cx, cy);
    } else if (this.status === 'crashed') {
      // "FLEW AWAY!" Notification in Deep Red
      const labelFontSize = Math.min(32, Math.max(22, w * 0.04));
      ctx.font = `800 ${labelFontSize}px 'Outfit', 'Inter', -apple-system, sans-serif`;
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = 'rgba(239, 68, 68, 0.6)';
      ctx.shadowBlur = 16;
      ctx.fillText('FLEW AWAY!', cx, cy - 24);

      // Final crash multiplier
      const multStr = `${this.crashedAtMultiplier.toFixed(2)}x`;
      const numFontSize = Math.min(68, Math.max(44, w * 0.075));
      ctx.font = `800 ${numFontSize}px 'Outfit', 'Inter', -apple-system, sans-serif`;
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
      ctx.shadowBlur = 20;
      ctx.fillText(multStr, cx, cy + 24);
    } else if (this.status === 'waiting') {
      // Waiting for next round countdown
      const labelFontSize = Math.min(18, Math.max(14, w * 0.024));
      ctx.font = `600 ${labelFontSize}px 'Outfit', 'Inter', -apple-system, sans-serif`;
      ctx.fillStyle = '#94a3b8';
      ctx.shadowBlur = 0;
      ctx.fillText('NEXT ROUND IN', cx, cy - 32);

      // Large Animated Countdown Number
      const countFontSize = Math.min(64, Math.max(42, w * 0.07));
      ctx.font = `800 ${countFontSize}px 'Outfit', 'Inter', -apple-system, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
      ctx.shadowBlur = 10;
      ctx.fillText(`${Math.max(0, this.countdown)}`, cx, cy + 12);

      // Animated Circular Loading Ring around countdown
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy + 12, 42, 0, Math.PI * 2);
      ctx.stroke();

      const progress = Math.max(0, Math.min(1, this.countdown / 10));
      ctx.strokeStyle = '#e51b24';
      ctx.shadowColor = '#e51b24';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, cy + 12, 42, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * (1 - progress)));
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
}

function currentTimeSec() {
  return performance.now() / 1000;
}
