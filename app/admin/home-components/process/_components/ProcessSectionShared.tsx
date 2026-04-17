'use client';

import React from 'react';
import { ArrowRight, ChevronDown, Layers } from 'lucide-react';
import { cn } from '../../../components/ui';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewWrapper } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, type PreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import { getProcessColors, type ProcessColorTokens } from '../_lib/colors';
import type { ProcessBrandMode, ProcessStyle } from '../_types';

type ProcessSectionContext = 'preview' | 'site';

type ProcessSharedStep = {
  key: string;
  icon: string;
  title: string;
  description: string;
};

interface ProcessSectionSharedProps {
  steps: ProcessSharedStep[];
  sectionTitle: string;
  style: ProcessStyle;
  brandColor: string;
  secondary: string;
  mode: ProcessBrandMode;
  context: ProcessSectionContext;
  previewDevice?: PreviewDevice;
  setPreviewDevice?: (device: PreviewDevice) => void;
  includePreviewWrapper?: boolean;
  previewStyle?: ProcessStyle;
  onPreviewStyleChange?: (style: ProcessStyle) => void;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}

const PROCESS_STYLES: Array<{ id: ProcessStyle; label: string }> = [
  { id: 'horizontal', label: 'Horizontal' },
  { id: 'stepper', label: 'Stepper' },
  { id: 'cards', label: 'Cards' },
  { id: 'accordion', label: 'Accordion' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'grid', label: 'Grid' },
];

const PREVIEW_MAX_VISIBLE_BY_STYLE: Record<ProcessStyle, Record<PreviewDevice, number>> = {
  horizontal: { desktop: 5, tablet: 5, mobile: 4 },
  stepper: { desktop: 6, tablet: 6, mobile: 4 },
  cards: { desktop: 4, tablet: 4, mobile: 4 },
  accordion: { desktop: 6, tablet: 6, mobile: 4 },
  minimal: { desktop: 6, tablet: 6, mobile: 4 },
  grid: { desktop: 6, tablet: 6, mobile: 4 },
};

const getMaxVisible = (
  style: ProcessStyle,
  context: ProcessSectionContext,
  previewDevice: PreviewDevice,
) => {
  if (context === 'site') {
    return PREVIEW_MAX_VISIBLE_BY_STYLE[style].desktop;
  }
  return PREVIEW_MAX_VISIBLE_BY_STYLE[style][previewDevice];
};

const getSectionPadding = (context: ProcessSectionContext, device: PreviewDevice) => {
  if (context === 'preview') {
    return cn('py-8 px-4', device === 'mobile' ? 'py-6 px-3' : 'md:py-10 md:px-6');
  }
  return 'py-10 md:py-14 px-4';
};

const getResponsiveGridClass = (count: number) => {
  if (count <= 1) {return 'grid-cols-1';}
  if (count === 2) {return 'grid-cols-2';}
  if (count === 3) {return 'grid-cols-2 md:grid-cols-3';}
  if (count === 4) {return 'grid-cols-2 md:grid-cols-4';}
  return 'grid-cols-2 md:grid-cols-5';
};

const getSharedInfoText = (style: ProcessStyle, total: number, visible: number, mode: ProcessBrandMode) => {
  if (total === 0) {return `Chưa có bước nào • ${mode === 'dual' ? '2 màu' : '1 màu'}`;}

  const remaining = Math.max(total - visible, 0);
  const base = `${total} bước`;
  const styleLabel = PROCESS_STYLES.find((item) => item.id === style)?.label ?? 'Horizontal';
  const hiddenLabel = remaining > 0 ? ` • +${remaining} ẩn` : '';
  const modeLabel = mode === 'dual' ? ' • 2 màu' : ' • 1 màu';
  return `${base} • ${styleLabel}${hiddenLabel}${modeLabel}`;
};

const renderEmptyState = (tokens: ProcessColorTokens) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: tokens.emptyIconBg }}>
      <Layers size={32} style={{ color: tokens.emptyIconColor }} />
    </div>
    <h3 className="font-medium mb-1" style={{ color: tokens.bodyText }}>Chưa có bước nào</h3>
    <p className="text-sm" style={{ color: tokens.mutedText }}>Thêm bước đầu tiên để bắt đầu</p>
  </div>
);

const renderHorizontal = ({
  tokens,
  steps,
  sectionTitle,
  context,
  previewDevice,
}: {
  tokens: ProcessColorTokens;
  steps: ProcessSharedStep[];
  sectionTitle: string;
  context: ProcessSectionContext;
  previewDevice: PreviewDevice;
}) => {
  if (steps.length === 0) {return renderEmptyState(tokens);}

  const maxVisible = getMaxVisible('horizontal', context, previewDevice);
  const visibleSteps = steps.slice(0, maxVisible);
  const remainingCount = steps.length - visibleSteps.length;
  const containerClass = getSectionPadding(context, previewDevice);

  return (
    <div className={containerClass} style={{ backgroundColor: tokens.neutralBackground }}>
      <div className="text-center mb-6">
        <h2 className={cn('font-bold tracking-tight', previewDevice === 'mobile' ? 'text-xl' : 'text-2xl')} style={{ color: tokens.heading }}>
          {sectionTitle}
        </h2>
      </div>

      <div className="max-w-3xl mx-auto mb-6">
        <div className="relative flex items-center justify-between">
          <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2" style={{ backgroundColor: tokens.progressTrack }} />
          <div
            className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2"
            style={{
              backgroundColor: tokens.progressFill,
              width: `${((visibleSteps.length - 1) / Math.max(visibleSteps.length - 1, 1)) * 100}%`,
            }}
          />

          {visibleSteps.map((step, idx) => (
            <div key={step.key} className="relative z-10 flex flex-col items-center">
              <div
                className={cn(
                  'flex items-center justify-center rounded-full font-bold text-xs border-2',
                  previewDevice === 'mobile' ? 'w-8 h-8' : 'w-10 h-10',
                )}
                style={{
                  backgroundColor: tokens.stepDotBg,
                  color: tokens.stepDotText,
                  borderColor: tokens.neutralSurface,
                  boxShadow: `0 2px 8px ${tokens.stepDotShadow}`,
                }}
              >
                {step.icon || idx + 1}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={cn('grid gap-3', getResponsiveGridClass(Math.min(visibleSteps.length, 5)))}>
        {visibleSteps.map((step, idx) => (
          <div key={step.key} className="text-center">
            <h4 className="font-semibold text-sm mb-1 line-clamp-1" style={{ color: tokens.bodyText }}>
              {step.title || `Bước ${idx + 1}`}
            </h4>
            <p className="text-xs line-clamp-2" style={{ color: tokens.mutedText }}>
              {step.description || 'Mô tả...'}
            </p>
          </div>
        ))}
      </div>

      {remainingCount > 0 && (
        <div className="text-center mt-4">
          <span className="text-xs" style={{ color: tokens.secondary }}>+{remainingCount} bước khác</span>
        </div>
      )}
    </div>
  );
};

const renderStepper = ({
  tokens,
  steps,
  sectionTitle,
  context,
  previewDevice,
}: {
  tokens: ProcessColorTokens;
  steps: ProcessSharedStep[];
  sectionTitle: string;
  context: ProcessSectionContext;
  previewDevice: PreviewDevice;
}) => {
  if (steps.length === 0) {return renderEmptyState(tokens);}

  const maxVisible = getMaxVisible('stepper', context, previewDevice);
  const visibleSteps = steps.slice(0, maxVisible);
  const remainingCount = steps.length - visibleSteps.length;

  return (
    <div className={getSectionPadding(context, previewDevice)} style={{ backgroundColor: tokens.neutralBackground }}>
      <div className="text-center mb-6">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border"
          style={{
            backgroundColor: tokens.sectionBadgeBg,
            color: tokens.sectionBadgeText,
            borderColor: tokens.sectionBadgeBorder,
          }}
        >
          Quy trình
        </div>
        <h2 className={cn('font-bold tracking-tight', previewDevice === 'mobile' ? 'text-xl' : 'text-2xl')} style={{ color: tokens.heading }}>
          {sectionTitle}
        </h2>
      </div>

      <div className={cn('mx-auto', previewDevice === 'mobile' ? 'max-w-sm' : 'max-w-2xl')}>
        {visibleSteps.map((step, idx) => (
          <div key={step.key} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                style={{ backgroundColor: tokens.stepDotBg, color: tokens.stepDotText }}
              >
                {step.icon || idx + 1}
              </div>
              {idx < visibleSteps.length - 1 && (
                <div className="w-0.5 flex-1 my-2" style={{ backgroundColor: tokens.connectorLine }} />
              )}
            </div>

            <div className={cn('flex-1 pb-6', idx === visibleSteps.length - 1 && 'pb-0')}>
              <h4 className="font-semibold text-sm mb-1" style={{ color: tokens.bodyText }}>
                {step.title || `Bước ${idx + 1}`}
              </h4>
              <p className="text-xs leading-relaxed" style={{ color: tokens.mutedText }}>
                {step.description || 'Mô tả bước này...'}
              </p>
            </div>
          </div>
        ))}

        {remainingCount > 0 && (
          <div className="text-center mt-4">
            <span className="text-xs" style={{ color: tokens.secondary }}>+{remainingCount} bước khác</span>
          </div>
        )}
      </div>
    </div>
  );
};

const renderCards = ({
  tokens,
  steps,
  sectionTitle,
  context,
  previewDevice,
}: {
  tokens: ProcessColorTokens;
  steps: ProcessSharedStep[];
  sectionTitle: string;
  context: ProcessSectionContext;
  previewDevice: PreviewDevice;
}) => {
  if (steps.length === 0) {return renderEmptyState(tokens);}

  const maxVisible = getMaxVisible('cards', context, previewDevice);
  const visibleSteps = steps.slice(0, maxVisible);

  return (
    <div className={getSectionPadding(context, previewDevice)} style={{ backgroundColor: tokens.neutralBackground }}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b-2 mb-8" style={{ borderColor: tokens.neutralBorder }}>
        <div className="space-y-2">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border"
            style={{
              backgroundColor: tokens.sectionBadgeBg,
              color: tokens.sectionBadgeText,
              borderColor: tokens.sectionBadgeBorder,
            }}
          >
            Quy trình
          </div>
          <h2 className={cn('font-bold tracking-tight', previewDevice === 'mobile' ? 'text-xl' : 'text-2xl md:text-3xl')} style={{ color: tokens.heading }}>
            {sectionTitle}
          </h2>
        </div>
      </div>

      <div className={cn(
        'grid gap-4 md:gap-6',
        previewDevice === 'mobile' ? 'grid-cols-1' : (previewDevice === 'tablet' ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'),
      )}>
        {visibleSteps.map((step, idx) => (
          <div
            key={step.key}
            className="group rounded-xl overflow-hidden border transition-colors"
            style={{ backgroundColor: tokens.neutralSurface, borderColor: tokens.cardBorder }}
            onMouseEnter={(event) => {
              event.currentTarget.style.borderColor = tokens.cardHoverBorder;
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.borderColor = tokens.cardBorder;
            }}
          >
            <div className="h-2" style={{ background: tokens.cardAccentBackground }} />

            <div className="p-5 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center font-bold"
                  style={{ backgroundColor: tokens.cardStepBg, color: tokens.cardStepText }}
                >
                  {step.icon || idx + 1}
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: tokens.mutedText }}>
                  Bước {idx + 1}
                </span>
              </div>

              <h3 className="font-bold text-base md:text-lg mb-2" style={{ color: tokens.bodyText }}>
                {step.title || `Bước ${idx + 1}`}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: tokens.mutedText }}>
                {step.description || 'Mô tả bước này...'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const renderAccordion = ({
  tokens,
  steps,
  sectionTitle,
  context,
  previewDevice,
}: {
  tokens: ProcessColorTokens;
  steps: ProcessSharedStep[];
  sectionTitle: string;
  context: ProcessSectionContext;
  previewDevice: PreviewDevice;
}) => {
  if (steps.length === 0) {return renderEmptyState(tokens);}

  const [activeAccordion, setActiveAccordion] = React.useState<number>(0);
  const maxVisible = getMaxVisible('accordion', context, previewDevice);
  const visibleSteps = steps.slice(0, maxVisible);
  const remainingCount = steps.length - visibleSteps.length;

  return (
    <div className={getSectionPadding(context, previewDevice)} style={{ backgroundColor: tokens.neutralBackground }}>
      <div className="text-center mb-6">
        <h2 className={cn('font-bold tracking-tight', previewDevice === 'mobile' ? 'text-xl' : 'text-2xl')} style={{ color: tokens.heading }}>
          {sectionTitle}
        </h2>
      </div>

      <div className={cn('mx-auto space-y-2', previewDevice === 'mobile' ? 'max-w-sm' : 'max-w-xl')}>
        {visibleSteps.map((step, idx) => {
          const isActive = activeAccordion === idx;

          return (
            <div
              key={step.key}
              className="rounded-lg border transition-all cursor-pointer overflow-hidden"
              style={{
                borderColor: isActive ? tokens.accordionActiveBorder : tokens.accordionBorder,
                boxShadow: isActive ? `0 4px 12px ${tokens.accordionActiveShadow}` : 'none',
                backgroundColor: tokens.neutralSurface,
              }}
              onClick={() => { setActiveAccordion(isActive ? -1 : idx); }}
            >
              <div className={cn('flex items-center gap-3 p-3', isActive && 'pb-2')}>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: tokens.stepDotBg, color: tokens.stepDotText }}
                >
                  {step.icon || idx + 1}
                </div>
                <h4 className="flex-1 font-semibold text-sm line-clamp-1" style={{ color: tokens.bodyText }}>
                  {step.title || `Bước ${idx + 1}`}
                </h4>
                <ChevronDown
                  size={16}
                  className={cn('transition-transform', isActive && 'rotate-180')}
                  style={{ color: tokens.arrowIcon }}
                />
              </div>

              {isActive && (
                <div className="px-3 pb-3 pt-0">
                  <p className="text-xs leading-relaxed pl-11" style={{ color: tokens.mutedText }}>
                    {step.description || 'Mô tả bước này...'}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {remainingCount > 0 && (
          <div className="text-center mt-4">
            <span className="text-xs" style={{ color: tokens.secondary }}>+{remainingCount} bước khác</span>
          </div>
        )}
      </div>
    </div>
  );
};

const renderMinimal = ({
  tokens,
  steps,
  sectionTitle,
  context,
  previewDevice,
}: {
  tokens: ProcessColorTokens;
  steps: ProcessSharedStep[];
  sectionTitle: string;
  context: ProcessSectionContext;
  previewDevice: PreviewDevice;
}) => {
  if (steps.length === 0) {return renderEmptyState(tokens);}

  const maxVisible = getMaxVisible('minimal', context, previewDevice);
  const visibleSteps = steps.slice(0, maxVisible);
  const remainingCount = steps.length - visibleSteps.length;

  return (
    <div className={getSectionPadding(context, previewDevice)} style={{ backgroundColor: tokens.neutralBackground }}>
      <div className="text-center mb-6">
        <h2 className={cn('font-bold tracking-tight', previewDevice === 'mobile' ? 'text-xl' : 'text-2xl')} style={{ color: tokens.heading }}>
          {sectionTitle}
        </h2>
        <p className="text-xs mt-1" style={{ color: tokens.mutedText }}>Đơn giản • Hiệu quả • Chuyên nghiệp</p>
      </div>

      <div className={cn('mx-auto', previewDevice === 'mobile' ? 'max-w-sm' : 'max-w-lg')}>
        <div className="space-y-2">
          {visibleSteps.map((step, idx) => (
            <div
              key={step.key}
              className="flex items-center gap-3 p-3 rounded-lg border transition-colors"
              style={{ backgroundColor: tokens.neutralSurface, borderColor: tokens.cardBorder }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0"
                style={{ backgroundColor: tokens.stepDotBg, color: tokens.stepDotText }}
              >
                {step.icon || idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate" style={{ color: tokens.bodyText }}>
                  {step.title || `Bước ${idx + 1}`}
                </h4>
              </div>
              <ArrowRight size={14} style={{ color: tokens.arrowIcon }} className="flex-shrink-0" />
            </div>
          ))}
        </div>

        {remainingCount > 0 && (
          <div className="text-center mt-3">
            <span className="text-xs" style={{ color: tokens.secondary }}>+{remainingCount} bước khác</span>
          </div>
        )}
      </div>
    </div>
  );
};

const renderGrid = ({
  tokens,
  steps,
  sectionTitle,
  context,
  previewDevice,
}: {
  tokens: ProcessColorTokens;
  steps: ProcessSharedStep[];
  sectionTitle: string;
  context: ProcessSectionContext;
  previewDevice: PreviewDevice;
}) => {
  if (steps.length === 0) {return renderEmptyState(tokens);}

  const maxVisible = getMaxVisible('grid', context, previewDevice);
  const visibleSteps = steps.slice(0, maxVisible);
  const remainingCount = steps.length - visibleSteps.length;

  return (
    <div className={getSectionPadding(context, previewDevice)} style={{ backgroundColor: tokens.neutralBackground }}>
      <div className="text-center mb-6">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border"
          style={{
            backgroundColor: tokens.sectionBadgeBg,
            color: tokens.sectionBadgeText,
            borderColor: tokens.sectionBadgeBorder,
          }}
        >
          Quy trình
        </div>
        <h2 className={cn('font-bold tracking-tight', previewDevice === 'mobile' ? 'text-xl' : 'text-2xl')} style={{ color: tokens.heading }}>
          {sectionTitle}
        </h2>
      </div>

      <div className={cn(
        'grid gap-3 max-w-3xl mx-auto',
        previewDevice === 'mobile' ? 'grid-cols-1' : (visibleSteps.length <= 2 ? 'grid-cols-2 max-w-lg' : 'grid-cols-2 md:grid-cols-3'),
      )}>
        {visibleSteps.map((step, idx) => (
          <div
            key={step.key}
            className="rounded-lg p-4 border"
            style={{ backgroundColor: tokens.neutralSurface, borderColor: tokens.cardBorder }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
                style={{ backgroundColor: tokens.stepDotBg, color: tokens.stepDotText }}
              >
                {step.icon || idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm mb-1 line-clamp-1" style={{ color: tokens.bodyText }}>
                  {step.title || `Bước ${idx + 1}`}
                </h4>
                <p className="text-xs line-clamp-2" style={{ color: tokens.mutedText }}>
                  {step.description || 'Mô tả...'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {remainingCount > 0 && (
        <div className="text-center mt-4">
          <span className="text-xs" style={{ color: tokens.secondary }}>+{remainingCount} bước khác</span>
        </div>
      )}
    </div>
  );
};

const ProcessSectionContent = ({
  steps,
  sectionTitle,
  style,
  tokens,
  context,
  previewDevice,
}: {
  steps: ProcessSharedStep[];
  sectionTitle: string;
  style: ProcessStyle;
  tokens: ProcessColorTokens;
  context: ProcessSectionContext;
  previewDevice: PreviewDevice;
}) => {
  if (style === 'horizontal') {
    return renderHorizontal({ context, previewDevice, sectionTitle, steps, tokens });
  }

  if (style === 'stepper') {
    return renderStepper({ context, previewDevice, sectionTitle, steps, tokens });
  }

  if (style === 'cards') {
    return renderCards({ context, previewDevice, sectionTitle, steps, tokens });
  }

  if (style === 'accordion') {
    return renderAccordion({ context, previewDevice, sectionTitle, steps, tokens });
  }

  if (style === 'minimal') {
    return renderMinimal({ context, previewDevice, sectionTitle, steps, tokens });
  }

  return renderGrid({ context, previewDevice, sectionTitle, steps, tokens });
};

export function ProcessSectionShared({
  steps,
  sectionTitle,
  style,
  brandColor,
  secondary,
  mode,
  context,
  previewDevice = 'desktop',
  setPreviewDevice,
  includePreviewWrapper = false,
  previewStyle,
  onPreviewStyleChange,
  fontStyle,
  fontClassName,
}: ProcessSectionSharedProps) {
  const tokens = React.useMemo(() => getProcessColors(brandColor, secondary, mode), [brandColor, secondary, mode]);
  const selectedStyle = previewStyle ?? style;
  const maxVisible = getMaxVisible(selectedStyle, context, previewDevice);
  const info = getSharedInfoText(selectedStyle, steps.length, Math.min(steps.length, maxVisible), mode);

  if (!includePreviewWrapper || context === 'site') {
    return (
      <ProcessSectionContent
        steps={steps}
        sectionTitle={sectionTitle}
        style={selectedStyle}
        tokens={tokens}
        context={context}
        previewDevice={previewDevice}
      />
    );
  }

  return (
    <>
      <PreviewWrapper
        title="Preview Process"
        device={previewDevice}
        setDevice={(nextDevice) => { setPreviewDevice?.(nextDevice); }}
        previewStyle={selectedStyle}
        setPreviewStyle={(next) => onPreviewStyleChange?.(next as ProcessStyle)}
        styles={PROCESS_STYLES}
        info={info}
        deviceWidthClass={deviceWidths[previewDevice]}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        <BrowserFrame>
          <ProcessSectionContent
            steps={steps}
            sectionTitle={sectionTitle}
            style={selectedStyle}
            tokens={tokens}
            context="preview"
            previewDevice={previewDevice}
          />
        </BrowserFrame>
      </PreviewWrapper>
      {mode === 'dual' && (
        <ColorInfoPanel
          brandColor={tokens.primary}
          secondary={tokens.secondary}
          description="Màu phụ được áp dụng cho: progress, dot timeline, badge và border accent của Process."
        />
      )}
      {mode === 'single' && (
        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Màu chính:</span>
            <div
              className="w-8 h-8 rounded border-2 border-slate-300 dark:border-slate-600 shadow-sm"
              style={{ backgroundColor: tokens.primary }}
              title={tokens.primary}
            />
            <span className="font-mono text-slate-600 dark:text-slate-400">{tokens.primary}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Chế độ 1 màu: mọi accent secondary của Process tự động dùng lại màu chính.
          </p>
        </div>
      )}
    </>
  );
}
