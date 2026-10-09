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
import { ImageQualityStudioModal } from '@/components/images/ImageQualityStudioModal';

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
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="%23f8fafc"><rect width="400" height="300"/><rect x="20" y="20" width="360" height="260" rx="12" fill="%23f1f5f9" stroke="%23cbd5e1" stroke-width="1.5" stroke-dasharray="6 6"/><circle cx="200" cy="130" r="28" fill="%23e2e8f0"/><text x="50%" y="190" dominant-baseline="middle" text-anchor="middle" fill="%2364748b" font-family="sans-serif" font-size="13" font-weight="600">Project Image Preview</text><text x="50%" y="215" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="sans-serif" font-size="11">Sparovia Media</text></svg>';

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

  // Delete Confirmation Modal state
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [removingImage, setRemovingImage] = useState<ImageDto | null>(null);
  const [removing, setRemoving] = useState(false);

  // Bulk Selection state
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkPublishModalOpen, setBulkPublishModalOpen] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Failed image tracking for actionable placeholder
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());
  const [optimizingImage, setOptimizingImage] = useState(false);

  // Category Management Modal state
  const [manageCategoriesModalOpen, setManageCategoriesModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [categoryActionLoading, setCategoryActionLoading] = useState(false);
  const [categoryActionError, setCategoryActionError] = useState<string | null>(null);
  const [newCatInput, setNewCatInput] = useState('');

  // Quality Studio Modal state
  const [qualityStudioModalOpen, setQualityStudioModalOpen] = useState(false);
  const [qualityStudioImage, setQualityStudioImage] = useState<ImageDto | null>(null);

  const openQualityStudio = (img: ImageDto) => {
    setQualityStudioImage(img);
    setQualityStudioModalOpen(true);
  };

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

  const handleCreateCategoryFromModal = async () => {
    if (!newCatInput.trim()) return;
    setCategoryActionLoading(true);
    setCategoryActionError(null);
    try {
      await apiClient.post('/website/categories', { name: newCatInput.trim() });
      setNewCatInput('');
      await fetchCategories();
    } catch (err: any) {
      setCategoryActionError(err?.message || 'Failed to create category.');
    } finally {
      setCategoryActionLoading(false);
    }
  };

  const handleUpdateCategoryFromModal = async (catId: string) => {
    if (!editingCategoryName.trim()) return;
    setCategoryActionLoading(true);
    setCategoryActionError(null);
    try {
      await apiClient.put(`/website/categories/${catId}`, { name: editingCategoryName.trim() });
      setEditingCategoryId(null);
      setEditingCategoryName('');
      await fetchCategories();
      await fetchImages();
    } catch (err: any) {
      setCategoryActionError(err?.message || 'Failed to update category.');
    } finally {
      setCategoryActionLoading(false);
    }
  };

  const handleDeleteCategoryFromModal = async (catId: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    setCategoryActionLoading(true);
    setCategoryActionError(null);
    try {
      await apiClient.delete(`/website/categories/${catId}`);
      if (categoryFilter.toLowerCase() === categories.find(c => c.id === catId)?.name.toLowerCase()) {
        setCategoryFilter('All');
      }
      await fetchCategories();
      await fetchImages();
    } catch (err: any) {
      setCategoryActionError(err?.message || 'Failed to delete category.');
    } finally {
      setCategoryActionLoading(false);
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

  const currentTabImages = activeTab === 'website' ? websiteImages : displayedExploreImages;
  const isAllSelected = currentTabImages.length > 0 && currentTabImages.every((img) => selectedImageIds.has(img.id));

  const toggleSelectImage = (id: string) => {
    setSelectedImageIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedImageIds((prev) => {
        const next = new Set(prev);
        currentTabImages.forEach((img) => next.delete(img.id));
        return next;
      });
    } else {
      setSelectedImageIds((prev) => {
        const next = new Set(prev);
        currentTabImages.forEach((img) => next.add(img.id));
        return next;
      });
    }
  };

  const clearSelection = () => {
    setSelectedImageIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedImageIds.size === 0) return;
    setBulkProcessing(true);
    try {
      await apiClient.post('/website/images/bulk-delete', {
        imageIds: Array.from(selectedImageIds)
      });
      setBulkDeleteModalOpen(false);
      clearSelection();
      await fetchImages();
      await fetchCategories();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete selected images.');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkPublish = async () => {
    if (selectedImageIds.size === 0) return;
    setBulkProcessing(true);
    try {
      await apiClient.post('/website/images/bulk-publish', {
        imageIds: Array.from(selectedImageIds)
      });
      setBulkPublishModalOpen(false);
      clearSelection();
      await fetchImages();
    } catch (err: any) {
      alert(err?.message || 'Failed to publish selected images.');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleOptimizeImage = async (image: ImageDto, parentVariantId?: string) => {
    setOptimizingImage(true);
    try {
      await apiClient.post(`/website/images/${image.id}/optimize`, parentVariantId ? { parentVariantId } : {});
      await fetchImages();
      const updated = await apiClient.get<{ data: ImageDto }>(`/website/images/${image.id}`);
      if (updated?.data) setPreviewImage(updated.data);
    } catch (err: any) {
      alert(err?.message || 'Failed to optimize image.');
    } finally {
      setOptimizingImage(false);
    }
  };

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
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => {
                setCategoryActionError(null);
                setEditingCategoryId(null);
                setNewCatInput('');
                setManageCategoriesModalOpen(true);
              }}
              leftIcon={<SlidersHorizontal className="w-4 h-4" />}
            >
              Manage Categories
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => openUploadModal()}
              leftIcon={<Upload className="w-4 h-4" />}
            >
              Add Project Image
            </Button>
          </div>
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
          onClick={() => {
            setActiveTab('website');
            clearSelection();
          }}
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
          onClick={() => {
            setActiveTab('explore');
            clearSelection();
          }}
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

      {/* Sticky Bulk Action Toolbar */}
      {selectedImageIds.size > 0 && (
        <div className="sticky top-20 z-30 p-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
              {selectedImageIds.size}
            </span>
            <span className="text-sm font-semibold">
              {selectedImageIds.size} {selectedImageIds.size === 1 ? 'image' : 'images'} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="success"
              onClick={() => setBulkPublishModalOpen(true)}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Publish Selected
            </Button>
            <Button
              type="button"
              size="sm"
              variant="danger"
              onClick={() => setBulkDeleteModalOpen(true)}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Delete Selected
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={clearSelection}
              className="text-slate-300 hover:text-white hover:bg-slate-800 dark:hover:bg-slate-700"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

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
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Homepage Key Sections
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">
                Assigned images appear in high-visibility showcase sections of your website.
              </p>
            </div>
            {websiteImages.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
              >
                {isAllSelected ? 'Deselect All' : `Select All (${websiteImages.length})`}
              </Button>
            )}
          </div>

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
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelectImage(assignedImage.id);
                            }}
                            className={`absolute top-2.5 left-2.5 z-20 w-6 h-6 rounded-md border flex items-center justify-center transition-all ${
                              selectedImageIds.has(assignedImage.id)
                                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                : 'bg-white/80 dark:bg-slate-900/80 border-slate-300 dark:border-slate-600 text-transparent hover:border-blue-500 backdrop-blur-xs'
                            }`}
                            aria-label="Select image"
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </button>

                          <img
                            src={resolveImageUrl(assignedImage.previewUrl)}
                            onError={(e) => {
                              setFailedImageIds((prev) => new Set(prev).add(assignedImage.id));
                              e.currentTarget.src = FALLBACK_IMAGE_DATA_URI;
                            }}
                            alt={slot.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />

                          {failedImageIds.has(assignedImage.id) && (
                            <div className="absolute inset-0 z-10 bg-slate-900/85 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center text-white space-y-2">
                              <AlertCircle className="w-5 h-5 text-amber-400" />
                              <p className="text-xs font-medium">Image is unavailable.<br />You can replace it.</p>
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => openUploadModal(slot.key, assignedImage)}
                                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                              >
                                Replace Image
                              </Button>
                            </div>
                          )}

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
                            variant="secondary"
                            size="sm"
                            onClick={() => openUploadModal(slot.key, assignedImage)}
                            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                          >
                            Replace
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openQualityStudio(assignedImage)}
                            leftIcon={<SlidersHorizontal className="w-3.5 h-3.5 text-orange-500" />}
                            title="Open Image Quality Studio"
                          >
                            Studio
                          </Button>
                        </div>

                        <div className="flex items-center gap-2">
                          {assignedImage.status !== 'Published' ? (
                            <Button
                              type="button"
                              variant="success"
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
                  variant="primary"
                  size="md"
                  onClick={() => openUploadModal()}
                  leftIcon={<Upload className="w-4 h-4" />}
                >
                  Add Project Image
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

                {displayedExploreImages.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAll}
                  >
                    {isAllSelected ? 'Deselect All' : `Select All (${displayedExploreImages.length})`}
                  </Button>
                )}
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
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectImage(image.id);
                          }}
                          className={`absolute top-2.5 left-2.5 z-20 w-6 h-6 rounded-md border flex items-center justify-center transition-all ${
                            selectedImageIds.has(image.id)
                              ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                              : 'bg-white/80 dark:bg-slate-900/80 border-slate-300 dark:border-slate-600 text-transparent hover:border-blue-500 backdrop-blur-xs'
                          }`}
                          aria-label="Select image"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>

                        <img
                          src={resolveImageUrl(image.previewUrl)}
                          onError={(e) => {
                            setFailedImageIds((prev) => new Set(prev).add(image.id));
                            e.currentTarget.src = FALLBACK_IMAGE_DATA_URI;
                          }}
                          alt={image.projectWorkName || 'Project work photo'}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                          onClick={() => openPreviewModal(image)}
                        />

                        {failedImageIds.has(image.id) && (
                          <div className="absolute inset-0 z-10 bg-slate-900/85 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center text-white space-y-2">
                            <AlertCircle className="w-5 h-5 text-amber-400" />
                            <p className="text-xs font-medium">Image is unavailable.<br />You can replace it.</p>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => openUploadModal(undefined, image)}
                              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                            >
                              Replace Image
                            </Button>
                          </div>
                        )}
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
                            variant="secondary"
                            size="sm"
                            onClick={() => openUploadModal(undefined, image)}
                            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                          >
                            Replace
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openQualityStudio(image)}
                            leftIcon={<SlidersHorizontal className="w-3.5 h-3.5 text-orange-500" />}
                            title="Open Image Quality Studio"
                          >
                            Studio
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
                              variant="success"
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
            {previewImage && (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => {
                  setPreviewModalOpen(false);
                  openQualityStudio(previewImage);
                }}
                leftIcon={<SlidersHorizontal className="w-4 h-4 text-orange-500" />}
                className="w-full sm:w-auto"
              >
                Quality Studio
              </Button>
            )}
            {previewImage && !previewImage.variants?.some((v) => v.variantType === 'WebsiteOptimized') && (
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={optimizingImage}
                isLoading={optimizingImage}
                loadingText="Optimizing..."
                onClick={() => handleOptimizeImage(previewImage)}
                className="w-full sm:w-auto"
              >
                Optimize Image (WebP)
              </Button>
            )}
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

            {/* Deterministic Web Optimization (Non-AI) */}
            <div className="p-3.5 bg-slate-50 dark:bg-[#0B1120] rounded-xl border border-slate-200 dark:border-[#1E293B] space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Deterministic Web Optimization</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">Non-AI</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Deterministic compression to WebP and responsive scaling. Original upload remains immutable.
                  </p>
                </div>
              </div>

              {previewImage.variants?.some((v) => v.variantType === 'WebsiteOptimized') ? (
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800 text-[11px] flex items-center justify-between text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Web-Optimized Variant Ready for Publishing</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase">WebP</span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">
                  Click &quot;Optimize Image (WebP)&quot; to generate a lightweight web variant.
                </p>
              )}
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

      {/* MODAL: Manage Portfolio Categories */}
      <Modal
        isOpen={manageCategoriesModalOpen}
        onClose={() => setManageCategoriesModalOpen(false)}
        title="Manage Portfolio Categories"
        description="Organize your Explore Our Work categories. These also define the Area of Interest choices in your public contact form."
        maxWidth="md"
        footer={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setManageCategoriesModalOpen(false)}
          >
            Close
          </Button>
        }
      >
        <div className="space-y-4">
          {categoryActionError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{categoryActionError}</span>
            </div>
          )}

          {/* Add Category Section */}
          <div className="p-3.5 bg-slate-50 dark:bg-[#0B1120] rounded-xl border border-slate-200 dark:border-[#1E293B] space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Add New Category
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="e.g. Modular Kitchen, Master Suite"
                value={newCatInput}
                onChange={(e) => setNewCatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateCategoryFromModal();
                  }
                }}
                disabled={categoryActionLoading}
                maxLength={100}
                className="flex-1 text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#1E293B]/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleCreateCategoryFromModal}
                disabled={categoryActionLoading || !newCatInput.trim()}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Categories List */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Existing Categories ({categories.length})
            </label>
            {categories.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">No categories created yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-[#1E293B] border border-slate-200 dark:border-[#1E293B] rounded-xl overflow-hidden bg-white dark:bg-[#0F172A]">
                {categories.map((cat) => (
                  <div key={cat.id} className="p-3 flex items-center justify-between gap-2">
                    {editingCategoryId === cat.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editingCategoryName}
                          onChange={(e) => setEditingCategoryName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleUpdateCategoryFromModal(cat.id);
                            }
                          }}
                          autoFocus
                          maxLength={100}
                          className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-blue-400 bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => handleUpdateCategoryFromModal(cat.id)}
                          disabled={categoryActionLoading || !editingCategoryName.trim()}
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingCategoryId(null);
                            setEditingCategoryName('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white">
                            {cat.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {cat.imageCount} {cat.imageCount === 1 ? 'image' : 'images'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => {
                              setEditingCategoryId(cat.id);
                              setEditingCategoryName(cat.name);
                              setCategoryActionError(null);
                            }}
                            title="Edit Category Name"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleDeleteCategoryFromModal(cat.id)}
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-rose-600" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* MODAL 5: Bulk Delete Confirmation Modal */}
      <Modal
        isOpen={bulkDeleteModalOpen}
        onClose={() => !bulkProcessing && setBulkDeleteModalOpen(false)}
        title="Delete Selected Images"
        description="Are you sure you want to delete these images?"
        maxWidth="md"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={bulkProcessing}
              onClick={() => setBulkDeleteModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              disabled={bulkProcessing}
              isLoading={bulkProcessing}
              loadingText="Deleting..."
              onClick={handleBulkDelete}
              className="w-full sm:w-auto"
            >
              Delete {selectedImageIds.size} Images
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to delete <strong>{selectedImageIds.size}</strong> selected image{selectedImageIds.size === 1 ? '' : 's'}?
          </p>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300">
            <strong>Warning:</strong> Any published images among your selection will be removed from your live website.
          </div>
        </div>
      </Modal>

      {/* MODAL 6: Bulk Publish Confirmation Modal */}
      <Modal
        isOpen={bulkPublishModalOpen}
        onClose={() => !bulkProcessing && setBulkPublishModalOpen(false)}
        title="Publish Selected Images"
        description="Deploy selected images to your public website."
        maxWidth="md"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={bulkProcessing}
              onClick={() => setBulkPublishModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="success"
              size="md"
              disabled={bulkProcessing}
              isLoading={bulkProcessing}
              loadingText="Publishing..."
              onClick={handleBulkPublish}
              className="w-full sm:w-auto"
            >
              Publish {selectedImageIds.size} Images
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to publish <strong>{selectedImageIds.size}</strong> selected image{selectedImageIds.size === 1 ? '' : 's'} to your website?
          </p>
          <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl text-xs text-blue-800 dark:text-blue-300">
            Optimized, high-performance web representations (WebP) will be displayed to your live website visitors. Original photographs are immutable and never overwritten.
          </div>
        </div>
      </Modal>

      {/* MODAL 7: Image Quality Studio Modal */}
      <ImageQualityStudioModal
        isOpen={qualityStudioModalOpen}
        onClose={() => setQualityStudioModalOpen(false)}
        image={qualityStudioImage}
        onImageUpdated={(updatedImg) => {
          setImages((prev) => prev.map((img) => (img.id === updatedImg.id ? updatedImg : img)));
          setQualityStudioImage(updatedImg);
        }}
        onOptimizeRequested={(img, variantId) => {
          setQualityStudioModalOpen(false);
          handleOptimizeImage(img, variantId);
        }}
        resolveImageUrl={resolveImageUrl}
      />
    </div>
  );
}
