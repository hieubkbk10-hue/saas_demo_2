import { notFound } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/convex';
import ProductDetailPage from '@/app/(site)/products/[slug]/page';
import PostDetailPage from '@/app/(site)/posts/[slug]/page';
import ServiceDetailPage from '@/app/(site)/services/[slug]/page';

interface Props {
  params: Promise<{ categorySlug: string; recordSlug: string }>;
}

export default async function UnifiedDetailPage({ params }: Props) {
  const { categorySlug, recordSlug } = await params;
  const client = getConvexClient();
  const resolvedDetail = await client.query(api.ia.resolveUnifiedDetail, { categorySlug, recordSlug });

  if (!resolvedDetail) {
    notFound();
  }

  if (resolvedDetail.moduleKey === 'products') {
    return <ProductDetailPage params={Promise.resolve({ slug: recordSlug })} />;
  }
  if (resolvedDetail.moduleKey === 'services') {
    return <ServiceDetailPage params={Promise.resolve({ slug: recordSlug })} />;
  }
  if (resolvedDetail.moduleKey === 'posts') {
    return <PostDetailPage params={Promise.resolve({ slug: recordSlug })} />;
  }

  notFound();
}
