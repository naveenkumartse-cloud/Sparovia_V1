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
  Filter,
  CheckCircle2,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/api/client';
import { cleanPhoneInput, handlePhoneKeyDown, handlePhonePaste, isValidIndianPhone } from '@/lib/validation/authValidation';

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
const PAGE_SIZE_OPTIONS = [10, 15, 25, 50] as const;

function CustomerLeadsContent() {
  // Query parameters state
  const [leadsPage, setLeadsPage] = useState(1);
  const [leadsPageSize, setLeadsPageSize] = useState<number>(15);
  const [leadsSearch, setLeadsSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<string>('newest');

  // Presentation Mode: 'table' vs 'cards'
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Leads Data state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsTotalCount, setLeadsTotalCount] = useState(0);
  const [leadsTotalPages, setLeadsTotalPages] = useState(1);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [leadsError, setLeadsError] = useState<string | null>(null);

  // Tenant Work Categories (Source of truth for Area of Interest)
  const [tenantCategories, setTenantCategories] = useState<TenantWorkCategory[]>([]);

  // Selected Lead for detail view
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);

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

  // Compute status summary counts from current loaded items
  const statusCounts = useMemo(() => {
    const counts = {
      all: leadsTotalCount,
      new: 0,
      contacted: 0,
      qualified: 0,
      closed: 0,
    };
    leads.forEach(l => {
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

      setLeads(prev => prev.map(l => (l.id === leadId ? updated : l)));
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

      setLeads(prev => prev.map(l => (l.id === selectedLead.id ? updated : l)));
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
      setLeads(prev => prev.filter(l => l.id !== leadToDelete.id));
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
    const rows = leads.map(l => [
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

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
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
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return formatDate(dateStr);
    } catch {
      return dateStr;
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'L';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            New
          </span>
        );
      case 'Contacted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] text-xs font-semibold bg-[#315FEA]/10 text-[#315FEA] dark:bg-[#315FEA]/20 dark:text-[#6085FF] border border-[#315FEA]/20">
            Contacted
          </span>
        );
      case 'Qualified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] text-xs font-semibold bg-[#7950B8]/10 text-[#7950B8] dark:bg-[#7950B8]/20 dark:text-[#A78BFA] border border-[#7950B8]/20">
            Qualified
          </span>
        );
      case 'Closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
            {status}
          </span>
        );
    }
  };

  const getSourceBadge = (source: string) => {
    const s = source?.toLowerCase() || '';
    if (s === 'whatsapp') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/60">
          <MessageCircle className="w-3 h-3 text-[#25D366]" />
          WhatsApp
        </span>
      );
    }
    if (s === 'manual') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-purple-50 text-[#7950B8] dark:bg-purple-950/30 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/60">
          Manual
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
        Website
      </span>
    );
  };

  const hasActiveFilters = Boolean(
    leadsSearch.trim() || statusFilter !== 'All' || sourceFilter !== 'All' || sortOrder !== 'newest'
  );

  const resetAllFilters = () => {
    setLeadsSearch('');
    setStatusFilter('All');
    setSourceFilter('All');
    setSortOrder('newest');
    setLeadsPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 1. Header & Primary Workspace Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#172033] dark:text-white tracking-tight">
              Customer Leads
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-[4px] text-xs font-bold bg-[#315FEA]/10 text-[#315FEA] dark:bg-[#315FEA]/20 dark:text-[#6085FF] border border-[#315FEA]/20">
              {leadsTotalCount} Total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8] mt-1">
            Review, qualify, and action customer enquiries captured through your website and verified channels.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-[#1E293B] p-0.5 rounded-[6px] border border-slate-200 dark:border-slate-700">
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
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-[4px] text-xs font-medium transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-[#0F172A] text-[#172033] dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Card view"
              aria-label="Card view"
            >
              <LayoutGrid className="w-4 h-4" />
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

      {/* 2. Executive Status KPI Strip (Interactive Filter Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* KPI: All Enquiries */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter('All');
            setLeadsPage(1);
          }}
          className={`p-3.5 rounded-[8px] border text-left transition-all ${
            statusFilter === 'All'
              ? 'bg-[#315FEA]/5 border-[#315FEA] shadow-xs'
              : 'bg-white dark:bg-[#0F172A] border-[#CBD5E1] dark:border-[#1E293B] hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-[#94A3B8]">
              All Enquiries
            </span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-xl font-bold text-[#172033] dark:text-white">
            {leadsTotalCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Full client intake
          </p>
        </button>

        {/* KPI: New Enquiries */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter('New');
            setLeadsPage(1);
          }}
          className={`p-3.5 rounded-[8px] border text-left transition-all ${
            statusFilter === 'New'
              ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-500 shadow-xs'
              : 'bg-white dark:bg-[#0F172A] border-[#CBD5E1] dark:border-[#1E293B] hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              New
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="mt-2 text-xl font-bold text-emerald-800 dark:text-emerald-300">
            {statusCounts.new}
          </div>
          <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
            Awaiting response
          </p>
        </button>

        {/* KPI: Contacted */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter('Contacted');
            setLeadsPage(1);
          }}
          className={`p-3.5 rounded-[8px] border text-left transition-all ${
            statusFilter === 'Contacted'
              ? 'bg-[#315FEA]/5 border-[#315FEA] shadow-xs'
              : 'bg-white dark:bg-[#0F172A] border-[#CBD5E1] dark:border-[#1E293B] hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#315FEA] dark:text-blue-400">
              Contacted
            </span>
            <Phone className="w-4 h-4 text-[#315FEA]/70" />
          </div>
          <div className="mt-2 text-xl font-bold text-[#172033] dark:text-white">
            {statusCounts.contacted}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            In discussion
          </p>
        </button>

        {/* KPI: Qualified / High-Intent */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter('Qualified');
            setLeadsPage(1);
          }}
          className={`p-3.5 rounded-[8px] border text-left transition-all ${
            statusFilter === 'Qualified'
              ? 'bg-purple-50/60 dark:bg-purple-950/30 border-[#7950B8] shadow-xs'
              : 'bg-white dark:bg-[#0F172A] border-[#CBD5E1] dark:border-[#1E293B] hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#7950B8] dark:text-purple-300">
              Qualified
            </span>
            <Sparkles className="w-4 h-4 text-[#7950B8]/70" />
          </div>
          <div className="mt-2 text-xl font-bold text-[#172033] dark:text-white">
            {statusCounts.qualified}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            High client match
          </p>
        </button>
      </div>

      {/* 3. Filter, Search, and Sort Toolbar */}
      <div className="bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] rounded-[8px] p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2 lg:col-span-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={leadsSearch}
              onChange={e => {
                setLeadsSearch(e.target.value);
                setLeadsPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-[6px] bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#315FEA]"
            />
            {leadsSearch && (
              <button
                type="button"
                onClick={() => {
                  setLeadsSearch('');
                  setLeadsPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-2 flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium shrink-0">Status:</span>
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setLeadsPage(1);
              }}
              className="w-full py-2 px-2.5 text-xs rounded-[6px] bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#315FEA]"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Source Filter */}
          <div className="lg:col-span-2 flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium shrink-0">Source:</span>
            <select
              value={sourceFilter}
              onChange={e => {
                setSourceFilter(e.target.value);
                setLeadsPage(1);
              }}
              className="w-full py-2 px-2.5 text-xs rounded-[6px] bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#315FEA]"
            >
              {SOURCE_OPTIONS.map(opt => (
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
              onChange={e => {
                setSortOrder(e.target.value);
                setLeadsPage(1);
              }}
              className="w-full py-2 px-2.5 text-xs rounded-[6px] bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#315FEA]"
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
                <button type="button" onClick={() => setLeadsSearch('')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {statusFilter !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Status: {statusFilter}
                <button type="button" onClick={() => setStatusFilter('All')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {sourceFilter !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Source: {sourceFilter}
                <button type="button" onClick={() => setSourceFilter('All')}><X className="w-3 h-3" /></button>
              </span>
            )}
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-[#315FEA] hover:underline font-semibold ml-auto"
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
        <div className="bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] rounded-[8px] p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[6px] bg-slate-100 dark:bg-[#1E293B] text-slate-400 mb-4 animate-pulse">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Loading customer leads...
          </p>
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] rounded-[8px] p-8 sm:p-12 shadow-xs">
          <EmptyState
            icon={<Users className="w-8 h-8 text-slate-400" />}
            title={hasActiveFilters ? "No matching enquiries found" : "No customer leads yet"}
            description={
              hasActiveFilters
                ? "No leads matched your filter criteria. Try clearing search keywords or resetting filters."
                : "When prospective clients submit enquiries through your website contact forms or verified channels, they will be cataloged here."
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
      ) : viewMode === 'table' ? (
        /* TABLE PRESENTATION */
        <div className="bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] rounded-[8px] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F3F6FA] dark:bg-[#1E293B]/40 border-b border-[#E3E7ED] dark:border-[#1E293B] text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th scope="col" className="px-5 py-3.5">Customer</th>
                  <th scope="col" className="px-5 py-3.5">Contact Details</th>
                  <th scope="col" className="px-5 py-3.5">Area of Interest</th>
                  <th scope="col" className="px-5 py-3.5">Source</th>
                  <th scope="col" className="px-5 py-3.5">Status</th>
                  <th scope="col" className="px-5 py-3.5">Submitted</th>
                  <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B]">
                {leads.map(lead => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="hover:bg-slate-50/80 dark:hover:bg-[#1E293B]/30 cursor-pointer transition-colors group"
                  >
                    {/* Customer Name & Initials */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-[6px] bg-[#315FEA]/10 text-[#315FEA] font-bold text-xs flex items-center justify-center shrink-0">
                          {getInitials(lead.name)}
                        </div>
                        <div className="min-w-0 max-w-xs">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {lead.name}
                          </p>
                          {lead.message && (
                            <p className="text-xs text-slate-400 font-normal truncate mt-0.5">
                              {lead.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contact Details & Quick Copy */}
                    <td className="px-5 py-4 text-slate-700 dark:text-slate-300" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5 font-medium">
                        <span>{lead.phone}</span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyPhone(lead.id, lead.phone, e)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                          title="Copy phone"
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
                    <td className="px-5 py-4">
                      {lead.areaOfInterest ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-medium bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          {lead.areaOfInterest}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>

                    {/* Source Channel */}
                    <td className="px-5 py-4">
                      {getSourceBadge(lead.source)}
                    </td>

                    {/* Status Dropdown */}
                    <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(lead.status)}
                        <select
                          value={lead.status}
                          onChange={e => handleStatusChange(lead.id, e.target.value)}
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

                    {/* Submitted Date */}
                    <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      <div title={formatDate(lead.submittedAt)}>
                        {formatRelativeTime(lead.submittedAt)}
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1.5">
                        {lead.phone && (
                          <a
                            href={`tel:${lead.phone}`}
                            className="p-1.5 rounded-[4px] text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                            title={`Call ${lead.name}`}
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
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => {
                            setSelectedLead(lead);
                            openEditModal(lead);
                          }}
                          title="Edit lead"
                          aria-label={`Edit ${lead.name}`}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setLeadToDelete(lead)}
                          title="Delete lead"
                          aria-label={`Delete ${lead.name}`}
                          className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-slate-100 dark:border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#0B1120]/50">
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>
                Showing <strong className="text-slate-700 dark:text-slate-300">{leads.length}</strong> of{' '}
                <strong className="text-slate-700 dark:text-slate-300">{leadsTotalCount}</strong> total
              </span>
              <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 dark:border-slate-700 pl-3">
                <span>Page size:</span>
                <select
                  value={leadsPageSize}
                  onChange={e => {
                    setLeadsPageSize(Number(e.target.value));
                    setLeadsPage(1);
                  }}
                  className="py-1 px-1.5 rounded-[4px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-xs font-semibold"
                >
                  {PAGE_SIZE_OPTIONS.map(size => (
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
                onClick={() => setLeadsPage(p => Math.max(1, p - 1))}
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
                onClick={() => setLeadsPage(p => Math.min(leadsTotalPages, p + 1))}
                disabled={leadsPage >= leadsTotalPages || leadsLoading}
                className="flex items-center gap-1 text-xs rounded-[6px]"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* CARD / GRID PRESENTATION */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leads.map(lead => (
              <div
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className="p-5 rounded-[8px] bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] shadow-xs hover:border-[#315FEA] hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Card Header: Avatar, Name, Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-[6px] bg-[#315FEA]/10 text-[#315FEA] font-bold text-xs flex items-center justify-center shrink-0">
                        {getInitials(lead.name)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                          {lead.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <span>{lead.phone}</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyPhone(lead.id, lead.phone, e)}
                            className="p-0.5 rounded text-slate-400 hover:text-slate-600"
                            title="Copy phone"
                          >
                            {copiedPhoneId === lead.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(lead.status)}
                  </div>

                  {/* Badges: Source and Interest */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    {getSourceBadge(lead.source)}
                    {lead.areaOfInterest && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {lead.areaOfInterest}
                      </span>
                    )}
                  </div>

                  {/* Message Preview */}
                  {lead.message && (
                    <div className="mt-3 p-2.5 rounded-[4px] bg-slate-50 dark:bg-[#1E293B]/40 text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      &quot;{lead.message}&quot;
                    </div>
                  )}
                </div>

                {/* Card Footer: Fast actions & time */}
                <div className="pt-3 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between gap-2" onClick={e => e.stopPropagation()}>
                  <span className="text-[11px] text-slate-400">
                    {formatRelativeTime(lead.submittedAt)}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {lead.phone && (
                      <a
                        href={`tel:${lead.phone}`}
                        className="p-1.5 rounded-[4px] text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                        title="Call"
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
                        title="WhatsApp"
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
                      className="p-1.5 rounded-[4px] text-slate-400 hover:text-slate-600 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setLeadToDelete(lead)}
                      className="p-1.5 rounded-[4px] text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Card View Pagination */}
          <div className="p-4 bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] rounded-[8px] flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Showing {leads.length} of {leadsTotalCount} leads
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLeadsPage(p => Math.max(1, p - 1))}
                disabled={leadsPage <= 1}
                className="rounded-[6px]"
              >
                Previous
              </Button>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {leadsPage} / {leadsTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLeadsPage(p => Math.min(leadsTotalPages, p + 1))}
                disabled={leadsPage >= leadsTotalPages}
                className="rounded-[6px]"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Lead Detail Inspection Modal with Pipeline Stepper */}
      <Modal
        isOpen={!!selectedLead && !isEditModalOpen}
        onClose={() => {
          setSelectedLead(null);
          setStatusUpdateError(null);
        }}
        title="Lead Inspection & Follow-up"
        description="Review complete customer inquiry and manage the conversion pipeline."
        maxWidth="lg"
        footer={
          selectedLead && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
              <div className="flex flex-wrap items-center gap-2">
                {selectedLead.phone && (
                  <a
                    href={`tel:${selectedLead.phone}`}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[6px] bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
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
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[6px] bg-[#25D366] hover:bg-[#20ba59] text-white transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}
                {selectedLead.email && (
                  <a
                    href={`mailto:${selectedLead.email}`}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[6px] bg-[#315FEA] hover:bg-[#254EDB] text-white transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email</span>
                  </a>
                )}
              </div>

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
          <div className="space-y-6">
            {statusUpdateError && (
              <div className="p-3 rounded-[6px] bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{statusUpdateError}</span>
              </div>
            )}

            {/* Pipeline Stage Stepper */}
            <div className="p-4 rounded-[8px] bg-slate-50 dark:bg-[#1E293B]/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                Conversion Pipeline Stage
              </span>
              <div className="grid grid-cols-4 gap-2">
                {(['New', 'Contacted', 'Qualified', 'Closed'] as const).map((stage) => {
                  const isActive = selectedLead.status === stage;
                  return (
                    <button
                      key={stage}
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleStatusChange(selectedLead.id, stage)}
                      className={`p-2 rounded-[6px] text-center border text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-[#315FEA] border-[#315FEA] text-white shadow-xs'
                          : 'bg-white dark:bg-[#0F172A] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {stage}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Customer Contact Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-[8px] bg-white dark:bg-[#1E293B]/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Customer Name
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {selectedLead.name}
                </p>
              </div>

              <div className="p-3.5 rounded-[8px] bg-white dark:bg-[#1E293B]/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Phone Number
                </span>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedLead.phone}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => handleCopyPhone(selectedLead.id, selectedLead.phone, e)}
                    className="text-xs text-[#315FEA] font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-[8px] bg-white dark:bg-[#1E293B]/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Email Address
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {selectedLead.email || 'Not provided'}
                </p>
              </div>

              <div className="p-3.5 rounded-[8px] bg-white dark:bg-[#1E293B]/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Area of Interest
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {selectedLead.areaOfInterest || 'Not specified'}
                </p>
              </div>

              <div className="p-3.5 rounded-[8px] bg-white dark:bg-[#1E293B]/60 border border-slate-200 dark:border-slate-800 sm:col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Intake Source & Status
                </span>
                <div className="mt-1.5 flex items-center gap-2">
                  {getSourceBadge(selectedLead.source)}
                  {getStatusBadge(selectedLead.status)}
                </div>
              </div>
            </div>

            {/* Customer Message Card */}
            <div className="p-4 rounded-[8px] bg-slate-50 dark:bg-[#1E293B]/40 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Customer Inquiry Requirements
              </span>
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed pt-1">
                {selectedLead.message || 'No project description entered.'}
              </p>
            </div>

            {/* Audit Timestamps */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Submitted: {formatDate(selectedLead.submittedAt)}
              </span>
              {selectedLead.updatedAt && (
                <span>
                  Last Updated: {formatDate(selectedLead.updatedAt)}
                </span>
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Customer Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Anand Kumar"
              value={addForm.name}
              onChange={e => setAddForm({ ...addForm, name: e.target.value })}
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-[6px] bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#315FEA]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Phone Number *
                </label>
                <span className="text-[11px] text-slate-400">10-digit mobile</span>
              </div>
              <div className="flex items-stretch w-full rounded-[6px] border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#1E293B]/50 focus-within:ring-2 focus-within:ring-[#315FEA]">
                <div
                  aria-hidden="true"
                  className="flex items-center justify-center px-3 py-2 bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-slate-300 font-semibold text-xs select-none rounded-l-[6px] border-r border-slate-200 dark:border-[#334155]"
                >
                  <span className="tracking-wide">+91</span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={10}
                  required
                  placeholder="9876543210"
                  value={addForm.phone}
                  onKeyDown={handlePhoneKeyDown}
                  onPaste={(e) => {
                    handlePhonePaste(e, (cleanVal) => {
                      setAddForm({ ...addForm, phone: cleanVal });
                    });
                  }}
                  onChange={e => setAddForm({ ...addForm, phone: cleanPhoneInput(e.target.value) })}
                  className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                placeholder="customer@example.com"
                value={addForm.email}
                onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-[6px] bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#315FEA]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Source Channel
              </label>
              <select
                value={addForm.source}
                onChange={e => setAddForm({ ...addForm, source: e.target.value })}
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-[6px] bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#315FEA]"
              >
                <option value="Manual">Manual</option>
                <option value="Website">Website</option>
                <option value="WhatsApp">WhatsApp</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Initial Status
              </label>
              <select
                value={addForm.status}
                onChange={e => setAddForm({ ...addForm, status: e.target.value })}
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-[6px] bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#315FEA]"
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Area of Interest
            </label>
            <select
              value={addForm.areaOfInterest}
              onChange={e => {
                const selected = tenantCategories.find(c => c.name === e.target.value);
                setAddForm({
                  ...addForm,
                  areaOfInterest: e.target.value,
                  areaOfInterestCategoryId: selected ? selected.id : '',
                });
              }}
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-[6px] bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#315FEA]"
            >
              <option value="">Select an area of interest (optional)</option>
              {tenantCategories.map(cat => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Project Enquiry / Requirements *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Enter customer enquiry message or project scope..."
              value={addForm.message}
              onChange={e => setAddForm({ ...addForm, message: e.target.value })}
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-[6px] bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#315FEA] resize-none"
            />
          </div>

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
              className="rounded-[6px]"
            >
              {isAddingLead ? 'Saving...' : 'Save Lead'}
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Customer Name *
            </label>
            <input
              type="text"
              required
              value={editForm.name}
              onChange={e => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-[6px] bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#315FEA]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Phone Number *
                </label>
                <span className="text-[11px] text-slate-400">10-digit mobile</span>
              </div>
              <div className="flex items-stretch w-full rounded-[6px] border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#1E293B]/50 focus-within:ring-2 focus-within:ring-[#315FEA]">
                <div
                  aria-hidden="true"
                  className="flex items-center justify-center px-3 py-2 bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-slate-300 font-semibold text-xs select-none rounded-l-[6px] border-r border-slate-200 dark:border-[#334155]"
                >
                  <span className="tracking-wide">+91</span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={10}
                  required
                  placeholder="9876543210"
                  value={editForm.phone}
                  onKeyDown={handlePhoneKeyDown}
                  onPaste={(e) => {
                    handlePhonePaste(e, (cleanVal) => {
                      setEditForm({ ...editForm, phone: cleanVal });
                    });
                  }}
                  onChange={e => setEditForm({ ...editForm, phone: cleanPhoneInput(e.target.value) })}
                  className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={editForm.email}
                onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-[6px] bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#315FEA]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Area of Interest
              </label>
              <select
                value={editForm.areaOfInterest}
                onChange={e => {
                  const selected = tenantCategories.find(c => c.name === e.target.value);
                  setEditForm({
                    ...editForm,
                    areaOfInterest: e.target.value,
                    areaOfInterestCategoryId: selected ? selected.id : '',
                  });
                }}
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-[6px] bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#315FEA]"
              >
                <option value="">Select an area of interest (optional)</option>
                {tenantCategories.map(cat => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                value={editForm.status}
                onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-[6px] bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#315FEA]"
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Project Enquiry / Requirements *
            </label>
            <textarea
              required
              rows={3}
              value={editForm.message}
              onChange={e => setEditForm({ ...editForm, message: e.target.value })}
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-[6px] bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#315FEA] resize-none"
            />
          </div>

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
              className="rounded-[6px]"
            >
              {isEditingLead ? 'Saving...' : 'Save Changes'}
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
    <Suspense fallback={
      <div className="max-w-6xl mx-auto p-12 text-center text-slate-500 text-sm">
        Loading customer leads...
      </div>
    }>
      <CustomerLeadsContent />
    </Suspense>
  );
}
