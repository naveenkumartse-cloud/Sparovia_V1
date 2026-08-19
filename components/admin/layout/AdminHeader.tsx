'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Building2, User as UserIcon } from 'lucide-react';
import { useAuth } from '../providers/AuthProvider';
import { useBusiness } from '../providers/BusinessProvider';
import { ADMIN_NAV_ITEMS } from './AdminSidebar';

interface AdminHeaderProps {
  onMenuToggle: () => void;
}

export function AdminHeader({ onMenuToggle }: AdminHeaderProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { activeBusiness } = useBusiness();

  const currentItem = ADMIN_NAV_ITEMS.find((item) => item.href === pathname);
  const title = currentItem ? currentItem.name : 'Workspace';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center space-x-3">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h1>
          <p className="text-xs text-slate-500 hidden sm:block">
            Sparovia Business Operating Workspace
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {activeBusiness && (
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-brand-600" />
            <span>{activeBusiness.name}</span>
          </div>
        )}

        {user && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-800 font-bold text-xs flex items-center justify-center border border-brand-200">
              {user.firstName[0]}
              {user.lastName[0]}
            </div>
            <div className="hidden lg:block text-right">
              <p className="text-xs font-semibold text-slate-800 leading-tight">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
