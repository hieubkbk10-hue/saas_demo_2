import type { Metadata } from 'next';
import { permanentRedirect, notFound } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/convex';
import { getContactSettings, getSEOSettings, getSiteSettings, getSocialSettings } from '@/lib/get-settings';
import { buildSeoMetadata } from '@/lib/seo/metadata';
import { buildCategoryPath, buildModuleListPath } from '@/lib/ia/route-mode';
import { getIASettings } from '@/lib/ia/settings';
import ProductsPage from '@/app/(site)/products/page';
import PostsPage from '@/app/(site)/posts/page';
import ServicesPage from '@/app/(site)/services/page';

interface Props {
  params: Promise<{ categorySlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug } = await params;
  const client = getConvexClient();
  const [site, seo, contact, social, iaSettings, resolvedCategory] = await Promise.all([
    getSiteSettings(),
    getSEOSettings(),
    getContactSettings(),
    getSocialSettings(),
    getIASettings(),
    client.query(api.ia.resolveUnifiedCategory, { slug: categorySlug }),
  ]);

  if (!resolvedCategory) {
    return buildSeoMetadata({
      contact,
      descriptionOverride: 'Không tìm thấy danh mục phù hợp.',
      entityExists: false,
      pathname: `/${categorySlug}`,
      routeType: 'list',
      seo,
      site,
      social,
      titleOverride: 'Không tìm thấy danh mục',
      useTitleTemplate: true,
    });
  }

  const canonicalPath = iaSettings.routeMode === 'unified'
    ? `/${resolvedCategory.categorySlug}`
    : buildCategoryPath({
        categorySlug: resolvedCategory.categorySlug,
        mode: iaSettings.routeMode,
        moduleKey: resolvedCategory.moduleKey,
      });

  return buildSeoMetadata({
    contact,
    descriptionOverride: resolvedCategory.categoryDescription || seo.seo_description,
    pathname: canonicalPath,
    routeType: 'list',
    seo,
    site,
    social,
    titleOverride: resolvedCategory.categoryName,
    useTitleTemplate: true,
  });
}

export default async function UnifiedCategoryPage({ params }: Props) {
  const { categorySlug } = await params;
  const client = getConvexClient();
  const [iaSettings, resolvedCategory] = await Promise.all([
    getIASettings(),
    client.query(api.ia.resolveUnifiedCategory, { slug: categorySlug }),
  ]);

  if (!resolvedCategory) {
    notFound();
  }

  if (iaSettings.routeMode === 'namespace') {
    permanentRedirect(buildCategoryPath({
      categorySlug: resolvedCategory.categorySlug,
      mode: iaSettings.routeMode,
      moduleKey: resolvedCategory.moduleKey,
    }));
  }

  if (resolvedCategory.moduleKey === 'products') {
    return <ProductsPage />;
  }
  if (resolvedCategory.moduleKey === 'services') {
    return <ServicesPage />;
  }
  if (resolvedCategory.moduleKey === 'posts') {
    return <PostsPage />;
  }

  permanentRedirect(buildModuleListPath('products'));
}
