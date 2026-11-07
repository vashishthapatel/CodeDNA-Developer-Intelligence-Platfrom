import { motion } from 'framer-motion';

interface SectionHeadingProps {
  label?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  className?: string;
  titleClassName?: string;
}

export function SectionHeading({
  label,
  title,
  subtitle,
  align = 'center',
  className = '',
  titleClassName = '',
}: SectionHeadingProps) {
  const alignClasses = align === 'center' ? 'items-center text-center' : 'items-start text-left';

  return (
    <div className={`flex flex-col ${alignClasses} ${className}`}>
      {label && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mb-3.5"
        >
          <span className="eyebrow">{label}</span>
        </motion.div>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, delay: 0.08, ease: 'easeOut' }}
        className={`font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#24301B] tracking-tight leading-[1.08] font-normal ${titleClassName}`}
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, delay: 0.16, ease: 'easeOut' }}
          className={`text-sm sm:text-base md:text-lg text-[#72785D] mt-4 leading-relaxed font-sans ${align === 'center' ? 'max-w-2xl' : 'max-w-xl'}`}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
