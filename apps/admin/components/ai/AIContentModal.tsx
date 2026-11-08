'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  AlertCircle,
  RotateCcw,
  ExternalLink,
  Check,
  RefreshCw,
  Edit3,
  CheckCircle2,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
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
  maxLength?: number;
  fieldRole?: string;
}

export interface OperationOption {
  key: string;
  label: string;
  description: string;
  isRecommended?: boolean;
}

export function deriveFieldRole(sectionKey?: string, fieldKey?: string, explicitRole?: string): string {
  if (explicitRole) return explicitRole.toLowerCase();
  const s = (sectionKey || '').toLowerCase();
  const f = (fieldKey || '').toLowerCase();

  if (f.includes('eyebrow') || f.includes('badge') || f.includes('tag')) return 'tag';
  if (f.includes('cta') || f.includes('button') || f.includes('action')) return 'cta';
  if (f.includes('headline') || f.includes('title') || f.endsWith('heading')) return 'heading';
  if (s.includes('services') && (f.includes('description') || f.includes('tagline'))) return 'service-description';
  if (f.includes('description') || f.includes('story') || f.includes('bio') || f.includes('subheadline')) {
    if (s.includes('about') || s.includes('story') || s.includes('hero')) return 'story';
    return 'description';
  }
  return 'general';
}

export function getContextualOperations(role: string): OperationOption[] {
  switch (role) {
    case 'tag':
      return [
        {
          key: 'MakeShorter',
          label: 'Make Punchy & Concise',
          description: 'Trim down to a crisp, high-impact phrase under character limits.',
          isRecommended: true,
        },
        {
          key: 'ImproveWording',
          label: 'Improve Wording',
          description: 'Refine flow and phrasing while maintaining exact business facts.',
        },
        {
          key: 'MakeMoreProfessional',
          label: 'Make More Professional',
          description: 'Elevate tone to be authoritative and brand-consistent.',
        },
        {
          key: 'CustomInstruction',
          label: 'Custom Instruction',
          description: 'Provide specific custom guidance for this badge or tag.',
        },
      ];

    case 'cta':
      return [
        {
          key: 'ImproveWording',
          label: 'Make Action-Focused',
          description: 'Craft a compelling, direct action label that prompts user engagement.',
          isRecommended: true,
        },
        {
          key: 'MakeShorter',
          label: 'Make Shorter',
          description: 'Keep the call-to-action concise, punchy, and urgent.',
        },
        {
          key: 'CustomInstruction',
          label: 'Custom Instruction',
          description: 'Provide specific custom guidance for this action button.',
        },
      ];

    case 'heading':
      return [
        {
          key: 'ImproveWording',
          label: 'Make High-Impact',
          description: 'Craft an engaging, memorable headline communicating clear business value.',
          isRecommended: true,
        },
        {
          key: 'MakeClearer',
          label: 'Make Clearer',
          description: 'Simplify phrasing and structure for immediate customer understanding.',
        },
        {
          key: 'MakeMoreProfessional',
          label: 'Make More Professional',
          description: 'Elevate tone to be sophisticated, authoritative, and credible.',
        },
        {
          key: 'MakeShorter',
          label: 'Make Shorter',
          description: 'Tighten copy for fast, punchy hero headline scanning.',
        },
        {
          key: 'CustomInstruction',
          label: 'Custom Instruction',
          description: 'Provide specific custom direction for this heading.',
        },
      ];

    case 'service-description':
      return [
        {
          key: 'ImproveServiceDescription',
          label: 'Improve Service Explanation',
          description: 'Highlight craft, client benefits, and distinct service outcomes.',
          isRecommended: true,
        },
        {
          key: 'ImproveWording',
          label: 'Improve Wording',
          description: 'Refine language, flow, and business appeal with verified facts.',
        },
        {
          key: 'MakeClearer',
          label: 'Make Clearer',
          description: 'Explain the offering with direct, jargon-free clarity.',
        },
        {
          key: 'MakeShorter',
          label: 'Make Shorter',
          description: 'Condense description for fast skimming and card layouts.',
        },
        {
          key: 'CustomInstruction',
          label: 'Custom Instruction',
          description: 'Provide specific custom guidance for this service offering.',
        },
      ];

    case 'story':
      return [
        {
          key: 'ImproveWording',
          label: 'Improve Narrative Flow',
          description: 'Smooth company storytelling while keeping verified business history.',
          isRecommended: true,
        },
        {
          key: 'MakeMoreProfessional',
          label: 'Make More Professional',
          description: 'Elevate tone to executive, trustworthy company positioning.',
        },
        {
          key: 'MakeClearer',
          label: 'Make Clearer',
          description: 'Ensure company background and value proposition are crystal clear.',
        },
        {
          key: 'MakeShorter',
          label: 'Make Shorter',
          description: 'Condense narrative into essential, memorable highlights.',
        },
        {
          key: 'CustomInstruction',
          label: 'Custom Instruction',
          description: 'Provide specific narrative direction grounded in your facts.',
        },
      ];

    default:
      return [
        {
          key: 'ImproveWording',
          label: 'Improve Wording',
          description: 'Refine flow, phrasing, and appeal while maintaining exact business facts.',
          isRecommended: true,
        },
        {
          key: 'MakeMoreProfessional',
          label: 'Make More Professional',
          description: 'Elevate tone to be sophisticated, authoritative, and brand-consistent.',
        },
        {
          key: 'MakeShorter',
          label: 'Make Shorter',
          description: 'Craft a punchy, concise version optimized for fast scanning.',
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
  }
}

const STARTER_CHIPS = [
  'Focus on homeowners',
  'Make more conversational',
  'Highlight fast response',
  'Emphasize verified quality',
];

export interface AIContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldKey: string;
  fieldLabel: string;
  sectionKey?: string;
  sectionTitle?: string;
  currentText: string;
  maxLength?: number;
  fieldRole?: string;
  onApply: (improvedText: string) => void;
}

export function AIContentModal({
  isOpen,
  onClose,
  fieldKey,
  fieldLabel,
  sectionKey = 'business-context',
  sectionTitle,
  currentText,
  maxLength,
  fieldRole,
  onApply,
}: AIContentModalProps) {
  const [aiConnection, setAiConnection] = useState<AIConnectionDto | null>(null);
  const [isLoadingAiConnection, setIsLoadingAiConnection] = useState(false);
  const [aiConnectionError, setAiConnectionError] = useState<string | null>(null);

  const effectiveRole = useMemo(() => {
    return deriveFieldRole(sectionKey, fieldKey, fieldRole);
  }, [sectionKey, fieldKey, fieldRole]);

  const operations = useMemo(() => {
    return getContextualOperations(effectiveRole);
  }, [effectiveRole]);

  const [aiOperation, setAiOperation] = useState<string>('ImproveWording');
  const [aiInstruction, setAiInstruction] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiEditableSuggestion, setAiEditableSuggestion] = useState('');
  const [currentAiRequestId, setCurrentAiRequestId] = useState<string | null>(null);
  const [aiReviewStatus, setAiReviewStatus] = useState<string>('PendingReview');
  const [isAcceptingAi, setIsAcceptingAi] = useState(false);
  const [isRejectingAi, setIsRejectingAi] = useState(false);
  const [aiConflictError, setAiConflictError] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Mobile review tab toggle: 'original' vs 'suggestion'
  const [mobileReviewTab, setMobileReviewTab] = useState<'original' | 'suggestion'>('suggestion');

  const loadAiConnection = useCallback(async () => {
    setIsLoadingAiConnection(true);
    setAiConnectionError(null);
    try {
      const resp = await apiClient.get<any>('/ai/connection');
      const data: AIConnectionDto = resp?.data ?? resp;
      setAiConnection(data);
    } catch (err: any) {
      setAiConnectionError(err?.message || 'Unable to verify AI configuration.');
      setAiConnection(null);
    } finally {
      setIsLoadingAiConnection(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Default to recommended operation for this field role
      const defaultOp = operations.find((o) => o.isRecommended)?.key || operations[0]?.key || 'ImproveWording';
      setAiOperation(defaultOp);
      setAiInstruction('');
      setAiSuggestion(null);
      setAiEditableSuggestion('');
      setCurrentAiRequestId(null);
      setAiReviewStatus('PendingReview');
      setAiConflictError(null);
      setAiError(null);
      setMobileReviewTab('suggestion');
      loadAiConnection();
    }
  }, [isOpen, operations, loadAiConnection]);

  const isContentAiAvailable = useMemo(() => {
    if (!aiConnection || aiConnection.status !== 'Connected') return false;
    if (typeof aiConnection.isContentAIAvailable === 'boolean') {
      return aiConnection.isContentAIAvailable;
    }
    return (
      aiConnection.supportedCapability === 'Content' ||
      aiConnection.supportedCapability === 'Both'
    );
  }, [aiConnection]);

  const handleGenerateAi = async () => {
    if (!currentText.trim() || isGeneratingAi) {
      if (!currentText.trim()) {
        setAiError('Please enter some text in the field first before improving with AI.');
      }
      return;
    }

    setIsGeneratingAi(true);
    setAiError(null);
    setAiConflictError(null);
    setAiSuggestion(null);
    setAiEditableSuggestion('');
    setCurrentAiRequestId(null);

    try {
      const resp = await apiClient.post<any>('/ai/content/improve', {
        sectionKey: sectionKey || 'business-context',
        field: fieldKey,
        operation: aiOperation,
        currentText: currentText.trim(),
        instruction: aiOperation === 'CustomInstruction' ? aiInstruction.trim() : undefined,
      });

      const data: AIContentResponseDto = resp?.data ?? resp;
      const suggestionText = (data?.suggestion || '').trim();

      if (!suggestionText) {
        setAiError("We couldn't create a suggestion. Your original content is unchanged.");
        return;
      }

      setCurrentAiRequestId(data.aiRequestId);
      setAiReviewStatus(data.reviewStatus || 'PendingReview');
      setAiSuggestion(suggestionText);
      setAiEditableSuggestion(suggestionText);
      setMobileReviewTab('suggestion');
    } catch (err: any) {
      const msg = err?.message || "We couldn't create a suggestion. Your original content is unchanged.";
      setAiError(msg);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleAcceptAiSuggestion = async () => {
    if (!aiEditableSuggestion.trim()) return;

    // Check budget
    if (maxLength && aiEditableSuggestion.length > maxLength) {
      setAiError(`Suggestion exceeds the maximum length of ${maxLength} characters. Please shorten it before accepting.`);
      return;
    }

    setIsAcceptingAi(true);
    setAiError(null);
    setAiConflictError(null);

    try {
      if (currentAiRequestId) {
        await apiClient.post(`/ai/requests/${currentAiRequestId}/accept`, {
          editedText: aiEditableSuggestion,
        });
      }

      onApply(aiEditableSuggestion);
      onClose();
    } catch (err: any) {
      if (err?.code === 'RESULT_STALE_CONFLICT') {
        setAiConflictError(
          err.message ||
            'The content was modified concurrently. Please refresh before applying.'
        );
      } else {
        setAiError(err?.message || 'Failed to accept AI suggestion.');
      }
    } finally {
      setIsAcceptingAi(false);
    }
  };

  const handleRejectAiSuggestion = async () => {
    setIsRejectingAi(true);
    try {
      if (currentAiRequestId) {
        await apiClient.post(`/ai/requests/${currentAiRequestId}/reject`, {});
      }
      toast.info('AI suggestion discarded.');
      onClose();
    } catch (err: any) {
      onClose();
    } finally {
      setIsRejectingAi(false);
    }
  };

  const handleResetAiSuggestion = () => {
    setAiSuggestion(null);
    setAiEditableSuggestion('');
    setCurrentAiRequestId(null);
    setAiConflictError(null);
    setAiError(null);
  };

  // Character budget & delta calculations
  const originalCharCount = currentText.length;
  const suggestionCharCount = aiEditableSuggestion.length;
  const charDelta = suggestionCharCount - originalCharCount;
  const isOverBudget = maxLength ? suggestionCharCount > maxLength : false;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isGeneratingAi && !isAcceptingAi && onClose()}
      title="Improve with AI"
      description={
        sectionTitle
          ? `${sectionTitle} › ${fieldLabel}`
          : fieldLabel
      }
      maxWidth="ai"
      preventOutsideClose={Boolean(aiSuggestion || isGeneratingAi || isAcceptingAi)}
      footer={
        (() => {
          if (isLoadingAiConnection && !aiConnection) {
            return (
              <div className="flex justify-end w-full">
                <Button type="button" variant="outline" size="sm" onClick={onClose} className="w-full sm:w-auto">
                  Close
                </Button>
              </div>
            );
          }

          if (
            (aiConnectionError && !aiConnection) ||
            aiConnection?.status !== 'Connected' ||
            !isContentAiAvailable
          ) {
            return (
              <div className="flex justify-end w-full">
                <Button type="button" variant="outline" size="sm" onClick={onClose} className="w-full sm:w-auto">
                  Close
                </Button>
              </div>
            );
          }

          // Step 2: Review & Accept Actions
          if (aiSuggestion) {
            return (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
                {/* Client-safe trusted indicator in footer */}
                <div className="flex items-center gap-1.5 text-xs text-[#7950B8] font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Business Context Grounded AI</span>
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5">
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
                    Discard
                  </Button>

                  <Button
                    type="button"
                    variant="creative"
                    size="sm"
                    onClick={handleAcceptAiSuggestion}
                    isLoading={isAcceptingAi}
                    loadingText="Applying..."
                    disabled={
                      !aiEditableSuggestion.trim() ||
                      isOverBudget ||
                      isAcceptingAi ||
                      isRejectingAi
                    }
                    leftIcon={<Check className="w-3.5 h-3.5 text-white" />}
                    className="w-full sm:w-auto justify-center whitespace-nowrap shadow-soft-xs"
                  >
                    Apply to Draft
                  </Button>
                </div>
              </div>
            );
          }

          // Step 1: Operation Selection & Generate Actions
          return (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
              {/* Quiet provider indicator */}
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                <span>AI Connected:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {aiConnection.providerDisplayName || aiConnection.providerKey}
                </span>
                {aiConnection.selectedModelDisplayName && (
                  <span className="text-[11px] text-slate-400">
                    ({aiConnection.selectedModelDisplayName})
                  </span>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
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
                  loadingText="Generating..."
                  disabled={isGeneratingAi || (aiOperation === 'CustomInstruction' && !aiInstruction.trim())}
                  leftIcon={<Sparkles className="w-3.5 h-3.5 text-white" />}
                  className="w-full sm:w-auto justify-center whitespace-nowrap bg-[#315FEA] hover:bg-[#254EDB] text-white"
                >
                  Generate Suggestion
                </Button>
              </div>
            </div>
          );
        })()
      }
    >
      <div className="space-y-4 pb-1">
        {/* Verification Loading */}
        {isLoadingAiConnection && !aiConnection && (
          <div className="p-6 rounded-[8px] bg-slate-50 dark:bg-[#1E293B]/60 border border-slate-200 dark:border-[#334155] flex flex-col items-center justify-center text-center space-y-2.5">
            <RefreshCw className="w-6 h-6 text-[#315FEA] animate-spin" />
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

        {/* Verification Error */}
        {!isLoadingAiConnection && aiConnectionError && !aiConnection && (
          <div className="p-4 rounded-[8px] bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <p className="font-semibold text-sm">Unable to verify AI connection</p>
                <p className="text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                  {aiConnectionError}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
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
                <Button type="button" variant="ghost" size="sm" leftIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                  Manage AI Connection
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* AI Provider Not Connected */}
        {!isLoadingAiConnection && aiConnection && aiConnection.status === 'NotConnected' && (
          <div className="p-4 rounded-[8px] bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <p className="font-semibold text-sm">AI Provider Connection Required</p>
                <p className="text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                  To use AI assistance, please connect an AI provider (such as Google Gemini, OpenAI, or Anthropic Claude) in AI Connections.
                </p>
              </div>
            </div>
            <div className="pt-1">
              <Link href="/admin/ai-models">
                <Button type="button" variant="primary" size="sm" leftIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                  Connect AI Provider
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Invalid Configuration */}
        {!isLoadingAiConnection && aiConnection && aiConnection.status === 'Invalid' && (
          <div className="p-4 rounded-[8px] bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 space-y-3">
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
                <Button type="button" variant="primary" size="sm" leftIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                  Update AI Connection
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Model Does Not Support Content AI */}
        {!isLoadingAiConnection && aiConnection && aiConnection.status === 'Connected' && !isContentAiAvailable && (
          <div className="p-4 rounded-[8px] bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <p className="font-semibold text-sm">Content AI Unavailable for Selected Model</p>
                <p className="text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                  Your connected model ({aiConnection.selectedModelDisplayName || aiConnection.selectedModelKey}) does not support text generation workflows. Please select a compatible model in AI Connections.
                </p>
              </div>
            </div>
            <div className="pt-1">
              <Link href="/admin/ai-models">
                <Button type="button" variant="primary" size="sm" leftIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                  Manage AI Connection
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Connected AI Provider Active */}
        {aiConnection && aiConnection.status === 'Connected' && isContentAiAvailable && (
          <>
            {/* Grounding Status & Breadcrumb Banner */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-[8px] bg-slate-50 dark:bg-[#1E293B]/60 border border-slate-200/90 dark:border-[#334155]">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-medium text-slate-500 dark:text-slate-400">
                  {sectionTitle || 'Website Section'}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-900 dark:text-white">
                  {fieldLabel}
                </span>
              </div>

              {/* Grounding Status Badge */}
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#315FEA]/10 border border-[#315FEA]/20 text-[11px] font-medium text-[#315FEA] dark:text-[#60A5FA]">
                <Sparkles className="w-3 h-3 text-[#315FEA] dark:text-[#60A5FA] shrink-0" />
                <span>Grounded in verified Business Context</span>
              </div>
            </div>

            {/* Step 1: Content Input & Operation Selection */}
            {!aiSuggestion && (
              <div className="space-y-4">
                {/* Current Content Card */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                      Current Content
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {originalCharCount}{maxLength ? ` / ${maxLength}` : ''} characters
                    </span>
                  </div>
                  <div className="p-3 rounded-[8px] bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#1E293B] text-xs text-slate-800 dark:text-slate-200 max-h-24 overflow-y-auto leading-relaxed select-text font-normal break-words">
                    {currentText || <span className="italic text-slate-400">No content entered</span>}
                  </div>
                </div>

                {/* Operation Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                      Choose AI Operation
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Tailored for {effectiveRole}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                    {operations.map((op) => {
                      const isSelected = aiOperation === op.key;
                      return (
                        <button
                          key={op.key}
                          type="button"
                          disabled={isGeneratingAi}
                          onClick={() => setAiOperation(op.key)}
                          className={cn(
                            'text-left p-3 rounded-[8px] border transition-all text-xs flex flex-col justify-start gap-1 group min-h-[64px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315FEA] relative',
                            isSelected
                              ? 'bg-[#315FEA]/5 border-[#315FEA] text-[#172033] dark:text-white ring-1 ring-[#315FEA]/30 shadow-xs'
                              : 'bg-white dark:bg-[#0F172A] border-slate-200 dark:border-[#1E293B] hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300',
                            isGeneratingAi && 'opacity-60 cursor-not-allowed'
                          )}
                        >
                          <div className="flex items-center justify-between gap-2 w-full">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-semibold text-slate-900 dark:text-white truncate">
                                {op.label}
                              </span>
                              {op.isRecommended && (
                                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[4px] bg-[#315FEA]/15 text-[#315FEA] dark:text-[#60A5FA] border border-[#315FEA]/20 shrink-0">
                                  Recommended
                                </span>
                              )}
                            </div>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-[#315FEA] shrink-0" />
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

                {/* Multiline Custom Instruction with Quick Starter Chips */}
                {aiOperation === 'CustomInstruction' && (
                  <div className="space-y-2 p-3.5 rounded-[8px] bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#1E293B]">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Custom Guidance
                      </label>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {aiInstruction.length} / 500
                      </span>
                    </div>

                    <textarea
                      rows={3}
                      maxLength={500}
                      spellCheck={true}
                      autoCorrect="on"
                      autoCapitalize="sentences"
                      lang="en"
                      disabled={isGeneratingAi}
                      value={aiInstruction}
                      onChange={(e) => setAiInstruction(e.target.value)}
                      placeholder="e.g., Emphasize residential craftsmanship and prompt response for local homeowners."
                      className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0F172A] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#315FEA] focus:border-[#315FEA] leading-relaxed disabled:opacity-60 disabled:cursor-not-allowed"
                    />

                    {/* Quick Starter Chips */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Quick Starters:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {STARTER_CHIPS.map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            disabled={isGeneratingAi}
                            onClick={() => {
                              setAiInstruction((prev) => {
                                const trimmed = prev.trim();
                                if (!trimmed) return chip;
                                if (trimmed.includes(chip)) return trimmed;
                                return `${trimmed}. ${chip}`;
                              });
                            }}
                            className="text-[11px] font-medium px-2.5 py-1 rounded-[4px] bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 hover:border-[#315FEA] text-slate-600 dark:text-slate-300 hover:text-[#315FEA] transition-colors"
                          >
                            + {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Error Alert */}
                {aiError && (
                  <div className="p-3.5 rounded-[8px] bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-xs text-red-800 dark:text-red-300 flex items-start gap-2.5">
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
                {/* Human Review Banner & Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-[8px] bg-slate-50 dark:bg-[#1E293B]/60 border border-slate-200 dark:border-[#334155]">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-[#94A3B8]">Review Status:</span>
                    <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-[4px] border border-amber-200 dark:border-amber-800/40">
                      Pending Human Review
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Delta badge */}
                    <span
                      className={cn(
                        'text-[11px] font-semibold px-2 py-0.5 rounded-[4px] border font-mono',
                        charDelta > 0
                          ? 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                          : charDelta < 0
                          ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40'
                          : 'text-slate-600 bg-slate-50 border-slate-200'
                      )}
                    >
                      {charDelta > 0 ? `+${charDelta} chars` : charDelta < 0 ? `${charDelta} chars` : 'same length'}
                    </span>

                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-[4px] border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      Server-Validated
                    </span>
                  </div>
                </div>

                {/* Over-budget Warning */}
                {isOverBudget && (
                  <div className="p-3 rounded-[8px] bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700/50 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Exceeds Maximum Field Length</p>
                      <p className="mt-0.5 text-[11px] text-amber-800 dark:text-amber-300">
                        This suggestion has {suggestionCharCount} characters, which exceeds the schema limit of {maxLength} characters by {suggestionCharCount - (maxLength || 0)} characters. Please edit the text below to fit the limit before applying.
                      </p>
                    </div>
                  </div>
                )}

                {/* Conflict Alert */}
                {aiConflictError && (
                  <div className="p-3 rounded-[8px] bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700/50 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-semibold">Conflict Detected</p>
                      <p className="text-amber-800/90 dark:text-amber-300/80 leading-relaxed text-[11px]">
                        {aiConflictError}
                      </p>
                    </div>
                  </div>
                )}

                {/* AI Error Alert */}
                {aiError && !aiConflictError && (
                  <div className="p-3.5 rounded-[8px] bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-xs text-red-800 dark:text-red-300 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Review Action Failed</p>
                      <p className="mt-0.5">{aiError}</p>
                    </div>
                  </div>
                )}

                {/* Mobile View: Segmented Control Toggle (< 768px) */}
                <div className="block sm:hidden">
                  <div className="flex p-1 bg-slate-100 dark:bg-[#1E293B] rounded-[8px] mb-3">
                    <button
                      type="button"
                      onClick={() => setMobileReviewTab('original')}
                      className={cn(
                        'flex-1 py-1.5 text-xs font-semibold rounded-[6px] transition-colors',
                        mobileReviewTab === 'original'
                          ? 'bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 dark:text-slate-400'
                      )}
                    >
                      Original ({originalCharCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileReviewTab('suggestion')}
                      className={cn(
                        'flex-1 py-1.5 text-xs font-semibold rounded-[6px] transition-colors',
                        mobileReviewTab === 'suggestion'
                          ? 'bg-white dark:bg-[#0B1120] text-[#315FEA] dark:text-[#60A5FA] shadow-xs'
                          : 'text-slate-500 dark:text-slate-400'
                      )}
                    >
                      AI Suggestion ({suggestionCharCount})
                    </button>
                  </div>

                  {mobileReviewTab === 'original' ? (
                    <div className="p-3.5 rounded-[8px] bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#1E293B] text-xs text-slate-800 dark:text-slate-200 max-h-48 overflow-y-auto leading-relaxed select-text font-normal break-words">
                      {currentText}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <textarea
                        rows={4}
                        spellCheck={true}
                        autoCorrect="on"
                        autoCapitalize="sentences"
                        lang="en"
                        value={aiEditableSuggestion}
                        onChange={(e) => setAiEditableSuggestion(e.target.value)}
                        className={cn(
                          'w-full p-3 rounded-[6px] border bg-white dark:bg-[#0B1120] text-xs text-slate-900 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#315FEA] leading-relaxed font-normal shadow-xs',
                          isOverBudget
                            ? 'border-red-400 dark:border-red-600 focus-visible:ring-red-400'
                            : 'border-[#315FEA]/50 dark:border-[#315FEA]/60'
                        )}
                        placeholder="AI suggestion will appear here..."
                      />
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Edit3 className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Editable before applying to draft.</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Desktop View: Side-by-Side Comparison (>= 768px) */}
                <div className="hidden sm:grid sm:grid-cols-2 gap-3.5">
                  {/* Left Column: Original Content */}
                  <div className="space-y-1.5 flex flex-col">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                        Original Content
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {originalCharCount} chars
                      </span>
                    </div>

                    <div className="p-3.5 rounded-[8px] bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#1E293B] text-xs text-slate-800 dark:text-slate-200 flex-1 overflow-y-auto leading-relaxed select-text font-normal break-words max-h-56">
                      {currentText}
                    </div>
                  </div>

                  {/* Right Column: AI Suggestion */}
                  <div className="space-y-1.5 flex flex-col">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#315FEA] dark:text-[#60A5FA] flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          AI Suggestion
                        </span>
                        <span className="text-[9px] font-semibold text-[#315FEA] dark:text-[#60A5FA] bg-[#315FEA]/10 px-1.5 py-0.5 rounded-[4px] border border-[#315FEA]/20">
                          Editable
                        </span>
                      </div>

                      <span
                        className={cn(
                          'text-[11px] font-mono',
                          isOverBudget ? 'text-red-500 font-bold' : 'text-slate-400'
                        )}
                      >
                        {suggestionCharCount}{maxLength ? ` / ${maxLength}` : ''} chars
                      </span>
                    </div>

                    <textarea
                      rows={5}
                      spellCheck={true}
                      autoCorrect="on"
                      autoCapitalize="sentences"
                      lang="en"
                      value={aiEditableSuggestion}
                      onChange={(e) => setAiEditableSuggestion(e.target.value)}
                      className={cn(
                        'w-full p-3 rounded-[6px] border bg-white dark:bg-[#0B1120] text-xs text-slate-900 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#315FEA] leading-relaxed font-normal shadow-xs flex-1',
                        isOverBudget
                          ? 'border-red-400 dark:border-red-600 focus-visible:ring-red-400'
                          : 'border-[#315FEA]/50 dark:border-[#315FEA]/60'
                      )}
                      placeholder="AI suggestion will appear here..."
                    />

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Edit3 className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>Edit directly before applying to draft.</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
