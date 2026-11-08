'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { apiClient } from '@/lib/api/client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
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
  ChevronRight,
  Phone,
  MessageCircle,
  Globe,
  Plus
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [contextSummary, setContextSummary] = useState<any>(null);
  const [newLeadsCount, setNewLeadsCount] = useState<number | null>(null);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await apiClient.get('/onboarding/summary');
        setContextSummary(data);

        // Fetch leads summary count and recent leads
        try {
          const leadsData = await apiClient.get<any>('/leads?pageSize=3&sort=newest');
          setNewLeadsCount(leadsData?.totalCount ?? 0);
          setRecentLeads(leadsData?.items || []);
        } catch {
          // Non-blocking for dashboard
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
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Sleek Command Center PageHeader with Workspace Context & Public Site Action */}
      <PageHeader
        category="Operational Command Center"
        title={`Welcome back, ${user?.fullName || 'Business Owner'}`}
        badge={
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <Badge variant="success" size="sm">
              Live &amp; Serving Visitors
            </Badge>
          </div>
        }
        description={
          <span>
            Operating workspace ID:{' '}
            <span className="font-mono text-[#172033] dark:text-[#CBD5E1] font-semibold break-all">
              {user?.tenantId ? `${user.tenantId.substring(0, 12)}...` : 'Sparovia Platform'}
            </span>
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-10 px-4 rounded-[6px] text-xs sm:text-sm font-semibold glass-panel text-[#172033] dark:text-white hover:bg-white/95 dark:hover:bg-[#1E293B]/95 transition-all shadow-soft-xs"
              title="Open your public website in a new window"
            >
              <Globe className="w-4 h-4 mr-2 text-[#315FEA]" />
              <span>Preview Live Website</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1.5 opacity-60" />
            </a>

            <Link
              href={isConfirmed ? "/admin/business-context" : "/admin/onboarding/business-basics"}
              className="inline-flex items-center justify-center h-10 px-5 rounded-[6px] text-xs sm:text-sm font-semibold text-white bg-[#315FEA] hover:bg-[#254EDB] active:bg-[#1E40AF] transition-all shadow-soft-xs"
            >
              <span>{isConfirmed ? 'Review Business Facts' : 'Complete Onboarding'}</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        }
      />

      {/* 2. Business Presence Overview Banner (Stripe/Linear Double-Bezel Card) */}
      <div className="double-bezel">
        <div className="bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-md rounded-[8px] p-5 sm:p-6 border border-white/60 dark:border-white/10 shadow-soft-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-[#315FEA]">
                Public Business Identity
              </span>
              <Badge variant="cobalt" size="xs">
                Verified
              </Badge>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#172033] dark:text-white">
              {contextSummary?.businessName || user?.fullName || 'Your Design Business'}
            </h2>
            <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
              {contextSummary?.primaryCategory || 'Architecture & Interior Execution'} • Serving client inquiries via Website &amp; WhatsApp
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/admin/business-presence"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] text-xs font-semibold bg-[#F3F6FA] hover:bg-[#E3E7ED] dark:bg-[#1E293B] dark:hover:bg-[#334155] text-[#172033] dark:text-white border border-[#CBD5E1] dark:border-[#334155] transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-[#315FEA]" />
              <span>Business Presence</span>
            </Link>
            <Link
              href="/admin/leads"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] text-xs font-semibold text-white bg-[#315FEA] hover:bg-[#254EDB] transition-colors shadow-soft-xs"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Customer Inquiries</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Primary Operational Pillars (4 Interactive 3D Cards with Preserved Radius) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Business Context */}
        <Link href="/admin/business-context" className="block focus:outline-none group">
          <Card variant="premium" className="h-full flex flex-col justify-between p-5 border-white/60 dark:border-white/10">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-[6px] bg-gradient-to-br from-[#315FEA]/20 to-[#315FEA]/5 text-[#315FEA] border border-[#315FEA]/20 flex items-center justify-center font-bold shadow-soft-xs group-hover:scale-105 transition-transform">
                  <Building2 className="w-5 h-5" />
                </div>
                {isConfirmed ? (
                  <Badge variant="success" size="xs" icon={<CheckCircle2 className="w-3 h-3 shrink-0" />}>
                    Approved Facts
                  </Badge>
                ) : (
                  <Badge variant="warning" size="xs" icon={<Clock className="w-3 h-3 shrink-0" />}>
                    Needs Review
                  </Badge>
                )}
              </div>
              <h2 className="text-base font-bold text-[#172033] dark:text-white">Business Context</h2>
              <p className="text-xs text-[#475569] dark:text-[#94A3B8] mt-1.5 leading-relaxed">
                {isConfirmed 
                  ? 'Grounded facts, service offerings, and approved credentials that steer all AI output.' 
                  : 'Establish factual business identity and credentials to guide platform workflows.'}
              </p>
            </div>
            <div className="mt-5 pt-3.5 border-t border-[#E3E7ED] dark:border-[#1E293B] flex items-center justify-between text-xs font-semibold text-[#315FEA] group-hover:translate-x-0.5 transition-transform">
              <span>Review Context</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </Card>
        </Link>

        {/* Card 2: Connected Website Content */}
        <Link href="/admin/content" className="block focus:outline-none group">
          <Card variant="premium" className="h-full flex flex-col justify-between p-5 border-white/60 dark:border-white/10">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-[6px] bg-gradient-to-br from-[#7950B8]/20 to-[#7950B8]/5 text-[#7950B8] border border-[#7950B8]/20 flex items-center justify-center font-bold shadow-soft-xs group-hover:scale-105 transition-transform">
                  <Laptop2 className="w-5 h-5" />
                </div>
                <Badge variant="purple" size="xs">
                  Published &amp; Active
                </Badge>
              </div>
              <h2 className="text-base font-bold text-[#172033] dark:text-white">Website Content</h2>
              <p className="text-xs text-[#475569] dark:text-[#94A3B8] mt-1.5 leading-relaxed">
                Maintain live website sections with AI assistance, draft review, and explicit publishing control.
              </p>
            </div>
            <div className="mt-5 pt-3.5 border-t border-[#E3E7ED] dark:border-[#1E293B] flex items-center justify-between text-xs font-semibold text-[#315FEA] group-hover:translate-x-0.5 transition-transform">
              <span>Manage Content</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </Card>
        </Link>

        {/* Card 3: Images & Image Studio */}
        <Link href="/admin/images" className="block focus:outline-none group">
          <Card variant="premium" className="h-full flex flex-col justify-between p-5 border-white/60 dark:border-white/10">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-[6px] bg-gradient-to-br from-[#7950B8]/25 via-[#7950B8]/10 to-transparent text-[#7950B8] border border-[#7950B8]/30 flex items-center justify-center font-bold shadow-soft-xs glow-purple group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <Badge variant="purple" size="xs">
                  Creative Studio
                </Badge>
              </div>
              <h2 className="text-base font-bold text-[#172033] dark:text-white">Image Studio</h2>
              <p className="text-xs text-[#475569] dark:text-[#94A3B8] mt-1.5 leading-relaxed">
                Showcase work photos and hero images with single-action enhancement, honest file sizes, and review.
              </p>
            </div>
            <div className="mt-5 pt-3.5 border-t border-[#E3E7ED] dark:border-[#1E293B] flex items-center justify-between text-xs font-semibold text-[#7950B8] group-hover:translate-x-0.5 transition-transform">
              <span>Open Creative Studio</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </Card>
        </Link>

        {/* Card 4: Customer Leads */}
        <Link href="/admin/leads" className="block focus:outline-none group">
          <Card variant="premium" className="h-full flex flex-col justify-between p-5 border-white/60 dark:border-white/10">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-[6px] bg-gradient-to-br from-[#315FEA]/20 to-[#315FEA]/5 text-[#315FEA] border border-[#315FEA]/20 flex items-center justify-center font-bold shadow-soft-xs group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                {newLeadsCount !== null && newLeadsCount > 0 ? (
                  <Badge variant="success" size="xs" dot>
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
                Direct customer inquiries received from website contact forms and verified WhatsApp choices.
              </p>
            </div>
            <div className="mt-5 pt-3.5 border-t border-[#E3E7ED] dark:border-[#1E293B] flex items-center justify-between text-xs font-semibold text-[#315FEA] group-hover:translate-x-0.5 transition-transform">
              <span>Review Leads</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </Card>
        </Link>
      </div>

      {/* 4. Recent Customer Enquiries Snapshot (Linear Card Style) */}
      {recentLeads.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#315FEA]" />
              <h2 className="text-base font-bold text-[#172033] dark:text-white">
                Recent Customer Inquiries
              </h2>
            </div>
            <Link
              href="/admin/leads"
              className="text-xs font-semibold text-[#315FEA] hover:underline flex items-center gap-1"
            >
              <span>View all {newLeadsCount || ''} leads</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentLeads.map((lead: any) => (
              <div
                key={lead.id}
                className="p-4 rounded-[8px] bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-md border border-[#CBD5E1]/80 dark:border-[#1E293B] shadow-soft-xs hover:border-[#315FEA] transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-[4px] bg-[#315FEA]/10 text-[#315FEA] font-bold text-xs flex items-center justify-center shrink-0">
                        {lead.name ? lead.name.charAt(0).toUpperCase() : 'L'}
                      </div>
                      <span className="font-semibold text-xs text-[#172033] dark:text-white truncate">
                        {lead.name}
                      </span>
                    </div>
                    <Badge variant={lead.status === 'New' ? 'success' : 'neutral'} size="xs">
                      {lead.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#475569] dark:text-[#94A3B8] line-clamp-2 leading-relaxed">
                    {lead.message || 'Customer submitted project enquiry.'}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#64748B]">
                    {lead.phone}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {lead.phone && (
                      <a
                        href={`tel:${lead.phone}`}
                        className="p-1.5 rounded-[4px] bg-slate-100 hover:bg-[#315FEA]/10 text-[#475569] hover:text-[#315FEA] transition-colors"
                        title={`Call ${lead.phone}`}
                        aria-label={`Call ${lead.phone}`}
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {lead.phone && (
                      <a
                        href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-[4px] bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
                        title={`WhatsApp ${lead.phone}`}
                        aria-label={`WhatsApp ${lead.phone}`}
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Recommended Operational Next Steps */}
      <Card variant="default" className="border-white/60 dark:border-white/10">
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
                  Step 1: Confirm Business Context Facts
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
                  Upload genuine hero and showcase work photos with single-action enhancement in Image Studio.
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
