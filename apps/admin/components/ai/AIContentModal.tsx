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
}

export const AI_OPERATIONS = [
  {
    key: 'ImproveWording',
    label: 'Improve Wording',
    description: 'Refine flow, phrasing, and appeal while maintaining exact business facts.',
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

export interface AIContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldKey: string;
  fieldLabel: string;
  sectionKey?: string;
  sectionTitle?: string;
  currentText: string;
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
  onApply,
}: AIContentModalProps) {
  const [aiConnection, setAiConnection] = useState<AIConnectionDto | null>(null);
  const [isLoadingAiConnection, setIsLoadingAiConnection] = useState(false);
  const [aiConnectionError, setAiConnectionError] = useState<string | null>(null);

  const [aiOperation, setAiOperation] = useState('ImproveWording');
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
      setAiOperation('ImproveWording');
      setAiInstruction('');
      setAiSuggestion(null);
      setAiEditableSuggestion('');
      setCurrentAiRequestId(null);
      setAiReviewStatus('PendingReview');
      setAiConflictError(null);
      setAiError(null);
      loadAiConnection();
    }
  }, [isOpen, loadAiConnection]);

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
    if (!currentText.trim()) {
      setAiError('Please enter some text in the field first before improving with AI.');
      return;
    }

    setIsGeneratingAi(true);
    setAiError(null);
    setAiConflictError(null);

    try {
      const resp = await apiClient.post<any>('/ai/content/improve', {
        sectionKey: sectionKey || 'business-context',
        field: fieldKey,
        operation: aiOperation,
        currentText: currentText.trim(),
        instruction: aiOperation === 'CustomInstruction' ? aiInstruction.trim() : undefined,
      });

      const data: AIContentResponseDto = resp?.data ?? resp;
      setCurrentAiRequestId(data.aiRequestId);
      setAiReviewStatus(data.reviewStatus || 'PendingReview');
      setAiSuggestion(data.suggestion);
      setAiEditableSuggestion(data.suggestion);
    } catch (err: any) {
      const msg = err?.message || 'Failed to generate AI suggestion. Please try again.';
      setAiError(msg);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleAcceptAiSuggestion = async () => {
    if (!aiEditableSuggestion.trim()) return;

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
      toast.success('AI suggestion applied successfully.');
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
      // Even if audit reject call fails, close safely without altering user text
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isGeneratingAi && !isAcceptingAi && onClose()}
      title="Improve with AI"
      description={
        sectionTitle
          ? `Refine "${fieldLabel}" in ${sectionTitle} using your configured AI model.`
          : `Refine "${fieldLabel}" while preserving your verified business facts.`
      }
      maxWidth="2xl"
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
      <div className="space-y-4 pb-1">
        {/* Case 1: Checking AI Connection state */}
        {isLoadingAiConnection && !aiConnection && (
          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#1E293B]/60 border border-slate-200 dark:border-[#334155] flex flex-col items-center justify-center text-center space-y-2.5">
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

        {/* Case 2: Verification Error */}
        {!isLoadingAiConnection && aiConnectionError && !aiConnection && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-3">
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

        {/* Case 3: AI Provider Not Connected */}
        {!isLoadingAiConnection && aiConnection && aiConnection.status === 'NotConnected' && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-3">
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

        {/* Case 4: Invalid Configuration */}
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
                <Button type="button" variant="primary" size="sm" leftIcon={<ExternalLink className="w-3.5 h-3.5" />}>
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

        {/* Case 6: Active AI Provider Connected */}
        {aiConnection && aiConnection.status === 'Connected' && isContentAiAvailable && (
          <>
            {/* Provider info pill */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-[#1E293B]/60 border border-slate-200/90 dark:border-[#334155]">
              <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Connected AI:
                </span>
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800/40 truncate max-w-[200px] sm:max-w-none">
                  {aiConnection.providerDisplayName || aiConnection.providerKey} • {aiConnection.selectedModelDisplayName || aiConnection.selectedModelKey}
                </span>
              </div>
              <Link
                href="/admin/ai-models"
                className="text-xs font-semibold text-[#3B82F6] hover:text-[#2563EB] dark:text-[#60A5FA] flex items-center gap-1 transition-colors shrink-0"
              >
                <span>Manage</span>
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
                  {currentText.length} characters
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#1E293B] text-xs text-slate-800 dark:text-slate-200 max-h-24 overflow-y-auto leading-relaxed select-text font-normal break-words">
                {currentText || <span className="italic text-slate-400">No content entered</span>}
              </div>
            </div>

            {/* Step 1: Operation Selection */}
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
                            'text-left p-3 rounded-xl border transition-all text-xs flex flex-col justify-start gap-1 group min-h-[64px]',
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

                {/* Custom Instruction */}
                {aiOperation === 'CustomInstruction' && (
                  <FormField
                    label="Custom Instruction"
                    required
                    helperText="Specify the exact adjustment while keeping factual accuracy (e.g., 'Make it more welcoming for residential clients')."
                  >
                    <input
                      type="text"
                      maxLength={500}
                      spellCheck={true}
                      value={aiInstruction}
                      onChange={(e) => setAiInstruction(e.target.value)}
                      placeholder="e.g. Emphasize fast delivery and certified craftsmen"
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
                {/* Status Badges */}
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

                {/* Guidance Banner */}
                <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/40 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2">
                  <InfoTooltip content="AI suggestions are untrusted until explicitly accepted. Accepting applies the suggestion to your form. The original text is preserved until you accept." />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-blue-950 dark:text-blue-100">Human Review Required</p>
                    <p className="text-blue-800/90 dark:text-blue-300/80 leading-relaxed text-[11px]">
                      Review this suggestion carefully. You can edit the copy below before accepting.
                    </p>
                  </div>
                </div>

                {/* Conflict Alert */}
                {aiConflictError && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700/50 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
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
                  <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-xs text-red-800 dark:text-red-300 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Review Action Failed</p>
                      <p className="mt-0.5">{aiError}</p>
                    </div>
                  </div>
                )}

                {/* Suggestion Textarea */}
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
                    spellCheck={true}
                    value={aiEditableSuggestion}
                    onChange={(e) => setAiEditableSuggestion(e.target.value)}
                    className="w-full p-3.5 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-[#0B1120] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 leading-relaxed font-normal shadow-xs"
                    placeholder="AI suggestion will appear here..."
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Edit3 className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>You can edit this suggestion directly before accepting it into your form.</span>
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
