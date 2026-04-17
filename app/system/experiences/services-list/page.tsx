'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Briefcase, Eye, LayoutTemplate, Loader2, Save } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/app/admin/components/ui';
import { useBrandColors } from '@/components/site/hooks';
import { 
  ExperienceModuleLink, 
  ExperienceHintCard,
  ServicesListPreview,
  ExampleLinks,
} from '@/components/experiences';
import {
  BrowserFrame,
  ColorConfigCard,
  DeviceToggle,
  deviceWidths,
  LayoutTabs,
  ControlCard,
  ToggleRow,
  SelectRow,
  type DeviceType,
  type LayoutOption,
} from '@/components/experiences/editor';
import { useExperienceConfig, useExperienceSave, EXPERIENCE_NAMES, MESSAGES } from '@/lib/experiences';
import { enforceMultipleToggles } from '@/lib/experiences/module-toggle-guards';

type ListLayoutStyle = 'grid' | 'sidebar' | 'masonry';
type PaginationType = 'pagination' | 'infiniteScroll';

type ServicesListExperienceConfig = {
  layoutStyle: ListLayoutStyle;
  layouts: {
    grid: LayoutConfig;
    sidebar: LayoutConfig;
    masonry: LayoutConfig;
  };
  hideEmptyCategories: boolean;
};

type LayoutConfig = {
  showSearch: boolean;
  showCategories: boolean;
  paginationType: PaginationType;
  postsPerPage: number;
};

const EXPERIENCE_KEY = 'services_list_ui';

const LAYOUT_STYLES: LayoutOption<ListLayoutStyle>[] = [
  { description: 'Hiển thị dạng lưới cards', id: 'grid', label: 'Grid' },
  { description: 'Hiển thị với sidebar bên trái', id: 'sidebar', label: 'Sidebar' },
  { description: 'Hiển thị dạng magazine chuyên nghiệp', id: 'masonry', label: 'Magazine' },
];

const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  showSearch: true,
  showCategories: true,
  paginationType: 'pagination',
  postsPerPage: 12,
};

const DEFAULT_CONFIG: ServicesListExperienceConfig = {
  layoutStyle: 'grid',
  layouts: {
    grid: { ...DEFAULT_LAYOUT_CONFIG },
    sidebar: { ...DEFAULT_LAYOUT_CONFIG },
    masonry: { ...DEFAULT_LAYOUT_CONFIG },
  },
  hideEmptyCategories: true,
};

const HINTS = [
  'Grid layout hiển thị cards dạng lưới gọn gàng.',
  'Sidebar layout có sidebar trái với search và categories.',
  'Magazine layout tạo cảm giác chuyên nghiệp với hero featured.',
  'Mỗi layout có config riêng - chuyển tab để chỉnh.',
];

export default function ServicesListExperiencePage() {
  const experienceSetting = useQuery(api.settings.getByKey, { key: EXPERIENCE_KEY });
  const servicesModule = useQuery(api.admin.modules.getModuleByKey, { key: 'services' });
  const brandColors = useBrandColors();
  const [brandColor, setBrandColor] = useState(brandColors.primary);
  const [secondaryColor, setSecondaryColor] = useState(brandColors.secondary || '');
  const [colorMode, setColorMode] = useState<'single' | 'dual'>(brandColors.mode || 'single');
  const [previewDevice, setPreviewDevice] = useState<DeviceType>('desktop');

  const serverConfig = useMemo<ServicesListExperienceConfig>(() => {
    const raw = experienceSetting?.value as Partial<ServicesListExperienceConfig> | undefined;
    // Migrate legacy 'list' layout to 'sidebar'
    const rawLayout = raw?.layoutStyle as string | undefined;
    const normalizedLayout = rawLayout === 'list' ? 'sidebar' : rawLayout;
    
    const normalizePaginationType = (value?: string | boolean): PaginationType => {
      if (value === 'infiniteScroll') return 'infiniteScroll';
      if (value === 'pagination') return 'pagination';
      if (value === false) return 'infiniteScroll';
      return 'pagination';
    };
    
    const normalizeLayoutConfig = (cfg?: Partial<LayoutConfig & { showPagination?: boolean }>): LayoutConfig => ({
      showSearch: cfg?.showSearch ?? true,
      showCategories: cfg?.showCategories ?? true,
      paginationType: normalizePaginationType(cfg?.paginationType ?? cfg?.showPagination),
      postsPerPage: cfg?.postsPerPage ?? 12,
    });
    
    return {
      layoutStyle: (normalizedLayout as ListLayoutStyle | undefined) ?? 'grid',
      layouts: {
        grid: normalizeLayoutConfig(raw?.layouts?.grid as Partial<LayoutConfig & { showPagination?: boolean }>),
        sidebar: normalizeLayoutConfig(raw?.layouts?.sidebar as Partial<LayoutConfig & { showPagination?: boolean }>),
        masonry: normalizeLayoutConfig(raw?.layouts?.masonry as Partial<LayoutConfig & { showPagination?: boolean }>),
      },
      hideEmptyCategories: raw?.hideEmptyCategories ?? true,
    };
  }, [experienceSetting?.value]);

  const isLoading = experienceSetting === undefined || servicesModule === undefined;
  const canUseServices = servicesModule?.enabled ?? false;

  const { config, setConfig, hasChanges } = useExperienceConfig(serverConfig, DEFAULT_CONFIG, isLoading);
  const beforeSaveTransform = (rawConfig: unknown) => {
    const configValue = rawConfig as ServicesListExperienceConfig;
    const normalizeLayout = (layout: LayoutConfig) => enforceMultipleToggles(layout, [
      { key: 'showSearch', enabled: canUseServices },
      { key: 'showCategories', enabled: canUseServices },
    ]);

    return {
      ...configValue,
      layouts: {
        grid: normalizeLayout(configValue.layouts.grid),
        sidebar: normalizeLayout(configValue.layouts.sidebar),
        masonry: normalizeLayout(configValue.layouts.masonry),
      },
    };
  };

  const { handleSave, isSaving } = useExperienceSave(
    EXPERIENCE_KEY,
    config,
    MESSAGES.saveSuccess(EXPERIENCE_NAMES[EXPERIENCE_KEY]),
    undefined,
    beforeSaveTransform
  );

  useEffect(() => {
    setBrandColor(brandColors.primary);
    setSecondaryColor(brandColors.secondary || '');
    setColorMode(brandColors.mode || 'single');
  }, [brandColors.primary, brandColors.secondary, brandColors.mode]);

  const currentLayoutConfig = config.layouts[config.layoutStyle];

  const updateLayoutConfig = <K extends keyof LayoutConfig>(
    key: K,
    value: LayoutConfig[K]
  ) => {
    setConfig(prev => ({
      ...prev,
      layouts: {
        ...prev.layouts,
        [prev.layoutStyle]: {
          ...prev.layouts[prev.layoutStyle],
          [key]: value,
        },
      },
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">{MESSAGES.loading}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-violet-600" />
            <h1 className="text-2xl font-bold">Danh sách dịch vụ</h1>
          </div>
          <Link href="/system/experiences" className="text-sm text-blue-600 hover:underline">
            Quay lại danh sách
          </Link>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="bg-violet-600 hover:bg-violet-500 gap-1.5"
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          <span>{hasChanges ? 'Lưu' : 'Đã lưu'}</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thiết lập hiển thị</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ControlCard title="Màu thương hiệu">
            <ColorConfigCard
              primary={brandColor}
              secondary={secondaryColor}
              mode={colorMode}
              onPrimaryChange={setBrandColor}
              onSecondaryChange={setSecondaryColor}
              onModeChange={setColorMode}
            />
          </ControlCard>
          <ControlCard title="Khối hiển thị">
            <ToggleRow
              label="Tìm kiếm"
              checked={currentLayoutConfig.showSearch && canUseServices}
              onChange={(v) => updateLayoutConfig('showSearch', v)}
              accentColor={brandColor}
              disabled={!canUseServices}
            />
            <ToggleRow
              label="Danh mục"
              checked={currentLayoutConfig.showCategories && canUseServices}
              onChange={(v) => updateLayoutConfig('showCategories', v)}
              accentColor={brandColor}
              disabled={!canUseServices}
            />
            <ToggleRow
              label="Ẩn danh mục rỗng"
              description="Ngoài public chỉ hiện danh mục có dịch vụ"
              checked={config.hideEmptyCategories}
              onChange={(v) => setConfig(prev => ({ ...prev, hideEmptyCategories: v }))}
              accentColor={brandColor}
            />
          </ControlCard>

          <ControlCard title="Phân trang">
            <SelectRow
              label="Kiểu"
              value={currentLayoutConfig.paginationType}
              options={[
                { value: 'pagination', label: 'Phân trang' },
                { value: 'infiniteScroll', label: 'Cuộn vô hạn' },
              ]}
              onChange={(v) => updateLayoutConfig('paginationType', v as PaginationType)}
              disabled={!canUseServices}
            />
            <SelectRow
              label="Bài mỗi trang"
              value={String(currentLayoutConfig.postsPerPage)}
              options={[
                { value: '12', label: '12' },
                { value: '20', label: '20' },
                { value: '24', label: '24' },
                { value: '48', label: '48' },
              ]}
              onChange={(v) => updateLayoutConfig('postsPerPage', Number(v))}
              disabled={!canUseServices}
            />
          </ControlCard>

          <ControlCard title="Module liên quan">
            <ExperienceModuleLink
              enabled={servicesModule?.enabled ?? false}
              href="/system/modules/services"
              icon={Briefcase}
              title="Dịch vụ"
              colorScheme="cyan"
            />
          </ControlCard>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Liên kết & ghi chú</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ControlCard title="Link xem thử">
            <ExampleLinks
              links={[{ label: 'Trang danh sách', url: '/services' }]}
              color={brandColor}
              compact
            />
          </ControlCard>

          <Card className="p-2">
            <ExperienceHintCard hints={HINTS} />
          </Card>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye size={18} /> Preview
            </CardTitle>
            <div className="flex items-center gap-3">
              <LayoutTabs
                layouts={LAYOUT_STYLES}
                activeLayout={config.layoutStyle}
                onChange={(layout) => setConfig(prev => ({ ...prev, layoutStyle: layout }))}
                accentColor={brandColor}
              />
              <DeviceToggle value={previewDevice} onChange={setPreviewDevice} size="sm" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`mx-auto transition-all duration-300 ${deviceWidths[previewDevice]}`}>
            <BrowserFrame url="yoursite.com/services">
              <ServicesListPreview
                layoutStyle={config.layoutStyle}
                showSearch={currentLayoutConfig.showSearch}
                showCategories={currentLayoutConfig.showCategories}
                paginationType={currentLayoutConfig.paginationType}
                brandColor={brandColor}
                secondaryColor={secondaryColor}
                colorMode={colorMode}
                device={previewDevice}
              />
            </BrowserFrame>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Style: <strong className="text-slate-700 dark:text-slate-300">{LAYOUT_STYLES.find(s => s.id === config.layoutStyle)?.label}</strong>
            {' • '}{previewDevice === 'desktop' && 'Desktop (1920px)'}{previewDevice === 'tablet' && 'Tablet (768px)'}{previewDevice === 'mobile' && 'Mobile (375px)'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
