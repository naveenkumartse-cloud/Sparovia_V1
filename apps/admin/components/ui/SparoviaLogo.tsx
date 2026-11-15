'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface SparoviaLogoProps {
  /**
   * Sizing profile:
   * - 'auth': Standard sizing for Login and Register pages (~44px height)
   * - 'sidebar': Compact sizing for expanded sidebar and mobile drawer (~32px height)
   * - 'collapsed': Square/icon fitting for collapsed sidebar navigation
   * - 'sm' | 'md' | 'lg': General utility sizes
   */
  size?: 'auth' | 'sidebar' | 'collapsed' | 'sm' | 'md' | 'lg';
  className?: string;
  showAdminBadge?: boolean;
  priority?: boolean;
}

const SIZE_CONFIGS = {
  auth: {
    height: 44,
    width: 133,
    imageClass: 'h-11 w-auto max-w-[170px]',
  },
  sidebar: {
    height: 32,
    width: 96,
    imageClass: 'h-8 w-auto max-w-[130px]',
  },
  collapsed: {
    height: 32,
    width: 32,
    imageClass: 'h-8 w-8',
  },
  sm: {
    height: 24,
    width: 72,
    imageClass: 'h-6 w-auto',
  },
  md: {
    height: 36,
    width: 108,
    imageClass: 'h-9 w-auto',
  },
  lg: {
    height: 52,
    width: 156,
    imageClass: 'h-13 w-auto',
  },
};

/**
 * Shared Sparovia Platform Logo Component
 * - Single source of truth for Sparovia platform branding
 * - Preserves approved 3.015:1 aspect ratio with object-contain
 * - Renders the approved platform logo asset (/images/sparovia-logo.png)
 * - Retains clean typography and sharp rendering across high-DPI displays
 */
export function SparoviaLogo({
  size = 'sidebar',
  className,
  showAdminBadge = false,
  priority = true,
}: SparoviaLogoProps) {
  const config = SIZE_CONFIGS[size] || SIZE_CONFIGS.sidebar;

  if (size === 'collapsed') {
    return (
      <div
        className={cn(
          'w-10 h-10 rounded-[6px] bg-[#315FEA]/10 dark:bg-[#315FEA]/20 border border-[#315FEA]/30 flex items-center justify-center p-1.5 transition-colors',
          className
        )}
        title="Sparovia Admin"
      >
        <Image
          src="/images/sparovia-logo.png"
          alt="Sparovia"
          width={config.width}
          height={config.height}
          priority={priority}
          className="w-full h-full object-contain select-none"
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div className={cn('inline-flex items-center gap-2 select-none', className)}>
      <div className="relative flex items-center">
        <Image
          src="/images/sparovia-logo.png"
          alt="Sparovia Platform"
          width={config.width}
          height={config.height}
          priority={priority}
          className={cn(
            'object-contain select-none transition-transform',
            config.imageClass
          )}
          draggable={false}
        />
      </div>

      {showAdminBadge && (
        <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-[4px] bg-[#315FEA]/10 text-[#315FEA] dark:text-[#608FFE] border border-[#315FEA]/20 shrink-0">
          ADMIN
        </span>
      )}
    </div>
  );
}
