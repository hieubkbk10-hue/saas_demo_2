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
  const posts = await collectPaginated((cursor) => client.query(api.posts.listPublished, {
    paginationOpts: { cursor, numItems: 500 },
  }));

  const entries = posts.map((post) => ({
    changeFrequency: 'weekly' as const,
    lastModified: post.publishedAt ? new Date(post.publishedAt) : new Date(post._creationTime),
    priority: 0.6,
    url: `${baseUrl}/posts/${post.slug}`,
  }));

  return new Response(buildSitemapXml(entries), {
    headers: { 'Content-Type': 'application/xml' },
  });
}
