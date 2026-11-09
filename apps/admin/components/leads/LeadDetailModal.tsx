'use client';

import React, { useState } from 'react';
import {
  Phone,
  Mail,
  Clock,
  MessageSquare,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  MessageCircle,
  Copy,
  Check,
  CheckCircle2,
  Calendar,
  RefreshCw,
  X,
  Sparkles,
  PhoneCall,
  Award,
  CheckCheck,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
  Lead,
  LeadFollowUp,
  formatDate,
  formatRelativeTime,
  getCleanEnquiryMessage,
  getInitials,
  STATUS_DEFINITIONS,
} from './LeadTypes';

interface LeadDetailModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (leadId: string, newStatus: string) => Promise<void>;
  isUpdatingStatus: boolean;
  statusUpdateError: string | null;
  onOpenEdit: (lead: Lead) => void;
  onOpenDelete: (lead: Lead) => void;
  copiedPhoneId: string | null;
  onCopyPhone: (id: string, phone: string, e: React.MouseEvent) => void;
  followUps: LeadFollowUp[];
  followUpsLoading: boolean;
  followUpsError: string | null;
  onRefreshFollowUps: (leadId: string) => void;
  onRecordFollowUp: (payload: {
    followedUpAt: string;
    method: string;
    notes: string;
    nextAction?: string | null;
    nextFollowUpAt?: string | null;
  }) => Promise<void>;
  isSubmittingFollowUp: boolean;
}

export function LeadDetailModal({
  lead,
  isOpen,
  onClose,
  onStatusChange,
  isUpdatingStatus,
  statusUpdateError,
  onOpenEdit,
  onOpenDelete,
  copiedPhoneId,
  onCopyPhone,
  followUps,
  followUpsLoading,
  followUpsError,
  onRefreshFollowUps,
  onRecordFollowUp,
  isSubmittingFollowUp,
}: LeadDetailModalProps) {
  const [isRecordingFollowUp, setIsRecordingFollowUp] = useState(false);
  const [followUpSubmitError, setFollowUpSubmitError] = useState<string | null>(null);

  const getInitialDateTime = () => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const [followUpForm, setFollowUpForm] = useState({
    followedUpAt: getInitialDateTime(),
    method: 'Call',
    notes: '',
    nextAction: '',
    nextFollowUpAt: '',
  });

  if (!lead) return null;

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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNotes = followUpForm.notes.trim();
    if (!trimmedNotes) {
      setFollowUpSubmitError('Please enter conversation notes.');
      return;
    }
    if (trimmedNotes.length > 4000) {
      setFollowUpSubmitError('Notes must not exceed 4000 characters.');
      return;
    }

    setFollowUpSubmitError(null);
    try {
      await onRecordFollowUp({
        followedUpAt: followUpForm.followedUpAt
          ? new Date(followUpForm.followedUpAt).toISOString()
          : new Date().toISOString(),
        method: followUpForm.method,
        notes: trimmedNotes,
        nextAction: followUpForm.nextAction.trim() || null,
        nextFollowUpAt: followUpForm.nextFollowUpAt
          ? new Date(followUpForm.nextFollowUpAt).toISOString()
          : null,
      });

      setFollowUpForm({
        followedUpAt: getInitialDateTime(),
        method: 'Call',
        notes: '',
        nextAction: '',
        nextFollowUpAt: '',
      });
      setIsRecordingFollowUp(false);
    } catch (err: any) {
      setFollowUpSubmitError(err.message || 'Failed to record follow-up.');
    }
  };

  const pipelineStages: Array<'New' | 'Contacted' | 'Qualified' | 'Closed'> = [
    'New',
    'Contacted',
    'Qualified',
    'Closed',
  ];

  const currentStatusMeta = STATUS_DEFINITIONS[lead.status as 'New' | 'Contacted' | 'Qualified' | 'Closed'] || {
    status: lead.status,
    label: lead.status,
    shortDescription: 'Custom lead status',
    colorHex: '#315FEA',
    bgHex: '#EFF6FF',
    textHex: '#1D4ED8',
    borderHex: '#BFDBFE',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-[6px] bg-[#F0EAFE] dark:bg-[#7950B8]/20 text-[#7950B8] dark:text-[#A78BFA] flex items-center justify-center shrink-0 font-bold text-sm border border-[#7950B8]/20"
            aria-hidden="true"
          >
            {getInitials(lead.name)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-base sm:text-lg text-slate-900 dark:text-white truncate">
                {lead.name}
              </h2>
              {getStatusBadge(lead.status)}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span>Submitted {formatDate(lead.submittedAt)}</span>
              <span>•</span>
              <span>via {lead.source || 'Website'}</span>
            </div>
          </div>
        </div>
      }
      description="Inspect customer requirements, progress the enquiry pipeline, and record communication history."
      maxWidth="xl"
      footer={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
          {/* Direct Communication Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-[6px] bg-[#15803D] hover:bg-[#166534] text-white transition-colors active:scale-[0.98] shadow-soft-xs"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Customer</span>
              </a>
            )}
            {lead.phone && (
              <a
                href={`https://wa.me/${cleanPhoneDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-[6px] bg-[#25D366] hover:bg-[#20ba59] text-white transition-colors active:scale-[0.98] shadow-soft-xs"
              >
                <MessageCircle className="w-3.5 h-3.5 text-white" />
                <span>WhatsApp</span>
              </a>
            )}
            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-[6px] bg-[#315FEA] hover:bg-[#254EDB] text-white transition-colors active:scale-[0.98] shadow-soft-xs"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </a>
            )}
          </div>

          {/* Management Actions */}
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenEdit(lead)}
              leftIcon={<Pencil className="w-3.5 h-3.5" />}
              className="rounded-[6px]"
            >
              Edit
            </Button>
            <Button
              variant="destructive-outline"
              size="sm"
              onClick={() => onOpenDelete(lead)}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              className="rounded-[6px]"
            >
              Delete
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {statusUpdateError && (
          <div className="p-3 rounded-[6px] bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{statusUpdateError}</span>
          </div>
        )}

        {/* 1. Conversion Pipeline Stepper with Status Explanations */}
        <div className="p-3.5 rounded-[8px] bg-[#F8FAFC] dark:bg-[#1E293B]/40 border border-slate-200/90 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span>Conversion Pipeline Stage</span>
              {isUpdatingStatus && <RefreshCw className="w-3 h-3 animate-spin text-[#7950B8]" />}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Click stage to update
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {pipelineStages.map((stage) => {
              const meta = STATUS_DEFINITIONS[stage];
              const isActive = lead.status === stage;

              return (
                <button
                  key={stage}
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => onStatusChange(lead.id, stage)}
                  className={`p-2.5 rounded-[6px] text-center font-bold text-xs border transition-all duration-150 select-none active:scale-[0.98] ${
                    isActive
                      ? stage === 'Qualified'
                        ? 'bg-[#7950B8] border-[#7950B8] text-white shadow-soft-xs ring-2 ring-[#7950B8]/30'
                        : stage === 'New'
                        ? 'bg-[#15803D] border-[#15803D] text-white shadow-soft-xs ring-2 ring-[#15803D]/30'
                        : stage === 'Closed'
                        ? 'bg-slate-700 border-slate-700 text-white shadow-soft-xs ring-2 ring-slate-400/30'
                        : 'bg-[#315FEA] border-[#315FEA] text-white shadow-soft-xs ring-2 ring-[#315FEA]/30'
                      : 'bg-white dark:bg-[#0F172A] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                  aria-pressed={isActive}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />}
                    <span>{meta.label}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Status Explanation Card with Short Descriptions */}
          <div className="p-3 rounded-[6px] bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 text-xs space-y-1.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Pipeline Stages & Meanings
              </span>
              <span className="text-xs text-slate-500">
                Active: <strong className="text-slate-900 dark:text-white font-semibold">{currentStatusMeta.label}</strong>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5 text-[11px]">
              <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-[#15803D] mt-1 shrink-0" />
                <span><strong className="text-slate-800 dark:text-slate-200">New:</strong> Fresh enquiry received, awaiting initial outreach</span>
              </div>
              <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-[#315FEA] mt-1 shrink-0" />
                <span><strong className="text-slate-800 dark:text-slate-200">Contacted:</strong> Initial communication sent, conversation ongoing</span>
              </div>
              <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-[#7950B8] mt-1 shrink-0" />
                <span><strong className="text-slate-800 dark:text-slate-200">Qualified:</strong> Project scope, timeline and viability verified</span>
              </div>
              <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-500 mt-1 shrink-0" />
                <span><strong className="text-slate-800 dark:text-slate-200">Closed:</strong> Enquiry converted to project or resolved</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Customer Information Grid */}
        <div className="p-4 rounded-[8px] bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 shadow-soft-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-xs">
            {/* Customer Name */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Customer Name
              </span>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                {lead.name}
              </p>
            </div>

            {/* Phone Number with 1-click Copy */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Phone Number
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <a
                  href={`tel:${lead.phone}`}
                  className="text-sm font-semibold text-slate-900 dark:text-white font-mono hover:text-[#315FEA] hover:underline"
                >
                  {lead.phone}
                </a>
                <button
                  type="button"
                  onClick={(e) => onCopyPhone(lead.id, lead.phone, e)}
                  className="text-xs text-[#7950B8] hover:text-[#6820AB] font-semibold hover:underline inline-flex items-center gap-1 transition-colors"
                  aria-label={`Copy phone for ${lead.name}`}
                >
                  {copiedPhoneId === lead.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Email Address */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Email Address
              </span>
              {lead.email ? (
                <a
                  href={`mailto:${lead.email}`}
                  className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-0.5 hover:text-[#315FEA] hover:underline block truncate"
                >
                  {lead.email}
                </a>
              ) : (
                <p className="text-xs text-slate-400 mt-0.5 italic">Not provided</p>
              )}
            </div>

            {/* Area of Interest */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Area of Interest
              </span>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-0.5 font-medium">
                {lead.areaOfInterest || 'Not specified'}
              </p>
            </div>

            {/* Intake Source & Status */}
            <div className="sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Intake Source
                </span>
                {getSourceBadge(lead.source)}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Current Status
                </span>
                {getStatusBadge(lead.status)}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Customer Inquiry Requirements (Prominent Box) */}
        <div className="p-3.5 rounded-[8px] bg-[#F0EAFE]/40 dark:bg-[#7950B8]/10 border border-[#7950B8]/20 space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#7950B8] dark:text-[#A78BFA] flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-[#7950B8]" />
            Original Customer Inquiry Requirements
          </span>
          <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed pt-0.5 font-medium">
            {cleanMessage || 'No specific requirements or project scope described.'}
          </p>
        </div>

        {/* 4. Follow-up Progression & History */}
        <div className="space-y-3 pt-2 border-t border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#7950B8]" />
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
              leftIcon={
                isRecordingFollowUp ? (
                  <X className="w-3.5 h-3.5" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )
              }
            >
              {isRecordingFollowUp ? 'Cancel' : 'Record Follow-up'}
            </Button>
          </div>

          {/* Inline Follow-up Recording Form */}
          {isRecordingFollowUp && (
            <form
              onSubmit={handleFormSubmit}
              className="p-3.5 rounded-[8px] bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 shadow-soft-xs space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Pencil className="w-3.5 h-3.5 text-[#7950B8]" />
                  Record Customer Interaction
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
                    {(['Call', 'WhatsApp', 'Email', 'Meeting', 'Other'] as const).map(
                      (method) => {
                        const isSelected = followUpForm.method === method;
                        return (
                          <button
                            key={method}
                            type="button"
                            onClick={() =>
                              setFollowUpForm((prev) => ({ ...prev, method }))
                            }
                            className={`py-1.5 px-3 text-center rounded-[6px] text-xs font-semibold border transition-colors select-none active:scale-[0.98] ${
                              isSelected
                                ? 'bg-[#7950B8] border-[#7950B8] text-white shadow-soft-xs'
                                : 'bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                            }`}
                          >
                            {method}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Interaction Date & Time <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="datetime-local"
                    value={followUpForm.followedUpAt}
                    onChange={(e) =>
                      setFollowUpForm((prev) => ({
                        ...prev,
                        followedUpAt: e.target.value,
                      }))
                    }
                    required
                    className="text-xs py-1.5"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="follow-up-notes-textarea"
                    className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  >
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
                  onChange={(e) =>
                    setFollowUpForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Details discussed with customer, budget feedback, objections or clarifications..."
                  maxLength={4000}
                  required
                  className="text-xs"
                />
              </div>

              {/* Next Action & Next Follow-up Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label
                    htmlFor="follow-up-next-action-input"
                    className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1"
                  >
                    Next Action (Optional)
                  </label>
                  <Input
                    id="follow-up-next-action-input"
                    type="text"
                    placeholder="e.g. Share proposal, follow up in 2 days"
                    value={followUpForm.nextAction}
                    onChange={(e) =>
                      setFollowUpForm((prev) => ({
                        ...prev,
                        nextAction: e.target.value,
                      }))
                    }
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
                    onChange={(e) =>
                      setFollowUpForm((prev) => ({
                        ...prev,
                        nextFollowUpAt: e.target.value,
                      }))
                    }
                    className="text-xs py-1.5"
                  />
                </div>
              </div>

              {/* Form Buttons */}
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
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#7950B8]" />
                <span>Loading interaction history...</span>
              </div>
            ) : followUpsError ? (
              <div className="p-3 rounded-[6px] bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs flex items-center justify-between">
                <span>{followUpsError}</span>
                <button
                  type="button"
                  onClick={() => onRefreshFollowUps(lead.id)}
                  className="text-[#7950B8] font-semibold underline text-xs"
                >
                  Retry
                </button>
              </div>
            ) : followUps.length === 0 ? (
              <div className="p-4 rounded-[8px] border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1E293B]/20 text-center">
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  No follow-up interactions recorded yet.
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Click &quot;Record Follow-up&quot; above to log conversations with this customer.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                {followUps.map((fu) => (
                  <div
                    key={fu.id}
                    className="p-3 rounded-[8px] bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 text-xs shadow-soft-xs space-y-1.5"
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
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {fu.nextAction}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 5. Audit Timestamps */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Submitted: {formatDate(lead.submittedAt)}
          </span>
          {lead.updatedAt && (
            <span>Last Updated: {formatDate(lead.updatedAt)}</span>
          )}
          {lead.sourceReference && (
            <span className="font-mono text-[10px]">
              Ref: {lead.sourceReference}
            </span>
          )}
        </div>
      </div>
    </Modal>
  );
}
