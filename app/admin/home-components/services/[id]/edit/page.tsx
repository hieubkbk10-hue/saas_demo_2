'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { AlertTriangle, Briefcase, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '../../../../components/ui';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { ServicesForm } from '../../_components/ServicesForm';
import { ServicesPreview } from '../../_components/ServicesPreview';
import { DEFAULT_SERVICES_CONFIG } from '../../_lib/constants';
import { getServicesValidationResult } from '../../_lib/colors';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { normalizeServicesItemsForEditor, toServicesPersistItems } from '../../_lib/items';
import type { ServiceEditorItem, ServicesStyle } from '../../_types';

const getDefaultEditorItems = (): ServiceEditorItem[] => {
  return DEFAULT_SERVICES_CONFIG.items.map((item, index) => ({
    id: 1_000_000 + index,
    icon: item.icon,
    title: item.title,
    description: item.description,
  }));
};

const COMPONENT_TYPE = 'Services';

export default function ServicesEditPage({ params }: { params: Promise<{ id: string }> }) {
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
  const [servicesItems, setServicesItems] = useState<ServiceEditorItem[]>(getDefaultEditorItems);
  const [style, setStyle] = useState<ServicesStyle>('elegantGrid');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState('');

  useEffect(() => {
    if (!component) {return;}
    if (component.type !== 'Services') {
      router.replace(`/admin/home-components/${id}/edit`);
      return;
    }

    const rawConfig = (component.config ?? {}) as { items?: unknown; style?: ServicesStyle };
    const normalizedItems = normalizeServicesItemsForEditor(rawConfig.items);

    setTitle(component.title);
    setActive(component.active);
    setServicesItems(normalizedItems.length > 0 ? normalizedItems : getDefaultEditorItems());
    setStyle(rawConfig.style || DEFAULT_SERVICES_CONFIG.style);

    const snapshot = JSON.stringify({
      title: component.title,
      active: component.active,
      items: toServicesPersistItems(normalizedItems.length > 0 ? normalizedItems : getDefaultEditorItems()),
      style: rawConfig.style || DEFAULT_SERVICES_CONFIG.style,
      type: component.type,
    });

    setInitialSnapshot(snapshot);
    setHasChanges(false);
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
    if (!component || component.type !== 'Services' || !initialSnapshot) {return;}

    const snapshot = JSON.stringify({
      title,
      active,
      items: toServicesPersistItems(servicesItems),
      style,
      type: component.type,
    });

    setHasChanges(snapshot !== initialSnapshot || customChanged || customFontChanged);
  }, [title, active, servicesItems, style, component, initialSnapshot, customChanged, customFontChanged]);

  const validation = useMemo(() => getServicesValidationResult({
    primary: effectiveColors.primary,
    secondary: effectiveColors.secondary,
    mode: effectiveColors.mode,
  }), [effectiveColors]);

  const warningMessages = useMemo(() => {
    const messages: string[] = [];

    if (effectiveColors.mode === 'dual' && validation.harmonyStatus.isTooSimilar) {
      messages.push(`Màu phụ đang khá gần màu chính (deltaE = ${validation.harmonyStatus.deltaE}). Nên tăng độ tách biệt.`);
    }

    if (validation.accessibility.failing.length > 0) {
      messages.push(`Một số cặp màu chữ/nền chưa đủ tương phản (minLc = ${validation.accessibility.minLc.toFixed(1)}).`);
    }

    return messages;
  }, [effectiveColors.mode, validation]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting || !hasChanges) {return;}

    setIsSubmitting(true);
    try {
      const persistItems = toServicesPersistItems(servicesItems);
      await updateMutation({
        active,
        config: {
          items: persistItems,
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

      toast.success('Đã cập nhật Services');

      const snapshot = JSON.stringify({
        title,
        active,
        items: persistItems,
        style,
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Services</h1>
        <Link href="/admin/home-components" className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase size={20} />
              Services
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tiêu đề hiển thị <span className="text-red-500">*</span></Label>
              <Input
                value={title}
                onChange={(e) => { setTitle(e.target.value); }}
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

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom cho Services"
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
                title="Font custom cho Services"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            )}
            <ServicesPreview
              items={toServicesPersistItems(servicesItems)}
              brandColor={validation.colors.primary}
              secondary={validation.colors.secondary}
              mode={effectiveColors.mode}
              selectedStyle={style}
              onStyleChange={setStyle}
              title={title}
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
