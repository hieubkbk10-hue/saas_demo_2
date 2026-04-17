'use client';

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
import { HeroForm } from '../../_components/HeroForm';
import { HeroPreview } from '../../_components/HeroPreview';
import { DEFAULT_HERO_CONTENT } from '../../_lib/constants';
import type { HeroContent, HeroSlide, HeroStyle } from '../../_types';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';

const COMPONENT_TYPE = 'Hero';

export default function HeroEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { customState, effectiveColors, showCustomBlock, setCustomState, initialCustom, setInitialCustom } = useTypeColorOverrideState(COMPONENT_TYPE);
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState, initialCustom: initialFontCustom, setInitialCustom: setInitialFontCustom } = useTypeFontOverrideState(COMPONENT_TYPE);
  const component = useQuery(api.homeComponents.getById, { id: id as Id<"homeComponents"> });
  const updateMutation = useMutation(api.homeComponents.update);
  const setTypeColorOverride = useMutation(api.homeComponentSystemConfig.setTypeColorOverride);
  const setTypeFontOverride = useMutation(api.homeComponentSystemConfig.setTypeFontOverride);

  const [title, setTitle] = useState('');
  const [active, setActive] = useState(true);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [heroStyle, setHeroStyle] = useState<HeroStyle>('slider');
  const [heroContent, setHeroContent] = useState<HeroContent>(DEFAULT_HERO_CONTENT);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialData, setInitialData] = useState<{
    title: string;
    active: boolean;
    slides: HeroSlide[];
    style: HeroStyle;
    content: HeroContent;
  } | null>(null);

  useEffect(() => {
    if (component) {
      if (component.type !== 'Hero') {
        router.replace(`/admin/home-components/${id}/edit`);
        return;
      }

      setTitle(component.title);
      setActive(component.active);

      const config = component.config ?? {};
      const slides = config.slides?.map((s: { image: string; link: string }, i: number) => ({ id: `slide-${i}`, link: s.link || '', url: s.image })) ?? [{ id: 'slide-1', link: '', url: '' }];
      const style = (config.style as HeroStyle) || 'slider';
      const content = (config.content as HeroContent) ?? DEFAULT_HERO_CONTENT;

      setHeroSlides(slides);
      setHeroStyle(style);
      setHeroContent(content);
      setInitialData({
        title: component.title,
        active: component.active,
        slides,
        style,
        content,
      });
      setHasChanges(false);
    }
  }, [component, id, router]);

  useEffect(() => {
    if (!initialData) {return;}

    const currentSlides = JSON.stringify(heroSlides);
    const initialSlides = JSON.stringify(initialData.slides);
    const currentContent = JSON.stringify(heroContent);
    const initialContent = JSON.stringify(initialData.content);

    const resolvedCustomSecondary = resolveSecondaryByMode(
      customState.mode,
      customState.primary,
      customState.secondary,
    );
    const resolvedInitialSecondary = resolveSecondaryByMode(
      initialCustom.mode,
      initialCustom.primary,
      initialCustom.secondary,
    );
    const customChanged = showCustomBlock
      ? customState.enabled !== initialCustom.enabled
        || customState.mode !== initialCustom.mode
        || customState.primary !== initialCustom.primary
        || resolvedCustomSecondary !== resolvedInitialSecondary
      : false;
    const customFontChanged = showFontCustomBlock
      ? customFontState.enabled !== initialFontCustom.enabled
        || customFontState.fontKey !== initialFontCustom.fontKey
      : false;

    const changed = title !== initialData.title
      || active !== initialData.active
      || currentSlides !== initialSlides
      || heroStyle !== initialData.style
      || currentContent !== initialContent
      || customChanged
      || customFontChanged;

    setHasChanges(changed);
  }, [title, active, heroSlides, heroStyle, heroContent, initialData, showCustomBlock, customState, initialCustom, showFontCustomBlock, customFontState, initialFontCustom]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) {return;}

    setIsSubmitting(true);
    try {
      const needsContent = ['fullscreen', 'split', 'parallax'].includes(heroStyle);
      await updateMutation({
        active,
        config: {
          content: needsContent ? heroContent : undefined,
          slides: heroSlides.map(s => ({ image: s.url, link: s.link })),
          style: heroStyle,
        },
        id: id as Id<"homeComponents">,
        title,
      });
      if (showCustomBlock) {
        const resolvedCustomSecondary = resolveSecondaryByMode(
          customState.mode,
          customState.primary,
          customState.secondary,
        );
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
      toast.success('Đã cập nhật Hero Banner');
      setInitialData({
        title,
        active,
        slides: heroSlides,
        style: heroStyle,
        content: heroContent,
      });
      if (showCustomBlock) {
        const resolvedCustomSecondary = resolveSecondaryByMode(
          customState.mode,
          customState.primary,
          customState.secondary,
        );
        setInitialCustom({
          enabled: customState.enabled,
          mode: customState.mode,
          primary: customState.primary,
          secondary: resolvedCustomSecondary,
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Hero Banner</h1>
        <Link href="/admin/home-components" className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <LayoutTemplate size={20} />
              Hero Banner
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
                  "cursor-pointer inline-flex items-center justify-center rounded-full w-12 h-6 transition-colors",
                  active ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"
                )}
                onClick={() =>{  setActive(!active); }}
              >
                <div className={cn(
                  "w-5 h-5 bg-white rounded-full transition-transform shadow",
                  active ? "translate-x-2.5" : "-translate-x-2.5"
                )}></div>
              </div>
              <span className="text-sm text-slate-500">{active ? 'Bật' : 'Tắt'}</span>
            </div>
          </CardContent>
        </Card>

        <HeroForm
          heroSlides={heroSlides}
          setHeroSlides={setHeroSlides}
          heroStyle={heroStyle}
          heroContent={heroContent}
          setHeroContent={setHeroContent}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom Hero"
                enabled={customState.enabled}
                mode={customState.mode}
                primary={customState.primary}
                secondary={customState.secondary}
                compact
                toggleLabel="Custom"
                primaryLabel="Chính"
                secondaryLabel="Phụ"
                onEnabledChange={(next) => setCustomState((prev) => ({ ...prev, enabled: next }))}
                onModeChange={(next) => {
                  if (next === 'single') {
                    setCustomState((prev) => ({ ...prev, mode: 'single', secondary: prev.primary }));
                    return;
                  }
                  setCustomState((prev) => ({
                    ...prev,
                    mode: 'dual',
                    secondary: prev.mode === 'single' ? getSuggestedSecondary(prev.primary) : prev.secondary,
                  }));
                }}
                onPrimaryChange={(value) => {
                  setCustomState((prev) => ({
                    ...prev,
                    primary: value,
                    secondary: prev.mode === 'single' ? value : prev.secondary,
                  }));
                }}
                onSecondaryChange={(value) => setCustomState((prev) => ({ ...prev, secondary: value }))}
              />
            )}
            {showFontCustomBlock && (
              <TypeFontOverrideCard
                title="Font custom Hero"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            )}
            <HeroPreview
              slides={heroSlides.map((s, idx) => ({ id: idx + 1, image: s.url, link: s.link }))}
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              mode={effectiveColors.mode}
              selectedStyle={heroStyle}
              onStyleChange={setHeroStyle}
              content={heroContent}
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
