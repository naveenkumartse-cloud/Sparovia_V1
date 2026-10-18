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

import { AIContentModal } from '@/components/ai/AIContentModal';

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

  // AI Content Assistant modal state
  const [aiModalProps, setAiModalProps] = useState<{
    isOpen: boolean;
    fieldKey: string;
    fieldLabel: string;
    sectionKey?: string;
    sectionTitle?: string;
    currentText: string;
    onApply: (improvedText: string) => void;
  }>({
    isOpen: false,
    fieldKey: '',
    fieldLabel: '',
    currentText: '',
    onApply: () => {},
  });

  // Authoritative normalized sections list - guaranteed to be an array
  const sections = useMemo(() => {
    return overview?.sections ?? [];
  }, [overview]);

  // Safe active section lookup
  const activeSection = useMemo(() => {
    return sections.find((s) => s.sectionKey === selectedKey) ?? null;
  }, [sections, selectedKey]);

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
  }, [loadOverview]);

  // Open AI modal for a specific field
  const handleOpenAiModal = (
    fieldKey: string,
    fieldLabel: string,
    currentText: string,
    onApply: (improvedText: string) => void
  ) => {
    setAiModalProps({
      isOpen: true,
      fieldKey,
      fieldLabel,
      sectionKey: selectedKey,
      sectionTitle: activeSection?.schema?.displayName || activeSection?.title || selectedKey,
      currentText,
      onApply,
    });
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
          <Skeleton className="h-8 w-64 rounded-[8px]" />
          <Skeleton className="h-4 w-96 rounded-[6px]" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-3">
            <Skeleton className="h-28 w-full rounded-[8px]" />
            <Skeleton className="h-96 w-full rounded-[8px]" />
          </div>
          <div className="lg:col-span-8 space-y-4">
            <Skeleton className="h-64 w-full rounded-[8px]" />
            <Skeleton className="h-64 w-full rounded-[8px]" />
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

        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-[8px] p-6 sm:p-8 shadow-sm">
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

        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-[8px] p-6 sm:p-8 shadow-sm">
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
        <div className="flex items-center gap-3 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-[8px] px-4 py-2.5 shadow-xs self-start sm:self-auto shrink-0 max-w-full">
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
                className="text-[11px] text-slate-500 hover:text-[#315FEA] dark:text-[#94A3B8] dark:hover:text-[#315FEA] font-mono truncate max-w-[280px] flex items-center gap-1 transition-colors"
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
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-[8px] p-4 shadow-sm">
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
                      'w-full text-left p-3 rounded-[6px] transition-all flex items-center justify-between gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]',
                      isSelected
                        ? 'bg-[#315FEA]/10 border border-[#315FEA]/30 text-[#172033] dark:text-white shadow-xs font-semibold'
                        : 'hover:bg-slate-50 dark:hover:bg-[#1E293B]/50 border border-transparent text-slate-700 dark:text-slate-300'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'p-2 rounded-[6px] transition-colors flex-shrink-0',
                          isSelected
                            ? 'bg-[#315FEA] text-white shadow-xs'
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
                        isSelected ? 'text-[#315FEA] translate-x-0.5' : 'text-slate-300 dark:text-slate-600'
                      )}
                    />
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Help Card */}
          <div className="bg-slate-50/70 dark:bg-[#0B1120]/40 border border-slate-200 dark:border-[#1E293B] rounded-[8px] p-4 text-xs text-slate-500 dark:text-[#94A3B8] space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
              <HelpCircle className="w-3.5 h-3.5 text-[#315FEA]" />
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
            <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-[8px] shadow-sm overflow-hidden">
              
              {/* Section Header */}
              <div className="p-6 border-b border-slate-100 dark:border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-[6px] bg-[#315FEA]/10 text-[#315FEA] border border-[#315FEA]/20">
                    <SectionIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {currentTitle}
                      </h2>
                      <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-[4px] bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-slate-300">
                        {activeSection.sectionKey}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1 max-w-xl">
                      {currentDescription}
                    </p>
                  </div>
                </div>

                {/* Editor vs Payload Tabs */}
                <div className="flex items-center bg-slate-100 dark:bg-[#1E293B] p-1 rounded-[6px] self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab('editor')}
                    className={cn(
                      'px-3 py-1.5 rounded-[4px] text-xs font-semibold transition-all flex items-center gap-1.5',
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
                      'px-3 py-1.5 rounded-[4px] text-xs font-semibold transition-all flex items-center gap-1.5',
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
                      <pre className="p-4 rounded-[8px] bg-slate-900 text-slate-200 text-xs font-mono overflow-auto max-h-96 leading-relaxed">
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
                      <pre className="p-4 rounded-[8px] bg-slate-900 text-slate-200 text-xs font-mono overflow-auto max-h-96 leading-relaxed">
                        {JSON.stringify(activeSection.publishedFields || {}, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="p-4 sm:p-6 bg-slate-50/80 dark:bg-[#0B1220]/60 border-t border-slate-200 dark:border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-4">
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
            <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-[8px] p-12 text-center text-slate-500">
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
        preventOutsideClose={isPublishing}
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
          <div className="p-4 rounded-[8px] bg-slate-50 dark:bg-[#1E293B]/60 border border-slate-200 dark:border-[#334155] space-y-2.5">
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
            <div className="p-3.5 rounded-[8px] bg-amber-50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-700/30 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
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
      <AIContentModal
        isOpen={aiModalProps.isOpen}
        onClose={() => setAiModalProps((prev) => ({ ...prev, isOpen: false }))}
        fieldKey={aiModalProps.fieldKey}
        fieldLabel={aiModalProps.fieldLabel}
        sectionKey={aiModalProps.sectionKey}
        sectionTitle={aiModalProps.sectionTitle}
        currentText={aiModalProps.currentText}
        onApply={aiModalProps.onApply}
      />

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
              spellCheck={true}
              autoCorrect="on"
              autoCapitalize="sentences"
              lang="en"
              value={typeof value[k] === 'string' ? value[k] : JSON.stringify(value[k])}
              onChange={(e) => onChange(k, e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#315FEA]/20 focus:border-[#315FEA]"
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
                  className="inline-flex items-center flex-row flex-nowrap whitespace-nowrap gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-semibold text-[#7950B8] dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#7950B8] dark:text-purple-400 shrink-0" />
                  <span>Improve with AI</span>
                </button>
              }
            >
              <input
                type="text"
                spellCheck={!field.key.toLowerCase().includes('url') && !field.key.toLowerCase().includes('image') && !field.key.toLowerCase().includes('icon') && !field.key.toLowerCase().includes('id')}
                autoCorrect={!field.key.toLowerCase().includes('url') && !field.key.toLowerCase().includes('image') && !field.key.toLowerCase().includes('icon') && !field.key.toLowerCase().includes('id') ? 'on' : 'off'}
                autoCapitalize={!field.key.toLowerCase().includes('url') && !field.key.toLowerCase().includes('image') ? 'sentences' : 'off'}
                lang="en"
                maxLength={field.maxLength}
                value={value[field.key] ?? ''}
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#315FEA]/20 focus:border-[#315FEA] transition-colors"
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
                  className="inline-flex items-center flex-row flex-nowrap whitespace-nowrap gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-semibold text-[#7950B8] dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#7950B8] dark:text-purple-400 shrink-0" />
                  <span>Improve with AI</span>
                </button>
              }
            >
              <textarea
                rows={field.maxLength && field.maxLength > 400 ? 4 : 3}
                maxLength={field.maxLength}
                spellCheck={true}
                autoCorrect="on"
                autoCapitalize="sentences"
                lang="en"
                value={value[field.key] ?? ''}
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#315FEA]/20 focus:border-[#315FEA] leading-relaxed transition-colors"
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
                  {field.required && <span className="text-red-500 ml-1">*</span>}
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
                        autoCorrect="on"
                        autoCapitalize="sentences"
                        lang="en"
                        value={itemVal ?? ''}
                        onChange={(e) => {
                          const updated = [...list];
                          updated[idx] = e.target.value;
                          onChange(field.key, updated);
                        }}
                        placeholder={`Item ${idx + 1}`}
                        className="flex-1 px-3.5 py-2 rounded-[6px] border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#315FEA]/20 focus:border-[#315FEA]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = list.filter((_, i) => i !== idx);
                          onChange(field.key, updated);
                        }}
                        className="p-2 rounded-[6px] text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
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
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {field.tooltip && <InfoTooltip content={field.tooltip} />}
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {items.length} configured
                </span>
              </div>

              {items.length === 0 ? (
                <div className="p-4 rounded-[8px] border border-dashed border-slate-200 dark:border-[#1E293B] text-center text-xs text-slate-400">
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
                        className="p-4 rounded-[8px] border border-slate-200 dark:border-[#1E293B] bg-slate-50/60 dark:bg-[#0B1120]/40 space-y-4"
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
                            className="p-1.5 rounded-[6px] text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
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
                                  className="inline-flex items-center flex-row flex-nowrap whitespace-nowrap gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-semibold text-[#7950B8] dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  <Sparkles className="w-3 h-3 text-[#7950B8] dark:text-purple-400 shrink-0" />
                                  <span>Improve with AI</span>
                                </button>
                              }
                            >
                              {subField.type === 'textarea' ? (
                                <textarea
                                  rows={2}
                                  maxLength={subField.maxLength}
                                  spellCheck={true}
                                  autoCorrect="on"
                                  autoCapitalize="sentences"
                                  lang="en"
                                  value={item[subField.key] ?? ''}
                                  onChange={(e) => {
                                    const updated = [...items];
                                    updated[itemIdx] = { ...updated[itemIdx], [subField.key]: e.target.value };
                                    onChange(field.key, updated);
                                  }}
                                  placeholder={subField.placeholder}
                                  className="w-full px-3 py-2 rounded-[6px] border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#315FEA]/20 focus:border-[#315FEA]"
                                />
                              ) : (
                                <input
                                  type="text"
                                  spellCheck={!subField.key.toLowerCase().includes('url') && !subField.key.toLowerCase().includes('image') && !subField.key.toLowerCase().includes('icon')}
                                  autoCorrect={!subField.key.toLowerCase().includes('url') && !subField.key.toLowerCase().includes('image') && !subField.key.toLowerCase().includes('icon') ? 'on' : 'off'}
                                  autoCapitalize={!subField.key.toLowerCase().includes('url') && !subField.key.toLowerCase().includes('image') && !subField.key.toLowerCase().includes('icon') ? 'sentences' : 'none'}
                                  lang="en"
                                  maxLength={subField.maxLength}
                                  value={item[subField.key] ?? ''}
                                  onChange={(e) => {
                                    const updated = [...items];
                                    updated[itemIdx] = { ...updated[itemIdx], [subField.key]: e.target.value };
                                    onChange(field.key, updated);
                                  }}
                                  placeholder={subField.placeholder}
                                  className="w-full px-3 py-2 rounded-[6px] border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#315FEA]/20 focus:border-[#315FEA]"
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
