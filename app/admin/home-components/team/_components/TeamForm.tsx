'use client';

import React from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import { ChevronDown, ChevronUp, GripVertical, Loader2, Plus, Trash2, Upload, Users } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';
import { prepareImageForUpload, validateImageFile } from '@/lib/image/uploadPipeline';
import { resolveNamingContext } from '@/lib/image/uploadNaming';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, cn } from '../../../components/ui';
import type { TeamEditorMember } from '../_types';

interface TeamFormProps {
  members: TeamEditorMember[];
  onChange: (next: TeamEditorMember[]) => void;
  secondary: string;
}

const createEmptyMember = (seed: number): TeamEditorMember => ({
  id: seed,
  name: '',
  role: '',
  avatar: '',
  bio: '',
  facebook: '',
  linkedin: '',
  twitter: '',
  email: '',
});

function useDragReorder<T extends { id: number }>(items: T[], setItems: (items: T[]) => void) {
  const [draggedId, setDraggedId] = React.useState<number | null>(null);
  const [dragOverId, setDragOverId] = React.useState<number | null>(null);

  const dragProps = (id: number) => ({
    draggable: true,
    onDragEnd: () => {
      setDraggedId(null);
      setDragOverId(null);
    },
    onDragOver: (event: React.DragEvent) => {
      event.preventDefault();
      if (draggedId !== id) {
        setDragOverId(id);
      }
    },
    onDragStart: () => {
      setDraggedId(id);
    },
    onDrop: (event: React.DragEvent) => {
      event.preventDefault();
      if (!draggedId || draggedId === id) {return;}

      const nextItems = [...items];
      const draggedIndex = items.findIndex((item) => item.id === draggedId);
      const dropIndex = items.findIndex((item) => item.id === id);

      if (draggedIndex < 0 || dropIndex < 0) {return;}

      const [moved] = nextItems.splice(draggedIndex, 1);
      nextItems.splice(dropIndex, 0, moved);

      setItems(nextItems);
      setDraggedId(null);
      setDragOverId(null);
    },
  });

  return { draggedId, dragOverId, dragProps };
}

function AvatarUpload({ value, onChange, index }: { value: string; onChange: (url: string) => void; index: number }) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const saveImage = useMutation(api.storage.saveImage);

  const handleFile = React.useCallback(async (file: File) => {
    const validationError = validateImageFile(file, 10);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsUploading(true);

    try {
      const resolvedNaming = resolveNamingContext(undefined, {
        entityName: 'team',
        field: 'avatar',
        index,
      });
      const prepared = await prepareImageForUpload(file, { quality: 0.85, naming: resolvedNaming });
      const uploadUrl = await generateUploadUrl();

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': prepared.mimeType },
        body: prepared.file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const { storageId } = await uploadResponse.json();

      const result = await saveImage({
        storageId: storageId as Id<'_storage'>,
        filename: prepared.filename,
        folder: 'team-avatars',
        mimeType: prepared.mimeType,
        size: prepared.size,
        width: prepared.width,
        height: prepared.height,
      });

      onChange(result.url ?? '');
      toast.success('Tải ảnh thành công');
    } catch {
      toast.error('Lỗi tải ảnh');
    } finally {
      setIsUploading(false);
    }
  }, [generateUploadUrl, index, onChange, saveImage]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleFile(file);
          }
        }}
      />

      <div
        className={cn(
          'h-16 w-16 flex-shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-all',
          isDragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-200 dark:border-slate-600 hover:border-slate-300',
          isUploading && 'pointer-events-none',
        )}
        onClick={() => {
          if (!isUploading) {
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => {
          setIsDragOver(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragOver(false);

          const file = event.dataTransfer.files?.[0];
          if (file) {
            void handleFile(file);
          }
        }}
      >
        {isUploading ? (
          <div className="h-full w-full flex items-center justify-center bg-slate-100 dark:bg-slate-700">
            <Loader2 size={20} className="animate-spin text-blue-500" />
          </div>
        ) : value ? (
          <Image src={value} alt="" width={96} height={96} className="h-full w-full object-cover" unoptimized />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800">
            <Upload size={16} className="text-slate-400" />
          </div>
        )}
      </div>

      {value ? (
        <button
          type="button"
          className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600"
          onClick={(event) => {
            event.stopPropagation();
            onChange('');
          }}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}

const SocialIconBtn = ({
  type,
  value,
  onChange,
}: {
  type: 'facebook' | 'linkedin' | 'twitter' | 'email';
  value: string;
  onChange: (next: string) => void;
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const icons = {
    email: <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
    facebook: <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>,
    linkedin: <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>,
    twitter: <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>,
  };

  const placeholders = {
    email: 'email@...',
    facebook: 'facebook.com/...',
    linkedin: 'linkedin.com/in/...',
    twitter: 'x.com/...',
  };

  return (
    <div className="relative">
      <button
        type="button"
        title={type}
        className={cn(
          'h-7 w-7 rounded-md flex items-center justify-center transition-all',
          value ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-700 hover:bg-slate-200',
        )}
        onClick={() => {
          setIsOpen((prev) => !prev);
        }}
      >
        {icons[type]}
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-full mt-1 z-10 w-56 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg p-2">
          <Input
            value={value}
            className="h-8 text-xs"
            autoFocus
            placeholder={placeholders[type]}
            onChange={(event) => {
              onChange(event.target.value);
            }}
            onBlur={() => {
              setTimeout(() => {
                setIsOpen(false);
              }, 150);
            }}
          />
        </div>
      ) : null}
    </div>
  );
};

export const TeamForm = ({
  members,
  onChange,
  secondary,
}: TeamFormProps) => {
  const [expandedId, setExpandedId] = React.useState<number | null>(null);
  const { draggedId, dragOverId, dragProps } = useDragReorder(members, onChange);

  const updateMember = (id: number, field: keyof TeamEditorMember, value: string) => {
    onChange(members.map((member) => (member.id === id ? { ...member, [field]: value } : member)));
  };

  const addMember = () => {
    const maxId = members.reduce((max, member) => Math.max(max, member.id), 0);
    onChange([...members, createEmptyMember(maxId + 1)]);
  };

  const removeMember = (id: number) => {
    onChange(members.filter((member) => member.id !== id));
    if (expandedId === id) {
      setExpandedId(null);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-sm font-medium">Thành viên ({members.length})</CardTitle>
        <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={addMember}>
          <Plus size={12} /> Thêm
        </Button>
      </CardHeader>

      <CardContent className="space-y-2 pt-0">
        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 py-12 text-center dark:border-slate-700">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: `${secondary}10` }}>
              <Users size={28} style={{ color: secondary }} />
            </div>
            <h4 className="mb-1 font-medium text-slate-900 dark:text-slate-100">Chưa có thành viên nào</h4>
            <p className="mb-4 text-sm text-slate-500">Thêm thành viên đầu tiên để bắt đầu</p>
            <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addMember}>
              <Plus size={14} /> Thêm thành viên
            </Button>
          </div>
        ) : null}

        {members.map((member) => (
          <div
            key={member.id}
            {...dragProps(member.id)}
            className={cn(
              'cursor-grab overflow-hidden rounded-lg border transition-all active:cursor-grabbing',
              draggedId === member.id && 'opacity-50 scale-[0.98]',
              dragOverId === member.id && 'ring-2 ring-blue-500 ring-offset-1',
              'border-slate-200 dark:border-slate-700',
            )}
          >
            <div className="flex items-center gap-3 bg-white p-3 dark:bg-slate-900">
              <div className="flex-shrink-0 cursor-grab text-slate-300 hover:text-slate-400 dark:text-slate-600">
                <GripVertical size={16} />
              </div>

              <AvatarUpload
                value={member.avatar}
                index={members.findIndex((item) => item.id === member.id) + 1}
                onChange={(url) => {
                  updateMember(member.id, 'avatar', url);
                }}
              />

              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex gap-2">
                  <Input
                    placeholder="Họ và tên"
                    className="h-8 text-sm font-medium"
                    value={member.name}
                    onChange={(event) => {
                      updateMember(member.id, 'name', event.target.value);
                    }}
                  />
                  <Input
                    placeholder="Chức vụ"
                    className="h-8 w-32 text-sm text-slate-500"
                    value={member.role}
                    onChange={(event) => {
                      updateMember(member.id, 'role', event.target.value);
                    }}
                  />
                </div>

                <div className="flex items-center gap-1">
                  <SocialIconBtn type="facebook" value={member.facebook} onChange={(next) => { updateMember(member.id, 'facebook', next); }} />
                  <SocialIconBtn type="linkedin" value={member.linkedin} onChange={(next) => { updateMember(member.id, 'linkedin', next); }} />
                  <SocialIconBtn type="twitter" value={member.twitter} onChange={(next) => { updateMember(member.id, 'twitter', next); }} />
                  <SocialIconBtn type="email" value={member.email} onChange={(next) => { updateMember(member.id, 'email', next); }} />
                  <div className="flex-1" />

                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
                    onClick={() => {
                      setExpandedId((prev) => (prev === member.id ? null : member.id));
                    }}
                  >
                    Bio {expandedId === member.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0 text-slate-400 hover:text-red-500"
                onClick={() => {
                  removeMember(member.id);
                }}
              >
                <Trash2 size={14} />
              </Button>
            </div>

            {expandedId === member.id ? (
              <div className="border-t border-slate-100 bg-slate-50 px-3 pb-3 dark:border-slate-800 dark:bg-slate-800/50">
                <textarea
                  placeholder="Giới thiệu ngắn về thành viên..."
                  value={member.bio}
                  onChange={(event) => {
                    updateMember(member.id, 'bio', event.target.value);
                  }}
                  className="mt-2 min-h-[60px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

