'use client';

import React from 'react';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { ProcessForm } from '../../process/_components/ProcessForm';
import { ProcessPreview } from '../../process/_components/ProcessPreview';
import {
  createProcessFormStep,
  normalizeProcessRenderSteps,
  serializeProcessFormSteps,
  type ProcessFormStep,
} from '../../process/_lib/normalize';
import type { ProcessBrandMode, ProcessStyle } from '../../process/_types';

const DEFAULT_CREATE_STEPS: ProcessFormStep[] = [
  createProcessFormStep({
    description: 'Lắng nghe và tìm hiểu nhu cầu của khách hàng một cách chi tiết.',
    icon: '1',
    title: 'Tiếp nhận yêu cầu',
  }),
  createProcessFormStep({
    description: 'Đưa ra giải pháp phù hợp nhất với ngân sách và mục tiêu.',
    icon: '2',
    title: 'Phân tích & Tư vấn',
  }),
  createProcessFormStep({
    description: 'Thực hiện dự án theo đúng tiến độ và chất lượng cam kết.',
    icon: '3',
    title: 'Triển khai',
  }),
  createProcessFormStep({
    description: 'Bàn giao sản phẩm và hỗ trợ sau bán hàng tận tâm.',
    icon: '4',
    title: 'Bàn giao & Hỗ trợ',
  }),
];

export default function ProcessCreatePage() {
  const COMPONENT_TYPE = 'Process';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Quy trình làm việc', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const [steps, setSteps] = React.useState<ProcessFormStep[]>(DEFAULT_CREATE_STEPS);
  const [style, setStyle] = React.useState<ProcessStyle>('horizontal');

  const normalizedPreviewSteps = React.useMemo(
    () => normalizeProcessRenderSteps(serializeProcessFormSteps(steps)),
    [steps],
  );

  const onSubmit = (event: React.FormEvent) => {
    void handleSubmit(event, {
      steps: serializeProcessFormSteps(steps),
      style,
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
      <ProcessForm steps={steps} onChange={setSteps} secondary={secondary} />

      <ProcessPreview
        steps={normalizedPreviewSteps}
        brandColor={primary}
        secondary={secondary}
        mode={mode as ProcessBrandMode}
        selectedStyle={style}
        onStyleChange={setStyle}
        fontStyle={fontStyle}
        fontClassName="font-active"
      />
    </ComponentFormWrapper>
  );
}
