'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import type { Id } from '@/convex/_generated/dataModel';
import { api } from '@/convex/_generated/api';
import { Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '../../../../components/ui';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { getHomeComponentPriceLabel, resolveSaleMode } from '../../../_shared/lib/productPrice';
import { ProductGridForm } from '../../_components/ProductGridForm';
import type { ProductGridProductItem } from '../../_components/ProductGridForm';
import { ProductGridPreview } from '../../_components/ProductGridPreview';
import { DEFAULT_PRODUCT_GRID_CONFIG } from '../../_lib/constants';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import type { ProductGridStyle } from '../../_types';
import type { ProductListPreviewItem } from '../../../product-list/_types';

const COMPONENT_TYPE = 'ProductGrid';

export default function ProductGridEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { customState, effectiveColors, initialCustom, setCustomState, setInitialCustom, showCustomBlock } = useTypeColorOverrideState(COMPONENT_TYPE);
  const { customState: customFontState, effectiveFont, initialCustom: initialFontCustom, setCustomState: setCustomFontState, setInitialCustom: setInitialFontCustom, showCustomBlock: showFontCustomBlock } = useTypeFontOverrideState(COMPONENT_TYPE);
  const setTypeColorOverride = useMutation(api.homeComponentSystemConfig.setTypeColorOverride);
  const setTypeFontOverride = useMutation(api.homeComponentSystemConfig.setTypeFontOverride);
  const component = useQuery(api.homeComponents.getById, { id: id as Id<'homeComponents'> });
  const productsData = useQuery(api.products.listAll, { limit: 100 });
  const resolvedProductsData = useQuery(api.products.listPublicResolved, { limit: 100 });
  const saleModeSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'saleMode' });
  const updateMutation = useMutation(api.homeComponents.update);
  const saleMode = useMemo(() => resolveSaleMode(saleModeSetting?.value), [saleModeSetting?.value]);

  const resolvedProductMap = useMemo(() => new Map(
    (resolvedProductsData ?? []).map((product) => [product._id, product])
  ), [resolvedProductsData]);

  const [title, setTitle] = useState('');
  const [active, setActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const [itemCount, setItemCount] = useState(DEFAULT_PRODUCT_GRID_CONFIG.itemCount);
  const [sortBy, setSortBy] = useState(DEFAULT_PRODUCT_GRID_CONFIG.sortBy);
  const [selectionMode, setSelectionMode] = useState(DEFAULT_PRODUCT_GRID_CONFIG.selectionMode);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(DEFAULT_PRODUCT_GRID_CONFIG.selectedProductIds);
  const [subTitle, setSubTitle] = useState(DEFAULT_PRODUCT_GRID_CONFIG.subTitle);
  const [sectionTitle, setSectionTitle] = useState(DEFAULT_PRODUCT_GRID_CONFIG.sectionTitle);
  const [style, setStyle] = useState<ProductGridStyle>(DEFAULT_PRODUCT_GRID_CONFIG.style);
  const [productSearchTerm, setProductSearchTerm] = useState('');

  useEffect(() => {
    if (!component || isInitialized) {return;}
    if (component.type !== 'ProductGrid') {
      router.replace(`/admin/home-components/${id}/edit`);
      return;
    }

    setTitle(component.title);
    setActive(component.active);

    const config = component.config ?? {};
    const nextItemCount = config.itemCount ?? DEFAULT_PRODUCT_GRID_CONFIG.itemCount;
    const nextSortBy = config.sortBy ?? DEFAULT_PRODUCT_GRID_CONFIG.sortBy;
    const nextSelectionMode = config.selectionMode ?? DEFAULT_PRODUCT_GRID_CONFIG.selectionMode;
    const nextSelectedProductIds = config.selectedProductIds ?? [];
    const nextSubTitle = config.subTitle ?? DEFAULT_PRODUCT_GRID_CONFIG.subTitle;
    const nextSectionTitle = config.sectionTitle ?? DEFAULT_PRODUCT_GRID_CONFIG.sectionTitle;
    const nextStyle = (config.style as ProductGridStyle) ?? DEFAULT_PRODUCT_GRID_CONFIG.style;

    setItemCount(nextItemCount);
    setSortBy(nextSortBy);
    setSelectionMode(nextSelectionMode);
    setSelectedProductIds(nextSelectedProductIds);
    setSubTitle(nextSubTitle);
    setSectionTitle(nextSectionTitle);
    setStyle(nextStyle);
    setInitialSnapshot(JSON.stringify({
      title: component.title,
      active: component.active,
      itemCount: nextItemCount,
      sortBy: nextSortBy,
      selectionMode: nextSelectionMode,
      selectedProductIds: nextSelectionMode === 'manual' ? nextSelectedProductIds : [],
      style: nextStyle,
      subTitle: nextSubTitle,
      sectionTitle: nextSectionTitle,
    }));
    setHasChanges(false);
    setIsInitialized(true);
  }, [component, id, isInitialized, router]);

  const filteredProducts = useMemo<ProductGridProductItem[]>(() => {
    if (!productsData) {return [];}
    return productsData
      .filter(product => product.status === 'Active')
      .filter(product => !productSearchTerm || product.name.toLowerCase().includes(productSearchTerm.toLowerCase()))
      .map(product => ({
        _id: product._id,
        image: product.image,
        name: product.name,
        price: product.price,
      }));
  }, [productsData, productSearchTerm]);

  const selectedProducts = useMemo<ProductGridProductItem[]>(() => {
    if (!productsData || selectedProductIds.length === 0) {return [];}
    const productMap = new Map(productsData.map(product => [product._id, product]));
    return selectedProductIds
      .map(idValue => productMap.get(idValue as Id<'products'>))
      .filter((product): product is NonNullable<typeof product> => product !== undefined)
      .map(product => ({
        _id: product._id,
        image: product.image,
        name: product.name,
        price: product.price,
      }));
  }, [productsData, selectedProductIds]);

  const productPreviewItems: ProductListPreviewItem[] = useMemo(() => selectedProducts.map((p) => {
    const resolvedProduct = resolvedProductMap.get(p._id as Id<'products'>);
    const priceValue = resolvedProduct?.price ?? p.price ?? undefined;
    const salePriceValue = resolvedProduct?.salePrice ?? undefined;
    const priceDisplay = getHomeComponentPriceLabel({ saleMode, price: priceValue, salePrice: salePriceValue, isRangeFromVariant: resolvedProduct?.hasVariants ?? p.hasVariants });
    const hasBasePrice = priceValue != null || salePriceValue != null;
    return {
      description: p.name,
      id: p._id,
      image: p.image ?? undefined,
      name: p.name,
      price: !hasBasePrice && saleMode === 'cart' ? undefined : priceDisplay.label,
      originalPrice: priceDisplay.comparePrice
        ? getHomeComponentPriceLabel({ saleMode: 'cart', price: priceDisplay.comparePrice }).label
        : undefined,
    };
  }), [selectedProducts, saleMode]);

  const autoProductPreviewItems: ProductListPreviewItem[] = useMemo(() => {
    const source = resolvedProductsData ?? productsData;
    if (!source) {return [];} 
    return source
      .filter(product => product.status === 'Active')
      .slice(0, itemCount)
      .map(product => {
        const priceDisplay = getHomeComponentPriceLabel({ saleMode, price: product.price ?? undefined, salePrice: product.salePrice ?? undefined, isRangeFromVariant: product.hasVariants });
        const hasBasePrice = product.price != null || product.salePrice != null;
        return {
          description: product.name,
          id: product._id,
          image: product.image ?? undefined,
          name: product.name,
          price: !hasBasePrice && saleMode === 'cart' ? undefined : priceDisplay.label,
          originalPrice: priceDisplay.comparePrice
            ? getHomeComponentPriceLabel({ saleMode: 'cart', price: priceDisplay.comparePrice }).label
            : undefined,
        };
      });
  }, [productsData, resolvedProductsData, itemCount, saleMode]);

  const resolvedCustomSecondary = resolveSecondaryByMode(customState.mode, customState.primary, customState.secondary);

  useEffect(() => {
    if (!component || !initialSnapshot) {return;}
    const snapshot = JSON.stringify({
      title,
      active,
      itemCount,
      sortBy,
      selectionMode,
      selectedProductIds: selectionMode === 'manual' ? selectedProductIds : [],
      style,
      subTitle,
      sectionTitle,
    });
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
    itemCount,
    sortBy,
    selectionMode,
    selectedProductIds,
    style,
    subTitle,
    sectionTitle,
    component,
    initialSnapshot,
    customState,
    initialCustom,
    showCustomBlock,
    customFontState,
    initialFontCustom,
    showFontCustomBlock,
    resolvedCustomSecondary,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !hasChanges) {return;}

    setIsSubmitting(true);
    try {
      const savedSelectedProductIds = selectionMode === 'manual' ? selectedProductIds : [];
      await updateMutation({
        active,
        config: {
          itemCount,
          sectionTitle,
          selectedProductIds: savedSelectedProductIds,
          selectionMode,
          sortBy,
          style,
          subTitle,
        },
        id: id as Id<'homeComponents'>,
        title,
      });
      if (showCustomBlock) {
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
      toast.success('Đã cập nhật Sản phẩm');
      setInitialSnapshot(JSON.stringify({
        title,
        active,
        itemCount,
        sortBy,
        selectionMode,
        selectedProductIds: savedSelectedProductIds,
        style,
        subTitle,
        sectionTitle,
      }));
      if (showCustomBlock) {
        setInitialCustom({
          enabled: customState.enabled,
          mode: customState.mode,
          primary: customState.primary,
          secondary: resolvedCustomSecondary,
        });
      }
      if (showFontCustomBlock) {
        setInitialFontCustom({
          enabled: customFontState.enabled,
          fontKey: customFontState.fontKey,
        });
      }
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Sản phẩm</h1>
        <Link href="/admin/home-components" className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package size={20} />
              Sản phẩm
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
                  "cursor-pointer inline-flex items-center justify-center rounded-full w-12 h-6 transition-colors",
                  active ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"
                )}
                onClick={() =>{  setActive(!active); }}
              >
                <div className={cn(
                  "w-5 h-5 bg-white rounded-full transition-transform shadow",
                  active ? "translate-x-2.5" : "-translate-x-2.5"
                )}></div>
              </div>
              <span className="text-sm text-slate-500">{active ? 'Bật' : 'Tắt'}</span>
            </div>
          </CardContent>
        </Card>

        <ProductGridForm
          itemCount={itemCount}
          setItemCount={setItemCount}
          sortBy={sortBy}
          setSortBy={setSortBy}
          selectionMode={selectionMode}
          setSelectionMode={setSelectionMode}
          selectedProductIds={selectedProductIds}
          setSelectedProductIds={setSelectedProductIds}
          subTitle={subTitle}
          setSubTitle={setSubTitle}
          sectionTitle={sectionTitle}
          setSectionTitle={setSectionTitle}
          productSearchTerm={productSearchTerm}
          setProductSearchTerm={setProductSearchTerm}
          selectedProducts={selectedProducts}
          filteredProducts={filteredProducts}
          isLoading={productsData === undefined}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom cho Sản phẩm"
                enabled={customState.enabled}
                mode={customState.mode}
                primary={customState.primary}
                secondary={resolvedCustomSecondary}
                onEnabledChange={(next) => setCustomState((prev) => ({ ...prev, enabled: next }))}
                onModeChange={(next) => {
                  if (next === 'single') {
                    setCustomState((prev) => ({ ...prev, mode: 'single', secondary: prev.primary }));
                    return;
                  }
                  setCustomState((prev) => ({
                    ...prev,
                    mode: 'dual',
                    secondary: prev.mode === 'single' ? getSuggestedSecondary(prev.primary) : prev.secondary,
                  }));
                }}
                onPrimaryChange={(value) => setCustomState((prev) => ({
                  ...prev,
                  primary: value,
                  secondary: prev.mode === 'single' ? value : prev.secondary,
                }))}
                onSecondaryChange={(value) => setCustomState((prev) => ({ ...prev, secondary: value }))}
              />
            )}
            {showFontCustomBlock && (
              <TypeFontOverrideCard
                title="Font custom cho Sản phẩm"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            )}
            <ProductGridPreview
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              itemCount={selectionMode === 'manual' ? selectedProductIds.length : itemCount}
              selectedStyle={style}
              onStyleChange={setStyle}
              items={selectionMode === 'manual' && productPreviewItems.length > 0
              ? productPreviewItems
              : (autoProductPreviewItems.length > 0 ? autoProductPreviewItems : undefined)
              }
              subTitle={subTitle}
              sectionTitle={sectionTitle}
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
