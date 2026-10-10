'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  SlidersHorizontal,
  Layers,
  Maximize2,
  Eye,
  RefreshCw,
  Sun,
  Check,
  CheckCircle2,
  AlertCircle,
  X,
  ZoomIn,
  ZoomOut,
  Columns,
  SplitSquareVertical,
  Rows,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  Info,
  Loader2,
  Upload,
  Globe,
  Trash2
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/Button';

export interface ImageVariantDto {
  id: string;
  imageId: string;
  parentVariantId?: string;
  variantType: string;
  operation?: string;
  mimeType: string;
  fileSize: number;
  width: number;
  height: number;
  version: number;
  status: string;
  previewUrl: string;
  createdAt: string;
  algorithmVersion?: string;
  effectiveProfile?: string;
  appliedCorrections?: string[];
}

export interface ImageDto {
  id: string;
  tenantId: string;
  websiteId: string;
  originalFileName?: string;
  mimeType: string;
  fileSize: number;
  width: number;
  height: number;
  usageType: 'WebsiteImage' | 'ExploreOurWork';
  slot?: string;
  projectWorkName?: string;
  category?: string;
  caption?: string;
  status: 'Uploaded' | 'Validated' | 'Approved' | 'Published' | 'Unused' | 'Rejected';
  isActiveWebsiteUsage: boolean;
  previewUrl: string;
  createdAt: string;
  updatedAt: string;
  variants: ImageVariantDto[];
}

export interface ImageStudioWorkspaceProps {
  image: ImageDto;
  onClose: () => void;
  onImageUpdated: (updatedImage: ImageDto) => void;
  resolveImageUrl: (url: string | null | undefined) => string;
  onReplaceRequested?: (image: ImageDto) => void;
  onDeleteRequested?: (image: ImageDto) => void;
}

export interface EnhancementOpDef {
  id: string;
  name: string;
  icon: React.ElementType;
  tagline: string;
  description: string;
}

export const APPROVED_OPERATIONS: EnhancementOpDef[] = [
  {
    id: 'ImproveClarity',
    name: 'Improve Clarity',
    icon: Sparkles,
    tagline: 'Balanced tone & haze reduction',
    description: 'Expands tonal contrast and shadow detail while strictly preserving highlight headroom.',
  },
  {
    id: 'ImproveSharpness',
    name: 'Improve Sharpness',
    icon: SlidersHorizontal,
    tagline: 'Controlled edge definition',
    description: 'Restrained edge enhancement that avoids artificial halos and maintains authentic materials.',
  },
  {
    id: 'ReduceNoise',
    name: 'Reduce Noise',
    icon: Layers,
    tagline: 'Texture-aware smoothing',
    description: 'Suppresses grain in flat and shadowy surfaces while preserving fine wood and masonry grain.',
  },
  {
    id: 'Upscale',
    name: 'Upscale',
    icon: Maximize2,
    tagline: 'High-resolution interpolation',
    description: 'Increases usable pixel resolution for crisp presentation on high-DPI displays.',
  },
  {
    id: 'ClassicLook',
    name: 'Classic Look',
    icon: Eye,
    tagline: 'Warm editorial contrast',
    description: 'Refined tonal curve with organic warmth and rich midtones suited for architectural showcase.',
  },
  {
    id: 'ModernLook',
    name: 'Modern Look',
    icon: Sun,
    tagline: 'Crisp contemporary finish',
    description: 'Contemporary contrast, clean highlights, and true-to-life architectural material color fidelity.',
  },
  {
    id: 'WebOptimize',
    name: 'Web Optimize',
    icon: Globe,
    tagline: 'Lightweight web delivery',
    description: 'Lossless & efficient WebP compression calibrated for ultra-fast website loading.',
  },
];

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function ImageStudioWorkspace({
  image,
  onClose,
  onImageUpdated,
  resolveImageUrl,
  onReplaceRequested,
  onDeleteRequested,
}: ImageStudioWorkspaceProps) {
  // Selected operation for processing
  const [selectedOp, setSelectedOp] = useState<string>('ImproveClarity');

  // Currently inspected variant (defaults to newest enhanced variant if one exists)
  const [activeVariant, setActiveVariant] = useState<ImageVariantDto | null>(() => {
    const enhanced = [...(image.variants || [])]
      .filter((v) => v.status !== 'Rejected')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return enhanced[0] || null;
  });

  // Comparison view mode
  const [viewMode, setViewMode] = useState<'split' | 'side-by-side' | 'stacked'>('split');
  const [splitPos, setSplitPos] = useState<number>(50); // percentage (0 - 100)
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1, 1.5, 2

  // Action states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [isRejecting, setIsRejecting] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isUnpublishing, setIsUnpublishing] = useState<boolean>(false);

  // User feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Split slider drag refs
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Sync active variant when image prop updates
  useEffect(() => {
    if (image?.variants?.length) {
      setActiveVariant((prev) => {
        if (prev) {
          const found = image.variants.find((v) => v.id === prev.id);
          if (found) return found;
        }
        const newest = [...image.variants]
          .filter((v) => v.status !== 'Rejected')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        return newest || null;
      });
    }
  }, [image]);

  // Draggable Split Divider Handlers
  const handleSplitMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = ((clientX - rect.left) / rect.width) * 100;
    setSplitPos(Math.max(5, Math.min(95, pos)));
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    const onMouseMove = (ev: MouseEvent) => {
      if (isDraggingRef.current) {
        handleSplitMove(ev.clientX);
      }
    };
    const onMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleSplitMove(e.touches[0].clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleSplitMove(e.touches[0].clientX);
    }
  };

  const handleSliderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setSplitPos((prev) => Math.max(5, prev - 5));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setSplitPos((prev) => Math.min(95, prev + 5));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setSplitPos(5);
    } else if (e.key === 'End') {
      e.preventDefault();
      setSplitPos(95);
    }
  };

  // Run selected enhancement operation
  const handleRunEnhancement = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await apiClient.post<{ data: ImageVariantDto; message: string }>(
        `/website/images/${image.id}/enhance`,
        { operation: selectedOp }
      );

      const newVariant = res?.data;
      if (newVariant) {
        setActiveVariant(newVariant);
        // Refresh entire image to get updated variants list
        const updatedImgRes = await apiClient.get<{ data: ImageDto }>(`/website/images/${image.id}`);
        if (updatedImgRes?.data) {
          onImageUpdated(updatedImgRes.data);
        }
        setSuccessMessage(`Enhanced with ${APPROVED_OPERATIONS.find((o) => o.id === selectedOp)?.name || selectedOp}. Original image preserved.`);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to process enhancement. The original image remains safe and untouched.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Human Review: Approve Enhancement
  const handleApproveVariant = async () => {
    if (!activeVariant || isApproving) return;
    setIsApproving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await apiClient.post<{ data: ImageVariantDto; message: string }>(
        `/website/images/${image.id}/variants/${activeVariant.id}/approve`,
        {}
      );

      if (res?.data) {
        setActiveVariant(res.data);
        const updatedImgRes = await apiClient.get<{ data: ImageDto }>(`/website/images/${image.id}`);
        if (updatedImgRes?.data) {
          onImageUpdated(updatedImgRes.data);
        }
        setSuccessMessage('Variant approved for website usage. Note: Publishing remains an explicit, separate action.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to approve variant.');
    } finally {
      setIsApproving(false);
    }
  };

  // Human Review: Reject Enhancement
  const handleRejectVariant = async () => {
    if (!activeVariant || isRejecting) return;
    setIsRejecting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await apiClient.post(`/website/images/${image.id}/variants/${activeVariant.id}/reject`, {
        reason: 'Discarded by user during before/after comparison',
      });

      // Fetch updated image
      const updatedImgRes = await apiClient.get<{ data: ImageDto }>(`/website/images/${image.id}`);
      if (updatedImgRes?.data) {
        onImageUpdated(updatedImgRes.data);
        // Select next available non-rejected variant or null
        const nextVariant = [...updatedImgRes.data.variants]
          .filter((v) => v.status !== 'Rejected')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        setActiveVariant(nextVariant || null);
      }
      setSuccessMessage('Variant rejected. Original image remains preserved.');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to reject variant.');
    } finally {
      setIsRejecting(false);
    }
  };

  // Publishing: Explicit separate action
  const handlePublishImage = async () => {
    if (isPublishing) return;
    setIsPublishing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await apiClient.post(`/website/images/${image.id}/publish`, {
        variantId: activeVariant?.status === 'Approved' ? activeVariant.id : undefined,
      });

      const updatedImgRes = await apiClient.get<{ data: ImageDto }>(`/website/images/${image.id}`);
      if (updatedImgRes?.data) {
        onImageUpdated(updatedImgRes.data);
      }
      setSuccessMessage('Image published to live website successfully.');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to publish image.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Unpublish
  const handleUnpublishImage = async () => {
    if (isUnpublishing) return;
    setIsUnpublishing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await apiClient.post(`/website/images/${image.id}/unpublish`, {});
      const updatedImgRes = await apiClient.get<{ data: ImageDto }>(`/website/images/${image.id}`);
      if (updatedImgRes?.data) {
        onImageUpdated(updatedImgRes.data);
      }
      setSuccessMessage('Image removed from active website publishing.');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to unpublish image.');
    } finally {
      setIsUnpublishing(false);
    }
  };

  const originalUrl = resolveImageUrl(image.previewUrl);
  const enhancedUrl = activeVariant ? resolveImageUrl(activeVariant.previewUrl) : originalUrl;
  const isVariantPendingReview = activeVariant && (activeVariant.status === 'Enhanced' || activeVariant.status === 'ReadyForReview');
  const isVariantApproved = activeVariant && activeVariant.status === 'Approved';
  const isImagePublished = image.status === 'Published';

  return (
    <div className="fixed inset-0 z-50 bg-[#172033]/70 backdrop-blur-xs flex flex-col items-center justify-center p-3 sm:p-5 overflow-hidden">
      {/* Workspace Card */}
      <div className="bg-white dark:bg-[#0F172A] w-full max-w-7xl h-[95vh] max-h-[95vh] rounded-[10px] shadow-2xl flex flex-col border border-[#CBD5E1] dark:border-[#1E293B] overflow-hidden">
        {/* Workspace Top Bar */}
        <header className="px-5 py-3.5 border-b border-[#E3E7ED] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-[6px] bg-[#315FEA]/10 text-[#315FEA] flex items-center justify-center font-bold shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#172033] dark:text-white truncate">
                  {image.projectWorkName || image.originalFileName || image.slot || 'Image Workspace'}
                </h2>
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-[4px] border shrink-0 ${
                    isImagePublished
                      ? 'bg-emerald-50 text-[#15803D] border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800'
                      : isVariantApproved
                      ? 'bg-blue-50 text-[#1D4ED8] border-blue-200 dark:bg-blue-950/40 dark:border-blue-800'
                      : isVariantPendingReview
                      ? 'bg-amber-50 text-[#B45309] border-amber-200 dark:bg-amber-950/40 dark:border-amber-800'
                      : 'bg-[#F3F6FA] text-[#475569] border-[#E3E7ED] dark:bg-[#1E293B] dark:text-[#94A3B8]'
                  }`}
                >
                  {isImagePublished ? 'Published' : isVariantApproved ? 'Approved' : isVariantPendingReview ? 'Pending Review' : image.status}
                </span>
                {image.slot && (
                  <span className="text-[11px] text-[#475569] dark:text-slate-400 bg-[#F3F6FA] dark:bg-[#1E293B] px-2 py-0.5 rounded-[4px] border border-[#E3E7ED] dark:border-[#334155]">
                    Slot: {image.slot}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#475569] dark:text-[#94A3B8] flex items-center gap-2 mt-0.5">
                <span>{image.width} × {image.height} px</span>
                <span>•</span>
                <span>{formatBytes(image.fileSize)}</span>
                <span>•</span>
                <span>{image.mimeType.replace('image/', '').toUpperCase()}</span>
                {image.category && (
                  <>
                    <span>•</span>
                    <span>Category: {image.category}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* View Mode Controls & Window Actions */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center p-0.5 bg-[#F3F6FA] dark:bg-[#1E293B] rounded-[6px] border border-[#E3E7ED] dark:border-[#334155]">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[4px] transition-colors ${
                  viewMode === 'split'
                    ? 'bg-white dark:bg-[#0F172A] text-[#315FEA] shadow-xs'
                    : 'text-[#475569] hover:text-[#172033] dark:text-slate-400 dark:hover:text-white'
                }`}
                title="Interactive Split Slider"
              >
                <SplitSquareVertical className="w-3.5 h-3.5" />
                <span>Slider</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('side-by-side')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[4px] transition-colors ${
                  viewMode === 'side-by-side'
                    ? 'bg-white dark:bg-[#0F172A] text-[#315FEA] shadow-xs'
                    : 'text-[#475569] hover:text-[#172033] dark:text-slate-400 dark:hover:text-white'
                }`}
                title="Side by Side Inspection"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Side by Side</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('stacked')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[4px] transition-colors ${
                  viewMode === 'stacked'
                    ? 'bg-white dark:bg-[#0F172A] text-[#315FEA] shadow-xs'
                    : 'text-[#475569] hover:text-[#172033] dark:text-slate-400 dark:hover:text-white'
                }`}
                title="Stacked Vertical Inspection"
              >
                <Rows className="w-3.5 h-3.5" />
                <span>Stacked</span>
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center bg-[#F3F6FA] dark:bg-[#1E293B] rounded-[6px] border border-[#E3E7ED] dark:border-[#334155] p-0.5">
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.max(1, prev - 0.5))}
                disabled={zoomLevel <= 1}
                className="p-1 text-[#475569] hover:text-[#172033] dark:text-slate-400 dark:hover:text-white disabled:opacity-30 rounded-[4px]"
                aria-label="Zoom out"
                title="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono px-1.5 text-[#475569] dark:text-slate-300">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.min(2.5, prev + 0.5))}
                disabled={zoomLevel >= 2.5}
                className="p-1 text-[#475569] hover:text-[#172033] dark:text-slate-400 dark:hover:text-white disabled:opacity-30 rounded-[4px]"
                aria-label="Zoom in"
                title="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-[6px] text-[#475569] hover:text-[#172033] dark:text-slate-400 dark:hover:text-white hover:bg-[#F3F6FA] dark:hover:bg-[#1E293B] transition-colors focus:outline-hidden focus:ring-2 focus:ring-[#1D4ED8]"
              aria-label="Close workspace"
              title="Close workspace"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Banners: Notifications / Errors */}
        {errorMessage && (
          <div className="px-5 py-2.5 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/60 flex items-center justify-between text-xs text-[#B91C1C] dark:text-rose-300 shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-[#B91C1C] hover:opacity-80 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="px-5 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between text-xs text-[#15803D] dark:text-emerald-300 shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="text-[#15803D] hover:opacity-80 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Body: Split into Left Workspace Arena & Right Control Rail */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden bg-[#F3F6FA] dark:bg-[#0B1220]">
          {/* Comparison Inspection Area */}
          <div className="flex-1 min-h-[300px] flex flex-col p-3 sm:p-5 overflow-auto relative">
            <div
              ref={containerRef}
              className="flex-1 w-full min-h-[320px] bg-slate-900 rounded-[8px] border border-[#CBD5E1] dark:border-[#1E293B] relative overflow-hidden flex items-center justify-center select-none"
              onMouseDown={viewMode === 'split' ? handleMouseDown : undefined}
              onTouchStart={viewMode === 'split' ? handleTouchStart : undefined}
              onTouchMove={viewMode === 'split' ? handleTouchMove : undefined}
            >
              {/* Processing Overlay */}
              {isProcessing && (
                <div className="absolute inset-0 z-30 bg-[#172033]/75 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-white text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-[#315FEA] mb-3" />
                  <p className="text-sm font-semibold tracking-wide">Executing Deterministic Enhancement</p>
                  <p className="text-xs text-slate-300 mt-1 max-w-sm">
                    Preserving raw original photograph while calculating adaptive highlight protection and edge tone curves...
                  </p>
                </div>
              )}

              {/* View Mode: Split Slider */}
              {viewMode === 'split' && (
                <div
                  className="w-full h-full relative flex items-center justify-center overflow-hidden"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                >
                  {/* Under layer: Enhanced / Processed Variant */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={enhancedUrl}
                    alt="AFTER · Enhanced"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  />

                  {/* Over layer: Original Image (Clipped) */}
                  <div
                    className="absolute inset-0 overflow-hidden pointer-events-none"
                    style={{ width: `${splitPos}%` }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={originalUrl}
                      alt="BEFORE · Original"
                      className="absolute inset-0 w-full h-full object-contain"
                      style={{
                        width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
                        maxWidth: 'none',
                      }}
                    />
                  </div>

                  {/* Divider Line & Draggable Handle */}
                  <div
                    className="absolute top-0 bottom-0 z-20 pointer-events-none flex items-center justify-center"
                    style={{ left: `${splitPos}%` }}
                  >
                    <div className="w-0.5 h-full bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)]" />
                    <div
                      role="slider"
                      tabIndex={0}
                      aria-label="Before/after comparison split position"
                      aria-valuenow={Math.round(splitPos)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      onKeyDown={handleSliderKeyDown}
                      className="pointer-events-auto absolute w-8 h-8 rounded-full bg-white text-[#172033] shadow-md border-2 border-[#315FEA] flex items-center justify-center cursor-ew-resize hover:scale-105 active:scale-95 transition-transform focus:outline-hidden focus:ring-2 focus:ring-[#1D4ED8]"
                    >
                      <SplitSquareVertical className="w-4 h-4 text-[#315FEA]" />
                    </div>
                  </div>

                  {/* Persistent Labels */}
                  <div className="absolute top-3 left-3 z-10 pointer-events-none">
                    <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-[4px] bg-[#172033]/80 text-white backdrop-blur-xs border border-white/10 shadow-xs">
                      BEFORE · Original
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 z-10 pointer-events-none">
                    <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-[4px] bg-[#315FEA]/90 text-white backdrop-blur-xs border border-white/20 shadow-xs">
                      AFTER · {activeVariant ? activeVariant.operation || 'Enhanced' : 'Original'}
                    </span>
                  </div>
                </div>
              )}

              {/* View Mode: Side by Side */}
              {viewMode === 'side-by-side' && (
                <div
                  className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-3 p-3"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                >
                  <div className="relative rounded-[6px] bg-slate-950 overflow-hidden flex items-center justify-center border border-slate-800">
                    <div className="absolute top-3 left-3 z-10">
                      <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-[4px] bg-[#172033]/85 text-white border border-white/10">
                        BEFORE · Original
                      </span>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={originalUrl}
                      alt="BEFORE · Original"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  <div className="relative rounded-[6px] bg-slate-950 overflow-hidden flex items-center justify-center border border-[#315FEA]/30">
                    <div className="absolute top-3 left-3 z-10">
                      <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-[4px] bg-[#315FEA]/90 text-white border border-white/20">
                        AFTER · {activeVariant ? activeVariant.operation || 'Enhanced' : 'Original'}
                      </span>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={enhancedUrl}
                      alt="AFTER · Enhanced"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* View Mode: Stacked */}
              {viewMode === 'stacked' && (
                <div
                  className="w-full h-full flex flex-col gap-3 p-3 overflow-auto"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                >
                  <div className="relative min-h-[220px] flex-1 rounded-[6px] bg-slate-950 overflow-hidden flex items-center justify-center border border-slate-800">
                    <div className="absolute top-3 left-3 z-10">
                      <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-[4px] bg-[#172033]/85 text-white border border-white/10">
                        BEFORE · Original
                      </span>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={originalUrl}
                      alt="BEFORE · Original"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  <div className="relative min-h-[220px] flex-1 rounded-[6px] bg-slate-950 overflow-hidden flex items-center justify-center border border-[#315FEA]/30">
                    <div className="absolute top-3 left-3 z-10">
                      <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-[4px] bg-[#315FEA]/90 text-white border border-white/20">
                        AFTER · {activeVariant ? activeVariant.operation || 'Enhanced' : 'Original'}
                      </span>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={enhancedUrl}
                      alt="AFTER · Enhanced"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Comparison Slider Accessibility Help */}
            {viewMode === 'split' && (
              <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] text-center mt-2">
                Tip: Drag the vertical divider or focus the handle and use Left/Right arrows to inspect differences.
              </p>
            )}
          </div>

          {/* Right Control Rail */}
          <aside className="w-full lg:w-96 bg-white dark:bg-[#0F172A] border-t lg:border-t-0 lg:border-l border-[#E3E7ED] dark:border-[#1E293B] flex flex-col shrink-0 overflow-y-auto">
            <div className="p-5 flex flex-col gap-6">
              {/* Enhancement Operation Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033] dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#315FEA]" />
                    <span>Approved Enhancement Operations</span>
                  </h3>
                  <span className="text-[11px] font-mono text-[#475569] dark:text-[#94A3B8]">
                    7 available
                  </span>
                </div>
                <p className="text-xs text-[#475569] dark:text-[#94A3B8] mb-3">
                  Select an adaptive enhancement operation calibrated for architectural & project photography:
                </p>

                <div className="flex flex-col gap-2">
                  {APPROVED_OPERATIONS.map((op) => {
                    const isSelected = selectedOp === op.id;
                    const IconComp = op.icon;
                    return (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => setSelectedOp(op.id)}
                        className={`text-left p-2.5 rounded-[6px] border transition-all text-xs flex items-start gap-2.5 focus:outline-hidden focus:ring-2 focus:ring-[#1D4ED8] ${
                          isSelected
                            ? 'bg-[#315FEA]/5 border-[#315FEA] text-[#172033] dark:text-white shadow-xs'
                            : 'bg-white dark:bg-[#1E293B] border-[#E3E7ED] dark:border-[#334155] text-[#475569] dark:text-slate-300 hover:border-[#CBD5E1]'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-[4px] flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected
                              ? 'bg-[#315FEA] text-white'
                              : 'bg-[#F3F6FA] dark:bg-[#0B1220] text-[#475569] dark:text-slate-400'
                          }`}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-[#172033] dark:text-white">
                              {op.name}
                            </span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-[#315FEA] shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] mt-0.5 line-clamp-2">
                            {op.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full justify-center"
                    isLoading={isProcessing}
                    loadingText="Processing Enhancement..."
                    onClick={handleRunEnhancement}
                    leftIcon={<Sparkles className="w-4 h-4" />}
                  >
                    Execute {APPROVED_OPERATIONS.find((o) => o.id === selectedOp)?.name || 'Enhancement'}
                  </Button>
                  <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] text-center mt-1.5">
                    Original image remains strictly immutable on secure private storage.
                  </p>
                </div>
              </div>

              {/* Deterministic Corrections Applied */}
              <div className="p-3.5 bg-[#F3F6FA] dark:bg-[#1E293B] rounded-[8px] border border-[#E3E7ED] dark:border-[#334155]">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#172033] dark:text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#15803D]" />
                    <span>Deterministic Corrections Applied</span>
                  </h4>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#334155] text-[#475569] dark:text-[#94A3B8]">
                    {activeVariant?.algorithmVersion || '1.0.0-deterministic'}
                  </span>
                </div>

                {activeVariant?.appliedCorrections && activeVariant.appliedCorrections.length > 0 ? (
                  <ul className="flex flex-col gap-1.5 mb-3">
                    {activeVariant.appliedCorrections.map((corr, idx) => (
                      <li key={idx} className="text-xs text-[#172033] dark:text-slate-200 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D] shrink-0 mt-0.5" />
                        <span>{corr}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[#475569] dark:text-[#94A3B8] mb-3 italic">
                    Execute an enhancement operation above to inspect applied tone, clarity, and texture corrections.
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-[#E3E7ED] dark:border-[#334155] text-[11px]">
                  <div>
                    <span className="text-[#475569] dark:text-[#94A3B8] block">Engine Profile:</span>
                    <span className="font-medium text-[#172033] dark:text-white truncate block">
                      {activeVariant?.effectiveProfile || activeVariant?.operation || 'Raw Baseline'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#475569] dark:text-[#94A3B8] block">Variant Resolution:</span>
                    <span className="font-medium text-[#172033] dark:text-white">
                      {activeVariant ? `${activeVariant.width} × ${activeVariant.height}` : `${image.width} × ${image.height}`} px
                    </span>
                  </div>
                </div>
              </div>

              {/* Review, Approval & Separate Publishing Boundary */}
              <div className="flex flex-col gap-2.5 pt-2 border-t border-[#E3E7ED] dark:border-[#1E293B]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#172033] dark:text-white">
                  Review & Publishing Boundary
                </h4>

                {/* Variant Decision Actions */}
                {isVariantPendingReview && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
                      Human review required. Confirm fidelity before approving this variant for website usage:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="success"
                        size="sm"
                        isLoading={isApproving}
                        loadingText="Approving..."
                        onClick={handleApproveVariant}
                        leftIcon={<Check className="w-3.5 h-3.5" />}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="destructive-outline"
                        size="sm"
                        isLoading={isRejecting}
                        loadingText="Rejecting..."
                        onClick={handleRejectVariant}
                        leftIcon={<X className="w-3.5 h-3.5" />}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                )}

                {/* Explicit Separate Publishing Action */}
                <div className="mt-1">
                  {!isImagePublished ? (
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full justify-center"
                      isLoading={isPublishing}
                      loadingText="Publishing to Website..."
                      onClick={handlePublishImage}
                      leftIcon={<Globe className="w-4 h-4" />}
                    >
                      Publish to Live Website
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="md"
                      className="w-full justify-center text-[#B91C1C] hover:bg-rose-50 border-rose-200"
                      isLoading={isUnpublishing}
                      loadingText="Unpublishing..."
                      onClick={handleUnpublishImage}
                    >
                      Remove from Live Website
                    </Button>
                  )}
                  <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] mt-1.5 leading-relaxed">
                    Publishing updates the tenant website layout. Approval does not automatically publish.
                  </p>
                </div>

                {/* Additional Media Management Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#E3E7ED] dark:border-[#1E293B]">
                  {onReplaceRequested && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 justify-center"
                      onClick={() => onReplaceRequested(image)}
                      leftIcon={<Upload className="w-3.5 h-3.5" />}
                    >
                      Replace Source
                    </Button>
                  )}
                  {onDeleteRequested && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[#B91C1C] hover:bg-rose-50"
                      onClick={() => onDeleteRequested(image)}
                      title="Delete Image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
