'use client';

import React from 'react';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  cn,
} from '../../../components/ui';
import { IconPickerDialog } from '../../contact/_components/IconPickerDialog';
import {
  CONTACT_ICON_OPTIONS,
  resolveContactIcon,
} from '../../contact/_lib/iconOptions';
import {
  BENEFITS_GRID_COLUMNS_DESKTOP,
  BENEFITS_GRID_COLUMNS_MOBILE,
  BENEFITS_HEADER_ALIGN_OPTIONS,
  BENEFITS_STYLES,
} from '../_lib/constants';
import type { BenefitItem, BenefitsEditorState, BenefitsHeaderAlign, BenefitsStyle } from '../_types';

interface BenefitsFormProps {
  state: BenefitsEditorState;
  onChange: (updater: (prev: BenefitsEditorState) => BenefitsEditorState) => void;
  mode: 'single' | 'dual';
}

const MIN_ITEMS = 1;
const MAX_ITEMS = 8;

const createItem = (seed: number): BenefitItem => ({
  description: '',
  icon: 'check',
  id: `benefit-${seed}`,
  title: '',
});

const normalizeBenefitsIconValue = (value?: string) => {
  const trimmed = (value ?? '').trim();
  if (!trimmed) {return 'check';}

  const legacyMap: Record<string, string> = {
    Check: 'check',
    Shield: 'shield',
    Star: 'star',
    Target: 'target',
    Trophy: 'trophy',
    Zap: 'zap',
  };

  if (legacyMap[trimmed]) {return legacyMap[trimmed];}

  const hasUppercase = /[A-Z]/.test(trimmed);
  if (hasUppercase) {
    return trimmed
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/\s+/g, '-')
      .toLowerCase();
  }

  return trimmed;
};

export function BenefitsForm({ state, onChange, mode: _mode }: BenefitsFormProps) {
  const [draggedId, setDraggedId] = React.useState<string | null>(null);
  const [dragOverId, setDragOverId] = React.useState<string | null>(null);
  const [iconPickerId, setIconPickerId] = React.useState<string | null>(null);

  const addItem = () => {
    onChange((prev) => {
      if (prev.items.length >= MAX_ITEMS) {return prev;}
      return {
        ...prev,
        items: [...prev.items, createItem(Date.now())],
      };
    });
  };

  const removeItem = (id: string) => {
    onChange((prev) => {
      if (prev.items.length <= MIN_ITEMS) {return prev;}
      return {
        ...prev,
        items: prev.items.filter((item) => item.id !== id),
      };
    });
  };

  const updateItem = (id: string, patch: Partial<BenefitItem>) => {
    onChange((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
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
      const next = [...prev.items];
      const draggedIndex = next.findIndex((item) => item.id === draggedId);
      const targetIndex = next.findIndex((item) => item.id === targetId);
      if (draggedIndex < 0 || targetIndex < 0) {return prev;}

      const [moved] = next.splice(draggedIndex, 1);
      next.splice(targetIndex, 0, moved);

      return {
        ...prev,
        items: next,
      };
    });

    setDraggedId(null);
    setDragOverId(null);
  };

  const updateStyle = (value: string) => {
    onChange((prev) => ({
      ...prev,
      style: value as BenefitsStyle,
    }));
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Cấu hình hiển thị</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Badge text</Label>
              <Input
                placeholder="Vì sao chọn chúng tôi?"
                value={state.subHeading}
                onChange={(event) => {
                  const next = event.target.value;
                  onChange((prev) => ({ ...prev, subHeading: next }));
                }}
              />
            </div>

            <div>
              <Label>Tiêu đề chính</Label>
              <Input
                placeholder="Giá trị cốt lõi"
                value={state.heading}
                onChange={(event) => {
                  const next = event.target.value;
                  onChange((prev) => ({ ...prev, heading: next }));
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Style</Label>
              <select
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800"
                value={state.style}
                onChange={(event) => { updateStyle(event.target.value); }}
              >
                {BENEFITS_STYLES.map((style) => (
                  <option key={style.id} value={style.id}>{style.label}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Căn badge + tiêu đề</Label>
              <select
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800"
                value={state.headerAlign}
                onChange={(event) => {
                  const next = event.target.value as BenefitsHeaderAlign;
                  onChange((prev) => ({ ...prev, headerAlign: next }));
                }}
              >
                {BENEFITS_HEADER_ALIGN_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Grid desktop</Label>
              <select
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800"
                value={state.gridColumnsDesktop}
                onChange={(event) => {
                  const next = Number(event.target.value) as 3 | 4;
                  onChange((prev) => ({ ...prev, gridColumnsDesktop: next }));
                }}
              >
                {BENEFITS_GRID_COLUMNS_DESKTOP.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Grid mobile</Label>
              <select
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800"
                value={state.gridColumnsMobile}
                onChange={(event) => {
                  const next = Number(event.target.value) as 1 | 2;
                  onChange((prev) => ({ ...prev, gridColumnsMobile: next }));
                }}
              >
                {BENEFITS_GRID_COLUMNS_MOBILE.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          {state.style === 'timeline' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <Label>Nút CTA (tùy chọn)</Label>
                <Input
                  placeholder="Tìm hiểu thêm"
                  value={state.buttonText}
                  onChange={(event) => {
                    const next = event.target.value;
                    onChange((prev) => ({ ...prev, buttonText: next }));
                  }}
                />
              </div>

              <div>
                <Label>Link nút CTA</Label>
                <Input
                  placeholder="/lien-he"
                  value={state.buttonLink}
                  onChange={(event) => {
                    const next = event.target.value;
                    onChange((prev) => ({ ...prev, buttonLink: next }));
                  }}
                />
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Lợi ích ({state.items.length}/{MAX_ITEMS})
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItem}
            disabled={state.items.length >= MAX_ITEMS}
            className="gap-2"
          >
            <Plus size={14} /> Thêm
          </Button>
        </CardHeader>

        <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
          {state.items.map((item, idx) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => { handleDragStart(item.id); }}
              onDragEnd={handleDragEnd}
              onDragOver={(event) => { handleDragOver(event, item.id); }}
              onDrop={(event) => { handleDrop(event, item.id); }}
              className={cn(
                'p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3 transition-all cursor-grab active:cursor-grabbing',
                draggedId === item.id && 'opacity-50 scale-[0.98]',
                dragOverId === item.id && 'ring-2 ring-blue-500 ring-offset-2',
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical size={16} className="text-slate-400" />
                  <Label className="font-medium">Lợi ích {idx + 1}</Label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-red-500 h-8 w-8"
                  onClick={() => { removeItem(item.id); }}
                  disabled={state.items.length <= MIN_ITEMS}
                >
                  <Trash2 size={14} />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-1">
                  <Label className="text-xs text-slate-500">Icon</Label>
                  {(() => {
                    const normalizedValue = normalizeBenefitsIconValue(item.icon);
                    const iconOption = CONTACT_ICON_OPTIONS.find((option) => option.value === normalizedValue);
                    const Icon = resolveContactIcon(normalizedValue);

                    return (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-between gap-2 px-3"
                          onClick={() => { setIconPickerId(item.id); }}
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <Icon size={16} className="text-slate-600 dark:text-slate-200" />
                            <span className="text-xs text-slate-700 dark:text-slate-200 truncate">
                              {iconOption?.label ?? 'Chọn icon'}
                            </span>
                          </span>
                          <span className="text-xs text-slate-400">▼</span>
                        </Button>

                        <IconPickerDialog
                          open={iconPickerId === item.id}
                          onOpenChange={(open) => { setIconPickerId(open ? item.id : null); }}
                          value={normalizedValue}
                          options={CONTACT_ICON_OPTIONS}
                          onSelect={(value) => { updateItem(item.id, { icon: value }); }}
                        />
                      </>
                    );
                  })()}
                </div>

                <div className="md:col-span-2">
                  <Label className="text-xs text-slate-500">Tiêu đề lợi ích</Label>
                  <Input
                    placeholder="Tiêu đề lợi ích"
                    value={item.title}
                    onChange={(event) => { updateItem(item.id, { title: event.target.value }); }}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-slate-500">Mô tả ngắn</Label>
                <Input
                  placeholder="Mô tả ngắn (max 150 ký tự)"
                  value={item.description}
                  maxLength={150}
                  onChange={(event) => { updateItem(item.id, { description: event.target.value }); }}
                />
                <p className="text-xs text-slate-400 text-right mt-1">{item.description.length}/150</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
