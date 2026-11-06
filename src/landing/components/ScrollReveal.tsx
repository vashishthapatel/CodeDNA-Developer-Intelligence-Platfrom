import { ReactNode } from 'react';
import { motion, Variants } from 'framer-motion';

type Direction = 'up' | 'down' | 'left' | 'right';

interface ScrollRevealProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
}

function getInitial(direction: Direction, distance: number) {
  switch (direction) {
    case 'up':    return { opacity: 0, y: distance };
    case 'down':  return { opacity: 0, y: -distance };
    case 'left':  return { opacity: 0, x: distance };
    case 'right': return { opacity: 0, x: -distance };
  }
}

function getAnimate() {
  return { opacity: 1, y: 0, x: 0 };
}

export function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.7,
  distance = 30,
  className = '',
}: ScrollRevealProps) {
  const variants: Variants = {
    hidden: getInitial(direction, distance),
    show: {
      ...getAnimate(),
      transition: {
        duration,
        delay,
        ease: 'easeOut',
      },
    },
  };

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
    >
      {children}
    </motion.div>
  );
}
