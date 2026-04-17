'use client';

import React from 'react';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { SpeedDialForm } from '../../speed-dial/_components/SpeedDialForm';
import { SpeedDialPreview } from '../../speed-dial/_components/SpeedDialPreview';
import { DEFAULT_SPEED_DIAL_CONFIG, normalizeSpeedDialStyle } from '../../speed-dial/_lib/constants';
import type {
  SpeedDialAction,
  SpeedDialConfig,
  SpeedDialPosition,
  SpeedDialStyle,
} from '../../speed-dial/_types';

const createDefaultActions = (secondary: string): SpeedDialAction[] => {
  const fallbackColor = secondary.trim().length > 0 ? secondary : '#3b82f6';

  return [
    { id: 'action-phone', bgColor: '#22c55e', icon: 'phone', label: 'Gọi ngay', url: 'tel:0123456789' },
    { id: 'action-zalo', bgColor: fallbackColor, icon: 'message-circle', label: 'Chat Zalo', url: 'https://zalo.me/yourpage' },
    { id: 'action-mail', bgColor: '#ef4444', icon: 'mail', label: 'Email', url: 'mailto:contact@example.com' },
  ];
};

export default function SpeedDialCreatePage() {
  const COMPONENT_TYPE = 'SpeedDial';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Speed Dial', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;

  const [actions, setActions] = React.useState<SpeedDialAction[]>(createDefaultActions(secondary));
  const [style, setStyle] = React.useState<SpeedDialStyle>(normalizeSpeedDialStyle(DEFAULT_SPEED_DIAL_CONFIG.style));
  const [position, setPosition] = React.useState<SpeedDialPosition>(DEFAULT_SPEED_DIAL_CONFIG.position);
  const [defaultOpen, setDefaultOpen] = React.useState<boolean>(DEFAULT_SPEED_DIAL_CONFIG.defaultOpen);
  const [showOnAllPages, setShowOnAllPages] = React.useState<boolean>(DEFAULT_SPEED_DIAL_CONFIG.showOnAllPages);

  const onSubmit = (event: React.FormEvent) => {
    const payload: SpeedDialConfig = {
      actions: actions.map((action) => ({
        id: action.id,
        icon: action.icon,
        label: action.label,
        url: action.url,
        bgColor: action.bgColor,
      })),
      style,
      position,
      defaultOpen,
      showOnAllPages,
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
    >
      <SpeedDialForm
        actions={actions}
        onActionsChange={setActions}
        position={position}
        onPositionChange={setPosition}
        defaultOpen={defaultOpen}
        onDefaultOpenChange={setDefaultOpen}
        showOnAllPages={showOnAllPages}
        onShowOnAllPagesChange={setShowOnAllPages}
        defaultActionColor={secondary || primary}
      />

      <SpeedDialPreview
        actions={actions}
        position={position}
        style={style}
        brandColor={primary}
        secondary={secondary}
        mode={mode}
        title={title}
        selectedStyle={style}
        onStyleChange={setStyle}
        defaultOpen={defaultOpen}
      />
    </ComponentFormWrapper>
  );
}
