"use client";

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { LayoutTemplate, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '../../../../components/ui';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { PartnersForm } from '../../_components/PartnersForm';
import { PartnersPreview } from '../../_components/PartnersPreview';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import type { PartnerItem, PartnersStyle } from '../../_types';

const COMPONENT_TYPE = 'Partners';

export default function PartnersEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { customState, effectiveColors, initialCustom, setCustomState, setInitialCustom, showCustomBlock } = useTypeColorOverrideState(COMPONENT_TYPE);
  const { customState: customFontState, effectiveFont, initialCustom: initialFontCustom, setCustomState: setCustomFontState, setInitialCustom: setInitialFontCustom, showCustomBlock: showFontCustomBlock } = useTypeFontOverrideState(COMPONENT_TYPE);
  const setTypeColorOverride = useMutation(api.homeComponentSystemConfig.setTypeColorOverride);
  const setTypeFontOverride = useMutation(api.homeComponentSystemConfig.setTypeFontOverride);
  const component = useQuery(api.homeComponents.getById, { id: id as Id<"homeComponents"> });
  const updateMutation = useMutation(api.homeComponents.update);

  const [title, setTitle] = useState('');
  const [active, setActive] = useState(true);
  const [partnersItems, setPartnersItems] = useState<PartnerItem[]>([]);
  const [partnersStyle, setPartnersStyle] = useState<PartnersStyle>('grid');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null);

  const normalizeItemsForCompare = (items: PartnerItem[]) => items.map(item => ({
    link: item.link?.trim() ?? '',
    name: item.name?.trim() ?? '',
    url: item.url?.trim() ?? '',
  }));

  useEffect(() => {
    if (component) {
      if (component.type !== 'Partners') {
        router.replace(`/admin/home-components/${id}/edit`);
        return;
      }

      setTitle(component.title);
      setActive(component.active);

      const config = component.config ?? {};
      const nextItems = config.items?.map((item: { url: string; link: string; name?: string }, i: number) => ({
        id: `item-${i}`,
        link: item.link || '',
        name: item.name ?? '',
        url: item.url,
      })) ?? [{ id: 'item-1', link: '', name: '', url: '' }];
      const nextStyle = (config.style as PartnersStyle) || 'grid';

      setPartnersItems(nextItems);
      setPartnersStyle(nextStyle);
      setInitialSnapshot(JSON.stringify({
        title: component.title.trim(),
        active: component.active,
        style: nextStyle,
        items: normalizeItemsForCompare(nextItems),
      }));
    }
  }, [component, id, router]);

  const currentSnapshot = JSON.stringify({
    title: title.trim(),
    active,
    style: partnersStyle,
    items: normalizeItemsForCompare(partnersItems),
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
  const hasChanges = initialSnapshot !== null && (initialSnapshot !== currentSnapshot || customChanged || customFontChanged);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !hasChanges) {return;}

    setIsSubmitting(true);
    try {
      await updateMutation({
        active,
        config: {
          items: partnersItems.map(item => ({ link: item.link, name: item.name, url: item.url })),
          style: partnersStyle,
        },
        id: id as Id<"homeComponents">,
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
      setInitialSnapshot(currentSnapshot);
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
      toast.success('Đã cập nhật Partners');
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Partners</h1>
        <Link href="/admin/home-components" className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <LayoutTemplate size={20} />
              Partners
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tiêu đề hiển thị <span className="text-red-500">*</span></Label>
              <Input
                value={title}
                onChange={(e) =>{  setTitle(e.target.value); }}
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
                onClick={() =>{  setActive(!active); }}
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

        <PartnersForm items={partnersItems} setItems={setPartnersItems} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom cho Partners"
                enabled={customState.enabled}
                mode={customState.mode}
                primary={customState.primary}
                secondary={customState.secondary}
                onEnabledChange={(next) => setCustomState((prev) => ({ ...prev, enabled: next }))}
                onModeChange={(next) => setCustomState((prev) => {
                  if (next === prev.mode) {
                    return prev;
                  }
                  if (next === 'single') {
                    return { ...prev, mode: 'single', secondary: prev.primary };
                  }
                  const nextSecondary = prev.mode === 'single'
                    ? getSuggestedSecondary(prev.primary)
                    : prev.secondary;
                  return { ...prev, mode: 'dual', secondary: nextSecondary };
                })}
                onPrimaryChange={(value) => setCustomState((prev) => ({
                  ...prev,
                  primary: value,
                  secondary: prev.mode === 'single' ? value : prev.secondary,
                }))}
                onSecondaryChange={(value) => setCustomState((prev) => ({ ...prev, secondary: value }))}
              />
            )}
            {showFontCustomBlock && (
              <TypeFontOverrideCard
                title="Font custom cho Partners"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            )}
            <PartnersPreview
              items={partnersItems.map((item, idx) => ({ id: idx + 1, link: item.link, name: item.name, url: item.url }))}
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              mode={effectiveColors.mode}
              selectedStyle={partnersStyle}
              onStyleChange={setPartnersStyle}
              title={title}
              fontStyle={fontStyle}
              fontClassName="font-active"
            />
          </div>
        </div>

        <HomeComponentStickyFooter
          isSubmitting={isSubmitting}
          hasChanges={hasChanges}
          onCancel={() =>{  router.push('/admin/home-components'); }}
          submitLabel="Lưu thay đổi"
        />
      </form>
    </div>
  );
}
