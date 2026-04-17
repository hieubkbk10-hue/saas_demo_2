'use client';

import React from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import { ChevronLeft, ChevronRight, ImageIcon, Link as LinkIcon, Loader2, Plus, Upload } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, cn } from '../../../components/ui';
import type { ClientEditorItem } from '../_types';

interface ClientsFormProps {
  items: ClientEditorItem[];
  maxItems?: number;
  minItems?: number;
  uploadingId?: string | null;
  warningMessages?: string[];
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onUpdateItem: (id: string, field: keyof ClientEditorItem, value: string) => void;
  onToggleInputMode: (id: string) => void;
  onMoveItem: (idx: number, direction: -1 | 1) => void;
  onImageUpload: (itemId: string, file: File) => void;
}

export const ClientsForm = ({
  items,
  maxItems = 20,
  minItems = 3,
  uploadingId = null,
  warningMessages,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onToggleInputMode,
  onMoveItem,
  onImageUpload,
}: ClientsFormProps) => {
  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-sm font-medium">Logo khách hàng ({items.length}/{maxItems})</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddItem}
          disabled={items.length >= maxItems}
          className="h-7 text-xs gap-1"
        >
          <Plus size={12} /> Thêm
        </Button>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="group relative bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
            >
              <div className="absolute -top-1 -right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() =>{  onMoveItem(idx, -1); }}
                    className="w-5 h-5 bg-slate-600 text-white rounded text-[10px] hover:bg-slate-700"
                    aria-label="Di chuyển sang trái"
                  >
                    <ChevronLeft size={10} className="mx-auto" />
                  </button>
                )}

                {idx < items.length - 1 && (
                  <button
                    type="button"
                    onClick={() =>{  onMoveItem(idx, 1); }}
                    className="w-5 h-5 bg-slate-600 text-white rounded text-[10px] hover:bg-slate-700"
                    aria-label="Di chuyển sang phải"
                  >
                    <ChevronRight size={10} className="mx-auto" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>{  onRemoveItem(item.id); }}
                  className="w-5 h-5 bg-red-500 text-white rounded text-[10px] hover:bg-red-600"
                  aria-label="Xoá logo"
                >
                  ×
                </button>
              </div>

              <div className="mb-2">
                <div className="flex mb-1">
                  <button
                    type="button"
                    onClick={() =>{  onToggleInputMode(item.id); }}
                    className={cn(
                      'flex-1 text-[9px] py-0.5 rounded-l border transition-colors',
                      item.inputMode === 'upload'
                        ? 'bg-slate-600 text-white border-slate-600'
                        : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-600',
                    )}
                  >
                    Upload
                  </button>
                  <button
                    type="button"
                    onClick={() =>{  onToggleInputMode(item.id); }}
                    className={cn(
                      'flex-1 text-[9px] py-0.5 rounded-r border-t border-b border-r transition-colors',
                      item.inputMode === 'url'
                        ? 'bg-slate-600 text-white border-slate-600'
                        : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-600',
                    )}
                  >
                    URL
                  </button>
                </div>

                {item.inputMode === 'upload' ? (
                  <label className="block cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          onImageUpload(item.id, file);
                        }
                      }}
                    />
                    <div
                      className={cn(
                        'aspect-[3/2] rounded-md overflow-hidden border-2 border-dashed flex items-center justify-center transition-colors',
                        item.url
                          ? 'border-transparent'
                          : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500',
                      )}
                    >
                      {uploadingId === item.id ? (
                        <Loader2 size={20} className="animate-spin text-slate-400" />
                      ) : item.url ? (
                        <Image
                          src={item.url}
                          alt=""
                          width={300}
                          height={200}
                          className="w-full h-full object-contain bg-white dark:bg-slate-900"
                        />
                      ) : (
                        <div className="text-center p-1">
                          <Upload size={16} className="mx-auto text-slate-400 mb-0.5" />
                          <span className="text-[10px] text-slate-400">Click để upload</span>
                        </div>
                      )}
                    </div>
                  </label>
                ) : (
                  <div className="space-y-1">
                    <div className="relative">
                      <ImageIcon size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        placeholder="https://example.com/logo.png"
                        value={item.url}
                        onChange={(event) =>{  onUpdateItem(item.id, 'url', event.target.value); }}
                        className="h-6 text-xs pl-6 pr-2"
                      />
                    </div>
                    {item.url && (
                      <div className="aspect-[3/2] rounded-md overflow-hidden border bg-white dark:bg-slate-900 flex items-center justify-center">
                        <Image
                          src={item.url}
                          alt=""
                          width={300}
                          height={200}
                          className="w-full h-full object-contain"
                          onError={(event) => {
                            (event.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Input
                  placeholder="Tên"
                  value={item.name}
                  onChange={(event) =>{  onUpdateItem(item.id, 'name', event.target.value); }}
                  className="h-6 text-xs px-2"
                />
                <div className="relative">
                  <LinkIcon size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Link"
                    value={item.link}
                    onChange={(event) =>{  onUpdateItem(item.id, 'link', event.target.value); }}
                    className="h-6 text-xs pl-6 pr-2"
                  />
                </div>
              </div>

              <div className="absolute bottom-1 left-1 w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400">{idx + 1}</span>
              </div>
            </div>
          ))}
        </div>

        {items.length < minItems && (
          <p className="text-xs text-amber-600">⚠ Nên có ít nhất {minItems} logo để hiển thị đẹp hơn.</p>
        )}

        {warningMessages && warningMessages.length > 0 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 space-y-1">
            {warningMessages.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

