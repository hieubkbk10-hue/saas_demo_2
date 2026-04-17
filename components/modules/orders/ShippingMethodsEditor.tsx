'use client';

import React from 'react';
import { Button, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/admin/components/ui';

export interface ShippingMethodConfig {
  id: string;
  label: string;
  description?: string;
  fee: number;
  estimate?: string;
}

interface ShippingMethodsEditorProps {
  methods: ShippingMethodConfig[];
  onChange: (methods: ShippingMethodConfig[]) => void;
}

export function ShippingMethodsEditor({ methods, onChange }: ShippingMethodsEditorProps) {
  const handleAdd = () => {
    onChange([
      ...methods,
      { id: `shipping-${Date.now()}`, label: '', description: '', fee: 0, estimate: '' },
    ]);
  };

  const handleRemove = (index: number) => {
    onChange(methods.filter((_, idx) => idx !== index));
  };

  const handleUpdate = (index: number, patch: Partial<ShippingMethodConfig>) => {
    onChange(methods.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">Phương thức vận chuyển</p>
        <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
          + Thêm
        </Button>
      </div>
      {methods.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 p-4 text-xs text-slate-500">
          Chưa có phương thức vận chuyển. Hãy thêm mới.
        </div>
      ) : (
        <Table className="border border-slate-200 rounded-lg">
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Mã</TableHead>
              <TableHead className="text-xs">Tên</TableHead>
              <TableHead className="text-xs">Mô tả</TableHead>
              <TableHead className="text-xs">Phí</TableHead>
              <TableHead className="text-xs">Thời gian</TableHead>
              <TableHead className="text-xs text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {methods.map((method, index) => (
              <TableRow key={`${method.id}-${index}`}>
                <TableCell className="p-2">
                  <Input
                    placeholder="id"
                    value={method.id}
                    onChange={(event) => handleUpdate(index, { id: event.target.value })}
                  />
                </TableCell>
                <TableCell className="p-2">
                  <Input
                    placeholder="Tên hiển thị"
                    value={method.label}
                    onChange={(event) => handleUpdate(index, { label: event.target.value })}
                  />
                </TableCell>
                <TableCell className="p-2">
                  <Input
                    placeholder="Mô tả"
                    value={method.description ?? ''}
                    onChange={(event) => handleUpdate(index, { description: event.target.value })}
                  />
                </TableCell>
                <TableCell className="p-2">
                  <Input
                    type="number"
                    placeholder="0"
                    value={Number.isFinite(method.fee) ? method.fee : 0}
                    onChange={(event) => handleUpdate(index, { fee: Number(event.target.value || 0) })}
                  />
                </TableCell>
                <TableCell className="p-2">
                  <Input
                    placeholder="2-4 ngày"
                    value={method.estimate ?? ''}
                    onChange={(event) => handleUpdate(index, { estimate: event.target.value })}
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
