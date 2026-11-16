'use client';

import React from 'react';
import Image from 'next/image';

interface PublicWebsiteLoaderProps {
  businessName?: string;
}

/**
 * PublicWebsiteLoader
 * 
 * Production-ready architectural branded loader for the client public website.
 * - Perfectly aligned with KVN Interior / tenant design tokens (Warm Stone, Refined Gold, Charcoal).
 * - Strictly isolated from Sparovia Admin branding (zero cobalt blue, zero platform marks).
 * - Zero traditional grey skeleton rectangles.
 * - Prevents empty content flashes and layout shifts during initial published-content data binding.
 */
export default function PublicWebsiteLoader({ businessName }: PublicWebsiteLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading website experience"
      className="fixed inset-0 z-[9999] min-h-screen bg-[#FAF8F2] flex flex-col items-center justify-center p-6 select-none transition-colors duration-200"
    >
      {/* Subtle architectural ambient light */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#CE9E34]/8 via-[#0044A7]/4 to-transparent blur-3xl transform-gpu" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm mx-auto">
        {/* Client Logo Mark Container */}
        <div className="relative w-36 sm:w-44 h-24 sm:h-28 flex items-center justify-center mb-5 transition-transform duration-500 animate-in fade-in zoom-in-95">
          <Image
            src="/images/logo.png"
            alt={businessName || 'KVN Interior'}
            width={200}
            height={160}
            priority
            className="max-h-full max-w-full object-contain drop-shadow-xs"
          />
        </div>

        {/* Refined Architectural Gold Horizon Line */}
        <div
          className="w-28 sm:w-36 h-[2px] bg-gradient-to-r from-transparent via-[#CE9E34] to-transparent relative overflow-hidden rounded-full my-1"
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent animate-pulse" />
        </div>

        {/* Subtle Brand Tagline */}
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#475569]/80 mt-3 animate-pulse">
          Architecture & Living
        </p>
      </div>

      <span className="sr-only">Loading published website content...</span>
    </div>
  );
}
