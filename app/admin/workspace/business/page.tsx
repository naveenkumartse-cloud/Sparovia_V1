'use client';

import React, { useState, useEffect } from 'react';
import { useBusiness } from '@/components/admin/providers/BusinessProvider';
import { updateBusiness } from '@/lib/api/business';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/admin/ui/Card';
import { Input } from '@/components/admin/ui/Input';
import { Button } from '@/components/admin/ui/Button';
import { Badge } from '@/components/admin/ui/Badge';
import { Building2, CheckCircle2, Shield, Calendar } from 'lucide-react';

export default function BusinessPage() {
  const { activeBusiness, reloadBusinesses } = useBusiness();

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeBusiness) {
      setName(activeBusiness.name || '');
      setIndustry(activeBusiness.industry || '');
      setDescription(activeBusiness.description || '');
    }
  }, [activeBusiness]);

  if (!activeBusiness) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      await updateBusiness(activeBusiness.id, {
        name,
        industry,
        description,
      });
      await reloadBusinesses();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Failed to update business details.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Business Profile & Understanding</h2>
          <Badge variant="purple">Tenant Foundation</Badge>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Define core business information that powers your website, media, lead management, and future Sparovia Intelligence.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>Business details updated successfully in PostgreSQL database.</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Core Business Details</CardTitle>
            <CardDescription>Primary identity details for your organization.</CardDescription>
          </CardHeader>

          <div className="space-y-4">
            <Input
              label="Business Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              helperText="The official name of your business."
            />

            <Input
              label="Industry / Field"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              required
              helperText="e.g. Home Interiors, Architecture, uPVC Windows"
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Business Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe your business services, products, expertise, and value proposition..."
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus-ring placeholder:text-slate-400"
              />
              <p className="text-xs text-slate-500 mt-1">
                This description will be used by Sparovia Intelligence to generate content and recommendations.
              </p>
            </div>
          </div>
        </Card>

        {/* Read-Only System Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>System & Tenant Properties</CardTitle>
            <CardDescription>System-managed properties set during business registration.</CardDescription>
          </CardHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Business Slug
              </span>
              <span className="font-mono text-slate-900 font-medium block mt-1">
                {activeBusiness.slug}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Business ID
              </span>
              <span className="font-mono text-slate-900 font-medium block mt-1 text-xs truncate">
                {activeBusiness.id}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center space-x-3">
              <Shield className="w-5 h-5 text-brand-600 flex-shrink-0" />
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Your Membership Role
                </span>
                <span className="font-medium text-slate-900 block mt-0.5">Owner</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-brand-600 flex-shrink-0" />
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Created Date
                </span>
                <span className="font-medium text-slate-900 block mt-0.5">
                  {new Date(activeBusiness.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button variant="primary" size="lg" isLoading={isSaving}>
            Save Business Profile
          </Button>
        </div>
      </form>
    </div>
  );
}
