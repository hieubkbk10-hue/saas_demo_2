'use client';

import React, { useState } from 'react';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '../../../components/ui';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { FeaturesPreview } from '../../features/_components/FeaturesPreview';
import {
  createFeatureItem,
  FEATURE_ICON_OPTIONS,
} from '../../features/_lib/constants';
import type { FeatureItem, FeaturesStyle } from '../../features/_types';

const defaultItems: FeatureItem[] = [
  createFeatureItem({ description: 'Hiệu suất tối ưu với thời gian phản hồi dưới 100ms.', icon: 'Zap', id: 1, title: 'Tốc độ nhanh' }),
  createFeatureItem({ description: 'Mã hóa end-to-end, bảo vệ dữ liệu người dùng.', icon: 'Shield', id: 2, title: 'Bảo mật cao' }),
  createFeatureItem({ description: 'Tích hợp trí tuệ nhân tạo, tự động hóa quy trình.', icon: 'Cpu', id: 3, title: 'AI thông minh' }),
  createFeatureItem({ description: 'Hoạt động trên mọi thiết bị: Web, iOS, Android.', icon: 'Globe', id: 4, title: 'Đa nền tảng' }),
  createFeatureItem({ description: 'Cài đặt nhanh chóng, hướng dẫn chi tiết.', icon: 'Rocket', id: 5, title: 'Dễ triển khai' }),
  createFeatureItem({ description: 'Dashboard trực quan, theo dõi KPIs real-time.', icon: 'Target', id: 6, title: 'Phân tích sâu' }),
];

export default function FeaturesCreatePage() {
  const COMPONENT_TYPE = 'Features';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Tính năng nổi bật', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const [featuresItems, setFeaturesItems] = useState<FeatureItem[]>(defaultItems);
  const [style, setStyle] = useState<FeaturesStyle>('iconGrid');

  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  const dragProps = (id: number) => ({
    draggable: true,
    onDragStart: () => { setDraggedId(id); },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      if (draggedId !== id) {
        setDragOverId(id);
      }
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      if (!draggedId || draggedId === id) {return;}

      setFeaturesItems((prev) => {
        const next = [...prev];
        const fromIndex = next.findIndex((item) => item.id === draggedId);
        const toIndex = next.findIndex((item) => item.id === id);
        if (fromIndex < 0 || toIndex < 0) {return prev;}
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next;
      });

      setDraggedId(null);
      setDragOverId(null);
    },
    onDragEnd: () => {
      setDraggedId(null);
      setDragOverId(null);
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    void handleSubmit(e, {
      items: featuresItems,
      style,
    });
  };

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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Danh sách tính năng</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              setFeaturesItems((prev) => [...prev, createFeatureItem({ icon: 'Zap' })]);
            }}
          >
            <Plus size={14} />
            Thêm
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {featuresItems.map((item, idx) => (
            <div
              key={item.id}
              {...dragProps(item.id)}
              className={cn(
                'p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3 cursor-grab active:cursor-grabbing transition-all',
                draggedId === item.id && 'opacity-50',
                dragOverId === item.id && 'ring-2 ring-blue-500',
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical size={16} className="text-slate-400" />
                  <Label>Tính năng {idx + 1}</Label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-red-500 h-8 w-8"
                  onClick={() => {
                    if (featuresItems.length <= 1) {return;}
                    setFeaturesItems((prev) => prev.filter((feature) => feature.id !== item.id));
                  }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select
                  value={item.icon}
                  onChange={(e) => {
                    const nextIcon = e.target.value;
                    setFeaturesItems((prev) => prev.map((feature) => feature.id === item.id ? { ...feature, icon: nextIcon } : feature));
                  }}
                  className="h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
                >
                  {FEATURE_ICON_OPTIONS.map((icon) => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>

                <Input
                  placeholder="Tiêu đề"
                  value={item.title}
                  onChange={(e) => {
                    const nextTitle = e.target.value;
                    setFeaturesItems((prev) => prev.map((feature) => feature.id === item.id ? { ...feature, title: nextTitle } : feature));
                  }}
                  className="md:col-span-2"
                />
              </div>

              <Input
                placeholder="Mô tả ngắn"
                value={item.description}
                onChange={(e) => {
                  const nextDescription = e.target.value;
                  setFeaturesItems((prev) => prev.map((feature) => feature.id === item.id ? { ...feature, description: nextDescription } : feature));
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <FeaturesPreview
        items={featuresItems}
        sectionTitle={title}
        brandColor={primary}
        secondary={secondary}
        mode={mode}
        selectedStyle={style}
        onStyleChange={setStyle}
        fontStyle={fontStyle}
        fontClassName="font-active"
      />
    </ComponentFormWrapper>
  );
}
