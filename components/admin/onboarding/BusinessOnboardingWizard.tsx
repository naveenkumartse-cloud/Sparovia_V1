'use client';

import React, { useState } from 'react';
import { BusinessResponse } from '@/lib/api/types';
import { updateBusiness } from '@/lib/api/business';
import { Button } from '../ui/Button';
import { Building2, Target, MapPin, Store, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardProps {
  business: BusinessResponse;
  onComplete: () => void;
}

type WizardStep = 'understanding' | 'profile' | 'presence';

export function BusinessOnboardingWizard({ business, onComplete }: WizardProps) {
  const [step, setStep] = useState<WizardStep>('understanding');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [targetAudience, setTargetAudience] = useState(business.targetAudience || '');
  const [valueProposition, setValueProposition] = useState(business.valueProposition || '');
  const [description, setDescription] = useState(business.description || '');

  const [contactEmail, setContactEmail] = useState(business.contactEmail || '');
  const [contactPhone, setContactPhone] = useState(business.contactPhone || '');
  const [address, setAddress] = useState(business.address || '');

  const [hasGoogleBusinessProfile, setHasGoogleBusinessProfile] = useState<boolean | null>(
    business.hasGoogleBusinessProfile ?? null
  );

  const handleNext = () => {
    if (step === 'understanding') setStep('profile');
    else if (step === 'profile') setStep('presence');
  };

  const handleBack = () => {
    if (step === 'presence') setStep('profile');
    else if (step === 'profile') setStep('understanding');
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await updateBusiness(business.id, {
        description,
        targetAudience,
        valueProposition,
        contactEmail,
        contactPhone,
        address,
        hasGoogleBusinessProfile,
        googleBusinessProfileStatus: hasGoogleBusinessProfile ? 'Connected' : 'NotConnected', // Mock status for now
        isOnboardingComplete: true,
      });
      onComplete();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Failed to complete onboarding. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 antialiased">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-10 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto shadow-purple-glow">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Business Setup</h1>
          <p className="text-slate-400 max-w-lg mx-auto">
            Let&apos;s help Sparovia understand {business.name} so it can optimize your workspace, website, and leads.
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="flex items-center justify-center space-x-4 mb-10">
          <StepIndicator current={step} step="understanding" icon={Target} label="Understanding" />
          <div className={cn("h-px w-12", step === 'understanding' ? 'bg-slate-700' : 'bg-brand-500')} />
          <StepIndicator current={step} step="profile" icon={MapPin} label="Profile" />
          <div className={cn("h-px w-12", step !== 'presence' ? 'bg-slate-700' : 'bg-brand-500')} />
          <StepIndicator current={step} step="presence" icon={Store} label="Digital Presence" />
        </div>

        {/* Form Container */}
        <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {step === 'understanding' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <h2 className="text-xl font-bold mb-1">Business Understanding</h2>
                <p className="text-sm text-slate-400 mb-6">What does your business do, and who is it for?</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Short Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus-ring"
                    placeholder="Briefly describe your business..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus-ring"
                    placeholder="e.g. Homeowners looking for premium interiors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Value Proposition
                  </label>
                  <input
                    type="text"
                    value={valueProposition}
                    onChange={(e) => setValueProposition(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus-ring"
                    placeholder="e.g. Turnkey execution with 10-year warranty"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 'profile' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <h2 className="text-xl font-bold mb-1">Contact Profile</h2>
                <p className="text-sm text-slate-400 mb-6">How can customers reach you?</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Public Contact Email
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus-ring"
                      placeholder="hello@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Public Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus-ring"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Business Address
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus-ring"
                    placeholder="Full physical address..."
                  />
                </div>
              </div>
            </div>
          )}

          {step === 'presence' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <h2 className="text-xl font-bold mb-1">Digital Presence Check</h2>
                <p className="text-sm text-slate-400 mb-6">Let&apos;s connect your existing digital footprint.</p>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-semibold text-white mb-2">
                  Does {business.name} already have a Google Business Profile?
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setHasGoogleBusinessProfile(true)}
                    className={cn(
                      "p-4 border rounded-xl text-left transition-all",
                      hasGoogleBusinessProfile === true
                        ? "bg-brand-600/10 border-brand-500 ring-1 ring-brand-500"
                        : "bg-slate-900 border-slate-700 hover:border-slate-600"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">Yes, I have one</span>
                      {hasGoogleBusinessProfile === true && <CheckCircle2 className="w-5 h-5 text-brand-400" />}
                    </div>
                  </button>
                  <button
                    onClick={() => setHasGoogleBusinessProfile(false)}
                    className={cn(
                      "p-4 border rounded-xl text-left transition-all",
                      hasGoogleBusinessProfile === false
                        ? "bg-brand-600/10 border-brand-500 ring-1 ring-brand-500"
                        : "bg-slate-900 border-slate-700 hover:border-slate-600"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">No, not yet</span>
                      {hasGoogleBusinessProfile === false && <CheckCircle2 className="w-5 h-5 text-brand-400" />}
                    </div>
                  </button>
                </div>

                {hasGoogleBusinessProfile === true && (
                  <div className="mt-6 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm">
                    Great! We will help you connect and import your Google Business Profile shortly after you enter the workspace.
                  </div>
                )}
                {hasGoogleBusinessProfile === false && (
                  <div className="mt-6 p-4 rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-400 text-sm">
                    No problem. Sparovia will guide you in setting up your digital presence once you enter the workspace.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="mt-10 pt-6 border-t border-slate-700 flex items-center justify-between">
            {step !== 'understanding' ? (
              <Button variant="ghost" onClick={handleBack} className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            ) : (
              <div /> // Placeholder for spacing
            )}

            {step !== 'presence' ? (
              <Button variant="primary" onClick={handleNext}>
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button variant="primary" onClick={handleSubmit} isLoading={isLoading} disabled={hasGoogleBusinessProfile === null}>
                Complete Setup <CheckCircle2 className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ current, step, icon: Icon, label }: { current: WizardStep; step: WizardStep; icon: any; label: string }) {
  const isPast =
    (current === 'profile' && step === 'understanding') ||
    (current === 'presence' && (step === 'understanding' || step === 'profile'));
  const isCurrent = current === step;

  return (
    <div className="flex flex-col items-center space-y-2">
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
          isCurrent ? "bg-brand-600 border-brand-500 text-white shadow-purple-glow" :
            isPast ? "bg-slate-800 border-brand-500 text-brand-400" :
              "bg-slate-800 border-slate-700 text-slate-500"
        )}
      >
        <Icon className="w-4 h-4" />
      </div>
      <span className={cn("text-xs font-semibold uppercase tracking-wider", isCurrent ? "text-white" : "text-slate-500")}>
        {label}
      </span>
    </div>
  );
}
