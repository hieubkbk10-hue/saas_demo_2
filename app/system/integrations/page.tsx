'use client';

import React, { useMemo, useState } from 'react';
import { Eye, EyeOff, Loader2, Save, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useI18n } from '../i18n/context';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SETTINGS_KEYS = [
  'mail_driver',
  'mail_host',
  'mail_port',
  'mail_username',
  'mail_password',
  'mail_encryption',
  'mail_from_email',
  'mail_from_name',
] as const;

type SettingsKey = (typeof SETTINGS_KEYS)[number];

const sanitizeHtml = (html: string) => html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');

const toSafeString = (value: unknown) => (typeof value === 'string' ? value : '');

export default function IntegrationsPage() {
  const { t } = useI18n();
  const settings = useQuery(api.settings.getMultiple, { keys: [...SETTINGS_KEYS] });
  const setMultiple = useMutation(api.settings.setMultiple);

  const [form, setForm] = useState<Record<SettingsKey, string>>({
    mail_driver: 'smtp',
    mail_host: '',
    mail_port: '587',
    mail_username: '',
    mail_password: '',
    mail_encryption: 'tls',
    mail_from_email: '',
    mail_from_name: '',
  });
  const [initialForm, setInitialForm] = useState<Record<SettingsKey, string>>(form);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [previewSubject, setPreviewSubject] = useState('Xin chào từ VietAdmin');
  const [previewHtml, setPreviewHtml] = useState('<p>Đây là email test từ hệ thống.</p>');
  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  React.useEffect(() => {
    if (!settings) {return;}
    const nextForm = { ...form };
    SETTINGS_KEYS.forEach((key) => {
      const value = settings[key];
      nextForm[key] = toSafeString(value);
    });
    if (!nextForm.mail_driver) {nextForm.mail_driver = 'smtp';}
    if (!nextForm.mail_encryption) {nextForm.mail_encryption = 'tls';}
    setForm(nextForm);
    setInitialForm(nextForm);
  }, [settings]);

  const hasChanges = useMemo(
    () => SETTINGS_KEYS.some((key) => form[key] !== initialForm[key]),
    [form, initialForm]
  );

  const updateField = (key: SettingsKey, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validatePort = () => {
    if (!form.mail_port) {return true;}
    const port = Number(form.mail_port);
    return Number.isFinite(port) && port > 0;
  };

  const handleSave = async () => {
    if (!validatePort()) {
      toast.error(t.integrations.invalidPort);
      return;
    }

    setIsSaving(true);
    try {
      const settingsToSave = SETTINGS_KEYS.map((key) => ({
        group: 'mail',
        key,
        value: form[key].trim(),
      }));
      await setMultiple({ settings: settingsToSave });
      setInitialForm({ ...form });
      toast.success(t.integrations.saved);
    } catch {
      toast.error(t.integrations.saveError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!EMAIL_REGEX.test(testEmail.trim())) {
      toast.error(t.integrations.invalidEmail);
      return;
    }
    if (!form.mail_host || !form.mail_port || !form.mail_username || !form.mail_password || !form.mail_from_email) {
      toast.error(t.integrations.requiredConfig);
      return;
    }
    if (!validatePort()) {
      toast.error(t.integrations.invalidPort);
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('/api/system/integrations/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail.trim(),
          subject: previewSubject.trim() || 'Test email',
          html: previewHtml || '<p>Test email</p>',
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.message || t.integrations.testError);
      }
      toast.success(t.integrations.testSuccess);
    } catch (error) {
      const message = error instanceof Error ? error.message : t.integrations.testError;
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.integrations.title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t.integrations.subtitle}</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t.integrations.smtpConfig}</h3>
          <span className="text-[10px] px-2 py-0.5 rounded border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
            SMTP
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs text-slate-500">{t.integrations.fromName}</label>
            <input
              value={form.mail_from_name}
              onChange={(e) => updateField('mail_from_name', e.target.value)}
              className="w-full rounded border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">{t.integrations.fromEmail}</label>
            <input
              value={form.mail_from_email}
              onChange={(e) => updateField('mail_from_email', e.target.value)}
              className="w-full rounded border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">{t.integrations.host}</label>
            <input
              value={form.mail_host}
              onChange={(e) => updateField('mail_host', e.target.value)}
              className="w-full rounded border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 px-3 py-2 text-sm font-mono"
              placeholder="smtp.gmail.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">{t.integrations.port}</label>
            <input
              value={form.mail_port}
              onChange={(e) => updateField('mail_port', e.target.value)}
              className="w-full rounded border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 px-3 py-2 text-sm font-mono"
              inputMode="numeric"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">{t.integrations.username}</label>
            <input
              value={form.mail_username}
              onChange={(e) => updateField('mail_username', e.target.value)}
              className="w-full rounded border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">{t.integrations.password}</label>
            <div className="relative">
              <input
                value={form.mail_password}
                onChange={(e) => updateField('mail_password', e.target.value)}
                type={showPassword ? 'text' : 'password'}
                className="w-full rounded border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 px-3 py-2 text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                title={showPassword ? 'Hide' : 'Show'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">{t.integrations.encryption}</label>
            <select
              value={form.mail_encryption}
              onChange={(e) => updateField('mail_encryption', e.target.value)}
              className="w-full rounded border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 px-3 py-2 text-sm"
            >
              <option value="tls">TLS</option>
              <option value="ssl">SSL</option>
              <option value="">None</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          {hasChanges && (
            <span className="text-xs text-amber-600 dark:text-amber-400">Có thay đổi chưa lưu</span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded border border-slate-300 dark:border-slate-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isSaving ? t.integrations.saving : t.integrations.save}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t.integrations.previewTitle}</h3>
          <div className="space-y-2">
            <label className="text-xs text-slate-500">{t.integrations.previewSubject}</label>
            <input
              value={previewSubject}
              onChange={(e) => setPreviewSubject(e.target.value)}
              className="w-full rounded border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-slate-500">{t.integrations.previewHtml}</label>
            <textarea
              value={previewHtml}
              onChange={(e) => setPreviewHtml(e.target.value)}
              className="w-full min-h-[160px] rounded border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 px-3 py-2 text-sm font-mono"
            />
          </div>
          <p className="text-xs text-slate-500">{t.integrations.previewHint}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t.integrations.previewTitle}</h3>
          <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-950">
            <div className="text-xs text-slate-500 mb-2">{previewSubject || 'Email Subject'}</div>
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewHtml || '') }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t.integrations.testTitle}</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="flex-1 rounded border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 px-3 py-2 text-sm"
            placeholder="you@example.com"
          />
          <button
            onClick={handleSendTest}
            disabled={isSending}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded transition-colors disabled:opacity-50"
          >
            {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {isSending ? t.integrations.testSending : t.integrations.testSend}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-2">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t.integrations.limitsTitle}</h3>
        <p className="text-xs text-slate-500">{t.integrations.limitsDesc}</p>
        <ul className="text-xs text-slate-600 dark:text-slate-400 list-disc pl-4 space-y-1">
          <li>{t.integrations.limitsDaily}</li>
          <li>{t.integrations.limitsRecipients}</li>
          <li>{t.integrations.limitsWorkspace}</li>
        </ul>
      </div>
    </div>
  );
}
