'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  ShieldCheck, 
  Clock, 
  Copy, 
  Check, 
  ExternalLink, 
  Globe, 
  MapPin, 
  Phone, 
  Mail, 
  CalendarCheck,
  Compass,
  Navigation,
  BookOpen,
  ArrowRight,
  MapPinned,
  Info,
  Users,
  Award,
  Sparkles,
  Layers,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { BusinessPresenceSkeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { apiClient } from '@/lib/api/client';

interface VerifiedNap {
  businessName: string;
  businessType: string;
  primaryCategory: string;
  businessPhone?: string;
  businessEmail: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  serviceAreas?: string[];
  isConfirmed: boolean;
  businessDescription?: string;
  targetCustomers?: string[];
  differentiators?: string;
  yearsInBusiness?: number;
  certifications?: string[];
  awards?: string[];
  accreditations?: string[];
  warranties?: string[];
  authorizedStatuses?: string[];
  otherClaims?: string[];
  servicesCount?: number;
  serviceNames?: string[];
}

interface BusinessPresenceDto {
  operatingHours?: string;
  publicNotice?: string;
  lastReviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  verifiedNap?: VerifiedNap;
}

export default function BusinessPresencePage() {
  const [data, setData] = useState<BusinessPresenceDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnboardingRequired, setIsOnboardingRequired] = useState(false);
  const [showExtendedContext, setShowExtendedContext] = useState(true);

  // Form states
  const [operatingHours, setOperatingHours] = useState('');
  const [publicNotice, setPublicNotice] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [hasCopiedNap, setHasCopiedNap] = useState(false);

  // Track dirty state
  const isDirty = (data !== null) && (
    operatingHours !== (data.operatingHours || '') ||
    publicNotice !== (data.publicNotice || '')
  );

  useUnsavedChanges(isDirty);

  const fetchPresence = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsOnboardingRequired(false);

    try {
      const res = await apiClient.get<BusinessPresenceDto>('/business-presence');
      setData(res);
      setOperatingHours(res.operatingHours || '');
      setPublicNotice(res.publicNotice || '');
    } catch (err: any) {
      if (err?.code === 'ONBOARDING_REQUIRED' || err?.status === 403 || err?.message?.includes('Onboarding incomplete')) {
        setIsOnboardingRequired(true);
      } else {
        setError(err?.message || 'Failed to load business presence information. Please check your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPresence();
  }, [fetchPresence]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    try {
      const updated = await apiClient.put<BusinessPresenceDto>('/business-presence', {
        operatingHours,
        publicNotice
      });
      setData(updated);
      setOperatingHours(updated.operatingHours || '');
      setPublicNotice(updated.publicNotice || '');
      toast.success('Business presence updated successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save presence information. Draft preserved.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkReviewed = async () => {
    if (isReviewing) return;

    setIsReviewing(true);
    try {
      const updated = await apiClient.post<BusinessPresenceDto>('/business-presence/mark-reviewed', {});
      setData(updated);
      toast.success('Presence details verified and marked as reviewed');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update review status');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleCopyNap = async () => {
    if (!data?.verifiedNap) return;

    const nap = data.verifiedNap;
    const addressParts = [
      nap.addressLine1,
      nap.addressLine2,
      nap.city,
      nap.state,
      nap.postalCode,
      nap.country
    ].filter(Boolean).join(', ');

    const serviceAreasText = nap.serviceAreas && nap.serviceAreas.length > 0
      ? `Service Areas: ${nap.serviceAreas.join(', ')}`
      : null;

    const napText = [
      `Business Name: ${nap.businessName}`,
      `Category: ${nap.primaryCategory} (${nap.businessType})`,
      addressParts ? `Address: ${addressParts}` : null,
      serviceAreasText,
      nap.businessPhone ? `Phone: ${nap.businessPhone}` : null,
      `Email: ${nap.businessEmail}`,
      nap.website ? `Website: ${nap.website}` : null,
      operatingHours ? `Operating Hours:\n${operatingHours}` : null,
      publicNotice ? `Public Notice:\n${publicNotice}` : null
    ].filter(Boolean).join('\n');

    try {
      await navigator.clipboard.writeText(napText);
      setHasCopiedNap(true);
      toast.success('Verified NAP profile copied to clipboard');
      setTimeout(() => setHasCopiedNap(false), 2000);
    } catch {
      toast.error('Could not copy to clipboard. Please copy manually.');
    }
  };

  const formatReviewedDate = (isoString?: string) => {
    if (!isoString) return 'Not yet reviewed';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return 'Recently';
    }
  };

  if (isLoading) {
    return <BusinessPresenceSkeleton />;
  }

  if (isOnboardingRequired) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Business Presence
          </h1>
          <p className="text-sm text-slate-500 dark:text-[#94A3B8] mt-1">
            Manage the business information used by Sparovia for your website and supported presence experiences.
          </p>
        </div>

        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 sm:p-8 shadow-sm">
          <EmptyState
            icon={<Building2 className="w-8 h-8 text-blue-500" />}
            title="Business Context Confirmation Required"
            description="Your canonical business facts (Name, Address, Phone, Website, and Category) must be confirmed during onboarding before managing digital presence profiles."
            action={
              <Link href="/admin/onboarding/business-basics">
                <Button variant="primary" size="md">
                  Complete Onboarding
                </Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <ErrorState
          title="Unable to load Business Presence"
          error={error || 'Failed to retrieve presence details.'}
          onRetry={fetchPresence}
        />
      </div>
    );
  }

  const nap = data.verifiedNap;
  const addressFormatted = [
    nap?.addressLine1,
    nap?.addressLine2,
    nap?.city,
    nap?.state,
    nap?.postalCode,
    nap?.country
  ].filter(Boolean).join(', ') || 'No physical address configured (Digital / Service Area)';

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Business Presence
          </h1>
          <p className="text-sm text-slate-500 dark:text-[#94A3B8] mt-1">
            Manage the business information used by Sparovia for your website and supported presence experiences.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-[#1E293B] text-slate-700 dark:text-[#94A3B8] border border-slate-200 dark:border-[#334155]">
            <CalendarCheck className="w-3.5 h-3.5 text-blue-500" />
            <span>Reviewed: {formatReviewedDate(data.lastReviewedAt)}</span>
          </div>
        </div>
      </div>

      {/* 2. Understanding Business Presence in Pilot V1 — Comprehensive Guidance */}
      <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-3.5 flex-1">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Understanding Business Presence in Sparovia
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Pilot V1 Guidance
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] mt-1 leading-relaxed">
                Your business presence represents how your company is identified, discovered, and contacted by potential clients across digital channels.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1 text-xs text-slate-600 dark:text-[#94A3B8]">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200/60 dark:border-[#1E293B] space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  <span>What Sparovia Manages</span>
                </div>
                <p className="leading-relaxed">
                  Sparovia maintains your verified core business facts (NAP: Name, Address, Phone), category, operating hours, and public announcements as the authoritative single source of truth for your Sparovia website.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200/60 dark:border-[#1E293B] space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <span>How Sparovia Uses It</span>
                </div>
                <p className="leading-relaxed">
                  Your verified information powers your website header, footer, contact sections, structured SEO schema (JSON-LD), and inbound lead routing.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200/60 dark:border-[#1E293B] space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Why Consistency Matters</span>
                </div>
                <p className="leading-relaxed">
                  Keeping identical business information across the web reinforces brand trust, eliminates customer confusion, and strengthens local search ranking.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-300">
                  <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>External Sync Boundary</span>
                </div>
                <p className="text-amber-800 dark:text-amber-300/90 leading-relaxed">
                  <strong className="font-semibold">External presence integrations are not connected in Pilot V1.</strong> This is an intentional boundary, not an error. Sparovia does not automatically push updates to Google, Apple, or directory listings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Supported Presence Information (Sourced from Business Context) */}
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-[#1E293B] shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-[#1E293B]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Verified Business Information (NAP)
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Source of Truth
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-[#94A3B8]">
                Canonical facts confirmed in your Business Context. Each field below is maintained in Sparovia for your website and presence experiences.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyNap}
                leftIcon={hasCopiedNap ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
              >
                {hasCopiedNap ? 'Copied' : 'Copy Verified NAP'}
              </Button>

              <Link href="/admin/business-context">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Edit in Business Context
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Supported Field Grid with [Field Label] ⓘ Pattern */}
        <div className="p-6 sm:p-8 bg-slate-50/50 dark:bg-[#0B1220]/40 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Field 1: Business Name */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B]/70 border border-slate-200/70 dark:border-[#334155]/60 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Business Name
                </span>
                <InfoTooltip 
                  content={`What to review:\nThe official, legally recognized trading name of your business.\n\nWhy it matters:\nPrimary brand identifier that establishes trust and local presence.\n\nHow Sparovia uses it:\nDisplayed across your website header, footer, page titles, and structured schema (JSON-LD).\n\nExternal sync: External presence integrations are not connected in Pilot V1. Managed within Sparovia.`} 
                />
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate" title={nap?.businessName}>
                {nap?.businessName || '—'}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between">
              <span className="text-[10px] font-medium text-slate-400 dark:text-[#64748B]">
                Managed in Sparovia
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                Context Source
              </span>
            </div>
          </div>

          {/* Field 2: Primary Category & Type */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B]/70 border border-slate-200/70 dark:border-[#334155]/60 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Primary Category & Type
                </span>
                <InfoTooltip 
                  content={`What to review:\nYour primary business classification and operating model (Storefront, Service Area, Hybrid, or Online).\n\nWhy it matters:\nCategorizes your business in directory lookups and search engine industry verticals.\n\nHow Sparovia uses it:\nStructures website semantic metadata and local business schema types.\n\nExternal sync: External presence integrations are not connected in Pilot V1. Managed within Sparovia.`} 
                />
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate" title={`${nap?.primaryCategory} (${nap?.businessType})`}>
                {nap?.primaryCategory || '—'}
                <span className="text-xs font-normal text-slate-500 dark:text-[#94A3B8] ml-1.5">
                  ({nap?.businessType || 'General'})
                </span>
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between">
              <span className="text-[10px] font-medium text-slate-400 dark:text-[#64748B]">
                Managed in Sparovia
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                Context Source
              </span>
            </div>
          </div>

          {/* Field 3: Business Phone */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B]/70 border border-slate-200/70 dark:border-[#334155]/60 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Business Phone
                </span>
                <InfoTooltip 
                  content={`What to review:\nThe direct telephone number customers should use to contact your business.\n\nWhy it matters:\nImmediate contact channel for potential clients requesting consultations or quotes.\n\nHow Sparovia uses it:\nPowers click-to-call actions on your website header, navigation, and contact sections.\n\nExternal sync: External presence integrations are not connected in Pilot V1. Managed within Sparovia.`} 
                />
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate" title={nap?.businessPhone}>
                {nap?.businessPhone || 'No phone specified'}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between">
              <span className="text-[10px] font-medium text-slate-400 dark:text-[#64748B]">
                Managed in Sparovia
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                Context Source
              </span>
            </div>
          </div>

          {/* Field 4: Business Email */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B]/70 border border-slate-200/70 dark:border-[#334155]/60 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Business Email
                </span>
                <InfoTooltip 
                  content={`What to review:\nThe primary customer communication email address for inquiries and consultations.\n\nWhy it matters:\nEnables formal written correspondence, RFPs, and consultation requests.\n\nHow Sparovia uses it:\nDisplayed on your website contact section and used for lead notifications.\n\nExternal sync: External presence integrations are not connected in Pilot V1. Managed within Sparovia.`} 
                />
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate" title={nap?.businessEmail}>
                {nap?.businessEmail || '—'}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between">
              <span className="text-[10px] font-medium text-slate-400 dark:text-[#64748B]">
                Managed in Sparovia
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                Context Source
              </span>
            </div>
          </div>

          {/* Field 5: Operating Address */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B]/70 border border-slate-200/70 dark:border-[#334155]/60 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Operating Address
                </span>
                <InfoTooltip 
                  content={`What to review:\nThe physical premises, office, showroom, or storefront location where your business operates.\n\nWhy it matters:\nProvides crucial local proximity signals and physical verification for clients.\n\nHow Sparovia uses it:\nAppears in website contact details, map links, and structured PostalAddress schema.\n\nExternal sync: External presence integrations are not connected in Pilot V1. Managed within Sparovia.`} 
                />
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1" title={addressFormatted}>
                {addressFormatted}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between">
              <span className="text-[10px] font-medium text-slate-400 dark:text-[#64748B]">
                Managed in Sparovia
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                Context Source
              </span>
            </div>
          </div>

          {/* Field 6: Website URL */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B]/70 border border-slate-200/70 dark:border-[#334155]/60 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Website URL
                </span>
                <InfoTooltip 
                  content={`What to review:\nThe canonical web address for your business website.\n\nWhy it matters:\nRepresents your digital homepage across all client touchpoints and search citations.\n\nHow Sparovia uses it:\nUsed for canonical URL tags, open graph links, and external profile alignment.\n\nExternal sync: External presence integrations are not connected in Pilot V1. Managed within Sparovia.`} 
                />
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {nap?.website ? (
                  <a 
                    href={nap.website} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {nap.website}
                  </a>
                ) : (
                  'No website configured'
                )}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between">
              <span className="text-[10px] font-medium text-slate-400 dark:text-[#64748B]">
                Managed in Sparovia
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                Context Source
              </span>
            </div>
          </div>

          {/* Field 7: Service Areas (if configured) */}
          {nap?.serviceAreas && nap.serviceAreas.length > 0 && (
            <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B]/70 border border-slate-200/70 dark:border-[#334155]/60 flex flex-col justify-between space-y-3 md:col-span-2 lg:col-span-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <MapPinned className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Service Areas
                  </span>
                  <InfoTooltip 
                    content={`What to review:\nThe geographical cities, counties, or territories your business serves.\n\nWhy it matters:\nInforms prospective clients whether their project location falls within your operational territory.\n\nHow Sparovia uses it:\nFeatured in website service coverage badges and local area schema metadata.\n\nExternal sync: External presence integrations are not connected in Pilot V1. Managed within Sparovia.`} 
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {nap.serviceAreas.map((area, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-[#0B1220] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#334155]"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between">
                <span className="text-[10px] font-medium text-slate-400 dark:text-[#64748B]">
                  Managed in Sparovia
                </span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  Context Source
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Presence Information & Schedule Form */}
      <form onSubmit={handleSave} className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-[#1E293B] shadow-sm p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-100 dark:border-[#1E293B] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Presence Information & Schedule
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#94A3B8] mt-1">
              Configure public client hours and timely announcements. Clear, up-to-date presence info prevents customer drop-off.
            </p>
          </div>
          <span className="self-start sm:self-auto text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-[#94A3B8] border border-slate-200 dark:border-[#334155]">
            Managed in Sparovia
          </span>
        </div>

        <div className="space-y-6">
          {/* Field 8: Operating Hours */}
          <div className="space-y-1">
            <FormField
              label="Operating Hours"
              tooltip={`What to enter:\nYour weekly business opening and closing schedule (e.g. Mon–Fri: 9:00 AM – 5:00 PM, Sat: 10:00 AM – 2:00 PM, Sun: Closed).\n\nWhy it matters:\nPrevents client drop-off and sets clear expectations for inquiries, calls, and consultations.\n\nHow Sparovia uses it:\nDisplayed on your website contact section and openingHours schema.\n\nExternal sync: External presence integrations are not connected in Pilot V1. Managed within Sparovia.`}
              helperText="Managed in Sparovia for your website contact sections and customer guidance."
            >
              <textarea
                id="operatingHours"
                rows={4}
                value={operatingHours}
                onChange={(e) => setOperatingHours(e.target.value)}
                placeholder="e.g.&#10;Monday – Friday: 9:00 AM – 5:00 PM&#10;Saturday: 10:00 AM – 2:00 PM&#10;Sunday: Closed"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all resize-y"
              />
            </FormField>
          </div>

          {/* Field 9: Public Notice / Announcement */}
          <div className="space-y-1">
            <FormField
              label="Public Notice / Announcement"
              tooltip={`What to enter:\nAn optional temporary advisory, holiday notice, seasonal schedule adjustment, or booking update.\n\nWhy it matters:\nKeeps visitors informed of immediate operational changes without modifying permanent business context.\n\nHow Sparovia uses it:\nDisplayed as an active notice banner on your website when configured.\n\nExternal sync: External presence integrations are not connected in Pilot V1. Managed within Sparovia.`}
              helperText="Optional advisory. Managed in Sparovia. Leave blank if there are no active announcements."
            >
              <textarea
                id="publicNotice"
                rows={3}
                value={publicNotice}
                onChange={(e) => setPublicNotice(e.target.value)}
                placeholder="e.g. Closed on national holidays. Currently accepting new client consultations for Q4."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all resize-y"
              />
            </FormField>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-[#1E293B]">
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
              loadingText="Saving Changes..."
              disabled={!isDirty || isSaving}
            >
              Save Presence Info
            </Button>

            {isDirty && (
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Unsaved changes
              </span>
            )}
          </div>

          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleMarkReviewed}
            isLoading={isReviewing}
            loadingText="Verifying..."
            leftIcon={<CalendarCheck className="w-4 h-4 text-blue-500" />}
          >
            Mark as Reviewed
          </Button>
        </div>
      </form>

      {/* 5. Approved Extended Context for Presence & Discovery */}
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-[#1E293B] shadow-sm overflow-hidden">
        <div className="p-6 sm:p-7 border-b border-slate-100 dark:border-[#1E293B] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Approved Context for Search & Discovery
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Presence Signals
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#94A3B8]">
              Approved positioning, service catalog, and verifiable claims used by Sparovia for your website presence.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowExtendedContext(!showExtendedContext)}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {showExtendedContext ? (
                <>Hide Details <ChevronUp className="w-4 h-4" /></>
              ) : (
                <>Show Details <ChevronDown className="w-4 h-4" /></>
              )}
            </button>
            <Link href="/admin/business-context">
              <Button
                type="button"
                variant="outline"
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Edit Context
              </Button>
            </Link>
          </div>
        </div>

        {showExtendedContext && (
          <div className="p-6 sm:p-8 bg-slate-50/50 dark:bg-[#0B1220]/40 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Field: Business Description */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B]/70 border border-slate-200/70 dark:border-[#334155]/60 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Business Description
                  </span>
                  <InfoTooltip 
                    content={`What to review:\nA clear, authoritative description of your business, capabilities, and value proposition.\n\nWhy it matters:\nInforms prospective clients and powers search engine discovery snippets.\n\nHow Sparovia uses it:\nGrounds website about sections and meta description tags.\n\nExternal sync: External presence integrations are not connected in Pilot V1. Managed within Sparovia.`} 
                  />
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed">
                  {nap?.businessDescription || 'No business description provided yet.'}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between">
                <span className="text-[10px] font-medium text-slate-400 dark:text-[#64748B]">
                  Managed in Sparovia
                </span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                  Business Context
                </span>
              </div>
            </div>

            {/* Field: Differentiators */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B]/70 border border-slate-200/70 dark:border-[#334155]/60 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Differentiators & Positioning
                  </span>
                  <InfoTooltip 
                    content={`What to review:\nKey advantages that distinguish your business from competitors (e.g. guarantees, response times, precision).\n\nWhy it matters:\nConverts interested visitors into qualified inquiries by answering "Why choose us?".\n\nHow Sparovia uses it:\nFeatured in Why Choose Us sections and key value callouts.\n\nExternal sync: External presence integrations are not connected in Pilot V1. Managed within Sparovia.`} 
                  />
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed">
                  {nap?.differentiators || 'No differentiators configured yet.'}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between">
                <span className="text-[10px] font-medium text-slate-400 dark:text-[#64748B]">
                  Managed in Sparovia
                </span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                  Business Context
                </span>
              </div>
            </div>

            {/* Field: Target Customers */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B]/70 border border-slate-200/70 dark:border-[#334155]/60 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Target Customers
                  </span>
                  <InfoTooltip 
                    content={`What to review:\nThe specific client categories or property types your services cater to.\n\nWhy it matters:\nFocuses website copy and filters inquiries toward high-match client opportunities.\n\nHow Sparovia uses it:\nCalibrates website copy tone and customer segment targeting.\n\nExternal sync: External presence integrations are not connected in Pilot V1. Managed within Sparovia.`} 
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {nap?.targetCustomers && nap.targetCustomers.length > 0 ? (
                    nap.targetCustomers.map((cust, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-[#0B1220] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#334155]"
                      >
                        {cust}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-500">No target customer segments specified</span>
                  )}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between">
                <span className="text-[10px] font-medium text-slate-400 dark:text-[#64748B]">
                  Managed in Sparovia
                </span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                  Business Context
                </span>
              </div>
            </div>

            {/* Field: Services Offered */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B]/70 border border-slate-200/70 dark:border-[#334155]/60 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Services Offered
                  </span>
                  <InfoTooltip 
                    content={`What to review:\nThe approved offerings and capabilities delivered by your business.\n\nWhy it matters:\nCore service discovery triggers for clients looking for specific solutions.\n\nHow Sparovia uses it:\nPowers website service navigation cards and structured Service schema.\n\nExternal sync: External presence integrations are not connected in Pilot V1. Managed within Sparovia.`} 
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {nap?.serviceNames && nap.serviceNames.length > 0 ? (
                    nap.serviceNames.map((svc, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-[#0B1220] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#334155]"
                      >
                        {svc}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-500">No services cataloged yet</span>
                  )}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between">
                <span className="text-[10px] font-medium text-slate-400 dark:text-[#64748B]">
                  {nap?.servicesCount || 0} Services Configured
                </span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                  Business Context
                </span>
              </div>
            </div>

            {/* Field: Approved Facts & Claims */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B]/70 border border-slate-200/70 dark:border-[#334155]/60 flex flex-col justify-between space-y-3 md:col-span-2">
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Award className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Approved Facts & Claims (Trust Signals)
                  </span>
                  <InfoTooltip 
                    content={`What to review:\nVerified credentials including Years in Business, Certifications, Awards, Accreditations, and Warranties.\n\nWhy it matters:\nConcrete proof of capability that builds confidence during the client decision-making process.\n\nHow Sparovia uses it:\nDisplayed as trust badges, credential ribbons, and verified claims on your website.\n\nExternal sync: External presence integrations are not connected in Pilot V1. Managed within Sparovia.`} 
                  />
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {nap?.yearsInBusiness ? (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {nap.yearsInBusiness}+ Years in Business
                    </span>
                  ) : null}
                  {nap?.certifications?.map((c, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-[#0B1220] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#334155]">
                      🏅 {c}
                    </span>
                  ))}
                  {nap?.awards?.map((a, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-[#0B1220] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#334155]">
                      🏆 {a}
                    </span>
                  ))}
                  {nap?.warranties?.map((w, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-[#0B1220] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#334155]">
                      🛡️ {w}
                    </span>
                  ))}
                  {nap?.authorizedStatuses?.map((s, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-[#0B1220] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#334155]">
                      ✓ {s}
                    </span>
                  ))}
                  {(!nap?.yearsInBusiness && !nap?.certifications?.length && !nap?.awards?.length && !nap?.warranties?.length) && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">No approved trust claims cataloged yet</span>
                  )}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between">
                <span className="text-[10px] font-medium text-slate-400 dark:text-[#64748B]">
                  Managed in Sparovia
                </span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                  Business Context
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 6. External Presence Section (Capability Boundary & Directory Guidance) */}
      <div className="space-y-5">
        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Info className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  External Presence Capability Boundary
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-200 dark:bg-[#1E293B] text-slate-700 dark:text-[#94A3B8]">
                  Managed in Sparovia
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                External presence integrations are not connected in Pilot V1.
              </p>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed">
                This business information is maintained in your Sparovia account and is used by supported Sparovia website and presence experiences. Automated external synchronization (such as Google Business Profile API, Apple Maps API, or automated directory publishing) is not connected in Pilot V1. This is an intentional capability boundary, not an error.
              </p>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] pt-1">
                To maximize search consistency and client discovery, use your verified details above to manually keep external directory profiles aligned character-for-character.
              </p>
            </div>
          </div>
        </div>

        {/* Directory Profiles Guidance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Google Business Profile */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                    G
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Google Business Profile
                  </h4>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-[#94A3B8] border border-slate-200 dark:border-[#334155]">
                  Manual Alignment
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed">
                Google Business Profile is maintained separately. Ensure your Google listing information matches your verified Sparovia NAP details character-for-character to maximize local search ranking.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between">
              <a
                href="https://business.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1.5 transition-colors"
              >
                Open Google Business Profile
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={handleCopyNap}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white inline-flex items-center gap-1 transition-colors"
                title="Copy verified NAP for pasting"
              >
                <Copy className="w-3 h-3" />
                Copy NAP
              </button>
            </div>
          </div>

          {/* Card 2: Apple Maps */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#1E293B] flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-sm">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Apple Maps Connect
                  </h4>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-[#94A3B8] border border-slate-200 dark:border-[#334155]">
                  Manual Alignment
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed">
                Powers Siri and Apple Maps place cards for iOS customers. Apple place cards are updated independently through Apple Business Connect using your verified NAP profile.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between">
              <a
                href="https://mapsconnect.apple.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1.5 transition-colors"
              >
                Open Apple Business Connect
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={handleCopyNap}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white inline-flex items-center gap-1 transition-colors"
                title="Copy verified NAP for pasting"
              >
                <Copy className="w-3 h-3" />
                Copy NAP
              </button>
            </div>
          </div>

          {/* Card 3: Bing Places */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold text-sm">
                    <Compass className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Bing Places for Business
                  </h4>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-[#94A3B8] border border-slate-200 dark:border-[#334155]">
                  Manual Alignment
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed">
                Powers Microsoft Copilot and Bing local searches. Bing Places allows fast synchronization from your verified Google Business Profile.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between">
              <a
                href="https://www.bingplaces.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1.5 transition-colors"
              >
                Open Bing Places
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={handleCopyNap}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white inline-flex items-center gap-1 transition-colors"
                title="Copy verified NAP for pasting"
              >
                <Copy className="w-3 h-3" />
                Copy NAP
              </button>
            </div>
          </div>

          {/* Card 4: Local Directories & Citations */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-sm">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Local Citations & Directories
                  </h4>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-[#94A3B8] border border-slate-200 dark:border-[#334155]">
                  Manual Alignment
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed">
                Industry portals, local Chamber of Commerce, and Yelp. Uniform citations across the web signal reliability and raise organic search ranking.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between">
              <button
                type="button"
                onClick={handleCopyNap}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1.5 transition-colors"
              >
                Copy Verified NAP for Citations
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
