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
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorState } from '@/components/ui/ErrorState';
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
  ShieldAlert,
  Sparkles,
  Phone,
  Mail,
  Globe,
  Check
} from 'lucide-react';
import { AIContentModal } from '@/components/ai/AIContentModal';

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
  const [aiModal, setAiModal] = useState<{
    fieldKey: string;
    fieldLabel: string;
    currentText: string;
  } | null>(null);

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
      const msg = 'Please explicitly check the confirmation box to confirm that your business context is accurate and approved.';
      setError(msg);
      toast.warning(msg);
      return;
    }
    
    setIsConfirming(true);
    setError('');

    try {
      await apiClient.post('/onboarding/confirm', {});
      toast.success('Business context confirmed successfully.');
      await checkAuth();
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
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* PageHeader with status badge */}
      <PageHeader
        category="Trusted Facts &amp; Identity"
        title="Business Context"
        badge={
          data.isConfirmed ? (
            <Badge variant="success" size="sm" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
              Approved &amp; Confirmed
            </Badge>
          ) : (
            <Badge variant="warning" size="sm" icon={<AlertCircle className="w-3.5 h-3.5" />}>
              Pending Re-confirmation
            </Badge>
          )
        }
        description="Maintain your verified business identity, core services, location areas, and approved factual credentials. All AI suggestions strictly ground in these facts."
      />

      {/* Confirmation Action Notice if Unconfirmed */}
      {!data.isConfirmed && (
        <div className="p-4 sm:p-5 rounded-[8px] bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 flex items-start gap-3.5 shadow-soft-xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-amber-900 dark:text-amber-300">
              Action Required: Business Context Re-confirmation
            </h2>
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              Edits or updates have been made to your business information. To ensure website content and AI generation remain factually aligned, review your details below and complete re-confirmation.
            </p>
          </div>
        </div>
      )}

      {/* Section 1: Business Basics */}
      <Card variant="default">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-[6px] bg-[#315FEA]/10 text-[#315FEA] flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <CardTitle>Business Basics</CardTitle>
            </div>
            <Link 
              href="/admin/onboarding/business-basics?from=admin" 
              className="inline-flex items-center text-xs font-semibold text-[#315FEA] hover:text-[#254EDB] transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1" />
              Edit Basics
            </Link>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-5">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B] block mb-1">
              Business Name
            </span>
            <p className="text-sm font-semibold text-[#172033] dark:text-white">
              {data.businessName || <span className="text-slate-400 italic">Not provided</span>}
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B] block mb-1">
              Business Category
            </span>
            <p className="text-sm font-semibold text-[#172033] dark:text-white">
              {data.primaryCategory || <span className="text-slate-400 italic">Not provided</span>}
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B] block mb-1">
              Business Phone
            </span>
            <p className="text-sm font-semibold text-[#172033] dark:text-white flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#315FEA]" />
              {data.businessPhone ? `+91 ${data.businessPhone}` : <span className="text-slate-400 italic">Not provided</span>}
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B] block mb-1">
              Business Email
            </span>
            <p className="text-sm font-semibold text-[#172033] dark:text-white flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#315FEA]" />
              {data.businessEmail || <span className="text-slate-400 italic">Not provided</span>}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Description & Differentiators (Creative Card with AI Assistance) */}
      <Card variant="creative">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-[6px] bg-[#7950B8]/15 text-[#7950B8] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <CardTitle>Business Narrative &amp; Differentiators</CardTitle>
                <CardDescription>
                  Customer-facing overview and key competitive strengths.
                </CardDescription>
              </div>
            </div>
            <Link 
              href="/admin/onboarding/business-description?from=admin" 
              className="inline-flex items-center text-xs font-semibold text-[#7950B8] hover:text-[#6820AB] transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1" />
              Edit Narrative
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <div className="p-4 rounded-[6px] bg-white/80 dark:bg-[#0F172A]/80 border border-[#7950B8]/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#7950B8]">
                Executive Overview
              </span>
              <button
                type="button"
                onClick={() =>
                  setAiModal({
                    fieldKey: 'businessDescription',
                    fieldLabel: 'Business Overview',
                    currentText: data.businessDescription || '',
                  })
                }
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#7950B8] hover:text-[#53198A] transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Improve with AI</span>
              </button>
            </div>
            <p className="text-sm text-[#334155] dark:text-[#CBD5E1] leading-relaxed">
              {data.businessDescription || <span className="text-slate-400 italic">No business description provided yet.</span>}
            </p>
          </div>

          <div className="p-4 rounded-[6px] bg-white/80 dark:bg-[#0F172A]/80 border border-[#7950B8]/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#7950B8]">
                Key Differentiators &amp; Value Proposition
              </span>
              <button
                type="button"
                onClick={() =>
                  setAiModal({
                    fieldKey: 'differentiators',
                    fieldLabel: 'Key Differentiators',
                    currentText: data.differentiators || '',
                  })
                }
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#7950B8] hover:text-[#53198A] transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Improve with AI</span>
              </button>
            </div>
            <p className="text-sm text-[#334155] dark:text-[#CBD5E1] leading-relaxed">
              {data.differentiators || <span className="text-slate-400 italic">No differentiators provided yet.</span>}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Services & Offerings */}
      <Card variant="default">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-[6px] bg-[#315FEA]/10 text-[#315FEA] flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <CardTitle>Services &amp; Offerings</CardTitle>
            </div>
            <Link 
              href="/admin/onboarding/services?from=admin" 
              className="inline-flex items-center text-xs font-semibold text-[#315FEA] hover:text-[#254EDB] transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1" />
              Edit Services
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          {data.services && data.services.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.services.map((svc) => (
                <div 
                  key={svc.id} 
                  className="p-3.5 rounded-[6px] bg-[#F3F6FA]/70 dark:bg-[#0B1220] border border-[#E3E7ED] dark:border-[#1E293B] space-y-1"
                >
                  <p className="text-sm font-bold text-[#172033] dark:text-white">{svc.serviceName}</p>
                  {svc.serviceDescription && (
                    <p className="text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                      {svc.serviceDescription}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#64748B] italic">No services listed.</p>
          )}
        </CardContent>
      </Card>

      {/* Section 4: Location & Service Areas */}
      <Card variant="default">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-[6px] bg-[#315FEA]/10 text-[#315FEA] flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <CardTitle>Location &amp; Service Coverage</CardTitle>
            </div>
            <Link 
              href="/admin/onboarding/location-customers?from=admin" 
              className="inline-flex items-center text-xs font-semibold text-[#315FEA] hover:text-[#254EDB] transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1" />
              Edit Location
            </Link>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-5">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B] block mb-1">
              Registered Physical Address
            </span>
            <p className="text-sm font-medium text-[#172033] dark:text-white leading-relaxed">
              {[data.addressLine1, data.addressLine2, data.city, data.state, data.postalCode, data.country]
                .filter(Boolean)
                .join(', ') || <span className="text-slate-400 italic">Not provided</span>}
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B] block mb-1">
              Service Areas Covered
            </span>
            {data.serviceAreas && data.serviceAreas.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {data.serviceAreas.map((area) => (
                  <Badge key={area} variant="neutral" size="xs">
                    {area}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#64748B] italic">Not provided</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Approved Facts & Credentials */}
      <Card variant="default">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-[6px] bg-[#315FEA]/10 text-[#315FEA] flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <CardTitle>Approved Facts &amp; Credentials</CardTitle>
                <CardDescription>
                  Protected business assertions. AI is strictly prohibited from inventing factual credentials.
                </CardDescription>
              </div>
            </div>
            <Link 
              href="/admin/onboarding/approved-facts?from=admin" 
              className="inline-flex items-center text-xs font-semibold text-[#315FEA] hover:text-[#254EDB] transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1" />
              Edit Facts
            </Link>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-5">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B] block mb-1">
              Years in Business
            </span>
            <p className="text-sm font-bold text-[#172033] dark:text-white">
              {data.yearsInBusiness !== null && data.yearsInBusiness !== undefined 
                ? `${data.yearsInBusiness} years of operation` 
                : <span className="text-slate-400 italic font-normal">Not provided</span>}
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B] block mb-1">
              Certifications &amp; Accreditations
            </span>
            {data.certifications && data.certifications.length > 0 ? (
              <ul className="list-disc list-inside text-sm text-[#172033] dark:text-white space-y-1">
                {data.certifications.map(c => <li key={c}>{c}</li>)}
              </ul>
            ) : <p className="text-slate-400 italic text-xs">Not provided</p>}
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B] block mb-1">
              Awards &amp; Recognitions
            </span>
            {data.awards && data.awards.length > 0 ? (
              <ul className="list-disc list-inside text-sm text-[#172033] dark:text-white space-y-1">
                {data.awards.map(a => <li key={a}>{a}</li>)}
              </ul>
            ) : <p className="text-slate-400 italic text-xs">Not provided</p>}
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B] block mb-1">
              Guarantees &amp; Warranties
            </span>
            {data.warranties && data.warranties.length > 0 ? (
              <ul className="list-disc list-inside text-sm text-[#172033] dark:text-white space-y-1">
                {data.warranties.map(w => <li key={w}>{w}</li>)}
              </ul>
            ) : <p className="text-slate-400 italic text-xs">Not provided</p>}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Actions Footer */}
      {data.isConfirmed ? (
        <div className="p-6 rounded-[8px] bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" />
              Business Context is verified and active.
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              Your website content, AI assistance, and lead generation operate safely on these approved facts.
            </p>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center py-2 px-4 rounded-[6px] text-xs font-semibold text-emerald-800 dark:text-emerald-200 bg-white dark:bg-[#0F172A] border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 transition-colors shrink-0"
          >
            Dashboard
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Link>
        </div>
      ) : (
        <Card variant="default" className="border-[#315FEA]/40 p-5 sm:p-6 shadow-soft-sm">
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
                className="w-5 h-5 bg-white border-[#CBD5E1] rounded-[4px] text-[#315FEA] focus:ring-[#315FEA] cursor-pointer"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="confirmContext" className="text-sm font-bold text-[#172033] dark:text-white select-none cursor-pointer">
                I confirm that the Business Context information above is accurate and approved for use by Sparovia.
              </label>
              <p className="text-xs text-[#475569] dark:text-[#94A3B8] mt-1 select-none leading-relaxed">
                Confirming updates the trusted foundation for your website and AI workflows. Website changes are never published automatically without your review.
              </p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-[#E3E7ED] dark:border-[#1E293B] flex justify-end">
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
        </Card>
      )}

      {aiModal && (
        <AIContentModal
          isOpen={!!aiModal}
          onClose={() => setAiModal(null)}
          fieldKey={aiModal.fieldKey}
          fieldLabel={aiModal.fieldLabel}
          sectionKey="business-context"
          sectionTitle="Business Context"
          currentText={aiModal.currentText}
          onApply={async (improved) => {
            try {
              await apiClient.put('/onboarding/business-description', {
                businessDescription:
                  aiModal.fieldKey === 'businessDescription'
                    ? improved
                    : data?.businessDescription || '',
                differentiators:
                  aiModal.fieldKey === 'differentiators'
                    ? improved
                    : data?.differentiators || '',
              });
              toast.success('Business context updated successfully.');
              fetchData();
            } catch (err: any) {
              toast.error(err.message || 'Failed to update business description.');
            }
          }}
        />
      )}
    </div>
  );
}
