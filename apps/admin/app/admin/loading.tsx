import React from 'react';
import { SparoviaLogo } from '@/components/ui/SparoviaLogo';

export default function AdminLoading() {
  return (
    <div
      className="min-h-[50vh] flex flex-col items-center justify-center py-16 transition-colors"
      role="status"
      aria-live="polite"
      aria-label="Loading page content"
    >
      <div className="text-center space-y-4">
        <SparoviaLogo size="auth" priority={true} />
        <div className="w-5 h-5 border-2 border-[#315FEA]/30 border-t-[#315FEA] rounded-full animate-spin mx-auto mt-2" />
        <p className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">Loading...</p>
      </div>
    </div>
  );
}
