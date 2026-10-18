'use client';

import React, { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Phone,
  Mail,
  Clock,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  MessageCircle,
  Download,
  Copy,
  Check,
  LayoutGrid,
  List,
  X,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { FormField } from '@/components/ui/FormField';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/api/client';
import { cleanPhoneInput, isValidIndianPhone } from '@/lib/validation/authValidation';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  areaOfInterest?: string | null;
  areaOfInterestCategoryId?: string | null;
  source: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Closed' | string;
  sourceReference: string | null;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadFollowUp {
  id: string;
  leadId: string;
  followedUpAt: string;
  method: string;
  notes: string;
  nextAction?: string | null;
  nextFollowUpAt?: string | null;
  createdByUserId?: string | null;
  createdAt: string;
}

export interface TenantWorkCategory {
  id: string;
  name: string;
  slug: string;
}

interface LeadListResponse {
  items: Lead[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const STATUS_OPTIONS = ['All', 'New', 'Contacted', 'Qualified', 'Closed'] as const;
const SOURCE_OPTIONS = ['All', 'Website', 'WhatsApp', 'Manual'] as const;
const PAGE_SIZE_OPTIONS = [12, 24, 36, 48] as const;

function CustomerLeadsContent() {
  // Query parameters state
  const [leadsPage, setLeadsPage] = useState(1);
  const [leadsPageSize, setLeadsPageSize] = useState<number>(12);
  const [leadsSearch, setLeadsSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<string>('newest');

  // Presentation Mode: Card-first as primary presentation
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Leads Data state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsTotalCount, setLeadsTotalCount] = useState(0);
  const [leadsTotalPages, setLeadsTotalPages] = useState(1);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [leadsError, setLeadsError] = useState<string | null>(null);

  // Tenant Work Categories
  const [tenantCategories, setTenantCategories] = useState<TenantWorkCategory[]>([]);

  // Selected Lead for detail view
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);

  // Follow-ups state for selected lead
  const [followUps, setFollowUps] = useState<LeadFollowUp[]>([]);
  const [followUpsLoading, setFollowUpsLoading] = useState(false);
  const [followUpsError, setFollowUpsError] = useState<string | null>(null);

  // Follow-up form state
  const [isRecordingFollowUp, setIsRecordingFollowUp] = useState(false);
  const [followUpForm, setFollowUpForm] = useState({
    followedUpAt: '',
    method: 'Call',
    notes: '',
    nextAction: '',
    nextFollowUpAt: '',
  });
  const [followUpSubmitError, setFollowUpSubmitError] = useState<string | null>(null);
  const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);

  // Copied feedback state
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  // Manual Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddingLead, setIsAddingLead] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
    areaOfInterest: '',
    areaOfInterestCategoryId: '',
    source: 'Manual',
    status: 'New',
  });
  const [addError, setAddError] = useState<string | null>(null);

  // Manual Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditingLead, setIsEditingLead] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
    areaOfInterest: '',
    areaOfInterestCategoryId: '',
    status: 'New',
  });
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Confirmation Modal State
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLeadsLoading(true);
    setLeadsError(null);
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('page', leadsPage.toString());
      queryParams.set('pageSize', leadsPageSize.toString());

      if (leadsSearch.trim()) {
        queryParams.set('search', leadsSearch.trim());
      }
      if (statusFilter !== 'All') {
        queryParams.set('status', statusFilter);
      }
      if (sourceFilter !== 'All') {
        queryParams.set('source', sourceFilter);
      }
      if (sortOrder) {
        queryParams.set('sort', sortOrder);
      }

      const res = await apiClient.get<LeadListResponse>(`/leads?${queryParams.toString()}`);
      setLeads(res.items || []);
      setLeadsTotalCount(res.totalCount || 0);
      setLeadsTotalPages(res.totalPages || 1);
    } catch (err: any) {
      setLeadsError(err.message || 'Failed to load customer enquiries. Please try again.');
    } finally {
      setLeadsLoading(false);
    }
  }, [leadsPage, leadsPageSize, leadsSearch, statusFilter, sourceFilter, sortOrder]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res: any = await apiClient.get('/website/categories');
        const list = Array.isArray(res) ? res : (res?.data || []);
        setTenantCategories(list);
      } catch (err) {
        console.error('Failed to load categories for leads:', err);
      }
    };
    fetchCategories();
  }, []);

  const fetchFollowUps = useCallback(async (leadId: string) => {
    setFollowUpsLoading(true);
    setFollowUpsError(null);
    try {
      const data = await apiClient.fetch<LeadFollowUp[]>(`/leads/${leadId}/follow-ups`);
      setFollowUps(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setFollowUpsError(err.message || 'Failed to load follow-up history.');
      setFollowUps([]);
    } finally {
      setFollowUpsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedLead?.id) {
      fetchFollowUps(selectedLead.id);
      const now = new Date();
      const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setFollowUpForm({
        followedUpAt: localIso,
        method: 'Call',
        notes: '',
        nextAction: '',
        nextFollowUpAt: '',
      });
      setFollowUpSubmitError(null);
      setIsRecordingFollowUp(false);
    } else {
      setFollowUps([]);
      setFollowUpsError(null);
    }
  }, [selectedLead?.id, fetchFollowUps]);

  const handleRecordFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || isSubmittingFollowUp) return;

    const trimmedNotes = followUpForm.notes.trim();
    if (!trimmedNotes) {
      setFollowUpSubmitError('Please enter conversation notes.');
      return;
    }
    if (trimmedNotes.length > 4000) {
      setFollowUpSubmitError('Notes must not exceed 4000 characters.');
      return;
    }

    setIsSubmittingFollowUp(true);
    setFollowUpSubmitError(null);

    try {
      const payload = {
        followedUpAt: followUpForm.followedUpAt ? new Date(followUpForm.followedUpAt).toISOString() : new Date().toISOString(),
        method: followUpForm.method,
        notes: trimmedNotes,
        nextAction: followUpForm.nextAction.trim() || null,
        nextFollowUpAt: followUpForm.nextFollowUpAt ? new Date(followUpForm.nextFollowUpAt).toISOString() : null,
      };

      const created = await apiClient.fetch<LeadFollowUp>(`/leads/${selectedLead.id}/follow-ups`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setFollowUps((prev) => [created, ...prev]);
      toast.success('Follow-up recorded successfully.');

      const now = new Date();
      const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setFollowUpForm({
        followedUpAt: localIso,
        method: 'Call',
        notes: '',
        nextAction: '',
        nextFollowUpAt: '',
      });
      setIsRecordingFollowUp(false);
    } catch (err: any) {
      setFollowUpSubmitError(err.message || 'Failed to record follow-up.');
    } finally {
      setIsSubmittingFollowUp(false);
    }
  };

  // Compute status summary counts from current loaded items
  const statusCounts = useMemo(() => {
    const counts = {
      all: leadsTotalCount,
      new: 0,
      contacted: 0,
      qualified: 0,
      closed: 0,
    };
    leads.forEach((l) => {
      const s = l.status?.toLowerCase();
      if (s === 'new') counts.new++;
      else if (s === 'contacted') counts.contacted++;
      else if (s === 'qualified') counts.qualified++;
      else if (s === 'closed') counts.closed++;
    });
    return counts;
  }, [leads, leadsTotalCount]);

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    if (isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    setStatusUpdateError(null);

    try {
      const updated = await apiClient.fetch<Lead>(`/leads/${leadId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });

      setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead(updated);
      }

      toast.success(`Lead status updated to ${newStatus}.`);
    } catch (err: any) {
      const msg = err.message || 'Failed to update status. Please try again.';
      setStatusUpdateError(msg);
      toast.error(msg);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingLead) return;
    setIsAddingLead(true);
    setAddError(null);

    try {
      const cleanDigits = cleanPhoneInput(addForm.phone);
      if (!addForm.name.trim() || !cleanDigits || !addForm.message.trim()) {
        throw new Error('Name, Phone, and Message are required.');
      }
      if (!isValidIndianPhone(cleanDigits)) {
        throw new Error('Enter a valid 10-digit mobile number.');
      }

      await apiClient.post<Lead>('/leads', {
        name: addForm.name.trim(),
        phone: `+91${cleanDigits}`,
        email: addForm.email.trim() || null,
        message: addForm.message.trim(),
        areaOfInterest: addForm.areaOfInterest.trim() || null,
        areaOfInterestCategoryId: addForm.areaOfInterestCategoryId.trim() || null,
        source: addForm.source,
        status: addForm.status,
      });

      setIsAddModalOpen(false);
      setAddForm({
        name: '',
        phone: '',
        email: '',
        message: '',
        areaOfInterest: '',
        areaOfInterestCategoryId: '',
        source: 'Manual',
        status: 'New',
      });
      toast.success('Customer lead created successfully.');
      fetchLeads();
    } catch (err: any) {
      setAddError(err.message || 'Failed to create lead.');
    } finally {
      setIsAddingLead(false);
    }
  };

  const openEditModal = (lead: Lead) => {
    setEditForm({
      name: lead.name,
      phone: cleanPhoneInput(lead.phone),
      email: lead.email || '',
      message: lead.message,
      areaOfInterest: lead.areaOfInterest || '',
      areaOfInterestCategoryId: lead.areaOfInterestCategoryId || '',
      status: lead.status,
    });
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || isEditingLead) return;
    setIsEditingLead(true);
    setEditError(null);

    try {
      const cleanDigits = cleanPhoneInput(editForm.phone);
      if (!editForm.name.trim() || !cleanDigits || !editForm.message.trim()) {
        throw new Error('Name, Phone, and Message are required.');
      }
      if (!isValidIndianPhone(cleanDigits)) {
        throw new Error('Enter a valid 10-digit mobile number.');
      }

      const updated = await apiClient.put<Lead>(`/leads/${selectedLead.id}`, {
        name: editForm.name.trim(),
        phone: `+91${cleanDigits}`,
        email: editForm.email.trim() || null,
        message: editForm.message.trim(),
        areaOfInterest: editForm.areaOfInterest.trim() || null,
        areaOfInterestCategoryId: editForm.areaOfInterestCategoryId.trim() || null,
        status: editForm.status,
      });

      setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? updated : l)));
      setSelectedLead(updated);
      setIsEditModalOpen(false);
      toast.success('Customer lead updated successfully.');
    } catch (err: any) {
      setEditError(err.message || 'Failed to update lead.');
    } finally {
      setIsEditingLead(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!leadToDelete || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await apiClient.delete(`/leads/${leadToDelete.id}`);
      setLeads((prev) => prev.filter((l) => l.id !== leadToDelete.id));
      if (selectedLead && selectedLead.id === leadToDelete.id) {
        setSelectedLead(null);
      }
      setLeadToDelete(null);
      toast.success('Customer lead deleted successfully.');
      fetchLeads();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete lead.');
      toast.error(err.message || 'Failed to delete lead.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyPhone = (id: string, phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedPhoneId(id);
    toast.success('Phone number copied to clipboard.');
    setTimeout(() => {
      setCopiedPhoneId(null);
    }, 2000);
  };

  const handleExportCsv = () => {
    if (leads.length === 0) {
      toast.error('No leads available to export.');
      return;
    }

    const headers = ['ID', 'Name', 'Phone', 'Email', 'Status', 'Source', 'Area of Interest', 'Submitted At', 'Message'];
    const rows = leads.map((l) => [
      l.id,
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.phone}"`,
      `"${l.email || ''}"`,
      `"${l.status}"`,
      `"${l.source}"`,
      `"${l.areaOfInterest || ''}"`,
      `"${l.submittedAt}"`,
      `"${(l.message || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sparovia-leads-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Leads exported successfully.');
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const now = new Date();
      const past = new Date(dateStr);
      const diffMs = now.getTime() - past.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return past.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'L';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New':
        return (
          <Badge variant="success" size="sm" dot>
            New
          </Badge>
        );
      case 'Contacted':
        return (
          <Badge variant="brand" size="sm" dot>
            Contacted
          </Badge>
        );
      case 'Qualified':
        return (
          <Badge variant="purple" size="sm" dot>
            Qualified
          </Badge>
        );
      case 'Closed':
        return (
          <Badge variant="neutral" size="sm" dot>
            Closed
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" size="sm">
            {status}
          </Badge>
        );
    }
  };

  const getSourceBadge = (source?: string) => {
    const s = source?.toLowerCase() || '';
    if (s === 'whatsapp') {
      return (
        <Badge variant="whatsapp" size="xs">
          <MessageCircle className="w-3 h-3 text-[#25D366] mr-1" />
          WhatsApp
        </Badge>
      );
    }
    if (s === 'manual') {
      return (
        <Badge variant="purple" size="xs">
          Manual
        </Badge>
      );
    }
    return (
      <Badge variant="neutral" size="xs">
        Website
      </Badge>
    );
  };

  const getFollowUpMethodBadge = (method?: string) => {
    switch (method) {
      case 'Call':
        return (
          <Badge variant="success" size="xs">
            <Phone className="w-3 h-3 mr-1" />
            Call
          </Badge>
        );
      case 'WhatsApp':
        return (
          <Badge variant="whatsapp" size="xs">
            <MessageCircle className="w-3 h-3 mr-1 text-[#25D366]" />
            WhatsApp
          </Badge>
        );
      case 'Email':
        return (
          <Badge variant="cobalt" size="xs">
            <Mail className="w-3 h-3 mr-1" />
            Email
          </Badge>
        );
      case 'Meeting':
        return (
          <Badge variant="purple" size="xs">
            <Users className="w-3 h-3 mr-1" />
            Meeting
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" size="xs">
            <MessageSquare className="w-3 h-3 mr-1" />
            {method || 'Other'}
          </Badge>
        );
    }
  };

  const hasActiveFilters = Boolean(
    leadsSearch.trim() || statusFilter !== 'All' || sourceFilter !== 'All'
  );

  const resetAllFilters = () => {
    setLeadsSearch('');
    setStatusFilter('All');
    setSourceFilter('All');
    setSortOrder('newest');
    setLeadsPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* 1. Header & Primary Workspace Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#172033] dark:text-white tracking-tight">
              Customer Leads
            </h1>
            <Badge variant="brand" size="sm">
              {leadsTotalCount} Total
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8] mt-1">
            Review, qualify, and action customer enquiries captured through your website and verified channels.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle: Cards (Primary) vs Table */}
          <div className="flex items-center bg-[#F3F6FA] dark:bg-[#1E293B] p-0.5 rounded-[6px] border border-[#E3E7ED] dark:border-[#334155]">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-[4px] text-xs font-medium transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-[#0F172A] text-[#172033] dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Card view (primary)"
              aria-label="Card view (primary)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-[4px] text-xs font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-[#0F172A] text-[#172033] dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Table view"
              aria-label="Table view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={leads.length === 0}
            leftIcon={<Download className="w-3.5 h-3.5 text-slate-500" />}
            className="rounded-[6px]"
          >
            Export
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchLeads}
            disabled={leadsLoading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${leadsLoading ? 'animate-spin' : ''}`} />}
            className="rounded-[6px]"
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="rounded-[6px]"
          >
            Add Lead
          </Button>
        </div>
      </div>

      {/* 2. Interactive Status Metric Filter Pills (Wrapping without horizontal scrollbar) */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 py-0.5">
        <button
          type="button"
          onClick={() => {
            setStatusFilter('All');
            setLeadsPage(1);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-all select-none active:scale-[0.99] motion-reduce:transition-none ${
            statusFilter === 'All'
              ? 'bg-[#315FEA] text-white shadow-xs'
              : 'bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] text-slate-700 dark:text-slate-300 hover:border-[#315FEA]'
          }`}
        >
          <span>All Enquiries</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              statusFilter === 'All'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-slate-300'
            }`}
          >
            {leadsTotalCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('New');
            setLeadsPage(1);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-all select-none active:scale-[0.99] motion-reduce:transition-none ${
            statusFilter === 'New'
              ? 'bg-[#15803D] text-white shadow-xs'
              : 'bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] text-slate-700 dark:text-slate-300 hover:border-[#15803D]'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#15803D] dark:bg-emerald-400" />
          <span>New</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              statusFilter === 'New'
                ? 'bg-white/20 text-white'
                : 'bg-[#15803D]/10 text-[#15803D] dark:text-emerald-400'
            }`}
          >
            {statusCounts.new}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('Contacted');
            setLeadsPage(1);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-all select-none active:scale-[0.99] motion-reduce:transition-none ${
            statusFilter === 'Contacted'
              ? 'bg-[#315FEA] text-white shadow-xs'
              : 'bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] text-slate-700 dark:text-slate-300 hover:border-[#315FEA]'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#315FEA]" />
          <span>Contacted</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              statusFilter === 'Contacted'
                ? 'bg-white/20 text-white'
                : 'bg-[#315FEA]/10 text-[#315FEA] dark:text-blue-400'
            }`}
          >
            {statusCounts.contacted}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('Qualified');
            setLeadsPage(1);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-all select-none active:scale-[0.99] motion-reduce:transition-none ${
            statusFilter === 'Qualified'
              ? 'bg-[#7950B8] text-white shadow-xs'
              : 'bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] text-slate-700 dark:text-slate-300 hover:border-[#7950B8]'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#7950B8]" />
          <span>Qualified</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              statusFilter === 'Qualified'
                ? 'bg-white/20 text-white'
                : 'bg-[#7950B8]/10 text-[#7950B8] dark:text-purple-300'
            }`}
          >
            {statusCounts.qualified}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('Closed');
            setLeadsPage(1);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-all select-none active:scale-[0.99] motion-reduce:transition-none ${
            statusFilter === 'Closed'
              ? 'bg-slate-700 text-white shadow-xs'
              : 'bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] text-slate-700 dark:text-slate-300 hover:border-slate-400'
          }`}
        >
          <span>Closed</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              statusFilter === 'Closed'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-slate-300'
            }`}
          >
            {statusCounts.closed}
          </span>
        </button>
      </div>

      {/* 3. Filter, Search, and Sort Toolbar */}
      <div className="bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] rounded-[8px] p-3 sm:p-3.5 shadow-soft-sm space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center">
          {/* Search Input */}
          <div className="relative sm:col-span-2 lg:col-span-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={leadsSearch}
              onChange={(e) => {
                setLeadsSearch(e.target.value);
                setLeadsPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-[6px] bg-[#F3F6FA] dark:bg-[#1E293B]/50 border border-[#E3E7ED] dark:border-[#1E293B] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#315FEA] focus:border-[#315FEA] transition-colors"
            />
            {leadsSearch && (
              <button
                type="button"
                onClick={() => {
                  setLeadsSearch('');
                  setLeadsPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Source Filter */}
          <div className="lg:col-span-3 flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium shrink-0">Source:</span>
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setLeadsPage(1);
              }}
              className="w-full py-2 px-2.5 text-xs rounded-[6px] bg-[#F3F6FA] dark:bg-[#1E293B]/50 border border-[#E3E7ED] dark:border-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#315FEA] focus:border-[#315FEA]"
            >
              {SOURCE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div className="lg:col-span-3 flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium shrink-0">Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                setLeadsPage(1);
              }}
              className="w-full py-2 px-2.5 text-xs rounded-[6px] bg-[#F3F6FA] dark:bg-[#1E293B]/50 border border-[#E3E7ED] dark:border-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#315FEA] focus:border-[#315FEA]"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="updated">Recently updated</option>
              <option value="name">Customer name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Active Filter Tags */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Active Filters:</span>
            {leadsSearch && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Search: &quot;{leadsSearch}&quot;
                <button
                  type="button"
                  onClick={() => setLeadsSearch('')}
                  aria-label="Remove search filter"
                  className="hover:text-slate-900 dark:hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {statusFilter !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Status: {statusFilter}
                <button
                  type="button"
                  onClick={() => setStatusFilter('All')}
                  aria-label="Remove status filter"
                  className="hover:text-slate-900 dark:hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {sourceFilter !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Source: {sourceFilter}
                <button
                  type="button"
                  onClick={() => setSourceFilter('All')}
                  aria-label="Remove source filter"
                  className="hover:text-slate-900 dark:hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-[#315FEA] hover:underline font-semibold ml-auto text-xs"
            >
              Reset all
            </button>
          </div>
        )}
      </div>

      {/* 4. Leads Main Content Area */}
      {leadsError ? (
        <ErrorState
          title="Could not load customer leads"
          error={leadsError}
          onRetry={fetchLeads}
        />
      ) : leadsLoading && leads.length === 0 ? (
        <div className="bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] rounded-[8px] p-12 text-center shadow-soft-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[6px] bg-slate-100 dark:bg-[#1E293B] text-slate-400 mb-4 animate-pulse">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Loading customer leads...
          </p>
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] rounded-[8px] p-8 sm:p-12 shadow-soft-sm">
          <EmptyState
            icon={<Users className="w-8 h-8 text-slate-400" />}
            title={hasActiveFilters ? 'No matching enquiries found' : 'No customer leads yet'}
            description={
              hasActiveFilters
                ? 'No leads matched your filter criteria. Try clearing search keywords or resetting filters.'
                : 'When prospective clients submit enquiries through your website contact forms or verified channels, they will be cataloged here.'
            }
          />
          {hasActiveFilters ? (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={resetAllFilters}
                className="rounded-[6px]"
              >
                Clear All Filters
              </Button>
            </div>
          ) : (
            <div className="mt-4 text-center">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-[6px]"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Lead Manually</span>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* PRIMARY PRESENTATION: APPROVED CARD-FIRST SAAS EXPERIENCE */}
          {viewMode === 'cards' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {leads.map((lead) => (
                  <Card
                    key={lead.id}
                    variant="interactive"
                    onClick={() => setSelectedLead(lead)}
                    className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-3.5 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 transition-all duration-150"
                  >
                    <div className="space-y-3">
                      {/* Top Row: Customer Initials Avatar, Name, Relative Timestamp & Status Badge */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-[6px] bg-[#315FEA]/10 text-[#315FEA] font-bold text-xs flex items-center justify-center shrink-0 border border-[#315FEA]/20">
                            {getInitials(lead.name)}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base truncate leading-snug">
                              {lead.name}
                            </h3>
                            <div className="flex items-center gap-1 text-[11px] text-[#475569] dark:text-[#94A3B8] mt-0.5">
                              <Clock className="w-3 h-3 shrink-0" />
                              <span title={formatDate(lead.submittedAt)}>
                                {formatRelativeTime(lead.submittedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0">{getStatusBadge(lead.status)}</div>
                      </div>

                      {/* Contact Info: Phone with Copy Button & Optional Email */}
                      <div
                        className="space-y-1 text-xs text-slate-700 dark:text-slate-300 pt-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-medium min-w-0">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <a
                              href={`tel:${lead.phone}`}
                              className="hover:text-[#315FEA] hover:underline truncate"
                              title={`Call ${lead.phone}`}
                            >
                              {lead.phone}
                            </a>
                            <button
                              type="button"
                              onClick={(e) => handleCopyPhone(lead.id, lead.phone, e)}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0"
                              title="Copy phone"
                              aria-label={`Copy phone for ${lead.name}`}
                            >
                              {copiedPhoneId === lead.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {lead.email && (
                          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <a
                              href={`mailto:${lead.email}`}
                              className="truncate hover:text-[#315FEA] hover:underline text-[11px]"
                              title={`Email ${lead.email}`}
                            >
                              {lead.email}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Badges: Source Channel & Area of Interest */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {getSourceBadge(lead.source)}
                        {lead.areaOfInterest && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-medium bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            {lead.areaOfInterest}
                          </span>
                        )}
                      </div>

                      {/* Enquiry Message Preview */}
                      {lead.message && (
                        <div className="p-2.5 rounded-[6px] bg-[#F3F6FA] dark:bg-[#1E293B]/40 border border-[#E3E7ED]/70 dark:border-[#1E293B] text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {lead.message}
                        </div>
                      )}
                    </div>

                    {/* Card Action Footer: Quick communication on left, admin actions on right */}
                    <div
                      className="pt-3 border-t border-[#E3E7ED] dark:border-[#1E293B] flex items-center justify-between gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Left: Communication links */}
                      <div className="flex items-center gap-1.5">
                        {lead.phone && (
                          <a
                            href={`tel:${lead.phone}`}
                            className="h-8 px-2.5 inline-flex items-center gap-1.5 rounded-[6px] text-xs font-semibold bg-[#15803D]/10 hover:bg-[#15803D]/20 text-[#15803D] dark:text-emerald-400 transition-colors"
                            title={`Call ${lead.name}`}
                            aria-label={`Call ${lead.name}`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call</span>
                          </a>
                        )}
                        {lead.phone && (
                          <a
                            href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-8 px-2.5 inline-flex items-center gap-1.5 rounded-[6px] text-xs font-semibold bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] dark:text-[#25D366] transition-colors"
                            title={`WhatsApp ${lead.name}`}
                            aria-label={`WhatsApp ${lead.name}`}
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>

                      {/* Right: Management actions */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedLead(lead)}
                          className="h-8 px-2.5 inline-flex items-center rounded-[6px] text-xs font-medium text-[#315FEA] hover:bg-[#315FEA]/10 transition-colors"
                          title="View lead details"
                          aria-label={`View details for ${lead.name}`}
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLead(lead);
                            openEditModal(lead);
                          }}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-[6px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit lead"
                          aria-label={`Edit ${lead.name}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setLeadToDelete(lead)}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-[6px] text-slate-400 hover:text-[#B91C1C] hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Delete lead"
                          aria-label={`Delete ${lead.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Cards Pagination */}
              <div className="p-3.5 bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] rounded-[8px] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-soft-sm">
                <div className="flex items-center gap-3 text-slate-500">
                  <span>
                    Showing <strong className="text-slate-700 dark:text-slate-300">{leads.length}</strong> of{' '}
                    <strong className="text-slate-700 dark:text-slate-300">{leadsTotalCount}</strong> total
                  </span>
                  <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 dark:border-slate-700 pl-3">
                    <span>Page size:</span>
                    <select
                      value={leadsPageSize}
                      onChange={(e) => {
                        setLeadsPageSize(Number(e.target.value));
                        setLeadsPage(1);
                      }}
                      className="py-1 px-1.5 rounded-[4px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-xs font-semibold"
                    >
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLeadsPage((p) => Math.max(1, p - 1))}
                    disabled={leadsPage <= 1 || leadsLoading}
                    className="flex items-center gap-1 text-xs rounded-[6px]"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </Button>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 px-2">
                    Page {leadsPage} of {leadsTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLeadsPage((p) => Math.min(leadsTotalPages, p + 1))}
                    disabled={leadsPage >= leadsTotalPages || leadsLoading}
                    className="flex items-center gap-1 text-xs rounded-[6px]"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* SECONDARY VIEW: COMPACT DESKTOP TABLE VIEW */}
          {viewMode === 'table' && (
            <div className="bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] rounded-[8px] shadow-soft-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#F3F6FA] dark:bg-[#1E293B]/40 border-b border-[#E3E7ED] dark:border-[#1E293B] text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                    <tr>
                      <th scope="col" className="px-4 py-3">Customer</th>
                      <th scope="col" className="px-4 py-3">Contact Details</th>
                      <th scope="col" className="px-3 py-3">Area of Interest</th>
                      <th scope="col" className="px-3 py-3">Source</th>
                      <th scope="col" className="px-3 py-3">Status</th>
                      <th scope="col" className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B]">
                    {leads.map((lead) => (
                      <tr
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className="hover:bg-slate-50/80 dark:hover:bg-[#1E293B]/30 cursor-pointer transition-colors group"
                      >
                        {/* Customer */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-[6px] bg-[#315FEA]/10 text-[#315FEA] font-bold text-xs flex items-center justify-center shrink-0">
                              {getInitials(lead.name)}
                            </div>
                            <div className="min-w-0 max-w-xs">
                              <div className="flex items-center gap-1.5">
                                <p className="font-semibold text-slate-900 dark:text-white truncate">
                                  {lead.name}
                                </p>
                                <span className="text-[11px] text-slate-400 shrink-0" title={formatDate(lead.submittedAt)}>
                                  • {formatRelativeTime(lead.submittedAt)}
                                </span>
                              </div>
                              {lead.message && (
                                <p className="text-xs text-slate-400 font-normal truncate mt-0.5">
                                  {lead.message}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Contact Details */}
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5 font-medium">
                            <span className="truncate">{lead.phone}</span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyPhone(lead.id, lead.phone, e)}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                              title="Copy phone"
                              aria-label={`Copy phone number for ${lead.name}`}
                            >
                              {copiedPhoneId === lead.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          {lead.email && (
                            <p className="text-xs text-slate-400 truncate max-w-[180px] mt-0.5">
                              {lead.email}
                            </p>
                          )}
                        </td>

                        {/* Area of Interest */}
                        <td className="px-3 py-3">
                          {lead.areaOfInterest ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-medium bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              {lead.areaOfInterest}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>

                        {/* Source */}
                        <td className="px-3 py-3">{getSourceBadge(lead.source)}</td>

                        {/* Status */}
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(lead.status)}
                            <select
                              value={lead.status}
                              onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                              disabled={isUpdatingStatus}
                              className="py-0.5 px-1.5 text-xs rounded-[4px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-[#315FEA] opacity-70 group-hover:opacity-100 transition-opacity"
                              aria-label={`Update status for ${lead.name}`}
                            >
                              <option value="New">New</option>
                              <option value="Contacted">Contacted</option>
                              <option value="Qualified">Qualified</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-1">
                            {lead.phone && (
                              <a
                                href={`tel:${lead.phone}`}
                                className="p-1.5 rounded-[4px] text-[#15803D] hover:bg-[#15803D]/10 transition-colors"
                                title={`Call ${lead.name}`}
                                aria-label={`Call ${lead.name}`}
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {lead.phone && (
                              <a
                                href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-[4px] text-[#25D366] hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                                title={`WhatsApp ${lead.name}`}
                                aria-label={`WhatsApp ${lead.name}`}
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLead(lead);
                                openEditModal(lead);
                              }}
                              title="Edit lead"
                              aria-label={`Edit ${lead.name}`}
                              className="p-1.5 rounded-[4px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setLeadToDelete(lead)}
                              title="Delete lead"
                              aria-label={`Delete ${lead.name}`}
                              className="p-1.5 rounded-[4px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination */}
              <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#0B1120]/50 text-xs">
                <div className="flex items-center gap-3 text-slate-500">
                  <span>
                    Showing <strong className="text-slate-700 dark:text-slate-300">{leads.length}</strong> of{' '}
                    <strong className="text-slate-700 dark:text-slate-300">{leadsTotalCount}</strong> total
                  </span>
                  <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 dark:border-slate-700 pl-3">
                    <span>Page size:</span>
                    <select
                      value={leadsPageSize}
                      onChange={(e) => {
                        setLeadsPageSize(Number(e.target.value));
                        setLeadsPage(1);
                      }}
                      className="py-1 px-1.5 rounded-[4px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-xs font-semibold"
                    >
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLeadsPage((p) => Math.max(1, p - 1))}
                    disabled={leadsPage <= 1 || leadsLoading}
                    className="flex items-center gap-1 text-xs rounded-[6px]"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </Button>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 px-2">
                    Page {leadsPage} of {leadsTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLeadsPage((p) => Math.min(leadsTotalPages, p + 1))}
                    disabled={leadsPage >= leadsTotalPages || leadsLoading}
                    className="flex items-center gap-1 text-xs rounded-[6px]"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 5. Lead Detail Inspection Modal (Structured cleanly without nested card boxes) */}
      <Modal
        isOpen={!!selectedLead && !isEditModalOpen && !leadToDelete}
        onClose={() => {
          setSelectedLead(null);
          setStatusUpdateError(null);
        }}
        title="Lead Inspection & Follow-up"
        description="Review customer inquiry details and update status in the conversion pipeline."
        maxWidth="xl"
        footer={
          selectedLead && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
              {/* Direct Communication Actions */}
              <div className="flex flex-wrap items-center gap-2">
                {selectedLead.phone && (
                  <a
                    href={`tel:${selectedLead.phone}`}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[6px] bg-[#15803D] hover:bg-[#15803D]/90 text-white transition-colors active:scale-[0.99] motion-reduce:transition-none"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Customer</span>
                  </a>
                )}
                {selectedLead.phone && (
                  <a
                    href={`https://wa.me/${selectedLead.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[6px] bg-[#25D366] hover:bg-[#20ba59] text-white transition-colors active:scale-[0.99] motion-reduce:transition-none"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}
                {selectedLead.email && (
                  <a
                    href={`mailto:${selectedLead.email}`}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[6px] bg-[#315FEA] hover:bg-[#254EDB] text-white transition-colors active:scale-[0.99] motion-reduce:transition-none"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email</span>
                  </a>
                )}
              </div>

              {/* Management Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(selectedLead)}
                  leftIcon={<Pencil className="w-3.5 h-3.5" />}
                  className="rounded-[6px]"
                >
                  Edit
                </Button>
                <Button
                  variant="destructive-outline"
                  size="sm"
                  onClick={() => setLeadToDelete(selectedLead)}
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  className="rounded-[6px]"
                >
                  Delete
                </Button>
              </div>
            </div>
          )
        }
      >
        {selectedLead && (
          <div className="space-y-4">
            {statusUpdateError && (
              <div className="p-3 rounded-[6px] bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{statusUpdateError}</span>
              </div>
            )}

            {/* Pipeline Stage Stepper */}
            <div className="p-3 rounded-[8px] bg-[#F3F6FA] dark:bg-[#1E293B]/40 border border-[#E3E7ED] dark:border-[#1E293B]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                Conversion Pipeline Stage
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['New', 'Contacted', 'Qualified', 'Closed'] as const).map((stage) => {
                  const isActive = selectedLead.status === stage;
                  return (
                    <button
                      key={stage}
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleStatusChange(selectedLead.id, stage)}
                      className={`p-2 rounded-[6px] text-center border text-xs font-semibold transition-all select-none active:scale-[0.99] motion-reduce:transition-none ${
                        isActive
                          ? 'bg-[#315FEA] border-[#315FEA] text-white shadow-xs'
                          : 'bg-white dark:bg-[#0F172A] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#315FEA]'
                      }`}
                    >
                      {stage}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Customer & Contact Summary Grid (Unified layout without 6 nested boxes) */}
            <div className="p-4 rounded-[8px] bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] shadow-soft-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-xs">
                {/* Customer Name */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Customer Name
                  </span>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                    {selectedLead.name}
                  </p>
                </div>

                {/* Phone Number */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Phone Number
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {selectedLead.phone}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => handleCopyPhone(selectedLead.id, selectedLead.phone, e)}
                      className="text-xs text-[#315FEA] font-semibold hover:underline inline-flex items-center gap-1"
                      aria-label={`Copy phone for ${selectedLead.name}`}
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Email Address
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-0.5">
                    {selectedLead.email || 'Not provided'}
                  </p>
                </div>

                {/* Area of Interest */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Area of Interest
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-0.5">
                    {selectedLead.areaOfInterest || 'Not specified'}
                  </p>
                </div>

                {/* Intake Source & Status */}
                <div className="sm:col-span-2 pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Intake Source
                    </span>
                    {getSourceBadge(selectedLead.source)}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Current Status
                    </span>
                    {getStatusBadge(selectedLead.status)}
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Inquiry Requirements */}
            <div className="p-3.5 rounded-[8px] bg-[#F3F6FA] dark:bg-[#1E293B]/40 border border-[#E3E7ED] dark:border-[#1E293B] space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                Customer Inquiry Requirements
              </span>
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed pt-0.5">
                {selectedLead.message || 'No project description entered.'}
              </p>
            </div>

            {/* Follow-up Progression & History */}
            <div className="space-y-3 pt-2 border-t border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#315FEA]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Follow-up Interactions & History ({followUps.length})
                  </h4>
                </div>
                <Button
                  type="button"
                  variant={isRecordingFollowUp ? 'ghost' : 'outline'}
                  size="sm"
                  onClick={() => setIsRecordingFollowUp((v) => !v)}
                  className="text-xs h-7 px-2.5 rounded-[6px]"
                  leftIcon={isRecordingFollowUp ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                >
                  {isRecordingFollowUp ? 'Cancel' : 'Record Follow-up'}
                </Button>
              </div>

              {/* Inline Follow-up Recording Form */}
              {isRecordingFollowUp && (
                <form
                  onSubmit={handleRecordFollowUp}
                  className="p-3.5 rounded-[8px] bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] shadow-soft-sm space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Pencil className="w-3.5 h-3.5 text-[#315FEA]" />
                      Record Customer Follow-up
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Does not alter pipeline stage
                    </span>
                  </div>

                  {followUpSubmitError && (
                    <div className="p-2.5 rounded-[6px] bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{followUpSubmitError}</span>
                    </div>
                  )}

                  {/* Method & Timestamp */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                        Contact Method <span className="text-red-500">*</span>
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {(['Call', 'WhatsApp', 'Email', 'Meeting', 'Other'] as const).map((method) => {
                          const isSelected = followUpForm.method === method;
                          return (
                            <button
                              key={method}
                              type="button"
                              onClick={() => setFollowUpForm((prev) => ({ ...prev, method }))}
                              className={`py-1.5 px-3 text-center rounded-[6px] text-xs font-semibold border transition-colors select-none active:scale-[0.99] motion-reduce:transition-none ${
                                isSelected
                                  ? 'bg-[#315FEA] border-[#315FEA] text-white shadow-xs'
                                  : 'bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                              }`}
                            >
                              {method}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                        Interaction Date & Time <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="datetime-local"
                        value={followUpForm.followedUpAt}
                        onChange={(e) => setFollowUpForm((prev) => ({ ...prev, followedUpAt: e.target.value }))}
                        required
                        className="text-xs py-1.5"
                      />
                    </div>
                  </div>

                  {/* Conversation Notes */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="follow-up-notes-textarea" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Conversation Notes <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] text-slate-400">
                        {followUpForm.notes.length}/4000
                      </span>
                    </div>
                    <Textarea
                      id="follow-up-notes-textarea"
                      rows={3}
                      value={followUpForm.notes}
                      onChange={(e) => setFollowUpForm((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Details discussed with customer, project specifications, pricing feedback, objections or clarifications..."
                      maxLength={4000}
                      required
                      className="text-xs"
                    />
                  </div>

                  {/* Next Action & Next Follow-up Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                        Next Action (Optional)
                      </label>
                      <Input
                        id="follow-up-next-action-input"
                        type="text"
                        placeholder="e.g. Share quotation, follow up on design proposal"
                        value={followUpForm.nextAction}
                        onChange={(e) => setFollowUpForm((prev) => ({ ...prev, nextAction: e.target.value }))}
                        maxLength={500}
                        className="text-xs py-1.5"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                        Next Follow-up Date (Optional)
                      </label>
                      <Input
                        type="datetime-local"
                        value={followUpForm.nextFollowUpAt}
                        onChange={(e) => setFollowUpForm((prev) => ({ ...prev, nextFollowUpAt: e.target.value }))}
                        className="text-xs py-1.5"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsRecordingFollowUp(false)}
                      className="text-xs h-8 rounded-[6px]"
                      disabled={isSubmittingFollowUp}
                    >
                      Cancel
                    </Button>
                    <Button
                      id="save-followup-submit-btn"
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={isSubmittingFollowUp}
                      disabled={isSubmittingFollowUp || !followUpForm.notes.trim()}
                      className="text-xs h-8 rounded-[6px]"
                    >
                      Save Follow-up
                    </Button>
                  </div>
                </form>
              )}

              {/* Follow-up Timeline List */}
              <div className="space-y-2">
                {followUpsLoading ? (
                  <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#315FEA]" />
                    <span>Loading interaction history...</span>
                  </div>
                ) : followUpsError ? (
                  <div className="p-3 rounded-[6px] bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs flex items-center justify-between">
                    <span>{followUpsError}</span>
                    <button
                      type="button"
                      onClick={() => selectedLead && fetchFollowUps(selectedLead.id)}
                      className="text-[#315FEA] font-semibold underline text-xs"
                    >
                      Retry
                    </button>
                  </div>
                ) : followUps.length === 0 ? (
                  <div className="p-4 rounded-[8px] border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#1E293B]/20 text-center">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      No follow-up interactions recorded yet.
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      Click &quot;Record Follow-up&quot; above to document your call or message with this customer.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {followUps.map((fu) => (
                      <div
                        key={fu.id}
                        className="p-3 rounded-[8px] bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 text-xs shadow-soft-sm space-y-1.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <div className="flex items-center gap-2">
                            {getFollowUpMethodBadge(fu.method)}
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              {formatDate(fu.followedUpAt)}
                            </span>
                          </div>
                          {fu.nextFollowUpAt && (
                            <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-[4px] border border-amber-200 dark:border-amber-800/50 inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Next: {formatDate(fu.nextFollowUpAt)}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed pt-0.5">
                          {fu.notes}
                        </p>

                        {fu.nextAction && (
                          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                            <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[9px]">
                              Next Action:
                            </span>
                            <span className="text-slate-700 dark:text-slate-300 font-medium">{fu.nextAction}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Audit Timestamps */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Submitted: {formatDate(selectedLead.submittedAt)}
              </span>
              {selectedLead.updatedAt && (
                <span>Last Updated: {formatDate(selectedLead.updatedAt)}</span>
              )}
              {selectedLead.sourceReference && (
                <span className="font-mono text-[10px]">
                  Ref: {selectedLead.sourceReference}
                </span>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* 6. Manual Add Lead Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setAddError(null);
        }}
        preventOutsideClose={isAddingLead}
        title="Add Customer Lead"
        description="Record a new customer enquiry manually into your workspace."
        maxWidth="md"
      >
        <form onSubmit={handleCreateLead} className="space-y-4">
          {addError && (
            <div className="p-3 rounded-[6px] bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{addError}</span>
            </div>
          )}

          <FormField label="Customer Name" required>
            <Input
              type="text"
              required
              placeholder="e.g. Anand Kumar"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <PhoneInput
              label="Phone Number"
              required
              value={addForm.phone}
              onChange={(digits) => setAddForm({ ...addForm, phone: digits })}
            />

            <FormField label="Email Address (Optional)">
              <Input
                type="email"
                placeholder="customer@example.com"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Source Channel">
              <Select
                value={addForm.source}
                onChange={(e) => setAddForm({ ...addForm, source: e.target.value })}
              >
                <option value="Manual">Manual</option>
                <option value="Website">Website</option>
                <option value="WhatsApp">WhatsApp</option>
              </Select>
            </FormField>

            <FormField label="Initial Status">
              <Select
                value={addForm.status}
                onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Closed">Closed</option>
              </Select>
            </FormField>
          </div>

          <FormField label="Area of Interest">
            <Select
              value={addForm.areaOfInterest}
              onChange={(e) => {
                const selected = tenantCategories.find((c) => c.name === e.target.value);
                setAddForm({
                  ...addForm,
                  areaOfInterest: e.target.value,
                  areaOfInterestCategoryId: selected ? selected.id : '',
                });
              }}
            >
              <option value="">Select an area of interest (optional)</option>
              {tenantCategories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Project Enquiry / Requirements" required>
            <Textarea
              required
              rows={3}
              placeholder="Enter customer enquiry message or project scope..."
              value={addForm.message}
              onChange={(e) => setAddForm({ ...addForm, message: e.target.value })}
            />
          </FormField>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1E293B]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isAddingLead}
              className="rounded-[6px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isAddingLead}
              isLoading={isAddingLead}
              loadingText="Saving..."
              className="rounded-[6px]"
            >
              Save Lead
            </Button>
          </div>
        </form>
      </Modal>

      {/* 7. Manual Edit Lead Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditError(null);
        }}
        preventOutsideClose={isEditingLead}
        title="Edit Customer Lead"
        description="Update contact information or enquiry specifications."
        maxWidth="md"
      >
        <form onSubmit={handleUpdateLead} className="space-y-4">
          {editError && (
            <div className="p-3 rounded-[6px] bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          <FormField label="Customer Name" required>
            <Input
              type="text"
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <PhoneInput
              label="Phone Number"
              required
              value={editForm.phone}
              onChange={(digits) => setEditForm({ ...editForm, phone: digits })}
            />

            <FormField label="Email Address">
              <Input
                type="email"
                placeholder="customer@example.com"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Area of Interest">
              <Select
                value={editForm.areaOfInterest}
                onChange={(e) => {
                  const selected = tenantCategories.find((c) => c.name === e.target.value);
                  setEditForm({
                    ...editForm,
                    areaOfInterest: e.target.value,
                    areaOfInterestCategoryId: selected ? selected.id : '',
                  });
                }}
              >
                <option value="">Select an area of interest (optional)</option>
                {tenantCategories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Status">
              <Select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Closed">Closed</option>
              </Select>
            </FormField>
          </div>

          <FormField label="Project Enquiry / Requirements" required>
            <Textarea
              required
              rows={3}
              value={editForm.message}
              onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
            />
          </FormField>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1E293B]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isEditingLead}
              className="rounded-[6px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isEditingLead}
              isLoading={isEditingLead}
              loadingText="Saving..."
              className="rounded-[6px]"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* 8. Delete Confirmation Modal */}
      <Modal
        isOpen={!!leadToDelete}
        onClose={() => {
          setLeadToDelete(null);
          setDeleteError(null);
        }}
        preventOutsideClose={isDeleting}
        title="Delete Customer Lead"
        description="Are you sure you want to delete this enquiry? This action cannot be undone."
        maxWidth="sm"
      >
        <div className="space-y-4">
          {deleteError && (
            <div className="p-3 rounded-[6px] bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          {leadToDelete && (
            <div className="p-3.5 rounded-[6px] bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
              <p className="font-bold text-slate-900 dark:text-white">{leadToDelete.name}</p>
              <p className="text-slate-500">{leadToDelete.phone}</p>
              {leadToDelete.areaOfInterest && (
                <p className="text-slate-400 text-[11px]">Area: {leadToDelete.areaOfInterest}</p>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1E293B]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLeadToDelete(null)}
              disabled={isDeleting}
              className="rounded-[6px]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteLead}
              disabled={isDeleting}
              isLoading={isDeleting}
              loadingText="Deleting..."
              className="rounded-[6px]"
            >
              Delete Lead
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto p-12 text-center text-slate-500 text-sm">
          Loading customer leads...
        </div>
      }
    >
      <CustomerLeadsContent />
    </Suspense>
  );
}
