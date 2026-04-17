'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Briefcase, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '../../../../components/ui';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { CareerPreview } from '../../_components/CareerPreview';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import {
  createCareerJob,
  DEFAULT_CAREER_TEXTS,
} from '../../_lib/constants';
import { getCareerValidationResult } from '../../_lib/colors';
import {
  normalizeCareerConfig,
  normalizeCareerJobs,
  toCareerJobsForConfig,
} from '../../_lib/normalize';
import type {
  CareerConfig,
  CareerStyle,
  CareerTexts,
  JobPosition,
} from '../../_types';

const COMPONENT_TYPE = 'Career';

interface CareerSnapshotPayload {
  title: string;
  active: boolean;
  jobs: JobPosition[];
  style: CareerStyle;
  texts: CareerTexts;
}

const toSnapshot = (payload: CareerSnapshotPayload) => JSON.stringify(payload);

export default function CareerEditPage({ params }: { params: Promise<{ id: string }> }) {
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
  const [jobs, setJobs] = useState<JobPosition[]>([createCareerJob({ type: 'Full-time' })]);
  const [careerStyle, setCareerStyle] = useState<CareerStyle>('cards');
  const [texts, setTexts] = useState<CareerTexts>(DEFAULT_CAREER_TEXTS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null);

  useEffect(() => {
    if (!component) {return;}

    if (component.type !== 'Career') {
      router.replace(`/admin/home-components/${id}/edit`);
      return;
    }

    const normalized = normalizeCareerConfig(component.config);
    const normalizedJobs = normalized.jobs.length > 0
      ? normalized.jobs
      : [createCareerJob({ type: 'Full-time' })];

    const normalizedTexts = { ...DEFAULT_CAREER_TEXTS, ...normalized.texts };

    setTitle(component.title);
    setActive(component.active);
    setJobs(normalizedJobs);
    setCareerStyle(normalized.style);
    setTexts(normalizedTexts);

    setInitialSnapshot(toSnapshot({
      title: component.title,
      active: component.active,
      jobs: normalizedJobs,
      style: normalized.style,
      texts: normalizedTexts,
    }));
  }, [component, id, router]);

  const normalizedJobs = useMemo(() => normalizeCareerJobs(jobs), [jobs]);

  const currentSnapshot = useMemo(() => toSnapshot({
    title,
    active,
    jobs: toCareerJobsForConfig(normalizedJobs),
    style: careerStyle,
    texts,
  }), [title, active, normalizedJobs, careerStyle, texts]);

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

  const validation = useMemo(() => getCareerValidationResult({
    primary: effectiveColors.primary,
    secondary: effectiveColors.secondary,
    mode: effectiveColors.mode,
  }), [effectiveColors.primary, effectiveColors.secondary, effectiveColors.mode]);

  const warningMessages = useMemo(() => {
    const warnings: string[] = [];

    if (effectiveColors.mode === 'dual' && validation.harmonyStatus.isTooSimilar) {
      warnings.push(`Màu chính và màu phụ đang khá gần nhau (deltaE=${validation.harmonyStatus.deltaE}).`);
    }

    if (validation.accessibility.failing.length > 0) {
      warnings.push(`Có ${validation.accessibility.failing.length} cặp màu chưa đạt APCA (minLc=${validation.accessibility.minLc.toFixed(1)}).`);
    }

    return warnings;
  }, [effectiveColors.mode, validation]);

  const updateJob = (index: number, field: keyof JobPosition, value: string) => {
    setJobs((prev) => prev.map((job, idx) => (
      idx === index ? { ...job, [field]: value } : job
    )));
  };

  const handleAddJob = () => {
    setJobs((prev) => ([
      ...prev,
      createCareerJob({
        id: `career-job-${Date.now()}-${prev.length}`,
        type: 'Full-time',
      }),
    ]));
  };

  const handleRemoveJob = (index: number) => {
    setJobs((prev) => {
      if (prev.length <= 1) {
        return prev;
      }
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting || !hasChanges) {return;}

    setIsSubmitting(true);
    try {
      const nextConfig: CareerConfig = {
        jobs: toCareerJobsForConfig(normalizedJobs),
        style: careerStyle,
        texts,
      };

      await updateMutation({
        active,
        config: nextConfig,
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

      setInitialSnapshot(toSnapshot({
        title,
        active,
        jobs: nextConfig.jobs,
        style: nextConfig.style,
        texts: nextConfig.texts ?? DEFAULT_CAREER_TEXTS,
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

      toast.success('Đã cập nhật Career');
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Career</h1>
        <Link href="/admin/home-components" className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase size={20} />
              Career
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
                  active ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600',
                )}
                onClick={() => { setActive(!active); }}
              >
                <div className={cn(
                  'w-5 h-5 bg-white rounded-full transition-transform shadow',
                  active ? 'translate-x-2.5' : '-translate-x-2.5',
                )}></div>
              </div>
              <span className="text-sm text-slate-500">{active ? 'Bật' : 'Tắt'}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Vị trí tuyển dụng</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddJob}
              className="gap-2"
            >
              <Plus size={14} /> Thêm vị trí
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {jobs.map((job, idx) => (
              <div
                key={normalizedJobs[idx]?.key ?? `${job.id ?? 'career-job'}-${idx}`}
                className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Label>Vị trí {idx + 1}</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-500 h-8 w-8"
                    onClick={() => { handleRemoveJob(idx); }}
                    disabled={jobs.length <= 1}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Vị trí tuyển dụng"
                    value={job.title}
                    onChange={(event) => { updateJob(idx, 'title', event.target.value); }}
                  />
                  <Input
                    placeholder="Phòng ban"
                    value={job.department}
                    onChange={(event) => { updateJob(idx, 'department', event.target.value); }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Input
                    placeholder="Địa điểm"
                    value={job.location}
                    onChange={(event) => { updateJob(idx, 'location', event.target.value); }}
                  />
                  <select
                    className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                    value={job.type}
                    onChange={(event) => { updateJob(idx, 'type', event.target.value); }}
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Internship</option>
                  </select>
                  <Input
                    placeholder="Mức lương"
                    value={job.salary}
                    onChange={(event) => { updateJob(idx, 'salary', event.target.value); }}
                  />
                </div>

                <Input
                  placeholder="Mô tả ngắn (tuỳ chọn)"
                  value={job.description}
                  onChange={(event) => { updateJob(idx, 'description', event.target.value); }}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Tùy chỉnh văn bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="subtitle">Phụ đề (subtitle)</Label>
              <Input
                id="subtitle"
                placeholder={DEFAULT_CAREER_TEXTS.subtitle}
                value={texts.subtitle || ''}
                onChange={(e) => { setTexts((prev) => ({ ...prev, subtitle: e.target.value })); }}
              />
            </div>
            <div>
              <Label htmlFor="ctaButton">Nút hành động (CTA)</Label>
              <Input
                id="ctaButton"
                placeholder={DEFAULT_CAREER_TEXTS.ctaButton}
                value={texts.ctaButton || ''}
                onChange={(e) => { setTexts((prev) => ({ ...prev, ctaButton: e.target.value })); }}
              />
            </div>
            <div>
              <Label htmlFor="emptyTitle">Tiêu đề trống</Label>
              <Input
                id="emptyTitle"
                placeholder={DEFAULT_CAREER_TEXTS.emptyTitle}
                value={texts.emptyTitle || ''}
                onChange={(e) => { setTexts((prev) => ({ ...prev, emptyTitle: e.target.value })); }}
              />
            </div>
            <div>
              <Label htmlFor="emptyDescription">Mô tả trống</Label>
              <Input
                id="emptyDescription"
                placeholder={DEFAULT_CAREER_TEXTS.emptyDescription}
                value={texts.emptyDescription || ''}
                onChange={(e) => { setTexts((prev) => ({ ...prev, emptyDescription: e.target.value })); }}
              />
            </div>
            <div>
              <Label htmlFor="remainingLabel">Nhãn còn lại</Label>
              <Input
                id="remainingLabel"
                placeholder={DEFAULT_CAREER_TEXTS.remainingLabel}
                value={texts.remainingLabel || ''}
                onChange={(e) => { setTexts((prev) => ({ ...prev, remainingLabel: e.target.value })); }}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom cho Tuyển dụng"
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
                title="Font custom cho Tuyển dụng"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            )}
            <CareerPreview
              jobs={toCareerJobsForConfig(normalizedJobs)}
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              mode={effectiveColors.mode}
              selectedStyle={careerStyle}
              onStyleChange={setCareerStyle}
              title={title}
              texts={texts}
              fontStyle={fontStyle}
              fontClassName="font-active"
            />
          </div>
        </div>

        {warningMessages.length > 0 && (
          <div className="mt-4 space-y-2">
            {warningMessages.map((message) => (
              <div
                key={message}
                className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700"
              >
                <p>{message}</p>
              </div>
            ))}
          </div>
        )}

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
