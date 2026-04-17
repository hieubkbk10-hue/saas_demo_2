'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle, Label } from '@/app/admin/components/ui';
import { getContactMapDataFromSettings } from '@/lib/contact/getContactMapData';
import { ToggleSwitch } from '@/components/modules/shared';
import type { ContactConfigState } from '../_types';
import { validateContactConfig } from '../_lib/validation';
import { FormFieldsSelector } from './FormFieldsSelector';
import { ContactInfoItemsManager } from './ContactInfoItemsManager';
import { SocialLinksManager } from './SocialLinksManager';
import { DynamicTextFields } from './DynamicTextFields';

interface ConfigEditorProps {
  value: ContactConfigState;
  onChange: (config: ContactConfigState) => void;
  title?: string;
}

interface ValidationErrors {
  mapEmbed?: string;
  contactItems?: Record<number, { href?: string }>;
  socialLinks?: Record<number, { url?: string }>;
}

export function ConfigEditor({ value, onChange, title }: ConfigEditorProps) {
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const contactSettings = useQuery(api.settings.listByGroup, { group: 'contact' });
  const socialSettings = useQuery(api.settings.listByGroup, { group: 'social' });
  const mapData = useMemo(() => getContactMapDataFromSettings(contactSettings ?? []), [contactSettings]);
  const isSettingsLoading = contactSettings === undefined;
  const isSocialSettingsLoading = socialSettings === undefined;

  // Validate config và track errors
  useEffect(() => {
    const result = validateContactConfig(value);
    setValidationErrors(result.errors);
  }, [value]);

  // Helper để update config không mutate
  const updateConfig = (updates: Partial<ContactConfigState>) => {
    onChange({ ...value, ...updates });
  };

  // Helper để update nested texts
  const updateTexts = (texts: Record<string, string>) => {
    onChange({ ...value, texts });
  };

  const updateContactItems = (contactItems: typeof value.contactItems) => {
    onChange({ ...value, contactItems });
  };

  // Helper để update socialLinks
  const updateSocialLinks = (socialLinks: typeof value.socialLinks) => {
    onChange({ ...value, socialLinks });
  };

  // Helper để update formFields
  const updateFormFields = (formFields: string[]) => {
    onChange({ ...value, formFields });
  };

  return (
    <div className="space-y-6">
      {title && (
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h2>
      )}

      <Card>
        <CardHeader className="py-3 space-y-1">
          <CardTitle className="text-base">Dữ liệu liên hệ</CardTitle>
          <p className="text-xs text-slate-500">Giá trị hiển thị trên preview/site.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Hiển thị bản đồ
            </label>
            <ToggleSwitch
              enabled={!!value.showMap}
              onChange={() => updateConfig({ showMap: !value.showMap })}
              color="bg-blue-500"
            />
          </div>

            {value.showMap && (
              <div className="space-y-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  {isSettingsLoading ? (
                    <p>Đang tải cấu hình bản đồ...</p>
                  ) : (
                    <ul className="space-y-1">
                      <li>Provider: <strong className="text-slate-800">{mapData.mapProvider === 'google_embed' ? 'Google Maps nhúng' : 'OpenStreetMap'}</strong></li>
                      <li>Địa chỉ: <strong className="text-slate-800">{mapData.address || 'Chưa có địa chỉ'}</strong></li>
                      {mapData.mapProvider === 'google_embed' && (
                        <li>Iframe: <strong className="text-slate-800">{mapData.googleMapEmbedIframe ? 'Đã có' : 'Chưa có'}</strong></li>
                      )}
                      {mapData.mapProvider === 'openstreetmap' && (
                        <li>Toạ độ: <strong className="text-slate-800">{mapData.lat.toFixed(6)}, {mapData.lng.toFixed(6)}</strong></li>
                      )}
                    </ul>
                  )}
                </div>
                <Link href="/admin/settings" className="text-xs font-medium text-blue-600 hover:underline">
                  Mở Settings để cập nhật →
                </Link>
              </div>
            )}

          <ContactInfoItemsManager
            items={value.contactItems}
            onChange={updateContactItems}
            settings={contactSettings ?? []}
            isLoadingSettings={isSettingsLoading}
            validationErrors={validationErrors.contactItems}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Form liên hệ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Bật form liên hệ
            </label>
            <ToggleSwitch
              enabled={!!value.showForm}
              onChange={() => updateConfig({ showForm: !value.showForm })}
              color="bg-blue-500"
            />
          </div>

            {value.showForm ? (
              <>
                <FormFieldsSelector
                  selected={value.formFields}
                  onChange={updateFormFields}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="formTitle"
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Tiêu đề form
                    </label>
                    <input
                      id="formTitle"
                      type="text"
                      value={value.formTitle || ''}
                      onChange={(e) => updateConfig({ formTitle: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="submitButtonText"
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Text nút gửi
                    </label>
                    <input
                      id="submitButtonText"
                      type="text"
                      value={value.submitButtonText || ''}
                      onChange={(e) => updateConfig({ submitButtonText: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="submitButtonText"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Text nút gửi
                  </label>
                  <input
                    id="submitButtonText"
                    type="text"
                    value={value.submitButtonText || ''}
                    onChange={(e) => updateConfig({ submitButtonText: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label
                    htmlFor="responseTimeText"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Thời gian phản hồi
                  </label>
                  <input
                    id="responseTimeText"
                    type="text"
                    value={value.responseTimeText || ''}
                    onChange={(e) => updateConfig({ responseTimeText: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-500">
                Bật form để chỉnh tiêu đề, mô tả, nút gửi và trường nhập.
              </p>
            )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Mạng xã hội</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.useOriginalSocialIconColors !== false}
              onChange={(event) => { updateConfig({ useOriginalSocialIconColors: event.target.checked }); }}
              className="w-4 h-4 rounded"
            />
            <Label>Dùng màu icon gốc</Label>
          </div>
          <SocialLinksManager
            links={value.socialLinks}
            onChange={updateSocialLinks}
            contactSettings={contactSettings ?? []}
            socialSettings={socialSettings ?? []}
            isLoadingSettings={isSettingsLoading || isSocialSettingsLoading}
            validationErrors={validationErrors.socialLinks}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3 space-y-1">
          <CardTitle className="text-base">Nhãn hiển thị</CardTitle>
          <p className="text-xs text-slate-500">Chỉ đổi chữ hiển thị, không đổi dữ liệu liên hệ.</p>
        </CardHeader>
        <CardContent>
          <DynamicTextFields
            style={value.style}
            texts={value.texts || {}}
            onChange={updateTexts}
          />
        </CardContent>
      </Card>
    </div>
  );
}
