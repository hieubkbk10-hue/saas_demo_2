'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Check, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, cn, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui';
import { COMPONENT_TYPES } from './shared';

export default function HomeComponentCreatePage() {
  const stats = useQuery(api.homeComponents.getStats);
  const systemConfig = useQuery(api.homeComponentSystemConfig.getConfig);
  const typeCounts = useMemo(() => {
    if (!stats) {return {};}
    return Object.fromEntries(stats.typeBreakdown.map(item => [item.type, item.count]));
  }, [stats]);

  const hiddenTypeSet = useMemo(() => new Set(systemConfig?.hiddenTypes ?? []), [systemConfig?.hiddenTypes]);
  const visibleTypes = useMemo(() => COMPONENT_TYPES.filter((type) => !hiddenTypeSet.has(type.value)), [hiddenTypeSet]);

  const recommendedTypes = visibleTypes.filter((type) => type.recommended);
  const otherTypes = visibleTypes.filter((type) => !type.recommended);

  return (
    <TooltipProvider>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Thêm Component mới</h1>
          <Link href="/admin/home-components" className="text-sm text-blue-600 hover:underline">
            ← Quay lại danh sách
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="text-yellow-500" size={18} />
              Gợi ý cho bạn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {recommendedTypes.map((type) => (
                <ComponentCard key={type.value} type={type} count={typeCounts[type.value] ?? 0} />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Các component còn lại</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {otherTypes.map((type) => (
                <ComponentCard key={type.value} type={type} count={typeCounts[type.value] ?? 0} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}

type ComponentType = (typeof COMPONENT_TYPES)[number];

function ComponentCard({ type, count }: { type: ComponentType; count: number }) {
  const Icon = type.icon;
  const exists = count > 0;
  const shouldWarn = type.singleton && exists;
  const tooltipText = shouldWarn
    ? `${type.label} đã được thêm (${count}). Thông thường chỉ nên có 1 ${type.label.toLowerCase()} trên trang.`
    : type.description;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={`/admin/home-components/create/${type.route}`}
          className={cn(
            "relative cursor-pointer border-2 rounded-xl p-4 transition-all",
            "hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10",
            "border-slate-200 dark:border-slate-700",
            shouldWarn && "opacity-60 hover:opacity-70"
          )}
        >
          {type.recommended && (
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 rounded text-xs font-medium text-yellow-700 dark:text-yellow-400">
              Gợi ý
            </div>
          )}

          <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 relative">
            <Icon size={24} className="text-slate-600 dark:text-slate-400" />
            {exists && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">{count}</span>
              </div>
            )}
          </div>
          <h3 className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1">
            {type.label}
            {exists && <Check size={14} className="text-green-600" />}
          </h3>
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
}
