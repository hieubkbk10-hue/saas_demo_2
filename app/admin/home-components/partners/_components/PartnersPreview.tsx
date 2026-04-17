import React from 'react';
import { Building2 } from 'lucide-react';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewImage } from '../../_shared/components/PreviewImage';
import { PreviewWrapper } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import { PARTNERS_STYLES } from '../_lib/constants';
import type { PartnerItem, PartnersStyle } from '../_types';
import { getPartnersColors, type PartnersBrandMode } from '../_lib/colors';
import { PartnersMarqueeShared } from './PartnersMarqueeShared';
import { PartnersBadgeShared } from './PartnersBadgeShared';
import { PartnersCarouselShared } from './PartnersCarouselShared';
import { PartnersFeaturedShared } from './PartnersFeaturedShared';
import { PartnersGridShared } from './PartnersGridShared';

export const PartnersPreview = ({
  items,
  brandColor,
  secondary,
  mode = 'dual',
  selectedStyle = 'grid',
  onStyleChange,
  title,
  fontStyle,
  fontClassName,
}: {
  items: PartnerItem[];
  brandColor: string;
  secondary: string;
  mode?: PartnersBrandMode;
  selectedStyle?: PartnersStyle;
  onStyleChange?: (style: PartnersStyle) => void;
  title?: string;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}) => {
  const { device, setDevice } = usePreviewDevice();
  const previewStyle = selectedStyle ?? 'grid';
  const setPreviewStyle = (style: string) => onStyleChange?.(style as PartnersStyle);
  const colors = React.useMemo(() => getPartnersColors(brandColor, secondary, mode), [brandColor, secondary, mode]);

  const renderEmptyState = () => (
    <section className="w-full py-6 bg-white dark:bg-slate-900">
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: colors.iconBg }}>
          <Building2 size={28} style={{ color: colors.iconColor }} />
        </div>
        <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">Chưa có đối tác nào</h3>
        <p className="text-sm text-slate-500">Thêm logo đối tác đầu tiên</p>
      </div>
    </section>
  );

  const renderGridStyle = () => {
    if (items.length === 0) {return renderEmptyState();}

    const maxVisible = device === 'mobile' ? 4 : 8;
    const columnsClassName = device === 'mobile'
      ? 'grid-cols-2'
      : (device === 'tablet' ? 'grid-cols-4' : 'grid-cols-4 lg:grid-cols-8');

    return (
      <PartnersGridShared
        items={items}
        title={title ?? 'Đối tác'}
        brandColor={brandColor}
        secondary={secondary}
        mode={mode}
        maxVisible={maxVisible}
        columnsClassName={columnsClassName}
        openInNewTab
        renderImage={(item, className) => (
          <PreviewImage src={item.url ?? ''} alt={item.name ?? ''} className={className} />
        )}
        className="dark:bg-slate-900 dark:border-slate-700"
      />
    );
  };

  const renderMarqueeStyle = () => {
    if (items.length === 0) {return renderEmptyState();}

    return (
      <PartnersMarqueeShared
        items={items}
        brandColor={brandColor}
        secondary={secondary}
        mode={mode}
        title={title ?? 'Đối tác'}
        variant="marquee"
        speed={1.15}
        openInNewTab
        renderImage={(item, className) => (
          <PreviewImage src={item.url} alt={item.name ?? ''} className={className} />
        )}
        className="dark:bg-slate-900 dark:border-slate-700/40"
      />
    );
  };

  const renderMonoStyle = () => {
    if (items.length === 0) {return renderEmptyState();}

    return (
      <PartnersMarqueeShared
        items={items}
        brandColor={brandColor}
        secondary={secondary}
        mode={mode}
        title={title ?? 'Đối tác'}
        variant="mono"
        speed={0.9}
        openInNewTab
        renderImage={(item, className) => (
          <PreviewImage src={item.url} alt={item.name ?? ''} className={className} />
        )}
        className="dark:bg-slate-900 dark:border-slate-700/40"
      />
    );
  };

  const renderBadgeStyle = () => {
    if (items.length === 0) {return renderEmptyState();}

    const maxVisible = device === 'mobile' ? 4 : 6;

    return (
      <PartnersBadgeShared
        items={items}
        brandColor={brandColor}
        secondary={secondary}
        mode={mode}
        title={title ?? 'Đối tác'}
        maxVisible={maxVisible}
        openInNewTab
        variant="preview"
        renderImage={(item, className) => (
          <PreviewImage src={item.url} alt={item.name ?? ''} className={className} />
        )}
      />
    );
  };

  const renderCarouselStyle = () => (
    <PartnersCarouselShared
      items={items}
      brandColor={brandColor}
        secondary={secondary}
        mode={mode}
      title={title ?? 'Đối tác'}
      device={device}
      openInNewTab
      renderImage={(item, className) => (
        <PreviewImage src={item.url} alt={item.name ?? ''} className={className} />
      )}
      className="dark:bg-slate-900 dark:border-slate-700/40"
    />
  );

  const renderFeaturedStyle = () => {
    if (items.length === 0) {return renderEmptyState();}
    const maxOthers = device === 'mobile' ? 4 : 6;
    return (
      <PartnersFeaturedShared
        items={items}
        title={title ?? 'Đối tác'}
        brandColor={brandColor}
        secondary={secondary}
        mode={mode}
        maxOthers={maxOthers}
        openInNewTab
        renderImage={(item, className) => (
          <PreviewImage src={item.url ?? ''} alt={item.name ?? ''} className={className} />
        )}
        className="dark:bg-slate-900 dark:border-slate-700/40"
      />
    );
  };

  return (
    <>
      <PreviewWrapper
        title="Preview Partners"
        device={device}
        setDevice={setDevice}
        previewStyle={previewStyle}
        setPreviewStyle={setPreviewStyle}
        styles={PARTNERS_STYLES}
        deviceWidthClass={deviceWidths[device]}
        info={`${items.length} logo • ${mode === 'dual' ? '2 màu' : '1 màu'}`}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <BrowserFrame>
          {previewStyle === 'grid' && renderGridStyle()}
          {previewStyle === 'marquee' && renderMarqueeStyle()}
          {previewStyle === 'mono' && renderMonoStyle()}
          {previewStyle === 'badge' && renderBadgeStyle()}
          {previewStyle === 'carousel' && renderCarouselStyle()}
          {previewStyle === 'featured' && renderFeaturedStyle()}
        </BrowserFrame>
      </PreviewWrapper>
      <ColorInfoPanel brandColor={brandColor} secondary={secondary} />
    </>
  );
};
