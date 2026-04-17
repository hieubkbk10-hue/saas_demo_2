'use client';

import React from 'react';
import { GripVertical, Plus, Star, Trash2, User } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '../../../components/ui';
import type { TestimonialsItem } from '../_types';

interface TestimonialsFormProps {
  items: TestimonialsItem[];
  setItems: React.Dispatch<React.SetStateAction<TestimonialsItem[]>>;
}

const createItem = (seed: number): TestimonialsItem => ({
  avatar: '',
  content: '',
  id: `testimonial-${seed}`,
  name: '',
  rating: 5,
  role: '',
});

export function TestimonialsForm({ items, setItems }: TestimonialsFormProps) {
  const [draggedId, setDraggedId] = React.useState<string | null>(null);
  const [dragOverId, setDragOverId] = React.useState<string | null>(null);

  const addItem = () => {
    const seed = Date.now();
    setItems((prev) => [...prev, createItem(seed)]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  };

  const updateItem = (id: string, patch: Partial<TestimonialsItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragOver = (event: React.DragEvent, id: string) => {
    event.preventDefault();
    if (draggedId !== id) {
      setDragOverId(id);
    }
  };

  const handleDrop = (event: React.DragEvent, targetId: string) => {
    event.preventDefault();
    if (!draggedId || draggedId === targetId) {return;}

    setItems((prev) => {
      const next = [...prev];
      const draggedIndex = next.findIndex((item) => item.id === draggedId);
      const targetIndex = next.findIndex((item) => item.id === targetId);
      if (draggedIndex < 0 || targetIndex < 0) {return prev;}
      const [moved] = next.splice(draggedIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });

    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Đánh giá khách hàng</CardTitle>
          <p className="text-xs text-slate-500 mt-1">Kéo thả để sắp xếp thứ tự hiển thị</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-2">
          <Plus size={14} /> Thêm
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item, idx) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => { handleDragStart(item.id); }}
            onDragEnd={handleDragEnd}
            onDragOver={(event) => { handleDragOver(event, item.id); }}
            onDrop={(event) => { handleDrop(event, item.id); }}
            className={cn(
              'p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3 transition-all',
              draggedId === item.id && 'opacity-50 scale-[0.98]',
              dragOverId === item.id && 'ring-2 ring-blue-500 ring-offset-2'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical size={16} className="text-slate-400 cursor-grab active:cursor-grabbing" />
                <Label>Đánh giá {idx + 1}</Label>
              </div>
              <Button type="button" variant="ghost" size="icon" className="text-red-500 h-8 w-8" onClick={() => { removeItem(item.id); }}>
                <Trash2 size={14} />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input
                  placeholder="Tên khách hàng"
                  value={item.name}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => { updateItem(item.id, { name: event.target.value }); }}
                />
                <p className="text-[10px] text-slate-400 mt-1">VD: Nguyễn Văn A</p>
              </div>
              <div>
                <Input
                  placeholder="Chức vụ / Công ty"
                  value={item.role}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => { updateItem(item.id, { role: event.target.value }); }}
                />
                <p className="text-[10px] text-slate-400 mt-1">VD: CEO, ABC Corp</p>
              </div>
            </div>

            <div>
              <textarea
                placeholder="Nội dung đánh giá chi tiết từ khách hàng..."
                value={item.content}
                onChange={(event) => { updateItem(item.id, { content: event.target.value }); }}
                className="w-full min-h-[80px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm resize-y"
              />
              <p className="text-[10px] text-slate-400 mt-1">Nội dung chi tiết giúp tăng độ tin cậy (2-4 dòng)</p>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Đánh giá:</Label>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={22}
                    className={cn(
                      'cursor-pointer transition-colors',
                      star <= item.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300 hover:text-yellow-200'
                    )}
                    onClick={() => { updateItem(item.id, { rating: star }); }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <User size={12} />
                <span>Avatar: hiển thị chữ cái đầu tên</span>
              </div>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
            <Star size={32} className="text-slate-300 mb-2" />
            <p className="text-sm text-slate-500 mb-3">Chưa có đánh giá nào</p>
            <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-2">
              <Plus size={14} /> Thêm đánh giá đầu tiên
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
