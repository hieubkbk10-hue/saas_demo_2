'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { TeamForm } from '../../team/_components/TeamForm';
import { TeamPreview } from '../../team/_components/TeamPreview';
import {
  DEFAULT_TEAM_CONFIG,
  normalizeTeamStyle,
  toTeamEditorMembers,
  toTeamPersistMembers,
} from '../../team/_lib/constants';
import { getTeamValidationResult } from '../../team/_lib/colors';
import type {
  TeamBrandMode,
  TeamConfig,
  TeamEditorMember,
  TeamStyle,
} from '../../team/_types';

const createDefaultMembers = (): TeamEditorMember[] => {
  const defaults = toTeamEditorMembers(DEFAULT_TEAM_CONFIG.members);

  if (defaults.length >= 2) {
    return [
      {
        ...defaults[0],
        name: 'Nguyễn Văn A',
        role: 'CEO & Founder',
      },
      {
        ...defaults[1],
        name: 'Trần Thị B',
        role: 'CTO',
      },
    ];
  }

  return [
    {
      id: 1,
      name: 'Nguyễn Văn A',
      role: 'CEO & Founder',
      avatar: '',
      bio: '',
      facebook: '',
      linkedin: '',
      twitter: '',
      email: '',
    },
    {
      id: 2,
      name: 'Trần Thị B',
      role: 'CTO',
      avatar: '',
      bio: '',
      facebook: '',
      linkedin: '',
      twitter: '',
      email: '',
    },
  ];
};

export default function TeamCreatePage() {
  const COMPONENT_TYPE = 'Team';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Đội ngũ của chúng tôi', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const [members, setMembers] = React.useState<TeamEditorMember[]>(createDefaultMembers);
  const [style, setStyle] = React.useState<TeamStyle>(normalizeTeamStyle(DEFAULT_TEAM_CONFIG.style));

  const brandMode: TeamBrandMode = mode === 'single' ? 'single' : 'dual';

  const validation = React.useMemo(() => getTeamValidationResult({
    primary,
    secondary,
    mode: brandMode,
  }), [primary, secondary, brandMode]);

  const warningMessages = React.useMemo(() => {
    if (brandMode !== 'dual') {
      return [] as string[];
    }

    const messages: string[] = [];

    if (validation.harmonyStatus.isTooSimilar) {
      messages.push(`Màu phụ đang gần màu chính (deltaE = ${validation.harmonyStatus.deltaE}).`);
    }

    if (validation.accessibility.failing.length > 0) {
      messages.push(`Một số cặp màu chữ/nền chưa đạt APCA (minLc = ${validation.accessibility.minLc.toFixed(1)}).`);
    }

    return messages;
  }, [brandMode, validation]);

  const onSubmit = (event: React.FormEvent) => {
    const payload: TeamConfig = {
      members: toTeamPersistMembers(members),
      style,
    };

    void handleSubmit(event, payload as unknown as Record<string, unknown>);
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
                <p key={`team-create-warning-${idx}`}>{message}</p>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <TeamPreview
        members={members}
        brandColor={primary}
        secondary={secondary}
        mode={brandMode}
        title={title}
        selectedStyle={style}
        onStyleChange={setStyle}
        fontStyle={fontStyle}
        fontClassName="font-active"
      />
    </ComponentFormWrapper>
  );
}
