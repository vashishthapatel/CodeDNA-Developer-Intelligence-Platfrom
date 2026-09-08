/**
 * CodeDNA — Low-Poly DNA Double Helix
 * Exact replica of the reference image shape in Ferrari Red palette
 * 
 * Key parameters matched from image:
 *  - ~2.5 turns (fewer = each crossing looks massive)
 *  - Very thick strands (TUBE_R close to HELIX_RADIUS)
 *  - 5-sided polygon cross-section (pentagon) for big flat faces
 *  - Strands nearly touching at crossings
 *  - Short dark metallic capsule rungs
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.module.min.js';

(function () {
  'use strict';

  /* ─── COLOR PALETTE — Ferrari Red low-poly facets ──────────── */
  const PALETTE = [
    new THREE.Color(0xFF2800), // Ferrari Red
    new THREE.Color(0xFF5940), // Red Flare
    new THREE.Color(0xFF8C00), // Orange-Red
    new THREE.Color(0xCC1800), // Deep Crimson
    new THREE.Color(0xFF1460), // Magenta-Red
    new THREE.Color(0xFF6B35), // Warm Orange
    new THREE.Color(0xE8003A), // Hot Pink-Red
    new THREE.Color(0xFFB347), // Amber
    new THREE.Color(0xD4145A), // Dark Magenta
    new THREE.Color(0xFF4500), // Orange-Red 2
    new THREE.Color(0xC0392B), // Dark Ferrari
    new THREE.Color(0xFF3D00), // Bright Red-Orange
  ];

  /* ─── EXACT HELIX PARAMS — matched to reference image ────── */
  const TURNS        = 2.6;   // fewer turns = big visible crossings
  const PATH_SEGS    = 200;   // smooth path resolution
  const RADIAL_SEGS  = 5;     // pentagon = big flat triangular faces
  const HELIX_R      = 1.9;   // helix radius (center to strand center)
  const PITCH        = 3.6;   // tall per turn
  const TUBE_R       = 0.78;  // very thick strands (nearly touching at crossings)
  const RUNG_COUNT   = Math.round(TURNS * 8);
  const TOTAL_H      = TURNS * PITCH;

  /* ─── PER-FACE RANDOM COLOR ────────────────────────────────── */
  function colorize(geo) {
    const nonIdx = geo.toNonIndexed();
    const cnt    = nonIdx.attributes.position.count;
    const cols   = new Float32Array(cnt * 3);
    for (let i = 0; i < cnt; i += 3) {
      const c = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      for (let j = 0; j < 3; j++) {
        cols[(i+j)*3]   = c.r;
        cols[(i+j)*3+1] = c.g;
        cols[(i+j)*3+2] = c.b;
      }
    }
    nonIdx.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    nonIdx.computeVertexNormals();
    return nonIdx;
  }

  /* ─── INIT ──────────────────────────────────────────────────── */
  function init() {
    const container = document.getElementById('dnaCanvasContainer');
    if (!container) return;

    /* Scene */
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.022);

    /* Camera — slight 3/4 view angle like reference image */
    const W = container.clientWidth, H = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(46, W / H, 0.1, 300);
    // Offset left so helix sits right-of-center, slight Y elevation
    camera.position.set(-2.0, 0.5, 16);
    camera.lookAt(2.5, 0, 0);

    /* Renderer */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping        = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.8;
    const old = container.querySelector('canvas');
    if (old) old.remove();
    container.appendChild(renderer.domElement);

    /* ─── LIGHTS — matched to reference (bright top-right key) ── */
    scene.add(new THREE.AmbientLight(0x222222, 3.5));

    // Strong white directional key from upper-right — main facet lighting
    const keyLight = new THREE.DirectionalLight(0xFFFFFF, 5.0);
    keyLight.position.set(5, 8, 12);
    scene.add(keyLight);

    // Red-magenta fill from left side
    const redFill = new THREE.PointLight(0xFF1460, 200, 60);
    redFill.position.set(-7, 3, 8);
    scene.add(redFill);

    // Orange from below (warm bounce)
    const orangeUnder = new THREE.PointLight(0xFF6B00, 160, 50);
    orangeUnder.position.set(3, -9, 5);
    scene.add(orangeUnder);

    // Blue-ish cool from behind — matches the blue tones in reference
    const coolRim = new THREE.PointLight(0x4060FF, 80, 45);
    coolRim.position.set(0, 0, -14);
    scene.add(coolRim);

    // Top pink sparkle
    const topPink = new THREE.PointLight(0xFF2080, 120, 40);
    topPink.position.set(2, 11, 6);
    scene.add(topPink);

    /* ─── STRAND MATERIAL ─────────────────────────────────────── */
    const strandMat = new THREE.MeshStandardMaterial({
      vertexColors : true,
      flatShading  : true,   // CRITICAL: flat faces = low-poly look
      roughness    : 0.30,
      metalness    : 0.80,
      side         : THREE.DoubleSide,
    });

    /* ─── RUNG MATERIALS — dark metallic capsules ────────────── */
    // Matches the dark chrome/gunmetal capsules in the reference image
    function makeCapsuleMat(emColor) {
      return new THREE.MeshStandardMaterial({
        color           : 0x080808,
        emissive        : new THREE.Color(emColor),
        emissiveIntensity: 0.35,
        roughness       : 0.03,
        metalness       : 1.0,
      });
    }

    /* ─── HELIX PATH POINTS ────────────────────────────────────── */
    const totalPts = Math.round(TURNS * PATH_SEGS) + 1;
    const pts1 = [], pts2 = [];

    for (let i = 0; i < totalPts; i++) {
      const t     = i / (totalPts - 1);
      const angle = t * TURNS * Math.PI * 2;
      const y     = t * TOTAL_H - TOTAL_H / 2;
      pts1.push(new THREE.Vector3(Math.cos(angle) * HELIX_R, y, Math.sin(angle) * HELIX_R));
      pts2.push(new THREE.Vector3(Math.cos(angle + Math.PI) * HELIX_R, y, Math.sin(angle + Math.PI) * HELIX_R));
    }

    /* ─── DNA GROUP ───────────────────────────────────────────── */
    const dnaGroup = new THREE.Group();
    dnaGroup.position.x = 2.8;

    /* Build thick low-poly strand */
    function makeStrand(pts) {
      const curve = new THREE.CatmullRomCurve3(pts);
      const geo   = new THREE.TubeGeometry(curve, PATH_SEGS * 2, TUBE_R, RADIAL_SEGS, false);
      return new THREE.Mesh(colorize(geo), strandMat.clone());
    }

    dnaGroup.add(makeStrand(pts1));
    dnaGroup.add(makeStrand(pts2));

    /* ─── RUNGS — short metallic capsules like the reference ─── */
    // Use CapsuleGeometry (THREE r140+ has it, else use cylinder+spheres)
    const rungBody   = new THREE.CylinderGeometry(0.055, 0.055, 1, 10);
    const capGeo     = new THREE.SphereGeometry(0.072, 10, 10);
    const rungMatRed = makeCapsuleMat(0xFF2800);
    const rungMatBlu = makeCapsuleMat(0x3060FF);
    const axisY      = new THREE.Vector3(0, 1, 0);

    for (let r = 0; r < RUNG_COUNT; r++) {
      const t   = r / (RUNG_COUNT - 1);
      const idx = Math.min(Math.round(t * (totalPts - 1)), totalPts - 1);
      const p1  = pts1[idx], p2 = pts2[idx];
      const mid = new THREE.Vector3().lerpVectors(p1, p2, 0.5);
      const dist= p1.distanceTo(p2);
      const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
      const mat = (r % 2 === 0) ? rungMatRed : rungMatBlu;

      // Cylinder body
      const body = new THREE.Mesh(rungBody, mat);
      body.position.copy(mid);
      body.scale.y = dist;
      body.quaternion.setFromUnitVectors(axisY, dir);
      dnaGroup.add(body);

      // End-cap spheres (gives capsule look matching reference image)
      const cA = new THREE.Mesh(capGeo, mat.clone()); cA.position.copy(p1); dnaGroup.add(cA);
      const cB = new THREE.Mesh(capGeo, mat.clone()); cB.position.copy(p2); dnaGroup.add(cB);
    }

    scene.add(dnaGroup);

    /* ─── FLOATING PARTICLES — color-matched to palette ───────── */
    const PC = 420;
    const pPos = new Float32Array(PC * 3);
    const pCol = new Float32Array(PC * 3);
    for (let i = 0; i < PC; i++) {
      pPos[i*3]   = (Math.random()-0.5) * 30;
      pPos[i*3+1] = (Math.random()-0.5) * 22;
      pPos[i*3+2] = (Math.random()-0.5) * 14;
      const c = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      pCol[i*3]=c.r; pCol[i*3+1]=c.g; pCol[i*3+2]=c.b;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color',    new THREE.BufferAttribute(pCol, 3));
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
      size: 0.05, vertexColors: true, transparent: true, opacity: 0.40, sizeAttenuation: true,
    }));
    scene.add(particles);

    /* ─── RESIZE ──────────────────────────────────────────────── */
    function onResize() {
      const w = container.clientWidth, h = container.clientHeight;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', onResize);

    /* ─── ANIMATE ─────────────────────────────────────────────── */
    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Primary Y-axis spin — continuous, smooth
      dnaGroup.rotation.y = t * 0.32;
      // Subtle X tilt — shows 3D depth, see top/bottom of helix
      dnaGroup.rotation.x = Math.sin(t * 0.15) * 0.16;

      // Pulse magenta fill for vivid color shift
      redFill.intensity   = 180 + Math.sin(t * 1.8) * 60;
      topPink.intensity   = 100 + Math.sin(t * 2.3 + 1) * 50;

      particles.rotation.y = t * 0.015;

      renderer.render(scene, camera);
    }

    animate();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
