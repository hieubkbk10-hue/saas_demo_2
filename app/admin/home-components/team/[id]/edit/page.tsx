'use client';

import React, { use, useEffect } from 'react';
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
import { TeamForm } from '../../_components/TeamForm';
import { TeamPreview } from '../../_components/TeamPreview';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import {
  normalizeTeamConfig,
  toTeamEditorMembers,
  toTeamPersistMembers,
  normalizeTeamStyle,
} from '../../_lib/constants';
import { getTeamValidationResult } from '../../_lib/colors';
import type {
  TeamBrandMode,
  TeamConfig,
  TeamEditorMember,
  TeamStyle,
} from '../../_types';

const COMPONENT_TYPE = 'Team';

const serializeEditState = ({
  title,
  active,
  style,
  members,
  texts,
}: {
  title: string;
  active: boolean;
  style: TeamStyle;
  members: TeamEditorMember[];
  texts: Record<string, string>;
}) => JSON.stringify({
  title,
  active,
  style,
  members: toTeamPersistMembers(members),
  texts,
});

export default function TeamEditPage({ params }: { params: Promise<{ id: string }> }) {
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
  const [style, setStyle] = React.useState<TeamStyle>('grid');
  const [members, setMembers] = React.useState<TeamEditorMember[]>([]);
  const [texts, setTexts] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [initialSnapshot, setInitialSnapshot] = React.useState('');

  const brandMode: TeamBrandMode = effectiveColors.mode === 'single' ? 'single' : 'dual';

  useEffect(() => {
    if (!component) {return;}

    if (component.type !== 'Team') {
      router.replace(`/admin/home-components/${id}/edit`);
      return;
    }

    const normalizedConfig = normalizeTeamConfig(component.config);

    const editorMembers = toTeamEditorMembers(normalizedConfig.members);
    const nextStyle = normalizeTeamStyle(normalizedConfig.style);
    const nextTexts = normalizedConfig.texts || {};

    setTitle(component.title);
    setActive(component.active);
    setStyle(nextStyle);
    setMembers(editorMembers);
    setTexts(nextTexts);

    setInitialSnapshot(serializeEditState({
      title: component.title,
      active: component.active,
      style: nextStyle,
      members: editorMembers,
      texts: nextTexts,
    }));
  }, [component, id, router]);

  const validation = React.useMemo(() => getTeamValidationResult({
    primary: effectiveColors.primary,
    secondary: effectiveColors.secondary,
    mode: brandMode,
  }), [effectiveColors.primary, effectiveColors.secondary, brandMode]);

  const warningMessages = React.useMemo(() => {
    if (brandMode !== 'dual') {
      return [] as string[];
    }

    const messages: string[] = [];

    if (validation.harmonyStatus.isTooSimilar) {
      messages.push(`Màu phụ đang gần màu chính (deltaE = ${validation.harmonyStatus.deltaE}). Nên chọn màu khác biệt hơn.`);
    }

    return messages;
  }, [brandMode, validation]);

  const currentSnapshot = React.useMemo(() => serializeEditState({
    title,
    active,
    style,
    members,
    texts,
  }), [title, active, style, members, texts]);

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
  const hasChanges = initialSnapshot.length > 0 && (currentSnapshot !== initialSnapshot || customChanged || customFontChanged);

  const saveConfig: TeamConfig = React.useMemo(() => ({
    members: toTeamPersistMembers(members),
    style,
    texts,
  }), [members, style, texts]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isSubmitting || !hasChanges) {return;}

    setIsSubmitting(true);

    try {
      await updateMutation({
        id: id as Id<'homeComponents'>,
        title,
        active,
        config: saveConfig as unknown as Record<string, unknown>,
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

      const nextSnapshot = serializeEditState({
        title,
        active,
        style,
        members,
        texts,
      });

      setInitialSnapshot(nextSnapshot);
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
      toast.success('Đã cập nhật Team');
    } catch (error) {
      toast.error('Lỗi khi cập nhật Team');
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
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Team</h1>
        <Link href="/admin/home-components" className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Team</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tiêu đề hiển thị <span className="text-red-500">*</span></Label>
              <Input
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                }}
                required
                placeholder="Nhập tiêu đề component..."
              />
            </div>

            <div className="space-y-2">
              <Label>Phụ đề</Label>
              <Input
                value={texts.subtitle || ''}
                onChange={(event) => {
                  setTexts((prev) => ({ ...prev, subtitle: event.target.value }));
                }}
                placeholder="Đội ngũ chuyên nghiệp"
              />
            </div>

            <div className="space-y-2">
              <Label>Thông báo khi trống</Label>
              <Input
                value={texts.emptyMessage || ''}
                onChange={(event) => {
                  setTexts((prev) => ({ ...prev, emptyMessage: event.target.value }));
                }}
                placeholder="Chưa có thành viên nào."
              />
            </div>

            <div className="flex items-center gap-3">
              <Label>Trạng thái:</Label>
              <div
                className={cn(
                  'inline-flex h-6 w-12 cursor-pointer items-center justify-center rounded-full transition-colors',
                  active ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600',
                )}
                onClick={() => {
                  setActive((prev) => !prev);
                }}
              >
                <div
                  className={cn(
                    'h-5 w-5 rounded-full bg-white shadow transition-transform',
                    active ? 'translate-x-2.5' : '-translate-x-2.5',
                  )}
                />
              </div>
              <span className="text-sm text-slate-500">{active ? 'Bật' : 'Tắt'}</span>
            </div>
          </CardContent>
        </Card>

        <TeamForm
          members={members}
          onChange={setMembers}
          secondary={validation.resolvedSecondary}
        />

        {brandMode === 'dual' && warningMessages.length > 0 ? (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div className="space-y-1">
                {warningMessages.map((message, idx) => (
                  <p key={`team-edit-warning-${idx}`}>{message}</p>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
          {showCustomBlock && (
            <TypeColorOverrideCard
              title="Màu custom cho Đội ngũ"
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
              title="Font custom cho Đội ngũ"
              enabled={customFontState.enabled}
              fontKey={customFontState.fontKey}
              compact
              toggleLabel="Custom"
              fontLabel="Font"
              onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
              onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
            />
          )}
          <TeamPreview
            members={members}
            brandColor={effectiveColors.primary}
            secondary={effectiveColors.secondary}
            mode={brandMode}
            title={title}
            selectedStyle={style}
            onStyleChange={setStyle}
            texts={texts}
            fontStyle={fontStyle}
            fontClassName="font-active"
          />
        </div>

        <HomeComponentStickyFooter
          isSubmitting={isSubmitting}
          hasChanges={hasChanges}
          onCancel={() => {
            router.push('/admin/home-components');
          }}
          submitLabel="Lưu thay đổi"
        />
      </form>
    </div>
  );
}
