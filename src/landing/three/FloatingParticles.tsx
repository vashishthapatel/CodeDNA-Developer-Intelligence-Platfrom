import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

export function FloatingParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const COUNT = 100;

  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      // Scatter in a sphere of radius 4.5
      const r = 2.5 + Math.random() * 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  const offsets = useMemo(() => {
    return Array.from({ length: COUNT }, () => Math.random() * Math.PI * 2);
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();
    // Slow global rotation
    pointsRef.current.rotation.y = t * 0.04;
    pointsRef.current.rotation.x = Math.sin(t * 0.02) * 0.1;
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#4B7D21"
        size={0.024}
        sizeAttenuation
        depthWrite={false}
        opacity={0.45}
      />
    </Points>
  );
}
