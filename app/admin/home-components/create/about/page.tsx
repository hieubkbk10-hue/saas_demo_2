'use client';

import React from 'react';
import { Eye } from 'lucide-react';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { AboutForm } from '../../about/_components/AboutForm';
import { AboutPreview } from '../../about/_components/AboutPreview';
import {
  DEFAULT_ABOUT_EDITOR_STATE,
  toAboutPersistStats,
} from '../../about/_lib/constants';
import {
  buildAboutWarningMessages,
  getAboutValidationResult,
} from '../../about/_lib/colors';

export default function AboutCreatePage() {
  const COMPONENT_TYPE = 'About';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Về chúng tôi', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const [state, setState] = React.useState(DEFAULT_ABOUT_EDITOR_STATE);

  const validation = React.useMemo(
    () => getAboutValidationResult({
      primary,
      secondary,
      mode,
      style: state.style,
    }),
    [primary, secondary, mode, state.style],
  );

  const warningMessages = React.useMemo(
    () => buildAboutWarningMessages({ mode, validation }),
    [mode, validation],
  );

  const onSubmit = (event: React.FormEvent) => {
    void handleSubmit(event, {
      subHeading: state.subHeading,
      heading: state.heading,
      description: state.description,
      image: state.image,
      imageCaption: state.imageCaption,
      buttonText: state.buttonText,
      buttonLink: state.buttonLink,
      stats: toAboutPersistStats(state.stats),
      style: state.style,
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
      <AboutForm state={state} onChange={setState} />

      {mode === 'dual' && warningMessages.length > 0 ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <div className="space-y-2">
            {warningMessages.map((message, idx) => (
              <div key={`${idx}-${message}`} className="flex items-start gap-2">
                <Eye size={14} className="mt-0.5 flex-shrink-0" />
                <p>{message}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <AboutPreview
        config={{
          subHeading: state.subHeading,
          heading: state.heading,
          description: state.description,
          image: state.image,
          imageCaption: state.imageCaption,
          buttonText: state.buttonText,
          buttonLink: state.buttonLink,
          stats: toAboutPersistStats(state.stats),
          style: state.style,
        }}
        brandColor={validation.tokens.primary}
        secondary={validation.tokens.secondary}
        mode={mode}
        selectedStyle={state.style}
        onStyleChange={(style) => {
          setState((prev) => ({ ...prev, style }));
        }}
        fontStyle={fontStyle}
        fontClassName="font-active"
      />
    </ComponentFormWrapper>
  );
}
