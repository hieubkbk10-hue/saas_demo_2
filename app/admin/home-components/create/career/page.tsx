'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '../../../components/ui';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { CareerPreview } from '../../career/_components/CareerPreview';
import {
  createCareerJob,
  DEFAULT_CAREER_TEXTS,
} from '../../career/_lib/constants';
import { getCareerValidationResult } from '../../career/_lib/colors';
import { normalizeCareerJobs, toCareerJobsForConfig } from '../../career/_lib/normalize';
import type {
  CareerStyle,
  CareerTexts,
  JobPosition,
} from '../../career/_types';

const DEFAULT_CREATE_JOBS: JobPosition[] = [
  createCareerJob({
    id: 'career-job-1',
    title: 'Frontend Developer',
    department: 'Engineering',
    location: 'Hà Nội',
    type: 'Full-time',
    salary: '15-25 triệu',
    description: '',
  }),
  createCareerJob({
    id: 'career-job-2',
    title: 'UI/UX Designer',
    department: 'Design',
    location: 'Remote',
    type: 'Full-time',
    salary: '12-20 triệu',
    description: '',
  }),
];

export default function CareerCreatePage() {
  const COMPONENT_TYPE = 'Career';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Tuyển dụng', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const [careerStyle, setCareerStyle] = useState<CareerStyle>('cards');
  const [jobPositions, setJobPositions] = useState<JobPosition[]>(DEFAULT_CREATE_JOBS);
  const [texts, setTexts] = useState<CareerTexts>(DEFAULT_CAREER_TEXTS);

  const normalizedJobs = useMemo(() => normalizeCareerJobs(jobPositions), [jobPositions]);

  const validation = useMemo(() => getCareerValidationResult({
    primary,
    secondary,
    mode,
  }), [primary, secondary, mode]);

  const warningMessages = useMemo(() => {
    const warnings: string[] = [];

    if (mode === 'dual' && validation.harmonyStatus.isTooSimilar) {
      warnings.push(`Màu chính và màu phụ đang khá gần nhau (deltaE=${validation.harmonyStatus.deltaE}).`);
    }

    if (validation.accessibility.failing.length > 0) {
      warnings.push(`Có ${validation.accessibility.failing.length} cặp màu chưa đạt APCA (minLc=${validation.accessibility.minLc.toFixed(1)}).`);
    }

    return warnings;
  }, [mode, validation]);

  const handleAddJob = () => {
    setJobPositions((prev) => ([
      ...prev,
      createCareerJob({
        id: `career-job-${Date.now()}-${prev.length}`,
        type: 'Full-time',
      }),
    ]));
  };

  const handleRemoveJob = (index: number) => {
    setJobPositions((prev) => {
      if (prev.length <= 1) {
        return prev;
      }
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const updateJob = (index: number, field: keyof JobPosition, value: string) => {
    setJobPositions((prev) => prev.map((job, idx) => (
      idx === index ? { ...job, [field]: value } : job
    )));
  };

  const onSubmit = (event: React.FormEvent) => {
    void handleSubmit(event, {
      jobs: toCareerJobsForConfig(normalizedJobs),
      style: careerStyle,
      texts,
    });
  };

  return (
    <ComponentFormWrapper
      type={COMPONENT_TYPE}
      title={title}
      setTitle={setTitle}
      active={active}
      setActive={setActive}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      customState={customState}
      showCustomBlock={showCustomBlock}
      setCustomState={setCustomState}
      systemColors={systemColors}
      customFontState={customFontState}
      showFontCustomBlock={showFontCustomBlock}
      setCustomFontState={setCustomFontState}
    >
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
          {jobPositions.map((job, idx) => (
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
                  disabled={jobPositions.length <= 1}
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

      <CareerPreview
        jobs={toCareerJobsForConfig(normalizedJobs)}
        brandColor={primary}
        secondary={secondary}
        mode={mode}
        selectedStyle={careerStyle}
        onStyleChange={setCareerStyle}
        title={title}
        texts={texts}
        fontStyle={fontStyle}
        fontClassName="font-active"
      />

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
    </ComponentFormWrapper>
  );
}
