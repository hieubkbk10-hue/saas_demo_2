'use client';

import React, { use, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Check, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminMutationErrorMessage } from '@/app/admin/lib/mutation-error';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '../../../components/ui';
import { LexicalEditor } from '../../../components/LexicalEditor';
import { ImageUpload } from '../../../components/ImageUpload';
import type { ImageItem } from '../../../components/MultiImageUploader';
import { MultiImageUploader } from '../../../components/MultiImageUploader';
import { ModuleGuard } from '../../../components/ModuleGuard';
import { DigitalCredentialsForm } from '@/components/orders/DigitalCredentialsForm';
import { stripHtml, truncateText } from '@/lib/seo';
import { ProductCategoryCombobox } from '@/app/admin/products/components/ProductCategoryCombobox';
import { QuickCreateCategoryModal } from '@/app/admin/products/components/QuickCreateCategoryModal';
import { normalizeRichText } from '@/app/admin/lib/normalize-rich-text';
import { resolveProductImageAspectRatio } from '@/lib/products/image-aspect-ratio';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';

const MODULE_KEY = 'products';

export default function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <ModuleGuard moduleKey="products">
      <ProductEditContent params={params} />
    </ModuleGuard>
  );
}

function ProductEditContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const productData = useQuery(api.products.getById, { id: id as Id<"products"> });
  const categoriesData = useQuery(api.productCategories.listActive);
  const updateProduct = useMutation(api.products.update);
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: MODULE_KEY });
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: MODULE_KEY });
  const optionsData = useQuery(api.productOptions.listActive);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stock, setStock] = useState('0');
  const [affiliateLink, setAffiliateLink] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [renderType, setRenderType] = useState<'content' | 'markdown' | 'html'>('content');
  const [markdownRender, setMarkdownRender] = useState('');
  const [htmlRender, setHtmlRender] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [image, setImage] = useState<string | undefined>();
  const [imageStorageId, setImageStorageId] = useState<Id<'_storage'> | undefined>();
  const [galleryItems, setGalleryItems] = useState<ImageItem[]>([]);
  const [status, setStatus] = useState<'Draft' | 'Active' | 'Archived'>('Draft');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('saved');
  const [editorResetKey] = useState(0);
  const [snapshotVersion, setSnapshotVersion] = useState(0);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [hasVariants, setHasVariants] = useState(false);
  const [selectedOptionIds, setSelectedOptionIds] = useState<Id<'productOptions'>[]>([]);
  const [productType, setProductType] = useState<'physical' | 'digital'>('physical');
  const [digitalDeliveryType, setDigitalDeliveryType] = useState<'account' | 'license' | 'download' | 'custom'>('account');
  const [isNameCopied, setIsNameCopied] = useState(false);
  const [digitalCredentialsTemplate, setDigitalCredentialsTemplate] = useState<{
    username?: string;
    password?: string;
    licenseKey?: string;
    downloadUrl?: string;
    customContent?: string;
    expiresAt?: number;
  }>({});
  const initialSnapshotRef = useRef<{
    affiliateLink: string;
    categoryId: string;
    description: string;
    renderType: 'content' | 'markdown' | 'html';
    markdownRender: string;
    htmlRender: string;
    digitalCredentialsTemplate: {
      username?: string;
      password?: string;
      licenseKey?: string;
      downloadUrl?: string;
      customContent?: string;
      expiresAt?: number;
    };
    digitalDeliveryType: 'account' | 'license' | 'download' | 'custom';
    galleryImages: string[];
    hasVariants: boolean;
    image: string;
    imageStorageId?: Id<'_storage'>;
    metaDescription: string;
    metaTitle: string;
    name: string;
    price: string;
    productType: 'physical' | 'digital';
    salePrice: string;
    selectedOptionIds: Id<'productOptions'>[];
    sku: string;
    slug: string;
    status: 'Draft' | 'Active' | 'Archived';
    stock: string;
  } | null>(null);

  const enabledFields = useMemo(() => {
    const fields = new Set<string>();
    fieldsData?.forEach(f => fields.add(f.fieldKey));
    return fields;
  }, [fieldsData]);

  const hasMarkdownRender = enabledFields.has('markdownRender');
  const hasHtmlRender = enabledFields.has('htmlRender');
  const showAdvancedRenderCard = hasMarkdownRender || hasHtmlRender;

  const variantEnabled = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'variantEnabled');
    return Boolean(setting?.value);
  }, [settingsData]);

  const variantPricing = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'variantPricing');
    return (setting?.value as string) || 'variant';
  }, [settingsData]);

  const productTypeMode = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'productTypeMode');
    const value = setting?.value as 'physical' | 'digital' | 'both' | undefined;
    return value ?? 'both';
  }, [settingsData]);

  const digitalEnabled = productTypeMode !== 'physical';

  const saleMode = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'saleMode');
    const value = setting?.value;
    if (value === 'contact' || value === 'affiliate') {
      return value;
    }
    return 'cart';
  }, [settingsData]);

  const enableImageCrop = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'enableImageCrop');
    return Boolean(setting?.value);
  }, [settingsData]);
  const defaultImageAspectRatio = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'defaultImageAspectRatio');
    return resolveProductImageAspectRatio(setting?.value);
  }, [settingsData]);

  const isAffiliateMode = saleMode === 'affiliate';
  const isPriceRequired = saleMode === 'cart';
  const showProductTypeSelector = productTypeMode === 'both';
  const hideBasePricing = variantEnabled && variantPricing === 'variant';

  const normalizedDescription = useMemo(() => normalizeRichText(description), [description]);

  const currentSnapshot = useMemo(() => ({
    affiliateLink: affiliateLink.trim(),
    categoryId,
    description: normalizedDescription,
    renderType,
    markdownRender: markdownRender.trim(),
    htmlRender: htmlRender.trim(),
    digitalCredentialsTemplate: digitalCredentialsTemplate ?? {},
    digitalDeliveryType,
    galleryImages: galleryItems.map(item => item.url).filter(Boolean),
    hasVariants,
    image: image ?? '',
    imageStorageId,
    metaDescription: metaDescription.trim(),
    metaTitle: metaTitle.trim(),
    name: name.trim(),
    price: price.trim(),
    productType,
    salePrice: salePrice.trim(),
    selectedOptionIds: [...selectedOptionIds].sort(),
    sku: sku.trim(),
    slug: slug.trim(),
    status,
    stock: stock.trim(),
  }), [
    affiliateLink,
    categoryId,
    normalizedDescription,
    renderType,
    markdownRender,
    htmlRender,
    digitalCredentialsTemplate,
    digitalDeliveryType,
    galleryItems,
    hasVariants,
    image,
    imageStorageId,
    metaDescription,
    metaTitle,
    name,
    price,
    productType,
    salePrice,
    selectedOptionIds,
    sku,
    slug,
    status,
    stock,
  ]);

  const hasChanges = useMemo(() => {
    if (!initialSnapshotRef.current) {return false;}
    return JSON.stringify(initialSnapshotRef.current) !== JSON.stringify(currentSnapshot);
  }, [currentSnapshot, snapshotVersion]);

  useEffect(() => {
    if (saveStatus === 'saving') {return;}
    if (hasChanges && saveStatus === 'saved') {
      setSaveStatus('idle');
      return;
    }
    if (!hasChanges && saveStatus === 'idle') {
      setSaveStatus('saved');
    }
  }, [hasChanges, saveStatus]);

  useEffect(() => {
    if (productData && !isDataLoaded) {
      setName(productData.name);
      setSlug(productData.slug);
      setSku(productData.sku);
      setPrice(productData.price.toString());
      setSalePrice(productData.salePrice?.toString() ?? '');
      setStock(productData.stock.toString());
      setAffiliateLink(((productData as { affiliateLink?: string }).affiliateLink ?? '').toString());
      setCategoryId(productData.categoryId);
      setDescription(productData.description ?? '');
      const nextRenderType = productData.renderType ?? 'content';
      const allowedRenderTypes = new Set<'content' | 'markdown' | 'html'>(['content']);
      if (hasMarkdownRender) {allowedRenderTypes.add('markdown');}
      if (hasHtmlRender) {allowedRenderTypes.add('html');}
      setRenderType(allowedRenderTypes.has(nextRenderType) ? nextRenderType : 'content');
      setMarkdownRender(productData.markdownRender ?? '');
      setHtmlRender(productData.htmlRender ?? '');
      setMetaTitle(productData.metaTitle ?? '');
      setMetaDescription(productData.metaDescription ?? '');
      setImage(productData.image);
      setImageStorageId((productData as { imageStorageId?: Id<'_storage'> }).imageStorageId);
      const galleryStorageIds = (productData as { imageStorageIds?: (Id<'_storage'> | null)[] }).imageStorageIds ?? [];
      setGalleryItems((productData.images ?? []).map((url, index) => ({
        id: `${productData._id}-img-${index}`,
        url,
        storageId: galleryStorageIds[index] ?? undefined,
      })));
      setStatus(productData.status);
      setHasVariants(productData.hasVariants ?? false);
      setSelectedOptionIds(productData.optionIds ?? []);
      setProductType(productData.productType ?? 'physical');
      setDigitalDeliveryType(productData.digitalDeliveryType ?? 'account');
      setDigitalCredentialsTemplate(productData.digitalCredentialsTemplate ?? {});
      initialSnapshotRef.current = {
        affiliateLink: ((productData as { affiliateLink?: string }).affiliateLink ?? '').trim(),
        categoryId: productData.categoryId,
        description: normalizeRichText(productData.description ?? ''),
        renderType: productData.renderType ?? 'content',
        markdownRender: (productData.markdownRender ?? '').trim(),
        htmlRender: (productData.htmlRender ?? '').trim(),
        digitalCredentialsTemplate: productData.digitalCredentialsTemplate ?? {},
        digitalDeliveryType: productData.digitalDeliveryType ?? 'account',
        galleryImages: (productData.images ?? []).filter(Boolean),
        hasVariants: productData.hasVariants ?? false,
        image: productData.image ?? '',
        imageStorageId: (productData as { imageStorageId?: Id<'_storage'> }).imageStorageId,
        metaDescription: (productData.metaDescription ?? '').trim(),
        metaTitle: (productData.metaTitle ?? '').trim(),
        name: productData.name.trim(),
        price: productData.price.toString(),
        productType: productData.productType ?? 'physical',
        salePrice: productData.salePrice?.toString() ?? '',
        selectedOptionIds: [...(productData.optionIds ?? [])].sort(),
        sku: productData.sku.trim(),
        slug: productData.slug.trim(),
        status: productData.status,
        stock: productData.stock.toString(),
      };
      setSnapshotVersion((prev) => prev + 1);
      setIsDataLoaded(true);
    }
  }, [productData, isDataLoaded, hasMarkdownRender, hasHtmlRender]);

  useEffect(() => {
    const allowedRenderTypes = new Set<'content' | 'markdown' | 'html'>(['content']);
    if (hasMarkdownRender) {allowedRenderTypes.add('markdown');}
    if (hasHtmlRender) {allowedRenderTypes.add('html');}
    if (!allowedRenderTypes.has(renderType)) {
      setRenderType('content');
    }
  }, [renderType, hasMarkdownRender, hasHtmlRender]);

  useEffect(() => {
    if (!hasVariants) {
      setSelectedOptionIds([]);
    }
  }, [hasVariants]);

  useEffect(() => {
    if (productTypeMode === 'physical' || productTypeMode === 'digital') {
      setProductType(productTypeMode);
    }
  }, [productTypeMode]);

  useEffect(() => {
    if (!isAffiliateMode) {
      setAffiliateLink('');
    }
  }, [isAffiliateMode]);

  const resolveSalePrice = (value: string) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return null;
    }
    const parsedValue = Number.parseInt(trimmedValue);
    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      return null;
    }
    return parsedValue;
  };

  const formatNumberHelper = (value: string) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return '';
    }
    const parsedValue = Number.parseInt(trimmedValue);
    if (!Number.isFinite(parsedValue)) {
      return '';
    }
    return new Intl.NumberFormat('en-US').format(parsedValue);
  };

  const priceHelper = formatNumberHelper(price);
  const salePriceHelper = formatNumberHelper(salePrice);

  const handleCopyName = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {return;}
    try {
      await navigator.clipboard.writeText(trimmedName);
      setIsNameCopied(true);
      toast.success('Đã copy tên sản phẩm');
      setTimeout(() =>{  setIsNameCopied(false); }, 2000);
    } catch {
      toast.error('Không thể copy, vui lòng copy thủ công');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !categoryId || (!hideBasePricing && isPriceRequired && (!price || Number(price) <= 0))) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    if (enabledFields.has('sku') && !sku.trim()) {
      toast.error('Vui lòng nhập mã SKU');
      return;
    }
    if (isAffiliateMode && !affiliateLink.trim()) {
      toast.error('Vui lòng nhập link affiliate cho sản phẩm');
      return;
    }
    if (variantEnabled && hasVariants && selectedOptionIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một tùy chọn cho phiên bản');
      return;
    }
    if (!hideBasePricing && salePrice.trim() !== '') {
      const parsedSalePrice = resolveSalePrice(salePrice);
      if (parsedSalePrice) {
        const parsedPrice = parseInt(price) || 0;
        if (parsedPrice <= 0 || parsedSalePrice <= parsedPrice) {
          toast.error('Giá so sánh phải lớn hơn giá bán');
          return;
        }
      }
    }

    setIsSubmitting(true);
    setSaveStatus('saving');
    try {
      const resolvedStock = productType === 'digital' ? 0 : (parseInt(stock) || 0);
      const resolvedMetaTitle = truncateText(name.trim(), 60);
      const resolvedMetaDescription = truncateText(stripHtml(description || ''), 160);
      const resolvedGalleryItems = galleryItems
        .map(item => ({ url: item.url, storageId: item.storageId }))
        .filter(item => Boolean(item.url));
      const resolvedImages = resolvedGalleryItems.map(item => item.url);
      const resolvedImageStorageIds = resolvedGalleryItems.map(item => item.storageId ?? null);
      const resolvedSalePrice = hideBasePricing ? undefined : resolveSalePrice(salePrice);
      const resolvedMetaTitleValue = enabledFields.has('metaTitle')
        ? (metaTitle.trim() || resolvedMetaTitle || '')
        : metaTitle.trim();
      const resolvedMetaDescriptionValue = enabledFields.has('metaDescription')
        ? (metaDescription.trim() || resolvedMetaDescription || '')
        : metaDescription.trim();
      await updateProduct({
        ...(isAffiliateMode ? { affiliateLink: affiliateLink.trim() || undefined } : {}),
        categoryId: categoryId as Id<"productCategories">,
        description: description.trim() || undefined,
        renderType,
        markdownRender: markdownRender.trim() || undefined,
        htmlRender: htmlRender.trim() || undefined,
        id: id as Id<"products">,
        hasVariants: variantEnabled ? hasVariants : undefined,
        image,
        imageStorageId: image ? (imageStorageId ?? null) : null,
        images: enabledFields.has('images') ? resolvedImages : undefined,
        imageStorageIds: enabledFields.has('images') ? resolvedImageStorageIds : undefined,
        metaDescription: enabledFields.has('metaDescription')
          ? (resolvedMetaDescriptionValue || undefined)
          : undefined,
        metaTitle: enabledFields.has('metaTitle')
          ? (resolvedMetaTitleValue || undefined)
          : undefined,
        name: name.trim(),
        optionIds: variantEnabled ? (hasVariants ? selectedOptionIds : []) : undefined,
        price: hideBasePricing ? 0 : (parseInt(price) || 0),
        salePrice: resolvedSalePrice,
        sku: (sku.trim() || productData?.sku) ?? `SKU-${Date.now()}`,
        slug: slug.trim(),
        status,
        stock: resolvedStock,
        productType: digitalEnabled ? productType : undefined,
        digitalDeliveryType: digitalEnabled && productType === 'digital' ? digitalDeliveryType : undefined,
        digitalCredentialsTemplate: digitalEnabled && productType === 'digital' && Object.keys(digitalCredentialsTemplate).length > 0
          ? digitalCredentialsTemplate
          : undefined,
      });
      const persistedSnapshot = {
        ...currentSnapshot,
        description: normalizeRichText(description.trim()),
        renderType,
        markdownRender: markdownRender.trim(),
        htmlRender: htmlRender.trim(),
        metaDescription: resolvedMetaDescriptionValue,
        metaTitle: resolvedMetaTitleValue,
      };
      if (enabledFields.has('metaTitle')) {
        setMetaTitle(resolvedMetaTitleValue);
      }
      if (enabledFields.has('metaDescription')) {
        setMetaDescription(resolvedMetaDescriptionValue);
      }
      initialSnapshotRef.current = persistedSnapshot;
      setSnapshotVersion((prev) => prev + 1);
      setSaveStatus('saved');
      toast.success("Cập nhật sản phẩm thành công");
    } catch (error) {
      toast.error(getAdminMutationErrorMessage(error, 'Không thể cập nhật sản phẩm'));
      setSaveStatus('idle');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (productData === undefined || fieldsData === undefined || settingsData === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-orange-500" />
      </div>
    );
  }

  if (productData === null) {
    return (
      <div className="text-center py-8 text-slate-500">
        Không tìm thấy sản phẩm
      </div>
    );
  }

  return (
    <>
      <QuickCreateCategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onCreated={(createdId) => setCategoryId(createdId)}
      />
    <form onSubmit={handleSubmit} className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa sản phẩm</h1>
          <Link href="/admin/products" className="text-sm text-orange-600 hover:underline">Quay lại danh sách</Link>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.open(`/products/${slug}`, '_blank')}
            className="gap-2"
          >
            <ExternalLink size={16} />
            Xem trên web
          </Button>
          {variantEnabled && hasVariants && (
            <Link href={`/admin/products/${id}/variants`}>
              <Button variant="outline">Quản lý phiên bản</Button>
            </Link>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Thông tin cơ bản</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tên sản phẩm <span className="text-red-500">*</span></Label>
                <div className="flex gap-2">
                  <Input value={name} onChange={(e) => {
                    const val = e.target.value;
                    setName(val);
                    const generatedSlug = val.toLowerCase()
                      .normalize("NFD").replaceAll(/[\u0300-\u036F]/g, "")
                      .replaceAll(/[đĐ]/g, "d")
                      .replaceAll(/[^a-z0-9\s]/g, '')
                      .replaceAll(/\s+/g, '-');
                    setSlug(generatedSlug);
                  }} required placeholder="Nhập tên sản phẩm..." autoFocus />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={handleCopyName}
                    disabled={!name.trim()}
                    title="Copy tên sản phẩm"
                    aria-label="Copy tên sản phẩm"
                  >
                    {isNameCopied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                  </Button>
                </div>
              </div>
              <div className={enabledFields.has('sku') ? "grid grid-cols-2 gap-4" : ""}>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input value={slug} onChange={(e) =>{  setSlug(e.target.value); }} placeholder="slug" className="font-mono text-sm" />
                </div>
                {enabledFields.has('sku') && (
                  <div className="space-y-2">
                    <Label>Mã SKU <span className="text-red-500">*</span></Label>
                    <Input value={sku} onChange={(e) =>{  setSku(e.target.value); }} required placeholder="VD: PROD-001" className="font-mono" />
                  </div>
                )}
              </div>
              {enabledFields.has('description') && (
                <div className="space-y-2">
                  <Label>Mô tả sản phẩm</Label>
                  {isDataLoaded && (
                    <LexicalEditor 
                      onChange={setDescription} 
                      initialContent={description}
                      resetKey={editorResetKey}
                      folder="products-content"
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {showAdvancedRenderCard && (
            <Card>
              <CardHeader><CardTitle className="text-base">Render nâng cao</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Kiểu render</Label>
                  <select
                    value={renderType}
                    onChange={(e) =>{  setRenderType(e.target.value as 'content' | 'markdown' | 'html'); }}
                    className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  >
                    <option value="content">Content (mặc định)</option>
                    {hasMarkdownRender && <option value="markdown">Markdown</option>}
                    {hasHtmlRender && <option value="html">HTML</option>}
                  </select>
                </div>
                {hasMarkdownRender && (
                  <div className="space-y-2">
                    <Label>Markdown render</Label>
                    <textarea
                      value={markdownRender}
                      onChange={(e) =>{  setMarkdownRender(e.target.value); }}
                      className="w-full min-h-[120px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-mono"
                      placeholder="Dán markdown để render..."
                    />
                  </div>
                )}
                {hasHtmlRender && (
                  <div className="space-y-2">
                    <Label>HTML render</Label>
                    <textarea
                      value={htmlRender}
                      onChange={(e) =>{  setHtmlRender(e.target.value); }}
                      className="w-full min-h-[120px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-mono"
                      placeholder="Dán HTML inline để render..."
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">Giá & Kho hàng</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {!hideBasePricing && (
                <div className={enabledFields.has('salePrice') ? "grid grid-cols-2 gap-4" : ""}>
                  <div className="space-y-2">
                    <Label>
                      Giá bán (VNĐ)
                      {isPriceRequired && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      type="number"
                      value={price}
                      onChange={(e) =>{  setPrice(e.target.value); }}
                      required={isPriceRequired}
                      placeholder="0"
                      min="0"
                    />
                    {priceHelper && (
                      <p className="text-xs text-slate-500">{priceHelper}</p>
                    )}
                  </div>
                  {enabledFields.has('salePrice') && (
                    <div className="space-y-2">
                      <Label>Giá so sánh (trước giảm)</Label>
                      <Input type="number" value={salePrice} onChange={(e) =>{  setSalePrice(e.target.value); }} placeholder="0" min="0" />
                      {salePriceHelper && (
                        <p className="text-xs text-slate-500">{salePriceHelper}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
              {enabledFields.has('stock') && productType !== 'digital' && (
                <div className="space-y-2">
                  <Label>Số lượng tồn kho</Label>
                  <Input type="number" value={stock} onChange={(e) =>{  setStock(e.target.value); }} placeholder="0" min="0" />
                </div>
              )}
              {isAffiliateMode && (
                <div className="space-y-2">
                  <Label>Link Affiliate <span className="text-red-500">*</span></Label>
                  <Input
                    type="url"
                    value={affiliateLink}
                    onChange={(e) => { setAffiliateLink(e.target.value); }}
                    placeholder="https://..."
                    required
                  />
                  <p className="text-xs text-slate-500">Nút “Mua ngay” trên frontend sẽ mở link này.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {digitalEnabled && (
            <Card>
              <CardHeader><CardTitle className="text-base">Loại sản phẩm</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {showProductTypeSelector && (
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="productType"
                        checked={productType === 'physical'}
                        onChange={() => setProductType('physical')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Vật lý (cần giao hàng)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="productType"
                        checked={productType === 'digital'}
                        onChange={() => setProductType('digital')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Digital (giao qua mạng)</span>
                    </label>
                  </div>
                )}

                {productType === 'digital' && (
                  <>
                    <div className="space-y-2">
                      <Label>Loại giao hàng Digital</Label>
                      <select
                        value={digitalDeliveryType}
                        onChange={(e) => setDigitalDeliveryType(e.target.value as 'account' | 'license' | 'download' | 'custom')}
                        className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                      >
                        <option value="account">Tài khoản (username/password)</option>
                        <option value="license">License Key</option>
                        <option value="download">File Download</option>
                        <option value="custom">Tùy chỉnh</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Template Credentials (tùy chọn)</Label>
                      <p className="text-xs text-slate-500">Nhập sẵn thông tin sẽ tự động giao khi xác nhận thanh toán</p>
                      <DigitalCredentialsForm
                        type={digitalDeliveryType}
                        value={digitalCredentialsTemplate}
                        onChange={setDigitalCredentialsTemplate}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {variantEnabled && (
            <Card>
              <CardHeader><CardTitle className="text-base">Phiên bản sản phẩm</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Quản lý tùy chọn</Label>
                  <Link href="/admin/product-options" target="_blank">
                    <Button type="button" variant="outline" className="h-7 px-2 text-xs gap-1">
                      <ExternalLink size={12} />
                      Mở
                    </Button>
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="has-variants"
                    checked={hasVariants}
                    onChange={(e) =>{  setHasVariants(e.target.checked); }}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <Label htmlFor="has-variants" className="cursor-pointer">Sản phẩm có nhiều phiên bản</Label>
                </div>
                {hasVariants && (
                  <div className="space-y-2">
                    <Label>Chọn tùy chọn cho phiên bản</Label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {optionsData?.map(option => (
                        <label key={option._id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={selectedOptionIds.includes(option._id)}
                            onChange={() =>{
                              setSelectedOptionIds(prev => prev.includes(option._id)
                                ? prev.filter(item => item !== option._id)
                                : [...prev, option._id]);
                            }}
                            className="w-4 h-4 rounded border-slate-300"
                          />
                          <span>{option.name}</span>
                        </label>
                      ))}
                    </div>
                    {optionsData?.length === 0 && (
                      <p className="text-xs text-slate-500">Chưa có tùy chọn nào. Hãy tạo option trước.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {(enabledFields.has('metaTitle') || enabledFields.has('metaDescription')) && (
            <Card>
              <CardHeader><CardTitle className="text-base">SEO</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {enabledFields.has('metaTitle') && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Meta Title</Label>
                      <span className={`text-xs ${metaTitle.length > 60 ? 'text-red-500' : 'text-slate-400'}`}>
                        {metaTitle.length}/60
                      </span>
                    </div>
                    <Input
                      value={metaTitle}
                      onChange={(e) =>{  setMetaTitle(e.target.value); }}
                      placeholder="Lấy theo tên sản phẩm nếu để trống"
                    />
                  </div>
                )}
                {enabledFields.has('metaDescription') && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Meta Description</Label>
                      <span className={`text-xs ${metaDescription.length > 160 ? 'text-red-500' : 'text-slate-400'}`}>
                        {metaDescription.length}/160
                      </span>
                    </div>
                    <textarea
                      value={metaDescription}
                      onChange={(e) =>{  setMetaDescription(e.target.value); }}
                      className="w-full min-h-[90px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                      placeholder="Lấy theo mô tả sản phẩm nếu bạn để trống"
                    />
                  </div>
                )}
                <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm">
                  <div className="text-blue-600 font-medium truncate">
                    {metaTitle.trim() || name || 'Tên sản phẩm'}
                  </div>
                  <div className="text-emerald-600 text-xs">
                    /products/{slug || 'san-pham'}
                  </div>
                  <div className="text-slate-600 text-xs mt-1 line-clamp-2">
                    {metaDescription.trim() || stripHtml(description || '') || 'Mô tả ngắn sẽ hiển thị tại đây.'}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Xuất bản</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <select 
                  value={status} 
                  onChange={(e) =>{  setStatus(e.target.value as 'Draft' | 'Active' | 'Archived'); }}
                  className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                >
                  <option value="Draft">Bản nháp</option>
                  <option value="Active">Đang bán</option>
                  <option value="Archived">Lưu trữ</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Danh mục <span className="text-red-500">*</span></Label>
                <ProductCategoryCombobox
                  categories={categoriesData}
                  value={categoryId}
                  onChange={setCategoryId}
                  onQuickCreate={() => setShowCategoryModal(true)}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader><CardTitle className="text-base">Ảnh sản phẩm</CardTitle></CardHeader>
            <CardContent>
              <ImageUpload
                value={image}
                storageId={imageStorageId}
                onChange={setImage}
                onStorageIdChange={setImageStorageId}
                folder="products"
                naming={{ entityName: slug.trim() || 'product', style: 'slug-index', index: 1 }}
                enableCrop={enableImageCrop}
                cropAspectRatio={defaultImageAspectRatio}
              />
            </CardContent>
          </Card>

          {enabledFields.has('images') && (
            <Card>
              <CardHeader><CardTitle className="text-base">Thư viện ảnh</CardTitle></CardHeader>
              <CardContent>
                <MultiImageUploader<ImageItem>
                  items={galleryItems}
                  onChange={setGalleryItems}
                  folder="products"
                  naming={{ entityName: slug.trim() || 'product', style: 'slug-index' }}
                  namingIndexOffset={image ? 1 : 0}
                  deleteMode="defer"
                  imageKey="url"
                  minItems={0}
                  maxItems={20}
                  aspectRatio="square"
                  enableCrop={enableImageCrop}
                  cropAspectRatio={defaultImageAspectRatio}
                  imageAspectRatio={defaultImageAspectRatio}
                  columns={2}
                  addButtonText="Thêm ảnh"
                  emptyText="Chưa có ảnh trong thư viện"
                  layout="vertical"
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">Thống kê</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Đã bán:</span>
                <span className="font-medium">{productData.sales.toLocaleString()}</span>
              </div>
              {enabledFields.has('stock') && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Tồn kho:</span>
                  <span className={`font-medium ${productData.stock < 10 ? 'text-red-500' : ''}`}>{productData.stock}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <HomeComponentStickyFooter
        isSubmitting={isSubmitting || saveStatus === 'saving'}
        hasChanges={hasChanges}
        onCancel={() =>{  router.push('/admin/products'); }}
        submitLabel="Lưu thay đổi"
      />
    </form>
    </>
  );
}
