'use client';

import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { PartnersPreview } from '../../partners/_components/PartnersPreview';
import type { PartnersStyle } from '../../partners/_types';
import type { ImageItem } from '../../../components/MultiImageUploader';
import { MultiImageUploader } from '../../../components/MultiImageUploader';

interface PartnerItem extends ImageItem {
  id: string | number;
  url: string;
  link: string;
  name?: string;
}

export default function PartnersCreatePage() {
  const COMPONENT_TYPE = 'Partners';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Đối tác / Logos', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const [partnersItems, setPartnersItems] = useState<PartnerItem[]>([
    { id: 'item-1', link: '', name: '', url: '' },
    { id: 'item-2', link: '', name: '', url: '' }
  ]);
  const [partnersStyle, setPartnersStyle] = useState<PartnersStyle>('grid');

  const onSubmit = (e: React.FormEvent) => {
    void handleSubmit(e, {
      items: partnersItems.map((item) => ({ link: item.link, name: item.name, url: item.url })),
      style: partnersStyle,
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
          <CardTitle className="text-base">Logo đối tác</CardTitle>
        </CardHeader>
        <CardContent>
          <MultiImageUploader<PartnerItem>
            items={partnersItems}
            onChange={setPartnersItems}
            folder="partners"
            imageKey="url"
            extraFields={[{ key: 'link', placeholder: 'Link website đối tác (tùy chọn)', type: 'url' }]}
            minItems={1}
            maxItems={20}
            aspectRatio="video"
            columns={4}
            showReorder={true}
            addButtonText="Thêm logo"
            emptyText="Chưa có logo nào"
            layout="vertical"
          />
        </CardContent>
      </Card>

      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center flex-shrink-0">
            <ImageIcon size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">Kích thước logo tối ưu</p>
            <div className="text-xs text-blue-700 dark:text-blue-300">
              {partnersStyle === 'grid' && (
                <div className="space-y-1">
                  <p><strong className="text-blue-900 dark:text-blue-100">Grid</strong></p>
                  <p>• Logo: <strong>200×80px</strong> (tỷ lệ 5:2) • PNG nền trong suốt</p>
                  <p className="text-blue-500 dark:text-blue-400 italic">Layout: 8 cột desktop, 2 cột mobile</p>
                </div>
              )}
              {partnersStyle === 'marquee' && (
                <div className="space-y-1">
                  <p><strong className="text-blue-900 dark:text-blue-100">Marquee</strong></p>
                  <p>• Logo: <strong>160×60px</strong> (tỷ lệ 8:3) • PNG nền trong suốt</p>
                  <p className="text-blue-500 dark:text-blue-400 italic">Layout: Auto scroll. Hover để dừng.</p>
                </div>
              )}
              {partnersStyle === 'mono' && (
                <div className="space-y-1">
                  <p><strong className="text-blue-900 dark:text-blue-100">Mono</strong></p>
                  <p>• Logo: <strong>160×60px</strong> (tỷ lệ 8:3) • PNG nền trong suốt</p>
                  <p className="text-blue-500 dark:text-blue-400 italic">Layout: Grayscale mặc định, hover để hiện màu. Scroll chậm.</p>
                </div>
              )}
              {partnersStyle === 'badge' && (
                <div className="space-y-1">
                  <p><strong className="text-blue-900 dark:text-blue-100">Badge</strong></p>
                  <p>• Logo: <strong>120×48px</strong> (tỷ lệ 5:2) • PNG nền trong suốt</p>
                  <p className="text-blue-500 dark:text-blue-400 italic">Layout: Compact badges với logo + tên đối tác</p>
                </div>
              )}
              {partnersStyle === 'carousel' && (
                <div className="space-y-1">
                  <p><strong className="text-blue-900 dark:text-blue-100">Carousel</strong></p>
                  <p>• Logo: <strong>200×100px</strong> (tỷ lệ 2:1) • PNG nền trong suốt</p>
                  <p className="text-blue-500 dark:text-blue-400 italic">Layout: Cards với navigation. 6 items/trang desktop.</p>
                </div>
              )}
              {partnersStyle === 'featured' && (
                <div className="space-y-1">
                  <p><strong className="text-blue-900 dark:text-blue-100">Featured</strong></p>
                  <p>• Logo nổi bật: <strong>400×200px</strong> (tỷ lệ 2:1)</p>
                  <p>• Logo khác: <strong>150×75px</strong> (tỷ lệ 2:1)</p>
                  <p className="text-blue-500 dark:text-blue-400 italic">Layout: 1 đối tác nổi bật lớn + grid nhỏ các đối tác khác</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <PartnersPreview
        items={partnersItems.map((item, idx) => ({ id: idx + 1, link: item.link, name: item.name, url: item.url }))}
        brandColor={primary}
        secondary={secondary}
        mode={mode}
        selectedStyle={partnersStyle}
        onStyleChange={setPartnersStyle}
        title={title}
        fontStyle={fontStyle}
        fontClassName="font-active"
      />
    </ComponentFormWrapper>
  );
}
