'use client';

import React, { useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface PublicWebsiteErrorProps {
  onRetry: () => Promise<void> | void;
}

/**
 * PublicWebsiteError
 *
 * Professional, safe public-facing error state.
 * Never leaks internal endpoints, server errors, or stack traces.
 * Offers a simple, clear retry button.
 */
export default function PublicWebsiteError({ onRetry }: PublicWebsiteErrorProps) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    try {
      setRetrying(true);
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-md w-full text-center bg-white p-8 sm:p-10 rounded-2xl shadow-soft-md border border-slate-200/80">
        <div className="w-12 h-12 mx-auto mb-5 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-200">
          <AlertCircle className="w-6 h-6" />
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-charcoal-900 tracking-tight mb-2">
          Website content couldn&apos;t be loaded
        </h1>

        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          We encountered an issue connecting to the site service. Please check your internet connection or try again.
        </p>

        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying}
          className="inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-semibold bg-charcoal-900 text-white hover:bg-charcoal-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-charcoal-900 transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${retrying ? 'animate-spin' : ''}`} />
          {retrying ? 'Retrying...' : 'Try Again'}
        </button>
      </div>
    </div>
  );
}
