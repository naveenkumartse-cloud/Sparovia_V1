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
        'p-8 text-center rounded-[8px] border border-[#B91C1C]/20 dark:border-[#B91C1C]/30',
        'bg-red-50/50 dark:bg-red-950/10 transition-colors',
        className
      )}
    >
      <div className="w-12 h-12 rounded-[6px] bg-[#B91C1C]/10 text-[#B91C1C] border border-[#B91C1C]/20 flex items-center justify-center mx-auto mb-3.5">
        <AlertCircle className="w-6 h-6" />
      </div>

      <h3 className="text-sm font-semibold text-[#172033] dark:text-white">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8] mt-1.5 max-w-md mx-auto leading-relaxed">
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
