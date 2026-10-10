'use client';

import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant =
  | 'primary'
  | 'cobalt'
  | 'enhance'
  | 'studio'
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
        'bg-[#315FEA] hover:bg-[#254EDB] active:bg-[#1E40AF] text-white shadow-xs hover:shadow-subtle focus:ring-[#1D4ED8] border border-transparent',
      cobalt:
        'bg-[#315FEA] hover:bg-[#254EDB] active:bg-[#1E40AF] text-white shadow-xs hover:shadow-subtle focus:ring-[#1D4ED8] border border-transparent',
      enhance:
        'bg-[#315FEA] hover:bg-[#254EDB] active:bg-[#1E40AF] text-white shadow-xs focus:ring-[#1D4ED8] border border-transparent',
      studio:
        'bg-gradient-to-r from-[#315FEA] to-[#7950B8] hover:from-[#254EDB] hover:to-[#683FA4] active:from-[#1E40AF] active:to-[#58338E] text-white shadow-xs hover:shadow-subtle focus:ring-[#315FEA] border border-transparent transition-all duration-200 motion-reduce:transition-none',
      secondary:
        'bg-[#F3F6FA] hover:bg-[#E3E7ED] dark:bg-[#1E293B] dark:hover:bg-[#334155] text-[#172033] dark:text-slate-100 border border-[#E3E7ED] dark:border-[#334155] focus:ring-[#1D4ED8]',
      outline:
        'bg-white dark:bg-[#0F172A] hover:bg-[#F3F6FA] dark:hover:bg-[#1E293B] text-[#172033] dark:text-slate-200 border border-[#CBD5E1] dark:border-[#334155] focus:ring-[#1D4ED8] shadow-xs',
      ghost:
        'bg-transparent hover:bg-[#F3F6FA] dark:hover:bg-[#1E293B] text-[#475569] hover:text-[#172033] dark:text-slate-400 dark:hover:text-white focus:ring-[#1D4ED8]',
      danger:
        'bg-[#B91C1C] hover:bg-[#991B1B] active:bg-[#7F1D1D] text-white shadow-xs focus:ring-[#B91C1C] border border-transparent',
      destructive:
        'bg-[#B91C1C] hover:bg-[#991B1B] active:bg-[#7F1D1D] text-white shadow-xs focus:ring-[#B91C1C] border border-transparent',
      'destructive-outline':
        'bg-white dark:bg-[#0F172A] hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[#B91C1C] dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 focus:ring-[#B91C1C]',
      success:
        'bg-[#15803D] hover:bg-[#166534] active:bg-[#14532D] text-white shadow-xs focus:ring-[#15803D] border border-transparent',
      link:
        'bg-transparent hover:bg-transparent text-[#315FEA] hover:text-[#254EDB] dark:text-[#315FEA] dark:hover:text-[#254EDB] underline-offset-4 hover:underline p-0 h-auto font-medium focus:ring-0',
    };

    const sizeStyles: Record<ButtonSize, string> = {
      // Compact: ~36px height, 6px radius (radius.control)
      sm: 'h-9 min-h-[36px] px-3.5 text-xs sm:text-sm font-medium rounded-[6px] gap-1.5',
      // Standard: ~40px height, 6px radius (radius.control)
      md: 'h-10 min-h-[40px] px-4 text-sm font-semibold rounded-[6px] gap-2',
      // Large / Important: ~44px height, 6px radius (radius.control)
      lg: 'h-11 min-h-[44px] px-5 sm:px-6 text-sm sm:text-base font-semibold rounded-[6px] gap-2.5',
      // Icon sizes with 6px radius (radius.control)
      'icon-xs': 'h-8 w-8 min-h-[32px] min-w-[32px] p-0 rounded-[6px]',
      'icon-sm': 'h-9 w-9 min-h-[36px] min-w-[36px] p-0 rounded-[6px]',
      icon: 'h-10 w-10 min-h-[40px] min-w-[40px] p-0 rounded-[6px]',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading}
        className={cn(
          'inline-flex items-center justify-center transition-all select-none whitespace-nowrap',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0B1220]',
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
