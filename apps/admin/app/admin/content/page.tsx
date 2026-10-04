'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Globe,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  RotateCcw,
  ExternalLink,
  Layers,
  Sparkles,
  HelpCircle,
  Eye,
  FileEdit,
  Clock,
  ChevronRight,
  ShieldCheck,
  Quote,
  MessageSquare,
  Award,
  Compass,
  Check,
  Plus,
  Trash2,
  FileText,
  Phone,
  RefreshCw,
  Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { apiClient } from '@/lib/api/client';
import { cn } from '@/lib/utils';

export interface AIConnectionDto {
  status: string;
  providerKey?: string;
  providerDisplayName?: string;
  selectedModelKey?: string;
  selectedModelDisplayName?: string;
  maskedApiKey?: string;
  supportedCapability?: string;
  isContentAIAvailable?: boolean;
  isImageEnhancementAvailable?: boolean;
  lastValidatedAt?: string;
  updatedAt?: string;
}

export interface AIContentResponseDto {
  aiRequestId: string;
  suggestion: string;
  status: string;
  reviewStatus?: string;
  originalText?: string;
  sectionKey?: string;
  field?: string;
  targetResourceVersion?: number;
}

const AI_OPERATIONS = [
  {
    key: 'ImproveWording',
    label: 'Improve Wording',
    description: 'Refine flow, phrasing, and client appeal while maintaining factual meaning.',
  },
  {
    key: 'MakeMoreProfessional',
    label: 'Make More Professional',
    description: 'Elevate tone to be sophisticated, authoritative, and brand-consistent.',
  },
  {
    key: 'MakeShorter',
    label: 'Make Shorter',
    description: 'Craft a punchy, concise version optimized for fast website scanning.',
  },
  {
    key: 'MakeClearer',
    label: 'Make Clearer',
    description: 'Simplify phrasing and structure for maximum clarity and directness.',
  },
  {
    key: 'ImproveServiceDescription',
    label: 'Improve Service Description',
    description: 'Highlight craft, client value, and distinct outcomes.',
  },
  {
    key: 'CustomInstruction',
    label: 'Custom Instruction',
    description: 'Provide custom refinement instructions grounded in your business facts.',
  },
];

export interface SubFieldSchemaDto {
  key: string;
  label: string;
  type: 'text' | 'textarea';
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  tooltip?: string;
}

export interface SectionFieldSchemaDto {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'list' | 'items';
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  tooltip?: string;
  helperText?: string;
  itemFields?: SubFieldSchemaDto[];
}

export interface WebsiteSectionSchemaDto {
  sectionKey: string;
  displayName: string;
  description: string;
  iconName: string;
  fields: SectionFieldSchemaDto[];
}

export interface WebsiteDto {
  id: string;
  tenantId: string;
  name: string;
  domain: string;
  templateId: string;
  connectionStatus: string;
  createdAt: string;
  updatedAt: string;
  lastPublishedAt?: string;
}

export interface ContentSectionDetailDto {
  sectionKey: string;
  title: string;
  description: string;
  status: string;
  version: number;
  updatedAt: string;
  publishedAt?: string;
  draftFields: Record<string, any>;
  publishedFields?: Record<string, any>;
  hasUnpublishedChanges: boolean;
  schema?: WebsiteSectionSchemaDto;
}

export interface WebsiteContentOverviewDto {
  website: WebsiteDto;
  sections: ContentSectionDetailDto[];
}

const ICON_MAP: Record<string, React.ElementType> = {
  Sparkles,
  ShieldCheck,
  Layers,
  Compass,
  Eye,
  Award,
  Quote,
  MessageSquare,
  FileEdit,
  Globe,
  FileText,
  Phone,
};

function getSectionIcon(iconName?: string): React.ElementType {
  if (iconName && ICON_MAP[iconName]) {
    return ICON_MAP[iconName];
  }
  return FileEdit;
}

export default function ContentPage() {
  const [overview, setOverview] = useState<WebsiteContentOverviewDto | null>(null);
  const [selectedKey, setSelectedKey] = useState<string>('hero');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnboardingRequired, setIsOnboardingRequired] = useState(false);

  // In-memory edit state for currently selected section
  const [draftPayload, setDraftPayload] = useState<Record<string, any>>({});
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  // AI Content Assistant state
  const [aiConnection, setAiConnection] = useState<AIConnectionDto | null>(null);
  const [isLoadingAiConnection, setIsLoadingAiConnection] = useState<boolean>(true);
  const [aiConnectionError, setAiConnectionError] = useState<string | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiFieldInfo, setAiFieldInfo] = useState<{
    key: string;
    label: string;
    sectionTitle: string;
    sectionKey: string;
    currentText: string;
    onApply: (improvedText: string) => void;
  } | null>(null);
  const [aiOperation, setAiOperation] = useState<string>('ImproveWording');
  const [aiInstruction, setAiInstruction] = useState<string>('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [currentAiRequestId, setCurrentAiRequestId] = useState<string | null>(null);
  const [aiReviewStatus, setAiReviewStatus] = useState<string>('PendingReview');
  const [isAcceptingAi, setIsAcceptingAi] = useState(false);
  const [isRejectingAi, setIsRejectingAi] = useState(false);
  const [aiConflictError, setAiConflictError] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiEditableSuggestion, setAiEditableSuggestion] = useState<string>('');
  const [aiError, setAiError] = useState<string | null>(null);

  // Authoritative normalized sections list - guaranteed to be an array
  const sections = useMemo(() => {
    return overview?.sections ?? [];
  }, [overview]);

  // Safe active section lookup
  const activeSection = useMemo(() => {
    return sections.find((s) => s.sectionKey === selectedKey) ?? null;
  }, [sections, selectedKey]);

  // Load tenant AI provider connection
  const loadAiConnection = useCallback(async () => {
    setIsLoadingAiConnection(true);
    setAiConnectionError(null);
    try {
      const res = await apiClient.get<any>('/ai/connection');
      const data: AIConnectionDto = res?.data ?? res;
      setAiConnection(data);
    } catch (err: any) {
      setAiConnection(null);
      setAiConnectionError(err?.message || 'Unable to verify your AI connection right now.');
    } finally {
      setIsLoadingAiConnection(false);
    }
  }, []);

  const isContentAiAvailable = useMemo(() => {
    if (!aiConnection || aiConnection.status !== 'Connected') return false;
    if (typeof aiConnection.isContentAIAvailable === 'boolean') {
      return aiConnection.isContentAIAvailable;
    }
    return aiConnection.supportedCapability === 'Content' || aiConnection.supportedCapability === 'Both';
  }, [aiConnection]);

  // Load website & sections overview
  const loadOverview = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsOnboardingRequired(false);
    try {
      const data = await apiClient.get<WebsiteContentOverviewDto>('/website/content');
      setOverview(data);
      const loadedSections = data?.sections ?? [];
      if (loadedSections.length > 0) {
        setSelectedKey((prevKey) => {
          const match = loadedSections.find((s) => s.sectionKey === prevKey) || loadedSections[0];
          setDraftPayload(JSON.parse(JSON.stringify(match.draftFields || {})));
          return match.sectionKey;
        });
      }
    } catch (err: any) {
      if (
        err?.code === 'ONBOARDING_REQUIRED' ||
        err?.status === 403 ||
        err?.message?.includes('Onboarding incomplete') ||
        err?.message?.includes('Business Context must be confirmed')
      ) {
        setIsOnboardingRequired(true);
      } else {
        setError(err?.message || 'Failed to load website content. Please ensure backend services are running.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
    loadAiConnection();
  }, [loadOverview, loadAiConnection]);

  // Open AI modal for a specific field
  const handleOpenAiModal = (
    fieldKey: string,
    fieldLabel: string,
    currentText: string,
    onApply: (improvedText: string) => void
  ) => {
    setAiFieldInfo({
      key: fieldKey,
      label: fieldLabel,
      sectionTitle: activeSection?.schema?.displayName || activeSection?.title || selectedKey,
      sectionKey: selectedKey,
      currentText,
      onApply,
    });
    setAiOperation('ImproveWording');
    setAiInstruction('');
    setAiSuggestion(null);
    setAiEditableSuggestion('');
    setCurrentAiRequestId(null);
    setAiReviewStatus('PendingReview');
    setAiConflictError(null);
    setAiError(null);
    setIsAiModalOpen(true);
    // Refresh authoritative AI connection status to avoid stale state
    loadAiConnection();
  };

  // Call Content AI improvement endpoint
  const handleGenerateAi = async () => {
    if (!aiFieldInfo) return;
    setIsGeneratingAi(true);
    setAiError(null);
    setAiConflictError(null);

    try {
      const resp = await apiClient.post<any>('/ai/content/improve', {
        sectionKey: aiFieldInfo.sectionKey,
        field: aiFieldInfo.key,
        operation: aiOperation,
        currentText: aiFieldInfo.currentText,
        instruction: aiOperation === 'CustomInstruction' ? aiInstruction.trim() : undefined,
      });

      const data: AIContentResponseDto = resp?.data ?? resp;
      setCurrentAiRequestId(data.aiRequestId);
      setAiReviewStatus(data.reviewStatus || 'PendingReview');
      setAiSuggestion(data.suggestion);
      setAiEditableSuggestion(data.suggestion);
    } catch (err: any) {
      setAiError(err?.message || 'Failed to generate AI suggestion. Please try again.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Human review: Explicit server-side Accept suggestion into draft
  const handleAcceptAiSuggestion = async () => {
    if (!aiFieldInfo || !aiEditableSuggestion.trim()) return;

    // If an AI request ID exists, call server-side accept to ensure validation & conflict protection
    if (currentAiRequestId) {
      setIsAcceptingAi(true);
      setAiError(null);
      setAiConflictError(null);

      try {
        const isEdited = aiEditableSuggestion.trim() !== aiSuggestion?.trim();
        const resp = await apiClient.post<any>(`/ai/requests/${currentAiRequestId}/accept`, {
          editedText: isEdited ? aiEditableSuggestion.trim() : undefined,
        });

        // Apply to local draft state
        aiFieldInfo.onApply(aiEditableSuggestion.trim());

        // Close modal & notify user
        setIsAiModalOpen(false);
        toast.success(
          isEdited
            ? 'Edited AI suggestion accepted into draft. Changes are not live until explicitly published.'
            : 'AI suggestion accepted into draft. Changes are not live until explicitly published.'
        );
      } catch (err: any) {
        if (err?.code === 'AI_RESULT_STALE_CONFLICT' || err?.status === 409) {
          setAiConflictError(
            err?.message ||
              'The section draft was updated after this suggestion was generated. To prevent overwriting newer edits, please refresh and review again.'
          );
        } else {
          setAiError(err?.message || 'Failed to accept AI suggestion.');
        }
      } finally {
        setIsAcceptingAi(false);
      }
    } else {
      // Fallback local apply
      aiFieldInfo.onApply(aiEditableSuggestion.trim());
      setIsAiModalOpen(false);
      toast.success('Draft updated with suggestion.');
    }
  };

  // Human review: Explicit server-side Reject suggestion
  const handleRejectAiSuggestion = async () => {
    if (currentAiRequestId) {
      setIsRejectingAi(true);
      try {
        await apiClient.post(`/ai/requests/${currentAiRequestId}/reject`, {
          reason: 'User discarded suggestion in content editor.',
        });
      } catch {
        // Safe to ignore rejection errors
      } finally {
        setIsRejectingAi(false);
      }
    }

    setIsAiModalOpen(false);
    toast.info('AI suggestion discarded. Existing content and draft remain unchanged.');
  };

  // Human review: Reset and try another operation
  const handleResetAiSuggestion = () => {
    setAiSuggestion(null);
    setAiEditableSuggestion('');
    setCurrentAiRequestId(null);
    setAiReviewStatus('PendingReview');
    setAiConflictError(null);
    setAiError(null);
  };

  // When selected section changes from outside or overview updates
  const handleSelectSection = (key: string) => {
    if (key === selectedKey) return;
    if (isDirty) {
      const confirmLeave = window.confirm('You have unsaved changes in this section. Discard changes and switch?');
      if (!confirmLeave) return;
    }
    setSelectedKey(key);
    const target = sections.find((s) => s.sectionKey === key);
    if (target) {
      setDraftPayload(JSON.parse(JSON.stringify(target.draftFields || {})));
    } else {
      setDraftPayload({});
    }
    setActiveTab('editor');
  };

  // Compare draftPayload with activeSection.draftFields
  const isDirty = useMemo(() => {
    if (!activeSection) return false;
    const initialJson = JSON.stringify(activeSection.draftFields || {});
    const currentJson = JSON.stringify(draftPayload);
    return initialJson !== currentJson;
  }, [activeSection, draftPayload]);

  useUnsavedChanges(isDirty);

  // Helper to update top-level field in draftPayload
  const updateField = (field: string, value: any) => {
    setDraftPayload((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Discard local changes
  const handleDiscard = () => {
    if (!activeSection) return;
    setDraftPayload(JSON.parse(JSON.stringify(activeSection.draftFields || {})));
    toast.info('Discarded unsaved changes.');
  };

  // Save draft
  const handleSaveDraft = async () => {
    if (!activeSection) return;
    setIsSavingDraft(true);
    try {
      const updatedSection = await apiClient.put<ContentSectionDetailDto>(
        `/website/content/${selectedKey}/draft`,
        { fields: draftPayload }
      );

      // Update in local overview
      setOverview((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          sections: prev.sections.map((s) => (s.sectionKey === selectedKey ? updatedSection : s)),
        };
      });
      setDraftPayload(JSON.parse(JSON.stringify(updatedSection.draftFields || {})));
      toast.success(`${updatedSection.title} draft saved successfully.`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save draft.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Open publish confirmation modal
  const handlePublishClick = () => {
    if (!activeSection) return;
    setIsConfirmModalOpen(true);
  };

  // Perform confirmed publish
  const confirmAndPublish = async () => {
    if (!activeSection) return;
    setIsPublishing(true);
    try {
      let currentVersion = activeSection.version;

      // If there are unsaved local edits, save draft first
      if (isDirty) {
        const savedDraft = await apiClient.put<ContentSectionDetailDto>(
          `/website/content/${selectedKey}/draft`,
          { fields: draftPayload }
        );
        currentVersion = savedDraft.version;
      }

      const publishedSection = await apiClient.post<ContentSectionDetailDto>(
        `/website/content/${selectedKey}/publish`,
        { version: currentVersion }
      );

      setOverview((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          website: {
            ...prev.website,
            lastPublishedAt: publishedSection.publishedAt,
          },
          sections: prev.sections.map((s) => (s.sectionKey === selectedKey ? publishedSection : s)),
        };
      });
      setDraftPayload(JSON.parse(JSON.stringify(publishedSection.draftFields || {})));
      setIsConfirmModalOpen(false);
      toast.success(`${publishedSection.title} published to live website.`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to publish section.');
    } finally {
      setIsPublishing(false);
    }
  };

  // 1. Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-3">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-8 space-y-4">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Onboarding Required gate
  if (isOnboardingRequired) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Website Content
          </h1>
          <p className="text-sm text-slate-500 dark:text-[#94A3B8] mt-1">
            Structured content management for your connected Sparovia website.
          </p>
        </div>

        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 sm:p-8 shadow-sm">
          <EmptyState
            icon={<ShieldCheck className="w-8 h-8 text-amber-500" />}
            title="Business Context Confirmation Required"
            description="Your canonical business facts must be confirmed during onboarding before managing Website Content sections."
            action={
              <Link href="/admin/onboarding/business-basics">
                <Button variant="primary" size="md">
                  Complete Onboarding
                </Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  // 3. Error state
  if (error || !overview) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <ErrorState
          title="Website Content Unavailable"
          error={error || 'Could not retrieve website content.'}
          onRetry={loadOverview}
        />
      </div>
    );
  }

  // 4. Empty state (overview loaded, but 0 sections)
  if (sections.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Website Content
          </h1>
          <p className="text-sm text-slate-500 dark:text-[#94A3B8] mt-1">
            Structured content management for your connected Sparovia website.
          </p>
        </div>

        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 sm:p-8 shadow-sm">
          <EmptyState
            icon={<Layers className="w-8 h-8 text-blue-500" />}
            title="No Website Sections Available"
            description="No supported website content sections are currently configured for this website."
            action={
              <Button variant="outline" size="sm" onClick={loadOverview}>
                Refresh
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const website = overview.website;
  const currentTitle = activeSection?.schema?.displayName || activeSection?.title || selectedKey;
  const currentDescription = activeSection?.schema?.description || activeSection?.description || 'Manage content for this section.';
  const SectionIcon = getSectionIcon(activeSection?.schema?.iconName);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Title & Connection Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Website Content
          </h1>
          <p className="text-sm text-slate-500 dark:text-[#94A3B8] mt-1">
            Structured content management for your connected Sparovia website. Controlled sections with draft and live publish isolation.
          </p>
        </div>

        {/* Connected Website Status Card */}
        <div className="flex items-center gap-3 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl px-4 py-2.5 shadow-xs self-start sm:self-auto shrink-0 max-w-full">
          <div className="relative flex items-center justify-center shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="absolute w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-75" />
          </div>
          <div className="text-left min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {website?.name || 'Website identity unavailable'}
              </span>
              <InfoTooltip content="Authoritative website connected to this tenant. Changes published here are immediately rendered on this live website." />
            </div>
            {website?.domain ? (
              <a
                href={website.domain.startsWith('http') ? website.domain : `http://${website.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-slate-500 hover:text-[#3B82F6] dark:text-[#94A3B8] dark:hover:text-[#3B82F6] font-mono truncate max-w-[280px] flex items-center gap-1 transition-colors"
                title="Open live website in new tab"
              >
                <span className="truncate">{website.domain}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            ) : (
              <p className="text-[11px] text-slate-400 font-mono">
                Website URL unavailable
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Layout: Left Sidebar Section Tabs + Right Content Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Navigation List of Supported Sections */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-[#1E293B]">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                Website Sections ({sections.length})
              </span>
              <span className="text-xs font-medium text-slate-400">
                Locked Schema
              </span>
            </div>

            <nav className="space-y-1.5" aria-label="Website sections">
              {sections.map((sec) => {
                const isSelected = sec.sectionKey === selectedKey;
                const IconComponent = getSectionIcon(sec.schema?.iconName);
                const displayTitle = sec.schema?.displayName || sec.title;

                return (
                  <button
                    key={sec.sectionKey}
                    type="button"
                    onClick={() => handleSelectSection(sec.sectionKey)}
                    className={cn(
                      'w-full text-left p-3 rounded-xl transition-all flex items-center justify-between gap-3 group',
                      isSelected
                        ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-300/80 dark:border-amber-600/40 text-amber-900 dark:text-amber-200 shadow-xs'
                        : 'hover:bg-slate-50 dark:hover:bg-[#1E293B]/50 border border-transparent text-slate-700 dark:text-slate-300'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'p-2 rounded-lg transition-colors flex-shrink-0',
                          isSelected
                            ? 'bg-[#FF7043] text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-[#1E293B] text-slate-500 dark:text-[#94A3B8] group-hover:text-slate-900 dark:group-hover:text-white'
                        )}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-sm font-semibold truncate leading-snug">
                          {displayTitle}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mt-0.5">
                          {sec.hasUnpublishedChanges ? (
                            <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                              Unpublished Draft
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                              Live v{sec.version}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      className={cn(
                        'w-4 h-4 transition-transform flex-shrink-0',
                        isSelected ? 'text-amber-700 dark:text-amber-400 translate-x-0.5' : 'text-slate-300 dark:text-slate-600'
                      )}
                    />
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Help Card */}
          <div className="bg-slate-50/70 dark:bg-[#0B1120]/40 border border-slate-200 dark:border-[#1E293B] rounded-2xl p-4 text-xs text-slate-500 dark:text-[#94A3B8] space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
              <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
              <span>Controlled CMS Principles</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              Sections and fields are strictly locked by your connected website template. Only supported content blocks can be edited to preserve design integrity and responsiveness.
            </p>
          </div>
        </div>

        {/* Right Column: Section Content Editor Form */}
        <div className="lg:col-span-8">
          {activeSection ? (
            <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl shadow-sm overflow-hidden">
              
              {/* Section Header */}
              <div className="p-6 border-b border-slate-100 dark:border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-[#FF7043] border border-amber-200/60 dark:border-amber-700/30">
                    <SectionIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {currentTitle}
                      </h2>
                      <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-slate-300">
                        {activeSection.sectionKey}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1 max-w-xl">
                      {currentDescription}
                    </p>
                  </div>
                </div>

                {/* Editor vs Payload Tabs */}
                <div className="flex items-center bg-slate-100 dark:bg-[#1E293B] p-1 rounded-xl self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab('editor')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
                      activeTab === 'editor'
                        ? 'bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    )}
                  >
                    <FileEdit className="w-3.5 h-3.5" />
                    <span>Structured Editor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
                      activeTab === 'preview'
                        ? 'bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    )}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Payload Preview</span>
                  </button>
                </div>
              </div>

              {/* Tab 1: Structured Form Fields */}
              {activeTab === 'editor' && (
                <div className="p-6 space-y-6">
                  <SectionEditor
                    schema={activeSection.schema}
                    value={draftPayload}
                    onChange={updateField}
                    onOpenAiModal={handleOpenAiModal}
                  />
                </div>
              )}

              {/* Tab 2: Draft vs Published Comparison */}
              {activeTab === 'preview' && (
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                          Current Draft Payload
                        </span>
                        {isDirty && (
                          <span className="text-[11px] text-amber-600 font-medium">
                            Modified Locally
                          </span>
                        )}
                      </div>
                      <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono overflow-auto max-h-96 leading-relaxed">
                        {JSON.stringify(draftPayload, null, 2)}
                      </pre>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                          Live Published Payload
                        </span>
                        <span className="text-[11px] text-emerald-600 font-medium">
                          v{activeSection.version}
                        </span>
                      </div>
                      <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono overflow-auto max-h-96 leading-relaxed">
                        {JSON.stringify(activeSection.publishedFields || {}, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="p-4 sm:p-6 bg-slate-50/80 dark:bg-[#0B1120]/60 border-t border-slate-200 dark:border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#94A3B8] self-start sm:self-auto">
                  {isDirty ? (
                    <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Unsaved local edits
                    </span>
                  ) : activeSection.hasUnpublishedChanges ? (
                    <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      Draft saved (ready to publish)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                      Live payload synced
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!isDirty || isSavingDraft || isPublishing}
                    onClick={handleDiscard}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  >
                    Discard Changes
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={!isDirty || isSavingDraft || isPublishing}
                    onClick={handleSaveDraft}
                    isLoading={isSavingDraft}
                    loadingText="Saving..."
                    leftIcon={<Save className="w-3.5 h-3.5" />}
                  >
                    Save Draft
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={isPublishing}
                    onClick={handlePublishClick}
                    isLoading={isPublishing}
                    loadingText="Publishing..."
                    leftIcon={<Send className="w-3.5 h-3.5" />}
                  >
                    Publish to Website
                  </Button>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-12 text-center text-slate-500">
              <p className="text-sm font-medium">Select a section from the left navigation to begin editing.</p>
            </div>
          )}
        </div>

      </div>

      {/* Explicit Publish Confirmation Dialog */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => !isPublishing && setIsConfirmModalOpen(false)}
        title="Publish Website Content?"
        description="Your approved changes will become visible on the public website."
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={isPublishing}
              onClick={() => setIsConfirmModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={isPublishing}
              onClick={confirmAndPublish}
              isLoading={isPublishing}
              loadingText="Publishing..."
              leftIcon={<Send className="w-4 h-4" />}
            >
              Publish Now
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1E293B]/60 border border-slate-200 dark:border-[#334155] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-[#94A3B8]">Target Section</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {activeSection?.schema?.displayName || activeSection?.title}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-[#94A3B8]">Target Website</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">
                {overview?.website.domain || 'Connected Website'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-[#94A3B8]">Current Version</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                v{activeSection?.version}
              </span>
            </div>
          </div>

          {isDirty && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-700/30 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unsaved edits detected</p>
                <p className="mt-0.5 text-amber-700/90 dark:text-amber-300/80">
                  Your current modifications will be saved to your draft and published simultaneously.
                </p>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed">
            Once published, the public website will immediately render these updates without requiring any redeployment or cache invalidation.
          </p>
        </div>
      </Modal>

      {/* AI Content Assistance Modal */}
      <Modal
        isOpen={isAiModalOpen}
        onClose={() => !isGeneratingAi && !isAcceptingAi && setIsAiModalOpen(false)}
        title="AI Content Assistance"
        description={
          aiFieldInfo
            ? `Refine "${aiFieldInfo.label}" in ${aiFieldInfo.sectionTitle} using your configured AI model.`
            : 'Refine your content with AI assistance.'
        }
        maxWidth="2xl"
        footer={
          // Dynamic dedicated footer pinned to bottom of modal
          (() => {
            if (isLoadingAiConnection && !aiConnection) {
              return (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAiModalOpen(false)}
                >
                  Close
                </Button>
              );
            }

            if (
              (aiConnectionError && !aiConnection) ||
              aiConnection?.status !== 'Connected' ||
              !isContentAiAvailable
            ) {
              return (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAiModalOpen(false)}
                >
                  Close
                </Button>
              );
            }

            // Step 2: Review & Accept Actions
            if (aiSuggestion) {
              return (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 w-full">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isAcceptingAi || isRejectingAi}
                    onClick={handleResetAiSuggestion}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                    className="w-full sm:w-auto justify-center"
                  >
                    Try Another Operation
                  </Button>

                  <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isAcceptingAi || isRejectingAi}
                      isLoading={isRejectingAi}
                      loadingText="Discarding..."
                      onClick={handleRejectAiSuggestion}
                      className="w-full sm:w-auto justify-center"
                    >
                      Discard / Reject
                    </Button>

                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleAcceptAiSuggestion}
                      isLoading={isAcceptingAi}
                      loadingText="Accepting..."
                      disabled={!aiEditableSuggestion.trim() || isAcceptingAi || isRejectingAi}
                      leftIcon={<Check className="w-3.5 h-3.5" />}
                      className="w-full sm:w-auto justify-center bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 focus:ring-emerald-500 whitespace-nowrap"
                    >
                      Accept Suggestion
                    </Button>
                  </div>
                </div>
              );
            }

            // Step 1: Operation Selection & Generate Actions
            return (
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 w-full">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAiModalOpen(false)}
                  disabled={isGeneratingAi}
                  className="w-full sm:w-auto justify-center"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleGenerateAi}
                  isLoading={isGeneratingAi}
                  loadingText="Refining content..."
                  disabled={isGeneratingAi || (aiOperation === 'CustomInstruction' && !aiInstruction.trim())}
                  leftIcon={<Sparkles className="w-3.5 h-3.5 text-white" />}
                  className="w-full sm:w-auto justify-center bg-purple-600 hover:bg-purple-700 shadow-purple-600/20 focus:ring-purple-500 whitespace-nowrap"
                >
                  Generate Suggestion
                </Button>
              </div>
            );
          })()
        }
      >
        <div className="space-y-4 sm:space-y-4.5 pb-1">
          {/* Case 1: Checking / Loading AI Connection state */}
          {isLoadingAiConnection && !aiConnection && (
            <div className="p-8 rounded-xl bg-slate-50 dark:bg-[#1E293B]/60 border border-slate-200 dark:border-[#334155] flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="w-6 h-6 text-purple-600 dark:text-purple-400 animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Checking AI Connection...
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Verifying tenant AI configuration and capabilities...
                </p>
              </div>
            </div>
          )}

          {/* Case 2: Verification Error (Unable to verify, network error, 500, etc.) */}
          {!isLoadingAiConnection && aiConnectionError && !aiConnection && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <p className="font-semibold text-sm">Unable to verify your AI connection right now</p>
                  <p className="text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                    {aiConnectionError}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={loadAiConnection}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Retry Verification
                </Button>
                <Link href="/admin/ai-models">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  >
                    Manage AI Connection
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Case 3: AI Provider Not Connected */}
          {!isLoadingAiConnection && aiConnection && aiConnection.status === 'NotConnected' && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <p className="font-semibold text-sm">AI Provider Connection Required</p>
                  <p className="text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                    To use AI Content Assistance, you must first connect an external AI provider (such as Google Gemini, OpenAI, or Anthropic Claude) in AI Connections.
                  </p>
                </div>
              </div>

              <div className="pt-1">
                <Link href="/admin/ai-models">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  >
                    Connect AI Provider
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Case 4: Invalid Configuration (failed credential) */}
          {!isLoadingAiConnection && aiConnection && aiConnection.status === 'Invalid' && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div className="text-xs text-red-900 dark:text-red-200 space-y-1">
                  <p className="font-semibold text-sm">AI Provider Credential Invalid</p>
                  <p className="text-red-800/90 dark:text-red-300/80 leading-relaxed">
                    Your stored AI provider API key could not be validated. Please update or re-enter your credential in AI Connections.
                  </p>
                </div>
              </div>

              <div className="pt-1">
                <Link href="/admin/ai-models">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  >
                    Update AI Connection
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Case 5: Connected but Model Does Not Support Content AI */}
          {!isLoadingAiConnection && aiConnection && aiConnection.status === 'Connected' && !isContentAiAvailable && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <p className="font-semibold text-sm">Content AI Unavailable for Selected Model</p>
                  <p className="text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                    Your connected model ({aiConnection.selectedModelDisplayName || aiConnection.selectedModelKey}) does not support Content AI workflows. Please select a model supporting text generation in AI Connections.
                  </p>
                </div>
              </div>

              <div className="pt-1">
                <Link href="/admin/ai-models">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  >
                    Manage AI Connection
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Case 6: Active Flow: Provider is Connected and supports Content AI */}
          {aiConnection && aiConnection.status === 'Connected' && isContentAiAvailable && (
            <>
              {/* AI Provider & Model Status Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-[#1E293B]/60 border border-slate-200/90 dark:border-[#334155]">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Connected AI:
                    </span>
                  </div>
                  <span className="text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800/40">
                    {aiConnection.providerDisplayName || aiConnection.providerKey} • {aiConnection.selectedModelDisplayName || aiConnection.selectedModelKey}
                  </span>
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40 shrink-0">
                    Content AI available
                  </span>
                </div>

                <Link
                  href="/admin/ai-models"
                  className="text-xs font-semibold text-[#3B82F6] hover:text-[#2563EB] dark:text-[#60A5FA] flex items-center gap-1 transition-colors shrink-0 self-start sm:self-auto"
                >
                  <span>Manage AI Provider</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {/* Original Content Card */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                    Current Content
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    {aiFieldInfo?.currentText.length || 0} characters
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#1E293B] text-xs text-slate-800 dark:text-slate-200 max-h-24 overflow-y-auto leading-relaxed select-text font-normal break-words">
                  {aiFieldInfo?.currentText || <span className="italic text-slate-400">No content entered</span>}
                </div>
              </div>

              {/* Step 1: Operation Selection (if no suggestion generated yet) */}
              {!aiSuggestion && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] mb-2">
                      Choose AI Operation
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                      {AI_OPERATIONS.map((op) => {
                        const isSelected = aiOperation === op.key;
                        return (
                          <button
                            key={op.key}
                            type="button"
                            onClick={() => setAiOperation(op.key)}
                            className={cn(
                              'text-left p-3 rounded-xl border transition-all text-xs flex flex-col justify-start gap-1 group min-h-[68px] sm:min-h-[72px]',
                              isSelected
                                ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-500/80 dark:border-purple-600 text-purple-950 dark:text-purple-200 ring-2 ring-purple-500/20 shadow-xs'
                                : 'bg-white dark:bg-[#0F172A] border-slate-200 dark:border-[#1E293B] hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                            )}
                          >
                            <div className="flex items-center justify-between gap-2 w-full">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {op.label}
                              </span>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                              {op.description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Instruction Input */}
                  {aiOperation === 'CustomInstruction' && (
                    <FormField
                      label="Custom Instruction"
                      required
                      helperText="Specify the exact adjustment while keeping factual accuracy (e.g., 'Emphasize fast turnaround and warranty')."
                    >
                      <input
                        type="text"
                        maxLength={500}
                        value={aiInstruction}
                        onChange={(e) => setAiInstruction(e.target.value)}
                        placeholder="e.g., Make it emphasize our 15 years of bespoke residential experience"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                      />
                    </FormField>
                  )}

                  {/* AI Error Alert */}
                  {aiError && (
                    <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-xs text-red-800 dark:text-red-300 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold">Unable to Generate Suggestion</p>
                        <p className="mt-0.5">{aiError}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Suggestion Review (Accept / Edit / Reject) */}
              {aiSuggestion && (
                <div className="space-y-3.5">
                  {/* Status Badges & Validation State */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-[#1E293B]/60 border border-slate-200 dark:border-[#334155]">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-[#94A3B8]">Review Status:</span>
                      <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/40">
                        {aiReviewStatus === 'PendingReview' ? 'Pending Human Review' : aiReviewStatus}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Server-Validated
                      </span>
                    </div>
                  </div>

                  {/* Information Guidance Banner */}
                  <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/40 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
                    <InfoTooltip content="AI suggestions are untrusted until explicitly accepted. Accepting applies the suggestion to your draft only. Live website content is never modified automatically." />
                    <div className="space-y-0.5">
                      <p className="font-semibold text-blue-950 dark:text-blue-100">Human Review Required</p>
                      <p className="text-blue-800/90 dark:text-blue-300/80 leading-relaxed text-[11px]">
                        Review this suggestion carefully. You may edit the copy before accepting. Accepting updates your draft only — changes are never published automatically.
                      </p>
                    </div>
                  </div>

                  {/* Conflict Alert (Stale draft protection) */}
                  {aiConflictError && (
                    <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700/50 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold">Draft Conflict Detected</p>
                        <p className="text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                          {aiConflictError}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* AI Error Alert */}
                  {aiError && !aiConflictError && (
                    <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-xs text-red-800 dark:text-red-300 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Review Action Failed</p>
                        <p className="mt-0.5">{aiError}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          AI Suggestion
                        </span>
                        <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800/40">
                          Editable before acceptance
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {aiEditableSuggestion.length} characters
                      </span>
                    </div>

                    <textarea
                      rows={4}
                      value={aiEditableSuggestion}
                      onChange={(e) => setAiEditableSuggestion(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 leading-relaxed font-normal shadow-xs"
                      placeholder="AI suggestion will appear here..."
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Edit3 className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>You can edit this suggestion directly before accepting it into your draft.</span>
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

// -------------------------------------------------------------
// Generic Schema-Driven Section Editor
// -------------------------------------------------------------

interface SectionEditorProps {
  schema?: WebsiteSectionSchemaDto;
  value: Record<string, any>;
  onChange: (field: string, value: any) => void;
  onOpenAiModal: (
    fieldKey: string,
    fieldLabel: string,
    currentText: string,
    onApply: (improvedText: string) => void
  ) => void;
}

function SectionEditor({ schema, value, onChange, onOpenAiModal }: SectionEditorProps) {
  // If no schema fields defined, fallback to rendering existing keys or generic message
  if (!schema || !schema.fields || schema.fields.length === 0) {
    const keys = Object.keys(value);
    if (keys.length === 0) {
      return (
        <div className="p-8 text-center text-slate-500 text-sm">
          No structured fields configured for this section.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {keys.map((k) => (
          <FormField key={k} label={k}>
            <input
              type="text"
              value={typeof value[k] === 'string' ? value[k] : JSON.stringify(value[k])}
              onChange={(e) => onChange(k, e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF7043]/30 focus:border-[#FF7043]"
            />
          </FormField>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {schema.fields.map((field) => {
        // 1. TEXT FIELD
        if (field.type === 'text') {
          return (
            <FormField
              key={field.key}
              label={field.label}
              required={field.required}
              tooltip={field.tooltip}
              helperText={field.helperText || (field.maxLength ? `Maximum ${field.maxLength} characters.` : undefined)}
              action={
                <button
                  type="button"
                  onClick={() =>
                    onOpenAiModal(
                      field.key,
                      field.label,
                      value[field.key] ?? '',
                      (improved) => onChange(field.key, improved)
                    )
                  }
                  disabled={!value[field.key] || typeof value[field.key] !== 'string' || !value[field.key].trim()}
                  title={value[field.key] ? 'Improve with AI' : 'Enter some text first to improve with AI'}
                  className="inline-flex items-center flex-row flex-nowrap whitespace-nowrap gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Improve with AI</span>
                </button>
              }
            >
              <input
                type="text"
                spellCheck={!field.key.toLowerCase().includes('url') && !field.key.toLowerCase().includes('image') && !field.key.toLowerCase().includes('icon') && !field.key.toLowerCase().includes('id')}
                maxLength={field.maxLength}
                value={value[field.key] ?? ''}
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FF7043]/30 focus:border-[#FF7043] transition-colors"
              />
            </FormField>
          );
        }

        // 2. TEXTAREA FIELD
        if (field.type === 'textarea') {
          return (
            <FormField
              key={field.key}
              label={field.label}
              required={field.required}
              tooltip={field.tooltip}
              helperText={field.helperText || (field.maxLength ? `Maximum ${field.maxLength} characters.` : undefined)}
              action={
                <button
                  type="button"
                  onClick={() =>
                    onOpenAiModal(
                      field.key,
                      field.label,
                      value[field.key] ?? '',
                      (improved) => onChange(field.key, improved)
                    )
                  }
                  disabled={!value[field.key] || typeof value[field.key] !== 'string' || !value[field.key].trim()}
                  title={value[field.key] ? 'Improve with AI' : 'Enter some text first to improve with AI'}
                  className="inline-flex items-center flex-row flex-nowrap whitespace-nowrap gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Improve with AI</span>
                </button>
              }
            >
              <textarea
                rows={field.maxLength && field.maxLength > 400 ? 4 : 3}
                maxLength={field.maxLength}
                spellCheck={true}
                value={value[field.key] ?? ''}
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FF7043]/30 focus:border-[#FF7043] leading-relaxed transition-colors"
              />
            </FormField>
          );
        }

        // 3. LIST FIELD (Array of strings)
        if (field.type === 'list') {
          const rawList = value[field.key];
          const list: string[] = Array.isArray(rawList) ? rawList : [];

          return (
            <div key={field.key} className="space-y-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-[#E2E8F0] select-none">
                  {field.label}
                  {field.required && <span className="text-[#FF7043] ml-1">*</span>}
                </label>
                {field.tooltip && <InfoTooltip content={field.tooltip} />}
              </div>

              {list.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No items added yet.</p>
              ) : (
                <div className="space-y-2">
                  {list.map((itemVal, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        spellCheck={true}
                        value={itemVal ?? ''}
                        onChange={(e) => {
                          const updated = [...list];
                          updated[idx] = e.target.value;
                          onChange(field.key, updated);
                        }}
                        placeholder={`Item ${idx + 1}`}
                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FF7043]/30 focus:border-[#FF7043]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = list.filter((_, i) => i !== idx);
                          onChange(field.key, updated);
                        }}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const updated = [...list, ''];
                  onChange(field.key, updated);
                }}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add {field.label.replace(/s$/, '') || 'Item'}
              </Button>
            </div>
          );
        }

        // 4. ITEMS FIELD (Array of objects with sub-fields)
        if (field.type === 'items') {
          const rawItems = value[field.key];
          const items: Record<string, any>[] = Array.isArray(rawItems) ? rawItems : [];

          return (
            <div key={field.key} className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#1E293B]">
                <div className="flex items-center gap-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-[#E2E8F0]">
                    {field.label}
                    {field.required && <span className="text-[#FF7043] ml-1">*</span>}
                  </label>
                  {field.tooltip && <InfoTooltip content={field.tooltip} />}
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {items.length} configured
                </span>
              </div>

              {items.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-[#1E293B] text-center text-xs text-slate-400">
                  No items configured. Click &quot;Add {field.label.replace(/s$/, '') || 'Item'}&quot; below to add one.
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, itemIdx) => {
                    const itemTitle =
                      item.title ||
                      item.name ||
                      item.heading ||
                      item.question ||
                      item.author ||
                      item.label ||
                      `Item #${itemIdx + 1}`;

                    return (
                      <div
                        key={itemIdx}
                        className="p-4 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50/60 dark:bg-[#0B1120]/40 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                            {itemTitle}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = items.filter((_, i) => i !== itemIdx);
                              onChange(field.key, updated);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          {(field.itemFields || []).map((subField) => (
                            <FormField
                              key={subField.key}
                              label={subField.label}
                              required={subField.required}
                              tooltip={subField.tooltip}
                              action={
                                <button
                                  type="button"
                                  onClick={() =>
                                    onOpenAiModal(
                                      `${field.key}.${itemIdx}.${subField.key}`,
                                      `${itemTitle} > ${subField.label}`,
                                      item[subField.key] ?? '',
                                      (improved) => {
                                        const updated = [...items];
                                        updated[itemIdx] = { ...updated[itemIdx], [subField.key]: improved };
                                        onChange(field.key, updated);
                                      }
                                    )
                                  }
                                  disabled={!item[subField.key] || typeof item[subField.key] !== 'string' || !item[subField.key].trim()}
                                  title={item[subField.key] ? 'Improve with AI' : 'Enter some text first to improve with AI'}
                                  className="inline-flex items-center flex-row flex-nowrap whitespace-nowrap gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400 shrink-0" />
                                  <span>Improve with AI</span>
                                </button>
                              }
                            >
                              {subField.type === 'textarea' ? (
                                <textarea
                                  rows={2}
                                  maxLength={subField.maxLength}
                                  spellCheck={true}
                                  value={item[subField.key] ?? ''}
                                  onChange={(e) => {
                                    const updated = [...items];
                                    updated[itemIdx] = { ...updated[itemIdx], [subField.key]: e.target.value };
                                    onChange(field.key, updated);
                                  }}
                                  placeholder={subField.placeholder}
                                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FF7043]/30 focus:border-[#FF7043]"
                                />
                              ) : (
                                <input
                                  type="text"
                                  spellCheck={!subField.key.toLowerCase().includes('url') && !subField.key.toLowerCase().includes('image') && !subField.key.toLowerCase().includes('icon')}
                                  maxLength={subField.maxLength}
                                  value={item[subField.key] ?? ''}
                                  onChange={(e) => {
                                    const updated = [...items];
                                    updated[itemIdx] = { ...updated[itemIdx], [subField.key]: e.target.value };
                                    onChange(field.key, updated);
                                  }}
                                  placeholder={subField.placeholder}
                                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FF7043]/30 focus:border-[#FF7043]"
                                />
                              )}
                            </FormField>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newItem: Record<string, any> = {};
                  (field.itemFields || []).forEach((sf) => {
                    newItem[sf.key] = '';
                  });
                  const updated = [...items, newItem];
                  onChange(field.key, updated);
                }}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add {field.label.replace(/s$/, '') || 'Item'}
              </Button>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
