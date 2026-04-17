'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';
import { 
  Button, Card, CardContent, CardHeader, CardTitle, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Label, cn
} from '../components/ui';
import { ModuleGuard } from '../components/ModuleGuard';
import { BulkActionBar, SelectCheckbox } from '../components/TableUtilities';
import { buildCategoryPath, buildDetailPath, normalizeRouteMode } from '@/lib/ia/route-mode';
import { 
  ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Copy, ExternalLink, Eye, EyeOff, 
  GripVertical, Loader2, Menu, Plus, Trash2
} from 'lucide-react';
import { SimpleMenuPreview } from './SimpleMenuPreview';
import { MENU_MAX_LEVEL, resolveMenuMaxDepthLevel } from '@/lib/utils/menu-tree';

const MODULE_KEY = 'menus';
const MENU_ITEMS_LIMIT = 500;

type QuickRouteGroup = 'Trang cơ bản' | 'Module' | 'Danh mục';

type QuickRouteOption = {
  group: QuickRouteGroup;
  label: string;
  source: string;
  url: string;
};

const CORE_ROUTE_OPTIONS: QuickRouteOption[] = [
  { label: 'Trang chủ', url: '/', source: 'Core', group: 'Trang cơ bản' },
  { label: 'Liên hệ', url: '/contact', source: 'Core', group: 'Trang cơ bản' },
];

const MODULE_SITE_ROUTE_CATALOG: Record<string, { label: string; url: string }[]> = {
  cart: [
    { label: 'Giỏ hàng', url: '/cart' },
  ],
  customers: [
    { label: 'Đăng nhập', url: '/account/login' },
    { label: 'Đăng ký', url: '/account/register' },
    { label: 'Tài khoản', url: '/account/profile' },
    { label: 'Đơn hàng', url: '/account/orders' },
  ],
  orders: [
    { label: 'Đơn hàng', url: '/account/orders' },
    { label: 'Checkout', url: '/checkout' },
  ],
  posts: [
    { label: 'Danh sách bài viết', url: '/posts' },
  ],
  products: [
    { label: 'Danh sách sản phẩm', url: '/products' },
  ],
  promotions: [
    { label: 'Khuyến mãi', url: '/promotions' },
  ],
  services: [
    { label: 'Danh sách dịch vụ', url: '/services' },
  ],
  wishlist: [
    { label: 'Wishlist', url: '/wishlist' },
  ],
};


interface MenuItem {
  _id: Id<"menuItems">;
  _creationTime: number;
  menuId: Id<"menus">;
  label: string;
  url: string;
  order: number;
  depth: number;
  parentId?: Id<"menuItems">;
  icon?: string;
  openInNewTab?: boolean;
  active: boolean;
}

interface DraftMenuItem {
  id?: Id<"menuItems">;
  localId: string;
  label: string;
  url: string;
  order: number;
  depth: number;
  parentId?: Id<"menuItems">;
  icon?: string;
  openInNewTab?: boolean;
  active: boolean;
}

export default function MenuBuilderPageWrapper() {
  return (
    <ModuleGuard moduleKey="menus">
      <MenuBuilderPage />
    </ModuleGuard>
  );
}

function MenuBuilderPage() {
  const menusData = useQuery(api.menus.listMenus);
  const createMenu = useMutation(api.menus.createMenu);

  const isLoading = menusData === undefined;

  // Only get header menu
  const headerMenu = menusData?.find(m => m.location === 'header');

  const handleCreateHeaderMenu = async () => {
    try {
      await createMenu({ location: 'header', name: 'Header Menu' });
      toast.success('Đã tạo lại Header Menu');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tạo Header Menu');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Header Menu</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý menu điều hướng chính trên thanh header</p>
        </div>
        <div />
      </div>

      {headerMenu ? (
        <MenuItemsEditor menuId={headerMenu._id} />
      ) : (
        <Card className="p-8 text-center">
          <Menu className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">Chưa có Header Menu</h3>
          <p className="text-slate-500 mb-4">Chưa có dữ liệu menu.</p>
          <Button type="button" onClick={handleCreateHeaderMenu}>
            Tạo Header Menu
          </Button>
        </Card>
      )}
    </div>
  );
}

function MenuItemsEditor({ menuId }: { menuId: Id<"menus"> }) {
  const menuItemsData = useQuery(api.menus.listMenuItems, { menuId });
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: MODULE_KEY });
  const featuresData = useQuery(api.admin.modules.listModuleFeatures, { moduleKey: MODULE_KEY });
  const enabledModules = useQuery(api.admin.modules.listEnabledModules);
  const productCategories = useQuery(api.productCategories.listActive);
  const postCategories = useQuery(api.postCategories.listActive, { limit: 100 });
  const serviceCategories = useQuery(api.serviceCategories.listActive, { limit: 100 });
  const routeModeSetting = useQuery(api.settings.getValue, { key: 'ia_route_mode', defaultValue: 'unified' });
  const routeMode = useMemo(() => normalizeRouteMode(routeModeSetting), [routeModeSetting]);
  const saveMenuItemsBulk = useMutation(api.menus.saveMenuItemsBulk);

  const [draftItems, setDraftItems] = useState<DraftMenuItem[]>([]);
  const [originalItems, setOriginalItems] = useState<DraftMenuItem[]>([]);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [pendingSync, setPendingSync] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isQuickPickerOpen, setIsQuickPickerOpen] = useState(false);
  const [quickPickerTargetId, setQuickPickerTargetId] = useState<string | null>(null);
  const [quickRouteSearch, setQuickRouteSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pickerStep, setPickerStep] = useState<1 | 2 | 3>(1);
  const [selectedType, setSelectedType] = useState<'core' | 'module' | 'category' | 'detail' | null>(null);
  const [selectedModule, setSelectedModule] = useState<'posts' | 'products' | 'services' | null>(null);

  const detailPosts = useQuery(
    api.menus.listPostsForPicker,
    selectedModule === 'posts' && pickerStep === 3
      ? { search: quickRouteSearch, limit: 20 }
      : 'skip'
  );
  const detailProducts = useQuery(
    api.menus.listProductsForPicker,
    selectedModule === 'products' && pickerStep === 3
      ? { search: quickRouteSearch, limit: 20 }
      : 'skip'
  );
  const detailServices = useQuery(
    api.menus.listServicesForPicker,
    selectedModule === 'services' && pickerStep === 3
      ? { search: quickRouteSearch, limit: 20 }
      : 'skip'
  );

  const maxDepthLevel = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'maxDepth');
    return resolveMenuMaxDepthLevel(setting?.value);
  }, [settingsData]);

  const maxDepth = maxDepthLevel;

  // Feature toggles from System Config
  const enabledFeatures = useMemo(() => {
    const features: Record<string, boolean> = {};
    featuresData?.forEach(f => { features[f.featureKey] = f.enabled; });
    return features;
  }, [featuresData]);

  const showNested = enabledFeatures.enableNested ?? true;
  const showNewTab = enabledFeatures.enableNewTab ?? true;

  const quickRouteOptions = useMemo(() => {
    const enabledKeys = new Set((enabledModules ?? []).map(moduleItem => moduleItem.key));
    const options: QuickRouteOption[] = [...CORE_ROUTE_OPTIONS];

    Object.entries(MODULE_SITE_ROUTE_CATALOG).forEach(([moduleKey, routes]) => {
      if (!enabledKeys.has(moduleKey)) {return;}
      routes.forEach(route => {
        options.push({ ...route, source: moduleKey, group: 'Module' });
      });
    });

    if (enabledKeys.has('products')) {
      (productCategories ?? []).forEach(category => {
        options.push({
          group: 'Danh mục',
          label: category.name,
          source: 'products',
          url: buildCategoryPath({ categorySlug: category.slug, mode: routeMode, moduleKey: 'products' }),
        });
      });
    }

    if (enabledKeys.has('posts')) {
      (postCategories ?? []).forEach(category => {
        options.push({
          group: 'Danh mục',
          label: category.name,
          source: 'posts',
          url: buildCategoryPath({ categorySlug: category.slug, mode: routeMode, moduleKey: 'posts' }),
        });
      });
    }

    if (enabledKeys.has('services')) {
      (serviceCategories ?? []).forEach(category => {
        options.push({
          group: 'Danh mục',
          label: category.name,
          source: 'services',
          url: buildCategoryPath({ categorySlug: category.slug, mode: routeMode, moduleKey: 'services' }),
        });
      });
    }

    const deduped = new Map<string, QuickRouteOption>();
    options.forEach(option => {
      if (!deduped.has(option.url)) {
        deduped.set(option.url, option);
      }
    });

    return Array.from(deduped.values());
  }, [enabledModules, postCategories, productCategories, routeMode, serviceCategories]);

  const filteredQuickRoutes = useMemo(() => {
    const keyword = quickRouteSearch.trim().toLowerCase();
    if (!keyword) {return quickRouteOptions;}
    return quickRouteOptions.filter(option =>
      option.label.toLowerCase().includes(keyword)
      || option.url.toLowerCase().includes(keyword)
      || option.source.toLowerCase().includes(keyword)
    );
  }, [quickRouteOptions, quickRouteSearch]);

  const buildDraftItems = (items: MenuItem[]) => items
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((item, index) => ({
      id: item._id,
      localId: item._id,
      label: item.label,
      url: item.url,
      order: index,
      depth: item.depth,
      parentId: item.parentId,
      icon: item.icon,
      openInNewTab: item.openInNewTab,
      active: item.active,
    }));

  const normalizeOrders = (items: DraftMenuItem[]) => items.map((item, index) => ({ ...item, order: index }));

  const isValidMenuStructure = (items: DraftMenuItem[]) => items.every((item, index) => {
    if (index === 0) {
      return item.depth === 0;
    }
    return item.depth <= items[index - 1].depth + 1;
  });

  const canApplyDraftItems = (items: DraftMenuItem[]) => isValidMenuStructure(normalizeOrders(items));

  const createLocalItem = (partial: Partial<DraftMenuItem>): DraftMenuItem => ({
    localId: `new-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    label: 'Liên kết mới',
    url: '/',
    depth: 0,
    order: 0,
    active: true,
    ...partial,
  });

  const hasChanges = useMemo(() => {
    const normalize = (items: DraftMenuItem[]) => items.map(item => ({
      id: item.id,
      label: item.label,
      url: item.url,
      depth: item.depth,
      active: item.active,
      icon: item.icon,
      openInNewTab: item.openInNewTab,
      parentId: item.parentId,
      order: item.order,
    }));
    return JSON.stringify(normalize(draftItems)) !== JSON.stringify(normalize(originalItems));
  }, [draftItems, originalItems]);

  useEffect(() => {
    if (!menuItemsData) {return;}
    const nextItems = buildDraftItems(menuItemsData);
    const isInitialSync = originalItems.length === 0 && draftItems.length === 0;

    if (pendingSync || isInitialSync || !hasChanges) {
      setDraftItems(nextItems);
      setOriginalItems(nextItems);
      setPendingSync(false);
    }
  }, [menuItemsData, pendingSync, originalItems.length, draftItems.length, hasChanges]);

  useEffect(() => {
    if (isQuickPickerOpen) {return;}
    if (!quickRouteSearch) {return;}
    setQuickRouteSearch('');
  }, [isQuickPickerOpen, quickRouteSearch]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(draftItems.length / MENU_ITEMS_LIMIT));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * MENU_ITEMS_LIMIT;
    return draftItems.slice(start, start + MENU_ITEMS_LIMIT);
  }, [draftItems, currentPage]);

  const allPageSelected = paginatedItems.length > 0 && paginatedItems.every(item => selectedIds.includes(item.localId));
  const somePageSelected = paginatedItems.some(item => selectedIds.includes(item.localId));

  useEffect(() => {
    if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
      return;
    }
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setSelectedIds(prev => prev.filter(id => draftItems.some(item => item.localId === id)));
  }, [draftItems]);

  const isLoading = menuItemsData === undefined;
  const isAtMenuLimit = draftItems.length >= MENU_ITEMS_LIMIT;

  const handleMove = (index: number, direction: 'up' | 'down') => {
    setDraftItems(prev => {
      if ((direction === 'up' && index === 0) || (direction === 'down' && index === prev.length - 1)) {return prev;}
      const next = [...prev];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
      if (!canApplyDraftItems(next)) {return prev;}
      return normalizeOrders(next);
    });
  };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      const next = [...draftItems];
      const [removed] = next.splice(draggedIndex, 1);
      next.splice(index, 0, removed);
      setDragOverIndex(canApplyDraftItems(next) ? index : null);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setDraftItems(prev => {
      const next = [...prev];
      const [removed] = next.splice(draggedIndex, 1);
      next.splice(dropIndex, 0, removed);
      if (!canApplyDraftItems(next)) {return prev;}
      return normalizeOrders(next);
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleIndent = (item: DraftMenuItem, direction: 'in' | 'out') => {
    const newDepth = direction === 'in' 
      ? Math.min(item.depth + 1, maxDepth - 1) 
      : Math.max(item.depth - 1, 0);
    
    if (newDepth === item.depth) {return;}

    setDraftItems(prev => {
      const next = prev.map(current => current.localId === item.localId ? { ...current, depth: newDepth } : current);
      if (!canApplyDraftItems(next)) {return prev;}
      return next;
    });
  };

  const handleToggleActive = (item: DraftMenuItem) => {
    setDraftItems(prev => prev.map(current => current.localId === item.localId ? { ...current, active: !current.active } : current));
  };

  const handleDelete = (item: DraftMenuItem) => {
    if (confirm('Xóa liên kết này?')) {
      setDraftItems(prev => normalizeOrders(prev.filter(current => current.localId !== item.localId)));
      setSelectedIds(prev => prev.filter(id => id !== item.localId));
    }
  };

  const toggleSelectItem = (itemId: string) => {
    setSelectedIds(prev => prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]);
  };

  const toggleSelectAllPage = () => {
    const pageIds = paginatedItems.map(item => item.localId);
    if (allPageSelected) {
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
      return;
    }
    setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {return;}
    if (confirm(`Xóa ${selectedIds.length} liên kết đã chọn?`)) {
      setDraftItems(prev => normalizeOrders(prev.filter(item => !selectedIds.includes(item.localId))));
      setSelectedIds([]);
      toast.success(`Đã xóa ${selectedIds.length} liên kết`);
    }
  };

  const handleAdd = () => {
    if (isAtMenuLimit) {
      toast.error(`Tối đa ${MENU_ITEMS_LIMIT} menu items`);
      return;
    }
    setDraftItems(prev => {
      const next = [...prev, createLocalItem({ order: prev.length })];
      return normalizeOrders(next);
    });
  };

  const handleAddBelow = (item: DraftMenuItem) => {
    if (isAtMenuLimit) {
      toast.error(`Tối đa ${MENU_ITEMS_LIMIT} menu items`);
      return;
    }
    setDraftItems(prev => {
      const index = prev.findIndex(current => current.localId === item.localId);
      const next = [...prev];
      const newItem = createLocalItem({
        depth: item.depth,
        parentId: item.parentId,
      });
      next.splice(index + 1, 0, newItem);
      if (!canApplyDraftItems(next)) {return prev;}
      return normalizeOrders(next);
    });
  };

  const handleCopy = (item: DraftMenuItem) => {
    if (isAtMenuLimit) {
      toast.error(`Tối đa ${MENU_ITEMS_LIMIT} menu items`);
      return;
    }
    setDraftItems(prev => {
      const index = prev.findIndex(current => current.localId === item.localId);
      const next = [...prev];
      const newItem = createLocalItem({
        label: `${item.label} (copy)`,
        url: item.url,
        depth: item.depth,
        active: item.active,
        parentId: item.parentId,
        icon: item.icon,
        openInNewTab: item.openInNewTab,
      });
      next.splice(index + 1, 0, newItem);
      if (!canApplyDraftItems(next)) {return prev;}
      return normalizeOrders(next);
    });
  };

  const handleUpdateField = (itemId: string, field: 'label' | 'url', value: string) => {
    setDraftItems(prev => prev.map(item => item.localId === itemId ? { ...item, [field]: value } : item));
  };

  const handleOpenQuickPicker = (itemId: string) => {
    setQuickPickerTargetId(itemId);
    setIsQuickPickerOpen(true);
  };

  const handleCloseQuickPicker = () => {
    setIsQuickPickerOpen(false);
    setQuickPickerTargetId(null);
    setQuickRouteSearch('');
    setPickerStep(1);
    setSelectedType(null);
    setSelectedModule(null);
  };

  const handleSelectQuickRoute = (option: QuickRouteOption) => {
    if (!quickPickerTargetId) {return;}
    handleUpdateField(quickPickerTargetId, 'url', option.url);
    handleUpdateField(quickPickerTargetId, 'label', option.label);
    handleCloseQuickPicker();
  };

  const handleSaveAll = async () => {
    if (!hasChanges) {return;}
    if (!isValidMenuStructure(draftItems)) {
      toast.error('Cấu trúc menu không hợp lệ: không được nhảy tầng và item đầu phải ở tầng 1');
      return;
    }
    setIsSavingAll(true);
    try {
      await saveMenuItemsBulk({
        menuId,
        items: draftItems.map(item => ({
          id: item.id,
          label: item.label,
          url: item.url,
          depth: item.depth,
          active: item.active,
          icon: item.icon,
          openInNewTab: item.openInNewTab,
          parentId: item.parentId,
        })),
      });
      toast.success('Đã lưu tất cả thay đổi');
      setPendingSync(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi khi lưu');
    } finally {
      setIsSavingAll(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 size={24} className="animate-spin text-orange-500" />
      </div>
    );
  }

  // Get actual index in full items array for move operations
  const getActualIndex = (item: DraftMenuItem) => draftItems.findIndex(i => i.localId === item.localId);

  const quickRouteKeyword = quickRouteSearch.trim().toLowerCase();

  const pickerTypeOptions = [
    { type: 'core' as const, label: 'Trang cơ bản', description: 'Trang chủ, Liên hệ...' },
    { type: 'module' as const, label: 'Module', description: 'Posts, Products, Services...' },
    { type: 'category' as const, label: 'Danh mục', description: 'Category filters' },
    { type: 'detail' as const, label: 'Chi tiết', description: 'Bài viết, Sản phẩm, Dịch vụ' },
  ];

  const detailModuleOptions = [
    {
      key: 'posts' as const,
      label: 'Bài viết chi tiết',
      description: 'Chọn 1 bài viết cụ thể',
      enabled: enabledModules?.some(moduleItem => moduleItem.key === 'posts'),
    },
    {
      key: 'products' as const,
      label: 'Sản phẩm chi tiết',
      description: 'Chọn 1 sản phẩm cụ thể',
      enabled: enabledModules?.some(moduleItem => moduleItem.key === 'products'),
    },
    {
      key: 'services' as const,
      label: 'Dịch vụ chi tiết',
      description: 'Chọn 1 dịch vụ cụ thể',
      enabled: enabledModules?.some(moduleItem => moduleItem.key === 'services'),
    },
  ];

  const availableDetailModules = detailModuleOptions.filter(option => option.enabled);
  const filteredDetailModules = quickRouteKeyword
    ? availableDetailModules.filter(option =>
      option.label.toLowerCase().includes(quickRouteKeyword)
      || option.description.toLowerCase().includes(quickRouteKeyword)
    )
    : availableDetailModules;
  const resolvedDetailModules = filteredDetailModules.length > 0
    ? filteredDetailModules
    : availableDetailModules;

  const filteredPickerRoutes = filteredQuickRoutes.filter(option => {
    if (selectedType === 'core') {return option.group === 'Trang cơ bản';}
    if (selectedType === 'module') {return option.group === 'Module';}
    if (selectedType === 'category') {return option.group === 'Danh mục';}
    return false;
  });

  const isDetailLoading = pickerStep === 3 && (
    (selectedModule === 'posts' && detailPosts === undefined)
    || (selectedModule === 'products' && detailProducts === undefined)
    || (selectedModule === 'services' && detailServices === undefined)
  );

  const stats = [
    { label: 'Tổng', value: draftItems.length },
    { label: 'Hiện', value: draftItems.filter(item => item.active).length },
    { label: 'Ẩn', value: draftItems.filter(item => !item.active).length },
    { label: 'Tầng', value: maxDepth },
  ];
  const hasInvalidStructure = !isValidMenuStructure(draftItems);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,7fr)_minmax(180px,1fr)] gap-4 xl:gap-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-500">Chỉnh sửa menu và bấm lưu để áp dụng. Tối đa {MENU_ITEMS_LIMIT} menu items.</p>
          <Button
            type="button"
            onClick={handleSaveAll}
            disabled={!hasChanges || isSavingAll || hasInvalidStructure}
            className="gap-2"
          >
            {isSavingAll && <Loader2 size={14} className="animate-spin" />}
            {hasChanges ? 'Lưu tất cả' : 'Đã lưu'}
          </Button>
        </div>

        <BulkActionBar
          selectedCount={selectedIds.length}
          entityLabel="liên kết"
          onDelete={handleBulkDelete}
          onClearSelection={() => { setSelectedIds([]); }}
        />

        {paginatedItems.length > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <SelectCheckbox
              checked={allPageSelected}
              indeterminate={!allPageSelected && somePageSelected}
              onChange={toggleSelectAllPage}
              title="Chọn tất cả trên trang"
            />
            <span className="text-slate-600 dark:text-slate-300">Chọn tất cả menu ở trang hiện tại</span>
          </div>
        )}

        {paginatedItems.map((item) => {
          const actualIndex = getActualIndex(item);
          const canMoveUp = actualIndex > 0 && canApplyDraftItems((() => {
            const next = [...draftItems];
            [next[actualIndex], next[actualIndex - 1]] = [next[actualIndex - 1], next[actualIndex]];
            return next;
          })());
          const canMoveDown = actualIndex < draftItems.length - 1 && canApplyDraftItems((() => {
            const next = [...draftItems];
            [next[actualIndex], next[actualIndex + 1]] = [next[actualIndex + 1], next[actualIndex]];
            return next;
          })());
          const canIndentOut = item.depth > 0 && canApplyDraftItems(
            draftItems.map(current => current.localId === item.localId ? { ...current, depth: Math.max(item.depth - 1, 0) } : current)
          );
          const canIndentIn = item.depth < maxDepth - 1 && canApplyDraftItems(
            draftItems.map(current => current.localId === item.localId ? { ...current, depth: Math.min(item.depth + 1, maxDepth - 1) } : current)
          );

          return (
            <div 
              key={item.localId}
              draggable
              onDragStart={(e) =>{  handleDragStart(e, actualIndex); }}
              onDragOver={(e) =>{  handleDragOver(e, actualIndex); }}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, actualIndex)}
              onDragEnd={handleDragEnd}
              className={cn(
                "flex items-center gap-2 p-3 bg-white dark:bg-slate-900 border rounded-lg shadow-sm transition-all min-w-0 border-slate-200 dark:border-slate-700",
                selectedIds.includes(item.localId) && "ring-2 ring-blue-500/40 border-blue-300 dark:border-blue-700",
                !item.active && "opacity-50",
                draggedIndex === actualIndex && "opacity-50 scale-[0.98]",
                dragOverIndex === actualIndex && "border-orange-500 border-2 bg-orange-50 dark:bg-orange-900/20"
              )}
              style={showNested ? { marginLeft: Math.min(item.depth, MENU_MAX_LEVEL - 1) * 24 } : undefined}
            >
              <div className="flex items-center self-start pt-1">
                <SelectCheckbox
                  checked={selectedIds.includes(item.localId)}
                  onChange={() => toggleSelectItem(item.localId)}
                  title="Chọn menu item"
                />
              </div>

              <div className="flex flex-col gap-1 text-slate-300 cursor-grab active:cursor-grabbing">
                <button type="button" onClick={ async () => handleMove(actualIndex, 'up')} className="hover:text-orange-600 disabled:opacity-30" disabled={!canMoveUp}><ArrowUp size={14}/></button>
                <GripVertical size={14} className="text-slate-400" />
                <button type="button" onClick={ async () => handleMove(actualIndex, 'down')} className="hover:text-orange-600 disabled:opacity-30" disabled={!canMoveDown}><ArrowDown size={14}/></button>
              </div>
              
              <div className="flex-1 grid grid-cols-2 gap-3 min-w-0">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Nhãn hiển thị</Label>
                  <Input 
                    value={item.label} 
                    onChange={(e) =>{  handleUpdateField(item.localId, 'label', e.target.value); }} 
                    className="h-8 text-sm min-w-0" 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">URL</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={item.url} 
                      onChange={(e) =>{  handleUpdateField(item.localId, 'url', e.target.value); }} 
                      className="h-8 text-sm font-mono text-xs min-w-0" 
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 whitespace-nowrap"
                      onClick={() => handleOpenQuickPicker(item.localId)}
                    >
                      Gợi ý
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-0.5 border-l border-slate-100 dark:border-slate-700 pl-2">
                {showNested && (
                  <>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleIndent(item, 'out')} disabled={!canIndentOut} title="Thụt lề trái">
                      <ChevronRight size={14} className="rotate-180"/>
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleIndent(item, 'in')} disabled={!canIndentIn} title={`Thụt lề phải (tối đa ${MENU_MAX_LEVEL} tầng)`}>
                      <ChevronRight size={14}/>
                    </Button>
                  </>
                )}
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleAddBelow(item)} title="Thêm ngay bên dưới" disabled={isAtMenuLimit}>
                  <Plus size={14}/>
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy(item)} title="Copy menu item" disabled={isAtMenuLimit}>
                  <Copy size={14}/>
                </Button>
                {showNewTab && item.openInNewTab && (
                  <span title="Mở tab mới"><ExternalLink size={14} className="text-slate-400" /></span>
                )}
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleActive(item)} title={item.active ? 'Ẩn' : 'Hiện'}>
                  {item.active ? <Eye size={14}/> : <EyeOff size={14} className="text-slate-400"/>}
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDelete(item)}>
                  <Trash2 size={14}/>
                </Button>
              </div>
            </div>
          );
        })}

        <Button variant="outline" className="w-full border-dashed" onClick={handleAdd} disabled={isAtMenuLimit}>
          <Plus size={16} className="mr-2"/> {isAtMenuLimit ? `Đã đạt tối đa ${MENU_ITEMS_LIMIT} menu items` : 'Thêm liên kết mới'}
        </Button>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-500">
              Hiển thị {(currentPage - 1) * MENU_ITEMS_LIMIT + 1}-{Math.min(currentPage * MENU_ITEMS_LIMIT, draftItems.length)} / {draftItems.length}
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() =>{  setCurrentPage(p => Math.max(1, p - 1)); }}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={14} />
              </Button>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Trang {currentPage} / {totalPages}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() =>{  setCurrentPage(p => Math.min(totalPages, p + 1)); }}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>

      <div>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Thống kê</CardTitle></CardHeader>
          <CardContent className="space-y-2 pt-0">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{stat.label}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{stat.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Menu Preview Section */}
      <div className="lg:col-span-3">
        <SimpleMenuPreview
          items={draftItems.map(item => ({
            _id: (item.id ?? item.localId) as Id<"menuItems">,
            label: item.label,
            url: item.url,
            order: item.order,
            depth: item.depth,
            active: item.active,
          }))}
        />
      </div>

      <Dialog
        open={isQuickPickerOpen}
        onOpenChange={(open) =>{ if (open) { setIsQuickPickerOpen(true); } else { handleCloseQuickPicker(); } }}
      >
        <DialogContent className="max-w-2xl w-[80vw]">
          <DialogHeader>
            <DialogTitle>Chọn URL - Bước {pickerStep}/3</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={quickRouteSearch}
              onChange={(e) => setQuickRouteSearch(e.target.value)}
              placeholder={
                pickerStep === 1
                  ? 'Tìm theo loại...'
                  : pickerStep === 2
                    ? (selectedType === 'detail' ? 'Tìm module...' : 'Tìm theo tên hoặc URL...')
                    : 'Tìm theo tên...'
              }
              className="h-9 text-sm"
            />

            <div className="space-y-3">
              {pickerStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {pickerTypeOptions.map(option => (
                    <Button
                      key={option.type}
                      type="button"
                      variant="outline"
                      className="h-20 flex-col items-start gap-1.5 text-left"
                      onClick={() => {
                        setSelectedType(option.type);
                        setPickerStep(2);
                      }}
                    >
                      <span className="font-semibold">{option.label}</span>
                      <span className="text-xs text-slate-500">{option.description}</span>
                    </Button>
                  ))}
                </div>
              )}

              {pickerStep === 2 && selectedType === 'detail' && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPickerStep(1);
                      setSelectedType(null);
                    }}
                  >
                    ← Quay lại
                  </Button>

                  {resolvedDetailModules.length === 0 ? (
                    <div className="rounded-md border border-slate-200 px-4 py-6 text-sm text-slate-500">
                      Không có module phù hợp.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {resolvedDetailModules.map(option => (
                        <Button
                          key={option.key}
                          type="button"
                          variant="outline"
                          className="justify-start h-16"
                          onClick={() => {
                            setSelectedModule(option.key);
                            setPickerStep(3);
                          }}
                        >
                          <div className="text-left">
                            <div className="font-semibold">{option.label}</div>
                            <div className="text-xs text-slate-500">{option.description}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {pickerStep === 2 && selectedType && selectedType !== 'detail' && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPickerStep(1);
                      setSelectedType(null);
                    }}
                  >
                    ← Quay lại
                  </Button>

                  <div className="max-h-[50vh] overflow-auto rounded-md border border-slate-200 dark:border-slate-800">
                    {filteredPickerRoutes.length === 0 ? (
                      <div className="px-4 py-6 text-sm text-slate-500">Không có gợi ý phù hợp.</div>
                    ) : (
                      <div className="space-y-1 p-2">
                        {filteredPickerRoutes.map(option => (
                          <button
                            key={`${option.url}-${option.source}`}
                            type="button"
                            onClick={() => handleSelectQuickRoute(option)}
                            className="flex w-full items-center justify-between gap-3 rounded px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                                {option.label}
                              </div>
                              <div className="text-xs text-slate-500 font-mono truncate">{option.url}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {pickerStep === 3 && selectedModule && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPickerStep(2);
                      setSelectedModule(null);
                    }}
                  >
                    ← Quay lại
                  </Button>

                  <div className="max-h-[50vh] overflow-auto rounded-md border border-slate-200 dark:border-slate-800">
                    {isDetailLoading && (
                      <div className="px-4 py-6 text-sm text-slate-500">Đang tải dữ liệu...</div>
                    )}

                    {!isDetailLoading && selectedModule === 'posts' && (detailPosts?.length ?? 0) === 0 && (
                      <div className="px-4 py-6 text-sm text-slate-500">Không tìm thấy bài viết.</div>
                    )}

                    {!isDetailLoading && selectedModule === 'products' && (detailProducts?.length ?? 0) === 0 && (
                      <div className="px-4 py-6 text-sm text-slate-500">Không tìm thấy sản phẩm.</div>
                    )}

                    {!isDetailLoading && selectedModule === 'services' && (detailServices?.length ?? 0) === 0 && (
                      <div className="px-4 py-6 text-sm text-slate-500">Không tìm thấy dịch vụ.</div>
                    )}

                    {!isDetailLoading && selectedModule === 'posts' && (detailPosts?.length ?? 0) > 0 && (
                      <div className="space-y-1 p-2">
                        {detailPosts?.map(post => (
                          <button
                            key={post._id}
                            type="button"
                            onClick={() => {
                              handleSelectQuickRoute({
                                label: post.title,
                                url: buildDetailPath({
                                  categorySlug: post.categorySlug,
                                  mode: routeMode,
                                  moduleKey: 'posts',
                                  recordSlug: post.slug,
                                }),
                                source: 'posts',
                                group: 'Module',
                              });
                            }}
                            className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-slate-700 truncate">{post.title}</div>
                              <div className="text-xs text-slate-500 font-mono truncate">/posts/{post.slug}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {!isDetailLoading && selectedModule === 'products' && (detailProducts?.length ?? 0) > 0 && (
                      <div className="space-y-1 p-2">
                        {detailProducts?.map(product => (
                          <button
                            key={product._id}
                            type="button"
                            onClick={() => {
                              handleSelectQuickRoute({
                                label: product.name,
                                url: buildDetailPath({
                                  categorySlug: product.categorySlug,
                                  mode: routeMode,
                                  moduleKey: 'products',
                                  recordSlug: product.slug,
                                }),
                                source: 'products',
                                group: 'Module',
                              });
                            }}
                            className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-slate-700 truncate">{product.name}</div>
                              <div className="text-xs text-slate-500 font-mono truncate">/products/{product.slug}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {!isDetailLoading && selectedModule === 'services' && (detailServices?.length ?? 0) > 0 && (
                      <div className="space-y-1 p-2">
                        {detailServices?.map(service => (
                          <button
                            key={service._id}
                            type="button"
                            onClick={() => {
                              handleSelectQuickRoute({
                                label: service.title,
                                url: buildDetailPath({
                                  categorySlug: service.categorySlug,
                                  mode: routeMode,
                                  moduleKey: 'services',
                                  recordSlug: service.slug,
                                }),
                                source: 'services',
                                group: 'Module',
                              });
                            }}
                            className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-slate-700 truncate">{service.title}</div>
                              <div className="text-xs text-slate-500 font-mono truncate">/services/{service.slug}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
