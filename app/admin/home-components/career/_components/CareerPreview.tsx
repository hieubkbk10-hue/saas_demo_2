'use client';

import React from 'react';
import { AlertTriangle, Eye } from 'lucide-react';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewWrapper } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import {
  CAREER_STYLES,
  DEFAULT_CAREER_TEXTS,
} from '../_lib/constants';
import { getCareerValidationResult } from '../_lib/colors';
import { normalizeCareerJobs } from '../_lib/normalize';
import { CareerSectionShared } from './CareerSectionShared';
import type {
  CareerBrandMode,
  CareerStyle,
  CareerTexts,
  JobPosition,
} from '../_types';

interface CareerPreviewProps {
  jobs: JobPosition[];
  brandColor: string;
  secondary: string;
  mode?: CareerBrandMode;
  selectedStyle?: CareerStyle;
  onStyleChange?: (style: CareerStyle) => void;
  title?: string;
  texts?: CareerTexts;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}

export function CareerPreview({
  jobs,
  brandColor,
  secondary,
  mode = 'dual',
  selectedStyle = 'cards',
  onStyleChange,
  title = 'Tuyển dụng',
  texts = DEFAULT_CAREER_TEXTS,
  fontStyle,
  fontClassName,
}: CareerPreviewProps) {
  const { device, setDevice } = usePreviewDevice();

  const previewStyle = selectedStyle;
  const setPreviewStyle = (value: string) => onStyleChange?.(value as CareerStyle);

  const normalizedJobs = React.useMemo(
    () => normalizeCareerJobs(jobs),
    [jobs],
  );

  const validation = React.useMemo(() => getCareerValidationResult({
    primary: brandColor,
    secondary,
    mode,
  }), [brandColor, secondary, mode]);

  const warningMessages = React.useMemo(() => {
    const warnings: string[] = [];

    if (mode === 'dual' && validation.harmonyStatus.isTooSimilar) {
      warnings.push(`Màu phụ đang khá gần màu chính (deltaE = ${validation.harmonyStatus.deltaE}). Nên tăng độ tách biệt.`);
    }

    if (validation.accessibility.failing.length > 0) {
      warnings.push(`Một số cặp màu chữ/nền chưa đủ tương phản APCA (minLc = ${validation.accessibility.minLc.toFixed(1)}).`);
    }

    return warnings;
  }, [mode, validation]);

  const modeLabel = mode === 'single' ? '1 màu (single)' : '2 màu (dual)';

  return (
    <div className="space-y-3">
      <PreviewWrapper
        title="Preview Tuyển dụng"
        device={device}
        setDevice={setDevice}
        previewStyle={previewStyle}
        setPreviewStyle={setPreviewStyle}
        styles={CAREER_STYLES}
        info={`${normalizedJobs.length} vị trí • ${modeLabel}`}
        deviceWidthClass={deviceWidths[device]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <BrowserFrame url="yoursite.com/careers">
          <CareerSectionShared
            context="preview"
            jobs={normalizedJobs}
            style={previewStyle}
            title={title}
            tokens={validation.tokens}
            device={device}
            texts={texts}
          />
        </BrowserFrame>
      </PreviewWrapper>

      {mode === 'dual' && (
        <ColorInfoPanel
          brandColor={brandColor}
          secondary={validation.resolvedSecondary}
          description="Màu phụ áp dụng cho badge phòng ban, mức lương, timeline accent và metadata tuyển dụng."
        />
      )}

      {warningMessages.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <div className="space-y-2">
            {warningMessages.map((message) => (
              <div key={message} className="flex items-start gap-2">
                {message.includes('deltaE')
                  ? <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                  : <Eye size={14} className="mt-0.5 flex-shrink-0" />}
                <p>{message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
