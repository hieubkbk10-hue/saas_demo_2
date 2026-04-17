'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Briefcase, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '../../../../components/ui';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { ServiceListForm } from '../../_components/ServiceListForm';
import { ServiceListPreview } from '../../_components/ServiceListPreview';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import {
  DEFAULT_SERVICE_LIST_CONFIG,
} from '../../_lib/constants';
import { getServiceListValidationResult } from '../../_lib/colors';
import type {
  ServiceListConfig,
  ServiceListStyle,
  ServiceSelectionMode,
} from '../../_types';

const COMPONENT_TYPE = 'ServiceList';

export default function ServiceListEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { customState, effectiveColors, initialCustom, setCustomState, setInitialCustom, showCustomBlock } = useTypeColorOverrideState(COMPONENT_TYPE);
  const { customState: customFontState, effectiveFont, initialCustom: initialFontCustom, setCustomState: setCustomFontState, setInitialCustom: setInitialFontCustom, showCustomBlock: showFontCustomBlock } = useTypeFontOverrideState(COMPONENT_TYPE);
  const setTypeColorOverride = useMutation(api.homeComponentSystemConfig.setTypeColorOverride);
  const setTypeFontOverride = useMutation(api.homeComponentSystemConfig.setTypeFontOverride);
  const component = useQuery(api.homeComponents.getById, { id: id as Id<'homeComponents'> });
  const updateMutation = useMutation(api.homeComponents.update);
  const servicesData = useQuery(api.services.listAll, { limit: 100 });

  const [title, setTitle] = useState('');
  const [active, setActive] = useState(true);
  const [serviceListConfig, setServiceListConfig] = useState<ServiceListConfig>(DEFAULT_SERVICE_LIST_CONFIG);
  const [serviceListStyle, setServiceListStyle] = useState<ServiceListStyle>('grid');
  const [serviceSelectionMode, setServiceSelectionMode] = useState<ServiceSelectionMode>('auto');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null);

  useEffect(() => {
    if (component) {
      if (component.type !== 'ServiceList') {
        router.replace(`/admin/home-components/${id}/edit`);
        return;
      }

      setTitle(component.title);
      setActive(component.active);

      const config = component.config ?? {};
      const nextConfig: ServiceListConfig = {
        itemCount: (config.itemCount as number) ?? DEFAULT_SERVICE_LIST_CONFIG.itemCount,
        sortBy: (config.sortBy as ServiceListConfig['sortBy']) ?? DEFAULT_SERVICE_LIST_CONFIG.sortBy,
        selectionMode: (config.selectionMode as ServiceSelectionMode) ?? DEFAULT_SERVICE_LIST_CONFIG.selectionMode,
        selectedServiceIds: ((config.selectedServiceIds as string[]) ?? []),
        style: ((config.style as ServiceListStyle) ?? 'grid'),
      };

      setServiceListConfig(nextConfig);
      setServiceListStyle(nextConfig.style ?? 'grid');
      setServiceSelectionMode(nextConfig.selectionMode);
      setSelectedServiceIds(nextConfig.selectedServiceIds ?? []);
    }
  }, [component, id, router]);

  const toSnapshot = (payload: {
    title: string;
    active: boolean;
    itemCount: number;
    sortBy: string;
    style: ServiceListStyle;
    selectionMode: ServiceSelectionMode;
    selectedServiceIds: string[];
  }) => JSON.stringify({
    ...payload,
    selectedServiceIds: payload.selectedServiceIds,
  });

  useEffect(() => {
    if (!component) {return;}
    const config = component.config ?? {};

    setInitialSnapshot(toSnapshot({
      title: component.title,
      active: component.active,
      itemCount: (config.itemCount as number) ?? DEFAULT_SERVICE_LIST_CONFIG.itemCount,
      sortBy: ((config.sortBy as string) ?? DEFAULT_SERVICE_LIST_CONFIG.sortBy),
      style: ((config.style as ServiceListStyle) ?? 'grid'),
      selectionMode: ((config.selectionMode as ServiceSelectionMode) ?? DEFAULT_SERVICE_LIST_CONFIG.selectionMode),
      selectedServiceIds: ((config.selectedServiceIds as string[]) ?? []),
    }));
  }, [component]);

  const currentSnapshot = toSnapshot({
    title,
    active,
    itemCount: serviceListConfig.itemCount,
    sortBy: serviceListConfig.sortBy,
    style: serviceListStyle,
    selectionMode: serviceSelectionMode,
    selectedServiceIds: serviceSelectionMode === 'manual' ? selectedServiceIds : [],
  });

  const resolvedCustomSecondary = resolveSecondaryByMode(customState.mode, customState.primary, customState.secondary);
  const customChanged = showCustomBlock
    ? customState.enabled !== initialCustom.enabled
      || customState.mode !== initialCustom.mode
      || customState.primary !== initialCustom.primary
      || resolvedCustomSecondary !== initialCustom.secondary
    : false;
  const customFontChanged = showFontCustomBlock
    ? customFontState.enabled !== initialFontCustom.enabled
      || customFontState.fontKey !== initialFontCustom.fontKey
    : false;
  const hasChanges = initialSnapshot !== null && (currentSnapshot !== initialSnapshot || customChanged || customFontChanged);

  const validation = useMemo(() => getServiceListValidationResult({
    primary: effectiveColors.primary,
    secondary: effectiveColors.secondary,
    mode: effectiveColors.mode,
  }), [effectiveColors]);

  const warningMessages = useMemo(() => {
    const warnings: string[] = [];

    if (effectiveColors.mode === 'dual' && validation.harmonyStatus.isTooSimilar) {
      warnings.push(`Màu chính và màu phụ đang khá gần nhau (deltaE=${validation.harmonyStatus.deltaE}).`);
    }

    if (validation.accessibility.failing.length > 0) {
      warnings.push(`Có ${validation.accessibility.failing.length} cặp màu chưa đạt APCA (minLc=${validation.accessibility.minLc.toFixed(1)}).`);
    }

    return warnings;
  }, [effectiveColors.mode, validation]);

  const filteredServices = useMemo(() => {
    if (!servicesData) {return [];}
    return servicesData
      .filter(service => service.status === 'Published')
      .filter(service => 
        !serviceSearchTerm || 
        service.title.toLowerCase().includes(serviceSearchTerm.toLowerCase())
      );
  }, [servicesData, serviceSearchTerm]);

  const selectedServices = useMemo(() => {
    if (!servicesData || selectedServiceIds.length === 0) {return [];}
    const serviceMap = new Map(servicesData.map(s => [s._id, s]));
    return selectedServiceIds
      .map(id => serviceMap.get(id as Id<'services'>))
      .filter((s): s is NonNullable<typeof s> => s !== undefined);
  }, [servicesData, selectedServiceIds]);

  const handleToggleService = (serviceId: string) => {
    setSelectedServiceIds(ids => ids.includes(serviceId)
      ? ids.filter(idValue => idValue !== serviceId)
      : [...ids, serviceId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) {return;}

    setIsSubmitting(true);
    try {
      const nextConfig: ServiceListConfig = {
        itemCount: serviceListConfig.itemCount,
        selectionMode: serviceSelectionMode,
        selectedServiceIds: serviceSelectionMode === 'manual' ? selectedServiceIds : [],
        sortBy: serviceListConfig.sortBy,
        style: serviceListStyle,
      };

      await updateMutation({
        active,
        config: nextConfig,
        id: id as Id<'homeComponents'>,
        title,
      });
      if (showCustomBlock) {
        const resolvedCustomSecondary = resolveSecondaryByMode(customState.mode, customState.primary, customState.secondary);
        await setTypeColorOverride({
          enabled: customState.enabled,
          mode: customState.mode,
          primary: customState.primary,
          secondary: resolvedCustomSecondary,
          type: COMPONENT_TYPE,
        });
      }
      if (showFontCustomBlock) {
        await setTypeFontOverride({
          enabled: customFontState.enabled,
          fontKey: customFontState.fontKey,
          type: COMPONENT_TYPE,
        });
      }

      setInitialSnapshot(toSnapshot({
        title,
        active,
        itemCount: nextConfig.itemCount,
        sortBy: nextConfig.sortBy,
        style: nextConfig.style ?? 'grid',
        selectionMode: nextConfig.selectionMode,
        selectedServiceIds: nextConfig.selectedServiceIds ?? [],
      }));

      if (showCustomBlock) {
        setInitialCustom({
          enabled: customState.enabled,
          mode: customState.mode,
          primary: customState.primary,
          secondary: resolveSecondaryByMode(customState.mode, customState.primary, customState.secondary),
        });
      }
      if (showFontCustomBlock) {
        setInitialFontCustom({
          enabled: customFontState.enabled,
          fontKey: customFontState.fontKey,
        });
      }
      toast.success('Đã cập nhật Danh sách Dịch vụ');
    } catch (error) {
      toast.error('Lỗi khi cập nhật');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (component === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (component === null) {
    return <div className="text-center py-8 text-slate-500">Không tìm thấy component</div>;
  }

  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Danh sách Dịch vụ</h1>
        <Link href="/admin/home-components" className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase size={20} />
              Danh sách Dịch vụ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tiêu đề hiển thị <span className="text-red-500">*</span></Label>
              <Input
                value={title}
                onChange={(e) =>{  setTitle(e.target.value); }}
                required
                placeholder="Nhập tiêu đề component..."
              />
            </div>

            <div className="flex items-center gap-3">
              <Label>Trạng thái:</Label>
              <div
                className={cn(
                  "cursor-pointer inline-flex items-center justify-center rounded-full w-12 h-6 transition-colors",
                  active ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"
                )}
                onClick={() =>{  setActive(!active); }}
              >
                <div className={cn(
                  "w-5 h-5 bg-white rounded-full transition-transform shadow",
                  active ? "translate-x-2.5" : "-translate-x-2.5"
                )}></div>
              </div>
              <span className="text-sm text-slate-500">{active ? 'Bật' : 'Tắt'}</span>
            </div>
          </CardContent>
        </Card>

        <ServiceListForm
          selectionMode={serviceSelectionMode}
          onSelectionModeChange={setServiceSelectionMode}
          itemCount={serviceListConfig.itemCount}
          sortBy={serviceListConfig.sortBy}
          onItemCountChange={(count) =>{  setServiceListConfig(config => ({ ...config, itemCount: count })); }}
          onSortByChange={(value) =>{  setServiceListConfig(config => ({ ...config, sortBy: value as ServiceListConfig['sortBy'] })); }}
          filteredServices={filteredServices}
          selectedServices={selectedServices}
          selectedServiceIds={selectedServiceIds}
          onToggleService={handleToggleService}
          serviceSearchTerm={serviceSearchTerm}
          onServiceSearchTermChange={setServiceSearchTerm}
          warningMessages={warningMessages}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom cho Danh sách dịch vụ"
                enabled={customState.enabled}
                mode={customState.mode}
                primary={customState.primary}
                secondary={customState.secondary}
                onEnabledChange={(next) => setCustomState((prev) => ({ ...prev, enabled: next }))}
                onModeChange={(next) => setCustomState((prev) => {
                  if (next === prev.mode) {
                    return prev;
                  }
                  if (next === 'single') {
                    return { ...prev, mode: 'single', secondary: prev.primary };
                  }
                  const nextSecondary = prev.mode === 'single'
                    ? getSuggestedSecondary(prev.primary)
                    : prev.secondary;
                  return { ...prev, mode: 'dual', secondary: nextSecondary };
                })}
                onPrimaryChange={(value) => setCustomState((prev) => ({
                  ...prev,
                  primary: value,
                  secondary: prev.mode === 'single' ? value : prev.secondary,
                }))}
                onSecondaryChange={(value) => setCustomState((prev) => ({ ...prev, secondary: value }))}
              />
            )}
            {showFontCustomBlock && (
              <TypeFontOverrideCard
                title="Font custom cho Danh sách dịch vụ"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            )}
            <ServiceListPreview
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              mode={effectiveColors.mode}
              itemCount={serviceSelectionMode === 'manual' ? selectedServiceIds.length : serviceListConfig.itemCount}
              selectedStyle={serviceListStyle}
              onStyleChange={setServiceListStyle}
              items={serviceSelectionMode === 'manual' && selectedServices.length > 0
              ? selectedServices.map(s => ({ description: s.excerpt, id: s._id, image: s.thumbnail, name: s.title, price: s.price ? s.price.toLocaleString('vi-VN') + 'đ' : 'Liên hệ' }))
              : filteredServices.slice(0, serviceListConfig.itemCount).map(s => ({ description: s.excerpt, id: s._id, image: s.thumbnail, name: s.title, price: s.price ? s.price.toLocaleString('vi-VN') + 'đ' : 'Liên hệ' }))
              }
              title={title}
              fontStyle={fontStyle}
              fontClassName="font-active"
            />
          </div>
        </div>

        <HomeComponentStickyFooter
          isSubmitting={isSubmitting}
          hasChanges={hasChanges}
          onCancel={() =>{  router.push('/admin/home-components'); }}
          submitLabel="Lưu thay đổi"
        />
      </form>
    </div>
  );
}
