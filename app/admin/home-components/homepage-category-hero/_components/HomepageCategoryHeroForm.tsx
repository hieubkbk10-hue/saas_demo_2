'use client';

import React from 'react';
import { ChevronDown, GripVertical, Layers2, Plus, Sparkles, Trash2 } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '../../../components/ui';
import { MultiImageUploader } from '../../../components/MultiImageUploader';
import { HOMEPAGE_CATEGORY_HERO_ICON_OPTIONS, getHomepageCategoryHeroIcon } from '../_lib/icon-options';
import type {
  HomepageCategoryHeroAutoGenerateConfig,
  HomepageCategoryHeroAutoGenerateMeta,
  HomepageCategoryHeroCategoryItem,
  HomepageCategoryHeroCategoryImageSize,
  HomepageCategoryHeroCategoryImageShape,
  HomepageCategoryHeroCategoryVisualMode,
  HomepageCategoryHeroMenuGroup,
  HomepageCategoryHeroMenuLink,
  HomepageCategoryHeroSlide,
} from '../_types';

export function HomepageCategoryHeroForm({
  heroSlides,
  setHeroSlides,
  categoryItems,
  setCategoryItems,
  categoriesData,
  categoryVisualMode,
  setCategoryVisualMode,
  categoryImageSize,
  setCategoryImageSize,
  categoryImageShape,
  setCategoryImageShape,
  autoGenerateConfig,
  autoGenerateMeta,
  autoGenerateReady,
  autoGenerateLoading,
  hideEmptyCategories,
  setHideEmptyCategories,
  onAutoGenerate,
}: {
  heroSlides: HomepageCategoryHeroSlide[];
  setHeroSlides: (value: HomepageCategoryHeroSlide[]) => void;
  categoryItems: HomepageCategoryHeroCategoryItem[];
  setCategoryItems: (value: HomepageCategoryHeroCategoryItem[]) => void;
  categoriesData: { _id: string; name: string; image?: string }[];
  categoryVisualMode: HomepageCategoryHeroCategoryVisualMode;
  setCategoryVisualMode: (value: HomepageCategoryHeroCategoryVisualMode) => void;
  categoryImageSize: HomepageCategoryHeroCategoryImageSize;
  setCategoryImageSize: (value: HomepageCategoryHeroCategoryImageSize) => void;
  categoryImageShape: HomepageCategoryHeroCategoryImageShape;
  setCategoryImageShape: (value: HomepageCategoryHeroCategoryImageShape) => void;
  autoGenerateConfig: HomepageCategoryHeroAutoGenerateConfig;
  autoGenerateMeta?: HomepageCategoryHeroAutoGenerateMeta;
  autoGenerateReady: boolean;
  autoGenerateLoading: boolean;
  hideEmptyCategories: boolean;
  setHideEmptyCategories: (value: boolean) => void;
  onAutoGenerate: () => void;
}) {
  const [expandedCategoryIds, setExpandedCategoryIds] = React.useState<number[]>([]);
  const [iconSearch, setIconSearch] = React.useState<Record<number, string>>({});

  React.useEffect(() => {
    setExpandedCategoryIds((prev) => prev.filter((id) => categoryItems.some((item) => item.id === id)));
  }, [categoryItems]);

  const addCategory = () => {
    const newId = Math.max(0, ...categoryItems.map((item) => item.id)) + 1;
    setCategoryItems([...categoryItems, { id: newId, categoryId: '', groups: [] }]);
    setExpandedCategoryIds((prev) => [...prev, newId]);
  };

  const removeCategory = (id: number) => {
    setCategoryItems(categoryItems.filter((item) => item.id !== id));
  };

  const updateCategory = (id: number, updates: Partial<HomepageCategoryHeroCategoryItem>) => {
    setCategoryItems(categoryItems.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const getCategoryItem = (id: number) => categoryItems.find((item) => item.id === id);

  const addGroup = (id: number) => {
    const target = getCategoryItem(id);
    const list = target?.groups ?? [];
    const nextId = Math.max(0, ...list.map((item) => item.id)) + 1;
    updateCategory(id, { groups: [...list, { id: nextId, title: '', items: [] }] });
  };

  const updateGroup = (id: number, groupId: number, updates: Partial<HomepageCategoryHeroMenuGroup>) => {
    const target = getCategoryItem(id);
    if (!target) {return;}
    const list = (target.groups ?? []).map((group) => (group.id === groupId ? { ...group, ...updates } : group));
    updateCategory(id, { groups: list });
  };

  const removeGroup = (id: number, groupId: number) => {
    const target = getCategoryItem(id);
    if (!target) {return;}
    const list = (target.groups ?? []).filter((group) => group.id !== groupId);
    updateCategory(id, { groups: list });
  };

  const addGroupItem = (id: number, groupId: number) => {
    const target = getCategoryItem(id);
    if (!target) {return;}
    const groups = target.groups ?? [];
    const list = groups.map((group) => {
      if (group.id !== groupId) {return group;}
      const items = group.items ?? [];
      const nextId = Math.max(0, ...items.map((item) => item.id)) + 1;
      return { ...group, items: [...items, { id: nextId, targetType: 'category' as const, categoryId: '' }] };
    });
    updateCategory(id, { groups: list });
  };

  const updateGroupItem = (id: number, groupId: number, itemId: number, updates: Partial<HomepageCategoryHeroMenuLink>) => {
    const target = getCategoryItem(id);
    if (!target) {return;}
    const groups = target.groups ?? [];
    const list = groups.map((group) => {
      if (group.id !== groupId) {return group;}
      const items = (group.items ?? []).map((item) => (item.id === itemId ? { ...item, ...updates } : item));
      return { ...group, items };
    });
    updateCategory(id, { groups: list });
  };

  const removeGroupItem = (id: number, groupId: number, itemId: number) => {
    const target = getCategoryItem(id);
    if (!target) {return;}
    const groups = target.groups ?? [];
    const list = groups.map((group) => {
      if (group.id !== groupId) {return group;}
      const items = (group.items ?? []).filter((item) => item.id !== itemId);
      return { ...group, items };
    });
    updateCategory(id, { groups: list });
  };

  const duplicateCategoryIds = new Set(
    categoryItems
      .filter((item) => item.categoryId)
      .map((item) => item.categoryId)
      .filter((id, index, list) => list.indexOf(id) !== index)
  );

  const totalGroups = categoryItems.reduce((sum, item) => sum + (item.groups?.length ?? 0), 0);
  const totalLinks = categoryItems.reduce(
    (sum, item) => sum + (item.groups ?? []).reduce((groupSum, group) => groupSum + (group.items?.length ?? 0), 0),
    0
  );

  const handleRemoveDuplicates = () => {
    const seen = new Set<string>();
    const deduped = categoryItems.filter((item) => {
      if (!item.categoryId) {return true;}
      if (seen.has(item.categoryId)) {return false;}
      seen.add(item.categoryId);
      return true;
    });
    setCategoryItems(deduped);
    setExpandedCategoryIds((prev) => prev.filter((id) => deduped.some((item) => item.id === id)));
  };

  const toggleCategory = (id: number) => {
    setExpandedCategoryIds((prev) => (prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]));
  };

  const toggleAllCategories = () => {
    if (categoryItems.length === 0) {return;}
    setExpandedCategoryIds((prev) => (prev.length === categoryItems.length ? [] : categoryItems.map((item) => item.id)));
  };

  const allExpanded = categoryItems.length > 0 && expandedCategoryIds.length === categoryItems.length;
  const avatarSizeOptions: Array<{ id: HomepageCategoryHeroCategoryImageSize; label: string }> = [
    { id: '2xs', label: 'Rất nhỏ' },
    { id: 'xs', label: 'Nhỏ' },
    { id: 'sm', label: 'Vừa' },
    { id: 'md', label: 'Lớn' },
    { id: 'lg', label: 'Rất lớn' },
    { id: 'xl', label: 'Cực đại' },
  ];
  const avatarShapeOptions: Array<{ id: HomepageCategoryHeroCategoryImageShape; label: string }> = [
    { id: 'circle', label: 'Tròn' },
    { id: 'rounded', label: 'Vuông bo góc' },
    { id: 'square', label: 'Vuông sắc' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-cyan-600" />
              Sinh nhanh từ dữ liệu thật
            </CardTitle>
            <p className="text-sm text-slate-500">
              Tự lấy menu từ danh mục và sản phẩm.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 lg:self-center">
            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={Boolean(hideEmptyCategories)}
                onChange={(e) => setHideEmptyCategories(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span>Ẩn mục không có SP</span>
            </label>
            <Button
              type="button"
              onClick={onAutoGenerate}
              className="gap-2"
              disabled={!autoGenerateReady || autoGenerateLoading}
            >
              <Sparkles size={14} /> {autoGenerateLoading ? 'Đang tải...' : 'Sinh ngay'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500">Danh mục đang chọn</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{categoryItems.length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500">Nhóm menu</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{totalGroups}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500">Link menu</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{totalLinks}</p>
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>Preset: {autoGenerateConfig.mode}</span>
              <span>Danh mục cha: {autoGenerateConfig.maxRootCategories}</span>
              <span>Nhóm / danh mục: {autoGenerateConfig.maxGroupsPerCategory}</span>
              <span>Link / nhóm: {autoGenerateConfig.maxItemsPerGroup}</span>
            </div>
            {autoGenerateMeta?.summary && <p className="mt-2 text-xs text-slate-500">{autoGenerateMeta.summary}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Banner hero</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <MultiImageUploader<HomepageCategoryHeroSlide>
            items={heroSlides}
            onChange={setHeroSlides}
            folder="homepage-category-hero"
            imageKey="url"
            extraFields={[{ key: 'link', placeholder: 'URL liên kết (tuỳ chọn)', type: 'url' }]}
            minItems={1}
            maxItems={6}
            aspectRatio="banner"
            columns={1}
            showReorder={true}
            addButtonText="Thêm banner"
            emptyText="Chưa có banner hero"
          />
          <p className="text-xs text-slate-500">Ưu tiên 1-3 banner chính để phần preview và menu dễ quan sát.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hiển thị danh mục</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_200px]">
          <div className="space-y-2">
            <Label className="text-sm">Chế độ hiển thị</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={categoryVisualMode === 'image' ? 'default' : 'outline'}
                onClick={() => setCategoryVisualMode('image')}
              >
                Ảnh danh mục
              </Button>
              <Button
                type="button"
                size="sm"
                variant={categoryVisualMode === 'icon' ? 'default' : 'outline'}
                onClick={() => setCategoryVisualMode('icon')}
              >
                Icon danh mục
              </Button>
            </div>
            <p className="text-xs text-slate-500">Chọn icon sẽ chỉ hiển thị icon, không dùng ảnh.</p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Kích thước avatar</Label>
            <select
              value={categoryImageSize}
              onChange={(e) => setCategoryImageSize(e.target.value as HomepageCategoryHeroCategoryImageSize)}
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              {avatarSizeOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
            <p className="text-xs text-slate-500">Áp dụng cho toàn bộ danh mục trong hero.</p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Hình dạng avatar</Label>
            <select
              value={categoryImageShape}
              onChange={(e) => setCategoryImageShape(e.target.value as HomepageCategoryHeroCategoryImageShape)}
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              {avatarShapeOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
            <p className="text-xs text-slate-500">Áp dụng cho ảnh, icon và fallback.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers2 className="h-4 w-4 text-slate-700" />
              Menu danh mục ({categoryItems.length})
            </CardTitle>
            <p className="text-sm text-slate-500">
              Sau khi sinh tự động, chỉ cần chỉnh tay những mục thật sự cần thiết để giữ menu gọn và dễ quét.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:self-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleAllCategories}
              disabled={categoryItems.length === 0}
            >
              {allExpanded ? 'Thu gọn tất cả' : 'Mở tất cả'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCategory}
              disabled={categoriesData.length === 0}
              className="gap-2"
            >
              <Plus size={14} /> Thêm danh mục
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {duplicateCategoryIds.size > 0 && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>Có {duplicateCategoryIds.size} danh mục bị trùng. Mỗi danh mục chỉ nên xuất hiện một lần.</div>
                <button type="button" className="font-medium underline underline-offset-4" onClick={handleRemoveDuplicates}>
                  Xóa trùng
                </button>
              </div>
            </div>
          )}

          {categoriesData.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">Chưa có danh mục sản phẩm.</p>
          ) : categoryItems.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">Chưa có menu. Nhấn “Sinh ngay” để lấy từ dữ liệu thực hoặc thêm thủ công.</p>
          ) : (
            <div className="space-y-4">
              {categoryItems.map((item, idx) => {
                const groups = item.groups ?? [];
                const isDuplicate = duplicateCategoryIds.has(item.categoryId);
                const isExpanded = expandedCategoryIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'rounded-2xl border p-4 shadow-sm',
                      isDuplicate ? 'border-amber-300 bg-amber-50/70' : 'border-slate-200 bg-white'
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <button
                        type="button"
                        onClick={() => toggleCategory(item.id)}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      >
                        <GripVertical size={16} className="shrink-0 text-slate-400" />
                        <div className="min-w-0 flex-1">
                          <Label className="text-sm font-medium text-slate-900">Danh mục {idx + 1}</Label>
                          <p className="text-xs text-slate-500">{groups.length} nhóm • {groups.reduce((sum, group) => sum + (group.items?.length ?? 0), 0)} link</p>
                        </div>
                        <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform', isExpanded ? 'rotate-180' : '')} />
                      </button>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeCategory(item.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-500">Danh mục gốc</Label>
                          <select
                            value={item.categoryId}
                            onChange={(e) => updateCategory(item.id, { categoryId: e.target.value })}
                            className={cn(
                              'h-10 w-full rounded-md border bg-white px-3 text-sm',
                              isDuplicate ? 'border-amber-400' : 'border-slate-200'
                            )}
                          >
                            <option value="">-- Chọn danh mục --</option>
                            {categoriesData.map((cat) => (
                              <option key={cat._id} value={cat._id}>{cat.name}</option>
                            ))}
                          </select>
                          {isDuplicate && <p className="text-xs text-amber-700">Danh mục này đang bị trùng.</p>}
                          {categoryVisualMode === 'icon' && (
                            <div className="mt-4 space-y-2">
                              <Label className="text-xs text-slate-500">Chọn icon</Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  value={iconSearch[item.id] ?? ''}
                                  onChange={(e) => setIconSearch((prev) => ({ ...prev, [item.id]: e.target.value }))}
                                  placeholder="Tìm icon..."
                                  className="h-9"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setIconSearch((prev) => ({ ...prev, [item.id]: '' }))}
                                >
                                  Xóa
                                </Button>
                              </div>
                              <div className="grid grid-cols-6 gap-2 rounded-xl border border-slate-200 bg-white p-2 sm:grid-cols-8">
                                {HOMEPAGE_CATEGORY_HERO_ICON_OPTIONS.filter((option) => {
                                  const search = (iconSearch[item.id] ?? '').trim().toLowerCase();
                                  if (!search) {return true;}
                                  return option.label.toLowerCase().includes(search) || option.name.toLowerCase().includes(search);
                                }).map((option) => {
                                  const isSelected = option.name === item.iconName;
                                  const Icon = option.Icon;
                                  return (
                                    <button
                                      key={option.name}
                                      type="button"
                                      title={option.label}
                                      onClick={() => updateCategory(item.id, { iconName: option.name })}
                                      className={cn(
                                        'flex h-9 w-9 items-center justify-center rounded-lg border text-slate-600 transition-colors',
                                        isSelected
                                          ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                      )}
                                    >
                                      <Icon className="h-4 w-4" />
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                {item.iconName ? (
                                  <>
                                    {(() => {
                                      const Icon = getHomepageCategoryHeroIcon(item.iconName);
                                      return Icon ? <Icon className="h-4 w-4 text-slate-600" /> : null;
                                    })()}
                                    <span>Đang chọn: {item.iconName}</span>
                                  </>
                                ) : (
                                  <span>Chưa chọn icon.</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3 rounded-xl bg-slate-50 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <Label className="text-xs text-slate-500">Nhóm menu con</Label>
                            <Button type="button" variant="outline" size="sm" onClick={() => addGroup(item.id)} className="gap-2">
                              <Plus size={14} /> Thêm nhóm
                            </Button>
                          </div>

                          {groups.length === 0 ? (
                            <p className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-6 text-center text-xs text-slate-500">
                              Chưa có nhóm con.
                            </p>
                          ) : (
                            <div className="grid gap-3 xl:grid-cols-2">
                              {groups.map((group) => (
                                <div key={group.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                                  <div className="flex items-center justify-between gap-2">
                                    <Label className="text-xs text-slate-500">Nhóm #{group.id}</Label>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-red-500"
                                      onClick={() => removeGroup(item.id, group.id)}
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  </div>
                                  <Input
                                    value={group.title}
                                    onChange={(e) => updateGroup(item.id, group.id, { title: e.target.value })}
                                    placeholder="Tiêu đề nhóm"
                                    className="mt-2 h-9"
                                  />
                                  <div className="mt-3 space-y-2">
                                    {(group.items ?? []).map((link) => (
                                      <div key={link.id} className="grid grid-cols-[1fr_auto] items-center gap-2">
                                        {link.targetType === 'product' || link.productId ? (
                                          <div className="flex h-9 w-full items-center justify-between rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 text-xs text-slate-600">
                                            <span className="truncate">SP: {link.label || link.slug || 'Sản phẩm'}</span>
                                            <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] text-slate-600">Auto</span>
                                          </div>
                                        ) : (
                                          <select
                                            value={link.categoryId}
                                            onChange={(e) => updateGroupItem(item.id, group.id, link.id, { targetType: 'category', categoryId: e.target.value })}
                                            className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs"
                                          >
                                            <option value="">-- Chọn danh mục --</option>
                                            {categoriesData.map((cat) => (
                                              <option key={cat._id} value={cat._id}>{cat.name}</option>
                                            ))}
                                          </select>
                                        )}
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-red-500"
                                          onClick={() => removeGroupItem(item.id, group.id, link.id)}
                                        >
                                          <Trash2 size={14} />
                                        </Button>
                                      </div>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" onClick={() => addGroupItem(item.id, group.id)} className="gap-2">
                                      <Plus size={14} /> Thêm link
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-xs text-slate-500">Giữ mỗi danh mục 2-4 nhóm thật quan trọng để mega menu ngắn, rõ và ít trùng.</p>
        </CardContent>
      </Card>
    </div>
  );
}
