'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '../../../components/ui';
import { ImageFieldWithUpload } from '../../../components/ImageFieldWithUpload';
import type { CaseStudyProject } from '../_types';

export const CaseStudyForm = ({
  projects,
  onChange,
}: {
  projects: CaseStudyProject[];
  onChange: (projects: CaseStudyProject[]) => void;
}) => {
  const handleAddProject = () => {
    onChange([
      ...projects,
      { category: '', description: '', id: Date.now(), image: '', link: '', title: '' },
    ]);
  };

  const handleRemoveProject = (id: number | string) => {
    onChange(projects.filter((project) => project.id !== id));
  };

  const updateProject = (id: number | string, field: keyof CaseStudyProject, value: string) => {
    onChange(projects.map((project) => (project.id === id ? { ...project, [field]: value } : project)));
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Dự án tiêu biểu</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={handleAddProject} className="gap-2">
          <Plus size={14} /> Thêm dự án
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {projects.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            Chưa có dự án nào. Nhấn “Thêm dự án” để bắt đầu.
          </div>
        ) : (
          projects.map((project, idx) => (
            <div key={project.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Label>Dự án {idx + 1}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-red-500 h-8 w-8"
                  onClick={() =>{  handleRemoveProject(project.id); }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm mb-2 block">Hình ảnh dự án</Label>
                  <ImageFieldWithUpload
                    label=""
                    value={project.image}
                    onChange={(url) =>{  updateProject(project.id, 'image', url); }}
                    folder="case-studies"
                    aspectRatio="video"
                    quality={0.85}
                    placeholder="Chọn hoặc upload ảnh dự án"
                  />
                </div>

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
          ))
        )}
      </CardContent>
    </Card>
  );
};
