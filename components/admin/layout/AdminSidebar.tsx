'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Globe,
  Image as ImageIcon,
  Users,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../providers/AuthProvider';
import { useBusiness } from '../providers/BusinessProvider';
import { cn } from '@/lib/utils';

export const ADMIN_NAV_ITEMS = [
  { name: 'Dashboard', href: '/admin/workspace', icon: LayoutDashboard },
  { name: 'Business', href: '/admin/workspace/business', icon: Building2 },
  { name: 'Website', href: '/admin/workspace/website', icon: Globe },
  { name: 'Media', href: '/admin/workspace/media', icon: ImageIcon },
  { name: 'Leads', href: '/admin/workspace/leads', icon: Users },
  { name: 'Settings', href: '/admin/workspace/settings', icon: Settings },
];

export function AdminSidebar({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { activeBusiness } = useBusiness();

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-full border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <Link href="/admin/workspace" className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center font-bold text-white text-lg">
            S
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-white">SPAROVIA</span>
            <span className="block text-[10px] uppercase font-semibold text-brand-400 tracking-wider">
              Business Workspace
            </span>
          </div>
        </Link>
      </div>

      {/* Business Switcher Indicator */}
      {activeBusiness && (
        <div className="px-4 py-3 mx-4 my-3 rounded-lg bg-slate-800/70 border border-slate-700/50">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-brand-400 flex-shrink-0" />
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{activeBusiness.name}</p>
              <p className="text-[10px] text-slate-400 capitalize truncate">{activeBusiness.industry}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                'flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-white' : 'text-slate-400')} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sparovia Intelligence Preview Footer Note */}
      <div className="mx-4 my-2 p-3 rounded-lg bg-slate-800/40 border border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center space-x-1.5 font-medium text-brand-300 mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Sparovia Intelligence</span>
        </div>
        <p className="leading-tight text-slate-400">
          Preparing context for future automated insights & recommendations.
        </p>
      </div>

      {/* User Footer */}
      {user && (
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="overflow-hidden mr-2">
            <p className="text-xs font-semibold text-white truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </aside>
  );
}
