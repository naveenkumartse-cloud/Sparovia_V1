'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  badge?: React.ReactNode;
  category?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  category,
  backHref,
  backLabel = 'Back',
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 pb-6 border-b border-[#E3E7ED] dark:border-[#1E293B]',
        'sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center text-xs font-semibold text-[#475569] dark:text-[#94A3B8] hover:text-[#315FEA] dark:hover:text-[#608FFE] transition-colors mb-1 gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>{backLabel}</span>
          </Link>
        )}

        {category && (
          <p className="text-xs font-semibold uppercase tracking-wider text-[#315FEA] dark:text-[#608FFE]">
            {category}
          </p>
        )}

        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#172033] dark:text-white tracking-tight">
            {title}
          </h1>
          {badge && <div className="inline-flex items-center shrink-0">{badge}</div>}
        </div>

        {description && (
          <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8] leading-relaxed max-w-3xl">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap shrink-0 self-start sm:self-center w-full sm:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
