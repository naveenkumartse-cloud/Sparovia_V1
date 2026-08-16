'use client';

import React, { useState } from 'react';
import { useBusiness } from '@/components/admin/providers/BusinessProvider';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/admin/ui/Card';
import { Badge } from '@/components/admin/ui/Badge';
import { Button } from '@/components/admin/ui/Button';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { Users, Phone, Mail, Calendar, Sparkles, Plus, CheckCircle2, MessageSquare, Filter } from 'lucide-react';

export interface LeadItem {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  source: 'Website' | 'WhatsApp' | 'Google Business' | 'Manual';
  status: 'New' | 'Contacted' | 'Qualified' | 'Closed';
  notes?: string;
  createdAt: string;
}

export default function LeadsPage() {
  const { activeBusiness } = useBusiness();

  // Initial tenant-scoped leads pipeline
  const [leads, setLeads] = useState<LeadItem[]>([
    {
      id: 'ld_101',
      fullName: 'Vikram Sharma',
      email: 'vikram.sharma@example.com',
      phone: '+91 98765 43210',
      source: 'Website',
      status: 'New',
      notes: 'Interested in turnkey 4BHK interior design and modular kitchen layout.',
      createdAt: '2026-08-16',
    },
    {
      id: 'ld_102',
      fullName: 'Priya Nambiar',
      email: 'priya.nambiar@example.com',
      phone: '+91 91234 56789',
      source: 'Website',
      status: 'Contacted',
      notes: 'Requested site laser survey for uPVC acoustic windows replacement.',
      createdAt: '2026-08-15',
    },
  ]);

  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // New lead form state
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newNotes, setNewNotes] = useState('');

  if (!activeBusiness) return null;

  const statuses = ['All', 'New', 'Contacted', 'Qualified', 'Closed'];

  const filteredLeads = filterStatus === 'All'
    ? leads
    : leads.filter((l) => l.status === filterStatus);

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newPhone) return;

    const newLead: LeadItem = {
      id: `ld_${Date.now()}`,
      fullName: newFullName,
      email: newEmail || 'N/A',
      phone: newPhone,
      source: 'Manual',
      status: 'New',
      notes: newNotes,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setLeads((prev) => [newLead, ...prev]);
    setShowAddModal(false);
    setNewFullName('');
    setNewEmail('');
    setNewPhone('');
    setNewNotes('');
  };

  const getStatusBadgeVariant = (status: LeadItem['status']) => {
    switch (status) {
      case 'New': return 'purple';
      case 'Contacted': return 'blue';
      case 'Qualified': return 'green';
      case 'Closed': return 'slate';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Lead Management Pipeline</h2>
            <Badge variant="purple">Core Capability</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Capture, track, and manage client inquiries for <span className="font-semibold text-slate-800">{activeBusiness.name}</span>.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add Lead Manually
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-slate-400 mr-1 flex-shrink-0" />
        {statuses.map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterStatus === st
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Leads List */}
      {filteredLeads.length > 0 ? (
        <div className="space-y-4">
          {filteredLeads.map((lead) => (
            <Card key={lead.id} hover className="p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-base font-bold text-slate-900">{lead.fullName}</h3>
                    <Badge variant={getStatusBadgeVariant(lead.status)}>{lead.status}</Badge>
                    <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded">
                      {lead.source}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <span className="flex items-center space-x-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{lead.phone}</span>
                    </span>
                    {lead.email !== 'N/A' && (
                      <span className="flex items-center space-x-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{lead.email}</span>
                      </span>
                    )}
                    <span className="flex items-center space-x-1 text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Received {lead.createdAt}</span>
                    </span>
                  </div>

                  {lead.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2">
                      <span className="font-semibold text-slate-700">Inquiry Notes:</span> {lead.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2 self-end md:self-center flex-shrink-0">
                  <select
                    value={lead.status}
                    onChange={(e) => {
                      const updatedStatus = e.target.value as LeadItem['status'];
                      setLeads((prev) =>
                        prev.map((l) => (l.id === lead.id ? { ...l, status: updatedStatus } : l))
                      );
                    }}
                    className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-medium text-slate-700 focus-ring"
                  >
                    <option value="New">Status: New</option>
                    <option value="Contacted">Status: Contacted</option>
                    <option value="Qualified">Status: Qualified</option>
                    <option value="Closed">Status: Closed</option>
                  </select>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No Leads Found"
          description={`No leads currently match the status filter '${filterStatus}'.`}
          actionLabel="Add Lead Manually"
          onAction={() => setShowAddModal(true)}
        />
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add New Business Lead</h3>
            <form onSubmit={handleAddLead} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Rahul Verma"
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="rahul@example.com"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Inquiry Notes
                </label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Details about customer requirements..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus-ring"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Save Lead
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Future Channel Integration Architecture Note */}
      <Card className="border-dashed border-brand-200 bg-brand-50/30">
        <div className="flex items-start space-x-3">
          <Sparkles className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-brand-950">Future Multi-Channel Lead Architecture</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              In future platform phases, leads captured from Website forms, WhatsApp messages, and Google Business Profile inquiries will automatically aggregate into this Unified Lead Pipeline with automated follow-up suggestions powered by Sparovia Intelligence.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
