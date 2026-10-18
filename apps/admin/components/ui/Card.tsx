'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'supporting' | 'interactive' | 'accent';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-[8px] border transition-colors',
          variant === 'default' &&
            'bg-white dark:bg-[#0F172A] border-[#CBD5E1] dark:border-[#1E293B] shadow-xs',
          variant === 'supporting' &&
            'bg-[#F3F6FA] dark:bg-[#0B1220] border-[#E3E7ED] dark:border-[#1E293B]',
          variant === 'interactive' &&
            'bg-white dark:bg-[#0F172A] border-[#CBD5E1] dark:border-[#1E293B] shadow-xs hover:border-[#315FEA] dark:hover:border-[#315FEA] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]',
          variant === 'accent' &&
            'bg-[#F5F0FB] dark:bg-[#1A102A] border-[#7950B8]/20 dark:border-[#7950B8]/30',
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
