'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../providers/AuthProvider';
import { useBusiness } from '../providers/BusinessProvider';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { MobileNav } from './MobileNav';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Building2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { BusinessOnboardingWizard } from '../onboarding/BusinessOnboardingWizard';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const { businesses, isLoading: bizLoading, reloadBusinesses, activeBusiness } = useBusiness();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isPublicAuthRoute = pathname === '/admin/login' || pathname === '/admin/register';

  useEffect(() => {
    if (!authLoading && !user && !isPublicAuthRoute) {
      router.replace('/admin/login');
    }
  }, [authLoading, user, isPublicAuthRoute, router]);

  if (isPublicAuthRoute) {
    return <>{children}</>;
  }

  if (authLoading || (user && bizLoading)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-3 text-center">
          <LoadingSpinner size="lg" />
          <p className="text-sm font-medium text-slate-600">Loading Sparovia Workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  // Handle case where user is logged in but has no business created yet
  if (!bizLoading && businesses.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto shadow-purple-glow">
            <Building2 className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Create Your Business</h2>
          <p className="text-sm text-slate-300">
            Welcome to Sparovia! To access your Business Operating Workspace, you need to create your first business profile.
          </p>
          <CreateFirstBusinessForm onCreated={() => reloadBusinesses()} />
        </div>
      </div>
    );
  }

  // Handle Business Understanding Phase
  if (activeBusiness && !activeBusiness.isOnboardingComplete) {
    return (
      <BusinessOnboardingWizard 
        business={activeBusiness} 
        onComplete={() => reloadBusinesses()} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row antialiased">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 flex-shrink-0">
        <AdminSidebar />
      </div>

      {/* Mobile Drawer */}
      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader onMenuToggle={() => setMobileNavOpen(true)} />
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

function CreateFirstBusinessForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [industry, setIndustry] = useState('Home Interiors & Construction');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    setSlug(autoSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug || !industry) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const { createBusiness } = await import('@/lib/api/business');
      await createBusiness({ name, slug, industry });
      onCreated();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Failed to create business.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left pt-2">
      {error && <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg">{error}</div>}
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
          Business Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="e.g. KVN Interiors"
          required
          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus-ring"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
          Business Slug (URL identifier)
        </label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="e.g. kvn-interiors"
          required
          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus-ring"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
          Industry
        </label>
        <input
          type="text"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="e.g. Home Interiors & Construction"
          required
          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus-ring"
        />
      </div>
      <Button variant="primary" size="lg" isLoading={isSubmitting} className="w-full mt-2">
        Create Business Workspace
      </Button>
    </form>
  );
}
