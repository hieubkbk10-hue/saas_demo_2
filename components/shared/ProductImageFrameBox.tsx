'use client';

import React, { useMemo } from 'react';
import { useQuery } from 'convex/react';
import type { Id } from '@/convex/_generated/dataModel';
import { api } from '@/convex/_generated/api';
import type {
  ProductImageFrame,
  ProductImageFrameLineConfig,
  ProductImageFrameLogoConfig,
  LegacyProductImageFrameLogoConfig,
} from '@/lib/products/product-frame';
import { resolveProductImageAspectRatio } from '@/lib/products/image-aspect-ratio';

type ProductImageFrameBoxProps = {
  frame?: ProductImageFrame | null;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

type FrameOverlayProps = {
  frame: ProductImageFrame;
};

export function useProductFrameConfig() {
  const enabledSetting = useQuery(api.admin.modules.getModuleSetting, {
    moduleKey: 'products',
    settingKey: 'enableProductFrames',
  });
  const activeSetting = useQuery(api.admin.modules.getModuleSetting, {
    moduleKey: 'products',
    settingKey: 'activeProductFrameId',
  });

  const activeFrameId = typeof activeSetting?.value === 'string'
    ? (activeSetting.value as Id<'productImageFrames'>)
    : null;
  const frame = useQuery(
    api.productImageFrames.getById,
    activeFrameId ? { id: activeFrameId } : "skip"
  );

  const enabled = enabledSetting?.value === true;
  const normalizedFrame = useMemo<ProductImageFrame | null>(() => {
    if (!frame) {
      return null;
    }
    return {
      ...frame,
      aspectRatio: resolveProductImageAspectRatio(frame.aspectRatio),
      overlayImageUrl: frame.overlayImageUrl ?? undefined,
      lineConfig: frame.lineConfig ?? undefined,
      logoConfig: frame.logoConfig ?? undefined,
      seasonKey: frame.seasonKey ?? undefined,
    };
  }, [frame]);

  return useMemo(
    () => ({ enabled, frame: enabled ? normalizedFrame : null }),
    [enabled, normalizedFrame]
  );
}

export function ProductImageFrameBox({
  frame,
  className,
  style,
  children,
}: ProductImageFrameBoxProps) {
  return (
    <div className={className ? `relative ${className}` : 'relative'} style={style}>
      {children}
      <ProductImageFrameOverlay frame={frame} />
    </div>
  );
}

export function ProductImageFrameOverlay({
  frame,
  constrain = false,
}: {
  frame?: ProductImageFrame | null;
  constrain?: boolean;
}) {
  if (!frame) {
    return null;
  }
  if (!constrain) {
    return <FrameOverlay frame={frame} />;
  }
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ clipPath: 'inset(0)' }}>
      <FrameOverlay frame={frame} />
    </div>
  );
}

function FrameOverlay({ frame }: FrameOverlayProps) {
  if (frame.sourceType === 'uploaded_overlay' && frame.overlayImageUrl) {
    return (
      <img
        src={frame.overlayImageUrl}
        alt={frame.name}
        className="absolute inset-0 h-full w-full pointer-events-none"
        style={{ objectFit: 'contain' }}
      />
    );
  }

  if (frame.sourceType === 'line_generator' && frame.lineConfig) {
    return renderLineFrame(frame.lineConfig);
  }

  if (frame.sourceType === 'logo_generator' && frame.logoConfig) {
    return renderLogoFrame(frame.logoConfig);
  }

  return null;
}

function renderLineFrame(config: ProductImageFrameLineConfig) {
  const inset = Math.max(0, Math.min(config.inset, 30));
  const strokeWidth = Math.max(0.5, config.strokeWidth);
  const radius = Math.max(0, config.radius);
  const resolvedRadius = config.cornerStyle === 'sharp' ? 0 : radius;
  const size = 100 - inset * 2;
  const dashArray = config.cornerStyle === 'ornamental-light' ? '10 7' : undefined;
  const filter = config.shadow ? `drop-shadow(${config.shadow})` : undefined;

  return (
    <svg
      viewBox="0 0 100 100"
      className="absolute inset-0 h-full w-full pointer-events-none"
      style={filter ? { filter } : undefined}
      preserveAspectRatio="none"
    >
      <rect
        x={inset}
        y={inset}
        width={size}
        height={size}
        rx={resolvedRadius}
        ry={resolvedRadius}
        fill="none"
        stroke={config.color}
        strokeWidth={strokeWidth}
        strokeDasharray={dashArray}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function normalizeLogoConfig(
  config: ProductImageFrameLogoConfig | LegacyProductImageFrameLogoConfig
): ProductImageFrameLogoConfig {
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
}

function renderLogoFrame(config: ProductImageFrameLogoConfig | LegacyProductImageFrameLogoConfig) {
  const normalized = normalizeLogoConfig(config);
  const size = Math.max(10, Math.min(40, normalized.scale * 40));
  const opacity = Math.max(0.05, Math.min(1, normalized.opacity));
  const x = Math.max(0, Math.min(100, normalized.x));
  const y = Math.max(0, Math.min(100, normalized.y));
  const half = size / 2;
  const clampedX = Math.max(half, Math.min(100 - half, x));
  const clampedY = Math.max(half, Math.min(100 - half, y));

  return (
    <img
      src={normalized.logoUrl}
      alt="Logo frame"
      className="absolute pointer-events-none object-contain"
      style={{
        width: `${size}%`,
        height: `${size}%`,
        left: `${clampedX}%`,
        top: `${clampedY}%`,
        transform: 'translate(-50%, -50%)',
        opacity,
      }}
    />
  );
}
