'use client';

import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant =
  | 'primary'
  | 'cobalt'
  | 'creative'
  | 'purple'
  | 'soft-purple'
  | 'glass'
  | 'enhance'
  | 'studio'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'destructive'
  | 'destructive-outline'
  | 'success'
  | 'warning'
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
        'bg-[#315FEA] hover:bg-[#254EDB] active:bg-[#1E40AF] active:scale-[0.98] text-white shadow-soft-xs hover:shadow-subtle focus:ring-[#1D4ED8] border border-transparent',
      cobalt:
        'bg-[#315FEA] hover:bg-[#254EDB] active:bg-[#1E40AF] active:scale-[0.98] text-white shadow-soft-xs hover:shadow-subtle focus:ring-[#1D4ED8] border border-transparent',
      creative:
        'bg-gradient-to-r from-[#7950B8] to-[#9333EA] hover:from-[#6B3FA8] hover:to-[#7E22CE] active:from-[#581C87] active:to-[#6B21A8] active:scale-[0.98] text-white shadow-soft-xs hover:shadow-[0_4px_16px_rgba(121,80,184,0.35)] focus:ring-[#7950B8] border border-purple-400/30',
      purple:
        'bg-[#7950B8] hover:bg-[#6820AB] active:bg-[#53198A] active:scale-[0.98] text-white shadow-soft-xs hover:shadow-[0_4px_16px_rgba(121,80,184,0.25)] focus:ring-[#7950B8] border border-transparent',
      'soft-purple':
        'bg-[#F0EAFE] hover:bg-[#E4D7FA] active:bg-[#D4BEF7] text-[#7950B8] dark:bg-[#7950B8]/20 dark:hover:bg-[#7950B8]/30 dark:text-[#C4B5FD] border border-[#7950B8]/20 focus:ring-[#7950B8] shadow-soft-xs',
      glass:
        'glass-panel hover:bg-white/95 dark:hover:bg-[#1E293B]/95 active:scale-[0.98] text-[#172033] dark:text-white shadow-soft-xs hover:shadow-subtle focus:ring-[#1D4ED8] border border-white/60 dark:border-white/10',
      enhance:
        'image-studio-enhance-button focus:ring-[#7950B8]',
      studio:
        'image-studio-enhance-button focus:ring-[#7950B8]',
      secondary:
        'bg-[#F3F6FA] hover:bg-[#E3E7ED] dark:bg-[#1E293B] dark:hover:bg-[#334155] text-[#172033] dark:text-slate-100 border border-[#CBD5E1] dark:border-[#334155] focus:ring-[#1D4ED8] shadow-soft-xs',
      outline:
        'bg-white dark:bg-[#0F172A] hover:bg-[#F3F6FA] dark:hover:bg-[#1E293B] text-[#172033] dark:text-slate-200 border border-[#CBD5E1] dark:border-[#334155] focus:ring-[#1D4ED8] shadow-soft-xs',
      ghost:
        'bg-transparent hover:bg-[#F3F6FA] dark:hover:bg-[#1E293B] text-[#475569] hover:text-[#172033] dark:text-slate-400 dark:hover:text-white focus:ring-[#1D4ED8]',
      danger:
        'bg-[#B91C1C] hover:bg-[#991B1B] active:bg-[#7F1D1D] text-white shadow-soft-xs focus:ring-[#B91C1C] border border-transparent',
      destructive:
        'bg-[#B91C1C] hover:bg-[#991B1B] active:bg-[#7F1D1D] text-white shadow-soft-xs focus:ring-[#B91C1C] border border-transparent',
      'destructive-outline':
        'bg-white dark:bg-[#0F172A] hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[#B91C1C] dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 focus:ring-[#B91C1C]',
      success:
        'bg-[#15803D] hover:bg-[#166534] active:bg-[#14532D] text-white shadow-soft-xs focus:ring-[#15803D] border border-transparent',
      warning:
        'bg-[#D97706] hover:bg-[#B45309] active:bg-[#92400E] text-white shadow-soft-xs focus:ring-[#D97706] border border-transparent',
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
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
            {loadingText ? <span>{loadingText}</span> : children}
          </>
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
