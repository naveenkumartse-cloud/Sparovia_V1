'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { OnboardingFormSkeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Building2, Check, ChevronDown, Search, X } from 'lucide-react';
import {
  cleanPhoneInput,
  isValidIndianPhone,
  handlePhoneKeyDown,
  handlePhonePaste,
} from '@/lib/validation/authValidation';

const BUSINESS_OPERATING_TYPES = [
  'Storefront',
  'Service Area',
  'Hybrid',
  'Online',
  'Other'
];

const PRIMARY_BUSINESS_CATEGORIES = [
  'Interior & Exterior',
  'Architecture & Design',
  'Construction & Contracting',
  'Home Services & Trades',
  'Real Estate & Property',
  'Commercial & Industrial Services',
  'Professional Services',
  'Other'
];

export default function BusinessBasicsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromAdmin = searchParams.get('from') === 'admin';

  const [data, setData] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Category Combobox State
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const categoryComboboxRef = useRef<HTMLDivElement>(null);

  const isDirty = useMemo(() => {
    if (!data) return false;
    return JSON.stringify(data) !== JSON.stringify(formData);
  }, [data, formData]);

  useUnsavedChanges(isDirty);

  useEffect(() => {
    fetchData();
  }, []);

  // Handle click outside for combobox
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryComboboxRef.current && !categoryComboboxRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<any>('/onboarding/business-basics');
      setData(response || {});
      setFormData(response || {});
      if (response?.primaryCategory && !PRIMARY_BUSINESS_CATEGORIES.includes(response.primaryCategory)) {
        setCustomCategory(response.primaryCategory);
      }
    } catch (err: any) {
      setData({});
      setFormData({});
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return PRIMARY_BUSINESS_CATEGORIES;
    return PRIMARY_BUSINESS_CATEGORIES.filter(cat =>
      cat.toLowerCase().includes(categorySearch.toLowerCase().trim())
    );
  }, [categorySearch]);

  const handleSelectCategory = (cat: string) => {
    if (cat === 'Other') {
      setFormData({ ...formData, primaryCategory: customCategory || 'Other' });
    } else {
      setFormData({ ...formData, primaryCategory: cat });
    }
    setIsCategoryOpen(false);
    setCategorySearch('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    if (!formData.businessName?.trim()) {
      setError('Business Name is required.');
      setIsSaving(false);
      return;
    }

    if (!formData.primaryCategory?.trim()) {
      setError('Primary Business Category is required.');
      setIsSaving(false);
      return;
    }

    if (!formData.businessType?.trim()) {
      setError('Business Operating Type is required.');
      setIsSaving(false);
      return;
    }

    if (!formData.businessPhone?.trim() || !isValidIndianPhone(formData.businessPhone)) {
      setError('Enter a valid 10-digit phone number.');
      setIsSaving(false);
      return;
    }

    try {
      await apiClient.put('/onboarding/business-basics', formData);
      setData(formData);
      toast.success('Business basics saved successfully.');
      if (fromAdmin) {
        router.push('/admin/business-context');
      } else {
        router.push('/admin/onboarding/services');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to save business basics.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <OnboardingFormSkeleton fieldsCount={6} twoColumn={true} />;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
          <Building2 className="w-5 h-5 mr-2 text-[#3B82F6]" />
          Business Basics
        </h2>
        <p className="text-sm text-slate-500 dark:text-[#94A3B8] mt-1">
          Provide your primary business details and operational classification. This establishes the trusted identity for your website and AI workflows.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-300 text-sm" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* 1. Business Name */}
          <div className="sm:col-span-2">
            <div className="flex items-center gap-1.5">
              <label htmlFor="businessName" className="block text-sm font-medium text-slate-700 dark:text-[#E2E8F0]">
                Business Name <span className="text-[#FF7043]">*</span>
              </label>
              <InfoTooltip content="The legal or public brand name of your business as it will appear on your website." />
            </div>
            <input 
              id="businessName"
              type="text" 
              required
              spellCheck={true}
              autoCorrect="on"
              autoCapitalize="words"
              lang="en"
              value={formData.businessName || ''} 
              onChange={e => setFormData({...formData, businessName: e.target.value})}
              placeholder="e.g. Apex Window Systems"
              className="mt-1.5 w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
            />
          </div>

          {/* 2. Primary Business Category (Combobox) */}
          <div className="relative" ref={categoryComboboxRef}>
            <div className="flex items-center gap-1.5">
              <label htmlFor="primaryCategoryInput" className="block text-sm font-medium text-slate-700 dark:text-[#E2E8F0]">
                Primary Business Category <span className="text-[#FF7043]">*</span>
              </label>
              <InfoTooltip content="The industry or domain your business belongs to (what your business does)." />
            </div>
            
            <div className="relative mt-1.5">
              <button
                type="button"
                id="primaryCategoryInput"
                aria-haspopup="listbox"
                aria-expanded={isCategoryOpen}
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className="w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-left text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] flex items-center justify-between"
              >
                <span className={formData.primaryCategory ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-[#64748B]'}>
                  {formData.primaryCategory || 'Select or search category...'}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-[#94A3B8] transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCategoryOpen && (
                <div className="absolute z-30 mt-2 w-full bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-2 border-b border-slate-100 dark:border-[#1E293B] relative">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#64748B]" />
                    <input
                      type="text"
                      value={categorySearch}
                      onChange={e => setCategorySearch(e.target.value)}
                      placeholder="Filter categories..."
                      autoFocus
                      className="w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-lg pl-8 pr-8 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] focus:outline-none focus:border-[#3B82F6]"
                    />
                    {categorySearch && (
                      <button
                        type="button"
                        onClick={() => setCategorySearch('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <ul className="max-h-56 overflow-y-auto py-1 divide-y divide-slate-100 dark:divide-[#1E293B]/30" role="listbox">
                    {filteredCategories.map(cat => {
                      const isSelected = formData.primaryCategory === cat;
                      return (
                        <li
                          key={cat}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleSelectCategory(cat)}
                          className={`px-3.5 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected 
                              ? 'bg-[#3B82F6]/15 text-[#3B82F6] font-semibold' 
                              : 'text-slate-700 dark:text-[#CBD5E1] hover:bg-slate-100 dark:hover:bg-[#1E293B] hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <span>{cat}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#3B82F6]" />}
                        </li>
                      );
                    })}
                    {filteredCategories.length === 0 && (
                      <li className="px-4 py-3 text-xs text-slate-500 dark:text-[#94A3B8] text-center">
                        No matching category found.{' '}
                        <button
                          type="button"
                          onClick={() => handleSelectCategory(categorySearch)}
                          className="text-[#3B82F6] hover:underline font-semibold ml-1"
                        >
                          Use &ldquo;{categorySearch}&rdquo;
                        </button>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Custom Category input if 'Other' is selected or custom string used */}
            {(formData.primaryCategory === 'Other' || (formData.primaryCategory && !PRIMARY_BUSINESS_CATEGORIES.includes(formData.primaryCategory))) && (
              <div className="mt-2.5">
                <input
                  type="text"
                  spellCheck={true}
                  autoCorrect="on"
                  autoCapitalize="words"
                  lang="en"
                  value={customCategory}
                  onChange={e => {
                    setCustomCategory(e.target.value);
                    setFormData({ ...formData, primaryCategory: e.target.value });
                  }}
                  placeholder="Specify your custom business category..."
                  className="w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-xs focus:outline-none focus:border-[#3B82F6]"
                />
              </div>
            )}
          </div>

          {/* 3. Business Operating Type */}
          <div>
            <div className="flex items-center gap-1.5">
              <label htmlFor="businessType" className="block text-sm font-medium text-slate-700 dark:text-[#E2E8F0]">
                Business Operating Type <span className="text-[#FF7043]">*</span>
              </label>
              <InfoTooltip content="How your business delivers services to customers (operational model)." />
            </div>
            <select
              id="businessType"
              value={formData.businessType || ''}
              onChange={e => setFormData({...formData, businessType: e.target.value})}
              className="mt-1.5 w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
            >
              <option value="">Select operating type...</option>
              {BUSINESS_OPERATING_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* 4. Phone */}
          <div>
            <div className="flex items-center gap-1.5">
              <label htmlFor="businessPhone" className="block text-sm font-medium text-slate-700 dark:text-[#E2E8F0]">
                Business Phone <span className="text-[#FF7043]">*</span>
              </label>
              <InfoTooltip content="Public contact phone number displayed for customer inquiries and lead calls." />
            </div>
            <div className="mt-1.5 flex items-stretch w-full rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-[#0B1220] focus-within:ring-1 focus-within:ring-[#3B82F6] focus-within:border-[#3B82F6]">
              <div
                aria-hidden="true"
                className="flex items-center justify-center px-3.5 py-2.5 bg-slate-100 dark:bg-[#1E293B]/70 text-slate-600 dark:text-slate-300 font-semibold text-sm select-none rounded-l-xl border-r border-slate-200 dark:border-[#334155]"
              >
                <span className="tracking-wide">+91</span>
              </div>
              <input 
                id="businessPhone"
                type="tel" 
                inputMode="numeric"
                autoComplete="tel"
                maxLength={10}
                required
                value={formData.businessPhone || ''} 
                onKeyDown={handlePhoneKeyDown}
                onPaste={(e) => {
                  handlePhonePaste(e, (cleanVal) => {
                    setFormData({ ...formData, businessPhone: cleanVal });
                  });
                }}
                onChange={e => {
                  const cleaned = cleanPhoneInput(e.target.value);
                  setFormData({ ...formData, businessPhone: cleaned });
                }}
                placeholder="9876543210"
                className="w-full bg-transparent px-3.5 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* 5. Email */}
          <div>
            <div className="flex items-center gap-1.5">
              <label htmlFor="businessEmail" className="block text-sm font-medium text-slate-700 dark:text-[#E2E8F0]">
                Business Email <span className="text-[#FF7043]">*</span>
              </label>
              <InfoTooltip content="Primary business email used for receiving customer inquiries from website forms." />
            </div>
            <input 
              id="businessEmail"
              type="email" 
              required
              value={formData.businessEmail || ''} 
              onChange={e => setFormData({...formData, businessEmail: e.target.value})}
              placeholder="contact@apexwindows.com"
              className="mt-1.5 w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
            />
          </div>

          {/* 6. Website */}
          <div className="sm:col-span-2">
            <div className="flex items-center gap-1.5">
              <label htmlFor="website" className="block text-sm font-medium text-slate-700 dark:text-[#E2E8F0]">
                Website URL <span className="text-[#FF7043]">*</span>
              </label>
              <InfoTooltip content="Your current live website domain or intended web address." />
            </div>
            <input 
              id="website"
              type="url" 
              required
              value={formData.website || ''} 
              onChange={e => setFormData({...formData, website: e.target.value})}
              placeholder="https://www.apexwindows.com"
              className="mt-1.5 w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-[#1E293B] flex justify-end">
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
