import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  enableSpellCheck?: boolean;
  hasError?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      enableSpellCheck = true,
      spellCheck,
      autoCorrect,
      autoCapitalize,
      lang,
      hasError = false,
      ...props
    },
    ref
  ) => {
    const isSpellCheckActive = spellCheck !== undefined ? Boolean(spellCheck) : enableSpellCheck;
    const isInvalid = hasError || props['aria-invalid'] === true || props['aria-invalid'] === 'true';

    return (
      <textarea
        ref={ref}
        spellCheck={isSpellCheckActive}
        autoCorrect={isSpellCheckActive ? (autoCorrect ?? 'on') : (autoCorrect ?? 'off')}
        autoCapitalize={isSpellCheckActive ? (autoCapitalize ?? 'sentences') : autoCapitalize}
        lang={isSpellCheckActive ? (lang ?? 'en') : lang}
        aria-invalid={isInvalid ? true : undefined}
        className={cn(
          'w-full bg-white dark:bg-[#0B1220] rounded-[6px] px-3.5 py-2.5 text-[#172033] dark:text-white placeholder-[#64748B] text-sm transition-colors leading-relaxed',
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

Textarea.displayName = 'Textarea';
