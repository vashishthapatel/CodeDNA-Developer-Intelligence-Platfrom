import { useEffect, useState, RefObject } from 'react';

export function useScrollProgress(ref: RefObject<HTMLElement>): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const windowH = window.innerHeight;
      // Start when element top enters viewport bottom, end when element bottom leaves viewport top
      const start = rect.top + window.scrollY - windowH;
      const end = rect.bottom + window.scrollY;
      const scrollY = window.scrollY;
      const raw = (scrollY - start) / (end - start);
      setProgress(Math.min(1, Math.max(0, raw)));
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [ref]);

  return progress;
}
