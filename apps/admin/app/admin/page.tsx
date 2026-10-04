'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { apiClient } from '@/lib/api/client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { 
  Building2, 
  Laptop2, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  FileEdit,
  ShieldCheck,
  Image as ImageIcon
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [contextSummary, setContextSummary] = useState<any>(null);
  const [newLeadsCount, setNewLeadsCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await apiClient.get('/onboarding/summary');
        setContextSummary(data);

        // Fetch leads summary count if confirmed
        if ((data as any)?.isConfirmed) {
          try {
            const leadsData = await apiClient.get<any>('/leads?pageSize=1&status=New');
            setNewLeadsCount(leadsData?.totalCount ?? 0);
          } catch {
            // Non-blocking for dashboard
          }
        }
      } catch (err: any) {
        // May be unconfirmed or empty
      } finally {
        setIsLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const isConfirmed = contextSummary?.isConfirmed ?? false;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white dark:bg-[#0F172A] p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-[#1E293B] shadow-sm dark:shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#3B82F6]/10 to-[#8B3FD1]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20 mb-3">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
              Authenticated Workspace
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Welcome back, {user?.fullName || 'Business Owner'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-[#94A3B8] mt-1">
              Tenant context: <span className="font-mono text-slate-700 dark:text-[#CBD5E1]">{user?.tenantId}</span>
            </p>
          </div>

          <div className="shrink-0">
            <Link
              href={isConfirmed ? "/admin/business-context" : "/admin/onboarding/business-basics"}
              className="inline-flex items-center justify-center h-10 min-h-[40px] px-5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all shadow-xs"
            >
              {isConfirmed ? 'Manage Business Context' : 'Complete Onboarding'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Grid of Key Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Business Context Card */}
        <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-[#1E293B] shadow-sm dark:shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6]">
                <Building2 className="w-5 h-5" />
              </div>
              {isConfirmed ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Approved</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap shrink-0">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>Pending</span>
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Business Context</h2>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1 leading-relaxed">
              {isConfirmed 
                ? 'Your approved facts, services, and differentiators are locked and trusted.' 
                : 'Complete the onboarding steps to establish your trusted business facts.'}
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#1E293B]">
            <Link 
              href="/admin/business-context" 
              className="inline-flex items-center text-xs font-semibold text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
            >
              Review facts <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Website Content Card */}
        <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-[#1E293B] shadow-sm dark:shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#8B3FD1]/10 border border-[#8B3FD1]/20 flex items-center justify-center text-[#8B3FD1]">
                <Laptop2 className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">
                Connected
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Connected Website</h2>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1 leading-relaxed">
              Manage supported website sections and copy with AI assistance inside controlled boundaries.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#1E293B]">
            <Link 
              href="/admin/content" 
              className="inline-flex items-center text-xs font-semibold text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
            >
              Manage content <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Leads Intake Card */}
        <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-[#1E293B] shadow-sm dark:shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#FF7043]/10 border border-[#FF7043]/20 flex items-center justify-center text-[#FF7043]">
                <Users className="w-5 h-5" />
              </div>
              {newLeadsCount !== null && newLeadsCount > 0 ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {newLeadsCount} New {newLeadsCount === 1 ? 'Lead' : 'Leads'}
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-[#94A3B8]">
                  Intake Active
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Customer Leads</h2>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1 leading-relaxed">
              Direct inquiries submitted through your connected website contact form and lead widgets.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#1E293B]">
            <Link 
              href="/admin/leads" 
              className="inline-flex items-center text-xs font-semibold text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
            >
              View lead list <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Action Guidance Panel */}
      <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-[#1E293B] shadow-sm dark:shadow-lg">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Recommended Next Steps</h2>
        <div className="space-y-3">
          <div className="flex items-start justify-between p-3.5 bg-slate-50 dark:bg-[#0B1220] border border-slate-200/80 dark:border-[#1E293B] rounded-xl">
            <div className="flex items-start space-x-3">
              <div className="p-1.5 rounded-lg bg-[#3B82F6]/10 text-[#3B82F6] shrink-0 mt-0.5">
                <FileEdit className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-900 dark:text-white">Step 1: Confirm Business Context</p>
                <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-0.5">
                  Verify business categories, address, services, and approved factual credentials.
                </p>
              </div>
            </div>
            <Link 
              href="/admin/business-context" 
              className="text-xs text-[#3B82F6] hover:underline font-medium shrink-0 ml-4"
            >
              Open
            </Link>
          </div>

          <div className="flex items-start justify-between p-3.5 bg-slate-50 dark:bg-[#0B1220] border border-slate-200/80 dark:border-[#1E293B] rounded-xl">
            <div className="flex items-start space-x-3">
              <div className="p-1.5 rounded-lg bg-[#8B3FD1]/10 text-[#8B3FD1] shrink-0 mt-0.5">
                <Laptop2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-900 dark:text-white">Step 2: Connect & Review Website Content</p>
                <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-0.5">
                  Ensure supported sections match your active services and differentiators.
                </p>
              </div>
            </div>
            <Link 
              href="/admin/content" 
              className="text-xs text-[#3B82F6] hover:underline font-medium shrink-0 ml-4"
            >
              Open
            </Link>
          </div>

          <div className="flex items-start justify-between p-3.5 bg-slate-50 dark:bg-[#0B1220] border border-slate-200/80 dark:border-[#1E293B] rounded-xl">
            <div className="flex items-start space-x-3">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-900 dark:text-white">Step 3: Manage Website &amp; Portfolio Images</p>
                <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-0.5">
                  Upload genuine hero and showcase work photos with image enhancement and web optimization.
                </p>
              </div>
            </div>
            <Link 
              href="/admin/images" 
              className="text-xs text-[#3B82F6] hover:underline font-medium shrink-0 ml-4"
            >
              Open
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
