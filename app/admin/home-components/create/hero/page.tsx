'use client';

import React, { useState } from 'react';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { HeroForm } from '../../hero/_components/HeroForm';
import type { HeroContent, HeroSlide, HeroStyle } from '../../hero/_types';
import { DEFAULT_HERO_CONTENT } from '../../hero/_lib/constants';
import { HeroPreview } from '../../hero/_components/HeroPreview';

const needsContentForm = (style: HeroStyle) => ['fullscreen', 'split', 'parallax'].includes(style);

export default function HeroCreatePage() {
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Hero Banner', 'Hero');
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState('Hero', { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState('Hero', { seedCustomFromSettingsWhenTypeEmpty: true });

  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([
    { id: 'slide-1', link: '', url: '' }
  ]);
  const [heroStyle, setHeroStyle] = useState<HeroStyle>('slider');
  const [heroContent, setHeroContent] = useState<HeroContent>(DEFAULT_HERO_CONTENT);

  const previewSlides = heroSlides.map((s, idx) => ({ 
    id: idx + 1, 
    image: s.url,
    link: s.link 
  }));
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const onSubmit = (e: React.FormEvent) => {
    void handleSubmit(e, {
      content: needsContentForm(heroStyle) ? heroContent : undefined,
      slides: heroSlides.map(s => ({ image: s.url || s.image, link: s.link })),
      style: heroStyle,
    });
  };

  return (
    <ComponentFormWrapper
      type="Hero"
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
      <HeroForm
        heroSlides={heroSlides}
        setHeroSlides={setHeroSlides}
        heroStyle={heroStyle}
        heroContent={heroContent}
        setHeroContent={setHeroContent}
      />

      <HeroPreview 
        slides={previewSlides} 
        brandColor={effectiveColors.primary}
        secondary={effectiveColors.secondary}
        mode={effectiveColors.mode}
        selectedStyle={heroStyle}
        onStyleChange={setHeroStyle}
        content={heroContent}
        fontStyle={fontStyle}
        fontClassName="font-active"
      />
    </ComponentFormWrapper>
  );
}
