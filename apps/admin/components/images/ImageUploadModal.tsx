'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Plus,
  Loader2,
  FileCheck,
  Sparkles
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ImageDto } from './ImageStudioWorkspace';

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
  onOpenStudio?: (pending: PendingUploadData) => void;
  slot?: string | null;
  usageType?: 'WebsiteImage' | 'ExploreOurWork';
  replacingImage?: ImageDto | null;
  categories: WorkCategoryDto[];
  onCategoryCreated?: (newCat: WorkCategoryDto) => void;
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [projectWorkName, setProjectWorkName] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  // Clean up object URLs
  const cleanupPreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setLocalPreviewUrl(null);
    setDimensions(null);
  };

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      cleanupPreview();
      setProjectWorkName('');
      setCaption('');
      setSelectedCategory('');
      setIsCreatingCategory(false);
      setNewCatName('');
      setErrorMessage(null);
      setIsUploading(false);
    } else if (replacingImage) {
      setProjectWorkName(replacingImage.projectWorkName || '');
      setCaption(replacingImage.caption || '');
      setSelectedCategory(replacingImage.category || '');
    }
  }, [isOpen, replacingImage]);

  // Handle file selection and validation
  const handleFile = (file: File) => {
    setErrorMessage(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setErrorMessage('Unsupported format. Only JPG, PNG, and WebP images are supported.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(`File exceeds 10 MB maximum limit (${formatBytes(file.size)}).`);
      return;
    }

    cleanupPreview();

    const objUrl = URL.createObjectURL(file);
    previewUrlRef.current = objUrl;
    setLocalPreviewUrl(objUrl);
    setSelectedFile(file);

    // Measure decoded dimensions
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const totalPixels = w * h;

      if (totalPixels > MAX_DECODED_PIXELS) {
        setErrorMessage(
          `Image resolution exceeds maximum decoded limit of 25 megapixels (${Math.round(totalPixels / 1_000_000)} MP).`
        );
        setSelectedFile(null);
        cleanupPreview();
        return;
      }

      setDimensions({ width: w, height: h });
    };
    img.onerror = () => {
      setErrorMessage('Failed to decode image file. File may be corrupt.');
      setSelectedFile(null);
      cleanupPreview();
    };
    img.src = objUrl;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Please select an image file to upload.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    if (projectWorkName.trim()) {
      formData.append('projectWorkName', projectWorkName.trim());
    }
    if (caption.trim()) {
      formData.append('caption', caption.trim());
    }
    if (!slot && selectedCategory.trim()) {
      formData.append('category', selectedCategory.trim());
    }

    try {
      let res;
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

      if (res?.data) {
        onSuccess(res.data);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Upload failed. Please check file format and network connectivity.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={replacingImage ? `Replace Image: ${replacingImage.slot || replacingImage.projectWorkName || 'Source'}` : slot ? `Upload Image for Slot: ${slot}` : 'Upload Project Image'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {errorMessage && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-[6px] flex items-center gap-2.5 text-xs text-[#B91C1C] dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Dropzone / File Picker */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-[8px] p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center min-h-[180px] ${
            localPreviewUrl
              ? 'border-[#315FEA] bg-[#315FEA]/5'
              : 'border-[#CBD5E1] dark:border-[#334155] hover:border-[#315FEA] bg-[#F3F6FA] dark:bg-[#1E293B]/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />

          {localPreviewUrl && dimensions ? (
            <div className="flex flex-col items-center gap-2 w-full">
              <div className="relative max-h-48 max-w-full rounded-[6px] overflow-hidden border border-[#CBD5E1] shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={localPreviewUrl}
                  alt="Upload preview"
                  className="max-h-44 object-contain"
                />
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-[#172033] dark:text-white">
                <FileCheck className="w-4 h-4 text-[#15803D]" />
                <span>{selectedFile?.name}</span>
                <span className="text-[#475569] dark:text-[#94A3B8]">
                  ({dimensions.width} × {dimensions.height} px • {formatBytes(selectedFile?.size || 0)})
                </span>
              </div>
              <p className="text-[11px] text-[#315FEA]">Click or drop another file to replace</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-[#315FEA]/10 text-[#315FEA] flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#172033] dark:text-white">
                  Click to select or drag and drop image
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
            <input
              type="text"
              value={projectWorkName}
              onChange={(e) => setProjectWorkName(e.target.value)}
              placeholder="e.g. Modern Villa Kitchen"
              className="w-full px-3 py-2 text-xs rounded-[6px] border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#172033] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#1D4ED8]"
            />
          </div>

          {slot ? (
            <div>
              <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1">
                Target Website Slot
              </label>
              <input
                type="text"
                readOnly
                value={slot}
                className="w-full px-3 py-2 text-xs rounded-[6px] border border-[#CBD5E1] dark:border-[#334155] bg-[#F3F6FA] dark:bg-[#1E293B] text-[#475569] dark:text-slate-300 font-mono"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1">
                Work Category (Optional)
              </label>
              {!isCreatingCategory ? (
                <div className="flex gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      if (e.target.value === '__new__') {
                        setIsCreatingCategory(true);
                      } else {
                        setSelectedCategory(e.target.value);
                      }
                    }}
                    className="flex-1 px-3 py-2 text-xs rounded-[6px] border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#172033] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#1D4ED8]"
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    <option value="__new__">+ Create New Category...</option>
                  </select>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="New category name"
                    className="flex-1 px-3 py-2 text-xs rounded-[6px] border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#172033] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#1D4ED8]"
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
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={2}
            placeholder="Brief caption or finish details for your customers..."
            className="w-full px-3 py-2 text-xs rounded-[6px] border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#172033] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#1D4ED8] resize-none"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#E3E7ED] dark:border-[#1E293B]">
          <div>
            {selectedFile && dimensions && localPreviewUrl && onOpenStudio && (
              <Button
                variant="studio"
                size="md"
                type="button"
                onClick={() => {
                  onOpenStudio({
                    file: selectedFile,
                    previewUrl: localPreviewUrl,
                    dimensions,
                    slot,
                    usageType: slot ? 'WebsiteImage' : usageType,
                    projectWorkName: projectWorkName.trim(),
                    caption: caption.trim(),
                    category: !slot && selectedCategory.trim() ? selectedCategory.trim() : undefined,
                    replacingImageId: replacingImage?.id,
                  });
                  onClose();
                }}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Enhance in Studio
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="md" type="button" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              isLoading={isUploading}
              loadingText={replacingImage ? 'Replacing...' : 'Uploading...'}
              disabled={!selectedFile}
              leftIcon={<Upload className="w-4 h-4" />}
            >
              {replacingImage ? 'Confirm Replacement' : 'Upload Image'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
