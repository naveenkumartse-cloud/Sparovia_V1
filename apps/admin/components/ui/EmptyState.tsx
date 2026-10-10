'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'p-8 text-center rounded-[8px] border border-[#E3E7ED] dark:border-[#1E293B]',
        'bg-[#F3F6FA]/50 dark:bg-[#0B1220]/70 transition-colors',
        className
      )}
    >
      {icon && (
        <div className="w-12 h-12 rounded-[6px] bg-[#315FEA]/10 text-[#315FEA] border border-[#315FEA]/20 flex items-center justify-center mx-auto mb-3.5">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-[#172033] dark:text-white">
        {title}
      </h3>
      {description && (
        <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8] mt-1.5 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
