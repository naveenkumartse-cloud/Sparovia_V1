'use client';

import React from 'react';

/**
 * PublicWebsiteSkeleton
 *
 * Professional, brand-aligned loading skeleton rendered while initial
 * tenant published content is resolving. Prevents flashing of unrelated
 * default/demo content and respects prefers-reduced-motion.
 */
export default function PublicWebsiteSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="min-h-screen bg-white text-charcoal-900 overflow-hidden"
    >
      <span className="sr-only">Loading website content...</span>

      {/* 1. Header / Navigation Placeholder */}
      <header className="fixed top-0 left-0 right-0 z-50 py-4 sm:py-5 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo Placeholder */}
          <div className="h-7 w-28 sm:w-36 rounded-md bg-slate-200 motion-safe:animate-pulse" />

          {/* Desktop Nav Items Placeholder */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="h-4 w-16 rounded bg-slate-200/80 motion-safe:animate-pulse" />
            <div className="h-4 w-20 rounded bg-slate-200/80 motion-safe:animate-pulse" />
            <div className="h-4 w-16 rounded bg-slate-200/80 motion-safe:animate-pulse" />
            <div className="h-4 w-14 rounded bg-slate-200/80 motion-safe:animate-pulse" />
          </div>

          {/* Right Action Button Placeholder */}
          <div className="h-9 w-24 sm:w-28 rounded-full bg-slate-200 motion-safe:animate-pulse" />
        </div>
      </header>

      {/* 2. Hero Section Placeholder */}
      <section className="min-h-[88vh] sm:min-h-screen flex items-center justify-center pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-stone-50 via-white to-stone-50/50 border-b border-slate-100">
        <div className="max-w-4xl w-full mx-auto text-center flex flex-col items-center">
          {/* Eyebrow badge */}
          <div className="h-6 w-32 sm:w-44 rounded-full bg-slate-200/90 mb-6 motion-safe:animate-pulse" />

          {/* Headline lines */}
          <div className="h-10 sm:h-14 w-4/5 max-w-2xl rounded-xl bg-slate-200 mb-4 motion-safe:animate-pulse" />
          <div className="h-10 sm:h-14 w-3/5 max-w-lg rounded-xl bg-slate-200 mb-6 motion-safe:animate-pulse" />

          {/* Subheadline lines */}
          <div className="h-4 sm:h-5 w-3/4 max-w-xl rounded-md bg-slate-200/70 mb-3 motion-safe:animate-pulse" />
          <div className="h-4 sm:h-5 w-1/2 max-w-md rounded-md bg-slate-200/70 mb-10 motion-safe:animate-pulse" />

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto justify-center">
            <div className="h-12 w-40 rounded-full bg-slate-300 motion-safe:animate-pulse" />
            <div className="h-12 w-32 rounded-full bg-slate-200 motion-safe:animate-pulse" />
          </div>
        </div>
      </section>

      {/* 3. Main Content / Storytelling Placeholder */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-100">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-center">
          {/* Text Column */}
          <div className="space-y-4">
            <div className="h-5 w-24 rounded-full bg-slate-200 motion-safe:animate-pulse" />
            <div className="h-8 sm:h-10 w-4/5 rounded-lg bg-slate-200 motion-safe:animate-pulse" />
            <div className="space-y-2.5 pt-2">
              <div className="h-4 w-full rounded bg-slate-200/70 motion-safe:animate-pulse" />
              <div className="h-4 w-11/12 rounded bg-slate-200/70 motion-safe:animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-slate-200/70 motion-safe:animate-pulse" />
            </div>
            <div className="pt-4 flex gap-4">
              <div className="h-16 w-28 rounded-xl bg-slate-100 motion-safe:animate-pulse" />
              <div className="h-16 w-28 rounded-xl bg-slate-100 motion-safe:animate-pulse" />
              <div className="h-16 w-28 rounded-xl bg-slate-100 motion-safe:animate-pulse" />
            </div>
          </div>

          {/* Media / Image Column */}
          <div className="w-full aspect-[4/3] rounded-2xl bg-slate-200 motion-safe:animate-pulse shadow-sm" />
        </div>
      </section>

      {/* 4. Grid Cards Placeholder (Services / Gallery) */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <div className="h-5 w-28 rounded-full bg-slate-200 mx-auto motion-safe:animate-pulse" />
          <div className="h-8 sm:h-10 w-64 rounded-lg bg-slate-200 mx-auto motion-safe:animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((item) => (
            <div key={item} className="space-y-3.5">
              <div className="w-full aspect-[4/3] rounded-xl bg-slate-200 motion-safe:animate-pulse" />
              <div className="h-5 w-3/4 rounded bg-slate-200 motion-safe:animate-pulse" />
              <div className="h-3.5 w-full rounded bg-slate-100 motion-safe:animate-pulse" />
              <div className="h-3.5 w-4/5 rounded bg-slate-100 motion-safe:animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
