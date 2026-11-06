import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';

const GOLD = new THREE.Color('#B99A5D');
const PLATINUM = new THREE.Color('#C4C8CE');
const IRIS = new THREE.Color('#80917B');

function BackgroundHelix() {
  const groupRef = useRef<THREE.Group>(null);
  const NUM_PAIRS = 12;
  const RADIUS = 0.7;
  const PITCH = 0.4;
  const TOTAL_HEIGHT = NUM_PAIRS * PITCH;

  const { strand1, strand2 } = useMemo(() => {
    const s1: THREE.Vector3[] = [];
    const s2: THREE.Vector3[] = [];
    for (let i = 0; i < NUM_PAIRS; i++) {
      const t = (i / (NUM_PAIRS - 1)) * Math.PI * 3;
      const y = i * PITCH - TOTAL_HEIGHT / 2;
      s1.push(new THREE.Vector3(RADIUS * Math.cos(t), y, RADIUS * Math.sin(t)));
      s2.push(new THREE.Vector3(RADIUS * Math.cos(t + Math.PI), y, RADIUS * Math.sin(t + Math.PI)));
    }
    return { strand1: s1, strand2: s2 };
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = clock.getElapsedTime() * 0.12;
  });

  return (
    <group ref={groupRef} position={[0.5, 0, 0]}>
      {strand1.map((pos, i) => (
        <mesh key={`b1-${i}`} position={[pos.x, pos.y, pos.z]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? GOLD : PLATINUM}
            metalness={0.9}
            roughness={0.1}
            transparent
            opacity={0.4}
          />
        </mesh>
      ))}
      {strand2.map((pos, i) => (
        <mesh key={`b2-${i}`} position={[pos.x, pos.y, pos.z]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial
            color={i % 2 === 1 ? GOLD : PLATINUM}
            metalness={0.9}
            roughness={0.1}
            transparent
            opacity={0.4}
          />
        </mesh>
      ))}
      {strand1.slice(0, -1).map((pos, i) => {
        const next = strand2[i];
        const mid = pos.clone().lerp(next, 0.5);
        const length = pos.distanceTo(next);
        const dir = next.clone().sub(pos).normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        return (
          <mesh key={`brod-${i}`} position={[mid.x, mid.y, mid.z]} quaternion={q}>
            <cylinderGeometry args={[0.012, 0.012, length, 6]} />
            <meshStandardMaterial
              color={IRIS}
              metalness={0.5}
              roughness={0.4}
              transparent
              opacity={0.25}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export interface DNABackgroundProps {
  className?: string;
}

export function DNABackground({ className = '' }: DNABackgroundProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 1.2]}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.25} />
          <pointLight position={[2, 3, 2]} intensity={0.5} color="#B99A5D" />
          <Environment preset="night" />
          <BackgroundHelix />
        </Suspense>
      </Canvas>
    </div>
  );
}
