import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionProps {
  id?: string;
  children: ReactNode;
  className?: string;
  background?: 'white' | 'surface' | 'elevated' | 'brand-light' | 'charcoal';
  padding?: 'default' | 'compact' | 'spacious' | 'none';
}

export function Section({
  id,
  children,
  className,
  background = 'white',
  padding = 'default',
}: SectionProps) {
  const bgClasses = {
    white: 'bg-white text-charcoal-900',
    surface: 'bg-surface text-charcoal-900 border-t border-b border-gray-100',
    elevated: 'bg-surface-elevated text-charcoal-900',
    'brand-light': 'bg-brand-50 text-charcoal-900 border-t border-b border-brand-200',
    charcoal: 'bg-charcoal-900 text-white',
  };

  const paddingClasses = {
    none: 'py-0',
    compact: 'py-12 sm:py-16',
    default: 'py-20 sm:py-24',
    spacious: 'py-24 sm:py-32',
  };

  return (
    <section id={id} className={cn('relative overflow-hidden', bgClasses[background], paddingClasses[padding], className)}>
      {children}
    </section>
  );
}
