'use client';

import React from 'react';
import { ToggleSwitch } from '@/components/modules/shared';
import { Card, CardContent, CardHeader, CardTitle, Input, Label } from '../../../components/ui';
import { MultiImageUploader } from '../../../components/MultiImageUploader';
import type { HeroContent, HeroSlide, HeroStyle } from '../_types';

export const HeroForm = ({
  heroSlides,
  setHeroSlides,
  heroStyle,
  heroContent,
  setHeroContent,
}: {
  heroSlides: HeroSlide[];
  setHeroSlides: (slides: HeroSlide[]) => void;
  heroStyle: HeroStyle;
  heroContent: HeroContent;
  setHeroContent: (content: HeroContent) => void;
}) => (
  <>
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-base">Danh sách Banner (Slider)</CardTitle>
      </CardHeader>
      <CardContent>
        <MultiImageUploader<HeroSlide>
          items={heroSlides}
          onChange={setHeroSlides}
          folder="hero-banners"
          imageKey="url"
          extraFields={[{ key: 'link', placeholder: 'URL liên kết (khi click vào banner)', type: 'url' }]}
          minItems={1}
          maxItems={10}
          aspectRatio="banner"
          columns={1}
          showReorder={true}
          addButtonText="Thêm Banner"
          emptyText="Chưa có banner nào"
        />
      </CardContent>
    </Card>

    {['fullscreen', 'split', 'parallax'].includes(heroStyle) && (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Nội dung Hero ({heroStyle})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {heroStyle === 'fullscreen' && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2">
              <div className="space-y-0.5">
                <Label className="text-sm">Hiển thị nội dung Hero</Label>
                <p className="text-xs text-slate-500">Tắt để ẩn chữ và lớp mờ trên ảnh</p>
              </div>
              <ToggleSwitch
                enabled={heroContent.showFullscreenContent !== false}
                onChange={() =>
                  setHeroContent({
                    ...heroContent,
                    showFullscreenContent: !(heroContent.showFullscreenContent !== false),
                  })
                }
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Badge / Nhãn</Label>
              <Input 
                value={heroContent.badge} 
                onChange={(e) =>{  setHeroContent({ ...heroContent, badge: e.target.value }); }}
                placeholder="VD: Nổi bật, Hot, Mới..."
              />
            </div>
            <div className="space-y-2">
              <Label>Tiêu đề chính</Label>
              <Input 
                value={heroContent.heading} 
                onChange={(e) =>{  setHeroContent({ ...heroContent, heading: e.target.value }); }}
                placeholder="Tiêu đề lớn hiển thị trên hero"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Mô tả</Label>
            <textarea 
              value={heroContent.description} 
              onChange={(e) =>{  setHeroContent({ ...heroContent, description: e.target.value }); }}
              placeholder="Mô tả ngắn gọn..."
              className="w-full min-h-[60px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nút chính</Label>
              <Input 
                value={heroContent.primaryButtonText} 
                onChange={(e) =>{  setHeroContent({ ...heroContent, primaryButtonText: e.target.value }); }}
                placeholder="VD: Khám phá ngay, Mua ngay..."
              />
            </div>
            {heroStyle === 'fullscreen' && (
              <div className="space-y-2">
                <Label>Nút phụ</Label>
                <Input 
                  value={heroContent.secondaryButtonText} 
                  onChange={(e) =>{  setHeroContent({ ...heroContent, secondaryButtonText: e.target.value }); }}
                  placeholder="VD: Tìm hiểu thêm..."
                />
              </div>
            )}
            {heroStyle === 'parallax' && (
              <div className="space-y-2">
                <Label>Text đếm ngược / Phụ</Label>
                <Input 
                  value={heroContent.countdownText} 
                  onChange={(e) =>{  setHeroContent({ ...heroContent, countdownText: e.target.value }); }}
                  placeholder="VD: Còn 3 ngày, Chỉ hôm nay..."
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Liên kết nút chính</Label>
              <Input 
                value={heroContent.primaryButtonLink} 
                onChange={(e) =>{  setHeroContent({ ...heroContent, primaryButtonLink: e.target.value }); }}
                placeholder="/contact hoặc https://..."
              />
            </div>
            {heroStyle === 'fullscreen' && (
              <div className="space-y-2">
                <Label>Liên kết nút phụ</Label>
                <Input 
                  value={heroContent.secondaryButtonLink} 
                  onChange={(e) =>{  setHeroContent({ ...heroContent, secondaryButtonLink: e.target.value }); }}
                  placeholder="/pricing hoặc https://..."
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )}
  </>
);
