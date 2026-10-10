'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Upload,
  RefreshCw,
  FolderPlus,
  Trash2,
  SlidersHorizontal,
  Check,
  CheckCircle2,
  AlertCircle,
  Eye,
  Plus,
  Search,
  Layers,
  Info,
  Edit3,
  Image as ImageIcon
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  ImageStudioWorkspace,
  ImageDto,
  ImageVariantDto,
  PendingUploadData,
} from '@/components/images/ImageStudioWorkspace';
import {
  ImageUploadModal,
  WorkCategoryDto,
} from '@/components/images/ImageUploadModal';

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
    recommendedSize: '1200 × 900 px (4:3)',
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

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 KB';
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
  const [categories, setCategories] = useState<WorkCategoryDto[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected image or pending upload for Image Studio Workspace
  const [studioImage, setStudioImage] = useState<ImageDto | null>(null);
  const [pendingStudioUpload, setPendingStudioUpload] = useState<PendingUploadData | null>(null);

  // Upload / Replace Modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadSlot, setUploadSlot] = useState<string | null>(null);
  const [replacingImage, setReplacingImage] = useState<ImageDto | null>(null);

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

  // Category Management Modal state
  const [manageCategoriesModalOpen, setManageCategoriesModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [newCatInput, setNewCatInput] = useState('');
  const [categoryActionLoading, setCategoryActionLoading] = useState(false);
  const [categoryActionError, setCategoryActionError] = useState<string | null>(null);

  // Fetch images and categories from backend
  const fetchImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<{ data: ImageDto[] }>('/website/images');
      setImages(res?.data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load images. Please check network connectivity.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get<{ data: WorkCategoryDto[] }>('/website/categories');
      setCategories(res?.data || []);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  useEffect(() => {
    fetchImages();
    fetchCategories();
  }, []);

  const handleTabChange = (tab: 'website' | 'explore') => {
    setActiveTab(tab);
    setCategoryFilter('All');
    setSearchQuery('');
    setSelectedImageIds(new Set());
  };

  const handleOpenStudio = (img: ImageDto) => {
    setPendingStudioUpload(null);
    setStudioImage(img);
  };

  const handleImageUpdated = (updatedImg: ImageDto) => {
    setImages((prev) => {
      const exists = prev.some((img) => img.id === updatedImg.id);
      if (exists) {
        return prev.map((img) => (img.id === updatedImg.id ? updatedImg : img));
      }
      return [updatedImg, ...prev];
    });
    if (studioImage && studioImage.id === updatedImg.id) {
      setStudioImage(updatedImg);
    }
    if (previewImage && previewImage.id === updatedImg.id) {
      setPreviewImage(updatedImg);
    }
  };

  const openUploadModal = (slot?: string, replace?: ImageDto) => {
    setUploadSlot(slot || null);
    setReplacingImage(replace || null);
    setUploadModalOpen(true);
  };

  const openPreviewModal = (image: ImageDto) => {
    setPreviewImage(image);
    setPreviewModalOpen(true);
  };

  const openEditModal = (image: ImageDto) => {
    setEditingImage(image);
    setEditProjectName(image.projectWorkName || '');
    setEditCategory(image.category || '');
    setEditCaption(image.caption || '');
    setEditModalOpen(true);
  };

  const openRemoveModal = (image: ImageDto) => {
    setRemovingImage(image);
    setRemoveModalOpen(true);
  };

  // Publish image
  const handlePublishImage = async (image: ImageDto, variantId?: string) => {
    setPublishing(true);
    try {
      await apiClient.post(`/website/images/${image.id}/publish`, { variantId });
      await fetchImages();
      if (previewModalOpen && previewImage?.id === image.id) {
        setPreviewImage({ ...previewImage, status: 'Published' });
      }
    } catch (err: any) {
      alert(err?.message || 'Publishing failed. Your previous live image remains unchanged.');
    } finally {
      setPublishing(false);
    }
  };

  // Approve image
  const handleApproveImage = async (image: ImageDto) => {
    try {
      await apiClient.post(`/website/images/${image.id}/approve`, {});
      await fetchImages();
      if (previewModalOpen && previewImage?.id === image.id) {
        setPreviewImage({ ...previewImage, status: 'Approved' });
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to approve image.');
    }
  };

  // Save metadata
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
      setEditingImage(null);
      await fetchImages();
      await fetchCategories();
    } catch (err: any) {
      alert(err?.message || 'Failed to update image details.');
    } finally {
      setSavingMetadata(false);
    }
  };

  // Delete single image
  const handleConfirmRemoval = async () => {
    if (!removingImage) return;
    setRemoving(true);
    try {
      await apiClient.delete(`/website/images/${removingImage.id}`);
      setImages((prev) => prev.filter((i) => i.id !== removingImage.id));
      setSelectedImageIds((prev) => {
        const next = new Set(prev);
        next.delete(removingImage.id);
        return next;
      });
      setRemoveModalOpen(false);
      setRemovingImage(null);
      await fetchCategories();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete image.');
    } finally {
      setRemoving(false);
    }
  };

  // Bulk selection handlers
  const toggleSelectImage = (id: string) => {
    setSelectedImageIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedImageIds(new Set());
  };

  // Categories management
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
      if (categoryFilter.toLowerCase() === categories.find((c) => c.id === catId)?.name.toLowerCase()) {
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

  // Filtered lists
  const websiteImages = images.filter((i) => i.usageType === 'WebsiteImage');
  const exploreImages = images.filter((i) => i.usageType === 'ExploreOurWork');

  const displayedExploreImages = exploreImages.filter((img) => {
    if (categoryFilter !== 'All' && img.category?.toLowerCase() !== categoryFilter.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = img.projectWorkName?.toLowerCase().includes(q);
      const matchCat = img.category?.toLowerCase().includes(q);
      const matchCaption = img.caption?.toLowerCase().includes(q);
      const matchFileName = img.originalFileName?.toLowerCase().includes(q);
      if (!matchName && !matchCat && !matchCaption && !matchFileName) return false;
    }
    return true;
  });

  const isAllSelected =
    displayedExploreImages.length > 0 &&
    displayedExploreImages.every((img) => selectedImageIds.has(img.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      clearSelection();
    } else {
      setSelectedImageIds(new Set(displayedExploreImages.map((i) => i.id)));
    }
  };

  // Bulk actions execution
  const handleBulkDelete = async () => {
    if (selectedImageIds.size === 0) return;
    setBulkProcessing(true);
    try {
      await apiClient.post('/website/images/bulk-delete', {
        imageIds: Array.from(selectedImageIds),
      });
      clearSelection();
      setBulkDeleteModalOpen(false);
      await fetchImages();
      await fetchCategories();
    } catch (err: any) {
      alert(err?.message || 'Failed during bulk delete.');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkPublish = async () => {
    if (selectedImageIds.size === 0) return;
    setBulkProcessing(true);
    try {
      await apiClient.post('/website/images/bulk-publish', {
        imageIds: Array.from(selectedImageIds),
      });
      clearSelection();
      setBulkPublishModalOpen(false);
      await fetchImages();
    } catch (err: any) {
      alert(err?.message || 'Failed during bulk publish.');
    } finally {
      setBulkProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
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
              className="bg-[#F97316] hover:bg-[#EA580C] text-white"
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

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-[#1E293B] gap-6">
        <button
          type="button"
          onClick={() => handleTabChange('website')}
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
          onClick={() => handleTabChange('explore')}
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

      {/* TAB 1: WEBSITE IMAGES (Four Large Columns Desktop Layout) */}
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {WEBSITE_SLOTS.map((slot) => {
              const assignedImage = websiteImages.find(
                (img) => img.slot === slot.key && img.isActiveWebsiteUsage
              );
              const isAssignedPublished = assignedImage?.status === 'Published';

              return (
                <div
                  key={slot.key}
                  className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between hover:border-blue-500 transition-colors"
                >
                  <div className="space-y-3">
                    {/* Slot Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block truncate">
                          {slot.title.toUpperCase()}
                        </span>
                        <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5 line-clamp-2">
                          {slot.description}
                        </p>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                          assignedImage
                            ? isAssignedPublished
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {assignedImage ? (isAssignedPublished ? 'Published' : 'Assigned') : 'Not Set'}
                      </span>
                    </div>

                    {/* Image Preview Area */}
                    <div className="relative rounded-2xl overflow-hidden bg-slate-50 dark:bg-[#1E293B]/40 border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center min-h-[160px] aspect-16/10 group">
                      {assignedImage ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={resolveImageUrl(assignedImage.previewUrl)}
                            alt={slot.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />

                          {/* Hover Overlay */}
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
                          <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" strokeWidth={1.5} />
                          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                            Recommended: {slot.recommendedSize}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Metadata line if assigned */}
                    {assignedImage && (
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                        <span>
                          {assignedImage.width} × {assignedImage.height} px • {formatFileSize(assignedImage.fileSize)}
                        </span>
                        <span className="truncate max-w-[120px]" title={assignedImage.originalFileName}>
                          {assignedImage.originalFileName}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Slot Actions Footer */}
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
                            variant="studio"
                            size="sm"
                            onClick={() => handleOpenStudio(assignedImage)}
                            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                            title="Open Image Studio"
                          >
                            Studio
                          </Button>
                        </div>

                        <div className="flex items-center gap-2">
                          {!isAssignedPublished ? (
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

      {/* TAB 2: EXPLORE OUR WORK (Original Card Layout & Behavior) */}
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
                  className="bg-[#F97316] hover:bg-[#EA580C] text-white"
                >
                  Add Project Image
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Category Filter Pills and Controls */}
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

                <div className="flex items-center gap-2">
                  {/* Search input */}
                  <div className="relative w-48 sm:w-60">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search projects..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
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
              </div>

              {displayedExploreImages.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-[#1E293B]">
                  <p className="text-sm text-slate-500">No project images found in &quot;{categoryFilter}&quot;.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter('All');
                      setSearchQuery('');
                    }}
                    className="mt-2 text-xs text-blue-600 font-semibold hover:underline"
                  >
                    View all projects ({exploreImages.length})
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {displayedExploreImages.map((image) => (
                    <div
                      key={image.id}
                      className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between group"
                    >
                      {/* Image Thumbnail with Overlay Badges */}
                      <div className="relative aspect-video bg-slate-950 overflow-hidden">
                        {/* Checkbox */}
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

                        {/* Image Preview */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={resolveImageUrl(image.previewUrl)}
                          alt={image.projectWorkName || 'Project work photo'}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                          onClick={() => openPreviewModal(image)}
                        />

                        {/* Top-Right Badges */}
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                          {image.category && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900/80 text-white backdrop-blur-xs">
                              {image.category}
                            </span>
                          )}
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs ${
                              image.status === 'Published'
                                ? 'bg-emerald-500/90 text-white'
                                : image.status === 'Approved'
                                ? 'bg-blue-500/90 text-white'
                                : 'bg-slate-700/90 text-white'
                            }`}
                          >
                            {image.status}
                          </span>
                        </div>
                      </div>

                      {/* Card Details */}
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

                      {/* Card Actions Footer */}
                      <div className="p-4 pt-3 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-[#1E293B]/60 mt-auto">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="enhance"
                            size="sm"
                            onClick={() => handleOpenStudio(image)}
                            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                            className="bg-[#F97316] hover:bg-[#EA580C] text-white"
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
                          {image.status !== 'Published' && (
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              onClick={() => handlePublishImage(image)}
                              className="bg-[#F97316] hover:bg-[#EA580C] text-white"
                            >
                              Publish
                            </Button>
                          )}
                        </div>

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
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Image Studio Workspace Modal */}
      {(studioImage || pendingStudioUpload) && (
        <ImageStudioWorkspace
          image={studioImage}
          pendingUpload={pendingStudioUpload}
          onClose={() => {
            setStudioImage(null);
            setPendingStudioUpload(null);
          }}
          onImageUpdated={handleImageUpdated}
          resolveImageUrl={resolveImageUrl}
          onReplaceRequested={(img) => {
            setStudioImage(null);
            setPendingStudioUpload(null);
            openUploadModal(img.slot || undefined, img);
          }}
          onDeleteRequested={(img) => {
            setStudioImage(null);
            setPendingStudioUpload(null);
            openRemoveModal(img);
          }}
        />
      )}

      {/* Upload / Replace Modal */}
      <ImageUploadModal
        isOpen={uploadModalOpen}
        onClose={() => {
          setUploadModalOpen(false);
          setUploadSlot(null);
          setReplacingImage(null);
        }}
        slot={uploadSlot}
        usageType={activeTab === 'website' ? 'WebsiteImage' : 'ExploreOurWork'}
        replacingImage={replacingImage}
        categories={categories}
        onCategoryCreated={(newCat) => setCategories((prev) => [...prev, newCat])}
        onOpenStudio={(pending) => {
          setUploadModalOpen(false);
          setPendingStudioUpload(pending);
          setStudioImage(null);
        }}
        onSuccess={(newImg) => {
          fetchImages();
          handleOpenStudio(newImg);
        }}
      />

      {/* MODAL 2: Image Preview Modal */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title={previewImage?.projectWorkName || previewImage?.slot || 'Image Preview'}
        description={previewImage?.caption || 'Image preview and active website details'}
        maxWidth="3xl"
        footer={
          <div className="flex flex-wrap items-center justify-between w-full gap-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => {
                  if (previewImage) {
                    setPreviewModalOpen(false);
                    handleOpenStudio(previewImage);
                  }
                }}
                leftIcon={<Sparkles className="w-4 h-4 text-blue-600" />}
              >
                Studio
              </Button>
              {previewImage && (
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setPreviewModalOpen(false);
                    openUploadModal(previewImage.slot, previewImage);
                  }}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  Replace
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {previewImage && previewImage.status === 'Uploaded' && (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => handleApproveImage(previewImage)}
                >
                  Approve Image
                </Button>
              )}
              {previewImage && previewImage.status !== 'Published' && (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  disabled={publishing}
                  isLoading={publishing}
                  loadingText="Publishing..."
                  onClick={() => handlePublishImage(previewImage)}
                  className="bg-[#F97316] hover:bg-[#EA580C] text-white"
                >
                  Publish to Website
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => setPreviewModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        }
      >
        {previewImage && (
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center max-h-[60vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveImageUrl(previewImage.previewUrl)}
                alt={previewImage.projectWorkName || 'Preview'}
                className="max-h-[60vh] w-auto object-contain mx-auto"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-[#1E293B]/50 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 block">Dimensions</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {previewImage.width} × {previewImage.height} px
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Aspect Ratio</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {getAspectRatioLabel(previewImage.width, previewImage.height)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">File Size</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatFileSize(previewImage.fileSize)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Status</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {previewImage.status}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 3: Edit Metadata Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Project Details"
        description="Update project title, category, and caption details."
        maxWidth="md"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={savingMetadata}
              onClick={() => setEditModalOpen(false)}
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
            >
              Save Details
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Project / Work Name
            </label>
            <input
              type="text"
              value={editProjectName}
              onChange={(e) => setEditProjectName(e.target.value)}
              placeholder="e.g. Master Bedroom Wardrobe"
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Caption
            </label>
            <textarea
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              rows={3}
              placeholder="Describe the bespoke craft and materials used..."
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* MODAL 4: Single Delete Confirmation Modal */}
      <Modal
        isOpen={removeModalOpen}
        onClose={() => !removing && setRemoveModalOpen(false)}
        title="Delete Image"
        description="Are you sure you want to delete this image?"
        maxWidth="md"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={removing}
              onClick={() => setRemoveModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              disabled={removing}
              isLoading={removing}
              loadingText="Deleting..."
              onClick={handleConfirmRemoval}
            >
              Delete Image
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to delete this image from your media library?
          </p>
          {removingImage?.status === 'Published' && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300">
              <strong>Warning:</strong> This image is currently published on your live website. Deleting it will remove it from public display.
            </div>
          )}
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

      {/* MODAL 7: Category Management Modal */}
      <Modal
        isOpen={manageCategoriesModalOpen}
        onClose={() => setManageCategoriesModalOpen(false)}
        title="Manage Work Categories"
        description="Organize your portfolio photographs into client-facing categories."
        maxWidth="md"
      >
        <div className="space-y-4">
          {categoryActionError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{categoryActionError}</span>
            </div>
          )}

          {/* Create Category */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Create New Category
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCatInput}
                onChange={(e) => setNewCatInput(e.target.value)}
                placeholder="e.g. Bespoke Wardrobes"
                maxLength={100}
                className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
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

          {/* Existing Categories */}
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
                          className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-blue-400 bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
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
    </div>
  );
}
