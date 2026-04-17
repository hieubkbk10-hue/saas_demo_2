'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '../../../components/ui';
import type { StatsItem } from '../_types';

export interface StatsFormItem extends StatsItem {
  id: number | string;
}

export const StatsForm = ({ items, onChange }: { items: StatsFormItem[]; onChange: (items: StatsFormItem[]) => void }) => {
  const handleAdd = () => {
    onChange([...items, { id: Date.now(), label: '', value: '' }]);
  };

  const handleUpdate = (id: number | string, field: 'label' | 'value', value: string) => {
    onChange(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleRemove = (id: number | string) => {
    if (items.length <= 1) {return;}
    onChange(items.filter((item) => item.id !== id));
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Số liệu thống kê</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={handleAdd} className="gap-2">
          <Plus size={14} /> Thêm
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, idx) => (
          <div key={item.id} className="flex gap-3 items-center">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-medium text-slate-500">
              {idx + 1}
            </div>
            <Input
              placeholder="Số liệu (VD: 1000+)"
              value={item.value}
              onChange={(e) =>{  handleUpdate(item.id, 'value', e.target.value); }}
              className="flex-1"
            />
            <Input
              placeholder="Nhãn (VD: Khách hàng)"
              value={item.label}
              onChange={(e) =>{  handleUpdate(item.id, 'label', e.target.value); }}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-red-500 h-8 w-8"
              onClick={() =>{  handleRemove(item.id); }}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
