'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { prepareImageForUpload } from '@/lib/image/uploadPipeline';
import { resolveNamingContext } from '@/lib/image/uploadNaming';
import { Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '../../../../components/ui';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { ClientsForm } from '../../_components/ClientsForm';
import { ClientsPreview } from '../../_components/ClientsPreview';
import { ClientsTextsForm } from '../../_components/ClientsTextsForm';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import {
  DEFAULT_CLIENTS_CONFIG,
} from '../../_lib/constants';
import { getClientsValidationResult } from '../../_lib/colors';
import { normalizeClientItems, normalizeClientsStyleSafe } from '../../_components/ClientsSectionShared';
import type {
  ClientEditorItem,
  ClientsConfig,
  ClientsStyle,
} from '../../_types';

const toEditorItems = (items: ClientsConfig['items']): ClientEditorItem[] => {
  const normalized = normalizeClientItems(items);

  if (normalized.length === 0) {
    return [
      { id: 'item-1', inputMode: 'upload', link: '', name: '', url: '' },
      { id: 'item-2', inputMode: 'upload', link: '', name: '', url: '' },
      { id: 'item-3', inputMode: 'upload', link: '', name: '', url: '' },
    ];
  }

  return normalized.map((item, index) => ({
    id: `item-${index + 1}`,
    inputMode: 'upload',
    link: item.link,
    name: item.name,
    url: item.url,
  }));
};

const toPersistItems = (items: ClientEditorItem[]): ClientsConfig['items'] => {
  const normalized = normalizeClientItems(items);
  return normalized.map((item) => ({
    link: item.link,
    name: item.name,
    url: item.url,
  }));
};

const toSnapshot = (payload: {
  title: string;
  active: boolean;
  style: ClientsStyle;
  items: ClientsConfig['items'];
  texts?: Record<string, string>;
}) => JSON.stringify({
  ...payload,
  items: toPersistItems(toEditorItems(payload.items)),
});

const COMPONENT_TYPE = 'Clients';

export default function ClientsEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { customState, effectiveColors, initialCustom, setCustomState, setInitialCustom, showCustomBlock } = useTypeColorOverrideState(COMPONENT_TYPE);
  const { customState: customFontState, effectiveFont, initialCustom: initialFontCustom, setCustomState: setCustomFontState, setInitialCustom: setInitialFontCustom, showCustomBlock: showFontCustomBlock } = useTypeFontOverrideState(COMPONENT_TYPE);
  const setTypeColorOverride = useMutation(api.homeComponentSystemConfig.setTypeColorOverride);
  const setTypeFontOverride = useMutation(api.homeComponentSystemConfig.setTypeFontOverride);
  const component = useQuery(api.homeComponents.getById, { id: id as Id<'homeComponents'> });
  const updateMutation = useMutation(api.homeComponents.update);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const saveImage = useMutation(api.storage.saveImage);

  const [title, setTitle] = useState('');
  const [active, setActive] = useState(true);
  const [items, setItems] = useState<ClientEditorItem[]>(toEditorItems(DEFAULT_CLIENTS_CONFIG.items));
  const [style, setStyle] = useState<ClientsStyle>(DEFAULT_CLIENTS_CONFIG.style);
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null);

  useEffect(() => {
    if (!component) {return;}

    if (component.type !== 'Clients') {
      router.replace(`/admin/home-components/${id}/edit`);
      return;
    }

    const rawConfig = component.config ?? {};
    const rawItems = Array.isArray(rawConfig.items) ? rawConfig.items : DEFAULT_CLIENTS_CONFIG.items;
    const nextStyle = normalizeClientsStyleSafe(rawConfig.style);
    const nextTexts = (rawConfig.texts?.[nextStyle] as Record<string, string>) || {};

    setTitle(component.title);
    setActive(component.active);
    setItems(toEditorItems(rawItems));
    setStyle(nextStyle);
    setTexts(nextTexts);

    setInitialSnapshot(toSnapshot({
      title: component.title,
      active: component.active,
      style: nextStyle,
      items: rawItems,
      texts: nextTexts,
    }));
  }, [component, id, router]);

  const currentItems = useMemo(() => toPersistItems(items), [items]);

  const currentSnapshot = useMemo(() => toSnapshot({
    title,
    active,
    style,
    items: currentItems,
    texts,
  }), [title, active, style, currentItems, texts]);

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

  const validation = useMemo(() => getClientsValidationResult({
    primary: effectiveColors.primary,
    secondary: effectiveColors.secondary,
    mode: effectiveColors.mode,
    style,
  }), [effectiveColors, style]);

  const warningMessages = useMemo(() => {
    const warnings: string[] = [];

    if (effectiveColors.mode === 'dual' && validation.harmonyStatus.isTooSimilar) {
      warnings.push(`Màu chính và màu phụ đang khá gần nhau (deltaE=${validation.harmonyStatus.deltaE}).`);
    }

    if (validation.accessibility.failing.length > 0) {
      warnings.push(`Có ${validation.accessibility.failing.length} cặp màu chưa đạt APCA (minLc=${validation.accessibility.minLc.toFixed(1)}).`);
    }

    if (validation.accentBalance?.warnings.length > 0) {
      warnings.push(...validation.accentBalance.warnings);
    }

    return warnings;
  }, [effectiveColors.mode, validation]);

  const handleImageUpload = async (itemId: string, file: File) => {
    setUploadingId(itemId);
    try {
      const itemIndex = items.findIndex(item => item.id === itemId);
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
        storageId: storageId as Id<'_storage'>,
        width: prepared.width,
      });

      if (saved.url) {
        setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, url: saved.url ?? '' } : item)));
        toast.success('Upload thành công');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Upload thất bại');
    } finally {
      setUploadingId(null);
    }
  };

  const toggleInputMode = (id: string) => {
    setItems((prev) => prev.map((item) => (
      item.id === id
        ? { ...item, inputMode: item.inputMode === 'upload' ? 'url' : 'upload', url: '' }
        : item
    )));
  };

  const addItem = () => {
    if (items.length >= 20) {return;}
    setItems((prev) => [...prev, {
      id: `item-${Date.now()}`,
      inputMode: 'upload',
      link: '',
      name: '',
      url: '',
    }]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof ClientEditorItem, value: string) => {
    setItems((prev) => prev.map((item) => (
      item.id === id ? { ...item, [field]: value } : item
    )));
  };

  const moveItem = (idx: number, direction: -1 | 1) => {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= items.length) {return;}

    setItems((prev) => {
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting || !hasChanges) {return;}

    setIsSubmitting(true);
    try {
      const allTexts: Record<ClientsStyle, Record<string, string>> = {
        simpleGrid: { ...DEFAULT_CLIENTS_CONFIG.texts!.simpleGrid },
        compactInline: { ...DEFAULT_CLIENTS_CONFIG.texts!.compactInline },
        subtleMarquee: { ...DEFAULT_CLIENTS_CONFIG.texts!.subtleMarquee },
        grid: { ...DEFAULT_CLIENTS_CONFIG.texts!.grid },
        carousel: { ...DEFAULT_CLIENTS_CONFIG.texts!.carousel },
        featured: { ...DEFAULT_CLIENTS_CONFIG.texts!.featured },
      };
      
      allTexts[style] = { ...allTexts[style], ...texts };

      const nextConfig: ClientsConfig = {
        items: currentItems,
        style,
        texts: allTexts,
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
        style,
        items: nextConfig.items,
        texts,
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
      toast.success('Đã cập nhật Clients');
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Clients</h1>
        <Link href="/admin/home-components" className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 size={20} />
              Clients
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tiêu đề hiển thị <span className="text-red-500">*</span></Label>
              <Input
                value={title}
                onChange={(event) =>{  setTitle(event.target.value); }}
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
                onClick={() =>{  setActive(!active); }}
              >
                <div
                  className={cn(
                    'w-5 h-5 bg-white rounded-full transition-transform shadow',
                    active ? 'translate-x-2.5' : '-translate-x-2.5',
                  )}
                />
              </div>
              <span className="text-sm text-slate-500">{active ? 'Bật' : 'Tắt'}</span>
            </div>
          </CardContent>
        </Card>

        <ClientsTextsForm
          style={style}
          texts={texts}
          onUpdateText={(key, value) => {
            setTexts((prev) => ({ ...prev, [key]: value }));
          }}
        />

        <ClientsForm
          items={items}
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

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom cho Clients"
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
                title="Font custom cho Clients"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            )}
            <ClientsPreview
              items={currentItems}
              title={title}
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              mode={effectiveColors.mode}
              selectedStyle={style}
              onStyleChange={setStyle}
              warningMessages={warningMessages}
              texts={texts}
              fontStyle={fontStyle}
              fontClassName="font-active"
            />
          </div>
        </div>

        <HomeComponentStickyFooter
          isSubmitting={isSubmitting}
          hasChanges={hasChanges}
          onCancel={() =>{  router.push('/admin/home-components'); }}
          submitLabel="Lưu thay đổi"
        />
      </form>
    </div>
  );
}
