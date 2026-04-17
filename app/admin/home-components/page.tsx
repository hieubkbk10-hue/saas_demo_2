'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Edit, Grid, GripVertical, Loader2, Plus, Trash2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Button, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, cn } from '../components/ui';
import { BulkActionBar, SelectCheckbox } from '../components/TableUtilities';
import { ModuleGuard } from '../components/ModuleGuard';
import { COMPONENT_TYPES } from './create/shared';
import { getEditRoute as getEditRouteByType } from './_shared/lib/componentRoutes';
import { HomepageSmartWizardDialog } from '@/components/modules/homepage/HomepageSmartWizardDialog';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function HomeComponentsPageWrapper() {
  return (
    <ModuleGuard moduleKey="homepage">
      <HomeComponentsPage />
    </ModuleGuard>
  );
}

const getEditRoute = (type: string, id: string) => (
  getEditRouteByType(type, id) ?? `/admin/home-components/${id}/edit`
);

interface SortableRowProps {
  comp: { _id: string; title: string; type: string; active: boolean; config?: { preview?: string; description?: string } };
  index: number;
  isSelected: boolean;
  onToggleSelect: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}

function SortableRow({ comp, index, isSelected, onToggleSelect, onToggleActive, onDelete }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: comp._id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const TypeIcon = COMPONENT_TYPES.find(t => t.value === comp.type)?.icon ?? Grid;

  return (
    <TableRow 
      ref={setNodeRef} 
      style={style} 
      className={cn(isSelected && 'bg-blue-500/5', isDragging && 'bg-slate-100 dark:bg-slate-800 opacity-80')}
    >
      <TableCell>
        <SelectCheckbox checked={isSelected} onChange={onToggleSelect} />
      </TableCell>
      <TableCell className="w-[50px]">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
          <GripVertical size={16} className="text-slate-400" />
        </button>
      </TableCell>
      <TableCell className="font-medium text-slate-500">{index + 1}</TableCell>
      <TableCell>
        <div className="font-medium">{comp.title}</div>
        <div className="text-xs text-slate-400 truncate max-w-[300px]">{(comp.config?.preview ?? comp.config?.description) ?? ''}</div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded">
            <TypeIcon size={14} className="text-slate-600 dark:text-slate-400" />
          </div>
          <span className="text-sm">{comp.type}</span>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div 
          className={cn(
            "cursor-pointer inline-flex items-center justify-center rounded-full w-8 h-4 transition-colors",
            comp.active ? "bg-green-500" : "bg-slate-300"
          )}
          onClick={onToggleActive}
        >
          <div className={cn("w-3 h-3 bg-white rounded-full transition-transform", comp.active ? "translate-x-2" : "-translate-x-2")}></div>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Link href={getEditRoute(comp.type, comp._id)}>
            <Button variant="ghost" size="icon"><Edit size={16} /></Button>
          </Link>
          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={onDelete}>
            <Trash2 size={16} />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function HomeComponentsPage() {
  const components = useQuery(api.homeComponents.listAll);
  const removeMutation = useMutation(api.homeComponents.remove);
  const toggleMutation = useMutation(api.homeComponents.toggle);
  const reorderMutation = useMutation(api.homeComponents.reorder);
  const wizardSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'homepage', settingKey: 'enableSmartWizard' });
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openWizard, setOpenWizard] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  
  if (components === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }
  
  const sortedComponents = [...components].sort((a, b) => a.order - b.order);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {return;}

    const oldIndex = sortedComponents.findIndex(c => c._id === active.id);
    const newIndex = sortedComponents.findIndex(c => c._id === over.id);
    const reordered = arrayMove(sortedComponents, oldIndex, newIndex);

    try {
      await reorderMutation({ items: reordered.map((c, i) => ({ id: c._id, order: i })) });
      toast.success('Đã cập nhật thứ tự');
    } catch {
      toast.error('Lỗi khi cập nhật thứ tự');
    }
  };

  const toggleSelectAll = () =>{  setSelectedIds(selectedIds.length === sortedComponents.length ? [] : sortedComponents.map(c => c._id)); };
  const toggleSelectItem = (id: string) =>{  setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); };

  const handleDelete = async (id: Id<"homeComponents">) => {
    if (confirm('Xóa component này khỏi trang chủ?')) {
      try {
        await removeMutation({ id });
        toast.success('Đã xóa component');
      } catch {
        toast.error('Lỗi khi xóa component');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Xóa ${selectedIds.length} component đã chọn?`)) {
      try {
        await Promise.all(selectedIds.map( async id => removeMutation({ id: id as Id<"homeComponents"> })));
        setSelectedIds([]);
        toast.success(`Đã xóa ${selectedIds.length} component`);
      } catch {
        toast.error('Lỗi khi xóa components');
      }
    }
  };

  const toggleActive = async (id: Id<"homeComponents">) => {
    try {
      await toggleMutation({ id });
    } catch {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const showWizard = wizardSetting?.value !== false;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Giao diện Trang chủ</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý các khối nội dung hiển thị trên trang chủ</p>
        </div>
        <div className="flex items-center gap-2">
          {showWizard && (
            <Button className="gap-2" variant="outline" onClick={() => setOpenWizard(true)}>
              <Wand2 size={16} /> Smart Wizard
            </Button>
          )}
          <Link href="/admin/home-components/create">
            <Button className="gap-2" variant="accent">
              <Plus size={16} /> Thêm Component
            </Button>
          </Link>
        </div>
      </div>

      {showWizard && <HomepageSmartWizardDialog open={openWizard} onOpenChange={setOpenWizard} />}

      <BulkActionBar
        selectedCount={selectedIds.length}
        entityLabel="component"
        onDelete={handleBulkDelete}
        onClearSelection={() =>{  setSelectedIds([]); }}
      />

      <Card>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <SelectCheckbox 
                    checked={selectedIds.length === sortedComponents.length && sortedComponents.length > 0} 
                    onChange={toggleSelectAll} 
                    indeterminate={selectedIds.length > 0 && selectedIds.length < sortedComponents.length} 
                  />
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="w-[50px]">TT</TableHead>
                <TableHead>Tên Component</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext items={sortedComponents.map(c => c._id)} strategy={verticalListSortingStrategy}>
                {sortedComponents.map((comp, index) => (
                  <SortableRow
                    key={comp._id}
                    comp={comp}
                    index={index}
                    isSelected={selectedIds.includes(comp._id)}
                    onToggleSelect={() =>{  toggleSelectItem(comp._id); }}
                    onToggleActive={ async () => toggleActive(comp._id)}
                    onDelete={ async () => handleDelete(comp._id)}
                  />
                ))}
              </SortableContext>
              {sortedComponents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">Chưa có component nào</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
        {sortedComponents.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-500">
            Hiển thị {sortedComponents.length} component - Kéo thả, xếp thứ tự
          </div>
        )}
      </Card>
    </div>
  );
}
