'use client';

import { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RevealTextProps {
  children: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
  className?: string;
  delay?: number;
  duration?: number;
  splitBy?: 'words' | 'lines';
}

export function RevealText({
  children,
  as: Component = 'div',
  className,
  delay = 0,
  duration = 0.8,
  splitBy = 'words',
}: RevealTextProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <Component className={className}>{children}</Component>;
  }

  const items = splitBy === 'words' ? children.split(' ') : children.split('\n');

  return (
    <Component className={cn('flex flex-wrap', className)}>
      {items.map((item, index) => (
        <span key={index} className="inline-block overflow-hidden mr-[0.25em] last:mr-0">
          <motion.span
            className="inline-block"
            initial={{ y: '110%', opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{
              duration,
              delay: delay + index * 0.04,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {item}
          </motion.span>
        </span>
      ))}
    </Component>
  );
}
