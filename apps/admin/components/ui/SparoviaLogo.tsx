'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { SparoviaLogoLoader } from './SparoviaLogoLoader';

export interface SparoviaLogoProps {
  /**
   * Sizing profile:
   * - 'auth': Prominent horizontal logo for Login, Register, Forgot Password, Reset Password, and Verify pages (~48-56px height)
   * - 'sidebar': Proportional horizontal logo for expanded sidebar and mobile drawer (~32-36px height)
   * - 'collapsed': Preserves complete logo fitting cleanly in collapsed sidebar rail without any background container
   * - 'loader': Prominent horizontal logo for workspace loading animations and route navigation loaders (~48-56px height)
   * - 'sm' | 'md' | 'lg': General utility sizes
   */
  size?: 'auth' | 'sidebar' | 'collapsed' | 'loader' | 'sm' | 'md' | 'lg';
  className?: string;
  showAdminBadge?: boolean;
  priority?: boolean;
  /** Whether to render the 7-stage animated logo loader */
  animated?: boolean;
}

const SIZE_CONFIGS = {
  auth: {
    height: 56,
    width: 168,
    imageClass: 'h-12 sm:h-14 w-auto max-w-[210px]',
  },
  sidebar: {
    height: 53,
    width: 160,
    imageClass: 'h-8 sm:h-9 w-auto max-w-[160px]',
  },
  collapsed: {
    height: 18,
    width: 54,
    imageClass: 'w-full h-auto max-h-7',
  },
  loader: {
    height: 56,
    width: 168,
    imageClass: 'h-12 sm:h-14 w-auto max-w-[220px]',
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
    height: 56,
    width: 168,
    imageClass: 'h-14 w-auto',
  },
};

/**
 * Shared Sparovia Platform Logo Component
 * - Single source of truth for Sparovia platform branding
 * - Renders the official approved transparent platform logo (/images/logo.png)
 * - Preserves exact 3:1 aspect ratio with object-contain
 * - Sits directly on the existing application background with zero background containers, cards, or borders
 * - Retains full PNG alpha transparency and sharp rendering across high-DPI displays
 */
export function SparoviaLogo({
  size = 'sidebar',
  className,
  showAdminBadge = false,
  priority = true,
  animated = false,
}: SparoviaLogoProps) {
  const config = SIZE_CONFIGS[size] || SIZE_CONFIGS.sidebar;

  if (size === 'loader' || animated) {
    return (
      <div className={cn('flex flex-col items-center justify-center select-none', className)}>
        <SparoviaLogoLoader
          mode={size === 'loader' ? 'initial' : 'inline'}
          size={size === 'loader' ? 'initial' : (size === 'sm' ? 'sm' : 'md')}
        />
        <span className="sr-only">
          <Image
            src="/images/logo.png"
            alt="Sparovia - Business Experience Platform"
            width={config.width}
            height={config.height}
            priority={priority}
            className="object-contain"
          />
        </span>
      </div>
    );
  }

  if (size === 'collapsed') {
    return (
      <div
        className={cn(
          'w-12 h-10 flex items-center justify-center p-0.5 select-none bg-transparent',
          className
        )}
        title="Sparovia Admin"
      >
        <Image
          src="/images/logo.png"
          alt="Sparovia - Business Experience Platform"
          width={config.width}
          height={config.height}
          priority={priority}
          className="w-full h-auto max-h-7 object-contain select-none"
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div className={cn('inline-flex items-center gap-2 select-none', className)}>
      <div className="relative flex items-center">
        <Image
          src="/images/logo.png"
          alt="Sparovia - Business Experience Platform"
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
