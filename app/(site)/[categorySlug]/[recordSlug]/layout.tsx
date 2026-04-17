import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/convex';
import { getContactSettings, getSEOSettings, getSiteSettings, getSocialSettings } from '@/lib/get-settings';
import { buildSeoMetadata } from '@/lib/seo/metadata';
import {
  JsonLd,
  generateArticleSchema,
  generateBreadcrumbSchema,
  generateProductSchema,
  generateServiceSchema,
} from '@/components/seo/JsonLd';
import { buildDetailPath } from '@/lib/ia/route-mode';
import { getIASettings } from '@/lib/ia/settings';

interface Props {
  params: Promise<{ categorySlug: string; recordSlug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug, recordSlug } = await params;
  const client = getConvexClient();
  const [iaSettings, site, seo, contact, social, resolvedDetail] = await Promise.all([
    getIASettings(),
    getSiteSettings(),
    getSEOSettings(),
    getContactSettings(),
    getSocialSettings(),
    client.query(api.ia.resolveUnifiedDetail, { categorySlug, recordSlug }),
  ]);

  const fallbackPath = `/${categorySlug}/${recordSlug}`;

  if (!resolvedDetail) {
    return buildSeoMetadata({
      contact,
      descriptionOverride: 'Nội dung không tồn tại hoặc đã bị xóa.',
      entityExists: false,
      pathname: fallbackPath,
      routeType: 'detail',
      seo,
      site,
      social,
      titleOverride: 'Không tìm thấy nội dung',
    });
  }

  const canonicalPath = buildDetailPath({
    categorySlug,
    mode: iaSettings.routeMode,
    moduleKey: resolvedDetail.moduleKey,
    recordSlug,
  });

  if (resolvedDetail.moduleKey === 'products') {
    const product = await client.query(api.products.getById, { id: resolvedDetail.recordId });
    if (!product) {
      return buildSeoMetadata({
        contact,
        descriptionOverride: 'Sản phẩm không tồn tại hoặc đã bị xóa.',
        entityExists: false,
        pathname: canonicalPath,
        routeType: 'detail',
        seo,
        site,
        social,
        titleOverride: 'Không tìm thấy sản phẩm',
      });
    }

    return buildSeoMetadata({
      contact,
      descriptionOverride: product.metaDescription ?? product.description ?? seo.seo_description,
      entity: {
        description: product.description,
        image: product.image,
        images: product.images,
        metaDescription: product.metaDescription,
        metaTitle: product.metaTitle,
        name: product.name,
      },
      entityExists: true,
      pathname: canonicalPath,
      routeType: 'detail',
      seo,
      site,
      social,
      titleOverride: product.metaTitle ?? product.name,
    });
  }

  if (resolvedDetail.moduleKey === 'services') {
    const service = await client.query(api.services.getById, { id: resolvedDetail.recordId });
    if (!service) {
      return buildSeoMetadata({
        contact,
        descriptionOverride: 'Dịch vụ không tồn tại hoặc đã bị xóa.',
        entityExists: false,
        pathname: canonicalPath,
        routeType: 'detail',
        seo,
        site,
        social,
        titleOverride: 'Không tìm thấy dịch vụ',
      });
    }

    return buildSeoMetadata({
      contact,
      entity: {
        excerpt: service.excerpt,
        metaDescription: service.metaDescription,
        metaTitle: service.metaTitle,
        thumbnail: service.thumbnail,
        title: service.title,
      },
      entityExists: true,
      pathname: canonicalPath,
      routeType: 'detail',
      seo,
      site,
      social,
      titleOverride: service.metaTitle ?? service.title,
    });
  }

  const post = await client.query(api.posts.getById, { id: resolvedDetail.recordId });
  if (!post) {
    return buildSeoMetadata({
      contact,
      descriptionOverride: 'Bài viết không tồn tại hoặc đã bị xóa.',
      entityExists: false,
      pathname: canonicalPath,
      routeType: 'detail',
      seo,
      site,
      social,
      titleOverride: 'Không tìm thấy bài viết',
    });
  }

  return buildSeoMetadata({
    contact,
    entity: {
      content: post.content,
      excerpt: post.excerpt,
      metaDescription: post.metaDescription,
      metaTitle: post.metaTitle,
      thumbnail: post.thumbnail,
      title: post.title,
    },
    entityExists: true,
    openGraphType: 'article',
    pathname: canonicalPath,
    routeType: 'detail',
    seo,
    site,
    social,
    titleOverride: post.metaTitle ?? post.title,
  });
}

export default async function UnifiedDetailLayout({ params, children }: Props) {
  const { categorySlug, recordSlug } = await params;
  const client = getConvexClient();
  const [iaSettings, site, seo, resolvedDetail] = await Promise.all([
    getIASettings(),
    getSiteSettings(),
    getSEOSettings(),
    client.query(api.ia.resolveUnifiedDetail, { categorySlug, recordSlug }),
  ]);

  if (!resolvedDetail) {
    notFound();
  }

  if (iaSettings.routeMode === 'namespace') {
    permanentRedirect(buildDetailPath({
      categorySlug,
      mode: iaSettings.routeMode,
      moduleKey: resolvedDetail.moduleKey,
      recordSlug,
    }));
  }

  const baseUrl = (site.site_url || process.env.NEXT_PUBLIC_SITE_URL) ?? '';

  if (resolvedDetail.moduleKey === 'products') {
    const [product, category, enabledFields] = await Promise.all([
      client.query(api.products.getById, { id: resolvedDetail.recordId }),
      client.query(api.productCategories.getById, { id: resolvedDetail.categoryId }),
      client.query(api.admin.modules.listEnabledModuleFields, { moduleKey: 'products' }),
    ]);
    if (!product) {return children;}

    const productUrl = `${baseUrl}/${category?.slug ?? categorySlug}/${product.slug}`;
    const image = (product.image ?? (product.images && product.images[0])) ?? seo.seo_og_image;
    const productImages = product.images && product.images.length > 0
      ? product.images
      : (product.image ? [product.image] : undefined);
    const productUpdatedAt = (product as { updatedAt?: number }).updatedAt;

    const ratingSummary = await client.query(api.comments.getRatingSummary, {
      targetId: product._id,
      targetType: 'product',
    });

    const showStock = enabledFields ? enabledFields.some((field) => field.fieldKey === 'stock') : true;

    const productSchema = generateProductSchema({
      aggregateRating: ratingSummary.count > 0
        ? { ratingValue: Number(ratingSummary.average.toFixed(2)), reviewCount: ratingSummary.count }
        : undefined,
      brand: site.site_name,
      description: product.metaDescription ?? product.description ?? seo.seo_description,
      image,
      images: productImages,
      inStock: showStock ? product.stock > 0 : true,
      name: product.metaTitle ?? product.name,
      price: product.price,
      salePrice: product.salePrice,
      sku: product.sku,
      url: productUrl,
      createdAt: product._creationTime,
      updatedAt: productUpdatedAt,
    });

    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: 'Trang chủ', url: baseUrl },
      { name: category?.name ?? 'Sản phẩm', url: `${baseUrl}/${category?.slug ?? categorySlug}` },
      { name: product.name, url: productUrl },
    ]);

    return (
      <>
        <JsonLd data={productSchema} />
        <JsonLd data={breadcrumbSchema} />
        {children}
      </>
    );
  }

  if (resolvedDetail.moduleKey === 'services') {
    const [service, category] = await Promise.all([
      client.query(api.services.getById, { id: resolvedDetail.recordId }),
      client.query(api.serviceCategories.getById, { id: resolvedDetail.categoryId }),
    ]);
    if (!service) {return children;}

    const serviceUrl = `${baseUrl}/${category?.slug ?? categorySlug}/${service.slug}`;
    const image = service.thumbnail ?? seo.seo_og_image;
    const ratingSummary = await client.query(api.comments.getRatingSummary, {
      targetId: service._id,
      targetType: 'service',
    });

    const serviceSchema = generateServiceSchema({
      aggregateRating: ratingSummary.count > 0
        ? { ratingValue: Number(ratingSummary.average.toFixed(2)), reviewCount: ratingSummary.count }
        : undefined,
      description: (service.metaDescription ?? service.excerpt) ?? seo.seo_description,
      image,
      name: service.metaTitle ?? service.title,
      price: service.price,
      providerName: site.site_name,
      providerUrl: baseUrl,
      url: serviceUrl,
    });

    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: 'Trang chủ', url: baseUrl },
      { name: category?.name ?? 'Dịch vụ', url: `${baseUrl}/${category?.slug ?? categorySlug}` },
      { name: service.title, url: serviceUrl },
    ]);

    return (
      <>
        <JsonLd data={serviceSchema} />
        <JsonLd data={breadcrumbSchema} />
        {children}
      </>
    );
  }

  const post = await client.query(api.posts.getById, { id: resolvedDetail.recordId });
  if (!post) {return children;}

  const category = await client.query(api.postCategories.getById, { id: post.categoryId });
  const postUrl = `${baseUrl}/${category?.slug ?? categorySlug}/${post.slug}`;
  const image = post.thumbnail ?? seo.seo_og_image;
  const articleSchema = generateArticleSchema({
    description: (post.metaDescription ?? post.excerpt) ?? seo.seo_description,
    image,
    publishedAt: post.publishedAt,
    siteName: site.site_name,
    title: post.metaTitle ?? post.title,
    authorName: post.authorName,
    url: postUrl,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Trang chủ', url: baseUrl },
    { name: category?.name ?? 'Bài viết', url: `${baseUrl}/${category?.slug ?? categorySlug}` },
    { name: post.title, url: postUrl },
  ]);

  return (
    <>
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />
      {children}
    </>
  );
}
