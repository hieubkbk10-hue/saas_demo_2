'use client';

import React from 'react';
import {
  ArrowUp,
  Calendar,
  Facebook,
  Headphones,
  HelpCircle,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  ShoppingCart,
  Youtube,
} from 'lucide-react';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewWrapper } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, type PreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import {
  getAPCATextColor,
  getSpeedDialColorTokens,
  normalizeSpeedDialActions,
  resolveActionBgColor,
  type SpeedDialColorTokens,
  type SpeedDialRenderableAction,
} from '../_lib/colors';
import { SPEED_DIAL_STYLES } from '../_lib/constants';
import type {
  SpeedDialAction,
  SpeedDialBrandMode,
  SpeedDialPosition,
  SpeedDialStyle,
} from '../_types';

type SpeedDialSectionContext = 'preview' | 'site';

interface SpeedDialSectionSharedProps {
  actions: SpeedDialAction[];
  style: SpeedDialStyle;
  position: SpeedDialPosition;
  brandColor: string;
  secondary: string;
  mode: SpeedDialBrandMode;
  sectionTitle: string;
  context: SpeedDialSectionContext;
  defaultOpen?: boolean;
  previewDevice?: PreviewDevice;
  setPreviewDevice?: (device: PreviewDevice) => void;
  includePreviewWrapper?: boolean;
  previewStyle?: SpeedDialStyle;
  onPreviewStyleChange?: (style: SpeedDialStyle) => void;
}

const getIconNode = (name: string, size = 18) => {
  const normalized = name.trim().toLowerCase();

  if (normalized === 'calendar') {return <Calendar size={size} />;}
  if (normalized === 'facebook') {return <Facebook size={size} />;}
  if (normalized === 'headphones') {return <Headphones size={size} />;}
  if (normalized === 'help-circle') {return <HelpCircle size={size} />;}
  if (normalized === 'instagram') {return <Instagram size={size} />;}
  if (normalized === 'mail') {return <Mail size={size} />;}
  if (normalized === 'map-pin') {return <MapPin size={size} />;}
  if (normalized === 'message-circle') {return <MessageCircle size={size} />;}
  if (normalized === 'shopping-cart') {return <ShoppingCart size={size} />;}
  if (normalized === 'youtube') {return <Youtube size={size} />;}
  if (normalized === 'zalo') {return <span className="text-[10px] font-bold leading-none">Zalo</span>;}

  return <Phone size={size} />;
};

const getLinkProps = (url: string) => {
  const href = url.trim().length > 0 ? url : '#';
  const isExternal = /^https?:\/\//i.test(href);

  return {
    href,
    rel: isExternal ? 'noopener noreferrer' : undefined,
    target: isExternal ? '_blank' as const : undefined,
  };
};

const getStyleInfo = (
  style: SpeedDialStyle,
  actionCount: number,
  mode: SpeedDialBrandMode,
  context: SpeedDialSectionContext,
  previewDevice: PreviewDevice,
) => {
  const styleLabel = SPEED_DIAL_STYLES.find((item) => item.id === style)?.label ?? 'FAB';
  const countLabel = `${actionCount} action`;
  const modeLabel = mode === 'dual' ? '2 màu' : '1 màu';
  const contextLabel = context === 'preview' ? previewDevice : 'site';
  return `${styleLabel} • ${countLabel} • ${modeLabel} • ${contextLabel}`;
};

const renderPageMock = (tokens: SpeedDialColorTokens) => (
  <div className="min-h-[440px] sm:min-h-[520px] rounded-xl border p-4 sm:p-5 relative overflow-hidden" style={{ backgroundColor: tokens.neutralBackground, borderColor: tokens.neutralBorder }}>
    <div className="space-y-3">
      <div className="h-6 w-44 rounded" style={{ backgroundColor: tokens.pageMockLine }} />
      <div className="h-4 w-72 rounded" style={{ backgroundColor: tokens.pageMockLine }} />
    </div>

    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="h-24 rounded-lg border" style={{ backgroundColor: tokens.pageMockCard, borderColor: tokens.neutralBorder }} />
      <div className="h-24 rounded-lg border" style={{ backgroundColor: tokens.pageMockCard, borderColor: tokens.neutralBorder }} />
    </div>

  </div>
);

const renderFab = ({
  actions,
  isRight,
  tokens,
  context,
  groupLabel,
  isOpen,
  onToggle,
  showBackToTop,
  onBackToTop,
}: {
  actions: SpeedDialRenderableAction[];
  isRight: boolean;
  tokens: SpeedDialColorTokens;
  context: SpeedDialSectionContext;
  groupLabel: string;
  isOpen: boolean;
  onToggle: () => void;
  showBackToTop: boolean;
  onBackToTop: () => void;
}) => {
  const siteRight = isRight ? 'right-[2px] md:right-0' : 'left-0';
  const previewRight = isRight ? (showBackToTop ? 'right-3' : 'right-1') : (showBackToTop ? 'left-3' : 'left-1');
  const wrapperClass = context === 'site'
    ? `fixed bottom-4 z-50 flex flex-col gap-2 ${siteRight} ${isRight ? 'items-end' : 'items-start'}`
    : `absolute bottom-3 z-30 flex flex-col gap-2 ${previewRight} ${isRight ? 'items-end' : 'items-start'}`;

  return (
    <div className={wrapperClass} role="group" aria-label={groupLabel}>
      {showBackToTop && (
        <button
          type="button"
          onClick={onBackToTop}
          className="flex h-8 w-8 items-center justify-center rounded-full border transition-transform"
          style={{
            backgroundColor: tokens.neutralSurface,
            borderColor: tokens.neutralBorder,
            color: tokens.bodyText,
          }}
          aria-label="Lên đầu trang"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
      )}

      {isOpen && actions.map((action) => {
        const bg = resolveActionBgColor(action.bgColor, tokens, 'fab');
        const text = getAPCATextColor(bg, 14, 600);

        return (
          <a key={action.key} {...getLinkProps(action.url)} className="group flex items-center gap-2" aria-label={action.label || action.icon}>
            {isRight && action.label && (
              <span
                className="px-2 py-1 text-[11px] font-medium rounded-md shadow-sm opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap"
                style={{ backgroundColor: tokens.labelPillBg, color: tokens.labelPillText }}
              >
                {action.label}
              </span>
            )}
            <span
              className="w-9 h-9 rounded-full shadow-sm flex items-center justify-center transition-transform border backdrop-blur-sm"
              style={{
                backgroundColor: bg,
                color: text,
                borderColor: tokens.actionStyleBorder.fab,
              }}
            >
              {getIconNode(action.icon, 16)}
            </span>
            {!isRight && action.label && (
              <span
                className="px-2 py-1 text-[11px] font-medium rounded-md shadow-sm opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap"
                style={{ backgroundColor: tokens.labelPillBg, color: tokens.labelPillText }}
              >
                {action.label}
              </span>
            )}
          </a>
        );
      })}

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label="Toggle menu"
        className="w-9 h-9 rounded-full shadow-sm border flex items-center justify-center transition-transform"
        style={{
          backgroundColor: tokens.mainButtonBg,
          color: tokens.mainButtonText,
          borderColor: tokens.mainButtonRing,
        }}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

const renderSidebar = ({
  actions,
  isRight,
  tokens,
  context,
  groupLabel,
  isOpen,
  onToggle,
  showBackToTop,
  onBackToTop,
}: {
  actions: SpeedDialRenderableAction[];
  isRight: boolean;
  tokens: SpeedDialColorTokens;
  context: SpeedDialSectionContext;
  groupLabel: string;
  isOpen: boolean;
  onToggle: () => void;
  showBackToTop: boolean;
  onBackToTop: () => void;
}) => {
  const wrapperClass = context === 'site'
    ? `fixed top-1/2 -translate-y-1/2 z-50 ${isRight ? 'right-[2px] md:right-0' : 'left-0'}`
    : `absolute top-1/2 -translate-y-1/2 z-30 ${isRight ? 'right-0' : 'left-0'}`;
  const panelRadius = isRight ? 'rounded-l-xl' : 'rounded-r-xl';
  const toggleRadius = isRight ? 'rounded-l-md' : 'rounded-r-md';

  return (
    <div className={wrapperClass} role="group" aria-label={groupLabel}>
      {showBackToTop && (
        <button
          type="button"
          onClick={onBackToTop}
          className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full border ${isRight ? 'mr-1' : 'ml-1'}`}
          style={{
            backgroundColor: tokens.neutralSurface,
            borderColor: tokens.neutralBorder,
            color: tokens.bodyText,
          }}
          aria-label="Lên đầu trang"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
      )}
      <div className={`flex items-center ${isRight ? 'flex-row' : 'flex-row-reverse'}`}>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-label="Toggle menu"
          className={`flex h-12 w-7 items-center justify-center border shadow-md ${toggleRadius}`}
          style={{
            backgroundColor: tokens.neutralSurface,
            borderColor: tokens.neutralBorder,
            color: tokens.bodyText,
          }}
        >
          <Plus className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-45' : ''}`} />
        </button>
        {isOpen && (
          <div
            className={`flex flex-col gap-1.5 p-1.5 border shadow-sm backdrop-blur-md ${panelRadius} ${isRight ? '-ml-1' : '-mr-1'}`}
            style={{
              backgroundColor: tokens.neutralSurface,
              borderColor: tokens.neutralBorder,
            }}
          >
            {actions.map((action) => {
              const bg = resolveActionBgColor(action.bgColor, tokens, 'sidebar');
              const text = getAPCATextColor(bg, 14, 600);

              return (
                <a
                  key={action.key}
                  {...getLinkProps(action.url)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform border"
                  style={{
                    backgroundColor: bg,
                    color: text,
                    borderColor: tokens.actionStyleBorder.sidebar,
                  }}
                  aria-label={action.label || action.icon}
                >
                  {getIconNode(action.icon, 18)}
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const renderPills = ({
  actions,
  isRight,
  tokens,
  context,
  groupLabel,
  isOpen,
  onToggle,
  showBackToTop,
  onBackToTop,
}: {
  actions: SpeedDialRenderableAction[];
  isRight: boolean;
  tokens: SpeedDialColorTokens;
  context: SpeedDialSectionContext;
  groupLabel: string;
  isOpen: boolean;
  onToggle: () => void;
  showBackToTop: boolean;
  onBackToTop: () => void;
}) => {
  const siteRight = isRight ? 'right-[2px] md:right-0' : 'left-0';
  const previewRight = isRight ? (showBackToTop ? 'right-3' : 'right-1') : (showBackToTop ? 'left-3' : 'left-1');
  const wrapperClass = context === 'site'
    ? `fixed bottom-4 z-50 ${siteRight}`
    : `absolute bottom-3 z-30 ${previewRight}`;

  return (
    <div className={wrapperClass} role="group" aria-label={groupLabel}>
      <div
        className="flex flex-col items-center gap-1.5 rounded-full border px-1.5 py-1.5 shadow-md"
        style={{
          backgroundColor: tokens.neutralSurface,
          borderColor: tokens.neutralBorder,
        }}
      >
        {showBackToTop && (
          <>
            <button
              type="button"
              onClick={onBackToTop}
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{
                backgroundColor: tokens.neutralSurface,
                color: tokens.bodyText,
              }}
              aria-label="Lên đầu trang"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <span
              className="h-px w-6"
              style={{ backgroundColor: tokens.separatorColor }}
              aria-hidden="true"
            />
          </>
        )}
        {isOpen && actions.map((action, idx) => {
          const bg = resolveActionBgColor(action.bgColor, tokens, 'pills');
          const text = getAPCATextColor(bg, 14, 600);

          return (
            <React.Fragment key={action.key}>
              <a
                {...getLinkProps(action.url)}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-transform"
                style={{
                  backgroundColor: bg,
                  color: text,
                }}
                aria-label={action.label || action.icon}
              >
                {getIconNode(action.icon, 16)}
              </a>
              {idx < actions.length - 1 && (
                <span
                  className="h-px w-6"
                  style={{ backgroundColor: tokens.separatorColor }}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          );
        })}
        {(isOpen || showBackToTop) && actions.length > 0 && (
          <span
            className="h-px w-6"
            style={{ backgroundColor: tokens.separatorColor }}
            aria-hidden="true"
          />
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-label="Toggle menu"
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{
            backgroundColor: tokens.bodyText,
            color: tokens.neutralSurface,
          }}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

const renderStack = ({
  actions,
  isRight,
  tokens,
  context,
  groupLabel,
  isOpen,
  onToggle,
  showBackToTop,
  onBackToTop,
}: {
  actions: SpeedDialRenderableAction[];
  isRight: boolean;
  tokens: SpeedDialColorTokens;
  context: SpeedDialSectionContext;
  groupLabel: string;
  isOpen: boolean;
  onToggle: () => void;
  showBackToTop: boolean;
  onBackToTop: () => void;
}) => {
  const siteRight = isRight ? 'right-[2px] md:right-0' : 'left-0';
  const previewRight = isRight ? (showBackToTop ? 'right-3' : 'right-1') : (showBackToTop ? 'left-3' : 'left-1');
  const wrapperClass = context === 'site'
    ? `fixed bottom-4 z-50 flex flex-col items-end gap-2 ${siteRight} ${isRight ? '' : 'items-start'}`
    : `absolute bottom-3 z-30 flex flex-col items-end gap-2 ${previewRight} ${isRight ? '' : 'items-start'}`;

  return (
    <div className={wrapperClass} role="group" aria-label={groupLabel}>
      {showBackToTop && (
        <button
          type="button"
          onClick={onBackToTop}
          className="flex h-8 w-8 items-center justify-center rounded-full border"
          style={{
            backgroundColor: tokens.neutralSurface,
            borderColor: tokens.neutralBorder,
            color: tokens.bodyText,
          }}
          aria-label="Lên đầu trang"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
      )}
      {isOpen && (
        <div
          className="rounded-2xl border p-2 shadow-lg"
          style={{
            backgroundColor: tokens.neutralSurface,
            borderColor: tokens.neutralBorder,
          }}
        >
          <div className="flex flex-col gap-2">
            {actions.map((action) => {
              const bg = resolveActionBgColor(action.bgColor, tokens, 'stack');
              const text = getAPCATextColor(bg, 14, 600);

              return (
                <a
                  key={action.key}
                  {...getLinkProps(action.url)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl transition-transform"
                  style={{
                    backgroundColor: bg,
                    color: text,
                  }}
                  aria-label={action.label || action.icon}
                >
                  {getIconNode(action.icon, 16)}
                </a>
              );
            })}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label="Toggle menu"
        className="flex h-9 w-9 items-center justify-center rounded-full shadow-sm"
        style={{
          backgroundColor: tokens.mainButtonBg,
          color: tokens.mainButtonText,
        }}
      >
        <Plus className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-45' : ''}`} />
      </button>
    </div>
  );
};

const renderDock = ({
  actions,
  isRight,
  tokens,
  context,
  groupLabel,
  isOpen,
  onToggle,
  showBackToTop,
  onBackToTop,
}: {
  actions: SpeedDialRenderableAction[];
  isRight: boolean;
  tokens: SpeedDialColorTokens;
  context: SpeedDialSectionContext;
  groupLabel: string;
  isOpen: boolean;
  onToggle: () => void;
  showBackToTop: boolean;
  onBackToTop: () => void;
}) => {
  const siteRight = isRight ? 'right-[2px] md:right-0' : 'left-0';
  const previewRight = isRight ? (showBackToTop ? 'right-3' : 'right-1') : (showBackToTop ? 'left-3' : 'left-1');
  const wrapperClass = context === 'site'
    ? `fixed bottom-4 z-50 flex items-center gap-2 ${siteRight} ${isRight ? '' : 'flex-row-reverse'}`
    : `absolute bottom-3 z-30 flex items-center gap-2 ${previewRight} ${isRight ? '' : 'flex-row-reverse'}`;

  const actionNodes = actions.map((action) => {
    const bg = resolveActionBgColor(action.bgColor, tokens, 'dock');
    const text = getAPCATextColor(bg, 14, 600);

    return (
      <a
        key={action.key}
        {...getLinkProps(action.url)}
        className="group relative w-9 h-9 rounded-full flex items-center justify-center transition-transform border backdrop-blur-sm"
        style={{
          backgroundColor: bg,
          color: text,
          borderColor: tokens.actionStyleBorder.dock,
        }}
        aria-label={action.label || action.icon}
      >
        {getIconNode(action.icon, 16)}
        {action.label && (
          <span
            className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-[11px] rounded-md shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
            style={{ backgroundColor: tokens.labelPillBg, color: tokens.labelPillText }}
          >
            {action.label}
          </span>
        )}
      </a>
    );
  });

  return (
    <div className={wrapperClass} role="group" aria-label={groupLabel}>
      {showBackToTop && (
        <button
          type="button"
          onClick={onBackToTop}
          className="flex h-8 w-8 items-center justify-center rounded-full border"
          style={{
            backgroundColor: tokens.neutralSurface,
            borderColor: tokens.neutralBorder,
            color: tokens.bodyText,
          }}
          aria-label="Lên đầu trang"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
      )}
      {isOpen && (isRight ? actionNodes : [...actionNodes].reverse())}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label="Toggle menu"
        className="w-9 h-9 rounded-full shadow-sm border flex items-center justify-center"
        style={{
          backgroundColor: tokens.mainButtonBg,
          color: tokens.mainButtonText,
          borderColor: tokens.mainButtonRing,
        }}
      >
        <Plus className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-45' : ''}`} />
      </button>
    </div>
  );
};

const renderMinimal = ({
  actions,
  isRight,
  tokens,
  context,
  groupLabel,
  isOpen,
  onToggle,
  showBackToTop,
  onBackToTop,
}: {
  actions: SpeedDialRenderableAction[];
  isRight: boolean;
  tokens: SpeedDialColorTokens;
  context: SpeedDialSectionContext;
  groupLabel: string;
  isOpen: boolean;
  onToggle: () => void;
  showBackToTop: boolean;
  onBackToTop: () => void;
}) => {
  const siteRight = isRight ? 'right-[2px] md:right-0' : 'left-0';
  const previewRight = isRight ? (showBackToTop ? 'right-3' : 'right-1') : (showBackToTop ? 'left-3' : 'left-1');
  const wrapperClass = context === 'site'
    ? `fixed bottom-4 z-50 ${siteRight}`
    : `absolute bottom-3 z-30 ${previewRight}`;

  return (
    <div
      className={wrapperClass}
      role="group"
      aria-label={groupLabel}
    >
      <div
        className="flex flex-col-reverse items-center gap-2 rounded-full border px-1.5 py-1.5 shadow-lg backdrop-blur-xl"
        style={{
          backgroundColor: tokens.glassSurface,
          borderColor: tokens.glassBorder,
        }}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-label="Toggle menu"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{
            backgroundColor: tokens.bodyText,
            color: tokens.neutralSurface,
          }}
        >
          <Plus className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-45' : ''}`} />
        </button>
        {showBackToTop && (
          <button
            type="button"
            onClick={onBackToTop}
            className="flex h-8 w-8 items-center justify-center rounded-full border"
            style={{
              backgroundColor: tokens.neutralSurface,
              borderColor: tokens.neutralBorder,
              color: tokens.bodyText,
            }}
            aria-label="Lên đầu trang"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        )}
        {isOpen && (
          <div className="flex flex-col-reverse gap-2">
            {actions.map((action) => {
              const bg = resolveActionBgColor(action.bgColor, tokens, 'minimal');
              const text = getAPCATextColor(bg, 14, 600);

              return (
                <a
                  key={action.key}
                  {...getLinkProps(action.url)}
                  className="group relative h-9 w-9 shrink-0 items-center justify-center rounded-full border shadow-sm flex"
                  style={{
                    backgroundColor: bg,
                    color: text,
                    borderColor: tokens.actionStyleBorder.minimal,
                  }}
                  aria-label={action.label || action.icon}
                >
                  {getIconNode(action.icon, 16)}
                  {action.label && (
                    <span
                      className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-[11px] rounded-md shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                      style={{ backgroundColor: tokens.labelPillBg, color: tokens.labelPillText }}
                    >
                      {action.label}
                    </span>
                  )}
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const SpeedDialSectionContent = ({
  actions,
  style,
  position,
  tokens,
  context,
  groupLabel,
  isOpen,
  onToggle,
  showBackToTop,
  onBackToTop,
}: {
  actions: SpeedDialRenderableAction[];
  style: SpeedDialStyle;
  position: SpeedDialPosition;
  tokens: SpeedDialColorTokens;
  context: SpeedDialSectionContext;
  groupLabel: string;
  isOpen: boolean;
  onToggle: () => void;
  showBackToTop: boolean;
  onBackToTop: () => void;
}) => {
  const isRight = position !== 'bottom-left';

  if (actions.length === 0) {
    return context === 'preview' ? renderPageMock(tokens) : null;
  }

  const floating = (
    <>
      {style === 'fab' && renderFab({ actions, isRight, tokens, context, groupLabel, isOpen, onToggle, showBackToTop, onBackToTop })}
      {style === 'sidebar' && renderSidebar({ actions, isRight, tokens, context, groupLabel, isOpen, onToggle, showBackToTop, onBackToTop })}
      {style === 'pills' && renderPills({ actions, isRight, tokens, context, groupLabel, isOpen, onToggle, showBackToTop, onBackToTop })}
      {style === 'stack' && renderStack({ actions, isRight, tokens, context, groupLabel, isOpen, onToggle, showBackToTop, onBackToTop })}
      {style === 'dock' && renderDock({ actions, isRight, tokens, context, groupLabel, isOpen, onToggle, showBackToTop, onBackToTop })}
      {style === 'minimal' && renderMinimal({ actions, isRight, tokens, context, groupLabel, isOpen, onToggle, showBackToTop, onBackToTop })}
    </>
  );

  if (context === 'site') {
    return floating;
  }

  return (
    <div className="relative">
      {renderPageMock(tokens)}
      {floating}
    </div>
  );
};

export function SpeedDialSectionShared({
  actions,
  style,
  position,
  brandColor,
  secondary,
  mode,
  sectionTitle,
  context,
  defaultOpen = false,
  previewDevice = 'desktop',
  setPreviewDevice,
  includePreviewWrapper = false,
  previewStyle,
  onPreviewStyleChange,
}: SpeedDialSectionSharedProps) {
  const selectedStyle = previewStyle ?? style;
  const normalizedActions = React.useMemo(() => normalizeSpeedDialActions(actions), [actions]);
  const resolvedSectionTitle = sectionTitle.trim().length > 0 ? sectionTitle : 'Speed Dial';
  const tokens = React.useMemo(() => getSpeedDialColorTokens({
    primary: brandColor,
    secondary,
    mode,
  }), [brandColor, secondary, mode]);
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    setIsOpen(defaultOpen);
  }, [defaultOpen]);

  React.useEffect(() => {
    if (typeof window === 'undefined') {return;}

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 120);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleBackToTop = () => {
    if (typeof window === 'undefined') {return;}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const showBackToTop = context === 'preview' ? false : isScrolled;
  if (!includePreviewWrapper || context === 'site') {
    return (
      <SpeedDialSectionContent
        actions={normalizedActions}
        style={selectedStyle}
        position={position}
        tokens={tokens}
        context={context}
        groupLabel={resolvedSectionTitle}
        isOpen={isOpen}
        onToggle={() => { setIsOpen((prev) => !prev); }}
        showBackToTop={showBackToTop}
        onBackToTop={handleBackToTop}
      />
    );
  }

  const info = getStyleInfo(selectedStyle, normalizedActions.length, mode, context, previewDevice);

  return (
    <>
      <PreviewWrapper
        title="Preview Speed Dial"
        device={previewDevice}
        setDevice={(nextDevice) => { setPreviewDevice?.(nextDevice); }}
        previewStyle={selectedStyle}
        setPreviewStyle={(nextStyle) => { onPreviewStyleChange?.(nextStyle as SpeedDialStyle); }}
        styles={SPEED_DIAL_STYLES}
        info={info}
        deviceWidthClass={deviceWidths[previewDevice]}
      >
        <BrowserFrame>
          <SpeedDialSectionContent
            actions={normalizedActions}
            style={selectedStyle}
            position={position}
            tokens={tokens}
            context="preview"
            groupLabel={resolvedSectionTitle}
            isOpen={isOpen}
            onToggle={() => { setIsOpen((prev) => !prev); }}
            showBackToTop={showBackToTop}
            onBackToTop={handleBackToTop}
          />
        </BrowserFrame>
      </PreviewWrapper>

      {mode === 'dual' ? (
        <ColorInfoPanel
          brandColor={tokens.primary}
          secondary={tokens.secondary}
          description="Màu phụ được áp dụng cho action button, border ngăn cách và accent hover của Speed Dial."
        />
      ) : (
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
            Chế độ 1 màu: các action Speed Dial tự động dùng monochromatic theo màu chính.
          </p>
        </div>
      )}
    </>
  );
}
