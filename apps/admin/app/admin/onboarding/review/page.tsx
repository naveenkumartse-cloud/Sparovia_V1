'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { BusinessContextSkeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Building2, 
  MapPin, 
  FileText, 
  Award, 
  Layers, 
  Edit3 
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

export default function OnboardingReviewPage() {
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
        setError('Business context not found. Please complete the previous steps.');
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
      const msg = 'Please explicitly confirm the business context by checking the box below.';
      setError(msg);
      toast.warning(msg);
      return;
    }
    
    setIsConfirming(true);
    setError('');

    try {
      await apiClient.post('/onboarding/confirm', {});
      toast.success('Business context confirmed successfully. Welcome to Sparovia!');
      await checkAuth(); // Unlocks full Admin access
      router.push('/admin');
    } catch (err: any) {
      const msg = err.message || 'Failed to confirm business context.';
      setError(msg);
      toast.error(msg);
      setIsConfirming(false);
    }
  };

  if (isLoading) {
    return <BusinessContextSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <ErrorState
          title="Unable to load summary for review"
          error={error || 'Review summary data could not be retrieved.'}
          onRetry={fetchData}
        />
        <div className="pt-2">
          <Link
            href="/admin/onboarding/approved-facts"
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-white"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Approved Facts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-100 dark:border-[#1E293B] pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Review & Confirm Business Context</h2>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
              Review your approved facts before unlocking your Admin workspace.
            </p>
          </div>
          {data.isConfirmed && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Confirmed
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 text-red-600 dark:text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* 1. Business Basics */}
      <section className="bg-slate-50/50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1E293B] rounded-xl p-4 sm:p-5 space-y-3">
        <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-[#1E293B] pb-2.5">
          <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-semibold text-sm">
            <Building2 className="w-4 h-4 text-[#3B82F6]" />
            <span>1. Business Basics</span>
          </div>
          <Link
            href="/admin/onboarding/business-basics"
            className="inline-flex items-center text-xs text-[#3B82F6] hover:text-[#60A5FA] font-medium"
          >
            <Edit3 className="w-3 h-3 mr-1" /> Edit
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-slate-500 dark:text-[#64748B] block">Business Name</span>
            <span className="text-slate-900 dark:text-white font-medium">{data.businessName || '—'}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-[#64748B] block">Industry Domain / Category</span>
            <span className="text-[#3B82F6] font-medium">{data.primaryCategory || '—'}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-[#64748B] block">Operating Type</span>
            <span className="text-slate-900 dark:text-white font-medium">{data.businessType || '—'}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-[#64748B] block">Phone</span>
            <span className="text-slate-900 dark:text-white font-medium">{data.businessPhone || '—'}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-[#64748B] block">Email</span>
            <span className="text-slate-900 dark:text-white font-medium">{data.businessEmail || '—'}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-[#64748B] block">Website</span>
            <span className="text-slate-900 dark:text-white font-medium truncate block">{data.website || '—'}</span>
          </div>
        </div>
      </section>

      {/* 2. Services */}
      <section className="bg-slate-50/50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1E293B] rounded-xl p-4 sm:p-5 space-y-3">
        <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-[#1E293B] pb-2.5">
          <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-semibold text-sm">
            <Layers className="w-4 h-4 text-[#8B3FD1]" />
            <span>2. Approved Services ({data.services?.length || 0})</span>
          </div>
          <Link
            href="/admin/onboarding/services"
            className="inline-flex items-center text-xs text-[#3B82F6] hover:text-[#60A5FA] font-medium"
          >
            <Edit3 className="w-3 h-3 mr-1" /> Edit
          </Link>
        </div>
        {data.services && data.services.length > 0 ? (
          <div className="space-y-2">
            {data.services.map((svc) => (
              <div key={svc.id} className="p-2.5 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-lg">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">{svc.serviceName}</p>
                {svc.serviceDescription && (
                  <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-0.5">{svc.serviceDescription}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-[#64748B] italic">No services listed.</p>
        )}
      </section>

      {/* 3. Location & Customers */}
      <section className="bg-slate-50/50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1E293B] rounded-xl p-4 sm:p-5 space-y-3">
        <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-[#1E293B] pb-2.5">
          <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-semibold text-sm">
            <MapPin className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>3. Location & Customers</span>
          </div>
          <Link
            href="/admin/onboarding/location-customers"
            className="inline-flex items-center text-xs text-[#3B82F6] hover:text-[#60A5FA] font-medium"
          >
            <Edit3 className="w-3 h-3 mr-1" /> Edit
          </Link>
        </div>
        <div className="space-y-2 text-xs">
          <div>
            <span className="text-slate-500 dark:text-[#64748B] block">Business Address</span>
            <span className="text-slate-900 dark:text-white font-medium">
              {[data.addressLine1, data.addressLine2, data.city, data.state, data.postalCode, data.country].filter(Boolean).join(', ') || '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-[#64748B] block">Service Areas</span>
            <span className="text-slate-900 dark:text-white font-medium">
              {data.serviceAreas?.length ? data.serviceAreas.join(', ') : '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-[#64748B] block">Target Customers</span>
            <span className="text-slate-900 dark:text-white font-medium">
              {data.targetCustomers?.length ? data.targetCustomers.join(', ') : '—'}
            </span>
          </div>
        </div>
      </section>

      {/* 4. Business Description */}
      <section className="bg-slate-50/50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1E293B] rounded-xl p-4 sm:p-5 space-y-3">
        <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-[#1E293B] pb-2.5">
          <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-semibold text-sm">
            <FileText className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>4. Business Description & Differentiators</span>
          </div>
          <Link
            href="/admin/onboarding/business-description"
            className="inline-flex items-center text-xs text-[#3B82F6] hover:text-[#60A5FA] font-medium"
          >
            <Edit3 className="w-3 h-3 mr-1" /> Edit
          </Link>
        </div>
        <div className="space-y-2 text-xs">
          <div>
            <span className="text-slate-500 dark:text-[#64748B] block">Description</span>
            <p className="text-slate-800 dark:text-white leading-relaxed">{data.businessDescription || '—'}</p>
          </div>
          <div>
            <span className="text-slate-500 dark:text-[#64748B] block">Key Differentiators</span>
            <p className="text-slate-800 dark:text-white leading-relaxed">{data.differentiators || '—'}</p>
          </div>
        </div>
      </section>

      {/* 5. Approved Facts & Credentials */}
      <section className="bg-slate-50/50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#1E293B] rounded-xl p-4 sm:p-5 space-y-3">
        <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-[#1E293B] pb-2.5">
          <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-semibold text-sm">
            <Award className="w-4 h-4 text-[#FF7043]" />
            <span>5. Approved Facts & Claims</span>
          </div>
          <Link
            href="/admin/onboarding/approved-facts"
            className="inline-flex items-center text-xs text-[#3B82F6] hover:text-[#60A5FA] font-medium"
          >
            <Edit3 className="w-3 h-3 mr-1" /> Edit
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-slate-500 dark:text-[#64748B] block">Years in Business</span>
            <span className="text-slate-900 dark:text-white font-medium">{data.yearsInBusiness ?? '—'}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-[#64748B] block">Certifications</span>
            <span className="text-slate-900 dark:text-white font-medium">{data.certifications?.length ? data.certifications.join(', ') : '—'}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-[#64748B] block">Awards</span>
            <span className="text-slate-900 dark:text-white font-medium">{data.awards?.length ? data.awards.join(', ') : '—'}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-[#64748B] block">Accreditations</span>
            <span className="text-slate-900 dark:text-white font-medium">{data.accreditations?.length ? data.accreditations.join(', ') : '—'}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-[#64748B] block">Warranties</span>
            <span className="text-slate-900 dark:text-white font-medium">{data.warranties?.length ? data.warranties.join(', ') : '—'}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-[#64748B] block">Authorized Statuses</span>
            <span className="text-slate-900 dark:text-white font-medium">{data.authorizedStatuses?.length ? data.authorizedStatuses.join(', ') : '—'}</span>
          </div>
          <div className="sm:col-span-2">
            <span className="text-slate-500 dark:text-[#64748B] block">Other Approved Claims</span>
            <span className="text-slate-900 dark:text-white font-medium">{data.otherClaims?.length ? data.otherClaims.join(', ') : '—'}</span>
          </div>
        </div>
      </section>

      {/* Explicit Confirmation Block */}
      <section className="bg-slate-50 dark:bg-[#0F172A] border border-blue-200 dark:border-[#3B82F6]/40 rounded-xl p-5 sm:p-6 shadow-md dark:shadow-xl space-y-4">
        <div className="flex items-start">
          <div className="flex items-center h-5 mt-0.5">
            <input
              id="confirmContextCheckbox"
              name="confirmContextCheckbox"
              type="checkbox"
              checked={hasConfirmedCheckbox}
              onChange={(e) => {
                setHasConfirmedCheckbox(e.target.checked);
                if (e.target.checked) setError('');
              }}
              className="w-4 h-4 bg-white dark:bg-[#0B1220] border-slate-300 dark:border-[#334155] rounded text-[#3B82F6] focus:ring-[#3B82F6] focus:ring-offset-white dark:focus:ring-offset-[#0F172A] cursor-pointer"
            />
          </div>
          <div className="ml-3">
            <label htmlFor="confirmContextCheckbox" className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white select-none cursor-pointer">
              I confirm that the Business Context information above is accurate and approved for use by Sparovia.
            </label>
            <p className="text-[11px] text-slate-600 dark:text-[#94A3B8] mt-1 select-none leading-relaxed">
              Once confirmed, this information locks as your trusted business baseline for website management, AI context, and lead intake.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-[#1E293B] flex items-center justify-between">
          <Link
            href="/admin/onboarding/approved-facts"
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Approved Facts
          </Link>

          <Button
            type="button"
            variant="primary"
            onClick={handleConfirm}
            disabled={!hasConfirmedCheckbox || isConfirming}
            isLoading={isConfirming}
            loadingText="Confirming..."
            rightIcon={<ArrowRight className="ml-1 h-4 w-4" />}
          >
            Confirm &amp; Enter Admin
          </Button>
        </div>
      </section>
    </div>
  );
}
