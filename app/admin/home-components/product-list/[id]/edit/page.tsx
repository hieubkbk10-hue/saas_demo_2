'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Package, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '../../../../components/ui';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { getHomeComponentPriceLabel, resolveSaleMode } from '../../../_shared/lib/productPrice';
import { ProductListForm } from '../../_components/ProductListForm';
import { ProductListPreview } from '../../_components/ProductListPreview';
import { DEFAULT_PRODUCT_LIST_CONFIG, DEFAULT_PRODUCT_LIST_TEXT } from '../../_lib/constants';
import type { ProductListConfig, ProductListStyle, ProductSelectionMode } from '../../_types';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';

const COMPONENT_TYPE = 'ProductList';

export default function ProductListEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { customState, effectiveColors, initialCustom, setCustomState, setInitialCustom, showCustomBlock } = useTypeColorOverrideState(COMPONENT_TYPE);
  const { customState: customFontState, effectiveFont, initialCustom: initialFontCustom, setCustomState: setCustomFontState, setInitialCustom: setInitialFontCustom, showCustomBlock: showFontCustomBlock } = useTypeFontOverrideState(COMPONENT_TYPE);
  const setTypeColorOverride = useMutation(api.homeComponentSystemConfig.setTypeColorOverride);
  const setTypeFontOverride = useMutation(api.homeComponentSystemConfig.setTypeFontOverride);
  const component = useQuery(api.homeComponents.getById, { id: id as Id<'homeComponents'> });
  const updateMutation = useMutation(api.homeComponents.update);

  const [title, setTitle] = useState('');
  const [active, setActive] = useState(true);
  const [productListConfig, setProductListConfig] = useState<ProductListConfig>(DEFAULT_PRODUCT_LIST_CONFIG);
  const [productListStyle, setProductListStyle] = useState<ProductListStyle>('commerce');
  const [productSelectionMode, setProductSelectionMode] = useState<ProductSelectionMode>('auto');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productSubTitle, setProductSubTitle] = useState(DEFAULT_PRODUCT_LIST_TEXT.subTitle);
  const [productSectionTitle, setProductSectionTitle] = useState(DEFAULT_PRODUCT_LIST_TEXT.sectionTitle);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null);

  const productsData = useQuery(api.products.listAll, { limit: 100 });
  const resolvedProductsData = useQuery(api.products.listPublicResolved, { limit: 100 });
  const saleModeSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'saleMode' });
  const saleMode = useMemo(() => resolveSaleMode(saleModeSetting?.value), [saleModeSetting?.value]);

  const resolvedProductMap = useMemo(() => new Map(
    (resolvedProductsData ?? []).map((product) => [product._id, product])
  ), [resolvedProductsData]);

  const filteredProducts = useMemo(() => {
    if (!productsData) {return [];}
    return productsData
      .filter(product => product.status === 'Active')
      .filter(product =>
        !productSearchTerm ||
        product.name.toLowerCase().includes(productSearchTerm.toLowerCase())
      );
  }, [productsData, productSearchTerm]);

  const selectedProducts = useMemo(() => {
    if (!productsData || selectedProductIds.length === 0) {return [];}
    const productMap = new Map(productsData.map(p => [p._id, p]));
    return selectedProductIds
      .map((productId) => productMap.get(productId as Id<'products'>))
      .filter((product): product is NonNullable<typeof product> => product !== undefined);
  }, [productsData, selectedProductIds]);

  useEffect(() => {
    if (component) {
      if (component.type !== 'ProductList') {
        router.replace(`/admin/home-components/${id}/edit`);
        return;
      }

      setTitle(component.title);
      setActive(component.active);

      const config = component.config ?? {};
      setProductListConfig({
        itemCount: config.itemCount ?? DEFAULT_PRODUCT_LIST_CONFIG.itemCount,
        sortBy: config.sortBy ?? DEFAULT_PRODUCT_LIST_CONFIG.sortBy,
      });
      setProductListStyle((config.style as ProductListStyle) || 'commerce');
      setProductSelectionMode((config.selectionMode as ProductSelectionMode) || 'auto');
      setSelectedProductIds((config.selectedProductIds as string[]) ?? []);
      setProductSubTitle((config.subTitle as string) || DEFAULT_PRODUCT_LIST_TEXT.subTitle);
      setProductSectionTitle((config.sectionTitle as string) || DEFAULT_PRODUCT_LIST_TEXT.sectionTitle);
    }
  }, [component, id, router]);

  const toSnapshot = (payload: {
    title: string;
    active: boolean;
    itemCount: number;
    sortBy: string;
    style: ProductListStyle;
    selectionMode: ProductSelectionMode;
    selectedProductIds: string[];
    subTitle: string;
    sectionTitle: string;
  }) => JSON.stringify(payload);

  useEffect(() => {
    if (!component) {return;}
    const config = component.config ?? {};
    const initialSelectionMode = ((config.selectionMode as ProductSelectionMode) || 'auto');

    setInitialSnapshot(toSnapshot({
      title: component.title,
      active: component.active,
      itemCount: (config.itemCount as number) ?? DEFAULT_PRODUCT_LIST_CONFIG.itemCount,
      sortBy: (config.sortBy as string) ?? DEFAULT_PRODUCT_LIST_CONFIG.sortBy,
      style: ((config.style as ProductListStyle) || 'commerce'),
      selectionMode: initialSelectionMode,
      selectedProductIds: initialSelectionMode === 'manual' ? ((config.selectedProductIds as string[]) ?? []) : [],
      subTitle: (config.subTitle as string) || DEFAULT_PRODUCT_LIST_TEXT.subTitle,
      sectionTitle: (config.sectionTitle as string) || DEFAULT_PRODUCT_LIST_TEXT.sectionTitle,
    }));
  }, [component]);

  const currentSnapshot = toSnapshot({
    title,
    active,
    itemCount: productListConfig.itemCount,
    sortBy: productListConfig.sortBy,
    style: productListStyle,
    selectionMode: productSelectionMode,
    selectedProductIds: productSelectionMode === 'manual' ? selectedProductIds : [],
    subTitle: productSubTitle,
    sectionTitle: productSectionTitle,
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
  const hasChanges = initialSnapshot !== null && (currentSnapshot !== initialSnapshot || customChanged || customFontChanged);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) {return;}

    setIsSubmitting(true);
    try {
      const nextConfig = {
        ...productListConfig,
        selectionMode: productSelectionMode,
        selectedProductIds: productSelectionMode === 'manual' ? selectedProductIds : [],
        sectionTitle: productSectionTitle,
        style: productListStyle,
        subTitle: productSubTitle,
      };

      await updateMutation({
        active,
        config: nextConfig,
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

      setInitialSnapshot(toSnapshot({
        title,
        active,
        itemCount: nextConfig.itemCount,
        sortBy: nextConfig.sortBy,
        style: nextConfig.style,
        selectionMode: nextConfig.selectionMode,
        selectedProductIds: nextConfig.selectedProductIds,
        subTitle: nextConfig.subTitle,
        sectionTitle: nextConfig.sectionTitle,
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

      toast.success('Đã cập nhật danh sách sản phẩm');
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Danh sách Sản phẩm</h1>
        <Link href="/admin/home-components" className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package size={20} />
              Danh sách Sản phẩm
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

        <ProductListForm
          productSubTitle={productSubTitle}
          setProductSubTitle={setProductSubTitle}
          productSectionTitle={productSectionTitle}
          setProductSectionTitle={setProductSectionTitle}
          productSelectionMode={productSelectionMode}
          setProductSelectionMode={setProductSelectionMode}
          productListConfig={productListConfig}
          setProductListConfig={setProductListConfig}
          filteredProducts={filteredProducts}
          selectedProducts={selectedProducts}
          selectedProductIds={selectedProductIds}
          setSelectedProductIds={setSelectedProductIds}
          productSearchTerm={productSearchTerm}
          setProductSearchTerm={setProductSearchTerm}
          isLoading={productsData === undefined}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom cho Danh sách sản phẩm"
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
                onPrimaryChange={(value) => {
                  setCustomState((prev) => ({
                    ...prev,
                    primary: value,
                    secondary: prev.mode === 'single' ? value : prev.secondary,
                  }));
                }}
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
            <ProductListPreview
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              itemCount={productSelectionMode === 'manual' ? selectedProductIds.length : productListConfig.itemCount}
              componentType="ProductList"
              selectedStyle={productListStyle}
              onStyleChange={setProductListStyle}
              items={productSelectionMode === 'manual' && selectedProducts.length > 0
                ? selectedProducts.map((product) => ({
                  description: product.description,
                  id: product._id,
                  image: product.image,
                  name: product.name,
                  ...(() => {
                    const resolvedProduct = resolvedProductMap.get(product._id as Id<'products'>) ?? product;
                    const priceDisplay = getHomeComponentPriceLabel({ saleMode, price: resolvedProduct.price, salePrice: resolvedProduct.salePrice, isRangeFromVariant: resolvedProduct.hasVariants });
                    const hasBasePrice = resolvedProduct.price != null || resolvedProduct.salePrice != null;
                    return {
                      price: !hasBasePrice && saleMode === 'cart' ? undefined : priceDisplay.label,
                      originalPrice: priceDisplay.comparePrice
                        ? getHomeComponentPriceLabel({ saleMode: 'cart', price: priceDisplay.comparePrice }).label
                        : undefined,
                    };
                  })(),
                }))
                : filteredProducts.slice(0, productListConfig.itemCount).map((product) => ({
                  description: product.description,
                  id: product._id,
                  image: product.image,
                  name: product.name,
                  ...(() => {
                    const resolvedProduct = resolvedProductMap.get(product._id as Id<'products'>) ?? product;
                    const priceDisplay = getHomeComponentPriceLabel({ saleMode, price: resolvedProduct.price, salePrice: resolvedProduct.salePrice, isRangeFromVariant: resolvedProduct.hasVariants });
                    const hasBasePrice = resolvedProduct.price != null || resolvedProduct.salePrice != null;
                    return {
                      price: !hasBasePrice && saleMode === 'cart' ? undefined : priceDisplay.label,
                      originalPrice: priceDisplay.comparePrice
                        ? getHomeComponentPriceLabel({ saleMode: 'cart', price: priceDisplay.comparePrice }).label
                        : undefined,
                    };
                  })(),
                }))
              }
              subTitle={productSubTitle}
              sectionTitle={productSectionTitle}
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
