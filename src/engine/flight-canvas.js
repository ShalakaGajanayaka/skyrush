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

    // Crash visual impact systems
    this.crashedAtMultiplier = 1.00;
    this.flewAwayProgress = 0;
    this.trauma = 0; // Screen shake trauma (0.0 to 1.0)
    this.crashTextTimer = 0; // For spring bounce text
    this.crashPointPx = { x: 0, y: 0 };
    this.crashVelY = 0;

    // Particles & Visual FX pools
    this.particles = []; // Flight smoke particles
    this.explosionSparks = []; // Fiery explosion embers
    this.shockwaves = []; // Expanding blast rings

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

    this.dpr = Math.min(2, window.devicePixelRatio || 1);
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
    this.explosionSparks = [];
    this.shockwaves = [];
    this.flewAwayProgress = 0;
    this.trauma = 0;
    this.crashVelY = 0;
  }

  setPlayingState(startTime, initialMultiplier = 1.00) {
    if (this.status !== 'playing') {
      soundManager.startFlightSound();
    }
    this.status = 'playing';
    this.startTime = startTime || Date.now();
    this.multiplier = initialMultiplier;
    this.crashPoint = null;
    this.particles = [];
    this.explosionSparks = [];
    this.shockwaves = [];
    this.flewAwayProgress = 0;
    this.trauma = 0;
    this.crashVelY = 0;
  }

  setCrashedState(finalMultiplier) {
    if (this.status !== 'crashed') {
      soundManager.playCrashSound();
    }
    this.status = 'crashed';
    this.crashedAtMultiplier = finalMultiplier || this.multiplier;
    this.multiplier = this.crashedAtMultiplier;
    this.flewAwayProgress = 0;
    this.crashTextTimer = 0;
    this.crashVelY = -120; // Initial upward blast impulse

    // 💥 1. Trigger Screen Trauma Shake
    this.trauma = 1.0;

    // 💥 2. Calculate Exact Crash Location in Pixels
    const px = Math.min(this.width, this.planeNormX * this.width);
    const py = Math.max(20, this.height - (this.planeNormY * this.height));
    this.crashPointPx = { x: px, y: py };

    // 💥 3. Spawn Fiery Expanding Shockwaves
    this.shockwaves.push({
      x: px,
      y: py,
      radius: 10,
      maxRadius: Math.min(260, this.width * 0.35),
      color: '#ffffff',
      lineWidth: 8,
      alpha: 1.0,
      speed: 380,
    });
    this.shockwaves.push({
      x: px,
      y: py,
      radius: 5,
      maxRadius: Math.min(340, this.width * 0.45),
      color: '#ef4444',
      lineWidth: 12,
      alpha: 0.85,
      speed: 280,
    });

    // 💥 4. Spawn 50 High-Velocity Fiery Explosion Sparks
    const sparkColors = ['#ffffff', '#fef08a', '#f59e0b', '#ef4444', '#b91c1c'];
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 140 + Math.random() * 380;
      this.explosionSparks.push({
        x: px + (Math.random() - 0.5) * 16,
        y: py + (Math.random() - 0.5) * 16,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 5,
        color: sparkColors[Math.floor(Math.random() * sparkColors.length)],
        alpha: 1.0,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.45,
      });
    }
  }

  updateAuthoritativeMultiplier(targetMultiplier) {
    if (this.status === 'playing') {
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
    this.propellerAngle += dt * 35;

    // Decay screen trauma
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - dt * 2.5);
    }

    if (this.status === 'playing') {
      const elapsedSec = Math.max(0, (Date.now() - this.startTime) / 1000);
      this.flightTime = elapsedSec;

      const targetM = 1.00 + (elapsedSec * 0.08) + Math.pow(elapsedSec * 0.28, 1.75);
      if (targetM > this.multiplier) {
        this.multiplier += (targetM - this.multiplier) * 0.25;
      }

      const progress = Math.min(1.0, elapsedSec / 15.0);
      this.planeNormX = 0.12 + Math.pow(progress, 0.7) * 0.70;
      this.planeNormY = 0.12 + Math.pow(progress, 0.85) * 0.65;

      const wobble = Math.sin(currentTimeSec() * 4) * 0.015;
      this.planeNormY += wobble;
      this.planeAngle = Math.min(32, 12 + progress * 16);

      this.gridOffsetX = (this.gridOffsetX + dt * 45 * Math.max(1, this.multiplier * 0.3)) % 60;
      this.gridOffsetY = (this.gridOffsetY + dt * 25 * Math.max(1, this.multiplier * 0.2)) % 60;

      // Normal flight smoke trail
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
          color: 'rgba(240, 60, 60,',
        });
      }
    } else if (this.status === 'crashed') {
      this.flewAwayProgress += dt;
      this.crashTextTimer += dt;

      // Dynamic plane spin & tumbling demise
      this.planeAngle += dt * 260; // Tumbling spin!
      this.crashVelY += dt * 360; // Gravity pulling debris down
      this.planeNormX += dt * 0.45;
      this.planeNormY -= (this.crashVelY * dt) / this.height;

      // Emit heavy black soot and flame puffs from tumbling aircraft
      if (this.flewAwayProgress < 0.8) {
        const px = this.planeNormX * this.width;
        const py = this.height - (this.planeNormY * this.height);
        for (let k = 0; k < 3; k++) {
          const isFire = Math.random() < 0.4;
          this.particles.push({
            x: px + (Math.random() - 0.5) * 12,
            y: py + (Math.random() - 0.5) * 12,
            vx: (Math.random() - 0.5) * 80,
            vy: (Math.random() - 0.5) * 80 - 30,
            size: isFire ? (8 + Math.random() * 8) : (12 + Math.random() * 12),
            alpha: 0.8,
            life: 0,
            maxLife: 0.6 + Math.random() * 0.4,
            color: isFire ? 'rgba(249, 115, 22,' : 'rgba(30, 41, 59,',
          });
        }
      }
    } else if (this.status === 'waiting') {
      this.planeNormX = 0.12;
      this.planeNormY = 0.12 + Math.sin(currentTimeSec() * 2.5) * 0.01;
      this.planeAngle = 8;
    }

    // Update normal & crash smoke particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.size += dt * 10;
      p.alpha = Math.max(0, 0.7 * (1 - p.life / p.maxLife));
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    // Update explosion sparks
    for (let i = this.explosionSparks.length - 1; i >= 0; i--) {
      const s = this.explosionSparks[i];
      s.life += dt;
      s.vy += dt * 180; // Gravity
      s.vx *= 0.96; // Air drag
      s.vy *= 0.96;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.size = Math.max(1, s.size - dt * 4);
      s.alpha = Math.max(0, 1.0 - s.life / s.maxLife);
      if (s.life >= s.maxLife) {
        this.explosionSparks.splice(i, 1);
      }
    }

    // Update expanding shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.speed * dt;
      sw.alpha = Math.max(0, 1.0 - (sw.radius / sw.maxRadius));
      sw.lineWidth = Math.max(1, sw.lineWidth - dt * 8);
      if (sw.radius >= sw.maxRadius || sw.alpha <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Apply Screen Shake (Trauma Vibration)
    const shakeIntensity = Math.pow(this.trauma, 1.6) * 12;
    const shakeX = (Math.random() - 0.5) * shakeIntensity;
    const shakeY = (Math.random() - 0.5) * shakeIntensity;

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // 1. Clear background (Deep Aviator Charcoal)
    ctx.fillStyle = '#0f141c';
    ctx.fillRect(-20, -20, w + 40, h + 40);

    // 2. Draw Subtle Perspective Grid Lines
    this.renderGrid(ctx, w, h);

    // 3. Render Flight Curve & Glowing Gradient
    if (this.status === 'playing' || this.status === 'crashed') {
      this.renderFlightTrajectory(ctx, w, h);
    }

    // 4. Render Particle Smoke Trails
    this.renderSmokeParticles(ctx);

    // 5. Render Expanding Shockwaves
    this.renderShockwaves(ctx);

    // 6. Render Fiery Explosion Sparks
    this.renderExplosionSparks(ctx);

    // 7. Render Aircraft (tumbling during crash, visible up to 0.75s)
    if (this.status === 'waiting' || this.status === 'playing' || (this.status === 'crashed' && this.flewAwayProgress < 0.75)) {
      this.renderAirplane(ctx, w, h);
    }

    // 8. Center Multiplier & Animated Crash Pop
    this.renderCenterHUD(ctx, w, h);

    ctx.restore();
  }

  renderGrid(ctx, w, h) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;

    const startX = -this.gridOffsetX;
    for (let x = startX; x < w; x += 60) {
      if (x < 0) continue;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    const startY = this.gridOffsetY;
    for (let y = startY; y < h; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

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

    const targetX = this.status === 'crashed' ? this.crashPointPx.x : (this.planeNormX * w);
    const targetY = this.status === 'crashed' ? this.crashPointPx.y : (h - (this.planeNormY * h));

    const planeX = Math.min(w + 50, targetX);
    const planeY = Math.max(-50, targetY);

    const cpX = originX + (planeX - originX) * 0.65;
    const cpY = originY - (originY - planeY) * 0.15;

    ctx.save();

    // Fill under curve
    const isCrashed = this.status === 'crashed';
    const grad = ctx.createLinearGradient(0, planeY, 0, originY);
    if (isCrashed) {
      grad.addColorStop(0, 'rgba(185, 28, 28, 0.28)');
      grad.addColorStop(0.5, 'rgba(127, 29, 29, 0.10)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.00)');
    } else {
      grad.addColorStop(0, 'rgba(229, 27, 36, 0.35)');
      grad.addColorStop(0.5, 'rgba(229, 27, 36, 0.12)');
      grad.addColorStop(1, 'rgba(229, 27, 36, 0.00)');
    }

    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.quadraticCurveTo(cpX, cpY, planeX, planeY);
    ctx.lineTo(planeX, originY);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Flight Path Stroke
    ctx.shadowColor = isCrashed ? '#991b1b' : '#e51b24';
    ctx.shadowBlur = isCrashed ? 6 : 14;
    ctx.strokeStyle = isCrashed ? '#b91c1c' : '#e51b24';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.quadraticCurveTo(cpX, cpY, planeX, planeY);
    ctx.stroke();

    // Lead connection dot (white glow during flight, smoking red dot on crash)
    ctx.fillStyle = isCrashed ? '#ef4444' : '#ffffff';
    ctx.shadowColor = isCrashed ? '#ef4444' : '#ffffff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(planeX, planeY, isCrashed ? 5 : 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderSmokeParticles(ctx) {
    ctx.save();
    for (const p of this.particles) {
      ctx.fillStyle = `${p.color} ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderShockwaves(ctx) {
    ctx.save();
    for (const sw of this.shockwaves) {
      ctx.strokeStyle = sw.color;
      ctx.globalAlpha = sw.alpha;
      ctx.lineWidth = sw.lineWidth;
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  renderExplosionSparks(ctx) {
    ctx.save();
    for (const s of this.explosionSparks) {
      ctx.fillStyle = s.color;
      ctx.globalAlpha = s.alpha;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
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

    const s = Math.min(1.2, Math.max(0.8, w / 700));
    ctx.scale(s, s);

    // If crashed, render fire flare around plane
    if (this.status === 'crashed') {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fill();
    }

    // Wings
    ctx.fillStyle = '#991118';
    ctx.beginPath();
    ctx.moveTo(-15, -4);
    ctx.lineTo(-2, -18);
    ctx.lineTo(14, -4);
    ctx.closePath();
    ctx.fill();

    // Fuselage
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

    // Tail Fin
    ctx.fillStyle = '#b31219';
    ctx.beginPath();
    ctx.moveTo(-28, 0);
    ctx.lineTo(-34, -14);
    ctx.lineTo(-24, -14);
    ctx.lineTo(-18, 0);
    ctx.closePath();
    ctx.fill();

    // Cockpit Glass
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

    // Lower Wing
    ctx.fillStyle = '#e51b24';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(-12, 2);
    ctx.lineTo(2, 14);
    ctx.lineTo(14, 2);
    ctx.closePath();
    ctx.fill();

    // Propeller (if not completely crashed)
    if (this.status !== 'crashed') {
      ctx.save();
      ctx.translate(33, 0);
      ctx.rotate(this.propellerAngle);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 1.5, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  renderCenterHUD(ctx, w, h) {
    const cx = w * 0.5;
    const cy = h * 0.46;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (this.status === 'playing') {
      const multStr = `${this.multiplier.toFixed(2)}x`;
      const fontSize = Math.min(76, Math.max(48, w * 0.08));

      ctx.font = `800 ${fontSize}px 'Outfit', 'Inter', -apple-system, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
      ctx.shadowBlur = 16;
      ctx.fillText(multStr, cx, cy);
    } else if (this.status === 'crashed') {
      // 💥 Elastic Spring Bounce Scale
      const t = Math.min(1.0, this.crashTextTimer * 3.8);
      // Spring formula: scale up from 0.2 to 1.2 then settle at 1.0
      const springScale = t < 1.0 
        ? (0.2 + (Math.sin(t * Math.PI * 0.5) * 1.05) + Math.sin(t * Math.PI * 2.5) * 0.15) 
        : 1.0;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(springScale, springScale);

      // Crimson Glow Radial Aura behind crashed text
      const glowGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 140);
      glowGrad.addColorStop(0, 'rgba(239, 68, 68, 0.35)');
      glowGrad.addColorStop(1, 'rgba(239, 68, 68, 0.00)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 140, 0, Math.PI * 2);
      ctx.fill();

      // "FLEW AWAY!"
      const labelFontSize = Math.min(32, Math.max(22, w * 0.04));
      ctx.font = `900 ${labelFontSize}px 'Outfit', 'Inter', -apple-system, sans-serif`;
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
      ctx.shadowBlur = 20;
      ctx.fillText('FLEW AWAY!', 0, -26);

      // Final Multiplier
      const multStr = `${this.crashedAtMultiplier.toFixed(2)}x`;
      const numFontSize = Math.min(74, Math.max(46, w * 0.08));
      ctx.font = `900 ${numFontSize}px 'Outfit', 'Inter', -apple-system, sans-serif`;
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = 'rgba(239, 68, 68, 1.0)';
      ctx.shadowBlur = 28;
      ctx.fillText(multStr, 0, 26);

      ctx.restore();
    } else if (this.status === 'waiting') {
      const labelFontSize = Math.min(18, Math.max(14, w * 0.024));
      ctx.font = `600 ${labelFontSize}px 'Outfit', 'Inter', -apple-system, sans-serif`;
      ctx.fillStyle = '#94a3b8';
      ctx.shadowBlur = 0;
      ctx.fillText('NEXT ROUND IN', cx, cy - 32);

      const countFontSize = Math.min(64, Math.max(42, w * 0.07));
      ctx.font = `800 ${countFontSize}px 'Outfit', 'Inter', -apple-system, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
      ctx.shadowBlur = 10;
      ctx.fillText(`${Math.max(0, this.countdown)}`, cx, cy + 12);

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
