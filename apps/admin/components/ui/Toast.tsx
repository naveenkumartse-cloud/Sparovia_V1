'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Standalone global trigger so `toast.success(...)` can be called from anywhere
let globalShowToast: ((type: ToastType, message: string, duration?: number) => void) | null = null;

export const toast = {
  success: (message: string, duration = 4000) => {
    if (globalShowToast) {
      globalShowToast('success', message, duration);
    }
  },
  error: (message: string, duration = 5000) => {
    if (globalShowToast) {
      globalShowToast('error', message, duration);
    }
  },
  warning: (message: string, duration = 4500) => {
    if (globalShowToast) {
      globalShowToast('warning', message, duration);
    }
  },
  info: (message: string, duration = 4000) => {
    if (globalShowToast) {
      globalShowToast('info', message, duration);
    }
  },
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toasts: [],
      showToast: toast.info,
      removeToast: () => {},
      toast,
    };
  }
  return { ...context, toast };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const lastToastRef = useRef<{ message: string; timestamp: number } | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, message: string, duration = 4000) => {
    const now = Date.now();
    // Prevent duplicate toasts with the same message within 2 seconds
    if (
      lastToastRef.current &&
      lastToastRef.current.message === message &&
      now - lastToastRef.current.timestamp < 2000
    ) {
      return;
    }
    lastToastRef.current = { message, timestamp: now };

    const id = `toast-${now}-${Math.random().toString(36).slice(2, 7)}`;
    const newToast: ToastItem = { id, type, message, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  // Keep global trigger in sync
  globalShowToast = showToast;

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      {/* Toast viewport fixed at top-right */}
      <aside
        aria-label="Notifications"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full sm:max-w-md px-3"
      >
        <AnimatePresence mode="sync">
          {toasts.map((t) => (
            <ToastCard key={t.id} toast={t} onClose={() => removeToast(t.id)} />
          ))}
        </AnimatePresence>
      </aside>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const isError = toast.type === 'error';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className={cn(
        'pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-[8px] shadow-[0_12px_32px_rgb(23_32_51_/_16%)] border backdrop-blur-md transition-colors',
        'bg-white dark:bg-[#0F172A] border-[#E3E7ED] dark:border-[#1E293B]',
        toast.type === 'success' && 'border-[#15803D]/30 dark:border-[#15803D]/30',
        toast.type === 'error' && 'border-[#B91C1C]/30 dark:border-[#B91C1C]/30',
        toast.type === 'warning' && 'border-[#B45309]/30 dark:border-[#B45309]/30',
        toast.type === 'info' && 'border-[#1D4ED8]/30 dark:border-[#1D4ED8]/30'
      )}
    >
      {/* Icon */}
      <div className="shrink-0 mt-0.5">
        {toast.type === 'success' && (
          <div className="p-1 rounded-full bg-[#15803D]/10 text-[#15803D]">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        )}
        {toast.type === 'error' && (
          <div className="p-1 rounded-full bg-[#B91C1C]/10 text-[#B91C1C]">
            <AlertCircle className="w-4 h-4" />
          </div>
        )}
        {toast.type === 'warning' && (
          <div className="p-1 rounded-full bg-[#B45309]/10 text-[#B45309]">
            <AlertTriangle className="w-4 h-4" />
          </div>
        )}
        {toast.type === 'info' && (
          <div className="p-1 rounded-full bg-[#1D4ED8]/10 text-[#1D4ED8]">
            <Info className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Message content */}
      <div className="flex-1 text-xs sm:text-sm font-medium leading-snug text-[#172033] dark:text-white pt-0.5">
        {toast.message}
      </div>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        className="shrink-0 p-1 text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}
