import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  enableSpellCheck?: boolean;
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
      ...props
    },
    ref
  ) => {
    const isTextType = type === 'text' || type === 'search' || !type;
    const isSpellCheckActive =
      enableSpellCheck ?? (spellCheck === true || (spellCheck === undefined && isTextType));

    return (
      <input
        ref={ref}
        type={type}
        spellCheck={isSpellCheckActive}
        autoCorrect={isSpellCheckActive ? (autoCorrect ?? 'on') : (autoCorrect ?? 'off')}
        autoCapitalize={isSpellCheckActive ? (autoCapitalize ?? 'sentences') : autoCapitalize}
        lang={isSpellCheckActive ? (lang ?? 'en') : lang}
        className={cn(
          'w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-colors',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
