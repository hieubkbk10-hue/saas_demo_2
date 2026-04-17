'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Input, Label } from '../../../components/ui';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { VoucherPromotionsPreview } from '../../voucher-promotions/_components/VoucherPromotionsPreview';
import { normalizeVoucherLimit } from '@/lib/home-components/voucher-promotions';
import {
  DEFAULT_VOUCHER_PROMOTIONS_CONFIG,
  normalizeVoucherPromotionsTexts,
} from '../../voucher-promotions/_lib/constants';
import { getVoucherPromotionsValidationResult, calculateVoucherPromotionsAccentBalance } from '../../voucher-promotions/_lib/colors';
import type { VoucherPromotionsConfigState } from '../../voucher-promotions/_types';

export default function VoucherPromotionsCreatePage() {
  const COMPONENT_TYPE = 'VoucherPromotions';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Voucher khuyến mãi', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;
  const [voucherConfig, setVoucherConfig] = useState<VoucherPromotionsConfigState>(DEFAULT_VOUCHER_PROMOTIONS_CONFIG);

  const validation = useMemo(() => getVoucherPromotionsValidationResult({
    primary,
    secondary,
    mode,
  }), [primary, secondary, mode]);

  const accentBalance = useMemo(() => calculateVoucherPromotionsAccentBalance(mode, voucherConfig.style), [mode, voucherConfig.style]);

  const warningMessages = useMemo(() => {
    const warnings: string[] = [];

    if (mode === 'dual' && validation.harmonyStatus.isTooSimilar) {
      warnings.push(`Màu chính và màu phụ đang khá gần nhau (ΔE=${validation.harmonyStatus.deltaE}).`);
    }

    if (validation.accessibility.failing.length > 0) {
      warnings.push(`Có ${validation.accessibility.failing.length} cặp màu chưa đạt APCA (minLc=${validation.accessibility.minLc.toFixed(1)}).`);
    }

    return warnings;
  }, [mode, validation]);

  const onSubmit = (e: React.FormEvent) => {
    void handleSubmit(e, {
      ...voucherConfig,
      limit: normalizeVoucherLimit(voucherConfig.limit),
      texts: normalizeVoucherPromotionsTexts(voucherConfig.texts),
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
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Nội dung voucher khuyến mãi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tiêu đề</Label>
            <Input 
              value={voucherConfig.texts.heading} 
              onChange={(e) => setVoucherConfig({
                ...voucherConfig,
                texts: { ...voucherConfig.texts, heading: e.target.value }
              })} 
              placeholder="Voucher khuyến mãi" 
            />
          </div>
          <div className="space-y-2">
            <Label>Mô tả</Label>
            <textarea 
              value={voucherConfig.texts.description} 
              onChange={(e) => setVoucherConfig({
                ...voucherConfig,
                texts: { ...voucherConfig.texts, description: e.target.value }
              })} 
              placeholder="Áp dụng mã để nhận ưu đãi tốt nhất hôm nay."
              className="w-full min-h-[60px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>CTA label</Label>
              <Input 
                value={voucherConfig.texts.ctaLabel} 
                onChange={(e) => setVoucherConfig({
                  ...voucherConfig,
                  texts: { ...voucherConfig.texts, ctaLabel: e.target.value }
                })} 
                placeholder="Xem tất cả ưu đãi" 
              />
            </div>
            <div className="space-y-2">
              <Label>CTA link</Label>
              <Input 
                value={voucherConfig.ctaUrl} 
                onChange={(e) => setVoucherConfig({ ...voucherConfig, ctaUrl: e.target.value })} 
                placeholder="/promotions" 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Giới hạn voucher (1-8)</Label>
              <Input
                type="number"
                min={1}
                max={8}
                value={voucherConfig.limit}
                onChange={(e) => setVoucherConfig({ ...voucherConfig, limit: Number(e.target.value) })}
                placeholder="4"
              />
              <p className="text-xs text-slate-500">Dữ liệu tự động từ Promotions (chỉ voucher có mã).</p>
            </div>
          </div>

          {mode === 'dual' && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              <div className="font-medium mb-1">Accent Balance</div>
              <div>Primary: {accentBalance.primary}% • Secondary: {accentBalance.secondary}% • Neutral: {accentBalance.neutral}%</div>
            </div>
          )}

          {warningMessages.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <div className="font-medium mb-1">Cảnh báo màu sắc</div>
              <ul className="list-disc pl-4 space-y-1">
                {warningMessages.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <VoucherPromotionsPreview
        config={voucherConfig}
        mode={mode}
        limit={normalizeVoucherLimit(voucherConfig.limit)}
        brandColor={primary}
        secondary={secondary}
        selectedStyle={voucherConfig.style}
        onStyleChange={(nextStyle) => setVoucherConfig({ ...voucherConfig, style: nextStyle })}
        fontStyle={fontStyle}
        fontClassName="font-active"
      />
    </ComponentFormWrapper>
  );
}
