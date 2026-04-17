'use client';

import React, { useMemo, useState } from 'react';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { ServicesForm } from '../../services/_components/ServicesForm';
import { ServicesPreview } from '../../services/_components/ServicesPreview';
import { getServicesValidationResult } from '../../services/_lib/colors';
import { toServicesPersistItems } from '../../services/_lib/items';
import type { ServiceEditorItem, ServicesStyle } from '../../services/_types';
import { AlertTriangle, Eye } from 'lucide-react';

const DEFAULT_EDITOR_ITEMS: ServiceEditorItem[] = [
  { id: 1, icon: 'Briefcase', title: 'Tư vấn chiến lược', description: 'Đội ngũ chuyên gia giàu kinh nghiệm.' },
  { id: 2, icon: 'Shield', title: 'Bảo hành trọn đời', description: 'Cam kết chất lượng sản phẩm.' },
  { id: 3, icon: 'Package', title: 'Giao hàng nhanh', description: 'Miễn phí vận chuyển toàn quốc.' },
];

export default function ServicesCreatePage() {
  const COMPONENT_TYPE = 'Services';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Dịch vụ chi tiết', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const [servicesItems, setServicesItems] = useState<ServiceEditorItem[]>(DEFAULT_EDITOR_ITEMS);
  const [style, setStyle] = useState<ServicesStyle>('elegantGrid');

  const validation = useMemo(() => getServicesValidationResult({ primary, secondary, mode }), [primary, secondary, mode]);

  const warningMessages = useMemo(() => {
    const messages: string[] = [];

    if (mode === 'dual' && validation.harmonyStatus.isTooSimilar) {
      messages.push(`Màu phụ đang khá gần màu chính (deltaE = ${validation.harmonyStatus.deltaE}). Nên tăng độ tách biệt.`);
    }

    if (validation.accessibility.failing.length > 0) {
      messages.push(`Một số cặp màu chữ/nền chưa đủ tương phản (minLc = ${validation.accessibility.minLc.toFixed(1)}).`);
    }

    return messages;
  }, [mode, validation]);

  const onSubmit = (event: React.FormEvent) => {
    void handleSubmit(event, {
      items: toServicesPersistItems(servicesItems),
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
      <ServicesForm items={servicesItems} onChange={setServicesItems} brandColor={validation.colors.primary} />

      {warningMessages.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <div className="space-y-2">
            {warningMessages.map((message, idx) => (
              <div key={`${idx}-${message}`} className="flex items-start gap-2">
                {message.includes('deltaE') ? <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" /> : <Eye size={14} className="mt-0.5 flex-shrink-0" />}
                <p>{message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <ServicesPreview
        items={toServicesPersistItems(servicesItems)}
        brandColor={validation.colors.primary}
        secondary={validation.colors.secondary}
        mode={mode}
        selectedStyle={style}
        onStyleChange={setStyle}
        title={title}
        fontStyle={fontStyle}
        fontClassName="font-active"
      />
    </ComponentFormWrapper>
  );
}
