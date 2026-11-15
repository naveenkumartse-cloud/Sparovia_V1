import React from 'react';
import { SparoviaLogo } from '@/components/ui/SparoviaLogo';
import { SparoviaLogoLoader } from '@/components/ui/SparoviaLogoLoader';

export default function AdminLoading() {
  return (
    <div
      className="min-h-[50vh] flex flex-col items-center justify-center py-16 transition-colors"
      role="status"
      aria-live="polite"
      aria-label="Loading page content"
    >
      <div className="text-center space-y-4">
        {/* Production 7-stage animated logo loader (replaces traditional spinner) */}
        <SparoviaLogoLoader mode="navigation" size="lg" />
        <span className="sr-only">
          <SparoviaLogo size="auth" priority={true} />
        </span>
      </div>
    </div>
  );
}

