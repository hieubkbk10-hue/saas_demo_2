'use client';

import React from 'react';
import { Globe, Facebook, Github, Instagram, Linkedin, Twitter, Youtube, X } from 'lucide-react';
import { PreviewWrapper } from '../../_shared/components/PreviewWrapper';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewImage } from '../../_shared/components/PreviewImage';
import { deviceWidths, usePreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import { getFooterLayoutColors } from '../_lib/colors';
import { getFooterLogoSize, getFooterMaxWidthClass } from '../_lib/constants';
import type { FooterBrandMode, FooterConfig, FooterStyle } from '../_types';

const TikTokIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

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

const SocialIcon = ({ platform, size = 18 }: { platform: string; size?: number }) => {
  switch (platform) {
    case 'facebook': { return <Facebook size={size} />; }
    case 'instagram': { return <Instagram size={size} />; }
    case 'youtube': { return <Youtube size={size} />; }
    case 'tiktok': { return <TikTokIcon size={size} />; }
    case 'zalo': { return <ZaloIcon size={size} />; }
    case 'twitter': { return <Twitter size={size} />; }
    case 'x': { return <X size={size} />; }
    case 'pinterest': { return <PinterestIcon size={size} />; }
    case 'linkedin': { return <Linkedin size={size} />; }
    case 'github': { return <Github size={size} />; }
    default: { return <Globe size={size} />; }
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

const styles: { id: FooterStyle; label: string }[] = [
  { id: 'classic', label: '1. Classic Dark' },
  { id: 'modern', label: '2. Modern Center' },
  { id: 'corporate', label: '3. Corporate' },
  { id: 'minimal', label: '4. Minimal' },
  { id: 'centered', label: '5. Centered' },
  { id: 'stacked', label: '6. Stacked' },
];

export const FooterPreview = ({
  config,
  brandColor,
  secondary,
  mode = 'dual',
  selectedStyle,
  onStyleChange,
  fontStyle,
  fontClassName,
}: {
  config: FooterConfig;
  brandColor: string;
  secondary: string;
  mode?: FooterBrandMode;
  selectedStyle?: FooterStyle;
  onStyleChange?: (style: FooterStyle) => void;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}) => {
  const { device, setDevice } = usePreviewDevice();
  const previewStyle = selectedStyle ?? 'classic';
  const setPreviewStyle = (value: string) => onStyleChange?.(value as FooterStyle);
  const colors = getFooterLayoutColors(previewStyle, brandColor, secondary, mode);
  const useOriginalSocialIconColors = config.useOriginalSocialIconColors !== false;
  const logoSizeLevel = config.logoSizeLevel ?? 1;
  const resolveLogoSize = (baseSize: number) => getFooterLogoSize(baseSize, logoSizeLevel);
  const maxWidthClass = getFooterMaxWidthClass(config.maxWidth);
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

  const socials = config.socialLinks?.length
    ? config.socialLinks
    : [
      { icon: 'facebook', id: 1, platform: 'facebook', url: '#' },
      { icon: 'instagram', id: 2, platform: 'instagram', url: '#' },
      { icon: 'youtube', id: 3, platform: 'youtube', url: '#' },
    ];

  const showBctLogo = config.showBctLogo === true;
  const bctLogoType = config.bctLogoType ?? 'thong-bao';
  const bctLogoLink = typeof config.bctLogoLink === 'string' ? config.bctLogoLink.trim() : '';
  const bctLogoSrc = bctLogoType === 'dang-ky'
    ? '/images/bct/logo-da-dang-ky-bct.webp'
    : '/images/bct/logo-da-thong-bao-bct.png';
  const renderBctLogo = (baseHeight = 42) => {
    if (!showBctLogo) {return null;}
    const image = (
      <img
        src={bctLogoSrc}
        alt="Bộ Công Thương"
        className="w-auto object-contain"
        style={{ height: baseHeight * 1.2 }}
      />
    );
    if (!bctLogoLink) {return image;}
    return (
      <a href={bctLogoLink} target="_blank" rel="noopener noreferrer">
        {image}
      </a>
    );
  };

  const columns = config.columns?.length
    ? config.columns
    : [
      { id: 1, links: [{ label: 'Giới thiệu', url: '/about' }, { label: 'Tuyển dụng', url: '/careers' }], title: 'Về chúng tôi' },
      { id: 2, links: [{ label: 'FAQ', url: '/faq' }, { label: 'Liên hệ', url: '/contact' }], title: 'Hỗ trợ' },
    ];

  const preview = () => {
    if (previewStyle === 'classic') {
      return (
        <footer className="w-full py-6 md:py-8" style={{ backgroundColor: colors.bg, borderTop: `1px solid ${colors.border}` }}>
          <div className={`${maxWidthClass} mx-auto px-3 md:px-4`}>
            <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-12">
              <div className="md:col-span-5 space-y-3 text-center md:text-left">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  {config.logo
                    ? <PreviewImage src={config.logo} alt="Logo" className="object-contain brightness-110" style={{ width: resolveLogoSize(20), height: resolveLogoSize(20) }} />
                    : (
                      <div
                        className="rounded flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: colors.primary, color: colors.textOnPrimary, width: resolveLogoSize(20), height: resolveLogoSize(20) }}
                      >
                        V
                      </div>
                    )}
                  <span className="text-base font-bold tracking-tight" style={{ color: colors.heading }}>VietAdmin</span>
                </div>
                <p className="text-xs leading-relaxed md:max-w-sm" style={{ color: colors.textMuted }}>{config.description || 'Đối tác tin cậy của bạn trong mọi giải pháp công nghệ và sáng tạo kỹ thuật số.'}</p>
                {config.showSocialLinks && (
                  <div className="flex gap-2 justify-center md:justify-start">
                    {socials.map((s, index) => {
                      const socialStyles = resolveSocialStyles(s.platform, colors.socialBg, colors.socialText);

                      return (
                        <span
                          key={`${s.id ?? 'social'}-${index}`}
                          className="h-9 w-9 flex items-center justify-center rounded-full"
                          style={{ backgroundColor: socialStyles.bg, color: socialStyles.color }}
                        >
                          <SocialIcon platform={s.platform} size={22} />
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="grid gap-4 grid-cols-2 md:col-span-7 md:grid-cols-3">
                {columns.slice(0, 2).map((col, colIdx) => (
                  <div key={`${col.id ?? 'col'}-${colIdx}`}>
                    <h3 className="font-semibold text-xs tracking-wide mb-2" style={{ color: colors.heading }}>{col.title}</h3>
                    <ul className="space-y-1.5">
                      {col.links.map((link, lIdx) => (
                        <li key={lIdx}>
                          <span className="text-xs" style={{ color: colors.link }}>{link.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="mt-6 pt-3 flex flex-col md:flex-row items-center justify-between gap-2"
              style={{ borderTop: `1px solid ${colors.borderSoft}` }}
            >
              {config.showCopyright !== false && (
                <p className="text-[10px] text-center md:text-left" style={{ color: colors.textSubtle }}>
                  {config.copyright || '© 2024 VietAdmin. All rights reserved.'}
                </p>
              )}
              {renderBctLogo(42)}
            </div>
          </div>
        </footer>
      );
    }

    if (previewStyle === 'modern') {
      return (
        <footer className="w-full py-6 md:py-8" style={{ backgroundColor: colors.bg }}>
          <div className={`${maxWidthClass} mx-auto px-3 md:px-4 flex flex-col items-center text-center space-y-4`}>
            <div className="flex flex-col items-center gap-2">
              {config.logo
                ? <PreviewImage src={config.logo} alt="Logo" className="object-contain" style={{ width: resolveLogoSize(24), height: resolveLogoSize(24) }} />
                : (
                  <div
                    className="rounded flex items-center justify-center font-bold text-sm"
                    style={{ backgroundColor: colors.primary, color: colors.textOnPrimary, width: resolveLogoSize(24), height: resolveLogoSize(24) }}
                  >
                    V
                  </div>
                )}
              <h2 className="text-base font-bold tracking-tight" style={{ color: colors.heading }}>VietAdmin</h2>
              <p className="text-xs leading-relaxed max-w-md" style={{ color: colors.textMuted }}>{config.description || 'Đối tác tin cậy của bạn trong mọi giải pháp công nghệ.'}</p>
            </div>

            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
              {columns.flatMap(col => col.links).slice(0, 8).map((link, i) => (
                <span key={i} className="text-xs font-medium" style={{ color: colors.link }}>{link.label}</span>
              ))}
            </div>

            <div className="w-12 h-px" style={{ backgroundColor: colors.dividerGradient }}></div>

            <div className="flex items-center gap-3">
              {config.showSocialLinks && (
                <div className="flex gap-3">
                    {socials.map((s, index) => {
                      const socialStyles = resolveSocialStyles(s.platform, colors.socialBg, colors.socialText);

                      return (
                        <span
                          key={`${s.id ?? 'social'}-${index}`}
                          className="h-9 w-9 flex items-center justify-center rounded-full"
                          style={{ backgroundColor: socialStyles.bg, color: socialStyles.color }}
                        >
                          <SocialIcon platform={s.platform} size={22} />
                        </span>
                      );
                    })}
                </div>
              )}
              {renderBctLogo(42)}
            </div>

            {config.showCopyright !== false && (
              <div className="text-[10px] font-medium" style={{ color: colors.textSubtle }}>
                {config.copyright || '© 2024 VietAdmin. All rights reserved.'}
              </div>
            )}
          </div>
        </footer>
      );
    }

    if (previewStyle === 'corporate') {
      return (
        <footer className="w-full py-6 md:py-8" style={{ backgroundColor: colors.bg, borderTop: `1px solid ${colors.border}` }}>
          <div className={`${maxWidthClass} mx-auto px-3 md:px-4`}>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 pb-4" style={{ borderBottom: `1px solid ${colors.border}` }}>
              <div className="flex items-center gap-2">
                {config.logo
                  ? <PreviewImage src={config.logo} alt="Logo" className="object-contain" style={{ width: resolveLogoSize(20), height: resolveLogoSize(20) }} />
                  : (
                    <div
                      className="rounded flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: colors.primary, color: colors.textOnPrimary, width: resolveLogoSize(20), height: resolveLogoSize(20) }}
                    >
                      V
                    </div>
                  )}
                <span className="text-sm font-bold" style={{ color: colors.heading }}>VietAdmin</span>
              </div>
              {config.showSocialLinks && (
                <div className="flex gap-2">
                  {socials.map((s, index) => {
                    const socialStyles = resolveSocialStyles(s.platform, colors.socialBg, colors.socialText);

                    return (
                      <span
                        key={`${s.id ?? 'social'}-${index}`}
                        className="h-8 w-8 flex items-center justify-center rounded-full"
                        style={{ backgroundColor: socialStyles.bg, color: socialStyles.color }}
                      >
                        <SocialIcon platform={s.platform} size={18} />
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="py-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: colors.heading }}>Về Công Ty</h4>
                <p className="text-xs leading-relaxed" style={{ color: colors.textMuted }}>{config.description || 'Đối tác tin cậy của bạn trong mọi giải pháp công nghệ.'}</p>
              </div>
              {columns.slice(0, 2).map((col, colIdx) => (
                <div key={`${col.id ?? 'col'}-${colIdx}`}>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: colors.heading }}>{col.title}</h4>
                  <ul className="space-y-1">
                    {col.links.map((link, lIdx) => (
                      <li key={lIdx}>
                        <span className="text-xs" style={{ color: colors.link }}>{link.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="pt-3 flex flex-col md:flex-row items-center justify-between gap-2" style={{ color: colors.textSubtle }}>
              {config.showCopyright !== false && (
                <span className="text-[10px] text-center md:text-left">
                  {config.copyright || '© 2024 VietAdmin. All rights reserved.'}
                </span>
              )}
              {renderBctLogo(36)}
            </div>
          </div>
        </footer>
      );
    }

    if (previewStyle === 'minimal') {
      return (
        <footer className="w-full py-4" style={{ backgroundColor: colors.bg, borderTop: `1px solid ${colors.border}` }}>
          <div className={`${maxWidthClass} mx-auto px-3 md:px-4 flex flex-col md:flex-row items-center justify-between gap-3`}>
            <div className="flex items-center gap-2">
              {config.logo
                ? <PreviewImage src={config.logo} alt="Logo" className="object-contain" style={{ width: resolveLogoSize(16), height: resolveLogoSize(16) }} />
                : (
                  <div
                    className="rounded flex items-center justify-center text-[10px] font-bold"
                    style={{ backgroundColor: colors.primary, color: colors.textOnPrimary, width: resolveLogoSize(16), height: resolveLogoSize(16) }}
                  >
                    V
                  </div>
                )}
              {config.showCopyright !== false && (
                <span className="text-[10px] font-medium" style={{ color: colors.textSubtle }}>
                  {config.copyright || '© 2024 VietAdmin. All rights reserved.'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {config.showSocialLinks && (
                <div className="flex gap-2">
                  {socials.map((s, index) => {
                    const socialStyles = resolveSocialStyles(s.platform, colors.socialBg, colors.socialText);

                    return (
                      <span
                        key={`${s.id ?? 'social'}-${index}`}
                        className="h-8 w-8 flex items-center justify-center rounded-full"
                        style={{ backgroundColor: socialStyles.bg, color: socialStyles.color }}
                      >
                        <SocialIcon platform={s.platform} size={18} />
                      </span>
                    );
                  })}
                </div>
              )}
              {renderBctLogo(36)}
            </div>
          </div>
        </footer>
      );
    }

    if (previewStyle === 'centered') {
      return (
        <footer className="w-full py-6 md:py-8" style={{ backgroundColor: colors.bg }}>
          <div className={`${maxWidthClass} mx-auto px-3 md:px-4 text-center`}>
            <div className="flex flex-col items-center gap-2 mb-5">
              {config.logo
                ? <PreviewImage src={config.logo} alt="Logo" className="object-contain" style={{ width: resolveLogoSize(24), height: resolveLogoSize(24) }} />
                : (
                  <div
                    className="rounded flex items-center justify-center font-bold text-sm"
                    style={{ backgroundColor: colors.primary, color: colors.textOnPrimary, width: resolveLogoSize(24), height: resolveLogoSize(24) }}
                  >
                    V
                  </div>
                )}
              <h2 className="text-base font-bold tracking-tight" style={{ color: colors.heading }}>VietAdmin</h2>
              <p className="text-xs leading-relaxed max-w-md" style={{ color: colors.textMuted }}>{config.description || 'Đối tác tin cậy của bạn trong mọi giải pháp công nghệ.'}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              {columns.slice(0, 4).map((col, colIdx) => (
                <div key={`${col.id ?? 'col'}-${colIdx}`}>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: colors.heading }}>{col.title}</h4>
                  <ul className="space-y-1">
                    {col.links.slice(0, 4).map((link, lIdx) => (
                      <li key={lIdx}>
                        <span className="text-[10px]" style={{ color: colors.link }}>{link.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="w-12 h-px mx-auto mb-4" style={{ backgroundColor: colors.dividerGradient }}></div>

            <div className="flex items-center justify-between">
              {config.showCopyright !== false && (
                <p className="text-[10px]" style={{ color: colors.textSubtle }}>
                  {config.copyright || '© 2024 VietAdmin. All rights reserved.'}
                </p>
              )}
              <div className="flex items-center gap-3">
                {config.showSocialLinks && (
                  <div className="flex gap-2">
                    {socials.map((s, index) => {
                      const socialStyles = resolveSocialStyles(s.platform, colors.centeredSocialBg, colors.centeredSocialText);
                      const socialBorder = useOriginalSocialIconColors && SOCIAL_ORIGINAL_COLORS[s.platform]
                        ? socialStyles.bg
                        : colors.centeredSocialBorder;

                      return (
                        <span
                          key={`${s.id ?? 'social'}-${index}`}
                          className="h-10 w-10 flex items-center justify-center rounded-full"
                          style={{ backgroundColor: socialStyles.bg, border: `1px solid ${socialBorder}`, color: socialStyles.color }}
                        >
                          <SocialIcon platform={s.platform} size={22} />
                        </span>
                      );
                    })}
                  </div>
                )}
                {renderBctLogo(36)}
              </div>
            </div>
          </div>
        </footer>
      );
    }

    return (
      <footer className="w-full py-5" style={{ backgroundColor: colors.bg, borderTop: `3px solid ${colors.stackedTopBorder}` }}>
        <div className={`${maxWidthClass} mx-auto px-3 md:px-4`}>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-2 mb-4 text-center md:text-left">
            {config.logo
              ? <PreviewImage src={config.logo} alt="Logo" className="object-contain" style={{ width: resolveLogoSize(20), height: resolveLogoSize(20) }} />
              : (
                <div
                  className="rounded flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: colors.primary, color: colors.textOnPrimary, width: resolveLogoSize(20), height: resolveLogoSize(20) }}
                >
                  V
                </div>
              )}
            <div className="md:flex-1">
              <h3 className="text-xs font-bold mb-1" style={{ color: colors.heading }}>VietAdmin</h3>
              <p className="text-[10px] leading-relaxed line-clamp-2" style={{ color: colors.textMuted }}>{config.description || 'Đối tác tin cậy của bạn trong mọi giải pháp công nghệ.'}</p>
            </div>
          </div>

          <div className="mb-4 pb-3" style={{ borderBottom: `1px solid ${colors.borderSoft}` }}>
            <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2">
              {columns.flatMap(col => col.links).slice(0, 10).map((link, i) => (
                <span key={i} className="text-[10px] font-medium" style={{ color: colors.link }}>{link.label}</span>
              ))}
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {config.showSocialLinks && (
              <div className="flex gap-2">
                {socials.map((s, index) => {
                  const socialStyles = resolveSocialStyles(s.platform, colors.stackedSocialBg, colors.stackedSocialText);

                  return (
                    <span
                      key={`${s.id ?? 'social'}-${index}`}
                      className="h-9 w-9 flex items-center justify-center rounded-lg"
                      style={{ backgroundColor: socialStyles.bg, color: socialStyles.color }}
                    >
                      <SocialIcon platform={s.platform} size={18} />
                    </span>
                  );
                })}
              </div>
            )}
            <div className="flex flex-col md:flex-row items-center gap-2">
              {renderBctLogo(36)}
              {config.showCopyright !== false && (
                <p className="text-[10px]" style={{ color: colors.textSubtle }}>
                  {config.copyright || '© 2024 VietAdmin. All rights reserved.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </footer>
    );
  };

  return (
    <>
      <PreviewWrapper
        title="Preview Footer"
        device={device}
        setDevice={setDevice}
        previewStyle={previewStyle}
        setPreviewStyle={setPreviewStyle}
        styles={styles}
        deviceWidthClass={deviceWidths[device]}
        info={mode === 'dual' ? '2 màu' : '1 màu'}
        fontStyle={fontStyle}
        fontClassName={fontClassName}
      >
        {preview()}
      </PreviewWrapper>
      <ColorInfoPanel brandColor={brandColor} secondary={secondary} />
    </>
  );
};
