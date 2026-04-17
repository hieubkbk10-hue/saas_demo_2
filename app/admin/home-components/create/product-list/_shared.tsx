'use client';

import React, { useMemo, useState } from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { Briefcase, Check, FileText, GripVertical, Package, Search, X } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '../../../components/ui';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { getHomeComponentPriceLabel, resolveSaleMode } from '../../_shared/lib/productPrice';
import { BlogPreview } from '../../blog/_components/BlogPreview';
import type { BlogPostItem } from '../../blog/_components/BlogForm';
import { getBlogValidationResult } from '../../blog/_lib/colors';
import { sortBlogPosts } from '../../blog/_lib/constants';
import type { BlogStyle } from '../../blog/_types';
import { ProductListPreview } from '../../product-list/_components/ProductListPreview';
import type { ProductListPreviewItem, ProductListStyle } from '../../product-list/_types';
import { ServiceListPreview } from '../../service-list/_components/ServiceListPreview';
import { getServiceListValidationResult } from '../../service-list/_lib/colors';
import type {
  ServiceListPreviewItem,
  ServiceListStyle,
} from '../../service-list/_types';

type ComponentType = 'ProductList' | 'ServiceList' | 'Blog';

interface ProductListCreateSharedProps {
  type: ComponentType;
  titleLabel?: string;
}

const DEFAULT_TITLES: Record<ComponentType, string> = {
  Blog: 'Tin tức / Blog',
  ProductList: 'Danh sách Sản phẩm',
  ServiceList: 'Danh sách Dịch vụ'
};

const toIntOrDefault = (value: string, fallback: number) => Number.parseInt(value, 10) || fallback;

export function ProductListCreateShared({ type, titleLabel }: ProductListCreateSharedProps) {
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm(titleLabel ?? DEFAULT_TITLES[type], type);
  const colorOverrideType = type === 'ProductList' ? 'ProductList' : type;
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(colorOverrideType, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(colorOverrideType, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const enableFont = type === 'ProductList' || type === 'ServiceList' || type === 'Blog';
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const [itemCount, setItemCount] = useState(8);
  const [sortBy, setSortBy] = useState(type === 'ProductList' ? 'newest' : 'popular');
  const [blogStyle, setBlogStyle] = useState<BlogStyle>('grid');
  const [productStyle, setProductStyle] = useState<ProductListStyle>('commerce');
  const [serviceStyle, setServiceStyle] = useState<ServiceListStyle>('grid');

  const [subTitle, setSubTitle] = useState('Bộ sưu tập');
  const [sectionTitle, setSectionTitle] = useState('Sản phẩm nổi bật');

  const [selectionMode, setSelectionMode] = useState<'auto' | 'manual'>('auto');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);

  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [postSearchTerm, setPostSearchTerm] = useState('');

  const productsData = useQuery(api.products.listAll, type === 'ProductList' ? { limit: 100 } : 'skip');
  const resolvedProductsData = useQuery(api.products.listPublicResolved, type === 'ProductList' ? { limit: 100 } : 'skip');
  const saleModeSetting = useQuery(api.admin.modules.getModuleSetting, type === 'ProductList' ? { moduleKey: 'products', settingKey: 'saleMode' } : 'skip');
  const saleMode = useMemo(() => resolveSaleMode(saleModeSetting?.value), [saleModeSetting?.value]);
  const servicesData = useQuery(api.services.listAll, type === 'ServiceList' ? { limit: 100 } : 'skip');
  const postsData = useQuery(api.posts.listAll, type === 'Blog' ? { limit: 100 } : 'skip');
  const postCategoriesData = useQuery(api.postCategories.listAll, type === 'Blog' ? { limit: 200 } : 'skip');

  const resolvedProductMap = useMemo(() => new Map(
    (resolvedProductsData ?? []).map((product) => [product._id, product])
  ), [resolvedProductsData]);

  const filteredProducts = useMemo(() => {
    if (!productsData) {return [];}
    return productsData
      .filter(product => product.status === 'Active')
      .filter(product => !productSearchTerm || product.name.toLowerCase().includes(productSearchTerm.toLowerCase()));
  }, [productsData, productSearchTerm]);

  const selectedProducts = useMemo(() => {
    if (!productsData || selectedProductIds.length === 0) {return [];}
    const productMap = new Map(productsData.map((product) => [product._id, product]));
    return selectedProductIds
      .map((id) => productMap.get(id as Id<'products'>))
      .filter((product): product is NonNullable<typeof product> => product !== undefined);
  }, [productsData, selectedProductIds]);

  const productPreviewItems: ProductListPreviewItem[] = useMemo(() => selectedProducts.map((product) => {
    const resolvedProduct = resolvedProductMap.get(product._id as Id<'products'>);
    const priceValue = resolvedProduct?.price ?? product.price;
    const salePriceValue = resolvedProduct?.salePrice ?? product.salePrice;
    const priceDisplay = getHomeComponentPriceLabel({ saleMode, price: priceValue, salePrice: salePriceValue, isRangeFromVariant: resolvedProduct?.hasVariants ?? product.hasVariants });
    const hasBasePrice = priceValue != null || salePriceValue != null;
    return {
      description: product.description,
      id: product._id,
      image: product.image,
      name: product.name,
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
        const priceDisplay = getHomeComponentPriceLabel({ saleMode, price: product.price, salePrice: product.salePrice, isRangeFromVariant: product.hasVariants });
        const hasBasePrice = product.price != null || product.salePrice != null;
        return {
          description: product.description,
          id: product._id,
          image: product.image,
          name: product.name,
          price: !hasBasePrice && saleMode === 'cart' ? undefined : priceDisplay.label,
          originalPrice: priceDisplay.comparePrice
            ? getHomeComponentPriceLabel({ saleMode: 'cart', price: priceDisplay.comparePrice }).label
            : undefined,
        };
      });
  }, [productsData, resolvedProductsData, itemCount, saleMode]);

  const filteredServices = useMemo(() => {
    if (!servicesData) {return [];}
    return servicesData
      .filter(service => service.status === 'Published')
      .filter(service => !serviceSearchTerm || service.title.toLowerCase().includes(serviceSearchTerm.toLowerCase()));
  }, [servicesData, serviceSearchTerm]);

  const selectedServices = useMemo(() => {
    if (!servicesData || selectedServiceIds.length === 0) {return [];}
    const serviceMap = new Map(servicesData.map((service) => [service._id, service]));
    return selectedServiceIds
      .map((id) => serviceMap.get(id as Id<'services'>))
      .filter((service): service is NonNullable<typeof service> => service !== undefined);
  }, [servicesData, selectedServiceIds]);

  const servicePreviewItems: ServiceListPreviewItem[] = useMemo(() => selectedServices.map((service, idx) => ({
    description: service.excerpt,
    id: service._id,
    image: service.thumbnail,
    name: service.title,
    price: service.price?.toString(),
    tag: idx === 0 ? 'hot' : (idx === 1 ? 'new' : undefined),
  })), [selectedServices]);

  const autoServicePreviewItems: ServiceListPreviewItem[] = useMemo(() => {
    if (!servicesData) {return [];}
    return servicesData
      .filter(service => service.status === 'Published')
      .slice(0, itemCount)
      .map((service, idx) => ({
        description: service.excerpt,
        id: service._id,
        image: service.thumbnail,
        name: service.title,
        price: service.price?.toString(),
        tag: idx === 0 ? 'hot' : (idx === 1 ? 'new' : undefined),
      }));
  }, [servicesData, itemCount]);

  const filteredPosts = useMemo(() => {
    if (!postsData) {return [];}
    return postsData
      .filter(post => post.status === 'Published')
      .filter(post => !postSearchTerm || post.title.toLowerCase().includes(postSearchTerm.toLowerCase()));
  }, [postsData, postSearchTerm]);

  const selectedPosts = useMemo(() => {
    if (!postsData || selectedPostIds.length === 0) {return [];}
    const postMap = new Map(postsData.map((post) => [post._id, post]));
    return selectedPostIds
      .map((id) => postMap.get(id as Id<'posts'>))
      .filter((post): post is NonNullable<typeof post> => post !== undefined);
  }, [postsData, selectedPostIds]);

  const previewPosts = useMemo(() => {
    if (type !== 'Blog' || !postsData) {return undefined;}

    const published = postsData.filter((post) => post.status === 'Published');

    if (selectionMode === 'manual') {
      if (selectedPostIds.length === 0) {return [];}
      const postMap = new Map(published.map((post) => [post._id, post]));
      return selectedPostIds
        .map((postId) => postMap.get(postId as Id<'posts'>))
        .filter((post): post is Doc<'posts'> => post !== undefined);
    }

    const sorted = sortBlogPosts(published, sortBy as 'newest' | 'popular' | 'random', title);

    return sorted.slice(0, itemCount);
  }, [itemCount, postsData, selectedPostIds, selectionMode, sortBy, title, type]);

  const blogCategoryMap = useMemo(() => {
    if (type !== 'Blog' || !postCategoriesData) {return undefined;}
    const map: Record<string, string> = {};
    postCategoriesData.forEach((category) => {
      map[category._id] = category.name;
    });
    return map;
  }, [postCategoriesData, type]);

  const serviceWarnings = useMemo(() => {
    if (type !== 'ServiceList') {return [] as string[];}

    const validation = getServiceListValidationResult({
      primary,
      secondary,
      mode,
    });

    const warnings: string[] = [];
    if (mode === 'dual' && validation.harmonyStatus.isTooSimilar) {
      warnings.push(`Màu chính và màu phụ đang khá gần nhau (ΔE=${validation.harmonyStatus.deltaE}).`);
    }
    if (validation.accessibility.failing.length > 0) {
      warnings.push(`Có ${validation.accessibility.failing.length} cặp màu chưa đạt APCA (minLc=${validation.accessibility.minLc.toFixed(1)}).`);
    }

    return warnings;
  }, [mode, primary, secondary, type]);

  const blogWarnings = useMemo(() => {
    if (type !== 'Blog' || mode === 'single') {return [] as string[];}

    const validation = getBlogValidationResult({
      primary,
      secondary,
      mode,
    });

    const warnings: string[] = [];
    if (validation.harmonyStatus.isTooSimilar) {
      warnings.push(`Độ tương phản thương hiệu thấp (ΔE=${validation.harmonyStatus.deltaE}).`);
    }
    if (validation.accessibility.failing.length > 0) {
      warnings.push(`Có ${validation.accessibility.failing.length} cặp màu chưa đạt APCA (minLc=${validation.accessibility.minLc.toFixed(1)}).`);
    }

    return warnings;
  }, [mode, primary, secondary, type]);

  const typedBlogPreviewPosts = previewPosts as BlogPostItem[] | undefined;

  const onSubmit = (e: React.FormEvent) => {
    const config: Record<string, unknown> = {
      itemCount,
      sortBy,
      style: type === 'Blog' ? blogStyle : (type === 'ServiceList' ? serviceStyle : productStyle),
      selectionMode,
    };

    if (type === 'ProductList') {
      config.subTitle = subTitle;
      config.sectionTitle = sectionTitle;
    }

    if (selectionMode === 'manual') {
      if (type === 'ProductList') {
        config.selectedProductIds = selectedProductIds;
      } else if (type === 'ServiceList') {
        config.selectedServiceIds = selectedServiceIds;
      } else if (type === 'Blog') {
        config.selectedPostIds = selectedPostIds;
      }
    }

    void handleSubmit(e, config);
  };

  return (
    <ComponentFormWrapper
      type={type}
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
      customFontState={enableFont ? customFontState : undefined}
      showFontCustomBlock={enableFont ? showFontCustomBlock : false}
      setCustomFontState={enableFont ? setCustomFontState : undefined}
    >
      {type === 'ProductList' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Cấu hình hiển thị</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tiêu đề phụ (badge)</Label>
                <Input
                  value={subTitle}
                  onChange={(e) =>{  setSubTitle(e.target.value); }}
                  placeholder="VD: Bộ sưu tập, Sản phẩm hot..."
                />
              </div>
              <div className="space-y-2">
                <Label>Tiêu đề chính</Label>
                <Input
                  value={sectionTitle}
                  onChange={(e) =>{  setSectionTitle(e.target.value); }}
                  placeholder="VD: Sản phẩm nổi bật, Bán chạy nhất..."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Nguồn dữ liệu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>
              Chế độ chọn{' '}
              {type === 'ProductList' ? 'sản phẩm' : (type === 'ServiceList' ? 'dịch vụ' : 'bài viết')}
            </Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>{  setSelectionMode('auto'); }}
                className={cn(
                  'flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all',
                  selectionMode === 'auto'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                )}
              >
                Tự động
              </button>
              <button
                type="button"
                onClick={() =>{  setSelectionMode('manual'); }}
                className={cn(
                  'flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all',
                  selectionMode === 'manual'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                )}
              >
                Chọn thủ công
              </button>
            </div>
            <p className="text-xs text-slate-500">
              {selectionMode === 'auto'
                ? `Hiển thị ${type === 'ProductList' ? 'sản phẩm' : (type === 'ServiceList' ? 'dịch vụ' : 'bài viết')} tự động theo số lượng và sắp xếp`
                : `Chọn từng ${type === 'ProductList' ? 'sản phẩm' : (type === 'ServiceList' ? 'dịch vụ' : 'bài viết')} cụ thể để hiển thị`}
            </p>
          </div>

          {selectionMode === 'auto' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Số lượng hiển thị</Label>
                <Input
                  type="number"
                  value={itemCount}
                  onChange={(e) =>{  setItemCount(toIntOrDefault(e.target.value, 8)); }}
                />
              </div>
              <div className="space-y-2">
                <Label>Sắp xếp theo</Label>
                <select
                  className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  value={sortBy}
                  onChange={(e) =>{  setSortBy(e.target.value); }}
                >
                  <option value="newest">Mới nhất</option>
                  {type === 'ProductList' && <option value="bestseller">Bán chạy nhất</option>}
                  {type !== 'ProductList' && <option value="popular">Xem nhiều nhất</option>}
                  <option value="random">Ngẫu nhiên</option>
                </select>
              </div>
            </div>
          )}

          {/* Manual Selection - ProductList */}
          {selectionMode === 'manual' && type === 'ProductList' && (
            <div className="space-y-4">
              {selectedProducts.length > 0 && (
                <div className="space-y-2">
                  <Label>Sản phẩm đã chọn ({selectedProducts.length})</Label>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {selectedProducts.map((product, index) => (
                      <div key={product._id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg group">
                        <div className="text-slate-400 cursor-move"><GripVertical size={16} /></div>
                        <span className="w-6 h-6 flex items-center justify-center bg-blue-500 text-white text-xs rounded-full font-medium">{index + 1}</span>
                        {product.image ? (
                          <Image src={product.image} alt="" width={48} height={48} className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center"><Package size={16} className="text-slate-400" /></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <p className="text-xs text-slate-500">{product.price?.toLocaleString('vi-VN')}đ</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-500"
                          onClick={() =>{  setSelectedProductIds(ids => ids.filter(id => id !== product._id)); }}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Thêm sản phẩm</Label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Tìm kiếm sản phẩm..."
                    className="pl-9"
                    value={productSearchTerm}
                    onChange={(e) =>{  setProductSearchTerm(e.target.value); }}
                  />
                </div>
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg max-h-[250px] overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">
                      {productsData === undefined ? 'Đang tải...' : 'Không tìm thấy sản phẩm'}
                    </div>
                  ) : (
                    filteredProducts.map((product) => {
                      const isSelected = selectedProductIds.includes(product._id);
                      return (
                        <div
                          key={product._id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedProductIds(ids => ids.filter(id => id !== product._id));
                            } else {
                              setSelectedProductIds(ids => [...ids, product._id]);
                            }
                          }}
                          className={cn(
                            'flex items-center gap-3 p-3 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors',
                            isSelected ? 'bg-blue-50 dark:bg-blue-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                          )}
                        >
                          <div className={cn(
                            'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                            isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-300 dark:border-slate-600'
                          )}>
                            {isSelected && <Check size={12} className="text-white" />}
                          </div>
                          {product.image ? (
                            <Image src={product.image} alt="" width={40} height={40} className="w-10 h-10 object-cover rounded" />
                          ) : (
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center"><Package size={14} className="text-slate-400" /></div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{product.name}</p>
                            <p className="text-xs text-slate-500">{product.price?.toLocaleString('vi-VN')}đ</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Manual Selection - ServiceList */}
          {selectionMode === 'manual' && type === 'ServiceList' && (
            <div className="space-y-4">
              {selectedServices.length > 0 && (
                <div className="space-y-2">
                  <Label>Dịch vụ đã chọn ({selectedServices.length})</Label>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {selectedServices.map((service, index) => (
                      <div key={service._id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg group">
                        <div className="text-slate-400 cursor-move"><GripVertical size={16} /></div>
                        <span className="w-6 h-6 flex items-center justify-center bg-blue-500 text-white text-xs rounded-full font-medium">{index + 1}</span>
                        {service.thumbnail ? (
                          <Image src={service.thumbnail} alt="" width={48} height={48} className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center"><Briefcase size={16} className="text-slate-400" /></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{service.title}</p>
                          <p className="text-xs text-slate-500">{service.views} lượt xem</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-500"
                          onClick={() =>{  setSelectedServiceIds(ids => ids.filter(id => id !== service._id)); }}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Thêm dịch vụ</Label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Tìm kiếm dịch vụ..."
                    className="pl-9"
                    value={serviceSearchTerm}
                    onChange={(e) =>{  setServiceSearchTerm(e.target.value); }}
                  />
                </div>
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg max-h-[250px] overflow-y-auto">
                  {filteredServices.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">
                      {servicesData === undefined ? 'Đang tải...' : 'Không tìm thấy dịch vụ'}
                    </div>
                  ) : (
                    filteredServices.map((service) => {
                      const isSelected = selectedServiceIds.includes(service._id);
                      return (
                        <div
                          key={service._id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedServiceIds(ids => ids.filter(id => id !== service._id));
                            } else {
                              setSelectedServiceIds(ids => [...ids, service._id]);
                            }
                          }}
                          className={cn(
                            'flex items-center gap-3 p-3 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors',
                            isSelected ? 'bg-blue-50 dark:bg-blue-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                          )}
                        >
                          <div className={cn(
                            'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                            isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-300 dark:border-slate-600'
                          )}>
                            {isSelected && <Check size={12} className="text-white" />}
                          </div>
                          {service.thumbnail ? (
                            <Image src={service.thumbnail} alt="" width={40} height={40} className="w-10 h-10 object-cover rounded" />
                          ) : (
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center"><Briefcase size={14} className="text-slate-400" /></div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{service.title}</p>
                            <p className="text-xs text-slate-500">{service.views} lượt xem</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Manual Selection - Blog */}
          {selectionMode === 'manual' && type === 'Blog' && (
            <div className="space-y-4">
              {selectedPosts.length > 0 && (
                <div className="space-y-2">
                  <Label>Bài viết đã chọn ({selectedPosts.length})</Label>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {selectedPosts.map((post, index) => (
                      <div key={post._id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg group">
                        <div className="text-slate-400 cursor-move"><GripVertical size={16} /></div>
                        <span className="w-6 h-6 flex items-center justify-center bg-blue-500 text-white text-xs rounded-full font-medium">{index + 1}</span>
                        {post.thumbnail ? (
                          <Image src={post.thumbnail} alt="" width={48} height={48} className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center"><FileText size={16} className="text-slate-400" /></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{post.title}</p>
                          <p className="text-xs text-slate-500">{post.views} lượt xem</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-500"
                          onClick={() =>{  setSelectedPostIds(ids => ids.filter(id => id !== post._id)); }}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Thêm bài viết</Label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Tìm kiếm bài viết..."
                    className="pl-9"
                    value={postSearchTerm}
                    onChange={(e) =>{  setPostSearchTerm(e.target.value); }}
                  />
                </div>
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg max-h-[250px] overflow-y-auto">
                  {filteredPosts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">
                      {postsData === undefined ? 'Đang tải...' : 'Không tìm thấy bài viết'}
                    </div>
                  ) : (
                    filteredPosts.map((post) => {
                      const isSelected = selectedPostIds.includes(post._id);
                      return (
                        <div
                          key={post._id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedPostIds(ids => ids.filter(id => id !== post._id));
                            } else {
                              setSelectedPostIds(ids => [...ids, post._id]);
                            }
                          }}
                          className={cn(
                            'flex items-center gap-3 p-3 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors',
                            isSelected ? 'bg-blue-50 dark:bg-blue-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                          )}
                        >
                          <div className={cn(
                            'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                            isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-300 dark:border-slate-600'
                          )}>
                            {isSelected && <Check size={12} className="text-white" />}
                          </div>
                          {post.thumbnail ? (
                            <Image src={post.thumbnail} alt="" width={40} height={40} className="w-10 h-10 object-cover rounded" />
                          ) : (
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center"><FileText size={14} className="text-slate-400" /></div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{post.title}</p>
                            <p className="text-xs text-slate-500">{post.views} lượt xem</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {type === 'Blog' ? (
        <div className="space-y-3">
          <BlogPreview
            brandColor={primary}
            secondary={secondary}
            mode={mode}
            postCount={selectionMode === 'manual' ? selectedPostIds.length : itemCount}
            selectedStyle={blogStyle}
            onStyleChange={setBlogStyle}
            title={title}
            previewItems={typedBlogPreviewPosts}
            categoryMap={blogCategoryMap}
            fontStyle={fontStyle}
            fontClassName="font-active"
          />
          {blogWarnings.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <ul className="list-disc pl-4 space-y-1">
                {blogWarnings.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (type === 'ServiceList' ? (
        <div className="space-y-3">
          <ServiceListPreview
            brandColor={primary}
            secondary={secondary}
            mode={mode}
            itemCount={selectionMode === 'manual' ? selectedServiceIds.length : itemCount}
            selectedStyle={serviceStyle}
            onStyleChange={setServiceStyle}
            items={selectionMode === 'manual' && servicePreviewItems.length > 0 ? servicePreviewItems : (autoServicePreviewItems.length > 0 ? autoServicePreviewItems : undefined)}
            title={title}
          />
          {serviceWarnings.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <ul className="list-disc pl-4 space-y-1">
                {serviceWarnings.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <ProductListPreview
          brandColor={primary}
          secondary={secondary}
          itemCount={selectionMode === 'manual' ? selectedProductIds.length : itemCount}
          componentType="ProductList"
          selectedStyle={productStyle}
          onStyleChange={setProductStyle}
          items={selectionMode === 'manual' && productPreviewItems.length > 0 ? productPreviewItems : (autoProductPreviewItems.length > 0 ? autoProductPreviewItems : undefined)}
          subTitle={subTitle}
          sectionTitle={sectionTitle}
          fontStyle={fontStyle}
          fontClassName="font-active"
        />
      ))}
    </ComponentFormWrapper>
  );
}

