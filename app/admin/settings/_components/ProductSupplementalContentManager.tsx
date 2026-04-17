'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, GripVertical, Loader2, Plus, Save, SquareStack, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery } from 'convex/react';
import type { Id } from '@/convex/_generated/dataModel';
import { api } from '@/convex/_generated/api';
import { useAdminAuth } from '@/app/admin/auth/context';
import { getAdminMutationErrorMessage } from '@/app/admin/lib/mutation-error';
import { LexicalEditor } from '@/app/admin/components/LexicalEditor';
import { normalizeRichText } from '@/app/admin/lib/normalize-rich-text';
import { stripHtml } from '@/lib/seo';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  cn,
} from '@/app/admin/components/ui';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';

type AssignmentMode = 'products' | 'categories';
type TemplateStatus = 'active' | 'inactive';

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  order: number;
};

type ProductSupplementalTemplate = {
  _id: Id<'productSupplementalContents'>;
  name: string;
  status: TemplateStatus;
  assignmentMode: AssignmentMode;
  productIds?: Id<'products'>[];
  categoryIds?: Id<'productCategories'>[];
  preContent?: string;
  postContent?: string;
  faqItems: FaqItem[];
};

const createFaqItem = (index: number): FaqItem => ({
  id: `${Date.now()}-${index}`,
  question: '',
  answer: '',
  order: index,
});

const normalizeFaqText = (value: string) => stripHtml(value).replace(/\s+/g, ' ').trim();

type EditorSectionKey = 'config' | 'preContent' | 'faq' | 'postContent';

type EditorSectionCardProps = {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
};

function EditorSectionCard({ title, isOpen, onToggle, icon, children }: EditorSectionCardProps) {
  return (
    <Card>
      <CardHeader className="cursor-pointer select-none px-4 py-3" onClick={onToggle}>
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            {icon}
            {title}
          </span>
          <ChevronDown size={16} className={cn('transition-transform', isOpen && 'rotate-180')} />
        </CardTitle>
      </CardHeader>
      {isOpen ? <CardContent className="px-4 pb-4 pt-0">{children}</CardContent> : null}
    </Card>
  );
}

function MultiSelectCombobox<T extends { _id: string; name: string }>({
  items,
  label,
  placeholder,
  selectedIds,
  onChange,
}: {
  items: T[];
  label: string;
  placeholder: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return items;
    }
    return items.filter((item) => item.name.toLowerCase().includes(keyword));
  }, [items, query]);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.includes(item._id)),
    [items, selectedIds]
  );

  const toggleItem = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
      return;
    }
    onChange([...selectedIds, id]);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <span className="truncate">{selectedItems.length > 0 ? `${selectedItems.length} mục đã chọn` : placeholder}</span>
          <span className="text-xs text-slate-400">▼</span>
        </button>
        {open && (
          <div className="absolute z-30 mt-2 w-full rounded-md border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm nhanh..." className="mb-2" />
            <div className="max-h-56 overflow-y-auto space-y-1">
              {filteredItems.length === 0 && (
                <div className="px-2 py-2 text-xs text-slate-500">Không tìm thấy dữ liệu phù hợp.</div>
              )}
              {filteredItems.map((item) => {
                const active = selectedIds.includes(item._id);
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => toggleItem(item._id)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-md px-2 py-2 text-sm transition-colors',
                      active
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-200'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                    )}
                  >
                    <span className="truncate">{item.name}</span>
                    {active ? <span className="text-xs">✓</span> : null}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedItems.map((item) => (
            <Badge key={item._id} variant="secondary" className="gap-1">
              <span>{item.name}</span>
              <button type="button" onClick={() => toggleItem(item._id)} aria-label={`Bỏ ${item.name}`}>
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductSupplementalFaqEditor({
  items,
  onChange,
  embedded = false,
}: {
  items: FaqItem[];
  onChange: (items: FaqItem[]) => void;
  embedded?: boolean;
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const normalizedItems = useMemo(
    () => items.map((item, index) => ({ ...item, order: index })),
    [items]
  );

  const updateItem = (id: string, patch: Partial<FaqItem>) => {
    onChange(normalizedItems.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeItem = (id: string) => {
    onChange(normalizedItems.filter((item) => item.id !== id).map((item, index) => ({ ...item, order: index })));
  };

  const addItem = () => {
    onChange([...normalizedItems, createFaqItem(normalizedItems.length)]);
  };

  const dragProps = (id: string) => ({
    draggable: true,
    onDragStart: () => setDraggedId(id),
    onDragOver: (event: React.DragEvent) => {
      event.preventDefault();
      if (draggedId !== id) {
        setDragOverId(id);
      }
    },
    onDragEnd: () => {
      setDraggedId(null);
      setDragOverId(null);
    },
    onDrop: (event: React.DragEvent) => {
      event.preventDefault();
      if (!draggedId || draggedId === id) {
        return;
      }
      const nextItems = [...normalizedItems];
      const draggedIndex = nextItems.findIndex((item) => item.id === draggedId);
      const targetIndex = nextItems.findIndex((item) => item.id === id);
      const [moved] = nextItems.splice(draggedIndex, 1);
      nextItems.splice(targetIndex, 0, moved);
      onChange(nextItems.map((item, index) => ({ ...item, order: index })));
      setDraggedId(null);
      setDragOverId(null);
    },
  });

  const content = (
    <>
      <div className="flex items-center justify-end">
        <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-2">
          <Plus size={14} /> Thêm FAQ
        </Button>
      </div>
      <div className="mt-2 space-y-2">
        {normalizedItems.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500 dark:border-slate-700">
            Chưa có FAQ nào. Bấm “Thêm FAQ” để bắt đầu.
          </div>
        ) : normalizedItems.map((item, index) => (
          <div
            key={item.id}
            {...dragProps(item.id)}
            className={cn(
              'rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3 transition-all dark:border-slate-800 dark:bg-slate-950/40',
              draggedId === item.id && 'opacity-60',
              dragOverId === item.id && 'ring-2 ring-blue-500'
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <GripVertical size={16} className="text-slate-400" />
                <span>FAQ {index + 1}</span>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                <Trash2 size={14} className="text-red-500" />
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Câu hỏi</Label>
              <Input
                value={item.question}
                onChange={(event) => updateItem(item.id, { question: event.target.value })}
                placeholder="Ví dụ: Sản phẩm này phù hợp với ai?"
              />
            </div>
            <div className="space-y-2">
              <Label>Câu trả lời</Label>
              <Input
                value={item.answer}
                onChange={(event) => updateItem(item.id, { answer: event.target.value })}
                placeholder="Ví dụ: Sản phẩm phù hợp đi học, đi chơi hằng ngày."
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );

  if (embedded) {
    return <div className="space-y-1">{content}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">FAQ bổ sung</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}

export function ProductSupplementalContentManager() {
  const { hasPermission, user } = useAdminAuth();
  const canView = hasPermission('products', 'view');
  const canEdit = hasPermission('products', 'edit');

  const templates = useQuery(api.productSupplementalContents.listAll, {});
  const products = useQuery(api.products.listAll, { limit: 200 });
  const categories = useQuery(api.productCategories.listAll, { limit: 200 });

  const createTemplate = useMutation(api.productSupplementalContents.createTemplate);
  const updateTemplate = useMutation(api.productSupplementalContents.updateTemplate);
  const removeTemplate = useMutation(api.productSupplementalContents.removeTemplate);

  const [selectedTemplateId, setSelectedTemplateId] = useState<Id<'productSupplementalContents'> | null>(null);
  const [name, setName] = useState('');
  const [status, setStatus] = useState<TemplateStatus>('inactive');
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>('products');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [preContent, setPreContent] = useState('');
  const [postContent, setPostContent] = useState('');
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [openSections, setOpenSections] = useState<Record<EditorSectionKey, boolean>>({
    config: false,
    preContent: false,
    faq: false,
    postContent: false,
  });

  const selectedTemplate = useMemo<ProductSupplementalTemplate | null>(
    () => templates?.find((item) => item._id === selectedTemplateId) ?? null,
    [templates, selectedTemplateId]
  );

  const resetForm = (template?: ProductSupplementalTemplate | null) => {
    if (!template) {
      setSelectedTemplateId(null);
      setName('');
      setStatus('inactive');
      setAssignmentMode('products');
      setSelectedProductIds([]);
      setSelectedCategoryIds([]);
      setPreContent('');
      setPostContent('');
      setFaqItems([]);
      return;
    }

    setSelectedTemplateId(template._id);
    setName(template.name);
    setStatus(template.status);
    setAssignmentMode(template.assignmentMode);
    setSelectedProductIds((template.productIds ?? []).map((item) => String(item)));
    setSelectedCategoryIds((template.categoryIds ?? []).map((item) => String(item)));
    setPreContent(template.preContent ?? '');
    setPostContent(template.postContent ?? '');
    setFaqItems(
      (template.faqItems ?? []).map((item) => ({
        id: item.id,
        question: item.question,
        answer: item.answer,
        order: item.order,
      }))
    );
  };

  useEffect(() => {
    resetForm(selectedTemplate);
  }, [selectedTemplate]);

  useEffect(() => {
    if (isCreatingNew) {
      setOpenSections({
        config: true,
        preContent: true,
        faq: true,
        postContent: true,
      });
      return;
    }

    if (selectedTemplateId) {
      setOpenSections({
        config: false,
        preContent: false,
        faq: false,
        postContent: false,
      });
      return;
    }

    setOpenSections({
      config: false,
      preContent: false,
      faq: false,
      postContent: false,
    });
  }, [isCreatingNew, selectedTemplateId]);

  if (!canView) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-slate-500">Bạn không có quyền xem cấu hình này.</CardContent>
      </Card>
    );
  }

  const handleCreateNew = () => {
    setIsDeleteDialogOpen(false);
    setIsCreatingNew(true);
    resetForm(null);
  };

  const handleSelectTemplate = (templateId: Id<'productSupplementalContents'>) => {
    setIsCreatingNew(false);
    setSelectedTemplateId(templateId);
  };

  const toggleSection = (section: EditorSectionKey) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSave = async () => {
    if (!canEdit) {
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        assignmentMode,
        categoryIds: assignmentMode === 'categories' ? selectedCategoryIds as Id<'productCategories'>[] : undefined,
        faqItems: faqItems.map((item, index) => ({
          ...item,
          answer: normalizeFaqText(item.answer),
          question: item.question.trim(),
          order: index,
        })),
        name,
        postContent: normalizeRichText(postContent),
        preContent: normalizeRichText(preContent),
        productIds: assignmentMode === 'products' ? selectedProductIds as Id<'products'>[] : undefined,
        status,
      };

      if (selectedTemplateId) {
        await updateTemplate({
          ...payload,
          id: selectedTemplateId,
          updatedBy: user?.id ? (user.id as Id<'users'>) : null,
        });
      } else {
        const nextId = await createTemplate({
          ...payload,
          createdBy: user?.id ? (user.id as Id<'users'>) : null,
        });
        setSelectedTemplateId(nextId);
      }
      toast.success('Đã lưu template nội dung bổ sung');
    } catch (error) {
      toast.error(getAdminMutationErrorMessage(error, 'Không thể lưu template nội dung bổ sung'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplateId || !canEdit || isDeleting) {
      return;
    }

    setIsDeleting(true);
    try {
      await removeTemplate({ id: selectedTemplateId });
      handleCreateNew();
      toast.success('Đã xóa template nội dung bổ sung');
    } catch (error) {
      toast.error(getAdminMutationErrorMessage(error, 'Không thể xóa template nội dung bổ sung'));
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (!templates || !products || !categories) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 pb-28">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Templates</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={handleCreateNew} className="gap-2" disabled={!canEdit}>
              <Plus size={14} /> Mới
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {templates.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500 dark:border-slate-700">
                Chưa có template nào.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {templates.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => handleSelectTemplate(item._id)}
                    className={cn(
                      'w-full rounded-lg border p-3 text-left transition-colors',
                      selectedTemplateId === item._id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                        : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{item.name}</div>
                      <Badge variant={item.status === 'active' ? 'success' : 'secondary'}>{item.status === 'active' ? 'Đang bật' : 'Tạm tắt'}</Badge>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      {item.assignmentMode === 'products'
                        ? `${item.productIds?.length ?? 0} sản phẩm`
                        : `${item.categoryIds?.length ?? 0} danh mục`}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {(selectedTemplateId || isCreatingNew) ? (
          <>
            <EditorSectionCard
              title="Cấu hình template"
              icon={<SquareStack size={16} />}
              isOpen={openSections.config}
              onToggle={() => toggleSection('config')}
            >
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tên template</Label>
                    <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="VD: FAQ chống nắng mùa hè" />
                  </div>
                  <div className="space-y-2">
                    <Label>Trạng thái</Label>
                    <select
                      value={status}
                      onChange={(event) => setStatus(event.target.value as TemplateStatus)}
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      <option value="inactive">Tạm tắt</option>
                      <option value="active">Đang bật</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Kiểu áp dụng</Label>
                  <div className="grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setAssignmentMode('products')}
                      className={cn(
                        'rounded-lg border p-4 text-left transition-all',
                        assignmentMode === 'products'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                          : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50'
                      )}
                    >
                      <div className="font-medium text-slate-900 dark:text-slate-100">Theo sản phẩm</div>
                      <div className="mt-1 text-xs text-slate-500">Chọn nhiều sản phẩm cụ thể để áp dụng.</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignmentMode('categories')}
                      className={cn(
                        'rounded-lg border p-4 text-left transition-all',
                        assignmentMode === 'categories'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                          : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50'
                      )}
                    >
                      <div className="font-medium text-slate-900 dark:text-slate-100">Theo danh mục</div>
                      <div className="mt-1 text-xs text-slate-500">Chọn nhanh nhiều danh mục sản phẩm.</div>
                    </button>
                  </div>
                </div>

                {assignmentMode === 'products' ? (
                  <MultiSelectCombobox
                    items={products.map((item) => ({ _id: String(item._id), name: item.name }))}
                    label="Chọn sản phẩm áp dụng"
                    placeholder="Chưa chọn sản phẩm nào"
                    selectedIds={selectedProductIds}
                    onChange={setSelectedProductIds}
                  />
                ) : (
                  <MultiSelectCombobox
                    items={categories.map((item) => ({ _id: String(item._id), name: item.name }))}
                    label="Chọn danh mục áp dụng"
                    placeholder="Chưa chọn danh mục nào"
                    selectedIds={selectedCategoryIds}
                    onChange={setSelectedCategoryIds}
                  />
                )}
              </div>
            </EditorSectionCard>

            <EditorSectionCard
              title="Nội dung đầu mô tả sản phẩm"
              isOpen={openSections.preContent}
              onToggle={() => toggleSection('preContent')}
            >
              <LexicalEditor onChange={(html) => setPreContent(normalizeRichText(html))} initialContent={preContent} resetKey={selectedTemplateId ?? 'new-pre'} folder="products-supplemental-pre" />
            </EditorSectionCard>

            <EditorSectionCard
              title="FAQ bổ sung"
              isOpen={openSections.faq}
              onToggle={() => toggleSection('faq')}
            >
              <ProductSupplementalFaqEditor items={faqItems} onChange={setFaqItems} embedded />
            </EditorSectionCard>

            <EditorSectionCard
              title="Nội dung cuối mô tả sản phẩm"
              isOpen={openSections.postContent}
              onToggle={() => toggleSection('postContent')}
            >
              <LexicalEditor onChange={(html) => setPostContent(normalizeRichText(html))} initialContent={postContent} resetKey={selectedTemplateId ?? 'new-post'} folder="products-supplemental-post" />
            </EditorSectionCard>
          </>
        ) : null}
      </div>

      <HomeComponentStickyFooter
        isSubmitting={isSaving}
        submitLabel="Lưu template"
        onCancel={() => resetForm(selectedTemplate)}
        submitType="button"
        onClickSave={handleSave}
        disableSave={!canEdit || isSaving}
      >
        <>
          <Button type="button" variant="ghost" onClick={() => resetForm(selectedTemplate)}>
            Hủy
          </Button>
          <div className="flex items-center gap-2">
            <div className="hidden md:block text-xs text-slate-500">Backend sẽ chặn template bị trùng sản phẩm.</div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={!canEdit || !selectedTemplateId || isDeleting}
              className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:border-red-900/60 dark:hover:bg-red-950/30"
            >
              {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Xóa
            </Button>
            <Button type="button" onClick={handleSave} disabled={!canEdit || isSaving} className="gap-2">
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Lưu template
            </Button>
          </div>
        </>
      </HomeComponentStickyFooter>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xóa template này?</DialogTitle>
            <DialogDescription>
              Template đã xóa sẽ không thể khôi phục. Hành động này chỉ áp dụng cho template đang chọn.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
              Hủy
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={!selectedTemplateId || isDeleting} className="gap-2">
              {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Xác nhận xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
