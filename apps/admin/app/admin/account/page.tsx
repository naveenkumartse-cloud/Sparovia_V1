'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTheme } from '@/lib/theme/ThemeContext';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { toast } from '@/components/ui/Toast';
import { 
  User, 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Monitor, 
  CheckCircle2, 
  Copy, 
  Check, 
  Lock, 
  KeyRound, 
  Sparkles,
  Info
} from 'lucide-react';

export default function AccountPage() {
  const { user } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'security'>(
    activeTabParam === 'settings' ? 'settings' : activeTabParam === 'security' ? 'security' : 'profile'
  );

  const [copiedTenantId, setCopiedTenantId] = useState(false);

  useEffect(() => {
    if (activeTabParam === 'settings' || activeTabParam === 'security' || activeTabParam === 'profile') {
      setActiveTab(activeTabParam);
    }
  }, [activeTabParam]);

  const handleTabChange = (tab: 'profile' | 'settings' | 'security') => {
    setActiveTab(tab);
    router.replace(`/admin/account?tab=${tab}`, { scroll: false });
  };

  const copyTenantId = () => {
    if (user?.tenantId) {
      navigator.clipboard.writeText(user.tenantId);
      setCopiedTenantId(true);
      toast.success('Workspace ID copied to clipboard.');
      setTimeout(() => setCopiedTenantId(false), 2000);
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    const label = newTheme === 'system' ? 'System Default' : newTheme.charAt(0).toUpperCase() + newTheme.slice(1);
    toast.info(`Appearance updated to ${label} mode.`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Account &amp; Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-[#94A3B8] mt-1">
          Manage your client profile, admin appearance preferences, and workspace security.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-[#1E293B] space-x-2 sm:space-x-4">
        <button
          type="button"
          onClick={() => handleTabChange('profile')}
          className={`flex items-center space-x-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'profile'
              ? 'border-[#3B82F6] text-[#3B82F6]'
              : 'border-transparent text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('settings')}
          className={`flex items-center space-x-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'settings'
              ? 'border-[#3B82F6] text-[#3B82F6]'
              : 'border-transparent text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          <span>Settings</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('security')}
          className={`flex items-center space-x-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'security'
              ? 'border-[#3B82F6] text-[#3B82F6]'
              : 'border-transparent text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Security</span>
        </button>
      </div>

      {/* TAB 1: PROFILE */}
      {activeTab === 'profile' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center space-x-4 pb-6 border-b border-slate-100 dark:border-[#1E293B]">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#3B82F6] to-[#8B3FD1] flex items-center justify-center text-white font-extrabold text-xl shadow-md">
                {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {user?.fullName || 'Business Owner'}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500 dark:text-[#94A3B8] font-mono">
                    {user?.email}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Verified
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
              {/* Full Name */}
              <div>
                <div className="flex items-center gap-1.5">
                  <label htmlFor="accountFullName" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                    Account Name
                  </label>
                  <InfoTooltip content="The legal name of the registered workspace administrator." />
                </div>
                <input
                  id="accountFullName"
                  type="text"
                  readOnly
                  value={user?.fullName || ''}
                  className="mt-2 w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white cursor-default focus:outline-none"
                />
              </div>

              {/* Email Address (Read-only for auth safety) */}
              <div>
                <div className="flex items-center gap-1.5">
                  <label htmlFor="accountEmail" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                    Work Email (Primary)
                  </label>
                  <InfoTooltip content="Primary authentication email. Protected and verified against your Sparovia workspace." />
                </div>
                <div className="relative mt-2">
                  <input
                    id="accountEmail"
                    type="email"
                    readOnly
                    value={user?.email || ''}
                    className="w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white cursor-default pr-24 focus:outline-none"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
                    <span className="text-[11px] font-medium text-slate-400 dark:text-[#64748B] flex items-center">
                      <Lock className="w-3 h-3 mr-1" />
                      Locked
                    </span>
                  </div>
                </div>
              </div>

              {/* Workspace Identifier */}
              <div>
                <div className="flex items-center gap-1.5">
                  <label htmlFor="accountTenantId" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                    Workspace ID
                  </label>
                  <InfoTooltip content="Your isolated tenant boundary identifier across the Sparovia architecture." />
                </div>
                <div className="relative mt-2">
                  <input
                    id="accountTenantId"
                    type="text"
                    readOnly
                    value={user?.tenantId || 'Not assigned'}
                    className="w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-xs font-mono text-slate-700 dark:text-slate-300 cursor-default pr-12 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={copyTenantId}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:text-[#64748B] dark:hover:text-white p-1 rounded transition-colors"
                    title="Copy Workspace ID"
                  >
                    {copiedTenantId ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Membership Role */}
              <div>
                <div className="flex items-center gap-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                    Account Role
                  </label>
                  <InfoTooltip content="Your authorization privileges within this client workspace." />
                </div>
                <div className="mt-2 flex items-center h-[42px] px-4 rounded-xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155]">
                  <span className="text-sm font-medium text-slate-800 dark:text-white flex items-center">
                    <Sparkles className="w-4 h-4 mr-2 text-[#3B82F6]" />
                    Workspace Owner
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SETTINGS (APPEARANCE) */}
      {activeTab === 'settings' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 sm:p-8 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                <Sun className="w-5 h-5 mr-2 text-[#FF7043]" />
                Appearance
              </h2>
              <p className="text-sm text-slate-500 dark:text-[#94A3B8] mt-1">
                Customize how the Sparovia Admin workspace looks on your device.
              </p>
            </div>

            {/* Public Website Isolation Notice */}
            <div className="mt-4 p-4 rounded-xl bg-blue-50 dark:bg-[#3B82F6]/10 border border-blue-200/60 dark:border-[#3B82F6]/20 flex items-start space-x-3">
              <Info className="w-5 h-5 text-[#3B82F6] shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 dark:text-[#CBD5E1] leading-relaxed">
                <span className="font-semibold text-slate-900 dark:text-white">Public Website Isolation:</span>{' '}
                This appearance setting strictly applies to your private Sparovia Admin dashboard. It does <strong>NOT</strong> change your Public Website theme or published customer-facing design.
              </div>
            </div>

            {/* Theme Selector Cards */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Light Mode */}
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`relative flex flex-col text-left p-5 rounded-2xl border-2 transition-all ${
                  theme === 'light'
                    ? 'border-[#3B82F6] bg-blue-50/40 dark:bg-blue-900/10 shadow-md ring-2 ring-[#3B82F6]/20'
                    : 'border-slate-200 dark:border-[#334155] hover:border-slate-300 dark:hover:border-[#475569] bg-slate-50/50 dark:bg-[#0B1220]/40'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    theme === 'light' ? 'border-[#3B82F6] bg-[#3B82F6]' : 'border-slate-300 dark:border-[#475569]'
                  }`}>
                    {theme === 'light' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Light</p>
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
                    Clean, crisp white and neutral slate surfaces with optimal daytime contrast.
                  </p>
                </div>
              </button>

              {/* Dark Mode */}
              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`relative flex flex-col text-left p-5 rounded-2xl border-2 transition-all ${
                  theme === 'dark'
                    ? 'border-[#3B82F6] bg-blue-50/40 dark:bg-blue-900/10 shadow-md ring-2 ring-[#3B82F6]/20'
                    : 'border-slate-200 dark:border-[#334155] hover:border-slate-300 dark:hover:border-[#475569] bg-slate-50/50 dark:bg-[#0B1220]/40'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    theme === 'dark' ? 'border-[#3B82F6] bg-[#3B82F6]' : 'border-slate-300 dark:border-[#475569]'
                  }`}>
                    {theme === 'dark' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Dark</p>
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
                    Signature Sparovia Dark Navy (#0B1220) and Charcoal surfaces for focused workflow.
                  </p>
                </div>
              </button>

              {/* System Default */}
              <button
                type="button"
                onClick={() => handleThemeChange('system')}
                className={`relative flex flex-col text-left p-5 rounded-2xl border-2 transition-all ${
                  theme === 'system'
                    ? 'border-[#3B82F6] bg-blue-50/40 dark:bg-blue-900/10 shadow-md ring-2 ring-[#3B82F6]/20'
                    : 'border-slate-200 dark:border-[#334155] hover:border-slate-300 dark:hover:border-[#475569] bg-slate-50/50 dark:bg-[#0B1220]/40'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="p-2 rounded-xl bg-slate-500/10 text-slate-400 border border-slate-500/20">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    theme === 'system' ? 'border-[#3B82F6] bg-[#3B82F6]' : 'border-slate-300 dark:border-[#475569]'
                  }`}>
                    {theme === 'system' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">System Default</p>
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
                    Automatically match your operating system theme preference (currently: {resolvedTheme}).
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                <KeyRound className="w-5 h-5 mr-2 text-[#3B82F6]" />
                Password &amp; Authentication
              </h2>
              <p className="text-sm text-slate-500 dark:text-[#94A3B8] mt-1">
                Your account credentials and active authentication session state.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Password Protection</p>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">
                  Encrypted using BCrypt adaptive key hashing with secure salting.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/forgot-password?email=${encodeURIComponent(user?.email || '')}`)}
                className="py-2 px-4 rounded-xl text-xs font-semibold text-white bg-[#3B82F6] hover:bg-[#2563EB] transition-colors shrink-0 shadow-sm"
              >
                Send Password Reset Link
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-[#94A3B8]">Session Security</span>
                <span className="inline-flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Active (HTTP-Only Secure Cookie)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-[#94A3B8]">Email Verification</span>
                <span className="inline-flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Verified
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-[#94A3B8]">Tenant Isolation</span>
                <span className="text-xs text-slate-700 dark:text-slate-300 font-mono">
                  Enforced Server-Side
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
