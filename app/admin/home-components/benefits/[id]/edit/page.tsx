'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '../../../../components/ui';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { BenefitsForm } from '../../_components/BenefitsForm';
import { BenefitsPreview } from '../../_components/BenefitsPreview';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { DEFAULT_BENEFITS_CONFIG, DEFAULT_BENEFITS_HARMONY } from '../../_lib/constants';
import {
  buildBenefitsWarningMessages,
  getBenefitsValidationResult,
  normalizeBenefitsHarmony,
} from '../../_lib/colors';
import type {
  BenefitItem,
  BenefitPersistItem,
  BenefitsBrandMode,
  BenefitsConfig,
  BenefitsEditorState,
  BenefitsStyle,
} from '../../_types';

const buildUiId = (item: BenefitPersistItem, idx: number) => {
  const seed = `${item.icon}|${item.title}|${item.description}|${idx}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return `benefit-${Math.abs(hash).toString(36)}-${idx}`;
};

const toUiItem = (item: BenefitPersistItem, idx: number): BenefitItem => ({
  description: item.description || '',
  icon: item.icon || 'Check',
  id: buildUiId(item, idx),
  title: item.title || '',
});

const toUiItems = (items: BenefitPersistItem[]): BenefitItem[] => {
  const seen = new Map<string, number>();

  return items.map((item, idx) => {
    const base = buildUiId(item, idx);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);

    return {
      ...toUiItem(item, idx),
      id: count === 0 ? base : `${base}-${count}`,
    };
  });
};

const toPersistItem = (item: BenefitItem): BenefitPersistItem => ({
  description: item.description,
  icon: item.icon,
  title: item.title,
});

const normalizeStyle = (value: unknown): BenefitsStyle => (
  value === 'cards' || value === 'list' || value === 'bento' || value === 'row' || value === 'carousel' || value === 'timeline'
    ? value
    : 'cards'
);

const toEditorState = (config: Partial<BenefitsConfig> | undefined): BenefitsEditorState => {
  const source = config ?? {};

  const items = Array.isArray(source.items) && source.items.length > 0
    ? toUiItems(source.items)
    : toUiItems(DEFAULT_BENEFITS_CONFIG.items);

  return {
    buttonLink: typeof source.buttonLink === 'string' ? source.buttonLink : (DEFAULT_BENEFITS_CONFIG.buttonLink ?? ''),
    buttonText: typeof source.buttonText === 'string' ? source.buttonText : (DEFAULT_BENEFITS_CONFIG.buttonText ?? ''),
    gridColumnsDesktop: typeof source.gridColumnsDesktop === 'number'
      ? (source.gridColumnsDesktop === 3 ? 3 : 4)
      : (DEFAULT_BENEFITS_CONFIG.gridColumnsDesktop ?? 4),
    gridColumnsMobile: typeof source.gridColumnsMobile === 'number'
      ? (source.gridColumnsMobile === 1 ? 1 : 2)
      : (DEFAULT_BENEFITS_CONFIG.gridColumnsMobile ?? 2),
    headerAlign: source.headerAlign === 'center' || source.headerAlign === 'right'
      ? source.headerAlign
      : (DEFAULT_BENEFITS_CONFIG.headerAlign ?? 'left'),
    harmony: normalizeBenefitsHarmony(source.harmony ?? DEFAULT_BENEFITS_HARMONY),
    heading: typeof source.heading === 'string' ? source.heading : (DEFAULT_BENEFITS_CONFIG.heading ?? ''),
    items,
    style: normalizeStyle(source.style),
    subHeading: typeof source.subHeading === 'string' ? source.subHeading : (DEFAULT_BENEFITS_CONFIG.subHeading ?? ''),
  };
};

const toPersistConfig = (state: BenefitsEditorState): BenefitsConfig => ({
  buttonLink: state.buttonLink,
  buttonText: state.buttonText,
  gridColumnsDesktop: state.gridColumnsDesktop,
  gridColumnsMobile: state.gridColumnsMobile,
  headerAlign: state.headerAlign,
  harmony: state.harmony,
  heading: state.heading,
  items: state.items.map(toPersistItem),
  style: state.style,
  subHeading: state.subHeading,
});

const createSnapshot = ({
  title,
  active,
  state,
}: {
  title: string;
  active: boolean;
  state: BenefitsEditorState;
}) => JSON.stringify({
  active,
  config: {
    buttonLink: state.buttonLink,
    buttonText: state.buttonText,
    gridColumnsDesktop: state.gridColumnsDesktop,
    gridColumnsMobile: state.gridColumnsMobile,
    headerAlign: state.headerAlign,
    harmony: state.harmony,
    heading: state.heading,
    items: state.items.map((item) => ({
      description: item.description,
      icon: item.icon,
      title: item.title,
    })),
    style: state.style,
    subHeading: state.subHeading,
  },
  title,
});

const COMPONENT_TYPE = 'Benefits';

export default function BenefitsEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const component = useQuery(api.homeComponents.getById, { id: id as Id<'homeComponents'> });
  const updateMutation = useMutation(api.homeComponents.update);
  const { customState, effectiveColors, initialCustom, setCustomState, setInitialCustom, showCustomBlock } = useTypeColorOverrideState(COMPONENT_TYPE);
  const { customState: customFontState, effectiveFont, initialCustom: initialFontCustom, setCustomState: setCustomFontState, setInitialCustom: setInitialFontCustom, showCustomBlock: showFontCustomBlock } = useTypeFontOverrideState(COMPONENT_TYPE);
  const setTypeColorOverride = useMutation(api.homeComponentSystemConfig.setTypeColorOverride);
  const setTypeFontOverride = useMutation(api.homeComponentSystemConfig.setTypeFontOverride);

  const brandMode: BenefitsBrandMode = effectiveColors.mode === 'single' ? 'single' : 'dual';

  const [title, setTitle] = useState('');
  const [active, setActive] = useState(true);
  const [editorState, setEditorState] = useState<BenefitsEditorState>(() => toEditorState(undefined));
  const [initialSnapshot, setInitialSnapshot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (component === undefined || component === null) {return;}

    if (component.type !== 'Benefits') {
      router.replace(`/admin/home-components/${id}/edit`);
      return;
    }

    setTitle(component.title);
    setActive(component.active);

    const state = toEditorState(component.config as Partial<BenefitsConfig> | undefined);
    setEditorState(state);

    setInitialSnapshot(createSnapshot({
      active: component.active,
      state,
      title: component.title,
    }));
  }, [component, id, router]);

  const currentSnapshot = useMemo(
    () => createSnapshot({ title, active, state: editorState }),
    [title, active, editorState],
  );

  const resolvedCustomSecondary = resolveSecondaryByMode(customState.mode, customState.primary, customState.secondary);
  const resolvedInitialSecondary = resolveSecondaryByMode(initialCustom.mode, initialCustom.primary, initialCustom.secondary);
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
  const hasChanges = initialSnapshot !== '' && (currentSnapshot !== initialSnapshot || customChanged || customFontChanged);

  const warningMessages = useMemo(() => {
    const validation = getBenefitsValidationResult({
      harmony: editorState.harmony,
      mode: brandMode,
      primary: effectiveColors.primary,
      secondary: effectiveColors.secondary,
      style: editorState.style,
    });

    return buildBenefitsWarningMessages({ mode: brandMode, validation });
  }, [effectiveColors, brandMode, editorState.harmony, editorState.style]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting || !hasChanges) {return;}

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        ...toPersistConfig(editorState),
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

      toast.success('Đã cập nhật Lợi ích');
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Lợi ích</h1>
        <Link href="/admin/home-components" className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Thông tin chung</CardTitle>
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
                  active ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600',
                )}
                onClick={() => { setActive(!active); }}
              >
                <div
                  className={cn(
                    'w-5 h-5 bg-white rounded-full transition-transform shadow',
                    active ? 'translate-x-2.5' : '-translate-x-2.5',
                  )}
                />
              </div>
              <span className="text-sm text-slate-500">{active ? 'Bật' : 'Tắt'}</span>
            </div>
          </CardContent>
        </Card>

        <BenefitsForm
          state={editorState}
          onChange={(updater) => { setEditorState((prev) => updater(prev)); }}
          mode={brandMode}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div />
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom cho Lợi ích"
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
                    return {
                      ...prev,
                      mode: 'single',
                      secondary: prev.primary,
                    };
                  }
                  const nextSecondary = prev.mode === 'single'
                    ? getSuggestedSecondary(prev.primary)
                    : prev.secondary;
                  return {
                    ...prev,
                    mode: 'dual',
                    secondary: nextSecondary,
                  };
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
                title="Font custom cho Lợi ích"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            )}
            <BenefitsPreview
              items={editorState.items}
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              mode={brandMode}
              selectedStyle={editorState.style}
              onStyleChange={(style) => {
                setEditorState((prev) => ({
                  ...prev,
                  style,
                }));
              }}
              config={{
                buttonLink: editorState.buttonLink,
                buttonText: editorState.buttonText,
                harmony: editorState.harmony,
                heading: editorState.heading,
                subHeading: editorState.subHeading,
              }}
              fontStyle={fontStyle}
              fontClassName="font-active"
            />
          </div>
        </div>

        {brandMode === 'dual' && warningMessages.length > 0 ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div className="space-y-1">
                {warningMessages.map((message, idx) => (
                  <p key={`benefits-edit-warning-${idx}`}>{message}</p>
                ))}
              </div>
            </div>
          </div>
        ) : null}

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
