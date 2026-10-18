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
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { FormField } from '@/components/ui/FormField';
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

  // Presentation Mode: 'table' vs 'cards' (on mobile viewports, cards are automatically used)
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
          <Badge variant="success" size="sm" dot dotPulse>
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
    <div className="max-w-6xl mx-auto space-y-6">
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
          {/* View Mode Toggle (Shown on tablet and desktop) */}
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-[#1E293B] p-0.5 rounded-[6px] border border-slate-200 dark:border-slate-700">
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

      {/* 2. Interactive Status Metric Filter Pills (Replacing Bulky KPI Cards) */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1">
        <button
          type="button"
          onClick={() => {
            setStatusFilter('All');
            setLeadsPage(1);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-all select-none ${
            statusFilter === 'All'
              ? 'bg-[#315FEA] text-white shadow-xs'
              : 'bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] text-slate-700 dark:text-slate-300 hover:border-[#315FEA]'
          }`}
        >
          <span>All Enquiries</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            statusFilter === 'All' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-slate-300'
          }`}>
            {leadsTotalCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('New');
            setLeadsPage(1);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-all select-none ${
            statusFilter === 'New'
              ? 'bg-[#15803D] text-white shadow-xs'
              : 'bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] text-slate-700 dark:text-slate-300 hover:border-[#15803D]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#15803D] dark:bg-emerald-400 animate-pulse" />
          <span>New</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            statusFilter === 'New' ? 'bg-white/20 text-white' : 'bg-[#15803D]/10 text-[#15803D] dark:text-emerald-400'
          }`}>
            {statusCounts.new}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('Contacted');
            setLeadsPage(1);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-all select-none ${
            statusFilter === 'Contacted'
              ? 'bg-[#315FEA] text-white shadow-xs'
              : 'bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] text-slate-700 dark:text-slate-300 hover:border-[#315FEA]'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#315FEA]" />
          <span>Contacted</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            statusFilter === 'Contacted' ? 'bg-white/20 text-white' : 'bg-[#315FEA]/10 text-[#315FEA] dark:text-blue-400'
          }`}>
            {statusCounts.contacted}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('Qualified');
            setLeadsPage(1);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-all select-none ${
            statusFilter === 'Qualified'
              ? 'bg-[#7950B8] text-white shadow-xs'
              : 'bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] text-slate-700 dark:text-slate-300 hover:border-[#7950B8]'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#7950B8]" />
          <span>Qualified</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            statusFilter === 'Qualified' ? 'bg-white/20 text-white' : 'bg-[#7950B8]/10 text-[#7950B8] dark:text-purple-300'
          }`}>
            {statusCounts.qualified}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('Closed');
            setLeadsPage(1);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-all select-none ${
            statusFilter === 'Closed'
              ? 'bg-slate-700 text-white shadow-xs'
              : 'bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] text-slate-700 dark:text-slate-300 hover:border-slate-400'
          }`}
        >
          <span>Closed</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            statusFilter === 'Closed' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-slate-300'
          }`}>
            {statusCounts.closed}
          </span>
        </button>
      </div>

      {/* 3. Filter, Search, and Sort Toolbar */}
      <div className="bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] rounded-[8px] p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search */}
          <div className="relative sm:col-span-2 lg:col-span-6">
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
                <button type="button" onClick={() => setLeadsSearch('')} aria-label="Remove search filter"><X className="w-3 h-3" /></button>
              </span>
            )}
            {statusFilter !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Status: {statusFilter}
                <button type="button" onClick={() => setStatusFilter('All')} aria-label="Remove status filter"><X className="w-3 h-3" /></button>
              </span>
            )}
            {sourceFilter !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Source: {sourceFilter}
                <button type="button" onClick={() => setSourceFilter('All')} aria-label="Remove source filter"><X className="w-3 h-3" /></button>
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
      ) : (
        <>
          {/* DESKTOP TABLE VIEW (Visible on md+ screens when table view is selected) */}
          <div className={`bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] rounded-[8px] shadow-xs overflow-hidden ${
            viewMode === 'table' ? 'hidden md:block' : 'hidden'
          }`}>
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
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-[6px] bg-[#315FEA]/10 text-[#315FEA] font-bold text-xs flex items-center justify-center shrink-0">
                            {getInitials(lead.name)}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <p className="font-semibold text-slate-900 dark:text-white truncate">
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
                      <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5 font-medium">
                          <span>{lead.phone}</span>
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
                      <td className="px-5 py-3.5">
                        {lead.areaOfInterest ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-medium bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            {lead.areaOfInterest}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      {/* Source Channel */}
                      <td className="px-5 py-3.5">
                        {getSourceBadge(lead.source)}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
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
                      <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <div title={formatDate(lead.submittedAt)}>
                          {formatRelativeTime(lead.submittedAt)}
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-5 py-3.5 text-right" onClick={e => e.stopPropagation()}>
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

            {/* Desktop Table Pagination */}
            <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#0B1120]/50">
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

          {/* MOBILE CARDS VIEW (Automatically shown on mobile < md, or when cards view mode is toggled) */}
          <div className={`space-y-3.5 ${viewMode === 'table' ? 'block md:hidden' : 'block'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {leads.map(lead => (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className="p-4 rounded-[8px] bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] shadow-xs hover:border-[#315FEA] cursor-pointer transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2.5">
                    {/* Card Top: Customer Avatar, Name, Status & Time */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-[6px] bg-[#315FEA]/10 text-[#315FEA] font-bold text-xs flex items-center justify-center shrink-0">
                          {getInitials(lead.name)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                            {lead.name}
                          </h3>
                          <span className="text-[11px] text-slate-400">
                            {formatRelativeTime(lead.submittedAt)}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {getStatusBadge(lead.status)}
                      </div>
                    </div>

                    {/* Contact Info Row */}
                    <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 pt-1" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5 font-medium min-w-0">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{lead.phone}</span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyPhone(lead.id, lead.phone, e)}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 shrink-0"
                          title="Copy phone"
                          aria-label={`Copy phone for ${lead.name}`}
                        >
                          {copiedPhoneId === lead.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      {lead.email && (
                        <span className="text-[11px] text-slate-400 truncate max-w-[120px] ml-2">
                          {lead.email}
                        </span>
                      )}
                    </div>

                    {/* Badges: Source and Area of Interest */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {getSourceBadge(lead.source)}
                      {lead.areaOfInterest && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-medium bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          {lead.areaOfInterest}
                        </span>
                      )}
                    </div>

                    {/* Message Preview */}
                    {lead.message && (
                      <div className="p-2.5 rounded-[6px] bg-slate-50 dark:bg-[#1E293B]/40 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        &quot;{lead.message}&quot;
                      </div>
                    )}
                  </div>

                  {/* Card Bottom: Fast actions */}
                  <div className="pt-2.5 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between gap-2" onClick={e => e.stopPropagation()}>
                    <span className="text-[11px] text-slate-400">
                      Tap card for details
                    </span>

                    <div className="flex items-center gap-1">
                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone}`}
                          className="h-8 w-8 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-[6px] text-[#15803D] hover:bg-[#15803D]/10 transition-colors"
                          title="Call customer"
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
                          className="h-8 w-8 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-[6px] text-[#25D366] hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                          title="WhatsApp customer"
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
                        className="h-8 w-8 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-[6px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        title="Edit lead"
                        aria-label={`Edit ${lead.name}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setLeadToDelete(lead)}
                        className="h-8 w-8 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-[6px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Delete lead"
                        aria-label={`Delete ${lead.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Cards Pagination */}
            <div className="p-3 bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] rounded-[8px] flex items-center justify-between text-xs">
              <span className="text-slate-500">
                {leads.length} of {leadsTotalCount} leads
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLeadsPage(p => Math.max(1, p - 1))}
                  disabled={leadsPage <= 1}
                  className="rounded-[6px]"
                >
                  Prev
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
        </>
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
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[6px] bg-[#15803D] hover:bg-[#15803D]/90 text-white transition-colors"
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
          <div className="space-y-5">
            {statusUpdateError && (
              <div className="p-3 rounded-[6px] bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{statusUpdateError}</span>
              </div>
            )}

            {/* Pipeline Stage Stepper */}
            <div className="p-3.5 rounded-[8px] bg-slate-50 dark:bg-[#1E293B]/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
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
                      className={`p-2 rounded-[6px] text-center border text-xs font-semibold transition-all ${
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-[8px] bg-white dark:bg-[#1E293B]/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Customer Name
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                  {selectedLead.name}
                </p>
              </div>

              <div className="p-3 rounded-[8px] bg-white dark:bg-[#1E293B]/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Phone Number
                </span>
                <div className="flex items-center justify-between mt-1">
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
                    Copy
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-[8px] bg-white dark:bg-[#1E293B]/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Email Address
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                  {selectedLead.email || 'Not provided'}
                </p>
              </div>

              <div className="p-3 rounded-[8px] bg-white dark:bg-[#1E293B]/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Area of Interest
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                  {selectedLead.areaOfInterest || 'Not specified'}
                </p>
              </div>

              <div className="p-3 rounded-[8px] bg-white dark:bg-[#1E293B]/60 border border-slate-200 dark:border-slate-800 sm:col-span-2">
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
            <div className="p-3.5 rounded-[8px] bg-slate-50 dark:bg-[#1E293B]/40 border border-slate-200 dark:border-slate-800 space-y-1">
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
              onChange={e => setAddForm({ ...addForm, name: e.target.value })}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Phone Number" required helperText="10-digit mobile number">
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
            </FormField>

            <FormField label="Email Address (Optional)">
              <Input
                type="email"
                placeholder="customer@example.com"
                value={addForm.email}
                onChange={e => setAddForm({ ...addForm, email: e.target.value })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Source Channel">
              <Select
                value={addForm.source}
                onChange={e => setAddForm({ ...addForm, source: e.target.value })}
              >
                <option value="Manual">Manual</option>
                <option value="Website">Website</option>
                <option value="WhatsApp">WhatsApp</option>
              </Select>
            </FormField>

            <FormField label="Initial Status">
              <Select
                value={addForm.status}
                onChange={e => setAddForm({ ...addForm, status: e.target.value })}
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
              onChange={e => {
                const selected = tenantCategories.find(c => c.name === e.target.value);
                setAddForm({
                  ...addForm,
                  areaOfInterest: e.target.value,
                  areaOfInterestCategoryId: selected ? selected.id : '',
                });
              }}
            >
              <option value="">Select an area of interest (optional)</option>
              {tenantCategories.map(cat => (
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
              onChange={e => setAddForm({ ...addForm, message: e.target.value })}
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
              onChange={e => setEditForm({ ...editForm, name: e.target.value })}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Phone Number" required helperText="10-digit mobile number">
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
            </FormField>

            <FormField label="Email Address">
              <Input
                type="email"
                placeholder="customer@example.com"
                value={editForm.email}
                onChange={e => setEditForm({ ...editForm, email: e.target.value })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Area of Interest">
              <Select
                value={editForm.areaOfInterest}
                onChange={e => {
                  const selected = tenantCategories.find(c => c.name === e.target.value);
                  setEditForm({
                    ...editForm,
                    areaOfInterest: e.target.value,
                    areaOfInterestCategoryId: selected ? selected.id : '',
                  });
                }}
              >
                <option value="">Select an area of interest (optional)</option>
                {tenantCategories.map(cat => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Status">
              <Select
                value={editForm.status}
                onChange={e => setEditForm({ ...editForm, status: e.target.value })}
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
              onChange={e => setEditForm({ ...editForm, message: e.target.value })}
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
    <Suspense fallback={
      <div className="max-w-6xl mx-auto p-12 text-center text-slate-500 text-sm">
        Loading customer leads...
      </div>
    }>
      <CustomerLeadsContent />
    </Suspense>
  );
}
