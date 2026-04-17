'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { 
  Check, Copy, Edit, Eye, FileText, FileVideo, 
  FolderOpen, Grid, Image as ImageIcon, List, 
  Loader2, Search, Trash2, Upload, X
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, Input, cn } from '../components/ui';
import { BulkActionBar, SelectCheckbox } from '../components/TableUtilities';
import { ModuleGuard } from '../components/ModuleGuard';
import { prepareImageForUpload, validateImageFile } from '@/lib/image/uploadPipeline';
import { resolveNamingContext } from '@/lib/image/uploadNaming';

const MODULE_KEY = 'media';
type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'image' | 'video' | 'document';

function formatBytes(bytes: number): string {
  if (bytes === 0) {return '0 B';}
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) {return ImageIcon;}
  if (mimeType.startsWith('video/')) {return FileVideo;}
  return FileText;
}

function getMimeTypeLabel(mimeType: string): string {
  if (mimeType.startsWith('image/')) {return 'Hình ảnh';}
  if (mimeType.startsWith('video/')) {return 'Video';}
  if (mimeType === 'application/pdf') {return 'PDF';}
  return 'Tài liệu';
}

export default function MediaPage() {
  return (
    <ModuleGuard moduleKey="media">
      <MediaContent />
    </ModuleGuard>
  );
}

function MediaContent() {
  const mediaData = useQuery(api.media.listWithUrls, { limit: 100 });
  const foldersData = useQuery(api.media.getFolders);
  const statsData = useQuery(api.media.getStats);
  const featuresData = useQuery(api.admin.modules.listModuleFeatures, { moduleKey: MODULE_KEY });
  
  const generateUploadUrl = useMutation(api.media.generateUploadUrl);
  const createMedia = useMutation(api.media.create);
  const removeMedia = useMutation(api.media.remove);
  const bulkRemoveMedia = useMutation(api.media.bulkRemove);

  // Check enabled features
  const enabledFeatures = useMemo(() => {
    const features: Record<string, boolean> = {};
    featuresData?.forEach(f => { features[f.featureKey] = f.enabled; });
    return features;
  }, [featuresData]);
  
  const showFolders = enabledFeatures.enableFolders ?? true;

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterFolder, setFilterFolder] = useState('');
  const [selectedIds, setSelectedIds] = useState<Id<"images">[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewMedia, setPreviewMedia] = useState<{
    _id: Id<"images">;
    _creationTime: number;
    storageId: Id<"_storage">;
    filename: string;
    mimeType: string;
    size: number;
    width?: number;
    height?: number;
    alt?: string;
    folder?: string;
    url: string | null;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const isLoading = mediaData === undefined;

  // Filter media
  const filteredMedia = useMemo(() => {
    if (!mediaData) {return [];}
    
    let data = [...mediaData];
    
    // Search filter
    if (searchTerm) {
      data = data.filter(m => m.filename.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    // Type filter
    if (filterType !== 'all') {
      data = data.filter(m => {
        if (filterType === 'image') {return m.mimeType.startsWith('image/');}
        if (filterType === 'video') {return m.mimeType.startsWith('video/');}
        if (filterType === 'document') {return m.mimeType === 'application/pdf' || m.mimeType.includes('document');}
        return true;
      });
    }
    
    // Folder filter
    if (filterFolder) {
      data = data.filter(m => m.folder === filterFolder);
    }
    
    return data;
  }, [mediaData, searchTerm, filterType, filterFolder]);

  // Selection handlers
  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === filteredMedia.length ? [] : filteredMedia.map(m => m._id));
  };

  const toggleSelectItem = (id: Id<"images">) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Upload handler with compression
  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) {return;}

    setIsUploading(true);
    setUploadProgress(0);

    const totalFiles = files.length;
    let uploadedCount = 0;

    try {
      for (const [fileIndex, file] of Array.from(files).entries()) {
        const validationError = validateImageFile(file, 10);
        if (validationError) {
          toast.error(`${file.name}: ${validationError}`);
          continue;
        }

        const resolvedNaming = resolveNamingContext(undefined, {
          entityName: 'media',
          field: 'upload',
          index: fileIndex + 1,
        });
        const prepared = await prepareImageForUpload(file, { naming: resolvedNaming });
        const uploadUrl = await generateUploadUrl();

        const response = await fetch(uploadUrl, {
          body: prepared.file,
          headers: { 'Content-Type': prepared.mimeType },
          method: 'POST',
        });

        if (!response.ok) {
          toast.error(`${file.name}: Upload thất bại`);
          continue;
        }

        const { storageId } = await response.json();

        await createMedia({
          filename: prepared.filename,
          folder: 'uploads',
          height: prepared.height,
          mimeType: prepared.mimeType,
          size: prepared.size,
          storageId: storageId as Id<"_storage">,
          width: prepared.width,
        });

        uploadedCount++;
        setUploadProgress(Math.round((uploadedCount / totalFiles) * 100));
      }

      toast.success(`Đã tải lên ${uploadedCount}/${totalFiles} file`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Có lỗi xảy ra khi tải lên');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (inputRef.current) {inputRef.current.value = '';}
    }
  }, [generateUploadUrl, createMedia]);

  // Delete handlers
  const handleDelete = async (id: Id<"images">) => {
    if (!confirm('Xóa file này? Thao tác không thể hoàn tác.')) {return;}
    
    try {
      await removeMedia({ id });
      setSelectedIds(prev => prev.filter(i => i !== id));
      toast.success('Đã xóa file');
    } catch {
      toast.error('Có lỗi khi xóa file');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Xóa ${selectedIds.length} file đã chọn? Thao tác không thể hoàn tác.`)) {return;}
    
    try {
      const count = await bulkRemoveMedia({ ids: selectedIds });
      setSelectedIds([]);
      toast.success(`Đã xóa ${count} file`);
    } catch {
      toast.error('Có lỗi khi xóa files');
    }
  };

  // Copy URL
  const handleCopyUrl = async (url: string | null, id: string) => {
    if (!url) {return;}
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() =>{  setCopiedId(null); }, 2000);
      toast.success('Đã copy URL');
    } catch {
      toast.error('Không thể copy URL');
    }
  };

  // Drop zone
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    void handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Thư viện Media</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {statsData?.totalCount ?? 0} files - {formatBytes(statsData?.totalSize ?? 0)}
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,video/*,application/pdf"
            onChange={(e) => void handleFileSelect(e.target.files)}
            className="hidden"
          />
          <Button 
            className="gap-2 bg-cyan-600 hover:bg-cyan-500" 
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {uploadProgress}%
              </>
            ) : (
              <>
                <Upload size={16} /> Tải lên
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      <BulkActionBar 
        selectedCount={selectedIds.length} 
        entityLabel="tệp"
        onDelete={handleBulkDelete} 
        onClearSelection={() =>{  setSelectedIds([]); }} 
      />

      {/* Filters */}
      <Card>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="Tìm kiếm..." 
                className="pl-9 w-[200px]" 
                value={searchTerm} 
                onChange={(e) =>{  setSearchTerm(e.target.value); }} 
              />
            </div>

            {/* Type filter */}
            <select 
              className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              value={filterType}
              onChange={(e) =>{  setFilterType(e.target.value as FilterType); }}
            >
              <option value="all">Tất cả loại</option>
              <option value="image">Hình ảnh ({statsData?.imageCount ?? 0})</option>
              <option value="video">Video ({statsData?.videoCount ?? 0})</option>
              <option value="document">Tài liệu ({statsData?.documentCount ?? 0})</option>
            </select>

            {/* Folder filter - only show if feature enabled */}
            {showFolders && foldersData && foldersData.length > 0 && (
              <select 
                className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                value={filterFolder}
                onChange={(e) =>{  setFilterFolder(e.target.value); }}
              >
                <option value="">Tất cả thư mục</option>
                {foldersData.map(folder => (
                  <option key={folder} value={folder}>{folder}</option>
                ))}
              </select>
            )}
          </div>

          {/* View mode */}
          <div className="flex gap-1 border border-slate-200 dark:border-slate-700 rounded-md p-1">
            <button
              onClick={() =>{  setViewMode('grid'); }}
              className={cn(
                'p-2 rounded transition-colors',
                viewMode === 'grid' ? 'bg-slate-100 dark:bg-slate-700 text-cyan-600' : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() =>{  setViewMode('list'); }}
              className={cn(
                'p-2 rounded transition-colors',
                viewMode === 'list' ? 'bg-slate-100 dark:bg-slate-700 text-cyan-600' : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Drop zone & Content */}
        <div 
          className="p-4"
          onDrop={handleDrop}
          onDragOver={(e) =>{  e.preventDefault(); }}
        >
          {filteredMedia.length === 0 ? (
            <div 
              className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-12 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              onClick={() => inputRef.current?.click()}
            >
              <Upload size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 mb-2">
                {searchTerm || filterType !== 'all' || filterFolder ? 'Không tìm thấy file phù hợp' : 'Chưa có file nào'}
              </p>
              <p className="text-sm text-slate-400">Kéo thả hoặc click để tải lên</p>
            </div>
          ) : (viewMode === 'grid' ? (
            // Grid View
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredMedia.map(media => {
                const FileIcon = getFileIcon(media.mimeType);
                const isImage = media.mimeType.startsWith('image/');
                const isSelected = selectedIds.includes(media._id);

                return (
                  <div 
                    key={media._id}
                    className={cn(
                      'relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all bg-white dark:bg-slate-800',
                      isSelected ? 'border-cyan-500 ring-2 ring-cyan-500/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    )}
                  >
                    {/* Thumbnail */}
                    <div 
                      className="relative aspect-square bg-slate-100 dark:bg-slate-700 flex items-center justify-center"
                      onClick={() =>{  toggleSelectItem(media._id); }}
                    >
                      {isImage && media.url ? (
                        <Image src={media.url} alt={media.filename} fill sizes="100%" className="object-cover" />
                      ) : (
                        <FileIcon size={40} className="text-slate-400" />
                      )}
                    </div>

                    {/* Selection checkbox */}
                    <div className={cn(
                      'absolute top-2 left-2 transition-opacity',
                      isSelected || 'opacity-0 group-hover:opacity-100'
                    )}>
                      <SelectCheckbox 
                        checked={isSelected} 
                        onChange={() =>{  toggleSelectItem(media._id); }} 
                      />
                    </div>

                    {/* Hover actions */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      {isImage && media.url && (
                        <button
                          className="p-1.5 bg-white dark:bg-slate-800 rounded shadow hover:bg-slate-50"
                          onClick={() =>{  setPreviewMedia(media); }}
                          title="Xem"
                        >
                          <Eye size={14} />
                        </button>
                      )}
                      <button
                        className="p-1.5 bg-white dark:bg-slate-800 rounded shadow hover:bg-slate-50"
                        onClick={ async () => handleCopyUrl(media.url, media._id)}
                        title="Copy URL"
                      >
                        {copiedId === media._id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                      <Link href={`/admin/media/${media._id}/edit`}>
                        <button className="p-1.5 bg-white dark:bg-slate-800 rounded shadow hover:bg-slate-50" title="Sửa">
                          <Edit size={14} />
                        </button>
                      </Link>
                      <button
                        className="p-1.5 bg-white dark:bg-slate-800 rounded shadow hover:bg-red-50 text-red-500"
                        onClick={ async () => handleDelete(media._id)}
                        title="Xóa"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Info */}
                    <div className="p-2">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{media.filename}</p>
                      <p className="text-xs text-slate-400">{formatBytes(media.size)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // List View
            <div className="space-y-2">
              {/* Select all */}
              <div className="flex items-center gap-3 px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <SelectCheckbox 
                  checked={selectedIds.length === filteredMedia.length && filteredMedia.length > 0} 
                  onChange={toggleSelectAll}
                  indeterminate={selectedIds.length > 0 && selectedIds.length < filteredMedia.length}
                />
                <span className="text-sm text-slate-500">Chọn tất cả</span>
              </div>

              {filteredMedia.map(media => {
                const FileIcon = getFileIcon(media.mimeType);
                const isImage = media.mimeType.startsWith('image/');
                const isSelected = selectedIds.includes(media._id);

                return (
                  <div 
                    key={media._id}
                    className={cn(
                      'flex items-center gap-4 p-3 rounded-lg border transition-all',
                      isSelected ? 'border-cyan-500 bg-cyan-500/5' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    )}
                  >
                    <SelectCheckbox checked={isSelected} onChange={() =>{  toggleSelectItem(media._id); }} />
                    
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                      {isImage && media.url ? (
                        <Image src={media.url} alt={media.filename} width={48} height={48} className="w-full h-full object-cover" />
                      ) : (
                        <FileIcon size={24} className="text-slate-400" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{media.filename}</p>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span>{getMimeTypeLabel(media.mimeType)}</span>
                        <span>{formatBytes(media.size)}</span>
                        {media.width && media.height && (
                          <span>{media.width}x{media.height}</span>
                        )}
                        {showFolders && media.folder && (
                          <Badge variant="secondary" className="text-xs">
                            <FolderOpen size={12} className="mr-1" />
                            {media.folder}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {media.url && (
                        <a
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          href={media.url}
                          rel="noreferrer"
                          target="_blank"
                          title="Mở tab mới"
                        >
                          <Eye size={16} className="text-slate-400" />
                        </a>
                      )}
                      <button
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        onClick={ async () => handleCopyUrl(media.url, media._id)}
                        title="Copy URL"
                      >
                        {copiedId === media._id ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-slate-400" />}
                      </button>
                      <Link href={`/admin/media/${media._id}/edit`}>
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors" title="Sửa">
                          <Edit size={16} className="text-slate-400" />
                        </button>
                      </Link>
                      <button
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        onClick={ async () => handleDelete(media._id)}
                        title="Xóa"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        {filteredMedia.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-500">
            Hiển thị {filteredMedia.length} / {mediaData?.length ?? 0} files
          </div>
        )}
      </Card>

      {/* Preview Modal */}
      {previewMedia && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() =>{  setPreviewMedia(null); }}
        >
          <button 
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            onClick={() =>{  setPreviewMedia(null); }}
          >
            <X size={24} className="text-white" />
          </button>
          <Image 
            src={previewMedia.url ?? ''} 
            alt={previewMedia.filename} 
            width={previewMedia.width ?? 1200}
            height={previewMedia.height ?? 900}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) =>{  e.stopPropagation(); }}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur px-4 py-2 rounded-lg text-white text-sm">
            {previewMedia.filename} - {formatBytes(previewMedia.size)}
            {previewMedia.width && previewMedia.height && ` - ${previewMedia.width}x${previewMedia.height}`}
          </div>
        </div>
      )}
    </div>
  );
}

