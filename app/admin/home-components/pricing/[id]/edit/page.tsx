'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { AlertTriangle, Eye, GripVertical, Loader2, Package, Plus, Tag, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '../../../../components/ui';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { PricingPreview } from '../../_components/PricingPreview';
import { TextsForm } from '../../_components/TextsForm';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import {
  DEFAULT_PRICING_CONFIG,
  DEFAULT_PRICING_TEXTS,
  normalizePricingConfig,
} from '../../_lib/constants';
import { getPricingValidationResult } from '../../_lib/colors';
import type {
  PricingConfig,
  PricingEditorPlan,
  PricingStyle,
} from '../../_types';

const sanitizeFeatures = (value: string) => (
  value
    .split(',')
    .map((feature) => feature.trim())
    .filter((feature) => feature.length > 0)
);

type PricingMetaConfig = Pick<
  PricingConfig,
  'subtitle' | 'showBillingToggle' | 'monthlyLabel' | 'yearlyLabel' | 'yearlySavingText'
>;

const toEditorPlan = (plan: PricingConfig['plans'][number], index: number): PricingEditorPlan => ({
  id: typeof plan.id === 'number' ? plan.id : index + 1,
  name: plan.name,
  price: plan.price,
  yearlyPrice: plan.yearlyPrice ?? '',
  period: plan.period,
  features: Array.isArray(plan.features) ? plan.features : [],
  isPopular: Boolean(plan.isPopular),
  buttonText: plan.buttonText,
  buttonLink: plan.buttonLink,
});

const normalizeMetaConfig = (config: PricingConfig): PricingMetaConfig => ({
  subtitle: config.subtitle ?? DEFAULT_PRICING_CONFIG.subtitle,
  showBillingToggle: config.showBillingToggle !== false,
  monthlyLabel: config.monthlyLabel ?? DEFAULT_PRICING_CONFIG.monthlyLabel,
  yearlyLabel: config.yearlyLabel ?? DEFAULT_PRICING_CONFIG.yearlyLabel,
  yearlySavingText: config.yearlySavingText ?? DEFAULT_PRICING_CONFIG.yearlySavingText,
});

const toSnapshot = (payload: {
  title: string;
  active: boolean;
  style: PricingStyle;
  subtitle: string;
  showBillingToggle: boolean;
  monthlyLabel: string;
  yearlyLabel: string;
  yearlySavingText: string;
  texts: Record<string, string>;
  plans: Array<{
    name: string;
    price: string;
    yearlyPrice: string;
    period: string;
    features: string[];
    isPopular: boolean;
    buttonText: string;
    buttonLink: string;
  }>;
}) => JSON.stringify(payload);

const COMPONENT_TYPE = 'Pricing';

export default function PricingEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { customState, effectiveColors, initialCustom, setCustomState, setInitialCustom, showCustomBlock } = useTypeColorOverrideState(COMPONENT_TYPE);
  const { customState: customFontState, effectiveFont, initialCustom: initialFontCustom, setCustomState: setCustomFontState, setInitialCustom: setInitialFontCustom, showCustomBlock: showFontCustomBlock } = useTypeFontOverrideState(COMPONENT_TYPE);
  const setTypeColorOverride = useMutation(api.homeComponentSystemConfig.setTypeColorOverride);
  const setTypeFontOverride = useMutation(api.homeComponentSystemConfig.setTypeFontOverride);
  const component = useQuery(api.homeComponents.getById, { id: id as Id<'homeComponents'> });
  const updateMutation = useMutation(api.homeComponents.update);

  const [title, setTitle] = useState('');
  const [active, setActive] = useState(true);
  const [pricingStyle, setPricingStyle] = useState<PricingStyle>('cards');
  const [pricingPlans, setPricingPlans] = useState<PricingEditorPlan[]>([]);
  const [pricingConfig, setPricingConfig] = useState<PricingMetaConfig>({
    monthlyLabel: DEFAULT_PRICING_CONFIG.monthlyLabel,
    showBillingToggle: DEFAULT_PRICING_CONFIG.showBillingToggle,
    subtitle: DEFAULT_PRICING_CONFIG.subtitle,
    yearlyLabel: DEFAULT_PRICING_CONFIG.yearlyLabel,
    yearlySavingText: DEFAULT_PRICING_CONFIG.yearlySavingText,
  });
  const [texts, setTexts] = useState<Record<string, string>>(DEFAULT_PRICING_TEXTS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null);

  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  useEffect(() => {
    if (!component) {return;}

    if (component.type !== 'Pricing') {
      router.replace(`/admin/home-components/${id}/edit`);
      return;
    }

    const normalizedConfig = normalizePricingConfig(component.config ?? {});

    setTitle(component.title);
    setActive(component.active);
    setPricingStyle(normalizedConfig.style);
    setPricingPlans(normalizedConfig.plans.map((plan, index) => toEditorPlan(plan, index)));
    setPricingConfig(normalizeMetaConfig(normalizedConfig));
    setTexts(normalizedConfig.texts ?? DEFAULT_PRICING_TEXTS);
  }, [component, id, router]);

  useEffect(() => {
    if (!component) {return;}

    const normalizedConfig = normalizePricingConfig(component.config ?? {});
    const snapshot = toSnapshot({
      title: component.title,
      active: component.active,
      style: normalizedConfig.style,
      subtitle: String(normalizedConfig.subtitle ?? DEFAULT_PRICING_CONFIG.subtitle),
      showBillingToggle: normalizedConfig.showBillingToggle !== false,
      monthlyLabel: String(normalizedConfig.monthlyLabel ?? DEFAULT_PRICING_CONFIG.monthlyLabel),
      yearlyLabel: String(normalizedConfig.yearlyLabel ?? DEFAULT_PRICING_CONFIG.yearlyLabel),
      yearlySavingText: String(normalizedConfig.yearlySavingText ?? DEFAULT_PRICING_CONFIG.yearlySavingText),
      texts: normalizedConfig.texts ?? DEFAULT_PRICING_TEXTS,
      plans: normalizedConfig.plans.map((plan) => ({
        name: plan.name,
        price: plan.price,
        yearlyPrice: String(plan.yearlyPrice ?? ''),
        period: plan.period,
        features: Array.isArray(plan.features) ? plan.features : [],
        isPopular: Boolean(plan.isPopular),
        buttonText: plan.buttonText,
        buttonLink: plan.buttonLink,
      })),
    });

    setInitialSnapshot(snapshot);
  }, [component]);

  const currentSnapshot = toSnapshot({
    title,
    active,
    style: pricingStyle,
    subtitle: String(pricingConfig.subtitle ?? ''),
    showBillingToggle: pricingConfig.showBillingToggle !== false,
    monthlyLabel: String(pricingConfig.monthlyLabel ?? ''),
    yearlyLabel: String(pricingConfig.yearlyLabel ?? ''),
    yearlySavingText: String(pricingConfig.yearlySavingText ?? ''),
    texts,
    plans: pricingPlans.map((plan) => ({
      name: plan.name,
      price: plan.price,
      yearlyPrice: String(plan.yearlyPrice ?? ''),
      period: plan.period,
      features: Array.isArray(plan.features) ? plan.features : [],
      isPopular: Boolean(plan.isPopular),
      buttonText: plan.buttonText,
      buttonLink: plan.buttonLink,
    })),
  });

  const resolvedCustomSecondary = resolveSecondaryByMode(customState.mode, customState.primary, customState.secondary);
  const customChanged = showCustomBlock
    ? customState.enabled !== initialCustom.enabled
      || customState.mode !== initialCustom.mode
      || customState.primary !== initialCustom.primary
      || resolvedCustomSecondary !== initialCustom.secondary
    : false;
  const customFontChanged = showFontCustomBlock
    ? customFontState.enabled !== initialFontCustom.enabled
      || customFontState.fontKey !== initialFontCustom.fontKey
    : false;
  const hasChanges = initialSnapshot !== null && (currentSnapshot !== initialSnapshot || customChanged || customFontChanged);

  const validation = useMemo(() => getPricingValidationResult({
    primary: effectiveColors.primary,
    secondary: effectiveColors.secondary,
    mode: effectiveColors.mode,
  }), [effectiveColors]);

  const warningMessages = useMemo(() => {
    const messages: string[] = [];

    if (effectiveColors.mode === 'dual' && validation.harmonyStatus.isTooSimilar) {
      messages.push(`Màu phụ đang khá gần màu chính (deltaE = ${validation.harmonyStatus.deltaE}). Nên tăng độ tách biệt.`);
    }

    return messages;
  }, [effectiveColors.mode, validation]);

  const dragProps = (planId: number) => ({
    draggable: true,
    onDragEnd: () => { setDraggedId(null); setDragOverId(null); },
    onDragOver: (event: React.DragEvent) => {
      event.preventDefault();
      if (draggedId !== planId) {
        setDragOverId(planId);
      }
    },
    onDragStart: () => { setDraggedId(planId); },
    onDrop: (event: React.DragEvent) => {
      event.preventDefault();
      if (!draggedId || draggedId === planId) {return;}

      const nextPlans = [...pricingPlans];
      const draggedIndex = nextPlans.findIndex((plan) => plan.id === draggedId);
      const dropIndex = nextPlans.findIndex((plan) => plan.id === planId);

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

  const updatePlan = (planId: number, updates: Partial<PricingEditorPlan>) => {
    setPricingPlans((prev) => prev.map((plan) => (plan.id === planId ? { ...plan, ...updates } : plan)));
  };

  const removePlan = (planId: number) => {
    if (pricingPlans.length <= 1) {
      return;
    }

    setPricingPlans((prev) => prev.filter((plan) => plan.id !== planId));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) {return;}

    setIsSubmitting(true);
    try {
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
        texts,
        ...pricingConfig,
      };

      await updateMutation({
        active,
        config: payload,
        id: id as Id<'homeComponents'>,
        title,
      });
      if (showCustomBlock) {
        const resolvedCustomSecondary = resolveSecondaryByMode(customState.mode, customState.primary, customState.secondary);
        await setTypeColorOverride({
          enabled: customState.enabled,
          mode: customState.mode,
          primary: customState.primary,
          secondary: resolvedCustomSecondary,
          type: COMPONENT_TYPE,
        });
      }
      if (showFontCustomBlock) {
        await setTypeFontOverride({
          enabled: customFontState.enabled,
          fontKey: customFontState.fontKey,
          type: COMPONENT_TYPE,
        });
      }

      setInitialSnapshot(toSnapshot({
        title,
        active,
        style: payload.style,
        subtitle: String(payload.subtitle ?? ''),
        showBillingToggle: payload.showBillingToggle !== false,
        monthlyLabel: String(payload.monthlyLabel ?? ''),
        yearlyLabel: String(payload.yearlyLabel ?? ''),
        yearlySavingText: String(payload.yearlySavingText ?? ''),
        texts: payload.texts ?? DEFAULT_PRICING_TEXTS,
        plans: payload.plans.map((plan) => ({
          name: plan.name,
          price: plan.price,
          yearlyPrice: String(plan.yearlyPrice ?? ''),
          period: plan.period,
          features: Array.isArray(plan.features) ? plan.features : [],
          isPopular: Boolean(plan.isPopular),
          buttonText: plan.buttonText,
          buttonLink: plan.buttonLink,
        })),
      }));

      if (showCustomBlock) {
        setInitialCustom({
          enabled: customState.enabled,
          mode: customState.mode,
          primary: customState.primary,
          secondary: resolveSecondaryByMode(customState.mode, customState.primary, customState.secondary),
        });
      }
      if (showFontCustomBlock) {
        setInitialFontCustom({
          enabled: customFontState.enabled,
          fontKey: customFontState.fontKey,
        });
      }
      toast.success('Đã cập nhật Pricing');
    } catch (error) {
      toast.error('Lỗi khi cập nhật');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (component === undefined) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (component === null) {
    return <div className="py-8 text-center text-slate-500">Không tìm thấy component</div>;
  }

  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Pricing</h1>
        <Link href="/admin/home-components" className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Tag size={20} />
              Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tiêu đề hiển thị <span className="text-red-500">*</span></Label>
              <Input
                value={title}
                onChange={(event) => { setTitle(event.target.value); }}
                required
                placeholder="Nhập tiêu đề component..."
              />
            </div>

            <div className="flex items-center gap-3">
              <Label>Trạng thái:</Label>
              <div
                className={cn(
                  'inline-flex h-6 w-12 cursor-pointer items-center justify-center rounded-full transition-colors',
                  active ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600',
                )}
                onClick={() => { setActive(!active); }}
              >
                <div className={cn(
                  'h-5 w-5 rounded-full bg-white shadow transition-transform',
                  active ? 'translate-x-2.5' : '-translate-x-2.5',
                )}></div>
              </div>
              <span className="text-sm text-slate-500">{active ? 'Bật' : 'Tắt'}</span>
            </div>
          </CardContent>
        </Card>

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
          <CardHeader>
            <CardTitle className="text-base">Tùy chỉnh Text</CardTitle>
          </CardHeader>
          <CardContent>
            <TextsForm texts={texts} onUpdate={setTexts} />
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr,420px]">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom cho Pricing"
                enabled={customState.enabled}
                mode={customState.mode}
                primary={customState.primary}
                secondary={customState.secondary}
                onEnabledChange={(next) => setCustomState((prev) => ({ ...prev, enabled: next }))}
              onModeChange={(next) => setCustomState((prev) => {
                if (next === 'single') {
                  return { ...prev, mode: next, secondary: prev.primary };
                }
                if (prev.mode === 'single') {
                  return { ...prev, mode: next, secondary: getSuggestedSecondary(prev.primary) };
                }
                return { ...prev, mode: next };
              })}
              onPrimaryChange={(value) => setCustomState((prev) => ({
                ...prev,
                primary: value,
                secondary: prev.mode === 'single' ? value : prev.secondary,
              }))}
              onSecondaryChange={(value) => setCustomState((prev) => ({
                ...prev,
                secondary: prev.mode === 'single' ? prev.primary : value,
              }))}
              />
            )}
            {showFontCustomBlock && (
              <TypeFontOverrideCard
                title="Font custom cho Pricing"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            )}
            <PricingPreview
              title={title}
              plans={pricingPlans}
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              mode={effectiveColors.mode}
              selectedStyle={pricingStyle}
              onStyleChange={setPricingStyle}
              config={{ ...pricingConfig, texts }}
              fontStyle={fontStyle}
              fontClassName="font-active"
            />
          </div>
        </div>

        <HomeComponentStickyFooter
          isSubmitting={isSubmitting}
          hasChanges={hasChanges}
          onCancel={() => { router.push('/admin/home-components'); }}
          submitLabel="Lưu thay đổi"
        />
      </form>
    </div>
  );
}
