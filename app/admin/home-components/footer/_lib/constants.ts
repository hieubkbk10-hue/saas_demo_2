import type { FooterConfig, FooterMaxWidth, FooterStyle } from '../_types';

export const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  columns: [
    {
      links: [{ label: '', url: '' }],
      title: '',
    },
  ],
  copyright: '',
  description: '',
  logo: '',
  maxWidth: '7xl',
  logoSizeLevel: 1,
  showCopyright: true,
  showBctLogo: false,
  bctLogoType: 'thong-bao',
  bctLogoLink: '',
  showSocialLinks: true,
  useOriginalSocialIconColors: true,
  socialLinks: [
    {
      icon: 'facebook',
      platform: 'facebook',
      url: '',
    },
  ],
  style: 'classic',
};

type FooterLogoLevel = NonNullable<FooterConfig['logoSizeLevel']>;

const clampLogoSizeLevel = (level?: number): FooterLogoLevel => {
  const value = Number.isFinite(level) ? Math.round(level as number) : 1;
  return Math.min(10, Math.max(1, value)) as FooterLogoLevel;
};

const FOOTER_LOGO_MAX_SCALE = 1 + (5 / 9) * 7;

export const getFooterLogoScale = (level?: number) => {
  const safeLevel = clampLogoSizeLevel(level);
  return 1 + ((safeLevel - 1) / 9) * (FOOTER_LOGO_MAX_SCALE - 1);
};

export const getFooterLogoSize = (baseSize: number, level?: number) => (
  Math.round(baseSize * getFooterLogoScale(level))
);

const FOOTER_STYLES: FooterStyle[] = ['classic', 'modern', 'corporate', 'minimal', 'centered', 'stacked'];
const FOOTER_MAX_WIDTHS: FooterMaxWidth[] = ['6xl', '7xl', '8xl', '9xl'];
const BCT_LOGO_TYPES = ['thong-bao', 'dang-ky'] as const;

export const getFooterMaxWidthClass = (value?: FooterMaxWidth) => {
  const resolved = value && FOOTER_MAX_WIDTHS.includes(value) ? value : DEFAULT_FOOTER_CONFIG.maxWidth ?? '7xl';
  return `max-w-${resolved}`;
};

export const normalizeFooterConfig = (raw: Partial<FooterConfig> | null | undefined): FooterConfig => {
  const safe = raw ?? {};
  const columns = Array.isArray(safe.columns) && safe.columns.length > 0
    ? safe.columns
    : DEFAULT_FOOTER_CONFIG.columns;
  const socialLinks = Array.isArray(safe.socialLinks) && safe.socialLinks.length > 0
    ? safe.socialLinks
    : DEFAULT_FOOTER_CONFIG.socialLinks;
  const styleCandidate = safe.style && FOOTER_STYLES.includes(safe.style as FooterStyle)
    ? (safe.style as FooterStyle)
    : DEFAULT_FOOTER_CONFIG.style;
  const maxWidthCandidate = safe.maxWidth && FOOTER_MAX_WIDTHS.includes(safe.maxWidth as FooterMaxWidth)
    ? (safe.maxWidth as FooterMaxWidth)
    : DEFAULT_FOOTER_CONFIG.maxWidth;

  return {
    columns: columns.map((column, index) => ({
      id: column.id ?? index + 1,
      links: Array.isArray(column.links) && column.links.length > 0
        ? column.links.map((link) => ({
          label: typeof link.label === 'string' ? link.label : '',
          url: typeof link.url === 'string' ? link.url : '',
        }))
        : [{ label: '', url: '' }],
      title: typeof column.title === 'string' ? column.title : '',
    })),
    copyright: typeof safe.copyright === 'string' ? safe.copyright : DEFAULT_FOOTER_CONFIG.copyright,
    description: typeof safe.description === 'string' ? safe.description : DEFAULT_FOOTER_CONFIG.description,
    logo: typeof safe.logo === 'string' ? safe.logo : DEFAULT_FOOTER_CONFIG.logo,
    maxWidth: maxWidthCandidate,
    logoSizeLevel: clampLogoSizeLevel(safe.logoSizeLevel),
    showCopyright: safe.showCopyright !== false,
    showBctLogo: safe.showBctLogo === true,
    bctLogoType: BCT_LOGO_TYPES.includes(safe.bctLogoType as typeof BCT_LOGO_TYPES[number])
      ? (safe.bctLogoType as typeof BCT_LOGO_TYPES[number])
      : DEFAULT_FOOTER_CONFIG.bctLogoType,
    bctLogoLink: typeof safe.bctLogoLink === 'string' ? safe.bctLogoLink : DEFAULT_FOOTER_CONFIG.bctLogoLink,
    showSocialLinks: safe.showSocialLinks !== false,
    useOriginalSocialIconColors: safe.useOriginalSocialIconColors !== false,
    socialLinks: socialLinks.map((social, index) => ({
      icon: typeof social.icon === 'string' ? social.icon : (typeof social.platform === 'string' ? social.platform : 'facebook'),
      id: social.id ?? index + 1,
      platform: typeof social.platform === 'string' ? social.platform : 'facebook',
      url: typeof social.url === 'string' ? social.url : '',
    })),
    style: styleCandidate,
  };
};
