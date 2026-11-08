'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { cn } from '@/lib/utils';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string | React.ReactNode;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'destructive' | 'primary' | 'warning' | 'success';
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  isLoading = false,
  loadingText,
  icon,
}: ConfirmationDialogProps) {
  const getIcon = () => {
    if (icon) return icon;
    switch (variant) {
      case 'destructive':
        return <AlertTriangle className="w-5 h-5 text-[#B91C1C]" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-[#B45309]" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-[#15803D]" />;
      default:
        return <HelpCircle className="w-5 h-5 text-[#315FEA]" />;
    }
  };

  const getButtonVariant = () => {
    switch (variant) {
      case 'destructive':
        return 'destructive';
      case 'warning':
        return 'primary';
      case 'success':
        return 'success';
      default:
        return 'primary';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="md"
      preventOutsideClose={isLoading}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            size="md"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={getButtonVariant()}
            onClick={onConfirm}
            isLoading={isLoading}
            loadingText={loadingText}
            size="md"
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="flex items-start gap-3.5">
        <div
          className={cn(
            'w-10 h-10 rounded-[6px] flex items-center justify-center shrink-0 mt-0.5 border',
            variant === 'destructive' && 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900',
            variant === 'warning' && 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
            variant === 'success' && 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
            variant === 'primary' && 'bg-blue-50 dark:bg-[#315FEA]/10 border-blue-200 dark:border-[#315FEA]/20'
          )}
        >
          {getIcon()}
        </div>
        <div className="space-y-2 text-sm text-[#475569] dark:text-[#94A3B8] leading-relaxed flex-1">
          {typeof description === 'string' ? <p>{description}</p> : description}
          {children}
        </div>
      </div>
    </Modal>
  );
}
