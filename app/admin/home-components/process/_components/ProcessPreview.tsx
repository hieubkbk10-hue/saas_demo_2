'use client';

import React from 'react';
import { ProcessSectionShared } from './ProcessSectionShared';
import { normalizeProcessRenderSteps } from '../_lib/normalize';
import type { ProcessBrandMode, ProcessStyle } from '../_types';
import { usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';

interface ProcessPreviewProps {
  steps: unknown;
  brandColor: string;
  secondary: string;
  mode: ProcessBrandMode;
  selectedStyle?: ProcessStyle;
  onStyleChange?: (style: ProcessStyle) => void;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}

export const ProcessPreview = ({
  steps,
  brandColor,
  secondary,
  mode,
  selectedStyle = 'horizontal',
  onStyleChange,
  fontStyle,
  fontClassName,
}: ProcessPreviewProps) => {
  const { device, setDevice } = usePreviewDevice();
  const normalizedSteps = React.useMemo(() => normalizeProcessRenderSteps(steps), [steps]);

  return (
    <ProcessSectionShared
      steps={normalizedSteps}
      sectionTitle="Quy trình làm việc"
      style={selectedStyle}
      brandColor={brandColor}
      secondary={secondary}
      mode={mode}
      context="preview"
      previewDevice={device}
      setPreviewDevice={setDevice}
      includePreviewWrapper
      previewStyle={selectedStyle}
      onPreviewStyleChange={onStyleChange}
      fontStyle={fontStyle}
      fontClassName={fontClassName}
    />
  );
};
