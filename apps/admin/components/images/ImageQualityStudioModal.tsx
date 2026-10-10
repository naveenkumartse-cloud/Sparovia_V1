'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  SlidersHorizontal,
  Sparkles,
  ShieldCheck,
  Check,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Columns,
  SplitSquareVertical,
  ChevronDown,
  ChevronUp,
  X,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/Button';

export interface ImageVariantDto {
  id: string;
  imageId: string;
  variantType: string;
  operation?: string;
  mimeType: string;
  fileSize: number;
  width: number;
  height: number;
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

export interface ImageQualityStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: ImageDto | null;
  onImageUpdated?: (updatedImage: ImageDto) => void;
  onOptimizeRequested?: (image: ImageDto, variantId?: string) => void;
  resolveImageUrl: (url: string | null | undefined) => string;
}

type PresetKey = 'Light' | 'Balanced' | 'High' | 'Custom';
type ViewMode = 'split' | 'side-by-side' | 'stacked';

interface PresetValues {
  brightness: number;
  contrast: number;
  sharpness: number;
  noiseReduction: number;
  saturation: number;
}

const PRESET_CONFIGS: Record<'Light' | 'Balanced' | 'High', PresetValues> = {
  Light: {
    brightness: 2,
    contrast: 5,
    sharpness: 15,
    noiseReduction: 10,
    saturation: 2,
  },
  Balanced: {
    brightness: 4,
    contrast: 10,
    sharpness: 35,
    noiseReduction: 20,
    saturation: 6,
  },
  High: {
    brightness: 6,
    contrast: 16,
    sharpness: 60,
    noiseReduction: 35,
    saturation: 10,
  },
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function ImageQualityStudioModal({
  isOpen,
  onClose,
  image,
  onImageUpdated,
  onOptimizeRequested,
  resolveImageUrl,
}: ImageQualityStudioModalProps) {
  // Preset & Slider states (Balanced is the locked default)
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>('Balanced');
  const [brightness, setBrightness] = useState<number>(PRESET_CONFIGS.Balanced.brightness);
  const [contrast, setContrast] = useState<number>(PRESET_CONFIGS.Balanced.contrast);
  const [sharpness, setSharpness] = useState<number>(PRESET_CONFIGS.Balanced.sharpness);
  const [noiseReduction, setNoiseReduction] = useState<number>(PRESET_CONFIGS.Balanced.noiseReduction);
  const [saturation, setSaturation] = useState<number>(PRESET_CONFIGS.Balanced.saturation);

  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [splitPos, setSplitPos] = useState<number>(50); // percentage (0-100)
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1 = 100%, max 3

  // Active processed variant
  const [currentVariant, setCurrentVariant] = useState<ImageVariantDto | null>(null);
  const [variantImgLoading, setVariantImgLoading] = useState<boolean>(false);
  const [variantImgError, setVariantImgError] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const [approving, setApproving] = useState<boolean>(false);
  const [rejecting, setRejecting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState<boolean>(false);

  // Drag interaction refs for split slider
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Initialize or reset when image changes or modal opens
  useEffect(() => {
    if (isOpen && image) {
      // Find most recent QualityStudio variant if one exists
      const existingQsVariant = [...(image.variants || [])]
        .filter((v) => v.variantType === 'QualityStudio' || (v.operation && v.operation.startsWith('QualityStudio')))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

      if (existingQsVariant) {
        setCurrentVariant(existingQsVariant);
        setVariantImgLoading(true);
        setVariantImgError(false);
      } else {
        setCurrentVariant(null);
        setVariantImgLoading(false);
        setVariantImgError(false);
      }

      // Default back to Balanced preset
      setSelectedPreset('Balanced');
      setBrightness(PRESET_CONFIGS.Balanced.brightness);
      setContrast(PRESET_CONFIGS.Balanced.contrast);
      setSharpness(PRESET_CONFIGS.Balanced.sharpness);
      setNoiseReduction(PRESET_CONFIGS.Balanced.noiseReduction);
      setSaturation(PRESET_CONFIGS.Balanced.saturation);
      setSplitPos(50);
      setZoomLevel(1);
      setErrorMessage(null);
      setSuccessNotice(null);
      setHasUnsavedChanges(false);
      setShowCloseConfirm(false);
    }
  }, [isOpen, image]);

  // Handle Preset selection
  const handleSelectPreset = (preset: 'Light' | 'Balanced' | 'High') => {
    setSelectedPreset(preset);
    const cfg = PRESET_CONFIGS[preset];
    setBrightness(cfg.brightness);
    setContrast(cfg.contrast);
    setSharpness(cfg.sharpness);
    setNoiseReduction(cfg.noiseReduction);
    setSaturation(cfg.saturation);
    setHasUnsavedChanges(true);
  };

  // Detect custom deviation from presets
  const updateSlider = (setter: React.Dispatch<React.SetStateAction<number>>, val: number) => {
    setter(val);
    setSelectedPreset('Custom');
    setHasUnsavedChanges(true);
  };

  const handleResetToPreset = () => {
    const targetPreset = selectedPreset === 'Custom' ? 'Balanced' : selectedPreset;
    setSelectedPreset(targetPreset);
    const cfg = PRESET_CONFIGS[targetPreset as 'Light' | 'Balanced' | 'High'];
    setBrightness(cfg.brightness);
    setContrast(cfg.contrast);
    setSharpness(cfg.sharpness);
    setNoiseReduction(cfg.noiseReduction);
    setSaturation(cfg.saturation);
  };

  // Draggable Split Divider Handlers
  const handleSplitMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pos = ((clientX - rect.left) / rect.width) * 100;
      setSplitPos(Math.max(5, Math.min(95, pos)));
    },
    []
  );

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

  // Keyboard navigation for split handle
  const handleKeyDownSplit = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setSplitPos((prev) => Math.max(5, prev - 5));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setSplitPos((prev) => Math.min(95, prev + 5));
    }
  };

  // Process image in Quality Studio
  const handleProcessImage = async () => {
    if (!image) return;
    setProcessing(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      const payload = {
        preset: selectedPreset,
        brightness,
        contrast,
        sharpness,
        noiseReduction,
        saturation,
      };

      const res = await apiClient.post<any>(`/website/images/${image.id}/quality/process`, payload);
      if (res?.data) {
        setCurrentVariant(res.data);
        setVariantImgLoading(true);
        setVariantImgError(false);
        setHasUnsavedChanges(true);

        // Fetch refreshed image details
        const refreshed = await apiClient.get<any>(`/website/images/${image.id}`);
        if (refreshed?.data && onImageUpdated) {
          onImageUpdated(refreshed.data);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process photograph. Original image remains preserved.');
    } finally {
      setProcessing(false);
    }
  };

  // Approve Variant
  const handleApproveVariant = async () => {
    if (!image || !currentVariant) return;
    setApproving(true);
    setErrorMessage(null);

    try {
      await apiClient.post(`/website/images/${image.id}/variants/${currentVariant.id}/approve`, {});
      setCurrentVariant((prev) => (prev ? { ...prev, status: 'Approved' } : null));
      setSuccessNotice('Quality-enhanced variant approved! Note: Website publishing remains an explicit separate action.');
      setHasUnsavedChanges(false);

      const refreshed = await apiClient.get<any>(`/website/images/${image.id}`);
      if (refreshed?.data && onImageUpdated) {
        onImageUpdated(refreshed.data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to approve variant.');
    } finally {
      setApproving(false);
    }
  };

  // Reject Variant / Keep Original
  const handleRejectVariant = async () => {
    if (!image || !currentVariant) return;
    setRejecting(true);
    setErrorMessage(null);

    try {
      await apiClient.post(`/website/images/${image.id}/variants/${currentVariant.id}/reject`, {});
      setCurrentVariant((prev) => (prev ? { ...prev, status: 'Rejected' } : null));
      setSuccessNotice('Variant rejected. Original image remains unchanged.');
      setHasUnsavedChanges(false);

      const refreshed = await apiClient.get<any>(`/website/images/${image.id}`);
      if (refreshed?.data && onImageUpdated) {
        onImageUpdated(refreshed.data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reject variant.');
    } finally {
      setRejecting(false);
    }
  };

  const handleRequestClose = () => {
    if (hasUnsavedChanges && currentVariant && currentVariant.status !== 'Approved') {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  if (!isOpen || !image) return null;

  const originalUrl = resolveImageUrl(image.previewUrl);
  const variantUrl = currentVariant ? resolveImageUrl(currentVariant.previewUrl) : originalUrl;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quality-studio-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
    >
      <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-[#1E293B] rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-[#1E293B] flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-[#0F172A]/70 backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="quality-studio-title" className="text-base font-bold text-slate-900 dark:text-white">
                  Image Quality Studio
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Deterministic (Non-AI)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Targeted clarity, contrast & tone adjustments for real architectural photographs. Original image remains immutable.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRequestClose}
            aria-label="Close studio"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Status Notices */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successNotice}</span>
              </div>
              {onOptimizeRequested && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOptimizeRequested(image, currentVariant?.id)}
                  className="shrink-0 text-xs h-7 px-2.5"
                >
                  Optimize WebP
                </Button>
              )}
            </div>
          )}

          {/* Canvas Toolbar: View Modes & Zoom Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-[#1E293B] p-1 rounded-xl border border-slate-200 dark:border-[#334155]/60">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  viewMode === 'split'
                    ? 'bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Interactive Split Slider"
              >
                <Columns className="w-3.5 h-3.5" />
                Split Slider
              </button>
              <button
                type="button"
                onClick={() => setViewMode('side-by-side')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  viewMode === 'side-by-side'
                    ? 'bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Side by Side"
              >
                <Eye className="w-3.5 h-3.5" />
                Side-by-Side
              </button>
              <button
                type="button"
                onClick={() => setViewMode('stacked')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 sm:hidden ${
                  viewMode === 'stacked'
                    ? 'bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Vertical Stacked"
              >
                <SplitSquareVertical className="w-3.5 h-3.5" />
                Stacked
              </button>
            </div>

            {/* Zoom & Fit */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(1, parseFloat((z - 0.25).toFixed(2))))}
                disabled={zoomLevel <= 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-[#1E293B] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1E293B] disabled:opacity-40"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono text-slate-600 dark:text-slate-400 min-w-[46px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(3, parseFloat((z + 0.25).toFixed(2))))}
                disabled={zoomLevel >= 3}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-[#1E293B] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1E293B] disabled:opacity-40"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              {zoomLevel !== 1 && (
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-[#1E293B] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1E293B] flex items-center gap-1"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  Fit
                </button>
              )}
            </div>
          </div>

          {/* VISUAL COMPARISON CANVAS */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#1E293B] bg-slate-950 overflow-hidden relative select-none">
            {/* Processing Overlay */}
            {processing && (
              <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xs text-center p-4">
                <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mb-3" />
                <p className="text-sm font-bold text-white tracking-wide">Enhancing Photograph...</p>
                <p className="text-xs text-slate-300 mt-1 max-w-xs">
                  Applying {selectedPreset} deterministic clarity, contrast & tone adjustments.
                </p>
              </div>
            )}

            {/* Variant Image Error State */}
            {variantImgError && currentVariant && !processing && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/90 text-center p-6">
                <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
                <p className="text-sm font-bold text-white">Enhanced Preview Unavailable</p>
                <p className="text-xs text-slate-400 mt-1.5 max-w-md">
                  The processed variant image could not be loaded by your browser. The storage upload might still be finalizing or network access was interrupted.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleProcessImage}
                  className="mt-4"
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Regenerate Preview
                </Button>
              </div>
            )}

            {/* Split Screen View */}
            {viewMode === 'split' && (
              <div
                ref={containerRef}
                className="relative h-[340px] sm:h-[440px] w-full overflow-hidden flex items-center justify-center cursor-ew-resize"
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
              >
                {/* AFTER IMAGE (Quality Studio Variant) - Base Layer */}
                <div
                  className="absolute inset-0 flex items-center justify-center overflow-hidden"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                >
                  <img
                    src={variantUrl}
                    alt="Quality Studio Processed"
                    className="max-h-full max-w-full object-contain pointer-events-none"
                    draggable={false}
                    onLoad={() => setVariantImgLoading(false)}
                    onError={() => {
                      setVariantImgLoading(false);
                      if (currentVariant) setVariantImgError(true);
                    }}
                  />
                </div>

                {/* BEFORE IMAGE (Original) - Clipped Top Layer */}
                <div
                  className="absolute inset-0 flex items-center justify-center overflow-hidden"
                  style={{
                    clipPath: `polygon(0 0, ${splitPos}% 0, ${splitPos}% 100%, 0 100%)`,
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'center center',
                  }}
                >
                  <img
                    src={originalUrl}
                    alt="Original Upload"
                    className="max-h-full max-w-full object-contain pointer-events-none"
                    draggable={false}
                  />
                </div>

                {/* Floating Labels */}
                <div className="absolute top-3 left-3 pointer-events-none z-10">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-900/85 text-slate-200 border border-white/10 backdrop-blur-xs shadow-md">
                    Original
                  </span>
                </div>
                <div className="absolute top-3 right-3 pointer-events-none z-10">
                  {currentVariant ? (
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-orange-600/90 text-white border border-orange-400/30 backdrop-blur-xs shadow-md flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Enhanced ({currentVariant.operation?.replace('QualityStudio:', '') || selectedPreset})
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-900/85 text-slate-300 border border-white/10 backdrop-blur-xs shadow-md flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-orange-400" />
                      Original (Ready to Enhance)
                    </span>
                  )}
                </div>

                {/* Split Handle Divider */}
                <div
                  role="slider"
                  tabIndex={0}
                  aria-label="Before and after split divider"
                  aria-valuenow={Math.round(splitPos)}
                  aria-valuemin={5}
                  aria-valuemax={95}
                  onKeyDown={handleKeyDownSplit}
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.6)] cursor-ew-resize z-20 flex items-center justify-center"
                  style={{ left: `${splitPos}%` }}
                >
                  <div className="w-8 h-8 rounded-full bg-white text-slate-800 shadow-xl border border-slate-300 flex items-center justify-center -ml-0.5 hover:scale-110 active:scale-95 transition-transform">
                    <div className="flex items-center gap-0.5">
                      <span className="text-[10px] font-black text-slate-400">◀</span>
                      <span className="text-[10px] font-black text-slate-400">▶</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Side-by-Side View */}
            {viewMode === 'side-by-side' && (
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 h-[380px] sm:h-[440px]">
                {/* Left: Original */}
                <div className="relative h-full flex flex-col items-center justify-center p-3 overflow-hidden">
                  <div className="absolute top-3 left-3 z-10">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-900/85 text-slate-200 border border-white/10">
                      Original Image
                    </span>
                  </div>
                  <div
                    className="w-full h-full flex items-center justify-center overflow-hidden"
                    style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                  >
                    <img
                      src={originalUrl}
                      alt="Original"
                      className="max-h-full max-w-full object-contain pointer-events-none"
                    />
                  </div>
                </div>

                {/* Right: Enhanced */}
                <div className="relative h-full flex flex-col items-center justify-center p-3 overflow-hidden">
                  <div className="absolute top-3 right-3 z-10">
                    {currentVariant ? (
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-orange-600/90 text-white border border-orange-400/30 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Enhanced ({currentVariant.operation?.replace('QualityStudio:', '') || selectedPreset})
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-900/85 text-slate-300 border border-white/10 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-orange-400" />
                        Original (Ready to Enhance)
                      </span>
                    )}
                  </div>
                  <div
                    className="w-full h-full flex items-center justify-center overflow-hidden"
                    style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                  >
                    <img
                      src={variantUrl}
                      alt="Quality Studio Processed"
                      className="max-h-full max-w-full object-contain pointer-events-none"
                      onLoad={() => setVariantImgLoading(false)}
                      onError={() => {
                        setVariantImgLoading(false);
                        if (currentVariant) setVariantImgError(true);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Stacked View (Compact / Mobile) */}
            {viewMode === 'stacked' && (
              <div className="space-y-3 p-3">
                <div className="relative h-[220px] bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
                  <div className="absolute top-2 left-2 z-10">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-900/90 text-slate-200">
                      Original
                    </span>
                  </div>
                  <img src={originalUrl} alt="Original" className="max-h-full max-w-full object-contain" />
                </div>
                <div className="relative h-[220px] bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
                  <div className="absolute top-2 left-2 z-10">
                    {currentVariant ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-600/90 text-white">
                        Enhanced ({currentVariant.operation?.replace('QualityStudio:', '') || selectedPreset})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-900 text-slate-300">
                        Original (Ready to Enhance)
                      </span>
                    )}
                  </div>
                  <img
                    src={variantUrl}
                    alt="Quality Studio"
                    className="max-h-full max-w-full object-contain"
                    onLoad={() => setVariantImgLoading(false)}
                    onError={() => {
                      setVariantImgLoading(false);
                      if (currentVariant) setVariantImgError(true);
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ASSET METRICS STRIP */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-[#0F172A] p-3.5 rounded-xl border border-slate-200 dark:border-[#1E293B] text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Dimensions</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {image.width} × {image.height} px
              </p>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Original File Size</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {formatBytes(image.fileSize)}
              </p>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Variant File Size</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {currentVariant ? formatBytes(currentVariant.fileSize) : 'Pending generation'}
              </p>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Variant Review Status</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    currentVariant?.status === 'Approved'
                      ? 'bg-emerald-500'
                      : currentVariant?.status === 'Rejected'
                      ? 'bg-rose-500'
                      : currentVariant
                      ? 'bg-amber-500'
                      : 'bg-slate-400'
                  }`}
                />
                {currentVariant?.status || 'Original Only'}
              </p>
            </div>
          </div>

          {/* DETERMINISTIC CORRECTIONS APPLIED SUMMARY */}
          {currentVariant && (
            <div className="rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50/70 dark:bg-[#0F172A]/70 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Deterministic Corrections Applied
                </span>
                <span className="text-[11px] font-mono text-slate-400 bg-slate-200/50 dark:bg-slate-800/50 px-2 py-0.5 rounded">
                  Engine: v{currentVariant.algorithmVersion || '1.0.0-deterministic'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(currentVariant.appliedCorrections && currentVariant.appliedCorrections.length > 0
                  ? currentVariant.appliedCorrections
                  : [
                      'Highlights protected against blow-out',
                      'Tonal contrast and clarity balanced',
                      'Controlled edge sharpness applied',
                      'Authentic material colors preserved'
                    ]
                ).map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40"
                  >
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* PRESET CONTROLS (BALANCED IS THE LOCKED DEFAULT) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>Select Quality Preset</span>
                <span className="text-[10px] text-slate-400 font-normal">(Deterministic SkiaSharp processing)</span>
              </label>
              {selectedPreset === 'Custom' && (
                <button
                  type="button"
                  onClick={handleResetToPreset}
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                >
                  Reset to Balanced
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Balanced Preset (Default) */}
              <button
                type="button"
                onClick={() => handleSelectPreset('Balanced')}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  selectedPreset === 'Balanced'
                    ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 shadow-xs ring-1 ring-orange-500/30'
                    : 'border-slate-200 dark:border-[#1E293B] hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#0F172A]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Balanced</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-orange-500 text-white tracking-wider">
                      Recommended
                    </span>
                  </div>
                  {selectedPreset === 'Balanced' && <Check className="w-4 h-4 text-orange-600" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Natural clarity and tone boost. Ideal for business showcases, interiors & project photography.
                </p>
                <div className="text-[10px] text-slate-400 mt-2 font-mono">
                  +4% bright • +10% contrast • 35% sharp
                </div>
              </button>

              {/* Light Preset */}
              <button
                type="button"
                onClick={() => handleSelectPreset('Light')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedPreset === 'Light'
                    ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 shadow-xs ring-1 ring-orange-500/30'
                    : 'border-slate-200 dark:border-[#1E293B] hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#0F172A]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Light</span>
                  {selectedPreset === 'Light' && <Check className="w-4 h-4 text-orange-600" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Subtle touch-up for crisp, well-lit architectural photographs that need gentle finishing.
                </p>
                <div className="text-[10px] text-slate-400 mt-2 font-mono">
                  +2% bright • +5% contrast • 15% sharp
                </div>
              </button>

              {/* High Preset */}
              <button
                type="button"
                onClick={() => handleSelectPreset('High')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedPreset === 'High'
                    ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 shadow-xs ring-1 ring-orange-500/30'
                    : 'border-slate-200 dark:border-[#1E293B] hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#0F172A]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">High</span>
                  {selectedPreset === 'High' && <Check className="w-4 h-4 text-orange-600" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Stronger tone recovery for dim, flat, or hazy lighting conditions without artificial artifacts.
                </p>
                <div className="text-[10px] text-slate-400 mt-2 font-mono">
                  +6% bright • +16% contrast • 60% sharp
                </div>
              </button>
            </div>
          </div>

          {/* ADVANCED FINE-TUNE CONTROLS (COLLAPSIBLE) */}
          <div className="border border-slate-200 dark:border-[#1E293B] rounded-xl overflow-hidden bg-slate-50/50 dark:bg-[#0F172A]/50">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-[#1E293B]/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>Fine-tune Adjustments (Optional Advanced Controls)</span>
                {selectedPreset === 'Custom' && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                    Custom Values Active
                  </span>
                )}
              </div>
              {showAdvanced ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showAdvanced && (
              <div className="p-4 pt-2 border-t border-slate-200 dark:border-[#1E293B] space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Brightness: -50% to +50% */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="text-slate-600 dark:text-slate-400 font-medium">Brightness</label>
                      <span className="font-mono text-slate-800 dark:text-slate-200">
                        {brightness > 0 ? `+${brightness}%` : `${brightness}%`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-50}
                      max={50}
                      step={1}
                      value={brightness}
                      onChange={(e) => updateSlider(setBrightness, parseInt(e.target.value, 10))}
                      className="w-full accent-orange-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                    />
                  </div>

                  {/* Contrast: -50% to +50% */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="text-slate-600 dark:text-slate-400 font-medium">Contrast</label>
                      <span className="font-mono text-slate-800 dark:text-slate-200">
                        {contrast > 0 ? `+${contrast}%` : `${contrast}%`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-50}
                      max={50}
                      step={1}
                      value={contrast}
                      onChange={(e) => updateSlider(setContrast, parseInt(e.target.value, 10))}
                      className="w-full accent-orange-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                    />
                  </div>

                  {/* Sharpness: 0% to 100% */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="text-slate-600 dark:text-slate-400 font-medium">Sharpness (Halo-Restrained)</label>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{sharpness}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={sharpness}
                      onChange={(e) => updateSlider(setSharpness, parseInt(e.target.value, 10))}
                      className="w-full accent-orange-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                    />
                  </div>

                  {/* Noise Reduction: 0% to 100% */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="text-slate-600 dark:text-slate-400 font-medium">Noise Smoothing</label>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{noiseReduction}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={noiseReduction}
                      onChange={(e) => updateSlider(setNoiseReduction, parseInt(e.target.value, 10))}
                      className="w-full accent-orange-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                    />
                  </div>

                  {/* Saturation: -50% to +50% */}
                  <div className="space-y-1.5 md:col-span-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="text-slate-600 dark:text-slate-400 font-medium">Color Saturation</label>
                      <span className="font-mono text-slate-800 dark:text-slate-200">
                        {saturation > 0 ? `+${saturation}%` : `${saturation}%`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-50}
                      max={50}
                      step={1}
                      value={saturation}
                      onChange={(e) => updateSlider(setSaturation, parseInt(e.target.value, 10))}
                      className="w-full accent-orange-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleResetToPreset}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Reset fine-tuning to preset defaults
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-5 py-4 border-t border-slate-200 dark:border-[#1E293B] bg-slate-50/70 dark:bg-[#0F172A]/70 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5 w-full sm:w-auto">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Approving creates a website-ready variant. Live website publishing is a separate action.</span>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleRequestClose}
              disabled={processing || approving || rejecting}
            >
              Close
            </Button>

            {!currentVariant ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleProcessImage}
                disabled={processing}
                isLoading={processing}
                loadingText="Enhancing Photograph..."
                leftIcon={<Sparkles className="w-4 h-4 text-white" />}
              >
                Enhance Photograph ({selectedPreset})
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={handleProcessImage}
                  disabled={processing || approving || rejecting}
                  isLoading={processing}
                  loadingText="Processing Photo..."
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Regenerate Preview
                </Button>

                {currentVariant.status !== 'Rejected' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={handleRejectVariant}
                    disabled={processing || approving || rejecting}
                    isLoading={rejecting}
                    loadingText="Rejecting..."
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900"
                  >
                    Keep Original
                  </Button>
                )}

                {currentVariant.status !== 'Approved' ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={handleApproveVariant}
                    disabled={processing || approving || rejecting}
                    isLoading={approving}
                    loadingText="Approving..."
                    leftIcon={<Check className="w-4 h-4 stroke-[2.5]" />}
                  >
                    Approve Improved Version
                  </Button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Approved Version Saved
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* UNSAVED CHANGES CONFIRMATION MODAL */}
      {showCloseConfirm && (
        <div className="fixed inset-0 z-60 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Discard Unsaved Adjustments?</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              You generated a quality variant that has not been approved yet. If you close now, the original photograph will remain the active asset.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCloseConfirm(false)}
              >
                Continue Editing
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  setShowCloseConfirm(false);
                  onClose();
                }}
              >
                Discard & Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
