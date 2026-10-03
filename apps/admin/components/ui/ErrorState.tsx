'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

export interface ErrorStateProps {
  title?: string;
  error?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}

export function ErrorState({
  title = 'Unable to load information',
  error,
  onRetry,
  isRetrying = false,
  className,
}: ErrorStateProps) {
  const displayMessage =
    error ||
    'Something went wrong while communicating with the server. Your information has not been lost. Please try again.';

  return (
    <div
      role="alert"
      className={cn(
        'p-8 text-center rounded-2xl border border-red-500/20 dark:border-red-500/30',
        'bg-red-50/50 dark:bg-red-950/10 transition-colors',
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center justify-center mx-auto mb-3.5">
        <AlertCircle className="w-6 h-6" />
      </div>

      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] mt-1.5 max-w-md mx-auto leading-relaxed">
        {displayMessage}
      </p>

      {onRetry && (
        <div className="mt-5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRetry}
            isLoading={isRetrying}
            loadingText="Retrying..."
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
