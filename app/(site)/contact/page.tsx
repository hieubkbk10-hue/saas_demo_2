'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Mail, MapPin, Phone, Receipt } from 'lucide-react';
import { useContactPageData } from '@/components/site/useContactPageData';
import OpenStreetMapDisplay from '@/components/maps/OpenStreetMapDisplay';
import { ContactInquiryForm } from '@/components/contact/ContactInquiryForm';
import { sanitizeGoogleMapIframe } from '@/lib/contact/getContactMapData';

type SocialLinkItem = { label: string; href: string; color: string; icon: React.ElementType };

const toHex = (value: string) => (value.startsWith('#') ? value.slice(1) : value);

const hexToRgb = (hex: string) => {
  const normalized = toHex(hex);
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return { r, g, b };
};

const darkenColor = (hex: string, amount: number) => {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return hex;
  }
  const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)));
  return `#${clamp(rgb.r * (1 - amount)).toString(16).padStart(2, '0')}${clamp(rgb.g * (1 - amount)).toString(16).padStart(2, '0')}${clamp(rgb.b * (1 - amount)).toString(16).padStart(2, '0')}`;
};

const withAlpha = (hex: string, alpha: number) => {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return hex;
  }
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

const isValidHexColor = (value: string) => /^#[0-9A-Fa-f]{6}$/.test(value.trim());

const resolveSecondary = (primary: string, secondary: string, mode: 'single' | 'dual') => {
  if (mode === 'single') {
    return primary;
  }
  if (secondary && isValidHexColor(secondary)) {
    return secondary;
  }
  return primary;
};


function ContactInfoCard({
  brandColor,
  secondaryColor,
  address,
  email,
  phone,
  taxId,
  showSocialLinks,
  socialLinks,
}: {
  brandColor: string;
  secondaryColor: string;
  address: string;
  email: string;
  phone: string;
  taxId: string;
  showSocialLinks: boolean;
  socialLinks: SocialLinkItem[];
}) {
  const infoItems = [
    { label: 'Điện thoại', value: phone, icon: Phone },
    { label: 'Email', value: email, icon: Mail },
    { label: 'Địa chỉ', value: address, icon: MapPin },
    { label: 'Mã số thuế', value: taxId, icon: Receipt },
  ].filter((item) => item.value);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="font-semibold mb-4" style={{ color: brandColor }}>Thông tin liên hệ</h3>
      <div className="space-y-4">
        {infoItems.length === 0 ? (
          <div className="text-sm text-slate-500">Chưa có dữ liệu liên hệ.</div>
        ) : (
          infoItems.map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-200">
                <item.icon size={18} style={{ color: secondaryColor }} />
              </div>
              <div>
                <div className="font-medium text-slate-900">{item.label}</div>
                <div className="text-sm text-slate-500 break-words">{item.value}</div>
              </div>
            </div>
          ))
        )}
      </div>
      {showSocialLinks && socialLinks.length > 0 && (
        <div className="pt-4 mt-4 border-t border-slate-200">
          <div className="text-sm font-medium mb-2" style={{ color: secondaryColor }}>Theo dõi chúng tôi</div>
          <div className="flex flex-wrap gap-2">
            {socialLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: item.color }}
                aria-label={item.label}
              >
                <item.icon size={18} />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CorporateSidebar({
  address,
  email,
  phone,
  taxId,
  showSocialLinks,
  socialLinks,
  brandColor,
  secondaryColor,
}: {
  address: string;
  email: string;
  phone: string;
  taxId: string;
  showSocialLinks: boolean;
  socialLinks: SocialLinkItem[];
  brandColor: string;
  secondaryColor: string;
}) {
  const sidebarColor = darkenColor(brandColor, 0.5);
  const glowColor = withAlpha(brandColor, 0.18);
  const infoItems = [
    { label: 'Điện thoại', value: phone, note: 'Thứ 2 - Thứ 7, 8:00 - 17:00', icon: Phone },
    { label: 'Email', value: email, note: 'Phản hồi trong vòng 24 giờ', icon: Mail },
    { label: 'Văn phòng', value: address, note: '', icon: MapPin },
    { label: 'Mã số thuế', value: taxId, note: '', icon: Receipt },
  ].filter((item) => item.value);

  return (
    <div
      className="relative lg:w-5/12 text-white p-6 lg:p-8 flex flex-col justify-between overflow-hidden"
      style={{ backgroundColor: sidebarColor }}
    >
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full blur-3xl" style={{ backgroundColor: glowColor }} />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full blur-3xl" style={{ backgroundColor: glowColor }} />
      <div className="relative z-10">
        <h2 className="text-2xl font-bold tracking-tight mb-2">Liên hệ với chúng tôi</h2>
        <p className="text-white/80 text-sm mb-8">
          Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ giải pháp tốt nhất cho doanh nghiệp của bạn.
        </p>
        <div className="space-y-6">
          {infoItems.length === 0 ? (
            <div className="text-sm text-white/70">Chưa có dữ liệu liên hệ.</div>
          ) : (
            infoItems.map((item) => (
              <div key={item.label} className="flex items-start gap-4">
                <div className="bg-white/10 p-3 rounded-lg">
                  <item.icon size={20} style={{ color: secondaryColor }} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{item.label}</h3>
                  <p className="text-base font-semibold mt-1 break-words text-white">{item.value}</p>
                  {item.note && <p className="text-xs text-white/70 mt-1">{item.note}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {showSocialLinks && socialLinks.length > 0 && (
        <div className="relative z-10 mt-8">
          <h3 className="text-sm font-semibold text-white mb-3">Theo dõi chúng tôi</h3>
          <div className="flex gap-3">
            {socialLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: item.color }}
                aria-label={item.label}
              >
                <item.icon size={16} />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GoogleMapEmbed({ iframeHtml }: { iframeHtml: string }) {
  if (!iframeHtml) {
    return null;
  }
  return (
    <div
      className="rounded-xl overflow-hidden border"
      dangerouslySetInnerHTML={{ __html: iframeHtml }}
    />
  );
}

function MapPreview({
  address,
  lat,
  lng,
  mapProvider,
  googleMapEmbedIframe,
}: {
  address: string;
  lat: number;
  lng: number;
  mapProvider: 'openstreetmap' | 'google_embed';
  googleMapEmbedIframe: string;
}) {
  const sanitized = sanitizeGoogleMapIframe(googleMapEmbedIframe);
  if (mapProvider === 'google_embed' && sanitized) {
    return <GoogleMapEmbed iframeHtml={sanitized} />;
  }
  return (
    <OpenStreetMapDisplay
      location={{ lat, lng, address }}
      height="300px"
      zoom={15}
    />
  );
}

export default function ContactPage() {
  const { isLoading: isContactLoading, brandColor, secondaryColor, colorMode, config, contactData, socialLinks } = useContactPageData();
  const pathname = usePathname();
  const resolvedSecondary = resolveSecondary(brandColor, secondaryColor, colorMode);
  const isContactLoadingState = isContactLoading;

  if (isContactLoadingState) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-4 w-64 bg-slate-200 rounded-lg animate-pulse mt-3" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {config.layoutStyle !== 'form-only' && (
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: brandColor }}>Liên hệ với chúng tôi</h1>
          <p className="mt-2" style={{ color: resolvedSecondary }}>Chúng tôi luôn sẵn sàng hỗ trợ bạn.</p>
        </div>
      )}

      {config.layoutStyle === 'form-only' && (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 flex flex-col lg:flex-row">
          {config.showContactInfo && (
            <CorporateSidebar
              address={contactData.address}
              email={contactData.email}
              phone={contactData.phone}
              taxId={contactData.taxId}
              showSocialLinks={config.showSocialLinks}
              socialLinks={socialLinks}
              brandColor={brandColor}
              secondaryColor={resolvedSecondary}
            />
          )}
          <div className={`${config.showContactInfo ? 'lg:w-7/12' : 'w-full'} bg-white p-6 lg:p-8 space-y-6`}>
            <ContactInquiryForm
              brandColor={brandColor}
              secondaryColor={resolvedSecondary}
              sourcePath={pathname}
              subjectFallback="Liên hệ từ trang /contact"
            />
            {config.showMap && (
              <MapPreview
                address={contactData.address}
                lat={contactData.lat}
                lng={contactData.lng}
                mapProvider={contactData.mapProvider}
                googleMapEmbedIframe={contactData.googleMapEmbedIframe}
              />
            )}
          </div>
        </div>
      )}

      {config.layoutStyle === 'with-map' && (
        <div className="space-y-4">
          {config.showMap && (
            <MapPreview
              address={contactData.address}
              lat={contactData.lat}
              lng={contactData.lng}
              mapProvider={contactData.mapProvider}
              googleMapEmbedIframe={contactData.googleMapEmbedIframe}
            />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ContactInquiryForm
              brandColor={brandColor}
              secondaryColor={resolvedSecondary}
              sourcePath={pathname}
              subjectFallback="Liên hệ từ trang /contact"
            />
            {config.showContactInfo && (
              <ContactInfoCard
                brandColor={brandColor}
                secondaryColor={resolvedSecondary}
                address={contactData.address}
                email={contactData.email}
                phone={contactData.phone}
                taxId={contactData.taxId}
                showSocialLinks={config.showSocialLinks}
                socialLinks={socialLinks}
              />
            )}
          </div>
        </div>
      )}

      {config.layoutStyle === 'with-info' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <ContactInquiryForm
              brandColor={brandColor}
              secondaryColor={resolvedSecondary}
              sourcePath={pathname}
              subjectFallback="Liên hệ từ trang /contact"
            />
          </div>
          <div className="lg:col-span-2 space-y-6">
            {config.showContactInfo && (
              <ContactInfoCard
                brandColor={brandColor}
                secondaryColor={resolvedSecondary}
                address={contactData.address}
                email={contactData.email}
                phone={contactData.phone}
                taxId={contactData.taxId}
                showSocialLinks={config.showSocialLinks}
                socialLinks={socialLinks}
              />
            )}
            {config.showMap && (
              <MapPreview
                address={contactData.address}
                lat={contactData.lat}
                lng={contactData.lng}
                mapProvider={contactData.mapProvider}
                googleMapEmbedIframe={contactData.googleMapEmbedIframe}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
