'use client';

import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  sizeVariant?: 'sm' | 'md';
  hasError?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, sizeVariant = 'md', hasError = false, children, disabled, ...props }, ref) => {
    const isInvalid = hasError || props['aria-invalid'] === true || props['aria-invalid'] === 'true';

    return (
      <div className="relative w-full">
        <select
          ref={ref}
          disabled={disabled}
          aria-invalid={isInvalid ? true : undefined}
          className={cn(
            'w-full bg-white dark:bg-[#0B1220] rounded-[6px] px-3.5 pr-9 text-[#172033] dark:text-white text-sm transition-colors appearance-none cursor-pointer select-none',
            'focus:outline-none disabled:opacity-50 disabled:bg-[#F3F6FA] dark:disabled:bg-[#1E293B] disabled:cursor-not-allowed',
            sizeVariant === 'sm' ? 'h-9 min-h-[36px] text-xs py-1.5' : 'h-10 min-h-[40px] text-sm py-2',
            isInvalid
              ? 'border border-[#B91C1C] focus:border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/20'
              : 'border border-[#CBD5E1] dark:border-[#334155] focus:border-[#315FEA] focus:ring-2 focus:ring-[#1D4ED8]/20',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#64748B] dark:text-[#94A3B8]">
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
