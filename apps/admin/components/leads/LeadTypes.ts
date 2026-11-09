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

export interface LeadListResponse {
  items: Lead[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type LeadStatus = 'All' | 'New' | 'Contacted' | 'Qualified' | 'Closed';
export type LeadSource = 'All' | 'Website' | 'WhatsApp' | 'Manual';
export type SortOption = 'newest' | 'oldest' | 'updated' | 'name';

export const STATUS_OPTIONS: readonly LeadStatus[] = ['All', 'New', 'Contacted', 'Qualified', 'Closed'] as const;
export const SOURCE_OPTIONS: readonly LeadSource[] = ['All', 'Website', 'WhatsApp', 'Manual'] as const;
export const PAGE_SIZE_OPTIONS = [12, 24, 36, 48] as const;

export interface StatusMeta {
  status: 'New' | 'Contacted' | 'Qualified' | 'Closed';
  label: string;
  shortDescription: string;
  colorHex: string;
  bgHex: string;
  textHex: string;
  borderHex: string;
}

export const STATUS_DEFINITIONS: Record<'New' | 'Contacted' | 'Qualified' | 'Closed', StatusMeta> = {
  New: {
    status: 'New',
    label: 'New',
    shortDescription: 'Fresh enquiry received, awaiting initial outreach',
    colorHex: '#15803D',
    bgHex: '#DCFCE7',
    textHex: '#15803D',
    borderHex: '#86EFAC',
  },
  Contacted: {
    status: 'Contacted',
    label: 'Contacted',
    shortDescription: 'Initial communication sent, conversation ongoing',
    colorHex: '#315FEA',
    bgHex: '#EFF6FF',
    textHex: '#1D4ED8',
    borderHex: '#BFDBFE',
  },
  Qualified: {
    status: 'Qualified',
    label: 'Qualified',
    shortDescription: 'Project scope, timeline and viability verified',
    colorHex: '#7950B8',
    bgHex: '#F0EAFE',
    textHex: '#7950B8',
    borderHex: '#DDD6FE',
  },
  Closed: {
    status: 'Closed',
    label: 'Closed',
    shortDescription: 'Enquiry converted to project or resolved',
    colorHex: '#475569',
    bgHex: '#F1F5F9',
    textHex: '#475569',
    borderHex: '#CBD5E1',
  },
};

export function formatDate(dateStr: string): string {
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
}

export function formatRelativeTime(dateStr: string): string {
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
}

export function getCleanEnquiryMessage(message?: string | null): string {
  if (!message) return '';
  return message.replace(/^\[Area of Interest:[^\]]+\]\s*/i, '').trim();
}

export function getInitials(name: string): string {
  if (!name) return 'L';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
