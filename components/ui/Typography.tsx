import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface TypographyProps {
  children: ReactNode;
  className?: string;
}

export function Eyebrow({ children, className, icon = true }: TypographyProps & { icon?: boolean }) {
  return (
    <div className={cn('inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full badge-purple mb-4 font-sans text-xs uppercase tracking-widest font-semibold', className)}>
      {icon && <Sparkles className="w-3.5 h-3.5 text-brand-600" />}
      <span>{children}</span>
    </div>
  );
}

export function HeroHeading({ children, className }: TypographyProps) {
  return (
    <h1 className={cn('font-sans text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-charcoal-900 leading-[1.1] mb-6', className)}>
      {children}
    </h1>
  );
}

export function SectionHeading({ children, className }: TypographyProps) {
  return (
    <h2 className={cn('font-sans text-3xl sm:text-4xl lg:text-5xl font-bold text-charcoal-900 tracking-tight mb-4', className)}>
      {children}
    </h2>
  );
}

export function Subheading({ children, className }: TypographyProps) {
  return (
    <p className={cn('text-charcoal-600 text-base sm:text-lg font-normal leading-relaxed max-w-2xl', className)}>
      {children}
    </p>
  );
}

export function BodyText({ children, className }: TypographyProps) {
  return (
    <p className={cn('text-charcoal-700 text-sm sm:text-base font-normal leading-relaxed', className)}>
      {children}
    </p>
  );
}
