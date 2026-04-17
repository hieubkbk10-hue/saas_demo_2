'use client';

import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewWrapper } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import {
  getClientsValidationResult,
  type ClientsAccessibilityScore,
  type ClientsHarmonyStatus,
} from '../_lib/colors';
import { ClientsSectionShared } from './ClientsSectionShared';
import type { ClientItem, ClientsBrandMode, ClientsStyle } from '../_types';

interface ClientsPreviewProps {
  items: ClientItem[];
  title?: string;
  brandColor: string;
  secondary: string;
  mode?: ClientsBrandMode;
  selectedStyle?: ClientsStyle;
  onStyleChange?: (style: ClientsStyle) => void;
  warningMessages?: string[];
  showValidationSummary?: boolean;
  texts?: Record<string, string>;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}

const STYLES: Array<{ id: ClientsStyle; label: string }> = [
  { id: 'simpleGrid', label: 'Simple Grid' },
  { id: 'compactInline', label: 'Compact Inline' },
  { id: 'subtleMarquee', label: 'Subtle Marquee' },
  { id: 'grid', label: 'Grid' },
  { id: 'carousel', label: 'Carousel' },
  { id: 'featured', label: 'Featured' },
];

const getImageInfoText = (style: ClientsStyle, count: number) => {
  if (count === 0) {return 'Chưa có logo';}
  if (style === 'simpleGrid') {return `${count} logo • Grayscale grid`;}
  if (style === 'compactInline') {return `${count} logo • Inline flex`;}
  if (style === 'subtleMarquee') {return `${count} logo • Slow scroll`;}
  if (style === 'grid') {return `${count} logo • 216×84px`;}
  if (style === 'featured') {
    return count <= 4 ? `${count} logo • 240×96px` : `4 featured + ${count - 4} khác`;
  }
  return `${count} logo • 240×96px`;
};

const getSummaryWarnings = (
  mode: ClientsBrandMode,
  harmonyStatus: ClientsHarmonyStatus,
  accessibility: ClientsAccessibilityScore,
) => {
  const warnings: string[] = [];

  if (mode === 'dual' && harmonyStatus.isTooSimilar) {
    warnings.push(`Màu chính/phụ đang khá giống nhau (deltaE=${harmonyStatus.deltaE} < 20).`);
  }

  if (accessibility.failing.length > 0) {
    warnings.push(`Một số cặp chữ/nền có APCA thấp (minLc=${accessibility.minLc.toFixed(1)}).`);
  }

  return warnings;
};

export const ClientsPreview = ({
  items,
  title = 'Khách hàng tin tưởng',
  brandColor,
  secondary,
  mode = 'dual',
  selectedStyle = 'simpleGrid',
  onStyleChange,
  warningMessages,
  showValidationSummary = false,
  texts = {},
  fontStyle,
  fontClassName,
}: ClientsPreviewProps) => {
  const { device, setDevice } = usePreviewDevice();

  const validation = React.useMemo(() => getClientsValidationResult({
    primary: brandColor,
    secondary,
    mode,
    style: selectedStyle,
  }), [brandColor, secondary, mode, selectedStyle]);

  const info = getImageInfoText(selectedStyle, items.length);
  const generatedWarnings = getSummaryWarnings(mode, validation.harmonyStatus, validation.accessibility);
  const warnings = warningMessages ?? generatedWarnings;

  return (
    <>
      <PreviewWrapper
        title="Preview Clients"
        device={device}
        setDevice={setDevice}
        previewStyle={selectedStyle}
        setPreviewStyle={(value) => onStyleChange?.(value as ClientsStyle)}
        styles={STYLES}
        info={info}
        deviceWidthClass={deviceWidths[device]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <BrowserFrame>
          {items.length === 0 ? (
            <section className="px-4 py-8" style={{ backgroundColor: validation.tokens.neutralSurface }}>
              <div className="flex flex-col items-center justify-center h-40">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: validation.tokens.placeholderIconBackground }}>
                  <ImageIcon size={28} style={{ color: validation.tokens.placeholderIcon }} />
                </div>
                <p className="text-sm font-medium" style={{ color: validation.tokens.neutralText }}>Chưa có logo khách hàng</p>
                <p className="text-xs mt-1" style={{ color: validation.tokens.placeholderText }}>Thêm ít nhất 3 logo để hiển thị đẹp hơn</p>
              </div>
            </section>
          ) : (
            <ClientsSectionShared
              context="preview"
              title={title}
              style={selectedStyle}
              items={items}
              tokens={validation.tokens}
              device={device}
              texts={texts}
            />
          )}
        </BrowserFrame>
      </PreviewWrapper>

      {mode === 'dual' && (
        <ColorInfoPanel
          brandColor={validation.tokens.primary}
          secondary={validation.tokens.secondary}
          description="Màu phụ áp dụng cho badge, điểm nhấn card, nút điều hướng carousel và thành phần accent của Clients."
        />
      )}

      <div className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <ImageIcon size={14} className="text-slate-400 flex-shrink-0" />
          <div className="text-xs text-slate-600 dark:text-slate-400">
            {selectedStyle === 'simpleGrid' && <span><strong>Simple Grid</strong> • Static grid, full color, clean minimal</span>}
            {selectedStyle === 'compactInline' && <span><strong>Compact Inline</strong> • Single row flexbox, full color, minimal</span>}
            {selectedStyle === 'subtleMarquee' && <span><strong>Subtle Marquee</strong> • Very slow scroll (60s), full color, clean</span>}
            {selectedStyle === 'grid' && <span><strong>216×84px</strong> PNG trong suốt • Grid tĩnh, max 12 logo</span>}
            {selectedStyle === 'carousel' && <span><strong>240×96px</strong> PNG trong suốt • Kéo/vuốt ngang</span>}
            {selectedStyle === 'featured' && <span><strong>240×96px</strong> PNG trong suốt • 4 logo featured</span>}
          </div>
        </div>
      </div>

      {(showValidationSummary && warnings.length > 0) && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <p className="font-semibold mb-1">Cảnh báo màu (warning-only):</p>
          <ul className="list-disc pl-4 space-y-1">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};
