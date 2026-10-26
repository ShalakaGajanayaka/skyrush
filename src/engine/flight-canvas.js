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
    this.crashTextTimer = 0;
    this.crashPointPx = { x: 0, y: 0 };
    this.crashVelY = 0;

    // Visual FX pools
    this.particles = []; // Flight smoke / flame particles
    this.explosionSparks = []; // Fiery explosion embers
    this.shockwaves = []; // Expanding blast rings
    this.speedLines = []; // Aerodynamic Mach speedlines

    // Multi-Layer Parallax Cloudscapes (3 Layers)
    this.cloudsBg = [];
    this.cloudsMid = [];
    this.cloudsFg = [];
    this.stars = [];

    // Plane flight coordinates (normalized 0..1)
    this.planeNormX = 0.14;
    this.planeNormY = 0.18;
    this.planeAngle = 10;
    this.propellerAngle = 0;

    // Setup initial sky environment
    this.initSkyEnvironment();

    // Setup resize observer
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.canvas.parentElement);
    this.handleResize();

    // Start 60 FPS animation loop
    this.lastFrameTime = performance.now();
    this.rafId = requestAnimationFrame(this.loop.bind(this));
  }

  initSkyEnvironment() {
    // 1. Generate Starfield for high-altitude space (80 stars)
    this.stars = [];
    for (let i = 0; i < 90; i++) {
      this.stars.push({
        x: Math.random() * 1200,
        y: Math.random() * 800,
        size: 0.8 + Math.random() * 1.8,
        alpha: 0.2 + Math.random() * 0.8,
        twinkleSpeed: 1 + Math.random() * 3,
      });
    }

    // 2. Generate Background Clouds (Slow, massive, deep silhouette)
    this.cloudsBg = [];
    for (let i = 0; i < 7; i++) {
      this.cloudsBg.push(this.createCloud(Math.random() * 1000, Math.random() * 600, 140, 220, 0.15));
    }

    // 3. Generate Midground Clouds (Fluffy cumulus)
    this.cloudsMid = [];
    for (let i = 0; i < 9; i++) {
      this.cloudsMid.push(this.createCloud(Math.random() * 1000, Math.random() * 600, 90, 160, 0.28));
    }

    // 4. Generate Foreground Clouds (Wispy vapor, fast)
    this.cloudsFg = [];
    for (let i = 0; i < 5; i++) {
      this.cloudsFg.push(this.createCloud(Math.random() * 1000, Math.random() * 600, 60, 110, 0.40));
    }

    // 5. Initial Mach speedlines
    this.speedLines = [];
    for (let i = 0; i < 20; i++) {
      this.speedLines.push({
        x: Math.random() * 1000,
        y: Math.random() * 600,
        length: 40 + Math.random() * 80,
        speed: 300 + Math.random() * 400,
        alpha: 0.1 + Math.random() * 0.25,
      });
    }
  }

  createCloud(x, y, minR, maxR, alpha) {
    const puffs = [];
    const count = 4 + Math.floor(Math.random() * 4);
    for (let j = 0; j < count; j++) {
      puffs.push({
        offsetX: (j - count / 2) * (minR * 0.55),
        offsetY: (Math.random() - 0.5) * (minR * 0.35),
        radius: minR + Math.random() * (maxR - minR),
      });
    }
    return { x, y, puffs, alpha, speedFactor: 0.6 + Math.random() * 0.8 };
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
    this.crashVelY = -140;

    // Trigger Screen Trauma
    this.trauma = 1.0;

    const px = Math.min(this.width, this.planeNormX * this.width);
    const py = Math.max(20, this.height - (this.planeNormY * this.height));
    this.crashPointPx = { x: px, y: py };

    // Expanding shockwaves
    this.shockwaves.push({
      x: px,
      y: py,
      radius: 10,
      maxRadius: Math.min(280, this.width * 0.4),
      color: '#ffffff',
      lineWidth: 8,
      alpha: 1.0,
      speed: 420,
    });
    this.shockwaves.push({
      x: px,
      y: py,
      radius: 5,
      maxRadius: Math.min(360, this.width * 0.5),
      color: '#ef4444',
      lineWidth: 14,
      alpha: 0.9,
      speed: 300,
    });

    // 50 Fiery Explosion Sparks
    const sparkColors = ['#ffffff', '#fef08a', '#f59e0b', '#ef4444', '#b91c1c'];
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 150 + Math.random() * 400;
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
      if (Math.abs(diff) > 0.02) {
        this.multiplier += diff * 0.5;
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
    this.propellerAngle += dt * 38;

    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - dt * 2.5);
    }

    // Calculate dynamic flight speed factor based on multiplier
    const speedMultiplier = this.status === 'playing' 
      ? Math.min(4.5, 1.0 + (this.multiplier - 1.0) * 0.35)
      : 0.4;

    if (this.status === 'playing') {
      const elapsedSec = Math.max(0, (Date.now() - this.startTime) / 1000);
      this.flightTime = elapsedSec;

      // Industry standard smooth exponential progression: e^(0.095 * t)
      // Identical to Game Server (game.service.ts) and Flutter client (game_screen.dart)
      const targetM = Math.max(1.0, Math.exp(0.095 * elapsedSec));
      if (Math.abs(targetM - this.multiplier) > 0.01) {
        this.multiplier += (targetM - this.multiplier) * 0.35;
      } else {
        this.multiplier = targetM;
      }

      // Smooth flight ascent towards high sky (climbs to ~65% of screen height)
      const progress = Math.min(1.0, elapsedSec / 14.0);
      const targetNormX = 0.16 + Math.pow(progress, 0.7) * 0.58;
      const targetNormY = 0.18 + Math.pow(progress, 0.8) * 0.52;

      this.planeNormX += (targetNormX - this.planeNormX) * dt * 3;
      this.planeNormY += (targetNormY - this.planeNormY) * dt * 3;

      // Subdued, smooth aerodynamic float (greatly reduced up-down movement)
      const wobble = Math.sin(currentTimeSec() * 2.0) * 0.0025;
      this.planeNormY += wobble;
      this.planeAngle = Math.min(24, 12 + progress * 10 + Math.sin(currentTimeSec() * 1.5) * 0.4);

      // Aerodynamic engine smoke puff
      if (Math.random() < 0.6) {
        const px = this.planeNormX * this.width;
        const py = this.height - (this.planeNormY * this.height);
        this.particles.push({
          x: px - 22,
          y: py + 6 + (Math.random() - 0.5) * 4,
          vx: -(30 + Math.random() * 40) * speedMultiplier,
          vy: 10 + Math.random() * 15,
          size: 5 + Math.random() * 6,
          alpha: 0.6,
          life: 0,
          maxLife: 0.6 + Math.random() * 0.3,
          color: 'rgba(239, 68, 68,',
        });
      }
    } else if (this.status === 'crashed') {
      this.flewAwayProgress += dt;
      this.crashTextTimer += dt;

      // Tumbling spiral exit
      this.planeAngle += dt * 280;
      this.crashVelY += dt * 380;
      this.planeNormX += dt * 0.35;
      this.planeNormY -= (this.crashVelY * dt) / this.height;

      // Smoke and flames from crashed aircraft
      if (this.flewAwayProgress < 0.8) {
        const px = this.planeNormX * this.width;
        const py = this.height - (this.planeNormY * this.height);
        for (let k = 0; k < 3; k++) {
          const isFire = Math.random() < 0.45;
          this.particles.push({
            x: px + (Math.random() - 0.5) * 14,
            y: py + (Math.random() - 0.5) * 14,
            vx: (Math.random() - 0.5) * 90,
            vy: (Math.random() - 0.5) * 90 - 40,
            size: isFire ? (8 + Math.random() * 10) : (14 + Math.random() * 14),
            alpha: 0.85,
            life: 0,
            maxLife: 0.6 + Math.random() * 0.4,
            color: isFire ? 'rgba(249, 115, 22,' : 'rgba(30, 41, 59,',
          });
        }
      }
    } else if (this.status === 'waiting') {
      // Resting waiting at runway altitude (calm & stable)
      this.planeNormX = 0.14;
      this.planeNormY = 0.16 + Math.sin(currentTimeSec() * 1.5) * 0.002;
      this.planeAngle = 6;
    }

    // ── PARALLAX CLOUDS MOTION ──
    // Clouds move DOWN and LEFT to simulate airplane climbing UP and RIGHT!
    const moveX = dt * 90 * speedMultiplier;
    const moveY = dt * 55 * speedMultiplier;

    this.updateCloudLayer(this.cloudsBg, moveX * 0.35, moveY * 0.25);
    this.updateCloudLayer(this.cloudsMid, moveX * 0.75, moveY * 0.60);
    this.updateCloudLayer(this.cloudsFg, moveX * 1.40, moveY * 1.10);

    // ── MACH SPEEDLINES ──
    for (let sl of this.speedLines) {
      sl.x -= sl.speed * dt * speedMultiplier;
      sl.y += sl.speed * 0.45 * dt * speedMultiplier;
      if (sl.x < -100 || sl.y > this.height + 100) {
        sl.x = this.width + Math.random() * 200;
        sl.y = -50 + Math.random() * (this.height * 0.8);
      }
    }

    // Update smoke & explosion particles
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

    for (let i = this.explosionSparks.length - 1; i >= 0; i--) {
      const s = this.explosionSparks[i];
      s.life += dt;
      s.vy += dt * 190;
      s.vx *= 0.96;
      s.vy *= 0.96;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.size = Math.max(1, s.size - dt * 4);
      s.alpha = Math.max(0, 1.0 - s.life / s.maxLife);
      if (s.life >= s.maxLife) {
        this.explosionSparks.splice(i, 1);
      }
    }

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

  updateCloudLayer(cloudArray, dx, dy) {
    for (let cloud of cloudArray) {
      cloud.x -= dx * cloud.speedFactor;
      cloud.y += dy * cloud.speedFactor;

      // Wrap around screen when off bottom-left
      if (cloud.x < -300 || cloud.y > this.height + 250) {
        cloud.x = this.width + 100 + Math.random() * 300;
        cloud.y = -150 + Math.random() * (this.height * 0.7);
      }
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Apply Screen Shake
    const shakeIntensity = Math.pow(this.trauma, 1.6) * 12;
    const shakeX = (Math.random() - 0.5) * shakeIntensity;
    const shakeY = (Math.random() - 0.5) * shakeIntensity;

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // 1. Render Atmospheric Sky Gradient (Transitions: Runway -> Sky -> Stratosphere -> Space)
    this.renderAtmosphericSky(ctx, w, h);

    // 2. Render Twinkling Starfield in Space/High Altitude
    this.renderStarfield(ctx, w, h);

    // 3. Render Background Parallax Clouds
    this.renderCloudLayer(ctx, this.cloudsBg, false);

    // 4. Render Midground Clouds
    this.renderCloudLayer(ctx, this.cloudsMid, false);

    // 5. Render Mach Airflow Speedlines
    if (this.status === 'playing') {
      this.renderSpeedLines(ctx);
    }

    // 6. Render Particle Smoke Trails
    this.renderSmokeParticles(ctx);

    // 7. Render Expanding Shockwaves (if crashed)
    this.renderShockwaves(ctx);

    // 8. Render Fiery Explosion Sparks (if crashed)
    this.renderExplosionSparks(ctx);

    // 9. Render Aircraft
    if (this.status === 'waiting' || this.status === 'playing' || (this.status === 'crashed' && this.flewAwayProgress < 0.75)) {
      this.renderAirplane(ctx, w, h);
    }

    // 10. Render Foreground Vapor Clouds (Over the aircraft for deep 3D immersion!)
    this.renderCloudLayer(ctx, this.cloudsFg, true);

    // 11. Center Multiplier & Status Text
    this.renderCenterHUD(ctx, w, h);

    ctx.restore();
  }

  renderAtmosphericSky(ctx, w, h) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);

    // Altitude factor: 0.0 (takeoff) -> 1.0 (deep space at 15x+)
    const m = this.multiplier;
    const altitudeProgress = Math.min(1.0, Math.max(0, (m - 1.0) / 12.0));

    if (altitudeProgress < 0.3) {
      // 🛫 LOW ALTITUDE (Dusk Navy / Midnight with runway warmth)
      const p = altitudeProgress / 0.3;
      grad.addColorStop(0, '#0a0f1d');
      grad.addColorStop(0.65, '#0f172a');
      grad.addColorStop(1, '#1e293b');
    } else if (altitudeProgress < 0.75) {
      // 🌌 STRATOSPHERE (Deep Twilight Purple / Indigo)
      const p = (altitudeProgress - 0.3) / 0.45;
      grad.addColorStop(0, '#06030e');
      grad.addColorStop(0.5, '#170c2a');
      grad.addColorStop(1, '#0f172a');
    } else {
      // 🚀 EDGE OF SPACE (Pitch Black Cosmos with Earth Curve Glow)
      grad.addColorStop(0, '#020205');
      grad.addColorStop(0.7, '#060814');
      grad.addColorStop(1, '#0e1e38'); // Blue atmospheric horizon below
    }

    ctx.fillStyle = grad;
    ctx.fillRect(-20, -20, w + 40, h + 40);

    // If at high altitude (Space), render subtle curved Earth limb glow at the bottom
    if (altitudeProgress > 0.4) {
      const earthAlpha = Math.min(0.4, (altitudeProgress - 0.4) * 0.7);
      ctx.save();
      ctx.strokeStyle = `rgba(56, 189, 248, ${earthAlpha})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      // Curved Earth limb at the bottom
      ctx.arc(w * 0.5, h + 800, 840, -Math.PI * 0.8, -Math.PI * 0.2);
      ctx.stroke();
      ctx.restore();
    }
  }

  renderStarfield(ctx, w, h) {
    // Stars fade in as altitude climbs above 2.5x
    const starAlphaFactor = Math.min(1.0, Math.max(0, (this.multiplier - 2.0) / 5.0));
    if (starAlphaFactor <= 0.05) return;

    ctx.save();
    const time = currentTimeSec();
    for (let star of this.stars) {
      const twinkle = 0.6 + Math.sin(time * star.twinkleSpeed + star.x) * 0.4;
      const alpha = star.alpha * starAlphaFactor * twinkle;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(star.x % w, star.y % h, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderCloudLayer(ctx, cloudArray, isForeground = false) {
    ctx.save();
    const spaceThinning = Math.max(0.1, 1.0 - (this.multiplier - 4.0) * 0.12);

    for (let cloud of cloudArray) {
      const effectiveAlpha = cloud.alpha * spaceThinning;
      if (effectiveAlpha <= 0.01) continue;

      for (let puff of cloud.puffs) {
        const cx = cloud.x + puff.offsetX;
        const cy = cloud.y + puff.offsetY;
        const r = puff.radius;

        // Soft radial feathering
        const grad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
        if (isForeground) {
          grad.addColorStop(0, `rgba(255, 255, 255, ${effectiveAlpha * 0.35})`);
          grad.addColorStop(0.7, `rgba(224, 242, 254, ${effectiveAlpha * 0.15})`);
          grad.addColorStop(1, 'rgba(224, 242, 254, 0)');
        } else {
          grad.addColorStop(0, `rgba(30, 41, 59, ${effectiveAlpha * 0.6})`);
          grad.addColorStop(0.7, `rgba(15, 23, 42, ${effectiveAlpha * 0.4})`);
          grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  renderSpeedLines(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';

    for (let sl of this.speedLines) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${sl.alpha})`;
      ctx.beginPath();
      ctx.moveTo(sl.x, sl.y);
      // Lines angle diagonally (-35 degrees) to match flight vector
      ctx.lineTo(sl.x - sl.length, sl.y + sl.length * 0.45);
      ctx.stroke();
    }
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
      ctx.shadowBlur = 18;
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
      ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();
    }

    // Aerodynamic Wingtip Contrails (Glowing Neon Cyan Streams during flight)
    if (this.status === 'playing') {
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-15, -16);
      ctx.lineTo(-65, -16);
      ctx.moveTo(-15, 14);
      ctx.lineTo(-65, 14);
      ctx.stroke();
      ctx.restore();
    }

    // 1. Wings
    ctx.fillStyle = '#991118';
    ctx.beginPath();
    ctx.moveTo(-15, -4);
    ctx.lineTo(-2, -18);
    ctx.lineTo(14, -4);
    ctx.closePath();
    ctx.fill();

    // 2. Fuselage (Iconic Aviator Red with Sleek Gradient)
    ctx.shadowColor = 'rgba(229, 27, 36, 0.5)';
    ctx.shadowBlur = 12;
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

    // 3. Tail Fin
    ctx.fillStyle = '#b31219';
    ctx.beginPath();
    ctx.moveTo(-28, 0);
    ctx.lineTo(-34, -14);
    ctx.lineTo(-24, -14);
    ctx.lineTo(-18, 0);
    ctx.closePath();
    ctx.fill();

    // 4. Cockpit Glass
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 6;
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

    // 6. Spinning Propeller
    if (this.status !== 'crashed') {
      ctx.save();
      ctx.translate(33, 0);
      ctx.rotate(this.propellerAngle);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 1.5, 13, 0, 0, Math.PI * 2);
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
      const fontSize = Math.min(84, Math.max(52, w * 0.085));

      ctx.font = `800 ${fontSize}px 'Outfit', 'Inter', -apple-system, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.45)';
      ctx.shadowBlur = 18;
      ctx.fillText(multStr, cx, cy);
    } else if (this.status === 'crashed') {
      const t = Math.min(1.0, this.crashTextTimer * 3.8);
      const springScale = t < 1.0 
        ? (0.2 + (Math.sin(t * Math.PI * 0.5) * 1.05) + Math.sin(t * Math.PI * 2.5) * 0.15) 
        : 1.0;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(springScale, springScale);

      // Crimson Glow Radial Aura
      const glowGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 150);
      glowGrad.addColorStop(0, 'rgba(239, 68, 68, 0.40)');
      glowGrad.addColorStop(1, 'rgba(239, 68, 68, 0.00)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 150, 0, Math.PI * 2);
      ctx.fill();

      // "FLEW AWAY!"
      const labelFontSize = Math.min(34, Math.max(22, w * 0.042));
      ctx.font = `900 ${labelFontSize}px 'Outfit', 'Inter', -apple-system, sans-serif`;
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = 'rgba(239, 68, 68, 0.9)';
      ctx.shadowBlur = 22;
      ctx.fillText('FLEW AWAY!', 0, -28);

      // Final Multiplier
      const multStr = `${this.crashedAtMultiplier.toFixed(2)}x`;
      const numFontSize = Math.min(76, Math.max(48, w * 0.085));
      ctx.font = `900 ${numFontSize}px 'Outfit', 'Inter', -apple-system, sans-serif`;
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = 'rgba(239, 68, 68, 1.0)';
      ctx.shadowBlur = 30;
      ctx.fillText(multStr, 0, 28);

      ctx.restore();
    } else if (this.status === 'waiting') {
      const ringCenterY = cy + 16;
      const ringRadius = 40;

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 1. "NEXT ROUND IN" Label (Clean separation above ring)
      const labelFontSize = Math.min(16, Math.max(13, w * 0.022));
      ctx.font = `700 ${labelFontSize}px 'Outfit', 'Inter', -apple-system, sans-serif`;
      ctx.fillStyle = '#94a3b8';
      ctx.shadowBlur = 0;
      ctx.fillText('NEXT ROUND IN', cx, cy - 48);

      // 2. Countdown Number (Centered cleanly inside ring)
      const countFontSize = Math.min(54, Math.max(38, w * 0.065));
      ctx.font = `800 ${countFontSize}px 'Outfit', 'Inter', -apple-system, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.35)';
      ctx.shadowBlur = 12;
      ctx.fillText(`${Math.max(0, this.countdown)}`, cx, ringCenterY + 1);

      // 3. Background Track Ring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, ringCenterY, ringRadius, 0, Math.PI * 2);
      ctx.stroke();

      // 4. Progress Arc (Red glow, completely separated from text)
      const progress = Math.max(0, Math.min(1, this.countdown / 10));
      ctx.strokeStyle = '#e51b24';
      ctx.shadowColor = '#e51b24';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, ringCenterY, ringRadius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * (1 - progress)));
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
