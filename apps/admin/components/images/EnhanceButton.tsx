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
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Authoritative Sparovia Image Studio Creative Action Button
 * Centralized restrained purple treatment strictly for Enhance actions across the platform.
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
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    // Standardized to match Button.tsx control heights, paddings, and 6px border radius (radius.control)
    const sizeClasses = {
      sm: 'h-9 min-h-[36px] px-3.5 text-xs sm:text-sm font-medium rounded-[6px] gap-1.5',
      md: 'h-10 min-h-[40px] px-4 text-sm font-semibold rounded-[6px] gap-2',
      lg: 'h-11 min-h-[44px] px-5 sm:px-6 text-sm sm:text-base font-semibold rounded-[6px] gap-2.5',
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
          'image-studio-enhance-button font-semibold rounded-[6px] inline-flex items-center justify-center select-none transition-all duration-150',
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
            {leftIcon !== undefined ? leftIcon : <Sparkles className={cn('shrink-0 text-white', iconSizes[size])} />}
            <span>{children}</span>
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

EnhanceButton.displayName = 'EnhanceButton';
