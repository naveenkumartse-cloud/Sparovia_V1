'use client';

import React from 'react';
import {
  Phone,
  MessageCircle,
  Pencil,
  Trash2,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Lead,
  formatDate,
  formatRelativeTime,
  getCleanEnquiryMessage,
  getInitials,
  PAGE_SIZE_OPTIONS,
} from './LeadTypes';

interface LeadTableViewProps {
  leads: Lead[];
  onSelect: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onStatusChange: (leadId: string, newStatus: string) => void;
  isUpdatingStatus: boolean;
  copiedPhoneId: string | null;
  onCopyPhone: (id: string, phone: string, e: React.MouseEvent) => void;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  isLoading: boolean;
}

export function LeadTableView({
  leads,
  onSelect,
  onEdit,
  onDelete,
  onStatusChange,
  isUpdatingStatus,
  copiedPhoneId,
  onCopyPhone,
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isLoading,
}: LeadTableViewProps) {
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
          <Badge variant="cobalt" size="sm" dot>
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

  return (
    <div className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-[8px] shadow-soft-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-[#F8FAFC] dark:bg-[#1E293B]/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
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
            {leads.map((lead) => {
              const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
              const cleanMsg = getCleanEnquiryMessage(lead.message);

              return (
                <tr
                  key={lead.id}
                  onClick={() => onSelect(lead)}
                  className="hover:bg-slate-50/80 dark:hover:bg-[#1E293B]/30 cursor-pointer transition-colors group"
                >
                  {/* Customer column */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-[6px] bg-[#F0EAFE] dark:bg-[#7950B8]/20 text-[#7950B8] dark:text-[#A78BFA] font-bold text-xs flex items-center justify-center shrink-0 border border-[#7950B8]/20"
                        aria-hidden="true"
                      >
                        {getInitials(lead.name)}
                      </div>
                      <div className="min-w-0 max-w-xs">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">
                            {lead.name}
                          </p>
                          <span
                            className="text-[11px] text-slate-400 shrink-0"
                            title={formatDate(lead.submittedAt)}
                          >
                            • {formatRelativeTime(lead.submittedAt)}
                          </span>
                        </div>
                        {cleanMsg && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-normal truncate mt-0.5">
                            {cleanMsg}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Contact details column */}
                  <td
                    className="px-4 py-3 text-slate-700 dark:text-slate-300"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="truncate font-mono text-xs">{lead.phone}</span>
                      <button
                        type="button"
                        onClick={(e) => onCopyPhone(lead.id, lead.phone, e)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                        title="Copy phone number"
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
                      <Badge variant="warning" size="xs">
                        {lead.areaOfInterest}
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>

                  {/* Source Channel */}
                  <td className="px-3 py-3">{getSourceBadge(lead.source)}</td>

                  {/* Status Dropdown */}
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(lead.status)}
                      <select
                        value={lead.status}
                        onChange={(e) => onStatusChange(lead.id, e.target.value)}
                        disabled={isUpdatingStatus}
                        className="py-1 px-1.5 text-xs rounded-[4px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-[#7950B8] opacity-70 group-hover:opacity-100 transition-opacity"
                        aria-label={`Update pipeline status for ${lead.name}`}
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Qualified">Qualified</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>
                  </td>

                  {/* Actions Column */}
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
                          href={`https://wa.me/${cleanPhone}`}
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
                        onClick={() => onEdit(lead)}
                        title="Edit lead"
                        aria-label={`Edit ${lead.name}`}
                        className="p-1.5 rounded-[4px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(lead)}
                        title="Delete lead"
                        aria-label={`Delete ${lead.name}`}
                        className="p-1.5 rounded-[4px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Pagination Bar */}
      <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#0B1120]/50 text-xs">
        <div className="flex items-center gap-3 text-slate-500">
          <span>
            Showing <strong className="text-slate-700 dark:text-slate-300">{leads.length}</strong> of{' '}
            <strong className="text-slate-700 dark:text-slate-300">{totalCount}</strong> total
          </span>
          <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 dark:border-slate-700 pl-3">
            <span>Page size:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="py-1 px-1.5 rounded-[4px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-xs font-semibold"
              aria-label="Table page size"
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
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1 || isLoading}
            className="flex items-center gap-1 text-xs rounded-[6px]"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </Button>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 px-2">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages || isLoading}
            className="flex items-center gap-1 text-xs rounded-[6px]"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
