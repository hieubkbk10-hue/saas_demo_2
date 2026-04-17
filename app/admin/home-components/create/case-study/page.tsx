'use client';

import React, { useState } from 'react';
import { AlertTriangle, Eye, Plus, Trash2 } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '../../../components/ui';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import {
  getCaseStudyValidationResult,
} from '../../case-study/_lib/colors';
import type {
  CaseStudyBrandMode,
  CaseStudyStyle,
} from '../../case-study/_types';
import { CaseStudyPreview } from '../../case-study/_components/CaseStudyPreview';
import { SettingsImageUploader } from '../../../components/SettingsImageUploader';

interface Project {
  id: string | number;
  title: string;
  category: string;
  image: string;
  description: string;
  link: string;
}

export default function CaseStudyCreatePage() {
  const COMPONENT_TYPE = 'CaseStudy';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Dự án thực tế', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;
  const brandMode: CaseStudyBrandMode = mode === 'single' ? 'single' : 'dual';
  const [warningMessages, setWarningMessages] = useState<string[]>([]);
  const [caseStudyStyle, setCaseStudyStyle] = useState<CaseStudyStyle>('grid');
  
  // Reset carousel index when changing away from carousel style
  React.useEffect(() => {
    if (caseStudyStyle !== 'carousel') {
      // No need to reset anything in create page
    }
  }, [caseStudyStyle]);
  
  const [projects, setProjects] = useState<Project[]>([
    { category: 'Website', description: 'Thiết kế và phát triển website doanh nghiệp', id: 'project-1', image: '', link: '', title: 'Dự án Website ABC Corp' },
    { category: 'Mobile App', description: 'Ứng dụng đặt hàng cho chuỗi F&B', id: 'project-2', image: '', link: '', title: 'Ứng dụng Mobile XYZ' }
  ]);

  const handleAddProject = () => {
    setProjects([...projects, { 
      category: '', 
      description: '', 
      id: `project-${Date.now()}`, 
      image: '', 
      link: '', 
      title: '' 
    }]);
  };

  const handleRemoveProject = (id: string | number) => {
    if (projects.length > 1) {
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  const updateProject = (id: string | number, field: keyof Project, value: string) => {
    setProjects(projects.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const onSubmit = (e: React.FormEvent) => {
    const { harmonyStatus, accessibility } = getCaseStudyValidationResult({
      primary,
      secondary,
      mode: brandMode,
      style: caseStudyStyle,
    });

    const warnings: string[] = [];

    if (brandMode === 'dual' && harmonyStatus.isTooSimilar) {
      warnings.push(`Hai màu quá giống nhau (deltaE = ${harmonyStatus.deltaE}).`);
    }

    if (accessibility.failing.length > 0) {
      warnings.push(`Một số cặp màu chữ/nền có độ tương phản thấp (minLc = ${accessibility.minLc.toFixed(1)}).`);
    }

    setWarningMessages(warnings);

    void handleSubmit(e, {
      projects: projects.map(p => ({ category: p.category, description: p.description, image: p.image, link: p.link, title: p.title })),
      style: caseStudyStyle,
    });
  };

  return (
    <ComponentFormWrapper
      type={COMPONENT_TYPE}
      title={title}
      setTitle={setTitle}
      active={active}
      setActive={setActive}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      customState={customState}
      showCustomBlock={showCustomBlock}
      setCustomState={setCustomState}
      systemColors={systemColors}
      customFontState={customFontState}
      showFontCustomBlock={showFontCustomBlock}
      setCustomFontState={setCustomFontState}
    >
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Dự án tiêu biểu</CardTitle>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={handleAddProject} 
            className="gap-2"
          >
            <Plus size={14} /> Thêm dự án
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {projects.map((project, idx) => (
            <div key={project.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Label>Dự án {idx + 1}</Label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="text-red-500 h-8 w-8" 
                  onClick={() =>{  handleRemoveProject(project.id); }}
                  disabled={projects.length <= 1}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Image upload */}
                <div>
                  <Label className="text-sm mb-2 block">Hình ảnh dự án</Label>
                  <SettingsImageUploader
                    value={project.image}
                    onChange={(url) =>{  updateProject(project.id, 'image', url ?? ''); }}
                    folder="case-studies"
                    previewSize="lg"
                  />
                </div>
                
                {/* Right: Info fields */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-slate-500">Tên dự án</Label>
                      <Input 
                        placeholder="VD: Website ABC Corp" 
                        value={project.title} 
                        onChange={(e) =>{  updateProject(project.id, 'title', e.target.value); }} 
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Danh mục</Label>
                      <Input 
                        placeholder="VD: Website, Mobile..." 
                        value={project.category} 
                        onChange={(e) =>{  updateProject(project.id, 'category', e.target.value); }} 
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Mô tả ngắn</Label>
                    <Input 
                      placeholder="Mô tả ngắn về dự án" 
                      value={project.description} 
                      onChange={(e) =>{  updateProject(project.id, 'description', e.target.value); }} 
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Link chi tiết</Label>
                    <Input 
                      placeholder="https://example.com/project" 
                      value={project.link} 
                      onChange={(e) =>{  updateProject(project.id, 'link', e.target.value); }} 
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <CaseStudyPreview
        projects={projects.map((p, idx) => ({
          category: p.category,
          description: p.description,
          id: idx + 1,
          image: p.image,
          link: p.link,
          title: p.title
        }))}
        brandColor={primary}
        secondary={secondary}
        mode={brandMode}
        selectedStyle={caseStudyStyle}
        onStyleChange={setCaseStudyStyle}
        fontStyle={fontStyle}
        fontClassName="font-active"
      />

      {brandMode === 'dual' && warningMessages.length > 0 && (
        <div className="mt-4 space-y-2">
          {warningMessages.map((message, idx) => {
            const isContrastWarning = message.includes('minLc');
            return (
              <div
                key={`${message}-${idx}`}
                className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700"
              >
                <div className="flex items-start gap-2">
                  {isContrastWarning ? (
                    <Eye size={14} className="mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                  )}
                  <p>{message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ComponentFormWrapper>
  );
}
