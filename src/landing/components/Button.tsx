import { useRef, useState, MouseEvent, ReactNode } from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'md' | 'lg';
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit';
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  href,
  onClick,
  className = '',
  type = 'button',
}: ButtonProps) {
  const ref = useRef<HTMLButtonElement & HTMLAnchorElement>(null);
  const [transform, setTransform] = useState('translate(0px, 0px)');

  const handleMouseMove = (e: MouseEvent) => {
    // Only apply magnetic effect on desktop pointer devices
    if (window.matchMedia('(hover: none)').matches) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const mx = x * 0.22;
    const my = y * 0.22;
    setTransform(`translate(${mx}px, ${my}px)`);
  };

  const handleMouseLeave = () => {
    setTransform('translate(0px, 0px)');
  };

  const sizeClasses = size === 'lg'
    ? 'px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base'
    : 'px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm';

  const variantClasses = variant === 'primary'
    ? 'bg-gradient-to-r from-[#B99A5D] to-[#8F7545] text-[#0B100D] font-bold tracking-wide border border-[#B99A5D]/60 shadow-[0_4px_16px_-2px_rgba(185,154,93,0.4)] hover:brightness-110 active:scale-[0.98]'
    : 'bg-[#121A15] border border-[rgba(241,238,229,0.12)] text-[#F1EEE5] font-semibold hover:border-[#B99A5D]/40 hover:bg-[#1B2820] hover:text-[#D1B678] active:scale-[0.98]';

  const baseClasses = `
    inline-flex items-center justify-center gap-2 rounded-full
    transition-all duration-200 select-none text-center
    ${sizeClasses} ${variantClasses} ${className}
  `;

  const style = {
    transform,
    transition: transform === 'translate(0px, 0px)'
      ? 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s, border-color 0.2s, box-shadow 0.2s'
      : 'transform 0.1s ease-out',
  };

  if (href) {
    return (
      <a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        className={baseClasses}
        style={style}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type={type}
      onClick={onClick}
      className={baseClasses}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </button>
  );
}
