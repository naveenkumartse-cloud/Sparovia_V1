'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Upload,
  RefreshCw,
  FolderPlus,
  Trash2,
  Globe,
  SlidersHorizontal,
  Check,
  CheckCircle2,
  AlertCircle,
  Eye,
  Plus,
  Filter,
  Search,
  Layers,
  ArrowRight
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  ImageStudioWorkspace,
  ImageDto,
  ImageVariantDto,
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

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function ImagesPage() {
  const [activeTab, setActiveTab] = useState<'website' | 'explore'>('website');
  const [images, setImages] = useState<ImageDto[]>([]);
  const [categories, setCategories] = useState<WorkCategoryDto[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected image for the Image Studio Workspace
  const [studioImage, setStudioImage] = useState<ImageDto | null>(null);

  // Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadTargetSlot, setUploadTargetSlot] = useState<string | null>(null);
  const [replacingImage, setReplacingImage] = useState<ImageDto | null>(null);

  // Category Management Modal State
  const [manageCategoriesModalOpen, setManageCategoriesModalOpen] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [catActionLoading, setCatActionLoading] = useState(false);
  const [catActionError, setCatActionError] = useState<string | null>(null);

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingImage, setDeletingImage] = useState<ImageDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const fetchImages = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await apiClient.get<{ data: ImageDto[] }>('/website/images');
      setImages(res?.data || []);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load images. Please check network connectivity.');
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

  const handleOpenStudio = (img: ImageDto) => {
    setStudioImage(img);
  };

  const handleImageUpdated = (updatedImg: ImageDto) => {
    setImages((prev) => prev.map((img) => (img.id === updatedImg.id ? updatedImg : img)));
    if (studioImage && studioImage.id === updatedImg.id) {
      setStudioImage(updatedImg);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCatInput.trim()) return;
    setCatActionLoading(true);
    setCatActionError(null);
    try {
      await apiClient.post('/website/categories', { name: newCatInput.trim() });
      setNewCatInput('');
      await fetchCategories();
    } catch (err: any) {
      setCatActionError(err?.message || 'Failed to create category.');
    } finally {
      setCatActionLoading(false);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    try {
      await apiClient.delete(`/website/categories/${catId}`);
      await fetchCategories();
      await fetchImages();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete category.');
    }
  };

  const confirmDeleteImage = async () => {
    if (!deletingImage) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/website/images/${deletingImage.id}`);
      setImages((prev) => prev.filter((img) => img.id !== deletingImage.id));
      if (studioImage?.id === deletingImage.id) {
        setStudioImage(null);
      }
      setDeleteModalOpen(false);
      setDeletingImage(null);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete image.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle image selection for bulk actions
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} selected image(s)?`)) return;
    setBulkActionLoading(true);
    try {
      for (const id of Array.from(selectedIds)) {
        await apiClient.delete(`/website/images/${id}`);
      }
      setSelectedIds(new Set());
      await fetchImages();
    } catch (err: any) {
      alert(err?.message || 'Failed during bulk delete.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleTabChange = (tab: 'website' | 'explore') => {
    setActiveTab(tab);
    setSelectedCategoryFilter('All');
    setSearchQuery('');
    setSelectedIds(new Set());
  };

  // Scoped Explore Our Work collection filtering
  const exploreImages = images.filter((img) => {
    if (img.usageType !== 'ExploreOurWork') return false;

    if (selectedCategoryFilter !== 'All' && img.category !== selectedCategoryFilter) {
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

  // Website Slots search filtering
  const visibleSlots = WEBSITE_SLOTS.filter((slotDef) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const assigned = images.find((i) => i.slot === slotDef.key && i.status !== 'Unused');
    return (
      slotDef.title.toLowerCase().includes(q) ||
      slotDef.key.toLowerCase().includes(q) ||
      slotDef.description.toLowerCase().includes(q) ||
      (assigned?.projectWorkName && assigned.projectWorkName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#172033] dark:text-white flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-[#315FEA]" />
            <span>Image Studio</span>
          </h1>
          <p className="text-sm text-[#475569] dark:text-[#94A3B8] mt-1">
            Manage, enhance, and publish high-fidelity showcase photography using adaptive deterministic processing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {activeTab === 'explore' && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => setManageCategoriesModalOpen(true)}
              leftIcon={<FolderPlus className="w-4 h-4" />}
            >
              Manage Categories
            </Button>
          )}

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setUploadTargetSlot(null);
              setReplacingImage(null);
              setUploadModalOpen(true);
            }}
            leftIcon={<Upload className="w-4 h-4" />}
          >
            Upload Image
          </Button>
        </div>
      </div>

      {/* Context Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-[#E3E7ED] dark:border-[#1E293B]">
        <button
          type="button"
          onClick={() => handleTabChange('website')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'website'
              ? 'border-[#315FEA] text-[#315FEA]'
              : 'border-transparent text-[#475569] hover:text-[#172033] dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          Website Slots ({images.filter((i) => i.usageType === 'WebsiteImage').length})
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('explore')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'explore'
              ? 'border-[#315FEA] text-[#315FEA]'
              : 'border-transparent text-[#475569] hover:text-[#172033] dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          Explore Our Work Collection ({images.filter((i) => i.usageType === 'ExploreOurWork').length})
        </button>
      </div>

      {/* Website Slots Context View */}
      {activeTab === 'website' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#172033] dark:text-white">
                Assigned Website Showcase Placements
              </h2>
              <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
                Configure and enhance the 4 canonical billboard and story photographs published across your storefront.
              </p>
            </div>
            {/* Search input scoped to slots */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#475569] dark:text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search slot placements..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-[6px] border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#172033] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#1D4ED8]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {visibleSlots.map((slotDef) => {
              const assigned = images.find((i) => i.slot === slotDef.key && i.status !== 'Unused');
              const isAssignedPublished = assigned?.status === 'Published';
              return (
                <div
                  key={slotDef.key}
                  className="rounded-[8px] border border-[#CBD5E1] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] flex flex-col justify-between shadow-xs hover:border-[#315FEA] transition-colors overflow-hidden"
                >
                  {/* Image Preview Container */}
                  <div className="relative aspect-16/10 bg-slate-950 overflow-hidden flex items-center justify-center border-b border-[#E3E7ED] dark:border-[#1E293B]">
                    {assigned ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resolveImageUrl(assigned.previewUrl)}
                        alt={slotDef.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4 text-[#475569] dark:text-[#94A3B8] select-none">
                        <Sparkles className="w-6 h-6 text-[#94A3B8] mb-1 opacity-50" />
                        <span className="text-[11px] font-medium">Slot Vacant</span>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-2 left-2">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-[4px] border ${
                          assigned
                            ? isAssignedPublished
                              ? 'bg-emerald-50 text-[#15803D] border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800'
                              : 'bg-blue-50 text-[#1D4ED8] border-blue-200 dark:bg-blue-950/40 dark:border-blue-800'
                            : 'bg-[#F3F6FA] text-[#475569] border-[#E3E7ED] dark:bg-[#1E293B] dark:text-[#94A3B8]'
                        }`}
                      >
                        {assigned ? (isAssignedPublished ? 'Published' : 'Assigned') : 'Vacant'}
                      </span>
                    </div>

                    {/* Recommended Resolution Badge */}
                    <div className="absolute bottom-2 right-2">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-[3px] bg-black/60 text-white backdrop-blur-xs">
                        {slotDef.recommendedSize.split(' ')[0]}
                      </span>
                    </div>
                  </div>

                  {/* Slot Details */}
                  <div className="p-3.5 flex flex-col justify-between flex-1 gap-3">
                    <div>
                      <h3 className="text-xs font-semibold text-[#172033] dark:text-white">
                        {slotDef.title}
                      </h3>
                      <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] mt-0.5 line-clamp-2">
                        {slotDef.description}
                      </p>
                      {assigned && (
                        <p className="text-[10px] font-mono text-[#315FEA] dark:text-blue-400 mt-1">
                          {assigned.width} × {assigned.height} px • {formatBytes(assigned.fileSize)}
                        </p>
                      )}
                    </div>

                    {/* Slot Actions */}
                    <div className="pt-2.5 border-t border-[#E3E7ED] dark:border-[#1E293B]">
                      {assigned ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="studio"
                            size="sm"
                            className="flex-1 justify-center"
                            onClick={() => handleOpenStudio(assigned)}
                            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                          >
                            Studio
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setReplacingImage(assigned);
                              setUploadTargetSlot(slotDef.key);
                              setUploadModalOpen(true);
                            }}
                            title="Replace Slot Image"
                          >
                            Replace
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full justify-center"
                          onClick={() => {
                            setReplacingImage(null);
                            setUploadTargetSlot(slotDef.key);
                            setUploadModalOpen(true);
                          }}
                          leftIcon={<Upload className="w-3.5 h-3.5" />}
                        >
                          Assign Image
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Explore Our Work Context View */}
      {activeTab === 'explore' && (
        <div className="space-y-4">
          {/* Search & Category Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter('All')}
                className={`px-3 py-1 text-xs rounded-[4px] font-medium border transition-colors shrink-0 ${
                  selectedCategoryFilter === 'All'
                    ? 'bg-[#315FEA] text-white border-[#315FEA]'
                    : 'bg-white dark:bg-[#1E293B] text-[#475569] dark:text-slate-300 border-[#CBD5E1] dark:border-[#334155] hover:border-[#315FEA]'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat.name)}
                  className={`px-3 py-1 text-xs rounded-[4px] font-medium border transition-colors shrink-0 ${
                    selectedCategoryFilter === cat.name
                      ? 'bg-[#315FEA] text-white border-[#315FEA]'
                      : 'bg-white dark:bg-[#1E293B] text-[#475569] dark:text-slate-300 border-[#CBD5E1] dark:border-[#334155] hover:border-[#315FEA]'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Search input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#475569] dark:text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search portfolio..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-[6px] border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#172033] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#1D4ED8]"
              />
            </div>
          </div>

          {/* Bulk Action Bar */}
          {selectedIds.size > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-[6px] flex items-center justify-between text-xs">
              <span className="font-semibold text-[#1D4ED8] dark:text-blue-300">
                {selectedIds.size} image(s) selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive-outline"
                  size="sm"
                  isLoading={bulkActionLoading}
                  onClick={handleBulkDelete}
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  Delete Selected
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}

          {/* Portfolio Image Grid */}
          {loading ? (
            <div className="p-12 text-center text-[#475569] dark:text-[#94A3B8] flex flex-col items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-[#315FEA] mb-2" />
              <p className="text-xs">Loading media collection...</p>
            </div>
          ) : exploreImages.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="w-6 h-6 text-[#315FEA]" />}
              title="No portfolio images found"
              description="Upload architectural photographs to begin deterministic enhancement and portfolio presentation."
              action={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setUploadTargetSlot(null);
                    setReplacingImage(null);
                    setUploadModalOpen(true);
                  }}
                  leftIcon={<Upload className="w-3.5 h-3.5" />}
                >
                  Upload Image
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {exploreImages.map((img) => {
                const hasVariants = img.variants && img.variants.length > 0;
                const isPublished = img.status === 'Published';
                const isApproved = img.status === 'Approved' || img.variants.some((v) => v.status === 'Approved');
                const isPendingReview = img.variants.some((v) => v.status === 'Enhanced' || v.status === 'ReadyForReview');
                const isSelected = selectedIds.has(img.id);

                return (
                  <div
                    key={img.id}
                    className={`group rounded-[8px] border bg-white dark:bg-[#0F172A] overflow-hidden flex flex-col shadow-xs transition-all ${
                      isSelected
                        ? 'border-[#315FEA] ring-2 ring-[#315FEA]/20'
                        : 'border-[#CBD5E1] dark:border-[#1E293B] hover:border-[#315FEA]'
                    }`}
                  >
                    {/* Image Thumbnail Container */}
                    <div className="relative aspect-4/3 bg-slate-950 overflow-hidden flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveImageUrl(img.previewUrl)}
                        alt={img.projectWorkName || 'Project image'}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      />

                      {/* Top Overlay Badges */}
                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(img.id)}
                          className="w-4 h-4 rounded-[4px] text-[#315FEA] border-[#CBD5E1] focus:ring-[#1D4ED8] cursor-pointer"
                        />
                        <span
                          className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-[4px] border ${
                            isPublished
                              ? 'bg-emerald-50 text-[#15803D] border-emerald-200'
                              : isApproved
                              ? 'bg-blue-50 text-[#1D4ED8] border-blue-200'
                              : isPendingReview
                              ? 'bg-amber-50 text-[#B45309] border-amber-200'
                              : 'bg-white/90 text-[#475569] border-[#E3E7ED]'
                          }`}
                        >
                          {isPublished ? 'Published' : isApproved ? 'Approved' : isPendingReview ? 'Pending Review' : 'Uploaded'}
                        </span>
                      </div>

                      {/* Top Right Variants Badge */}
                      <div className="absolute top-2 right-2 flex items-center gap-1">
                        {hasVariants && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] bg-[#172033]/80 text-white border border-white/10 backdrop-blur-xs flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-[#315FEA]" />
                            <span>{img.variants.length} var</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-3.5 flex flex-col justify-between flex-1 gap-3">
                      <div>
                        <h4 className="text-xs font-semibold text-[#172033] dark:text-white truncate">
                          {img.projectWorkName || img.originalFileName || 'Untitled Image'}
                        </h4>
                        <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] mt-0.5 flex items-center gap-1.5">
                          <span>{img.width} × {img.height} px</span>
                          <span>•</span>
                          <span>{formatBytes(img.fileSize)}</span>
                          {img.category && (
                            <>
                              <span>•</span>
                              <span className="truncate">{img.category}</span>
                            </>
                          )}
                        </p>
                      </div>

                      {/* Card Actions */}
                      <div className="pt-2.5 border-t border-[#E3E7ED] dark:border-[#1E293B] flex items-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1 justify-center"
                          onClick={() => handleOpenStudio(img)}
                          leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                        >
                          Open in Studio
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setReplacingImage(img);
                            setUploadTargetSlot(null);
                            setUploadModalOpen(true);
                          }}
                          title="Replace Source Image"
                        >
                          Replace
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#B91C1C] hover:bg-rose-50"
                          onClick={() => {
                            setDeletingImage(img);
                            setDeleteModalOpen(true);
                          }}
                          title="Delete Image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Image Studio Workspace Modal */}
      {studioImage && (
        <ImageStudioWorkspace
          image={studioImage}
          onClose={() => setStudioImage(null)}
          onImageUpdated={handleImageUpdated}
          resolveImageUrl={resolveImageUrl}
          onReplaceRequested={(img) => {
            setReplacingImage(img);
            setUploadTargetSlot(img.slot || null);
            setUploadModalOpen(true);
          }}
          onDeleteRequested={(img) => {
            setDeletingImage(img);
            setDeleteModalOpen(true);
          }}
        />
      )}

      {/* Upload / Replace Modal */}
      <ImageUploadModal
        isOpen={uploadModalOpen}
        onClose={() => {
          setUploadModalOpen(false);
          setUploadTargetSlot(null);
          setReplacingImage(null);
        }}
        slot={uploadTargetSlot}
        usageType={activeTab === 'website' ? 'WebsiteImage' : 'ExploreOurWork'}
        replacingImage={replacingImage}
        categories={categories}
        onCategoryCreated={(newCat) => setCategories((prev) => [...prev, newCat])}
        onSuccess={(newImg) => {
          fetchImages();
          handleOpenStudio(newImg);
        }}
      />

      {/* Category Management Modal */}
      <Modal
        isOpen={manageCategoriesModalOpen}
        onClose={() => setManageCategoriesModalOpen(false)}
        title="Manage Work Categories"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
            Define custom project categories for organizing portfolio showcase and website media:
          </p>

          {catActionError && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-[#B91C1C] rounded-[6px]">
              {catActionError}
            </div>
          )}

          {/* New Category Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newCatInput}
              onChange={(e) => setNewCatInput(e.target.value)}
              placeholder="e.g. Master Bedroom"
              className="flex-1 px-3 py-2 text-xs rounded-[6px] border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#172033] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#1D4ED8]"
            />
            <Button
              variant="primary"
              size="sm"
              isLoading={catActionLoading}
              onClick={handleCreateCategory}
            >
              Add Category
            </Button>
          </div>

          {/* Categories List */}
          <div className="border border-[#E3E7ED] dark:border-[#334155] rounded-[6px] divide-y divide-[#E3E7ED] dark:divide-[#334155] max-h-60 overflow-y-auto">
            {categories.length === 0 ? (
              <p className="p-4 text-xs text-center text-[#475569] dark:text-[#94A3B8]">
                No custom categories defined yet.
              </p>
            ) : (
              categories.map((cat) => (
                <div key={cat.id} className="p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-[#172033] dark:text-white">
                      {cat.name}
                    </span>
                    <span className="text-[11px] text-[#475569] dark:text-[#94A3B8] ml-2">
                      ({cat.imageCount} images)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="text-[#B91C1C] hover:opacity-80 p-1"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="ghost" size="sm" onClick={() => setManageCategoriesModalOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Image Deletion"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
            Are you sure you want to delete this image? If published, it will be unlinked from the live website. Original storage objects will be safely archived.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E3E7ED] dark:border-[#1E293B]">
            <Button variant="ghost" size="sm" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={confirmDeleteImage}
            >
              Delete Image
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
