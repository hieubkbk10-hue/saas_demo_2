'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { Eye, EyeOff, LayoutTemplate, Type } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import { COMPONENT_TYPES, HOME_COMPONENT_TYPE_VALUES } from '@/app/admin/home-components/create/shared';
import { useBrandColors } from '@/components/site/hooks';
import { Button, Card, CardContent, CardHeader, CardTitle, cn } from '@/app/admin/components/ui';
import { DEFAULT_FONT_KEY, FONT_REGISTRY } from '@/lib/fonts/registry';

const CUSTOM_SUPPORTED_TYPES = new Set(HOME_COMPONENT_TYPE_VALUES);

type ColorOverride = {
  enabled: boolean;
  systemEnabled: boolean;
  mode: 'single' | 'dual';
  primary: string;
  secondary: string;
};

type FontOverride = {
  enabled: boolean;
  systemEnabled: boolean;
  fontKey: string;
};

export default function SystemHomeComponentsPage() {
  const systemColors = useBrandColors();
  const config = useQuery(api.homeComponentSystemConfig.getConfig);
  const stats = useQuery(api.homeComponents.getStats);
  const setCreateVisibility = useMutation(api.homeComponentSystemConfig.setCreateVisibility);
  const setTypeColorOverride = useMutation(api.homeComponentSystemConfig.setTypeColorOverride);
  const bulkSetTypeColorOverride = useMutation(api.homeComponentSystemConfig.bulkSetTypeColorOverride);
  const setTypeFontOverride = useMutation(api.homeComponentSystemConfig.setTypeFontOverride);
  const setGlobalFontOverride = useMutation(api.homeComponentSystemConfig.setGlobalFontOverride);

  const [hiddenTypes, setHiddenTypes] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [typeOverrides, setTypeOverrides] = useState<Record<string, ColorOverride>>({});
  const [typeFontOverrides, setTypeFontOverrides] = useState<Record<string, FontOverride>>({});
  const [globalFontOverride, setGlobalFontOverrideState] = useState({ enabled: false, fontKey: DEFAULT_FONT_KEY });

  useEffect(() => {
    if (!config) {return;}
    setHiddenTypes(config.hiddenTypes);
    setTypeOverrides(config.typeColorOverrides);
    setTypeFontOverrides(config.typeFontOverrides);
    setGlobalFontOverrideState(config.globalFontOverride ?? { enabled: false, fontKey: DEFAULT_FONT_KEY });
  }, [config]);

  const componentTypes = useMemo(() => (
    [...COMPONENT_TYPES].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  ), []);

  const hiddenTypeSet = useMemo(() => new Set(hiddenTypes), [hiddenTypes]);
  const selectedSet = useMemo(() => new Set(selectedTypes), [selectedTypes]);
  const selectedHiddenTypes = useMemo(
    () => selectedTypes.filter((type) => hiddenTypeSet.has(type)),
    [hiddenTypeSet, selectedTypes]
  );
  const selectedVisibleTypes = useMemo(
    () => selectedTypes.filter((type) => !hiddenTypeSet.has(type)),
    [hiddenTypeSet, selectedTypes]
  );
  const typeCountMap = useMemo(() => {
    if (!stats) {return {};}
    return Object.fromEntries(stats.typeBreakdown.map((item) => [item.type, item.count]));
  }, [stats]);
  const unusedTypes = useMemo(() => {
    if (!stats) {return [];}
    return componentTypes
      .filter((type) => (typeCountMap[type.value] ?? 0) === 0)
      .map((type) => type.value);
  }, [componentTypes, stats, typeCountMap]);

  const toggleSelectAll = () => {
    if (selectedTypes.length === componentTypes.length) {
      setSelectedTypes([]);
      return;
    }
    setSelectedTypes(componentTypes.map((type) => type.value));
  };

  const toggleSelectType = (type: string) => {
    setSelectedTypes((prev) => prev.includes(type)
      ? prev.filter((item) => item !== type)
      : [...prev, type]
    );
  };

  const toggleHiddenType = async (type: string) => {
    const willHide = !hiddenTypeSet.has(type);
    const nextHidden = hiddenTypeSet.has(type)
      ? hiddenTypes.filter((item) => item !== type)
      : [...hiddenTypes, type];
    setHiddenTypes(nextHidden);
    try {
      await setCreateVisibility({ hiddenTypes: nextHidden });
      toast.success(willHide ? 'Đã ẩn khỏi trang tạo.' : 'Đã hiển thị lại trên trang tạo.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái ẩn/hiện.');
    }
  };

  const getDefaultOverride = (type: string): ColorOverride => {
    const current = typeOverrides[type];
    if (current) {
      return current;
    }
    const mode = systemColors.mode;
    const primary = systemColors.primary;
    const secondary = mode === 'single' ? primary : (systemColors.secondary || primary);
    return {
      enabled: false,
      systemEnabled: false,
      mode,
      primary,
      secondary,
    };
  };

  const getDefaultFontOverride = (type: string): FontOverride => {
    const current = typeFontOverrides[type];
    if (current) {
      return current;
    }
    return {
      enabled: false,
      systemEnabled: false,
      fontKey: globalFontOverride.fontKey ?? DEFAULT_FONT_KEY,
    };
  };

  const toggleCustomType = async (type: string) => {
    if (!CUSTOM_SUPPORTED_TYPES.has(type)) {return;}
    const current = getDefaultOverride(type);
    const nextEnabled = !current.systemEnabled;
    const resolvedSecondary = current.mode === 'single' ? current.primary : current.secondary;
    const nextOverride = {
      ...current,
      systemEnabled: nextEnabled,
      secondary: resolvedSecondary,
    };
    setTypeOverrides((prev) => ({ ...prev, [type]: nextOverride }));
    try {
      await setTypeColorOverride({
        systemEnabled: nextOverride.systemEnabled,
        type,
      });
      toast.success(nextEnabled ? 'Đã bật custom màu cho component.' : 'Đã chuyển về màu hệ thống.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể cập nhật custom màu.');
    }
  };

  const toggleCustomFontType = async (type: string) => {
    if (!CUSTOM_SUPPORTED_TYPES.has(type)) {return;}
    const current = getDefaultFontOverride(type);
    const nextEnabled = !current.systemEnabled;
    const nextOverride = {
      ...current,
      systemEnabled: nextEnabled,
      fontKey: current.fontKey || DEFAULT_FONT_KEY,
    };
    setTypeFontOverrides((prev) => ({ ...prev, [type]: nextOverride }));
    try {
      await setTypeFontOverride({
        systemEnabled: nextOverride.systemEnabled,
        type,
      });
      toast.success(nextEnabled ? 'Đã bật custom font cho component.' : 'Đã chuyển về font hệ thống.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể cập nhật custom font.');
    }
  };

  const handleGlobalFontChange = async (next: { enabled?: boolean; fontKey?: string }) => {
    const nextState = {
      enabled: typeof next.enabled === 'boolean' ? next.enabled : globalFontOverride.enabled,
      fontKey: next.fontKey ?? globalFontOverride.fontKey,
    };
    setGlobalFontOverrideState(nextState);
    try {
      await setGlobalFontOverride(nextState);
      toast.success('Đã cập nhật font mặc định.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể cập nhật font mặc định.');
    }
  };

  const handleHideSelected = async () => {
    if (selectedVisibleTypes.length === 0) {return;}
    const nextHidden = Array.from(new Set([...hiddenTypes, ...selectedVisibleTypes]));
    setHiddenTypes(nextHidden);
    try {
      await setCreateVisibility({ hiddenTypes: nextHidden });
      toast.success('Đã ẩn các component đã chọn khỏi trang tạo.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể ẩn các component đã chọn.');
    }
  };

  const handleShowSelected = async () => {
    if (selectedHiddenTypes.length === 0) {return;}
    const nextHidden = hiddenTypes.filter((type) => !selectedSet.has(type));
    setHiddenTypes(nextHidden);
    try {
      await setCreateVisibility({ hiddenTypes: nextHidden });
      toast.success('Đã hiển thị lại các component đã chọn trên trang tạo.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể hiển thị lại các component đã chọn.');
    }
  };

  const handleHideUnusedTypes = async () => {
    if (unusedTypes.length === 0) {return;}
    const nextHidden = Array.from(new Set([...hiddenTypes, ...unusedTypes]));
    setHiddenTypes(nextHidden);
    try {
      await setCreateVisibility({ hiddenTypes: nextHidden });
      toast.success('Đã ẩn các type chưa dùng khỏi trang tạo.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể ẩn các type chưa dùng.');
    }
  };

  const handleBulkCustom = async () => {
    if (selectedTypes.length === 0) {return;}
    try {
      await bulkSetTypeColorOverride({ systemEnabled: true, types: selectedTypes });
      toast.success('Đã bật custom màu cho các component đã chọn.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể bật custom màu hàng loạt.');
    }
  };

  if (config === undefined) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">Đang tải...</div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2">
        <LayoutTemplate className="text-cyan-600 dark:text-cyan-400" size={20} />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Quản lý Home Components</h2>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý hiển thị ở trang tạo và nguồn màu theo system/custom.</p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Danh sách Home Components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Font mặc định</div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Áp dụng cho toàn bộ component khi chưa bật custom font.</p>
              </div>
              <div
                className={cn(
                  'cursor-pointer inline-flex items-center justify-center rounded-full w-10 h-5 transition-colors',
                  globalFontOverride.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                )}
                onClick={() => handleGlobalFontChange({ enabled: !globalFontOverride.enabled })}
              >
                <div className={cn('w-4 h-4 bg-white rounded-full transition-transform', globalFontOverride.enabled ? 'translate-x-2' : '-translate-x-2')} />
              </div>
            </div>
            <select
              value={globalFontOverride.fontKey}
              onChange={(event) => handleGlobalFontChange({ fontKey: event.target.value })}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              {FONT_REGISTRY.map((font) => (
                <option key={font.key} value={font.key}>{font.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleHideSelected}
              disabled={selectedVisibleTypes.length === 0}
            >
              Ẩn đã chọn
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShowSelected}
              disabled={selectedHiddenTypes.length === 0}
            >
              Hiện đã chọn
            </Button>
            <Button variant="outline" size="sm" onClick={handleHideUnusedTypes} disabled={unusedTypes.length === 0}>
              Ẩn type chưa dùng
            </Button>
            <Button variant="outline" size="sm" onClick={handleBulkCustom} disabled={selectedTypes.length === 0}>
              Bật custom đã chọn
            </Button>
            <span className="text-xs text-slate-500">Đã chọn {selectedTypes.length} mục</span>
            <span className="text-xs text-slate-500">
              {stats ? `Chưa dùng ${unusedTypes.length} type` : 'Đang tính số type chưa dùng...'}
            </span>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <div className="grid grid-cols-[44px_60px_1fr_140px_320px] gap-3 px-4 py-2 text-xs font-semibold text-slate-500 bg-slate-50 dark:bg-slate-900">
              <div>
                <input
                  type="checkbox"
                  checked={selectedTypes.length === componentTypes.length && componentTypes.length > 0}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 accent-cyan-600"
                />
              </div>
              <div>STT</div>
              <div>Tên home-component</div>
              <div>Trạng thái</div>
              <div>Action</div>
            </div>
            {componentTypes.map((type, index) => {
              const isHidden = hiddenTypeSet.has(type.value);
              const isSelected = selectedSet.has(type.value);
              const customSupported = CUSTOM_SUPPORTED_TYPES.has(type.value);
              const override = getDefaultOverride(type.value);
              const count = stats ? (typeCountMap[type.value] ?? 0) : null;
              const isUnused = count === 0;
              const fontOverride = getDefaultFontOverride(type.value);
              return (
                <div
                  key={type.value}
                  className="grid grid-cols-[44px_60px_1fr_140px_320px] gap-3 px-4 py-3 border-t border-slate-100 dark:border-slate-800 items-center"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectType(type.value)}
                    className="h-4 w-4 accent-cyan-600"
                  />
                  <div className="text-sm text-slate-500">{index + 1}</div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <type.icon size={16} className="text-slate-500" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{type.label}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{type.description}</div>
                    </div>
                  </div>
                  <div className="text-xs">
                    {count === null ? (
                      <span className="text-slate-400">Đang tải...</span>
                    ) : (
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full",
                          isUnused
                            ? "bg-slate-100 text-slate-500"
                            : "bg-emerald-50 text-emerald-600"
                        )}
                      >
                        {isUnused ? 'Chưa dùng' : `Đang dùng (${count})`}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleHiddenType(type.value)}
                      className={cn(
                        "inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs border",
                        isHidden
                          ? "border-slate-200 text-slate-500 bg-slate-100"
                          : "border-emerald-200 text-emerald-600 bg-emerald-50"
                      )}
                    >
                      {isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
                      {isHidden ? 'Ẩn' : 'Hiện'}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleCustomType(type.value)}
                      disabled={!customSupported}
                      className={cn(
                        "inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs border",
                        override.systemEnabled
                          ? "border-cyan-200 text-cyan-600 bg-cyan-50"
                          : "border-slate-200 text-slate-500 bg-white",
                        !customSupported && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {override.systemEnabled ? 'Custom' : 'System'}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleCustomFontType(type.value)}
                      disabled={!customSupported}
                      className={cn(
                        "inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs border",
                        fontOverride.systemEnabled
                          ? "border-indigo-200 text-indigo-600 bg-indigo-50"
                          : "border-slate-200 text-slate-500 bg-white",
                        !customSupported && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <Type size={12} />
                      {fontOverride.systemEnabled ? 'Font' : 'System Font'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
