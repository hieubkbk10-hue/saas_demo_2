'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ArrowLeft, Check, Copy, ExternalLink, FileText, FileVideo, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '../../../components/ui';

const MODULE_KEY = 'media';

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

export default function MediaEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const mediaData = useQuery(api.media.getByIdWithUrl, { id: id as Id<"images"> });
  const foldersData = useQuery(api.media.getFolders);
  const featuresData = useQuery(api.admin.modules.listModuleFeatures, { moduleKey: MODULE_KEY });
  const updateMedia = useMutation(api.media.update);
  const removeMedia = useMutation(api.media.remove);

  // Check enabled features
  const enabledFeatures = useMemo(() => {
    const features: Record<string, boolean> = {};
    featuresData?.forEach(f => { features[f.featureKey] = f.enabled; });
    return features;
  }, [featuresData]);
  
  const showFolders = enabledFeatures.enableFolders ?? true;
  const showAltText = enabledFeatures.enableAltText ?? true;

  const [filename, setFilename] = useState('');
  const [alt, setAlt] = useState('');
  const [folder, setFolder] = useState('');
  const [newFolder, setNewFolder] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync form with data
  useEffect(() => {
    if (mediaData) {
      setFilename(mediaData.filename);
      setAlt(mediaData.alt ?? '');
      setFolder(mediaData.folder ?? '');
    }
  }, [mediaData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filename.trim()) {
      toast.error('Tên file không được để trống');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalFolder = newFolder.trim() || folder;
      await updateMedia({
        alt: alt.trim() || undefined,
        filename: filename.trim(),
        folder: finalFolder || undefined,
        id: id as Id<"images">,
      });
      toast.success('Cập nhật thành công');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể cập nhật');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Xóa file này? Thao tác không thể hoàn tác.')) {return;}
    
    try {
      await removeMedia({ id: id as Id<"images"> });
      toast.success('Đã xóa file');
      router.push('/admin/media');
    } catch {
      toast.error('Có lỗi khi xóa file');
    }
  };

  const handleCopyUrl = async () => {
    if (!mediaData?.url) {return;}
    try {
      await navigator.clipboard.writeText(mediaData.url);
      setCopied(true);
      setTimeout(() =>{  setCopied(false); }, 2000);
      toast.success('Đã copy URL');
    } catch {
      toast.error('Không thể copy URL');
    }
  };

  if (mediaData === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-cyan-500" />
      </div>
    );
  }

  if (mediaData === null) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">Không tìm thấy file</p>
        <Link href="/admin/media">
          <Button variant="outline">Quay lại thư viện</Button>
        </Link>
      </div>
    );
  }

  const FileIcon = getFileIcon(mediaData.mimeType);
  const isImage = mediaData.mimeType.startsWith('image/');
  const isVideo = mediaData.mimeType.startsWith('video/');

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/media">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Media</h1>
            <p className="text-sm text-slate-500">Cập nhật thông tin file</p>
          </div>
        </div>
        <Button 
          variant="destructive" 
          className="gap-2"
          onClick={handleDelete}
        >
          <Trash2 size={16} /> Xóa
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Preview */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File preview */}
                <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  {isImage && mediaData.url ? (
                    <Image src={mediaData.url} alt={alt || filename} fill sizes="100%" className="object-contain" />
                  ) : (isVideo && mediaData.url ? (
                    <video src={mediaData.url} controls className="w-full h-full object-contain" />
                  ) : (
                    <FileIcon size={64} className="text-slate-400" />
                  ))}
                </div>

                {/* File info */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Loại file:</span>
                    <Badge variant="secondary">{mediaData.mimeType}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kích thước:</span>
                    <span className="font-medium">{formatBytes(mediaData.size)}</span>
                  </div>
                  {mediaData.width && mediaData.height && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Độ phân giải:</span>
                      <span className="font-medium">{mediaData.width} x {mediaData.height}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ngày tải lên:</span>
                    <span className="font-medium">
                      {new Date(mediaData._creationTime).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>

                {/* URL */}
                {mediaData.url && (
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-500">URL</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={mediaData.url} 
                        readOnly 
                        className="text-xs font-mono"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon"
                        onClick={handleCopyUrl}
                      >
                        {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                      </Button>
                      <a href={mediaData.url} target="_blank" rel="noopener noreferrer">
                        <Button type="button" variant="outline" size="icon">
                          <ExternalLink size={16} />
                        </Button>
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Thông tin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filename */}
                <div className="space-y-2">
                  <Label>Tên file <span className="text-red-500">*</span></Label>
                  <Input 
                    value={filename} 
                    onChange={(e) =>{  setFilename(e.target.value); }} 
                    required
                    placeholder="image.jpg"
                  />
                </div>

                {/* Alt text - only show if feature enabled */}
                {showAltText && (
                  <div className="space-y-2">
                    <Label>Alt text (SEO)</Label>
                    <Input 
                      value={alt} 
                      onChange={(e) =>{  setAlt(e.target.value); }}
                      placeholder="Mô tả hình ảnh cho SEO và accessibility"
                    />
                    <p className="text-xs text-slate-500">
                      Mô tả ngắn gọn nội dung hình ảnh, hỗ trợ SEO và người dùng screen reader
                    </p>
                  </div>
                )}

                {/* Folder - only show if feature enabled */}
                {showFolders && (
                  <>
                    <div className="space-y-2">
                      <Label>Thư mục</Label>
                      <div className="flex gap-2">
                        <select 
                          value={folder}
                          onChange={(e) => {
                            setFolder(e.target.value);
                            setNewFolder('');
                          }}
                          className="flex-1 h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                        >
                          <option value="">Không có thư mục</option>
                          {foldersData?.map(f => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* New folder */}
                    <div className="space-y-2">
                      <Label>Hoặc tạo thư mục mới</Label>
                      <Input 
                        value={newFolder} 
                        onChange={(e) => {
                          setNewFolder(e.target.value);
                          if (e.target.value) {setFolder('');}
                        }}
                        placeholder="Tên thư mục mới"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <Link href="/admin/media">
                <Button type="button" variant="ghost">Hủy</Button>
              </Link>
              <Button 
                type="submit" 
                className="bg-cyan-600 hover:bg-cyan-500"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin mr-2" />}
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
