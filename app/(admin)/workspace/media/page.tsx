'use client';

import React, { useState } from 'react';
import { useBusiness } from '@/components/admin/providers/BusinessProvider';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/admin/ui/Card';
import { Badge } from '@/components/admin/ui/Badge';
import { Button } from '@/components/admin/ui/Button';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { Image as ImageIcon, Upload, Sparkles, Folder, CheckCircle2 } from 'lucide-react';

interface MediaAsset {
  id: string;
  title: string;
  category: string;
  url: string;
  uploadedAt: string;
}

export default function MediaPage() {
  const { activeBusiness } = useBusiness();

  // Initial business media assets (scoped to this business context)
  const [mediaList, setMediaList] = useState<MediaAsset[]>([
    {
      id: 'm1',
      title: 'Modern Modular Kitchen Island',
      category: 'Kitchens',
      url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=600&auto=format&fit=crop',
      uploadedAt: '2026-08-15',
    },
    {
      id: 'm2',
      title: 'Luxury Walk-in Wardrobe Suite',
      category: 'Wardrobes',
      url: 'https://images.unsplash.com/photo-1558882224-dda166733046?q=80&w=600&auto=format&fit=crop',
      uploadedAt: '2026-08-15',
    },
    {
      id: 'm3',
      title: 'Acoustic uPVC Sliding Door Installation',
      category: 'uPVC Windows',
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop',
      uploadedAt: '2026-08-16',
    },
  ]);

  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  if (!activeBusiness) return null;

  const categories = ['All', 'Kitchens', 'Wardrobes', 'uPVC Windows', 'Living'];

  const filteredMedia = filterCategory === 'All'
    ? mediaList
    : mediaList.filter((m) => m.category === filterCategory);

  const handleSimulatedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setTimeout(() => {
      const file = files[0];
      const newAsset: MediaAsset = {
        id: `m_${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        category: filterCategory === 'All' ? 'Portfolio' : filterCategory,
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString().split('T')[0],
      };
      setMediaList((prev) => [newAsset, ...prev]);
      setIsUploading(false);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Business Media Library</h2>
            <Badge variant="purple">Tenant Isolated</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Image-first media asset management for <span className="font-semibold text-slate-800">{activeBusiness.name}</span>.
          </p>
        </div>

        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleSimulatedUpload}
            className="hidden"
            id="media-upload-input"
            disabled={isUploading}
          />
          <label htmlFor="media-upload-input">
            <span className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>{isUploading ? 'Uploading Image...' : 'Upload Media Asset'}</span>
            </span>
          </label>
        </div>
      </div>

      {uploadSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>New media asset uploaded and scoped to {activeBusiness.name}.</span>
        </div>
      )}

      {/* Category Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterCategory === cat
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Media Grid */}
      {filteredMedia.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredMedia.map((item) => (
            <Card key={item.id} hover className="overflow-hidden p-0 flex flex-col">
              <div className="relative aspect-video bg-slate-100 overflow-hidden group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2">
                  <Badge variant="purple" className="bg-slate-900/80 text-white border-none backdrop-blur-sm">
                    {item.category}
                  </Badge>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 line-clamp-1">{item.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Uploaded {item.uploadedAt}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Scoped to Tenant</span>
                  <span className="font-mono">{item.id}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ImageIcon}
          title="No Media Assets Found"
          description={`No media assets have been uploaded for ${filterCategory} yet.`}
          actionLabel="Upload Media"
          onAction={() => document.getElementById('media-upload-input')?.click()}
        />
      )}

      {/* Future AI Image Enhancement Architecture Note */}
      <Card className="border-dashed border-brand-200 bg-brand-50/30">
        <div className="flex items-start space-x-3">
          <Sparkles className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-brand-950">Future AI Media Architecture</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              In future platform phases, uploaded business media will connect to AI Gateway transformations (automatic background enhancement, aspect ratio adaptation, tag generation) once AI provider configurations are active.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
