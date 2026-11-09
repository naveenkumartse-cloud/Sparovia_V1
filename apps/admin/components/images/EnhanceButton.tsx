'use client';

import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EnhanceButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children?: React.ReactNode;
}

/**
 * Authoritative Sparovia Image Studio Creative Action Button
 * Restricted purple glassmorphism treatment strictly for Enhance actions.
 */
export const EnhanceButton = React.forwardRef<HTMLButtonElement, EnhanceButtonProps>(
  (
    {
      isLoading = false,
      loadingText = 'Enhancing photo...',
      size = 'md',
      fullWidth = false,
      children = 'Enhance for Website',
      className,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'py-2 px-3 text-xs gap-1.5',
      md: 'py-2.5 px-4 text-xs sm:text-sm gap-2',
      lg: 'py-3 px-5 text-sm sm:text-base gap-2.5',
    };

    const iconSizes = {
      sm: 'w-3.5 h-3.5',
      md: 'w-4 h-4',
      lg: 'w-4.5 h-4.5',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          'image-studio-enhance-button font-semibold rounded-[6px] inline-flex items-center justify-center select-none',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7950B8] focus-visible:ring-offset-2',
          sizeClasses[size],
          fullWidth ? 'w-full' : '',
          'disabled:opacity-50 disabled:pointer-events-none disabled:transform-none',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className={cn('animate-spin shrink-0', iconSizes[size])} />
            <span>{loadingText}</span>
          </>
        ) : (
          <>
            <Sparkles className={cn('shrink-0 text-white', iconSizes[size])} />
            <span>{children}</span>
          </>
        )}
      </button>
    );
  }
);

EnhanceButton.displayName = 'EnhanceButton';
