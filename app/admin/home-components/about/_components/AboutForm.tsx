'use client';

import React from 'react';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '../../../components/ui';
import { ImageFieldWithUpload } from '../../../components/ImageFieldWithUpload';
import { ABOUT_STYLES, createAboutEditorStat } from '../_lib/constants';
import type { AboutEditorState, AboutStyle } from '../_types';

interface AboutFormProps {
  state: AboutEditorState;
  onChange: (updater: (prev: AboutEditorState) => AboutEditorState) => void;
}

const MIN_STATS = 1;
const MAX_STATS = 6;

export function AboutForm({ state, onChange }: AboutFormProps) {
  const [draggedId, setDraggedId] = React.useState<string | null>(null);
  const [dragOverId, setDragOverId] = React.useState<string | null>(null);

  const updateField = <K extends keyof AboutEditorState>(key: K, value: AboutEditorState[K]) => {
    onChange((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateStyle = (value: string) => {
    updateField('style', value as AboutStyle);
  };

  const addStat = () => {
    onChange((prev) => {
      if (prev.stats.length >= MAX_STATS) {return prev;}

      return {
        ...prev,
        stats: [...prev.stats, createAboutEditorStat()],
      };
    });
  };

  const removeStat = (id: string) => {
    onChange((prev) => {
      if (prev.stats.length <= MIN_STATS) {return prev;}

      return {
        ...prev,
        stats: prev.stats.filter((item) => item.id !== id),
      };
    });
  };

  const updateStat = (id: string, patch: { label?: string; value?: string }) => {
    onChange((prev) => ({
      ...prev,
      stats: prev.stats.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
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

    onChange((prev) => {
      const next = [...prev.stats];
      const draggedIndex = next.findIndex((item) => item.id === draggedId);
      const targetIndex = next.findIndex((item) => item.id === targetId);

      if (draggedIndex < 0 || targetIndex < 0) {return prev;}

      const [moved] = next.splice(draggedIndex, 1);
      next.splice(targetIndex, 0, moved);

      return {
        ...prev,
        stats: next,
      };
    });

    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Cấu hình Về chúng tôi</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Style</Label>
              <select
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800"
                value={state.style}
                onChange={(event) => { updateStyle(event.target.value); }}
              >
                {ABOUT_STYLES.map((style) => (
                  <option key={style.id} value={style.id}>{style.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Tiêu đề nhỏ (Sub-heading)</Label>
              <Input
                value={state.subHeading}
                onChange={(event) => { updateField('subHeading', event.target.value); }}
                placeholder="Câu chuyện thương hiệu"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tiêu đề chính (Heading)</Label>
            <Input
              value={state.heading}
              onChange={(event) => { updateField('heading', event.target.value); }}
              placeholder="Mang đến giá trị thực"
            />
          </div>

          <div className="space-y-2">
            <Label>Mô tả</Label>
            <textarea
              value={state.description}
              onChange={(event) => { updateField('description', event.target.value); }}
              placeholder="Mô tả về công ty..."
              className="w-full min-h-[100px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            />
          </div>

          <ImageFieldWithUpload
            label="Hình ảnh"
            value={state.image}
            onChange={(url) => { updateField('image', url); }}
            folder="home-components"
            aspectRatio="video"
            quality={0.85}
            placeholder="https://example.com/about-image.jpg"
          />

          {state.style === 'bento' ? (
            <div className="space-y-2">
              <Label>Caption ảnh (Bento style)</Label>
              <Input
                value={state.imageCaption}
                onChange={(event) => { updateField('imageCaption', event.target.value); }}
                placeholder="Kiến tạo không gian làm việc hiện đại & bền vững."
              />
              <p className="text-xs text-slate-500">Text overlay hiển thị trên ảnh trong style Bento.</p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Text nút bấm</Label>
              <Input
                value={state.buttonText}
                onChange={(event) => { updateField('buttonText', event.target.value); }}
                placeholder="Xem thêm"
              />
            </div>

            <div className="space-y-2">
              <Label>Liên kết</Label>
              <Input
                value={state.buttonLink}
                onChange={(event) => { updateField('buttonLink', event.target.value); }}
                placeholder="/about"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Số liệu nổi bật ({state.stats.length}/{MAX_STATS})</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addStat}
            className="gap-2"
            disabled={state.stats.length >= MAX_STATS}
          >
            <Plus size={14} /> Thêm
          </Button>
        </CardHeader>

        <CardContent className="space-y-3">
          {state.stats.map((stat, idx) => (
            <div
              key={stat.id}
              draggable
              onDragStart={() => { handleDragStart(stat.id); }}
              onDragEnd={handleDragEnd}
              onDragOver={(event) => { handleDragOver(event, stat.id); }}
              onDrop={(event) => { handleDrop(event, stat.id); }}
              className={cn(
                'flex gap-3 items-center p-3 rounded-lg border bg-white dark:bg-slate-800 cursor-grab transition-all',
                draggedId === stat.id && 'opacity-50',
                dragOverId === stat.id && 'ring-2 ring-blue-500',
              )}
            >
              <GripVertical size={16} className="text-slate-400 flex-shrink-0" />

              <span className="text-xs text-slate-500 w-6 text-center">#{idx + 1}</span>

              <Input
                placeholder="Số liệu"
                value={stat.value}
                onChange={(event) => { updateStat(stat.id, { value: event.target.value }); }}
                className="flex-1"
              />

              <Input
                placeholder="Nhãn"
                value={stat.label}
                onChange={(event) => { updateStat(stat.id, { label: event.target.value }); }}
                className="flex-1"
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-red-500 h-8 w-8 flex-shrink-0"
                onClick={() => { removeStat(stat.id); }}
                disabled={state.stats.length <= MIN_STATS}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
