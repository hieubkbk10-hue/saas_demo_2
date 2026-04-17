'use client';

import React from 'react';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewWrapper } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import { ServicesSectionCore } from '@/components/site/ServicesSectionCore';
import { getServicesColors } from '../_lib/colors';
import type { ServiceItem, ServicesBrandMode, ServicesStyle } from '../_types';

const SERVICES_STYLES: Array<{ id: ServicesStyle; label: string }> = [
  { id: 'elegantGrid', label: 'Elegant Grid' },
  { id: 'modernList', label: 'Modern List' },
  { id: 'bigNumber', label: 'Big Number' },
  { id: 'cards', label: 'Icon Cards' },
  { id: 'carousel', label: 'Carousel' },
  { id: 'timeline', label: 'Timeline' },
];

const normalizeItems = (items: ServiceItem[]) => {
  return items.map((item) => ({
    icon: item.icon || 'Star',
    title: item.title || '',
    description: item.description || '',
  }));
};

export const ServicesPreview = ({
  items,
  brandColor,
  secondary,
  title = 'Dịch vụ',
  selectedStyle = 'elegantGrid',
  onStyleChange,
  mode = 'dual',
  fontStyle,
  fontClassName,
}: {
  items: ServiceItem[];
  brandColor: string;
  secondary: string;
  title?: string;
  selectedStyle?: ServicesStyle;
  onStyleChange?: (style: ServicesStyle) => void;
  mode?: ServicesBrandMode;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}) => {
  const { device, setDevice } = usePreviewDevice();

  const previewStyle = selectedStyle;
  const colors = React.useMemo(
    () => getServicesColors(brandColor, secondary, mode),
    [brandColor, secondary, mode],
  );

  const displayItems = React.useMemo(() => normalizeItems(items), [items]);

  return (
    <>
      <PreviewWrapper
        title="Preview Services"
        device={device}
        setDevice={setDevice}
        previewStyle={previewStyle}
        setPreviewStyle={(next) => onStyleChange?.(next as ServicesStyle)}
        styles={SERVICES_STYLES}
        info={`${items.length} mục`}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
        deviceWidthClass={deviceWidths[device]}
      >
        <BrowserFrame>
          <ServicesSectionCore
            items={displayItems}
            style={previewStyle}
            title={title}
            colors={colors}
            device={device}
            isPreview
            carouselId={`services-preview-carousel-${device}`}
          />
        </BrowserFrame>
      </PreviewWrapper>
      {mode === 'dual' ? <ColorInfoPanel brandColor={colors.primary} secondary={colors.secondary} /> : null}
    </>
  );
};
