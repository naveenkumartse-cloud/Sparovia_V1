'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Maximize2,
  Check,
  CheckCircle2,
  AlertCircle,
  X,
  ZoomIn,
  ZoomOut,
  Columns,
  SplitSquareVertical,
  Rows,
  Globe,
  Trash2,
  Upload,
  RefreshCw,
  Loader2,
  Info,
  ShieldCheck,
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

export interface PendingUploadData {
  file: File;
  previewUrl: string;
  dimensions: { width: number; height: number };
  slot?: string | null;
  usageType: 'WebsiteImage' | 'ExploreOurWork';
  projectWorkName?: string;
  caption?: string;
  category?: string;
  replacingImageId?: string;
}

export interface ImageStudioWorkspaceProps {
  image?: ImageDto | null;
  pendingUpload?: PendingUploadData | null;
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

// Retained for contract compatibility with existing caller types
export const APPROVED_OPERATIONS: EnhancementOpDef[] = [
  {
    id: 'EnhanceForWebsite',
    name: 'Enhance for Website',
    icon: Sparkles,
    tagline: 'Clarity, tone & web optimization',
    description: 'Deterministic highlight balancing, edge-preserving denoising, subtle structural contrast, and WebP compression.',
  },
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
    icon: Sparkles,
    tagline: 'Controlled edge definition',
    description: 'Restrained edge enhancement that avoids artificial halos and maintains authentic materials.',
  },
  {
    id: 'ReduceNoise',
    name: 'Reduce Noise',
    icon: Sparkles,
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
    icon: Sparkles,
    tagline: 'Warm editorial contrast',
    description: 'Refined tonal curve with organic warmth and rich midtones suited for architectural showcase.',
  },
  {
    id: 'ModernLook',
    name: 'Modern Look',
    icon: Sparkles,
    tagline: 'Crisp contemporary finish',
    description: 'Contemporary contrast, clean highlights, and true-to-life architectural material color fidelity.',
  },
  {
    id: 'WebOptimize',
    name: 'Web Optimize',
    icon: Globe,
    tagline: 'Lightweight web delivery',
    description: 'Efficient WebP compression calibrated for fast website loading.',
  },
];

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function calculateSavings(originalSize: number, candidateSize: number): string | null {
  if (!originalSize || !candidateSize || candidateSize >= originalSize) return null;
  const pct = Math.round(((originalSize - candidateSize) / originalSize) * 100);
  return pct > 0 ? `${pct}% smaller` : null;
}

export function ImageStudioWorkspace({
  image,
  pendingUpload,
  onClose,
  onImageUpdated,
  resolveImageUrl,
  onReplaceRequested,
  onDeleteRequested,
}: ImageStudioWorkspaceProps) {
  const [currentImage, setCurrentImage] = useState<ImageDto | null>(image || null);

  // Helper to find the newest non-rejected variant (preferring newest EnhanceForWebsite or approved variant)
  const getLatestCandidate = useCallback((variants?: ImageVariantDto[] | null): ImageVariantDto | null => {
    if (!variants || variants.length === 0) return null;
    const nonRejected = [...variants].filter((v) => v.status !== 'Rejected');
    if (nonRejected.length === 0) return null;

    // Prefer newest EnhanceForWebsite if present
    const enhanceForWebsiteVariants = nonRejected.filter(
      (v) => v.operation?.toLowerCase().startsWith('enhanceforwebsite')
    );
    if (enhanceForWebsiteVariants.length > 0) {
      return enhanceForWebsiteVariants.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
    }

    // Otherwise sort newest first
    return nonRejected.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  }, []);

  // Currently inspected candidate variant
  const [activeVariant, setActiveVariant] = useState<ImageVariantDto | null>(() =>
    getLatestCandidate(image?.variants)
  );

  // Displayed variant
  const displayedVariant =
    activeVariant && activeVariant.status !== 'Rejected'
      ? activeVariant
      : getLatestCandidate(currentImage?.variants);

  // Comparison view mode
  const [viewMode, setViewMode] = useState<'split' | 'side-by-side' | 'stacked'>('split');
  const [splitPos, setSplitPos] = useState<number>(50); // percentage (0 - 100)
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1, 1.5, 2, 2.5

  // Action states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [isRejecting, setIsRejecting] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isUnpublishing, setIsUnpublishing] = useState<boolean>(false);

  // User feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // In-canvas image loading and recovery states
  const [originalLoadError, setOriginalLoadError] = useState<boolean>(false);
  const [enhancedLoadError, setEnhancedLoadError] = useState<boolean>(false);
  const [retryKey, setRetryKey] = useState<number>(0);

  // Split slider drag refs
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);

  useEffect(() => {
    if (image) {
      setCurrentImage(image);
    }
  }, [image]);

  useEffect(() => {
    setOriginalLoadError(false);
  }, [currentImage?.previewUrl, retryKey]);

  useEffect(() => {
    setEnhancedLoadError(false);
  }, [displayedVariant?.previewUrl, retryKey]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing && !isApproving && !isRejecting && !isPublishing) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isProcessing, isApproving, isRejecting, isPublishing]);

  // Sync active variant when currentImage updates
  useEffect(() => {
    if (currentImage?.variants?.length) {
      setActiveVariant((prev) => {
        if (prev) {
          const found = currentImage.variants.find((v) => v.id === prev.id && v.status !== 'Rejected');
          if (found) return found;
        }
        return getLatestCandidate(currentImage.variants);
      });
    } else {
      setActiveVariant(null);
    }
  }, [currentImage, getLatestCandidate]);

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

  // Run Enhance for Website
  const handleRunEnhancement = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      let targetImage = currentImage;

      // If this is an initial unpersisted upload from the upload modal
      if (!targetImage && pendingUpload) {
        const formData = new FormData();
        formData.append('file', pendingUpload.file);
        if (pendingUpload.projectWorkName) formData.append('projectWorkName', pendingUpload.projectWorkName);
        if (pendingUpload.caption) formData.append('caption', pendingUpload.caption);
        if (pendingUpload.category) formData.append('category', pendingUpload.category);
        if (pendingUpload.slot) {
          formData.append('usageType', 'WebsiteImage');
          formData.append('slot', pendingUpload.slot);
        } else {
          formData.append('usageType', pendingUpload.usageType);
        }

        let uploadRes;
        if (pendingUpload.replacingImageId) {
          uploadRes = await apiClient.postFormData<{ data: ImageDto }>(
            `/website/images/${pendingUpload.replacingImageId}/replace`,
            formData
          );
        } else if (pendingUpload.usageType === 'ExploreOurWork' && !pendingUpload.slot) {
          uploadRes = await apiClient.postFormData<{ data: ImageDto }>('/website/images/explore-our-work', formData);
        } else {
          uploadRes = await apiClient.postFormData<{ data: ImageDto }>('/website/images', formData);
        }

        const uploadedImg = uploadRes?.data;
        if (!uploadedImg) {
          throw new Error('Failed to persist image upload.');
        }
        targetImage = uploadedImg;
        setCurrentImage(uploadedImg);
        onImageUpdated(uploadedImg);
      }

      if (!targetImage) {
        throw new Error('No image available to enhance.');
      }

      // Execute Enhance for Website pipeline
      const res = await apiClient.post<{ data: ImageVariantDto; message: string }>(
        `/website/images/${targetImage.id}/enhance`,
        { operation: 'EnhanceForWebsite' }
      );

      const newVariant = res?.data;
      if (newVariant) {
        setActiveVariant(newVariant);
        // Refresh master image record
        const updatedImgRes = await apiClient.get<{ data: ImageDto }>(`/website/images/${targetImage.id}`);
        if (updatedImgRes?.data) {
          setCurrentImage(updatedImgRes.data);
          onImageUpdated(updatedImgRes.data);
          const freshNew = updatedImgRes.data.variants.find((v) => v.id === newVariant.id);
          if (freshNew) {
            setActiveVariant(freshNew);
          }
        }
        setSuccessMessage('Enhancement complete. Candidate ready for your review.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to enhance image. The original photograph remains safe and untouched.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Review: Keep Enhanced (Approves candidate)
  const handleApproveVariant = async () => {
    if (!currentImage || !displayedVariant || isApproving) return;
    setIsApproving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await apiClient.post<{ data: ImageVariantDto; image?: ImageDto; message: string }>(
        `/website/images/${currentImage.id}/variants/${displayedVariant.id}/approve`,
        {}
      );

      const approvedVariant = res?.data;
      if (approvedVariant) {
        setActiveVariant(approvedVariant);
      }

      const updatedImgRes = await apiClient.get<{ data: ImageDto }>(`/website/images/${currentImage.id}`);
      if (updatedImgRes?.data) {
        setCurrentImage(updatedImgRes.data);
        onImageUpdated(updatedImgRes.data);
        if (approvedVariant) {
          const freshVariant = updatedImgRes.data.variants.find((v) => v.id === approvedVariant.id);
          if (freshVariant) {
            setActiveVariant(freshVariant);
          }
        }
      }
      setSuccessMessage('Candidate approved for website. Publishing remains a separate, explicit action.');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to approve candidate.');
    } finally {
      setIsApproving(false);
    }
  };

  // Review: Discard Candidate (Rejects variant, keeps original safe)
  const handleRejectVariant = async () => {
    if (!currentImage || !displayedVariant || isRejecting) return;
    setIsRejecting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await apiClient.post(`/website/images/${currentImage.id}/variants/${displayedVariant.id}/reject`, {
        reason: 'Discarded by user during candidate comparison',
      });

      const updatedImgRes = await apiClient.get<{ data: ImageDto }>(`/website/images/${currentImage.id}`);
      if (updatedImgRes?.data) {
        setCurrentImage(updatedImgRes.data);
        onImageUpdated(updatedImgRes.data);
        const nextCandidate = getLatestCandidate(updatedImgRes.data.variants);
        setActiveVariant(nextCandidate);
      }
      setSuccessMessage('Candidate discarded. Original photograph remains preserved.');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to discard candidate.');
    } finally {
      setIsRejecting(false);
    }
  };

  // Publishing: Explicit separate action
  const handlePublishImage = async () => {
    if (!currentImage || isPublishing) return;
    setIsPublishing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const variantToPublish = displayedVariant?.status === 'Approved' ? displayedVariant.id : undefined;
      await apiClient.post(`/website/images/${currentImage.id}/publish`, {
        variantId: variantToPublish,
      });

      const updatedImgRes = await apiClient.get<{ data: ImageDto }>(`/website/images/${currentImage.id}`);
      if (updatedImgRes?.data) {
        setCurrentImage(updatedImgRes.data);
        onImageUpdated(updatedImgRes.data);
        if (variantToPublish) {
          const freshPublished = updatedImgRes.data.variants.find((v) => v.id === variantToPublish);
          if (freshPublished) {
            setActiveVariant(freshPublished);
          }
        }
      }
      setSuccessMessage('Image published to live website successfully.');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to publish image.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Unpublish: Explicit live website removal while retaining media library record
  const handleUnpublishImage = async () => {
    if (!currentImage || isUnpublishing) return;
    setIsUnpublishing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await apiClient.post(`/website/images/${currentImage.id}/unpublish`, {});
      const updatedImgRes = await apiClient.get<{ data: ImageDto }>(`/website/images/${currentImage.id}`);
      if (updatedImgRes?.data) {
        setCurrentImage(updatedImgRes.data);
        onImageUpdated(updatedImgRes.data);
        if (displayedVariant) {
          const freshVariant = updatedImgRes.data.variants.find((v) => v.id === displayedVariant.id);
          if (freshVariant) {
            setActiveVariant(freshVariant);
          }
        }
      }
      setSuccessMessage('Image safely removed from live website. Master records remain preserved in media library.');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to unpublish image.');
    } finally {
      setIsUnpublishing(false);
    }
  };

  const effectiveImage = currentImage;
  const rawOriginalUrl = effectiveImage ? resolveImageUrl(effectiveImage.previewUrl) : (pendingUpload?.previewUrl || '');
  const originalUrl = rawOriginalUrl && retryKey > 0
    ? `${rawOriginalUrl}${rawOriginalUrl.includes('?') ? '&' : '?'}retry=${retryKey}`
    : rawOriginalUrl;

  const rawEnhancedUrl = displayedVariant ? resolveImageUrl(displayedVariant.previewUrl) : null;
  const enhancedUrl = rawEnhancedUrl && retryKey > 0
    ? `${rawEnhancedUrl}${rawEnhancedUrl.includes('?') ? '&' : '?'}retry=${retryKey}`
    : rawEnhancedUrl;

  const isVariantPendingReview =
    displayedVariant && (displayedVariant.status === 'Enhanced' || displayedVariant.status === 'ReadyForReview');
  const isVariantApproved = displayedVariant && displayedVariant.status === 'Approved';
  const isVariantPublished = displayedVariant && displayedVariant.status === 'Published';
  const isImagePublished = effectiveImage?.status === 'Published';

  const displayName = effectiveImage
    ? (effectiveImage.projectWorkName || effectiveImage.originalFileName || effectiveImage.slot || 'Image Workspace')
    : (pendingUpload?.projectWorkName || pendingUpload?.file.name || pendingUpload?.slot || 'New Image');

  const displayWidth = effectiveImage?.width || pendingUpload?.dimensions.width || 0;
  const displayHeight = effectiveImage?.height || pendingUpload?.dimensions.height || 0;
  const displaySize = effectiveImage?.fileSize || pendingUpload?.file.size || 0;
  const displayMime = (effectiveImage?.mimeType || pendingUpload?.file.type || 'image/jpeg')
    .replace('image/', '')
    .toUpperCase();
  const displayCategory = effectiveImage?.category || pendingUpload?.category;
  const displaySlot = effectiveImage?.slot || pendingUpload?.slot;

  const savingsText = displayedVariant ? calculateSavings(displaySize, displayedVariant.fileSize) : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-studio-title"
      className="fixed inset-0 z-50 bg-[#172033]/70 backdrop-blur-xs flex flex-col items-center justify-center p-3 sm:p-5 overflow-hidden"
    >
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
                <h2 id="image-studio-title" className="text-base font-semibold text-[#172033] dark:text-white truncate">
                  {displayName}
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
                  {isImagePublished
                    ? 'Published'
                    : isVariantApproved
                    ? 'Approved'
                    : isVariantPendingReview
                    ? 'Pending Review'
                    : (effectiveImage?.status || 'Draft')}
                </span>
                {displaySlot && (
                  <span className="text-[11px] text-[#475569] dark:text-slate-400 bg-[#F3F6FA] dark:bg-[#1E293B] px-2 py-0.5 rounded-[4px] border border-[#E3E7ED] dark:border-[#334155]">
                    Slot: {displaySlot}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#475569] dark:text-[#94A3B8] flex items-center gap-2 mt-0.5">
                <span>{displayWidth} × {displayHeight} px</span>
                <span>•</span>
                <span>{formatBytes(displaySize)}</span>
                <span>•</span>
                <span>{displayMime}</span>
                {displayCategory && (
                  <>
                    <span>•</span>
                    <span>Category: {displayCategory}</span>
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
              className="w-8 h-8 flex items-center justify-center rounded-[6px] text-[#475569] hover:text-[#172033] dark:text-slate-400 dark:hover:text-white hover:bg-[#F3F6FA] dark:hover:bg-[#1E293B] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
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

        {/* Main Body: Left Inspection Canvas & Right Control Rail */}
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
                  <p className="text-sm font-semibold tracking-wide">Enhancing for Website</p>
                  <p className="text-xs text-slate-300 mt-1 max-w-sm">
                    Preserving raw original photograph while calculating adaptive highlight protection, edge-preserving denoising, and web delivery optimization...
                  </p>
                </div>
              )}

              {/* View Mode: Split Slider */}
              {viewMode === 'split' && (
                <div
                  className="w-full h-full relative flex items-center justify-center overflow-hidden"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                >
                  {/* Under layer: Enhanced Candidate */}
                  {displayedVariant && enhancedUrl && enhancedLoadError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950 text-slate-300 select-none z-10">
                      <div className="w-12 h-12 rounded-[6px] bg-slate-900 border border-amber-900/60 text-amber-400 flex items-center justify-center mb-3">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-white">Enhanced Candidate Preview Unavailable</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                        Unable to load the processed candidate preview from storage. You can retry loading or re-run the enhancement.
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEnhancedLoadError(false);
                            setRetryKey((k) => k + 1);
                          }}
                          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                        >
                          Retry Loading
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleRunEnhancement}
                          isLoading={isProcessing}
                          leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                        >
                          Re-enhance
                        </Button>
                      </div>
                    </div>
                  ) : displayedVariant && enhancedUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      key={`enhanced-${retryKey}`}
                      src={enhancedUrl}
                      alt="AFTER · Enhanced for Website"
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                      onError={() => setEnhancedLoadError(true)}
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950 text-slate-400 select-none">
                      <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 text-[#315FEA] flex items-center justify-center mb-3">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-200">
                        Enhancement Pending
                      </p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                        Click &quot;Enhance for Website&quot; in the control rail to generate an optimized candidate for preview.
                      </p>
                    </div>
                  )}

                  {/* Over layer: Original Image (Clipped via clipPath) */}
                  {originalLoadError ? (
                    <div className="absolute inset-0 z-25 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center text-slate-300">
                      <div className="w-12 h-12 rounded-[6px] bg-slate-900 border border-rose-900/60 text-rose-400 flex items-center justify-center mb-3">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-white">Original Photograph Unavailable</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                        The original source image could not be loaded from storage.
                      </p>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-3"
                        onClick={() => {
                          setOriginalLoadError(false);
                          setRetryKey((k) => k + 1);
                        }}
                        leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                      >
                        Retry Loading
                      </Button>
                    </div>
                  ) : originalUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      key={`orig-${retryKey}`}
                      src={originalUrl}
                      alt="BEFORE · Original"
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                      style={{
                        clipPath: `inset(0 ${100 - splitPos}% 0 0)`,
                      }}
                      onError={() => setOriginalLoadError(true)}
                    />
                  ) : null}

                  {/* Divider Line & Draggable Handle */}
                  {!originalLoadError && (
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
                        className="pointer-events-auto absolute w-8 h-8 rounded-full bg-white text-[#172033] shadow-md border-2 border-[#315FEA] flex items-center justify-center cursor-ew-resize hover:scale-105 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] before:absolute before:-inset-2 before:content-['']"
                      >
                        <SplitSquareVertical className="w-4 h-4 text-[#315FEA]" />
                      </div>
                    </div>
                  )}

                  {/* Persistent Canvas Labels */}
                  <div className="absolute top-3 left-3 z-10 pointer-events-none">
                    <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-[4px] bg-[#172033]/80 text-white backdrop-blur-xs border border-white/10 shadow-xs">
                      BEFORE · Original
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 z-10 pointer-events-none">
                    <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-[4px] bg-[#315FEA]/90 text-white backdrop-blur-xs border border-white/20 shadow-xs">
                      {displayedVariant ? 'AFTER · Enhanced for Website' : 'AFTER · Pending Enhancement'}
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
                    {originalLoadError ? (
                      <div className="flex flex-col items-center justify-center p-6 text-center text-slate-300">
                        <div className="w-10 h-10 rounded-[6px] bg-slate-900 border border-rose-900/60 text-rose-400 flex items-center justify-center mb-2.5">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-semibold text-white">Original Unavailable</p>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                          Could not load original photograph from storage.
                        </p>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="mt-2.5"
                          onClick={() => {
                            setOriginalLoadError(false);
                            setRetryKey((k) => k + 1);
                          }}
                          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                        >
                          Retry Loading
                        </Button>
                      </div>
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        key={`orig-${retryKey}`}
                        src={originalUrl}
                        alt="BEFORE · Original"
                        className="max-h-full max-w-full object-contain"
                        onError={() => setOriginalLoadError(true)}
                      />
                    )}
                  </div>

                  <div className="relative rounded-[6px] bg-slate-950 overflow-hidden flex items-center justify-center border border-[#315FEA]/30">
                    {displayedVariant && enhancedUrl && enhancedLoadError ? (
                      <div className="flex flex-col items-center justify-center p-6 text-center text-slate-300">
                        <div className="w-10 h-10 rounded-[6px] bg-slate-900 border border-amber-900/60 text-amber-400 flex items-center justify-center mb-2.5">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-semibold text-white">Enhanced Preview Unavailable</p>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                          Failed to load processed candidate preview from storage.
                        </p>
                        <div className="flex items-center gap-2 mt-2.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setEnhancedLoadError(false);
                              setRetryKey((k) => k + 1);
                            }}
                            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                          >
                            Retry
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleRunEnhancement}
                            isLoading={isProcessing}
                            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                          >
                            Re-enhance
                          </Button>
                        </div>
                      </div>
                    ) : displayedVariant && enhancedUrl ? (
                      <>
                        <div className="absolute top-3 left-3 z-10">
                          <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-[4px] bg-[#315FEA]/90 text-white border border-white/20">
                            AFTER · Enhanced for Website
                          </span>
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          key={`enhanced-${retryKey}`}
                          src={enhancedUrl}
                          alt="AFTER · Enhanced for Website"
                          className="max-h-full max-w-full object-contain"
                          onError={() => setEnhancedLoadError(true)}
                        />
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-center max-w-xs text-slate-400">
                        <div className="w-10 h-10 rounded-[6px] bg-slate-900 border border-slate-800 text-[#315FEA] flex items-center justify-center mb-2.5">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold text-slate-300">
                          Enhancement Pending
                        </span>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          Click &quot;Enhance for Website&quot; in the sidebar to process and preview this candidate.
                        </p>
                      </div>
                    )}
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
                    {originalLoadError ? (
                      <div className="flex flex-col items-center justify-center p-6 text-center text-slate-300">
                        <div className="w-10 h-10 rounded-[6px] bg-slate-900 border border-rose-900/60 text-rose-400 flex items-center justify-center mb-2.5">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-semibold text-white">Original Unavailable</p>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                          Could not load original photograph from storage.
                        </p>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="mt-2.5"
                          onClick={() => {
                            setOriginalLoadError(false);
                            setRetryKey((k) => k + 1);
                          }}
                          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                        >
                          Retry Loading
                        </Button>
                      </div>
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        key={`orig-${retryKey}`}
                        src={originalUrl}
                        alt="BEFORE · Original"
                        className="max-h-full max-w-full object-contain"
                        onError={() => setOriginalLoadError(true)}
                      />
                    )}
                  </div>

                  <div className="relative min-h-[220px] flex-1 rounded-[6px] bg-slate-950 overflow-hidden flex items-center justify-center border border-[#315FEA]/30">
                    {displayedVariant && enhancedUrl && enhancedLoadError ? (
                      <div className="flex flex-col items-center justify-center p-6 text-center text-slate-300">
                        <div className="w-10 h-10 rounded-[6px] bg-slate-900 border border-amber-900/60 text-amber-400 flex items-center justify-center mb-2.5">
                          <AlertCircle className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-semibold text-white">Enhanced Preview Unavailable</p>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                          Failed to load processed candidate preview from storage.
                        </p>
                        <div className="flex items-center gap-2 mt-2.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setEnhancedLoadError(false);
                              setRetryKey((k) => k + 1);
                            }}
                            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                          >
                            Retry
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleRunEnhancement}
                            isLoading={isProcessing}
                            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                          >
                            Re-enhance
                          </Button>
                        </div>
                      </div>
                    ) : displayedVariant && enhancedUrl ? (
                      <>
                        <div className="absolute top-3 left-3 z-10">
                          <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-[4px] bg-[#315FEA]/90 text-white border border-white/20">
                            AFTER · Enhanced for Website
                          </span>
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          key={`enhanced-${retryKey}`}
                          src={enhancedUrl}
                          alt="AFTER · Enhanced for Website"
                          className="max-h-full max-w-full object-contain"
                          onError={() => setEnhancedLoadError(true)}
                        />
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-center max-w-xs text-slate-400">
                        <div className="w-10 h-10 rounded-[6px] bg-slate-900 border border-slate-800 text-[#315FEA] flex items-center justify-center mb-2.5">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold text-slate-300">
                          Enhancement Pending
                        </span>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          Click &quot;Enhance for Website&quot; in the sidebar to process and preview this candidate.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Comparison Slider Accessibility Tip */}
            {viewMode === 'split' && (
              <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] text-center mt-2">
                Tip: Drag the vertical divider or select the handle and use Left/Right arrows to inspect enhancements.
              </p>
            )}
          </div>

          {/* Right Control Rail: Simplified 3-Step Information Hierarchy */}
          <aside className="w-full lg:w-96 bg-white dark:bg-[#0F172A] border-t lg:border-t-0 lg:border-l border-[#E3E7ED] dark:border-[#1E293B] flex flex-col shrink-0 overflow-y-auto">
            <div className="p-5 flex flex-col gap-5">

              {/* STEP 1: Primary Action — Enhance for Website */}
              <div className="p-4 bg-[#F8FAFC] dark:bg-[#1E293B]/70 rounded-[8px] border border-[#CBD5E1] dark:border-[#334155] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033] dark:text-white flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-[4px] bg-[#315FEA] text-white text-[10px] flex items-center justify-center font-bold">1</span>
                    <span>Enhance for Website</span>
                  </h3>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-[4px] bg-blue-50 text-[#1D4ED8] border border-blue-200 dark:bg-blue-950/40 dark:border-blue-800">
                    One-Click Pipeline
                  </span>
                </div>

                <p className="text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                  Calculates balanced highlight &amp; shadow curves, preserves architectural edges, and produces an optimized WebP candidate for fast website presentation.
                </p>

                <Button
                  variant="primary"
                  size="md"
                  className="w-full justify-center font-semibold"
                  isLoading={isProcessing}
                  loadingText="Enhancing image..."
                  onClick={handleRunEnhancement}
                  leftIcon={<Sparkles className="w-4 h-4" />}
                >
                  {displayedVariant ? 'Re-enhance for Website' : 'Enhance for Website'}
                </Button>

                <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] text-center flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
                  <span>Original photograph is immutable and never overwritten.</span>
                </p>
              </div>

              {/* STEP 2: Candidate Details & Enhancements Applied */}
              <div className="p-4 bg-[#F3F6FA] dark:bg-[#1E293B] rounded-[8px] border border-[#E3E7ED] dark:border-[#334155]">
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#172033] dark:text-white flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-[4px] bg-[#315FEA] text-white text-[10px] flex items-center justify-center font-bold">2</span>
                    <span>Enhancements Applied</span>
                  </h4>
                  {displayedVariant ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[4px] bg-emerald-50 text-[#15803D] border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800">
                      Candidate Ready
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[4px] bg-slate-100 text-[#475569] border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                      Pending
                    </span>
                  )}
                </div>

                {displayedVariant ? (
                  <>
                    {displayedVariant.appliedCorrections && displayedVariant.appliedCorrections.length > 0 ? (
                      <ul className="flex flex-col gap-1.5 mb-3">
                        {displayedVariant.appliedCorrections.map((corr, idx) => (
                          <li key={idx} className="text-xs text-[#172033] dark:text-slate-200 flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D] shrink-0 mt-0.5" />
                            <span>{corr}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <ul className="flex flex-col gap-1.5 mb-3">
                        <li className="text-xs text-[#172033] dark:text-slate-200 flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D] shrink-0 mt-0.5" />
                          <span>Tonal dynamic range &amp; shadow headroom balanced</span>
                        </li>
                        <li className="text-xs text-[#172033] dark:text-slate-200 flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D] shrink-0 mt-0.5" />
                          <span>Edge-preserving texture noise reduction applied</span>
                        </li>
                        <li className="text-xs text-[#172033] dark:text-slate-200 flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D] shrink-0 mt-0.5" />
                          <span>High-efficiency WebP candidate calibrated for web delivery</span>
                        </li>
                      </ul>
                    )}

                    <div className="pt-2.5 border-t border-[#E3E7ED] dark:border-[#334155] grid grid-cols-2 gap-2.5 text-[11px]">
                      <div>
                        <span className="text-[#475569] dark:text-[#94A3B8] block text-[10px]">Candidate Resolution:</span>
                        <span className="font-semibold text-[#172033] dark:text-white">
                          {displayedVariant.width} × {displayedVariant.height} px
                        </span>
                      </div>
                      <div>
                        <span className="text-[#475569] dark:text-[#94A3B8] block text-[10px]">Candidate File Size:</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-[#172033] dark:text-white">
                            {formatBytes(displayedVariant.fileSize)}
                          </span>
                          {savingsText && (
                            <span className="text-[10px] font-medium px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              {savingsText}
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-[#475569] dark:text-[#94A3B8] block text-[10px]">Output Format:</span>
                        <span className="font-semibold text-[#172033] dark:text-white uppercase">
                          {displayedVariant.mimeType ? displayedVariant.mimeType.replace('image/', '') : 'WEBP'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#475569] dark:text-[#94A3B8] block text-[10px]">Candidate Status:</span>
                        <span className="font-semibold text-[#172033] dark:text-white">
                          {displayedVariant.status}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-2 space-y-2">
                    <p className="text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                      No enhanced candidate generated yet. Click &quot;Enhance for Website&quot; above to inspect candidate improvements.
                    </p>
                    <div className="pt-2 border-t border-[#E3E7ED] dark:border-[#334155] flex items-center justify-between text-[11px] text-[#475569] dark:text-[#94A3B8]">
                      <span>Original Resolution:</span>
                      <span className="font-medium text-[#172033] dark:text-white">
                        {displayWidth} × {displayHeight} px
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 3: Candidate Review & Publishing Boundary */}
              <div className="flex flex-col gap-2.5 pt-2 border-t border-[#E3E7ED] dark:border-[#1E293B]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#172033] dark:text-white flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-[4px] bg-[#315FEA] text-white text-[10px] flex items-center justify-center font-bold">3</span>
                  <span>Review &amp; Publishing Boundary</span>
                </h4>

                {/* State 1: Candidate Generated · Review Required (Keep vs Discard) */}
                {isVariantPendingReview && (
                  <div className="flex flex-col gap-2 p-3 rounded-[6px] bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 dark:text-amber-300">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Candidate Generated · Review Required</span>
                    </div>
                    <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                      Compare the candidate against the original photograph. Choose to keep or discard the enhancement.
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <Button
                        variant="success"
                        size="sm"
                        isLoading={isApproving}
                        loadingText="Keeping..."
                        onClick={handleApproveVariant}
                        leftIcon={<Check className="w-3.5 h-3.5" />}
                        className="w-full justify-center font-semibold"
                        title="Keep enhanced candidate and mark as approved"
                      >
                        Keep Enhanced
                      </Button>
                      <Button
                        variant="destructive-outline"
                        size="sm"
                        isLoading={isRejecting}
                        loadingText="Discarding..."
                        onClick={handleRejectVariant}
                        leftIcon={<X className="w-3.5 h-3.5" />}
                        className="w-full justify-center"
                        title="Discard candidate and return to original source"
                      >
                        Discard
                      </Button>
                    </div>
                  </div>
                )}

                {/* State 2: Candidate Approved · Explicit Publishing Separated */}
                {displayedVariant?.status === 'Approved' && (
                  <div className="flex flex-col gap-2 p-3 rounded-[6px] bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-900 dark:text-blue-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        Candidate Approved
                      </span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                        Ready to Live
                      </span>
                    </div>
                    <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                      Candidate is approved for website presentation. Approval does not automatically publish.
                    </p>
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full justify-center mt-1 font-semibold"
                      isLoading={isPublishing}
                      loadingText="Publishing to Live Website..."
                      onClick={handlePublishImage}
                      leftIcon={<Globe className="w-4 h-4" />}
                    >
                      {isImagePublished ? 'Update Live Website' : 'Publish to Live Website'}
                    </Button>
                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={handleRejectVariant}
                        disabled={isRejecting}
                        className="text-[11px] text-[#64748B] hover:text-[#B91C1C] dark:hover:text-rose-400 underline underline-offset-2 transition-colors"
                      >
                        Discard Approved Candidate
                      </button>
                    </div>
                  </div>
                )}

                {/* State 3: Variant is Actively Published on Live Website */}
                {(displayedVariant?.status === 'Published' || (isImagePublished && !isVariantPendingReview)) && (
                  <div className="flex flex-col gap-2 p-3 rounded-[6px] bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Active on Live Website
                      </span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                        Published
                      </span>
                    </div>
                    <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                      Live website visitors are served the optimized presentation. Master library records remain preserved.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-center text-[#B91C1C] hover:bg-rose-50 border-rose-200 dark:border-rose-900/50 dark:hover:bg-rose-950/30 mt-1"
                      isLoading={isUnpublishing}
                      loadingText="Unpublishing..."
                      onClick={handleUnpublishImage}
                    >
                      Remove from Live Website
                    </Button>
                  </div>
                )}

                {/* State 4: Initial Un-enhanced Image Ready to Publish */}
                {!displayedVariant && !isImagePublished && effectiveImage?.status === 'Approved' && (
                  <div className="mt-1">
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full justify-center"
                      isLoading={isPublishing}
                      loadingText="Publishing to Live Website..."
                      onClick={handlePublishImage}
                      leftIcon={<Globe className="w-4 h-4" />}
                    >
                      Publish to Live Website
                    </Button>
                  </div>
                )}

                {/* Separation Notice */}
                <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] mt-1 leading-relaxed">
                  Keeping or approving a candidate does not automatically modify live website content. Publishing is always explicit.
                </p>

                {/* Additional Media Management Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#E3E7ED] dark:border-[#1E293B]">
                  {onReplaceRequested && currentImage && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 justify-center"
                      onClick={() => onReplaceRequested(currentImage)}
                      leftIcon={<Upload className="w-3.5 h-3.5" />}
                    >
                      Replace Source
                    </Button>
                  )}
                  {onDeleteRequested && currentImage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[#B91C1C] hover:bg-rose-50"
                      onClick={() => onDeleteRequested(currentImage)}
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
