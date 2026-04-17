'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '../../../../components/ui';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { GalleryForm } from '../../_components/GalleryForm';
import { GalleryPreview } from '../../_components/GalleryPreview';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { DEFAULT_GALLERY_ITEMS } from '../../_lib/constants';
import { getGalleryPersistSafeColors, normalizeGalleryHarmony } from '../../_lib/colors';
import type { GalleryItem, GalleryStyle } from '../../_types';

const COMPONENT_TYPE = 'Gallery';

export default function GalleryEditPage({ params }: { params: Promise<{ id: string }> }) {
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
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(DEFAULT_GALLERY_ITEMS);
  const [galleryStyle, setGalleryStyle] = useState<GalleryStyle>('grid');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const harmony = normalizeGalleryHarmony((component?.config as { harmony?: string } | undefined)?.harmony);


  useEffect(() => {
    if (!component) {return;}

    if (component.type === 'Partners') {
      router.replace(`/admin/home-components/partners/${id}/edit`);
      return;
    }

    if (component.type === 'TrustBadges') {
      router.replace(`/admin/home-components/trust-badges/${id}/edit`);
      return;
    }

    if (component.type !== 'Gallery') {
      router.replace(`/admin/home-components/${id}/edit`);
      return;
    }

    setTitle(component.title);
    setActive(component.active);

    const config = component.config ?? {};
    const items = (config.items as { url: string; link: string; name?: string }[] | undefined) ?? DEFAULT_GALLERY_ITEMS;
    const normalizedItems = items.map((item, idx) => ({ id: `item-${idx + 1}`, link: item.link || '', name: item.name ?? '', url: item.url }));
    setGalleryItems(normalizedItems);

    const nextGalleryStyle = (config.style as GalleryStyle) || 'grid';
    setGalleryStyle(nextGalleryStyle);

    setInitialSnapshot(JSON.stringify({
      title: component.title,
      active: component.active,
      items: normalizedItems,
      style: nextGalleryStyle,
      harmony,
      type: component.type,
    }));
  }, [component, id, router]);

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

  useEffect(() => {
    if (!component || !initialSnapshot) {return;}
    const snapshot = JSON.stringify({
      title,
      active,
      items: galleryItems,
      style: galleryStyle,
      harmony,
      type: component.type,
    });
    setHasChanges(snapshot !== initialSnapshot || customChanged || customFontChanged);
  }, [title, active, galleryItems, galleryStyle, harmony, component, initialSnapshot, customChanged, customFontChanged]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) {return;}

    const { autoHeal } = getGalleryPersistSafeColors({
      primary: effectiveColors.primary,
      secondary: effectiveColors.secondary,
      mode: effectiveColors.mode,
      harmony,
    });

    if (autoHeal.didAutoHealHarmony || autoHeal.didAutoHealText) {
      const messages: string[] = [];
      if (autoHeal.didAutoHealHarmony) {
        messages.push('Hệ thống đã tự tối ưu màu phụ để đảm bảo hài hòa.');
      }
      if (autoHeal.didAutoHealText) {
        messages.push('Hệ thống đã tự điều chỉnh màu chữ để tăng độ đọc.');
      }
      if (autoHeal.isStillSimilar) {
        messages.push('Màu phụ vẫn khá gần màu chính, đã chọn phương án gần nhất.');
      }
      toast.info(messages.join(' '));
    }

    setIsSubmitting(true);
    try {
      await updateMutation({
        active,
        config: {
          harmony,
          items: galleryItems.map((item) => ({ link: item.link, name: item.name, url: item.url })),
          style: galleryStyle,
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
      toast.success('Đã cập nhật component');
      setInitialSnapshot(JSON.stringify({
        title,
        active,
        items: galleryItems,
        style: galleryStyle,
        harmony,
        type: component?.type,
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Thư viện ảnh</h1>
        <Link href="/admin/home-components" className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon size={20} />
              Thư viện ảnh
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

        <GalleryForm
          galleryItems={galleryItems}
          setGalleryItems={setGalleryItems}
          componentType="Gallery"
          style={galleryStyle}
          headerPrimary={effectiveColors.primary}
          headerSecondary={effectiveColors.secondary}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom cho Thư viện ảnh"
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
                title="Font custom cho Thư viện ảnh"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            )}
            <GalleryPreview
              items={galleryItems.map((item, idx) => ({ id: idx + 1, link: item.link, name: item.name, url: item.url }))}
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              mode={effectiveColors.mode}
              harmony={harmony}
              selectedStyle={galleryStyle}
              onStyleChange={setGalleryStyle}
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
