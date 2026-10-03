'use client';

import { EmptyState } from '@/components/ui/EmptyState';
import { Users } from 'lucide-react';

export default function LeadsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Leads
        </h1>
        <p className="text-sm text-slate-500 dark:text-[#94A3B8] mt-1">
          Review customer inquiries and project requests captured through your website.
        </p>
      </div>

      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 sm:p-8 shadow-sm">
        <EmptyState
          icon={<Users className="w-6 h-6" />}
          title="No leads have been received yet"
          description="Inquiries submitted through your connected website contact forms will appear here in real-time."
        />
      </div>
    </div>
  );
}
