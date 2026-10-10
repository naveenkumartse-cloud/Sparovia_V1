'use client';

import React from 'react';
import { InfoTooltip } from './InfoTooltip';
import { cn } from '@/lib/utils';

export interface FormFieldProps {
  id?: string;
  label: string;
  required?: boolean;
  tooltip?: string;
  error?: string;
  helperText?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  labelClassName?: string;
}

export function FormField({
  id,
  label,
  required = false,
  tooltip,
  error,
  helperText,
  action,
  children,
  className,
  labelClassName,
}: FormFieldProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <label
            htmlFor={id}
            className={cn(
              'block text-xs sm:text-sm font-medium text-[#172033] dark:text-[#E2E8F0] select-none break-words',
              labelClassName
            )}
          >
            {label}
            {required && (
              <span className="text-[#B91C1C] ml-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
          {tooltip && <InfoTooltip content={tooltip} />}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      <div>{children}</div>

      {helperText && !error && (
        <p className="mt-1 text-xs text-[#475569] dark:text-[#94A3B8] leading-tight">
          {helperText}
        </p>
      )}

      {error && (
        <p
          id={id ? `${id}-error` : undefined}
          role="alert"
          className="mt-1.5 text-xs font-medium text-[#B91C1C] dark:text-red-400 flex items-center gap-1"
        >
          {error}
        </p>
      )}
    </div>
  );
}
