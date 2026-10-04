'use client';

import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant =
  | 'primary'
  | 'enhance'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'destructive'
  | 'destructive-outline'
  | 'success'
  | 'link';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm' | 'icon-xs';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      disabled,
      leftIcon,
      rightIcon,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'bg-[#FF7043] hover:bg-[#F4511E] active:bg-[#E64A19] text-white shadow-lg shadow-[#FF7043]/25 hover:shadow-xl hover:shadow-[#FF7043]/30 focus:ring-[#FF7043] border border-transparent',
      enhance:
        'bg-gradient-to-r from-[#FF7043] via-[#EC4899] to-[#8B5CF6] hover:from-[#F4511E] hover:via-[#DB2777] hover:to-[#7C3AED] text-white shadow-lg shadow-[#FF7043]/20 focus:ring-purple-400 border border-transparent',
      secondary:
        'bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#334155] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-[#334155] focus:ring-slate-400',
      outline:
        'bg-white dark:bg-[#0F172A] hover:bg-slate-50 dark:hover:bg-[#1E293B] text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-[#334155] focus:ring-slate-400 shadow-2xs',
      ghost:
        'bg-transparent hover:bg-slate-100 dark:hover:bg-[#1E293B] text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white focus:ring-slate-400',
      danger:
        'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs focus:ring-rose-500 border border-transparent',
      destructive:
        'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs focus:ring-rose-500 border border-transparent',
      'destructive-outline':
        'bg-white dark:bg-[#0F172A] hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 focus:ring-rose-400',
      success:
        'bg-[#FF7043] hover:bg-[#F4511E] active:bg-[#E64A19] text-white shadow-lg shadow-[#FF7043]/25 focus:ring-[#FF7043] border border-transparent',
      link:
        'bg-transparent hover:bg-transparent text-[#FF7043] hover:text-[#F4511E] dark:text-[#FF7043] dark:hover:text-[#F4511E] underline-offset-4 hover:underline p-0 h-auto font-medium focus:ring-0',
    };

    const sizeStyles: Record<ButtonSize, string> = {
      // Compact: ~36px height
      sm: 'h-9 min-h-[36px] px-3.5 text-xs sm:text-sm font-medium rounded-lg gap-1.5',
      // Standard: ~40px height
      md: 'h-10 min-h-[40px] px-4 text-sm font-semibold rounded-xl gap-2',
      // Large / Important: ~44px height
      lg: 'h-11 min-h-[44px] px-5 sm:px-6 text-sm sm:text-base font-semibold rounded-xl gap-2.5',
      // Icon sizes
      'icon-xs': 'h-8 w-8 min-h-[32px] min-w-[32px] p-0 rounded-lg',
      'icon-sm': 'h-9 w-9 min-h-[36px] min-w-[36px] p-0 rounded-lg',
      icon: 'h-10 w-10 min-h-[40px] min-w-[40px] p-0 rounded-xl',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading}
        className={cn(
          'inline-flex items-center justify-center transition-all select-none whitespace-nowrap',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#0B1220]',
          'disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99] disabled:active:scale-100',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
            <span>{loadingText || children || 'Please wait...'}</span>
          </span>
        ) : (
          <span className="inline-flex items-center justify-center gap-1.5">
            {leftIcon && <span className="shrink-0 inline-flex items-center">{leftIcon}</span>}
            {children && <span className="inline-flex items-center">{children}</span>}
            {rightIcon && <span className="shrink-0 inline-flex items-center">{rightIcon}</span>}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
