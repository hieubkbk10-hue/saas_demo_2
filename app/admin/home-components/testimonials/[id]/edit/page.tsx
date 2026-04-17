'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Loader2, Star, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '../../../../components/ui';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { ColorInfoPanel } from '../../../_shared/components/ColorInfoPanel';
import { TestimonialsPreview } from '../../_components/TestimonialsPreview';
import { TestimonialsForm } from '../../_components/TestimonialsForm';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { DEFAULT_TESTIMONIALS_CONFIG } from '../../_lib/constants';
import {
  buildTestimonialsWarningMessages,
  getTestimonialsValidationResult,
  resolveSecondaryForMode,
} from '../../_lib/colors';
import type {
  TestimonialsConfig,
  TestimonialsItem,
  TestimonialsPersistItem,
  TestimonialsStyle,
  TestimonialsBrandMode,
} from '../../_types';

const COMPONENT_TYPE = 'Testimonials';

const normalizeStyle = (style: unknown): TestimonialsStyle => {
  if (
    style === 'cards'
    || style === 'slider'
    || style === 'masonry'
    || style === 'quote'
    || style === 'carousel'
    || style === 'minimal'
  ) {
    return style;
  }
  return 'cards';
};

const toUiItem = (item: TestimonialsPersistItem, idx: number): TestimonialsItem => ({
  avatar: item.avatar || '',
  content: item.content || '',
  id: `testimonial-${idx + 1}`,
  name: item.name || '',
  rating: Number.isFinite(item.rating) ? Math.max(1, Math.min(5, item.rating)) : 5,
  role: item.role || '',
});

const toPersistItem = (item: TestimonialsItem): TestimonialsPersistItem => ({
  avatar: item.avatar,
  content: item.content,
  name: item.name,
  rating: item.rating,
  role: item.role,
});

export default function TestimonialsEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { customState, effectiveColors, initialCustom, setCustomState, setInitialCustom, showCustomBlock } = useTypeColorOverrideState(COMPONENT_TYPE);
  const { customState: customFontState, effectiveFont, initialCustom: initialFontCustom, setCustomState: setCustomFontState, setInitialCustom: setInitialFontCustom, showCustomBlock: showFontCustomBlock } = useTypeFontOverrideState(COMPONENT_TYPE);
  const brandMode: TestimonialsBrandMode = effectiveColors.mode === 'single' ? 'single' : 'dual';
  const setTypeFontOverride = useMutation(api.homeComponentSystemConfig.setTypeFontOverride);
  const setTypeColorOverride = useMutation(api.homeComponentSystemConfig.setTypeColorOverride);

  const component = useQuery(api.homeComponents.getById, { id: id as Id<'homeComponents'> });
  const updateMutation = useMutation(api.homeComponents.update);

  const [title, setTitle] = useState('');
  const [active, setActive] = useState(true);
  const [items, setItems] = useState<TestimonialsItem[]>([]);
  const [style, setStyle] = useState<TestimonialsStyle>('cards');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [warningMessages, setWarningMessages] = useState<string[]>([]);

  const resolvedSecondary = resolveSecondaryForMode(effectiveColors.primary, effectiveColors.secondary, brandMode);

  useEffect(() => {
    if (!component) {return;}

    if (component.type !== 'Testimonials') {
      router.replace(`/admin/home-components/${id}/edit`);
      return;
    }

    setTitle(component.title);
    setActive(component.active);

    const rawConfig = (component.config ?? {}) as Partial<TestimonialsConfig>;
    const loadedItems = Array.isArray(rawConfig.items)
      ? rawConfig.items.map((item, idx) => toUiItem(item, idx))
      : DEFAULT_TESTIMONIALS_CONFIG.items.map((item, idx) => toUiItem(item, idx));
    const loadedStyle = normalizeStyle(rawConfig.style);

    setItems(loadedItems);
    setStyle(loadedStyle);

    const snapshot = JSON.stringify({
      active: component.active,
      items: loadedItems,
      style: loadedStyle,
      title: component.title,
      type: component.type,
    });

    setInitialSnapshot(snapshot);
    setHasChanges(false);
  }, [component, id, router]);

  useEffect(() => {
    if (!component || !initialSnapshot) {return;}

    const snapshot = JSON.stringify({
      active,
      items,
      style,
      title,
      type: component.type,
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

    setHasChanges(snapshot !== initialSnapshot || customChanged || customFontChanged);
  }, [title, active, items, style, component, initialSnapshot, customState, initialCustom, showCustomBlock, customFontState, initialFontCustom, showFontCustomBlock]);

  useEffect(() => {
    if (!component || component.type !== 'Testimonials') {return;}

    const validation = getTestimonialsValidationResult({
      mode: brandMode,
      primary: effectiveColors.primary,
      secondary: resolvedSecondary,
      style,
    });

    setWarningMessages(buildTestimonialsWarningMessages({ mode: brandMode, validation }));
  }, [component, effectiveColors.primary, resolvedSecondary, brandMode, style]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting || !hasChanges) {return;}

    const validation = getTestimonialsValidationResult({
      mode: brandMode,
      primary: effectiveColors.primary,
      secondary: resolvedSecondary,
      style,
    });
    setWarningMessages(buildTestimonialsWarningMessages({ mode: brandMode, validation }));

    setIsSubmitting(true);
    try {
      await updateMutation({
        active,
        config: {
          items: items.map(toPersistItem),
          style,
        },
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

      toast.success('Đã cập nhật Testimonials');

      const snapshot = JSON.stringify({
        active,
        items,
        style,
        title,
        type: component?.type,
      });

      setInitialSnapshot(snapshot);
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
      setHasChanges(false);
    } catch (error) {
      toast.error('Lỗi khi cập nhật');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (component === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (component === null) {
    return <div className="text-center py-8 text-slate-500">Không tìm thấy component</div>;
  }

  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Testimonials</h1>
        <Link href="/admin/home-components" className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star size={20} />
              Testimonials
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
                  'cursor-pointer inline-flex items-center justify-center rounded-full w-12 h-6 transition-colors',
                  active ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                )}
                onClick={() => { setActive(!active); }}
              >
                <div className={cn(
                  'w-5 h-5 bg-white rounded-full transition-transform shadow',
                  active ? 'translate-x-2.5' : '-translate-x-2.5'
                )}></div>
              </div>
              <span className="text-sm text-slate-500">{active ? 'Bật' : 'Tắt'}</span>
            </div>
          </CardContent>
        </Card>

        <TestimonialsForm items={items} setItems={setItems} />

        {warningMessages.length > 0 && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div className="space-y-1">
                {warningMessages.map((message, idx) => (
                  <p key={`testimonials-warning-${idx}`}>{message}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom cho Testimonials"
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
                title="Font custom cho Testimonials"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            )}
            <TestimonialsPreview
              items={items}
              brandColor={effectiveColors.primary}
              secondary={resolvedSecondary}
              mode={brandMode}
              selectedStyle={style}
              onStyleChange={setStyle}
              fontStyle={fontStyle}
              fontClassName="font-active"
            />
            {brandMode === 'dual' && (
              <ColorInfoPanel brandColor={effectiveColors.primary} secondary={resolvedSecondary} />
            )}
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
