'use client';

import React, { useState } from 'react';
import { ArrowUpDown, ChevronDown, Loader2, SlidersHorizontal, Trash2 } from 'lucide-react';
import { Button, TableHead, cn } from './ui';

export const ColumnToggle = ({ columns, visibleColumns, onToggle }: {
  columns: { key: string; label: string; required?: boolean }[];
  visibleColumns: string[];
  onToggle: (key: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="relative">
      <Button variant="outline" size="sm" className="gap-2 h-9" onClick={() =>{  setOpen(!open); }}>
        <SlidersHorizontal size={14} />
        Cột hiển thị
        <ChevronDown size={14} />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() =>{  setOpen(false); }} />
          <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 py-2">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Chọn cột hiển thị</div>
            {columns.map(col => (
              <label key={col.key} className={cn(
                "flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer",
                col.required && "opacity-50 cursor-not-allowed"
              )}>
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(col.key)}
                  onChange={() => !col.required && onToggle(col.key)}
                  disabled={col.required}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">{col.label}</span>
                {col.required && <span className="text-xs text-slate-400 ml-auto">Bắt buộc</span>}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const SortableHeader = ({ label, sortKey, sortConfig, onSort, className }: {
  label: string;
  sortKey: string;
  sortConfig: { key: string | null; direction: 'asc' | 'desc' };
  onSort: (key: string) => void;
  className?: string;
}) => (
  <TableHead
    className={cn("cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors select-none", className)}
    onClick={() =>{  onSort(sortKey); }}
  >
    <div className="flex items-center">
      {label}
      <ArrowUpDown size={14} className={cn("ml-2", sortConfig.key === sortKey ? "text-slate-900 dark:text-slate-100" : "text-slate-300 dark:text-slate-600")} />
    </div>
  </TableHead>
);

export function generatePaginationItems(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, 'ellipsis', totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages];
}

export function useSortableData<T>(items: T[], config: { key: string | null; direction: 'asc' | 'desc' }) {
  return React.useMemo(() => {
    const sortableItems = [...items];
    if (config.key) {
      sortableItems.sort((a, b) => {
        const aVal = a[config.key as keyof T] as string | number | undefined | null;
        const bVal = b[config.key as keyof T] as string | number | undefined | null;
        if (aVal == null || bVal == null) {return 0;}
        if (aVal < bVal) {return config.direction === 'asc' ? -1 : 1;}
        if (aVal > bVal) {return config.direction === 'asc' ? 1 : -1;}
        return 0;
      });
    }
    return sortableItems;
  }, [items, config]);
}

export type BulkSelectionScope = 'partial' | 'page' | 'all_results';

export const BulkActionBar = ({
  selectedCount,
  entityLabel,
  selectionScope = 'partial',
  pageItemCount,
  totalMatchingCount,
  onSelectPage,
  onSelectAllResults,
  isSelectingAllResults,
  onPublish,
  onUnpublish,
  isStatusLoading,
  publishLabel = 'Đăng bán',
  publishLoadingLabel = 'Đang đăng bán...',
  unpublishLabel = 'Chuyển nháp',
  unpublishLoadingLabel = 'Đang chuyển nháp...',
  onDelete,
  onClearSelection,
  isLoading,
}: {
  selectedCount: number;
  entityLabel: string;
  selectionScope?: BulkSelectionScope;
  pageItemCount?: number;
  totalMatchingCount?: number;
  onSelectPage?: () => void;
  onSelectAllResults?: () => void;
  isSelectingAllResults?: boolean;
  onPublish?: () => void;
  onUnpublish?: () => void;
  isStatusLoading?: 'publish' | 'unpublish' | null;
  publishLabel?: string;
  publishLoadingLabel?: string;
  unpublishLabel?: string;
  unpublishLoadingLabel?: string;
  onDelete: () => void;
  onClearSelection: () => void;
  isLoading?: boolean;
}) => {
  if (selectedCount === 0) {return null;}

  const resolvedTotalMatchingCount = totalMatchingCount ?? selectedCount;
  const resolvedPageItemCount = pageItemCount ?? selectedCount;
  const canSelectPage = selectionScope === 'partial' && onSelectPage && resolvedPageItemCount > selectedCount;
  const canSelectAllResults = selectionScope === 'page' && onSelectAllResults && resolvedTotalMatchingCount > resolvedPageItemCount;
  const primaryMessage = selectionScope === 'all_results'
    ? `Đã chọn toàn bộ ${resolvedTotalMatchingCount} ${entityLabel} phù hợp`
    : selectionScope === 'page'
      ? `Đã chọn ${selectedCount} ${entityLabel} trên trang này`
      : `Đã chọn ${selectedCount} ${entityLabel}`;
  
  return (
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-center justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{primaryMessage}</span>
          <button onClick={onClearSelection} className="text-xs text-slate-500 hover:text-slate-700 underline" disabled={isLoading}>
            Bỏ chọn tất cả
          </button>
        </div>
        {selectionScope === 'all_results' && (
          <span className="text-xs text-slate-500">Bao gồm tất cả kết quả theo bộ lọc hiện tại</span>
        )}
        {canSelectPage && (
          <button
            type="button"
            onClick={onSelectPage}
            disabled={isLoading}
            className="text-xs text-blue-600 hover:text-blue-700 underline text-left"
          >
            Chọn toàn bộ {resolvedPageItemCount} {entityLabel} trên trang này
          </button>
        )}
        {canSelectAllResults && (
          <button
            type="button"
            onClick={onSelectAllResults}
            disabled={isLoading || isSelectingAllResults}
            className="text-xs text-blue-600 hover:text-blue-700 underline text-left"
          >
            {isSelectingAllResults ? 'Đang chọn...' : `Chọn tất cả ${resolvedTotalMatchingCount} ${entityLabel} phù hợp`}
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {onPublish && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 h-8"
            onClick={onPublish}
            disabled={isLoading || Boolean(isStatusLoading)}
          >
            {isStatusLoading === 'publish' ? <Loader2 size={14} className="animate-spin" /> : null}
            {isStatusLoading === 'publish' ? publishLoadingLabel : `${publishLabel} (${selectedCount})`}
          </Button>
        )}
        {onUnpublish && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 h-8"
            onClick={onUnpublish}
            disabled={isLoading || Boolean(isStatusLoading)}
          >
            {isStatusLoading === 'unpublish' ? <Loader2 size={14} className="animate-spin" /> : null}
            {isStatusLoading === 'unpublish' ? unpublishLoadingLabel : `${unpublishLabel} (${selectedCount})`}
          </Button>
        )}
        <Button variant="destructive" size="sm" className="gap-2 h-8" onClick={onDelete} disabled={isLoading || Boolean(isStatusLoading)}>
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          {isLoading ? 'Đang xóa...' : `Xóa (${selectedCount})`}
        </Button>
      </div>
    </div>
  );
};

export const SelectCheckbox = ({ checked, onChange, indeterminate, disabled, title }: { 
  checked: boolean; 
  onChange: () => void;
  indeterminate?: boolean;
  disabled?: boolean;
  title?: string;
}) => {
  const ref = React.useRef<HTMLInputElement>(null);
  
  React.useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate ?? false;
    }
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      title={title}
      className={`w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      }`}
    />
  );
};
