'use client';

import React from 'react';
import { useQuery } from 'convex/react';
import { Loader2 } from 'lucide-react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import {
  getServiceListColorTokens,
} from '@/app/admin/home-components/service-list/_lib/colors';
import { ServiceListSectionShared } from '@/app/admin/home-components/service-list/_components/ServiceListSectionShared';
import type {
  ServiceListBrandMode,
  ServiceListConfig,
  ServiceListPreviewItem,
  ServiceListStyle,
} from '@/app/admin/home-components/service-list/_types';
import { buildDetailPath, normalizeRouteMode } from '@/lib/ia/route-mode';

interface ServiceListSectionProps {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: ServiceListBrandMode;
  title: string;
}

type ServiceRecord = {
  _id: Id<'services'>;
  title: string;
  slug?: string;
  excerpt?: string;
  thumbnail?: string;
  status?: string;
  price?: number;
  views: number;
  categoryId: Id<'serviceCategories'>;
};

const mapServiceToPreview = (
  service: ServiceRecord,
  index: number,
  params: {
    routeMode: 'unified' | 'namespace';
    categorySlugMap: Map<string, string>;
  },
): ServiceListPreviewItem & { href: string } => ({
  id: service._id,
  name: service.title,
  image: service.thumbnail,
  description: service.excerpt,
  price: service.price,
  tag: index === 0 ? 'hot' : (index === 1 ? 'new' : undefined),
  href: service.slug ? buildDetailPath({
    categorySlug: params.categorySlugMap.get(service.categoryId),
    mode: params.routeMode,
    moduleKey: 'services',
    recordSlug: service.slug,
  }) : '/services',
});

export function ServiceListSection({
  config,
  brandColor,
  secondary,
  mode,
  title,
}: ServiceListSectionProps) {
  const safeConfig = config as Partial<ServiceListConfig>;

  const style = (safeConfig.style as ServiceListStyle) ?? 'grid';
  const itemCount = Math.min(Math.max(Number(safeConfig.itemCount) || 8, 1), 20);
  const selectionMode = safeConfig.selectionMode ?? 'auto';
  const selectedServiceIds = React.useMemo(() => (
    Array.isArray(safeConfig.selectedServiceIds)
      ? safeConfig.selectedServiceIds
      : []
  ), [safeConfig.selectedServiceIds]);

  const servicesData = useQuery(
    api.services.listAll,
    selectionMode === 'auto' ? { limit: Math.min(itemCount, 20) } : { limit: 100 },
  );
  const categories = useQuery(api.serviceCategories.listActive, { limit: 100 });
  const routeModeSetting = useQuery(api.settings.getValue, { key: 'ia_route_mode', defaultValue: 'unified' });
  const routeMode = React.useMemo(() => normalizeRouteMode(routeModeSetting), [routeModeSetting]);
  const categorySlugMap = React.useMemo(() => {
    if (!categories) {return new Map<string, string>();}
    return new Map(categories.map((category) => [category._id, category.slug]));
  }, [categories]);

  const sortBy = safeConfig.sortBy ?? 'newest';

  const services = React.useMemo(() => {
    if (!servicesData) {return [];}

    const published = servicesData
      .filter((service) => service.status === 'Published') as ServiceRecord[];

    const sorted = (() => {
      if (sortBy === 'popular') {
        return [...published].sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
      }
      if (sortBy === 'random') {
        return [...published].sort(() => Math.random() - 0.5);
      }
      return published;
    })();

    if (selectionMode === 'manual' && selectedServiceIds.length > 0) {
      const serviceMap = new Map(sorted.map((service) => [service._id, service]));
      return selectedServiceIds
        .map((id) => serviceMap.get(id as Id<'services'>))
        .filter((service): service is ServiceRecord => service !== undefined)
        .slice(0, itemCount);
    }

    return sorted.slice(0, itemCount);
  }, [servicesData, selectionMode, selectedServiceIds, itemCount, sortBy]);

  if (servicesData === undefined) {
    return (
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </section>
    );
  }

  const tokens = getServiceListColorTokens({
    primary: brandColor,
    secondary,
    mode,
  });

  const items = services.map((service, index) => mapServiceToPreview(service, index, { categorySlugMap, routeMode }));

  return (
    <ServiceListSectionShared
      context="site"
      mode={mode}
      style={style}
      sectionTitle={title}
      items={items}
      tokens={tokens}
      showViewAll={services.length >= 3}
      viewAllHref="/services"
      imagePriorityCount={2}
    />
  );
}
