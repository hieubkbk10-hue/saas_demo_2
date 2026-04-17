'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { AlertTriangle, Eye, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '../../../../components/ui';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import {
  getCaseStudyValidationResult,
} from '../../_lib/colors';
import { CaseStudyForm } from '../../_components/CaseStudyForm';
import { CaseStudyPreview } from '../../_components/CaseStudyPreview';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import type {
  CaseStudyBrandMode,
  CaseStudyProject,
  CaseStudyStyle,
} from '../../_types';

const COMPONENT_TYPE = 'CaseStudy';

export default function CaseStudyEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { customState, effectiveColors, initialCustom, setCustomState, setInitialCustom, showCustomBlock } = useTypeColorOverrideState(COMPONENT_TYPE);
  const { customState: customFontState, effectiveFont, initialCustom: initialFontCustom, setCustomState: setCustomFontState, setInitialCustom: setInitialFontCustom, showCustomBlock: showFontCustomBlock } = useTypeFontOverrideState(COMPONENT_TYPE);
  const setTypeColorOverride = useMutation(api.homeComponentSystemConfig.setTypeColorOverride);
  const setTypeFontOverride = useMutation(api.homeComponentSystemConfig.setTypeFontOverride);
  const brandMode: CaseStudyBrandMode = effectiveColors.mode === 'single' ? 'single' : 'dual';
  const component = useQuery(api.homeComponents.getById, { id: id as Id<'homeComponents'> });
  const updateMutation = useMutation(api.homeComponents.update);

  const [title, setTitle] = useState('');
  const [active, setActive] = useState(true);
  const [projects, setProjects] = useState<CaseStudyProject[]>([]);
  const [caseStudyStyle, setCaseStudyStyle] = useState<CaseStudyStyle>('grid');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warningMessages, setWarningMessages] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialState, setInitialState] = useState<string>('');

  useEffect(() => {
    if (component) {
      if (component.type !== 'CaseStudy') {
        router.replace(`/admin/home-components/${id}/edit`);
        return;
      }

      setTitle(component.title);
      setActive(component.active);

      const config = component.config ?? {};
      setProjects(config.projects?.map((project: { title: string; category: string; image: string; description: string; link: string }, idx: number) => ({
        id: idx,
        title: project.title,
        category: project.category,
        image: project.image,
        description: project.description,
        link: project.link,
      })) ?? []);
      const nextStyle = (config.style as CaseStudyStyle) || 'grid';
      setCaseStudyStyle(nextStyle);

      const snapshot = JSON.stringify({
        active: component.active,
        projects: config.projects?.map((project: { title: string; category: string; image: string; description: string; link: string }) => ({
          category: project.category,
          description: project.description,
          image: project.image,
          link: project.link,
          title: project.title,
        })) ?? [],
        style: nextStyle,
        title: component.title,
      });
      setInitialState(snapshot);
      setHasChanges(false);
    }
  }, [component, id, router]);

  const currentState = useMemo(() => JSON.stringify({
    active,
    projects: projects.map((project) => ({
      category: project.category,
      description: project.description,
      image: project.image,
      link: project.link,
      title: project.title,
    })),
    style: caseStudyStyle,
    title,
  }), [active, caseStudyStyle, projects, title]);

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
    if (!initialState) {return;}
    setHasChanges(currentState !== initialState || customChanged || customFontChanged);
  }, [currentState, initialState, customChanged, customFontChanged]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !hasChanges) {return;}

    const { harmonyStatus, accessibility } = getCaseStudyValidationResult({
      primary: effectiveColors.primary,
      secondary: effectiveColors.secondary,
      mode: brandMode,
      style: caseStudyStyle,
    });

    const warnings: string[] = [];

    if (brandMode === 'dual' && harmonyStatus.isTooSimilar) {
      warnings.push(`Hai màu quá giống nhau (deltaE = ${harmonyStatus.deltaE}).`);
    }

    if (accessibility.failing.length > 0) {
      warnings.push(`Một số cặp màu chữ/nền có độ tương phản thấp (minLc = ${accessibility.minLc.toFixed(1)}).`);
    }

    setWarningMessages(warnings);

    setIsSubmitting(true);
    try {
      await updateMutation({
        active,
        config: {
          projects: projects.map((project) => ({
            category: project.category,
            description: project.description,
            image: project.image,
            link: project.link,
            title: project.title,
          })),
          style: caseStudyStyle,
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
      toast.success('Đã cập nhật Dự án thực tế');
      setInitialState(currentState);
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Dự án thực tế</h1>
        <Link href="/admin/home-components" className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText size={20} />
              Dự án thực tế
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

        <CaseStudyForm projects={projects} onChange={setProjects} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom cho Case Study"
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
                title="Font custom cho Case Study"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            )}
            <CaseStudyPreview
              projects={projects}
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              mode={brandMode}
              selectedStyle={caseStudyStyle}
              onStyleChange={setCaseStudyStyle}
              fontStyle={fontStyle}
              fontClassName="font-active"
            />
          </div>
        </div>

        {brandMode === 'dual' && warningMessages.length > 0 && (
          <div className="mt-4 space-y-2">
            {warningMessages.map((message, idx) => {
              const isContrastWarning = message.includes('minLc');
              return (
                <div
                  key={`${message}-${idx}`}
                  className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700"
                >
                  <div className="flex items-start gap-2">
                    {isContrastWarning ? (
                      <Eye size={14} className="mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                    )}
                    <p>{message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

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
