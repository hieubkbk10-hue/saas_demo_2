'use client';

import React from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import { Check, FileText, GripVertical, Search, X } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '../../../components/ui';

export interface BlogPostItem {
  _id: string;
  _creationTime: number;
  title: string;
  slug?: string;
  excerpt?: string;
  thumbnail?: string;
  categoryId?: string;
  categoryName?: string;
  publishedAt?: number;
  status?: string;
  views?: number;
}

export const BlogForm = ({
  selectionMode,
  onSelectionModeChange,
  itemCount,
  sortBy,
  onConfigChange,
  selectedPosts,
  selectedPostIds,
  onTogglePost,
  searchTerm,
  onSearchTermChange,
  filteredPosts,
  isLoading,
}: {
  selectionMode: 'auto' | 'manual';
  onSelectionModeChange: (mode: 'auto' | 'manual') => void;
  itemCount: number;
  sortBy: 'newest' | 'popular' | 'random';
  onConfigChange: (config: { itemCount?: number; sortBy?: 'newest' | 'popular' | 'random' }) => void;
  selectedPosts: BlogPostItem[];
  selectedPostIds: string[];
  onTogglePost: (postId: string) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  filteredPosts: BlogPostItem[];
  isLoading: boolean;
}) => (
  <Card className="mb-6">
    <CardHeader><CardTitle className="text-base">Nguồn dữ liệu</CardTitle></CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Label>Chế độ chọn bài viết</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>{  onSelectionModeChange('auto'); }}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all",
              selectionMode === 'auto'
                ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
            )}
          >
            Tự động
          </button>
          <button
            type="button"
            onClick={() =>{  onSelectionModeChange('manual'); }}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all",
              selectionMode === 'manual'
                ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
            )}
          >
            Chọn thủ công
          </button>
        </div>
        <p className="text-xs text-slate-500">
          {selectionMode === 'auto' 
            ? 'Hiển thị bài viết tự động theo số lượng và sắp xếp' 
            : 'Chọn từng bài viết cụ thể để hiển thị'}
        </p>
      </div>

      {selectionMode === 'auto' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Số lượng hiển thị</Label>
            <Input
              type="number"
              value={itemCount}
              onChange={(e) =>{  onConfigChange({ itemCount: Number.parseInt(e.target.value) || 8 }); }}
            />
          </div>
          <div className="space-y-2">
            <Label>Sắp xếp theo</Label>
            <select
              className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              value={sortBy}
              onChange={(e) =>{  onConfigChange({ sortBy: e.target.value as 'newest' | 'popular' | 'random' }); }}
            >
              <option value="newest">Mới nhất</option>
              <option value="popular">Xem nhiều nhất</option>
              <option value="random">Ngẫu nhiên</option>
            </select>
          </div>
        </div>
      )}

      {selectionMode === 'manual' && (
        <div className="space-y-4">
          {selectedPosts.length > 0 && (
            <div className="space-y-2">
              <Label>Bài viết đã chọn ({selectedPosts.length})</Label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {selectedPosts.map((post, index) => (
                  <div 
                    key={post._id} 
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg group"
                  >
                    <div className="text-slate-400 cursor-move">
                      <GripVertical size={16} />
                    </div>
                    <span className="w-6 h-6 flex items-center justify-center bg-blue-500 text-white text-xs rounded-full font-medium">
                      {index + 1}
                    </span>
                    {post.thumbnail ? (
                      <Image src={post.thumbnail} alt="" width={48} height={48} className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center">
                        <FileText size={16} className="text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{post.title}</p>
                      <p className="text-xs text-slate-500">{new Date(post._creationTime).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-slate-400 hover:text-red-500"
                      onClick={() =>{  onTogglePost(post._id); }}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Thêm bài viết</Label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="Tìm kiếm bài viết..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) =>{  onSearchTermChange(e.target.value); }}
              />
            </div>
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg max-h-[250px] overflow-y-auto">
              {filteredPosts.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  {isLoading ? 'Đang tải...' : 'Không tìm thấy bài viết'}
                </div>
              ) : (
                filteredPosts.map(post => {
                  const isSelected = selectedPostIds.includes(post._id);
                  return (
                    <div 
                      key={post._id}
                      onClick={() =>{  onTogglePost(post._id); }}
                      className={cn(
                        "flex items-center gap-3 p-3 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors",
                        isSelected 
                          ? "bg-blue-50 dark:bg-blue-500/10" 
                          : "hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                        isSelected 
                          ? "border-blue-500 bg-blue-500" 
                          : "border-slate-300 dark:border-slate-600"
                      )}>
                        {isSelected && <Check size={12} className="text-white" />}
                      </div>
                      {post.thumbnail ? (
                        <Image src={post.thumbnail} alt="" width={40} height={40} className="w-10 h-10 object-cover rounded" />
                      ) : (
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center">
                          <FileText size={14} className="text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{post.title}</p>
                        <p className="text-xs text-slate-500">{post.views} lượt xem</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);

