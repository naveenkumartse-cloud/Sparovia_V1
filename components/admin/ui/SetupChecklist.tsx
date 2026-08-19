import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

export interface SetupStep {
  id: string;
  title: string;
  description: string;
  isComplete: boolean;
  actionHref?: string;
  actionLabel?: string;
}

interface SetupChecklistProps {
  steps: SetupStep[];
}

export function SetupChecklist({ steps }: SetupChecklistProps) {
  const completedCount = steps.filter((s) => s.isComplete).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-soft-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Business Setup Progress</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {completedCount} of {steps.length} steps completed ({progressPercent}%)
          </p>
        </div>
        <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center font-bold text-sm text-brand-700">
          {progressPercent}%
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-2 mb-6 overflow-hidden">
        <div
          className="bg-brand-600 h-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="space-y-4">
        {steps.map((step) => (
          <div
            key={step.id}
            className="flex items-start justify-between p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-start space-x-3">
              {step.isComplete ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className={`text-sm font-medium ${step.isComplete ? 'text-slate-700 line-through' : 'text-slate-900'}`}>
                  {step.title}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
              </div>
            </div>
            {step.actionHref && !step.isComplete && (
              <a
                href={step.actionHref}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex-shrink-0 ml-4 hover:underline"
              >
                {step.actionLabel || 'Complete'} →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
