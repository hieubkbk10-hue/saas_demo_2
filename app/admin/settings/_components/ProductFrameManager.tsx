'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Loader2, Search, X } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { toast } from 'sonner';
import type { Id } from '@/convex/_generated/dataModel';
import { api } from '@/convex/_generated/api';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '@/app/admin/components/ui';
import { SettingsImageUploader } from '@/app/admin/components/SettingsImageUploader';
import { useAdminAuth } from '@/app/admin/auth/context';
import { ProductImageFrameBox } from '@/components/shared/ProductImageFrameBox';
import {
  type ProductImageFrameCornerStyle,
  type ProductImageFrame,
  type ProductImageFrameLogoConfig,
  type LegacyProductImageFrameLogoConfig,
} from '@/lib/products/product-frame';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import {
  getProductImageAspectRatioCssValue,
  getProductImageAspectRatioLabel,
  isAspectRatioMatch,
  resolveProductImageAspectRatio,
} from '@/lib/products/image-aspect-ratio';

const FRAME_TYPE_OPTIONS = [
  { value: 'line', label: 'Khung line' },
  { value: 'custom', label: 'Khung ảnh (custom)' },
  { value: 'logo', label: 'Khung logo' },
] as const;

type FrameCreateType = typeof FRAME_TYPE_OPTIONS[number]['value'];

const SHADOW_MAX_BLUR = 6;
const SHADOW_MAX_ALPHA = 0.35;
const SHADOW_MAX_INTENSITY = 100;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

const parseShadowIntensity = (shadow?: string) => {
  if (!shadow) {
    return 0;
  }
  const rgbaMatch = shadow.match(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([\d.]+))?\s*\)/i);
  const alpha = rgbaMatch?.[4] ? Number(rgbaMatch[4]) : 0;
  const pxMatches = shadow.match(/([\d.]+)px/gi) ?? [];
  const blur = pxMatches.length
    ? Math.max(...pxMatches.map((value) => Number(value.replace('px', ''))))
    : 0;
  const alphaRatio = alpha > 0 ? alpha / SHADOW_MAX_ALPHA : 0;
  const blurRatio = blur > 0 ? blur / SHADOW_MAX_BLUR : 0;
  return Math.round(clamp(Math.max(alphaRatio, blurRatio), 0, 1) * SHADOW_MAX_INTENSITY);
};

const hexToRgb = (value: string) => {
  const normalized = value.replace('#', '');
  if (normalized.length !== 6) {
    return null;
  }
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return null;
  }
  return { r, g, b };
};

const buildShadowString = (color: string, intensity: number) => {
  const normalizedIntensity = clamp(intensity, 0, SHADOW_MAX_INTENSITY);
  if (normalizedIntensity <= 0) {
    return undefined;
  }
  const rgb = hexToRgb(color) ?? { r: 0, g: 0, b: 0 };
  const ratio = normalizedIntensity / SHADOW_MAX_INTENSITY;
  const blur = Number((SHADOW_MAX_BLUR * ratio).toFixed(1));
  const alpha = Number((SHADOW_MAX_ALPHA * ratio).toFixed(2));
  return `0 0 ${blur}px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

const normalizeLogoConfig = (
  config?: ProductImageFrameLogoConfig | LegacyProductImageFrameLogoConfig
): ProductImageFrameLogoConfig | null => {
  if (!config) {
    return null;
  }
  if ('x' in config && 'y' in config) {
    return config;
  }
  if (config.placement === 'corners') {
    return {
      logoUrl: config.logoUrl,
      scale: config.scale,
      opacity: config.opacity,
      x: 0,
      y: 0,
    };
  }
  return {
    logoUrl: config.logoUrl,
    scale: config.scale,
    opacity: config.opacity,
    x: 50,
    y: 50,
  };
};

type LogoDragPreviewProps = {
  previewImage: string;
  logoUrl: string;
  scale: number;
  opacity: number;
  x: number;
  y: number;
  onChange: (next: { x: number; y: number }) => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

function LogoDragPreview({
  previewImage,
  logoUrl,
  scale,
  opacity,
  x,
  y,
  onChange,
  disabled,
  className,
  style,
}: LogoDragPreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const size = Math.max(10, Math.min(40, scale * 40));
  const half = size / 2;
  const clampedX = Math.max(half, Math.min(100 - half, x));
  const clampedY = Math.max(half, Math.min(100 - half, y));
  const resolvedOpacity = Math.max(0.05, Math.min(1, opacity));

  const updatePosition = (event: React.PointerEvent<HTMLImageElement>) => {
    if (!containerRef.current) {
      return;
    }
    const rect = containerRef.current.getBoundingClientRect();
    const nextX = ((event.clientX - rect.left) / rect.width) * 100;
    const nextY = ((event.clientY - rect.top) / rect.height) * 100;
    onChange({ x: clampPercent(nextX), y: clampPercent(nextY) });
  };

  return (
    <div ref={containerRef} className={cn('relative', className)} style={style}>
      <img
        src={previewImage}
        alt="Preview"
        className="w-full h-full object-cover"
        draggable={false}
        onDragStart={(event) => event.preventDefault()}
      />
      <img
        src={logoUrl}
        alt="Logo frame"
        className={cn(
          'absolute object-contain',
          disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
        )}
        draggable={false}
        style={{
          width: `${size}%`,
          height: `${size}%`,
          left: `${clampedX}%`,
          top: `${clampedY}%`,
          transform: 'translate(-50%, -50%)',
          opacity: resolvedOpacity,
        }}
        onDragStart={(event) => event.preventDefault()}
        onPointerDown={(event) => {
          if (disabled) {
            return;
          }
          draggingRef.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          updatePosition(event);
        }}
        onPointerMove={(event) => {
          if (!draggingRef.current) {
            return;
          }
          updatePosition(event);
        }}
        onPointerUp={(event) => {
          draggingRef.current = false;
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          draggingRef.current = false;
        }}
      />
    </div>
  );
}

export function ProductFrameManager() {
  const { hasPermission, user } = useAdminAuth();
  const canView = hasPermission('products', 'view');
  const canEdit = hasPermission('products', 'edit');

  const aspectRatioSetting = useQuery(api.admin.modules.getModuleSetting, {
    moduleKey: 'products',
    settingKey: 'defaultImageAspectRatio',
  });
  const enableSetting = useQuery(api.admin.modules.getModuleSetting, {
    moduleKey: 'products',
    settingKey: 'enableProductFrames',
  });
  const activeFrameSetting = useQuery(api.admin.modules.getModuleSetting, {
    moduleKey: 'products',
    settingKey: 'activeProductFrameId',
  });
  const previewProducts = useQuery(api.products.listAll, { limit: 1 });
  const settingsData = useQuery(api.settings.listAll);

  const aspectRatio = useMemo(
    () => resolveProductImageAspectRatio(aspectRatioSetting?.value),
    [aspectRatioSetting?.value]
  );
  const imageAspectRatioStyle = useMemo(
    () => ({ aspectRatio: getProductImageAspectRatioCssValue(aspectRatio) }),
    [aspectRatio]
  );
  const aspectRatioLabel = useMemo(
    () => getProductImageAspectRatioLabel(aspectRatio),
    [aspectRatio]
  );

  const frames = useQuery(api.productImageFrames.listByAspectRatio, { aspectRatio });
  const createFrame = useMutation(api.productImageFrames.createFrame);
  const updateFrame = useMutation(api.productImageFrames.updateFrame);
  const removeFrame = useMutation(api.productImageFrames.removeFrame);
  const setModuleSetting = useMutation(api.admin.modules.setModuleSetting);

  const [overlayName, setOverlayName] = useState('');
  const [overlayUrl, setOverlayUrl] = useState('');

  const [lineName, setLineName] = useState('');
  const [lineColor, setLineColor] = useState('#D62828');
  const [lineStrokeWidth, setLineStrokeWidth] = useState(3);
  const [lineInset, setLineInset] = useState(2);
  const [lineRadius, setLineRadius] = useState(6);
  const [lineShadowIntensity, setLineShadowIntensity] = useState(100);
  const [lineCornerStyle, setLineCornerStyle] = useState<ProductImageFrameCornerStyle>('rounded');

  const [logoName, setLogoName] = useState('');
  const [logoScale, setLogoScale] = useState(0.25);
  const [logoOpacity, setLogoOpacity] = useState(0.8);
  const [logoX, setLogoX] = useState(0);
  const [logoY, setLogoY] = useState(0);

  const [frameType, setFrameType] = useState<FrameCreateType>('line');
  const [selectedFrameId, setSelectedFrameId] = useState<string>('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [frameSearch, setFrameSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [isActivePickerOpen, setIsActivePickerOpen] = useState(false);
  const [draftEnabled, setDraftEnabled] = useState(false);
  const [draftActiveFrameId, setDraftActiveFrameId] = useState<string | null>(null);
  const [settingsStatus, setSettingsStatus] = useState<'idle' | 'saving' | 'saved'>('saved');
  const [editName, setEditName] = useState('');
  const [editOverlayUrl, setEditOverlayUrl] = useState('');
  const [editLineColor, setEditLineColor] = useState('#D62828');
  const [editLineStrokeWidth, setEditLineStrokeWidth] = useState(3);
  const [editLineInset, setEditLineInset] = useState(2);
  const [editLineRadius, setEditLineRadius] = useState(6);
  const [editLineShadowIntensity, setEditLineShadowIntensity] = useState(0);
  const [editLineCornerStyle, setEditLineCornerStyle] = useState<ProductImageFrameCornerStyle>('rounded');
  const [editLogoScale, setEditLogoScale] = useState(0.25);
  const [editLogoOpacity, setEditLogoOpacity] = useState(0.8);
  const [editLogoX, setEditLogoX] = useState(0);
  const [editLogoY, setEditLogoY] = useState(0);

  const activeFrameId = typeof activeFrameSetting?.value === 'string' ? activeFrameSetting.value : null;
  const isEnabled = enableSetting?.value === true;
  const previewProduct = previewProducts?.[0];
  const previewImage = previewProduct?.image || previewProduct?.images?.[0] || '';
  const siteLogoUrl = useMemo(() => {
    const setting = settingsData?.find((item) => item.key === 'site_logo');
    return typeof setting?.value === 'string' ? setting.value : '';
  }, [settingsData]);

  const selectedFrame = useMemo(
    () => frames?.find((frame) => frame._id === selectedFrameId) ?? null,
    [frames, selectedFrameId]
  );

  useEffect(() => {
    if (!selectedFrame) {
      setIsEditOpen(false);
      return;
    }
    setEditName(selectedFrame.name);
    setEditOverlayUrl(selectedFrame.overlayImageUrl ?? '');
    if (selectedFrame.lineConfig) {
      setEditLineColor(selectedFrame.lineConfig.color);
      setEditLineStrokeWidth(selectedFrame.lineConfig.strokeWidth);
      setEditLineInset(selectedFrame.lineConfig.inset);
      setEditLineRadius(selectedFrame.lineConfig.radius);
      setEditLineShadowIntensity(parseShadowIntensity(selectedFrame.lineConfig.shadow));
      setEditLineCornerStyle(selectedFrame.lineConfig.cornerStyle);
    }
    const resolvedLogoConfig = normalizeLogoConfig(selectedFrame.logoConfig);
    if (resolvedLogoConfig) {
      setEditLogoScale(resolvedLogoConfig.scale);
      setEditLogoOpacity(resolvedLogoConfig.opacity);
      setEditLogoX(resolvedLogoConfig.x);
      setEditLogoY(resolvedLogoConfig.y);
    }
    setIsEditOpen(true);
  }, [selectedFrame]);

  useEffect(() => {
    if (enableSetting === undefined || activeFrameSetting === undefined) {
      return;
    }
    setDraftEnabled(isEnabled);
    setDraftActiveFrameId(activeFrameId);
    setSettingsStatus('saved');
  }, [enableSetting, activeFrameSetting, isEnabled, activeFrameId]);

  if (!canView) {
    return null;
  }

  const normalizedFrames = useMemo<ProductImageFrame[]>(
    () => (frames ?? []).map((frame) => ({
      ...frame,
      aspectRatio: resolveProductImageAspectRatio(frame.aspectRatio),
      overlayImageUrl: frame.overlayImageUrl ?? undefined,
      lineConfig: frame.lineConfig ?? undefined,
      logoConfig: frame.logoConfig ?? undefined,
      seasonKey: frame.seasonKey ?? undefined,
    })),
    [frames]
  );

  const previewFrame = useMemo<ProductImageFrame | null>(
    () => normalizedFrames.find((frame) => frame._id === (draftActiveFrameId ?? activeFrameId)) ?? null,
    [normalizedFrames, draftActiveFrameId, activeFrameId]
  );

  const filteredFrames = useMemo(
    () => normalizedFrames.filter((frame) => frame.name.toLowerCase().includes(frameSearch.trim().toLowerCase())),
    [normalizedFrames, frameSearch]
  );
  const activeFrameLabel = useMemo(() => {
    if (!draftActiveFrameId) {return 'Không dùng khung';}
    return normalizedFrames.find((frame) => frame._id === draftActiveFrameId)?.name ?? 'Không dùng khung';
  }, [normalizedFrames, draftActiveFrameId]);
  const linePreviewFrame: ProductImageFrame = useMemo(() => ({
    _id: 'preview-line',
    name: 'Line preview',
    status: 'active',
    aspectRatio,
    sourceType: 'line_generator',
    lineConfig: {
      strokeWidth: lineStrokeWidth,
      inset: lineInset,
      radius: lineRadius,
      color: lineColor,
      shadow: buildShadowString(lineColor, lineShadowIntensity),
      cornerStyle: lineCornerStyle,
    },
    isSystemPreset: false,
  }), [aspectRatio, lineStrokeWidth, lineInset, lineRadius, lineColor, lineShadowIntensity, lineCornerStyle]);

  const settingsChanged = draftEnabled !== isEnabled
    || draftActiveFrameId !== activeFrameId;

  const markSettingsDirty = () => setSettingsStatus('idle');

  const validateOverlayAspectRatio = (url: string) => new Promise<boolean>((resolve) => {
    const image = new Image();
    image.onload = () => {
      resolve(isAspectRatioMatch({ width: image.naturalWidth, height: image.naturalHeight }, aspectRatio));
    };
    image.onerror = () => resolve(false);
    image.src = url;
  });

  const handleOverlayUpload = async (
    url: string | null | undefined,
    apply: (value: string) => void
  ) => {
    if (!url) {
      apply('');
      return;
    }
    const isValid = await validateOverlayAspectRatio(url);
    if (!isValid) {
      toast.error(`Khung overlay phải đúng tỉ lệ ${aspectRatioLabel}.`);
      return;
    }
    apply(url);
  };

  const handleSaveSettings = async () => {
    if (!canEdit) {
      toast.error('Bạn không có quyền sửa khung viền.');
      return;
    }
    if (!settingsChanged) {return;}
    setSettingsStatus('saving');
    const tasks: Promise<unknown>[] = [];
    if (draftEnabled !== isEnabled) {
      tasks.push(setModuleSetting({ moduleKey: 'products', settingKey: 'enableProductFrames', value: draftEnabled }));
    }
    if (draftActiveFrameId !== activeFrameId) {
      tasks.push(setModuleSetting({ moduleKey: 'products', settingKey: 'activeProductFrameId', value: draftActiveFrameId ?? null }));
    }
    try {
      await Promise.all(tasks);
      setSettingsStatus('saved');
      toast.success('Đã lưu cài đặt khung sản phẩm.');
    } catch {
      setSettingsStatus('idle');
      toast.error('Lưu cài đặt thất bại.');
    }
  };

  const handleCreateOverlay = async () => {
    if (!canEdit) {
      toast.error('Bạn không có quyền tạo khung.');
      return;
    }
    if (!overlayName.trim() || !overlayUrl) {
      toast.error('Cần nhập tên và upload khung overlay.');
      return;
    }
    const isValid = await validateOverlayAspectRatio(overlayUrl);
    if (!isValid) {
      toast.error(`Khung overlay phải đúng tỉ lệ ${aspectRatioLabel}.`);
      return;
    }
    await createFrame({
      name: overlayName.trim(),
      status: 'active',
      aspectRatio,
      sourceType: 'uploaded_overlay',
      overlayImageUrl: overlayUrl,
      overlayStorageId: null,
      isSystemPreset: false,
      createdBy: user?.id ? (user.id as Id<'users'>) : null,
    });
    setOverlayName('');
    setOverlayUrl('');
    toast.success('Đã tạo khung overlay.');
  };

  const handleCreateLine = async () => {
    if (!canEdit) {
      toast.error('Bạn không có quyền tạo khung.');
      return;
    }
    if (!lineName.trim()) {
      toast.error('Cần nhập tên khung line.');
      return;
    }
    await createFrame({
      name: lineName.trim(),
      status: 'active',
      aspectRatio,
      sourceType: 'line_generator',
      lineConfig: {
        strokeWidth: lineStrokeWidth,
        inset: lineInset,
        radius: lineRadius,
        color: lineColor,
        shadow: buildShadowString(lineColor, lineShadowIntensity),
        cornerStyle: lineCornerStyle,
      },
      isSystemPreset: false,
      createdBy: user?.id ? (user.id as Id<'users'>) : null,
    });
    setLineName('');
    toast.success('Đã tạo khung line.');
  };

  const handleCreateLogo = async () => {
    if (!canEdit) {
      toast.error('Bạn không có quyền tạo khung.');
      return;
    }
    if (!logoName.trim()) {
      toast.error('Cần nhập tên khung logo.');
      return;
    }
    if (!siteLogoUrl) {
      toast.error('Vui lòng upload logo trong Cài đặt chung trước.');
      return;
    }
    await createFrame({
      name: logoName.trim(),
      status: 'active',
      aspectRatio,
      sourceType: 'logo_generator',
      logoConfig: {
        logoUrl: siteLogoUrl,
        scale: logoScale,
        opacity: logoOpacity,
        x: logoX,
        y: logoY,
      },
      isSystemPreset: false,
      createdBy: user?.id ? (user.id as Id<'users'>) : null,
    });
    setLogoName('');
    toast.success('Đã tạo khung logo.');
  };

  const handleSaveEdit = async () => {
    if (!selectedFrame || !canEdit) {
      return;
    }
    const payload: Parameters<typeof updateFrame>[0] = {
      id: selectedFrame._id as Id<'productImageFrames'>,
      name: editName.trim() || selectedFrame.name,
      updatedBy: user?.id ? (user.id as Id<'users'>) : null,
    };
    if (selectedFrame.sourceType === 'uploaded_overlay') {
      payload.overlayImageUrl = editOverlayUrl || null;
    }
    if (selectedFrame.sourceType === 'line_generator') {
      payload.lineConfig = {
        strokeWidth: editLineStrokeWidth,
        inset: editLineInset,
        radius: editLineRadius,
        color: editLineColor,
        shadow: buildShadowString(editLineColor, editLineShadowIntensity),
        cornerStyle: editLineCornerStyle,
      };
    }
    if (selectedFrame.sourceType === 'logo_generator') {
      if (!siteLogoUrl) {
        toast.error('Vui lòng upload logo trong Cài đặt chung trước.');
        return;
      }
      payload.logoConfig = {
        logoUrl: siteLogoUrl,
        scale: editLogoScale,
        opacity: editLogoOpacity,
        x: editLogoX,
        y: editLogoY,
      };
    }
    await updateFrame(payload);
    toast.success('Đã cập nhật khung.');
    setSelectedFrameId('');
    setIsEditOpen(false);
  };

  const handleDeleteFrame = async (frameId: string) => {
    if (!canEdit) {
      toast.error('Bạn không có quyền xóa khung.');
      return;
    }
    await removeFrame({ id: frameId as Id<'productImageFrames'> });
    if (activeFrameId === frameId) {
      await setModuleSetting({ moduleKey: 'products', settingKey: 'activeProductFrameId', value: null });
      setDraftActiveFrameId(null);
    }
    toast.success('Đã xóa khung.');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Khung viền ảnh sản phẩm</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Trạng thái</Label>
          <div className="flex flex-wrap gap-3 items-center">
            <Button
              type="button"
              variant={draftEnabled ? 'accent' : 'outline'}
              size="sm"
              onClick={() => {
                if (!canEdit) {return;}
                setDraftEnabled((prev) => !prev);
                markSettingsDirty();
              }}
              disabled={!canEdit}
            >
              {draftEnabled ? 'Đang bật' : 'Đang tắt'}
            </Button>
            <span className="text-xs text-slate-500">AR hiện tại: {getProductImageAspectRatioLabel(aspectRatio)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Khung đang active</Label>
            <div className="relative">
              <button
                type="button"
                className={cn(
                  "w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-left text-sm flex items-center justify-between",
                  !canEdit && "opacity-60 cursor-not-allowed"
                )}
                onClick={() => {
                  if (!canEdit) {return;}
                  setIsActivePickerOpen((prev) => !prev);
                }}
              >
                <span className="truncate">{activeFrameLabel}</span>
                <ChevronDown size={16} className="text-slate-400" />
              </button>
              {isActivePickerOpen && (
                <div className="absolute z-20 mt-2 w-full rounded-md border border-slate-200 bg-white shadow-lg">
                  <div className="p-2">
                    <div className="flex items-center gap-2 rounded-md border border-slate-200 px-2 py-1">
                      <Search size={14} className="text-slate-400" />
                      <input
                        value={activeSearch}
                        onChange={(event) => setActiveSearch(event.target.value)}
                        placeholder="Tìm khung..."
                        className="w-full text-sm outline-none"
                      />
                    </div>
                  </div>
                  <div className="max-h-64 overflow-auto py-1">
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                      onClick={() => {
                        setDraftActiveFrameId(null);
                        markSettingsDirty();
                        setIsActivePickerOpen(false);
                      }}
                    >
                      Không dùng khung
                    </button>
                    {normalizedFrames
                      .filter((frame) => frame.name.toLowerCase().includes(activeSearch.trim().toLowerCase()))
                      .map((frame) => (
                        <button
                          key={frame._id}
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                          onClick={() => {
                            setDraftActiveFrameId(frame._id);
                            markSettingsDirty();
                            setIsActivePickerOpen(false);
                          }}
                        >
                          {frame.name}
                        </button>
                      ))}
                    {normalizedFrames.length === 0 && (
                      <div className="px-3 py-2 text-sm text-slate-500">Chưa có khung nào.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Preview active</Label>
            <ProductImageFrameBox
              frame={previewFrame}
              className="rounded-lg border border-slate-200 overflow-hidden"
              style={imageAspectRatioStyle}
            >
              {previewImage ? (
                <img src={previewImage} alt={previewProduct?.name || 'Preview'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-50 flex items-center justify-center text-xs text-slate-400">
                  Preview
                </div>
              )}
            </ProductImageFrameBox>
          </div>
        </div>

        {!previewProduct && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Chưa có sản phẩm để preview. Vui lòng tạo/upload 1 sản phẩm để xem khung viền trực quan.{' '}
            <Link href="/admin/products/create" className="font-medium underline">Tạo sản phẩm</Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tạo khung mới</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Loại khung</Label>
                  <select
                    value={frameType}
                    onChange={(event) => setFrameType(event.target.value as FrameCreateType)}
                    className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                  >
                    {FRAME_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {frameType === 'custom' && (
                  <div className="space-y-3">
                    <Label className="text-base">Tạo khung ảnh (custom)</Label>
                    <Input value={overlayName} onChange={(e) => setOverlayName(e.target.value)} placeholder="Tên khung overlay" />
                    <SettingsImageUploader
                      label="Upload khung overlay"
                      value={overlayUrl}
                      onChange={(url) => {
                        void handleOverlayUpload(url, setOverlayUrl);
                      }}
                      folder="product-frames"
                      previewSize="md"
                    />
                    <p className="text-xs text-slate-500">
                      Gợi ý: dùng PNG nền trong suốt, phần giữa để trống để khung không che sản phẩm. Tỉ lệ yêu cầu: {aspectRatioLabel}.
                    </p>
                    <Button type="button" variant="accent" size="sm" onClick={handleCreateOverlay} disabled={!canEdit}>
                      Tạo khung ảnh
                    </Button>
                  </div>
                )}

                {frameType === 'line' && (
                  <div className="space-y-3">
                    <Label className="text-base">Tạo khung line</Label>
                    <Input value={lineName} onChange={(e) => setLineName(e.target.value)} placeholder="Tên khung line" />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1 col-span-2">
                        <Label>Màu line</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={lineColor}
                            onChange={(e) => setLineColor(e.target.value)}
                            className="h-10 w-12 rounded-md border border-slate-200 bg-white p-1"
                          />
                          <Input value={lineColor} onChange={(e) => setLineColor(e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-1 col-span-2">
                        <div className="flex items-center justify-between">
                          <Label>Độ dày</Label>
                          <span className="text-xs text-slate-500">{lineStrokeWidth}px</span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={20}
                          step={0.5}
                          value={lineStrokeWidth}
                          onChange={(e) => setLineStrokeWidth(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-1 col-span-2">
                        <div className="flex items-center justify-between">
                          <Label>Inset</Label>
                          <span className="text-xs text-slate-500">{lineInset}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={20}
                          step={0.5}
                          value={lineInset}
                          onChange={(e) => setLineInset(Number(e.target.value))}
                          className="w-full"
                        />
                        <p className="text-xs text-slate-500">Sát mép → vào trong</p>
                      </div>
                      <div className="space-y-1">
                        <Label>Bo góc</Label>
                        <Input type="number" value={lineRadius} onChange={(e) => setLineRadius(Number(e.target.value))} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label>Đổ bóng</Label>
                          <span className="text-xs text-slate-500">{lineShadowIntensity}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={SHADOW_MAX_INTENSITY}
                          step={1}
                          value={lineShadowIntensity}
                          onChange={(e) => setLineShadowIntensity(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-1 col-span-2">
                        <Label>Kiểu góc</Label>
                        <select
                          value={lineCornerStyle}
                          onChange={(e) => setLineCornerStyle(e.target.value as ProductImageFrameCornerStyle)}
                          className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                        >
                          <option value="sharp">Sharp</option>
                          <option value="rounded">Rounded</option>
                          <option value="ornamental-light">Ornamental</option>
                        </select>
                      </div>
                    </div>
                    <Button type="button" variant="accent" size="sm" onClick={handleCreateLine} disabled={!canEdit}>
                      Tạo khung line
                    </Button>
                    {previewImage && (
                      <ProductImageFrameBox
                        frame={linePreviewFrame}
                        className="rounded-lg border border-slate-200 overflow-hidden"
                        style={imageAspectRatioStyle}
                      >
                        <img src={previewImage} alt={previewProduct?.name || 'Preview'} className="w-full h-full object-cover" />
                      </ProductImageFrameBox>
                    )}
                  </div>
                )}

                {frameType === 'logo' && (
                  <div className="space-y-3">
                    <Label className="text-base">Tạo khung logo</Label>
                    <Input
                      value={logoName}
                      onChange={(e) => setLogoName(e.target.value)}
                      placeholder="Tên khung logo"
                      disabled={!siteLogoUrl}
                    />
                    {siteLogoUrl ? (
                      <div className="space-y-2">
                        <Label>Logo dùng cho khung</Label>
                        <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                          <img src={siteLogoUrl} alt="Site logo" className="h-10 w-10 rounded object-contain" />
                          <div className="flex-1 text-xs text-slate-500">
                            Lấy từ <span className="font-medium text-slate-700">Cài đặt chung</span>.
                          </div>
                          <Link href="/admin/settings/general" className="text-xs font-medium text-slate-700 underline">
                            Đổi logo
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        Chưa có logo trong Cài đặt chung. Vui lòng upload ở{' '}
                        <Link href="/admin/settings/general" className="font-medium underline">
                          Cài đặt chung
                        </Link>
                        .
                      </div>
                    )}
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label>Tỉ lệ</Label>
                          <span className="text-xs text-slate-500">{logoScale}</span>
                        </div>
                        <input
                          type="range"
                          min={0.05}
                          max={1}
                          step={0.05}
                          value={logoScale}
                          onChange={(e) => setLogoScale(Number(e.target.value))}
                          className="w-full"
                          disabled={!siteLogoUrl}
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label>Opacity</Label>
                          <span className="text-xs text-slate-500">{logoOpacity}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.05}
                          value={logoOpacity}
                          onChange={(e) => setLogoOpacity(Number(e.target.value))}
                          className="w-full"
                          disabled={!siteLogoUrl}
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="accent"
                      size="sm"
                      onClick={handleCreateLogo}
                      disabled={!canEdit || !siteLogoUrl}
                    >
                      Tạo khung logo
                    </Button>
                    {previewImage && siteLogoUrl && (
                      <LogoDragPreview
                        previewImage={previewImage}
                        logoUrl={siteLogoUrl}
                        scale={logoScale}
                        opacity={logoOpacity}
                        x={logoX}
                        y={logoY}
                        onChange={({ x, y }) => {
                          setLogoX(x);
                          setLogoY(y);
                        }}
                        disabled={!siteLogoUrl}
                        className="rounded-lg border border-slate-200 overflow-hidden"
                        style={imageAspectRatioStyle}
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Danh sách khung đã tạo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 rounded-md border border-slate-200 px-2 py-1">
                  <Search size={14} className="text-slate-400" />
                  <input
                    value={frameSearch}
                    onChange={(event) => setFrameSearch(event.target.value)}
                    placeholder="Tìm khung..."
                    className="w-full text-sm outline-none"
                  />
                </div>
                <div className="space-y-3 max-h-[420px] overflow-auto pr-2">
                  {filteredFrames.map((frame) => (
                    <div key={frame._id} className="border rounded-lg p-3 flex gap-3 items-center">
                      <ProductImageFrameBox
                        frame={frame}
                        className="w-20 rounded-md border border-slate-200 overflow-hidden"
                        style={imageAspectRatioStyle}
                      >
                        {previewImage ? (
                          <img src={previewImage} alt={previewProduct?.name || 'Preview'} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-50" />
                        )}
                      </ProductImageFrameBox>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{frame.name}</p>
                        <p className="text-xs text-slate-500">{frame.sourceType}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={draftActiveFrameId === frame._id ? 'accent' : 'outline'}
                          onClick={() => {
                            setDraftActiveFrameId(frame._id);
                            markSettingsDirty();
                          }}
                          disabled={!canEdit}
                        >
                          {draftActiveFrameId === frame._id ? 'Đang chọn' : 'Chọn'}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedFrameId(frame._id)}
                          disabled={!canEdit}
                        >
                          Sửa
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteFrame(frame._id)}
                          disabled={!canEdit}
                        >
                          Xóa
                        </Button>
                      </div>
                    </div>
                  ))}
                  {frames && frames.length === 0 && (
                    <p className="text-sm text-slate-500">Chưa có khung nào cho AR hiện tại.</p>
                  )}
                  {frames && frames.length > 0 && filteredFrames.length === 0 && (
                    <p className="text-sm text-slate-500">Không tìm thấy khung phù hợp.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {isEditOpen && selectedFrame && (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => {
                setSelectedFrameId('');
                setIsEditOpen(false);
              }}
            />
            <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 overflow-y-auto">
              <div className="flex items-center justify-between gap-3 mb-6">
                <div>
                  <p className="font-semibold text-slate-900">Sửa khung: {selectedFrame.name}</p>
                  <p className="text-xs text-slate-500">Nguồn: {selectedFrame.sourceType}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedFrameId('');
                    setIsEditOpen(false);
                  }}
                >
                  <X size={18} />
                </Button>
              </div>
              <div className="space-y-4">
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Tên khung" />
                {selectedFrame.sourceType === 'uploaded_overlay' && (
                  <SettingsImageUploader
                    label="Cập nhật overlay"
                    value={editOverlayUrl}
                    onChange={(url) => {
                      void handleOverlayUpload(url, setEditOverlayUrl);
                    }}
                    folder="product-frames"
                    previewSize="md"
                  />
                )}
                {selectedFrame.sourceType === 'uploaded_overlay' && (
                  <p className="text-xs text-slate-500">
                    Gợi ý: dùng PNG nền trong suốt, phần giữa để trống để khung không che sản phẩm. Tỉ lệ yêu cầu: {aspectRatioLabel}.
                  </p>
                )}
                {selectedFrame.sourceType === 'line_generator' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 col-span-2">
                      <Label>Màu line</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editLineColor}
                          onChange={(e) => setEditLineColor(e.target.value)}
                          className="h-10 w-12 rounded-md border border-slate-200 bg-white p-1"
                        />
                        <Input value={editLineColor} onChange={(e) => setEditLineColor(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <div className="flex items-center justify-between">
                        <Label>Độ dày</Label>
                        <span className="text-xs text-slate-500">{editLineStrokeWidth}px</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={20}
                        step={0.5}
                        value={editLineStrokeWidth}
                        onChange={(e) => setEditLineStrokeWidth(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <div className="flex items-center justify-between">
                        <Label>Inset</Label>
                        <span className="text-xs text-slate-500">{editLineInset}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={20}
                        step={0.5}
                        value={editLineInset}
                        onChange={(e) => setEditLineInset(Number(e.target.value))}
                        className="w-full"
                      />
                      <p className="text-xs text-slate-500">Sát mép → vào trong</p>
                    </div>
                    <div className="space-y-1">
                      <Label>Bo góc</Label>
                      <Input type="number" value={editLineRadius} onChange={(e) => setEditLineRadius(Number(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label>Đổ bóng</Label>
                        <span className="text-xs text-slate-500">{editLineShadowIntensity}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={SHADOW_MAX_INTENSITY}
                        step={1}
                        value={editLineShadowIntensity}
                        onChange={(e) => setEditLineShadowIntensity(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label>Kiểu góc</Label>
                      <select
                        value={editLineCornerStyle}
                        onChange={(e) => setEditLineCornerStyle(e.target.value as ProductImageFrameCornerStyle)}
                        className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                      >
                        <option value="sharp">Sharp</option>
                        <option value="rounded">Rounded</option>
                        <option value="ornamental-light">Ornamental</option>
                      </select>
                    </div>
                  </div>
                )}
                {selectedFrame.sourceType === 'logo_generator' && (
                  <div className="space-y-3">
                    <div className="space-y-1 col-span-2">
                      <Label>Logo</Label>
                      {siteLogoUrl ? (
                        <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                          <img src={siteLogoUrl} alt="Site logo" className="h-10 w-10 rounded object-contain" />
                          <div className="flex-1 text-xs text-slate-500">
                            Lấy từ <span className="font-medium text-slate-700">Cài đặt chung</span>.
                          </div>
                          <Link href="/admin/settings/general" className="text-xs font-medium text-slate-700 underline">
                            Đổi logo
                          </Link>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                          Chưa có logo trong Cài đặt chung. Vui lòng upload ở{' '}
                          <Link href="/admin/settings/general" className="font-medium underline">
                            Cài đặt chung
                          </Link>
                          .
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label>Tỉ lệ</Label>
                        <span className="text-xs text-slate-500">{editLogoScale}</span>
                      </div>
                      <input
                        type="range"
                        min={0.05}
                        max={1}
                        step={0.05}
                        value={editLogoScale}
                        onChange={(e) => setEditLogoScale(Number(e.target.value))}
                        className="w-full"
                        disabled={!siteLogoUrl}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label>Opacity</Label>
                        <span className="text-xs text-slate-500">{editLogoOpacity}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={editLogoOpacity}
                        onChange={(e) => setEditLogoOpacity(Number(e.target.value))}
                        className="w-full"
                        disabled={!siteLogoUrl}
                      />
                    </div>
                    {previewImage && siteLogoUrl && (
                      <LogoDragPreview
                        previewImage={previewImage}
                        logoUrl={siteLogoUrl}
                        scale={editLogoScale}
                        opacity={editLogoOpacity}
                        x={editLogoX}
                        y={editLogoY}
                        onChange={({ x, y }) => {
                          setEditLogoX(x);
                          setEditLogoY(y);
                        }}
                        disabled={!siteLogoUrl}
                        className="rounded-lg border border-slate-200 overflow-hidden"
                        style={imageAspectRatioStyle}
                      />
                    )}
                  </div>
                )}
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="accent"
                    onClick={handleSaveEdit}
                    disabled={!canEdit || (selectedFrame.sourceType === 'logo_generator' && !siteLogoUrl)}
                  >
                    Lưu chỉnh sửa
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <HomeComponentStickyFooter
          isSubmitting={settingsStatus === 'saving'}
          submitLabel="Lưu thay đổi"
          hasChanges={settingsChanged}
          submitType="button"
          onClickSave={handleSaveSettings}
          align="between"
        >
          <>
            <span className={cn("text-sm", settingsChanged ? "text-amber-600 dark:text-amber-400" : "text-slate-500")}>
              {settingsChanged ? 'Có thay đổi chưa lưu' : 'Đã lưu'}
            </span>
            <Button
              type="button"
              variant="accent"
              onClick={handleSaveSettings}
              disabled={settingsStatus === 'saving' || !settingsChanged}
              className={!settingsChanged && settingsStatus !== 'saving'
                ? 'bg-slate-300 hover:bg-slate-300 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-800 dark:text-slate-400'
                : undefined}
            >
              {settingsStatus === 'saving' && <Loader2 size={16} className="animate-spin mr-2" />}
              {settingsStatus === 'saving' ? 'Đang lưu...' : settingsChanged ? 'Lưu thay đổi' : 'Đã lưu'}
            </Button>
          </>
        </HomeComponentStickyFooter>
      </CardContent>
    </Card>
  );
}
