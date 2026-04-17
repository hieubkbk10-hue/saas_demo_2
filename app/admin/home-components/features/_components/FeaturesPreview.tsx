'use client';

import React from 'react';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewWrapper } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import { FeaturesSectionShared } from './FeaturesSectionShared';
import type {
  FeatureItem,
  FeaturesBrandMode,
  FeaturesStyle,
} from '../_types';

const styles: Array<{ id: FeaturesStyle; label: string }> = [
  { id: 'iconGrid', label: 'Icon Grid' },
  { id: 'alternating', label: 'Alternating' },
  { id: 'compact', label: 'Compact' },
  { id: 'cards', label: 'Cards' },
  { id: 'carousel', label: 'Carousel' },
  { id: 'timeline', label: 'Timeline' },
];

interface FeaturesPreviewProps {
  items: FeatureItem[];
  brandColor: string;
  secondary: string;
  mode: FeaturesBrandMode;
  sectionTitle?: string;
  selectedStyle?: FeaturesStyle;
  onStyleChange?: (style: FeaturesStyle) => void;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}

export function FeaturesPreview({
  items,
  brandColor,
  secondary,
  mode,
  sectionTitle,
  selectedStyle,
  onStyleChange,
  fontStyle,
  fontClassName,
}: FeaturesPreviewProps) {
  const { device, setDevice } = usePreviewDevice();

  const previewStyle = selectedStyle ?? 'iconGrid';
  const info = (() => {
    const modeLabel = mode === 'dual' ? '2 màu' : '1 màu';
    if (items.length === 0) {return `Chưa có tính năng • ${modeLabel}`;}
    const sizeLabel = previewStyle === 'carousel'
      ? 'Icon: 56×56px • Card rộng'
      : previewStyle === 'timeline'
        ? 'Icon: 24×24px • Timeline'
        : 'Icon: 40-56px';
    return `${items.length} tính năng • ${sizeLabel} • ${modeLabel}`;
  })();

  return (
    <>
      <PreviewWrapper
        title="Preview Features"
        device={device}
        setDevice={setDevice}
        previewStyle={previewStyle}
        setPreviewStyle={(next) => onStyleChange?.(next as FeaturesStyle)}
        styles={styles}
        info={info}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
        deviceWidthClass={deviceWidths[device]}
      >
        <BrowserFrame>
          <FeaturesSectionShared
            context="preview"
            device={device}
            items={items}
            style={previewStyle}
            title={sectionTitle}
            brandColor={brandColor}
            secondary={secondary}
            mode={mode}
          />
        </BrowserFrame>
      </PreviewWrapper>

      {mode === 'dual' ? (
        <ColorInfoPanel
          brandColor={brandColor}
          secondary={secondary}
          description="Màu phụ được áp dụng cho badge, icon, accent và điều hướng trong Features."
        />
      ) : null}
    </>
  );
}

export type { FeaturesStyle } from '../_types';
