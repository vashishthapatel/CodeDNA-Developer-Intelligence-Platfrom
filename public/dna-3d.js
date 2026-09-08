/**
 * CodeDNA — Ferrari Red DNA Helix (hero-only)
 * Thin, perfectly smooth, bright — confined to .hero-wrapper / #dnaCanvasContainer.
 * Inspired by the reference: elegant vertical double-helix, luminous Ferrari Red
 * on piano-black, floating on the right side of the hero behind the headline.
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.module.min.js';

(function () {
  'use strict';

  const RED      = 0xFF2800;
  const RED_SOFT = 0xFF5940;
  const WHITE    = 0xFFF0EB;
  const AMBER    = 0xFFB86A;

  function initHero(container) {
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.018);

    const W = container.clientWidth || container.offsetWidth || window.innerWidth;
    const H = container.clientHeight || container.offsetHeight || 600;
    // Camera frames the right third — helix lives right, headline stays readable on left.
    // FOV 38 keeps perspective elegant; pulled back so tall helix breathes.
    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
    camera.position.set(-0.9, 0.35, 15.5);
    camera.lookAt(3.0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.58;

    const prev = container.querySelector('canvas');
    if (prev) prev.remove();
    container.appendChild(renderer.domElement);
    renderer.domElement.style.cssText =
      'position:absolute;inset:0;width:100%!important;height:100%!important;display:block;pointer-events:none;';

    // ── studio lights — bright, but warm Ferrari palette only ──
    scene.add(new THREE.AmbientLight(0xffffff, 0.70));
    const key = new THREE.DirectionalLight(0xffffff, 3.2);
    key.position.set(6, 9, 11);
    scene.add(key);
    const fill = new THREE.DirectionalLight(WHITE, 1.25);
    fill.position.set(-6, 3.5, 7);
    scene.add(fill);
    const rimRed = new THREE.PointLight(RED, 95, 26);
    rimRed.position.set(3.2, 0.2, -11);
    scene.add(rimRed);
    const topWarm = new THREE.PointLight(RED_SOFT, 72, 22);
    topWarm.position.set(3.0, 7.5, 5);
    scene.add(topWarm);
    const cool = new THREE.PointLight(0x8CA0FF, 18, 24);
    cool.position.set(-5, -3, 9);
    scene.add(cool);

    // ── geometry — LONG airy rounds like the reference ──
    // Reference: tall slender helix, pitch >> diameter, loops breathe with big vertical gaps.
    // Previous was too squashed (pitch 2.95 / 4.65) — now truly elongated.
    const TURNS       = 2.65;    // fewer turns → each loop gets more height
    const HELIX_R     = 1.28;    // slender radius — more elegant, less chunky
    const PITCH       = 5.90;    // LONG pitch — big vertical gap between circles (was 2.95 → 4.65 → now 5.90)
    const TUBE_R      = 0.075;   // hairline backbone — even thinner for airy feel
    const TUBE_SEGS   = 420;     // extra for longer curve
    const RADIAL_SEGS = 22;
    const TOTAL_H     = TURNS * PITCH;
    const RUNG_EVERY  = 14;

    // Ferrari Rosso materials — glossy, luminous, clearcoat + sheen
    const matA = new THREE.MeshPhysicalMaterial({
      color: RED,
      emissive: RED,
      emissiveIntensity: 0.22,
      roughness: 0.19,
      metalness: 0.18,
      clearcoat: 0.90,
      clearcoatRoughness: 0.18,
      sheen: 0.60,
      sheenRoughness: 0.42,
      sheenColor: new THREE.Color(WHITE),
    });
    const matB = new THREE.MeshPhysicalMaterial({
      color: RED_SOFT,
      emissive: RED_SOFT,
      emissiveIntensity: 0.19,
      roughness: 0.22,
      metalness: 0.14,
      clearcoat: 0.86,
      clearcoatRoughness: 0.20,
      sheen: 0.52,
      sheenColor: new THREE.Color(WHITE),
    });
    // Fake bloom — slightly larger BackSide shell, very soft
    const glowMatA = new THREE.MeshBasicMaterial({
      color: RED, transparent: true, opacity: 0.095, side: THREE.BackSide, depthWrite: false,
    });
    const glowMatB = new THREE.MeshBasicMaterial({
      color: RED_SOFT, transparent: true, opacity: 0.082, side: THREE.BackSide, depthWrite: false,
    });

    const N = Math.round(TURNS * 160) + 1;
    const ptsA = [], ptsB = [];
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const a = t * TURNS * Math.PI * 2;
      const y = t * TOTAL_H - TOTAL_H / 2;
      ptsA.push(new THREE.Vector3(Math.cos(a) * HELIX_R, y, Math.sin(a) * HELIX_R));
      ptsB.push(new THREE.Vector3(Math.cos(a + Math.PI) * HELIX_R, y, Math.sin(a + Math.PI) * HELIX_R));
    }

    const dna = new THREE.Group();
    // Right side of hero, slightly forward — keeps headline contrast.
    dna.position.set(3.15, 0.15, 0);
    // Subtle diagonal tilt like the reference render (not straight vertical)
    dna.rotation.z = -0.14;
    // Gentle perspective scale — big enough to feel premium, small enough to breathe
    dna.scale.set(1.18, 1.18, 1.18);
    scene.add(dna);

    function addStrand(pts, mat, glowMat) {
      const curve = new THREE.CatmullRomCurve3(pts);
      const geo = new THREE.TubeGeometry(curve, TUBE_SEGS, TUBE_R, RADIAL_SEGS, false);
      const mesh = new THREE.Mesh(geo, mat);
      dna.add(mesh);
      // luminous halo — 2.8× thicker, fewer radials (soft)
      const glowGeo = new THREE.TubeGeometry(curve, Math.round(TUBE_SEGS * 0.68), TUBE_R * 3.05, 12, false);
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.renderOrder = -1;
      dna.add(glow);
    }
    addStrand(ptsA, matA, glowMatA);
    addStrand(ptsB, matB, glowMatB);

    // ── rungs — thin bright rods with tiny polished caps (reference: delicate ladder) ──
    const rungCount = Math.round(TURNS * RUNG_EVERY);
    const rungR = 0.026; // thin — reference rungs are hairline
    const rungCylGeo = new THREE.CylinderGeometry(rungR, rungR, 1, 10);
    const capGeo = new THREE.SphereGeometry(rungR * 1.55, 10, 10);
    const axisY = new THREE.Vector3(0, 1, 0);
    const rungMatEven = new THREE.MeshPhysicalMaterial({
      color: 0xFFFFFF, emissive: RED, emissiveIntensity: 0.06,
      roughness: 0.14, metalness: 0.62, clearcoat: 1, clearcoatRoughness: 0.14,
      transparent: true, opacity: 0.98,
    });
    const rungMatOdd = new THREE.MeshPhysicalMaterial({
      color: 0xFFF6F0, emissive: AMBER, emissiveIntensity: 0.045,
      roughness: 0.16, metalness: 0.55, clearcoat: 1, clearcoatRoughness: 0.16,
      transparent: true, opacity: 0.96,
    });
    for (let r = 0; r < rungCount; r++) {
      const t = r / (rungCount - 1);
      const idx = Math.min(Math.round(t * (N - 1)), N - 1);
      const p1 = ptsA[idx], p2 = ptsB[idx];
      const mid = new THREE.Vector3().lerpVectors(p1, p2, 0.5);
      const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
      const len = p1.distanceTo(p2);
      const mat = (r % 2 === 0) ? rungMatEven : rungMatOdd;
      const rod = new THREE.Mesh(rungCylGeo, mat);
      rod.position.copy(mid);
      rod.scale.y = len;
      rod.quaternion.setFromUnitVectors(axisY, dir);
      dna.add(rod);
      const c1 = new THREE.Mesh(capGeo, mat); c1.position.copy(p1); dna.add(c1);
      const c2 = new THREE.Mesh(capGeo, mat); c2.position.copy(p2); dna.add(c2);
    }

    // Polished finials at strand ends — like reference terminations
    const finialGeo = new THREE.SphereGeometry(TUBE_R * 1.30, 14, 14);
    const finialMat = new THREE.MeshPhysicalMaterial({
      color: 0xFFFFFF, emissive: RED, emissiveIntensity: 0.12,
      roughness: 0.28, metalness: 0.08, clearcoat: 0.62,
    });
    for (const p of [ptsA[0], ptsA[N - 1], ptsB[0], ptsB[N - 1]]) {
      const f = new THREE.Mesh(finialGeo, finialMat);
      f.position.copy(p);
      f.scale.set(1, 0.82, 1);
      dna.add(f);
    }

    // ── dust — sparse, slow, behind — adds depth without competing ──
    const PC = 220;
    const pPos = new Float32Array(PC * 3), pCol = new Float32Array(PC * 3);
    const pal = [new THREE.Color(RED), new THREE.Color(RED_SOFT), new THREE.Color(0xFF8A65), new THREE.Color(0xffffff)];
    for (let i = 0; i < PC; i++) {
      // spread mostly on the right half so dust frames the helix
      pPos[i * 3]     = (Math.random() - 0.08) * 10 - 1.5;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 14;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 12 - 1;
      const c = pal[Math.floor(Math.random() * pal.length)];
      const s = c.getHex() === 0xffffff ? 0.42 : 0.95;
      pCol[i * 3] = c.r * s; pCol[i * 3 + 1] = c.g * s; pCol[i * 3 + 2] = c.b * s;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
    const dust = new THREE.Points(pGeo, new THREE.PointsMaterial({
      size: 0.048, vertexColors: true, transparent: true, opacity: 0.24,
      sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    // keep dust at scene level so it parallaxes behind dna rotation
    scene.add(dust);

    // ── interaction — subtle mouse parallax + gentle auto motion only ──
    let mx = 0, my = 0, tx = 0, ty = 0;
    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      mx = ((e.clientX - rect.left) / rect.width - 0.5) * 0.55;
      my = ((e.clientY - rect.top) / rect.height - 0.5) * 0.32;
    });
    container.addEventListener('mouseleave', () => { mx = 0; my = 0; });

    function onResize() {
      const w = container.clientWidth || container.offsetWidth || 1;
      const h = container.clientHeight || container.offsetHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', onResize);
    // hero height may change after fonts/layout — observe it
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(onResize);
      ro.observe(container);
    }

    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Elegant continuous spin — slow, premium (reference feels suspended)
      dna.rotation.y = t * 0.28;
      dna.rotation.x = Math.sin(t * 0.14) * 0.11;
      dna.rotation.z = -0.14 + Math.sin(t * 0.09) * 0.035;

      // Parallax follows cursor with lag
      tx += (mx - tx) * 0.042;
      ty += (my - ty) * 0.042;
      dna.position.x = 3.15 + tx * 0.55;
      dna.position.y = 0.15 + ty * 0.45;

      // Lights breathe faintly — adds life without flicker
      topWarm.intensity = 68 + Math.sin(t * 1.1) * 10;
      rimRed.intensity  = 88 + Math.sin(t * 0.85 + 1.4) * 9;

      // Dust drifts very slowly for depth
      dust.rotation.y = t * 0.008;
      dust.rotation.x = Math.sin(t * 0.045) * 0.04;
      dust.position.y = Math.sin(t * 0.07) * 0.25;

      renderer.render(scene, camera);
    }
    animate();
  }

  function init() {
    // Clean leftover from full-page variant if present
    const ghost = document.getElementById('dnaGlobalLayer');
    if (ghost) ghost.remove();
    document.body.classList.remove('has-global-dna');

    const hero = document.getElementById('dnaCanvasContainer');
    if (!hero) return;
    // Defer one frame so hero-wrapper has its final size after CSS/fonts
    requestAnimationFrame(() => initHero(hero));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
