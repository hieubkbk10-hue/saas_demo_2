'use client';

import React, { useState } from 'react';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { toast } from 'sonner';
import { CTAForm } from '../../cta/_components/CTAForm';
import { CTAPreview } from '../../cta/_components/CTAPreview';
import { DEFAULT_CTA_CONFIG } from '../../cta/_lib/constants';
import { getCTAValidationResult } from '../../cta/_lib/colors';
import type { CTAConfig, CTAStyle } from '../../cta/_types';

const INITIAL_CTA_CONFIG: CTAConfig = {
  ...DEFAULT_CTA_CONFIG,
  buttonLink: '/register',
  buttonText: 'Đăng ký ngay',
  description: 'Đăng ký ngay hôm nay để nhận ưu đãi đặc biệt',
  secondaryButtonLink: '/about',
  secondaryButtonText: 'Tìm hiểu thêm',
  title: 'Sẵn sàng bắt đầu?',
};

export default function CTACreatePage() {
  const COMPONENT_TYPE = 'CTA';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Kêu gọi hành động (CTA)', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const [ctaConfig, setCtaConfig] = useState<CTAConfig>(INITIAL_CTA_CONFIG);
  const [ctaStyle, setCtaStyle] = useState<CTAStyle>('banner');

  const onSubmit = (e: React.FormEvent) => {
    const { harmonyStatus } = getCTAValidationResult({
      config: ctaConfig,
      primary,
      secondary,
      mode,
      style: ctaStyle,
    });

    if (mode === 'dual' && harmonyStatus.isTooSimilar) {
      e.preventDefault();
      toast.error(`Không thể lưu CTA: deltaE=${harmonyStatus.deltaE} < 20 (Primary/Secondary quá giống nhau).`);
      return;
    }

    void handleSubmit(e, { ...ctaConfig, style: ctaStyle });
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
      <CTAForm
        config={ctaConfig}
        onChange={setCtaConfig}
      />

      <CTAPreview
        config={ctaConfig}
        brandColor={primary}
        secondary={secondary}
        mode={mode}
        selectedStyle={ctaStyle}
        onStyleChange={setCtaStyle}
        fontStyle={fontStyle}
        fontClassName="font-active"
      />
    </ComponentFormWrapper>
  );
}
