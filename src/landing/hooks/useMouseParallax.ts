import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

interface MouseParallax {
  x: number;
  y: number;
}

export function useMouseParallax(): MouseParallax {
  const prefersReducedMotion = useReducedMotion();
  const [position, setPosition] = useState<MouseParallax>({ x: 0, y: 0 });
  const targetRef = useRef<MouseParallax>({ x: 0, y: 0 });
  const currentRef = useRef<MouseParallax>({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      targetRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -((e.clientY / window.innerHeight) * 2 - 1),
      };
    };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const animate = () => {
      currentRef.current.x = lerp(currentRef.current.x, targetRef.current.x, 0.05);
      currentRef.current.y = lerp(currentRef.current.y, targetRef.current.y, 0.05);
      setPosition({ ...currentRef.current });
      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) return { x: 0, y: 0 };
  return position;
}
