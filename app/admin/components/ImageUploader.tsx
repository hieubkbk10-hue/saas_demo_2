'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ImageOff, Loader2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button, cn } from './ui';
import { prepareImageForUpload, validateImageFile } from '@/lib/image/uploadPipeline';
import { resolveNamingContext, type ImageNamingContext } from '@/lib/image/uploadNaming';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string | undefined, storageId?: Id<'_storage'>) => void;
  storageId?: Id<'_storage'>;
  folder?: string;
  naming?: ImageNamingContext;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
  quality?: number;
  deleteMode?: 'immediate' | 'defer';
}

export function ImageUploader({
  value,
  onChange,
  storageId,
  folder = 'general',
  naming,
  className,
  aspectRatio = 'auto',
  quality = 0.85,
  deleteMode = 'immediate',
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(value);
  const [hasError, setHasError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const saveImage = useMutation(api.storage.saveImage);
  const deleteImage = useMutation(api.storage.deleteImage);
  
  const [currentStorageId, setCurrentStorageId] = useState<Id<'_storage'> | undefined>();

  // Sync preview with value prop when it changes
  useEffect(() => {
    setPreview(value);
    setHasError(false);
    setCurrentStorageId(storageId);
  }, [value, storageId]);

  const handleFileSelect = useCallback(async (file: File) => {
    const validationError = validateImageFile(file, 5);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsUploading(true);

    try {
      const resolvedNaming = resolveNamingContext(naming, { entityName: folder, field: 'image', index: 1 });
      const prepared = await prepareImageForUpload(file, { quality, naming: resolvedNaming });
      const uploadUrl = await generateUploadUrl();

      const response = await fetch(uploadUrl, {
        body: prepared.file,
        headers: { 'Content-Type': prepared.mimeType },
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { storageId } = await response.json();

      const result = await saveImage({
        filename: prepared.filename,
        folder,
        height: prepared.height,
        mimeType: prepared.mimeType,
        size: prepared.size,
        storageId: storageId as Id<"_storage">,
        width: prepared.width,
      });

      setPreview(result.url ?? undefined);
      setCurrentStorageId(storageId as Id<'_storage'>);
      onChange(result.url ?? undefined, storageId as Id<'_storage'>);
      toast.success('Tải ảnh lên thành công');

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Không thể tải ảnh lên');
    } finally {
      setIsUploading(false);
    }
  }, [generateUploadUrl, saveImage, folder, quality, onChange, naming]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {void handleFileSelect(file);}
  }, [handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {void handleFileSelect(file);}
  }, [handleFileSelect]);

  const handleRemove = useCallback(async () => {
    if (deleteMode === 'immediate' && currentStorageId) {
      try {
        await deleteImage({ storageId: currentStorageId as Id<"_storage"> });
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
    setPreview(undefined);
    setCurrentStorageId(undefined);
    onChange(undefined, undefined);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [currentStorageId, deleteImage, onChange]);

  const aspectClasses = {
    auto: 'min-h-[160px]',
    square: 'aspect-square',
    video: 'aspect-video',
  };

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />
      
      {preview ? (
        <div className={cn('relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700', aspectClasses[aspectRatio])}>
          {!hasError ? (
            <Image
              src={preview}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              className="object-cover"
              onError={() => setHasError(true)}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <ImageOff size={24} />
              <span className="text-xs">Ảnh lỗi</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={handleRemove}
              className="h-10 w-10"
            >
              <Trash2 size={18} />
            </Button>
          </div>
          {isUploading && (
            <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-blue-500" />
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) =>{  e.preventDefault(); }}
          className={cn(
            'border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors',
            aspectClasses[aspectRatio],
            isUploading && 'pointer-events-none'
          )}
        >
          {isUploading ? (
            <Loader2 size={24} className="animate-spin text-slate-400 mb-2" />
          ) : (
            <Upload size={24} className="text-slate-400 mb-2" />
          )}
          <span className="text-sm text-slate-500">
            {isUploading ? 'Đang tải lên...' : 'Kéo thả hoặc click để tải lên'}
          </span>
          <span className="text-xs text-slate-400 mt-1">PNG, JPG tối đa 5MB</span>
        </div>
      )}
    </div>
  );
}

// Simple version without database tracking (for Lexical editor)
export async function uploadImageToStorage(
  file: File,
  generateUploadUrl: () => Promise<string>,
  quality: number = 0.85
): Promise<{ storageId: string; url: string }> {
  const prepared = await prepareImageForUpload(file, { quality });

  const uploadUrl = await generateUploadUrl();
  const response = await fetch(uploadUrl, {
    body: prepared.file,
    headers: { 'Content-Type': prepared.mimeType },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  const { storageId } = await response.json();
  return { storageId, url: '' };
}

