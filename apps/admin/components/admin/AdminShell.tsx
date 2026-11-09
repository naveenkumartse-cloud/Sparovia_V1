'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
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
  Sparkles,
  ChevronRight,
  Sun,
  Moon
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
  resolvedTheme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

function SidebarView({ 
  isConfirmed, 
  pathname, 
  onNavigate, 
  userEmail, 
  userFullName,
  isCollapsed = false,
  isMobile = false,
  onClose,
  resolvedTheme,
  onToggleTheme
}: SidebarViewProps) {
  return (
    <>
      {/* Sidebar Header */}
      {isMobile ? (
        <div className="flex h-16 shrink-0 items-center justify-between px-5 border-b border-[#E3E7ED] dark:border-[#1E293B]">
          <Link 
            href={isConfirmed ? "/admin" : "/admin/onboarding/business-basics"} 
            className="flex items-center space-x-2 select-none"
            onClick={onNavigate}
          >
            <span className="font-extrabold text-xl text-brand-gradient tracking-tight">
              SPAROVIA
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-[4px] bg-[#315FEA]/10 text-[#315FEA] border border-[#315FEA]/20">
              ADMIN
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="h-11 w-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[6px] text-[#64748B] hover:text-[#172033] dark:text-[#94A3B8] dark:hover:text-white hover:bg-[#F3F6FA] dark:hover:bg-[#1E293B] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      ) : isCollapsed ? (
        <div className="flex h-16 shrink-0 items-center justify-center border-b border-[#E3E7ED] dark:border-[#1E293B]">
          <Link 
            href={isConfirmed ? "/admin" : "/admin/onboarding/business-basics"} 
            className="w-10 h-10 rounded-[6px] bg-[#315FEA] flex items-center justify-center text-white font-extrabold text-base shadow-soft-xs hover:bg-[#254EDB] transition-colors"
            title="Sparovia Admin"
          >
            S
          </Link>
        </div>
      ) : (
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-[#E3E7ED] dark:border-[#1E293B]">
          <Link href={isConfirmed ? "/admin" : "/admin/onboarding/business-basics"} className="flex items-center space-x-2 select-none">
            <span className="font-extrabold text-xl text-brand-gradient tracking-tight">
              SPAROVIA
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-[4px] bg-[#315FEA]/10 text-[#315FEA] border border-[#315FEA]/20">
              ADMIN
            </span>
          </Link>
        </div>
      )}

      {/* Navigation List */}
      <div className={`flex flex-1 flex-col overflow-y-auto ${isCollapsed ? 'px-2 py-4' : 'px-3 py-4'}`}>
        {!isConfirmed && !isCollapsed && (
          <div className="mb-3 px-3 py-2.5 bg-[#315FEA]/10 border border-[#315FEA]/20 rounded-[8px]">
            <p className="text-[11px] font-bold text-[#315FEA] dark:text-[#608FFE]">Onboarding Active</p>
            <p className="text-[10px] text-[#475569] dark:text-[#94A3B8] mt-0.5 leading-relaxed">
              Complete Business Context to unlock full platform operations.
            </p>
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
                    className="flex items-center justify-center rounded-[6px] p-2.5 text-slate-400 dark:text-[#475569] cursor-not-allowed opacity-60"
                    title={`${item.name} (Locked - Complete onboarding to unlock)`}
                  >
                    <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  </div>
                );
              }
              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-[6px] px-3.5 py-2.5 text-xs font-medium text-slate-400 dark:text-[#475569] cursor-not-allowed opacity-60"
                  title="Complete onboarding to unlock this feature"
                >
                  <div className="flex items-center">
                    <item.icon className="mr-3 h-4 w-4 flex-shrink-0 text-slate-400 dark:text-[#475569]" aria-hidden="true" />
                    <span className="truncate">{item.name}</span>
                  </div>
                  <span className="text-[9px] uppercase tracking-wider font-semibold px-1 py-0.5 rounded-[4px] bg-slate-100 dark:bg-[#1E293B] text-slate-500 dark:text-[#64748B]">Locked</span>
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
                    group relative flex items-center justify-center rounded-[6px] p-2.5 text-xs font-medium transition-all motion-reduce:transition-none
                    ${isActive 
                      ? 'bg-[#315FEA]/10 dark:bg-[#1E293B] text-[#315FEA] dark:text-white shadow-soft-xs border border-[#315FEA]/20 dark:border-[#334155]/60 font-semibold' 
                      : 'text-[#475569] dark:text-[#94A3B8] hover:bg-[#F3F6FA] dark:hover:bg-[#1E293B]/50 hover:text-[#172033] dark:hover:text-white'}
                  `}
                  onClick={onNavigate}
                >
                  <item.icon
                    className={`h-5 w-5 shrink-0 transition-colors motion-reduce:transition-none ${isActive ? 'text-[#315FEA]' : 'text-[#64748B] group-hover:text-[#315FEA]'}`}
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
                  group flex items-center rounded-[6px] px-3.5 py-2.5 text-xs font-medium transition-all motion-reduce:transition-none
                  ${isActive 
                    ? 'bg-[#315FEA]/10 dark:bg-[#1E293B] text-[#315FEA] dark:text-white shadow-soft-xs border border-[#315FEA]/20 dark:border-[#334155]/60 font-semibold' 
                    : 'text-[#475569] dark:text-[#94A3B8] hover:bg-[#F3F6FA] dark:hover:bg-[#1E293B]/50 hover:text-[#172033] dark:hover:text-white'}
                `}
                onClick={onNavigate}
              >
                <item.icon
                  className={`
                    mr-3 h-4 w-4 flex-shrink-0 transition-colors motion-reduce:transition-none
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
        <div className="p-3 border-t border-[#E3E7ED] dark:border-[#1E293B] bg-[#F3F6FA]/50 dark:bg-[#0B1220]/50 flex justify-center">
          <Link 
            href="/admin/account"
            title={userFullName || userEmail || 'Account'}
            className="w-10 h-10 rounded-[6px] bg-[#315FEA] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-soft-xs hover:bg-[#254EDB] transition-colors"
          >
            {userFullName ? userFullName[0].toUpperCase() : 'U'}
          </Link>
        </div>
      ) : (
        <div className="p-4 border-t border-[#E3E7ED] dark:border-[#1E293B] bg-[#F3F6FA]/50 dark:bg-[#0B1220]/50">
          <Link 
            href="/admin/account"
            className="flex items-center space-x-3 group hover:opacity-95 transition-opacity"
            onClick={onNavigate}
          >
            <div className="w-8 h-8 rounded-[6px] bg-[#315FEA] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-soft-xs">
              {userFullName ? userFullName[0].toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold text-[#172033] dark:text-white truncate group-hover:text-[#315FEA] transition-colors">
                {userFullName || 'Business Owner'}
              </p>
              <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] truncate">{userEmail}</p>
            </div>
          </Link>
          {isMobile && onToggleTheme && (
            <div className="mt-3 pt-3 border-t border-[#E3E7ED] dark:border-[#1E293B] flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Theme</span>
              <button
                type="button"
                onClick={onToggleTheme}
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-[6px] bg-[#F3F6FA] dark:bg-[#1E293B] text-[#172033] dark:text-white border border-[#CBD5E1] dark:border-[#334155] hover:border-[#7950B8] transition-colors"
              >
                {resolvedTheme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-[#7950B8]" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);

  // Close mobile drawer on route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Focus trap, Escape key handling, and focus restoration for mobile drawer
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previouslyFocusedElement = document.activeElement as HTMLElement | null;
    const triggerNode = mobileTriggerRef.current;

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const timer = setTimeout(() => {
      const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusable && focusable.length > 0) {
        focusable[0].focus();
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setMobileMenuOpen(false);
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(focusableSelector);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      if (triggerNode) {
        triggerNode.focus();
      } else if (previouslyFocusedElement) {
        previouslyFocusedElement.focus();
      }
    };
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
      <div className="min-h-screen bg-white dark:bg-[#0B1220] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#315FEA]/30 border-t-[#315FEA] rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-[#475569] dark:text-[#94A3B8]">Loading secure workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const isConfirmed = user?.isOnboardingConfirmed ?? false;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1220] text-[#172033] dark:text-[#E2E8F0] transition-colors duration-150 relative">
      {/* Fixed Ambient Light Meshes for Genuine Glass Refraction */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        {/* Editorial Cobalt ambient glow (top left) */}
        <div className="absolute -top-[15%] left-[8%] w-[650px] h-[650px] rounded-full bg-gradient-to-br from-[#315FEA]/12 via-[#315FEA]/5 to-transparent blur-[130px] dark:from-[#315FEA]/16 transform-gpu" />
        {/* Restrained Purple ambient glow (mid right) */}
        <div className="absolute top-[35%] -right-[12%] w-[700px] h-[700px] rounded-full bg-gradient-to-bl from-[#7950B8]/12 via-[#7950B8]/5 to-transparent blur-[140px] dark:from-[#7950B8]/18 transform-gpu" />
        {/* Restrained Warmth accent (bottom left) */}
        <div className="absolute -bottom-[15%] left-[20%] w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-[#315FEA]/8 to-transparent blur-[120px] dark:from-[#315FEA]/10 transform-gpu" />
      </div>

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
            className="fixed inset-0 bg-[#0B1220]/60 dark:bg-black/80 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer slide-in panel */}
          <div
            ref={drawerRef}
            className="fixed inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white dark:bg-[#0F172A] border-r border-[#CBD5E1] dark:border-[#1E293B] shadow-soft-xl"
          >
            <SidebarView
              isConfirmed={isConfirmed}
              pathname={pathname}
              onNavigate={() => setMobileMenuOpen(false)}
              userEmail={user?.email}
              userFullName={user?.fullName}
              isMobile={true}
              onClose={() => setMobileMenuOpen(false)}
              resolvedTheme={resolvedTheme}
              onToggleTheme={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            />
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar (lg+) */}
      <aside
        id="admin-sidebar"
        aria-label="Admin Navigation"
        className={`
          hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 bg-white dark:bg-[#0F172A] border-r border-[#CBD5E1] dark:border-[#1E293B] z-30 transition-[width] duration-200 ease-in-out
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
          resolvedTheme={resolvedTheme}
          onToggleTheme={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        />
      </aside>

      {/* Main Content Area */}
      <div className={`flex flex-1 flex-col relative z-10 transition-[padding-left] duration-200 ease-in-out ${desktopCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        {/* Sticky Unified Top Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/60 dark:border-white/10 glass-toolbar px-3.5 sm:px-6 lg:px-8 shadow-soft-xs">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            {/* Mobile/Tablet Hamburger Toggle (< lg) with 44px min touch target */}
            <button
              ref={mobileTriggerRef}
              type="button"
              className="lg:hidden h-11 w-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[6px] bg-[#F3F6FA] hover:bg-[#E3E7ED] dark:bg-[#1E293B] dark:hover:bg-[#334155] text-[#172033] dark:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] shrink-0"
              onClick={() => setMobileMenuOpen(true)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="admin-sidebar-drawer"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* Mobile Branding (< lg) */}
            <div className="lg:hidden flex items-center space-x-1.5 min-w-0">
              <Link href={isConfirmed ? "/admin" : "/admin/onboarding/business-basics"} className="flex items-center space-x-1.5 min-w-0 select-none">
                <span className="font-extrabold text-base sm:text-lg text-brand-gradient tracking-tight truncate">SPAROVIA</span>
                <span className="hidden min-[380px]:inline-block text-[9px] uppercase font-bold tracking-widest px-1 py-0.5 rounded-[4px] bg-[#315FEA]/10 text-[#315FEA] border border-[#315FEA]/20 shrink-0">
                  ADMIN
                </span>
              </Link>
            </div>

            {/* Desktop Sidebar Rail Toggle Button (lg+) */}
            <button
              type="button"
              className="hidden lg:flex h-9 w-9 items-center justify-center rounded-[6px] bg-[#F3F6FA] hover:bg-[#E3E7ED] dark:bg-[#1E293B] dark:hover:bg-[#334155] text-[#475569] dark:text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
              onClick={() => setDesktopCollapsed(!desktopCollapsed)}
              aria-label={desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </button>

            {/* Desktop Workspace Context Breadcrumb (lg+) */}
            <div className="hidden lg:flex items-center space-x-2 select-none">
              <span className="text-xs text-[#64748B]">Workspace</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#CBD5E1]" />
              <span className="text-xs font-semibold px-2 py-0.5 rounded-[4px] bg-[#F3F6FA] text-[#172033] dark:bg-[#1E293B] dark:text-white border border-[#E3E7ED] dark:border-[#334155] truncate max-w-[240px]">
                {user?.tenantId ? `Tenant ${user.tenantId.substring(0, 8)}...` : 'Sparovia Platform'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            {/* Quick Theme Toggle */}
            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode (currently ${resolvedTheme === 'dark' ? 'Dark' : 'Light'})`}
              className="flex items-center text-xs font-semibold text-[#475569] dark:text-[#94A3B8] hover:text-[#315FEA] dark:hover:text-[#608FFE] transition-colors motion-reduce:transition-none py-2 px-2.5 sm:px-3 rounded-[6px] hover:bg-[#F3F6FA] dark:hover:bg-[#1E293B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] shrink-0"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400 sm:mr-1.5 shrink-0" />
              ) : (
                <Moon className="h-4 w-4 text-[#7950B8] sm:mr-1.5 shrink-0" />
              )}
              <span className="hidden sm:inline capitalize">
                {resolvedTheme === 'dark' ? 'Light' : 'Dark'}
              </span>
            </button>

            <button
              onClick={handleLogout}
              aria-label="Sign Out"
              title="Sign Out"
              className="flex items-center text-xs font-semibold text-[#475569] dark:text-[#94A3B8] hover:text-[#B91C1C] dark:hover:text-[#B91C1C] transition-colors motion-reduce:transition-none py-2 px-2.5 sm:px-3 rounded-[6px] hover:bg-[#F3F6FA] dark:hover:bg-[#1E293B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] shrink-0"
            >
              <LogOut className="sm:mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-8">
          <div className="mx-auto max-w-7xl p-3.5 sm:p-6 lg:p-8 space-y-6">
            {children}
          </div>
        </main>

        {/* Mobile Persistent Bottom Quick Navigation Bar (< lg) */}
        <nav
          aria-label="Mobile Quick Navigation"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-16 glass-toolbar border-t border-slate-200/80 dark:border-white/10 px-2 flex items-center justify-around shadow-2xl backdrop-blur-xl"
        >
          <Link
            href="/admin"
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-semibold transition-colors ${
              pathname === '/admin'
                ? 'text-[#315FEA] dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className={`w-5 h-5 mb-0.5 ${pathname === '/admin' ? 'text-[#315FEA] dark:text-blue-400' : ''}`} />
            <span>Overview</span>
          </Link>

          <Link
            href="/admin/leads"
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-semibold transition-colors ${
              pathname?.startsWith('/admin/leads')
                ? 'text-[#315FEA] dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Users className={`w-5 h-5 mb-0.5 ${pathname?.startsWith('/admin/leads') ? 'text-[#315FEA] dark:text-blue-400' : ''}`} />
            <span>Leads</span>
          </Link>

          <Link
            href="/admin/images"
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-semibold transition-colors ${
              pathname?.startsWith('/admin/images')
                ? 'text-[#7950B8] dark:text-purple-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ImageIcon className={`w-5 h-5 mb-0.5 ${pathname?.startsWith('/admin/images') ? 'text-[#7950B8] dark:text-purple-400' : ''}`} />
            <span>Studio</span>
          </Link>

          <Link
            href="/admin/business-presence"
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-semibold transition-colors ${
              pathname?.startsWith('/admin/business-presence')
                ? 'text-[#315FEA] dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Globe className={`w-5 h-5 mb-0.5 ${pathname?.startsWith('/admin/business-presence') ? 'text-[#315FEA] dark:text-blue-400' : ''}`} />
            <span>Presence</span>
          </Link>

          <Link
            href="/admin/account"
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-semibold transition-colors ${
              pathname?.startsWith('/admin/account')
                ? 'text-[#315FEA] dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <UserCircle className={`w-5 h-5 mb-0.5 ${pathname?.startsWith('/admin/account') ? 'text-[#315FEA] dark:text-blue-400' : ''}`} />
            <span>Account</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
