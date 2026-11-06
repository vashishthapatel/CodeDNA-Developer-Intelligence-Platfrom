import { ReactNode, useRef, useState, MouseEvent } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  tilt?: boolean;
}

export function Card({
  children,
  className = '',
  glowColor = 'rgba(185,154,93,0.18)',
  tilt = true,
}: CardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({
    transform: 'perspective(800px) rotateX(0deg) rotateY(0deg)',
    background: '#1B2820',
  });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!tilt || window.matchMedia('(hover: none)').matches) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotateX = ((y - cy) / cy) * -4;
    const rotateY = ((x - cx) / cx) * 4;
    const pctX = (x / rect.width) * 100;
    const pctY = (y / rect.height) * 100;

    setStyle({
      transform: `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
      background: `radial-gradient(circle at ${pctX}% ${pctY}%, rgba(185,154,93,0.08) 0%, #1B2820 65%)`,
    });
  };

  const handleMouseLeave = () => {
    setStyle({
      transform: 'perspective(800px) rotateX(0deg) rotateY(0deg)',
      background: '#1B2820',
    });
  };

  return (
    <div
      ref={ref}
      className={`
        rounded-2xl border border-[rgba(241,238,229,0.10)] p-5 sm:p-7 md:p-8
        transition-all duration-300 ease-out relative group overflow-hidden
        hover:border-[rgba(185,154,93,0.35)]
        ${className}
      `}
      style={{
        ...style,
        boxShadow: '0 8px 32px -12px rgba(0, 0, 0, 0.6), 0 1px 3px rgba(241, 238, 229, 0.04)',
        transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1), background 0.25s ease, box-shadow 0.35s ease, border-color 0.25s ease',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
        style={{ boxShadow: `0 0 45px -8px ${glowColor}` }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
