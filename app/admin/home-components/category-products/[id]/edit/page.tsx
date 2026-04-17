'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Package, Loader2, AlertTriangle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '../../../../components/ui';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { CategoryProductsForm } from '../../_components/CategoryProductsForm';
import { CategoryProductsPreview } from '../../_components/CategoryProductsPreview';
import { DEFAULT_CATEGORY_PRODUCTS_CONFIG } from '../../_lib/constants';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import {
  getCategoryProductsValidationResult,
  normalizeCategoryProductsHarmony,
} from '../../_lib/colors';
import type {
  CategoryProductsBrandMode,
  CategoryProductsSection,
  CategoryProductsStyle,
} from '../../_types';

const COMPONENT_TYPE = 'CategoryProducts';

export default function CategoryProductsEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { customState, effectiveColors, initialCustom, setCustomState, setInitialCustom, showCustomBlock } = useTypeColorOverrideState(COMPONENT_TYPE);
  const { customState: customFontState, effectiveFont, initialCustom: initialFontCustom, setCustomState: setCustomFontState, setInitialCustom: setInitialFontCustom, showCustomBlock: showFontCustomBlock } = useTypeFontOverrideState(COMPONENT_TYPE);
  const brandMode: CategoryProductsBrandMode = effectiveColors.mode === 'single' ? 'single' : 'dual';
  const setTypeColorOverride = useMutation(api.homeComponentSystemConfig.setTypeColorOverride);
  const setTypeFontOverride = useMutation(api.homeComponentSystemConfig.setTypeFontOverride);
  const component = useQuery(api.homeComponents.getById, { id: id as Id<'homeComponents'> });
  const updateMutation = useMutation(api.homeComponents.update);
  const categoriesData = useQuery(api.productCategories.listActive);
  const productsData = useQuery(api.products.listPublicResolved, { limit: 100 });

  const [title, setTitle] = useState('');
  const [active, setActive] = useState(true);
  const [sections, setSections] = useState<CategoryProductsSection[]>([]);
  const [style, setStyle] = useState<CategoryProductsStyle>('grid');
  const [showViewAll, setShowViewAll] = useState(true);
  const [columnsDesktop, setColumnsDesktop] = useState(4);
  const [columnsMobile, setColumnsMobile] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [warningMessages, setWarningMessages] = useState<string[]>([]);

  useEffect(() => {
    if (component) {
      if (component.type !== 'CategoryProducts') {
        router.replace(`/admin/home-components/${id}/edit`);
        return;
      }

      setTitle(component.title);
      setActive(component.active);

      const config = component.config ?? DEFAULT_CATEGORY_PRODUCTS_CONFIG;
      const loadedSections = config.sections?.map((s: { categoryId: string; itemCount: number }, i: number) => ({
        categoryId: s.categoryId,
        id: i,
        itemCount: s.itemCount || 4,
      })) ?? [];
      const loadedStyle = (config.style as CategoryProductsStyle) || 'grid';
      const loadedShowViewAll = config.showViewAll ?? true;
      const loadedColumnsDesktop = config.columnsDesktop ?? 4;
      const loadedColumnsMobile = config.columnsMobile ?? 2;

      setSections(loadedSections);
      setStyle(loadedStyle);
      setShowViewAll(loadedShowViewAll);
      setColumnsDesktop(loadedColumnsDesktop);
      setColumnsMobile(loadedColumnsMobile);

      setInitialSnapshot(JSON.stringify({
        title: component.title,
        active: component.active,
        sections: loadedSections,
        style: loadedStyle,
        showViewAll: loadedShowViewAll,
        columnsDesktop: loadedColumnsDesktop,
        columnsMobile: loadedColumnsMobile,
        type: component.type,
      }));
      setHasChanges(false);
    }
  }, [component, id, router]);

  useEffect(() => {
    if (!component || !initialSnapshot) {return;}

    const snapshot = JSON.stringify({
      title,
      active,
      sections,
      style,
      showViewAll,
      columnsDesktop,
      columnsMobile,
      type: component.type,
    });
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
    setHasChanges(snapshot !== initialSnapshot || customChanged || customFontChanged);
  }, [
    title,
    active,
    sections,
    style,
    showViewAll,
    columnsDesktop,
    columnsMobile,
    component,
    initialSnapshot,
    customState,
    initialCustom,
    showCustomBlock,
    customFontState,
    initialFontCustom,
    showFontCustomBlock,
  ]);

  const buildWarningMessages = (validation: ReturnType<typeof getCategoryProductsValidationResult>) => {
    const messages: string[] = [];

    if (brandMode === 'dual' && validation.harmonyStatus.isTooSimilar) {
      messages.push(`Màu phụ đang khá gần màu chính (deltaE = ${validation.harmonyStatus.deltaE}). Nên tăng độ tách biệt.`);
    }

    if (validation.accessibility.failing.length > 0) {
      messages.push(`Một số cặp màu chữ/nền chưa đủ tương phản (minLc = ${validation.accessibility.minLc.toFixed(1)}).`);
    }

    return messages;
  };

  useEffect(() => {
    if (!component || component.type !== 'CategoryProducts') {return;}
    const harmony = normalizeCategoryProductsHarmony((component.config as { harmony?: string } | undefined)?.harmony);
    const validation = getCategoryProductsValidationResult({
      primary: effectiveColors.primary,
      secondary: effectiveColors.secondary,
      mode: brandMode,
      harmony,
    });
    setWarningMessages(buildWarningMessages(validation));
  }, [component, effectiveColors.primary, effectiveColors.secondary, brandMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !hasChanges) {return;}

    const harmony = normalizeCategoryProductsHarmony((component?.config as { harmony?: string } | undefined)?.harmony);
    const validation = getCategoryProductsValidationResult({
      primary: effectiveColors.primary,
      secondary: effectiveColors.secondary,
      mode: brandMode,
      harmony,
    });

    setWarningMessages(buildWarningMessages(validation));
    setIsSubmitting(true);
    try {
      await updateMutation({
        active,
        config: {
          columnsDesktop,
          columnsMobile,
          sections: sections.map(s => ({ categoryId: s.categoryId, itemCount: s.itemCount })),
          showViewAll,
          style,
        },
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
        setInitialCustom({
          enabled: customState.enabled,
          mode: customState.mode,
          primary: customState.primary,
          secondary: resolvedCustomSecondary,
        });
      }
      if (showFontCustomBlock) {
        await setTypeFontOverride({
          enabled: customFontState.enabled,
          fontKey: customFontState.fontKey,
          type: COMPONENT_TYPE,
        });
        setInitialFontCustom({
          enabled: customFontState.enabled,
          fontKey: customFontState.fontKey,
        });
      }
      toast.success('Đã cập nhật Sản phẩm theo danh mục');
      setInitialSnapshot(JSON.stringify({
        title,
        active,
        sections,
        style,
        showViewAll,
        columnsDesktop,
        columnsMobile,
        type: component?.type,
      }));
      setHasChanges(false);
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Sản phẩm theo danh mục</h1>
        <Link href="/admin/home-components" className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package size={20} />
              Sản phẩm theo danh mục
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tiêu đề hiển thị <span className="text-red-500">*</span></Label>
              <Input
                value={title}
                onChange={(e) =>{  setTitle(e.target.value); }}
                required
                placeholder="Nhập tiêu đề component..."
              />
            </div>

            <div className="flex items-center gap-3">
              <Label>Trạng thái:</Label>
              <div
                className={cn(
                  'cursor-pointer inline-flex items-center justify-center rounded-full w-12 h-6 transition-colors',
                  active ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                )}
                onClick={() =>{  setActive(!active); }}
              >
                <div className={cn(
                  'w-5 h-5 bg-white rounded-full transition-transform shadow',
                  active ? 'translate-x-2.5' : '-translate-x-2.5'
                )}></div>
              </div>
              <span className="text-sm text-slate-500">{active ? 'Bật' : 'Tắt'}</span>
            </div>
          </CardContent>
        </Card>

        <CategoryProductsForm
          sections={sections}
          setSections={setSections}
          columnsDesktop={columnsDesktop}
          setColumnsDesktop={setColumnsDesktop}
          columnsMobile={columnsMobile}
          setColumnsMobile={setColumnsMobile}
          showViewAll={showViewAll}
          setShowViewAll={setShowViewAll}
          categoriesData={categoriesData ?? []}
        />

        {warningMessages.length > 0 && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <div className="space-y-2">
              {warningMessages.map((message, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  {message.includes('deltaE') ? <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" /> : <Eye size={14} className="mt-0.5 flex-shrink-0" />}
                  <p>{message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom cho Sản phẩm theo danh mục"
                enabled={customState.enabled}
                mode={customState.mode}
                primary={customState.primary}
                secondary={customState.secondary}
                onEnabledChange={(next) => setCustomState((prev) => ({ ...prev, enabled: next }))}
                onModeChange={(next) => setCustomState((prev) => {
                  if (next === prev.mode) {return prev;}
                  if (next === 'single') {
                    return {
                      ...prev,
                      mode: 'single',
                      secondary: prev.primary,
                    };
                  }
                  return {
                    ...prev,
                    mode: 'dual',
                    secondary: prev.mode === 'single' ? getSuggestedSecondary(prev.primary) : prev.secondary,
                  };
                })}
                onPrimaryChange={(value) => setCustomState((prev) => (
                  prev.mode === 'single'
                    ? { ...prev, primary: value, secondary: value }
                    : { ...prev, primary: value }
                ))}
                onSecondaryChange={(value) => setCustomState((prev) => ({ ...prev, secondary: value }))}
              />
            )}
            {showFontCustomBlock && (
              <TypeFontOverrideCard
                title="Font custom cho Sản phẩm theo danh mục"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            )}
            <CategoryProductsPreview
              config={{
              columnsDesktop,
              columnsMobile,
              sections,
              showViewAll,
              style,
              }}
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              mode={brandMode}
              selectedStyle={style}
              onStyleChange={setStyle}
              categoriesData={categoriesData ?? []}
              productsData={productsData ?? []}
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
