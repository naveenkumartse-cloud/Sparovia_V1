'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { BusinessContextSkeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { 
  Building2, 
  Layers, 
  MapPin, 
  FileText, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface ServiceDto {
  id: string;
  serviceName: string;
  serviceDescription?: string;
}

interface BusinessContextSummaryDto {
  isConfirmed: boolean;
  businessName?: string;
  businessType?: string;
  primaryCategory?: string;
  businessPhone?: string;
  businessEmail?: string;
  website?: string;
  services?: ServiceDto[];
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  serviceAreas?: string[];
  targetCustomers?: string[];
  businessDescription?: string;
  differentiators?: string;
  yearsInBusiness?: number;
  certifications?: string[];
  awards?: string[];
  accreditations?: string[];
  warranties?: string[];
  authorizedStatuses?: string[];
  otherClaims?: string[];
}

export default function BusinessContextManagementPage() {
  const router = useRouter();
  const { checkAuth } = useAuth();
  const [data, setData] = useState<BusinessContextSummaryDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [hasConfirmedCheckbox, setHasConfirmedCheckbox] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await apiClient.get<BusinessContextSummaryDto>('/onboarding/summary');
      if (response) {
        setData(response);
      } else {
        setError('Business context not found. Please complete the initial onboarding steps.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load business context summary.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConfirm = async () => {
    if (!hasConfirmedCheckbox) {
      const msg = 'Please explicitly confirm that your business context is accurate and approved.';
      setError(msg);
      toast.warning(msg);
      return;
    }
    
    setIsConfirming(true);
    setError('');

    try {
      await apiClient.post('/onboarding/confirm', {});
      toast.success('Business context confirmed successfully.');
      await checkAuth(); // Refresh auth so isOnboardingConfirmed is true
      await fetchData();
      setHasConfirmedCheckbox(false);
    } catch (err: any) {
      const msg = err.message || 'Failed to confirm business context.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsConfirming(false);
    }
  };

  if (isLoading) {
    return <BusinessContextSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <ErrorState
          title="Unable to load business context"
          error={error || 'Business context summary could not be retrieved.'}
          onRetry={fetchData}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24 space-y-8 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Business Context
          </h1>
          <p className="text-sm text-slate-500 dark:text-[#94A3B8] mt-1">
            Maintain your trusted business identity and approved facts. Edits to factual information require re-confirmation.
          </p>
        </div>
        <div>
          {data.isConfirmed ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Confirmed &amp; Approved
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <AlertCircle className="w-3.5 h-3.5 mr-1" />
              Pending Re-confirmation
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Confirmation Banner if Unconfirmed */}
      {!data.isConfirmed && (
        <section className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300">
                Action Required: Business Context Re-confirmation
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                Changes have been made to your business information. To keep your AI content aligned with verified facts, please review your details below and confirm.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 1. Business Basics */}
      <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-[#1E293B] flex justify-between items-center bg-slate-50/50 dark:bg-[#0F172A]/50">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-[#3B82F6]" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Business Basics</h2>
          </div>
          <Link 
            href="/admin/onboarding/business-basics?from=admin" 
            className="inline-flex items-center text-xs sm:text-sm font-semibold text-[#3B82F6] hover:text-[#2563EB] dark:text-[#60A5FA] dark:hover:text-[#93C5FD] transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 mr-1" />
            Edit Basics
          </Link>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <dl className="space-y-4">
            <div>
              <div className="flex items-center gap-1.5">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                  Business Name
                </dt>
                <InfoTooltip content="The legal or public brand name of your business." />
              </div>
              <dd className="mt-1 text-sm sm:text-base font-medium text-slate-800 dark:text-white">
                {data.businessName || <span className="text-slate-400 dark:text-[#64748B] italic">Not provided</span>}
              </dd>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                  Primary Category (Industry)
                </dt>
                <InfoTooltip content="Specific industry domain (what your business does)." />
              </div>
              <dd className="mt-1 text-sm sm:text-base font-medium text-slate-800 dark:text-white">
                {data.primaryCategory || <span className="text-slate-400 dark:text-[#64748B] italic">Not provided</span>}
              </dd>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                  Business Operating Type
                </dt>
                <InfoTooltip content="Operating delivery model (how your business operates)." />
              </div>
              <dd className="mt-1 text-sm sm:text-base font-medium text-slate-800 dark:text-white">
                {data.businessType || <span className="text-slate-400 dark:text-[#64748B] italic">Not provided</span>}
              </dd>
            </div>
          </dl>

          <dl className="space-y-4">
            <div>
              <div className="flex items-center gap-1.5">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                  Business Phone
                </dt>
                <InfoTooltip content="Public contact phone number displayed for customer inquiries." />
              </div>
              <dd className="mt-1 text-sm sm:text-base font-medium text-slate-800 dark:text-white">
                {data.businessPhone || <span className="text-slate-400 dark:text-[#64748B] italic">Not provided</span>}
              </dd>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                  Business Email
                </dt>
                <InfoTooltip content="Primary business email for receiving customer leads." />
              </div>
              <dd className="mt-1 text-sm sm:text-base font-medium text-slate-800 dark:text-white">
                {data.businessEmail || <span className="text-slate-400 dark:text-[#64748B] italic">Not provided</span>}
              </dd>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                  Website URL
                </dt>
                <InfoTooltip content="Current live domain or web address." />
              </div>
              <dd className="mt-1 text-sm sm:text-base font-medium text-slate-800 dark:text-white">
                {data.website ? (
                  <a href={data.website} target="_blank" rel="noopener noreferrer" className="text-[#3B82F6] hover:underline">
                    {data.website}
                  </a>
                ) : (
                  <span className="text-slate-400 dark:text-[#64748B] italic">Not provided</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* 2. Services */}
      <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-[#1E293B] flex justify-between items-center bg-slate-50/50 dark:bg-[#0F172A]/50">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-[#8B3FD1]" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Services</h2>
          </div>
          <Link 
            href="/admin/onboarding/services?from=admin" 
            className="inline-flex items-center text-xs sm:text-sm font-semibold text-[#3B82F6] hover:text-[#2563EB] dark:text-[#60A5FA] dark:hover:text-[#93C5FD] transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 mr-1" />
            Edit Services
          </Link>
        </div>

        <div className="p-6">
          {!data.services || data.services.length === 0 ? (
            <EmptyState
              icon={<Layers className="w-6 h-6 text-[#8B3FD1]" />}
              title="No services added yet"
              description="Add your primary products and services so Sparovia can accurately represent your business offerings."
              action={
                <Link
                  href="/admin/onboarding/services?from=admin"
                  className="inline-flex items-center text-xs font-semibold text-[#3B82F6] hover:text-[#2563EB] dark:text-[#60A5FA]"
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1" />
                  Add Services
                </Link>
              }
            />
          ) : (
            <ul className="space-y-3">
              {data.services.map(s => (
                <li key={s.id} className="bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl p-4">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1">{s.serviceName}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] whitespace-pre-line leading-relaxed">
                    {s.serviceDescription || <span className="italic text-slate-400 dark:text-[#64748B]">No description provided</span>}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* 3. Location & Customers */}
      <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-[#1E293B] flex justify-between items-center bg-slate-50/50 dark:bg-[#0F172A]/50">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-[#FF7043]" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Location &amp; Customers</h2>
          </div>
          <Link 
            href="/admin/onboarding/location-customers?from=admin" 
            className="inline-flex items-center text-xs sm:text-sm font-semibold text-[#3B82F6] hover:text-[#2563EB] dark:text-[#60A5FA] dark:hover:text-[#93C5FD] transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 mr-1" />
            Edit Location
          </Link>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] mb-2">
              Physical Address
            </h3>
            <div className="text-sm font-medium text-slate-800 dark:text-white leading-relaxed">
              {data.addressLine1 || data.city ? (
                <>
                  {data.addressLine1 && <div>{data.addressLine1}</div>}
                  {data.addressLine2 && <div>{data.addressLine2}</div>}
                  <div>
                    {[data.city, data.state, data.postalCode].filter(Boolean).join(', ')}
                  </div>
                  {data.country && <div>{data.country}</div>}
                </>
              ) : (
                <span className="text-slate-400 dark:text-[#64748B] italic">Not provided</span>
              )}
            </div>
          </div>
          
          <div className="md:col-span-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] mb-2">
              Service Areas
            </h3>
            {data.serviceAreas && data.serviceAreas.length > 0 ? (
              <ul className="list-disc list-inside text-sm font-medium text-slate-800 dark:text-white space-y-1">
                {data.serviceAreas.map(area => <li key={area}>{area}</li>)}
              </ul>
            ) : (
              <p className="text-slate-400 dark:text-[#64748B] italic text-sm">Not provided</p>
            )}
          </div>

          <div className="md:col-span-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] mb-2">
              Target Customers
            </h3>
            {data.targetCustomers && data.targetCustomers.length > 0 ? (
              <ul className="list-disc list-inside text-sm font-medium text-slate-800 dark:text-white space-y-1">
                {data.targetCustomers.map(customer => <li key={customer}>{customer}</li>)}
              </ul>
            ) : (
              <p className="text-slate-400 dark:text-[#64748B] italic text-sm">Not provided</p>
            )}
          </div>
        </div>
      </section>

      {/* 4. Business Description */}
      <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-[#1E293B] flex justify-between items-center bg-slate-50/50 dark:bg-[#0F172A]/50">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-[#3B82F6]" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Business Description</h2>
          </div>
          <Link 
            href="/admin/onboarding/business-description?from=admin" 
            className="inline-flex items-center text-xs sm:text-sm font-semibold text-[#3B82F6] hover:text-[#2563EB] dark:text-[#60A5FA] dark:hover:text-[#93C5FD] transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 mr-1" />
            Edit Description
          </Link>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] mb-2">
              Company Overview
            </h3>
            <p className="text-sm font-medium text-slate-800 dark:text-white whitespace-pre-line leading-relaxed">
              {data.businessDescription || <span className="text-slate-400 dark:text-[#64748B] italic">Not provided</span>}
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] mb-2">
              Key Differentiators &amp; Value Proposition
            </h3>
            <p className="text-sm font-medium text-slate-800 dark:text-white whitespace-pre-line leading-relaxed">
              {data.differentiators || <span className="text-slate-400 dark:text-[#64748B] italic">Not provided</span>}
            </p>
          </div>
        </div>
      </section>

      {/* 5. Approved Facts & Claims */}
      <section className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-[#1E293B] flex justify-between items-center bg-slate-50/50 dark:bg-[#0F172A]/50">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-[#8B3FD1]" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Approved Facts &amp; Claims</h2>
          </div>
          <Link 
            href="/admin/onboarding/approved-facts?from=admin" 
            className="inline-flex items-center text-xs sm:text-sm font-semibold text-[#3B82F6] hover:text-[#2563EB] dark:text-[#60A5FA] dark:hover:text-[#93C5FD] transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 mr-1" />
            Edit Facts
          </Link>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] mb-1">
              Years in Business
            </h3>
            <p className="text-sm font-medium text-slate-800 dark:text-white">
              {data.yearsInBusiness !== null && data.yearsInBusiness !== undefined ? `${data.yearsInBusiness} years` : <span className="text-slate-400 dark:text-[#64748B] italic">Not provided</span>}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] mb-1">
              Certifications
            </h3>
            {data.certifications && data.certifications.length > 0 ? (
              <ul className="list-disc list-inside text-sm font-medium text-slate-800 dark:text-white space-y-1">{data.certifications.map(c => <li key={c}>{c}</li>)}</ul>
            ) : <p className="text-slate-400 dark:text-[#64748B] italic text-sm">Not provided</p>}
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] mb-1">
              Awards &amp; Recognitions
            </h3>
            {data.awards && data.awards.length > 0 ? (
              <ul className="list-disc list-inside text-sm font-medium text-slate-800 dark:text-white space-y-1">{data.awards.map(c => <li key={c}>{c}</li>)}</ul>
            ) : <p className="text-slate-400 dark:text-[#64748B] italic text-sm">Not provided</p>}
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] mb-1">
              Accreditations
            </h3>
            {data.accreditations && data.accreditations.length > 0 ? (
              <ul className="list-disc list-inside text-sm font-medium text-slate-800 dark:text-white space-y-1">{data.accreditations.map(c => <li key={c}>{c}</li>)}</ul>
            ) : <p className="text-slate-400 dark:text-[#64748B] italic text-sm">Not provided</p>}
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] mb-1">
              Guarantees &amp; Warranties
            </h3>
            {data.warranties && data.warranties.length > 0 ? (
              <ul className="list-disc list-inside text-sm font-medium text-slate-800 dark:text-white space-y-1">{data.warranties.map(c => <li key={c}>{c}</li>)}</ul>
            ) : <p className="text-slate-400 dark:text-[#64748B] italic text-sm">Not provided</p>}
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] mb-1">
              Authorized / Dealer Status
            </h3>
            {data.authorizedStatuses && data.authorizedStatuses.length > 0 ? (
              <ul className="list-disc list-inside text-sm font-medium text-slate-800 dark:text-white space-y-1">{data.authorizedStatuses.map(c => <li key={c}>{c}</li>)}</ul>
            ) : <p className="text-slate-400 dark:text-[#64748B] italic text-sm">Not provided</p>}
          </div>

          <div className="sm:col-span-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] mb-1">
              Other Approved Claims
            </h3>
            {data.otherClaims && data.otherClaims.length > 0 ? (
              <ul className="list-disc list-inside text-sm font-medium text-slate-800 dark:text-white space-y-1">{data.otherClaims.map(c => <li key={c}>{c}</li>)}</ul>
            ) : <p className="text-slate-400 dark:text-[#64748B] italic text-sm">Not provided</p>}
          </div>
        </div>
      </section>

      {/* Confirmation Actions / Confirmed Banner */}
      {data.isConfirmed ? (
        <section className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-400" />
                Your Business Context is verified &amp; approved.
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] mt-1">
                Sparovia uses this verified information to power trusted website copy and AI generation without arbitrary claims.
              </p>
            </div>
            <Link
              href="/admin"
              className="inline-flex items-center justify-center py-2.5 px-6 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#3B82F6] hover:bg-[#2563EB] transition-colors shrink-0 shadow-sm"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>
        </section>
      ) : (
        <section className="bg-white dark:bg-[#0F172A] border-2 border-[#3B82F6]/30 dark:border-[#3B82F6]/40 rounded-2xl p-6 sm:p-8 shadow-md">
          <div className="flex items-start">
            <div className="flex items-center h-6">
              <input
                id="confirmContext"
                name="confirmContext"
                type="checkbox"
                checked={hasConfirmedCheckbox}
                onChange={(e) => {
                  setHasConfirmedCheckbox(e.target.checked);
                  if (e.target.checked) setError('');
                }}
                className="w-5 h-5 bg-slate-50 dark:bg-[#0B1220] border-slate-300 dark:border-[#334155] rounded text-[#3B82F6] focus:ring-[#3B82F6]"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="confirmContext" className="text-sm font-bold text-slate-900 dark:text-white select-none cursor-pointer">
                I confirm that the Business Context information above is accurate and approved for use by Sparovia.
              </label>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1 select-none leading-relaxed">
                Confirming updates the trusted foundation for your website and AI workflows. Website changes are never published automatically without your review.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-[#1E293B] flex justify-end">
            <Button
              type="button"
              variant="primary"
              onClick={handleConfirm}
              disabled={!hasConfirmedCheckbox || isConfirming || data.isConfirmed}
              isLoading={isConfirming}
              loadingText="Confirming..."
              rightIcon={<CheckCircle2 className="w-4 h-4 ml-1" />}
            >
              Confirm Business Context
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
