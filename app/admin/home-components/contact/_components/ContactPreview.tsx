'use client';

import React from 'react';
import { AlertTriangle, Eye } from 'lucide-react';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewWrapper } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import { CONTACT_STYLES } from '../_lib/constants';
import { getContactValidationResult } from '../_lib/colors';
import { normalizeContactConfig } from '../_lib/normalize';
import { ContactSectionShared } from './ContactSectionShared';
import type { ContactMapData } from '@/lib/contact/getContactMapData';
import type {
  ContactBrandMode,
  ContactConfigState,
  ContactStyle,
} from '../_types';

interface ContactPreviewProps {
  config: ContactConfigState;
  brandColor: string;
  secondary: string;
  mode?: ContactBrandMode;
  selectedStyle?: ContactStyle;
  onStyleChange?: (style: ContactStyle) => void;
  title?: string;
  mapData?: ContactMapData | null;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}

export function ContactPreview({
  config,
  brandColor,
  secondary,
  mode = 'dual',
  selectedStyle,
  onStyleChange,
  title,
  mapData,
  fontStyle,
  fontClassName,
}: ContactPreviewProps) {
  const { device, setDevice } = usePreviewDevice();
  const normalizedConfig = React.useMemo(() => normalizeContactConfig(config), [config]);
  const previewStyle = selectedStyle ?? normalizedConfig.style;

  const validation = React.useMemo(() => getContactValidationResult({
    primary: brandColor,
    secondary,
    mode,
  }), [brandColor, secondary, mode]);

  const warningMessages = React.useMemo(() => {
    if (mode === 'single') {return [];}

    const messages: string[] = [];

    if (validation.harmonyStatus.isTooSimilar) {
      messages.push(`Màu chính và màu phụ đang khá gần nhau (deltaE=${validation.harmonyStatus.deltaE}).`);
    }

    if (validation.accessibility.failing.length > 0) {
      messages.push(`Có ${validation.accessibility.failing.length} cặp màu chưa đạt APCA (minLc=${validation.accessibility.minLc.toFixed(1)}).`);
    }

    return messages;
  }, [mode, validation]);

  const infoParts: string[] = [];
  if (normalizedConfig.showMap) {
    if (!mapData) {
      infoParts.push('Bản đồ (đang tải)');
    } else if (mapData.mapProvider === 'google_embed') {
      infoParts.push(mapData.googleMapEmbedIframe ? 'Bản đồ Google' : 'Bản đồ (thiếu iframe)');
    } else {
      infoParts.push('Bản đồ OSM');
    }
  }

  const activeSocials = normalizedConfig.socialLinks.filter((social) => social.url.trim().length > 0);
  const activeItems = normalizedConfig.contactItems.filter((item) => item.value.trim().length > 0 || (item.href ?? '').trim().length > 0);
  if (activeItems.length > 0) {infoParts.push(`${activeItems.length} dòng`);}
  if (activeSocials.length > 0) {infoParts.push(`${activeSocials.length} MXH`);}

  infoParts.push(mode === 'single' ? '1 màu' : '2 màu');

  return (
    <div className="space-y-3">
      <PreviewWrapper
        title="Preview Contact"
        device={device}
        setDevice={setDevice}
        previewStyle={previewStyle}
        setPreviewStyle={(value) => onStyleChange?.(value as ContactStyle)}
        styles={CONTACT_STYLES}
        info={infoParts.join(' • ')}
        deviceWidthClass={deviceWidths[device]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <BrowserFrame url="yoursite.com/contact">
          <ContactSectionShared
            config={{ ...normalizedConfig, style: previewStyle }}
            style={previewStyle}
            tokens={validation.tokens}
            mode={mode}
            context="preview"
            device={device}
            title={title}
            mapData={mapData ?? undefined}
          />
        </BrowserFrame>
      </PreviewWrapper>

      {mode === 'dual' && (
        <>
          <ColorInfoPanel
            brandColor={brandColor}
            secondary={validation.resolvedSecondary}
            description="Màu phụ áp dụng cho icon tint, badge, CTA phụ và social accents của Contact."
          />

          {warningMessages.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <div className="space-y-2">
                {warningMessages.map((message) => (
                  <div key={message} className="flex items-start gap-2">
                    {message.includes('deltaE') ? <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" /> : <Eye size={14} className="mt-0.5 flex-shrink-0" />}
                    <p>{message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
