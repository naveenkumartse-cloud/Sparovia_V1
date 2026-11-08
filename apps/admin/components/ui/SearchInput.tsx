'use client';

import React, { forwardRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onClear?: () => void;
  wrapperClassName?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, wrapperClassName, value, onChange, onClear, placeholder = 'Search...', ...props }, ref) => {
    const hasValue = Boolean(value && String(value).length > 0);

    return (
      <div className={cn('relative flex items-center w-full', wrapperClassName)}>
        <span className="absolute left-3.5 text-[#64748B] pointer-events-none">
          <Search className="w-4 h-4" aria-hidden="true" />
        </span>
        <input
          ref={ref}
          type="search"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn(
            'w-full min-h-[40px] h-10 bg-white dark:bg-[#0B1220] rounded-[6px] pl-10 pr-9 py-2 text-sm text-[#172033] dark:text-white placeholder-[#64748B]',
            'border border-[#CBD5E1] dark:border-[#334155] transition-colors',
            'focus:outline-none focus:border-[#315FEA] focus:ring-2 focus:ring-[#1D4ED8]/20',
            'disabled:opacity-50 disabled:bg-[#F3F6FA] dark:disabled:bg-[#1E293B]',
            className
          )}
          {...props}
        />
        {hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2.5 p-1 rounded-[4px] text-[#64748B] hover:text-[#172033] dark:hover:text-white transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
