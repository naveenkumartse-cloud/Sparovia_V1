'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { OnboardingFormSkeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ArrowRight, Award, RefreshCw } from 'lucide-react';

export default function ApprovedFactsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromAdmin = searchParams.get('from') === 'admin';

  const [data, setData] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [listInputs, setListInputs] = useState<Record<string, string>>({
    awards: '',
    accreditations: '',
    warranties: '',
    authorizedStatuses: '',
    otherClaims: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const isDirty = useMemo(() => {
    if (!data) return false;
    const baseChanged = 
      (formData.yearsInBusiness || '') !== (data.yearsInBusiness?.toString() || '') ||
      (formData.licenseNumber || '') !== (data.licenseNumber || '') ||
      (formData.insuranceCoverage || '') !== (data.insuranceCoverage || '');
    const listFields = ['awards', 'accreditations', 'warranties', 'authorizedStatuses', 'otherClaims'];
    const listsChanged = listFields.some(field => {
      const initialStr = Array.isArray(data[field]) ? data[field].join(', ') : (data[field] || '');
      return (listInputs[field] ?? '') !== initialStr;
    });
    return baseChanged || listsChanged;
  }, [data, formData, listInputs]);

  useUnsavedChanges(isDirty);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<any>('/onboarding/approved-facts');
      const res: any = response || {};
      setData(res);
      setFormData(res);
      setListInputs({
        awards: Array.isArray(res.awards) ? res.awards.join(', ') : (res.awards || ''),
        accreditations: Array.isArray(res.accreditations) ? res.accreditations.join(', ') : (res.accreditations || ''),
        warranties: Array.isArray(res.warranties) ? res.warranties.join(', ') : (res.warranties || ''),
        authorizedStatuses: Array.isArray(res.authorizedStatuses) ? res.authorizedStatuses.join(', ') : (res.authorizedStatuses || ''),
        otherClaims: Array.isArray(res.otherClaims) ? res.otherClaims.join(', ') : (res.otherClaims || ''),
      });
    } catch (err: any) {
      setData({});
      setFormData({});
      setListInputs({
        awards: '',
        accreditations: '',
        warranties: '',
        authorizedStatuses: '',
        otherClaims: '',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      const parseList = (val: string) => (val || '').split(',').map(s => s.trim()).filter(Boolean);
      // Ensure yearsInBusiness is parsed as integer if present
      const payload = {
        ...formData,
        yearsInBusiness: formData.yearsInBusiness ? parseInt(formData.yearsInBusiness, 10) : null,
        awards: parseList(listInputs.awards),
        accreditations: parseList(listInputs.accreditations),
        warranties: parseList(listInputs.warranties),
        authorizedStatuses: parseList(listInputs.authorizedStatuses),
        otherClaims: parseList(listInputs.otherClaims),
      };

      await apiClient.put('/onboarding/approved-facts', payload);
      setData(payload);
      setListInputs({
        awards: payload.awards.join(', '),
        accreditations: payload.accreditations.join(', '),
        warranties: payload.warranties.join(', '),
        authorizedStatuses: payload.authorizedStatuses.join(', '),
        otherClaims: payload.otherClaims.join(', '),
      });
      toast.success('Approved facts saved successfully.');
      if (fromAdmin) {
        router.push('/admin/business-context');
      } else {
        router.push('/admin/onboarding/review');
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to save approved facts.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleListFieldChange = (field: string, rawValue: string) => {
    setListInputs(prev => ({ ...prev, [field]: rawValue }));
  };

  const getListFieldValue = (field: string): string => {
    return listInputs[field] ?? '';
  };

  if (isLoading) {
    return <OnboardingFormSkeleton fieldsCount={7} twoColumn={true} />;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
          <Award className="w-5 h-5 mr-2 text-[#3B82F6]" />
          Approved Facts & Claims
        </h2>
        <p className="text-sm text-slate-500 dark:text-[#94A3B8] mt-1">
          Provide factual credentials, certifications, awards, and warranties that Sparovia can trust when assisting with content.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-300 text-sm" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Years in Business */}
          <div>
            <div className="flex items-center gap-1.5">
              <label htmlFor="yearsInBusiness" className="block text-xs font-medium text-slate-700 dark:text-[#E2E8F0]">
                Years in Business
              </label>
              <InfoTooltip content="Number of years your business has been actively operating (e.g. 15)." />
            </div>
            <input 
              id="yearsInBusiness"
              type="number" 
              min="0"
              max="200"
              value={formData.yearsInBusiness ?? ''} 
              onChange={e => setFormData({ ...formData, yearsInBusiness: e.target.value })}
              placeholder="e.g. 12"
              className="mt-1.5 w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl px-3.5 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
            />
          </div>

          {/* Certifications */}
          <div>
            <div className="flex items-center gap-1.5">
              <label htmlFor="certifications" className="block text-xs font-medium text-slate-700 dark:text-[#E2E8F0]">
                Certifications (Comma separated)
              </label>
              <InfoTooltip content="Official trade certifications or standards compliance (e.g. ISO 9001, AAMA Certified, Passive House Tradesperson)." />
            </div>
            <input 
              id="certifications"
              type="text" 
              spellCheck={true}
              autoCorrect="on"
              autoCapitalize="sentences"
              lang="en"
              value={getListFieldValue('certifications')} 
              onChange={e => handleListFieldChange('certifications', e.target.value)}
              placeholder="e.g. ISO 9001, AAMA Certified"
              className="mt-1.5 w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl px-3.5 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
            />
          </div>

          {/* Awards */}
          <div>
            <div className="flex items-center gap-1.5">
              <label htmlFor="awards" className="block text-xs font-medium text-slate-700 dark:text-[#E2E8F0]">
                Awards (Comma separated)
              </label>
              <InfoTooltip content="Industry recognition, design awards, or business achievements." />
            </div>
            <input 
              id="awards"
              type="text" 
              spellCheck={true}
              autoCorrect="on"
              autoCapitalize="sentences"
              lang="en"
              value={getListFieldValue('awards')} 
              onChange={e => handleListFieldChange('awards', e.target.value)}
              placeholder="e.g. Best of Houzz 2023, Architectural Excellence 2024"
              className="mt-1.5 w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl px-3.5 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
            />
          </div>

          {/* Accreditations */}
          <div>
            <div className="flex items-center gap-1.5">
              <label htmlFor="accreditations" className="block text-xs font-medium text-slate-700 dark:text-[#E2E8F0]">
                Accreditations (Comma separated)
              </label>
              <InfoTooltip content="Accredited memberships or official affiliations (e.g. Better Business Bureau A+, Energy Star Partner)." />
            </div>
            <input 
              id="accreditations"
              type="text" 
              spellCheck={true}
              autoCorrect="on"
              autoCapitalize="sentences"
              lang="en"
              value={getListFieldValue('accreditations')} 
              onChange={e => handleListFieldChange('accreditations', e.target.value)}
              placeholder="e.g. BBB Accredited A+, Energy Star Partner"
              className="mt-1.5 w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl px-3.5 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
            />
          </div>

          {/* Warranties */}
          <div>
            <div className="flex items-center gap-1.5">
              <label htmlFor="warranties" className="block text-xs font-medium text-slate-700 dark:text-[#E2E8F0]">
                Warranties & Guarantees (Comma separated)
              </label>
              <InfoTooltip content="Specific warranty terms provided to clients (e.g. 10-Year Comprehensive Warranty, Lifetime Hardware Guarantee)." />
            </div>
            <input 
              id="warranties"
              type="text" 
              spellCheck={true}
              autoCorrect="on"
              autoCapitalize="sentences"
              lang="en"
              value={getListFieldValue('warranties')} 
              onChange={e => handleListFieldChange('warranties', e.target.value)}
              placeholder="e.g. 10-Year Frame Warranty, Lifetime Hardware"
              className="mt-1.5 w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl px-3.5 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
            />
          </div>

          {/* Authorized Statuses */}
          <div>
            <div className="flex items-center gap-1.5">
              <label htmlFor="authorizedStatuses" className="block text-xs font-medium text-slate-700 dark:text-[#E2E8F0]">
                Authorized / Dealer Statuses (Comma separated)
              </label>
              <InfoTooltip content="Manufacturer partner or certified installer statuses (e.g. Authorized Schuco Fabricator, Certified Rehau Partner)." />
            </div>
            <input 
              id="authorizedStatuses"
              type="text" 
              spellCheck={true}
              autoCorrect="on"
              autoCapitalize="sentences"
              lang="en"
              value={getListFieldValue('authorizedStatuses')} 
              onChange={e => handleListFieldChange('authorizedStatuses', e.target.value)}
              placeholder="e.g. Authorized Schuco Partner, Certified Installer"
              className="mt-1.5 w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl px-3.5 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
            />
          </div>

          {/* Other Approved Claims */}
          <div className="sm:col-span-2">
            <div className="flex items-center gap-1.5">
              <label htmlFor="otherClaims" className="block text-xs font-medium text-slate-700 dark:text-[#E2E8F0]">
                Other Approved Claims (Comma separated)
              </label>
              <InfoTooltip content="Any other approved factual statements that AI may use (e.g. 100% In-House Installation Teams, No Subcontractors)." />
            </div>
            <input 
              id="otherClaims"
              type="text" 
              spellCheck={true}
              autoCorrect="on"
              autoCapitalize="sentences"
              lang="en"
              value={getListFieldValue('otherClaims')} 
              onChange={e => handleListFieldChange('otherClaims', e.target.value)}
              placeholder="e.g. Zero Subcontractors, Over 5,000 Installations Completed"
              className="mt-1.5 w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl px-3.5 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
            />
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="pt-6 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push('/admin/onboarding/business-description')}
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back
          </button>

          <Button
            type="submit"
            variant="primary"
            disabled={isSaving}
            isLoading={isSaving}
            loadingText="Saving..."
            rightIcon={<ArrowRight className="ml-1 h-4 w-4" />}
          >
            Review Business Context
          </Button>
        </div>
      </form>
    </div>
  );
}
