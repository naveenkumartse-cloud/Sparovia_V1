'use client';

import React, { useId } from 'react';
import { cn } from '@/lib/utils';

export interface SparoviaLogoLoaderProps {
  /**
   * Mode:
   * - 'initial': Prominent centered full loader for initial application startup
   * - 'navigation': Compact subtle non-intrusive loader for route transitions and menu navigation
   * - 'inline': Embedded loader for containers and cards
   */
  mode?: 'initial' | 'navigation' | 'inline';

  /**
   * Size presets or numeric pixel width:
   * - 'initial': ~112px
   * - 'navigation': ~32px
   * - 'sm': ~24px
   * - 'md': ~44px
   * - 'lg': ~72px
   * - 'xl': ~112px
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'navigation' | 'initial' | number;

  /** Optional accessible status text */
  statusText?: string;

  /** Whether to visually render the status label below or beside */
  showStatusText?: boolean;

  /** Custom container class */
  className?: string;

  /** Force reduced motion (static logo) */
  reducedMotion?: boolean;
}

const SIZE_MAP = {
  sm: { width: 24, height: 25, strokeWidth: 4.2 },
  navigation: { width: 32, height: 34, strokeWidth: 3.6 },
  md: { width: 44, height: 46, strokeWidth: 3.2 },
  lg: { width: 72, height: 75, strokeWidth: 2.6 },
  initial: { width: 112, height: 117, strokeWidth: 2.2 },
  xl: { width: 128, height: 134, strokeWidth: 2.2 },
};

// Official Sparovia Logo Mark Vector Geometry (100% matched to approved platform logo asset)
const PATH_D0 = 'M 259 0 L 279 2 L 288 5 L 305 15 L 397 79 L 402 86 L 402 96 L 398 102 L 329 151 L 319 151 L 315 149 L 270 117 L 262 114 L 259 115 L 138 197 L 136 205 L 140 210 L 219 262 L 227 262 L 238 255 L 514 50 L 519 48 L 525 49 L 528 51 L 530 58 L 528 63 L 518 75 L 437 169 L 304 317 L 235 388 L 228 391 L 217 391 L 199 381 L 26 262 L 13 249 L 5 236 L 0 221 L 0 200 L 9 176 L 17 165 L 28 155 L 187 43 L 231 10 L 245 3 L 259 0 Z';
const PATH_D1 = 'M 374 277 L 385 277 L 391 280 L 445 316 L 463 330 L 473 346 L 478 362 L 478 379 L 473 397 L 462 415 L 450 426 L 271 537 L 250 548 L 237 551 L 223 551 L 208 548 L 196 543 L 19 429 L 13 425 L 8 418 L 7 410 L 13 401 L 84 348 L 94 346 L 109 354 L 226 431 L 233 435 L 240 436 L 346 369 L 347 364 L 343 360 L 325 351 L 321 347 L 319 341 L 320 335 L 335 316 L 374 277 Z';

/**
 * SparoviaLogoLoader
 * Production-ready 7-stage animated logo loader system for Sparovia.
 * 
 * Implements the 7-stage sequence from reference storyboard (09-logo-skeleton-loader-sequence.png):
 * 1. Outline (Initial)
 * 2. Light Start (Top)
 * 3. Tracing Path
 * 4. Half Complete
 * 5. Almost Complete
 * 6. Full Glow Moments
 * 7. Loop (Back to Outline)
 */
export function SparoviaLogoLoader({
  mode = 'initial',
  size,
  statusText,
  showStatusText = false,
  className,
  reducedMotion = false,
}: SparoviaLogoLoaderProps) {
  const uniqueId = useId().replace(/:/g, '');

  const effectivePreset = size
    ? (typeof size === 'string' ? size : 'initial')
    : (mode === 'navigation' ? 'navigation' : 'initial');

  const config = typeof size === 'number'
    ? { width: size, height: Math.round(size * 1.045), strokeWidth: size <= 40 ? 3.6 : 2.4 }
    : (SIZE_MAP[effectivePreset] || SIZE_MAP.initial);

  const defaultStatus = mode === 'navigation' ? 'Navigating...' : 'Loading Sparovia...';
  const label = statusText || defaultStatus;

  const gradTraceD0 = `traceGradD0_${uniqueId}`;
  const gradTraceD1 = `traceGradD1_${uniqueId}`;
  const gradFull = `sparoviaFullGrad_${uniqueId}`;

  // Glow halo diameter proportional to icon size
  const haloSize = Math.round(config.width * 1.35);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn(
        'select-none inline-flex flex-col items-center justify-center',
        mode === 'initial' && 'p-4',
        mode === 'navigation' && 'shrink-0',
        className
      )}
    >
      <div
        className={cn(
          'relative flex items-center justify-center shrink-0',
          reducedMotion ? 'sparovia-loader-reduced' : 'sparovia-loader-active'
        )}
        style={{ width: config.width, height: config.height }}
      >
        {/* Stage 4-6 Ambient Violet / Cyan Glow Aura */}
        {!reducedMotion && (
          <div
            className="sparovia-loader-aura absolute rounded-full pointer-events-none"
            style={{
              width: haloSize,
              height: haloSize,
              background: 'radial-gradient(circle, rgba(168, 85, 247, 0.45) 0%, rgba(0, 229, 255, 0.22) 48%, transparent 72%)',
              filter: config.width >= 60 ? 'blur(20px)' : 'blur(10px)',
            }}
            aria-hidden="true"
          />
        )}

        <svg
          viewBox="-20 -20 570 595"
          width={config.width}
          height={config.height}
          className="sparovia-loader-svg overflow-visible relative z-10"
          aria-hidden="true"
        >
          <defs>
            {/* Tracing Stroke Gradient for Upper Ribbon D0 */}
            <linearGradient id={gradTraceD0} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00E5FF" />
              <stop offset="50%" stopColor="#315FEA" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>

            {/* Tracing Stroke Gradient for Lower Ribbon D1 */}
            <linearGradient id={gradTraceD1} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#315FEA" />
              <stop offset="55%" stopColor="#7950B8" />
              <stop offset="100%" stopColor="#D946EF" />
            </linearGradient>

            {/* Full Radiant Cyan-to-Purple Gradient Fill (Stages 4-6) */}
            <linearGradient id={gradFull} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00E5FF" />
              <stop offset="35%" stopColor="#315FEA" />
              <stop offset="70%" stopColor="#7950B8" />
              <stop offset="100%" stopColor="#D946EF" />
            </linearGradient>
          </defs>

          {/* Stage 1 Outline (Skeleton Frame - persists as structural guide) */}
          <g className="sparovia-loader-outline-group">
            <path
              className="sparovia-loader-outline text-[#BAC4F9] dark:text-[#608FFE]"
              stroke="currentColor"
              strokeWidth={config.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              d={PATH_D0}
            />
            <path
              className="sparovia-loader-outline text-[#BAC4F9] dark:text-[#608FFE]"
              stroke="currentColor"
              strokeWidth={config.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              d={PATH_D1}
            />
          </g>

          {/* Stages 4, 5, 6, 7: Radiant Cyan-to-Purple Gradient Fill Layer */}
          <g className="sparovia-loader-fill" style={{ fill: `url(#${gradFull})` }}>
            <path d={PATH_D0} />
            <path d={PATH_D1} />
          </g>

          {/* Stages 2, 3, 4: Illuminated Tracing Strokes */}
          {!reducedMotion && (
            <g className="sparovia-loader-trace-group">
              <path
                className="sparovia-loader-trace sparovia-trace-d0"
                stroke={`url(#${gradTraceD0})`}
                strokeWidth={config.strokeWidth * 1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                strokeDasharray="2100"
                d={PATH_D0}
              />
              <path
                className="sparovia-loader-trace sparovia-trace-d1"
                stroke={`url(#${gradTraceD1})`}
                strokeWidth={config.strokeWidth * 1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                strokeDasharray="1300"
                d={PATH_D1}
              />
            </g>
          )}
        </svg>
      </div>

      {/* Screen reader only status text for non-visual accessibility */}
      <span className="sr-only">{label}</span>

      {/* Optional visible status text */}
      {showStatusText && (
        <span className="mt-3 text-xs font-medium text-[#475569] dark:text-[#94A3B8] tracking-tight animate-pulse">
          {label}
        </span>
      )}
    </div>
  );
}
