'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { OnboardingFormSkeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ArrowRight, MapPin, Users, RefreshCw } from 'lucide-react';

export default function LocationCustomersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromAdmin = searchParams.get('from') === 'admin';

  const [data, setData] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [serviceAreasInput, setServiceAreasInput] = useState('');
  const [targetCustomersInput, setTargetCustomersInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const isDirty = useMemo(() => {
    if (!data) return false;
    const initialAddress = {
      addressLine1: data.addressLine1 || '',
      addressLine2: data.addressLine2 || '',
      city: data.city || '',
      state: data.state || '',
      postalCode: data.postalCode || '',
      country: data.country || '',
    };
    const currentAddress = {
      addressLine1: formData.addressLine1 || '',
      addressLine2: formData.addressLine2 || '',
      city: formData.city || '',
      state: formData.state || '',
      postalCode: formData.postalCode || '',
      country: formData.country || '',
    };
    const addressChanged = JSON.stringify(initialAddress) !== JSON.stringify(currentAddress);
    const initialServiceAreasStr = Array.isArray(data.serviceAreas) ? data.serviceAreas.join(', ') : (data.serviceAreas || '');
    const initialTargetCustomersStr = Array.isArray(data.targetCustomers) ? data.targetCustomers.join(', ') : (data.targetCustomers || '');
    const listsChanged = serviceAreasInput !== initialServiceAreasStr || targetCustomersInput !== initialTargetCustomersStr;
    return addressChanged || listsChanged;
  }, [data, formData, serviceAreasInput, targetCustomersInput]);

  useUnsavedChanges(isDirty);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<any>('/onboarding/location-customers');
      const res: any = response || {};
      setData(res);
      setFormData({
        addressLine1: res.addressLine1 || '',
        addressLine2: res.addressLine2 || '',
        city: res.city || '',
        state: res.state || '',
        postalCode: res.postalCode || '',
        country: res.country || '',
      });
      setServiceAreasInput(Array.isArray(res.serviceAreas) ? res.serviceAreas.join(', ') : (res.serviceAreas || ''));
      setTargetCustomersInput(Array.isArray(res.targetCustomers) ? res.targetCustomers.join(', ') : (res.targetCustomers || ''));
    } catch (err: any) {
      setData({});
      setFormData({});
      setServiceAreasInput('');
      setTargetCustomersInput('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    const parsedServiceAreas = serviceAreasInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const parsedTargetCustomers = targetCustomersInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const payload = {
      ...formData,
      serviceAreas: parsedServiceAreas,
      targetCustomers: parsedTargetCustomers,
    };

    try {
      await apiClient.put('/onboarding/location-customers', payload);
      setData(payload);
      setServiceAreasInput(parsedServiceAreas.join(', '));
      setTargetCustomersInput(parsedTargetCustomers.join(', '));
      toast.success('Location & customer details saved successfully.');
      if (fromAdmin) {
        router.push('/admin/business-context');
      } else {
        router.push('/admin/onboarding/business-description');
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to save location and customers.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <OnboardingFormSkeleton fieldsCount={8} twoColumn={true} />;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-[#3B82F6]" />
          Location & Target Customers
        </h2>
        <p className="text-sm text-slate-500 dark:text-[#94A3B8] mt-1">
          Specify where your business operates and the types of clients you serve.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-300 text-sm" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Address Section */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Business Address</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-1.5">
                <label htmlFor="addressLine1" className="block text-xs font-medium text-slate-700 dark:text-[#E2E8F0]">
                  Address Line 1
                </label>
                <InfoTooltip content="Physical street address or headquarters location." />
              </div>
              <input
                id="addressLine1"
                type="text"
                value={formData.addressLine1 || ''}
                onChange={e => setFormData({ ...formData, addressLine1: e.target.value })}
                placeholder="123 Commerce Way"
                className="mt-1.5 w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl px-3.5 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
              />
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center gap-1.5">
                <label htmlFor="addressLine2" className="block text-xs font-medium text-slate-700 dark:text-[#E2E8F0]">
                  Address Line 2 (Optional)
                </label>
                <InfoTooltip content="Suite, floor, building number or additional address details." />
              </div>
              <input
                id="addressLine2"
                type="text"
                value={formData.addressLine2 || ''}
                onChange={e => setFormData({ ...formData, addressLine2: e.target.value })}
                placeholder="Suite 400"
                className="mt-1.5 w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl px-3.5 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
              />
            </div>

            <div>
              <label htmlFor="city" className="block text-xs font-medium text-slate-700 dark:text-[#E2E8F0]">
                City
              </label>
              <input
                id="city"
                type="text"
                value={formData.city || ''}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                placeholder="San Francisco"
                className="mt-1.5 w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl px-3.5 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
              />
            </div>

            <div>
              <label htmlFor="state" className="block text-xs font-medium text-slate-700 dark:text-[#E2E8F0]">
                State / Province / Region
              </label>
              <input
                id="state"
                type="text"
                value={formData.state || ''}
                onChange={e => setFormData({ ...formData, state: e.target.value })}
                placeholder="CA"
                className="mt-1.5 w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl px-3.5 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
              />
            </div>

            <div>
              <label htmlFor="postalCode" className="block text-xs font-medium text-slate-700 dark:text-[#E2E8F0]">
                Postal Code
              </label>
              <input
                id="postalCode"
                type="text"
                value={formData.postalCode || ''}
                onChange={e => setFormData({ ...formData, postalCode: e.target.value })}
                placeholder="94105"
                className="mt-1.5 w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl px-3.5 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
              />
            </div>

            <div>
              <label htmlFor="country" className="block text-xs font-medium text-slate-700 dark:text-[#E2E8F0]">
                Country
              </label>
              <input
                id="country"
                type="text"
                value={formData.country || ''}
                onChange={e => setFormData({ ...formData, country: e.target.value })}
                placeholder="United States"
                className="mt-1.5 w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl px-3.5 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
              />
            </div>
          </div>
        </div>

        {/* Service Areas & Target Customers */}
        <div className="pt-4 border-t border-slate-100 dark:border-[#1E293B] space-y-4">
          <div>
            <div className="flex items-center gap-1.5">
              <label htmlFor="serviceAreas" className="block text-xs font-medium text-slate-700 dark:text-[#E2E8F0]">
                Service Areas (Comma separated)
              </label>
              <InfoTooltip content="Geographic areas or cities where you actively service clients (e.g. Greater Bay Area, Silicon Valley, Marin County)." />
            </div>
            <input
              id="serviceAreas"
              type="text"
              spellCheck={true}
              autoCorrect="on"
              autoCapitalize="sentences"
              lang="en"
              value={serviceAreasInput}
              onChange={e => setServiceAreasInput(e.target.value)}
              placeholder="e.g. San Francisco, Oakland, San Jose"
              className="mt-1.5 w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl px-3.5 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
            />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <label htmlFor="targetCustomers" className="block text-xs font-medium text-slate-700 dark:text-[#E2E8F0]">
                Target Customers (Comma separated)
              </label>
              <InfoTooltip content="Ideal customer profiles or audience segments (e.g. Luxury Homeowners, Commercial Developers, Interior Designers)." />
            </div>
            <input
              id="targetCustomers"
              type="text"
              spellCheck={true}
              autoCorrect="on"
              autoCapitalize="sentences"
              lang="en"
              value={targetCustomersInput}
              onChange={e => setTargetCustomersInput(e.target.value)}
              placeholder="e.g. Residential Homeowners, General Contractors, Architects"
              className="mt-1.5 w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl px-3.5 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
            />
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="pt-6 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push('/admin/onboarding/services')}
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
    </div>
  );
}
