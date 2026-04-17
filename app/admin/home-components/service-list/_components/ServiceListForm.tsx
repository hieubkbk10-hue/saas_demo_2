'use client';

import React from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import { Briefcase, Check, GripVertical, Search, X } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '../../../components/ui';
import type { ServiceSelectionMode } from '../_types';

export interface ServiceListFormItem {
  _id: string;
  title: string;
  excerpt?: string;
  thumbnail?: string;
  views?: number;
}

export const ServiceListForm = ({
  selectionMode,
  onSelectionModeChange,
  itemCount,
  sortBy,
  onItemCountChange,
  onSortByChange,
  filteredServices,
  selectedServices,
  selectedServiceIds,
  onToggleService,
  serviceSearchTerm,
  onServiceSearchTermChange,
  warningMessages,
}: {
  selectionMode: ServiceSelectionMode;
  onSelectionModeChange: (mode: ServiceSelectionMode) => void;
  itemCount: number;
  sortBy: string;
  onItemCountChange: (count: number) => void;
  onSortByChange: (value: string) => void;
  filteredServices: ServiceListFormItem[];
  selectedServices: ServiceListFormItem[];
  selectedServiceIds: string[];
  onToggleService: (id: string) => void;
  serviceSearchTerm: string;
  onServiceSearchTermChange: (value: string) => void;
  warningMessages?: string[];
}) => {
  return (
    <Card className="mb-6">
      <CardHeader><CardTitle className="text-base">Nguồn dữ liệu</CardTitle></CardHeader>
      <CardContent className="space-y-4">
      {/* Selection Mode Toggle */}
      <div className="space-y-2">
        <Label>Chế độ chọn dịch vụ</Label>
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
            ? 'Hiển thị dịch vụ tự động theo số lượng và sắp xếp' 
            : 'Chọn từng dịch vụ cụ thể để hiển thị'}
        </p>
      </div>

      {warningMessages && warningMessages.length > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 space-y-1">
          {warningMessages.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}

      {/* Auto mode settings */}
      {selectionMode === 'auto' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Số lượng hiển thị</Label>
            <Input type="number" value={itemCount} onChange={(e) =>{  onItemCountChange(Number.parseInt(e.target.value) || 8); }} />
          </div>
          <div className="space-y-2">
            <Label>Sắp xếp theo</Label>
            <select className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" value={sortBy} onChange={(e) =>{  onSortByChange(e.target.value); }}>
              <option value="newest">Mới nhất</option>
              <option value="popular">Xem nhiều nhất</option>
              <option value="random">Ngẫu nhiên</option>
            </select>
          </div>
        </div>
      )}

      {/* Manual mode - Service selector */}
      {selectionMode === 'manual' && (
        <div className="space-y-4">
          {/* Selected services list */}
          {selectedServices.length > 0 && (
            <div className="space-y-2">
              <Label>Dịch vụ đã chọn ({selectedServices.length})</Label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {selectedServices.map((service, index) => (
                  <div 
                    key={service._id} 
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg group"
                  >
                    <div className="text-slate-400 cursor-move">
                      <GripVertical size={16} />
                    </div>
                    <span className="w-6 h-6 flex items-center justify-center bg-blue-500 text-white text-xs rounded-full font-medium">
                      {index + 1}
                    </span>
                    {service.thumbnail ? (
                      <Image src={service.thumbnail} alt="" width={48} height={48} className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center">
                        <Briefcase size={16} className="text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{service.title}</p>
                      <p className="text-xs text-slate-500">{service.views} lượt xem</p>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-slate-400 hover:text-red-500"
                      onClick={() =>{  onToggleService(service._id); }}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search and add services */}
          <div className="space-y-2">
            <Label>Thêm dịch vụ</Label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="Tìm kiếm dịch vụ..." 
                className="pl-9"
                value={serviceSearchTerm}
                onChange={(e) =>{  onServiceSearchTermChange(e.target.value); }}
              />
            </div>
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg max-h-[250px] overflow-y-auto">
              {filteredServices.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  Không tìm thấy dịch vụ
                </div>
              ) : (
                filteredServices.map(service => {
                  const isSelected = selectedServiceIds.includes(service._id);
                  return (
                    <div 
                      key={service._id}
                      onClick={() =>{  onToggleService(service._id); }}
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
                      {service.thumbnail ? (
                        <Image src={service.thumbnail} alt="" width={40} height={40} className="w-10 h-10 object-cover rounded" />
                      ) : (
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center">
                          <Briefcase size={14} className="text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{service.title}</p>
                        <p className="text-xs text-slate-500">{service.views} lượt xem</p>
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
};

