'use client';

import React from 'react';
import { X } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative flex-1 max-w-xs w-full bg-slate-900 flex flex-col z-10 shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg transition-colors z-20"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>

        <AdminSidebar onItemClick={onClose} />
      </div>
    </div>
  );
}
