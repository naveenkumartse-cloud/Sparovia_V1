'use client';

import React from 'react';
import { useAuth } from '@/components/admin/providers/AuthProvider';
import { useBusiness } from '@/components/admin/providers/BusinessProvider';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/admin/ui/Card';
import { Badge } from '@/components/admin/ui/Badge';
import { Button } from '@/components/admin/ui/Button';
import { User as UserIcon, Building2, ShieldCheck, LogOut, Sparkles, MessageSquare, Bot, Cpu } from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { activeBusiness } = useBusiness();

  if (!user || !activeBusiness) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Workspace Settings</h2>
          <Badge variant="purple">Account & Preferences</Badge>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Manage your user account profile, tenant membership roles, and workspace preferences.
        </p>
      </div>

      {/* User Account Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <UserIcon className="w-4 h-4 text-brand-600" />
            <CardTitle>User Profile</CardTitle>
          </div>
          <CardDescription>Your personal account details as an authenticated Sparovia user.</CardDescription>
        </CardHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Full Name
            </span>
            <span className="font-semibold text-slate-900 block mt-1">
              {user.firstName} {user.lastName}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Email Address
            </span>
            <span className="font-semibold text-slate-900 block mt-1">
              {user.email}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              User ID
            </span>
            <span className="font-mono text-slate-900 font-medium block mt-1 text-xs truncate">
              {user.id}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Account Status
              </span>
              <span className="font-semibold text-emerald-700 block mt-0.5">
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <Badge variant="green">Verified</Badge>
          </div>
        </div>
      </Card>

      {/* Tenant Membership & Business Scope */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-brand-600" />
            <CardTitle>Business Membership & Tenant Context</CardTitle>
          </div>
          <CardDescription>Tenant context for the active business session.</CardDescription>
        </CardHeader>

        <div className="space-y-4 text-sm">
          <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-brand-400 font-semibold uppercase tracking-wider block">
                Active Tenant
              </span>
              <h4 className="text-lg font-bold text-white mt-0.5">{activeBusiness.name}</h4>
              <p className="text-xs text-slate-400 mt-0.5">Industry: {activeBusiness.industry}</p>
            </div>
            <div className="text-right">
              <Badge variant="purple" className="bg-brand-500/20 text-brand-200 border-brand-400/30">
                Owner Role
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Future Integrations Architecture Preview */}
      <Card className="border-dashed border-slate-300 bg-slate-50/50">
        <CardHeader>
          <div className="flex items-center space-x-2 text-slate-800">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <CardTitle>Future Integrations Architecture</CardTitle>
          </div>
          <CardDescription>
            Standing placeholders for future platform capability configurations.
          </CardDescription>
        </CardHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1">
            <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
              <Cpu className="w-3.5 h-3.5 text-brand-600" />
              <span>AI Provider Gateway</span>
            </div>
            <p className="text-slate-500 leading-tight">Bring-your-own-key or Sparovia allowance config.</p>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1">
            <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp Integration</span>
            </div>
            <p className="text-slate-500 leading-tight">Business API channel setup & messaging rules.</p>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1">
            <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
              <Bot className="w-3.5 h-3.5 text-sky-600" />
              <span>Sparovia Agents</span>
            </div>
            <p className="text-slate-500 leading-tight">Autonomous workflow agent permissions.</p>
          </div>
        </div>
      </Card>

      {/* Session Actions */}
      <div className="pt-2 flex justify-between items-center">
        <span className="text-xs text-slate-400">Signed in as {user.email}</span>
        <Button variant="danger" size="md" onClick={logout}>
          <LogOut className="w-4 h-4 mr-1.5" />
          Log Out of Sparovia
        </Button>
      </div>
    </div>
  );
}
