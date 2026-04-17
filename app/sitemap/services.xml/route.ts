import { getConvexClient } from '@/lib/convex';
import { api } from '@/convex/_generated/api';
import { collectPaginated } from '@/lib/seo/sitemap';
import { buildSitemapXml, resolveBaseUrl } from '@/lib/seo/sitemap-xml';

export async function GET(): Promise<Response> {
  const baseUrl = await resolveBaseUrl();
  if (!baseUrl) {
    return new Response(buildSitemapXml([]), {
      headers: { 'Content-Type': 'application/xml' },
    });
  }

  const client = getConvexClient();
  const services = await collectPaginated((cursor) => client.query(api.services.listPublished, {
    paginationOpts: { cursor, numItems: 500 },
  }));

  const entries = services.map((service) => ({
    changeFrequency: 'monthly' as const,
    lastModified: service.publishedAt ? new Date(service.publishedAt) : new Date(service._creationTime),
    priority: 0.7,
    url: `${baseUrl}/services/${service.slug}`,
  }));

  return new Response(buildSitemapXml(entries), {
    headers: { 'Content-Type': 'application/xml' },
  });
}
