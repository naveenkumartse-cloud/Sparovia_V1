'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  RefreshCw, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  ArrowUpDown, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/api/client';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  source: string;
  status: 'New' | 'Contacted' | 'Closed' | string;
  externalReference: string | null;
  submittedAt: string;
  updatedAt: string;
}

interface LeadListResponse {
  items: Lead[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const STATUS_OPTIONS = ['All', 'New', 'Contacted', 'Closed'] as const;
const SOURCE_OPTIONS = ['All', 'Website', 'WhatsApp'] as const;

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

  // Selected Lead for detail view
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);

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

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    if (isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    setStatusUpdateError(null);

    try {
      const updated = await apiClient.fetch<Lead>(`/leads/${leadId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });

      // Update state locally
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
    if (source.toLowerCase() === 'whatsapp') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/60">
          WhatsApp
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
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Customer Leads
          </h1>
          <p className="text-sm text-slate-500 dark:text-[#94A3B8] mt-1">
            Review customer enquiries and project requests captured through your website and channels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLeads}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

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
                      {getSourceBadge(lead.source)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(lead.status)}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(lead.submittedAt)}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                      <select
                        value={lead.status}
                        onChange={e => handleStatusChange(lead.id, e.target.value)}
                        disabled={isUpdatingStatus}
                        className="py-1 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                        aria-label={`Update status for ${lead.name}`}
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Closed">Closed</option>
                      </select>
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
                onClick={() => setSelectedLead(lead)}
                className="p-4 hover:bg-slate-50/60 dark:hover:bg-[#1E293B]/20 cursor-pointer space-y-3"
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

                {lead.message && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {lead.message}
                  </p>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-50 dark:border-slate-800">
                  <span>{formatDate(lead.submittedAt)}</span>
                  <span className="text-[#3B82F6] font-medium">View details &rarr;</span>
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

      {/* Lead Detail Modal / Panel */}
      <Modal
        isOpen={!!selectedLead}
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
              <div className="flex items-center gap-2">
                {selectedLead.phone && (
                  <a
                    href={`tel:${selectedLead.phone}`}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Customer</span>
                  </a>
                )}
                {selectedLead.email && (
                  <a
                    href={`mailto:${selectedLead.email}`}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email Customer</span>
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Update Status:</span>
                <select
                  value={selectedLead.status}
                  onChange={e => handleStatusChange(selectedLead.id, e.target.value)}
                  disabled={isUpdatingStatus}
                  className="py-1.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
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
              {selectedLead.externalReference && (
                <span className="font-mono text-[10px]">
                  Ref: {selectedLead.externalReference}
                </span>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
