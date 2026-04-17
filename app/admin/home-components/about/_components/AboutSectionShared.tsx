'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Image as ImageIcon, Plus } from 'lucide-react';
import { cn } from '../../../components/ui';
import type { PreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import type { AboutBrandMode, AboutPersistStat, AboutStyle } from '../_types';
import type { AboutColorTokens } from '../_lib/colors';

type AboutSectionContext = 'preview' | 'site';

export interface AboutSectionSharedProps {
  context: AboutSectionContext;
  mode: AboutBrandMode;
  style: AboutStyle;
  title: string;
  subHeading?: string;
  heading?: string;
  description?: string;
  image?: string;
  imageCaption?: string;
  buttonText?: string;
  buttonLink?: string;
  stats: AboutPersistStat[];
  tokens: AboutColorTokens;
  device?: PreviewDevice;
  imagePriority?: boolean;
}

const sanitizeText = (value?: string) => (typeof value === 'string' ? value : '').trim();

const AboutImage = ({
  src,
  alt,
  className,
  context,
  imagePriority,
}: {
  src: string;
  alt: string;
  className: string;
  context: AboutSectionContext;
  imagePriority: boolean;
}) => {
  if (!src.trim()) {
    return null;
  }

  if (context === 'preview') {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={imagePriority ? 'eager' : 'lazy'}
    />
  );
};

const AboutButton = ({
  context,
  href,
  text,
  className,
  style,
  withArrow = false,
}: {
  context: AboutSectionContext;
  href: string;
  text: string;
  className: string;
  style: React.CSSProperties;
  withArrow?: boolean;
}) => {
  if (context === 'site') {
    return (
      <Link href={href} className={className} style={style}>
        <span>{text}</span>
        {withArrow ? <ArrowRight size={16} /> : null}
      </Link>
    );
  }

  return (
    <span className={className} style={style}>
      <span>{text}</span>
      {withArrow ? <ArrowRight size={16} /> : null}
    </span>
  );
};

export function AboutSectionShared({
  context,
  mode,
  style,
  title,
  subHeading,
  heading,
  description,
  image,
  imageCaption,
  buttonText,
  buttonLink,
  stats,
  tokens,
  device = 'desktop',
  imagePriority = false,
}: AboutSectionSharedProps) {
  const isPreview = context === 'preview';
  const isMobilePreview = isPreview && device === 'mobile';
  const _isTabletPreview = isPreview && device === 'tablet';

  const resolvedHeading = sanitizeText(heading) || sanitizeText(title) || 'Về chúng tôi';
  const resolvedDescription = sanitizeText(description);
  const resolvedSubHeading = sanitizeText(subHeading);
  const resolvedCaption = sanitizeText(imageCaption) || 'Kiến tạo không gian làm việc hiện đại & bền vững.';
  const resolvedButtonText = sanitizeText(buttonText);
  const resolvedButtonLink = sanitizeText(buttonLink) || '/about';
  const visibleStats = stats.filter((stat) => sanitizeText(stat.value) || sanitizeText(stat.label));

  const brandInfo = mode === 'single' ? '1 màu (single)' : '2 màu (dual)';

  const renderBadge = () => {
    if (!resolvedSubHeading) {return null;}

    return (
      <span
        className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide"
        style={{
          backgroundColor: tokens.badgeBg,
          borderColor: tokens.badgeBorder,
          color: tokens.badgeText,
        }}
      >
        {resolvedSubHeading}
      </span>
    );
  };

  const renderEmptyImage = (size = 44) => (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ backgroundColor: tokens.imageFallbackBg }}
    >
      <ImageIcon size={size} style={{ color: tokens.imageFallbackIcon }} />
    </div>
  );

  const renderStatCard = (stat: AboutPersistStat, index: number, variant: 'inline' | 'card' | 'timeline' | 'showcase') => {
    const value = sanitizeText(stat.value) || '0';
    const label = sanitizeText(stat.label) || 'Thông tin';

    if (variant === 'inline') {
      return (
        <div key={`${label}-${index}`} className="flex flex-col">
          <span className="text-2xl md:text-3xl font-bold" style={{ color: tokens.statSecondaryValue }}>{value}</span>
          <span className="text-xs" style={{ color: tokens.statSecondaryLabel }}>{label}</span>
        </div>
      );
    }

    if (variant === 'timeline') {
      return (
        <div
          key={`${label}-${index}`}
          className={cn(
            'relative flex',
            isPreview
              ? (isMobilePreview ? 'pl-12' : (index % 2 === 0 ? 'md:flex-row-reverse' : ''))
              : (index % 2 === 0 ? 'md:flex-row-reverse' : ''),
          )}
        >
          <div
            className={cn(
              'absolute w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold',
              isPreview && isMobilePreview ? 'left-0' : 'left-4 md:left-1/2 md:-translate-x-1/2',
            )}
            style={{
              backgroundColor: tokens.timelineDotBg,
              borderColor: tokens.neutralBorder,
              color: tokens.timelineDotText,
            }}
          >
            {index + 1}
          </div>

          <div
            className={cn(
              'rounded-xl border p-4',
              isPreview && isMobilePreview ? 'w-full' : 'ml-16 md:ml-0 md:w-5/12',
            )}
            style={{
              backgroundColor: tokens.neutralSurface,
              borderColor: tokens.statCardBorder,
            }}
          >
            <span className="text-2xl font-bold" style={{ color: tokens.statSecondaryValue }}>{value}</span>
            <p className="text-sm mt-1" style={{ color: tokens.statSecondaryLabel }}>{label}</p>
          </div>
        </div>
      );
    }

    if (variant === 'showcase') {
      return (
        <div
          key={`${label}-${index}`}
          className="rounded-xl border p-4 flex flex-col justify-center text-center"
          style={{
            backgroundColor: index === 0 ? tokens.ctaSolidBg : tokens.neutralSurface,
            borderColor: index === 0 ? tokens.ctaSolidBg : tokens.statCardBorder,
          }}
        >
          <span
            className={cn('font-bold mb-1', isPreview && isMobilePreview ? 'text-2xl' : 'text-3xl')}
            style={{ color: index === 0 ? tokens.ctaSolidText : tokens.statSecondaryValue }}
          >
            {value}
          </span>
          <span
            className="text-xs font-medium"
            style={{ color: index === 0 ? tokens.ctaSolidText : tokens.statSecondaryLabel }}
          >
            {label}
          </span>
        </div>
      );
    }

    return (
      <div
        key={`${label}-${index}`}
        className="rounded-xl border p-4"
        style={{
          backgroundColor: tokens.statCardBg,
          borderColor: tokens.statCardBorder,
        }}
      >
        <span className="text-2xl md:text-3xl font-bold" style={{ color: tokens.statPrimaryValue }}>{value}</span>
        <p className="text-sm mt-1" style={{ color: tokens.statPrimaryLabel }}>{label}</p>
      </div>
    );
  };

  const renderClassic = () => (
    <section className={cn('py-10 md:py-16', isPreview ? (isMobilePreview ? 'px-4' : 'px-6 md:px-8') : 'px-4 md:px-8')}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-center">
        <div className={cn('relative rounded-2xl overflow-hidden aspect-[4/3]', isPreview && isMobilePreview ? 'order-2' : 'order-1')}>
          {sanitizeText(image)
            ? (
              <AboutImage
                src={sanitizeText(image)}
                alt={resolvedHeading}
                className="w-full h-full object-cover"
                context={context}
                imagePriority={imagePriority}
              />
            )
            : renderEmptyImage(48)}
        </div>

        <div className={cn('flex flex-col justify-center space-y-8 md:space-y-10', isPreview && isMobilePreview ? 'order-1' : 'order-2')}>
          <div className="space-y-4 md:space-y-6">
            {renderBadge()}
            <h2
              className={cn('font-bold tracking-tight leading-[1.1]', isPreview && isMobilePreview ? 'text-3xl' : 'text-4xl md:text-5xl lg:text-6xl')}
              style={{ color: tokens.heading }}
            >
              {resolvedHeading}
            </h2>
            {resolvedDescription ? (
              <p
                className={cn('leading-relaxed', isPreview && isMobilePreview ? 'text-base' : 'text-lg md:text-xl')}
                style={{ color: tokens.bodyText }}
              >
                {resolvedDescription}
              </p>
            ) : null}
          </div>

          {visibleStats.length > 0 ? (
            <div className="flex flex-row gap-6 md:gap-12 border-t pt-6 md:pt-8" style={{ borderColor: tokens.neutralBorder }}>
              {visibleStats.slice(0, 2).map((stat, index) => renderStatCard(stat, index, 'inline'))}
            </div>
          ) : null}

          {resolvedButtonText ? (
            <AboutButton
              context={context}
              href={resolvedButtonLink}
              text={resolvedButtonText}
              withArrow
              className="inline-flex items-center gap-2 text-lg font-semibold"
              style={{ color: tokens.primary }}
            />
          ) : null}
        </div>
      </div>
    </section>
  );

  const renderBento = () => (
    <section className={cn('py-8 md:py-12', isPreview ? (isMobilePreview ? 'px-3' : 'px-4 md:px-8') : 'px-4 md:px-8')}>
      <div className="max-w-7xl mx-auto rounded-3xl p-4 md:p-8" style={{ backgroundColor: tokens.sectionAltBg }}>
        <div className={cn('grid gap-4 md:gap-6', isPreview && isMobilePreview ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3')}>
          <div className={cn('rounded-2xl border p-6 md:p-8 lg:p-12 flex flex-col justify-center space-y-4 md:space-y-6', isPreview && isMobilePreview ? '' : 'md:col-span-2')} style={{ backgroundColor: tokens.neutralSurface, borderColor: tokens.neutralBorder }}>
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: tokens.primary }} />
                <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: tokens.secondary }}>
                  {resolvedSubHeading || 'Câu chuyện thương hiệu'}
                </span>
              </div>
              <h2 className={cn('font-bold', isPreview && isMobilePreview ? 'text-2xl' : 'text-3xl md:text-4xl lg:text-5xl')} style={{ color: tokens.heading }}>
                {resolvedHeading}
              </h2>
              {resolvedDescription ? <p style={{ color: tokens.bodyText }}>{resolvedDescription}</p> : null}
            </div>

            {resolvedButtonText ? (
              <AboutButton
                context={context}
                href={resolvedButtonLink}
                text={resolvedButtonText}
                withArrow
                className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 font-medium"
                style={{
                  color: tokens.ctaOutlineText,
                  borderColor: tokens.ctaOutlineBorder,
                  backgroundColor: tokens.ctaOutlineBg,
                }}
              />
            ) : null}
          </div>

          <div className={cn('grid gap-3 md:gap-6', isPreview && isMobilePreview ? 'grid-cols-2' : 'grid-cols-1')}>
            {visibleStats.slice(0, 2).map((stat, index) => renderStatCard(stat, index, 'card'))}
          </div>

          <div className={cn('rounded-2xl overflow-hidden relative', isPreview && isMobilePreview ? 'h-48' : 'md:col-span-3 h-48 md:h-64 lg:h-80')}>
            {sanitizeText(image)
              ? (
                <>
                  <AboutImage
                    src={sanitizeText(image)}
                    alt={resolvedHeading}
                    className="w-full h-full object-cover"
                    context={context}
                    imagePriority={imagePriority}
                  />
                  <div className="absolute inset-0 flex items-end p-6 md:p-8 bg-gradient-to-t from-slate-900/75 to-transparent">
                    <p className="font-medium text-base md:text-lg" style={{ color: tokens.imageOverlayText }}>
                      {resolvedCaption}
                    </p>
                  </div>
                </>
              )
              : renderEmptyImage(48)}
          </div>
        </div>
      </div>
    </section>
  );

  const renderMinimal = () => (
    <section className={cn('py-8 md:py-12', isPreview ? (isMobilePreview ? 'px-3' : 'px-4 md:px-8') : 'px-4 md:px-8')}>
      <div className="max-w-6xl mx-auto rounded-xl border overflow-hidden" style={{ borderColor: tokens.neutralBorder, backgroundColor: tokens.neutralSurface }}>
        <div className={cn('flex h-full min-h-[400px] md:min-h-[500px]', isPreview && isMobilePreview ? 'flex-col' : 'flex-col lg:flex-row')}>
          <div className="flex-1 p-6 md:p-10 lg:p-16 flex flex-col justify-center border-b lg:border-b-0 lg:border-r" style={{ borderColor: tokens.neutralBorder }}>
            <div className="max-w-xl space-y-6 md:space-y-8">
              {renderBadge()}

              <div className="space-y-3 md:space-y-4">
                <h2 className={cn('font-semibold tracking-tight', isPreview && isMobilePreview ? 'text-2xl' : 'text-3xl md:text-4xl')} style={{ color: tokens.heading }}>
                  {resolvedHeading}
                </h2>
                {resolvedDescription ? (
                  <p className={cn('leading-relaxed', isPreview && isMobilePreview ? 'text-base' : 'text-lg')} style={{ color: tokens.bodyText }}>
                    {resolvedDescription}
                  </p>
                ) : null}
              </div>

              {visibleStats.length > 0 ? (
                <div className="flex gap-6 md:gap-8 py-4">
                  {visibleStats.slice(0, 2).map((stat, index) => renderStatCard(stat, index, 'inline'))}
                </div>
              ) : null}

              {resolvedButtonText ? (
                <AboutButton
                  context={context}
                  href={resolvedButtonLink}
                  text={resolvedButtonText}
                  className="inline-flex h-12 px-6 rounded-md font-medium items-center justify-center"
                  style={{
                    backgroundColor: tokens.ctaSolidBg,
                    color: tokens.ctaSolidText,
                  }}
                />
              ) : null}
            </div>
          </div>

          <div className={cn('relative', isPreview && isMobilePreview ? 'h-64' : 'h-64 lg:h-auto lg:w-[45%]')} style={{ backgroundColor: tokens.imageFallbackBg }}>
            {sanitizeText(image)
              ? (
                <AboutImage
                  src={sanitizeText(image)}
                  alt={resolvedHeading}
                  className="absolute inset-0 w-full h-full object-cover"
                  context={context}
                  imagePriority={imagePriority}
                />
              )
              : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImageIcon size={48} style={{ color: tokens.imageFallbackIcon }} />
                </div>
              )}
          </div>
        </div>
      </div>
    </section>
  );

  const renderSplit = () => (
    <section className="relative w-full overflow-hidden" style={{ backgroundColor: tokens.sectionBg }}>
      <div className={cn('flex', isPreview && isMobilePreview ? 'flex-col' : 'flex-col md:flex-row md:min-h-[450px] lg:min-h-[500px]')}>
        <div className={cn('flex flex-col justify-center', isPreview && isMobilePreview ? 'p-6 order-2' : 'w-full md:w-1/2 p-6 md:p-10 lg:p-16 order-2 md:order-1')} style={{ backgroundColor: tokens.sectionAltBg }}>
          <div className={cn('space-y-4', isPreview && isMobilePreview ? '' : 'max-w-md')}>
            {renderBadge()}
            <h2 className={cn('font-bold leading-tight', isPreview && isMobilePreview ? 'text-xl' : 'text-2xl lg:text-3xl')} style={{ color: tokens.heading }}>
              {resolvedHeading}
            </h2>
            {resolvedDescription ? <p className="leading-relaxed" style={{ color: tokens.bodyText }}>{resolvedDescription}</p> : null}

            {visibleStats.length > 0 ? (
              <div className="flex gap-6 pt-4 border-t" style={{ borderColor: tokens.neutralBorder }}>
                {visibleStats.slice(0, 2).map((stat, index) => renderStatCard(stat, index, 'inline'))}
              </div>
            ) : null}

            {resolvedButtonText ? (
              <AboutButton
                context={context}
                href={resolvedButtonLink}
                text={resolvedButtonText}
                className="inline-flex px-6 py-2.5 rounded-lg font-medium items-center justify-center"
                style={{
                  backgroundColor: tokens.ctaSolidBg,
                  color: tokens.ctaSolidText,
                }}
              />
            ) : null}
          </div>
        </div>

        <div className={cn('relative overflow-hidden', isPreview && isMobilePreview ? 'w-full h-[220px] order-1' : 'w-full md:w-1/2 h-[250px] md:h-auto order-1 md:order-2')}>
          {sanitizeText(image)
            ? (
              <AboutImage
                src={sanitizeText(image)}
                alt={resolvedHeading}
                className="w-full h-full object-cover"
                context={context}
                imagePriority={imagePriority}
              />
            )
            : renderEmptyImage(40)}
        </div>
      </div>
    </section>
  );

  const renderTimeline = () => (
    <section className={cn('py-10 md:py-16', isPreview ? (isMobilePreview ? 'px-4' : 'px-6 md:px-8') : 'px-4 md:px-8')}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          {resolvedSubHeading ? <div className="flex justify-center mb-3">{renderBadge()}</div> : null}
          <h2 className={cn('font-bold', isPreview && isMobilePreview ? 'text-xl' : 'text-2xl md:text-3xl')} style={{ color: tokens.heading }}>
            {resolvedHeading}
          </h2>
          {resolvedDescription ? (
            <p className="mt-2 max-w-2xl mx-auto text-sm" style={{ color: tokens.bodyText }}>
              {resolvedDescription}
            </p>
          ) : null}
        </div>

        <div className="relative">
          <div
            className={cn('absolute top-0 bottom-0 w-0.5', isPreview && isMobilePreview ? 'left-4' : 'left-4 md:left-1/2 md:-translate-x-px')}
            style={{ backgroundColor: tokens.timelineLine }}
          />

          <div className="space-y-8">
            {visibleStats.slice(0, 4).map((stat, index) => renderStatCard(stat, index, 'timeline'))}
          </div>
        </div>

        {sanitizeText(image) ? (
          <div className="mt-10 rounded-2xl overflow-hidden aspect-[16/9] max-h-[320px] mx-auto max-w-4xl">
            <AboutImage
              src={sanitizeText(image)}
              alt={resolvedHeading}
              className="w-full h-full object-cover"
              context={context}
              imagePriority={imagePriority}
            />
          </div>
        ) : null}

        {resolvedButtonText ? (
          <div className="text-center mt-8">
            <AboutButton
              context={context}
              href={resolvedButtonLink}
              text={resolvedButtonText}
              className="inline-flex px-6 py-2.5 rounded-lg font-medium items-center justify-center"
              style={{
                backgroundColor: tokens.ctaSolidBg,
                color: tokens.ctaSolidText,
              }}
            />
          </div>
        ) : null}
      </div>
    </section>
  );

  const renderShowcase = () => (
    <section className={cn('py-8 md:py-12', isPreview ? (isMobilePreview ? 'px-3' : 'px-6') : 'px-4 md:px-8')}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          {resolvedSubHeading ? (
            <span
              className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-3"
              style={{
                backgroundColor: tokens.badgeBg,
                border: `1px solid ${tokens.badgeBorder}`,
                color: tokens.badgeText,
              }}
            >
              {resolvedSubHeading}
            </span>
          ) : null}
          <h2 className={cn('font-bold mb-2', isPreview && isMobilePreview ? 'text-xl' : 'text-2xl md:text-3xl')} style={{ color: tokens.heading }}>
            {resolvedHeading}
          </h2>
          {resolvedDescription ? (
            <p className="max-w-2xl mx-auto text-sm" style={{ color: tokens.bodyText }}>
              {resolvedDescription}
            </p>
          ) : null}
        </div>

        <div className={cn('grid gap-4', isPreview && isMobilePreview ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2 gap-5')}>
          <div className={cn('relative rounded-2xl overflow-hidden', isPreview && isMobilePreview ? 'aspect-[4/3]' : 'aspect-auto min-h-[320px]')}>
            {sanitizeText(image)
              ? (
                <>
                  <AboutImage
                    src={sanitizeText(image)}
                    alt={resolvedHeading}
                    className="w-full h-full object-cover"
                    context={context}
                    imagePriority={imagePriority}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
                </>
              )
              : renderEmptyImage(48)}

            {resolvedButtonText ? (
              <div className="absolute bottom-3 left-3 right-3">
                <AboutButton
                  context={context}
                  href={resolvedButtonLink}
                  text={resolvedButtonText}
                  withArrow
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                  style={{
                    backgroundColor: tokens.ctaSolidBg,
                    color: tokens.ctaSolidText,
                  }}
                />
              </div>
            ) : null}
          </div>

          <div className={cn('grid gap-3', isPreview && isMobilePreview ? 'grid-cols-2' : 'grid-cols-2 gap-4')}>
            {visibleStats.slice(0, 4).map((stat, index) => renderStatCard(stat, index, 'showcase'))}
            {visibleStats.length < 4
              ? Array.from({ length: 4 - visibleStats.length }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="rounded-xl border p-4 flex items-center justify-center"
                  style={{
                    backgroundColor: tokens.emptyStatBg,
                    borderColor: tokens.statCardBorder,
                  }}
                >
                  <Plus size={16} style={{ color: tokens.emptyStatIcon }} />
                </div>
              ))
              : null}
          </div>
        </div>
      </div>
    </section>
  );

  const renderEmpty = () => (
    <section className="py-16">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: tokens.emptyStatBg }}>
          <ImageIcon size={30} style={{ color: tokens.primary }} />
        </div>
        <h3 className="font-medium mb-1" style={{ color: tokens.bodyText }}>Chưa có nội dung</h3>
        <p className="text-sm" style={{ color: tokens.mutedText }}>Nhập tiêu đề và mô tả để bắt đầu</p>
      </div>
    </section>
  );

  const hasContent = resolvedHeading || resolvedDescription || sanitizeText(image) || visibleStats.length > 0;

  return (
    <div data-mode={mode} data-brand-info={brandInfo}>
      {!hasContent
        ? renderEmpty()
        : (
          <>
            {style === 'classic' && renderClassic()}
            {style === 'bento' && renderBento()}
            {style === 'minimal' && renderMinimal()}
            {style === 'split' && renderSplit()}
            {style === 'timeline' && renderTimeline()}
            {style === 'showcase' && renderShowcase()}
          </>
        )}
    </div>
  );
}
