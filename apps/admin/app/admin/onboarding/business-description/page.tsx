'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { OnboardingFormSkeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ArrowRight, FileText, RefreshCw, Sparkles } from 'lucide-react';
import { AIContentModal } from '@/components/ai/AIContentModal';

export default function BusinessDescriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromAdmin = searchParams.get('from') === 'admin';

  const [data, setData] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [aiModal, setAiModal] = useState<{
    fieldKey: string;
    fieldLabel: string;
    currentText: string;
  } | null>(null);

  const isDirty = useMemo(() => {
    if (!data) return false;
    return JSON.stringify(data) !== JSON.stringify(formData);
  }, [data, formData]);

  useUnsavedChanges(isDirty);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/onboarding/business-description');
      setData(response || {});
      setFormData(response || {});
    } catch (err: any) {
      setData({});
      setFormData({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAi = (fieldKey: string, fieldLabel: string, currentText: string) => {
    setAiModal({ fieldKey, fieldLabel, currentText });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      await apiClient.put('/onboarding/business-description', formData);
      setData(formData);
      toast.success('Business description saved successfully.');
      if (fromAdmin) {
        router.push('/admin/business-context');
      } else {
        router.push('/admin/onboarding/approved-facts');
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to save business description.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <OnboardingFormSkeleton fieldsCount={2} twoColumn={false} />;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
          <FileText className="w-5 h-5 mr-2 text-[#3B82F6]" />
          Business Description & Differentiators
        </h2>
        <p className="text-sm text-slate-500 dark:text-[#94A3B8] mt-1">
          Articulate what your business does and why customers choose your products or services over alternatives.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-300 text-sm" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <label htmlFor="businessDescription" className="block text-xs font-medium text-slate-700 dark:text-[#E2E8F0]">
                Business Description <span className="text-[#FF7043]">*</span>
              </label>
              <InfoTooltip content="A comprehensive summary of your company, mission, and the core problems you solve for clients." />
            </div>
            <button
              type="button"
              onClick={() => handleOpenAi('businessDescription', 'Business Description', formData.businessDescription || '')}
              disabled={!formData.businessDescription?.trim()}
              title={formData.businessDescription?.trim() ? 'Improve with AI' : 'Enter some text first to improve with AI'}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
              <span>Improve with AI</span>
            </button>
          </div>
          <textarea
            id="businessDescription"
            rows={4}
            required
            spellCheck={true}
            value={formData.businessDescription || ''}
            onChange={e => setFormData({ ...formData, businessDescription: e.target.value })}
            placeholder="Tell your story: what your company specializes in, who you serve, and your commitment to excellence..."
            className="w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <label htmlFor="differentiators" className="block text-xs font-medium text-slate-700 dark:text-[#E2E8F0]">
                Key Differentiators <span className="text-[#FF7043]">*</span>
              </label>
              <InfoTooltip content="Highlight unique strengths, proprietary methods, warranties, certified craftsmen, or superior materials." />
            </div>
            <button
              type="button"
              onClick={() => handleOpenAi('differentiators', 'Key Differentiators', formData.differentiators || '')}
              disabled={!formData.differentiators?.trim()}
              title={formData.differentiators?.trim() ? 'Improve with AI' : 'Enter some text first to improve with AI'}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
              <span>Improve with AI</span>
            </button>
          </div>
          <textarea
            id="differentiators"
            rows={3}
            required
            spellCheck={true}
            value={formData.differentiators || ''}
            onChange={e => setFormData({ ...formData, differentiators: e.target.value })}
            placeholder="e.g. 10-year comprehensive warranty, certified in-house master installers, precision German hardware..."
            className="w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
          />
        </div>

        {/* Navigation Buttons */}
        <div className="pt-6 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push('/admin/onboarding/location-customers')}
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
            {fromAdmin ? 'Save & Return' : 'Save & Continue'}
          </Button>
        </div>
      </form>

      {aiModal && (
        <AIContentModal
          isOpen={!!aiModal}
          onClose={() => setAiModal(null)}
          fieldKey={aiModal.fieldKey}
          fieldLabel={aiModal.fieldLabel}
          sectionKey="business-context"
          sectionTitle="Business Context"
          currentText={aiModal.currentText}
          onApply={(improved) => {
            setFormData({ ...formData, [aiModal.fieldKey]: improved });
          }}
        />
      )}
    </div>
  );
}
