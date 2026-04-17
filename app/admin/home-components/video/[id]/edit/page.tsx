'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { Loader2, Video as VideoIcon } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '../../../../components/ui';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { VideoPreview } from '../../_components/VideoPreview';
import { VideoForm } from '../../_components/VideoForm';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import {
  normalizeVideoConfig,
  normalizeVideoStyle,
} from '../../_lib/constants';
import type { VideoConfig } from '../../_types';

const COMPONENT_TYPE = 'Video';

export default function VideoEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { customState, effectiveColors, initialCustom, setCustomState, setInitialCustom, showCustomBlock } = useTypeColorOverrideState(COMPONENT_TYPE);
  const { customState: customFontState, effectiveFont, initialCustom: initialFontCustom, setCustomState: setCustomFontState, setInitialCustom: setInitialFontCustom, showCustomBlock: showFontCustomBlock } = useTypeFontOverrideState(COMPONENT_TYPE);
  const setTypeColorOverride = useMutation(api.homeComponentSystemConfig.setTypeColorOverride);
  const setTypeFontOverride = useMutation(api.homeComponentSystemConfig.setTypeFontOverride);
  const component = useQuery(api.homeComponents.getById, { id: id as Id<'homeComponents'> });
  const updateMutation = useMutation(api.homeComponents.update);

  const [title, setTitle] = React.useState('');
  const [active, setActive] = React.useState(true);
  const [config, setConfig] = React.useState<VideoConfig>(() => normalizeVideoConfig({
    autoplay: false,
    badge: '',
    buttonLink: '',
    buttonText: '',
    description: '',
    heading: '',
    loop: false,
    muted: true,
    style: 'centered',
    thumbnailUrl: '',
    videoUrl: '',
  }));
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [snapshot, setSnapshot] = React.useState<string>('');

  React.useEffect(() => {
    if (!component) {return;}

    if (component.type !== 'Video') {
      router.replace(`/admin/home-components/${id}/edit`);
      return;
    }

    const normalized = normalizeVideoConfig(component.config);

    setTitle(component.title);
    setActive(component.active);
    setConfig(normalized);

    const nextSnapshot = JSON.stringify({
      active: component.active,
      config: normalized,
      title: component.title,
    });

    setSnapshot(nextSnapshot);
  }, [component, id, router]);

  const selectedStyle = normalizeVideoStyle(config.style);

  const hasChanges = React.useMemo(() => {
    const current = JSON.stringify({
      active,
      config: normalizeVideoConfig({ ...config, style: selectedStyle }),
      title,
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

    return snapshot !== '' && (current !== snapshot || customChanged || customFontChanged);
  }, [active, config, selectedStyle, title, snapshot, customState, initialCustom, showCustomBlock]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting || !hasChanges) {return;}

    setIsSubmitting(true);

    try {
      const normalized = normalizeVideoConfig({ ...config, style: selectedStyle });

      await updateMutation({
        id: id as Id<'homeComponents'>,
        title,
        active,
        config: normalized,
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

      setConfig(normalized);
      setSnapshot(JSON.stringify({ title, active, config: normalized }));
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
      toast.success('Đã cập nhật Video');
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Video</h1>
        <Link href="/admin/home-components" className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <VideoIcon size={20} />
              Video
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tiêu đề hiển thị <span className="text-red-500">*</span></Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Nhập tiêu đề component..."
              />
            </div>

            <div className="flex items-center gap-3">
              <Label>Trạng thái:</Label>
              <div
                className={cn(
                  'cursor-pointer inline-flex items-center justify-center rounded-full w-12 h-6 transition-colors',
                  active ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600',
                )}
                onClick={() => setActive(!active)}
              >
                <div className={cn(
                  'w-5 h-5 bg-white rounded-full transition-transform shadow',
                  active ? 'translate-x-2.5' : '-translate-x-2.5',
                )} />
              </div>
              <span className="text-sm text-slate-500">{active ? 'Bật' : 'Tắt'}</span>
            </div>
          </CardContent>
        </Card>

        <VideoForm
          config={config}
          onChange={setConfig}
          selectedStyle={selectedStyle}
        />

        <div className="space-y-4">
          {showCustomBlock && (
            <TypeColorOverrideCard
              title="Màu custom cho Video"
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
              title="Font custom cho Video"
              enabled={customFontState.enabled}
              fontKey={customFontState.fontKey}
              compact
              toggleLabel="Custom"
              fontLabel="Font"
              onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
              onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
            />
          )}
          <VideoPreview
            config={config}
            brandColor={effectiveColors.primary}
            secondary={effectiveColors.secondary}
            selectedStyle={selectedStyle}
            onStyleChange={(style) => setConfig((prev) => ({ ...prev, style }))}
            mode={effectiveColors.mode}
            fontStyle={fontStyle}
            fontClassName="font-active"
          />
        </div>

        <HomeComponentStickyFooter
          isSubmitting={isSubmitting}
          hasChanges={hasChanges}
          onCancel={() => router.push('/admin/home-components')}
          submitLabel="Lưu thay đổi"
        />
      </form>
    </div>
  );
}
