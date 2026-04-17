import { buildDefaultContactItems, DEFAULT_CONTACT_CONFIG } from './constants';
import type {
  ContactConfig,
  ContactConfigState,
  ContactInfoItem,
  ContactSocialLink,
  ContactStyle,
} from '../_types';

const CONTACT_STYLE_SET = new Set<ContactStyle>([
  'modern',
  'floating',
  'grid',
  'elegant',
  'minimal',
  'centered',
]);

const coerceText = (value: unknown) => {
  if (typeof value === 'string') {return value;}
  if (typeof value === 'number') {return String(value);}
  return '';
};

const toSocialRecord = (raw: unknown): Record<string, unknown> => {
  if (typeof raw === 'object' && raw !== null) {
    return raw as Record<string, unknown>;
  }
  return {};
};

const toItemRecord = (raw: unknown): Record<string, unknown> => {
  if (typeof raw === 'object' && raw !== null) {
    return raw as Record<string, unknown>;
  }
  return {};
};

const normalizeStyle = (value: unknown): ContactStyle => {
  if (typeof value === 'string' && CONTACT_STYLE_SET.has(value as ContactStyle)) {
    return value as ContactStyle;
  }
  return 'modern';
};

const normalizeSocialLinks = (input: unknown): ContactSocialLink[] => {
  if (!Array.isArray(input)) {return [];}

  return input.map((raw, index) => {
    const record = toSocialRecord(raw);
    const rawId = record.id;
    const id = typeof rawId === 'number'
      ? rawId
      : Number.parseInt(coerceText(rawId), 10);

    const platform = coerceText(record.platform);
    return {
      id: Number.isFinite(id) ? id : index + 1,
      platform,
      icon: coerceText(record.icon) || platform,
      url: coerceText(record.url),
    };
  });
};

const normalizeContactItems = (input: unknown, legacy: Record<string, string>): ContactInfoItem[] => {
  if (Array.isArray(input) && input.length > 0) {
    return input.map((raw, index) => {
      const record = toItemRecord(raw);
      const rawId = record.id;
      const id = typeof rawId === 'number'
        ? rawId
        : Number.parseInt(coerceText(rawId), 10);

      return {
        id: Number.isFinite(id) ? id : index + 1,
        icon: coerceText(record.icon) || 'circle-help',
        label: coerceText(record.label),
        value: coerceText(record.value),
        href: coerceText(record.href),
        fieldKey: coerceText(record.fieldKey),
      };
    });
  }

  return buildDefaultContactItems().map((item) => {
    const legacyValue = item.fieldKey ? legacy[item.fieldKey] : '';
    let href = item.href || '';
    if (item.fieldKey === 'contact_phone' && legacyValue) {
      href = `tel:${legacyValue}`;
    }
    if (item.fieldKey === 'contact_email' && legacyValue) {
      href = `mailto:${legacyValue}`;
    }

    return {
      ...item,
      value: legacyValue || item.value,
      href,
    };
  });
};

const normalizeTexts = (input: unknown): Record<string, string> => {
  if (typeof input === 'object' && input !== null) {
    const record = input as Record<string, unknown>;
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(record)) {
      result[key] = coerceText(value);
    }
    return result;
  }
  return {};
};

export const normalizeContactConfig = (rawConfig: unknown): ContactConfigState => {
  const config = (typeof rawConfig === 'object' && rawConfig !== null)
    ? rawConfig as Record<string, unknown>
    : {};

  const defaultConfig = DEFAULT_CONTACT_CONFIG;
  const legacy = {
    contact_address: coerceText(config.address) || defaultConfig.address || '',
    contact_phone: coerceText(config.phone) || defaultConfig.phone || '',
    contact_email: coerceText(config.email) || defaultConfig.email || '',
    working_hours: coerceText(config.workingHours) || defaultConfig.workingHours || '',
  };

  return {
    contactItems: normalizeContactItems(config.contactItems, legacy),
    address: legacy.contact_address,
    email: legacy.contact_email,
    formDescription: coerceText(config.formDescription) || defaultConfig.formDescription,
    formFields: Array.isArray(config.formFields)
      ? config.formFields.map((field) => coerceText(field)).filter((field) => field.trim().length > 0)
      : [...defaultConfig.formFields],
    formTitle: coerceText(config.formTitle) || defaultConfig.formTitle,
    mapEmbed: coerceText(config.mapEmbed) || defaultConfig.mapEmbed,
    phone: legacy.contact_phone,
    responseTimeText: coerceText(config.responseTimeText) || defaultConfig.responseTimeText,
    showMap: typeof config.showMap === 'boolean' ? config.showMap : defaultConfig.showMap,
    socialLinks: normalizeSocialLinks(config.socialLinks),
    useOriginalSocialIconColors: config.useOriginalSocialIconColors !== false,
    submitButtonText: coerceText(config.submitButtonText) || defaultConfig.submitButtonText,
    workingHours: legacy.working_hours,
    style: normalizeStyle(config.style),
    showForm: typeof config.showForm === 'boolean' ? config.showForm : defaultConfig.showForm,
    texts: normalizeTexts(config.texts),
  };
};

export const toContactConfigPayload = (config: ContactConfigState): ContactConfig => {
  const normalized = normalizeContactConfig(config);
  return {
    address: normalized.address,
    contactItems: normalized.contactItems.map((item) => ({ ...item })),
    email: normalized.email,
    formDescription: normalized.formDescription,
    formFields: [...normalized.formFields],
    formTitle: normalized.formTitle,
    mapEmbed: normalized.mapEmbed,
    phone: normalized.phone,
    responseTimeText: normalized.responseTimeText,
    showMap: normalized.showMap,
    socialLinks: normalized.socialLinks.map((item) => ({ ...item })),
    useOriginalSocialIconColors: normalized.useOriginalSocialIconColors !== false,
    submitButtonText: normalized.submitButtonText,
    workingHours: normalized.workingHours,
    showForm: normalized.showForm,
    texts: normalized.texts,
  };
};

export const toContactSnapshot = (payload: {
  title: string;
  active: boolean;
  config: ContactConfigState;
}) => {
  const normalized = normalizeContactConfig(payload.config);

  return JSON.stringify({
    title: payload.title,
    active: payload.active,
    config: {
      address: normalized.address,
      contactItems: normalized.contactItems.map((item) => ({ ...item })),
      email: normalized.email,
      formDescription: normalized.formDescription,
      formFields: [...normalized.formFields],
      formTitle: normalized.formTitle,
      mapEmbed: normalized.mapEmbed,
      phone: normalized.phone,
      responseTimeText: normalized.responseTimeText,
      showMap: normalized.showMap,
      socialLinks: normalized.socialLinks.map((link) => ({
        id: link.id,
        icon: link.icon,
        platform: link.platform,
        url: link.url,
      })),
      useOriginalSocialIconColors: normalized.useOriginalSocialIconColors !== false,
      submitButtonText: normalized.submitButtonText,
      workingHours: normalized.workingHours,
      style: normalized.style,
      showForm: normalized.showForm,
      texts: normalized.texts,
    },
  });
};
