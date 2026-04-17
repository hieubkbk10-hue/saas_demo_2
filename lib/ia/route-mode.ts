export type RouteMode = 'unified' | 'namespace';

export const normalizeRouteMode = (value?: unknown): RouteMode => (
  value === 'namespace' ? 'namespace' : 'unified'
);

export const buildModuleListPath = (moduleKey: 'posts' | 'products' | 'services'): string => `/${moduleKey}`;

export const buildCategoryPath = (params: {
  mode: RouteMode;
  moduleKey: 'posts' | 'products' | 'services';
  categorySlug: string;
}): string => {
  if (params.mode === 'unified') {
    return `/${params.categorySlug}`;
  }
  if (params.moduleKey === 'posts') {
    return `/posts?catpost=${params.categorySlug}`;
  }
  return `/${params.moduleKey}?category=${params.categorySlug}`;
};

export const buildDetailPath = (params: {
  mode: RouteMode;
  moduleKey: 'posts' | 'products' | 'services';
  recordSlug: string;
  categorySlug?: string | null;
}): string => {
  if (params.mode === 'unified' && params.categorySlug) {
    return `/${params.categorySlug}/${params.recordSlug}`;
  }
  return `/${params.moduleKey}/${params.recordSlug}`;
};

export const buildCategorySearchParamKey = (moduleKey: 'posts' | 'products' | 'services'): string => (
  moduleKey === 'posts' ? 'catpost' : 'category'
);
