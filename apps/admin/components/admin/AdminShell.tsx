'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Globe, 
  FileText, 
  Image as ImageIcon, 
  Users, 
  Bot, 
  UserCircle,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';

const NAVIGATION = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Business Context', href: '/admin/business-context', icon: Building2 },
  { name: 'Business Presence', href: '/admin/business-presence', icon: Globe },
  { name: 'Content', href: '/admin/content', icon: FileText },
  { name: 'Images', href: '/admin/images', icon: ImageIcon },
  { name: 'Leads', href: '/admin/leads', icon: Users },
  { name: 'AI Connections', href: '/admin/ai-models', icon: Bot },
  { name: 'Account', href: '/admin/account', icon: UserCircle },
];

interface SidebarViewProps {
  isConfirmed: boolean;
  pathname: string | null;
  onNavigate: () => void;
  userEmail?: string;
  userFullName?: string;
  isCollapsed?: boolean;
  isMobile?: boolean;
  onClose?: () => void;
}

function SidebarView({ 
  isConfirmed, 
  pathname, 
  onNavigate, 
  userEmail, 
  userFullName,
  isCollapsed = false,
  isMobile = false,
  onClose
}: SidebarViewProps) {
  return (
    <>
      {/* Sidebar Header */}
      {isMobile ? (
        <div className="flex h-16 shrink-0 items-center justify-between px-5 border-b border-slate-200 dark:border-[#1E293B]">
          <Link 
            href={isConfirmed ? "/admin" : "/admin/onboarding/business-basics"} 
            className="flex items-center space-x-2"
            onClick={onNavigate}
          >
            <span className="font-extrabold text-xl text-brand-gradient tracking-tight">
              SPAROVIA
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">
              ADMIN
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="h-11 w-11 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      ) : isCollapsed ? (
        <div className="flex h-16 shrink-0 items-center justify-center border-b border-slate-200 dark:border-[#1E293B]">
          <Link 
            href={isConfirmed ? "/admin" : "/admin/onboarding/business-basics"} 
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#3B82F6] to-[#8B3FD1] flex items-center justify-center text-white font-extrabold text-base shadow-sm hover:opacity-90 transition-opacity"
            title="Sparovia Admin"
          >
            S
          </Link>
        </div>
      ) : (
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-slate-200 dark:border-[#1E293B]">
          <Link href={isConfirmed ? "/admin" : "/admin/onboarding/business-basics"} className="flex items-center space-x-2">
            <span className="font-extrabold text-xl text-brand-gradient tracking-tight">
              SPAROVIA
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">
              ADMIN
            </span>
          </Link>
        </div>
      )}

      {/* Navigation List */}
      <div className={`flex flex-1 flex-col overflow-y-auto ${isCollapsed ? 'px-2 py-4' : 'px-3 py-4'}`}>
        {!isConfirmed && !isCollapsed && (
          <div className="mb-3 px-3 py-2 bg-[#3B82F6]/10 border border-[#3B82F6]/20 rounded-xl">
            <p className="text-[11px] font-semibold text-[#3B82F6] dark:text-[#60A5FA]">Onboarding Active</p>
            <p className="text-[10px] text-slate-500 dark:text-[#94A3B8] mt-0.5">Complete Business Context to unlock full Admin access.</p>
          </div>
        )}

        <nav className="flex-1 space-y-1.5" aria-label="Admin Navigation Links">
          {NAVIGATION.map((item) => {
            const isBusinessContext = item.href === '/admin/business-context';
            const isLocked = !isConfirmed && !isBusinessContext;
            const isExact = pathname === item.href;
            const isSubPath = item.href !== '/admin' && (pathname?.startsWith(item.href) || (item.href === '/admin/business-context' && pathname?.startsWith('/admin/onboarding')));
            const isActive = isExact || isSubPath;

            if (isLocked) {
              if (isCollapsed) {
                return (
                  <div
                    key={item.name}
                    className="flex items-center justify-center rounded-xl p-2.5 text-slate-400 dark:text-[#475569] cursor-not-allowed opacity-60"
                    title={`${item.name} (Locked - Complete onboarding to unlock)`}
                  >
                    <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  </div>
                );
              }
              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-400 dark:text-[#475569] cursor-not-allowed opacity-60"
                  title="Complete onboarding to unlock this feature"
                >
                  <div className="flex items-center">
                    <item.icon className="mr-3 h-4 w-4 flex-shrink-0 text-slate-400 dark:text-[#475569]" aria-hidden="true" />
                    <span className="truncate">{item.name}</span>
                  </div>
                  <span className="text-[9px] uppercase tracking-wider font-semibold px-1 py-0.5 rounded bg-slate-100 dark:bg-[#1E293B] text-slate-500 dark:text-[#64748B]">Locked</span>
                </div>
              );
            }

            if (isCollapsed) {
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={item.name}
                  className={`
                    group relative flex items-center justify-center rounded-[6px] p-2.5 text-xs font-medium transition-all
                    ${isActive 
                      ? 'bg-[#315FEA]/10 dark:bg-[#1E293B] text-[#315FEA] dark:text-white shadow-xs border border-[#315FEA]/20 dark:border-[#334155]/60 font-semibold' 
                      : 'text-[#475569] dark:text-[#94A3B8] hover:bg-[#F3F6FA] dark:hover:bg-[#1E293B]/50 hover:text-[#172033] dark:hover:text-white'}
                  `}
                  onClick={onNavigate}
                >
                  <item.icon
                    className={`h-5 w-5 shrink-0 transition-colors ${isActive ? 'text-[#315FEA]' : 'text-[#64748B] group-hover:text-[#315FEA]'}`}
                    aria-hidden="true"
                  />
                  {isActive && (
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#315FEA]" />
                  )}
                </Link>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center rounded-[6px] px-3.5 py-2.5 text-xs font-medium transition-all
                  ${isActive 
                    ? 'bg-[#315FEA]/10 dark:bg-[#1E293B] text-[#315FEA] dark:text-white shadow-xs border border-[#315FEA]/20 dark:border-[#334155]/60 font-semibold' 
                    : 'text-[#475569] dark:text-[#94A3B8] hover:bg-[#F3F6FA] dark:hover:bg-[#1E293B]/50 hover:text-[#172033] dark:hover:text-white'}
                `}
                onClick={onNavigate}
              >
                <item.icon
                  className={`
                    mr-3 h-4 w-4 flex-shrink-0 transition-colors
                    ${isActive ? 'text-[#315FEA]' : 'text-[#64748B] group-hover:text-[#315FEA]'}
                  `}
                  aria-hidden="true"
                />
                <span className="truncate">{item.name}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#315FEA]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User profile card in sidebar bottom */}
      {isCollapsed ? (
        <div className="p-3 border-t border-slate-200 dark:border-[#1E293B] bg-slate-50/60 dark:bg-[#0B1220]/50 flex justify-center">
          <Link 
            href="/admin/account"
            title={userFullName || userEmail || 'Account'}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#3B82F6] to-[#8B3FD1] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm hover:opacity-90 transition-opacity"
          >
            {userFullName ? userFullName[0].toUpperCase() : 'U'}
          </Link>
        </div>
      ) : (
        <div className="p-4 border-t border-slate-200 dark:border-[#1E293B] bg-slate-50/60 dark:bg-[#0B1220]/50">
          <Link 
            href="/admin/account"
            className="flex items-center space-x-3 group hover:opacity-90 transition-opacity"
            onClick={onNavigate}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#3B82F6] to-[#8B3FD1] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
              {userFullName ? userFullName[0].toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold text-slate-800 dark:text-white truncate group-hover:text-[#3B82F6] transition-colors">
                {userFullName || 'Business Owner'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-[#64748B] truncate">{userEmail}</p>
            </div>
          </Link>
        </div>
      )}
    </>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  // Close mobile drawer on route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (!isLoading && isAuthenticated && user) {
      const isOnboardingRoute = pathname?.startsWith('/admin/onboarding') || pathname === '/admin/business-context';
      if (user.isOnboardingConfirmed === false && !isOnboardingRoute) {
        // Unconfirmed users must complete onboarding before accessing normal admin
        router.replace('/admin/onboarding/business-basics');
      }
    }
  }, [isLoading, isAuthenticated, user, pathname, router]);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#3B82F6]/30 border-t-[#3B82F6] rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-500 dark:text-[#94A3B8]">Loading secure workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const isConfirmed = user?.isOnboardingConfirmed ?? false;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] text-slate-800 dark:text-[#E2E8F0] transition-colors duration-150">
      {/* Mobile & Tablet Drawer Modal (< lg) */}
      {mobileMenuOpen && (
        <div 
          id="admin-sidebar-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Admin Navigation Menu"
          className="fixed inset-0 z-50 lg:hidden"
        >
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer slide-in panel */}
          <div className="fixed inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white dark:bg-[#0F172A] border-r border-slate-200 dark:border-[#1E293B] shadow-2xl">
            <SidebarView
              isConfirmed={isConfirmed}
              pathname={pathname}
              onNavigate={() => setMobileMenuOpen(false)}
              userEmail={user?.email}
              userFullName={user?.fullName}
              isMobile={true}
              onClose={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar (lg+) */}
      <aside
        id="admin-sidebar"
        aria-label="Admin Navigation"
        className={`
          hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 bg-white dark:bg-[#0F172A] border-r border-slate-200 dark:border-[#1E293B] z-30 transition-[width] duration-200 ease-in-out
          ${desktopCollapsed ? 'lg:w-20' : 'lg:w-64'}
        `}
      >
        <SidebarView
          isConfirmed={isConfirmed}
          pathname={pathname}
          onNavigate={() => {}}
          userEmail={user?.email}
          userFullName={user?.fullName}
          isCollapsed={desktopCollapsed}
        />
      </aside>

      {/* Main Content Area */}
      <div className={`flex flex-1 flex-col transition-[padding-left] duration-200 ease-in-out ${desktopCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        {/* Sticky Unified Top Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 dark:border-[#1E293B] bg-white/80 dark:bg-[#0F172A]/70 backdrop-blur-md px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            {/* Mobile/Tablet Hamburger Toggle (< lg) */}
            <button
              type="button"
              className="lg:hidden h-11 w-11 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#334155] text-slate-700 dark:text-slate-200 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
              onClick={() => setMobileMenuOpen(true)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="admin-sidebar-drawer"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* Mobile Branding (< lg) */}
            <div className="lg:hidden flex items-center space-x-2">
              <Link href={isConfirmed ? "/admin" : "/admin/onboarding/business-basics"} className="flex items-center space-x-2">
                <span className="font-extrabold text-lg text-brand-gradient tracking-tight">SPAROVIA</span>
                <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">
                  ADMIN
                </span>
              </Link>
            </div>

            {/* Desktop Sidebar Rail Toggle Button (lg+) */}
            <button
              type="button"
              className="hidden lg:flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#334155] text-slate-600 dark:text-slate-300 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
              onClick={() => setDesktopCollapsed(!desktopCollapsed)}
              aria-label={desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </button>

            {/* Desktop Workspace Context Breadcrumb (lg+) */}
            <div className="hidden lg:flex items-center space-x-2">
              <span className="text-xs text-slate-400 dark:text-[#64748B]">Workspace</span>
              <span className="text-xs text-slate-300 dark:text-[#334155]">/</span>
              <span className="text-xs font-medium text-slate-700 dark:text-white truncate max-w-[220px]">
                {user?.tenantId ? `Tenant ${user.tenantId.substring(0, 8)}...` : 'Sparovia Platform'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick theme toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-[#1E293B] p-1 rounded-xl border border-slate-200 dark:border-[#334155]/60" title={`Current appearance: ${theme}`}>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-[6px] text-xs transition-colors ${
                  theme === 'light' 
                    ? 'bg-white text-[#315FEA] shadow-xs font-semibold' 
                    : 'text-slate-400 hover:text-slate-700 dark:text-[#64748B] dark:hover:text-white'
                }`}
                aria-label="Set light theme"
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-[6px] text-xs transition-colors ${
                  theme === 'dark' 
                    ? 'bg-[#0B1220] text-[#315FEA] shadow-xs font-semibold' 
                    : 'text-slate-400 hover:text-slate-700 dark:text-[#64748B] dark:hover:text-white'
                }`}
                aria-label="Set dark theme"
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`p-1.5 rounded-[6px] text-xs transition-colors ${
                  theme === 'system' 
                    ? 'bg-white dark:bg-[#0B1220] text-[#315FEA] shadow-xs font-semibold' 
                    : 'text-slate-400 hover:text-slate-700 dark:text-[#64748B] dark:hover:text-white'
                }`}
                aria-label="Set system theme"
              >
                <Monitor className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center text-xs font-medium text-slate-500 dark:text-[#94A3B8] hover:text-[#B91C1C] dark:hover:text-[#B91C1C] transition-colors py-1.5 px-3 rounded-[6px] hover:bg-[#F3F6FA] dark:hover:bg-[#1E293B]"
            >
              <LogOut className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
