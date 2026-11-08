'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type StatusType =
  | 'active'
  | 'inactive'
  | 'published'
  | 'draft'
  | 'pending'
  | 'new'
  | 'error'
  | 'success'
  | 'warning';

export interface StatusIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusType;
  label?: string;
  pulse?: boolean;
}

export function StatusIndicator({
  status,
  label,
  pulse = false,
  className,
  ...props
}: StatusIndicatorProps) {
  const statusStyles: Record<StatusType, { dot: string; text: string; defaultLabel: string }> = {
    active: {
      dot: 'bg-[#15803D]',
      text: 'text-[#15803D] dark:text-emerald-400',
      defaultLabel: 'Active',
    },
    published: {
      dot: 'bg-[#15803D]',
      text: 'text-[#15803D] dark:text-emerald-400',
      defaultLabel: 'Live / Published',
    },
    success: {
      dot: 'bg-[#15803D]',
      text: 'text-[#15803D] dark:text-emerald-400',
      defaultLabel: 'Success',
    },
    pending: {
      dot: 'bg-[#B45309]',
      text: 'text-[#B45309] dark:text-amber-400',
      defaultLabel: 'Pending',
    },
    draft: {
      dot: 'bg-[#B45309]',
      text: 'text-[#B45309] dark:text-amber-400',
      defaultLabel: 'Draft Changes',
    },
    warning: {
      dot: 'bg-[#B45309]',
      text: 'text-[#B45309] dark:text-amber-400',
      defaultLabel: 'Warning',
    },
    new: {
      dot: 'bg-[#315FEA]',
      text: 'text-[#315FEA] dark:text-[#608FFE]',
      defaultLabel: 'New',
    },
    error: {
      dot: 'bg-[#B91C1C]',
      text: 'text-[#B91C1C] dark:text-rose-400',
      defaultLabel: 'Error',
    },
    inactive: {
      dot: 'bg-slate-400',
      text: 'text-[#64748B] dark:text-[#94A3B8]',
      defaultLabel: 'Inactive',
    },
  };

  const current = statusStyles[status] || statusStyles.inactive;
  const displayLabel = label || current.defaultLabel;

  return (
    <span
      className={cn('inline-flex items-center gap-1.5 text-xs font-semibold select-none', current.text, className)}
      {...props}
    >
      <span
        className={cn(
          'w-2 h-2 rounded-full shrink-0',
          current.dot,
          pulse && 'animate-pulse'
        )}
        aria-hidden="true"
      />
      <span>{displayLabel}</span>
    </span>
  );
}
