'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Edit, FolderTree, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui';
import { BulkActionBar, ColumnToggle, SelectCheckbox, SortableHeader, useSortableData } from '../components/TableUtilities';
import { ModuleGuard } from '../components/ModuleGuard';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';

export default function ServiceCategoriesListPage() {
  return (
    <ModuleGuard moduleKey="services">
      <ServiceCategoriesContent />
    </ModuleGuard>
  );
}

function ServiceCategoriesContent() {
  const categoriesData = useQuery(api.serviceCategories.listAll, {});
  const servicesData = useQuery(api.services.listAll, {});
  const deleteCategory = useMutation(api.serviceCategories.remove);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ direction: 'asc', key: null });
  const [visibleColumns, setVisibleColumns] = useState(['select', 'name', 'slug', 'count', 'status', 'actions']);
  const [selectedIds, setSelectedIds] = useState<Id<"serviceCategories">[]>([]);
  const [deleteTargetId, setDeleteTargetId] = useState<Id<"serviceCategories"> | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const deleteInfo = useQuery(
    api.serviceCategories.getDeleteInfo,
    deleteTargetId ? { id: deleteTargetId } : 'skip'
  );

  const isLoading = categoriesData === undefined || servicesData === undefined;

  const serviceCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    servicesData?.forEach(service => {
      map[service.categoryId] = (map[service.categoryId] || 0) + 1;
    });
    return map;
  }, [servicesData]);

  const categories = useMemo(() => categoriesData?.map(cat => ({
      ...cat,
      id: cat._id,
      count: serviceCountMap[cat._id] || 0,
    })) ?? [], [categoriesData, serviceCountMap]);

  const columns = [
    { key: 'select', label: 'Chọn' },
    { key: 'name', label: 'Tên danh mục', required: true },
    { key: 'slug', label: 'Slug' },
    { key: 'count', label: 'Số dịch vụ' },
    { key: 'status', label: 'Trạng thái' },
    { key: 'actions', label: 'Hành động', required: true }
  ];

  const handleSort = (key: string) => {
    setSortConfig(prev => ({ direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc', key }));
  };

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const filteredData = useMemo(() => {
    let data = [...categories];
    if (searchTerm) {
      data = data.filter(cat => cat.name.toLowerCase().includes(searchTerm.toLowerCase()) || cat.slug.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return data;
  }, [categories, searchTerm]);

  const sortedData = useSortableData(filteredData, sortConfig);

  const toggleSelectAll = () =>{  setSelectedIds(selectedIds.length === sortedData.length ? [] : sortedData.map(item => item.id as Id<"serviceCategories">)); };
  const toggleSelectItem = (id: Id<"serviceCategories">) =>{  setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); };

  const handleDelete = async (id: Id<"serviceCategories">) => {
    setDeleteTargetId(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) {return;}
    setIsDeleteLoading(true);
    try {
      await deleteCategory({ cascade: true, id: deleteTargetId });
      toast.success('Đã xóa danh mục thành công');
      setIsDeleteOpen(false);
      setDeleteTargetId(null);
    } catch {
      toast.error('Không thể xóa danh mục');
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Xóa ${selectedIds.length} danh mục đã chọn? Tất cả dữ liệu liên quan sẽ bị xóa.`)) {
      try {
        for (const id of selectedIds) {
          await deleteCategory({ cascade: true, id });
        }
        setSelectedIds([]);
        toast.success(`Đã xóa ${selectedIds.length} danh mục`);
      } catch {
        toast.error('Không thể xóa danh mục');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/10 rounded-lg">
              <FolderTree className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Danh mục dịch vụ</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý phân loại dịch vụ</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/service-categories/create"><Button className="gap-2 bg-teal-600 hover:bg-teal-500"><Plus size={16}/> Thêm danh mục</Button></Link>
          </div>
        </div>

        <BulkActionBar
          selectedCount={selectedIds.length}
          entityLabel="danh mục dịch vụ"
          onDelete={handleBulkDelete}
          onClearSelection={() =>{  setSelectedIds([]); }}
        />

        <Card>
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex gap-4 flex-1">
              <div className="relative max-w-xs flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input placeholder="Tìm kiếm danh mục..." className="pl-9" value={searchTerm} onChange={(e) =>{  setSearchTerm(e.target.value); }} />
              </div>
            </div>
            <ColumnToggle columns={columns} visibleColumns={visibleColumns} onToggle={toggleColumn} />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.includes('select') && (
                  <TableHead className="w-[40px]">
                    <SelectCheckbox checked={selectedIds.length === sortedData.length && sortedData.length > 0} onChange={toggleSelectAll} indeterminate={selectedIds.length > 0 && selectedIds.length < sortedData.length} />
                  </TableHead>
                )}
                {visibleColumns.includes('name') && <SortableHeader label="Tên danh mục" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />}
                {visibleColumns.includes('slug') && <SortableHeader label="Slug" sortKey="slug" sortConfig={sortConfig} onSort={handleSort} />}
                {visibleColumns.includes('count') && <SortableHeader label="Số dịch vụ" sortKey="count" sortConfig={sortConfig} onSort={handleSort} className="text-center" />}
                {visibleColumns.includes('status') && <SortableHeader label="Trạng thái" sortKey="active" sortConfig={sortConfig} onSort={handleSort} />}
                {visibleColumns.includes('actions') && <TableHead className="text-right">Hành động</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map(cat => (
                <TableRow key={cat.id} className={selectedIds.includes(cat.id) ? 'bg-teal-500/5' : ''}>
                  {visibleColumns.includes('select') && (
                    <TableCell><SelectCheckbox checked={selectedIds.includes(cat.id)} onChange={() =>{  toggleSelectItem(cat.id); }} /></TableCell>
                  )}
                  {visibleColumns.includes('name') && <TableCell className="font-medium">{cat.name}</TableCell>}
                  {visibleColumns.includes('slug') && <TableCell className="text-slate-500 font-mono text-sm">{cat.slug}</TableCell>}
                  {visibleColumns.includes('count') && <TableCell className="text-center"><Badge variant="secondary">{cat.count}</Badge></TableCell>}
                  {visibleColumns.includes('status') && (
                    <TableCell>
                      <Badge variant={cat.active ? 'default' : 'secondary'}>{cat.active ? 'Hoạt động' : 'Ẩn'}</Badge>
                    </TableCell>
                  )}
                  {visibleColumns.includes('actions') && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/service-categories/${cat.id}/edit`}><Button variant="ghost" size="icon"><Edit size={16}/></Button></Link>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={ async () => handleDelete(cat.id as Id<"serviceCategories">)}><Trash2 size={16}/></Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {sortedData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length} className="text-center py-8 text-slate-500">
                    {searchTerm ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có danh mục nào'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {sortedData.length > 0 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-500">
              Hiển thị {sortedData.length} / {categories.length} danh mục
            </div>
          )}
        </Card>
      </div>
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open);
          if (!open) {setDeleteTargetId(null);}
        }}
        title="Xóa danh mục dịch vụ"
        itemName={categories.find((cat) => cat.id === deleteTargetId)?.name ?? 'danh mục'}
        dependencies={deleteInfo?.dependencies ?? []}
        onConfirm={async () => handleConfirmDelete()}
        isLoading={isDeleteLoading}
      />
    </>
  );
}
