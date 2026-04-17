'use client';

import React, { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { TestimonialsPreview } from '../../testimonials/_components/TestimonialsPreview';
import { TestimonialsForm } from '../../testimonials/_components/TestimonialsForm';
import {
  buildTestimonialsWarningMessages,
  getTestimonialsValidationResult,
  resolveSecondaryForMode,
} from '../../testimonials/_lib/colors';
import type { TestimonialsBrandMode, TestimonialsItem, TestimonialsStyle } from '../../testimonials/_types';

export default function TestimonialsCreatePage() {
  const COMPONENT_TYPE = 'Testimonials';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Đánh giá / Review', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const brandMode: TestimonialsBrandMode = mode === 'single' ? 'single' : 'dual';
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const [items, setItems] = useState<TestimonialsItem[]>([
    {
      avatar: '',
      content: 'Dịch vụ tuyệt vời! Chúng tôi rất hài lòng với chất lượng sản phẩm và dịch vụ hỗ trợ.',
      id: 'testimonial-1',
      name: 'Nguyễn Văn A',
      rating: 5,
      role: 'CEO, ABC Corp',
    },
    {
      avatar: '',
      content: 'Chất lượng vượt mong đợi. Đội ngũ chuyên nghiệp và tận tâm.',
      id: 'testimonial-2',
      name: 'Trần Thị B',
      rating: 5,
      role: 'Manager, XYZ Ltd',
    },
  ]);

  const [style, setStyle] = useState<TestimonialsStyle>('cards');

  const resolvedSecondary = useMemo(
    () => resolveSecondaryForMode(primary, secondary, brandMode),
    [primary, secondary, brandMode],
  );

  const warningMessages = useMemo(() => {
    const validation = getTestimonialsValidationResult({
      mode: brandMode,
      primary,
      secondary: resolvedSecondary,
      style,
    });

    return buildTestimonialsWarningMessages({ mode: brandMode, validation });
  }, [primary, resolvedSecondary, brandMode, style]);

  const onSubmit = (event: React.FormEvent) => {
    void handleSubmit(event, {
      items: items.map((item) => ({
        avatar: item.avatar,
        content: item.content,
        name: item.name,
        rating: item.rating,
        role: item.role,
      })),
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
      <TestimonialsForm items={items} setItems={setItems} />

      {warningMessages.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div className="space-y-1">
              {warningMessages.map((message, idx) => (
                <p key={`testimonials-create-warning-${idx}`}>{message}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      <TestimonialsPreview
        items={items}
        brandColor={primary}
        secondary={resolvedSecondary}
        mode={brandMode}
        selectedStyle={style}
        onStyleChange={setStyle}
        fontStyle={fontStyle}
        fontClassName="font-active"
      />

      {brandMode === 'dual' && <ColorInfoPanel brandColor={primary} secondary={resolvedSecondary} />}
    </ComponentFormWrapper>
  );
}
