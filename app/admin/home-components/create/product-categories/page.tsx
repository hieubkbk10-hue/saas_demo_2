'use client';

import React, { useState } from 'react';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button, Card, CardContent, CardHeader, CardTitle, Label, cn } from '../../../components/ui';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { ProductCategoriesPreview } from '../../product-categories/_components/ProductCategoriesPreview';
import type { ProductCategoriesBrandMode, ProductCategoriesStyle } from '../../product-categories/_types';
import { CategoryImageSelector } from '../../../components/CategoryImageSelector';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';

interface CategoryItem {
  id: number;
  categoryId: string;
  customImage?: string;
  imageMode?: 'product-image' | 'default' | 'icon' | 'upload' | 'url';
}

export default function ProductCategoriesCreatePage() {
  const COMPONENT_TYPE = 'ProductCategories';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Danh mục sản phẩm', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const brandMode: ProductCategoriesBrandMode = mode === 'single' ? 'single' : 'dual';
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const categoriesData = useQuery(api.productCategories.listActive);
  
  const [selectedCategories, setSelectedCategories] = useState<CategoryItem[]>([]);
  const [style, setStyle] = useState<ProductCategoriesStyle>('grid');
  const [showProductCount, setShowProductCount] = useState(true);
  const [columnsDesktop, setColumnsDesktop] = useState(4);
  const [columnsMobile, setColumnsMobile] = useState(2);

  // Drag & Drop states
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  const addCategory = () => {
    if (!categoriesData || categoriesData.length === 0) {return;}
    const newId = Math.max(0, ...selectedCategories.map(c => c.id)) + 1;
    setSelectedCategories([...selectedCategories, { categoryId: '', id: newId }]);
  };

  const removeCategory = (id: number) => {
    setSelectedCategories(selectedCategories.filter(c => c.id !== id));
  };

  const updateCategory = (id: number, updates: Partial<CategoryItem>) => {
    setSelectedCategories(selectedCategories.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  // Drag & Drop handlers
  const handleDragStart = (id: number) => {
    setDraggedId(id);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragOver = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    if (draggedId !== id) {
      setDragOverId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {return;}
    
    const newItems = [...selectedCategories];
    const draggedIndex = newItems.findIndex(i => i.id === draggedId);
    const targetIndex = newItems.findIndex(i => i.id === targetId);
    
    const [moved] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, moved);
    
    setSelectedCategories(newItems);
    setDraggedId(null);
    setDragOverId(null);
  };

  // Get category image for preview
  const getCategoryImage = (categoryId: string) => {
    const cat = availableCategories.find(c => c._id === categoryId);
    return cat?.image;
  };

  const onSubmit = (e: React.FormEvent) => {
    void handleSubmit(e, {
      categories: selectedCategories.map(c => ({ 
        categoryId: c.categoryId, 
        customImage: c.customImage,
        imageMode: c.imageMode ?? 'default',
      })),
      columnsDesktop,
      columnsMobile,
      showProductCount,
      style,
    });
  };

  const availableCategories = categoriesData ?? [];

  return (
    <ComponentFormWrapper
      type={COMPONENT_TYPE}
      title={title}
      setTitle={setTitle}
      active={active}
      setActive={setActive}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      customState={customState}
      showCustomBlock={showCustomBlock}
      setCustomState={setCustomState}
      systemColors={systemColors}
      customFontState={customFontState}
      showFontCustomBlock={showFontCustomBlock}
      setCustomFontState={setCustomFontState}
    >
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Cấu hình hiển thị</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Số cột (Desktop)</Label>
              <select
                value={columnsDesktop}
                onChange={(e) =>{  setColumnsDesktop(Number.parseInt(e.target.value)); }}
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
                value={columnsMobile}
                onChange={(e) =>{  setColumnsMobile(Number.parseInt(e.target.value)); }}
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
              checked={showProductCount}
              onChange={(e) =>{  setShowProductCount(e.target.checked); }}
              className="w-4 h-4 rounded border-slate-300"
            />
            <Label htmlFor="showProductCount" className="cursor-pointer">Hiển thị số lượng sản phẩm</Label>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Chọn danh mục ({selectedCategories.length})</CardTitle>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={addCategory}
            disabled={selectedCategories.length >= 12 || availableCategories.length === 0}
            className="gap-2"
          >
            <Plus size={14} /> Thêm
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {availableCategories.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              Chưa có danh mục sản phẩm. Vui lòng tạo danh mục trước.
            </p>
          ) : (selectedCategories.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              Chưa chọn danh mục nào. Nhấn &quot;Thêm&quot; để bắt đầu.
            </p>
          ) : (
            selectedCategories.map((item, idx) => (
              <div 
                key={item.id} 
                draggable
                onDragStart={() =>{  handleDragStart(item.id); }}
                onDragEnd={handleDragEnd}
                onDragOver={(e) =>{  handleDragOver(e, item.id); }}
                onDrop={(e) =>{  handleDrop(e, item.id); }}
                className={cn(
                  "p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3 transition-all",
                  draggedId === item.id && "opacity-50",
                  dragOverId === item.id && "ring-2 ring-blue-500"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical size={16} className="text-slate-400 cursor-grab active:cursor-grabbing" />
                    <Label>Danh mục {idx + 1}</Label>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="text-red-500 h-8 w-8" 
                    onClick={() =>{  removeCategory(item.id); }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-500">Danh mục</Label>
                    <select
                      value={item.categoryId}
                      onChange={(e) =>{  updateCategory(item.id, { categoryId: e.target.value }); }}
                      className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
                    >
                      <option value="">-- Chọn danh mục --</option>
                      {availableCategories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {item.categoryId && (
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-500">Hình ảnh hiển thị</Label>
                      <CategoryImageSelector
                        value={item.customImage ?? ''}
                        onChange={(value, mode) =>{  updateCategory(item.id, { customImage: value, imageMode: mode }); }}
                        categoryImage={getCategoryImage(item.categoryId)}
                        categoryId={item.categoryId}
                        brandColor={primary}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))
          ))}
          
          <p className="text-xs text-slate-500">
            Tối đa 12 danh mục. Kéo thả để sắp xếp thứ tự. Mỗi danh mục có thể: chọn ảnh từ sản phẩm, sử dụng ảnh gốc, chọn icon, upload ảnh, hoặc nhập URL.
          </p>
        </CardContent>
      </Card>

      <ProductCategoriesPreview 
        config={{
          categories: selectedCategories,
          columnsDesktop,
          columnsMobile,
          showProductCount,
          style,
        }}
        brandColor={primary}
        secondary={secondary}
        mode={brandMode}
        selectedStyle={style}
        onStyleChange={setStyle}
        categoriesData={availableCategories}
        fontStyle={fontStyle}
        fontClassName="font-active"
      />
    </ComponentFormWrapper>
  );
}
