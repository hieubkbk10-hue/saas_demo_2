'use client';

import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { GalleryPreview } from '../../gallery/_components/GalleryPreview';
import type { GalleryStyle } from '../../gallery/_types';
import { normalizeGalleryHarmony } from '../../gallery/_lib/colors';
import type { ImageItem } from '../../../components/MultiImageUploader';
import { MultiImageUploader } from '../../../components/MultiImageUploader';

interface GalleryItem extends ImageItem {
  id: string | number;
  url: string;
  link: string;
}

export default function GalleryCreatePage() {
  const COMPONENT_TYPE = 'Gallery';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Thư viện ảnh', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([
    { id: 'item-1', link: '', url: '' },
    { id: 'item-2', link: '', url: '' }
  ]);
  const [galleryStyle, setGalleryStyle] = useState<GalleryStyle>('spotlight');

  const harmony = normalizeGalleryHarmony(undefined);


  const onSubmit = (e: React.FormEvent) => {
    void handleSubmit(e, {
      harmony,
      items: galleryItems.map((item) => ({ link: item.link, name: '', url: item.url })),
      style: galleryStyle,
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
          <CardTitle className="text-base">Thư viện ảnh</CardTitle>
        </CardHeader>
        <CardContent>

          <MultiImageUploader<GalleryItem>
            items={galleryItems}
            onChange={setGalleryItems}
            folder="gallery"
            imageKey="url"
            minItems={1}
            maxItems={20}
            aspectRatio="video"
            columns={2}
            showReorder={true}
            addButtonText="Thêm ảnh"
            emptyText="Chưa có ảnh nào"
            layout="vertical"
          />
        </CardContent>
      </Card>

      <GalleryPreview
        items={galleryItems.map((item, idx) => ({ id: idx + 1, link: item.link, name: '', url: item.url }))}
        brandColor={primary}
        secondary={secondary}
        mode={mode}
        harmony={harmony}
        selectedStyle={galleryStyle}
        onStyleChange={setGalleryStyle}
        title={title}
        fontStyle={fontStyle}
        fontClassName="font-active"
      />

      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center flex-shrink-0">
            <ImageIcon size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">Kích thước ảnh tối ưu</p>
            <div className="text-xs text-blue-700 dark:text-blue-300">
              {galleryStyle === 'spotlight' && (
                <div className="space-y-1">
                  <p><strong className="text-blue-900 dark:text-blue-100">Tiêu điểm (Spotlight)</strong></p>
                  <p>• Ảnh chính: <strong>1200×800px</strong> (tỷ lệ 3:2)</p>
                  <p>• Ảnh phụ: <strong>600×600px</strong> (tỷ lệ 1:1, vuông)</p>
                  <p className="text-blue-500 dark:text-blue-400 italic">Layout: 1 ảnh lớn bên trái + 3 ảnh vuông bên phải</p>
                </div>
              )}
              {galleryStyle === 'explore' && (
                <div className="space-y-1">
                  <p><strong className="text-blue-900 dark:text-blue-100">Khám phá (Explore)</strong></p>
                  <p>• Tất cả ảnh: <strong>600×600px</strong> (tỷ lệ 1:1, vuông)</p>
                  <p className="text-blue-500 dark:text-blue-400 italic">Layout: Grid đều kiểu Instagram - 5 cột desktop, 3 cột mobile</p>
                </div>
              )}
              {galleryStyle === 'stories' && (
                <div className="space-y-1">
                  <p><strong className="text-blue-900 dark:text-blue-100">Câu chuyện (Stories)</strong></p>
                  <p>• Ảnh nhỏ: <strong>800×600px</strong> (tỷ lệ 4:3)</p>
                  <p>• Ảnh lớn: <strong>1200×600px</strong> (tỷ lệ 2:1)</p>
                  <p className="text-blue-500 dark:text-blue-400 italic">Layout: Masonry nhẹ - ảnh 1,4 chiếm 2 cột, còn lại 1 cột</p>
                </div>
              )}
              {galleryStyle === 'grid' && (
                <div className="space-y-1">
                  <p><strong className="text-blue-900 dark:text-blue-100">Grid</strong></p>
                  <p>• Tất cả ảnh: <strong>800×800px</strong> (tỷ lệ 1:1, vuông)</p>
                  <p className="text-blue-500 dark:text-blue-400 italic">Layout: Grid đều - 4 cột desktop, 2 cột mobile. Click để xem lightbox.</p>
                </div>
              )}
              {galleryStyle === 'marquee' && (
                <div className="space-y-1">
                  <p><strong className="text-blue-900 dark:text-blue-100">Marquee</strong></p>
                  <p>• Tất cả ảnh: <strong>800×600px</strong> (tỷ lệ 4:3)</p>
                  <p className="text-blue-500 dark:text-blue-400 italic">Layout: Auto scroll horizontal. Hover/focus/touch để tạm dừng. Có thể kéo vuốt ngang bằng chuột.</p>
                </div>
              )}
              {galleryStyle === 'masonry' && (
                <div className="space-y-1">
                  <p><strong className="text-blue-900 dark:text-blue-100">Masonry</strong></p>
                  <p>• Ảnh ngang: <strong>600×400px</strong> (tỷ lệ 3:2)</p>
                  <p>• Ảnh dọc: <strong>600×900px</strong> (tỷ lệ 2:3)</p>
                  <p>• Ảnh vuông: <strong>600×600px</strong> (tỷ lệ 1:1)</p>
                  <p className="text-blue-500 dark:text-blue-400 italic">Layout: Pinterest-like - ảnh cao/thấp khác nhau. 4 cột desktop, 2 cột mobile.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ComponentFormWrapper>
  );
}
