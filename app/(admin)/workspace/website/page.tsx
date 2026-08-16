'use client';

import React from 'react';
import Link from 'next/link';
import { useBusiness } from '@/components/admin/providers/BusinessProvider';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/admin/ui/Card';
import { Badge } from '@/components/admin/ui/Badge';
import { Globe, ArrowUpRight, CheckCircle2, Layers, Image as ImageIcon, Sparkles } from 'lucide-react';

export default function WebsitePage() {
  const { activeBusiness } = useBusiness();

  if (!activeBusiness) return null;

  const websiteSections = [
    { name: 'Cinematic Hero Showcase', type: 'Hero', status: 'Active', itemsCount: 3 },
    { name: 'Brand & Philosophy Intro', type: 'Brand', status: 'Active', itemsCount: 1 },
    { name: 'Interior Storytelling (Kitchens, Wardrobes, Living)', type: 'Categories', status: 'Active', itemsCount: 5 },
    { name: 'uPVC Window Engineering', type: 'Engineering', status: 'Active', itemsCount: 4 },
    { name: 'Craftsmanship & Materials', type: 'Craftsmanship', status: 'Active', itemsCount: 3 },
    { name: 'Project Gallery & Portfolio', type: 'Portfolio', status: 'Active', itemsCount: 5 },
    { name: 'Client Testimonials & FAQs', type: 'Social Proof', status: 'Active', itemsCount: 8 },
    { name: 'Contact & Lead Capture Form', type: 'Conversion', status: 'Active', itemsCount: 1 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Website Workspace</h2>
            <Badge variant="purple">Controlled Website</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage your high-performance business website foundation and content structure.
          </p>
        </div>

        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm self-start md:self-auto"
        >
          <span>Preview Live Website</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Website Status Overview Card */}
      <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-none shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-brand-500/20 text-brand-300 border border-brand-400/30 flex items-center justify-center">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold text-white">{activeBusiness.name} Website</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                  Live & Optimized
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Targeted experience: High-end Home Interiors & uPVC Glazing Architecture.
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-700/50 w-full sm:w-auto">
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Framework</p>
            <p className="text-xs font-mono text-white mt-0.5">Next.js 14 + Lenis + Framer Motion</p>
          </div>
        </div>
      </Card>

      {/* Section Structure Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Controlled Content Sections</CardTitle>
              <CardDescription>
                Structured website sections powering your client-facing digital presence.
              </CardDescription>
            </div>
            <span className="text-xs font-medium text-slate-500">8 Active Sections</span>
          </div>
        </CardHeader>

        <div className="divide-y divide-slate-100">
          {websiteSections.map((sec, idx) => (
            <div key={idx} className="py-3.5 flex items-center justify-between hover:bg-slate-50/50 px-2 rounded-lg transition-colors">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <div>
                  <span className="text-sm font-semibold text-slate-900">{sec.name}</span>
                  <span className="ml-2 text-xs text-slate-500">({sec.itemsCount} content items)</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge variant="slate">{sec.type}</Badge>
                <span className="text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {sec.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Future Content Management Architecture Note */}
      <Card className="border-dashed border-brand-200 bg-brand-50/30">
        <div className="flex items-start space-x-3">
          <Sparkles className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-brand-950">Future Content Management Architecture</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sparovia is not a generic drag-and-drop page builder. Future platform phases will allow structured content edits (text, headings, image assignments) directly powering this website structure while maintaining strict architectural performance and design integrity.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
