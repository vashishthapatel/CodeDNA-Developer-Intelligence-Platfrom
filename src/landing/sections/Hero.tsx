import { useRef, Suspense, useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { Sparkles, Github, ArrowRight, GitBranch, GitCommit, Zap } from 'lucide-react';
import { Button } from '../components/Button';
import { useMouseParallax } from '../hooks/useMouseParallax';
import { useScrollProgress } from '../hooks/useScrollProgress';

const GOLD_C = new THREE.Color('#B99A5D');
const PLAT_C = new THREE.Color('#C4C8CE');
const GLASS_C = new THREE.Color('#80917B');
const NUM_PAIRS = 20;
const RADIUS = 0.85;
const PITCH = 0.36;
const TOTAL_HEIGHT = NUM_PAIRS * PITCH;

function buildHelix() {
  const s1: THREE.Vector3[] = [];
  const s2: THREE.Vector3[] = [];
  for (let i = 0; i < NUM_PAIRS; i++) {
    const t = (i / (NUM_PAIRS - 1)) * Math.PI * 4;
    const y = i * PITCH - TOTAL_HEIGHT / 2;
    s1.push(new THREE.Vector3(RADIUS * Math.cos(t), y, RADIUS * Math.sin(t)));
    s2.push(new THREE.Vector3(RADIUS * Math.cos(t + Math.PI), y, RADIUS * Math.sin(t + Math.PI)));
  }
  return { strand1: s1, strand2: s2 };
}

const { strand1: STRAND1, strand2: STRAND2 } = buildHelix();

interface HelixSceneProps {
  mouseX: number;
  mouseY: number;
  scrollProgress: number;
  isMobile: boolean;
}

function HelixScene({ mouseX, mouseY, scrollProgress, isMobile }: HelixSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    timeRef.current += delta;
    const targetRotY = timeRef.current * 0.16 + mouseX * 0.1;
    const targetRotX = mouseY * 0.06;
    groupRef.current.rotation.y += (targetRotY - groupRef.current.rotation.y) * 0.04;
    groupRef.current.rotation.x += (targetRotX - groupRef.current.rotation.x) * 0.04;

    const baseScale = isMobile ? 0.68 : 0.95;
    const zoom = baseScale * (1 - scrollProgress * 0.25);
    groupRef.current.scale.setScalar(zoom);
    groupRef.current.position.y = (isMobile ? -0.2 : 0) + scrollProgress * -1.0;
  });

  return (
    <group ref={groupRef}>
      {STRAND1.map((pos, i) => (
        <mesh key={`s1-${i}`} position={[pos.x, pos.y, pos.z]}>
          <sphereGeometry args={[0.085, 14, 14]} />
          <meshStandardMaterial
            color={i % 3 === 0 ? GOLD_C : PLAT_C}
            metalness={0.88}
            roughness={0.16}
          />
        </mesh>
      ))}
      {STRAND2.map((pos, i) => (
        <mesh key={`s2-${i}`} position={[pos.x, pos.y, pos.z]}>
          <sphereGeometry args={[0.085, 14, 14]} />
          <meshStandardMaterial
            color={i % 3 === 1 ? PLAT_C : GOLD_C}
            metalness={0.88}
            roughness={0.16}
          />
        </mesh>
      ))}
      {STRAND1.map((pos, i) => {
        const other = STRAND2[i];
        const mid = pos.clone().lerp(other, 0.5);
        const length = pos.distanceTo(other);
        const dir = other.clone().sub(pos).normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        return (
          <mesh key={`rod-${i}`} position={[mid.x, mid.y, mid.z]} quaternion={q}>
            <cylinderGeometry args={[0.015, 0.015, length, 6]} />
            <meshStandardMaterial
              color={GLASS_C}
              metalness={0.4}
              roughness={0.4}
              transparent
              opacity={0.5}
            />
          </mesh>
        );
      })}
      {STRAND1.slice(0, -1).map((pos, i) => {
        const next = STRAND1[i + 1];
        const mid = pos.clone().lerp(next, 0.5);
        const length = pos.distanceTo(next);
        const dir = next.clone().sub(pos).normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        return (
          <mesh key={`spine1-${i}`} position={[mid.x, mid.y, mid.z]} quaternion={q}>
            <cylinderGeometry args={[0.015, 0.015, length, 6]} />
            <meshStandardMaterial
              color={GLASS_C}
              metalness={0.4}
              roughness={0.4}
              transparent
              opacity={0.35}
            />
          </mesh>
        );
      })}
      {STRAND2.slice(0, -1).map((pos, i) => {
        const next = STRAND2[i + 1];
        const mid = pos.clone().lerp(next, 0.5);
        const length = pos.distanceTo(next);
        const dir = next.clone().sub(pos).normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        return (
          <mesh key={`spine2-${i}`} position={[mid.x, mid.y, mid.z]} quaternion={q}>
            <cylinderGeometry args={[0.015, 0.015, length, 6]} />
            <meshStandardMaterial
              color={GLASS_C}
              metalness={0.4}
              roughness={0.4}
              transparent
              opacity={0.35}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function AmbientParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const COUNT = 80;

  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const r = 2.4 + Math.random() * 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();
    pointsRef.current.rotation.y = t * 0.035;
    pointsRef.current.rotation.x = Math.sin(t * 0.02) * 0.08;
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#B99A5D"
        size={0.024}
        sizeAttenuation
        depthWrite={false}
        opacity={0.45}
      />
    </Points>
  );
}

const floatingLabels = [
  { text: 'Engineering DNA', style: 'top-[26%] left-[6%]' },
  { text: 'Code Intelligence', style: 'top-[22%] right-[6%]' },
  { text: 'Developer Patterns', style: 'bottom-[30%] left-[5%]' },
  { text: 'Repository Analytics', style: 'bottom-[25%] right-[5%]' },
];

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { x: mouseX, y: mouseY } = useMouseParallax();
  const scrollProgress = useScrollProgress(sectionRef);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative min-h-[92vh] sm:min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#0B100D] pt-24 pb-16 sm:pt-28 sm:pb-20"
    >
      {/* 3D Canvas Background */}
      <div className="absolute inset-0 z-0 pointer-events-none sm:pointer-events-auto">
        <Canvas
          camera={{ position: [0, 0, 5.8], fov: 45 }}
          gl={{ alpha: true, antialias: true }}
          dpr={[1, 1.5]}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.4} />
            <directionalLight position={[5, 8, 5]} intensity={0.9} color="#FFFFFF" />
            <pointLight position={[0, 0, 3]} intensity={0.65} color="#B99A5D" distance={8} />
            <pointLight position={[-3, 2, -2]} intensity={0.3} color="#C4C8CE" distance={6} />
            <Environment preset="night" />
            <AmbientParticles />
            <HelixScene
              mouseX={mouseX}
              mouseY={mouseY}
              scrollProgress={scrollProgress}
              isMobile={isMobile}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Floating technical labels - desktop only */}
      {floatingLabels.map((label) => (
        <motion.div
          key={label.text}
          className={`absolute hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#121A15]/75 border border-[rgba(241,238,229,0.08)] backdrop-blur-md ${label.style} z-10 shadow-[0_4px_16px_rgba(0,0,0,0.5)]`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-[#B99A5D] shadow-[0_0_8px_rgba(185,154,93,0.7)]" />
          <span className="text-[10px] font-mono font-medium text-[#A0AA9D] tracking-[0.14em] uppercase">
            {label.text}
          </span>
        </motion.div>
      ))}

      {/* Hero content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center">
        {/* Eyebrow chip matching Dashboard */}
        <motion.div
          className="chip mb-6 sm:mb-8 !py-1.5 !px-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#B99A5D]" />
          <span className="font-mono text-[0.72rem] tracking-luxe uppercase text-[#D1B678] font-bold">
            Developer Atelier
          </span>
          <span className="hidden sm:inline text-[#A0AA9D] text-xs">·</span>
          <span className="hidden sm:inline text-xs text-[#A0AA9D]">AI Intelligence Platform</span>
        </motion.div>

        {/* Headline with serif display touch */}
        <motion.h1
          className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-[#F1EEE5] leading-[0.98] tracking-tight mb-5 sm:mb-7 font-normal"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        >
          Your Code.<br />
          Your{' '}
          <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-[#B99A5D] via-[#D1B678] to-[#8F7545]">
            DNA
          </span>
          .<br />
          Decoded.
        </motion.h1>

        {/* Supporting text */}
        <motion.p
          className="text-sm sm:text-base md:text-lg text-[#A0AA9D] max-w-xl mx-auto leading-relaxed mb-8 sm:mb-10 px-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: 'easeOut' }}
        >
          Discover the engineering intelligence behind every commit. Transform your GitHub
          activity into a measurable fingerprint of how you build software.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto px-4 sm:px-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: 'easeOut' }}
        >
          <Button href="app.html" variant="primary" size="lg" className="w-full sm:w-auto">
            <Github className="w-4 h-4 shrink-0" />
            <span>Discover Your CodeDNA</span>
          </Button>
          <Button href="#product" variant="secondary" size="lg" className="w-full sm:w-auto">
            <span>Explore the Technology</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </Button>
        </motion.div>

        {/* Stats Row - responsive 3-column pill cards */}
        <motion.div
          className="mt-12 sm:mt-16 grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 w-full max-w-2xl px-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7, ease: 'easeOut' }}
        >
          {[
            { value: '50K+', label: 'Repositories' },
            { value: '99.9%', label: 'Signal Accuracy' },
            { value: '< 30s', label: 'Analysis Time' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-[rgba(241,238,229,0.08)] bg-[#121A15]/80 backdrop-blur-sm text-center"
            >
              <div className="font-display text-xl sm:text-2xl md:text-3xl font-semibold text-[#F1EEE5]">
                {stat.value}
              </div>
              <div className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[#A0AA9D] mt-1 truncate">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0B100D] to-transparent pointer-events-none z-10" />
    </section>
  );
}
