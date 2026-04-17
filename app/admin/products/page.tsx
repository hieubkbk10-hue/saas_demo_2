'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AdminEntityImage } from '../components/AdminEntityImage';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ChevronDown, Copy, Download, Edit, ExternalLink, Layers, Loader2, Plus, Search, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui';
import { BulkActionBar, ColumnToggle, generatePaginationItems, SelectCheckbox, SortableHeader, useSortableData } from '../components/TableUtilities';
import { ModuleGuard } from '../components/ModuleGuard';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { usePersistedPageSize } from '../components/usePersistedPageSize';
import {
  buildHeaderMap,
  getProductExcelColumns,
  isRowEmpty,
  normalizeExcelText,
  parseExcelImageUrls,
  parseExcelNumber,
  parseExcelStatus,
} from '@/lib/products/excel-contract';
import {
  buildErrorSampleSheet,
  buildGuideSheet,
  buildProductExportSheet,
  buildProductTemplateSheet,
  fillProductExportRows,
  getStatusLabel,
  type ProductExcelRow,
} from '@/lib/products/excel-styles';

const MODULE_KEY = 'products';
const PAGE_SIZE_OPTIONS = [12, 20, 30, 50, 100];

export default function ProductsListPage() {
  return (
    <ModuleGuard moduleKey="products">
      <ProductsContent />
    </ModuleGuard>
  );
}

function ProductsContent() {
  const categoriesData = useQuery(api.productCategories.listActive);
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: MODULE_KEY });
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: MODULE_KEY });
  const productStats = useQuery(api.products.getStats);
  
  const deleteProduct = useMutation(api.products.remove);
  const duplicateProduct = useMutation(api.products.duplicate);
  const bulkRemove = useMutation(api.products.bulkRemove);
  const bulkUpdateStatus = useMutation(api.products.bulkUpdateStatus);
  const importProducts = useMutation(api.products.importFromExcelRows);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<Id<"productCategories"> | ''>('');
  const [filterStatus, setFilterStatus] = useState<'' | 'Active' | 'Archived' | 'Draft'>('');
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ direction: 'asc', key: null });
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const stored = window.localStorage.getItem('admin_products_visible_columns');
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        return parsed.length > 0 ? parsed : [];
      }
    } catch {
      return [];
    }
    return [];
  });
  const [manualSelectedIds, setManualSelectedIds] = useState<Id<"products">[]>([]);
  const [selectionMode, setSelectionMode] = useState<'manual' | 'all'>('manual');
  const [currentPage, setCurrentPage] = useState(1);
  const [cloningProductId, setCloningProductId] = useState<Id<"products"> | null>(null);
  const [bulkStatusLoading, setBulkStatusLoading] = useState<'publish' | 'unpublish' | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<Id<"products"> | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [excelActionState, setExcelActionState] = useState<'idle' | 'template' | 'import' | 'export-filter' | 'export-all' | 'export-selected'>('idle');
  const [isExcelMenuOpen, setIsExcelMenuOpen] = useState(false);
  const [excelImportSummary, setExcelImportSummary] = useState<{
    created: number;
    skipped: number;
    errorCount: number;
    messages: string[];
  } | null>(null);
  const [exportRequested, setExportRequested] = useState(false);
  const [exportMode, setExportMode] = useState<'filter' | 'all' | 'selected' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelMenuRef = useRef<HTMLDivElement>(null);

  const isSelectAllActive = selectionMode === 'all';

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () =>{  clearTimeout(timer); };
  }, [searchTerm]);

  useEffect(() => {
    if (visibleColumns.length > 0) {
      window.localStorage.setItem('admin_products_visible_columns', JSON.stringify(visibleColumns));
    }
  }, [visibleColumns]);

  useEffect(() => {
    if (!isExcelMenuOpen) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (!excelMenuRef.current) {
        return;
      }
      if (!excelMenuRef.current.contains(event.target as Node)) {
        setIsExcelMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExcelMenuOpen]);

  // Get productsPerPage from module settings
  const productsPerPage = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'productsPerPage');
    const value = Number(setting?.value);
    return PAGE_SIZE_OPTIONS.includes(value) ? value : 12;
  }, [settingsData]);

  const [resolvedProductsPerPage, setPageSizeOverride] = usePersistedPageSize('admin_products_page_size', productsPerPage);

  const variantEnabled = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'variantEnabled');
    return Boolean(setting?.value);
  }, [settingsData]);

  const variantPricing = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'variantPricing');
    return (setting?.value as string) || 'variant';
  }, [settingsData]);
  const hideBasePricing = variantEnabled && variantPricing === 'variant';

  const saleMode = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'saleMode');
    const value = setting?.value;
    if (value === 'contact' || value === 'affiliate') {
      return value;
    }
    return 'cart';
  }, [settingsData]);

  const isContactLikeMode = saleMode === 'contact' || saleMode === 'affiliate';

  const excelActionsEnabled = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'enableExcelActions');
    return setting?.value === undefined ? true : Boolean(setting?.value);
  }, [settingsData]);

  const offset = (currentPage - 1) * resolvedProductsPerPage;
  const resolvedSearch = debouncedSearchTerm.trim() ? debouncedSearchTerm.trim() : undefined;
  const hasFilters = Boolean(resolvedSearch || filterCategory || filterStatus);
  const isImporting = excelActionState === 'import';
  const isTemplateDownloading = excelActionState === 'template';
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  const productsData = useQuery(api.products.listAdminWithOffset, {
    limit: resolvedProductsPerPage,
    offset,
    search: resolvedSearch,
    categoryId: filterCategory || undefined,
    status: filterStatus || undefined,
  });

  const deleteInfo = useQuery(
    api.products.getDeleteInfo,
    deleteTargetId ? { id: deleteTargetId } : 'skip'
  );

  const totalCountData = useQuery(api.products.countAdmin, {
    search: resolvedSearch,
    categoryId: filterCategory || undefined,
    status: filterStatus || undefined,
  });

  const selectAllData = useQuery(
    api.products.listAdminIds,
    isSelectAllActive
      ? {
          search: resolvedSearch,
          categoryId: filterCategory || undefined,
          status: filterStatus || undefined,
        }
      : 'skip'
  );

  const selectedIds = isSelectAllActive && selectAllData ? selectAllData.ids : manualSelectedIds;
  const isSelectingAll = isSelectAllActive && selectAllData === undefined;

  const exportData = useQuery(
    api.products.listAdminExport,
    exportRequested
      ? exportMode === 'selected'
        ? {
            limit: 5000,
            ids: selectedIds.slice(0, 5000),
          }
        : {
            limit: 5000,
            categoryId: exportMode === 'filter' ? (filterCategory || undefined) : undefined,
            search: exportMode === 'filter' ? resolvedSearch : undefined,
            status: exportMode === 'filter' ? (filterStatus || undefined) : undefined,
          }
      : 'skip'
  );

  const isLoading = productsData === undefined || totalCountData === undefined || categoriesData === undefined || fieldsData === undefined;

  useEffect(() => {
    if (selectAllData?.hasMore) {
      toast.info('Đã chọn tối đa 5.000 sản phẩm phù hợp.');
    }
  }, [selectAllData?.hasMore]);

  // Get enabled fields from system config
  const enabledFields = useMemo(() => {
    const fields = new Set<string>();
    fieldsData?.forEach(f => fields.add(f.fieldKey));
    return fields;
  }, [fieldsData]);

  const excelColumns = useMemo(() => getProductExcelColumns(enabledFields), [enabledFields]);

  // Build columns based on enabled fields
  const columns = useMemo(() => {
    const cols = [
      { key: 'select', label: 'Chọn' },
      { key: 'name', label: 'Tên sản phẩm', required: true },
    ];

    if (enabledFields.has('image')) {cols.push({ key: 'image', label: 'Ảnh' });}
    if (enabledFields.has('sku')) {cols.push({ key: 'sku', label: 'SKU' });}
    cols.push({ key: 'category', label: 'Danh mục' });
    cols.push({ key: 'price', label: 'Giá bán' });
    if (enabledFields.has('stock')) {cols.push({ key: 'stock', label: 'Tồn kho' });}
    cols.push({ key: 'status', label: 'Trạng thái' });
    cols.push({ key: 'actions', label: 'Hành động', required: true });
    
    return cols;
  }, [enabledFields]);

  // Initialize visible columns when columns change
  useEffect(() => {
    if (columns.length > 0 && visibleColumns.length === 0) {
      setVisibleColumns(columns.map(c => c.key));
    }
  }, [columns, visibleColumns.length]);

  // Update visible columns when fields change
  useEffect(() => {
    if (fieldsData !== undefined) {
      setVisibleColumns(prev => {
        const validKeys = new Set(columns.map(c => c.key));
        return prev.filter(key => validKeys.has(key));
      });
    }
  }, [fieldsData, columns]);

  // Build category map for lookup (O(1) instead of O(n))
  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categoriesData?.forEach(cat => { map[cat._id] = cat.name; });
    return map;
  }, [categoriesData]);

  const categorySlugMap = useMemo(() => {
    const map: Record<string, string> = {};
    categoriesData?.forEach(cat => { map[cat._id] = cat.slug; });
    return map;
  }, [categoriesData]);

  const products = useMemo(() => productsData?.map(p => ({
      ...p,
      id: p._id,
      category: categoryMap[p.categoryId] || 'Không có',
    })) || [], [productsData, categoryMap]);

  useEffect(() => {
    if (!exportRequested || exportData === undefined) {
      return;
    }
    if (!exportData.length) {
      toast.error('Không có dữ liệu để xuất Excel');
      setExportRequested(false);
      setExportMode(null);
      setExcelActionState('idle');
      return;
    }

    const runExport = async () => {
      try {
        const { Workbook } = await import('exceljs');
        const workbook = new Workbook();
        const sheet = buildProductExportSheet(workbook, excelColumns);
        const rows: ProductExcelRow[] = exportData.map((product) => ({
          categorySlug: categorySlugMap[product.categoryId] ?? '',
          description: product.description ?? '',
          image: product.image ?? '',
          name: product.name,
          price: product.price,
          salePrice: product.salePrice ?? null,
          sku: product.sku,
          slug: product.slug,
          status: getStatusLabel(product.status),
          stock: product.stock,
        }));
        fillProductExportRows(sheet, excelColumns, rows);
        await downloadWorkbook(workbook, `products-${new Date().toISOString().slice(0, 10)}.xlsx`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Xuất Excel thất bại');
      } finally {
        setExportRequested(false);
        setExportMode(null);
        setExcelActionState('idle');
      }
    };

    void runExport();
  }, [categorySlugMap, excelColumns, exportData, exportRequested]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({ direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc', key }));
  };

  const downloadWorkbook = async (workbook: { xlsx: { writeBuffer: () => Promise<ArrayBuffer> } }, fileName: string) => {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTemplate = async () => {
    if (!excelActionsEnabled) {
      return;
    }
    if (excelActionState !== 'idle') {
      return;
    }
    setExcelActionState('template');
    setIsExcelMenuOpen(false);
    try {
      const { Workbook } = await import('exceljs');
      const workbook = new Workbook();
      buildProductTemplateSheet(workbook, excelColumns);
      buildGuideSheet(workbook, excelColumns);
      buildErrorSampleSheet(workbook, excelColumns);
      await downloadWorkbook(workbook, 'products-template.xlsx');
      toast.success('Đã tải file mẫu');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tạo file mẫu');
    } finally {
      setExcelActionState('idle');
    }
  };

  const handleExport = (mode: 'filter' | 'all' | 'selected') => {
    if (!excelActionsEnabled) {
      return;
    }
    if (excelActionState !== 'idle') {
      return;
    }
    if (mode === 'selected' && selectedIds.length > 5000) {
      toast.error('Tối đa 5.000 mục mỗi lần export.');
      return;
    }
    const nextState = mode === 'filter' ? 'export-filter' : mode === 'selected' ? 'export-selected' : 'export-all';
    setExcelActionState(nextState);
    setExportMode(mode);
    setExportRequested(true);
    setIsExcelMenuOpen(false);
  };

  const handleImportClick = () => {
    if (!excelActionsEnabled) {
      return;
    }
    if (excelActionState !== 'idle') {
      return;
    }
    setExcelImportSummary(null);
    setIsExcelMenuOpen(false);
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setExcelActionState('import');
    try {
      const { Workbook } = await import('exceljs');
      const buffer = await file.arrayBuffer();
      const workbook = new Workbook();
      await workbook.xlsx.load(buffer);

      const sheet = workbook.getWorksheet('Products') ?? workbook.worksheets[0];
      if (!sheet) {
        toast.error('Không tìm thấy sheet Products');
        return;
      }

      const headers = Array.from({ length: sheet.columnCount }, (_, index) =>
        normalizeExcelText(sheet.getRow(1).getCell(index + 1).value)
      );
      const headerMap = buildHeaderMap(headers);
      const missingHeaders = excelColumns.filter((column) => column.required && !headerMap.has(column.key));
      if (missingHeaders.length > 0) {
        toast.error(`Thiếu cột bắt buộc: ${missingHeaders.map((column) => column.label).join(', ')}`);
        return;
      }
      const clientErrors: { row: number; message: string }[] = [];
      const payloadRows: {
        categorySlug: string;
        description?: string;
        image?: string;
        images?: string[];
        name: string;
        price: number;
        rowNumber: number;
        salePrice?: number;
        sku: string;
        slug: string;
        status?: 'Active' | 'Draft' | 'Archived';
        stock?: number;
      }[] = [];

      for (let rowIndex = 2; rowIndex <= sheet.rowCount; rowIndex += 1) {
        const row = sheet.getRow(rowIndex);
        const rowValues = excelColumns.map((column) => {
          const columnIndex = headerMap.get(column.key);
          if (columnIndex === undefined) {
            return '';
          }
          return normalizeExcelText(row.getCell(columnIndex + 1).value);
        });

        if (isRowEmpty(rowValues)) {
          continue;
        }

        const values: Record<string, string> = {};
        excelColumns.forEach((column, columnIndex) => {
          values[column.key] = rowValues[columnIndex] ?? '';
        });

        const requiredMissing = excelColumns
          .filter((column) => column.required)
          .some((column) => !values[column.key]);
        if (requiredMissing) {
          clientErrors.push({ message: 'Thiếu dữ liệu bắt buộc', row: rowIndex });
          continue;
        }

        const normalizedSlug = values.slug.trim().toLowerCase();
        const normalizedSku = values.sku.trim().toLowerCase();
        const normalizedCategory = values.categorySlug.trim().toLowerCase();

        const price = parseExcelNumber(values.price);
        if (price === null || price < 0) {
          clientErrors.push({ message: 'Giá bán không hợp lệ', row: rowIndex });
          continue;
        }
        if (saleMode === 'cart' && !hideBasePricing && price <= 0) {
          clientErrors.push({ message: 'Giá bán phải lớn hơn 0', row: rowIndex });
          continue;
        }

        const statusValue = values.status;
        const parsedStatus = statusValue ? parseExcelStatus(statusValue) : null;
        if (statusValue && !parsedStatus) {
          clientErrors.push({ message: 'Trạng thái không hợp lệ', row: rowIndex });
          continue;
        }

        const salePrice = values.salePrice ? parseExcelNumber(values.salePrice) : null;
        if (salePrice !== null && salePrice < 0) {
          clientErrors.push({ message: 'Giá so sánh không hợp lệ', row: rowIndex });
          continue;
        }
        if (salePrice !== null && salePrice > 0 && salePrice <= price) {
          clientErrors.push({ message: 'Giá so sánh phải lớn hơn giá bán', row: rowIndex });
          continue;
        }
        const stock = values.stock ? parseExcelNumber(values.stock) : null;
        if (stock !== null && stock < 0) {
          clientErrors.push({ message: 'Tồn kho không hợp lệ', row: rowIndex });
          continue;
        }
        if (normalizedSlug && !slugPattern.test(normalizedSlug)) {
          clientErrors.push({ message: 'Slug không đúng định dạng', row: rowIndex });
          continue;
        }
        const imageUrls = parseExcelImageUrls(values.image);
        const primaryImage = imageUrls[0];

        payloadRows.push({
          categorySlug: normalizedCategory,
          description: values.description || undefined,
          image: primaryImage,
          images: imageUrls.length ? imageUrls : undefined,
          name: values.name,
          price,
          rowNumber: rowIndex,
          salePrice: salePrice ?? undefined,
          sku: normalizedSku,
          slug: normalizedSlug,
          status: parsedStatus ?? undefined,
          stock: stock ?? undefined,
        });
      }

      if (!payloadRows.length) {
        toast.error('Không có dữ liệu hợp lệ để import');
        return;
      }

      const result = await importProducts({ rows: payloadRows });
      const totalErrors = clientErrors.length + result.errors.length;
      const summaryMessages = [] as string[];
      if (result.errors.length > 0) {
        summaryMessages.push(`Lỗi server: ${result.errors.length} dòng`);
      }
      if (clientErrors.length > 0) {
        summaryMessages.push(`Lỗi client: ${clientErrors.length} dòng`);
      }
      if (result.skipped > 0) {
        summaryMessages.push(`Bỏ qua: ${result.skipped} dòng`);
      }
      toast.success(`Đã tạo ${result.created} sản phẩm`);
      if (totalErrors > 0 || result.skipped > 0) {
        toast.error(`Có ${totalErrors + result.skipped} dòng cần kiểm tra`);
      }
      setExcelImportSummary({
        created: result.created,
        skipped: result.skipped,
        errorCount: totalErrors,
        messages: summaryMessages,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Import Excel thất bại');
    } finally {
      setExcelActionState('idle');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const sortedData = useSortableData(products, sortConfig);

  const totalCount = totalCountData?.count ?? 0;
  const totalPages = totalCount ? Math.ceil(totalCount / resolvedProductsPerPage) : 1;
  const paginatedData = sortedData;
  const tableColumnCount = visibleColumns.length;
  const hasManualSelection = selectedIds.length > 0;
  const isFilteredExportDisabled = !hasFilters || hasManualSelection || excelActionState !== 'idle';
  const isSelectedExportDisabled = !hasManualSelection || selectedIds.length > 5000 || excelActionState !== 'idle';

  const applyManualSelection = (nextIds: Id<"products">[]) => {
    setSelectionMode('manual');
    setManualSelectedIds(nextIds);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setFilterCategory('');
    setFilterStatus('');
    setCurrentPage(1);
    setPageSizeOverride(null);
    applyManualSelection([]);
  };

  const handleFilterChange = (type: 'category' | 'status', value: string) => {
    if (type === 'category') {
      setFilterCategory(value as Id<"productCategories"> | '');
    } else {
      setFilterStatus(value as '' | 'Active' | 'Archived' | 'Draft');
    }
    setCurrentPage(1);
    applyManualSelection([]);
  };

  const selectedOnPage = paginatedData.filter(product => selectedIds.includes(product._id));
  const isPageSelected = paginatedData.length > 0 && selectedOnPage.length === paginatedData.length;
  const isPageIndeterminate = selectedOnPage.length > 0 && selectedOnPage.length < paginatedData.length;

  const toggleSelectAll = () => {
    if (isPageSelected) {
      const remaining = selectedIds.filter(id => !paginatedData.some(product => product._id === id));
      applyManualSelection(remaining);
      return;
    }
    const next = new Set(selectedIds);
    paginatedData.forEach(product => next.add(product._id));
    applyManualSelection(Array.from(next));
  };

  const toggleSelectItem = (id: Id<"products">) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter(i => i !== id)
      : [...selectedIds, id];
    applyManualSelection(next);
  };

  const openFrontend = (slug: string) => {
    window.open(`/products/${slug}`, '_blank');
  };

  const handleDelete = async (id: Id<"products">) => {
    setDeleteTargetId(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) {return;}
    setIsDeleteLoading(true);
    try {
      await deleteProduct({ cascade: true, id: deleteTargetId });
      toast.success('Đã xóa sản phẩm');
      setIsDeleteOpen(false);
      setDeleteTargetId(null);
    } catch {
      toast.error('Có lỗi khi xóa sản phẩm');
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleDuplicateProduct = async (id: Id<"products">) => {
    setCloningProductId(id);
    try {
      const result = await duplicateProduct({ id });
      toast.success(`Đã tạo bản sao: ${result.name}`);
    } catch {
      toast.error('Không thể copy sản phẩm');
    } finally {
      setCloningProductId(null);
    }
  };

  const handleBulkStatusUpdate = async (mode: 'publish' | 'unpublish') => {
    const nextStatus = mode === 'publish' ? 'Active' : 'Draft';
    setBulkStatusLoading(mode);
    try {
      const result = await bulkUpdateStatus({ ids: selectedIds, status: nextStatus });
      applyManualSelection([]);
      if (result.updated > 0) {
        toast.success(`Đã cập nhật ${result.updated} sản phẩm${result.skipped > 0 ? `, bỏ qua ${result.skipped} sản phẩm` : ''}`);
      } else {
        toast.info('Không có sản phẩm nào cần cập nhật');
      }
    } catch {
      toast.error('Có lỗi khi cập nhật trạng thái');
    } finally {
      setBulkStatusLoading(null);
    }
  };

  // FIX #10: Add loading state for bulk delete
  const handleBulkDelete = async () => {
    if (confirm(`Xóa ${selectedIds.length} sản phẩm đã chọn? Tất cả dữ liệu liên quan sẽ bị xóa.`)) {
      setIsDeleting(true);
      try {
        const count = await bulkRemove({ ids: selectedIds });
        applyManualSelection([]);
        toast.success(`Đã xóa ${count} sản phẩm`);
      } catch {
        toast.error('Có lỗi khi xóa sản phẩm');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(price);
  const renderContactPrice = (resolvedPrice: number) => (
    isContactLikeMode && resolvedPrice <= 0
      ? <span className="text-slate-500">Giá liên hệ</span>
      : <span>{formatPrice(resolvedPrice)}</span>
  );

  const getInvalidPriceContext = (product: (typeof products)[number]) => {
    if (variantEnabled && variantPricing === 'variant' && product.hasVariants) {
      const meta = product as typeof product & { hasInvalidVariantComparePrice?: boolean };
      return meta.hasInvalidVariantComparePrice ? { scope: 'variant' as const } : null;
    }
    const salePrice = product.salePrice ?? 0;
    const price = product.price ?? 0;
    if (salePrice > 0 && salePrice <= price) {
      return { scope: 'product' as const };
    }
    return null;
  };

  const invalidPriceCount = useMemo(() =>
    paginatedData.reduce((count, product) => (getInvalidPriceContext(product) ? count + 1 : count), 0),
  [paginatedData, variantEnabled, variantPricing]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Sản phẩm</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Quản lý kho hàng và thông tin sản phẩm
            {productStats && (
              <span className="ml-2 text-xs">
                (Tổng: {productStats.total} | Active: {productStats.active} | Draft: {productStats.draft})
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative" ref={excelMenuRef}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={handleImportFile}
            />
            <Button
              variant="outline"
              className="gap-2"
              onClick={() =>{  if (excelActionsEnabled) { setIsExcelMenuOpen((prev) => !prev); } }}
              aria-expanded={isExcelMenuOpen}
              disabled={!excelActionsEnabled || excelActionState !== 'idle'}
            >
              <Download size={16} /> Excel Actions <ChevronDown size={16} className="text-slate-400" />
            </Button>
            {!excelActionsEnabled && (
              <div className="mt-1 text-xs text-slate-500">Excel actions đang tắt trong module settings</div>
            )}
            {excelActionsEnabled && isExcelMenuOpen && (
              <div className="absolute right-0 z-20 mt-2 w-[320px] max-w-[calc(100vw-2rem)] rounded-md border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900 sm:w-[360px]">
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Template</div>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    disabled={excelActionState !== 'idle'}
                    className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-slate-800"
                  >
                    <Download size={16} className="mt-0.5 text-slate-500" />
                    <div className="flex-1">
                      <div className="font-medium">Tải mẫu (Template)</div>
                      <div className="text-xs text-slate-500">File mẫu có hướng dẫn và lỗi mẫu.</div>
                    </div>
                    {isTemplateDownloading && <Loader2 size={14} className="mt-0.5 animate-spin text-slate-500" />}
                  </button>

                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Import</div>
                  <button
                    type="button"
                    onClick={handleImportClick}
                    disabled={excelActionState !== 'idle'}
                    className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-slate-800"
                  >
                    <Upload size={16} className="mt-0.5 text-slate-500" />
                    <div className="flex-1">
                      <div className="font-medium">Nhập Excel (Import)</div>
                      <div className="text-xs text-slate-500">Chọn file .xlsx để tạo sản phẩm hàng loạt.</div>
                    </div>
                    {isImporting && <Loader2 size={14} className="mt-0.5 animate-spin text-slate-500" />}
                  </button>

                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Export</div>
                  <button
                    type="button"
                    onClick={() =>{  handleExport('filter'); }}
                    disabled={isFilteredExportDisabled}
                    className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-slate-800"
                  >
                    <Download size={16} className="mt-0.5 text-slate-500" />
                    <div className="flex-1">
                      <div className="font-medium">Xuất theo lọc (Export Filtered)</div>
                      <div className="text-xs text-slate-500">Áp dụng bộ lọc hiện tại, tối đa 5.000 dòng.</div>
                    </div>
                    {excelActionState === 'export-filter' && <Loader2 size={14} className="mt-0.5 animate-spin text-slate-500" />}
                  </button>
                  {!hasFilters && !hasManualSelection && (
                    <div className="px-3 text-xs text-slate-500">Chưa có bộ lọc, vui lòng chọn lọc trước khi xuất.</div>
                  )}
                  {hasManualSelection && (
                    <div className="px-3 text-xs text-slate-500">Đang chọn thủ công, vui lòng Bỏ chọn tất cả để dùng Xuất theo lọc.</div>
                  )}
                  <button
                    type="button"
                    onClick={() =>{  handleExport('selected'); }}
                    disabled={isSelectedExportDisabled}
                    className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-slate-800"
                  >
                    <Download size={16} className="mt-0.5 text-slate-500" />
                    <div className="flex-1">
                      <div className="font-medium">Xuất đã chọn (Export Selected)</div>
                      <div className="text-xs text-slate-500">Chỉ xuất các sản phẩm đang được tick trong danh sách.</div>
                    </div>
                    {excelActionState === 'export-selected' && <Loader2 size={14} className="mt-0.5 animate-spin text-slate-500" />}
                  </button>
                  {!hasManualSelection && (
                    <div className="px-3 text-xs text-slate-500">Chưa có lựa chọn thủ công, vui lòng tick sản phẩm để xuất.</div>
                  )}
                  {selectedIds.length > 5000 && (
                    <div className="px-3 text-xs text-slate-500">Tối đa 5.000 mục mỗi lần export.</div>
                  )}
                  <button
                    type="button"
                    onClick={() =>{  handleExport('all'); }}
                    disabled={excelActionState !== 'idle'}
                    className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-slate-800"
                  >
                    <Download size={16} className="mt-0.5 text-slate-500" />
                    <div className="flex-1">
                      <div className="font-medium">Xuất toàn bộ (Export All)</div>
                      <div className="text-xs text-slate-500">Tối đa 5.000 dòng mỗi lần export.</div>
                    </div>
                    {excelActionState === 'export-all' && <Loader2 size={14} className="mt-0.5 animate-spin text-slate-500" />}
                  </button>
                </div>
              </div>
            )}
          </div>
          <Link href="/admin/products/create"><Button className="gap-2"><Plus size={16}/> Thêm sản phẩm</Button></Link>
        </div>
      </div>

      {excelImportSummary && (
        <Card className="border border-orange-200 bg-orange-50/40 p-4 text-sm text-slate-700">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold text-slate-900">Tóm tắt import Excel</div>
              <div className="mt-1 text-xs text-slate-600">Tạo: {excelImportSummary.created} · Bỏ qua: {excelImportSummary.skipped} · Lỗi: {excelImportSummary.errorCount}</div>
              {excelImportSummary.messages.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-600">
                  {excelImportSummary.messages.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() =>{  setExcelImportSummary(null); }}>Đóng</Button>
          </div>
        </Card>
      )}

      <BulkActionBar 
        selectedCount={selectedIds.length} 
        entityLabel="sản phẩm"
        selectionScope={isSelectAllActive ? 'all_results' : isPageSelected ? 'page' : 'partial'}
        pageItemCount={paginatedData.length}
        totalMatchingCount={totalCount}
        onSelectPage={() =>{  applyManualSelection(paginatedData.map(product => product._id)); }}
        onSelectAllResults={() =>{  setSelectionMode('all'); }}
        isSelectingAllResults={isSelectingAll}
        onPublish={() =>{  void handleBulkStatusUpdate('publish'); }}
        onUnpublish={() =>{  void handleBulkStatusUpdate('unpublish'); }}
        isStatusLoading={bulkStatusLoading}
        onDelete={handleBulkDelete} 
        onClearSelection={() =>{  applyManualSelection([]); }} 
        isLoading={isDeleting}
      />

      <Card>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-wrap gap-3 flex-1">
            <div className="relative max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder={enabledFields.has('sku') ? "Tìm tên, SKU..." : "Tìm tên sản phẩm..."} 
                className="pl-9 w-48" 
                value={searchTerm} 
                onChange={(e) =>{  setSearchTerm(e.target.value); setCurrentPage(1); applyManualSelection([]); }} 
              />
            </div>
            <select className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" value={filterCategory} onChange={(e) =>{  handleFilterChange('category', e.target.value); }}>
              <option value="">Tất cả danh mục</option>
              {categoriesData?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <select className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" value={filterStatus} onChange={(e) =>{  handleFilterChange('status', e.target.value); }}>
              <option value="">Tất cả trạng thái</option>
              <option value="Active">Đang bán</option>
              <option value="Draft">Bản nháp</option>
              <option value="Archived">Lưu trữ</option>
            </select>
            <Button variant="outline" size="sm" onClick={handleResetFilters}>Xóa lọc</Button>
          </div>
          <div className="flex items-center gap-2">
            {invalidPriceCount > 0 && (
              <Badge variant="destructive" className="text-[11px]">
                {invalidPriceCount} sản phẩm giá không hợp lệ
              </Badge>
            )}
            <ColumnToggle columns={columns} visibleColumns={visibleColumns} onToggle={toggleColumn} />
          </div>
        </div>
        <Table>
          <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-white dark:[&_th]:bg-slate-900">
            <TableRow>
              {visibleColumns.includes('select') && <TableHead className="w-[40px]"><SelectCheckbox checked={isPageSelected} onChange={toggleSelectAll} indeterminate={isPageIndeterminate} /></TableHead>}
              {visibleColumns.includes('image') && <TableHead className="w-[60px]">Ảnh</TableHead>}
              {visibleColumns.includes('name') && <SortableHeader label="Tên sản phẩm" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />}
              {visibleColumns.includes('sku') && enabledFields.has('sku') && <SortableHeader label="SKU" sortKey="sku" sortConfig={sortConfig} onSort={handleSort} />}
              {visibleColumns.includes('category') && <SortableHeader label="Danh mục" sortKey="category" sortConfig={sortConfig} onSort={handleSort} />}
              {visibleColumns.includes('price') && <SortableHeader label="Giá bán" sortKey="price" sortConfig={sortConfig} onSort={handleSort} />}
              {visibleColumns.includes('stock') && enabledFields.has('stock') && <SortableHeader label="Tồn kho" sortKey="stock" sortConfig={sortConfig} onSort={handleSort} />}
              {visibleColumns.includes('status') && <SortableHeader label="Trạng thái" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />}
              {visibleColumns.includes('actions') && <TableHead className="text-right">Hành động</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map(product => (
              <TableRow key={product._id} className={selectedIds.includes(product._id) ? 'bg-orange-500/5' : ''}>
                {visibleColumns.includes('select') && <TableCell><SelectCheckbox checked={selectedIds.includes(product._id)} onChange={() =>{  toggleSelectItem(product._id); }} /></TableCell>}
                {visibleColumns.includes('image') && (
                  <TableCell>
                    <AdminEntityImage
                      src={product.image}
                      alt={product.name}
                      variant="product"
                      width={40}
                      height={40}
                      className="h-10 w-10"
                    />
                  </TableCell>
                )}
                {visibleColumns.includes('name') && <TableCell className="font-medium max-w-[200px] truncate">{product.name}</TableCell>}
                {visibleColumns.includes('sku') && enabledFields.has('sku') && <TableCell className="font-mono text-xs text-slate-500">{product.sku}</TableCell>}
                {visibleColumns.includes('category') && <TableCell>{product.category}</TableCell>}
                {visibleColumns.includes('price') && (
                  <TableCell>
                    {(() => {
                      const invalidContext = getInvalidPriceContext(product);
                      return (
                        <div>
                          {variantEnabled && variantPricing === 'variant' && product.hasVariants ? (() => {
                            const meta = product as typeof product & {
                              hasPricedActiveVariant?: boolean;
                              variantMinPrice?: number | null;
                            };
                            if (!meta.hasPricedActiveVariant) {
                              return <span className="text-slate-500">Chưa có giá</span>;
                            }
                            const resolvedPrice = meta.variantMinPrice ?? product.price ?? 0;
                            return renderContactPrice(resolvedPrice);
                          })() : (
                            (product.salePrice ?? 0) > (product.price ?? 0) && enabledFields.has('salePrice') ? (
                              <>
                                <span className="text-red-500 font-medium">{formatPrice(product.price ?? 0)}</span>
                                <span className="text-slate-400 line-through text-xs ml-1">{formatPrice(product.salePrice ?? 0)}</span>
                              </>
                            ) : (
                              renderContactPrice(product.price ?? 0)
                            )
                          )}
                          {invalidContext && (
                            <p className="text-xs text-red-500 mt-1">Giá so sánh không hợp lệ</p>
                          )}
                        </div>
                      );
                    })()}
                  </TableCell>
                )}
                {visibleColumns.includes('stock') && enabledFields.has('stock') && <TableCell className={product.stock < 10 ? 'text-red-500 font-medium' : ''}>{product.stock}</TableCell>}
                {visibleColumns.includes('status') && (
                  <TableCell>
                    <Badge variant={product.status === 'Active' ? 'success' : (product.status === 'Draft' ? 'secondary' : 'warning')}>
                      {product.status === 'Active' ? 'Đang bán' : (product.status === 'Draft' ? 'Bản nháp' : 'Lưu trữ')}
                    </Badge>
                  </TableCell>
                )}
                {visibleColumns.includes('actions') && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700" title="Xem trên web" onClick={() =>{  openFrontend(product.slug); }}><ExternalLink size={16}/></Button>
                      {variantEnabled && product.hasVariants && (
                        <Link href={`/admin/products/${product._id}/variants`}>
                          <Button variant="ghost" size="icon" title="Quản lý phiên bản"><Layers size={16} /></Button>
                        </Link>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Copy sản phẩm"
                        onClick={() =>{  void handleDuplicateProduct(product._id); }}
                        disabled={cloningProductId === product._id}
                      >
                        {cloningProductId === product._id ? <Loader2 size={16} className="animate-spin" /> : <Copy size={16} />}
                      </Button>
                      <Link href={`/admin/products/${product._id}/edit`}><Button variant="ghost" size="icon"><Edit size={16}/></Button></Link>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={ async () => handleDelete(product._id)}><Trash2 size={16}/></Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {paginatedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={tableColumnCount} className="text-center py-8 text-slate-500">
                {searchTerm || filterCategory || filterStatus ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có sản phẩm nào.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {totalCount > 0 && !isLoading && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="order-2 flex w-full items-center justify-between text-sm text-slate-500 sm:order-1 sm:w-auto sm:justify-start sm:gap-6">
              <div className="flex items-center gap-2">
                <span className="text-slate-600">Hiển thị</span>
                <select
                  value={resolvedProductsPerPage}
                  onChange={(event) =>{  setPageSizeOverride(Number(event.target.value)); setCurrentPage(1); applyManualSelection([]); }}
                  className="h-8 w-[70px] appearance-none rounded-md border border-slate-200 bg-white px-2 text-sm font-medium text-slate-900 shadow-sm focus:border-slate-300 focus:outline-none"
                  aria-label="Số sản phẩm mỗi trang"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                <span>sản phẩm/trang</span>
              </div>

              <div className="text-right sm:text-left">
                <span className="font-medium text-slate-900">
                  {totalCount ? ((currentPage - 1) * resolvedProductsPerPage) + 1 : 0}–{Math.min(currentPage * resolvedProductsPerPage, totalCount)}
                </span>
                <span className="mx-1 text-slate-300">/</span>
                <span className="font-medium text-slate-900">
                  {totalCount}{totalCountData?.hasMore ? '+' : ''}
                </span>
                <span className="ml-1 text-slate-500">sản phẩm</span>
              </div>
            </div>

            <div className="order-1 flex w-full justify-center sm:order-2 sm:w-auto sm:justify-end">
              <nav className="flex items-center space-x-1 sm:space-x-2" aria-label="Phân trang">
                <button
                  onClick={() =>{  setCurrentPage((prev) => Math.max(1, prev - 1)); }}
                  disabled={currentPage === 1}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Trang trước"
                >
                  <ChevronDown className="h-4 w-4 rotate-90" />
                </button>

                {generatePaginationItems(currentPage, totalPages).map((item, index) => {
                  if (item === 'ellipsis') {
                    return (
                      <div key={`ellipsis-${index}`} className="flex h-8 w-8 items-center justify-center text-slate-400">
                        …
                      </div>
                    );
                  }

                  const pageNum = item as number;
                  const isActive = pageNum === currentPage;
                  const isMobileHidden = !isActive && pageNum !== 1 && pageNum !== totalPages;

                  return (
                    <button
                      key={pageNum}
                      onClick={() =>{  setCurrentPage(pageNum); }}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-orange-600 text-white shadow-sm border font-medium'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      } ${isMobileHidden ? 'hidden sm:inline-flex' : ''}`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() =>{  setCurrentPage((prev) => Math.min(totalPages, prev + 1)); }}
                  disabled={currentPage >= totalPages}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Trang sau"
                >
                  <ChevronDown className="h-4 w-4 -rotate-90" />
                </button>
              </nav>
            </div>
          </div>
        )}
      </Card>
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open);
          if (!open) {setDeleteTargetId(null);}
        }}
        title="Xóa sản phẩm"
        itemName={products.find((product) => product.id === deleteTargetId)?.name ?? 'sản phẩm'}
        dependencies={deleteInfo?.dependencies ?? []}
        onConfirm={async () => handleConfirmDelete()}
        isLoading={isDeleteLoading}
      />
    </div>
  );
}
