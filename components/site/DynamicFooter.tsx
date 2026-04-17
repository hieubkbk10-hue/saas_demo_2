'use client';

import React from 'react';
import Link from 'next/link';
import { PublicImage as Image } from '@/components/shared/PublicImage';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useBrandColors, useSiteSettings, useSocialLinks } from './hooks';
import { getFooterLayoutColors } from '@/app/admin/home-components/footer/_lib/colors';
import { getFooterLogoSize, getFooterMaxWidthClass } from '@/app/admin/home-components/footer/_lib/constants';
import type { FooterBrandMode, FooterStyle } from '@/app/admin/home-components/footer/_types';
import { resolveTypeOverrideColors } from '@/app/admin/home-components/_shared/lib/typeColorOverride';
import { resolveTypeOverrideFont } from '@/app/admin/home-components/_shared/lib/typeFontOverride';
import { Facebook, Github, Globe, Instagram, Linkedin, Twitter, X, Youtube } from 'lucide-react';

interface SocialLinkItem { id: number; platform: string; url: string; icon: string }
interface FooterConfig {
  logo?: string;
  description?: string;
  maxWidth?: '6xl' | '7xl' | '8xl' | '9xl';
  logoSizeLevel?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  columns?: { id: number; title: string; links: { label: string; url: string }[] }[];
  socialLinks?: SocialLinkItem[];
  copyright?: string;
  showCopyright?: boolean;
  showBctLogo?: boolean;
  bctLogoType?: 'thong-bao' | 'dang-ky';
  bctLogoLink?: string;
  showSocialLinks?: boolean;
  useOriginalSocialIconColors?: boolean;
  style?: 'classic' | 'modern' | 'corporate' | 'minimal' | 'centered' | 'stacked';
}

// Custom TikTok icon (Lucide không có)
const TikTokIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

// Custom Zalo icon (Simple Icons - monochrome)
const ZaloIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.49 10.2722v-.4496h1.3467v6.3218h-.7704a.576.576 0 01-.5763-.5729l-.0006.0005a3.273 3.273 0 01-1.9372.6321c-1.8138 0-3.2844-1.4697-3.2844-3.2823 0-1.8125 1.4706-3.2822 3.2844-3.2822a3.273 3.273 0 011.9372.6321l.0006.0005zM6.9188 7.7896v.205c0 .3823-.051.6944-.2995 1.0605l-.03.0343c-.0542.0615-.1815.206-.2421.2843L2.024 14.8h4.8948v.7682a.5764.5764 0 01-.5767.5761H0v-.3622c0-.4436.1102-.6414.2495-.8476L4.8582 9.23H.1922V7.7896h6.7266zm8.5513 8.3548a.4805.4805 0 01-.4803-.4798v-7.875h1.4416v8.3548H15.47zM20.6934 9.6C22.52 9.6 24 11.0807 24 12.9044c0 1.8252-1.4801 3.306-3.3066 3.306-1.8264 0-3.3066-1.4808-3.3066-3.306 0-1.8237 1.4802-3.3044 3.3066-3.3044zm-10.1412 5.253c1.0675 0 1.9324-.8645 1.9324-1.9312 0-1.065-.865-1.9295-1.9324-1.9295s-1.9324.8644-1.9324 1.9295c0 1.0667.865 1.9312 1.9324 1.9312zm10.1412-.0033c1.0737 0 1.945-.8707 1.945-1.9453 0-1.073-.8713-1.9436-1.945-1.9436-1.0753 0-1.945.8706-1.945 1.9436 0 1.0746.8697 1.9453 1.945 1.9453z"/>
  </svg>
);

const PinterestIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
  </svg>
);

// Social icons based on platform
const SocialIcon = ({ platform, size = 18 }: { platform: string; size?: number }) => {
  switch (platform) {
    case 'facebook': { return <Facebook size={size} />;
    }
    case 'instagram': { return <Instagram size={size} />;
    }
    case 'youtube': { return <Youtube size={size} />;
    }
    case 'tiktok': { return <TikTokIcon size={size} />;
    }
    case 'zalo': { return <ZaloIcon size={size} />;
    }
    case 'twitter': { return <Twitter size={size} />;
    }
    case 'x': { return <X size={size} />;
    }
    case 'pinterest': { return <PinterestIcon size={size} />;
    }
    case 'linkedin': { return <Linkedin size={size} />;
    }
    case 'github': { return <Github size={size} />;
    }
    default: { return <Globe size={size} />;
    }
  }
};

const SOCIAL_ORIGINAL_COLORS: Record<string, { bg: string; icon: string }> = {
  facebook: { bg: '#1877f2', icon: '#ffffff' },
  instagram: { bg: '#e1306c', icon: '#ffffff' },
  youtube: { bg: '#ff0000', icon: '#ffffff' },
  tiktok: { bg: '#000000', icon: '#ffffff' },
  zalo: { bg: '#0084ff', icon: '#ffffff' },
  twitter: { bg: '#1da1f2', icon: '#ffffff' },
  x: { bg: '#000000', icon: '#ffffff' },
  pinterest: { bg: '#E60023', icon: '#ffffff' },
  linkedin: { bg: '#0a66c2', icon: '#ffffff' },
  github: { bg: '#0f172a', icon: '#ffffff' },
};

export function DynamicFooter() {
  const systemColors = useBrandColors();
  const systemConfig = useQuery(api.homeComponentSystemConfig.getConfig);
  const resolvedColors = resolveTypeOverrideColors({
    type: 'Footer',
    systemColors,
    overrides: systemConfig?.typeColorOverrides ?? null,
  });
  const resolvedFont = resolveTypeOverrideFont({
    type: 'Footer',
    overrides: systemConfig?.typeFontOverrides ?? null,
    globalOverride: systemConfig?.globalFontOverride ?? null,
  });
  const fontStyle = { '--font-active': `var(${resolvedFont.fontVariable})` } as React.CSSProperties;
  const wrapWithFont = (node: React.ReactNode) => (
    <div className="font-active" style={fontStyle}>{node}</div>
  );
  const { primary: brandColor, secondary, mode } = resolvedColors;
  const { siteName, logo: siteLogo } = useSiteSettings();
  const socialLinks = useSocialLinks();
  const components = useQuery(api.homeComponents.listActive);
  
  const footerComponent = React.useMemo(() => {
    if (!components) {return null;}
    return components.find(c => c.type === 'Footer' && c.active);
  }, [components]);

  const currentYear = new Date().getFullYear();

  // Get socials from config or from settings
  const getSocials = (config: FooterConfig) => {
    if (config.socialLinks && config.socialLinks.length > 0) {
      return config.socialLinks;
    }
    // Fallback to settings socials
    const settingSocials: SocialLinkItem[] = [];
    if (socialLinks.facebook) {settingSocials.push({ icon: 'facebook', id: 1, platform: 'facebook', url: socialLinks.facebook });}
    if (socialLinks.instagram) {settingSocials.push({ icon: 'instagram', id: 2, platform: 'instagram', url: socialLinks.instagram });}
    if (socialLinks.youtube) {settingSocials.push({ icon: 'youtube', id: 3, platform: 'youtube', url: socialLinks.youtube });}
    if (socialLinks.tiktok) {settingSocials.push({ icon: 'tiktok', id: 4, platform: 'tiktok', url: socialLinks.tiktok });}
    if (socialLinks.zalo) {settingSocials.push({ icon: 'zalo', id: 5, platform: 'zalo', url: socialLinks.zalo });}
    return settingSocials.length > 0 ? settingSocials : [
      { icon: 'facebook', id: 1, platform: 'facebook', url: '#' },
      { icon: 'instagram', id: 2, platform: 'instagram', url: '#' },
      { icon: 'youtube', id: 3, platform: 'youtube', url: '#' },
    ];
  };

  // Default columns
  const getColumns = (config: FooterConfig) => {
    if (config.columns && config.columns.length > 0) {
      return config.columns;
    }
    return [
      { id: 1, links: [{ label: 'Giới thiệu', url: '/about' }, { label: 'Tuyển dụng', url: '/careers' }, { label: 'Đội ngũ', url: '/team' }, { label: 'Tin tức', url: '/blog' }], title: 'Về chúng tôi' },
      { id: 2, links: [{ label: 'FAQ', url: '/faq' }, { label: 'Liên hệ', url: '/contact' }, { label: 'Chính sách', url: '/policy' }, { label: 'Báo cáo', url: '/report' }], title: 'Hỗ trợ' }
    ];
  };

  // Fallback footer nếu không có Footer component
  const fallbackBgDark = getFooterLayoutColors('classic', brandColor, secondary, mode as FooterBrandMode).bg;
  if (!footerComponent) {
    return wrapWithFont(
      <footer className="text-white" style={{ backgroundColor: fallbackBgDark }}>
        <div className="py-6 px-4">
          <p className="text-center text-sm text-slate-500">
            © {currentYear} {siteName ?? 'VietAdmin'}. All rights reserved.
          </p>
        </div>
      </footer>
    );
  }

  const config = footerComponent.config as FooterConfig;
  const style = (config.style ?? 'classic') as FooterStyle;
  const logo = config.logo ?? siteLogo;
  const logoSizeLevel = config.logoSizeLevel ?? 1;
  const resolveLogoSize = (baseSize: number) => getFooterLogoSize(baseSize, logoSizeLevel);
  const socials = getSocials(config);
  const columns = getColumns(config);
  const colors = getFooterLayoutColors(style, brandColor, secondary, mode as FooterBrandMode);
  const useOriginalSocialIconColors = config.useOriginalSocialIconColors !== false;
  const maxWidthClass = getFooterMaxWidthClass(config.maxWidth);
  const showBctLogo = config.showBctLogo === true;
  const bctLogoType = config.bctLogoType ?? 'thong-bao';
  const bctLogoLink = typeof config.bctLogoLink === 'string' ? config.bctLogoLink.trim() : '';
  const bctLogoSrc = bctLogoType === 'dang-ky'
    ? '/images/bct/logo-da-dang-ky-bct.webp'
    : '/images/bct/logo-da-thong-bao-bct.png';
  const renderBctLogo = (className = 'h-14') => {
    if (!showBctLogo) {return null;}
    const image = (
      <Image
        src={bctLogoSrc}
        alt="Bộ Công Thương"
        width={120}
        height={40}
        className={`${className} w-auto object-contain`}
        mode="decorative"
      />
    );
    if (!bctLogoLink) {return image;}
    return (
      <a href={bctLogoLink} target="_blank" rel="noopener noreferrer">
        {image}
      </a>
    );
  };
  const resolveSocialStyles = (platform: string, fallbackBg: string, fallbackText: string) => {
    if (!useOriginalSocialIconColors) {
      return { bg: fallbackBg, color: fallbackText };
    }

    const original = SOCIAL_ORIGINAL_COLORS[platform];
    if (!original) {
      return { bg: fallbackBg, color: fallbackText };
    }

    return { bg: original.bg, color: original.icon };
  };

  // Style 1: Classic Dark - Standard layout với brand column và menu columns
  if (style === 'classic') {
    return wrapWithFont(
      <footer className="w-full py-8 md:py-10" style={{ backgroundColor: colors.bg, borderTop: `1px solid ${colors.border}` }}>
        <div className={`container ${maxWidthClass} mx-auto px-4 md:px-6`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-6">
            
            {/* Brand Column */}
            <div className="lg:col-span-5 space-y-4">
              <Link href="/" className="flex items-center gap-2">
                {logo ? (
                  <Image
                    src={logo}
                    alt={siteName ?? 'VietAdmin'}
                    width={resolveLogoSize(24)}
                    height={resolveLogoSize(24)}
                    className="object-contain brightness-110"
                    style={{ width: resolveLogoSize(24), height: resolveLogoSize(24) }}
                    mode="logo"
                  />
                ) : (
                  <div
                    className="rounded flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: colors.primary, color: colors.textOnPrimary, width: resolveLogoSize(24), height: resolveLogoSize(24) }}
                  >
                    {(siteName ?? 'V').charAt(0)}
                  </div>
                )}
                <span className="text-lg font-bold tracking-tight" style={{ color: colors.heading }}>{siteName ?? 'VietAdmin'}</span>
              </Link>
              <p className="text-sm leading-relaxed max-w-sm" style={{ color: colors.textMuted }}>
                {config.description ?? 'Đối tác tin cậy của bạn trong mọi giải pháp công nghệ và sáng tạo kỹ thuật số.'}
              </p>
              {config.showSocialLinks !== false && (
                <div className="flex gap-2">
                  {socials.map((s, idx) => {
                    const socialStyles = resolveSocialStyles(s.platform, colors.socialBg, colors.socialText);

                    return (
                      <a 
                        key={s.id || `social-${idx}`} 
                        href={s.url || '#'} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-9 w-9 flex items-center justify-center rounded-full transition-colors"
                        style={{ backgroundColor: socialStyles.bg, color: socialStyles.color }}
                      >
                        <SocialIcon platform={s.platform} size={22} />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dynamic Columns */}
            <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-6">
              {columns.slice(0, 2).map((col, colIdx) => (
                <div key={col.id || `col-${colIdx}`}>
                  <h3 className="font-semibold text-sm tracking-wide mb-3" style={{ color: colors.heading }}>{col.title}</h3>
                  <ul className="space-y-2">
                    {col.links.map((link, lIdx) => (
                      <li key={lIdx}>
                        <Link 
                          href={link.url || '#'} 
                          className="text-sm transition-colors block"
                          style={{ color: colors.link }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = colors.linkHover; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = colors.link; }}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-4 flex flex-col md:flex-row items-center justify-between gap-2" style={{ borderTop: `1px solid ${colors.borderSoft}` }}>
            {config.showCopyright !== false && (
              <p className="text-xs" style={{ color: colors.textSubtle }}>
                {config.copyright || `© ${currentYear} ${siteName ?? 'VietAdmin'}. All rights reserved.`}
              </p>
            )}
            {renderBctLogo('h-14')}
          </div>
        </div>
      </footer>
    );
  }

  // Style 2: Modern Centered - Elegant centered layout
  if (style === 'modern') {
    return wrapWithFont(
      <footer className="w-full py-8 md:py-10" style={{ backgroundColor: colors.bg }}>
        <div className={`container ${maxWidthClass} mx-auto px-4 md:px-6 flex flex-col items-center text-center space-y-5 md:space-y-6`}>
          
          {/* Brand */}
          <div className="flex flex-col items-center gap-2">
            {logo ? (
              <Image
                src={logo}
                alt={siteName ?? 'VietAdmin'}
                width={resolveLogoSize(28)}
                height={resolveLogoSize(28)}
                className="object-contain"
                style={{ width: resolveLogoSize(28), height: resolveLogoSize(28) }}
                mode="logo"
              />
            ) : (
              <div
                className="rounded flex items-center justify-center font-bold text-base"
                style={{ backgroundColor: colors.primary, color: colors.textOnPrimary, width: resolveLogoSize(28), height: resolveLogoSize(28) }}
              >
                {(siteName ?? 'V').charAt(0)}
              </div>
            )}
            <h2 className="text-lg font-bold tracking-tight" style={{ color: colors.heading }}>{siteName ?? 'VietAdmin'}</h2>
            <p className="max-w-md text-sm leading-relaxed" style={{ color: colors.textMuted }}>
              {config.description ?? 'Đối tác tin cậy của bạn trong mọi giải pháp công nghệ và sáng tạo kỹ thuật số.'}
            </p>
          </div>

          {/* Navigation (Flat) */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 md:gap-x-6">
            {columns.flatMap(col => col.links).slice(0, 8).map((link, i) => (
              <Link 
                key={i} 
                href={link.url || '#'} 
                className="text-sm font-medium underline-offset-4 transition-colors"
                style={{ color: colors.link, textDecorationColor: colors.link }}
                onMouseEnter={(e) => { e.currentTarget.style.color = colors.linkHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = colors.link; }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="w-16 h-px" style={{ backgroundColor: colors.dividerGradient }}></div>

          {/* Socials */}
          <div className="flex items-center gap-3">
            {config.showSocialLinks !== false && (
              <div className="flex gap-4">
                {socials.map((s, idx) => {
                  const socialStyles = resolveSocialStyles(s.platform, colors.socialBg, colors.socialText);

                  return (
                    <a 
                      key={s.id || `social-${idx}`} 
                      href={s.url || '#'} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 w-9 flex items-center justify-center rounded-full transition-colors"
                      style={{ backgroundColor: socialStyles.bg, color: socialStyles.color }}
                    >
                      <SocialIcon platform={s.platform} size={22} />
                    </a>
                  );
                })}
              </div>
            )}
            {renderBctLogo('h-14')}
          </div>

          {config.showCopyright !== false && (
            <div className="text-xs font-medium" style={{ color: colors.textSubtle }}>
              {config.copyright || `© ${currentYear} ${siteName ?? 'VietAdmin'}. All rights reserved.`}
            </div>
          )}
        </div>
      </footer>
    );
  }

  // Style 3: Corporate Grid - Structured professional layout
  if (style === 'corporate') {
    return wrapWithFont(
      <footer className="w-full py-8 md:py-10" style={{ backgroundColor: colors.bg, borderTop: `1px solid ${colors.border}` }}>
        <div className={`container ${maxWidthClass} mx-auto px-4 md:px-6`}>
          
          {/* Top Row: Logo & Socials */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pb-6" style={{ borderBottom: `1px solid ${colors.border}` }}>
            <Link href="/" className="flex items-center gap-2">
              {logo ? (
                <Image
                  src={logo}
                  alt={siteName ?? 'VietAdmin'}
                  width={resolveLogoSize(24)}
                  height={resolveLogoSize(24)}
                  className="object-contain"
                  style={{ width: resolveLogoSize(24), height: resolveLogoSize(24) }}
                  mode="logo"
                />
              ) : (
                <div
                  className="rounded flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: colors.primary, color: colors.textOnPrimary, width: resolveLogoSize(24), height: resolveLogoSize(24) }}
                >
                  {(siteName ?? 'V').charAt(0)}
                </div>
              )}
              <span className="text-base font-bold" style={{ color: colors.heading }}>{siteName ?? 'VietAdmin'}</span>
            </Link>
            {config.showSocialLinks !== false && (
              <div className="flex gap-3">
                {socials.map((s, idx) => {
                  const socialStyles = resolveSocialStyles(s.platform, colors.socialBg, colors.socialText);

                  return (
                    <a 
                      key={s.id || `social-${idx}`} 
                      href={s.url || '#'} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-8 w-8 flex items-center justify-center rounded-full transition-colors"
                      style={{ backgroundColor: socialStyles.bg, color: socialStyles.color }}
                    >
                      <SocialIcon platform={s.platform} size={22} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Middle Row: Columns */}
          <div className="py-6 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2 md:pr-6">
              <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: colors.heading }}>Về Công Ty</h4>
              <p className="text-sm leading-relaxed" style={{ color: colors.textMuted }}>
                {config.description ?? 'Đối tác tin cậy của bạn trong mọi giải pháp công nghệ và sáng tạo kỹ thuật số.'}
              </p>
            </div>
            
            {columns.slice(0, 2).map((col, colIdx) => (
              <div key={col.id || `col-${colIdx}`}>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: colors.heading }}>{col.title}</h4>
                <ul className="space-y-1.5">
                  {col.links.map((link, lIdx) => (
                    <li key={lIdx}>
                      <Link
                        href={link.url || '#'}
                        className="text-sm transition-colors"
                        style={{ color: colors.link }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = colors.linkHover; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = colors.link; }}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-4 flex flex-col md:flex-row items-center justify-between gap-2" style={{ color: colors.textSubtle }}>
            {config.showCopyright !== false && (
              <span className="text-xs text-center md:text-left">
                {config.copyright || `© ${currentYear} ${siteName ?? 'VietAdmin'}. All rights reserved.`}
              </span>
            )}
            {renderBctLogo('h-10')}
          </div>
        </div>
      </footer>
    );
  }

  // Style 4: Minimal - Compact single row
  if (style === 'minimal') {
    return wrapWithFont(
      <footer className="w-full py-4 md:py-5" style={{ backgroundColor: colors.bg, borderTop: `1px solid ${colors.border}` }}>
        <div className={`container ${maxWidthClass} mx-auto px-4 md:px-6`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            
            {/* Left: Logo & Copy */}
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3">
              {logo ? (
                <Image
                  src={logo}
                  alt={siteName ?? 'VietAdmin'}
                  width={resolveLogoSize(20)}
                  height={resolveLogoSize(20)}
                  className="opacity-80"
                  style={{ width: resolveLogoSize(20), height: resolveLogoSize(20) }}
                  mode="logo"
                />
              ) : (
                <div
                  className="rounded flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: colors.primary, color: colors.textOnPrimary, width: resolveLogoSize(20), height: resolveLogoSize(20) }}
                >
                  {(siteName ?? 'V').charAt(0)}
                </div>
              )}
              {config.showCopyright !== false && (
                <span className="text-xs font-medium" style={{ color: colors.textSubtle }}>
                  {config.copyright || `© ${currentYear} ${siteName ?? 'VietAdmin'}. All rights reserved.`}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {config.showSocialLinks !== false && (
                <div className="flex gap-2">
                  {socials.map((s, idx) => {
                    const socialStyles = resolveSocialStyles(s.platform, colors.socialBg, colors.socialText);

                    return (
                      <a 
                        key={s.id || `social-${idx}`} 
                        href={s.url || '#'} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-8 w-8 flex items-center justify-center rounded-full transition-colors"
                        style={{ backgroundColor: socialStyles.bg, color: socialStyles.color }}
                      >
                        <SocialIcon platform={s.platform} size={22} />
                      </a>
                    );
                  })}
                </div>
              )}
              {renderBctLogo('h-10')}
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // Style 5: Centered - Logo + social giữa, columns dàn 2 rows
  if (style === 'centered') {
    return wrapWithFont(
      <footer className="w-full py-8 md:py-10" style={{ backgroundColor: colors.bg }}>
        <div className={`container ${maxWidthClass} mx-auto px-4 md:px-6 text-center`}>
          
          {/* Brand Center */}
          <div className="flex flex-col items-center gap-2 mb-6">
            {logo ? (
              <Image
                src={logo}
                alt={siteName ?? 'VietAdmin'}
                width={resolveLogoSize(28)}
                height={resolveLogoSize(28)}
                className="object-contain"
                style={{ width: resolveLogoSize(28), height: resolveLogoSize(28) }}
                mode="logo"
              />
            ) : (
              <div
                className="rounded flex items-center justify-center font-bold"
                style={{ backgroundColor: colors.primary, color: colors.textOnPrimary, width: resolveLogoSize(28), height: resolveLogoSize(28) }}
              >
                {(siteName ?? 'V').charAt(0)}
              </div>
            )}
            <h2 className="text-lg font-bold tracking-tight" style={{ color: colors.heading }}>{siteName ?? 'VietAdmin'}</h2>
            <p className="text-xs leading-relaxed max-w-xs md:max-w-md" style={{ color: colors.textMuted }}>
              {config.description ?? 'Đối tác tin cậy của bạn trong mọi giải pháp công nghệ.'}
            </p>
          </div>

          {/* Columns in grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6">
            {columns.slice(0, 4).map((col, colIdx) => (
              <div key={col.id || `col-${colIdx}`} className="text-center">
                <h4 className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: colors.heading }}>{col.title}</h4>
                <ul className="space-y-1">
                  {col.links.slice(0, 4).map((link, lIdx) => (
                    <li key={lIdx}>
                      <Link 
                        href={link.url || '#'} 
                        className="text-xs transition-colors inline-block"
                        style={{ color: colors.link }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = colors.linkHover; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = colors.link; }}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="w-16 h-px mx-auto mb-5" style={{ backgroundColor: colors.dividerGradient }}></div>

          {/* Socials Center */}
          <div className="flex items-center justify-between">
            {config.showCopyright !== false && (
              <p className="text-[10px]" style={{ color: colors.textSubtle }}>
                {config.copyright || `© ${currentYear} ${siteName ?? 'VietAdmin'}. All rights reserved.`}
              </p>
            )}
            <div className="flex items-center gap-3">
              {config.showSocialLinks !== false && (
                <div className="flex gap-2">
                  {socials.map((s, idx) => {
                    const socialStyles = resolveSocialStyles(s.platform, colors.centeredSocialBg, colors.centeredSocialText);
                    const socialBorder = useOriginalSocialIconColors && SOCIAL_ORIGINAL_COLORS[s.platform]
                      ? socialStyles.bg
                      : colors.centeredSocialBorder;

                    return (
                      <a 
                        key={s.id || `social-${idx}`} 
                        href={s.url || '#'} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-14 w-14 flex items-center justify-center rounded-full transition-colors"
                        style={{ backgroundColor: socialStyles.bg, border: `1px solid ${socialBorder}`, color: socialStyles.color }}
                      >
                        <SocialIcon platform={s.platform} size={22} />
                      </a>
                    );
                  })}
                </div>
              )}
              {renderBctLogo('h-10')}
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // Style 6: Stacked - Tất cả elements xếp chồng vertical, mobile-first compact (default)
  return wrapWithFont(
    <footer className="w-full py-6" style={{ backgroundColor: colors.bg, borderTop: `3px solid ${colors.stackedTopBorder}` }}>
      <div className={`container ${maxWidthClass} mx-auto px-4 md:px-6`}>
        
        {/* Logo + Description */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-2 mb-5 text-center md:text-left">
          {logo ? (
            <Image
              src={logo}
              alt={siteName ?? 'VietAdmin'}
              width={resolveLogoSize(24)}
              height={resolveLogoSize(24)}
              className="object-contain brightness-110"
              style={{ width: resolveLogoSize(24), height: resolveLogoSize(24) }}
              mode="logo"
            />
          ) : (
            <div
              className="rounded flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: colors.primary, color: colors.textOnPrimary, width: resolveLogoSize(24), height: resolveLogoSize(24) }}
            >
              {(siteName ?? 'V').charAt(0)}
            </div>
          )}
          <div className="md:flex-1">
            <h3 className="text-sm font-bold mb-1" style={{ color: colors.heading }}>{siteName ?? 'VietAdmin'}</h3>
            <p className="text-xs leading-relaxed line-clamp-2" style={{ color: colors.textMuted }}>
              {config.description ?? 'Đối tác tin cậy của bạn trong mọi giải pháp công nghệ.'}
            </p>
          </div>
        </div>

        {/* Links in single row (flat) */}
        <div className="mb-5 pb-4" style={{ borderBottom: `1px solid ${colors.borderSoft}` }}>
          <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2">
            {columns.flatMap(col => col.links).slice(0, 10).map((link, i) => (
              <Link 
                key={i} 
                href={link.url || '#'} 
                className="text-xs font-medium transition-colors"
                style={{ color: colors.link }}
                onMouseEnter={(e) => { e.currentTarget.style.color = colors.linkHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = colors.link; }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom: Socials + Copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {config.showSocialLinks !== false && (
            <div className="flex gap-2">
              {socials.map((s, idx) => {
                const socialStyles = resolveSocialStyles(s.platform, colors.stackedSocialBg, colors.stackedSocialText);

                return (
                  <a 
                    key={s.id || `social-${idx}`} 
                    href={s.url || '#'} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 w-10 flex items-center justify-center rounded-lg transition-colors"
                    style={{ backgroundColor: socialStyles.bg, color: socialStyles.color }}
                  >
                    <SocialIcon platform={s.platform} size={22} />
                  </a>
                );
              })}
            </div>
          )}
          <div className="flex flex-col md:flex-row items-center gap-2">
            {renderBctLogo('h-10')}
            {config.showCopyright !== false && (
              <p className="text-[10px]" style={{ color: colors.textSubtle }}>
                {config.copyright || `© ${currentYear} ${siteName ?? 'VietAdmin'}. All rights reserved.`}
              </p>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
