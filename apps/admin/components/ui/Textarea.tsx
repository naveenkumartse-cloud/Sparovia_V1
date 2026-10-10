import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  enableSpellCheck?: boolean;
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
      ...props
    },
    ref
  ) => {
    const isSpellCheckActive = spellCheck !== undefined ? Boolean(spellCheck) : enableSpellCheck;

    return (
      <textarea
        ref={ref}
        spellCheck={isSpellCheckActive}
        autoCorrect={isSpellCheckActive ? (autoCorrect ?? 'on') : (autoCorrect ?? 'off')}
        autoCapitalize={isSpellCheckActive ? (autoCapitalize ?? 'sentences') : autoCapitalize}
        lang={isSpellCheckActive ? (lang ?? 'en') : lang}
        className={cn(
          'w-full bg-white dark:bg-[#0B1220] border border-[#CBD5E1] dark:border-[#334155] rounded-[6px] px-3.5 py-2.5 text-[#172033] dark:text-white placeholder-[#64748B] text-sm focus:outline-none focus:border-[#315FEA] focus:ring-1 focus:ring-[#315FEA] transition-colors leading-relaxed',
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
