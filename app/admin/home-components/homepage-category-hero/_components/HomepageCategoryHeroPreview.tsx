'use client';

import React from 'react';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewWrapper } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import { HomepageCategoryHeroSection } from '@/components/site/HomepageCategoryHeroSection';
import { HOMEPAGE_CATEGORY_HERO_STYLES } from '../_lib/constants';
import { getHomepageCategoryHeroColors } from '../_lib/colors';
import type { HomepageCategoryHeroBrandMode, HomepageCategoryHeroConfig } from '../_types';

export function HomepageCategoryHeroPreview({
  config,
  brandColor,
  secondary,
  mode,
  selectedStyle,
  onStyleChange,
  fontStyle,
  fontClassName,
}: {
  config: HomepageCategoryHeroConfig;
  brandColor: string;
  secondary: string;
  mode: HomepageCategoryHeroBrandMode;
  selectedStyle?: HomepageCategoryHeroConfig['style'];
  onStyleChange?: (style: HomepageCategoryHeroConfig['style']) => void;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}) {
  const { device, setDevice } = usePreviewDevice();
  const previewStyle = selectedStyle ?? 'sidebar';
  const setPreviewStyle = (style: string) => onStyleChange?.(style as HomepageCategoryHeroConfig['style']);
  const info = `${config.selectionMode === 'auto' ? 'Auto categories' : 'Manual categories'} • ${mode === 'dual' ? '2 màu' : '1 màu'}`;
  const tokens = React.useMemo(
    () => getHomepageCategoryHeroColors(brandColor, secondary, mode),
    [brandColor, secondary, mode]
  );

  return (
    <>
      <PreviewWrapper
        title="Preview"
        device={device}
        setDevice={setDevice}
        previewStyle={previewStyle}
        setPreviewStyle={setPreviewStyle}
        styles={HOMEPAGE_CATEGORY_HERO_STYLES}
        info={info}
        deviceWidthClass={deviceWidths[device]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <BrowserFrame>
          <HomepageCategoryHeroSection
            config={{ ...config, style: previewStyle }}
            brandColor={brandColor}
            secondary={secondary}
            mode={mode}
            previewDevice={device}
            tokens={tokens}
          />
        </BrowserFrame>
      </PreviewWrapper>
      <ColorInfoPanel brandColor={brandColor} secondary={secondary} description={mode === 'dual' ? 'Đang dùng 2 màu cho hero danh mục.' : 'Đang dùng 1 màu cho hero danh mục.'} />
    </>
  );
}
