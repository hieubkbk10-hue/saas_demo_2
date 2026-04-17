export type ContactLayoutStyle = 'form-only' | 'with-map' | 'with-info';

export type ContactExperienceConfig = {
  layoutStyle: ContactLayoutStyle;
  showMap: boolean;
  showContactInfo: boolean;
  showSocialLinks: boolean;
};

export const CONTACT_EXPERIENCE_KEY = 'contact_ui' as const;

export const DEFAULT_CONTACT_CONFIG: ContactExperienceConfig = {
  layoutStyle: 'with-info',
  showContactInfo: true,
  showMap: true,
  showSocialLinks: true,
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isLayoutStyle = (value: unknown): value is ContactLayoutStyle => {
  return value === 'form-only' || value === 'with-map' || value === 'with-info';
};

const mergeLegacyLayout = (
  value: unknown,
  fallback: Pick<ContactExperienceConfig, 'showContactInfo' | 'showMap' | 'showSocialLinks'>
): Pick<ContactExperienceConfig, 'showContactInfo' | 'showMap' | 'showSocialLinks'> => {
  if (!isRecord(value)) {
    return fallback;
  }
  return {
    showContactInfo: typeof value.showContactInfo === 'boolean' ? value.showContactInfo : fallback.showContactInfo,
    showMap: typeof value.showMap === 'boolean' ? value.showMap : fallback.showMap,
    showSocialLinks: typeof value.showSocialLinks === 'boolean' ? value.showSocialLinks : fallback.showSocialLinks,
  };
};

export const parseContactExperienceConfig = (raw: unknown): ContactExperienceConfig => {
  const source = isRecord(raw) ? raw : {};
  const layoutsRaw = isRecord(source.layouts) ? source.layouts : {};
  const layoutStyle = isLayoutStyle(source.layoutStyle) ? source.layoutStyle : DEFAULT_CONTACT_CONFIG.layoutStyle;
  const legacyLayout = mergeLegacyLayout(layoutsRaw[layoutStyle], DEFAULT_CONTACT_CONFIG);

  return {
    layoutStyle,
    showContactInfo: typeof source.showContactInfo === 'boolean' ? source.showContactInfo : legacyLayout.showContactInfo,
    showMap: typeof source.showMap === 'boolean' ? source.showMap : legacyLayout.showMap,
    showSocialLinks: typeof source.showSocialLinks === 'boolean' ? source.showSocialLinks : legacyLayout.showSocialLinks,
  };
};
