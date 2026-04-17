export interface ContactInfoItem {
  id: number;
  icon: string;
  label: string;
  value: string;
  href?: string;
  fieldKey?: string;
}

export interface ContactSocialLink {
  id: number;
  platform: string;
  icon: string;
  url: string;
}

export type ContactStyle = 'modern' | 'floating' | 'grid' | 'elegant' | 'minimal' | 'centered';

export type ContactBrandMode = 'single' | 'dual';

export interface ContactConfig {
  showMap: boolean;
  mapEmbed: string;
  contactItems: ContactInfoItem[];
  address?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  formFields: string[];
  socialLinks: ContactSocialLink[];
  useOriginalSocialIconColors?: boolean;
  showForm?: boolean;
  formTitle?: string;
  formDescription?: string;
  submitButtonText?: string;
  responseTimeText?: string;
  texts?: Record<string, string>;
}

export interface ContactConfigState extends ContactConfig {
  style: ContactStyle;
}
