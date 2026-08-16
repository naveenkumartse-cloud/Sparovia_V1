'use client';

import React from 'react';
import Link from 'next/link';
import { useBusiness } from '@/components/admin/providers/BusinessProvider';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/admin/ui/Card';
import { Badge } from '@/components/admin/ui/Badge';
import { SetupChecklist, SetupStep } from '@/components/admin/ui/SetupChecklist';
import {
  Building2,
  Globe,
  Users,
  Image as ImageIcon,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

export default function DashboardPage() {
  const { activeBusiness } = useBusiness();

  if (!activeBusiness) return null;

  const setupSteps: SetupStep[] = [
    {
      id: 'biz-info',
      title: 'Business Information Profile',
      description: 'Define your business name, industry, description, and contact details.',
      isComplete: !!(activeBusiness.name && activeBusiness.industry && activeBusiness.description),
      actionHref: '/workspace/business',
      actionLabel: 'Edit Profile',
    },
    {
      id: 'website-setup',
      title: 'Website Foundation',
      description: 'Review and connect your premium website foundation.',
      isComplete: true, // Landing page foundation is already built
      actionHref: '/workspace/website',
      actionLabel: 'Manage Website',
    },
    {
      id: 'media-library',
      title: 'Media Library Setup',
      description: 'Upload high-resolution images of your portfolio, products, or showroom.',
      isComplete: false,
      actionHref: '/workspace/media',
      actionLabel: 'Upload Media',
    },
    {
      id: 'leads-setup',
      title: 'Lead Management System',
      description: 'Prepare your workspace for receiving customer lead inquiries.',
      isComplete: false,
      actionHref: '/workspace/leads',
      actionLabel: 'View Leads',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 text-white rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center space-x-2">
            <Badge variant="purple" className="bg-brand-500/20 text-brand-200 border-brand-400/30">
              Operating Workspace
            </Badge>
            <span className="text-xs text-slate-400 font-mono">ID: {activeBusiness.id.substring(0, 8)}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            {activeBusiness.name}
          </h2>
          <p className="text-sm text-slate-300 max-w-2xl">
            {activeBusiness.description ||
              `Welcome to your Sparovia Business Workspace. Manage your digital presence, website foundation, media, and customer leads.`}
          </p>
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
              <ShieldCheck className="w-5 h-5" />
            </div>
            <Badge variant="green">Active</Badge>
          </div>
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Business Status</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">Verified Tenant</p>
            <p className="text-xs text-slate-500 mt-1 capitalize">Industry: {activeBusiness.industry}</p>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <Badge variant="purple">Connected</Badge>
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
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <Badge variant="blue">Media Library</Badge>
          </div>
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Assets Foundation</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">Media Library</p>
            <Link href="/workspace/media" className="text-xs font-medium text-sky-600 hover:underline block mt-1">
              Manage Images →
            </Link>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <Badge variant="amber">Inbox Ready</Badge>
          </div>
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Lead Pipeline</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">Lead Management</p>
            <Link href="/workspace/leads" className="text-xs font-medium text-amber-600 hover:underline block mt-1">
              View Pipeline →
            </Link>
          </div>
        </Card>
      </div>

      {/* Main Content Layout: Setup Progress + Intelligence Foundation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Setup Completion Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <SetupChecklist steps={setupSteps} />
        </div>

        {/* Future Sparovia Intelligence Prepared Architecture (1 col) */}
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
