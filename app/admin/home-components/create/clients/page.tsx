'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';
import { prepareImageForUpload } from '@/lib/image/uploadPipeline';
import { resolveNamingContext } from '@/lib/image/uploadNaming';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { ClientsForm } from '../../clients/_components/ClientsForm';
import { ClientsPreview } from '../../clients/_components/ClientsPreview';
import {
  DEFAULT_CLIENTS_CONFIG,
} from '../../clients/_lib/constants';
import { getClientsValidationResult } from '../../clients/_lib/colors';
import type {
  ClientEditorItem,
  ClientsConfig,
  ClientsStyle,
} from '../../clients/_types';

const toEditorItems = (items: ClientsConfig['items']): ClientEditorItem[] => (
  items.map((item, index) => ({
    id: `item-${index + 1}`,
    inputMode: 'upload',
    link: item.link ?? '',
    name: item.name ?? '',
    url: item.url ?? '',
  }))
);

const toPersistItems = (items: ClientEditorItem[]): ClientsConfig['items'] => (
  items.map((item) => ({
    link: item.link.trim(),
    name: (item.name ?? '').trim(),
    url: item.url.trim(),
  }))
);

export default function ClientsCreatePage() {
  const COMPONENT_TYPE = 'Clients';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Khách hàng của chúng tôi', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const saveImage = useMutation(api.storage.saveImage);

  const [clientItems, setClientItems] = useState<ClientEditorItem[]>(toEditorItems(DEFAULT_CLIENTS_CONFIG.items));
  const [style, setStyle] = useState<ClientsStyle>(DEFAULT_CLIENTS_CONFIG.style);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const handleImageUpload = useCallback(async (itemId: string, file: File) => {
    setUploadingId(itemId);
    try {
      const itemIndex = clientItems.findIndex(item => item.id === itemId);
      const resolvedNaming = resolveNamingContext(undefined, {
        entityName: 'clients',
        field: 'logo',
        index: itemIndex >= 0 ? itemIndex + 1 : 1,
      });
      const prepared = await prepareImageForUpload(file, { naming: resolvedNaming });
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, { body: prepared.file, headers: { 'Content-Type': prepared.mimeType }, method: 'POST' });
      const { storageId } = await result.json();
      
      const saved = await saveImage({
        filename: prepared.filename,
        folder: 'clients',
        height: prepared.height,
        mimeType: prepared.mimeType,
        size: prepared.size,
        storageId: storageId as Id<"_storage">,
        width: prepared.width,
      });
      
      if (saved.url) {
        setClientItems(items => items.map(item => item.id === itemId ? { ...item, url: saved.url! } : item));
        toast.success('Upload thành công');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Upload thất bại');
    } finally {
      setUploadingId(null);
    }
  }, [generateUploadUrl, saveImage, clientItems]);

  const toggleInputMode = (id: string) => {
    setClientItems((items) => items.map((item) => (
      item.id === id
        ? { ...item, inputMode: item.inputMode === 'upload' ? 'url' : 'upload', url: '' }
        : item
    )));
  };

  const addItem = () => {
    if (clientItems.length >= 20) {return;}
    setClientItems((items) => [...items, {
      id: `item-${Date.now()}`,
      inputMode: 'upload',
      link: '',
      name: '',
      url: '',
    }]);
  };

  const removeItem = (id: string) => {
    if (clientItems.length <= 3) {return;}
    setClientItems((items) => items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof ClientEditorItem, value: string) => {
    setClientItems((items) => items.map((item) => (
      item.id === id ? { ...item, [field]: value } : item
    )));
  };

  const moveItem = (idx: number, direction: -1 | 1) => {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= clientItems.length) {return;}

    setClientItems((items) => {
      const next = [...items];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  };

  const validation = useMemo(() => getClientsValidationResult({
    primary,
    secondary,
    mode,
    style,
  }), [primary, secondary, mode, style]);

  const warningMessages = useMemo(() => {
    const warnings: string[] = [];

    if (mode === 'dual' && validation.harmonyStatus.isTooSimilar) {
      warnings.push(`Màu chính và màu phụ đang khá gần nhau (deltaE=${validation.harmonyStatus.deltaE}).`);
    }

    if (validation.accessibility.failing.length > 0) {
      warnings.push(`Có ${validation.accessibility.failing.length} cặp màu chưa đạt APCA (minLc=${validation.accessibility.minLc.toFixed(1)}).`);
    }

    if (validation.accentBalance?.warnings.length > 0) {
      warnings.push(...validation.accentBalance.warnings);
    }

    return warnings;
  }, [mode, validation]);

  const onSubmit = (e: React.FormEvent) => {
    void handleSubmit(e, {
      items: toPersistItems(clientItems),
      style,
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
      <ClientsForm
        items={clientItems}
        uploadingId={uploadingId}
        warningMessages={warningMessages}
        onAddItem={addItem}
        onRemoveItem={removeItem}
        onUpdateItem={updateItem}
        onToggleInputMode={toggleInputMode}
        onMoveItem={moveItem}
        onImageUpload={(itemId, file) => {
          void handleImageUpload(itemId, file);
        }}
      />

      <ClientsPreview
        items={toPersistItems(clientItems)}
        title={title}
        brandColor={primary}
        secondary={secondary}
        mode={mode}
        selectedStyle={style}
        onStyleChange={setStyle}
        warningMessages={warningMessages}
        fontStyle={fontStyle}
        fontClassName="font-active"
      />
    </ComponentFormWrapper>
  );
}
