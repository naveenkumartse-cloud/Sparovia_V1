'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'supporting' | 'interactive' | 'accent' | 'creative' | 'glass';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-[8px] border transition-all duration-200 motion-reduce:transition-none',
          variant === 'default' &&
            'bg-white dark:bg-[#0F172A] border-[#CBD5E1] dark:border-[#1E293B] shadow-soft-xs',
          variant === 'supporting' &&
            'bg-[#F3F6FA] dark:bg-[#0B1220] border-[#E3E7ED] dark:border-[#1E293B]',
          variant === 'interactive' &&
            'bg-white dark:bg-[#0F172A] border-[#CBD5E1] dark:border-[#1E293B] shadow-soft-xs hover:border-[#315FEA] dark:hover:border-[#315FEA] card-hover-lift cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]',
          variant === 'accent' &&
            'bg-[#F5F0FB] dark:bg-[#1A102A] border-[#7950B8]/20 dark:border-[#7950B8]/30 shadow-soft-xs',
          variant === 'creative' &&
            'bg-[#F5F0FB]/70 dark:bg-[#1A102A]/70 border-[#7950B8]/25 dark:border-[#7950B8]/35 backdrop-blur-sm shadow-soft-xs',
          variant === 'glass' &&
            'glass-panel rounded-[8px]',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('p-4 sm:p-6 border-b border-[#E3E7ED] dark:border-[#1E293B]', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CardHeader.displayName = 'CardHeader';

export const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('p-4 sm:p-6', className)} {...props}>
        {children}
      </div>
    );
  }
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'p-4 sm:p-6 border-t border-[#E3E7ED] dark:border-[#1E293B] bg-[#F3F6FA]/50 dark:bg-[#0B1220]/50 rounded-b-[8px]',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CardFooter.displayName = 'CardFooter';

export const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn('text-base sm:text-lg font-bold text-[#172033] dark:text-white tracking-tight', className)}
        {...props}
      >
        {children}
      </h3>
    );
  }
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8] mt-1 leading-relaxed', className)}
        {...props}
      >
        {children}
      </p>
    );
  }
);
CardDescription.displayName = 'CardDescription';
