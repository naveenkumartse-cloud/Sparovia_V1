'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

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
        'bg-[#FF7043] hover:bg-[#F4511E] text-white shadow-lg shadow-[#FF7043]/20 focus:ring-[#FF7043]',
      secondary:
        'bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#334155] text-slate-900 dark:text-white border border-slate-200 dark:border-[#334155] focus:ring-[#3B82F6]',
      outline:
        'bg-transparent hover:bg-slate-50 dark:hover:bg-[#1E293B] text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-[#334155] focus:ring-[#3B82F6]',
      ghost:
        'bg-transparent hover:bg-slate-100 dark:hover:bg-[#1E293B] text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white focus:ring-[#3B82F6]',
      danger:
        'bg-red-600 hover:bg-red-700 text-white shadow-sm focus:ring-red-500',
    };

    const sizeStyles: Record<ButtonSize, string> = {
      sm: 'py-1.5 px-3 text-xs rounded-lg gap-1.5',
      md: 'py-2.5 px-5 text-sm rounded-xl gap-2',
      lg: 'py-3 px-6 text-base rounded-xl gap-2.5',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-all select-none',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#0B1220]',
          'active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
            <span
              className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin shrink-0"
              aria-hidden="true"
            />
            <span>{loadingText || 'Please wait...'}</span>
          </span>
        ) : (
          <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
            {leftIcon && <span className="shrink-0 inline-flex items-center">{leftIcon}</span>}
            <span className="inline-flex items-center gap-1.5">{children}</span>
            {rightIcon && <span className="shrink-0 inline-flex items-center">{rightIcon}</span>}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
