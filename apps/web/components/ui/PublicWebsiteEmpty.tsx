'use client';

import React from 'react';
import { Compass } from 'lucide-react';

interface PublicWebsiteEmptyProps {
  businessName?: string;
}

/**
 * PublicWebsiteEmpty
 *
 * Polished empty/setup state for tenants that do not have published website
 * content yet, avoiding display of unrelated mock or template data.
 */
export default function PublicWebsiteEmpty({ businessName }: PublicWebsiteEmptyProps) {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-md w-full text-center bg-white p-8 sm:p-10 rounded-2xl shadow-soft-md border border-slate-200/80">
        <div className="w-12 h-12 mx-auto mb-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 border border-slate-200">
          <Compass className="w-6 h-6" />
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-charcoal-900 tracking-tight mb-2">
          {businessName ? `${businessName} — Coming Soon` : 'Website Coming Soon'}
        </h1>

        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          This website is currently being prepared. Please check back shortly for published updates and services.
        </p>

        <div className="text-xs text-slate-400 font-medium">
          Powered by Sparovia
        </div>
      </div>
    </div>
  );
}
