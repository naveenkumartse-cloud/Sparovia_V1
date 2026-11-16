'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { SparoviaLogoLoader } from './SparoviaLogoLoader';

/**
 * Authoritative Master Asset Path with Version Query to Prevent Browser/CDN Caching
 * Master Asset Dimensions: 2172 x 724 px (Natural 3:1 aspect ratio, Truecolor RGBA transparent)
 */
export const SPAROVIA_LOGO_URL = '/images/logo.png?v=20261116-master';

export interface SparoviaLogoProps {
  /**
   * Sizing profile:
   * - 'auth': Prominent horizontal logo for Login, Register, Forgot Password, Reset Password, and Verify pages (width ~260-300px)
   * - 'sidebar': Proportional horizontal logo for expanded sidebar and mobile drawer (width ~180-200px)
   * - 'header': Proportional horizontal logo for mobile/tablet top header (width ~150-170px)
   * - 'collapsed': Scaled wordmark for collapsed sidebar rail (width ~48px)
   * - 'loader': Prominent horizontal logo for workspace loading animations (width ~260-300px)
   * - 'sm' | 'md' | 'lg': General utility sizes
   */
  size?: 'auth' | 'sidebar' | 'header' | 'collapsed' | 'loader' | 'sm' | 'md' | 'lg';
  className?: string;
  showAdminBadge?: boolean;
  priority?: boolean;
  /** Whether to render the 7-stage animated logo loader */
  animated?: boolean;
  /** Force a crisp light/white surface background around the logo (prevents dark tagline on dark backgrounds) */
  surface?: 'auto' | 'white' | 'transparent';
}

const SIZE_CONFIGS = {
  auth: {
    containerClass: 'w-[260px] sm:w-[300px]',
  },
  sidebar: {
    containerClass: 'w-[185px] sm:w-[200px]',
  },
  header: {
    containerClass: 'w-[150px] sm:w-[170px]',
  },
  collapsed: {
    containerClass: 'w-12',
  },
  loader: {
    containerClass: 'w-[260px] sm:w-[300px]',
  },
  sm: {
    containerClass: 'w-[130px]',
  },
  md: {
    containerClass: 'w-[185px]',
  },
  lg: {
    containerClass: 'w-[280px]',
  },
};

/**
 * Shared Sparovia Platform Logo Component
 * - Single source of truth for Sparovia platform branding
 * - Renders the official approved transparent platform logo (/images/logo.png?v=20261116-master)
 * - Uses width: 100%, height: auto, object-fit: contain
 * - Preserves natural 3:1 aspect ratio with zero fractional distortion
 * - Eliminates CSS transform layers that cause subpixel blur
 * - Protects dark tagline contrast on dark surfaces via optional white surface containment
 */
export function SparoviaLogo({
  size = 'sidebar',
  className,
  showAdminBadge = false,
  priority = true,
  animated = false,
  surface = 'auto',
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
            src={SPAROVIA_LOGO_URL}
            alt="Sparovia - Business Experience Platform"
            width={2172}
            height={724}
            priority={priority}
            unoptimized={true}
            className="w-full h-auto object-contain"
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
          src={SPAROVIA_LOGO_URL}
          alt="Sparovia - Business Experience Platform"
          width={2172}
          height={724}
          priority={priority}
          unoptimized={true}
          className="w-full h-auto max-h-7 object-contain select-none"
          draggable={false}
          style={{
            aspectRatio: '2172 / 724',
            imageRendering: '-webkit-optimize-contrast',
          }}
        />
      </div>
    );
  }

  const surfaceClasses =
    surface === 'white'
      ? 'bg-white p-2 sm:p-2.5 rounded-[8px] shadow-soft-xs border border-[#E3E7ED]'
      : surface === 'auto'
      ? 'bg-transparent dark:bg-white dark:px-2.5 dark:py-1.5 dark:rounded-[8px] dark:shadow-soft-xs'
      : 'bg-transparent';

  return (
    <div className={cn('inline-flex items-center gap-2.5 select-none', surfaceClasses, className)}>
      <div className={cn('relative flex items-center shrink-0', config.containerClass)}>
        <Image
          src={SPAROVIA_LOGO_URL}
          alt="Sparovia - Business Experience Platform"
          width={2172}
          height={724}
          priority={priority}
          unoptimized={true}
          className="w-full h-auto object-contain block select-none"
          draggable={false}
          style={{
            aspectRatio: '2172 / 724',
            imageRendering: '-webkit-optimize-contrast',
          }}
        />
      </div>

      {showAdminBadge && (
        <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-[4px] bg-[#315FEA]/10 text-[#315FEA] dark:text-[#315FEA] border border-[#315FEA]/20 shrink-0">
          ADMIN
        </span>
      )}
    </div>
  );
}
