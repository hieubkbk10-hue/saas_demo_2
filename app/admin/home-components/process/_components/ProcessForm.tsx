'use client';

import React from 'react';
import { GripVertical, Layers, Plus, Trash2 } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '../../../components/ui';
import type { ProcessFormStep } from '../_lib/normalize';
import { createProcessFormStep } from '../_lib/normalize';

interface ProcessFormProps {
  steps: ProcessFormStep[];
  onChange: (steps: ProcessFormStep[]) => void;
  secondary: string;
}

export const ProcessForm = ({ steps, onChange, secondary }: ProcessFormProps) => {
  const [draggedId, setDraggedId] = React.useState<string | null>(null);
  const [dragOverId, setDragOverId] = React.useState<string | null>(null);

  const safeSecondary = secondary.trim().length > 0 ? secondary : '#3b82f6';

  const handleAdd = () => {
    onChange([...steps, createProcessFormStep({ icon: String(steps.length + 1) })]);
  };

  const handleUpdate = (id: string, updater: (step: ProcessFormStep) => ProcessFormStep) => {
    onChange(steps.map((step) => (step.id === id ? updater(step) : step)));
  };

  const handleRemove = (id: string) => {
    if (steps.length <= 1) {return;}
    onChange(steps.filter((step) => step.id !== id));
  };

  const dragProps = (id: string) => ({
    draggable: true,
    onDragStart: () => { setDraggedId(id); },
    onDragOver: (event: React.DragEvent) => {
      event.preventDefault();
      if (draggedId !== id) {
        setDragOverId(id);
      }
    },
    onDrop: (event: React.DragEvent) => {
      event.preventDefault();
      if (!draggedId || draggedId === id) {return;}

      const sourceIndex = steps.findIndex((step) => step.id === draggedId);
      const targetIndex = steps.findIndex((step) => step.id === id);

      if (sourceIndex < 0 || targetIndex < 0) {
        setDraggedId(null);
        setDragOverId(null);
        return;
      }

      const next = [...steps];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      onChange(next);
      setDraggedId(null);
      setDragOverId(null);
    },
    onDragEnd: () => {
      setDraggedId(null);
      setDragOverId(null);
    },
  });

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Các bước quy trình</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={handleAdd} className="gap-2">
          <Plus size={14} /> Thêm bước
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${safeSecondary}14` }}>
              <Layers size={28} style={{ color: safeSecondary }} />
            </div>
            <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">Chưa có bước nào</h3>
            <p className="text-sm text-slate-500">Nhấn “Thêm bước” để bắt đầu</p>
          </div>
        ) : (
          steps.map((step, idx) => (
            <div
              key={step.id}
              {...dragProps(step.id)}
              className={cn(
                'p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3 cursor-grab active:cursor-grabbing transition-all',
                draggedId === step.id && 'opacity-50',
                dragOverId === step.id && 'ring-2 ring-blue-500',
              )}
            >
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <GripVertical size={16} className="text-slate-400 cursor-grab" />
                  <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </span>
                  Bước {idx + 1}
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-red-500 h-8 w-8"
                  onClick={() => { handleRemove(step.id); }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input
                  placeholder="Icon/Số (VD: 1, 01, ✓)"
                  value={step.icon}
                  onChange={(event) => {
                    handleUpdate(step.id, (current) => ({ ...current, icon: event.target.value }));
                  }}
                  className="md:col-span-1"
                />
                <Input
                  placeholder="Tiêu đề bước"
                  value={step.title}
                  onChange={(event) => {
                    handleUpdate(step.id, (current) => ({ ...current, title: event.target.value }));
                  }}
                  className="md:col-span-3"
                />
              </div>

              <Input
                placeholder="Mô tả chi tiết bước này..."
                value={step.description}
                onChange={(event) => {
                  handleUpdate(step.id, (current) => ({ ...current, description: event.target.value }));
                }}
              />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
