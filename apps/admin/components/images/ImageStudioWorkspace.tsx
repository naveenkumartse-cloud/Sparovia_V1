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
  Crop,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/components/ui/Toast';

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

export function cleanImageTitle(
  name?: string | null,
  slot?: string | null,
  category?: string | null
): string {
  if (name && name.trim() && name.trim().toLowerCase() !== 'untitled project') {
    const trimmed = name.trim();
    if (trimmed.toLowerCase().startsWith('whatsapp image')) {
      const match = trimmed.match(/(\d{4}-\d{2}-\d{2})/);
      return match ? `WhatsApp Photo (${match[1]})` : 'WhatsApp Photo';
    }
    const withoutExt = trimmed.replace(/\.(jpeg|jpg|png|webp|gif)$/i, '');
    return withoutExt || trimmed;
  }
  if (slot) {
    const slotNames: Record<string, string> = {
      heroImage: 'Hero Background Image',
      primaryImage: 'About Feature Image',
      secondaryImage: 'About Accent Image',
      serviceImage: 'Services Overview Image',
    };
    if (slotNames[slot]) return slotNames[slot];
  }
  if (category) {
    return `${category} Photo`;
  }
  return 'Project Photograph';
}

interface SizeComparison {
  status: 'smaller' | 'equivalent' | 'larger';
  label: string;
  badgeClass: string;
  explanation: string;
}

function compareFileSizes(originalSize: number, candidateSize: number): SizeComparison | null {
  if (!originalSize || !candidateSize) return null;
  const diffPct = Math.round(((candidateSize - originalSize) / originalSize) * 100);

  if (candidateSize < originalSize) {
    const pct = Math.abs(diffPct);
    if (pct >= 5) {
      return {
        status: 'smaller',
        label: `${pct}% smaller`,
        badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        explanation: `Optimized for fast web loading. File size reduced by ${pct}%.`,
      };
    } else {
      return {
        status: 'equivalent',
        label: 'Comparable size',
        badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        explanation: 'Image quality improved with comparable file size.',
      };
    }
  } else if (Math.abs(diffPct) <= 5) {
    return {
      status: 'equivalent',
      label: 'Comparable size',
      badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      explanation: 'Image quality improved with comparable file size.',
    };
  } else {
    return {
      status: 'larger',
      label: `+${diffPct}% size`,
      badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      explanation: `Image quality and clarity improved. File size increased by ${diffPct}%.`,
    };
  }
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

  // Website slot framing & fit preview
  const [framingEnabled, setFramingEnabled] = useState<boolean>(false);
  const [framingPosition, setFramingPosition] = useState<'center' | 'top' | 'bottom'>('center');

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

  // Lock body scroll and compensate for scrollbar width to prevent modal shaking
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, []);

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
        toast.success('Enhancement complete. Candidate ready for your review.');
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to enhance image. The original photograph remains safe and untouched.';
      setErrorMessage(msg);
      toast.error(msg);
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
      toast.success('Candidate approved for website.');
    } catch (err: any) {
      const msg = err?.message || 'Failed to approve candidate.';
      setErrorMessage(msg);
      toast.error(msg);
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
      toast.info('Candidate discarded. Original photograph remains preserved.');
    } catch (err: any) {
      const msg = err?.message || 'Failed to discard candidate.';
      setErrorMessage(msg);
      toast.error(msg);
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
      toast.success('Image published to live website successfully.');
    } catch (err: any) {
      const msg = err?.message || 'Failed to publish image.';
      setErrorMessage(msg);
      toast.error(msg);
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
      toast.info('Image safely removed from live website.');
    } catch (err: any) {
      const msg = err?.message || 'Failed to unpublish image.';
      setErrorMessage(msg);
      toast.error(msg);
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
  const isImagePublished = Boolean(effectiveImage?.status === 'Published' && effectiveImage.isActiveWebsiteUsage);

  const cleanTitle = cleanImageTitle(
    effectiveImage?.projectWorkName || effectiveImage?.originalFileName,
    effectiveImage?.slot || pendingUpload?.slot,
    effectiveImage?.category || pendingUpload?.category
  );

  const displayWidth = effectiveImage?.width || pendingUpload?.dimensions.width || 0;
  const displayHeight = effectiveImage?.height || pendingUpload?.dimensions.height || 0;
  const displaySize = effectiveImage?.fileSize || pendingUpload?.file.size || 0;
  const displayMime = (effectiveImage?.mimeType || pendingUpload?.file.type || 'image/jpeg')
    .replace('image/', '')
    .toUpperCase();
  const displayCategory = effectiveImage?.category || pendingUpload?.category;
  const displaySlot = effectiveImage?.slot || pendingUpload?.slot;

  const sizeComparison = displayedVariant ? compareFileSizes(displaySize, displayedVariant.fileSize) : null;

  const effectiveSlotKey = displaySlot || '';
  const slotPresets: Record<string, { label: string; ratio: number; displayRatio: string }> = {
    heroImage: { label: 'Hero Billboard', ratio: 16 / 9, displayRatio: '16:9' },
    primaryImage: { label: 'About Feature', ratio: 3 / 2, displayRatio: '3:2' },
    secondaryImage: { label: 'About Accent', ratio: 4 / 3, displayRatio: '4:3' },
    serviceImage: { label: 'Services Feature', ratio: 3 / 2, displayRatio: '3:2' },
  };

  const activeSlotPreset = slotPresets[effectiveSlotKey] || {
    label: 'Feature Showcase',
    ratio: 3 / 2,
    displayRatio: '3:2',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-studio-title"
      className="fixed inset-0 z-50 bg-[#0B1220]/80 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-5 overflow-hidden"
    >
      {/* Workspace Card */}
      <div className="bg-[#0B1220] w-full max-w-7xl h-[95vh] max-h-[95vh] rounded-[10px] shadow-2xl flex flex-col border border-white/10 overflow-hidden relative">
        {/* Workspace Top Bar (Framer-Style Glass Toolbar) */}
        <header className="px-5 py-3.5 border-b border-white/10 image-studio-glass flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-[6px] bg-[#7950B8]/20 text-[#7950B8] border border-[#7950B8]/30 flex items-center justify-center font-bold shrink-0 glow-purple">
              <Sparkles className="w-5 h-5 text-[#9333EA] dark:text-[#C4B5FD]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 id="image-studio-title" className="text-base font-semibold text-[#172033] dark:text-white truncate max-w-xs sm:max-w-md">
                  {cleanTitle}
                </h2>

                {/* ONE single status badge for the entire studio */}
                {isImagePublished ? (
                  <Badge variant="success" size="xs" dot>
                    Active on Website
                  </Badge>
                ) : isVariantPendingReview ? (
                  <Badge variant="warning" size="xs">
                    Candidate Ready for Review
                  </Badge>
                ) : isVariantApproved || effectiveImage?.status === 'Approved' ? (
                  <Badge variant="brand" size="xs">
                    Ready to Publish
                  </Badge>
                ) : (
                  <Badge variant="neutral" size="xs">
                    Draft Original
                  </Badge>
                )}
              </div>
              <p className="text-xs text-[#475569] dark:text-[#94A3B8] flex items-center gap-2 mt-0.5">
                <span>{displayWidth} × {displayHeight} px</span>
                <span>•</span>
                <span>{formatBytes(displaySize)}</span>
                {displayCategory && (
                  <>
                    <span>•</span>
                    <span>Category: {displayCategory}</span>
                  </>
                )}
                {displaySlot && (
                  <>
                    <span>•</span>
                    <span>Slot: {activeSlotPreset.label}</span>
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

            {/* Website Slot Framing Toggle */}
            <button
              type="button"
              onClick={() => setFramingEnabled(!framingEnabled)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[6px] border transition-colors ${
                framingEnabled
                  ? 'bg-[#315FEA] text-white border-[#315FEA] shadow-xs'
                  : 'bg-[#F3F6FA] dark:bg-[#1E293B] text-[#475569] dark:text-slate-400 border-[#E3E7ED] dark:border-[#334155] hover:text-[#172033] dark:hover:text-white'
              }`}
              title="Preview how this photo fits inside its website slot container"
              aria-pressed={framingEnabled}
            >
              <Crop className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Framing Preview</span>
              <span className="sm:hidden">Framing</span>
            </button>

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

        {/* Main Body: Left Inspection Canvas & Right Control Rail */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden bg-[#F3F6FA] dark:bg-[#0B1220]">
          {/* Comparison Inspection Area */}
          <div className="flex-1 min-h-[300px] flex flex-col p-3 sm:p-5 overflow-auto relative">
            <div
              ref={containerRef}
              className="flex-1 w-full min-h-[320px] bg-[#070B12] rounded-[8px] border border-white/10 relative overflow-hidden flex items-center justify-center select-none shadow-inner"
              onMouseDown={viewMode === 'split' ? handleMouseDown : undefined}
              onTouchStart={viewMode === 'split' ? handleTouchStart : undefined}
              onTouchMove={viewMode === 'split' ? handleTouchMove : undefined}
            >
              {/* Ambient Creative Purple Glow Orb behind image */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center" aria-hidden="true">
                <div className="w-[500px] h-[500px] rounded-full bg-[#7950B8]/15 blur-[120px] transform-gpu" />
              </div>

              {/* Processing Overlay (Screenshot 3 aligned: keep photo visible behind backdrop, reassuring copy, purple creative glow) */}
              {isProcessing && (
                <div className="absolute inset-0 z-30 bg-[#0B1220]/75 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-white text-center animate-fadeIn">
                  <div className="w-12 h-12 rounded-[6px] bg-[#7950B8]/20 border border-[#7950B8]/40 text-[#C4B5FD] flex items-center justify-center mb-3 glow-purple">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                  <p className="text-base font-semibold tracking-wide text-white">Enhancing for Website</p>
                  <p className="text-xs text-slate-300 mt-1.5 max-w-sm leading-relaxed">
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

                  {/* Divider Line & Glowing Draggable Handle */}
                  {!originalLoadError && (
                    <div
                      className="absolute top-0 bottom-0 z-20 pointer-events-none flex items-center justify-center"
                      style={{ left: `${splitPos}%` }}
                    >
                      <div className="w-0.5 h-full bg-white shadow-[0_0_12px_rgba(121,80,184,0.8),0_0_4px_#ffffff]" />
                      <div
                        role="slider"
                        tabIndex={0}
                        aria-label="Before/after comparison split position"
                        aria-valuenow={Math.round(splitPos)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        onKeyDown={handleSliderKeyDown}
                        className="pointer-events-auto touch-none absolute w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white text-[#7950B8] shadow-lg border-2 border-[#7950B8] flex items-center justify-center cursor-ew-resize hover:scale-110 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7950B8] glow-purple before:absolute before:-inset-3 before:content-['']"
                      >
                        <SplitSquareVertical className="w-4 h-4 text-[#7950B8]" />
                      </div>
                    </div>
                  )}

                  {/* Persistent Canvas Labels */}
                  <div className="absolute top-3 left-3 z-10 pointer-events-none max-w-[45%]">
                    <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-[4px] bg-[#172033]/80 text-white backdrop-blur-xs border border-white/10 shadow-xs block truncate">
                      <span className="hidden sm:inline">BEFORE · </span>Original
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 z-10 pointer-events-none max-w-[45%] text-right">
                    <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-[4px] bg-[#315FEA]/90 text-white backdrop-blur-xs border border-white/20 shadow-xs inline-block truncate max-w-full">
                      <span className="hidden sm:inline">AFTER · </span>{displayedVariant ? 'Enhanced' : 'Pending'}
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

              {/* Website Slot Framing Overlay (Simulates actual live website crop boundaries) */}
              {framingEnabled && (
                <div className="absolute inset-0 z-25 pointer-events-none flex items-center justify-center p-3 sm:p-6 overflow-hidden">
                  <div
                    className={`relative border-2 border-[#315FEA] shadow-[0_0_0_9999px_rgba(15,23,42,0.65)] transition-all duration-200 pointer-events-auto ${
                      activeSlotPreset.displayRatio === '16:9'
                        ? 'aspect-[16/9] w-full max-w-[94%] max-h-[86%]'
                        : activeSlotPreset.displayRatio === '4:3'
                        ? 'aspect-[4/3] w-full max-w-[76%] max-h-[86%]'
                        : activeSlotPreset.displayRatio === '1:1'
                        ? 'aspect-square w-full max-w-[65%] max-h-[86%]'
                        : 'aspect-[3/2] w-full max-w-[86%] max-h-[86%]'
                    } ${
                      framingPosition === 'top'
                        ? '!mt-2 !mb-auto'
                        : framingPosition === 'bottom'
                        ? '!mb-2 !mt-auto'
                        : 'my-auto'
                    }`}
                  >
                    <div className="absolute -top-7 left-0 bg-[#315FEA] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-[4px] shadow-sm uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
                      <Crop className="w-3 h-3" />
                      <span>Website Slot Fit: {activeSlotPreset.label} ({activeSlotPreset.displayRatio})</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Floating Framing Focus Toolbar */}
              {framingEnabled && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 bg-[#172033]/92 backdrop-blur-md border border-white/20 rounded-[8px] px-3.5 py-1.5 flex items-center gap-3 text-xs text-white shadow-xl max-w-[95%] overflow-x-auto select-none">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">Slot Framing:</span>
                    <span className="font-semibold text-white text-[11px]">{activeSlotPreset.displayRatio}</span>
                  </div>
                  <div className="h-3.5 w-px bg-white/20 shrink-0" />
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-slate-300 mr-1">Focus Alignment:</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFramingPosition('top');
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                        framingPosition === 'top' ? 'bg-[#315FEA] text-white shadow-xs' : 'text-slate-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      Top Focus
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFramingPosition('center');
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                        framingPosition === 'center' ? 'bg-[#315FEA] text-white shadow-xs' : 'text-slate-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      Center Focus
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFramingPosition('bottom');
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                        framingPosition === 'bottom' ? 'bg-[#315FEA] text-white shadow-xs' : 'text-slate-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      Bottom Focus
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Comparison Slider Accessibility Tip */}
            {viewMode === 'split' && (
              <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] text-center mt-2">
                Tip: Drag the vertical divider or select the handle and use Left/Right arrows to inspect enhancements.
                {framingEnabled && ' Framing guide simulates how this photo fits inside its website container without modifying the original.'}
              </p>
            )}
          </div>

          {/* Right Control Rail: Simplified 3-Step Information Hierarchy */}
          <aside className="w-full lg:w-96 glass-panel border-t lg:border-t-0 lg:border-l border-white/60 dark:border-white/10 flex flex-col shrink-0 overflow-y-auto [scrollbar-gutter:stable]">
            <div className="p-5 flex flex-col gap-5">

              {/* Status Feedback in Sidebar (Canvas layout remains rock-solid) */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-[6px] flex items-start justify-between text-xs text-[#B91C1C] dark:text-rose-300">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setErrorMessage(null)}
                    className="text-[#B91C1C] hover:opacity-80 p-0.5 ml-1 shrink-0"
                    aria-label="Dismiss message"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-[6px] flex items-start justify-between text-xs text-[#15803D] dark:text-emerald-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{successMessage}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSuccessMessage(null)}
                    className="text-[#15803D] hover:opacity-80 p-0.5 ml-1 shrink-0"
                    aria-label="Dismiss message"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* CONTEXTUAL CLIENT JOURNEY (State A, B, C, or D) */}

              {/* STATE B: Enhanced Candidate Ready for Review */}
              {isVariantPendingReview && displayedVariant ? (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-[8px] space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-amber-950 dark:text-amber-200 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span>Your enhanced photo is ready</span>
                      </h3>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-semibold">
                        Review
                      </span>
                    </div>

                    <p className="text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                      Compare the enhanced candidate against your original photo using the slider.
                    </p>

                    <ul className="space-y-1.5 text-xs text-[#172033] dark:text-slate-200 pt-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
                        <span>Lighting and visibility improved</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
                        <span>Details and edges refined</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
                        <span>Original appearance preserved</span>
                      </li>
                    </ul>

                    {/* Honest File-Size Communication */}
                    <div className="p-3 bg-white/90 dark:bg-slate-900/90 rounded-[6px] border border-amber-200/70 dark:border-amber-800/40 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[#475569] dark:text-slate-400">File size:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[#172033] dark:text-white">
                            {formatBytes(displayedVariant.fileSize)}
                          </span>
                          {sizeComparison && (
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${sizeComparison.badgeClass}`}>
                              {sizeComparison.label}
                            </span>
                          )}
                        </div>
                      </div>
                      {sizeComparison && (
                        <p className="text-[11px] text-[#64748B] dark:text-slate-400 leading-normal">
                          {sizeComparison.explanation}
                        </p>
                      )}
                    </div>

                    {isImagePublished && (
                      <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                        (Your current website image remains live while you review this candidate.)
                      </p>
                    )}

                    {/* Decision Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Button
                        variant="success"
                        size="md"
                        isLoading={isApproving}
                        loadingText="Keeping..."
                        onClick={handleApproveVariant}
                        leftIcon={<Check className="w-4 h-4" />}
                        className="w-full justify-center font-semibold"
                        title="Keep enhanced candidate and mark as approved"
                      >
                        Keep enhanced
                      </Button>
                      <Button
                        variant="destructive-outline"
                        size="md"
                        isLoading={isRejecting}
                        loadingText="Discarding..."
                        onClick={handleRejectVariant}
                        leftIcon={<X className="w-4 h-4" />}
                        className="w-full justify-center"
                        title="Discard candidate and return to original photo"
                      >
                        Discard
                      </Button>
                    </div>

                    <div className="pt-1 text-center">
                      <button
                        type="button"
                        onClick={handleRunEnhancement}
                        disabled={isProcessing}
                        className="text-xs text-[#315FEA] hover:underline font-medium inline-flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Enhance again</span>
                      </button>
                    </div>
                  </div>

                  {/* Optional Technical Details Collapsible */}
                  <details className="text-xs text-[#475569] dark:text-slate-400 group border border-[#E3E7ED] dark:border-[#1E293B] rounded-[6px] p-2.5">
                    <summary className="cursor-pointer font-medium hover:text-[#172033] dark:hover:text-white flex items-center justify-between select-none">
                      <span>Technical Details</span>
                      <span className="text-[10px] group-open:rotate-180 transition-transform">▾</span>
                    </summary>
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Candidate Resolution:</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200">{displayedVariant.width} × {displayedVariant.height} px</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Original Resolution:</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200">{displayWidth} × {displayHeight} px</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Web Format:</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200">WebP (Optimized)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Original File Size:</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200">{formatBytes(displaySize)}</span>
                      </div>
                    </div>
                  </details>
                </div>
              ) : displayedVariant?.status === 'Approved' ? (
                /* STATE C: Candidate Approved · Ready to Publish */
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 rounded-[8px] space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-blue-950 dark:text-blue-200 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>Ready to publish</span>
                      </h3>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-semibold">
                        Approved
                      </span>
                    </div>

                    <p className="text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                      Your enhanced image is saved and approved. Publishing will make it active on your live website.
                    </p>

                    <Button
                      variant="primary"
                      size="md"
                      className="w-full justify-center font-semibold"
                      isLoading={isPublishing}
                      loadingText="Publishing to website..."
                      onClick={handlePublishImage}
                      leftIcon={<Globe className="w-4 h-4" />}
                    >
                      Publish to website
                    </Button>

                    <div className="pt-2 flex items-center justify-between text-xs border-t border-blue-200/60 dark:border-blue-900/40">
                      <button
                        type="button"
                        onClick={handleRunEnhancement}
                        disabled={isProcessing}
                        className="text-[#475569] hover:text-[#315FEA] dark:hover:text-blue-400 font-medium inline-flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Enhance again</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRejectVariant}
                        disabled={isRejecting}
                        className="text-[#64748B] hover:text-[#B91C1C] dark:hover:text-rose-400 font-medium"
                      >
                        Discard candidate
                      </button>
                    </div>
                  </div>
                </div>
              ) : isImagePublished ? (
                /* STATE D: Actively Published on Website */
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-[8px] space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-emerald-950 dark:text-emerald-200 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Live on website</span>
                      </h3>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-semibold">
                        Published
                      </span>
                    </div>

                    <p className="text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                      Website visitors are seeing this image. Master library records and original photograph remain safely preserved.
                    </p>

                    <div className="pt-2 flex flex-col gap-2">
                      <Button
                        variant="secondary"
                        size="md"
                        className="w-full justify-center font-semibold text-xs"
                        isLoading={isProcessing}
                        loadingText="Enhancing photo..."
                        onClick={handleRunEnhancement}
                        leftIcon={<Sparkles className="w-4 h-4 text-[#315FEA]" />}
                      >
                        Enhance again
                      </Button>

                      {onReplaceRequested && currentImage && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-center text-xs"
                          onClick={() => onReplaceRequested(currentImage)}
                          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                        >
                          Replace image
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-center text-xs text-[#B91C1C] hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        isLoading={isUnpublishing}
                        loadingText="Removing..."
                        onClick={handleUnpublishImage}
                      >
                        Remove from Live Website
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                /* STATE A: Original Image Only (Default) */
                <div className="space-y-4">
                  <div className="p-4 bg-[#F8FAFC] dark:bg-[#1E293B]/70 rounded-[8px] border border-[#7950B8]/20 dark:border-[#7950B8]/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-[#172033] dark:text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#7950B8]" />
                        <span>Enhance for Website</span>
                      </h3>
                    </div>

                    <p className="text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                      Improve lighting, clarity and presentation while keeping your original photo safe.
                    </p>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleRunEnhancement}
                      className="w-full justify-center font-semibold text-xs py-2.5 px-4 rounded-[6px] inline-flex items-center gap-2 bg-gradient-to-r from-[#7950B8] to-[#6038A0] text-white shadow-md shadow-[#7950B8]/25 hover:from-[#6b42a8] hover:to-[#532e90] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Enhancing photo...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Enhance for Website</span>
                        </>
                      )}
                    </button>

                    <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] text-center flex items-center justify-center gap-1.5 pt-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
                      <span>Original photograph is immutable and never overwritten.</span>
                    </p>
                  </div>

                  {/* If original upload is validated and user wants to publish directly without enhancement */}
                  {effectiveImage?.status === 'Approved' && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-[6px] border border-slate-200 dark:border-slate-800 space-y-2">
                      <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
                        Or publish your original photo directly without enhancement:
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-center text-xs font-medium"
                        isLoading={isPublishing}
                        loadingText="Publishing..."
                        onClick={handlePublishImage}
                        leftIcon={<Globe className="w-3.5 h-3.5" />}
                      >
                        Publish original to website
                      </Button>
                    </div>
                  )}

                  {/* Supporting secondary actions */}
                  <div className="pt-2 flex flex-col gap-2">
                    {onReplaceRequested && currentImage && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-center text-xs"
                        onClick={() => onReplaceRequested(currentImage)}
                        leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                      >
                        Replace photo
                      </Button>
                    )}
                    {onDeleteRequested && currentImage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-center text-xs text-[#B91C1C] hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        onClick={() => onDeleteRequested(currentImage)}
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                      >
                        Delete from library
                      </Button>
                    )}
                  </div>
                </div>
              )}

            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
