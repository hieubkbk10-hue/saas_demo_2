'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent } from '../../../components/ui';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { ContactPreview } from '../../contact/_components/ContactPreview';
import {
  buildDefaultContactItemsFromSettings,
  buildDefaultContactSocialsFromSettings,
  DEFAULT_CONTACT_CONFIG,
} from '../../contact/_lib/constants';
import { getContactValidationResult } from '../../contact/_lib/colors';
import { normalizeContactConfig, toContactConfigPayload } from '../../contact/_lib/normalize';
import type { ContactConfigState, ContactStyle } from '../../contact/_types';
import { getContactMapDataFromSettings } from '@/lib/contact/getContactMapData';
import { ConfigEditor } from '../../contact/_components/ConfigEditor';

export default function ContactCreatePage() {
  const COMPONENT_TYPE = 'Contact';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Liên hệ', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;
  const contactSettings = useQuery(api.settings.listByGroup, { group: 'contact' });
  const socialSettings = useQuery(api.settings.listByGroup, { group: 'social' });
  const mapData = useMemo(() => getContactMapDataFromSettings(contactSettings ?? []), [contactSettings]);
  const seededRef = useRef(false);
  const seedConfig = useMemo(() => normalizeContactConfig({
    ...DEFAULT_CONTACT_CONFIG,
    contactItems: buildDefaultContactItemsFromSettings(contactSettings ?? []),
    socialLinks: buildDefaultContactSocialsFromSettings(contactSettings ?? [], socialSettings ?? []),
  }), [contactSettings, socialSettings]);
  const [config, setConfig] = useState<ContactConfigState>(() => normalizeContactConfig({
    ...DEFAULT_CONTACT_CONFIG,
    contactItems: buildDefaultContactItemsFromSettings([]),
    socialLinks: buildDefaultContactSocialsFromSettings([], []),
  }));

  useEffect(() => {
    if (seededRef.current) {return;}
    if (contactSettings === undefined || socialSettings === undefined) {return;}
    setConfig(seedConfig);
    seededRef.current = true;
  }, [contactSettings, seedConfig, socialSettings]);

  const normalizedConfig = useMemo(() => normalizeContactConfig(config), [config]);
  const style = normalizedConfig.style;

  const validation = useMemo(() => getContactValidationResult({
    primary,
    secondary,
    mode,
  }), [primary, secondary, mode]);

  const warningMessages = useMemo(() => {
    if (mode === 'single') {return [];}

    const warnings: string[] = [];

    if (validation.harmonyStatus.isTooSimilar) {
      warnings.push(`Màu chính và màu phụ đang khá gần nhau (deltaE=${validation.harmonyStatus.deltaE}).`);
    }

    if (validation.accessibility.failing.length > 0) {
      warnings.push(`Có ${validation.accessibility.failing.length} cặp màu chưa đạt APCA (minLc=${validation.accessibility.minLc.toFixed(1)}).`);
    }

    return warnings;
  }, [mode, validation]);

  const onSubmit = (event: React.FormEvent) => {
    const nextConfig = normalizeContactConfig(config);
    void handleSubmit(event, {
      ...toContactConfigPayload(nextConfig),
      style: nextConfig.style,
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
      <ConfigEditor
        value={normalizedConfig}
        onChange={(next) => { setConfig(normalizeContactConfig(next)); }}
        title="Cấu hình Contact"
      />

      {mode === 'dual' && warningMessages.length > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50/70">
          <CardContent className="pt-6">
            <div className="space-y-2 text-xs text-amber-800">
              {warningMessages.map((warning) => (
                <p key={warning}>• {warning}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <ContactPreview
        config={{ ...normalizedConfig, style }}
        brandColor={primary}
        secondary={secondary}
        mode={mode}
        selectedStyle={style}
        onStyleChange={(nextStyle) => { setConfig({ ...normalizedConfig, style: nextStyle as ContactStyle }); }}
        title={title}
        mapData={mapData}
        fontStyle={fontStyle}
        fontClassName="font-active"
      />
    </ComponentFormWrapper>
  );
}
