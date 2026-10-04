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
          'w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-colors leading-relaxed',
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
