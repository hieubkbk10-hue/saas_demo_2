'use client';

import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '../../../components/ui';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { StatsPreview } from '../../stats/_components/StatsPreview';
import type { StatsBrandMode, StatsStyle } from '../../stats/_types';

export default function StatsCreatePage() {
  const COMPONENT_TYPE = 'Stats';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Thống kê', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const brandMode: StatsBrandMode = mode === 'single' ? 'single' : 'dual';
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const [statsItems, setStatsItems] = useState([
    { id: 1, label: 'Khách hàng', value: '1000+' },
    { id: 2, label: 'Đối tác', value: '50+' },
    { id: 3, label: 'Hài lòng', value: '99%' },
    { id: 4, label: 'Hỗ trợ', value: '24/7' }
  ]);
  const [style, setStyle] = useState<StatsStyle>('horizontal');

  const handleAddItem = () => {
    setStatsItems((prev) => ([...prev, { id: Date.now(), label: '', value: '' }]));
  };

  const handleUpdateItem = (id: number, key: 'label' | 'value', value: string) => {
    setStatsItems((prev) => prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  };

  const handleRemoveItem = (id: number) => {
    setStatsItems((prev) => (prev.length <= 1 ? prev : prev.filter((item) => item.id !== id)));
  };

  const onSubmit = (e: React.FormEvent) => {
    void handleSubmit(e, { items: statsItems.map(s => ({ label: s.label, value: s.value })), style });
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
          <CardTitle className="text-base">Số liệu thống kê</CardTitle>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={handleAddItem}
            className="gap-2"
          >
            <Plus size={14} /> Thêm
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {statsItems.map((item, idx) => (
            <div key={item.id} className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-medium text-slate-500">
                {idx + 1}
              </div>
              <Input 
                placeholder="Số liệu (VD: 1000+)" 
                value={item.value} 
                onChange={(e) =>{  handleUpdateItem(item.id, 'value', e.target.value); }}
                className="flex-1" 
              />
              <Input 
                placeholder="Nhãn (VD: Khách hàng)" 
                value={item.label} 
                onChange={(e) =>{  handleUpdateItem(item.id, 'label', e.target.value); }}
                className="flex-1" 
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="text-red-500 h-8 w-8" 
                onClick={() =>{  handleRemoveItem(item.id); }}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <StatsPreview
        items={statsItems}
        brandColor={primary}
        secondary={secondary}
        mode={brandMode}
        selectedStyle={style}
        onStyleChange={setStyle}
        fontStyle={fontStyle}
        fontClassName="font-active"
      />
    </ComponentFormWrapper>
  );
}
