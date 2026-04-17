'use client';

import React from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import { Check, GripVertical, Package, Search, X } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '../../../components/ui';
import type { ProductGridSortBy } from '../_types';

export interface ProductGridProductItem {
  _id: string;
  name: string;
  image?: string | null;
  price?: number | null;
  salePrice?: number | null;
  hasVariants?: boolean;
}

export const ProductGridForm = ({
  itemCount,
  setItemCount,
  sortBy,
  setSortBy,
  selectionMode,
  setSelectionMode,
  selectedProductIds,
  setSelectedProductIds,
  subTitle,
  setSubTitle,
  sectionTitle,
  setSectionTitle,
  productSearchTerm,
  setProductSearchTerm,
  selectedProducts,
  filteredProducts,
  isLoading,
}: {
  itemCount: number;
  setItemCount: (value: number) => void;
  sortBy: ProductGridSortBy;
  setSortBy: (value: ProductGridSortBy) => void;
  selectionMode: 'auto' | 'manual';
  setSelectionMode: (value: 'auto' | 'manual') => void;
  selectedProductIds: string[];
  setSelectedProductIds: React.Dispatch<React.SetStateAction<string[]>>;
  subTitle: string;
  setSubTitle: (value: string) => void;
  sectionTitle: string;
  setSectionTitle: (value: string) => void;
  productSearchTerm: string;
  setProductSearchTerm: (value: string) => void;
  selectedProducts: ProductGridProductItem[];
  filteredProducts: ProductGridProductItem[];
  isLoading: boolean;
}) => {
  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Cấu hình hiển thị</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tiêu đề phụ (badge)</Label>
              <Input
                value={subTitle}
                onChange={(e) =>{  setSubTitle(e.target.value); }}
                placeholder="VD: Bộ sưu tập, Sản phẩm hot..."
              />
            </div>
            <div className="space-y-2">
              <Label>Tiêu đề chính</Label>
              <Input
                value={sectionTitle}
                onChange={(e) =>{  setSectionTitle(e.target.value); }}
                placeholder="VD: Sản phẩm nổi bật, Bán chạy nhất..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Nguồn dữ liệu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Chế độ chọn sản phẩm</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>{  setSelectionMode('auto'); }}
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
                onClick={() =>{  setSelectionMode('manual'); }}
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
                ? 'Hiển thị sản phẩm tự động theo số lượng và sắp xếp'
                : 'Chọn từng sản phẩm cụ thể để hiển thị'}
            </p>
          </div>

          {selectionMode === 'auto' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Số lượng hiển thị</Label>
                <Input
                  type="number"
                  value={itemCount}
                  onChange={(e) =>{  setItemCount(Number.parseInt(e.target.value) || 8); }}
                />
              </div>
              <div className="space-y-2">
                <Label>Sắp xếp theo</Label>
                <select
                  className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  value={sortBy}
                  onChange={(e) =>{  setSortBy(e.target.value as ProductGridSortBy); }}
                >
                  <option value="newest">Mới nhất</option>
                  <option value="bestseller">Bán chạy nhất</option>
                  <option value="random">Ngẫu nhiên</option>
                </select>
              </div>
            </div>
          )}

          {selectionMode === 'manual' && (
            <div className="space-y-4">
              {selectedProducts.length > 0 && (
                <div className="space-y-2">
                  <Label>Sản phẩm đã chọn ({selectedProducts.length})</Label>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {selectedProducts.map((product, index) => (
                      <div
                        key={product._id}
                        className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg group"
                      >
                        <div className="text-slate-400 cursor-move"><GripVertical size={16} /></div>
                        <span className="w-6 h-6 flex items-center justify-center bg-blue-500 text-white text-xs rounded-full font-medium">{index + 1}</span>
                        {product.image ? (
                          <Image src={product.image} alt="" width={48} height={48} className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center"><Package size={16} className="text-slate-400" /></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <p className="text-xs text-slate-500">{product.price?.toLocaleString('vi-VN')}đ</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-500"
                          onClick={() =>{  setSelectedProductIds(ids => ids.filter(id => id !== product._id)); }}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Thêm sản phẩm</Label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Tìm kiếm sản phẩm..."
                    className="pl-9"
                    value={productSearchTerm}
                    onChange={(e) =>{  setProductSearchTerm(e.target.value); }}
                  />
                </div>
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg max-h-[250px] overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">
                      {isLoading ? 'Đang tải...' : 'Không tìm thấy sản phẩm'}
                    </div>
                  ) : (
                    filteredProducts.map(product => {
                      const isSelected = selectedProductIds.includes(product._id);
                      return (
                        <div
                          key={product._id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedProductIds(ids => ids.filter(id => id !== product._id));
                            } else {
                              setSelectedProductIds(ids => [...ids, product._id]);
                            }
                          }}
                          className={cn(
                            "flex items-center gap-3 p-3 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors",
                            isSelected ? "bg-blue-50 dark:bg-blue-500/10" : "hover:bg-slate-50 dark:hover:bg-slate-800"
                          )}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                            isSelected ? "border-blue-500 bg-blue-500" : "border-slate-300 dark:border-slate-600"
                          )}>
                            {isSelected && <Check size={12} className="text-white" />}
                          </div>
                          {product.image ? (
                            <Image src={product.image} alt="" width={40} height={40} className="w-10 h-10 object-cover rounded" />
                          ) : (
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center"><Package size={14} className="text-slate-400" /></div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{product.name}</p>
                            <p className="text-xs text-slate-500">{product.price?.toLocaleString('vi-VN')}đ</p>
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
    </>
  );
};

