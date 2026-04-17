'use client';

import React from 'react';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Label } from '../../../components/ui';
import { CategoryImageSelector } from '../../../components/CategoryImageSelector';
import type { CategoryConfigItem } from '../_types';

export const ProductCategoriesForm = ({
  productCategoriesItems,
  setProductCategoriesItems,
  productCategoriesColsDesktop,
  setProductCategoriesColsDesktop,
  productCategoriesColsMobile,
  setProductCategoriesColsMobile,
  productCategoriesShowCount,
  setProductCategoriesShowCount,
  productCategoriesData,
  brandColor,
}: {
  productCategoriesItems: CategoryConfigItem[];
  setProductCategoriesItems: (items: CategoryConfigItem[]) => void;
  productCategoriesColsDesktop: number;
  setProductCategoriesColsDesktop: (value: number) => void;
  productCategoriesColsMobile: number;
  setProductCategoriesColsMobile: (value: number) => void;
  productCategoriesShowCount: boolean;
  setProductCategoriesShowCount: (value: boolean) => void;
  productCategoriesData: { _id: string; name: string; image?: string }[];
  brandColor: string;
}) => {
  const categoryIdCounts = productCategoriesItems.reduce<Record<string, number>>((acc, item) => {
    if (!item.categoryId) {return acc;}
    acc[item.categoryId] = (acc[item.categoryId] || 0) + 1;
    return acc;
  }, {});
  const duplicateCategoryIds = new Set(
    Object.entries(categoryIdCounts)
      .filter(([, count]) => count > 1)
      .map(([id]) => id)
  );
  const duplicateCount = duplicateCategoryIds.size;
  const handleRemoveDuplicates = () => {
    const seen = new Set<string>();
    const deduped = productCategoriesItems.filter((item) => {
      if (!item.categoryId) {return true;}
      if (seen.has(item.categoryId)) {return false;}
      seen.add(item.categoryId);
      return true;
    });
    setProductCategoriesItems(deduped);
  };

  return (
  <>
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-base">Cấu hình hiển thị</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Số cột (Desktop)</Label>
            <select
              value={productCategoriesColsDesktop}
              onChange={(e) =>{  setProductCategoriesColsDesktop(Number.parseInt(e.target.value)); }}
              className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
            >
              <option value={3}>3 cột</option>
              <option value={4}>4 cột</option>
              <option value={5}>5 cột</option>
              <option value={6}>6 cột</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Số cột (Mobile)</Label>
            <select
              value={productCategoriesColsMobile}
              onChange={(e) =>{  setProductCategoriesColsMobile(Number.parseInt(e.target.value)); }}
              className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
            >
              <option value={2}>2 cột</option>
              <option value={3}>3 cột</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="showProductCount"
            checked={productCategoriesShowCount}
            onChange={(e) =>{  setProductCategoriesShowCount(e.target.checked); }}
            className="w-4 h-4 rounded border-slate-300"
          />
          <Label htmlFor="showProductCount" className="cursor-pointer">Hiển thị số lượng sản phẩm</Label>
        </div>
      </CardContent>
    </Card>

    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Chọn danh mục ({productCategoriesItems.length})</CardTitle>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => {
            const newId = Math.max(0, ...productCategoriesItems.map(c => c.id)) + 1;
            setProductCategoriesItems([...productCategoriesItems, { categoryId: '', customImage: '', id: newId }]);
          }}
          disabled={productCategoriesItems.length >= 12 || !productCategoriesData?.length}
          className="gap-2"
        >
          <Plus size={14} /> Thêm
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {duplicateCount > 0 && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                ⚠️ Có {duplicateCount} danh mục bị trùng lặp. Trang chủ chỉ hiển thị mỗi danh mục 1 lần.
              </div>
              <button
                type="button"
                className="text-amber-900 underline underline-offset-4"
                onClick={handleRemoveDuplicates}
              >
                Xóa trùng lặp
              </button>
            </div>
          </div>
        )}
        {!productCategoriesData?.length ? (
          <p className="text-sm text-slate-500 text-center py-4">
            Chưa có danh mục sản phẩm. Vui lòng tạo danh mục trước.
          </p>
        ) : (productCategoriesItems.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            Chưa chọn danh mục nào. Nhấn &quot;Thêm&quot; để bắt đầu.
          </p>
        ) : (
          productCategoriesItems.map((item, idx) => (
            <div key={item.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical size={16} className="text-slate-400 cursor-move" />
                  <Label>Danh mục {idx + 1}</Label>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="text-red-500 h-8 w-8" 
                  onClick={() =>{  setProductCategoriesItems(productCategoriesItems.filter(c => c.id !== item.id)); }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500">Danh mục</Label>
                  <select
                    value={item.categoryId}
                    onChange={(e) =>{  setProductCategoriesItems(productCategoriesItems.map(c => c.id === item.id ? {...c, categoryId: e.target.value} : c)); }}
                    className={`w-full h-9 rounded-md border bg-white dark:bg-slate-900 px-3 text-sm ${duplicateCategoryIds.has(item.categoryId) ? 'border-amber-400' : 'border-slate-200 dark:border-slate-700'}`}
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {productCategoriesData?.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                  {duplicateCategoryIds.has(item.categoryId) && (
                    <p className="text-xs text-amber-700">Danh mục này bị trùng, trang chủ sẽ chỉ hiển thị 1 lần.</p>
                  )}
                </div>
                
                {item.categoryId && (
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-500">Hình ảnh hiển thị</Label>
                    <CategoryImageSelector
                      value={item.customImage || ''}
                      onChange={(value, mode) =>{  setProductCategoriesItems(productCategoriesItems.map(c => c.id === item.id ? {...c, customImage: value, imageMode: mode} : c)); }}
                      categoryId={item.categoryId}
                      categoryImage={productCategoriesData?.find(cat => cat._id === item.categoryId)?.image}
                      brandColor={brandColor}
                    />
                  </div>
                )}
              </div>
            </div>
          ))
        ))}
        
        <p className="text-xs text-slate-500">
          Tối đa 12 danh mục. Mỗi danh mục có thể: sử dụng ảnh gốc, chọn icon, upload ảnh, hoặc nhập URL.
        </p>
      </CardContent>
    </Card>
  </>
  );
};
