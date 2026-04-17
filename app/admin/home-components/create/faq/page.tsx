'use client';

import React, { useState } from 'react';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { FaqForm } from '../../faq/_components/FaqForm';
import { FaqPreview } from '../../faq/_components/FaqPreview';
import { DEFAULT_FAQ_CONFIG } from '../../faq/_lib/constants';
import type { FaqConfig, FaqItem, FaqStyle } from '../../faq/_types';

const INITIAL_FAQ_ITEMS: FaqItem[] = [
  { id: 1, question: 'Làm thế nào để đặt hàng?', answer: 'Bạn có thể đặt hàng trực tuyến qua website hoặc gọi hotline.' },
  { id: 2, question: 'Chính sách đổi trả ra sao?', answer: 'Chúng tôi hỗ trợ đổi trả trong vòng 30 ngày.' },
];

export default function FaqCreatePage() {
  const COMPONENT_TYPE = 'FAQ';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Câu hỏi thường gặp', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const brandMode = mode === 'single' ? 'single' : 'dual';
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const [faqItems, setFaqItems] = useState<FaqItem[]>(INITIAL_FAQ_ITEMS);
  const [style, setStyle] = useState<FaqStyle>('accordion');
  const [faqConfig, setFaqConfig] = useState<FaqConfig>(DEFAULT_FAQ_CONFIG);

  const onSubmit = (e: React.FormEvent) => {
    void handleSubmit(e, {
      items: faqItems.map((item) => ({ answer: item.answer, question: item.question })),
      style,
      ...faqConfig,
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
      <FaqForm
        faqItems={faqItems}
        setFaqItems={setFaqItems}
        faqStyle={style}
        brandColor={primary}
        faqConfig={faqConfig}
        setFaqConfig={setFaqConfig}
      />

      <FaqPreview
        items={faqItems}
        brandColor={primary}
        secondary={secondary}
        mode={brandMode}
        selectedStyle={style}
        onStyleChange={setStyle}
        config={faqConfig}
        title={title}
        fontStyle={fontStyle}
        fontClassName="font-active"
      />
    </ComponentFormWrapper>
  );
}
