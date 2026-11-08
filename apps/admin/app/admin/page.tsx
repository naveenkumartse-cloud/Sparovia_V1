'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { apiClient } from '@/lib/api/client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { 
  Building2, 
  Laptop2, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  FileEdit,
  ShieldCheck, 
  Image as ImageIcon,
  Sparkles,
  ExternalLink,
  ChevronRight
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
    <div className="space-y-8">
      {/* Screen PageHeader with Workspace Context */}
      <PageHeader
        category="Operational Command Center"
        title={`Welcome back, ${user?.fullName || 'Business Owner'}`}
        badge={
          <Badge variant="cobalt" size="sm" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
            Authenticated Workspace
          </Badge>
        }
        description={
          <span>
            Connected workspace ID:{' '}
            <span className="font-mono text-[#172033] dark:text-[#CBD5E1] font-semibold break-all">
              {user?.tenantId || 'Sparovia Platform'}
            </span>
          </span>
        }
        actions={
          <Link
            href={isConfirmed ? "/admin/business-context" : "/admin/onboarding/business-basics"}
            className="inline-flex items-center justify-center w-full sm:w-auto h-10 min-h-[40px] px-5 rounded-[6px] text-sm font-semibold text-white bg-[#315FEA] hover:bg-[#254EDB] active:bg-[#1E40AF] transition-all shadow-soft-xs"
          >
            <span>{isConfirmed ? 'Review Business Facts' : 'Complete Onboarding'}</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        }
      />

      {/* Primary Operational Pillars (4-card responsive grid: 1 col on mobile, 2 on tablet, 4 on desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Business Context */}
        <Link href="/admin/business-context" className="block focus:outline-none">
          <Card variant="interactive" className="h-full flex flex-col justify-between p-5">
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-10 h-10 rounded-[6px] bg-[#315FEA]/10 border border-[#315FEA]/20 flex items-center justify-center text-[#315FEA]">
                  <Building2 className="w-5 h-5" />
                </div>
                {isConfirmed ? (
                  <Badge variant="success" size="xs" icon={<CheckCircle2 className="w-3 h-3 shrink-0" />}>
                    Approved
                  </Badge>
                ) : (
                  <Badge variant="warning" size="xs" icon={<Clock className="w-3 h-3 shrink-0" />}>
                    Pending
                  </Badge>
                )}
              </div>
              <h2 className="text-base font-bold text-[#172033] dark:text-white">Business Context</h2>
              <p className="text-xs text-[#475569] dark:text-[#94A3B8] mt-1.5 leading-relaxed">
                {isConfirmed 
                  ? 'Approved identity, services, and differentiators grounded in trusted facts.' 
                  : 'Establish approved business facts and credentials to guide platform workflows.'}
              </p>
            </div>
            <div className="mt-5 pt-3.5 border-t border-[#E3E7ED] dark:border-[#1E293B] flex items-center justify-between text-xs font-semibold text-[#315FEA]">
              <span>Manage context</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </Card>
        </Link>

        {/* Card 2: Connected Website Content */}
        <Link href="/admin/content" className="block focus:outline-none">
          <Card variant="interactive" className="h-full flex flex-col justify-between p-5">
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-10 h-10 rounded-[6px] bg-[#7950B8]/10 border border-[#7950B8]/20 flex items-center justify-center text-[#7950B8]">
                  <Laptop2 className="w-5 h-5" />
                </div>
                <Badge variant="purple" size="xs">
                  Active
                </Badge>
              </div>
              <h2 className="text-base font-bold text-[#172033] dark:text-white">Website Content</h2>
              <p className="text-xs text-[#475569] dark:text-[#94A3B8] mt-1.5 leading-relaxed">
                Maintain supported website copy with AI assistance and explicit publishing control.
              </p>
            </div>
            <div className="mt-5 pt-3.5 border-t border-[#E3E7ED] dark:border-[#1E293B] flex items-center justify-between text-xs font-semibold text-[#315FEA]">
              <span>Manage content</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </Card>
        </Link>

        {/* Card 3: Images & Image Studio */}
        <Link href="/admin/images" className="block focus:outline-none">
          <Card variant="interactive" className="h-full flex flex-col justify-between p-5">
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-10 h-10 rounded-[6px] bg-[#7950B8]/10 border border-[#7950B8]/20 flex items-center justify-center text-[#7950B8]">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <Badge variant="purple" size="xs">
                  Creative Studio
                </Badge>
              </div>
              <h2 className="text-base font-bold text-[#172033] dark:text-white">Images &amp; Portfolio</h2>
              <p className="text-xs text-[#475569] dark:text-[#94A3B8] mt-1.5 leading-relaxed">
                Showcase work photos and hero images with single-action enhancement and human review.
              </p>
            </div>
            <div className="mt-5 pt-3.5 border-t border-[#E3E7ED] dark:border-[#1E293B] flex items-center justify-between text-xs font-semibold text-[#315FEA]">
              <span>Open gallery</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </Card>
        </Link>

        {/* Card 4: Customer Leads */}
        <Link href="/admin/leads" className="block focus:outline-none">
          <Card variant="interactive" className="h-full flex flex-col justify-between p-5">
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-10 h-10 rounded-[6px] bg-[#315FEA]/10 border border-[#315FEA]/20 flex items-center justify-center text-[#315FEA]">
                  <Users className="w-5 h-5" />
                </div>
                {newLeadsCount !== null && newLeadsCount > 0 ? (
                  <Badge variant="success" size="xs">
                    {newLeadsCount} New {newLeadsCount === 1 ? 'Lead' : 'Leads'}
                  </Badge>
                ) : (
                  <Badge variant="neutral" size="xs">
                    Intake Ready
                  </Badge>
                )}
              </div>
              <h2 className="text-base font-bold text-[#172033] dark:text-white">Customer Leads</h2>
              <p className="text-xs text-[#475569] dark:text-[#94A3B8] mt-1.5 leading-relaxed">
                Direct customer inquiries received from website forms and connected channels.
              </p>
            </div>
            <div className="mt-5 pt-3.5 border-t border-[#E3E7ED] dark:border-[#1E293B] flex items-center justify-between text-xs font-semibold text-[#315FEA]">
              <span>Review leads</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </Card>
        </Link>
      </div>

      {/* Recommended Next Actions / Operational Guidance */}
      <Card variant="default">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recommended Operational Next Steps</CardTitle>
              <CardDescription>
                Actionable milestones to ensure your business presence remains authoritative and active.
              </CardDescription>
            </div>
            <Badge variant="cobalt" size="xs">Priority</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start justify-between p-4 bg-[#F3F6FA]/70 dark:bg-[#0B1220] border border-[#E3E7ED] dark:border-[#1E293B] rounded-[6px] gap-4">
            <div className="flex items-start space-x-3.5 min-w-0">
              <div className="p-2 rounded-[4px] bg-[#315FEA]/10 text-[#315FEA] shrink-0 mt-0.5">
                <FileEdit className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-[#172033] dark:text-white">
                  Step 1: Confirm Business Context
                </p>
                <p className="text-xs text-[#475569] dark:text-[#94A3B8] mt-0.5 leading-relaxed">
                  Verify business categories, physical address, services, and approved factual credentials.
                </p>
              </div>
            </div>
            <Link 
              href="/admin/business-context" 
              className="text-xs font-semibold text-[#315FEA] hover:text-[#254EDB] shrink-0 self-center px-3 py-1.5 rounded-[4px] hover:bg-[#315FEA]/10 transition-colors"
            >
              Open
            </Link>
          </div>

          <div className="flex items-start justify-between p-4 bg-[#F3F6FA]/70 dark:bg-[#0B1220] border border-[#E3E7ED] dark:border-[#1E293B] rounded-[6px] gap-4">
            <div className="flex items-start space-x-3.5 min-w-0">
              <div className="p-2 rounded-[4px] bg-[#7950B8]/10 text-[#7950B8] shrink-0 mt-0.5">
                <Laptop2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-[#172033] dark:text-white">
                  Step 2: Connect &amp; Review Website Content
                </p>
                <p className="text-xs text-[#475569] dark:text-[#94A3B8] mt-0.5 leading-relaxed">
                  Ensure supported sections match your active services and business differentiators.
                </p>
              </div>
            </div>
            <Link 
              href="/admin/content" 
              className="text-xs font-semibold text-[#315FEA] hover:text-[#254EDB] shrink-0 self-center px-3 py-1.5 rounded-[4px] hover:bg-[#315FEA]/10 transition-colors"
            >
              Open
            </Link>
          </div>

          <div className="flex items-start justify-between p-4 bg-[#F3F6FA]/70 dark:bg-[#0B1220] border border-[#E3E7ED] dark:border-[#1E293B] rounded-[6px] gap-4">
            <div className="flex items-start space-x-3.5 min-w-0">
              <div className="p-2 rounded-[4px] bg-[#15803D]/10 text-[#15803D] shrink-0 mt-0.5">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-[#172033] dark:text-white">
                  Step 3: Manage Website &amp; Portfolio Images
                </p>
                <p className="text-xs text-[#475569] dark:text-[#94A3B8] mt-0.5 leading-relaxed">
                  Upload genuine hero and showcase work photos with image enhancement and web optimization.
                </p>
              </div>
            </div>
            <Link 
              href="/admin/images" 
              className="text-xs font-semibold text-[#315FEA] hover:text-[#254EDB] shrink-0 self-center px-3 py-1.5 rounded-[4px] hover:bg-[#315FEA]/10 transition-colors"
            >
              Open
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
