'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Check } from 'lucide-react';

const ONBOARDING_STEPS = [
  { id: 'business-basics', name: 'Business Basics', path: '/admin/onboarding/business-basics' },
  { id: 'services', name: 'Services', path: '/admin/onboarding/services' },
  { id: 'location-customers', name: 'Location & Customers', path: '/admin/onboarding/location-customers' },
  { id: 'business-description', name: 'Description', path: '/admin/onboarding/business-description' },
  { id: 'approved-facts', name: 'Approved Facts', path: '/admin/onboarding/approved-facts' },
  { id: 'review', name: 'Review & Confirm', path: '/admin/onboarding/review' },
];

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fromAdmin = searchParams.get('from') === 'admin';

  const currentStepIndex = ONBOARDING_STEPS.findIndex(step => pathname.includes(step.id));

  return (
    <div className="max-w-4xl mx-auto pb-16 px-4 sm:px-6">
      {/* Top Banner / Progress Indicator */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-[#315FEA]">
              {fromAdmin ? 'Business Context Management' : 'Business Context Onboarding'}
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
              {fromAdmin ? 'Update Business Information' : 'Establish Approved Business Facts'}
            </h1>
          </div>
          {fromAdmin && (
            <Link
              href="/admin/business-context"
              className="text-xs font-semibold text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white transition-colors bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] px-3.5 py-2 rounded-[6px] shadow-xs shrink-0 self-start sm:self-center"
            >
              Back to Business Context
            </Link>
          )}
        </div>

        {/* Step Progression Bar */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-[8px] p-3 sm:p-4 shadow-sm overflow-x-auto no-scrollbar">
          <nav aria-label="Progress" className="min-w-[600px] sm:min-w-0">
            <ol className="flex items-center justify-between space-x-2 sm:space-x-4">
              {ONBOARDING_STEPS.map((step, index) => {
                const isCompleted = currentStepIndex > index;
                const isCurrent = currentStepIndex === index;

                return (
                  <li key={step.id} className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                          isCompleted
                            ? 'bg-[#15803D]/10 text-[#15803D] dark:text-[#4ADE80] border border-[#15803D]/30'
                            : isCurrent
                            ? 'bg-[#315FEA] text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-[#1E293B] text-slate-400 dark:text-[#64748B] border border-slate-200 dark:border-[#334155]'
                        }`}
                      >
                        {isCompleted ? <Check className="w-3.5 h-3.5" /> : index + 1}
                      </div>
                      <span
                        className={`text-xs font-medium truncate ${
                          isCurrent 
                            ? 'text-slate-900 dark:text-white font-semibold' 
                            : isCompleted 
                            ? 'text-slate-700 dark:text-[#CBD5E1]' 
                            : 'text-slate-400 dark:text-[#64748B]'
                        }`}
                      >
                        {step.name}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-[8px] p-4 sm:p-6 lg:p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
