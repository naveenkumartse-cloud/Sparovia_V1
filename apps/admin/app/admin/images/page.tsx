'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ImageIcon,
  Upload,
  RefreshCw,
  Sparkles,
  SlidersHorizontal,
  Check,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Eye,
  Edit3,
  ExternalLink,
  ShieldCheck,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

interface ImageVariantDto {
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
}

interface ImageDto {
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

interface WorkCategoryDto {
  id: string;
  tenantId?: string;
  websiteId?: string;
  name: string;
  slug: string;
  displayOrder: number;
  imageCount: number;
}

interface ImageAnalysisDto {
  width: number;
  height: number;
  fileSize: number;
  format: string;
  aspectRatio: number;
  brightness: number;
  contrast: number;
  sharpness: number;
  noiseLevel: number;
  isLargeEnough: boolean;
  recommendedOperation: string;
  recommendationReason: string;
}

const WEBSITE_SLOTS = [
  {
    key: 'heroImage',
    title: 'Hero Background Image',
    description: 'Prominent showcase image displayed at the very top of your homepage billboard.',
    recommendedSize: '1920 × 1080 px (16:9)',
  },
  {
    key: 'primaryImage',
    title: 'About Feature Image',
    description: 'Primary photograph introducing your company craftsmanship and executive story.',
    recommendedSize: '1200 × 800 px (3:2)',
  },
  {
    key: 'secondaryImage',
    title: 'About Secondary Image',
    description: 'Accent detail photograph highlighting bespoke materials and architectural finishes.',
    recommendedSize: '800 × 600 px (4:3)',
  },
  {
    key: 'serviceImage',
    title: 'Services Overview Image',
    description: 'Hero feature photograph supporting your bespoke design and custom cabinetry offerings.',
    recommendedSize: '1200 × 800 px (3:2)',
  },
];

const ENHANCEMENT_OPERATIONS = [
  {
    key: 'ImproveClarity',
    name: 'Improve Clarity',
    desc: 'Enhances visual sharpness and detail while preserving exact reality and materials.',
  },
  {
    key: 'ImproveSharpness',
    name: 'Improve Sharpness',
    desc: 'Reduces mild softness caused by camera focus, lens limitations, or capture compression.',
  },
  {
    key: 'ReduceNoise',
    name: 'Reduce Noise',
    desc: 'Cleans up sensor grain and compression artifacts in indoor lighting conditions.',
  },
  {
    key: 'Upscale',
    name: 'Upscale Resolution',
    desc: 'Increases usable image resolution for crisp presentation on modern high-DPI retina screens.',
  },
  {
    key: 'ClassicLook',
    name: 'Classic Look',
    desc: 'Applies balanced natural tone mapping preserving wood grains, stone, and metals.',
  },
  {
    key: 'ModernLook',
    name: 'Modern Look',
    desc: 'Crisp contemporary contrast treatment tailored for architectural portfolios.',
  },
  {
    key: 'WebOptimize',
    name: 'Web Optimize',
    desc: 'Optimizes file weight and format variant for fast mobile delivery without fidelity loss.',
  },
];

function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5043/api/v1';
  const origin = apiBase.replace(/\/api\/v1\/?$/, '');
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
}

const FALLBACK_IMAGE_DATA_URI =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="%23f1f5f9"><rect width="400" height="300"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="sans-serif" font-size="14">Image Unavailable</text></svg>';

function getAspectRatioLabel(width: number, height: number): string {
  if (!width || !height) return '';
  const ratio = width / height;
  if (Math.abs(ratio - 16 / 9) < 0.05) return '16:9';
  if (Math.abs(ratio - 3 / 2) < 0.05) return '3:2';
  if (Math.abs(ratio - 4 / 3) < 0.05) return '4:3';
  if (Math.abs(ratio - 1) < 0.05) return '1:1';
  if (Math.abs(ratio - 21 / 9) < 0.05) return '21:9';
  return `${ratio.toFixed(2)}:1`;
}

export default function ImagesPage() {
  const [activeTab, setActiveTab] = useState<'website' | 'explore'>('website');
  const [images, setImages] = useState<ImageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Category State
  const [categories, setCategories] = useState<WorkCategoryDto[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Upload / Replace Modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadSlot, setUploadSlot] = useState<string | null>(null);
  const [replacingImage, setReplacingImage] = useState<ImageDto | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [fileDimensions, setFileDimensions] = useState<{ width: number; height: number } | null>(null);
  const filePreviewUrlRef = useRef<string | null>(null);
  const [projectWorkName, setProjectWorkName] = useState('');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview Modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<ImageDto | null>(null);
  const [publishing, setPublishing] = useState(false);

  // Edit Metadata Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<ImageDto | null>(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [savingMetadata, setSavingMetadata] = useState(false);

  // Image Enhancement Modal state
  const [enhanceModalOpen, setEnhanceModalOpen] = useState(false);
  const [enhancingImage, setEnhancingImage] = useState<ImageDto | null>(null);
  const [selectedOperation, setSelectedOperation] = useState('ImproveClarity');
  const [enhancing, setEnhancing] = useState(false);
  const [enhancementResult, setEnhancementResult] = useState<ImageVariantDto | null>(null);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);
  const [reviewMode, setReviewMode] = useState<'after' | 'before'>('after');
  const [approving, setApproving] = useState(false);
  const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysisDto | null>(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [confirmPublishOpen, setConfirmPublishOpen] = useState(false);

  // Delete Confirmation Modal state
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [removingImage, setRemovingImage] = useState<ImageDto | null>(null);
  const [removing, setRemoving] = useState(false);

  const fetchImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<{ data: ImageDto[] }>('/website/images');
      setImages(res?.data || []);
    } catch (err: any) {
      setError(err?.message || 'We could not load your images right now.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get<{ data: WorkCategoryDto[] }>('/website/categories');
      setCategories(res?.data || []);
    } catch (err) {
      console.error('Failed to load work categories', err);
    }
  };

  useEffect(() => {
    fetchImages();
    fetchCategories();

    return () => {
      if (filePreviewUrlRef.current) {
        URL.revokeObjectURL(filePreviewUrlRef.current);
        filePreviewUrlRef.current = null;
      }
    };
  }, []);

  const handleClearSelectedFile = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (filePreviewUrlRef.current) {
      URL.revokeObjectURL(filePreviewUrlRef.current);
      filePreviewUrlRef.current = null;
    }
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setFileDimensions(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openUploadModal = (slot?: string, replace?: ImageDto) => {
    handleClearSelectedFile();
    setUploadSlot(slot || null);
    setReplacingImage(replace || null);
    setSelectedCategory(replace?.category || (categories[0]?.name || ''));
    setIsCreatingCategory(false);
    setNewCategoryName('');
    setProjectWorkName(replace?.projectWorkName || '');
    setCaption(replace?.caption || '');
    setUploadError(null);
    setUploadModalOpen(true);
  };

  const closeUploadModal = () => {
    if (uploading) return;
    handleClearSelectedFile();
    setUploadModalOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('This image is too large. Please upload an image under 10 MB.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validTypes.includes(file.type) || !validExtensions.includes(ext)) {
      setUploadError("This image format isn't supported. Please upload a JPG, PNG, or WebP image.");
      return;
    }

    setUploadError(null);
    setSelectedFile(file);

    // Revoke previous object URL if any
    if (filePreviewUrlRef.current) {
      URL.revokeObjectURL(filePreviewUrlRef.current);
      filePreviewUrlRef.current = null;
    }

    const url = URL.createObjectURL(file);
    filePreviewUrlRef.current = url;
    setFilePreviewUrl(url);

    // Read natural dimensions
    const img = new window.Image();
    img.onload = () => {
      setFileDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      setFileDimensions(null);
    };
    img.src = url;
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      setUploadError('Please choose an image file to upload.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    const finalCategory = isCreatingCategory && newCategoryName.trim()
      ? newCategoryName.trim()
      : selectedCategory.trim();

    try {
      if (replacingImage) {
        // Replacement endpoint
        await apiClient.postFormData(`/website/images/${replacingImage.id}/replace`, formData);
      } else if (activeTab === 'explore') {
        // Explore Our Work
        formData.append('projectWorkName', projectWorkName);
        if (finalCategory) {
          formData.append('category', finalCategory);
        }
        formData.append('caption', caption);
        await apiClient.postFormData('/website/images/explore-our-work', formData);
      } else {
        // Controlled Website Image
        formData.append('usageType', 'WebsiteImage');
        if (uploadSlot) formData.append('slot', uploadSlot);
        await apiClient.postFormData('/website/images', formData);
      }

      closeUploadModal();
      await fetchImages();
      await fetchCategories();
    } catch (err: any) {
      setUploadError(err?.message || 'This image could not be uploaded. Please choose a supported image under 10 MB.');
    } finally {
      setUploading(false);
    }
  };

  const openPreviewModal = (image: ImageDto) => {
    setPreviewImage(image);
    setPreviewModalOpen(true);
  };

  const handlePublishImage = async (image: ImageDto, variantId?: string) => {
    setPublishing(true);
    try {
      await apiClient.post(`/website/images/${image.id}/publish`, { variantId });
      setPreviewModalOpen(false);
      setEnhanceModalOpen(false);
      await fetchImages();
    } catch (err: any) {
      alert(err?.message || 'Publishing failed. Your previous live image remains unchanged.');
    } finally {
      setPublishing(false);
    }
  };

  const handleApproveImage = async (image: ImageDto) => {
    try {
      await apiClient.post(`/website/images/${image.id}/approve`, {});
      if (previewModalOpen && previewImage?.id === image.id) {
        setPreviewImage({ ...previewImage, status: 'Approved' });
      }
      await fetchImages();
    } catch (err: any) {
      alert(err?.message || 'Failed to approve image.');
    }
  };

  const openEditModal = (image: ImageDto) => {
    setEditingImage(image);
    setEditProjectName(image.projectWorkName || '');
    setEditCategory(image.category || '');
    setEditCaption(image.caption || '');
    setEditModalOpen(true);
  };

  const handleSaveMetadata = async () => {
    if (!editingImage) return;
    setSavingMetadata(true);
    try {
      await apiClient.put(`/website/images/${editingImage.id}/metadata`, {
        projectWorkName: editProjectName,
        category: editCategory,
        caption: editCaption,
      });
      setEditModalOpen(false);
      await fetchImages();
      await fetchCategories();
    } catch (err: any) {
      alert(err?.message || 'Failed to update image details.');
    } finally {
      setSavingMetadata(false);
    }
  };

  const openEnhanceModal = async (image: ImageDto) => {
    setEnhancingImage(image);
    setSelectedOperation('ImproveClarity');
    setEnhancementResult(null);
    setEnhanceError(null);
    setReviewMode('after');
    setImageAnalysis(null);
    setConfirmPublishOpen(false);
    setEnhanceModalOpen(true);
    setAnalyzingImage(true);

    try {
      const res = await apiClient.get<{ data: ImageAnalysisDto }>(`/website/images/${image.id}/analysis`);
      if (res?.data) {
        setImageAnalysis(res.data);
        if (res.data.recommendedOperation) {
          setSelectedOperation(res.data.recommendedOperation);
        }
      }
    } catch (err) {
      console.warn('Could not load image analysis:', err);
    } finally {
      setAnalyzingImage(false);
    }
  };

  const handleStartEnhancement = async () => {
    if (!enhancingImage || enhancing) return;
    setEnhancing(true);
    setEnhanceError(null);

    try {
      let variantId: string | undefined;
      if (selectedOperation === 'WebOptimize') {
        const res = await apiClient.post<{ data: ImageVariantDto }>(
          `/website/images/${enhancingImage.id}/optimize`,
          { targetFormat: 'webp', maxWidth: 1200 }
        );
        variantId = res?.data?.id;
      } else {
        const res = await apiClient.post<{ data: ImageVariantDto }>(
          `/website/images/${enhancingImage.id}/enhance`,
          { operation: selectedOperation }
        );
        variantId = res?.data?.id;
      }

      // Refresh image to get latest variant
      const updated = await apiClient.get<{ data: ImageDto }>(`/website/images/${enhancingImage.id}`);
      if (updated?.data) {
        setEnhancingImage(updated.data);
        const latestVariant = updated.data.variants.find((v) => v.id === variantId) || updated.data.variants[0];
        setEnhancementResult(latestVariant || null);
      }
      setReviewMode('after');
    } catch (err: any) {
      setEnhanceError("We couldn't improve this image. Your original image is safe and unchanged.");
    } finally {
      setEnhancing(false);
    }
  };

  const handleApproveVariant = async () => {
    if (!enhancingImage || !enhancementResult) return;
    setApproving(true);
    try {
      await apiClient.post(`/website/images/${enhancingImage.id}/enhancement/approve`, {
        variantId: enhancementResult.id,
      });
      await fetchImages();
      setEnhanceModalOpen(false);
    } catch (err: any) {
      alert(err?.message || 'Failed to approve enhancement variant.');
    } finally {
      setApproving(false);
    }
  };

  const handleRejectVariant = async () => {
    if (!enhancingImage || !enhancementResult) return;
    try {
      await apiClient.post(`/website/images/${enhancingImage.id}/enhancement/reject`, {
        variantId: enhancementResult.id,
      });
      await fetchImages();
      setEnhancementResult(null);
      setReviewMode('after');
    } catch (err: any) {
      alert(err?.message || 'Failed to reject enhancement variant.');
    }
  };

  const openRemoveModal = (image: ImageDto) => {
    setRemovingImage(image);
    setRemoveModalOpen(true);
  };

  const handleConfirmRemoval = async () => {
    if (!removingImage) return;
    setRemoving(true);
    try {
      await apiClient.delete(`/website/images/${removingImage.id}`);
      setImages((prev) => prev.filter((i) => i.id !== removingImage.id));
      setRemoveModalOpen(false);
      setRemovingImage(null);
      await fetchCategories();
    } catch (err: any) {
      alert(err?.message || 'Failed to remove image from website usage.');
    } finally {
      setRemoving(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Filtered lists
  const websiteImages = images.filter((i) => i.usageType === 'WebsiteImage');
  const exploreImages = images.filter((i) => i.usageType === 'ExploreOurWork');
  const displayedExploreImages = exploreImages.filter((i) => {
    if (categoryFilter === 'All') return true;
    return i.category?.toLowerCase() === categoryFilter.toLowerCase();
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Images & Media
          </h1>
          <p className="text-sm text-slate-500 dark:text-[#94A3B8] mt-1">
            Manage your verified company and project imagery. Original client uploads are always preserved.
          </p>
        </div>

        {activeTab === 'explore' && (
          <Button
            type="button"
            onClick={() => openUploadModal()}
            className="inline-flex items-center gap-2 shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            <Upload className="w-4 h-4" />
            + Add Project Image
          </Button>
        )}
      </div>

      {/* Guidance Banner */}
      <div className="bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-blue-900 dark:text-blue-200 leading-relaxed">
          <p className="font-semibold text-blue-950 dark:text-blue-100">
            Fidelity & Immutability Guarantee
          </p>
          <p className="mt-0.5 text-blue-800/90 dark:text-blue-300">
            Supported formats: <strong>JPG, PNG, WebP</strong> (Max 10 MB per image). Original uploads remain
            preserved and are never overwritten. When replacing or enhancing, your active live website image
            remains unchanged until explicitly published.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-[#1E293B] gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('website')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'website'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          Website Images ({websiteImages.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('explore')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'explore'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Explore Our Work ({exploreImages.length})
        </button>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-12 text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Loading your images...
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-white dark:bg-[#0F172A] border border-rose-200 dark:border-rose-900/50 rounded-2xl p-8 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              We couldn&apos;t load your images right now
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {error}
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={fetchImages}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Tab 1: Website Images */}
      {!loading && !error && activeTab === 'website' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {WEBSITE_SLOTS.map((slot) => {
              const assignedImage = websiteImages.find(
                (img) => img.slot === slot.key && img.isActiveWebsiteUsage
              );

              return (
                <div
                  key={slot.key}
                  className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                          {slot.title}
                        </span>
                        <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">
                          {slot.description}
                        </p>
                      </div>

                      {assignedImage ? (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider shrink-0 ${
                            assignedImage.status === 'Published'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          {assignedImage.status}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-[#1E293B] text-slate-500 dark:text-slate-400 shrink-0">
                          Not Set
                        </span>
                      )}
                    </div>

                    {/* Image Preview Area */}
                    <div className="relative aspect-video rounded-xl bg-slate-100 dark:bg-[#1E293B] overflow-hidden border border-slate-200/80 dark:border-slate-800 flex items-center justify-center group">
                      {assignedImage ? (
                        <>
                          <img
                            src={resolveImageUrl(assignedImage.previewUrl)}
                            crossOrigin="use-credentials"
                            onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE_DATA_URI; }}
                            alt={slot.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => openPreviewModal(assignedImage)}
                              className="px-3 py-1.5 rounded-lg bg-white/90 text-slate-900 text-xs font-semibold hover:bg-white flex items-center gap-1.5 shadow-md"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-4">
                          <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            Recommended: {slot.recommendedSize}
                          </p>
                        </div>
                      )}
                    </div>

                    {assignedImage && (
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                        <span>
                          {assignedImage.width} × {assignedImage.height} px • {formatFileSize(assignedImage.fileSize)}
                        </span>
                        <span className="truncate max-w-[140px]" title={assignedImage.originalFileName}>
                          {assignedImage.originalFileName}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 mt-auto border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between gap-2">
                    {assignedImage ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="enhance"
                            size="sm"
                            onClick={() => openEnhanceModal(assignedImage)}
                            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                          >
                            Enhance
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => openUploadModal(slot.key, assignedImage)}
                            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                          >
                            Replace
                          </Button>
                        </div>

                        <div className="flex items-center gap-2">
                          {assignedImage.status !== 'Published' ? (
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              onClick={() => handlePublishImage(assignedImage)}
                            >
                              Publish
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openRemoveModal(assignedImage)}
                              aria-label="Remove from website usage"
                              title="Remove from website usage"
                              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => openUploadModal(slot.key)}
                        leftIcon={<Upload className="w-3.5 h-3.5" />}
                        className="w-full"
                      >
                        Upload {slot.title}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Explore Our Work */}
      {!loading && !error && activeTab === 'explore' && (
        <div className="space-y-6">
          {exploreImages.length === 0 ? (
            <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-8 sm:p-12 text-center shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-100 dark:border-blue-900/50">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Showcase your work
              </h3>
              <p className="text-sm text-slate-500 dark:text-[#94A3B8] max-w-md mx-auto mt-1.5">
                Add genuine photos of your completed projects, architectural cabinetry, and installations to display on your public website portfolio.
              </p>
              <div className="mt-6">
                <Button
                  type="button"
                  onClick={() => openUploadModal()}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  + Add Project Image
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Category Filter Pills and Add Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('All')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                      categoryFilter === 'All'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-[#0F172A] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#1E293B] hover:border-blue-400'
                    }`}
                  >
                    All ({exploreImages.length})
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryFilter(cat.name)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                        categoryFilter.toLowerCase() === cat.name.toLowerCase()
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white dark:bg-[#0F172A] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#1E293B] hover:border-blue-400'
                      }`}
                    >
                      {cat.name} ({cat.imageCount})
                    </button>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => openUploadModal()}
                  leftIcon={<Upload className="w-4 h-4" />}
                >
                  Add Project Image
                </Button>
              </div>

              {displayedExploreImages.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-[#1E293B]">
                  <p className="text-sm text-slate-500">No project images found in &quot;{categoryFilter}&quot;.</p>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('All')}
                    className="mt-2 text-xs text-blue-600 font-semibold hover:underline"
                  >
                    View all projects ({exploreImages.length})
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {displayedExploreImages.map((image) => (
                    <div
                      key={image.id}
                      className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between group"
                    >
                      {/* Thumbnail */}
                      <div className="relative aspect-video bg-slate-100 dark:bg-[#1E293B] overflow-hidden">
                        <img
                          src={resolveImageUrl(image.previewUrl)}
                          crossOrigin="use-credentials"
                          onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE_DATA_URI; }}
                          alt={image.projectWorkName || 'Project work photo'}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                          {image.category && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900/80 text-white backdrop-blur-xs">
                              {image.category}
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                              image.status === 'Published'
                                ? 'bg-emerald-500/90 text-white backdrop-blur-xs'
                                : 'bg-blue-500/90 text-white backdrop-blur-xs'
                            }`}
                          >
                            {image.status}
                          </span>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="p-4 sm:p-5 space-y-2 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                            {image.projectWorkName || 'Untitled Project'}
                          </h4>
                          <button
                            type="button"
                            onClick={() => openEditModal(image)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                            title="Edit Project Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {image.caption ? (
                          <p className="text-xs text-slate-500 dark:text-[#94A3B8] line-clamp-2 leading-relaxed">
                            {image.caption}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No caption provided.</p>
                        )}

                        <div className="text-[11px] text-slate-400 pt-2 flex items-center justify-between">
                          <span>
                            {image.width} × {image.height} px
                          </span>
                          <span>{formatFileSize(image.fileSize)}</span>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="p-4 pt-3 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-[#1E293B]/60 mt-auto">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="enhance"
                            size="sm"
                            onClick={() => openEnhanceModal(image)}
                            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                          >
                            Enhance
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => openUploadModal(undefined, image)}
                            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                          >
                            Replace
                          </Button>
                        </div>

                        <div className="flex items-center gap-2">
                          {image.status === 'Uploaded' && (
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              onClick={() => handleApproveImage(image)}
                            >
                              Approve
                            </Button>
                          )}
                          {(image.status === 'Approved' || (image.status !== 'Published' && image.status !== 'Uploaded')) && (
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              onClick={() => handlePublishImage(image)}
                            >
                              Publish
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openRemoveModal(image)}
                            aria-label="Delete image"
                            title="Delete image"
                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* MODAL 1: Upload / Replace Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={closeUploadModal}
        title={replacingImage ? 'Replace Image' : 'Upload New Image'}
        description={
          replacingImage
            ? 'Select a new image. Your current live image will remain active until the new image is approved and published.'
            : activeTab === 'explore'
            ? 'Add a genuine photograph of completed client work or installation.'
            : `Upload an image for the ${uploadSlot || 'selected'} location.`
        }
        maxWidth="lg"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={uploading}
              onClick={closeUploadModal}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={uploading || !selectedFile}
              isLoading={uploading}
              loadingText="Uploading image..."
              onClick={handleUploadSubmit}
              className="w-full sm:w-auto"
            >
              {replacingImage ? 'Replace Image' : 'Upload & Validate'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* File Picker / Preview Container */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />

          {filePreviewUrl ? (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center min-h-[220px] max-h-72">
                <img
                  src={filePreviewUrl}
                  alt="Selected preview"
                  className="max-h-72 w-auto object-contain mx-auto"
                />
                {/* Information Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                  {selectedFile && (
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-black/75 text-white backdrop-blur-xs uppercase tracking-wider">
                      {selectedFile.type.split('/')[1]?.toUpperCase() || selectedFile.name.split('.').pop()?.toUpperCase()}
                    </span>
                  )}
                  {fileDimensions && (
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-black/75 text-white backdrop-blur-xs">
                      {fileDimensions.width} × {fileDimensions.height} px
                    </span>
                  )}
                  {fileDimensions && (
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-600/90 text-white backdrop-blur-xs">
                      {getAspectRatioLabel(fileDimensions.width, fileDimensions.height)}
                    </span>
                  )}
                </div>
              </div>

              {/* Action and Details Row */}
              <div className="flex items-center justify-between text-xs px-1">
                <div className="truncate max-w-[220px] sm:max-w-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedFile?.name}</span>
                  <span className="ml-1 text-slate-400">({formatFileSize(selectedFile?.size || 0)})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50"
                  >
                    Change Image
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSelectedFile}
                    className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline px-2.5 py-1 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-900/30"
            >
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  Click to choose a photograph
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Supported formats: JPG, PNG, WebP (Max 10 MB)
                </p>
              </div>
            </div>
          )}

          {/* Explore Our Work Fields */}
          {(activeTab === 'explore' || replacingImage?.usageType === 'ExploreOurWork') && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Project / Work Name (Optional)
                </label>
                <input
                  type="text"
                  value={projectWorkName}
                  onChange={(e) => setProjectWorkName(e.target.value)}
                  placeholder="e.g., Bespoke Villa Kitchen"
                  maxLength={200}
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Project Category Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Project Category <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingCategory(!isCreatingCategory);
                      setNewCategoryName('');
                    }}
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {isCreatingCategory ? '← Choose Existing' : '+ Create New Category'}
                  </button>
                </div>

                {isCreatingCategory ? (
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="e.g., Modular Kitchen, Living Spaces, Master Bedroom"
                      maxLength={100}
                      autoFocus
                      className="w-full text-sm px-3.5 py-2 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-[11px] text-slate-400">
                      Creates a new category for your tenant portfolio showcase.
                    </p>
                  </div>
                ) : (
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        setIsCreatingCategory(true);
                        setNewCategoryName('');
                      } else {
                        setSelectedCategory(e.target.value);
                      }
                    }}
                    className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.length === 0 ? (
                      <option value="">No categories yet — create one</option>
                    ) : (
                      categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name} {c.imageCount > 0 ? `(${c.imageCount})` : ''}
                        </option>
                      ))
                    )}
                    <option value="__NEW__">+ Create new category...</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Caption (Optional)
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Briefly describe the completed project..."
                  rows={3}
                  maxLength={1000}
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          )}

          {uploadError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      </Modal>

      {/* MODAL 2: Image Preview Modal */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title={previewImage?.projectWorkName || previewImage?.slot || 'Image Preview'}
        description="Authenticated preview of client image asset."
        maxWidth="xl"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setPreviewModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
            {previewImage && previewImage.status === 'Uploaded' && (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => handleApproveImage(previewImage)}
                className="w-full sm:w-auto"
              >
                Approve Image
              </Button>
            )}
            {previewImage && previewImage.status === 'Approved' && (
              <Button
                type="button"
                variant="success"
                size="md"
                disabled={publishing}
                isLoading={publishing}
                loadingText="Publishing..."
                onClick={() => handlePublishImage(previewImage)}
                className="w-full sm:w-auto"
              >
                Publish to Website
              </Button>
            )}
          </>
        }
      >
        {previewImage && (
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center max-h-[420px]">
              <img
                src={resolveImageUrl(previewImage.previewUrl)}
                crossOrigin="use-credentials"
                onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE_DATA_URI; }}
                alt="Full preview"
                className="max-h-[420px] w-auto object-contain mx-auto"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 dark:bg-[#0B1120] p-3.5 rounded-xl border border-slate-100 dark:border-[#1E293B] text-xs">
              <div>
                <span className="text-slate-400">Dimensions:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {previewImage.width} × {previewImage.height} px
                </p>
              </div>
              <div>
                <span className="text-slate-400">File Size:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {formatFileSize(previewImage.fileSize)}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Format:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {previewImage.mimeType.replace('image/', '').toUpperCase()}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Category:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                  {previewImage.category || 'None'}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Status:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {previewImage.status}
                </p>
              </div>
            </div>

            {/* Web Optimization Indicator */}
            {previewImage.variants?.some((v) => v.variantType === 'WebsiteOptimized') && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">Web-Optimized Variant Ready</span>
                </div>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  WebP & Responsive
                </span>
              </div>
            )}

            <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
              <span className="font-bold shrink-0">Web Optimization ⓘ:</span>
              <span>
                Publishing deploys an optimized web-safe representation (WebP format with responsive scaling) to live visitors. Your original uploaded photograph is immutable and never overwritten.
              </span>
            </div>

            {previewImage.caption && (
              <div className="p-3 bg-slate-50 dark:bg-[#0B1120] rounded-xl border border-slate-100 dark:border-[#1E293B]">
                <span className="text-xs text-slate-400 font-semibold block mb-0.5">Caption</span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {previewImage.caption}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* MODAL 3: Edit Metadata Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => !savingMetadata && setEditModalOpen(false)}
        title="Edit Project Details"
        description="Update caption and title for this Explore Our Work project."
        maxWidth="md"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={savingMetadata}
              onClick={() => setEditModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={savingMetadata}
              isLoading={savingMetadata}
              loadingText="Saving..."
              onClick={handleSaveMetadata}
              className="w-full sm:w-auto"
            >
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Project / Work Name
            </label>
            <input
              type="text"
              value={editProjectName}
              onChange={(e) => setEditProjectName(e.target.value)}
              placeholder="e.g., Luxury Residential Living"
              maxLength={200}
              className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Project Category
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingCategory(!isCreatingCategory);
                  setNewCategoryName('');
                }}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                {isCreatingCategory ? '← Choose Existing' : '+ Create New Category'}
              </button>
            </div>

            {isCreatingCategory ? (
              <div className="space-y-1">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => {
                    setNewCategoryName(e.target.value);
                    setEditCategory(e.target.value);
                  }}
                  placeholder="e.g., Modular Kitchen, Living Spaces, Bedroom"
                  maxLength={100}
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : (
              <select
                value={editCategory}
                onChange={(e) => {
                  if (e.target.value === '__NEW__') {
                    setIsCreatingCategory(true);
                    setNewCategoryName('');
                  } else {
                    setEditCategory(e.target.value);
                  }
                }}
                className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None / Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} {c.imageCount > 0 ? `(${c.imageCount})` : ''}
                  </option>
                ))}
                <option value="__NEW__">+ Create new category...</option>
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Caption
            </label>
            <textarea
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              placeholder="Describe the craftsmanship or materials..."
              rows={4}
              maxLength={1000}
              className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* MODAL 4: Image Enhancement & Web Optimization Modal */}
      <Modal
        isOpen={enhanceModalOpen}
        onClose={() => !enhancing && setEnhanceModalOpen(false)}
        title="Image Enhancement & Web Optimization"
        description="Improve image quality and optimize images for fast website delivery while preserving the original image."
        maxWidth="3xl"
        footer={
          <>
            {!enhancementResult ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  disabled={enhancing}
                  onClick={() => setEnhanceModalOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  disabled={enhancing}
                  isLoading={enhancing}
                  loadingText="Improving Image..."
                  onClick={handleStartEnhancement}
                  leftIcon={<SlidersHorizontal className="w-4 h-4" />}
                  className="w-full sm:w-auto"
                >
                  Apply Enhancement
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="destructive-outline"
                  size="md"
                  disabled={approving || publishing}
                  onClick={handleRejectVariant}
                  className="w-full sm:w-auto"
                >
                  Discard / Reject
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  disabled={approving || publishing}
                  isLoading={approving}
                  loadingText="Approving..."
                  onClick={handleApproveVariant}
                  className="w-full sm:w-auto"
                >
                  Approve Variant
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  disabled={approving || publishing}
                  isLoading={publishing}
                  loadingText="Publishing..."
                  onClick={() => setConfirmPublishOpen(true)}
                  className="w-full sm:w-auto"
                >
                  Approve &amp; Publish to Live Site
                </Button>
              </>
            )}
          </>
        }
      >
        <div className="space-y-4">
          {!enhancementResult ? (
            /* Operation Selection */
            <div className="space-y-3.5">
              {/* Image Analysis Card */}
              {analyzingImage ? (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#1E293B] flex items-center gap-2.5 text-xs text-slate-500">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-600 shrink-0" />
                  <span>Analyzing image characteristics (dimensions, clarity, noise, contrast)...</span>
                </div>
              ) : imageAnalysis ? (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#1E293B] text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
                      <SlidersHorizontal className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <span>Image Analysis</span>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {imageAnalysis.width} × {imageAnalysis.height} px • {formatFileSize(imageAnalysis.fileSize)} • {imageAnalysis.format}
                    </span>
                  </div>

                  {imageAnalysis.recommendedOperation && (
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-[#1E293B] text-slate-700 dark:text-slate-300">
                      <p className="leading-relaxed">
                        <strong className="text-slate-900 dark:text-white">Recommended:</strong>{' '}
                        <span className="font-semibold text-blue-600 dark:text-blue-400">{imageAnalysis.recommendedOperation}</span>
                        {imageAnalysis.recommendationReason ? ` — ${imageAnalysis.recommendationReason}` : ''}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 text-center">
                    <div className="bg-white dark:bg-slate-900/60 p-1.5 rounded-lg border border-slate-200 dark:border-[#1E293B]">
                      <span className="block text-[10px] uppercase text-slate-400">Contrast</span>
                      <strong className="text-slate-700 dark:text-slate-200">{(imageAnalysis.contrast * 100).toFixed(0)}%</strong>
                    </div>
                    <div className="bg-white dark:bg-slate-900/60 p-1.5 rounded-lg border border-slate-200 dark:border-[#1E293B]">
                      <span className="block text-[10px] uppercase text-slate-400">Sharpness</span>
                      <strong className="text-slate-700 dark:text-slate-200">{imageAnalysis.sharpness.toFixed(3)}</strong>
                    </div>
                    <div className="bg-white dark:bg-slate-900/60 p-1.5 rounded-lg border border-slate-200 dark:border-[#1E293B]">
                      <span className="block text-[10px] uppercase text-slate-400">Noise</span>
                      <strong className="text-slate-700 dark:text-slate-200">{(imageAnalysis.noiseLevel * 100).toFixed(1)}%</strong>
                    </div>
                    <div className="bg-white dark:bg-slate-900/60 p-1.5 rounded-lg border border-slate-200 dark:border-[#1E293B]">
                      <span className="block text-[10px] uppercase text-slate-400">Ratio</span>
                      <strong className="text-slate-700 dark:text-slate-200">{imageAnalysis.aspectRatio}:1</strong>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                  Choose Enhancement Operation
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="radiogroup" aria-label="Enhancement operations">
                  {ENHANCEMENT_OPERATIONS.map((op) => {
                    const isSelected = selectedOperation === op.key;
                    const isRecommended = imageAnalysis?.recommendedOperation === op.key;
                    return (
                      <button
                        key={op.key}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        disabled={enhancing}
                        onClick={() => setSelectedOperation(op.key)}
                        className={`p-3.5 rounded-xl border text-left transition-all min-h-[76px] flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/30 ring-1 ring-blue-600'
                            : 'border-slate-200 dark:border-[#1E293B] hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#0B1120]'
                        } ${enhancing ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {op.name}
                            </span>
                            {isRecommended && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                                Recommended
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {op.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {enhanceError && (
                <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-900 dark:text-amber-200 block text-sm">
                        We couldn&apos;t improve this image.
                      </strong>
                      <p className="text-amber-700 dark:text-amber-300 mt-0.5">
                        Your original image is safe and unchanged.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1 pl-6">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleStartEnhancement}
                      disabled={enhancing}
                    >
                      Try Again
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEnhanceError(null)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Before / After Comparison */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-[#1E293B] pb-3">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Fidelity Review: Before vs. After
                  </span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                    Operation: {ENHANCEMENT_OPERATIONS.find((o) => o.key === selectedOperation)?.name || selectedOperation}
                  </span>
                </div>
                <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-[#1E293B] p-1 rounded-xl text-xs self-start sm:self-auto" role="tablist" aria-label="Review Mode">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={reviewMode === 'before'}
                    onClick={() => setReviewMode('before')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      reviewMode === 'before'
                        ? 'bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Before
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={reviewMode === 'after'}
                    onClick={() => setReviewMode('after')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      reviewMode === 'after'
                        ? 'bg-white dark:bg-[#0B1120] text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    After
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={(reviewMode as any) === 'split'}
                    onClick={() => setReviewMode('split' as any)}
                    className={`hidden sm:inline-block px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      (reviewMode as any) === 'split'
                        ? 'bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Side-by-Side
                  </button>
                </div>
              </div>

              {(reviewMode as any) === 'split' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <div className="relative rounded-xl overflow-hidden bg-slate-900/95 dark:bg-slate-950 h-[240px] sm:h-[300px] flex items-center justify-center border border-slate-200 dark:border-[#1E293B]">
                      <img
                        src={resolveImageUrl(enhancingImage?.previewUrl)}
                        crossOrigin="use-credentials"
                        onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE_DATA_URI; }}
                        alt="Original photograph before enhancement"
                        className="max-h-full max-w-full object-contain mx-auto select-none"
                      />
                      <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-slate-900/85 backdrop-blur-xs text-[10px] font-bold text-white tracking-wider uppercase">
                        BEFORE
                      </div>
                      <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-xs text-[10px] text-slate-300">
                        {enhancingImage?.width} × {enhancingImage?.height} px • {formatFileSize(enhancingImage?.fileSize || 0)}
                      </div>
                    </div>
                    <span className="block text-center text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Original Photograph
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="relative rounded-xl overflow-hidden bg-slate-900/95 dark:bg-slate-950 h-[240px] sm:h-[300px] flex items-center justify-center border border-slate-200 dark:border-[#1E293B]">
                      <img
                        src={resolveImageUrl(enhancementResult.previewUrl)}
                        crossOrigin="use-credentials"
                        onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE_DATA_URI; }}
                        alt="Enhanced variant after processing"
                        className="max-h-full max-w-full object-contain mx-auto select-none"
                      />
                      <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-blue-600 text-[10px] font-bold text-white tracking-wider uppercase">
                        AFTER
                      </div>
                      <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-xs text-[10px] text-slate-300">
                        {enhancementResult.width} × {enhancementResult.height} px • {formatFileSize(enhancementResult.fileSize)}
                      </div>
                    </div>
                    <span className="block text-center text-xs font-semibold text-blue-600 dark:text-blue-400">
                      Enhanced Variant
                    </span>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden bg-slate-900/95 dark:bg-slate-950 h-[260px] sm:h-[340px] max-h-[360px] flex items-center justify-center border border-slate-200 dark:border-[#1E293B]">
                  <img
                    src={resolveImageUrl(
                      reviewMode === 'after'
                        ? enhancementResult.previewUrl
                        : enhancingImage?.previewUrl
                    )}
                    crossOrigin="use-credentials"
                    onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE_DATA_URI; }}
                    alt={reviewMode === 'after' ? 'Enhanced Variant' : 'Original Photograph'}
                    className="max-h-full max-w-full object-contain mx-auto select-none"
                  />
                  <div className="absolute top-2.5 left-2.5 px-3 py-1 rounded-md bg-slate-900/85 backdrop-blur-xs text-xs font-bold text-white uppercase tracking-wider">
                    {reviewMode === 'after' ? 'AFTER: Enhanced Variant' : 'BEFORE: Original Photograph'}
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 px-3 py-1 rounded-md bg-slate-900/80 backdrop-blur-xs text-[11px] text-slate-300">
                    {reviewMode === 'after'
                      ? `${enhancementResult.width} × ${enhancementResult.height} px • ${formatFileSize(enhancementResult.fileSize)}`
                      : `${enhancingImage?.width} × ${enhancingImage?.height} px • ${formatFileSize(enhancingImage?.fileSize || 0)}`}
                  </div>
                </div>
              )}

              {/* Metadata Comparison: Equal Visual Structure & Responsive Stack */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#1E293B] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Original Photograph
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Source
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1 pt-0.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Resolution:</span>
                      <strong>{enhancingImage?.width} × {enhancingImage?.height} px</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">File Size:</span>
                      <strong>{formatFileSize(enhancingImage?.fileSize || 0)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Format:</span>
                      <strong>{imageAnalysis?.format || 'Original'}</strong>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#1E293B] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      Enhanced Variant
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                      Optimized
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1 pt-0.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Resolution:</span>
                      <strong>{enhancementResult.width} × {enhancementResult.height} px</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">File Size:</span>
                      <strong>{formatFileSize(enhancementResult.fileSize)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Format:</span>
                      <strong>{enhancementResult.mimeType?.replace('image/', '').toUpperCase() || 'WEBP'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Improve Quality, Not Reality Notice */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200/80 dark:border-[#1E293B] flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-900 dark:text-slate-200 block">
                    Improve Quality, Not Reality
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Verify that materials, architectural structures, and genuine project characteristics remain faithful to the original photograph.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Lightweight Publish Confirmation Modal */}
      <Modal
        isOpen={confirmPublishOpen}
        onClose={() => !publishing && setConfirmPublishOpen(false)}
        title="Publish Image to Live Website?"
        description="This action will accept this enhanced variant and immediately set it as the live photo on your public website."
        maxWidth="md"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={publishing}
              onClick={() => setConfirmPublishOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={publishing}
              isLoading={publishing}
              loadingText="Publishing..."
              onClick={async () => {
                if (!enhancingImage || !enhancementResult) return;
                await handlePublishImage(enhancingImage, enhancementResult.id);
                setConfirmPublishOpen(false);
              }}
              className="w-full sm:w-auto"
            >
              Publish to Live Site
            </Button>
          </>
        }
      >
        <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Are you sure you want to publish this enhanced image variant to your live website now? Your previous live photo will be updated with this optimized variant.
        </div>
      </Modal>

      {/* MODAL 5: Delete Confirmation Modal */}
      <Modal
        isOpen={removeModalOpen}
        onClose={() => !removing && setRemoveModalOpen(false)}
        title="Delete Image"
        description="Are you sure you want to delete this photograph? It will be removed from your website portfolio and showcase."
        maxWidth="md"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={removing}
              onClick={() => setRemoveModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="md"
              disabled={removing}
              isLoading={removing}
              loadingText="Deleting..."
              onClick={handleConfirmRemoval}
              className="w-full sm:w-auto"
            >
              Delete Image
            </Button>
          </>
        }
      >
        {removingImage && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#1E293B]">
              <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-900 shrink-0">
                <img
                  src={resolveImageUrl(removingImage.previewUrl)}
                  crossOrigin="use-credentials"
                  onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE_DATA_URI; }}
                  alt={removingImage.projectWorkName || 'Project image'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {removingImage.projectWorkName || 'Untitled Project'}
                </h5>
                <p className="text-[11px] text-slate-500 truncate">
                  {removingImage.category ? `Category: ${removingImage.category}` : removingImage.originalFileName}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              This will remove the photograph from active website usage and your public Explore Our Work gallery.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
