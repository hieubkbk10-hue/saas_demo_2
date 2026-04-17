'use client';

import React from 'react';
import { Button, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/admin/components/ui';
import type { OrderStatusConfig } from '@/lib/orders/statuses';

interface OrderStatusesEditorProps {
  statuses: OrderStatusConfig[];
  onChange: (statuses: OrderStatusConfig[]) => void;
}

export function OrderStatusesEditor({ statuses, onChange }: OrderStatusesEditorProps) {
  const handleAdd = () => {
    onChange([
      ...statuses,
      { key: '', label: '', color: '#64748b', step: 1, isFinal: false, allowCancel: false },
    ]);
  };

  const handleRemove = (index: number) => {
    onChange(statuses.filter((_, idx) => idx !== index));
  };

  const handleUpdate = (index: number, patch: Partial<OrderStatusConfig>) => {
    onChange(statuses.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">Danh sách trạng thái</p>
        <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
          + Thêm trạng thái
        </Button>
      </div>
      {statuses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 p-4 text-xs text-slate-500">
          Chưa có trạng thái. Hãy thêm mới.
        </div>
      ) : (
        <Table className="border border-slate-200 rounded-lg">
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Mã</TableHead>
              <TableHead className="text-xs">Tên</TableHead>
              <TableHead className="text-xs">Màu</TableHead>
              <TableHead className="text-xs">Step</TableHead>
              <TableHead className="text-xs">Kết thúc</TableHead>
              <TableHead className="text-xs">Cho hủy</TableHead>
              <TableHead className="text-xs text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {statuses.map((status, index) => (
              <TableRow key={`${status.key || 'status'}-${index}`}>
                <TableCell className="p-2">
                  <Input
                    placeholder="Pending"
                    value={status.key}
                    onChange={(event) => handleUpdate(index, { key: event.target.value })}
                  />
                </TableCell>
                <TableCell className="p-2">
                  <Input
                    placeholder="Chờ xử lý"
                    value={status.label}
                    onChange={(event) => handleUpdate(index, { label: event.target.value })}
                  />
                </TableCell>
                <TableCell className="p-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={status.color}
                      onChange={(event) => handleUpdate(index, { color: event.target.value })}
                      className="h-8 w-10 rounded border border-slate-200"
                    />
                    <Input
                      value={status.color}
                      onChange={(event) => handleUpdate(index, { color: event.target.value })}
                    />
                  </div>
                </TableCell>
                <TableCell className="p-2">
                  <Input
                    type="number"
                    min={1}
                    max={4}
                    value={Number.isFinite(status.step) ? status.step : 1}
                    onChange={(event) => handleUpdate(index, { step: Number(event.target.value || 1) })}
                  />
                </TableCell>
                <TableCell className="p-2">
                  <input
                    type="checkbox"
                    checked={status.isFinal}
                    onChange={(event) => handleUpdate(index, { isFinal: event.target.checked })}
                  />
                </TableCell>
                <TableCell className="p-2">
                  <input
                    type="checkbox"
                    checked={status.allowCancel}
                    onChange={(event) => handleUpdate(index, { allowCancel: event.target.checked })}
                  />
                </TableCell>
                <TableCell className="p-2 text-right">
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleRemove(index)}>
                    Xóa
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
