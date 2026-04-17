'use client';

import React, { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { BenefitsForm } from '../../benefits/_components/BenefitsForm';
import { BenefitsPreview } from '../../benefits/_components/BenefitsPreview';
import { DEFAULT_BENEFITS_EDITOR_STATE, DEFAULT_BENEFITS_HARMONY } from '../../benefits/_lib/constants';
import {
  buildBenefitsWarningMessages,
  getBenefitsValidationResult,
} from '../../benefits/_lib/colors';
import type {
  BenefitItem,
  BenefitPersistItem,
  BenefitsBrandMode,
  BenefitsEditorState,
  BenefitsConfig,
} from '../../benefits/_types';

const createUiId = (item: BenefitPersistItem, idx: number) => {
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
  id: createUiId(item, idx),
  title: item.title || '',
});

const toUiItems = (items: BenefitPersistItem[]): BenefitItem[] => {
  const seen = new Map<string, number>();

  return items.map((item, idx) => {
    const base = createUiId(item, idx);
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

const normalizeCreateState = (): BenefitsEditorState => ({
  ...DEFAULT_BENEFITS_EDITOR_STATE,
  harmony: DEFAULT_BENEFITS_HARMONY,
  items: toUiItems(DEFAULT_BENEFITS_EDITOR_STATE.items.map(toPersistItem)),
});

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

export default function BenefitsCreatePage() {
  const COMPONENT_TYPE = 'Benefits';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Lợi ích', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;
  const brandMode: BenefitsBrandMode = mode === 'single' ? 'single' : 'dual';

  const [editorState, setEditorState] = useState<BenefitsEditorState>(normalizeCreateState);

  const warningMessages = useMemo(() => {
    const validation = getBenefitsValidationResult({
      harmony: editorState.harmony,
      mode: brandMode,
      primary,
      secondary,
      style: editorState.style,
    });

    return buildBenefitsWarningMessages({ mode: brandMode, validation });
  }, [primary, secondary, brandMode, editorState.harmony, editorState.style]);

  const onSubmit = (event: React.FormEvent) => {
    const payload: Record<string, unknown> = {
      ...toPersistConfig(editorState),
    };
    void handleSubmit(event, payload);
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
      <BenefitsForm
        state={editorState}
        onChange={(updater) => { setEditorState((prev) => updater(prev)); }}
        mode={brandMode}
      />

      {brandMode === 'dual' && warningMessages.length > 0 ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div className="space-y-1">
              {warningMessages.map((message, idx) => (
                <p key={`benefits-create-warning-${idx}`}>{message}</p>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <BenefitsPreview
        items={editorState.items}
        brandColor={primary}
        secondary={secondary}
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
    </ComponentFormWrapper>
  );
}
