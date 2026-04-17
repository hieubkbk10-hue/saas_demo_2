'use client';

import React from 'react';
import { AlertTriangle, Eye } from 'lucide-react';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewWrapper } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import {
  SERVICE_LIST_STYLES,
} from '../_lib/constants';
import {
  getServiceListValidationResult,
} from '../_lib/colors';
import { ServiceListSectionShared } from './ServiceListSectionShared';
import type {
  ServiceListBrandMode,
  ServiceListPreviewItem,
  ServiceListStyle,
} from '../_types';

interface ServiceListPreviewProps {
  brandColor: string;
  secondary: string;
  mode?: ServiceListBrandMode;
  itemCount: number;
  selectedStyle?: ServiceListStyle;
  onStyleChange?: (style: ServiceListStyle) => void;
  items?: ServiceListPreviewItem[];
  title?: string;
  showViewAll?: boolean;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}

const MOCK_SERVICES: ServiceListPreviewItem[] = [
  {
    description: 'Phong cách hiện đại, tối giản với vật liệu cao cấp nhập khẩu từ Ý.',
    id: 1,
    name: 'Thiết kế Nội thất Penthouse',
    price: '0',
    tag: 'hot',
  },
  {
    description: 'Giải pháp bền vững cho đô thị.',
    id: 2,
    name: 'Kiến trúc Xanh Vertical',
    price: '15000000',
    tag: 'new',
  },
  {
    description: 'Không gian thiền định tại gia.',
    id: 3,
    name: 'Cảnh quan Sân vườn Zen',
    price: '8500000',
  },
  {
    description: 'Tự động hóa toàn diện.',
    id: 4,
    name: 'Smart Home Hub',
    price: '25000000',
  },
  {
    description: 'Phục dựng di sản.',
    id: 5,
    name: 'Biệt thự Cổ',
    price: '0',
  },
  {
    description: 'Nghệ thuật ánh sáng.',
    id: 6,
    name: 'Lighting Art',
    price: '12000000',
    tag: 'new',
  },
];

export const ServiceListPreview = ({
  brandColor,
  secondary,
  mode = 'dual',
  itemCount,
  selectedStyle = 'grid',
  onStyleChange,
  items,
  title = 'Dịch vụ',
  showViewAll = true,
  fontStyle,
  fontClassName,
}: ServiceListPreviewProps) => {
  const { device, setDevice } = usePreviewDevice();

  const previewStyle = selectedStyle;
  const setPreviewStyle = (value: string) => onStyleChange?.(value as ServiceListStyle);

  const targetCount = Math.max(itemCount, 6);
  const displayItems: ServiceListPreviewItem[] = items && items.length > 0
    ? items
    : MOCK_SERVICES.slice(0, targetCount);

  const validation = React.useMemo(() => getServiceListValidationResult({
    mode,
    primary: brandColor,
    secondary,
  }), [brandColor, secondary, mode]);

  const warningMessages = React.useMemo(() => {
    const messages: string[] = [];

    if (mode === 'dual' && validation.harmonyStatus.isTooSimilar) {
      messages.push(`Màu phụ đang khá gần màu chính (deltaE = ${validation.harmonyStatus.deltaE}). Nên tăng độ tách biệt.`);
    }

    if (validation.accessibility.failing.length > 0) {
      messages.push(`Một số cặp màu chữ/nền chưa đủ tương phản APCA (minLc = ${validation.accessibility.minLc.toFixed(1)}).`);
    }

    return messages;
  }, [mode, validation]);

  const modeLabel = mode === 'single' ? '1 màu (single)' : '2 màu (dual)';

  return (
    <div className="space-y-3">
      <PreviewWrapper
        title="Preview Dịch vụ"
        device={device}
        setDevice={setDevice}
        previewStyle={previewStyle}
        setPreviewStyle={setPreviewStyle}
        styles={SERVICE_LIST_STYLES}
        info={`${displayItems.length} dịch vụ • ${modeLabel}`}
        deviceWidthClass={deviceWidths[device]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <BrowserFrame url="yoursite.com/services">
          <ServiceListSectionShared
            context="preview"
            mode={mode}
            style={previewStyle}
            sectionTitle={title}
            items={displayItems}
            tokens={validation.tokens}
            device={device}
            showViewAll={showViewAll}
          />
        </BrowserFrame>
      </PreviewWrapper>

      {mode === 'dual' && (
        <ColorInfoPanel
          brandColor={brandColor}
          secondary={validation.resolvedSecondary}
          description="Màu phụ áp dụng cho giá, badge và hành động điều hướng trong ServiceList."
        />
      )}

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
    </div>
  );
};
