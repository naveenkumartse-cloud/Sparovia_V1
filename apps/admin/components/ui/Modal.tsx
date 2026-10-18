'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'ai';
  className?: string;
  bodyClassName?: string;
  footerClassName?: string;
  preventOutsideClose?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement>;
}

const maxWidthMap: Record<string, string> = {
  sm: 'w-[calc(100vw-24px)] max-w-sm',
  md: 'w-[calc(100vw-24px)] sm:w-[calc(100vw-32px)] max-w-md',
  lg: 'w-[calc(100vw-24px)] sm:w-[calc(100vw-32px)] max-w-lg',
  xl: 'w-[calc(100vw-24px)] sm:w-[calc(100vw-32px)] max-w-xl',
  '2xl': 'w-[calc(100vw-24px)] sm:w-[calc(100vw-32px)] md:w-[calc(100vw-48px)] max-w-[768px]',
  '3xl': 'w-[calc(100vw-24px)] sm:w-[calc(100vw-32px)] md:w-[calc(100vw-48px)] max-w-[896px]',
  ai: 'w-[calc(100vw-24px)] sm:w-[calc(100vw-32px)] md:w-[calc(100vw-48px)] max-w-[960px]',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
  className,
  bodyClassName,
  footerClassName,
  preventOutsideClose = false,
  initialFocusRef,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Focus trap, initial focus, focus restoration, Escape key, and scroll locking
  useEffect(() => {
    if (!isOpen) return;

    // Save previous active element for focus restoration upon modal close
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      previousActiveElementRef.current = document.activeElement;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Initial focus placement
    const focusTimer = setTimeout(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else if (modalRef.current) {
        const focusable = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href]:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el.offsetParent !== null);
        if (focusable.length > 0) {
          focusable[0].focus();
        } else if (closeButtonRef.current) {
          closeButtonRef.current.focus();
        }
      }
    }, 30);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }

      // Focus trap containment
      if (e.key === 'Tab' && modalRef.current) {
        const focusables = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href]:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el.offsetParent !== null);

        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || !modalRef.current.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement || !modalRef.current.contains(document.activeElement)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;

      // Restore focus to initiating control
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, onClose, initialFocusRef]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={description ? 'modal-description' : undefined}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={preventOutsideClose ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        ref={modalRef}
        className={cn(
          'relative flex flex-col max-h-[calc(100dvh-20px)] sm:max-h-[85vh] my-auto bg-white dark:bg-[#0F172A] border border-[#E3E7ED] dark:border-[#1E293B] rounded-[10px] shadow-[0_12px_32px_rgb(23_32_51_/_16%)] z-10 overflow-hidden transform transition-all',
          maxWidthMap[maxWidth] || maxWidthMap.md,
          className
        )}
      >
        {/* Header - Fixed at Top */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-5 border-b border-[#E3E7ED] dark:border-[#1E293B] flex items-start justify-between gap-3 shrink-0 bg-white dark:bg-[#0F172A]">
          <div className="min-w-0 pr-1">
            <h3
              id="modal-title"
              className="text-base sm:text-lg font-bold text-[#172033] dark:text-white tracking-tight break-words"
            >
              {title}
            </h3>
            {description && (
              <p
                id="modal-description"
                className="text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8] mt-1 leading-relaxed break-words"
              >
                {description}
              </p>
            )}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-[6px] text-[#475569] hover:text-[#172033] dark:hover:text-slate-200 hover:bg-[#F3F6FA] dark:hover:bg-[#1E293B] transition-colors shrink-0 -mr-1 -mt-1 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body - Clean Internal Scrolling */}
        {children && (
          <div className={cn('px-4 py-3.5 sm:p-6 overflow-y-auto flex-1 min-h-0 overscroll-contain', bodyClassName)}>
            {children}
          </div>
        )}

        {/* Footer - Fixed at Bottom with Standardized Alignment & Spacing */}
        {footer && (
          <div
            className={cn(
              'px-4 py-3.5 sm:px-6 sm:py-4 bg-[#F3F6FA]/95 dark:bg-[#0B1120]/95 border-t border-[#E3E7ED] dark:border-[#1E293B] shrink-0 w-full flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3',
              footerClassName
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
