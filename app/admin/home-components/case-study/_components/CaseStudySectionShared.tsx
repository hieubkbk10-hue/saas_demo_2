'use client';

import React from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, FileText, Image as ImageIcon, Plus } from 'lucide-react';
import { cn } from '../../../components/ui';
import { PreviewImage } from '../../_shared/components/PreviewImage';
import type { CaseStudyColorTokens } from '../_lib/colors';
import type { CaseStudyBrandMode, CaseStudyProject, CaseStudyStyle } from '../_types';

type CaseStudySharedContext = 'preview' | 'site';
type CaseStudyPreviewDevice = 'mobile' | 'tablet' | 'desktop';

interface CaseStudySectionSharedProps {
  projects: CaseStudyProject[];
  style: CaseStudyStyle;
  mode: CaseStudyBrandMode;
  tokens: CaseStudyColorTokens;
  context: CaseStudySharedContext;
  title?: string;
  device?: CaseStudyPreviewDevice;
}

const resolveViewport = (width: number): CaseStudyPreviewDevice => {
  if (width < 768) {return 'mobile';}
  if (width < 1024) {return 'tablet';}
  return 'desktop';
};

const sanitizeLink = (value?: string) => {
  const normalized = (value ?? '').trim();
  if (!normalized) {return '#';}

  if (
    normalized.startsWith('/')
    || normalized.startsWith('#')
    || normalized.startsWith('http://')
    || normalized.startsWith('https://')
    || normalized.startsWith('mailto:')
    || normalized.startsWith('tel:')
  ) {
    return normalized;
  }

  return '#';
};

const isExternalLink = (href: string) => href.startsWith('http://') || href.startsWith('https://');

const toProjectKey = (project: CaseStudyProject, idx: number) => `${project.id ?? 'project'}-${idx}`;

const toStyleTitle = (value: CaseStudyStyle) => {
  if (value === 'masonry') {return 'Portfolio Masonry';}
  if (value === 'carousel') {return 'Portfolio Carousel';}
  if (value === 'timeline') {return 'Timeline Dự án';}
  if (value === 'featured') {return 'Dự án nổi bật';}
  if (value === 'list') {return 'Danh sách dự án';}
  return 'Dự án tiêu biểu';
};

export function CaseStudySectionShared({
  projects,
  style,
  mode,
  tokens,
  context,
  title,
  device = 'desktop',
}: CaseStudySectionSharedProps) {
  const [carouselIndex, setCarouselIndex] = React.useState(0);
  const [siteViewport, setSiteViewport] = React.useState<CaseStudyPreviewDevice>('desktop');

  React.useEffect(() => {
    if (context === 'preview') {return;}

    const updateViewport = () => {
      setSiteViewport(resolveViewport(window.innerWidth));
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
    };
  }, [context]);

  const viewport = context === 'preview' ? device : siteViewport;

  React.useEffect(() => {
    setCarouselIndex(0);
  }, [style, viewport, projects.length]);

  const headingText = (title ?? '').trim() || toStyleTitle(style);
  const HeadingTag: React.ElementType = context === 'site' ? 'h2' : 'h3';

  const sectionClassName = context === 'preview'
    ? cn('px-4', viewport === 'mobile' ? 'py-4' : 'py-8')
    : 'py-12 md:py-16 px-4';

  const renderProjectImage = (project: CaseStudyProject, size = 32) => (
    <div
      className="w-full h-full flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: tokens.imageBackground }}
    >
      {project.image ? (
        context === 'preview'
          ? <PreviewImage src={project.image} alt={project.title || ''} className="w-full h-full object-cover" />
          : <img src={project.image} alt={project.title || ''} className="w-full h-full object-cover" loading="lazy" draggable={false} />
      ) : (
        <ImageIcon size={size} style={{ color: tokens.imageIcon }} />
      )}
    </div>
  );

  const renderBadge = (text: string) => (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-full w-fit"
      style={{ backgroundColor: tokens.badgeBackground, color: tokens.badgeText }}
    >
      {text || 'Category'}
    </span>
  );

  const wrapProject = ({
    project,
    idx,
    className,
    style,
    children,
  }: {
    project: CaseStudyProject;
    idx: number;
    className: string;
    style?: React.CSSProperties;
    children: React.ReactNode;
  }) => {
    const key = toProjectKey(project, idx);

    if (context === 'site') {
      const href = sanitizeLink(project.link);
      const external = isExternalLink(href);

      return (
        <a
          key={key}
          href={href}
          className={cn(className, 'no-underline text-inherit')}
          style={style}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
        >
          {children}
        </a>
      );
    }

    return (
      <div key={key} className={className} style={style}>
        {children}
      </div>
    );
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: tokens.neutralBackground }}
      >
        <FileText size={32} style={{ color: tokens.imageIcon }} />
      </div>
      <HeadingTag className="font-medium mb-1" style={{ color: tokens.neutralText }}>
        Chưa có dự án nào
      </HeadingTag>
      <p className="text-sm" style={{ color: tokens.mutedText }}>Thêm dự án đầu tiên để bắt đầu</p>
    </div>
  );

  const renderGridStyle = () => {
    const maxVisible = context === 'preview'
      ? (viewport === 'mobile' ? 4 : (viewport === 'tablet' ? 6 : 9))
      : projects.length;
    const visibleProjects = projects.slice(0, maxVisible);
    const remainingCount = projects.length - visibleProjects.length;

    return (
      <section className={sectionClassName} data-mode={mode}>
        <HeadingTag
          className={cn('font-bold text-center mb-6', viewport === 'mobile' ? 'text-lg' : 'text-xl')}
          style={{ color: tokens.heading }}
        >
          {headingText}
        </HeadingTag>

        {projects.length === 0 ? renderEmptyState() : (
          <div className="max-w-6xl mx-auto">
            <div className={cn(
              'grid',
              viewport === 'mobile'
                ? 'grid-cols-1 gap-3'
                : (viewport === 'tablet' ? 'grid-cols-2 gap-4' : 'grid-cols-3 gap-6'),
            )}
            >
              {visibleProjects.map((project, idx) => wrapProject({
                project,
                idx,
                className: 'rounded-xl overflow-hidden border block',
                style: { borderColor: tokens.cardBorder },
                children: (
                  <article
                    className="h-full"
                    style={{ backgroundColor: tokens.neutralSurface, borderColor: tokens.cardBorder }}
                  >
                    <div className="aspect-[3/2]">
                      {renderProjectImage(project, 32)}
                    </div>
                    <div className={cn('flex flex-col h-full', viewport === 'mobile' ? 'p-3' : 'p-4')}>
                      {renderBadge(project.category)}
                      <h3 className="font-semibold mt-2 mb-1 line-clamp-2 min-h-[3rem]" style={{ color: tokens.neutralText }}>
                        {project.title || 'Tên dự án'}
                      </h3>
                      <p className="text-xs line-clamp-2 min-h-[2.5rem]" style={{ color: tokens.mutedText }}>
                        {project.description || 'Mô tả dự án...'}
                      </p>
                      <div className="mt-3 flex items-center gap-1 text-sm font-medium" style={{ color: tokens.actionText }}>
                        Xem chi tiết <ArrowRight size={14} />
                      </div>
                    </div>
                  </article>
                ),
              }))}

              {context === 'preview' && remainingCount > 0 ? (
                <div
                  className="flex items-center justify-center rounded-xl aspect-square border"
                  style={{ backgroundColor: tokens.neutralBackground, borderColor: tokens.neutralBorder }}
                >
                  <div className="text-center">
                    <Plus size={32} className="mx-auto mb-2" style={{ color: tokens.mutedText }} />
                    <span className="text-lg font-bold" style={{ color: tokens.neutralText }}>+{remainingCount}</span>
                    <p className="text-xs" style={{ color: tokens.mutedText }}>dự án khác</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </section>
    );
  };

  const renderFeaturedStyle = () => {
    const featured = projects[0];
    const others = projects.slice(1, 3);

    return (
      <section className={sectionClassName} data-mode={mode}>
        <HeadingTag
          className={cn('font-bold text-center mb-6', viewport === 'mobile' ? 'text-lg' : 'text-xl')}
          style={{ color: tokens.heading }}
        >
          {headingText}
        </HeadingTag>

        {projects.length === 0 ? renderEmptyState() : (
          <div className="max-w-6xl mx-auto">
            <div className={cn('grid gap-4', viewport === 'mobile' ? 'grid-cols-1' : 'grid-cols-2')}>
              {featured ? wrapProject({
                project: featured,
                idx: 0,
                className: cn('rounded-xl overflow-hidden border block', viewport === 'mobile' ? '' : 'row-span-2'),
                style: { borderColor: tokens.cardBorder },
                children: (
                  <article style={{ backgroundColor: tokens.neutralSurface, borderColor: tokens.cardBorder }}>
                    <div className="aspect-[3/2]">
                      {renderProjectImage(featured, 48)}
                    </div>
                    <div className="p-5">
                      {renderBadge(featured.category)}
                      <h3 className={cn('font-bold mt-2 mb-2', viewport === 'mobile' ? 'text-lg' : 'text-xl')} style={{ color: tokens.heading }}>
                        {featured.title || 'Dự án chính'}
                      </h3>
                      <p className="text-sm leading-relaxed" style={{ color: tokens.mutedText }}>
                        {featured.description || 'Mô tả dự án...'}
                      </p>
                    </div>
                  </article>
                ),
              }) : null}

              <div className="space-y-4">
                {others.map((project, idx) => wrapProject({
                  project,
                  idx: idx + 1,
                  className: 'rounded-xl p-4 border flex items-center gap-4 block',
                  style: { borderColor: tokens.cardBorder },
                  children: (
                    <article className="w-full flex items-center gap-4" style={{ backgroundColor: tokens.neutralSurface, borderColor: tokens.cardBorder }}>
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        {renderProjectImage(project, 24)}
                      </div>
                      <div className="flex-1 min-w-0">
                        {renderBadge(project.category)}
                        <h4 className="font-semibold text-sm mt-1 truncate" style={{ color: tokens.neutralText }}>
                          {project.title || 'Tên dự án'}
                        </h4>
                        <p className="text-xs mt-1 line-clamp-1" style={{ color: tokens.mutedText }}>
                          {project.description}
                        </p>
                      </div>
                    </article>
                  ),
                }))}
              </div>
            </div>
          </div>
        )}
      </section>
    );
  };

  const renderListStyle = () => {
    const maxVisible = context === 'preview'
      ? (viewport === 'mobile' ? 4 : 6)
      : projects.length;
    const visibleProjects = projects.slice(0, maxVisible);
    const remainingCount = projects.length - visibleProjects.length;

    return (
      <section className={sectionClassName} data-mode={mode}>
        <HeadingTag
          className={cn('font-bold text-center mb-6', viewport === 'mobile' ? 'text-lg' : 'text-xl')}
          style={{ color: tokens.heading }}
        >
          {headingText}
        </HeadingTag>

        {projects.length === 0 ? renderEmptyState() : (
          <div className="max-w-6xl mx-auto">
            <div className="space-y-3">
              {visibleProjects.map((project, idx) => wrapProject({
                project,
                idx,
                className: cn(
                  'rounded-xl overflow-hidden border flex block',
                  viewport === 'mobile' ? 'flex-col' : 'items-center',
                ),
                style: { borderColor: tokens.cardBorder },
                children: (
                  <article
                    className={cn('w-full flex', viewport === 'mobile' ? 'flex-col' : 'items-center')}
                    style={{ backgroundColor: tokens.neutralSurface, borderColor: tokens.cardBorder }}
                  >
                    <div className={cn(viewport === 'mobile' ? 'aspect-video w-full' : 'w-40 h-24 flex-shrink-0')}>
                      {renderProjectImage(project, 24)}
                    </div>
                    <div className="p-4 flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {renderBadge(project.category)}
                      </div>
                      <h3 className="font-semibold truncate" style={{ color: tokens.neutralText }}>
                        {project.title || 'Tên dự án'}
                      </h3>
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: tokens.mutedText }}>
                        {project.description || 'Mô tả...'}
                      </p>
                    </div>
                  </article>
                ),
              }))}
            </div>

            {context === 'preview' && remainingCount > 0 ? (
              <div className="text-center mt-4">
                <span className="text-sm font-medium" style={{ color: tokens.actionText }}>+{remainingCount} dự án khác</span>
              </div>
            ) : null}
          </div>
        )}
      </section>
    );
  };

  const renderMasonryStyle = () => {
    const maxVisible = context === 'preview'
      ? (viewport === 'mobile' ? 6 : 9)
      : projects.length;
    const visibleProjects = projects.slice(0, maxVisible);
    const remainingCount = projects.length - visibleProjects.length;

    return (
      <section className={sectionClassName} data-mode={mode}>
        <HeadingTag
          className={cn('font-bold text-center mb-6', viewport === 'mobile' ? 'text-lg' : 'text-xl')}
          style={{ color: tokens.heading }}
        >
          {headingText}
        </HeadingTag>

        {projects.length === 0 ? renderEmptyState() : (
          <div className="max-w-6xl mx-auto">
            <div className={cn('columns-1 gap-4', viewport === 'tablet' && 'columns-2', viewport === 'desktop' && 'columns-3')}>
              {visibleProjects.map((project, idx) => {
                const heights = ['aspect-[4/5]', 'aspect-[4/3]', 'aspect-square'];
                const height = heights[idx % 3];

                return wrapProject({
                  project,
                  idx,
                  className: 'break-inside-avoid mb-4 rounded-xl overflow-hidden border block',
                  style: { borderColor: tokens.cardBorder },
                  children: (
                    <article style={{ backgroundColor: tokens.neutralSurface, borderColor: tokens.cardBorder }}>
                      <div className={height}>{renderProjectImage(project, 32)}</div>
                      <div className="p-3">
                        {renderBadge(project.category)}
                        <h3 className="font-semibold text-sm mt-2 line-clamp-2" style={{ color: tokens.neutralText }}>
                          {project.title || 'Tên dự án'}
                        </h3>
                        <p className="text-xs mt-1 line-clamp-2" style={{ color: tokens.mutedText }}>
                          {project.description || 'Mô tả...'}
                        </p>
                      </div>
                    </article>
                  ),
                });
              })}
            </div>

            {context === 'preview' && remainingCount > 0 ? (
              <div className="text-center mt-6">
                <span className="text-sm font-medium" style={{ color: tokens.actionText }}>+{remainingCount} dự án khác</span>
              </div>
            ) : null}
          </div>
        )}
      </section>
    );
  };

  const renderCarouselStyle = () => {
    const itemsPerView = viewport === 'mobile' ? 1 : (viewport === 'tablet' ? 2 : 3);
    const maxIndex = Math.max(0, projects.length - itemsPerView);

    return (
      <section className={sectionClassName} data-mode={mode}>
        <HeadingTag
          className={cn('font-bold text-center mb-6', viewport === 'mobile' ? 'text-lg' : 'text-xl')}
          style={{ color: tokens.heading }}
        >
          {headingText}
        </HeadingTag>

        {projects.length === 0 ? renderEmptyState() : (
          <div className="max-w-6xl mx-auto relative">
            {projects.length > itemsPerView ? (
              <>
                <button
                  type="button"
                  onClick={() => { setCarouselIndex(Math.max(0, carouselIndex - 1)); }}
                  disabled={carouselIndex === 0}
                  className="absolute -left-2 md:-left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderColor: tokens.carouselArrowBorder }}
                  aria-label="Dự án trước"
                >
                  <ChevronLeft size={20} style={{ color: tokens.carouselArrowIcon }} />
                </button>
                <button
                  type="button"
                  onClick={() => { setCarouselIndex(Math.min(maxIndex, carouselIndex + 1)); }}
                  disabled={carouselIndex >= maxIndex}
                  className="absolute -right-2 md:-right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderColor: tokens.carouselArrowBorder }}
                  aria-label="Dự án sau"
                >
                  <ChevronRight size={20} style={{ color: tokens.carouselArrowIcon }} />
                </button>
              </>
            ) : null}

            <div className="overflow-hidden mx-4 md:mx-8">
              <div
                className="flex transition-transform duration-300 ease-out gap-4"
                style={{ transform: `translateX(-${carouselIndex * (100 / itemsPerView)}%)` }}
              >
                {projects.map((project, idx) => wrapProject({
                  project,
                  idx,
                  className: 'flex-shrink-0 rounded-xl overflow-hidden border block',
                  style: {
                    borderColor: tokens.cardBorder,
                    width: `calc(${100 / itemsPerView}% - ${(itemsPerView - 1) * 16 / itemsPerView}px)`,
                  },
                  children: (
                    <article style={{ backgroundColor: tokens.neutralSurface, borderColor: tokens.cardBorder }}>
                      <div className="aspect-[4/3]">{renderProjectImage(project, 32)}</div>
                      <div className="p-4">
                        {renderBadge(project.category)}
                        <h3 className="font-semibold mt-2 line-clamp-2 min-h-[3rem]" style={{ color: tokens.neutralText }}>
                          {project.title || 'Tên dự án'}
                        </h3>
                        <p className="text-xs mt-1 line-clamp-2 min-h-[2.5rem]" style={{ color: tokens.mutedText }}>
                          {project.description || 'Mô tả...'}
                        </p>
                      </div>
                    </article>
                  ),
                }))}
              </div>
            </div>

            {projects.length > itemsPerView ? (
              <div className="flex justify-center gap-2 mt-4">
                {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => { setCarouselIndex(idx); }}
                    className={cn('h-2 rounded-full transition-all', carouselIndex === idx ? 'w-6' : 'w-2')}
                    style={{ backgroundColor: carouselIndex === idx ? tokens.secondary : tokens.neutralBorder }}
                    aria-label={`Đi tới trang ${idx + 1}`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        )}
      </section>
    );
  };

  const renderTimelineStyle = () => {
    const maxVisible = context === 'preview'
      ? (viewport === 'mobile' ? 4 : 6)
      : projects.length;
    const visibleProjects = projects.slice(0, maxVisible);
    const remainingCount = projects.length - visibleProjects.length;

    return (
      <section className={sectionClassName} data-mode={mode}>
        <HeadingTag
          className={cn('font-bold text-center mb-6', viewport === 'mobile' ? 'text-lg' : 'text-xl')}
          style={{ color: tokens.heading }}
        >
          {headingText}
        </HeadingTag>

        {projects.length === 0 ? renderEmptyState() : (
          <div className="max-w-4xl mx-auto relative">
            <div
              className={cn('absolute top-0 bottom-0 w-0.5', viewport === 'mobile' ? 'left-4' : 'left-1/2 -translate-x-px')}
              style={{ backgroundColor: tokens.timelineLine }}
            />

            <div className="space-y-6 md:space-y-8">
              {visibleProjects.map((project, idx) => (
                <div
                  key={toProjectKey(project, idx)}
                  className={cn(
                    'relative flex items-start',
                    viewport === 'mobile' ? 'pl-12' : (idx % 2 === 0 ? 'flex-row' : 'flex-row-reverse'),
                  )}
                >
                  <div
                    className={cn(
                      'absolute w-8 h-8 rounded-full border-4 bg-white flex items-center justify-center text-xs font-bold z-10',
                      viewport === 'mobile' ? 'left-0' : 'left-1/2 -translate-x-1/2',
                    )}
                    style={{ borderColor: tokens.timelineDotBorder, color: tokens.timelineDotText }}
                  >
                    {idx + 1}
                  </div>

                  {wrapProject({
                    project,
                    idx,
                    className: cn('rounded-xl overflow-hidden border block', viewport === 'mobile' ? 'w-full' : 'w-5/12'),
                    style: { borderColor: tokens.cardBorder },
                    children: (
                      <article style={{ backgroundColor: tokens.neutralSurface, borderColor: tokens.cardBorder }}>
                        <div className="aspect-[4/3]">{renderProjectImage(project, 32)}</div>
                        <div className="p-4">
                          {renderBadge(project.category)}
                          <h3 className="font-bold mt-2 mb-1 line-clamp-2" style={{ color: tokens.neutralText }}>
                            {project.title || 'Tên dự án'}
                          </h3>
                          <p className="text-sm leading-relaxed line-clamp-3" style={{ color: tokens.mutedText }}>
                            {project.description || 'Mô tả...'}
                          </p>
                        </div>
                      </article>
                    ),
                  })}
                </div>
              ))}
            </div>

            {context === 'preview' && remainingCount > 0 ? (
              <div className="text-center mt-6">
                <span className="text-sm font-medium" style={{ color: tokens.actionText }}>+{remainingCount} dự án khác</span>
              </div>
            ) : null}
          </div>
        )}
      </section>
    );
  };

  if (style === 'grid') {return renderGridStyle();}
  if (style === 'featured') {return renderFeaturedStyle();}
  if (style === 'list') {return renderListStyle();}
  if (style === 'masonry') {return renderMasonryStyle();}
  if (style === 'carousel') {return renderCarouselStyle();}
  return renderTimelineStyle();
}
