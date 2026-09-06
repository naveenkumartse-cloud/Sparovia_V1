import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ContainerProps {
  children: ReactNode;
  className?: string;
  size?: 'default' | 'narrow' | 'wide' | 'full';
}

export function Container({ children, className, size = 'default' }: ContainerProps) {
  const sizeClasses = {
    narrow: 'max-w-4xl',
    default: 'max-w-7xl',
    wide: 'max-w-[90rem]',
    full: 'max-w-full px-0',
  };

  return (
    <div className={cn('mx-auto px-4 sm:px-6 lg:px-8 w-full', sizeClasses[size], className)}>
      {children}
    </div>
  );
}

export function EditorialContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('max-w-3xl mx-auto px-4 sm:px-6 w-full', className)}>
      {children}
    </div>
  );
}

export function FullBleed({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('w-full relative left-1/2 right-1/2 -mx-[50vw]', className)}>
      {children}
    </div>
  );
}
