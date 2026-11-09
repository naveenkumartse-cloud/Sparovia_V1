'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Phone,
  Mail,
  Clock,
  Pencil,
  Trash2,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Lead,
  formatDate,
  formatRelativeTime,
  getCleanEnquiryMessage,
  getInitials,
} from './LeadTypes';

interface LeadCardProps {
  lead: Lead;
  onSelect: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  copiedPhoneId: string | null;
  onCopyPhone: (id: string, phone: string, e: React.MouseEvent) => void;
}

export function LeadCard({
  lead,
  onSelect,
  onEdit,
  onDelete,
  copiedPhoneId,
  onCopyPhone,
}: LeadCardProps) {
  const cleanPhoneDigits = lead.phone.replace(/[^0-9]/g, '');
  const cleanMessage = getCleanEnquiryMessage(lead.message);

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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18 }}
      className="h-full"
    >
      <Card
        variant="interactive"
        onClick={() => onSelect(lead)}
        className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-3.5 transition-all duration-200 border-slate-200/90 dark:border-slate-800 hover:border-[#7950B8]/40 dark:hover:border-[#7950B8]/40 shadow-soft-xs hover:shadow-soft-sm bg-white dark:bg-[#0F172A]"
      >
        <div className="space-y-3">
          {/* Top Row: Customer Initials Avatar, Name, Relative Timestamp & Status Badge */}
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-9 h-9 rounded-[6px] bg-[#F0EAFE] dark:bg-[#7950B8]/20 text-[#7950B8] dark:text-[#A78BFA] font-bold text-xs flex items-center justify-center shrink-0 border border-[#7950B8]/20"
                aria-hidden="true"
              >
                {getInitials(lead.name)}
              </div>
              <div className="min-w-0">
                <h3
                  className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base truncate leading-snug"
                  title={lead.name}
                >
                  {lead.name}
                </h3>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  <Clock className="w-3 h-3 shrink-0 text-slate-400" />
                  <span title={formatDate(lead.submittedAt)}>
                    {formatRelativeTime(lead.submittedAt)}
                  </span>
                </div>
              </div>
            </div>
            <div className="shrink-0">{getStatusBadge(lead.status)}</div>
          </div>

          {/* Contact Details: Phone with Copy Button & Optional Email */}
          <div
            className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 pt-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-medium min-w-0">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <a
                  href={`tel:${lead.phone}`}
                  className="hover:text-[#315FEA] hover:underline truncate font-mono text-[11px] sm:text-xs"
                  title={`Call ${lead.phone}`}
                >
                  {lead.phone}
                </a>
                <button
                  type="button"
                  onClick={(e) => onCopyPhone(lead.id, lead.phone, e)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0"
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
              <Badge variant="warning" size="xs">
                {lead.areaOfInterest}
              </Badge>
            )}
          </div>

          {/* Enquiry Message Preview */}
          {cleanMessage ? (
            <div className="p-2.5 rounded-[6px] bg-[#F8FAFC] dark:bg-[#1E293B]/40 border border-[#E2E8F0] dark:border-[#334155]/60 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
              {cleanMessage}
            </div>
          ) : (
            <div className="p-2.5 rounded-[6px] bg-slate-50 dark:bg-[#1E293B]/20 border border-dashed border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 italic">
              No project details provided
            </div>
          )}
        </div>

        {/* Card Action Footer: Quick communication on left, management on right */}
        <div
          className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Communication Links */}
          <div className="flex items-center gap-1.5">
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="h-8 min-h-[32px] px-2.5 inline-flex items-center gap-1.5 rounded-[6px] text-xs font-semibold bg-[#15803D]/10 hover:bg-[#15803D]/20 text-[#15803D] dark:text-emerald-400 transition-colors focus:ring-2 focus:ring-[#15803D]/40"
                title={`Call ${lead.name}`}
                aria-label={`Call ${lead.name}`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call</span>
              </a>
            )}
            {lead.phone && (
              <a
                href={`https://wa.me/${cleanPhoneDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 min-h-[32px] px-2.5 inline-flex items-center gap-1.5 rounded-[6px] text-xs font-semibold bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] dark:text-[#25D366] transition-colors focus:ring-2 focus:ring-[#25D366]/40"
                title={`WhatsApp ${lead.name}`}
                aria-label={`WhatsApp ${lead.name}`}
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                <span>WhatsApp</span>
              </a>
            )}
          </div>

          {/* Management Actions */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSelect(lead)}
              className="h-8 min-h-[32px] px-2.5 inline-flex items-center rounded-[6px] text-xs font-semibold text-[#7950B8] hover:text-[#6820AB] hover:bg-[#F0EAFE] dark:hover:bg-[#7950B8]/20 transition-colors"
              title="View lead details"
              aria-label={`View details for ${lead.name}`}
            >
              Details
            </button>
            <button
              type="button"
              onClick={() => onEdit(lead)}
              className="h-8 w-8 min-h-[32px] min-w-[32px] inline-flex items-center justify-center rounded-[6px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Edit lead"
              aria-label={`Edit ${lead.name}`}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(lead)}
              className="h-8 w-8 min-h-[32px] min-w-[32px] inline-flex items-center justify-center rounded-[6px] text-slate-400 hover:text-[#B91C1C] hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              title="Delete lead"
              aria-label={`Delete ${lead.name}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
