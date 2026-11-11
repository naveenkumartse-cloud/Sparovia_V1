'use client';

import React, { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import {
  Users,
  RefreshCw,
  Plus,
  Download,
  LayoutGrid,
  List,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { toast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/api/client';

import {
  Lead,
  LeadFollowUp,
  TenantWorkCategory,
  LeadListResponse,
  LeadStatus,
  LeadSource,
  SortOption,
  PAGE_SIZE_OPTIONS,
} from '@/components/leads/LeadTypes';
import { StatusSummaryCards, StatusCounts } from '@/components/leads/StatusSummaryCards';
import { LeadsToolbar } from '@/components/leads/LeadsToolbar';
import { LeadCard } from '@/components/leads/LeadCard';
import { LeadTableView } from '@/components/leads/LeadTableView';
import { LeadDetailModal } from '@/components/leads/LeadDetailModal';
import { AddLeadModal } from '@/components/leads/AddLeadModal';
import { EditLeadModal } from '@/components/leads/EditLeadModal';

function CustomerLeadsContent() {
  // Query parameters state
  const [leadsPage, setLeadsPage] = useState(1);
  const [leadsPageSize, setLeadsPageSize] = useState<number>(12);
  const [leadsSearch, setLeadsSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(leadsSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [leadsSearch]);

  const [statusFilter, setStatusFilter] = useState<LeadStatus>('All');
  const [sourceFilter, setSourceFilter] = useState<LeadSource>('All');
  const [sortOrder, setSortOrder] = useState<SortOption>('newest');

  // Presentation Mode: Card-first as primary presentation
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Leads Data state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsTotalCount, setLeadsTotalCount] = useState(0);
  const [leadsTotalPages, setLeadsTotalPages] = useState(1);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [leadsError, setLeadsError] = useState<string | null>(null);

  // Tenant Work Categories for area of interest selection
  const [tenantCategories, setTenantCategories] = useState<TenantWorkCategory[]>([]);

  // Selected Lead for detail view
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);

  // Follow-ups state for selected lead
  const [followUps, setFollowUps] = useState<LeadFollowUp[]>([]);
  const [followUpsLoading, setFollowUpsLoading] = useState(false);
  const [followUpsError, setFollowUpsError] = useState<string | null>(null);
  const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);

  // Copied feedback state
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  // Add Lead Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddingLead, setIsAddingLead] = useState(false);

  // Edit Lead Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);
  const [isEditingLead, setIsEditingLead] = useState(false);

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

      if (debouncedSearch.trim()) {
        queryParams.set('search', debouncedSearch.trim());
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
  }, [leadsPage, leadsPageSize, debouncedSearch, statusFilter, sourceFilter, sortOrder]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res: any = await apiClient.get('/website/categories');
        const list = Array.isArray(res) ? res : res?.data || [];
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
    } else {
      setFollowUps([]);
      setFollowUpsError(null);
    }
  }, [selectedLead?.id, fetchFollowUps]);

  // Compute live status summary counts
  const statusCounts: StatusCounts = useMemo(() => {
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

      toast.success(`Enquiry status updated to ${newStatus}.`);
    } catch (err: any) {
      const msg = err.message || 'Failed to update status. Please try again.';
      setStatusUpdateError(msg);
      toast.error(msg);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCreateLead = async (data: {
    name: string;
    phone: string;
    email: string | null;
    message: string;
    areaOfInterest: string | null;
    areaOfInterestCategoryId: string | null;
    source: string;
    status: string;
  }) => {
    setIsAddingLead(true);
    try {
      await apiClient.post<Lead>('/leads', data);
      setIsAddModalOpen(false);
      toast.success('Customer lead created successfully.');
      fetchLeads();
    } catch (err: any) {
      throw err;
    } finally {
      setIsAddingLead(false);
    }
  };

  const handleUpdateLead = async (
    leadId: string,
    data: {
      name: string;
      phone: string;
      email: string | null;
      message: string;
      areaOfInterest: string | null;
      areaOfInterestCategoryId: string | null;
      status: string;
    }
  ) => {
    setIsEditingLead(true);
    try {
      const updated = await apiClient.put<Lead>(`/leads/${leadId}`, data);
      setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead(updated);
      }
      setIsEditModalOpen(false);
      setLeadToEdit(null);
      toast.success('Customer lead updated successfully.');
    } catch (err: any) {
      throw err;
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

  const handleRecordFollowUp = async (payload: {
    followedUpAt: string;
    method: string;
    notes: string;
    nextAction?: string | null;
    nextFollowUpAt?: string | null;
  }) => {
    if (!selectedLead || isSubmittingFollowUp) return;
    setIsSubmittingFollowUp(true);

    try {
      const created = await apiClient.fetch<LeadFollowUp>(
        `/leads/${selectedLead.id}/follow-ups`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      setFollowUps((prev) => [created, ...prev]);
      toast.success('Follow-up interaction recorded successfully.');
    } catch (err: any) {
      throw err;
    } finally {
      setIsSubmittingFollowUp(false);
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
      toast.error('No customer leads available to export.');
      return;
    }

    const headers = [
      'ID',
      'Customer Name',
      'Phone Number',
      'Email',
      'Status',
      'Source Channel',
      'Area of Interest',
      'Submitted At',
      'Customer Requirements',
    ];

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

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `sparovia-leads-${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Leads exported successfully.');
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
      {/* 1. Standardized Canonical PageHeader */}
      <PageHeader
        category="Customer Inquiries"
        title="Customer Leads"
        description="Manage customer enquiries and keep track of every conversation."
        badge={
          <Badge variant="purple" size="sm">
            {leadsTotalCount} Total
          </Badge>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle: Cards (Primary) vs Table */}
            <div
              className="flex items-center bg-[#F3F6FA] dark:bg-[#1E293B] p-0.5 rounded-[6px] border border-[#E3E7ED] dark:border-[#334155]"
              role="group"
              aria-label="View presentation mode"
            >
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-[4px] text-xs font-medium transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-[#0F172A] text-[#172033] dark:text-white shadow-soft-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Card view (primary)"
                aria-label="Card view"
                aria-pressed={viewMode === 'cards'}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-[4px] text-xs font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-[#0F172A] text-[#172033] dark:text-white shadow-soft-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Table view"
                aria-label="Table view"
                aria-pressed={viewMode === 'table'}
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
              leftIcon={
                <RefreshCw
                  className={`w-3.5 h-3.5 ${leadsLoading ? 'animate-spin' : ''}`}
                />
              }
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
        }
      />

      {/* 2. Interactive Status Metric Filter Cards (With live counts, semantics, and hover/press feedback) */}
      <StatusSummaryCards
        selectedStatus={statusFilter}
        onSelectStatus={(status) => {
          setStatusFilter(status);
          setLeadsPage(1);
        }}
        counts={statusCounts}
        isLoading={leadsLoading && leads.length === 0}
      />

      {/* 3. Filter, Search, and Sort Toolbar */}
      <LeadsToolbar
        search={leadsSearch}
        onSearchChange={(val) => {
          setLeadsSearch(val);
          setLeadsPage(1);
        }}
        onClearSearch={() => {
          setLeadsSearch('');
          setLeadsPage(1);
        }}
        sourceFilter={sourceFilter}
        onSourceFilterChange={(src) => {
          setSourceFilter(src);
          setLeadsPage(1);
        }}
        sortOrder={sortOrder}
        onSortOrderChange={(sort) => {
          setSortOrder(sort);
          setLeadsPage(1);
        }}
        statusFilter={statusFilter}
        onStatusFilterReset={() => {
          setStatusFilter('All');
          setLeadsPage(1);
        }}
        onResetAll={resetAllFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* 4. Leads Main Content Area */}
      {leadsError ? (
        <ErrorState
          title="Could not load customer leads"
          error={leadsError}
          onRetry={fetchLeads}
        />
      ) : leadsLoading && leads.length === 0 ? (
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-[8px] p-12 text-center shadow-soft-xs">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[6px] bg-[#F0EAFE] text-[#7950B8] mb-4 animate-pulse">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Loading customer leads...
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Retrieving enquiry pipeline data
          </p>
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-[8px] p-8 sm:p-12 shadow-soft-xs">
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
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add First Lead Manually
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
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onSelect={(l) => setSelectedLead(l)}
                    onEdit={(l) => {
                      setLeadToEdit(l);
                      setIsEditModalOpen(true);
                    }}
                    onDelete={(l) => setLeadToDelete(l)}
                    copiedPhoneId={copiedPhoneId}
                    onCopyPhone={handleCopyPhone}
                  />
                ))}
              </div>

              {/* Cards Pagination Bar */}
              <div className="p-3.5 bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-[8px] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-soft-xs">
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
                      aria-label="Cards page size"
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
                    Prev
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
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* SECONDARY VIEW: COMPACT DESKTOP TABLE VIEW */}
          {viewMode === 'table' && (
            <LeadTableView
              leads={leads}
              onSelect={(l) => setSelectedLead(l)}
              onEdit={(l) => {
                setLeadToEdit(l);
                setIsEditModalOpen(true);
              }}
              onDelete={(l) => setLeadToDelete(l)}
              onStatusChange={handleStatusChange}
              isUpdatingStatus={isUpdatingStatus}
              copiedPhoneId={copiedPhoneId}
              onCopyPhone={handleCopyPhone}
              currentPage={leadsPage}
              totalPages={leadsTotalPages}
              totalCount={leadsTotalCount}
              pageSize={leadsPageSize}
              onPageChange={setLeadsPage}
              onPageSizeChange={(size) => {
                setLeadsPageSize(size);
                setLeadsPage(1);
              }}
              isLoading={leadsLoading}
            />
          )}
        </>
      )}

      {/* 5. Modern Customer Lead Detail Modal */}
      <LeadDetailModal
        lead={selectedLead}
        isOpen={Boolean(selectedLead && !isEditModalOpen && !leadToDelete)}
        onClose={() => {
          setSelectedLead(null);
          setStatusUpdateError(null);
        }}
        onStatusChange={handleStatusChange}
        isUpdatingStatus={isUpdatingStatus}
        statusUpdateError={statusUpdateError}
        onOpenEdit={(l) => {
          setLeadToEdit(l);
          setIsEditModalOpen(true);
        }}
        onOpenDelete={(l) => setLeadToDelete(l)}
        copiedPhoneId={copiedPhoneId}
        onCopyPhone={handleCopyPhone}
        followUps={followUps}
        followUpsLoading={followUpsLoading}
        followUpsError={followUpsError}
        onRefreshFollowUps={fetchFollowUps}
        onRecordFollowUp={handleRecordFollowUp}
        isSubmittingFollowUp={isSubmittingFollowUp}
      />

      {/* 6. Add Customer Lead Modal */}
      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        categories={tenantCategories}
        onSubmit={handleCreateLead}
        isLoading={isAddingLead}
      />

      {/* 7. Edit Customer Lead Modal */}
      <EditLeadModal
        lead={leadToEdit}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setLeadToEdit(null);
        }}
        categories={tenantCategories}
        onSubmit={handleUpdateLead}
        isLoading={isEditingLead}
      />

      {/* 8. Standardized Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(leadToDelete)}
        onClose={() => {
          setLeadToDelete(null);
          setDeleteError(null);
        }}
        onConfirm={handleDeleteLead}
        title="Delete Customer Lead"
        description="Are you sure you want to delete this enquiry? This action cannot be undone."
        confirmLabel="Delete Lead"
        cancelLabel="Cancel"
        variant="destructive"
        isLoading={isDeleting}
        loadingText="Deleting..."
      >
        <div className="space-y-3">
          {deleteError && (
            <div className="p-3 rounded-[6px] bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          {leadToDelete && (
            <div className="p-3.5 rounded-[6px] bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
              <p className="font-bold text-slate-900 dark:text-white">
                {leadToDelete.name}
              </p>
              <p className="text-slate-500 font-mono">{leadToDelete.phone}</p>
              {leadToDelete.areaOfInterest && (
                <p className="text-slate-400 text-[11px]">
                  Area: {leadToDelete.areaOfInterest}
                </p>
              )}
            </div>
          )}
        </div>
      </ConfirmationDialog>
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
