'use client';

import React from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import { ArrowRight, ChevronLeft, ChevronRight, Eye, FileText, Monitor, Smartphone, Tablet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, cn } from '../../../components/ui';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import type { BlogPostItem } from './BlogForm';
import {
  getBlogColorTokens,
  getBlogValidationResult,
  type BlogBrandMode,
} from '../_lib/colors';
import type { BlogStyle } from '../_types';

interface BlogPreviewProps {
  brandColor: string;
  secondary: string;
  mode?: BlogBrandMode;
  postCount?: number;
  selectedStyle?: BlogStyle;
  onStyleChange?: (style: BlogStyle) => void;
  title?: string;
  previewItems?: BlogPostItem[];
  categoryMap?: Record<string, string>;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}

const styles = [
  { id: 'grid', label: 'Grid' },
  { id: 'list', label: 'List' },
  { id: 'featured', label: 'Featured' },
  { id: 'magazine', label: 'Magazine' },
  { id: 'carousel', label: 'Carousel' },
  { id: 'minimal', label: 'Minimal' },
] as const;

const devices = [
  { icon: Monitor, id: 'desktop' as const, label: 'Desktop (max-w-6xl)' },
  { icon: Tablet, id: 'tablet' as const, label: 'Tablet (768px)' },
  { icon: Smartphone, id: 'mobile' as const, label: 'Mobile (375px)' },
];

type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

const MOCK_POSTS: BlogPostItem[] = [
  {
    _id: '1',
    _creationTime: Date.now() - 8 * 24 * 60 * 60 * 1000,
    title: 'Xu hướng thiết kế web hiện đại năm 2026',
    excerpt: 'Những xu hướng thiết kế website nổi bật giúp tăng trải nghiệm người dùng và hiệu quả chuyển đổi.',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop',
    categoryId: 'cat-design',
    slug: 'xhu-thiet-ke-web-2026',
    status: 'Published',
    views: 324,
  },
  {
    _id: '2',
    _creationTime: Date.now() - 7 * 24 * 60 * 60 * 1000,
    title: 'Tối ưu SEO cho website doanh nghiệp',
    excerpt: 'Các chiến lược SEO on-page và technical SEO để website đạt thứ hạng cao trên Google.',
    thumbnail: 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800&h=500&fit=crop',
    categoryId: 'cat-seo',
    slug: 'toi-uu-seo-doanh-nghiep',
    status: 'Published',
    views: 280,
  },
  {
    _id: '3',
    _creationTime: Date.now() - 6 * 24 * 60 * 60 * 1000,
    title: 'React 19: Những tính năng mới cần biết',
    excerpt: 'Khám phá các cập nhật quan trọng trong React 19 và cách áp dụng vào dự án thực tế.',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=500&fit=crop',
    categoryId: 'cat-frontend',
    slug: 'react-19-tinh-nang-moi',
    status: 'Published',
    views: 520,
  },
  {
    _id: '4',
    _creationTime: Date.now() - 5 * 24 * 60 * 60 * 1000,
    title: 'Bảo mật website: 10 lỗi phổ biến cần tránh',
    excerpt: 'Những lỗ hổng bảo mật thường gặp và biện pháp phòng tránh hiệu quả cho website.',
    thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=500&fit=crop',
    categoryId: 'cat-security',
    slug: 'bao-mat-website-10-loi',
    status: 'Published',
    views: 410,
  },
  {
    _id: '5',
    _creationTime: Date.now() - 4 * 24 * 60 * 60 * 1000,
    title: 'Performance tối ưu: Core Web Vitals trong thực tế',
    excerpt: 'Hướng dẫn tối ưu LCP, FID, CLS để cải thiện trải nghiệm và SEO tổng thể.',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop',
    categoryId: 'cat-performance',
    slug: 'performance-core-web-vitals',
    status: 'Published',
    views: 365,
  },
  {
    _id: '6',
    _creationTime: Date.now() - 3 * 24 * 60 * 60 * 1000,
    title: 'Thiết kế landing page tăng tỷ lệ chuyển đổi',
    excerpt: 'Nguyên tắc thiết kế landing page hiệu quả cho chiến dịch marketing.',
    thumbnail: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&h=500&fit=crop',
    categoryId: 'cat-marketing',
    slug: 'landing-page-chuyen-doi',
    status: 'Published',
    views: 198,
  },
  {
    _id: '7',
    _creationTime: Date.now() - 2 * 24 * 60 * 60 * 1000,
    title: 'Hướng dẫn chọn hosting phù hợp cho doanh nghiệp',
    excerpt: 'So sánh shared hosting, VPS và cloud để chọn giải pháp phù hợp.',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=500&fit=crop',
    categoryId: 'cat-infra',
    slug: 'chon-hosting-doanh-nghiep',
    status: 'Published',
    views: 244,
  },
  {
    _id: '8',
    _creationTime: Date.now() - 1 * 24 * 60 * 60 * 1000,
    title: 'Chiến lược nội dung giúp tăng traffic tự nhiên',
    excerpt: 'Lập kế hoạch content marketing bền vững để thu hút khách hàng tiềm năng.',
    thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=500&fit=crop',
    categoryId: 'cat-content',
    slug: 'chien-luoc-noi-dung-traffic',
    status: 'Published',
    views: 169,
  },
];

export const BlogPreview = ({
  brandColor,
  secondary,
  mode = 'dual',
  postCount = 6,
  selectedStyle = 'grid',
  onStyleChange,
  title = 'Bài viết',
  previewItems,
  categoryMap,
  fontStyle,
  fontClassName,
}: BlogPreviewProps) => {
  const [device, setDevice] = React.useState<PreviewDevice>('desktop');

  const tokens = getBlogColorTokens({
    primary: brandColor,
    secondary,
    mode,
  });

  const validation = getBlogValidationResult({
    primary: brandColor,
    secondary,
    mode,
  });

  const displayPosts = React.useMemo(() => {
    if (previewItems && previewItems.length > 0) {
      return previewItems;
    }
    return MOCK_POSTS.slice(0, Math.max(postCount, 6));
  }, [previewItems, postCount]);

  const resolveCategory = React.useCallback((post: BlogPostItem) => {
    if (post.categoryId && categoryMap && categoryMap[post.categoryId]) {
      return categoryMap[post.categoryId];
    }
    return 'Tin tức';
  }, [categoryMap]);

  const resolveDate = React.useCallback((post: BlogPostItem) => (
    post.publishedAt
      ? new Date(post.publishedAt).toLocaleDateString('vi-VN')
      : new Date(post._creationTime).toLocaleDateString('vi-VN')
  ), []);

  const deviceWidthClass =
    device === 'desktop' ? 'max-w-6xl' : (device === 'tablet' ? 'max-w-[768px]' : 'max-w-[375px]');

  const warningMessages = React.useMemo(() => {
    if (mode === 'single') {
      return [] as string[];
    }

    const warnings: string[] = [];

    if (validation.harmonyStatus.isTooSimilar) {
      warnings.push(`Độ tương phản thương hiệu thấp (ΔE=${validation.harmonyStatus.deltaE}). Nên tăng khác biệt giữa màu chính và màu phụ.`);
    }

    if (validation.accessibility.failing.length > 0) {
      warnings.push(`Có ${validation.accessibility.failing.length} cặp màu chưa đạt APCA. minLc hiện tại: ${validation.accessibility.minLc.toFixed(1)}.`);
    }

    return warnings;
  }, [mode, validation]);

  const ImagePlaceholder = ({ size = 24 }: { size?: number }) => (
    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: tokens.imageFallbackBg }}>
      <FileText size={size} style={{ color: tokens.imageFallbackIcon }} />
    </div>
  );

  const renderGrid = () => (
    <section className="py-8 md:py-10 px-4" style={{ backgroundColor: tokens.sectionBg }}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6" style={{ color: tokens.heading }}>{title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {displayPosts.slice(0, 6).map((post) => (
            <article key={post._id} className="rounded-xl border overflow-hidden flex flex-col" style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBg }}>
              <div className="relative aspect-[16/10] overflow-hidden">
                {post.thumbnail ? (
                  <Image src={post.thumbnail} alt={post.title} fill className="object-cover" sizes="(min-width: 1024px) 33vw, 100vw" />
                ) : (
                  <ImagePlaceholder size={28} />
                )}
                <div className="absolute left-3 top-3">
                  <span className="px-2 py-1 text-xs font-semibold rounded border" style={{ backgroundColor: tokens.categoryBadgeBg, color: tokens.categoryBadgeText, borderColor: tokens.categoryBadgeBorder }}>
                    {resolveCategory(post)}
                  </span>
                </div>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-semibold line-clamp-2 mb-2" style={{ color: tokens.bodyText }}>{post.title}</h3>
                {post.excerpt && <p className="text-sm line-clamp-2 mb-2" style={{ color: tokens.mutedText }}>{post.excerpt}</p>}
                <time className="text-xs mt-auto" style={{ color: tokens.mutedText }}>{resolveDate(post)}</time>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );

  const renderList = () => (
    <section className="py-8 md:py-10 px-4" style={{ backgroundColor: tokens.sectionBg }}>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6" style={{ color: tokens.heading }}>{title}</h2>
        <div className="space-y-4">
          {displayPosts.slice(0, 5).map((post) => (
            <article key={post._id} className="rounded-lg border overflow-hidden flex flex-col sm:flex-row" style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBg }}>
              <div className="relative aspect-[16/9] sm:aspect-[4/3] w-full sm:w-[220px]">
                {post.thumbnail ? (
                  <Image src={post.thumbnail} alt={post.title} fill className="object-cover" sizes="(min-width: 640px) 220px, 100vw" />
                ) : (
                  <ImagePlaceholder size={24} />
                )}
              </div>
              <div className="p-4 flex-1">
                <div className="text-xs font-semibold mb-2" style={{ color: tokens.subheading }}>{resolveCategory(post)}</div>
                <h3 className="text-base md:text-lg font-semibold line-clamp-2 mb-2" style={{ color: tokens.bodyText }}>{post.title}</h3>
                {post.excerpt && <p className="text-sm line-clamp-2 mb-2" style={{ color: tokens.mutedText }}>{post.excerpt}</p>}
                <time className="text-xs" style={{ color: tokens.mutedText }}>{resolveDate(post)}</time>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );

  const renderFeatured = () => {
    const [featured, ...others] = displayPosts;

    return (
      <section className="py-8 md:py-10 px-4" style={{ backgroundColor: tokens.sectionBg }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: tokens.heading }}>{title}</h2>
            <span className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: tokens.viewAllText }}>Xem tất cả <ArrowRight size={16} /></span>
          </div>
          <div className="grid gap-6 lg:grid-cols-12">
            {featured && (
              <article className="lg:col-span-8 rounded-xl overflow-hidden border relative min-h-[320px]" style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBg }}>
                {featured.thumbnail ? (
                  <Image src={featured.thumbnail} alt={featured.title} fill className="object-cover" sizes="(min-width: 1024px) 70vw, 100vw" />
                ) : (
                  <ImagePlaceholder size={40} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="px-2.5 py-1 text-xs font-semibold rounded border" style={{ backgroundColor: tokens.categoryBadgeBg, color: tokens.categoryBadgeText, borderColor: tokens.categoryBadgeBorder }}>{resolveCategory(featured)}</span>
                  <h3 className="text-2xl font-bold text-white mt-3 line-clamp-2">{featured.title}</h3>
                  {featured.excerpt && <p className="text-sm text-slate-200 mt-2 line-clamp-2">{featured.excerpt}</p>}
                </div>
              </article>
            )}
            <div className="lg:col-span-4 space-y-3">
              {others.slice(0, 4).map((post) => (
                <article key={post._id} className="rounded-lg border p-3 flex gap-3" style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBg }}>
                  <div className="relative h-14 w-14 rounded overflow-hidden flex-shrink-0">
                    {post.thumbnail ? (
                      <Image src={post.thumbnail} alt={post.title} fill className="object-cover" sizes="56px" />
                    ) : (
                      <ImagePlaceholder size={16} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase" style={{ color: tokens.subheading }}>{resolveCategory(post)}</div>
                    <h4 className="text-sm font-semibold line-clamp-2" style={{ color: tokens.bodyText }}>{post.title}</h4>
                    <time className="text-[10px]" style={{ color: tokens.mutedText }}>{resolveDate(post)}</time>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  };

  const renderMagazine = () => {
    const [featured, ...others] = displayPosts;

    return (
      <section className="py-8 md:py-10 px-4" style={{ backgroundColor: tokens.sectionBg }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: tokens.subheading }}>Magazine</div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: tokens.heading }}>{title}</h2>
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: tokens.viewAllText }}>Xem tất cả <ArrowRight size={16} /></span>
          </div>

          <div className="lg:hidden space-y-4">
            {featured && (
              <article className="rounded-xl overflow-hidden border relative aspect-[16/9]" style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBg }}>
                {featured.thumbnail ? (
                  <Image src={featured.thumbnail} alt={featured.title} fill className="object-cover" sizes="100vw" />
                ) : (
                  <ImagePlaceholder size={36} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <span className="px-2 py-1 text-[10px] font-bold rounded border" style={{ backgroundColor: tokens.categoryBadgeBg, color: tokens.categoryBadgeText, borderColor: tokens.categoryBadgeBorder }}>{resolveCategory(featured)}</span>
                  <h3 className="text-lg font-bold text-white mt-2 line-clamp-2">{featured.title}</h3>
                </div>
              </article>
            )}
            <div className="grid grid-cols-2 gap-3">
              {others.slice(0, 4).map((post) => (
                <article key={post._id} className="rounded-lg border overflow-hidden" style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBg }}>
                  <div className="relative aspect-[16/10]">
                    {post.thumbnail ? (
                      <Image src={post.thumbnail} alt={post.title} fill className="object-cover" sizes="50vw" />
                    ) : (
                      <ImagePlaceholder size={20} />
                    )}
                  </div>
                  <div className="p-3">
                    <h4 className="text-sm font-semibold line-clamp-2" style={{ color: tokens.bodyText }}>{post.title}</h4>
                    <time className="text-[10px] block mt-1" style={{ color: tokens.mutedText }}>{resolveDate(post)}</time>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="hidden lg:grid lg:grid-cols-3 gap-6">
            {featured && (
              <article className="lg:row-span-2 rounded-2xl overflow-hidden border relative min-h-[420px]" style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBg }}>
                {featured.thumbnail ? (
                  <Image src={featured.thumbnail} alt={featured.title} fill className="object-cover" sizes="(min-width: 1024px) 50vw, 100vw" />
                ) : (
                  <ImagePlaceholder size={42} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="px-2.5 py-1 text-xs font-bold rounded border" style={{ backgroundColor: tokens.categoryBadgeBg, color: tokens.categoryBadgeText, borderColor: tokens.categoryBadgeBorder }}>{resolveCategory(featured)}</span>
                  <h3 className="text-xl font-bold text-white mt-3 line-clamp-2">{featured.title}</h3>
                  {featured.excerpt && <p className="text-sm text-slate-200 mt-2 line-clamp-2">{featured.excerpt}</p>}
                  <time className="text-sm text-slate-300 mt-2 block">{resolveDate(featured)}</time>
                </div>
              </article>
            )}

            {others.slice(0, 4).map((post) => (
              <article key={post._id} className="rounded-xl border overflow-hidden flex flex-col" style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBg }}>
                <div className="relative aspect-[16/10]">
                  {post.thumbnail ? (
                    <Image src={post.thumbnail} alt={post.title} fill className="object-cover" sizes="33vw" />
                  ) : (
                    <ImagePlaceholder size={24} />
                  )}
                </div>
                <div className="p-4 flex-1">
                  <div className="text-[10px] font-bold uppercase mb-1" style={{ color: tokens.subheading }}>{resolveCategory(post)}</div>
                  <h4 className="text-base font-semibold line-clamp-2 mb-2" style={{ color: tokens.bodyText }}>{post.title}</h4>
                  <time className="text-xs" style={{ color: tokens.mutedText }}>{resolveDate(post)}</time>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const renderCarousel = () => {
    const displayed = displayPosts.slice(0, 6);
    const showArrowsDesktop = displayed.length > 3;
    const showArrowsMobile = displayed.length > 1;

    return (
      <section className="py-8 md:py-10 px-4" style={{ backgroundColor: tokens.sectionBg }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-end md:justify-between">
            <div className="flex items-end justify-between w-full md:w-auto">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: tokens.heading }}>{title}</h2>
              {showArrowsMobile && (
                <div className="flex gap-2 md:hidden">
                  <button type="button" className="w-11 h-11 rounded-full border flex items-center justify-center" style={{ borderColor: tokens.arrowButtonBorder, backgroundColor: tokens.arrowButtonBg }}>
                    <ChevronLeft size={18} style={{ color: tokens.arrowButtonIcon }} />
                  </button>
                  <button type="button" className="w-11 h-11 rounded-full border flex items-center justify-center" style={{ borderColor: tokens.arrowButtonBorder, backgroundColor: tokens.arrowButtonBg }}>
                    <ChevronRight size={18} style={{ color: tokens.arrowButtonIcon }} />
                  </button>
                </div>
              )}
            </div>
            {showArrowsDesktop && (
              <div className="hidden md:flex items-center gap-3">
                <button type="button" className="w-11 h-11 rounded-full border flex items-center justify-center" style={{ borderColor: tokens.arrowButtonBorder, backgroundColor: tokens.arrowButtonBg }}>
                  <ChevronLeft size={18} style={{ color: tokens.arrowButtonIcon }} />
                </button>
                <button type="button" className="w-11 h-11 rounded-full border flex items-center justify-center" style={{ borderColor: tokens.arrowButtonBorder, backgroundColor: tokens.arrowButtonBg }}>
                  <ChevronRight size={18} style={{ color: tokens.arrowButtonIcon }} />
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-4 overflow-x-auto py-2">
            {displayed.map((post) => (
              <article key={post._id} className="w-[280px] md:w-[320px] lg:w-[360px] flex-shrink-0 rounded-xl border overflow-hidden" style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBg }}>
                <div className="relative aspect-[16/10]">
                  {post.thumbnail ? (
                    <Image src={post.thumbnail} alt={post.title} fill className="object-cover" sizes="320px" />
                  ) : (
                    <ImagePlaceholder size={30} />
                  )}
                </div>
                <div className="p-4">
                  <div className="text-[10px] font-bold uppercase mb-1" style={{ color: tokens.subheading }}>{resolveCategory(post)}</div>
                  <h3 className="font-semibold line-clamp-2 mb-2" style={{ color: tokens.bodyText }}>{post.title}</h3>
                  <p className="text-sm line-clamp-2 mb-3" style={{ color: tokens.mutedText }}>{post.excerpt ?? ''}</p>
                  <div className="flex items-center justify-between">
                    <time className="text-xs" style={{ color: tokens.mutedText }}>{resolveDate(post)}</time>
                    <ArrowRight size={16} style={{ color: tokens.arrowButtonIcon }} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const renderMinimal = () => (
    <section className="py-8 md:py-10 px-4" style={{ backgroundColor: tokens.sectionBg }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between border-b pb-4 mb-6" style={{ borderColor: tokens.cardBorder }}>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight" style={{ color: tokens.heading }}>{title}</h2>
          <span className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: tokens.viewAllText }}>Xem tất cả <ArrowRight size={16} /></span>
        </div>
        <div>
          {displayPosts.slice(0, 5).map((post, index) => (
            <article key={post._id} className="flex items-start gap-4 py-5 border-b" style={{ borderColor: tokens.cardBorder }}>
              <span className="text-xl md:text-2xl font-bold tabular-nums w-8 md:w-10 flex-shrink-0" style={{ color: tokens.numberText }}>{String(index + 1).padStart(2, '0')}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: tokens.subheading }}>{resolveCategory(post)}</span>
                  <span className="text-[10px]" style={{ color: tokens.mutedText }}>•</span>
                  <time className="text-[10px]" style={{ color: tokens.mutedText }}>{resolveDate(post)}</time>
                </div>
                <h3 className="text-base md:text-lg font-semibold line-clamp-2" style={{ color: tokens.bodyText }}>{post.title}</h3>
                {post.excerpt && <p className="text-sm line-clamp-1 mt-1" style={{ color: tokens.mutedText }}>{post.excerpt}</p>}
              </div>
              <ArrowRight size={18} className="flex-shrink-0 mt-1" style={{ color: tokens.arrowButtonIcon }} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );

  const renderByStyle = () => {
    if (selectedStyle === 'list') {return renderList();}
    if (selectedStyle === 'featured') {return renderFeatured();}
    if (selectedStyle === 'magazine') {return renderMagazine();}
    if (selectedStyle === 'carousel') {return renderCarousel();}
    if (selectedStyle === 'minimal') {return renderMinimal();}
    return renderGrid();
  };

  return (
    <div className={cn('space-y-3', fontClassName)} style={fontStyle}>
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye size={18} /> Preview Blog ({postCount} bài viết)
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                {styles.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => {onStyleChange?.(style.id as BlogStyle);}}
                    className={cn(
                      'px-3 py-1 text-xs font-medium rounded-md transition-all',
                      selectedStyle === style.id
                        ? 'bg-white dark:bg-slate-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700',
                    )}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                {devices.map((previewDevice) => (
                  <button
                    key={previewDevice.id}
                    type="button"
                    onClick={() => {setDevice(previewDevice.id);}}
                    title={previewDevice.label}
                    className={cn(
                      'p-1.5 rounded-md transition-all',
                      device === previewDevice.id
                        ? 'bg-white dark:bg-slate-700 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600',
                    )}
                  >
                    <previewDevice.icon size={16} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={cn('mx-auto transition-all duration-300', deviceWidthClass)}>{renderByStyle()}</div>
          <div className="mt-3 text-xs text-slate-500">
            Style: <strong className="text-slate-700 dark:text-slate-300">{styles.find((style) => style.id === selectedStyle)?.label}</strong>
            {' • '}
            {device === 'desktop' && 'max-w-6xl (1280px)'}
            {device === 'tablet' && '768px'}
            {device === 'mobile' && '375px'}
          </div>
        </CardContent>
      </Card>

      {mode === 'dual' && (
        <ColorInfoPanel
          brandColor={brandColor}
          secondary={validation.resolvedSecondary}
          description="Màu phụ áp dụng cho subtitle, badge, labels và accents."
        />
      )}

      {warningMessages.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <ul className="list-disc pl-4 space-y-1">
            {warningMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

