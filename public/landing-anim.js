// CodeDNA — Landing Hero Animation (responsive, lightweight 2D canvas)
// Theme: dark luxury (060A12) + Ferrari Rosso (#FF2800) — DNA double-helix + neural mesh
// Responsive: ResizeObserver, DPR-capped, mobile-reduced, prefers-reduced-motion, visibility pause
(function () {
  const host = document.getElementById("landingAnim");
  if (!host) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;
  host.appendChild(canvas);

  let W = 0, H = 0, DPR = 1, raf = 0, t0 = performance.now();
  let mx = 0, my = 0, tx = 0, ty = 0; // mouse parallax -1..1
  let scrollY = 0;

  // config adapts to width
  function cfg() {
    const isMobile = W < 760;
    const isTablet = W < 1024;
    return {
      isMobile,
      particles: isMobile ? 36 : isTablet ? 56 : 78,
      rungStep: isMobile ? 34 : 28,
      amp: isMobile ? Math.min(42, H * 0.085) : isTablet ? 58 : 72,
      freq: isMobile ? 0.0085 : 0.0062,
      lineW: isMobile ? 1.35 : 1.75,
    };
  }

  // particles: floating platinum + Ferrari dust
  let particles = [];
  function initParticles(n) {
    particles = [];
    for (let i = 0; i < n; i++) {
      const isFerrari = Math.random() < 0.12;
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: (isFerrari ? 1.1 : 0.7) + Math.random() * (isFerrari ? 1.1 : 0.9),
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.14 - 0.04,
        o: 0.18 + Math.random() * 0.42,
        ferrari: isFerrari,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  function resize() {
    const rect = host.getBoundingClientRect();
    W = Math.max(1, Math.round(rect.width));
    H = Math.max(1, Math.round(rect.height));
    DPR = Math.min(window.devicePixelRatio || 1, 1.85);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    initParticles(cfg().particles);
    if (reduceMotion) drawStatic();
  }

  // subtle dot grid
  function drawGrid() {
    const gap = W < 760 ? 28 : 32;
    ctx.fillStyle = "rgba(255,255,255,0.045)";
    for (let x = gap * 0.5; x < W; x += gap) {
      for (let y = gap * 0.5; y < H; y += gap) {
        // fade grid toward center bottom so hero text stays crisp
        const d = Math.hypot((x - W * 0.5) / W, (y - H * 0.52) / H);
        const a = Math.max(0, 1 - d * 1.55) * 0.9;
        if (a < 0.08) continue;
        ctx.globalAlpha = a * 0.55;
        ctx.beginPath();
        ctx.arc(x, y, 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  // orbs: soft Ferrari + midnight glows (radial gradient fills)
  function drawOrbs(time) {
    const orbs = [
      { x: W * 0.72, y: H * 0.18, r: W < 760 ? 180 : 320, c: "rgba(255,40,0,0.09)", drift: 18 },
      { x: W * 0.18, y: H * 0.82, r: W < 760 ? 160 : 280, c: "rgba(18,27,46,0.55)", drift: 14 },
      { x: W * 0.88, y: H * 0.72, r: W < 760 ? 120 : 200, c: "rgba(255,89,64,0.07)", drift: 10 },
    ];
    for (let i = 0; i < orbs.length; i++) {
      const o = orbs[i];
      const dx = Math.sin(time * 0.00022 + i * 1.7) * o.drift;
      const dy = Math.cos(time * 0.00018 + i * 1.2) * o.drift * 0.6;
      const grad = ctx.createRadialGradient(o.x + dx, o.y + dy, 0, o.x + dx, o.y + dy, o.r);
      grad.addColorStop(0, o.c);
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x + dx, o.y + dy, o.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // DNA double helix (two sine waves + rungs + glowing nodes)
  function drawHelix(time) {
    const c = cfg();
    const cx = W * 0.5;
    const cy = H * 0.52;
    const scrollOff = Math.min(scrollY, 600) * 0.08;
    const parX = mx * (W < 760 ? 8 : 16);
    const parY = my * (W < 760 ? 6 : 10);

    // helix spans horizontally across hero, vertically centered
    const left = -W * 0.12;
    const right = W * 1.12;
    const len = right - left;
    const speed = 0.00062;
    const phase = time * speed;

    // rungs first (behind lines)
    ctx.lineCap = "round";
    for (let x = left; x < right; x += c.rungStep) {
      const nx = (x - left) / len; // 0..1
      const angle = nx * Math.PI * 3.2 + phase * 2.1;
      const y1 = cy + Math.sin(nx * Math.PI * 2.4 + phase * 1.9) * c.amp * (0.85 + Math.sin(angle * 0.5) * 0.15) + parY - scrollOff;
      const y2 = cy + Math.sin(nx * Math.PI * 2.4 + phase * 1.9 + Math.PI) * c.amp * (0.85 + Math.sin(angle * 0.5) * 0.15) + parY - scrollOff;
      const xw = x + parX + Math.sin(nx * 3 + phase) * 1.2;
      // only draw rung when strands are separated enough
      const sep = Math.abs(y1 - y2);
      if (sep < 10) continue;
      const alpha = (0.18 + Math.max(0, Math.sin(angle)) * 0.22) * (0.55 + nx * 0.2);
      // fade edges
      const edge = Math.min(1, Math.min(nx * 3.5, (1 - nx) * 3.5));
      ctx.strokeStyle = `rgba(255,40,0,${alpha * edge * 0.9})`;
      ctx.lineWidth = 1;
      ctx.globalAlpha = edge;
      ctx.beginPath();
      ctx.moveTo(xw, y1);
      ctx.lineTo(xw, y2);
      ctx.stroke();
      // rung highlight dot at center
      if (Math.random() < 0.0) {} // placeholder
    }
    ctx.globalAlpha = 1;

    // two strands
    const strands = [
      { offset: 0, colorStops: ["#FF2800", "#FF5940", "rgba(255,40,0,0.95)"], glow: "rgba(255,40,0,0.55)" },
      { offset: Math.PI, colorStops: ["rgba(220,230,245,0.95)", "rgba(180,195,220,0.85)", "rgba(255,40,0,0.55)"], glow: "rgba(160,180,210,0.35)" },
    ];

    for (let s = 0; s < 2; s++) {
      const off = strands[s].offset;
      // glow underlay
      ctx.save();
      ctx.shadowColor = strands[s].glow;
      ctx.shadowBlur = W < 760 ? 10 : 16;
      ctx.lineWidth = c.lineW + (s === 0 ? 1.2 : 0.6);
      ctx.strokeStyle = s === 0 ? "rgba(255,40,0,0.95)" : "rgba(210,225,245,0.85)";
      ctx.beginPath();
      for (let x = left; x <= right; x += 2) {
        const nx = (x - left) / len;
        const y = cy + Math.sin(nx * Math.PI * 2.4 + phase * 1.9 + off) * c.amp * (0.9 + Math.cos(nx * 4) * 0.06) + Math.cos(nx * 6 + phase * 0.7) * 3 + parY - scrollOff;
        const xx = x + parX;
        if (x === left) ctx.moveTo(xx, y);
        else ctx.lineTo(xx, y);
      }
      ctx.stroke();
      ctx.restore();

      // crisp core line with gradient
      const grad = ctx.createLinearGradient(left, 0, right, 0);
      if (s === 0) {
        grad.addColorStop(0, "rgba(255,40,0,0)");
        grad.addColorStop(0.14, "#FF2800");
        grad.addColorStop(0.5, "#FF5940");
        grad.addColorStop(0.86, "#FF2800");
        grad.addColorStop(1, "rgba(255,40,0,0)");
      } else {
        grad.addColorStop(0, "rgba(200,215,235,0)");
        grad.addColorStop(0.18, "rgba(225,235,250,0.95)");
        grad.addColorStop(0.5, "rgba(200,215,235,0.9)");
        grad.addColorStop(0.82, "rgba(255,40,0,0.45)");
        grad.addColorStop(1, "rgba(200,215,235,0)");
      }
      ctx.strokeStyle = grad;
      ctx.lineWidth = s === 0 ? c.lineW : c.lineW * 0.82;
      ctx.beginPath();
      for (let x = left; x <= right; x += 2) {
        const nx = (x - left) / len;
        const y = cy + Math.sin(nx * Math.PI * 2.4 + phase * 1.9 + off) * c.amp * (0.9 + Math.cos(nx * 4) * 0.06) + Math.cos(nx * 6 + phase * 0.7) * 3 + parY - scrollOff;
        const xx = x + parX;
        if (x === left) ctx.moveTo(xx, y);
        else ctx.lineTo(xx, y);
      }
      ctx.stroke();

      // nodes along strand
      const nodeStep = W < 760 ? 72 : 56;
      for (let x = left + 24; x < right; x += nodeStep) {
        const nx = (x - left) / len;
        const y = cy + Math.sin(nx * Math.PI * 2.4 + phase * 1.9 + off) * c.amp * 0.9 + parY - scrollOff;
        const edge = Math.min(1, Math.min(nx * 2.8, (1 - nx) * 2.8));
        if (edge < 0.12) continue;
        const pulse = 0.85 + Math.sin(time * 0.003 + nx * 8 + s) * 0.15;
        const r = (s === 0 ? 2.4 : 1.7) * pulse * edge;
        // outer glow
        ctx.fillStyle = s === 0 ? "rgba(255,40,0,0.28)" : "rgba(200,220,240,0.22)";
        ctx.beginPath();
        ctx.arc(x + parX, y, r + 3.5, 0, Math.PI * 2);
        ctx.fill();
        // core
        ctx.fillStyle = s === 0 ? "#FF2800" : "rgba(242,247,255,0.98)";
        ctx.beginPath();
        ctx.arc(x + parX, y, r, 0, Math.PI * 2);
        ctx.fill();
        // inner highlight
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.beginPath();
        ctx.arc(x + parX - r * 0.35, y - r * 0.35, r * 0.38, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawParticles(time) {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      // drift
      p.x += p.vx + mx * 0.12;
      p.y += p.vy + my * 0.08;
      // wrap
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      if (p.y > H + 10) p.y = -10;

      const twinkle = 0.72 + Math.sin(time * 0.002 + p.phase) * 0.28;
      const a = p.o * twinkle;
      // fade near text center so particles don't compete
      const dx = (p.x - W * 0.32) / W;
      const dy = (p.y - H * 0.5) / H;
      const centerFade = 1 - Math.max(0, 1 - Math.hypot(dx * 1.6, dy * 1.4)) * 0.45;

      if (p.ferrari) {
        ctx.fillStyle = `rgba(255,40,0,${a * centerFade})`;
        ctx.shadowColor = "rgba(255,40,0,0.85)";
        ctx.shadowBlur = 6;
      } else {
        ctx.fillStyle = `rgba(255,255,255,${a * 0.92 * centerFade})`;
        ctx.shadowColor = "rgba(255,255,255,0.55)";
        ctx.shadowBlur = 4;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // faint connecting lines between nearby particles (neural mesh)
  function drawMesh() {
    const maxDist = W < 760 ? 78 : 96;
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 0.6;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d > maxDist) continue;
        // only near-center area gets denser mesh
        const midX = (a.x + b.x) * 0.5;
        const midY = (a.y + b.y) * 0.5;
        const inHero = midX > W * 0.45 && midX < W * 0.95 && midY > H * 0.08 && midY < H * 0.88;
        if (!inHero && Math.random() < 0.55) continue;
        const alpha = (1 - d / maxDist) * 0.13;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        // slight curve for luxury feel
        const mx_ = (a.x + b.x) * 0.5 + (Math.sin((a.x + b.x) * 0.01) * 4);
        const my_ = (a.y + b.y) * 0.5;
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawStatic() {
    ctx.clearRect(0, 0, W, H);
    drawOrbs(0);
    drawGrid();
    drawHelix(0);
    drawParticles(0);
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const elapsed = now - t0;
    // smooth mouse lerp
    mx += (tx - mx) * 0.045;
    my += (ty - my) * 0.045;
    scrollY = window.scrollY || document.documentElement.scrollTop || 0;

    ctx.clearRect(0, 0, W, H);

    // depth order: orbs -> grid -> helix -> mesh -> particles
    drawOrbs(elapsed);
    drawGrid();
    drawHelix(elapsed);
    drawMesh();
    drawParticles(elapsed);

    // vignette for text legibility (kept subtle, dark luxury)
    const vig = ctx.createRadialGradient(W * 0.32, H * 0.5, 0, W * 0.32, H * 0.5, Math.max(W, H) * 0.85);
    vig.addColorStop(0, "transparent");
    vig.addColorStop(0.58, "transparent");
    vig.addColorStop(1, "rgba(6,10,18,0.46)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }

  // mouse / touch parallax (desktop only)
  function onMove(e) {
    if (W < 760) return;
    const x = (e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? W * 0.5);
    const y = (e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? H * 0.5);
    const rect = host.getBoundingClientRect();
    tx = ((x - rect.left) / W - 0.5) * 2;
    ty = ((y - rect.top) / H - 0.5) * 2;
  }
  window.addEventListener("mousemove", onMove, { passive: true });
  window.addEventListener("touchmove", onMove, { passive: true });

  // resize
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  window.addEventListener("resize", resize, { passive: true });
  resize();

  if (reduceMotion) {
    drawStatic();
  } else {
    frame(performance.now());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else { t0 = performance.now() - 100; frame(performance.now()); }
    });
  }
})();
