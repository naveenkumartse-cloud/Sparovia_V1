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
          'w-full bg-white dark:bg-[#0B1220] border border-[#CBD5E1] dark:border-[#334155] rounded-[6px] px-3.5 py-2 text-[#172033] dark:text-white placeholder-[#64748B] text-sm focus:outline-none focus:border-[#315FEA] focus:ring-1 focus:ring-[#315FEA] transition-colors',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
