'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Users, 
  Search, 
  Filter, 
  RefreshCw, 
  Phone, 
  Mail, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  MousePointerClick,
  ExternalLink,
  MessageCircle,
  Facebook,
  Instagram,
  Info,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/api/client';
import { cleanPhoneInput, handlePhoneKeyDown, handlePhonePaste, isValidIndianPhone } from '@/lib/validation/authValidation';

export interface ContactActivityItem {
  id: string;
  tenantId: string;
  websiteId: string;
  channel: 'WhatsApp' | 'Facebook' | 'Instagram' | string;
  eventType: string;
  templateId?: string;
  templateTitle?: string;
  source?: string;
  correlationId?: string;
  createdAt: string;
}

export interface ContactActivitySummary {
  totalClicks: number;
  whatsAppClicks: number;
  facebookClicks: number;
  instagramClicks: number;
}

export interface ContactActivityListResponse {
  items: ContactActivityItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

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

export default function LeadsPage() {
  // Query parameters state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<string>('newest');

  // Data state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tenant Work Categories (Source of truth for Area of Interest)
  const [tenantCategories, setTenantCategories] = useState<TenantWorkCategory[]>([]);

  // Selected Lead for detail view
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);

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
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('page', page.toString());
      queryParams.set('pageSize', pageSize.toString());

      if (search.trim()) {
        queryParams.set('search', search.trim());
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
      setTotalCount(res.totalCount || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Failed to load enquiries. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, statusFilter, sourceFilter, sortOrder]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab');
  const [activeMainTab, setActiveMainTab] = useState<'leads' | 'activity'>(
    tabParam === 'activity' ? 'activity' : 'leads'
  );

  // Contact Activity State
  const [activityChannelFilter, setActivityChannelFilter] = useState<string>('All');
  const [activityPage, setActivityPage] = useState(1);
  const [activityPageSize] = useState(15);
  const [activities, setActivities] = useState<ContactActivityItem[]>([]);
  const [activityTotalCount, setActivityTotalCount] = useState(0);
  const [activityTotalPages, setActivityTotalPages] = useState(1);
  const [activitySummary, setActivitySummary] = useState<ContactActivitySummary | null>(null);
  const [isActivityLoading, setIsActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);

  const fetchActivitySummary = useCallback(async () => {
    try {
      const summary = await apiClient.get<ContactActivitySummary>('/contact-activity/summary');
      setActivitySummary(summary);
    } catch {
      // Non-blocking
    }
  }, []);

  const fetchActivities = useCallback(async () => {
    setIsActivityLoading(true);
    setActivityError(null);
    try {
      let url = `/contact-activity?page=${activityPage}&pageSize=${activityPageSize}`;
      if (activityChannelFilter !== 'All') {
        url += `&channel=${encodeURIComponent(activityChannelFilter)}`;
      }
      const data = await apiClient.get<ContactActivityListResponse>(url);
      setActivities(data.items || []);
      setActivityTotalCount(data.totalCount || 0);
      setActivityTotalPages(data.totalPages || 1);
    } catch (err: any) {
      setActivityError(err.message || 'Failed to load contact activities.');
    } finally {
      setIsActivityLoading(false);
    }
  }, [activityPage, activityPageSize, activityChannelFilter]);

  useEffect(() => {
    fetchActivitySummary();
  }, [fetchActivitySummary]);

  useEffect(() => {
    if (activeMainTab === 'activity') {
      fetchActivities();
    }
  }, [activeMainTab, fetchActivities]);

  useEffect(() => {
    if (tabParam === 'activity' || tabParam === 'leads') {
      setActiveMainTab(tabParam);
    }
  }, [tabParam]);

  const handleTabSwitch = (tab: 'leads' | 'activity') => {
    setActiveMainTab(tab);
    router.replace(`/admin/leads?tab=${tab}`, { scroll: false });
  };

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

      toast.success(`Status updated to ${newStatus}.`);
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

      const created = await apiClient.post<Lead>('/leads', {
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
      toast.success('Lead created successfully.');
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
      toast.success('Lead updated successfully.');
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
      toast.success('Lead deleted successfully.');
      fetchLeads();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete lead.');
      toast.error(err.message || 'Failed to delete lead.');
    } finally {
      setIsDeleting(false);
    }
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            New
          </span>
        );
      case 'Contacted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            Contacted
          </span>
        );
      case 'Qualified':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
            Qualified
          </span>
        );
      case 'Closed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
            {status}
          </span>
        );
    }
  };

  const getSourceBadge = (source: string) => {
    const s = source?.toLowerCase() || '';
    if (s === 'whatsapp') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/60">
          WhatsApp
        </span>
      );
    }
    if (s === 'manual') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/60">
          Manual
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
        Website
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#172033] dark:text-white tracking-tight">
            {activeMainTab === 'leads' ? 'Customer Leads' : 'Contact Activity'}
          </h1>
          <p className="text-sm text-[#475569] dark:text-[#94A3B8] mt-1">
            {activeMainTab === 'leads'
              ? 'Review and manage customer enquiries captured through your website contact forms and verified channels.'
              : 'Monitor observable visitor clicks on WhatsApp templates, Facebook, and Instagram outbound links.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeMainTab === 'leads' ? (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 rounded-[6px]"
              >
                <Plus className="w-4 h-4" />
                <span>Add Lead</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchLeads}
                disabled={isLoading}
                className="flex items-center gap-1.5 rounded-[6px]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchActivities();
                fetchActivitySummary();
              }}
              disabled={isActivityLoading}
              className="flex items-center gap-1.5 rounded-[6px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isActivityLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Activity</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-[#CBD5E1] dark:border-[#1E293B] gap-6">
        <button
          type="button"
          onClick={() => handleTabSwitch('leads')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeMainTab === 'leads'
              ? 'border-[#315FEA] text-[#315FEA]'
              : 'border-transparent text-[#475569] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Customer Leads ({totalCount})</span>
        </button>
        <button
          type="button"
          onClick={() => handleTabSwitch('activity')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeMainTab === 'activity'
              ? 'border-[#315FEA] text-[#315FEA]'
              : 'border-transparent text-[#475569] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-white'
          }`}
        >
          <MousePointerClick className="w-4 h-4" />
          <span>Contact Activity ({activitySummary?.totalClicks ?? 0})</span>
        </button>
      </div>

      {/* TAB 1: CUSTOMER LEADS */}
      {activeMainTab === 'leads' && (
        <>
      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium shrink-0">Status:</span>
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Source Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium shrink-0">Source:</span>
            <select
              value={sourceFilter}
              onChange={e => {
                setSourceFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            >
              {SOURCE_OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium shrink-0">Sort:</span>
            <select
              value={sortOrder}
              onChange={e => {
                setSortOrder(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="updated">Recently updated</option>
              <option value="name">Customer name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {error ? (
        <ErrorState
          title="Could not load leads"
          error={error}
          onRetry={fetchLeads}
        />
      ) : isLoading && leads.length === 0 ? (
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-[#1E293B] text-slate-400 mb-4 animate-pulse">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Loading customer leads...
          </p>
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-8 sm:p-12 shadow-xs">
          <EmptyState
            icon={<Users className="w-8 h-8 text-slate-400" />}
            title={search || statusFilter !== 'All' || sourceFilter !== 'All' ? "No matching leads found" : "No leads yet"}
            description={
              search || statusFilter !== 'All' || sourceFilter !== 'All'
                ? "Try clearing or broadening your search and filter criteria."
                : "When customers submit enquiries through your website, they will appear here."
            }
          />
          {!search && statusFilter === 'All' && sourceFilter === 'All' && (
            <div className="mt-4 text-center">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Lead</span>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl shadow-xs overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-[#1E293B]/40 border-b border-slate-200 dark:border-[#1E293B] text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th scope="col" className="px-6 py-3.5">Customer</th>
                  <th scope="col" className="px-6 py-3.5">Phone / Contact</th>
                  <th scope="col" className="px-6 py-3.5">Area of Interest</th>
                  <th scope="col" className="px-6 py-3.5">Source</th>
                  <th scope="col" className="px-6 py-3.5">Status</th>
                  <th scope="col" className="px-6 py-3.5">Submitted</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B]">
                {leads.map(lead => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="hover:bg-slate-50/80 dark:hover:bg-[#1E293B]/30 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      <div>{lead.name}</div>
                      {lead.message && (
                        <div className="text-xs text-slate-400 font-normal truncate max-w-xs mt-0.5">
                          {lead.message}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                      <div>{lead.phone}</div>
                      {lead.email && (
                        <div className="text-xs text-slate-400 truncate max-w-xs">{lead.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {lead.areaOfInterest ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          {lead.areaOfInterest}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getSourceBadge(lead.source)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(lead.status)}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(lead.submittedAt)}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-2">
                        <select
                          value={lead.status}
                          onChange={e => handleStatusChange(lead.id, e.target.value)}
                          disabled={isUpdatingStatus}
                          className="py-1 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                          aria-label={`Update status for ${lead.name}`}
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Qualified">Qualified</option>
                          <option value="Closed">Closed</option>
                        </select>
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

          {/* Mobile Card Layout */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-[#1E293B]">
            {leads.map(lead => (
              <div
                key={lead.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedLead(lead)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedLead(lead);
                  }
                }}
                className="p-4 hover:bg-slate-50/60 dark:hover:bg-[#1E293B]/20 active:bg-slate-100 dark:active:bg-[#1E293B]/40 cursor-pointer space-y-3 touch-manipulation select-none"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                      {lead.name}
                    </h3>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {lead.phone}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {getStatusBadge(lead.status)}
                    {getSourceBadge(lead.source)}
                  </div>
                </div>

                {lead.areaOfInterest && (
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      {lead.areaOfInterest}
                    </span>
                  </div>
                )}

                {lead.message && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {lead.message}
                  </p>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-50 dark:border-slate-800">
                  <span>{formatDate(lead.submittedAt)}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[#3B82F6] font-medium">View details &rarr;</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-slate-100 dark:border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#0B1120]/50">
            <div className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{leads.length}</span> of{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">{totalCount}</span> total enquiries
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoading}
                className="flex items-center gap-1 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </Button>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isLoading}
                className="flex items-center gap-1 text-xs"
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

      {/* TAB 2: CONTACT ACTIVITY */}
      {activeMainTab === 'activity' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Informational Notice Banner */}
          <div className="p-4 rounded-[8px] bg-[#F3F6FA] dark:bg-[#0B1220] border border-[#CBD5E1] dark:border-[#1E293B] flex items-start gap-3">
            <Info className="w-5 h-5 text-[#315FEA] shrink-0 mt-0.5" />
            <div className="text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed">
              <strong className="text-[#172033] dark:text-white font-semibold">Strict Separation from Leads:</strong> Outbound Contact Activity records observable visitor link clicks on WhatsApp templates, Facebook profile, and Instagram profile. Clicking an outbound link is best-effort external engagement and does <span className="underline font-medium">not</span> prove that a message was sent or received. Genuine enquiries submitted via website forms appear under <strong>Customer Leads</strong>.
            </div>
          </div>

          {/* 4 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#0F172A] p-5 rounded-[8px] border border-[#CBD5E1] dark:border-[#1E293B] shadow-xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#475569] dark:text-[#94A3B8]">
                Total Outbound Clicks
              </p>
              <p className="text-2xl font-extrabold text-[#172033] dark:text-white mt-1">
                {activitySummary?.totalClicks ?? 0}
              </p>
              <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] mt-1">
                Across all external channels
              </p>
            </div>

            <div className="bg-white dark:bg-[#0F172A] p-5 rounded-[8px] border border-[#CBD5E1] dark:border-[#1E293B] shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#475569] dark:text-[#94A3B8]">
                  WhatsApp Clicks
                </p>
                <div className="w-6 h-6 rounded-[4px] bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800">
                  <MessageCircle className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {activitySummary?.whatsAppClicks ?? 0}
              </p>
              <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] mt-1">
                Template &amp; chat links
              </p>
            </div>

            <div className="bg-white dark:bg-[#0F172A] p-5 rounded-[8px] border border-[#CBD5E1] dark:border-[#1E293B] shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#475569] dark:text-[#94A3B8]">
                  Facebook Clicks
                </p>
                <div className="w-6 h-6 rounded-[4px] bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 dark:bg-blue-950/40 dark:border-blue-800">
                  <Facebook className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                {activitySummary?.facebookClicks ?? 0}
              </p>
              <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] mt-1">
                Profile page visits
              </p>
            </div>

            <div className="bg-white dark:bg-[#0F172A] p-5 rounded-[8px] border border-[#CBD5E1] dark:border-[#1E293B] shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#475569] dark:text-[#94A3B8]">
                  Instagram Clicks
                </p>
                <div className="w-6 h-6 rounded-[4px] bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-200 dark:bg-pink-950/40 dark:border-pink-800">
                  <Instagram className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-pink-600 dark:text-pink-400 mt-1">
                {activitySummary?.instagramClicks ?? 0}
              </p>
              <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] mt-1">
                Profile page visits
              </p>
            </div>
          </div>

          {/* Channel Filter & Refresh Bar */}
          <div className="bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] rounded-[8px] p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[#475569] dark:text-[#94A3B8] mr-1">
                Filter Channel:
              </span>
              {(['All', 'WhatsApp', 'Facebook', 'Instagram'] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => {
                    setActivityChannelFilter(ch);
                    setActivityPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors border ${
                    activityChannelFilter === ch
                      ? 'bg-[#315FEA] text-white border-[#315FEA]'
                      : 'bg-white dark:bg-[#0B1220] text-[#475569] dark:text-[#94A3B8] border-[#CBD5E1] dark:border-[#334155] hover:bg-[#F3F6FA] dark:hover:bg-[#1E293B]'
                  }`}
                >
                  {ch}
                  <span className="ml-1.5 text-[10px] opacity-80">
                    {ch === 'All'
                      ? `(${activitySummary?.totalClicks ?? 0})`
                      : ch === 'WhatsApp'
                      ? `(${activitySummary?.whatsAppClicks ?? 0})`
                      : ch === 'Facebook'
                      ? `(${activitySummary?.facebookClicks ?? 0})`
                      : `(${activitySummary?.instagramClicks ?? 0})`}
                  </span>
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchActivities();
                fetchActivitySummary();
              }}
              disabled={isActivityLoading}
              className="flex items-center gap-1.5 rounded-[6px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isActivityLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>

          {/* Activities Table */}
          {isActivityLoading && activities.length === 0 ? (
            <div className="bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] rounded-[8px] p-12 text-center text-xs text-[#475569] dark:text-[#94A3B8]">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#315FEA] mb-2" />
              Loading contact activity logs...
            </div>
          ) : activityError ? (
            <ErrorState
              title="Failed to Load Activities"
              error={activityError}
              onRetry={fetchActivities}
            />
          ) : activities.length === 0 ? (
            <div className="bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] rounded-[8px] p-12 text-center">
              <MousePointerClick className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-[#172033] dark:text-white">
                No Contact Activity Logged Yet
              </h3>
              <p className="text-xs text-[#475569] dark:text-[#94A3B8] mt-1 max-w-md mx-auto">
                When visitors click WhatsApp templates or social links on your live website, events will be recorded here in real time.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#1E293B] rounded-[8px] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F3F6FA] dark:bg-[#0B1220] border-b border-[#E3E7ED] dark:border-[#1E293B] text-[#475569] dark:text-[#94A3B8] uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4 font-semibold">Timestamp</th>
                      <th className="py-3 px-4 font-semibold">Channel</th>
                      <th className="py-3 px-4 font-semibold">Action / Event</th>
                      <th className="py-3 px-4 font-semibold">Target / Template</th>
                      <th className="py-3 px-4 font-semibold">Source Page</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E3E7ED] dark:divide-[#1E293B]">
                    {activities.map((act) => {
                      const isWa = act.channel === 'WhatsApp';
                      const isFb = act.channel === 'Facebook';
                      const isIg = act.channel === 'Instagram';

                      return (
                        <tr
                          key={act.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-[#1E293B]/30 transition-colors"
                        >
                          <td className="py-3 px-4 text-[#172033] dark:text-white font-mono whitespace-nowrap">
                            {formatDate(act.createdAt)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-[11px] font-semibold border ${
                              isWa
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                : isFb
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                                : 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400 border-pink-200 dark:border-pink-800'
                            }`}>
                              {isWa && <MessageCircle className="w-3 h-3 text-emerald-600" />}
                              {isFb && <Facebook className="w-3 h-3 text-blue-600" />}
                              {isIg && <Instagram className="w-3 h-3 text-pink-600" />}
                              <span>{act.channel}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#475569] dark:text-[#94A3B8] font-medium whitespace-nowrap">
                            <span className="inline-flex items-center gap-1">
                              <MousePointerClick className="w-3 h-3 text-slate-400" />
                              <span>{act.eventType || 'ContactLinkClicked'}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#172033] dark:text-white font-semibold">
                            {act.templateTitle
                              ? act.templateTitle
                              : isWa
                              ? 'Direct WhatsApp Chat'
                              : isFb
                              ? 'Facebook Profile Link'
                              : 'Instagram Profile Link'}
                          </td>
                          <td className="py-3 px-4 text-[#475569] dark:text-[#94A3B8] font-mono text-[11px]">
                            {act.source || 'Website'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Activity Pagination */}
              {activityTotalPages > 1 && (
                <div className="p-4 border-t border-[#E3E7ED] dark:border-[#1E293B] flex items-center justify-between text-xs text-[#475569] dark:text-[#94A3B8]">
                  <span>
                    Showing {activities.length} of {activityTotalCount} events
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                      disabled={activityPage <= 1}
                      className="rounded-[6px]"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                    <span className="px-2 font-medium">
                      Page {activityPage} of {activityTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActivityPage((p) => Math.min(activityTotalPages, p + 1))}
                      disabled={activityPage >= activityTotalPages}
                      className="rounded-[6px]"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Lead Detail Modal / Panel */}
      <Modal
        isOpen={!!selectedLead && !isEditModalOpen}
        onClose={() => {
          setSelectedLead(null);
          setStatusUpdateError(null);
        }}
        title="Lead Details"
        description="Review customer information and take operational actions."
        maxWidth="lg"
        footer={
          selectedLead && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {selectedLead.phone && (
                  <a
                    href={`tel:${selectedLead.phone}`}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                )}
                {selectedLead.phone && (
                  <a
                    href={`https://wa.me/${selectedLead.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}
                {selectedLead.email && (
                  <a
                    href={`mailto:${selectedLead.email}`}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email</span>
                  </a>
                )}
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(selectedLead)}
                  className="flex items-center gap-1 text-xs"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="destructive-outline"
                  size="sm"
                  onClick={() => setLeadToDelete(selectedLead)}
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  Delete
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Status:</span>
                <select
                  value={selectedLead.status}
                  onChange={e => handleStatusChange(selectedLead.id, e.target.value)}
                  disabled={isUpdatingStatus}
                  className="py-1.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>
          )
        }
      >
        {selectedLead && (
          <div className="space-y-5">
            {statusUpdateError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{statusUpdateError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1E293B]/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Customer Name
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {selectedLead.name}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1E293B]/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Phone Number
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {selectedLead.phone}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1E293B]/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Email Address
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {selectedLead.email || 'Not provided'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1E293B]/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Area of Interest
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {selectedLead.areaOfInterest || 'Not specified'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1E293B]/40 border border-slate-100 dark:border-slate-800 sm:col-span-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Channel / Source
                </span>
                <div className="mt-1 flex items-center gap-2">
                  {getSourceBadge(selectedLead.source)}
                  {getStatusBadge(selectedLead.status)}
                </div>
              </div>
            </div>

            {/* Message Details */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1E293B]/40 border border-slate-100 dark:border-slate-800 space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Customer Inquiry / Requirements
              </span>
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {selectedLead.message || 'No project message provided.'}
              </p>
            </div>

            {/* Metadata & Timestamps */}
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

      {/* Manual Add Lead Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setAddError(null);
        }}
        title="Add Customer Lead"
        description="Enter customer enquiry details manually into your workspace."
        maxWidth="md"
      >
        <form onSubmit={handleCreateLead} className="space-y-4">
          {addError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
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
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
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
              <div className="flex items-stretch w-full rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#1E293B]/50 focus-within:ring-2 focus-within:ring-[#3B82F6]">
                <div
                  aria-hidden="true"
                  className="flex items-center justify-center px-3 py-2 bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-slate-300 font-semibold text-xs select-none rounded-l-xl border-r border-slate-200 dark:border-[#334155]"
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
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
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
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
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
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
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
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
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
              placeholder="Enter customer enquiry message or requirements..."
              value={addForm.message}
              onChange={e => setAddForm({ ...addForm, message: e.target.value })}
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1E293B]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isAddingLead}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isAddingLead}
            >
              {isAddingLead ? 'Saving...' : 'Save Lead'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Manual Edit Lead Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditError(null);
        }}
        title="Edit Customer Lead"
        description="Update customer contact information or enquiry message."
        maxWidth="md"
      >
        <form onSubmit={handleUpdateLead} className="space-y-4">
          {editError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
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
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
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
              <div className="flex items-stretch w-full rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#1E293B]/50 focus-within:ring-2 focus-within:ring-[#3B82F6]">
                <div
                  aria-hidden="true"
                  className="flex items-center justify-center px-3 py-2 bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-slate-300 font-semibold text-xs select-none rounded-l-xl border-r border-slate-200 dark:border-[#334155]"
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
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
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
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
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
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
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
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1E293B]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isEditingLead}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isEditingLead}
            >
              {isEditingLead ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
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
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          {leadToDelete && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <p className="font-semibold text-slate-900 dark:text-white">{leadToDelete.name}</p>
              <p className="text-slate-500">{leadToDelete.phone}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1E293B]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLeadToDelete(null)}
              disabled={isDeleting}
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
            >
              Delete Lead
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
