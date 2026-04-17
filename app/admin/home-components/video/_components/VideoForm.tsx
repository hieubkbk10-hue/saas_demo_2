'use client';

import React from 'react';
import { Video as VideoIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Input, Label } from '@/app/admin/components/ui';
import { ImageFieldWithUpload } from '@/app/admin/components/ImageFieldWithUpload';
import { VIDEO_STYLES_WITH_CTA, TEXT_FIELDS, DEFAULT_TEXTS } from '../_lib/constants';
import { getVideoInfo } from '../_lib/colors';
import type { VideoConfig, VideoStyle } from '../_types';

interface VideoFormProps {
  config: VideoConfig;
  onChange: (next: VideoConfig) => void;
  selectedStyle: VideoStyle;
}

const updateConfig = (
  config: VideoConfig,
  patch: Partial<VideoConfig>,
  onChange: (next: VideoConfig) => void,
) => {
  onChange({ ...config, ...patch });
};

export function VideoForm({
  config,
  onChange,
  selectedStyle,
}: VideoFormProps) {
  const videoType = getVideoInfo(config.videoUrl || '').type;
  const showCTAConfig = VIDEO_STYLES_WITH_CTA.includes(selectedStyle);
  
  const textFields = TEXT_FIELDS[selectedStyle] || [];
  const defaultTexts = DEFAULT_TEXTS[selectedStyle] || {};
  const currentTexts = config.texts || {};
  
  const getTextValue = (key: string) => {
    return currentTexts[key] || defaultTexts[key] || '';
  };
  
  const updateTextValue = (key: string, value: string) => {
    onChange({
      ...config,
      texts: {
        ...currentTexts,
        [key]: value,
      },
    });
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <VideoIcon size={18} />
            Video
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URL Video <span className="text-red-500">*</span></Label>
            <Input
              type="url"
              value={config.videoUrl || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig(config, { videoUrl: e.target.value }, onChange)}
              placeholder="YouTube, YouTube Shorts, Google Drive hoặc link trực tiếp"
              required
            />
            {config.videoUrl?.trim() ? (
              <p className="text-xs text-slate-500">
                Loại video: <span className="font-medium capitalize">{videoType}</span>
                {videoType === 'youtube' && ' - Hỗ trợ embed tự động (YouTube, Shorts)'}
                {videoType === 'vimeo' && ' - Hỗ trợ embed tự động'}
                {videoType === 'drive' && ' - Hỗ trợ Google Drive embed'}
                {videoType === 'direct' && ' - Sử dụng video HTML5 trực tiếp'}
              </p>
            ) : null}
          </div>

          <ImageFieldWithUpload
            label="Thumbnail (ảnh bìa)"
            value={config.thumbnailUrl || ''}
            onChange={(thumbnailUrl) => updateConfig(config, { thumbnailUrl }, onChange)}
            folder="video-thumbnails"
            aspectRatio="video"
            quality={0.85}
            placeholder="Để trống sẽ tự động lấy thumbnail từ YouTube"
          />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Nội dung</CardTitle>
          <p className="text-xs text-slate-500 mt-1">Tùy chỉnh text cho style {selectedStyle}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {textFields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label>{field.label}</Label>
              {field.key === 'description' ? (
                <textarea
                  value={getTextValue(field.key)}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateTextValue(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full min-h-[96px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                />
              ) : (
                <Input
                  value={getTextValue(field.key)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateTextValue(field.key, e.target.value)}
                  placeholder={field.placeholder}
                />
              )}
            </div>
          ))}
          
          <div className="space-y-2">
            <Label>Tiêu đề (legacy)</Label>
            <Input
              value={config.heading || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig(config, { heading: e.target.value }, onChange)}
              placeholder="Tiêu đề video section (fallback)"
            />
            <p className="text-xs text-slate-500">Dùng khi texts config chưa có</p>
          </div>

          <div className="space-y-2">
            <Label>Mô tả ngắn (legacy)</Label>
            <textarea
              value={config.description || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateConfig(config, { description: e.target.value }, onChange)}
              placeholder="Mô tả cho video section... (fallback)"
              className="w-full min-h-[96px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            />
            <p className="text-xs text-slate-500">Dùng khi texts config chưa có</p>
          </div>
        </CardContent>
      </Card>

      {showCTAConfig ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">CTA & Badge</CardTitle>
            <p className="text-xs text-slate-500 mt-1">Cấu hình cho style {selectedStyle}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Badge / Label</Label>
              <Input
                value={config.badge || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig(config, { badge: e.target.value }, onChange)}
                placeholder="VD: Video mới, Giới thiệu, Featured..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nút CTA - Text</Label>
                <Input
                  value={config.buttonText || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig(config, { buttonText: e.target.value }, onChange)}
                  placeholder="VD: Tìm hiểu thêm, Xem ngay..."
                />
              </div>
              <div className="space-y-2">
                <Label>Nút CTA - Link</Label>
                <Input
                  value={config.buttonLink || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig(config, { buttonLink: e.target.value }, onChange)}
                  placeholder="/lien-he hoặc https://..."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Tùy chọn Video</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoplay === true}
                onChange={(e) => updateConfig(config, { autoplay: e.target.checked }, onChange)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">Tự động phát</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.loop === true}
                onChange={(e) => updateConfig(config, { loop: e.target.checked }, onChange)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">Lặp video</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.muted !== false}
                onChange={(e) => updateConfig(config, { muted: e.target.checked }, onChange)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">Tắt tiếng</span>
            </label>
          </div>
          <p className="text-xs text-slate-500">
            Lưu ý: để autoplay hoạt động ổn định, nên bật chế độ tắt tiếng (muted).
          </p>
        </CardContent>
      </Card>
    </>
  );
}
