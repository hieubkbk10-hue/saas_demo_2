'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Eye, Heart, LayoutTemplate, Loader2, Package, Save, ShoppingCart, Tag } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/app/admin/components/ui';
import { useBrandColors } from '@/components/site/hooks';
import { 
  ExperienceModuleLink, 
  ExperienceHintCard,
  ProductsListPreview,
  ExampleLinks,
} from '@/components/experiences';
import {
  BrowserFrame,
  ColorConfigCard,
  DeviceToggle,
  deviceWidths,
  LayoutTabs,
  ControlCard,
  ToggleRow,
  SelectRow,
  type DeviceType,
  type LayoutOption,
} from '@/components/experiences/editor';
import { useExperienceConfig, useExperienceSave, EXPERIENCE_NAMES, MESSAGES } from '@/lib/experiences';
import { enforceMultipleToggles } from '@/lib/experiences/module-toggle-guards';

type ListLayoutStyle = 'grid' | 'sidebar' | 'list';
type PaginationType = 'pagination' | 'infiniteScroll';

type ProductsListExperienceConfig = {
  layoutStyle: ListLayoutStyle;
  layouts: {
    grid: LayoutConfig;
    sidebar: LayoutConfig;
    list: LayoutConfig;
  };
  showWishlistButton: boolean;
  showAddToCartButton: boolean;
  showBuyNowButton: boolean;
  showPromotionBadge: boolean;
  enableQuickAddVariant: boolean;
  hideEmptyCategories: boolean;
};

type LayoutConfig = {
  paginationType: PaginationType;
  showSearch: boolean;
  showCategories: boolean;
  postsPerPage: number;
};

const EXPERIENCE_KEY = 'products_list_ui';

const LAYOUT_STYLES: LayoutOption<ListLayoutStyle>[] = [
  { description: 'Hiển thị dạng lưới cards', id: 'grid', label: 'Grid' },
  { description: 'Sidebar filters + grid', id: 'sidebar', label: 'Sidebar' },
  { description: 'Hiển thị dạng danh sách', id: 'list', label: 'List' },
];

const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  paginationType: 'pagination',
  showSearch: true,
  showCategories: true,
  postsPerPage: 12,
};

const DEFAULT_CONFIG: ProductsListExperienceConfig = {
  layoutStyle: 'grid',
  layouts: {
    grid: { ...DEFAULT_LAYOUT_CONFIG },
    sidebar: { ...DEFAULT_LAYOUT_CONFIG },
    list: { ...DEFAULT_LAYOUT_CONFIG },
  },
  showWishlistButton: true,
  showAddToCartButton: true,
  showBuyNowButton: true,
  showPromotionBadge: true,
  enableQuickAddVariant: true,
  hideEmptyCategories: true,
};

const HINTS = [
  'Grid layout tiêu chuẩn cho e-commerce.',
  'Sidebar filters quan trọng cho shop có nhiều sản phẩm.',
  'Search giúp user tìm sản phẩm nhanh.',
  'Mỗi layout có config riêng - chuyển tab để chỉnh.',
  'Wishlist, Add to Cart và Buy Now có thể toggle từ đây.',
];

function ModuleFeatureStatus({ label, enabled, href, moduleName }: { label: string; enabled: boolean; href: string; moduleName: string }) {
  return (
    <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
      <div className="flex items-start gap-2">
        <span className={`mt-1 inline-flex h-2 w-2 rounded-full ${enabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
        <div>
          <p className="text-sm font-medium text-slate-700">{label}</p>
          <p className="text-xs text-slate-500">
            {enabled ? 'Đang bật' : 'Chưa bật'} · Nếu muốn {enabled ? 'tắt' : 'bật'} hãy vào {moduleName}
          </p>
        </div>
      </div>
      <Link href={href} className="text-xs font-medium text-cyan-600 hover:underline">
        Đi đến →
      </Link>
    </div>
  );
}

export default function ProductsListExperiencePage() {
  const experienceSetting = useQuery(api.settings.getByKey, { key: EXPERIENCE_KEY });
  const productsModule = useQuery(api.admin.modules.getModuleByKey, { key: 'products' });
  const wishlistModule = useQuery(api.admin.modules.getModuleByKey, { key: 'wishlist' });
  const cartModule = useQuery(api.admin.modules.getModuleByKey, { key: 'cart' });
  const ordersModule = useQuery(api.admin.modules.getModuleByKey, { key: 'orders' });
  const promotionsModule = useQuery(api.admin.modules.getModuleByKey, { key: 'promotions' });
  const variantsSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'variantEnabled' });
  const brandColors = useBrandColors();
  const [brandColor, setBrandColor] = useState(brandColors.primary);
  const [secondaryColor, setSecondaryColor] = useState(brandColors.secondary || '');
  const [colorMode, setColorMode] = useState<'single' | 'dual'>(brandColors.mode || 'single');
  const [previewDevice, setPreviewDevice] = useState<DeviceType>('desktop');

  const serverConfig = useMemo<ProductsListExperienceConfig>(() => {
    const raw = experienceSetting?.value as {
      layoutStyle?: ListLayoutStyle | 'masonry';
      layouts?: Partial<Record<'grid' | 'list' | 'sidebar' | 'masonry', Partial<LayoutConfig & { showPagination?: boolean }>>>;
      showWishlistButton?: boolean;
      showAddToCartButton?: boolean;
      showBuyNowButton?: boolean;
      showPromotionBadge?: boolean;
      enableQuickAddVariant?: boolean;
      hideEmptyCategories?: boolean;
    } | undefined;
    
    const normalizePaginationType = (value?: string | boolean): PaginationType => {
      if (value === 'infiniteScroll') return 'infiniteScroll';
      if (value === 'pagination') return 'pagination';
      if (value === false) return 'infiniteScroll';
      return 'pagination';
    };
    
    const normalizeLayoutConfig = (cfg?: Partial<LayoutConfig & { showPagination?: boolean }>): LayoutConfig => ({
      paginationType: normalizePaginationType(cfg?.paginationType ?? cfg?.showPagination),
      showSearch: cfg?.showSearch ?? true,
      showCategories: cfg?.showCategories ?? true,
      postsPerPage: cfg?.postsPerPage ?? 12,
    });
    
    const layoutStyle: ListLayoutStyle = raw?.layoutStyle === 'masonry' ? 'sidebar' : (raw?.layoutStyle ?? 'grid');
    const sidebarConfig = raw?.layouts?.sidebar ?? raw?.layouts?.masonry;

    return {
      layoutStyle,
      layouts: {
        grid: normalizeLayoutConfig(raw?.layouts?.grid as Partial<LayoutConfig & { showPagination?: boolean }>),
        sidebar: normalizeLayoutConfig(sidebarConfig as Partial<LayoutConfig & { showPagination?: boolean }>),
        list: normalizeLayoutConfig(raw?.layouts?.list as Partial<LayoutConfig & { showPagination?: boolean }>),
      },
      showWishlistButton: raw?.showWishlistButton ?? true,
      showAddToCartButton: raw?.showAddToCartButton ?? true,
      showBuyNowButton: raw?.showBuyNowButton ?? true,
      showPromotionBadge: raw?.showPromotionBadge ?? true,
      enableQuickAddVariant: raw?.enableQuickAddVariant ?? true,
      hideEmptyCategories: raw?.hideEmptyCategories ?? true,
    };
  }, [experienceSetting?.value]);

  const isLoading = experienceSetting === undefined || productsModule === undefined || wishlistModule === undefined || cartModule === undefined || ordersModule === undefined || promotionsModule === undefined || variantsSetting === undefined;

  const { config, setConfig, hasChanges } = useExperienceConfig(serverConfig, DEFAULT_CONFIG, isLoading);
  const canUseProducts = productsModule?.enabled ?? false;
  const canUseWishlist = wishlistModule?.enabled ?? false;
  const canUseCart = (cartModule?.enabled ?? false) && (ordersModule?.enabled ?? false);
  const canUseOrders = ordersModule?.enabled ?? false;
  const canUsePromotions = promotionsModule?.enabled ?? false;
  const variantsEnabled = (variantsSetting?.value as boolean | undefined) ?? false;
  const canUseQuickAddVariant = canUseCart && variantsEnabled;

  const beforeSaveTransform = (rawConfig: unknown) => {
    const configValue = rawConfig as ProductsListExperienceConfig;
    let next = enforceMultipleToggles(configValue, [
      { key: 'showWishlistButton', enabled: canUseWishlist },
      { key: 'showAddToCartButton', enabled: canUseCart },
      { key: 'showBuyNowButton', enabled: canUseOrders },
      { key: 'showPromotionBadge', enabled: canUsePromotions },
      { key: 'enableQuickAddVariant', enabled: canUseCart && variantsEnabled },
    ]);

    if (!variantsEnabled) {
      next = { ...next, enableQuickAddVariant: false };
    }

    return next;
  };

  const { handleSave, isSaving } = useExperienceSave(
    EXPERIENCE_KEY, 
    config, 
    MESSAGES.saveSuccess(EXPERIENCE_NAMES[EXPERIENCE_KEY]),
    undefined,
    beforeSaveTransform
  );

  useEffect(() => {
    setBrandColor(brandColors.primary);
    setSecondaryColor(brandColors.secondary || '');
    setColorMode(brandColors.mode || 'single');
  }, [brandColors.primary, brandColors.secondary, brandColors.mode]);

  const currentLayoutConfig = config.layouts[config.layoutStyle] ?? DEFAULT_LAYOUT_CONFIG;
  const updateLayoutConfig = <K extends keyof LayoutConfig>(
    key: K,
    value: LayoutConfig[K]
  ) => {
    setConfig(prev => ({
      ...prev,
      layouts: {
        ...prev.layouts,
        [prev.layoutStyle]: {
          ...DEFAULT_LAYOUT_CONFIG,
          ...prev.layouts[prev.layoutStyle],
          [key]: value,
        },
      },
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">{MESSAGES.loading}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5" style={{ color: brandColor }} />
            <h1 className="text-2xl font-bold">Danh sách sản phẩm</h1>
          </div>
          <Link href="/system/experiences" className="text-sm text-blue-600 hover:underline">
            Quay lại danh sách
          </Link>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="gap-1.5"
          style={{ backgroundColor: brandColor }}
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          <span>{hasChanges ? 'Lưu' : 'Đã lưu'}</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thiết lập hiển thị</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ControlCard title="Màu thương hiệu">
            <ColorConfigCard
              primary={brandColor}
              secondary={secondaryColor}
              mode={colorMode}
              onPrimaryChange={setBrandColor}
              onSecondaryChange={setSecondaryColor}
              onModeChange={setColorMode}
            />
          </ControlCard>
          <ControlCard title="Khối hiển thị">
            <ToggleRow
              label="Tìm kiếm"
              checked={currentLayoutConfig.showSearch && canUseProducts}
              onChange={(v) => updateLayoutConfig('showSearch', v)}
              accentColor={brandColor}
              disabled={!canUseProducts}
            />
            <ToggleRow
              label="Buy Now"
              checked={config.showBuyNowButton && canUseOrders}
              onChange={(v) => setConfig(prev => ({ ...prev, showBuyNowButton: v }))}
              accentColor={brandColor}
              disabled={!canUseOrders}
            />
            <ToggleRow
              label="Danh mục"
              checked={currentLayoutConfig.showCategories && canUseProducts}
              onChange={(v) => updateLayoutConfig('showCategories', v)}
              accentColor={brandColor}
              disabled={!canUseProducts}
            />
            <ToggleRow
              label="Ẩn danh mục rỗng"
              description="Ngoài public chỉ hiện danh mục có sản phẩm"
              checked={config.hideEmptyCategories}
              onChange={(v) => setConfig(prev => ({ ...prev, hideEmptyCategories: v }))}
              accentColor={brandColor}
            />
          </ControlCard>

          <ControlCard title="Phân trang">
            <SelectRow
              label="Kiểu"
              value={currentLayoutConfig.paginationType}
              options={[
                { value: 'pagination', label: 'Phân trang' },
                { value: 'infiniteScroll', label: 'Cuộn vô hạn' },
              ]}
              onChange={(v) => updateLayoutConfig('paginationType', v as PaginationType)}
              disabled={!canUseProducts}
            />
            <SelectRow
              label="Bài mỗi trang"
              value={String(currentLayoutConfig.postsPerPage)}
              options={[
                { value: '12', label: '12' },
                { value: '20', label: '20' },
                { value: '24', label: '24' },
                { value: '48', label: '48' },
              ]}
              onChange={(v) => updateLayoutConfig('postsPerPage', Number(v))}
              disabled={!canUseProducts}
            />
          </ControlCard>

          <ControlCard title="Tính năng sản phẩm">
            <ToggleRow
              label="Nút yêu thích"
              description="Hiện nút thêm vào wishlist"
              checked={config.showWishlistButton && canUseWishlist}
              onChange={(v) => setConfig(prev => ({ ...prev, showWishlistButton: v }))}
              accentColor={brandColor}
              disabled={!canUseWishlist}
            />
            <ToggleRow
              label="Nút thêm giỏ hàng"
              description="Hiện nút add to cart"
              checked={config.showAddToCartButton && canUseCart}
              onChange={(v) => setConfig(prev => ({ ...prev, showAddToCartButton: v }))}
              accentColor={brandColor}
              disabled={!canUseCart}
            />
            <ToggleRow
              label="Quick add phiên bản"
              description="Mở modal chọn phiên bản khi thêm giỏ"
              checked={config.enableQuickAddVariant && canUseQuickAddVariant}
              onChange={(v) => setConfig(prev => ({ ...prev, enableQuickAddVariant: v }))}
              accentColor={brandColor}
              disabled={!canUseQuickAddVariant}
            />
            <ToggleRow
              label="Badge khuyến mãi"
              description="Hiện badge giảm giá"
              checked={config.showPromotionBadge && canUsePromotions}
              onChange={(v) => setConfig(prev => ({ ...prev, showPromotionBadge: v }))}
              accentColor={brandColor}
              disabled={!canUsePromotions}
            />
          </ControlCard>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Module & liên kết</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ControlCard title="Module liên quan">
            <ExperienceModuleLink
              enabled={productsModule?.enabled ?? false}
              href="/system/modules/products"
              icon={Package}
              title="Sản phẩm"
              colorScheme="cyan"
            />
            <ModuleFeatureStatus
              label="Phiên bản sản phẩm"
              enabled={(variantsSetting?.value as boolean | undefined) ?? false}
              href="/system/modules/products"
              moduleName="module Sản phẩm"
            />
            <ExperienceModuleLink
              enabled={wishlistModule?.enabled ?? false}
              href="/system/modules/wishlist"
              icon={Heart}
              title="Sản phẩm yêu thích"
              colorScheme="cyan"
            />
            <ModuleFeatureStatus
              label="Wishlist"
              enabled={wishlistModule?.enabled ?? false}
              href="/system/modules/wishlist"
              moduleName="module Wishlist"
            />
            <ExperienceModuleLink
              enabled={cartModule?.enabled ?? false}
              href="/system/modules/cart"
              icon={ShoppingCart}
              title="Giỏ hàng"
              colorScheme="cyan"
            />
            <ModuleFeatureStatus
              label="Giỏ hàng"
              enabled={cartModule?.enabled ?? false}
              href="/system/modules/cart"
              moduleName="module Giỏ hàng"
            />
            <ExperienceModuleLink
              enabled={ordersModule?.enabled ?? false}
              href="/system/modules/orders"
              icon={Package}
              title="Đơn hàng"
              colorScheme="cyan"
            />
            <ModuleFeatureStatus
              label="Đơn hàng"
              enabled={ordersModule?.enabled ?? false}
              href="/system/modules/orders"
              moduleName="module Đơn hàng"
            />
            <ExperienceModuleLink
              enabled={promotionsModule?.enabled ?? false}
              href="/system/modules/promotions"
              icon={Tag}
              title="Khuyến mãi"
              colorScheme="cyan"
            />
            <ModuleFeatureStatus
              label="Khuyến mãi"
              enabled={promotionsModule?.enabled ?? false}
              href="/system/modules/promotions"
              moduleName="module Khuyến mãi"
            />
          </ControlCard>

          <Card className="p-2">
            <div className="mb-2">
              <ExampleLinks
                links={[{ label: 'Trang danh sách', url: '/products' }]}
                color={brandColor}
                compact
              />
            </div>
            <ExperienceHintCard hints={HINTS} />
          </Card>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye size={18} /> Preview
            </CardTitle>
            <div className="flex items-center gap-3">
              <LayoutTabs
                layouts={LAYOUT_STYLES}
                activeLayout={config.layoutStyle}
                onChange={(layout) => setConfig(prev => ({ ...prev, layoutStyle: layout }))}
                accentColor={brandColor}
              />
              <DeviceToggle value={previewDevice} onChange={setPreviewDevice} size="sm" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`mx-auto transition-all duration-300 ${deviceWidths[previewDevice]}`}>
            <BrowserFrame url="yoursite.com/products">
              <ProductsListPreview
                layoutStyle={config.layoutStyle}
                paginationType={currentLayoutConfig.paginationType}
                showSearch={currentLayoutConfig.showSearch}
                showCategories={currentLayoutConfig.showCategories}
                brandColor={brandColor}
                secondaryColor={secondaryColor}
                colorMode={colorMode}
                device={previewDevice}
                showWishlistButton={config.showWishlistButton && (wishlistModule?.enabled ?? false)}
                showAddToCartButton={config.showAddToCartButton && (cartModule?.enabled ?? false) && (ordersModule?.enabled ?? false)}
                showBuyNowButton={config.showBuyNowButton && (ordersModule?.enabled ?? false)}
                showPromotionBadge={config.showPromotionBadge && (promotionsModule?.enabled ?? false)}
              />
            </BrowserFrame>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Style: <strong className="text-slate-700 dark:text-slate-300">{LAYOUT_STYLES.find(s => s.id === config.layoutStyle)?.label}</strong>
            {' • '}{previewDevice === 'desktop' && 'Desktop (1920px)'}{previewDevice === 'tablet' && 'Tablet (768px)'}{previewDevice === 'mobile' && 'Mobile (375px)'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
