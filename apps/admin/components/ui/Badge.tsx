'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant =
  | 'neutral'
  | 'brand'
  | 'cobalt'
  | 'purple'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'error'
  | 'outline'
  | 'whatsapp';

export type BadgeSize = 'xs' | 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  dotPulse?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  neutral:
    'bg-[#F3F6FA] dark:bg-[#1E293B] text-[#475569] dark:text-[#94A3B8] border-[#E3E7ED] dark:border-[#334155]',
  brand:
    'bg-[#315FEA]/10 text-[#315FEA] dark:text-[#6085FF] border-[#315FEA]/20',
  cobalt:
    'bg-[#315FEA]/10 text-[#315FEA] dark:text-[#6085FF] border-[#315FEA]/20',
  purple:
    'bg-[#7950B8]/10 text-[#7950B8] dark:text-[#A78BFA] border-[#7950B8]/20',
  success:
    'bg-[#15803D]/10 text-[#15803D] dark:text-emerald-400 border-[#15803D]/20',
  warning:
    'bg-[#B45309]/10 text-[#B45309] dark:text-amber-400 border-[#B45309]/20',
  destructive:
    'bg-[#B91C1C]/10 text-[#B91C1C] dark:text-rose-400 border-[#B91C1C]/20',
  error:
    'bg-[#B91C1C]/10 text-[#B91C1C] dark:text-rose-400 border-[#B91C1C]/20',
  outline:
    'bg-transparent text-[#475569] dark:text-[#94A3B8] border-[#CBD5E1] dark:border-[#334155]',
  whatsapp:
    'bg-[#25D366]/10 text-[#128C7E] dark:text-[#25D366] border-[#25D366]/20',
};

const dotColors: Record<BadgeVariant, string> = {
  neutral: 'bg-slate-400',
  brand: 'bg-[#315FEA]',
  cobalt: 'bg-[#315FEA]',
  purple: 'bg-[#7950B8]',
  success: 'bg-[#15803D]',
  warning: 'bg-[#B45309]',
  destructive: 'bg-[#B91C1C]',
  error: 'bg-[#B91C1C]',
  outline: 'bg-slate-400',
  whatsapp: 'bg-[#25D366]',
};

export function Badge({
  variant = 'neutral',
  size = 'md',
  dot = false,
  dotPulse = false,
  icon,
  children,
  className,
  ...props
}: BadgeProps) {
  const sizeStyles: Record<BadgeSize, string> = {
    xs: 'px-1.5 py-0.5 text-[10px] font-semibold gap-1',
    sm: 'px-2 py-0.5 text-[11px] font-semibold gap-1.5',
    md: 'px-2.5 py-0.5 text-xs font-semibold gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-[4px] border font-sans select-none whitespace-nowrap leading-normal shrink-0 transition-colors',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            dotColors[variant],
            dotPulse && 'animate-pulse'
          )}
          aria-hidden="true"
        />
      )}
      {icon && <span className="shrink-0 inline-flex items-center">{icon}</span>}
      {children && <span>{children}</span>}
    </span>
  );
}
