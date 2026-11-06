import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float } from '@react-three/drei';
import * as THREE from 'three';

interface DNAHelixSceneProps {
  mouseX: number;
  mouseY: number;
  scrollProgress: number;
}

const GOLD = new THREE.Color('#B99A5D');
const PLATINUM = new THREE.Color('#C4C8CE');
const GLASS_COLOR = new THREE.Color('#80917B');

function HelixNode({ position, color, scale = 1 }: {
  position: [number, number, number];
  color: THREE.Color;
  scale?: number;
}) {
  return (
    <mesh position={position} scale={scale}>
      <sphereGeometry args={[0.09, 16, 16]} />
      <meshStandardMaterial
        color={color}
        metalness={0.85}
        roughness={0.15}
        envMapIntensity={1.5}
      />
    </mesh>
  );
}

function HelixRod({ start, end }: { start: THREE.Vector3; end: THREE.Vector3 }) {
  const midpoint = useMemo(() => start.clone().lerp(end, 0.5), [start, end]);
  const length = useMemo(() => start.distanceTo(end), [start, end]);
  const quaternion = useMemo(() => {
    const dir = end.clone().sub(start).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(up, dir);
    return q;
  }, [start, end]);

  return (
    <mesh position={[midpoint.x, midpoint.y, midpoint.z]} quaternion={quaternion}>
      <cylinderGeometry args={[0.016, 0.016, length, 8]} />
      <meshStandardMaterial
        color={GLASS_COLOR}
        metalness={0.4}
        roughness={0.4}
        transparent
        opacity={0.55}
      />
    </mesh>
  );
}

function DNAHelixScene({ mouseX, mouseY, scrollProgress }: DNAHelixSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  const NUM_PAIRS = 22;
  const RADIUS = 0.9;
  const PITCH = 0.38;
  const TOTAL_HEIGHT = NUM_PAIRS * PITCH;

  const { strand1, strand2, pairs } = useMemo(() => {
    const s1: THREE.Vector3[] = [];
    const s2: THREE.Vector3[] = [];
    for (let i = 0; i < NUM_PAIRS; i++) {
      const t = (i / (NUM_PAIRS - 1)) * Math.PI * 4;
      const y = i * PITCH - TOTAL_HEIGHT / 2;
      s1.push(new THREE.Vector3(RADIUS * Math.cos(t), y, RADIUS * Math.sin(t)));
      s2.push(new THREE.Vector3(RADIUS * Math.cos(t + Math.PI), y, RADIUS * Math.sin(t + Math.PI)));
    }
    const p: Array<[THREE.Vector3, THREE.Vector3]> = s1.map((v, i) => [v, s2[i]]);
    return { strand1: s1, strand2: s2, pairs: p };
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    timeRef.current += delta;

    // Base rotation + mouse parallax
    const targetRotY = timeRef.current * 0.18 + mouseX * 0.12;
    const targetRotX = mouseY * 0.08;
    groupRef.current.rotation.y += (targetRotY - groupRef.current.rotation.y) * 0.04;
    groupRef.current.rotation.x += (targetRotX - groupRef.current.rotation.x) * 0.04;

    // Scroll-driven zoom / disperse
    const zoom = 1 - scrollProgress * 0.3;
    groupRef.current.scale.setScalar(zoom);
    groupRef.current.position.y = scrollProgress * -1.2;
  });

  return (
    <group ref={groupRef}>
      {/* Strand 1 nodes — champagne gold */}
      {strand1.map((pos, i) => (
        <HelixNode
          key={`s1-${i}`}
          position={[pos.x, pos.y, pos.z]}
          color={i % 3 === 0 ? GOLD : PLATINUM}
        />
      ))}
      {/* Strand 2 nodes — platinum */}
      {strand2.map((pos, i) => (
        <HelixNode
          key={`s2-${i}`}
          position={[pos.x, pos.y, pos.z]}
          color={i % 3 === 1 ? PLATINUM : GOLD}
        />
      ))}
      {/* Cross-connecting rods */}
      {pairs.map(([a, b], i) => (
        <HelixRod key={`rod-${i}`} start={a} end={b} />
      ))}
      {/* Spine rods along each strand */}
      {strand1.slice(0, -1).map((pos, i) => (
        <HelixRod key={`spine1-${i}`} start={pos} end={strand1[i + 1]} />
      ))}
      {strand2.slice(0, -1).map((pos, i) => (
        <HelixRod key={`spine2-${i}`} start={pos} end={strand2[i + 1]} />
      ))}
    </group>
  );
}

function FloatingLabels() {
  const labels = [
    { text: 'Engineering DNA', pos: [-3.2, 1.8, 0] as [number, number, number] },
    { text: 'Code Intelligence', pos: [2.8, 0.5, 0] as [number, number, number] },
    { text: 'Developer Patterns', pos: [-3.0, -1.0, 0] as [number, number, number] },
    { text: 'Repository Analytics', pos: [2.6, -2.0, 0] as [number, number, number] },
  ];

  return (
    <>
      {labels.map((label) => (
        <Float
          key={label.text}
          speed={1.5}
          rotationIntensity={0}
          floatIntensity={0.4}
          floatingRange={[-0.1, 0.1]}
        >
          <mesh position={label.pos}>
            <planeGeometry args={[0.01, 0.01]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        </Float>
      ))}
    </>
  );
}

export interface DNAHelixProps {
  mouseX?: number;
  mouseY?: number;
  scrollProgress?: number;
  className?: string;
}

export function DNAHelix({
  mouseX = 0,
  mouseY = 0,
  scrollProgress = 0,
  className = '',
}: DNAHelixProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.35} />
          <directionalLight
            position={[5, 8, 5]}
            intensity={0.9}
            color="#FFFFFF"
          />
          <pointLight
            position={[0, 0, 3]}
            intensity={0.65}
            color="#B99A5D"
            distance={8}
          />
          <pointLight
            position={[-3, 2, -2]}
            intensity={0.3}
            color="#C4C8CE"
            distance={6}
          />
          <Environment preset="night" />
          <DNAHelixScene
            mouseX={mouseX}
            mouseY={mouseY}
            scrollProgress={scrollProgress}
          />
          <FloatingLabels />
        </Suspense>
      </Canvas>
    </div>
  );
}
