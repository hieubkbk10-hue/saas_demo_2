'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Phone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, Input, Label } from '../../../../components/ui';
import { ToggleSwitch } from '@/components/modules/shared';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { ConfigEditor } from '../../_components/ConfigEditor';
import { ContactPreview } from '../../_components/ContactPreview';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { DEFAULT_CONTACT_CONFIG } from '../../_lib/constants';
import { getContactValidationResult } from '../../_lib/colors';
import {
  normalizeContactConfig,
  toContactConfigPayload,
  toContactSnapshot,
} from '../../_lib/normalize';
import { validateContactConfig } from '../../_lib/validation';
import type { ContactConfigState, ContactStyle } from '../../_types';
import { getContactMapDataFromSettings } from '@/lib/contact/getContactMapData';

const COMPONENT_TYPE = 'Contact';

export default function ContactEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { customState, effectiveColors, initialCustom, setCustomState, setInitialCustom, showCustomBlock } = useTypeColorOverrideState(COMPONENT_TYPE);
  const { customState: customFontState, effectiveFont, initialCustom: initialFontCustom, setCustomState: setCustomFontState, setInitialCustom: setInitialFontCustom, showCustomBlock: showFontCustomBlock } = useTypeFontOverrideState(COMPONENT_TYPE);
  const setTypeColorOverride = useMutation(api.homeComponentSystemConfig.setTypeColorOverride);
  const setTypeFontOverride = useMutation(api.homeComponentSystemConfig.setTypeFontOverride);
  const component = useQuery(api.homeComponents.getById, { id: id as Id<'homeComponents'> });
  const updateMutation = useMutation(api.homeComponents.update);
  const contactSettings = useQuery(api.settings.listByGroup, { group: 'contact' });
  const mapData = useMemo(() => getContactMapDataFromSettings(contactSettings ?? []), [contactSettings]);

  const [title, setTitle] = useState('');
  const [active, setActive] = useState(true);
  const [config, setConfig] = useState<ContactConfigState>(DEFAULT_CONTACT_CONFIG);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null);

  useEffect(() => {
    if (!component) {return;}

    if (component.type !== 'Contact') {
      router.replace(`/admin/home-components/${id}/edit`);
      return;
    }

    const normalizedConfig = normalizeContactConfig(component.config ?? {});

    setTitle(component.title);
    setActive(component.active);
    setConfig(normalizedConfig);
    setInitialSnapshot(toContactSnapshot({
      title: component.title,
      active: component.active,
      config: normalizedConfig,
    }));
  }, [component, id, router]);

  const normalizedConfig = useMemo(() => normalizeContactConfig(config), [config]);

  const currentSnapshot = useMemo(() => toContactSnapshot({
    title,
    active,
    config: normalizedConfig,
  }), [title, active, normalizedConfig]);

  const style = normalizedConfig.style;

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

  const hasValidationErrors = !validateContactConfig(normalizedConfig).isValid;

  const validation = useMemo(() => getContactValidationResult({
    primary: effectiveColors.primary,
    secondary: effectiveColors.secondary,
    mode: effectiveColors.mode,
  }), [effectiveColors.primary, effectiveColors.secondary, effectiveColors.mode]);

  const warningMessages = useMemo(() => {
    if (effectiveColors.mode === 'single') {return [];}

    const warnings: string[] = [];

    if (validation.harmonyStatus.isTooSimilar) {
      warnings.push(`Màu chính và màu phụ đang khá gần nhau (deltaE=${validation.harmonyStatus.deltaE}).`);
    }

    if (validation.accessibility.failing.length > 0) {
      warnings.push(`Có ${validation.accessibility.failing.length} cặp màu chưa đạt APCA (minLc=${validation.accessibility.minLc.toFixed(1)}).`);
    }

    return warnings;
  }, [effectiveColors.mode, validation]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting || !hasChanges) {return;}

    setIsSubmitting(true);
    try {
      const nextConfig = normalizeContactConfig(config);
      const payload = {
        ...toContactConfigPayload(nextConfig),
        style: nextConfig.style,
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

      setConfig(nextConfig);
      setInitialSnapshot(toContactSnapshot({
        title,
        active,
        config: nextConfig,
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

      toast.success('Đã cập nhật Contact');
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Contact</h1>
        <Link href="/admin/home-components" className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 lg:hidden">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2">
          <p className="text-[11px] uppercase text-slate-400">Tiêu đề</p>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
            {title || 'Chưa đặt'}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2">
          <p className="text-[11px] uppercase text-slate-400">Trạng thái</p>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
            {active ? 'Bật' : 'Tắt'}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2">
          <p className="text-[11px] uppercase text-slate-400">Style</p>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
            {style}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone size={20} />
                  Contact
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
                  <Label>Trạng thái</Label>
                  <ToggleSwitch
                    enabled={active}
                    onChange={() => { setActive(!active); }}
                    color="bg-emerald-500"
                  />
                  <span className="text-sm text-slate-500">{active ? 'Bật' : 'Tắt'}</span>
                </div>
              </CardContent>
            </Card>

            <ConfigEditor
              value={normalizedConfig}
              onChange={(next) => { setConfig(normalizeContactConfig(next)); }}
              title="Cấu hình Contact"
            />
          </div>

          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {effectiveColors.mode === 'dual' && warningMessages.length > 0 && (
              <Card className="border-amber-200 bg-amber-50/70">
                <CardContent className="pt-6">
                  <div className="space-y-2 text-xs text-amber-800">
                    {warningMessages.map((warning) => (
                      <p key={warning}>• {warning}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom cho Liên hệ"
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
                title="Font custom cho Liên hệ"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            )}

            <ContactPreview
              config={{ ...normalizedConfig, style }}
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              mode={effectiveColors.mode}
              selectedStyle={style}
              onStyleChange={(nextStyle) => { setConfig({ ...normalizedConfig, style: nextStyle as ContactStyle }); }}
              title={title}
              mapData={mapData}
              fontStyle={fontStyle}
              fontClassName="font-active"
            />

          </div>
        </div>

        <HomeComponentStickyFooter
          isSubmitting={isSubmitting}
          hasChanges={hasChanges}
          disableSave={!hasChanges || hasValidationErrors || isSubmitting}
          onCancel={() => { router.push('/admin/home-components'); }}
          submitLabel="Lưu thay đổi"
        />
      </form>
    </div>
  );
}
