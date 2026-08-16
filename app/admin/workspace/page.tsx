'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useBusiness } from '@/components/admin/providers/BusinessProvider';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/admin/ui/Card';
import { Badge } from '@/components/admin/ui/Badge';
import { SetupChecklist, SetupStep } from '@/components/admin/ui/SetupChecklist';
import { apiClient } from '@/lib/api/client';
import {
  Building2,
  Globe,
  Users,
  Image as ImageIcon,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export default function DashboardPage() {
  const { activeBusiness } = useBusiness();
  const [mediaCount, setMediaCount] = useState<number | null>(null);
  const [leadsCount, setLeadsCount] = useState<number | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!activeBusiness) return;
      try {
        const [media, leads] = await Promise.all([
          apiClient.get<any[]>(`/api/businesses/${activeBusiness.id}/media`).catch(() => []),
          apiClient.get<any[]>(`/api/businesses/${activeBusiness.id}/leads`).catch(() => []),
        ]);
        setMediaCount(media.length);
        setLeadsCount(leads.length);
      } catch (e) {
        console.error("Failed to load dashboard stats", e);
      } finally {
        setIsLoadingStats(false);
      }
    }
    fetchStats();
  }, [activeBusiness]);

  if (!activeBusiness) return null;

  // Calculate real completeness
  const isProfileComplete = !!(activeBusiness.description && activeBusiness.contactEmail);
  const isGoogleConnected = activeBusiness.googleBusinessProfileStatus === 'Connected';
  const isMediaUploaded = mediaCount !== null && mediaCount > 0;
  
  let completenessScore = 0;
  if (isProfileComplete) completenessScore += 40;
  if (isMediaUploaded) completenessScore += 30;
  if (isGoogleConnected) completenessScore += 30;

  const setupSteps: SetupStep[] = [
    {
      id: 'biz-info',
      title: 'Business Information Profile',
      description: 'Define your business name, industry, description, and contact details.',
      isComplete: isProfileComplete,
      actionHref: '/workspace/business',
      actionLabel: 'Edit Profile',
    },
    {
      id: 'media-library',
      title: 'Media Library Setup',
      description: 'Upload high-resolution images of your portfolio, products, or showroom.',
      isComplete: isMediaUploaded,
      actionHref: '/workspace/media',
      actionLabel: 'Upload Media',
    },
    {
      id: 'google-business',
      title: 'Google Business Profile',
      description: 'Connect your Sparovia workspace to your official Google presence.',
      isComplete: isGoogleConnected,
      actionHref: '/workspace/presence',
      actionLabel: 'Check Presence',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 text-white rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center space-x-2">
            <Badge variant="purple" className="bg-brand-500/20 text-brand-200 border-brand-400/30">
              Operating Workspace
            </Badge>
            <span className="text-xs text-slate-400 font-mono">ID: {activeBusiness.id.substring(0, 8)}</span>
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
              {activeBusiness.name}
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl">
              {activeBusiness.description ||
                `Welcome to your Sparovia Business Workspace. Manage your digital presence, website foundation, media, and customer leads.`}
            </p>
          </div>
          
          {/* Completeness Bar */}
          <div className="pt-4 max-w-md">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-medium text-slate-300">Workspace Completeness</span>
              <span className="font-bold text-brand-300">{completenessScore}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-500 transition-all duration-1000 ease-out"
                style={{ width: `${completenessScore}%` }}
              />
            </div>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-8 translate-y-8">
          <Building2 className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* Quick Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hover>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <Badge variant="green">Online</Badge>
          </div>
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Website Status</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">Landing Active</p>
            <Link href="/" target="_blank" className="text-xs font-medium text-brand-600 hover:underline flex items-center mt-1">
              Preview Website <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            {isGoogleConnected ? (
              <Badge variant="green">Connected</Badge>
            ) : (
              <Badge variant="slate">Pending</Badge>
            )}
          </div>
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Google Presence</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {isGoogleConnected ? 'Verified' : 'Integration Required'}
            </p>
            <Link href="/admin/workspace/presence" className="text-xs font-medium text-brand-600 hover:underline block mt-1">
              Check Status →
            </Link>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <Badge variant="blue">{isLoadingStats ? '...' : `${mediaCount} Assets`}</Badge>
          </div>
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Media Library</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {isMediaUploaded ? 'Active' : 'Empty'}
            </p>
            <Link href="/admin/workspace/media" className="text-xs font-medium text-sky-600 hover:underline block mt-1">
              Manage Images →
            </Link>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <Badge variant="amber">{isLoadingStats ? '...' : `${leadsCount} Leads`}</Badge>
          </div>
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Lead Pipeline</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {leadsCount && leadsCount > 0 ? 'Active Inquiries' : 'Waiting for Leads'}
            </p>
            <Link href="/admin/workspace/leads" className="text-xs font-medium text-amber-600 hover:underline block mt-1">
              View Pipeline →
            </Link>
          </div>
        </Card>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SetupChecklist steps={setupSteps} />
        </div>

        <div className="space-y-4">
          <Card className="border-dashed border-brand-200 bg-gradient-to-b from-brand-50/40 to-white">
            <CardHeader className="border-brand-100">
              <div className="flex items-center space-x-2 text-brand-700">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <CardTitle className="text-brand-950 text-sm">Sparovia Intelligence</CardTitle>
              </div>
              <CardDescription className="text-xs text-brand-800/70">
                Architectural slot for future automated business recommendations.
              </CardDescription>
            </CardHeader>
            <div className="space-y-3 pt-1">
              <div className="p-3 bg-white border border-brand-100 rounded-lg text-xs text-slate-600 space-y-1">
                <span className="font-semibold text-slate-900 block">💡 Future Insight Slot</span>
                <p className="text-slate-500 leading-relaxed">
                  Once your business activity accumulates, Sparovia Intelligence will analyze lead inquiries, website engagement, and suggest optimization steps.
                </p>
              </div>
              <div className="p-3 bg-white border border-brand-100 rounded-lg text-xs text-slate-600 space-y-1">
                <span className="font-semibold text-slate-900 block">💬 Future Channel Slot</span>
                <p className="text-slate-500 leading-relaxed">
                  WhatsApp and Google Business integrations will connect directly into this workspace in future platform phases.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
