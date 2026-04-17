import React, { useState } from 'react';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '../../../components/ui';
import type { CategoryProductsSection } from '../_types';

interface CategoryProductsFormProps {
  sections: CategoryProductsSection[];
  setSections: (sections: CategoryProductsSection[]) => void;
  columnsDesktop: number;
  setColumnsDesktop: (value: number) => void;
  columnsMobile: number;
  setColumnsMobile: (value: number) => void;
  showViewAll: boolean;
  setShowViewAll: (value: boolean) => void;
  categoriesData: { _id: string; name: string }[];
}

export const CategoryProductsForm = ({
  sections,
  setSections,
  columnsDesktop,
  setColumnsDesktop,
  columnsMobile,
  setColumnsMobile,
  showViewAll,
  setShowViewAll,
  categoriesData,
}: CategoryProductsFormProps) => {
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  const addSection = () => {
    if (!categoriesData || categoriesData.length === 0) {return;}
    const newId = Math.max(0, ...sections.map(s => s.id)) + 1;
    setSections([...sections, { categoryId: '', id: newId, itemCount: 4 }]);
  };

  const removeSection = (id: number) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const updateSection = (id: number, updates: Partial<CategoryProductsSection>) => {
    setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s));
  };

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

    const newSections = [...sections];
    const draggedIndex = newSections.findIndex(s => s.id === draggedId);
    const targetIndex = newSections.findIndex(s => s.id === targetId);

    const [draggedItem] = newSections.splice(draggedIndex, 1);
    newSections.splice(targetIndex, 0, draggedItem);

    setSections(newSections);
    setDraggedId(null);
    setDragOverId(null);
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
                value={columnsDesktop}
                onChange={(e) =>{  setColumnsDesktop(Number.parseInt(e.target.value)); }}
                className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
              >
                <option value={3}>3 cột</option>
                <option value={4}>4 cột</option>
                <option value={5}>5 cột</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Số cột (Mobile)</Label>
              <select
                value={columnsMobile}
                onChange={(e) =>{  setColumnsMobile(Number.parseInt(e.target.value)); }}
                className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
              >
                <option value={1}>1 cột</option>
                <option value={2}>2 cột</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="showViewAll"
              checked={showViewAll}
              onChange={(e) =>{  setShowViewAll(e.target.checked); }}
              className="w-4 h-4 rounded border-slate-300"
            />
            <Label htmlFor="showViewAll" className="cursor-pointer">Hiển thị nút “Xem danh mục”</Label>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Các section danh mục ({sections.length})</CardTitle>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={addSection}
            disabled={sections.length >= 6 || categoriesData.length === 0}
            className="gap-2"
          >
            <Plus size={14} /> Thêm
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {categoriesData.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              Chưa có danh mục sản phẩm. Vui lòng tạo danh mục trước.
            </p>
          ) : (sections.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              Chưa có section nào. Nhấn &quot;Thêm&quot; để bắt đầu.
            </p>
          ) : (
            sections.map((item, idx) => (
              <div 
                key={item.id} 
                draggable
                onDragStart={() =>{  handleDragStart(item.id); }}
                onDragEnd={handleDragEnd}
                onDragOver={(e) =>{  handleDragOver(e, item.id); }}
                onDrop={(e) =>{  handleDrop(e, item.id); }}
                className={cn(
                  'p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3 transition-all',
                  draggedId === item.id && 'opacity-50 scale-[0.98]',
                  dragOverId === item.id && 'ring-2 ring-blue-500 ring-offset-2'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical size={16} className="text-slate-400 cursor-grab active:cursor-grabbing" />
                    <Label className="font-semibold">Section {idx + 1}</Label>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="text-red-500 h-8 w-8" 
                    onClick={() =>{  removeSection(item.id); }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-500">Danh mục</Label>
                    <select
                      value={item.categoryId}
                      onChange={(e) =>{  updateSection(item.id, { categoryId: e.target.value }); }}
                      className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
                    >
                      <option value="">-- Chọn danh mục --</option>
                      {categoriesData.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-slate-500">Số sản phẩm hiển thị</Label>
                    <Input
                      type="number"
                      min={2}
                      max={12}
                      value={item.itemCount}
                      onChange={(e) =>{  updateSection(item.id, { itemCount: Number.parseInt(e.target.value) || 4 }); }}
                    />
                  </div>
                </div>
              </div>
            ))
          ))}

          <p className="text-xs text-slate-500">
            Tối đa 6 section. Mỗi section là 1 danh mục với các sản phẩm thuộc danh mục đó.
          </p>
        </CardContent>
      </Card>
    </>
  );
};
