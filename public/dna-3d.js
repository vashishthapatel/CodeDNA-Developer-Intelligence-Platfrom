/**
 * CodeDNA — Interactive 3D Double Helix & Luxury Particle Simulation
 * High-performance 60FPS WebGL / Procedural 3D Canvas Engine.
 * Features:
 *  - 3D Double Helix with glowing Champagne & Celestial Sapphire nucleotide rungs
 *  - Interactive mouse/gyro parallax with inertial spring damping
 *  - 3D Floating stardust particle cloud with depth scaling
 *  - 3D Card Tilt with dynamic specular glare highlight
 */

(function () {
  'use strict';

  // ------------------------------------------------------------- 3D Helix Engine
  class Dna3DScene {
    constructor(canvasContainerId) {
      this.container = document.getElementById(canvasContainerId);
      if (!this.container) return;

      this.canvas = document.createElement('canvas');
      this.canvas.className = 'dna-3d-canvas';
      this.container.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');

      this.width = 0;
      this.height = 0;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);

      // Helix parameters
      this.nodeCount = 28;
      this.radius = 110;
      this.pitch = 540;
      this.strand1Color = '#C2A47A'; // ALBA Champagne Brass
      this.strand1Highlight = '#E8DCC8'; // ALBA Soft Brass
      this.strand2Color = '#4F6B8A'; // ALBA Sapphire
      this.strand2Highlight = '#8AA0B5';

      // 3D Particles
      this.particleCount = 130;
      this.particles = [];

      // Mouse & Inertia
      this.rotX = 0.22;
      this.rotY = 0;
      this.targetRotX = 0.22;
      this.targetRotY = 0;
      this.mouseX = 0;
      this.mouseY = 0;
      this.targetMouseX = 0;
      this.targetMouseY = 0;
      this.time = 0;

      this.initParticles();
      this.bindEvents();
      this.resize();
      this.loop = this.loop.bind(this);
      requestAnimationFrame(this.loop);
    }

    initParticles() {
      this.particles = [];
      for (let i = 0; i < this.particleCount; i++) {
        this.particles.push({
          x: (Math.random() - 0.5) * 650,
          y: (Math.random() - 0.5) * 850,
          z: (Math.random() - 0.5) * 500,
          size: Math.random() * 2 + 0.8,
          speed: Math.random() * 0.008 + 0.003,
          phase: Math.random() * Math.PI * 2,
          isGold: Math.random() > 0.4,
        });
      }
    }

    bindEvents() {
      window.addEventListener('resize', () => this.resize(), { passive: true });

      const onPointerMove = (e) => {
        const rect = this.container.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const x = (clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
        const y = (clientY - (rect.top + rect.height / 2)) / (rect.height / 2);

        this.targetMouseX = Math.max(-1, Math.min(1, x));
        this.targetMouseY = Math.max(-1, Math.min(1, y));
        this.targetRotY = this.targetMouseX * 0.75;
        this.targetRotX = 0.22 + this.targetMouseY * 0.4;
      };

      window.addEventListener('mousemove', onPointerMove, { passive: true });
      window.addEventListener('touchmove', onPointerMove, { passive: true });

      // Scroll speed acceleration
      let lastScrollY = window.scrollY;
      window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;
        const delta = Math.abs(currentScroll - lastScrollY);
        this.time += delta * 0.0006;
        lastScrollY = currentScroll;
      }, { passive: true });
    }

    resize() {
      const rect = this.container.getBoundingClientRect();
      this.width = rect.width || window.innerWidth;
      this.height = rect.height || 650;

      this.canvas.width = this.width * this.dpr;
      this.canvas.height = this.height * this.dpr;
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;

      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(this.dpr, this.dpr);

      // Responsive radius scaling
      if (this.width < 600) {
        this.radius = 75;
        this.pitch = 440;
      } else if (this.width < 1000) {
        this.radius = 95;
        this.pitch = 500;
      } else {
        this.radius = 120;
        this.pitch = 560;
      }
    }

    // 3D Point projection with camera perspective
    project(x, y, z, fov = 480) {
      const cosY = Math.cos(this.rotY);
      const sinY = Math.sin(this.rotY);
      const cosX = Math.cos(this.rotX);
      const sinX = Math.sin(this.rotX);

      // Rotate Y
      const x1 = x * cosY + z * sinY;
      const z1 = -x * sinY + z * cosY;

      // Rotate X
      const y2 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      const cameraDistance = 550;
      const totalZ = cameraDistance + z2;
      const scale = fov / Math.max(10, totalZ);

      return {
        px: this.width / 2 + x1 * scale,
        py: this.height / 2 + y2 * scale,
        scale: scale,
        depth: z2,
        alpha: Math.max(0.12, Math.min(1, (z2 + 250) / 450)),
      };
    }

    loop() {
      this.time += 0.014;

      // Smooth inertia lerping
      this.rotX += (this.targetRotX - this.rotX) * 0.06;
      this.rotY += (this.targetRotY - this.rotY) * 0.06;
      this.mouseX += (this.targetMouseX - this.mouseX) * 0.06;
      this.mouseY += (this.targetMouseY - this.mouseY) * 0.06;

      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.width, this.height);

      // Draw background particles (behind helix)
      this.drawParticles(ctx, -1);

      // Generate 3D Helix rungs and nodes
      const elements = [];
      const totalHeight = this.pitch;
      const stepY = totalHeight / this.nodeCount;
      const turns = 2.4;

      for (let i = 0; i < this.nodeCount; i++) {
        const y = (i - this.nodeCount / 2) * stepY;
        const angle = (i / this.nodeCount) * Math.PI * 2 * turns + this.time;

        const x1 = Math.cos(angle) * this.radius;
        const z1 = Math.sin(angle) * this.radius;
        const x2 = Math.cos(angle + Math.PI) * this.radius;
        const z2 = Math.sin(angle + Math.PI) * this.radius;

        const p1 = this.project(x1, y, z1);
        const p2 = this.project(x2, y, z2);

        // Average depth of bond rung for correct z-sorting
        const avgDepth = (p1.depth + p2.depth) / 2;

        elements.push({
          type: 'rung',
          p1,
          p2,
          depth: avgDepth,
          idx: i,
        });

        elements.push({
          type: 'node',
          p: p1,
          depth: p1.depth,
          isStrand1: true,
        });

        elements.push({
          type: 'node',
          p: p2,
          depth: p2.depth,
          isStrand1: false,
        });
      }

      // Sort by depth for correct 3D occlusion
      elements.sort((a, b) => a.depth - b.depth);

      // Render 3D Helix elements
      for (const el of elements) {
        if (el.type === 'rung') {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(el.p1.px, el.p1.py);
          ctx.lineTo(el.p2.px, el.p2.py);

          const grad = ctx.createLinearGradient(el.p1.px, el.p1.py, el.p2.px, el.p2.py);
          grad.addColorStop(0, `rgba(223, 190, 134, ${el.p1.alpha * 0.8})`);
          grad.addColorStop(0.5, `rgba(255, 255, 255, ${((el.p1.alpha + el.p2.alpha) / 2) * 0.55})`);
          grad.addColorStop(1, `rgba(79, 122, 154, ${el.p2.alpha * 0.8})`);

          ctx.strokeStyle = grad;
          ctx.lineWidth = Math.max(1.2, 2.6 * el.p1.scale);
          ctx.lineCap = 'round';
          ctx.stroke();

          // Center nucleotide connector bead
          const midX = (el.p1.px + el.p2.px) / 2;
          const midY = (el.p1.py + el.p2.py) / 2;
          ctx.beginPath();
          ctx.arc(midX, midY, 2.2 * el.p1.scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(243, 228, 203, ${((el.p1.alpha + el.p2.alpha) / 2) * 0.85})`;
          ctx.fill();
          ctx.restore();
        } else if (el.type === 'node') {
          const p = el.p;
          const r = Math.max(2.5, 7.2 * p.scale);

          ctx.save();
          // Node glow halo
          const glowGrad = ctx.createRadialGradient(p.px, p.py, 0, p.px, p.py, r * 3);
          if (el.isStrand1) {
            glowGrad.addColorStop(0, `rgba(223, 190, 134, ${p.alpha * 0.85})`);
            glowGrad.addColorStop(0.4, `rgba(223, 190, 134, ${p.alpha * 0.35})`);
            glowGrad.addColorStop(1, 'rgba(223, 190, 134, 0)');
          } else {
            glowGrad.addColorStop(0, `rgba(79, 122, 154, ${p.alpha * 0.85})`);
            glowGrad.addColorStop(0.4, `rgba(79, 122, 154, ${p.alpha * 0.35})`);
            glowGrad.addColorStop(1, 'rgba(79, 122, 154, 0)');
          }

          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(p.px, p.py, r * 3, 0, Math.PI * 2);
          ctx.fill();

          // Solid 3D Sphere body
          const sphereGrad = ctx.createRadialGradient(
            p.px - r * 0.3,
            p.py - r * 0.3,
            0,
            p.px,
            p.py,
            r
          );
          if (el.isStrand1) {
            sphereGrad.addColorStop(0, '#ffffff');
            sphereGrad.addColorStop(0.3, this.strand1Highlight);
            sphereGrad.addColorStop(0.7, this.strand1Color);
            sphereGrad.addColorStop(1, '#6b4e1e');
          } else {
            sphereGrad.addColorStop(0, '#ffffff');
            sphereGrad.addColorStop(0.3, this.strand2Highlight);
            sphereGrad.addColorStop(0.7, this.strand2Color);
            sphereGrad.addColorStop(1, '#1b3447');
          }

          ctx.fillStyle = sphereGrad;
          ctx.beginPath();
          ctx.arc(p.px, p.py, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Draw foreground particles
      this.drawParticles(ctx, 1);

      requestAnimationFrame(this.loop);
    }

    drawParticles(ctx, side) {
      for (const pt of this.particles) {
        // Orbit motion
        pt.phase += pt.speed;
        const currentX = pt.x + Math.sin(pt.phase) * 35;
        const currentY = pt.y + Math.cos(pt.phase * 0.7) * 25;
        const currentZ = pt.z + Math.sin(pt.phase * 0.5) * 45;

        const p = this.project(currentX, currentY, currentZ);

        if ((side === -1 && p.depth > 0) || (side === 1 && p.depth <= 0)) {
          continue;
        }

        const size = Math.max(0.5, pt.size * p.scale);
        const alpha = Math.max(0.08, Math.min(0.85, (p.alpha * 0.7) * (0.6 + Math.sin(this.time * 2 + pt.phase) * 0.4)));

        ctx.save();
        ctx.fillStyle = pt.isGold
          ? `rgba(223, 190, 134, ${alpha})`
          : `rgba(132, 176, 216, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.px, p.py, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  // ----------------------------------------------------------- 3D Card Tilt
  function init3DCardTilt() {
    const cards = document.querySelectorAll('.card, .stat, .bento-cell, .arch-node, .dna-dial, .cta-box, .stat-card');

    cards.forEach((card) => {
      let bounds;

      function onMouseMove(e) {
        if (!bounds) bounds = card.getBoundingClientRect();
        const x = e.clientX - bounds.left;
        const y = e.clientY - bounds.top;

        const centerX = bounds.width / 2;
        const centerY = bounds.height / 2;

        const rotateX = ((y - centerY) / centerY) * -6;
        const rotateY = ((x - centerX) / centerX) * 6;

        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(8px)`;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      }

      function onMouseEnter() {
        bounds = card.getBoundingClientRect();
        card.style.transition = 'transform 100ms cubic-bezier(0.16, 1, 0.3, 1), border-color 200ms ease';
      }

      function onMouseLeave() {
        card.style.transition = 'transform 450ms cubic-bezier(0.16, 1, 0.3, 1), border-color 200ms ease';
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
      }

      card.addEventListener('mouseenter', onMouseEnter, { passive: true });
      card.addEventListener('mousemove', onMouseMove, { passive: true });
      card.addEventListener('mouseleave', onMouseLeave, { passive: true });
    });
  }

  // ---------------------------------------------------------- Scroll Spy & Reveal
  function initScrollReveals() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );

    document.querySelectorAll('[data-reveal], .stat, .bento-cell, .arch-node, .dna-dial, .stat-card').forEach((el) => {
      observer.observe(el);
    });
  }

  // Initialize
  function start() {
    if (document.getElementById('dnaCanvasContainer')) {
      new Dna3DScene('dnaCanvasContainer');
    }
    init3DCardTilt();
    initScrollReveals();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
