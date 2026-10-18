import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  enableSpellCheck?: boolean;
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      enableSpellCheck,
      spellCheck,
      autoCorrect,
      autoCapitalize,
      lang,
      hasError = false,
      ...props
    },
    ref
  ) => {
    const isTextType = type === 'text' || type === 'search' || !type;
    const isSpellCheckActive =
      enableSpellCheck ?? (spellCheck === true || (spellCheck === undefined && isTextType));
    const isInvalid = hasError || props['aria-invalid'] === true || props['aria-invalid'] === 'true';

    return (
      <input
        ref={ref}
        type={type}
        spellCheck={isSpellCheckActive}
        autoCorrect={isSpellCheckActive ? (autoCorrect ?? 'on') : (autoCorrect ?? 'off')}
        autoCapitalize={isSpellCheckActive ? (autoCapitalize ?? 'sentences') : autoCapitalize}
        lang={isSpellCheckActive ? (lang ?? 'en') : lang}
        aria-invalid={isInvalid ? true : undefined}
        className={cn(
          'w-full min-h-[40px] bg-white dark:bg-[#0B1220] rounded-[6px] px-3.5 py-2 text-[#172033] dark:text-white placeholder-[#64748B] text-sm transition-colors',
          'focus:outline-none disabled:opacity-50 disabled:bg-[#F3F6FA] dark:disabled:bg-[#1E293B] disabled:cursor-not-allowed',
          isInvalid
            ? 'border border-[#B91C1C] focus:border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/20'
            : 'border border-[#CBD5E1] dark:border-[#334155] focus:border-[#315FEA] focus:ring-2 focus:ring-[#1D4ED8]/20',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
