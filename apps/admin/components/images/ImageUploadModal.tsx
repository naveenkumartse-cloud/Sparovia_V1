'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  FileCheck,
  Check,
  Save,
  Layers,
  Trash2
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from '@/components/ui/Toast';
import { ImageDto } from './ImageStudioWorkspace';
import { EnhanceButton } from './EnhanceButton';

export interface WorkCategoryDto {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
  imageCount: number;
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

export interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newImage: ImageDto) => void;
  onOpenStudio?: (imageOrPending: ImageDto | PendingUploadData) => void;
  slot?: string | null;
  usageType?: 'WebsiteImage' | 'ExploreOurWork';
  replacingImage?: ImageDto | null;
  categories: WorkCategoryDto[];
  onCategoryCreated?: (newCat: WorkCategoryDto) => void;
}

interface SelectedFileItem {
  file: File;
  previewUrl: string;
  width?: number;
  height?: number;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_DECODED_PIXELS = 25_000_000; // 25 Megapixels
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Resolves relative API paths against the backend origin so images load correctly
 * regardless of whether the admin panel is served on Vercel or localhost.
 */
function resolveImageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  let apiBase: string;
  if (envUrl && envUrl.trim()) {
    apiBase = envUrl.trim();
  } else if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    apiBase = 'https://sparovia-api.onrender.com/api/v1';
  } else {
    apiBase = 'http://localhost:5043/api/v1';
  }
  const origin = apiBase.replace(/\/api\/v1\/?$/, '');
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function ImageUploadModal({
  isOpen,
  onClose,
  onSuccess,
  onOpenStudio,
  slot,
  usageType = 'WebsiteImage',
  replacingImage,
  categories,
  onCategoryCreated,
}: ImageUploadModalProps) {
  // Step workflow: 'form' for selecting & saving; 'success' for confirmed saved state
  const [uploadStep, setUploadStep] = useState<'form' | 'success'>('form');

  const [selectedItems, setSelectedItems] = useState<SelectedFileItem[]>([]);
  const [projectWorkName, setProjectWorkName] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [currentUploadIdx, setCurrentUploadIdx] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Successfully saved image(s) reference from backend
  const [savedImage, setSavedImage] = useState<ImageDto | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef<string[]>([]);
  const isSubmittingRef = useRef(false);

  // Clean up all generated object URLs
  const cleanupPreviews = () => {
    previewUrlsRef.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // Ignore revoke errors
      }
    });
    previewUrlsRef.current = [];
    setSelectedItems([]);
  };

  useEffect(() => {
    if (!isOpen) {
      cleanupPreviews();
      setUploadStep('form');
      setProjectWorkName('');
      setCaption('');
      setSelectedCategory('');
      setIsCreatingCategory(false);
      setNewCatName('');
      setErrorMessage(null);
      setIsUploading(false);
      setCurrentUploadIdx(0);
      setSavedImage(null);
      setSavedCount(0);
      isSubmittingRef.current = false;
    } else if (replacingImage) {
      setUploadStep('form');
      setProjectWorkName(replacingImage.projectWorkName || '');
      setCaption(replacingImage.caption || '');
      setSelectedCategory(replacingImage.category || '');
    }
  }, [isOpen, replacingImage]);

  // Validate a single file
  const validateFile = (file: File): string | null => {
    const fileName = file.name.toLowerCase();
    if (file.type === 'image/heic' || file.type === 'image/heif' || fileName.endsWith('.heic') || fileName.endsWith('.heif')) {
      return `"${file.name}": Apple HEIC photos are not directly supported. Please export as JPG or PNG before uploading.`;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `"${file.name}": Unsupported format. Please select JPG, PNG, or WebP.`;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `"${file.name}" is ${formatBytes(file.size)}, exceeding the 10 MB limit.`;
    }
    return null;
  };

  // Process incoming files from picker or drop
  const handleIncomingFiles = (fileList: FileList | File[]) => {
    setErrorMessage(null);
    const files = Array.from(fileList);
    if (files.length === 0) return;

    // If slot or replacingImage, only 1 file allowed
    const isSingleSlot = Boolean(slot || replacingImage);
    const candidateFiles = isSingleSlot ? [files[0]] : files.slice(0, 10);

    // Validate all files
    for (const f of candidateFiles) {
      const error = validateFile(f);
      if (error) {
        setErrorMessage(error);
        return;
      }
    }

    if (isSingleSlot) {
      cleanupPreviews();
    }

    const newItems: SelectedFileItem[] = [];

    candidateFiles.forEach((file) => {
      const objUrl = URL.createObjectURL(file);
      previewUrlsRef.current.push(objUrl);

      const item: SelectedFileItem = {
        file,
        previewUrl: objUrl,
      };

      // Measure dimensions
      const img = new Image();
      img.onload = () => {
        item.width = img.naturalWidth;
        item.height = img.naturalHeight;
        setSelectedItems((prev) => [...prev]);
      };
      img.src = objUrl;

      newItems.push(item);
    });

    if (isSingleSlot) {
      setSelectedItems(newItems);
    } else {
      setSelectedItems((prev) => [...prev, ...newItems]);
    }
  };

  const removeFileItem = (index: number) => {
    setSelectedItems((prev) => {
      const next = [...prev];
      const removed = next.splice(index, 1);
      if (removed[0]?.previewUrl) {
        try {
          URL.revokeObjectURL(removed[0].previewUrl);
        } catch {
          // ignore
        }
      }
      return next;
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleIncomingFiles(e.dataTransfer.files);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const res = await apiClient.post<{ data: WorkCategoryDto }>('/website/categories', {
        name: newCatName.trim(),
      });
      if (res?.data) {
        onCategoryCreated?.(res.data);
        setSelectedCategory(res.data.name);
        setIsCreatingCategory(false);
        setNewCatName('');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to create work category.');
    }
  };

  // Step 1: Submit and upload to server
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isUploading) return;
    if (selectedItems.length === 0) {
      setErrorMessage('Please select an image file to upload.');
      return;
    }

    isSubmittingRef.current = true;
    setIsUploading(true);
    setErrorMessage(null);
    setCurrentUploadIdx(0);

    let lastSaved: ImageDto | null = null;
    let successCount = 0;

    try {
      for (let i = 0; i < selectedItems.length; i++) {
        setCurrentUploadIdx(i);
        const item = selectedItems[i];
        const formData = new FormData();
        formData.append('file', item.file);

        if (projectWorkName.trim()) {
          formData.append(
            'projectWorkName',
            selectedItems.length > 1
              ? `${projectWorkName.trim()} (${i + 1})`
              : projectWorkName.trim()
          );
        }
        if (caption.trim()) {
          formData.append('caption', caption.trim());
        }
        if (!slot && selectedCategory.trim()) {
          formData.append('category', selectedCategory.trim());
        }

        let res;
        try {
          if (replacingImage) {
            res = await apiClient.postFormData<{ data: ImageDto }>(
              `/website/images/${replacingImage.id}/replace`,
              formData
            );
          } else {
            formData.append('usageType', slot ? 'WebsiteImage' : usageType);
            if (slot) {
              formData.append('slot', slot);
            }
            res = await apiClient.postFormData<{ data: ImageDto }>('/website/images', formData);
          }
        } catch (uploadErr: any) {
          // If a transient network glitch occurred, reconcile before falsely reporting failure:
          // Check if the image was already committed on the backend during the connection interruption
          try {
            const checkRes = await apiClient.get<{ data: ImageDto[] }>('/website/images');
            const match = checkRes?.data?.find(
              (img) =>
                img.originalFileName === item.file.name &&
                (slot ? img.slot === slot : true) &&
                Math.abs(img.fileSize - item.file.size) < 1000
            );
            if (match) {
              res = { data: match };
            } else {
              throw uploadErr;
            }
          } catch {
            throw uploadErr;
          }
        }

        if (res?.data) {
          lastSaved = res.data;
          successCount++;
        }
      }

      if (lastSaved) {
        setSavedImage(lastSaved);
        setSavedCount(successCount);
        setUploadStep('success');
        toast.success(
          successCount > 1
            ? `${successCount} photos saved to library.`
            : 'Photo saved to library.'
        );

        // Safely notify parent to refresh library list.
        // Isolated in a separate try/catch so a background refresh error NEVER invalidates a successful upload!
        try {
          onSuccess(lastSaved);
        } catch (refreshErr) {
          console.warn('Non-fatal parent library refresh notice:', refreshErr);
        }
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Upload failed. Please check network connectivity and file format.'
      );
    } finally {
      setIsUploading(false);
      isSubmittingRef.current = false;
    }
  };

  // Handlers for Step 2 ("success" stage)
  const handleDoneKeepOriginal = () => {
    onClose();
  };

  const handleOpenStudioFromSuccess = () => {
    if (savedImage && onOpenStudio) {
      onOpenStudio(savedImage);
      onClose();
    }
  };

  // Primary file for single preview
  const primaryItem = selectedItems[0];
  const isMultipleAllowed = !slot && !replacingImage;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        uploadStep === 'success'
          ? (savedCount > 1 ? `${savedCount} Photos Saved to Library` : 'Photo Saved to Library')
          : (replacingImage
              ? `Replace Image: ${replacingImage.slot || replacingImage.projectWorkName || 'Source'}`
              : slot
              ? `Upload Photo for Slot: ${slot}`
              : 'Upload Photos to Library')
      }
      description={
        uploadStep === 'success'
          ? 'Your original photograph is safely saved in your media library.'
          : (slot
              ? `Select a photograph for the ${slot} slot on your website.`
              : 'Add photographs to your portfolio library. Original photographs are never overwritten.')
      }
      maxWidth="lg"
      preventOutsideClose={Boolean(isUploading)}
      footer={
        uploadStep === 'success' ? (
          /* STEP 2 FOOTER: Clean, un-overlapping, fully responsive layout */
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
            <div className="text-xs text-[#475569] dark:text-[#94A3B8] flex items-center justify-center sm:justify-start gap-1.5 shrink-0">
              <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
              <span>Saved to media library</span>
            </div>
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
              {onOpenStudio && savedImage && (
                <EnhanceButton
                  size="md"
                  type="button"
                  onClick={handleOpenStudioFromSuccess}
                  className="w-full sm:w-auto justify-center"
                  title="Open Image Studio to optionally enhance clarity, tone, and lighting"
                >
                  Enhance Image (Optional)
                </EnhanceButton>
              )}
              <Button
                variant="primary"
                size="md"
                type="button"
                onClick={handleDoneKeepOriginal}
                leftIcon={<Check className="w-4 h-4" />}
                className="w-full sm:w-auto justify-center font-semibold"
                title="Keep original photograph and close"
              >
                Done — Keep Original
              </Button>
            </div>
          </div>
        ) : (
          /* STEP 1 FOOTER: Standard Save & Cancel */
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 w-full">
            <div className="text-xs text-[#475569] dark:text-[#94A3B8]">
              {selectedItems.length > 0 ? (
                <span>
                  {selectedItems.length} file{selectedItems.length === 1 ? '' : 's'} ready to upload
                </span>
              ) : (
                <span>Original photos are preserved intact</span>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
              <Button variant="ghost" size="md" type="button" onClick={onClose} disabled={isUploading}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                type="submit"
                form="image-upload-form"
                isLoading={isUploading}
                loadingText={
                  selectedItems.length > 1
                    ? `Saving ${currentUploadIdx + 1} of ${selectedItems.length}...`
                    : replacingImage
                    ? 'Replacing...'
                    : 'Saving to library...'
                }
                disabled={selectedItems.length === 0 || isUploading}
                leftIcon={<Save className="w-4 h-4" />}
              >
                {replacingImage
                  ? 'Confirm Replacement'
                  : selectedItems.length > 1
                  ? `Save ${selectedItems.length} Photos`
                  : 'Save Image'}
              </Button>
            </div>
          </div>
        )
      }
    >
      {uploadStep === 'success' && savedImage ? (
        /* STEP 2 VIEW: Redesigned Spacious Confirmation Screen */
        <div className="flex flex-col gap-4 py-1">
          {/* Clear Success Indicator */}
          <div className="p-3.5 sm:p-4 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-[8px] flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-[#15803D] dark:text-emerald-300 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-emerald-950 dark:text-emerald-200">
                {savedCount > 1
                  ? `${savedCount} Photographs Saved Successfully`
                  : 'Photograph Saved to Media Library'}
              </h4>
              <p className="text-xs text-emerald-800/90 dark:text-emerald-300/90 mt-0.5 leading-relaxed">
                Your photograph is safely stored on the server and is available in your media library.
              </p>
            </div>
          </div>

          {/* Actual Saved Image Preview Card */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-[8px] bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            {/* Thumbnail: Uses backend resolved URL with reliable local blob fallback */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[6px] overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 border border-slate-300 dark:border-slate-700 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={savedImage.previewUrl ? resolveImageUrl(savedImage.previewUrl) : (primaryItem?.previewUrl || '')}
                alt={savedImage.originalFileName || savedImage.projectWorkName || 'Saved photograph'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  if (primaryItem?.previewUrl && e.currentTarget.src !== primaryItem.previewUrl) {
                    e.currentTarget.src = primaryItem.previewUrl;
                  }
                }}
              />
            </div>

            {/* Image Details */}
            <div className="flex-1 min-w-0 text-center sm:text-left space-y-1.5 w-full">
              <p
                className="text-sm font-semibold text-[#172033] dark:text-white truncate"
                title={savedImage.originalFileName || savedImage.projectWorkName || ''}
              >
                {savedImage.originalFileName || savedImage.projectWorkName || 'Website Photograph'}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-[#475569] dark:text-[#94A3B8]">
                <span className="font-mono bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  {savedImage.width} × {savedImage.height} px
                </span>
                <span>•</span>
                <span className="font-medium">{formatBytes(savedImage.fileSize)}</span>
                {savedImage.category && (
                  <>
                    <span>•</span>
                    <span className="bg-slate-200/70 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">
                      Category: {savedImage.category}
                    </span>
                  </>
                )}
                {savedImage.slot && (
                  <>
                    <span>•</span>
                    <span className="text-[#315FEA] font-semibold text-[11px]">
                      Slot: {savedImage.slot}
                    </span>
                  </>
                )}
              </div>

              <p className="text-xs text-[#475569] dark:text-[#94A3B8] pt-1 leading-relaxed">
                You can keep this original photograph as-is, or optionally open Image Studio to enhance lighting, contrast, and web delivery.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* STEP 1 VIEW: Upload Form */
        <form id="image-upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-[6px] flex items-center gap-2.5 text-xs text-[#B91C1C] dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Replacement Reassurance Notice */}
          {replacingImage && (
            <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-[6px] text-xs text-blue-900 dark:text-blue-300">
              <div className="flex items-center gap-1.5 font-semibold text-[#1D4ED8] dark:text-blue-300">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Replacing: {replacingImage.slot || replacingImage.projectWorkName || 'Live Website Image'}</span>
              </div>
              <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] mt-1 leading-relaxed">
                Your currently published image remains live on your website until you review and explicitly publish this replacement.
              </p>
            </div>
          )}

          {/* Dropzone / File Picker */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-[8px] p-5 text-center cursor-pointer transition-colors flex flex-col items-center justify-center min-h-[160px] ${
              selectedItems.length > 0
                ? 'border-[#315FEA] bg-[#315FEA]/5'
                : 'border-[#CBD5E1] dark:border-[#334155] hover:border-[#315FEA] bg-[#F3F6FA] dark:bg-[#1E293B]/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple={isMultipleAllowed}
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleIncomingFiles(e.target.files);
                }
              }}
            />

            {selectedItems.length === 1 && primaryItem ? (
              /* Single File Preview */
              <div className="flex flex-col items-center gap-2 w-full">
                <div className="relative max-h-40 max-w-full rounded-[6px] overflow-hidden border border-[#CBD5E1] shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={primaryItem.previewUrl}
                    alt="Upload preview"
                    className="max-h-36 object-contain"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-[#172033] dark:text-white">
                  <FileCheck className="w-4 h-4 text-[#15803D]" />
                  <span className="truncate max-w-[200px] sm:max-w-xs">{primaryItem.file.name}</span>
                  <span className="text-[#475569] dark:text-[#94A3B8]">
                    ({primaryItem.width ? `${primaryItem.width} × ${primaryItem.height} px • ` : ''}
                    {formatBytes(primaryItem.file.size)})
                  </span>
                </div>
                <p className="text-[11px] text-[#315FEA]">Tap or drop another file to change</p>
              </div>
            ) : selectedItems.length > 1 ? (
              /* Multiple Files Preview List */
              <div className="w-full flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#172033] dark:text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#315FEA]" />
                    <span>{selectedItems.length} photos selected</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-[#315FEA] hover:underline font-medium"
                  >
                    + Add more photos
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-1">
                  {selectedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-[6px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.previewUrl}
                          alt="Thumb"
                          className="w-8 h-8 rounded object-cover shrink-0"
                        />
                        <div className="min-w-0 text-left">
                          <p className="truncate text-slate-800 dark:text-slate-200 font-medium">
                            {item.file.name}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {formatBytes(item.file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFileItem(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                        aria-label="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Empty Dropzone Prompt */
              <div className="flex flex-col items-center gap-2">
                <div className="w-11 h-11 rounded-[8px] bg-[#315FEA]/10 text-[#315FEA] flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#172033] dark:text-white">
                    Tap to choose photo or drag &amp; drop
                  </p>
                  <p className="text-xs text-[#475569] dark:text-[#94A3B8] mt-0.5">
                    JPG, PNG, or WebP up to 10 MB (Max 25 megapixels)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Metadata Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1">
                Project / Work Name (Optional)
              </label>
              <Input
                type="text"
                value={projectWorkName}
                onChange={(e) => setProjectWorkName(e.target.value)}
                placeholder="e.g. Modern Villa Kitchen"
              />
            </div>

            {slot ? (
              <div>
                <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1">
                  Target Website Slot
                </label>
                <Input
                  type="text"
                  readOnly
                  value={slot}
                  className="font-mono bg-[#F3F6FA] dark:bg-[#1E293B] text-[#475569] dark:text-slate-300"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1">
                  Work Category (Optional)
                </label>
                {!isCreatingCategory ? (
                  <div className="flex gap-2">
                    <Select
                      value={selectedCategory}
                      onChange={(e) => {
                        if (e.target.value === '__new__') {
                          setIsCreatingCategory(true);
                        } else {
                          setSelectedCategory(e.target.value);
                        }
                      }}
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                      <option value="__new__">+ Create New Category...</option>
                    </Select>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="New category name"
                      className="flex-1"
                    />
                    <Button variant="secondary" size="sm" type="button" onClick={handleCreateCategory}>
                      Add
                    </Button>
                    <Button variant="ghost" size="sm" type="button" onClick={() => setIsCreatingCategory(false)}>
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1">
              Caption / Descriptive Context (Optional)
            </label>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
              placeholder="Brief caption or finish details for your customers..."
              className="resize-none"
            />
          </div>
        </form>
      )}
    </Modal>
  );
}
