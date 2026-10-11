'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-[4px] bg-slate-200/80 dark:bg-slate-800/60',
        className
      )}
      {...props}
    />
  );
}

export function SkeletonText({ className, lines = 1 }: { className?: string; lines?: number }) {
  return (
    <div className="space-y-2 w-full" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full',
            className
          )}
        />
      ))}
    </div>
  );
}

export function SkeletonHeading({ className }: { className?: string }) {
  return <Skeleton className={cn('h-7 w-48 rounded-[4px]', className)} aria-hidden="true" />;
}

export function SkeletonInput({ className }: { className?: string }) {
  return <Skeleton className={cn('h-10 w-full rounded-[6px]', className)} aria-hidden="true" />;
}

export function SkeletonButton({ className }: { className?: string }) {
  return <Skeleton className={cn('h-10 w-32 rounded-[6px]', className)} aria-hidden="true" />;
}

export function SkeletonFormField({ labelWidth = 'w-24', hasTextarea = false }: { labelWidth?: string; hasTextarea?: boolean }) {
  return (
    <div className="space-y-1.5 w-full" aria-hidden="true">
      <Skeleton className={cn('h-3.5 rounded-[4px]', labelWidth)} />
      {hasTextarea ? (
        <Skeleton className="h-24 w-full rounded-[6px]" />
      ) : (
        <Skeleton className="h-10 w-full rounded-[6px]" />
      )}
    </div>
  );
}

export function SkeletonCard({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'p-5 rounded-[8px] border border-slate-200 dark:border-[#1E293B] bg-slate-50/50 dark:bg-[#0B1220] space-y-4',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * OnboardingFormSkeleton
 * Matches the layout of Business Basics, Location & Customers, Business Description, Approved Facts.
 */
export function OnboardingFormSkeleton({ fieldsCount = 6, twoColumn = true }: { fieldsCount?: number; twoColumn?: boolean }) {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5 rounded-[4px]" />
          <Skeleton className="h-6 w-56 rounded-[4px]" />
        </div>
        <Skeleton className="h-4 w-80 max-w-full rounded-[4px]" />
      </div>

      <div className={twoColumn ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-4'}>
        {Array.from({ length: fieldsCount }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-28 rounded-[4px]" />
            <Skeleton className="h-10 w-full rounded-[6px]" />
          </div>
        ))}
      </div>

      <div className="pt-6 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between">
        <Skeleton className="h-8 w-20 rounded-[6px]" />
        <Skeleton className="h-10 w-36 rounded-[6px]" />
      </div>
    </div>
  );
}

/**
 * ServicesSkeleton
 * Matches the layout of the Services page (list of service cards + Add Service form).
 */
export function ServicesSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5 rounded-[4px]" />
          <Skeleton className="h-6 w-40 rounded-[4px]" />
        </div>
        <Skeleton className="h-4 w-72 max-w-full rounded-[4px]" />
      </div>

      {/* Existing service items mock */}
      <div className="space-y-3">
        <div className="p-4 bg-slate-50/50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1E293B] rounded-[8px] flex justify-between items-start">
          <div className="space-y-2 w-2/3">
            <Skeleton className="h-4 w-36 rounded-[4px]" />
            <Skeleton className="h-3 w-full rounded-[4px]" />
          </div>
          <Skeleton className="w-5 h-5 rounded-[4px]" />
        </div>
        <div className="p-4 bg-slate-50/50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1E293B] rounded-[8px] flex justify-between items-start">
          <div className="space-y-2 w-1/2">
            <Skeleton className="h-4 w-44 rounded-[4px]" />
            <Skeleton className="h-3 w-3/4 rounded-[4px]" />
          </div>
          <Skeleton className="w-5 h-5 rounded-[4px]" />
        </div>
      </div>

      {/* Add service form box */}
      <div className="p-5 bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155]/60 rounded-[8px] space-y-4">
        <Skeleton className="h-4 w-32 rounded-[4px]" />
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-24 rounded-[4px]" />
          <Skeleton className="h-10 w-full rounded-[6px]" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-20 rounded-[4px]" />
          <Skeleton className="h-16 w-full rounded-[6px]" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-8 w-28 rounded-[6px]" />
        </div>
      </div>

      <div className="pt-6 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between">
        <Skeleton className="h-8 w-20 rounded-[6px]" />
        <Skeleton className="h-10 w-36 rounded-[6px]" />
      </div>
    </div>
  );
}

/**
 * BusinessContextSkeleton
 * Matches the layout of Review & Confirm and Business Context Management page (5 distinct sections).
 */
export function BusinessContextSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-live="polite">
      <div className="border-b border-slate-100 dark:border-[#1E293B] pb-4 flex justify-between items-center">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-64 rounded-[4px]" />
          <Skeleton className="h-3.5 w-80 max-w-full rounded-[4px]" />
        </div>
        <Skeleton className="h-6 w-24 rounded-[4px]" />
      </div>

      {/* 5 Section Cards */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="bg-slate-50/50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1E293B] rounded-[8px] p-4 sm:p-5 space-y-3"
        >
          <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-[#1E293B] pb-2.5">
            <div className="flex items-center space-x-2">
              <Skeleton className="w-4 h-4 rounded-[4px]" />
              <Skeleton className="h-4 w-44 rounded-[4px]" />
            </div>
            <Skeleton className="h-3.5 w-12 rounded-[4px]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Skeleton className="h-2.5 w-20 mb-1 rounded-[4px]" />
              <Skeleton className="h-4 w-36 rounded-[4px]" />
            </div>
            <div>
              <Skeleton className="h-2.5 w-24 mb-1 rounded-[4px]" />
              <Skeleton className="h-4 w-40 rounded-[4px]" />
            </div>
            <div>
              <Skeleton className="h-2.5 w-16 mb-1 rounded-[4px]" />
              <Skeleton className="h-4 w-32 rounded-[4px]" />
            </div>
            <div>
              <Skeleton className="h-2.5 w-20 mb-1 rounded-[4px]" />
              <Skeleton className="h-4 w-48 rounded-[4px]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * DashboardSkeleton
 * Matches the layout of Admin Dashboard (Welcome Banner + 3 Status Cards + Guidance Panel).
 */
export function DashboardSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-pulse" aria-busy="true" aria-live="polite">
      {/* Banner */}
      <div className="bg-white dark:bg-[#0F172A] p-6 sm:p-8 rounded-[8px] border border-slate-200 dark:border-[#1E293B] shadow-sm flex justify-between items-center">
        <div className="space-y-3">
          <Skeleton className="h-5 w-40 rounded-[4px]" />
          <Skeleton className="h-8 w-64 rounded-[4px]" />
          <Skeleton className="h-4 w-48 rounded-[4px]" />
        </div>
        <Skeleton className="h-11 w-48 rounded-[6px] hidden sm:block" />
      </div>

      {/* 3 Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#0F172A] p-6 rounded-[8px] border border-slate-200 dark:border-[#1E293B] shadow-sm space-y-4"
          >
            <div className="flex justify-between items-center">
              <Skeleton className="w-10 h-10 rounded-[6px]" />
              <Skeleton className="h-5 w-16 rounded-[4px]" />
            </div>
            <Skeleton className="h-5 w-36 rounded-[4px]" />
            <Skeleton className="h-3.5 w-full rounded-[4px]" />
            <Skeleton className="h-3.5 w-4/5 rounded-[4px]" />
            <div className="pt-4 border-t border-slate-100 dark:border-[#1E293B]">
              <Skeleton className="h-4 w-24 rounded-[4px]" />
            </div>
          </div>
        ))}
      </div>

      {/* Guidance Panel */}
      <div className="bg-white dark:bg-[#0F172A] p-6 rounded-[8px] border border-slate-200 dark:border-[#1E293B] shadow-sm space-y-4">
        <Skeleton className="h-5 w-48 rounded-[4px]" />
        <div className="space-y-3">
          <div className="p-3.5 bg-slate-50 dark:bg-[#0B1220] border border-slate-200/80 dark:border-[#1E293B] rounded-[8px] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Skeleton className="w-7 h-7 rounded-[4px]" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-44 rounded-[4px]" />
                <Skeleton className="h-3 w-64 rounded-[4px]" />
              </div>
            </div>
            <Skeleton className="h-4 w-12 rounded-[4px]" />
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-[#0B1220] border border-slate-200/80 dark:border-[#1E293B] rounded-[8px] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Skeleton className="w-7 h-7 rounded-[4px]" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-52 rounded-[4px]" />
                <Skeleton className="h-3 w-72 rounded-[4px]" />
              </div>
            </div>
            <Skeleton className="h-4 w-12 rounded-[4px]" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * BusinessPresenceSkeleton
 * Matches the layout of the Business Presence screen (Verified NAP Overview + Form + Directory Grid).
 */
export function BusinessPresenceSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-pulse" aria-busy="true" aria-live="polite">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-[4px]" />
          <Skeleton className="h-4 w-96 rounded-[4px]" />
        </div>
        <Skeleton className="h-8 w-36 rounded-[4px]" />
      </div>

      {/* Verified NAP Overview Card */}
      <div className="bg-white dark:bg-[#0F172A] p-6 sm:p-8 rounded-[8px] border border-slate-200 dark:border-[#1E293B] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#1E293B]">
          <div className="space-y-2">
            <Skeleton className="h-5 w-44 rounded-[4px]" />
            <Skeleton className="h-3.5 w-80 rounded-[4px]" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32 rounded-[6px]" />
            <Skeleton className="h-9 w-40 rounded-[6px]" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 rounded-[8px] bg-slate-50 dark:bg-[#1E293B]/40 space-y-2">
              <Skeleton className="h-3 w-20 rounded-[4px]" />
              <Skeleton className="h-4 w-36 rounded-[4px]" />
            </div>
          ))}
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-[#0F172A] p-6 sm:p-8 rounded-[8px] border border-slate-200 dark:border-[#1E293B] shadow-sm space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48 rounded-[4px]" />
          <Skeleton className="h-3.5 w-72 rounded-[4px]" />
        </div>
        <div className="space-y-4">
          <SkeletonFormField labelWidth="w-32" hasTextarea={true} />
          <SkeletonFormField labelWidth="w-40" hasTextarea={true} />
        </div>
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-10 w-32 rounded-[6px]" />
          <Skeleton className="h-10 w-36 rounded-[6px]" />
        </div>
      </div>

      {/* Directory Grid */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-52 rounded-[4px]" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-5 rounded-[8px] bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-32 rounded-[4px]" />
                <Skeleton className="h-5 w-24 rounded-[4px]" />
              </div>
              <Skeleton className="h-3.5 w-full rounded-[4px]" />
              <Skeleton className="h-3.5 w-4/5 rounded-[4px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
