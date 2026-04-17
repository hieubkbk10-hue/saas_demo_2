'use client';

import React, { useMemo, useState } from 'react';
import { AlertTriangle, Eye, GripVertical, Package, Plus, Trash2 } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '../../../components/ui';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { PricingPreview } from '../../pricing/_components/PricingPreview';
import { getPricingValidationResult } from '../../pricing/_lib/colors';
import type {
  PricingConfig,
  PricingEditorPlan,
  PricingStyle,
} from '../../pricing/_types';

const DEFAULT_PLANS: PricingEditorPlan[] = [
  {
    id: 1,
    name: 'Cơ bản',
    price: '0',
    yearlyPrice: '0',
    period: '/tháng',
    features: ['Tính năng A', 'Tính năng B'],
    isPopular: false,
    buttonText: 'Bắt đầu',
    buttonLink: '/register',
  },
  {
    id: 2,
    name: 'Chuyên nghiệp',
    price: '299.000',
    yearlyPrice: '2.990.000',
    period: '/tháng',
    features: ['Tất cả Cơ bản', 'Tính năng C', 'Hỗ trợ email'],
    isPopular: true,
    buttonText: 'Mua ngay',
    buttonLink: '/checkout',
  },
  {
    id: 3,
    name: 'Doanh nghiệp',
    price: 'Liên hệ',
    yearlyPrice: 'Liên hệ',
    period: '',
    features: ['Tất cả Pro', 'Hỗ trợ 24/7', 'API Access'],
    isPopular: false,
    buttonText: 'Liên hệ',
    buttonLink: '/contact',
  },
];

type PricingMetaConfig = Pick<
  PricingConfig,
  'subtitle' | 'showBillingToggle' | 'monthlyLabel' | 'yearlyLabel' | 'yearlySavingText'
>;

const DEFAULT_META_CONFIG: PricingMetaConfig = {
  monthlyLabel: 'Hàng tháng',
  showBillingToggle: true,
  subtitle: 'Chọn gói phù hợp với nhu cầu của bạn',
  yearlyLabel: 'Hàng năm',
  yearlySavingText: 'Tiết kiệm 17%',
};

const sanitizeFeatures = (value: string) => (
  value
    .split(',')
    .map((feature) => feature.trim())
    .filter((feature) => feature.length > 0)
);

export default function PricingCreatePage() {
  const COMPONENT_TYPE = 'Pricing';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Bảng giá', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const [pricingStyle, setPricingStyle] = useState<PricingStyle>('cards');
  const [pricingPlans, setPricingPlans] = useState<PricingEditorPlan[]>(DEFAULT_PLANS);
  const [pricingConfig, setPricingConfig] = useState<PricingMetaConfig>(DEFAULT_META_CONFIG);

  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  const validation = useMemo(() => getPricingValidationResult({
    primary,
    secondary,
    mode,
  }), [primary, secondary, mode]);

  const warningMessages = useMemo(() => {
    const messages: string[] = [];

    if (mode === 'dual' && validation.harmonyStatus.isTooSimilar) {
      messages.push(`Màu phụ đang khá gần màu chính (deltaE = ${validation.harmonyStatus.deltaE}). Nên tăng độ tách biệt.`);
    }

    if (validation.accessibility.failing.length > 0) {
      messages.push(`Một số cặp màu chữ/nền chưa đủ tương phản APCA (minLc = ${validation.accessibility.minLc.toFixed(1)}).`);
    }

    return messages;
  }, [mode, validation]);

  const dragProps = (id: number) => ({
    draggable: true,
    onDragEnd: () => { setDraggedId(null); setDragOverId(null); },
    onDragOver: (event: React.DragEvent) => {
      event.preventDefault();
      if (draggedId !== id) {
        setDragOverId(id);
      }
    },
    onDragStart: () => { setDraggedId(id); },
    onDrop: (event: React.DragEvent) => {
      event.preventDefault();
      if (!draggedId || draggedId === id) {return;}

      const nextPlans = [...pricingPlans];
      const draggedIndex = nextPlans.findIndex((plan) => plan.id === draggedId);
      const dropIndex = nextPlans.findIndex((plan) => plan.id === id);

      if (draggedIndex < 0 || dropIndex < 0) {
        setDraggedId(null);
        setDragOverId(null);
        return;
      }

      const [moved] = nextPlans.splice(draggedIndex, 1);
      nextPlans.splice(dropIndex, 0, moved);
      setPricingPlans(nextPlans);
      setDraggedId(null);
      setDragOverId(null);
    },
  });

  const addPlan = () => {
    setPricingPlans((prev) => ([
      ...prev,
      {
        id: Date.now(),
        name: '',
        price: '',
        yearlyPrice: '',
        period: '/tháng',
        features: [],
        isPopular: false,
        buttonText: 'Chọn gói',
        buttonLink: '',
      },
    ]));
  };

  const updatePlan = (id: number, updates: Partial<PricingEditorPlan>) => {
    setPricingPlans((prev) => prev.map((plan) => (plan.id === id ? { ...plan, ...updates } : plan)));
  };

  const removePlan = (id: number) => {
    if (pricingPlans.length <= 1) {
      return;
    }

    setPricingPlans((prev) => prev.filter((plan) => plan.id !== id));
  };

  const onSubmit = (event: React.FormEvent) => {
    const payload: PricingConfig = {
      plans: pricingPlans.map((plan) => ({
        name: plan.name,
        price: plan.price,
        yearlyPrice: plan.yearlyPrice,
        period: plan.period,
        features: plan.features,
        isPopular: plan.isPopular,
        buttonText: plan.buttonText,
        buttonLink: plan.buttonLink,
      })),
      style: pricingStyle,
      ...pricingConfig,
    };

    void handleSubmit(event, payload as unknown as Record<string, unknown>);
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
          <CardTitle className="text-base">Cấu hình bảng giá</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Mô tả ngắn (subtitle)</Label>
            <Input
              placeholder="Chọn gói phù hợp với nhu cầu của bạn"
              value={pricingConfig.subtitle ?? ''}
              onChange={(event) => { setPricingConfig({ ...pricingConfig, subtitle: event.target.value }); }}
            />
          </div>

          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={pricingConfig.showBillingToggle}
                onChange={(event) => { setPricingConfig({ ...pricingConfig, showBillingToggle: event.target.checked }); }}
                className="h-4 w-4 rounded"
              />
              <span>Hiển thị toggle Tháng/Năm</span>
            </label>
          </div>

          {pricingConfig.showBillingToggle && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <Label className="text-xs">Label tháng</Label>
                <Input
                  placeholder="Hàng tháng"
                  value={pricingConfig.monthlyLabel ?? ''}
                  onChange={(event) => { setPricingConfig({ ...pricingConfig, monthlyLabel: event.target.value }); }}
                />
              </div>
              <div>
                <Label className="text-xs">Label năm</Label>
                <Input
                  placeholder="Hàng năm"
                  value={pricingConfig.yearlyLabel ?? ''}
                  onChange={(event) => { setPricingConfig({ ...pricingConfig, yearlyLabel: event.target.value }); }}
                />
              </div>
              <div>
                <Label className="text-xs">Badge tiết kiệm</Label>
                <Input
                  placeholder="Tiết kiệm 17%"
                  value={pricingConfig.yearlySavingText ?? ''}
                  onChange={(event) => { setPricingConfig({ ...pricingConfig, yearlySavingText: event.target.value }); }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Các gói dịch vụ ({pricingPlans.length})</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addPlan} className="gap-2">
            <Plus size={14} /> Thêm gói
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {pricingPlans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <Package size={32} className="text-slate-400" />
              </div>
              <h3 className="mb-1 font-medium text-slate-900 dark:text-slate-100">Chưa có gói nào</h3>
              <p className="mb-4 text-sm text-slate-500">Thêm gói đầu tiên để bắt đầu</p>
              <Button type="button" variant="outline" size="sm" onClick={addPlan} className="gap-2">
                <Plus size={14} /> Thêm gói
              </Button>
            </div>
          ) : (
            pricingPlans.map((plan, index) => (
              <div
                key={plan.id}
                {...dragProps(plan.id)}
                className={cn(
                  'space-y-3 rounded-lg bg-slate-50 p-4 transition-all dark:bg-slate-800',
                  draggedId === plan.id && 'scale-95 opacity-50',
                  dragOverId === plan.id && 'ring-2 ring-blue-500',
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical size={16} className="cursor-grab text-slate-400" />
                    <Label>Gói {index + 1}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={plan.isPopular}
                        onChange={(event) => { updatePlan(plan.id, { isPopular: event.target.checked }); }}
                        className="h-4 w-4 rounded"
                      />
                      Nổi bật
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500"
                      onClick={() => { removePlan(plan.id); }}
                      disabled={pricingPlans.length <= 1}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Input
                    placeholder="Tên gói"
                    value={plan.name}
                    onChange={(event) => { updatePlan(plan.id, { name: event.target.value }); }}
                  />
                  <Input
                    placeholder="Giá tháng (VD: 299.000)"
                    value={plan.price}
                    onChange={(event) => { updatePlan(plan.id, { price: event.target.value }); }}
                  />
                </div>

                {pricingConfig.showBillingToggle && (
                  <Input
                    placeholder="Giá năm (VD: 2.990.000)"
                    value={plan.yearlyPrice}
                    onChange={(event) => { updatePlan(plan.id, { yearlyPrice: event.target.value }); }}
                  />
                )}

                <Input
                  placeholder="Tính năng (phân cách bởi dấu phẩy)"
                  value={plan.features.join(', ')}
                  onChange={(event) => { updatePlan(plan.id, { features: sanitizeFeatures(event.target.value) }); }}
                />

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Input
                    placeholder="Text nút bấm"
                    value={plan.buttonText}
                    onChange={(event) => { updatePlan(plan.id, { buttonText: event.target.value }); }}
                  />
                  <Input
                    placeholder="Liên kết"
                    value={plan.buttonLink}
                    onChange={(event) => { updatePlan(plan.id, { buttonLink: event.target.value }); }}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {warningMessages.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
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

      <PricingPreview
        title={title}
        plans={pricingPlans}
        brandColor={primary}
        secondary={secondary}
        mode={mode}
        selectedStyle={pricingStyle}
        onStyleChange={setPricingStyle}
        config={pricingConfig}
        fontStyle={fontStyle}
        fontClassName="font-active"
      />
    </ComponentFormWrapper>
  );
}
