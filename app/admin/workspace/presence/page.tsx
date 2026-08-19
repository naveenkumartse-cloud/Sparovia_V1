'use client';

import React from 'react';
import { useBusiness } from '@/components/admin/providers/BusinessProvider';
import { PageHeader } from '@/components/admin/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/admin/ui/Card';
import { Badge } from '@/components/admin/ui/Badge';
import { Button } from '@/components/admin/ui/Button';
import { Globe, Store, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PresencePage() {
  const { activeBusiness } = useBusiness();

  if (!activeBusiness) return null;

  const isGoogleConnected = activeBusiness.googleBusinessProfileStatus === 'Connected';

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Business Presence" 
        description="Manage where and how your business appears across the web, including your primary website and Google Business Profile."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1. Website Presence */}
        <Card>
          <div className="p-6 flex flex-col h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Sparovia Website</h3>
                  <p className="text-sm text-slate-500">Your primary digital storefront</p>
                </div>
              </div>
              <Badge variant="green">Online</Badge>
            </div>
            
            <div className="flex-1 space-y-4 py-4">
              <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Public URL:</span>
                  <Link href="/" target="_blank" className="text-brand-600 hover:underline">
                    View Website
                  </Link>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Status:</span>
                  <span className="flex items-center text-emerald-600">
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Active
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-500">
                Your website is live and ready to receive customer inquiries. Form submissions will automatically appear in your Leads pipeline.
              </p>
            </div>
            
            <div className="pt-4 border-t border-slate-100 mt-auto">
              <Link href="/admin/workspace/website" className="w-full">
                <Button variant="outline" className="w-full">
                  Manage Content
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* 2. Google Business Profile */}
        <Card>
          <div className="p-6 flex flex-col h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Google Business</h3>
                  <p className="text-sm text-slate-500">Search & Maps Presence</p>
                </div>
              </div>
              {isGoogleConnected ? (
                <Badge variant="green">Connected</Badge>
              ) : (
                <Badge variant="amber">Not Connected</Badge>
              )}
            </div>
            
            <div className="flex-1 space-y-4 py-4">
              {isGoogleConnected ? (
                <div className="bg-emerald-50 rounded-lg p-4 text-sm text-emerald-800">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Integration Status:</span>
                    <span className="flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Verified
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-amber-50 rounded-lg p-4 text-sm text-amber-800 border border-amber-200">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium block mb-1">Integration Required</span>
                        Google Business Profile API access has eligibility and project approval requirements. Since API credentials are not yet configured in this environment, automated connection is paused.
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600 font-medium">To establish your presence:</p>
                    <ol className="list-decimal pl-5 text-sm text-slate-500 space-y-2">
                      <li>Visit the official <a href="https://business.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Business Profile manager</a>.</li>
                      <li>Sign in with your Google account.</li>
                      <li>Claim your business or create a new listing.</li>
                      <li>Complete Google&apos;s verification process.</li>
                    </ol>
                  </div>
                </>
              )}
            </div>
            
            <div className="pt-4 border-t border-slate-100 mt-auto">
              {isGoogleConnected ? (
                <Button variant="outline" className="w-full">
                  Manage Settings
                </Button>
              ) : (
                <Button variant="primary" className="w-full" onClick={() => window.open('https://business.google.com', '_blank')}>
                  Start Google Setup <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}
