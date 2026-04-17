'use client';

import React from 'react';
import {
  Briefcase,
  Building2,
  Check,
  Clock,
  Cpu,
  Globe,
  GripVertical,
  Layers,
  Mail,
  MapPin,
  Package,
  Phone,
  Plus,
  Rocket,
  Settings,
  Shield,
  Star,
  Target,
  Trash2,
  Users,
  Zap,
} from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '../../../components/ui';
import type { ServiceEditorItem } from '../_types';

export const AVAILABLE_SERVICE_ICONS = [
  'Briefcase',
  'Shield',
  'Star',
  'Users',
  'Phone',
  'Target',
  'Zap',
  'Globe',
  'Rocket',
  'Settings',
  'Layers',
  'Cpu',
  'Clock',
  'MapPin',
  'Mail',
  'Building2',
  'Check',
  'Package',
] as const;

const ICON_COMPONENTS: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  Briefcase,
  Building2,
  Check,
  Clock,
  Cpu,
  Globe,
  Layers,
  Mail,
  MapPin,
  Package,
  Phone,
  Rocket,
  Settings,
  Shield,
  Star,
  Target,
  Users,
  Zap,
};

const getIconComponent = (iconName: string) => ICON_COMPONENTS[iconName] || Star;

export const ServicesForm = ({
  items,
  onChange,
  maxItems = 12,
  brandColor,
}: {
  items: ServiceEditorItem[];
  onChange: (next: ServiceEditorItem[]) => void;
  maxItems?: number;
  brandColor: string;
}) => {
  const [draggedId, setDraggedId] = React.useState<number | null>(null);
  const [dragOverId, setDragOverId] = React.useState<number | null>(null);

  const handleAdd = () => {
    if (items.length >= maxItems) {return;}
    onChange([
      ...items,
      {
        id: (items[items.length - 1]?.id ?? 1_000_000) + 1,
        icon: 'Star',
        title: '',
        description: '',
      },
    ]);
  };

  const handleRemove = (id: number) => {
    if (items.length <= 1) {return;}
    onChange(items.filter((item) => item.id !== id));
  };

  const handleUpdate = (id: number, field: 'icon' | 'title' | 'description', value: string) => {
    onChange(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleDrop = (targetId: number) => {
    if (!draggedId || draggedId === targetId) {return;}
    const next = [...items];
    const draggedIndex = next.findIndex((item) => item.id === draggedId);
    const targetIndex = next.findIndex((item) => item.id === targetId);
    if (draggedIndex < 0 || targetIndex < 0) {return;}
    const [moved] = next.splice(draggedIndex, 1);
    next.splice(targetIndex, 0, moved);
    onChange(next);
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Dịch vụ ({items.length}/{maxItems})</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={handleAdd} className="gap-2" disabled={items.length >= maxItems}>
          <Plus size={14} /> Thêm
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, idx) => {
          const IconComponent = getIconComponent(item.icon);

          return (
            <div
              key={item.id}
              draggable
              onDragStart={() => setDraggedId(item.id)}
              onDragEnd={() => {
                setDraggedId(null);
                setDragOverId(null);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                if (draggedId !== item.id) {
                  setDragOverId(item.id);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                handleDrop(item.id);
              }}
              className={cn(
                'rounded-lg border-2 bg-slate-50 p-4 transition-all dark:bg-slate-800',
                draggedId === item.id && 'opacity-50',
                dragOverId === item.id && 'border-blue-500',
                !draggedId && !dragOverId && 'border-transparent',
              )}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <GripVertical size={16} className="text-slate-400" />
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border" style={{ borderColor: '#e2e8f0', backgroundColor: '#ffffff' }}>
                    <IconComponent size={16} style={{ color: brandColor }} />
                  </div>
                  <Label className="font-medium">Dịch vụ {idx + 1}</Label>
                </div>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleRemove(item.id)} disabled={items.length <= 1}>
                  <Trash2 size={14} />
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <select
                  value={item.icon}
                  onChange={(event) => handleUpdate(item.id, 'icon', event.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {AVAILABLE_SERVICE_ICONS.map((icon) => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>

                <Input
                  placeholder="Tiêu đề"
                  value={item.title}
                  onChange={(event) => handleUpdate(item.id, 'title', event.target.value)}
                  className="md:col-span-1"
                />

                <Input
                  placeholder="Mô tả ngắn"
                  value={item.description}
                  onChange={(event) => handleUpdate(item.id, 'description', event.target.value)}
                  className="md:col-span-2"
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
