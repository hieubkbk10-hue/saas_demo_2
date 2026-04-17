'use client';

import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { TrustBadgesPreview } from '../../gallery/_components/TrustBadgesPreview';
import type { TrustBadgesStyle } from '../../gallery/_types';
import type { ImageItem } from '../../../components/MultiImageUploader';
import { MultiImageUploader } from '../../../components/MultiImageUploader';

interface TrustBadgeItem extends ImageItem {
  id: string | number;
  url: string;
  link: string;
  name?: string;
}

export default function TrustBadgesCreatePage() {
  const COMPONENT_TYPE = 'TrustBadges';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Chứng nhận', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const [trustBadgeItems, setTrustBadgeItems] = useState<TrustBadgeItem[]>([
    { id: 'item-1', link: '', name: '', url: '' },
    { id: 'item-2', link: '', name: '', url: '' }
  ]);
  const [trustBadgesStyle, setTrustBadgesStyle] = useState<TrustBadgesStyle>('cards');

  const onSubmit = (e: React.FormEvent) => {
    void handleSubmit(e, {
      items: trustBadgeItems.map((item) => ({ link: item.link, name: item.name, url: item.url })),
      style: trustBadgesStyle,
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
        <CardHeader>
          <CardTitle className="text-base">Danh sách chứng nhận</CardTitle>
        </CardHeader>
        <CardContent>
          <MultiImageUploader<TrustBadgeItem>
            items={trustBadgeItems}
            onChange={setTrustBadgeItems}
            folder="trust-badges"
            imageKey="url"
            extraFields={[{ key: 'name', placeholder: 'Tên chứng nhận (VD: ISO 9001)', type: 'text' }]}
            minItems={1}
            maxItems={20}
            aspectRatio="square"
            columns={2}
            showReorder={true}
            addButtonText="Thêm chứng nhận"
            emptyText="Chưa có chứng nhận nào"
            layout="vertical"
          />
        </CardContent>
      </Card>

      <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center flex-shrink-0">
            <Shield size={16} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mb-1">Kích thước ảnh chứng nhận tối ưu</p>
            <div className="text-xs text-emerald-700 dark:text-emerald-300">
              {trustBadgesStyle === 'grid' && (
                <div className="space-y-1">
                  <p><strong className="text-emerald-900 dark:text-emerald-100">Grid</strong></p>
                  <p>• Ảnh: <strong>300×300px</strong> (tỷ lệ 1:1, vuông)</p>
                  <p className="text-emerald-500 dark:text-emerald-400 italic">Layout: Grid vuông với zoom icon</p>
                </div>
              )}
              {trustBadgesStyle === 'cards' && (
                <div className="space-y-1">
                  <p><strong className="text-emerald-900 dark:text-emerald-100">Cards</strong></p>
                  <p>• Ảnh: <strong>400×320px</strong> (tỷ lệ 5:4)</p>
                  <p className="text-emerald-500 dark:text-emerald-400 italic">Layout: Feature cards lớn, hover zoom effect</p>
                </div>
              )}
              {trustBadgesStyle === 'marquee' && (
                <div className="space-y-1">
                  <p><strong className="text-emerald-900 dark:text-emerald-100">Marquee</strong></p>
                  <p>• Ảnh: <strong>200×120px</strong> (tỷ lệ 5:3)</p>
                  <p className="text-emerald-500 dark:text-emerald-400 italic">Layout: Auto scroll slider, hover pause</p>
                </div>
              )}
              {trustBadgesStyle === 'wall' && (
                <div className="space-y-1">
                  <p><strong className="text-emerald-900 dark:text-emerald-100">Wall</strong></p>
                  <p>• Ảnh: <strong>250×300px</strong> (tỷ lệ 5:6)</p>
                  <p className="text-emerald-500 dark:text-emerald-400 italic">Layout: Khung ảnh dọc kiểu treo tường</p>
                </div>
              )}
              {trustBadgesStyle === 'carousel' && (
                <div className="space-y-1">
                  <p><strong className="text-emerald-900 dark:text-emerald-100">Carousel</strong></p>
                  <p>• Ảnh: <strong>280×280px</strong> (tỷ lệ 1:1)</p>
                  <p className="text-emerald-500 dark:text-emerald-400 italic">Layout: Horizontal carousel với arrows</p>
                </div>
              )}
              {trustBadgesStyle === 'featured' && (
                <div className="space-y-1">
                  <p><strong className="text-emerald-900 dark:text-emerald-100">Featured</strong></p>
                  <p>• Featured: <strong>600×450px</strong> (tỷ lệ 4:3)</p>
                  <p>• Others: <strong>200×200px</strong> (tỷ lệ 1:1)</p>
                  <p className="text-emerald-500 dark:text-emerald-400 italic">Layout: 1 badge nổi bật + grid nhỏ bên cạnh</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <TrustBadgesPreview
        items={trustBadgeItems.map((item, idx) => ({ id: idx + 1, link: item.link, name: item.name, url: item.url }))}
        brandColor={primary}
        secondary={secondary}
        mode={mode}
        selectedStyle={trustBadgesStyle}
        onStyleChange={setTrustBadgesStyle}
        fontStyle={fontStyle}
        fontClassName="font-active"
      />
    </ComponentFormWrapper>
  );
}
