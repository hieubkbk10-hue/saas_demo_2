'use client';

import type { DragEvent } from 'react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { GripVertical, Image as ImageIcon, Link, Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, cn } from './ui';
import { prepareImageForUpload, type ImageCropSelection, validateImageFile } from '@/lib/image/uploadPipeline';
import { resolveNamingContext, type ImageNamingContext } from '@/lib/image/uploadNaming';
import {
  DEFAULT_PRODUCT_IMAGE_ASPECT_RATIO,
  getProductImageAspectRatioCssValue,
  getProductImageAspectRatioValue,
  type ProductImageAspectRatio,
} from '@/lib/products/image-aspect-ratio';
export interface ImageItem {
  id: string | number;
  url: string;
  storageId?: Id<'_storage'>;
  [key: string]: unknown; // Allow extra fields like link, title, etc.
}

interface MultiImageUploaderProps<T extends ImageItem> {
  items: T[];
  onChange: (items: T[]) => void;
  folder?: string;
  naming?: ImageNamingContext;
  className?: string;
  imageKey?: keyof T; // Which field contains the image URL (default: 'url')
  extraFields?: {
    key: keyof T;
    placeholder: string;
    type?: 'text' | 'url';
  }[];
  maxItems?: number;
  minItems?: number;
  aspectRatio?: 'square' | 'video' | 'banner' | 'auto';
  imageAspectRatio?: ProductImageAspectRatio;
  columns?: 1 | 2 | 3 | 4;
  showReorder?: boolean;
  addButtonText?: string;
  emptyText?: string;
  layout?: 'horizontal' | 'vertical'; // Vertical: image on top, fields below (better for cards)
  enableCrop?: boolean;
  cropAspectRatio?: ProductImageAspectRatio;
  deleteMode?: 'immediate' | 'defer';
  namingIndexOffset?: number;
}

const CROP_VIEW_MAX_SIZE = 320;

export function MultiImageUploader<T extends ImageItem>({
  items,
  onChange,
  folder = 'home-components',
  naming,
  className,
  imageKey = 'url' as keyof T,
  extraFields = [],
  maxItems = 20,
  minItems = 1,
  aspectRatio = 'video',
  imageAspectRatio,
  columns = 1,
  showReorder = true,
  addButtonText = 'Thêm ảnh',
  emptyText = 'Chưa có ảnh nào',
  layout = 'horizontal',
  enableCrop = false,
  cropAspectRatio = DEFAULT_PRODUCT_IMAGE_ASPECT_RATIO,
  deleteMode = 'immediate',
  namingIndexOffset = 0,
}: MultiImageUploaderProps<T>) {
  const itemsRef = useRef(items);
  const [uploadingIds, setUploadingIds] = useState<Set<string | number>>(new Set());
  const [urlModeIds, setUrlModeIds] = useState<Set<string | number>>(new Set());
  const [brokenIds, setBrokenIds] = useState<Set<string | number>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverItemId, setDragOverItemId] = useState<string | number | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | number | null>(null);
  const [fileDragOverItemId, setFileDragOverItemId] = useState<string | number | null>(null); // For file drops on specific items
  const [cropItemId, setCropItemId] = useState<string | number | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropPreviewUrl, setCropPreviewUrl] = useState<string | null>(null);
  const [cropScale, setCropScale] = useState(1);
  const [cropXPercent, setCropXPercent] = useState(0.5);
  const [cropYPercent, setCropYPercent] = useState(0.5);
  const [sourceDimensions, setSourceDimensions] = useState<{ width: number; height: number } | null>(null);
  const inputRefs = useRef<Map<string | number, HTMLInputElement>>(new Map());
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const saveImage = useMutation(api.storage.saveImage);
  const deleteImage = useMutation(api.storage.deleteImage);

  const markBroken = useCallback((itemId: string | number) => {
    setBrokenIds(prev => new Set(prev).add(itemId));
  }, []);

  const clearBroken = useCallback((itemId: string | number) => {
    setBrokenIds(prev => {
      if (!prev.has(itemId)) {
        return prev;
      }
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  }, []);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    return () => {
      if (cropPreviewUrl) {
        URL.revokeObjectURL(cropPreviewUrl);
      }
    };
  }, [cropPreviewUrl]);

  const aspectClasses = {
    auto: 'min-h-[100px]',
    banner: 'aspect-[3/1]',
    square: 'aspect-square',
    video: 'aspect-video',
  };

  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  };

  const resetCropState = useCallback(() => {
    if (cropPreviewUrl) {
      URL.revokeObjectURL(cropPreviewUrl);
    }
    setCropItemId(null);
    setCropFile(null);
    setCropPreviewUrl(null);
    setSourceDimensions(null);
    setCropScale(1);
    setCropXPercent(0.5);
    setCropYPercent(0.5);
  }, [cropPreviewUrl]);

  const openCropper = useCallback((itemId: string | number, file: File) => {
    if (cropPreviewUrl) {
      URL.revokeObjectURL(cropPreviewUrl);
    }
    setCropItemId(itemId);
    setCropFile(file);
    setCropPreviewUrl(URL.createObjectURL(file));
    setSourceDimensions(null);
    setCropScale(1);
    setCropXPercent(0.5);
    setCropYPercent(0.5);
  }, [cropPreviewUrl]);

  const handleFileUpload = useCallback(async (itemId: string | number, file: File, crop?: ImageCropSelection) => {
    const validationError = validateImageFile(file, 5);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setUploadingIds(prev => new Set(prev).add(itemId));

    try {
      const itemIndex = itemsRef.current.findIndex(item => item.id === itemId);
      const resolvedNaming = resolveNamingContext(naming, {
        entityName: folder,
        field: 'image',
        index: (itemIndex >= 0 ? itemIndex + 1 : itemsRef.current.length + 1) + namingIndexOffset,
      });
      const prepared = await prepareImageForUpload(file, crop ? { crop, naming: resolvedNaming } : { naming: resolvedNaming });
      const uploadUrl = await generateUploadUrl();

      const response = await fetch(uploadUrl, {
        body: prepared.file,
        headers: { 'Content-Type': prepared.mimeType },
        method: 'POST',
      });

      if (!response.ok) {throw new Error('Upload failed');}

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

      onChange(itemsRef.current.map(item => 
        item.id === itemId 
          ? { ...item, [imageKey]: result.url ?? '', storageId: storageId as Id<'_storage'> } as T
          : item
      ));
      clearBroken(itemId);

      toast.success('Tải ảnh lên thành công');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Không thể tải ảnh lên');
    } finally {
      setUploadingIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }, [generateUploadUrl, saveImage, folder, imageKey, onChange, clearBroken, naming, namingIndexOffset]);

  const handleSelectedFile = useCallback((itemId: string | number, file: File) => {
    const validationError = validateImageFile(file, 5);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (enableCrop) {
      openCropper(itemId, file);
      return;
    }

    void handleFileUpload(itemId, file);
  }, [enableCrop, openCropper, handleFileUpload]);

  const handleMultipleFiles = useCallback(async (files: FileList) => {
    const filesToUpload = [...files];
    if (filesToUpload.length === 0) {
      return;
    }

    if (enableCrop) {
      if (filesToUpload.length > 1) {
        toast.message('Đang bật cắt ảnh theo tỉ lệ: vui lòng chọn từng ảnh để cắt chính xác.');
      }
      const targetItem = items.find(item => !item[imageKey]);
      if (targetItem) {
        handleSelectedFile(targetItem.id, filesToUpload[0]);
        return;
      }

      if (items.length >= maxItems) {
        toast.error(`Đã đạt giới hạn ${maxItems} ảnh`);
        return;
      }

      const newItem = {
        id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 4)}`,
        [imageKey]: '',
      } as unknown as T;
      onChange([...items, newItem]);
      handleSelectedFile(newItem.id, filesToUpload[0]);
      return;
    }

    const firstEmptyItem = items.find(item => !item[imageKey]);
    if (firstEmptyItem) {
      const firstUploadPromise = handleFileUpload(firstEmptyItem.id, filesToUpload[0]);
      const remainingFiles = filesToUpload.slice(1);
      if (remainingFiles.length > 0) {
        const remainingSlots = maxItems - items.length;
        const filesToAdd = remainingFiles.slice(0, remainingSlots);

        if (filesToAdd.length > 0) {
          const newItems: T[] = filesToAdd.map((_, index) => ({
            id: `new-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 4)}`,
            [imageKey]: '',
          } as unknown as T));
          onChange([...items, ...newItems]);

          await Promise.all([firstUploadPromise, ...filesToAdd.map(async (file, i) => handleFileUpload(newItems[i].id, file))]);
          return;
        }
      }
      await firstUploadPromise;
      return;
    }

    const remainingSlots = maxItems - items.length;
    const filesToAdd = filesToUpload.slice(0, remainingSlots);

    if (filesToAdd.length < filesToUpload.length) {
      toast.warning(`Chỉ có thể thêm ${remainingSlots} ảnh nữa`);
    }

    if (filesToAdd.length === 0) {
      toast.error(`Đã đạt giới hạn ${maxItems} ảnh`);
      return;
    }

    const newItems: T[] = filesToAdd.map((_, index) => ({
      id: `new-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 4)}`,
      [imageKey]: '',
    } as unknown as T));

    onChange([...items, ...newItems]);
    await Promise.all(filesToAdd.map(async (file, i) => handleFileUpload(newItems[i].id, file)));
  }, [items, maxItems, imageKey, onChange, handleFileUpload, enableCrop, handleSelectedFile]);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set isDragging to false if leaving the container entirely
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
    setDragOverItemId(null);
  }, []);

  const handleDragOver = useCallback((e: DragEvent, itemId?: string | number) => {
    e.preventDefault();
    e.stopPropagation();
    if (itemId !== undefined) {
      setDragOverItemId(itemId);
    }
  }, []);

  const handleDrop = useCallback((e: DragEvent, itemId?: string | number) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragOverItemId(null);
    setFileDragOverItemId(null);
    
    const {files} = e.dataTransfer;
    if (files.length === 0) {return;}
    
    if (itemId !== undefined) {
      // Drop on specific item
      if (files[0]) {handleSelectedFile(itemId, files[0]);}
    } else {
      // Drop on container - add new items
      void handleMultipleFiles(files);
    }
  }, [handleSelectedFile, handleMultipleFiles]);

  // File drag handlers for individual items
  const handleItemFileDragEnter = useCallback((e: React.DragEvent, itemId: string | number) => {
    if (!e.dataTransfer.types.includes('Files')) {return;}
    e.preventDefault();
    e.stopPropagation();
    setFileDragOverItemId(itemId);
  }, []);

  const handleItemFileDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('Files')) {return;}
    e.preventDefault();
    e.stopPropagation();
    setFileDragOverItemId(null);
  }, []);

  const handleItemFileDragOver = useCallback((e: React.DragEvent, itemId: string | number) => {
    if (!e.dataTransfer.types.includes('Files')) {return;}
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setFileDragOverItemId(itemId);
  }, []);

  const handleItemFileDrop = useCallback((e: React.DragEvent, itemId: string | number) => {
    if (!e.dataTransfer.types.includes('Files')) {return;}
    e.preventDefault();
    e.stopPropagation();
    setFileDragOverItemId(null);
    setIsDragging(false);
    
    const {files} = e.dataTransfer;
    if (files.length > 0 && files[0]) {
      handleSelectedFile(itemId, files[0]);
    }
  }, [handleSelectedFile]);

  const handleUrlChange = useCallback((itemId: string | number, url: string) => {
    onChange(items.map(item => 
      item.id === itemId ? { ...item, [imageKey]: url, storageId: undefined } as T : item
    ));
    clearBroken(itemId);
  }, [items, imageKey, onChange, clearBroken]);

  const handleExtraFieldChange = useCallback((itemId: string | number, fieldKey: keyof T, value: string) => {
    onChange(items.map(item => 
      item.id === itemId ? { ...item, [fieldKey]: value } as T : item
    ));
  }, [items, onChange]);

  const handleRemove = useCallback(async (itemId: string | number) => {
    if (items.length <= minItems) {
      toast.error(`Cần tối thiểu ${minItems} mục`);
      return;
    }

    const item = items.find(i => i.id === itemId);
    if (deleteMode === 'immediate' && item?.storageId) {
      try {
        await deleteImage({ storageId: item.storageId as Id<"_storage"> });
      } catch (error) {
        console.error('Delete error:', error);
      }
    }

    onChange(items.filter(i => i.id !== itemId));
  }, [items, minItems, deleteImage, onChange, deleteMode]);

  const handleItemDragStart = useCallback((e: React.DragEvent, itemId: string | number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(itemId));
    setDraggedItemId(itemId);
  }, []);

  const handleItemDragEnd = useCallback(() => {
    setDraggedItemId(null);
    setDragOverItemId(null);
  }, []);

  const handleItemDragOver = useCallback((e: React.DragEvent, targetId: string | number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedItemId && draggedItemId !== targetId) {
      setDragOverItemId(targetId);
    }
  }, [draggedItemId]);

  const handleItemDrop = useCallback((e: React.DragEvent, targetId: string | number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedItemId || draggedItemId === targetId) {
      setDraggedItemId(null);
      setDragOverItemId(null);
      return;
    }

    const dragIndex = itemsRef.current.findIndex(item => item.id === draggedItemId);
    const dropIndex = itemsRef.current.findIndex(item => item.id === targetId);

    if (dragIndex === -1 || dropIndex === -1) {return;}

    const newItems = [...itemsRef.current];
    const [draggedItem] = newItems.splice(dragIndex, 1);
    newItems.splice(dropIndex, 0, draggedItem);
    onChange(newItems);

    setDraggedItemId(null);
    setDragOverItemId(null);
  }, [draggedItemId, onChange]);

  const handleAdd = useCallback(() => {
    if (items.length >= maxItems) {
      toast.error(`Tối đa ${maxItems} mục`);
      return;
    }
    const newItem = {
      id: `new-${Date.now()}`,
      [imageKey]: '',
      ...extraFields.reduce((acc, field) => ({ ...acc, [field.key]: '' }), {}),
    } as unknown as T;
    onChange([...items, newItem]);
  }, [items, maxItems, imageKey, extraFields, onChange]);

  const toggleUrlMode = useCallback((itemId: string | number) => {
    setUrlModeIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const inputId = `multi-image-input-${Math.random().toString(36).slice(2, 9)}`;
  const isCropOpen = Boolean(cropItemId !== null && cropFile && cropPreviewUrl);
  const cropRatioValue = getProductImageAspectRatioValue(cropAspectRatio);
  const resolvedImageAspectRatio = imageAspectRatio ? getProductImageAspectRatioCssValue(imageAspectRatio) : null;
  const cropFrame = {
    width: cropRatioValue >= 1 ? CROP_VIEW_MAX_SIZE : Math.round(CROP_VIEW_MAX_SIZE * cropRatioValue),
    height: cropRatioValue >= 1 ? Math.round(CROP_VIEW_MAX_SIZE / cropRatioValue) : CROP_VIEW_MAX_SIZE,
  };
  const renderedSize = sourceDimensions
    ? {
        width: sourceDimensions.width * Math.max(cropFrame.width / sourceDimensions.width, cropFrame.height / sourceDimensions.height) * cropScale,
        height: sourceDimensions.height * Math.max(cropFrame.width / sourceDimensions.width, cropFrame.height / sourceDimensions.height) * cropScale,
      }
    : null;
  const previewStyle = renderedSize
    ? {
        width: renderedSize.width,
        height: renderedSize.height,
        left: -(Math.max(0, renderedSize.width - cropFrame.width) * cropXPercent),
        top: -(Math.max(0, renderedSize.height - cropFrame.height) * cropYPercent),
      }
    : undefined;

  const handleConfirmCrop = async () => {
    if (cropItemId === null || !cropFile) {
      return;
    }

    await handleFileUpload(cropItemId, cropFile, {
      scale: cropScale,
      xPercent: cropXPercent,
      yPercent: cropYPercent,
      aspectRatio: cropAspectRatio,
    });
    resetCropState();
  };

  return (
    <>
    <div 
      ref={dropZoneRef}
      className={cn('space-y-4', className)}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={(e) =>{  handleDragOver(e); }}
      onDrop={(e) =>{  handleDrop(e); }}
    >
      {/* Drop zone for adding new images */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer",
          isDragging 
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]" 
            : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
        )}
        onClick={() => {
          const input = document.getElementById(inputId) as HTMLInputElement | null;
          input?.click();
        }}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => e.target.files && handleMultipleFiles(e.target.files)}
          className="hidden"
          id={inputId}
        />
        <Upload size={32} className={cn("mx-auto mb-3 transition-colors", isDragging ? "text-blue-500" : "text-slate-400")} />
        <p className={cn("text-sm font-medium", isDragging ? "text-blue-600" : "text-slate-600 dark:text-slate-300")}>
          {isDragging ? 'Thả ảnh vào đây!' : 'Kéo thả ảnh hoặc click để chọn'}
        </p>
        <p className="text-xs text-slate-400 mt-1">PNG, JPG, GIF - Tự động chuyển WebP</p>
      </div>

      {/* Items grid */}
      {items.length > 0 ? (
        <div className={cn('grid gap-4', columnClasses[columns])}>
          {items.map((item) => {
            const imageUrl = item[imageKey] as string;
            const isUploading = uploadingIds.has(item.id);
            const isUrlMode = urlModeIds.has(item.id);
            const isDraggedItem = draggedItemId === item.id;
            const isDragOverItem = dragOverItemId === item.id && draggedItemId !== null;
            const isFileDragOver = fileDragOverItemId === item.id;
            const isBroken = brokenIds.has(item.id);

            // Vertical layout - card style với ảnh trên, input bên dưới
            if (layout === 'vertical') {
              return (
                <div
                  key={item.id}
                  draggable={showReorder}
                  onDragStart={(e) =>{  handleItemDragStart(e, item.id); }}
                  onDragEnd={handleItemDragEnd}
                  onDragOver={(e) =>{  handleItemDragOver(e, item.id); }}
                  onDrop={(e) =>{  handleItemDrop(e, item.id); }}
                  className={cn(
                    "bg-slate-50 dark:bg-slate-800 rounded-lg overflow-hidden transition-all duration-200",
                    isDragOverItem && "ring-2 ring-blue-500 ring-offset-2 scale-[1.02]",
                    isDraggedItem && "opacity-50 scale-95",
                    showReorder && "cursor-grab active:cursor-grabbing"
                  )}
                >
                  {/* Image area */}
                  <div
                    className={cn(
                      'relative w-full rounded-t-lg overflow-hidden border-2 border-b-0 transition-all duration-200',
                      isFileDragOver 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                        : 'border-slate-200 dark:border-slate-700',
                      aspectClasses[aspectRatio],
                      !isUrlMode && 'cursor-pointer hover:border-blue-400'
                    )}
                    style={resolvedImageAspectRatio ? { aspectRatio: resolvedImageAspectRatio } : undefined}
                    onClick={() => !isUploading && !isUrlMode && inputRefs.current.get(item.id)?.click()}
                    onDragEnter={(e) =>{  handleItemFileDragEnter(e, item.id); }}
                    onDragLeave={handleItemFileDragLeave}
                    onDragOver={(e) =>{  handleItemFileDragOver(e, item.id); }}
                    onDrop={(e) =>{  handleItemFileDrop(e, item.id); }}
                  >
                    {imageUrl && !isBroken ? (
                      <Image
                        src={imageUrl}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, 320px"
                        className={cn("object-cover transition-opacity", isFileDragOver && "opacity-50")}
                        onError={() => markBroken(item.id)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-700">
                        <ImageIcon size={32} className="text-slate-400" />
                      </div>
                    )}
                    {isFileDragOver && (
                      <div className="absolute inset-0 bg-blue-500/20 flex flex-col items-center justify-center">
                        <Upload size={24} className="text-blue-600 mb-1" />
                        <span className="text-sm font-medium text-blue-600">Thả ảnh</span>
                      </div>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center">
                        <Loader2 size={24} className="animate-spin text-blue-500" />
                      </div>
                    )}
                    {/* Reorder & Delete buttons overlay */}
                    <div className="absolute top-2 left-2 right-2 flex justify-between">
                      {showReorder && (
                        <div className="bg-white/90 dark:bg-slate-800/90 rounded p-1">
                          <GripVertical size={16} className="text-slate-500" />
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 bg-white/90 dark:bg-slate-800/90 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={(e) => { e.stopPropagation(); void handleRemove(item.id); }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    <input
                      ref={(el) => { if (el) {inputRefs.current.set(item.id, el);} }}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleSelectedFile(item.id, file);
                        }
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </div>

                  {/* Bottom area: fields */}
                  <div className="p-3 space-y-2 border-2 border-t-0 border-slate-200 dark:border-slate-700 rounded-b-lg">
                    {/* Toggle URL mode - compact */}
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => isUrlMode && toggleUrlMode(item.id)}
                        className={cn(
                          'flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors',
                          !isUrlMode ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 hover:bg-slate-200'
                        )}
                      >
                        <Upload size={10} /> Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => !isUrlMode && toggleUrlMode(item.id)}
                        className={cn(
                          'flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors',
                          isUrlMode ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 hover:bg-slate-200'
                        )}
                      >
                        <Link size={10} /> URL
                      </button>
                    </div>
                    {isUrlMode && (
                      <Input
                        value={imageUrl}
                        onChange={(e) =>{  handleUrlChange(item.id, e.target.value); }}
                        placeholder="https://example.com/image.jpg"
                        className="h-8 text-sm"
                      />
                    )}
                    {extraFields.map((field) => (
                      <Input
                        key={String(field.key)}
                        value={String(item[field.key] || '')}
                        onChange={(e) =>{  handleExtraFieldChange(item.id, field.key, e.target.value); }}
                        placeholder={field.placeholder}
                        className="h-9 text-sm"
                      />
                    ))}
                  </div>
                </div>
              );
            }

            // Horizontal layout (default) - ảnh bên trái, fields bên phải
            return (
              <div
                key={item.id}
                draggable={showReorder}
                onDragStart={(e) =>{  handleItemDragStart(e, item.id); }}
                onDragEnd={handleItemDragEnd}
                onDragOver={(e) =>{  handleItemDragOver(e, item.id); }}
                onDrop={(e) =>{  handleItemDrop(e, item.id); }}
                className={cn(
                  "bg-slate-50 dark:bg-slate-800 rounded-lg p-3 space-y-3 transition-all duration-200",
                  isDragOverItem && "ring-2 ring-blue-500 ring-offset-2 scale-[1.02]",
                  isDraggedItem && "opacity-50 scale-95",
                  showReorder && "cursor-grab active:cursor-grabbing"
                )}
              >
                {/* Image preview / upload area */}
                <div className="flex gap-3">
                  {showReorder && (
                    <div className="flex flex-col justify-center">
                      <GripVertical size={18} className="text-slate-400 hover:text-slate-600" />
                    </div>
                  )}

                  {/* Image drop zone - supports drag & drop files */}
                  <div
                    className={cn(
                      'relative flex-shrink-0 w-32 rounded-lg overflow-hidden border-2 transition-all duration-200',
                      isFileDragOver 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 scale-105 shadow-lg' 
                        : 'border-slate-200 dark:border-slate-700',
                      aspectClasses[aspectRatio],
                      !isUrlMode && 'cursor-pointer hover:border-blue-400'
                    )}
                    style={resolvedImageAspectRatio ? { aspectRatio: resolvedImageAspectRatio } : undefined}
                    onClick={() => !isUploading && !isUrlMode && inputRefs.current.get(item.id)?.click()}
                    onDragEnter={(e) =>{  handleItemFileDragEnter(e, item.id); }}
                    onDragLeave={handleItemFileDragLeave}
                    onDragOver={(e) =>{  handleItemFileDragOver(e, item.id); }}
                    onDrop={(e) =>{  handleItemFileDrop(e, item.id); }}
                  >
                    {imageUrl && !isBroken ? (
                      <Image
                        src={imageUrl}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, 320px"
                        className={cn("object-cover transition-opacity", isFileDragOver && "opacity-50")}
                        onError={() => markBroken(item.id)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-700">
                        <ImageIcon size={24} className="text-slate-400" />
                      </div>
                    )}
                    {/* File drag overlay */}
                    {isFileDragOver && (
                      <div className="absolute inset-0 bg-blue-500/20 flex flex-col items-center justify-center">
                        <Upload size={20} className="text-blue-600 mb-1" />
                        <span className="text-xs font-medium text-blue-600">Thả ảnh</span>
                      </div>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center">
                        <Loader2 size={20} className="animate-spin text-blue-500" />
                      </div>
                    )}
                    <input
                      ref={(el) => { if (el) {inputRefs.current.set(item.id, el);} }}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleSelectedFile(item.id, file);
                        }
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    {/* Toggle URL mode */}
                    <div className="flex gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => isUrlMode && toggleUrlMode(item.id)}
                        className={cn(
                          'flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors',
                          !isUrlMode ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                        )}
                      >
                        <Upload size={12} /> Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => !isUrlMode && toggleUrlMode(item.id)}
                        className={cn(
                          'flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors',
                          isUrlMode ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                        )}
                      >
                        <Link size={12} /> URL
                      </button>
                    </div>

                    {isUrlMode && (
                      <Input
                        value={imageUrl}
                        onChange={(e) =>{  handleUrlChange(item.id, e.target.value); }}
                        placeholder="https://example.com/image.jpg"
                        className="h-8 text-sm"
                      />
                    )}

                    {/* Extra fields */}
                    {extraFields.map((field) => (
                      <Input
                        key={String(field.key)}
                        value={String(item[field.key] || '')}
                        onChange={(e) =>{  handleExtraFieldChange(item.id, field.key, e.target.value); }}
                        placeholder={field.placeholder}
                        className="h-8 text-sm"
                      />
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600 flex-shrink-0"
                    onClick={ async () => handleRemove(item.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500">{emptyText}</div>
      )}

      {/* Add button */}
      {items.length < maxItems && (
        <Button type="button" variant="outline" size="sm" onClick={handleAdd} className="w-full gap-2">
          <Plus size={14} /> {addButtonText}
        </Button>
      )}
    </div>

    <Dialog open={isCropOpen} onOpenChange={(open) => { if (!open) {resetCropState();} }}>
      <DialogContent className="max-w-[92vw] w-[560px]">
        <DialogHeader>
          <DialogTitle>Cắt ảnh theo tỉ lệ</DialogTitle>
          <DialogDescription>Điều chỉnh vùng cắt trước khi tải lên.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className="mx-auto relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
            style={{ height: cropFrame.height, width: cropFrame.width }}
          >
            {cropPreviewUrl && (
              <img
                src={cropPreviewUrl}
                alt="Crop preview"
                className="absolute max-w-none"
                style={previewStyle}
                onLoad={(event) => {
                  const image = event.currentTarget;
                  setSourceDimensions({
                    width: image.naturalWidth,
                    height: image.naturalHeight,
                  });
                }}
              />
            )}
          </div>

          <div className="space-y-3">
            <label className="block text-sm text-slate-600 dark:text-slate-300">
              Zoom ({cropScale.toFixed(1)}x)
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={cropScale}
                onChange={(e) => setCropScale(Number(e.target.value))}
                className="mt-1 w-full"
              />
            </label>
            <label className="block text-sm text-slate-600 dark:text-slate-300">
              Dịch ngang
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={cropXPercent}
                onChange={(e) => setCropXPercent(Number(e.target.value))}
                className="mt-1 w-full"
              />
            </label>
            <label className="block text-sm text-slate-600 dark:text-slate-300">
              Dịch dọc
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={cropYPercent}
                onChange={(e) => setCropYPercent(Number(e.target.value))}
                className="mt-1 w-full"
              />
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={resetCropState} disabled={uploadingIds.size > 0}>Hủy</Button>
          <Button type="button" variant="accent" onClick={() => { void handleConfirmCrop(); }} disabled={uploadingIds.size > 0 || !sourceDimensions}>
            {uploadingIds.size > 0 && <Loader2 size={16} className="animate-spin mr-2" />}
            Dùng ảnh đã cắt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

