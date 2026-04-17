'use client';

import React from 'react';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '../../../components/ui';
import type { SpeedDialAction, SpeedDialPosition } from '../_types';

const ICON_OPTIONS = [
  { label: 'Điện thoại', value: 'phone' },
  { label: 'Email', value: 'mail' },
  { label: 'Chat', value: 'message-circle' },
  { label: 'Địa chỉ', value: 'map-pin' },
  { label: 'Facebook', value: 'facebook' },
  { label: 'Instagram', value: 'instagram' },
  { label: 'Youtube', value: 'youtube' },
  { label: 'Zalo', value: 'zalo' },
  { label: 'Đặt lịch', value: 'calendar' },
  { label: 'Giỏ hàng', value: 'shopping-cart' },
  { label: 'Hỗ trợ', value: 'headphones' },
  { label: 'FAQ', value: 'help-circle' },
];

const HEX_6 = /^#[0-9a-fA-F]{6}$/;

const URL_PATTERNS = {
  tel: /^tel:[0-9+\-() ]+$/,
  mailto: /^mailto:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  http: /^https?:\/\/.+/,
  zalo: /^https:\/\/zalo\.me\/.+/,
};

const validateUrl = (url: string): { valid: boolean; message?: string } => {
  if (!url.trim()) {
    return { valid: true }; // Empty is OK
  }

  const trimmed = url.trim();

  if (URL_PATTERNS.tel.test(trimmed)) {
    return { valid: true };
  }

  if (URL_PATTERNS.mailto.test(trimmed)) {
    return { valid: true };
  }

  if (URL_PATTERNS.http.test(trimmed)) {
    return { valid: true };
  }

  return {
    valid: false,
    message: 'URL không hợp lệ. Dùng tel:, mailto:, hoặc https://',
  };
};

const validateHexColor = (color: string): { valid: boolean; message?: string } => {
  if (HEX_6.test(color)) {
    return { valid: true };
  }

  return {
    valid: false,
    message: 'Màu phải có định dạng #RRGGBB',
  };
};

const normalizeActionColor = (value: string, fallback: string) => (
  HEX_6.test(value) ? value : fallback
);

interface SpeedDialFormProps {
  actions: SpeedDialAction[];
  onActionsChange: (actions: SpeedDialAction[]) => void;
  position: SpeedDialPosition;
  onPositionChange: (position: SpeedDialPosition) => void;
  defaultOpen: boolean;
  onDefaultOpenChange: (value: boolean) => void;
  showOnAllPages: boolean;
  onShowOnAllPagesChange: (value: boolean) => void;
  defaultActionColor: string;
}

export function SpeedDialForm({
  actions,
  onActionsChange,
  position,
  onPositionChange,
  defaultOpen,
  onDefaultOpenChange,
  showOnAllPages,
  onShowOnAllPagesChange,
  defaultActionColor,
}: SpeedDialFormProps) {
  const [draggedId, setDraggedId] = React.useState<string | null>(null);
  const [dragOverId, setDragOverId] = React.useState<string | null>(null);
  const [urlErrors, setUrlErrors] = React.useState<Record<string, string>>({});
  const [colorErrors, setColorErrors] = React.useState<Record<string, string>>({});

  const safeDefaultColor = normalizeActionColor(defaultActionColor, '#3b82f6');

  const buildId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `action-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  };

  const ensureAction = (action: SpeedDialAction, index: number): SpeedDialAction => ({
    ...action,
    bgColor: normalizeActionColor(action.bgColor, safeDefaultColor),
    icon: action.icon || 'phone',
    id: action.id ?? `legacy-${index}`,
    label: action.label ?? '',
    url: action.url ?? '',
  });

  const normalizedActions = React.useMemo(
    () => actions.map((action, index) => ensureAction(action, index)),
    [actions, safeDefaultColor],
  );

  const needsNormalization = React.useMemo(() => {
    if (actions.length !== normalizedActions.length) {return true;}

    return normalizedActions.some((normalized, index) => {
      const current = actions[index];
      if (!current) {return true;}

      return (
        current.id !== normalized.id ||
        current.icon !== normalized.icon ||
        current.label !== normalized.label ||
        current.url !== normalized.url ||
        current.bgColor !== normalized.bgColor
      );
    });
  }, [actions, normalizedActions]);

  React.useEffect(() => {
    if (needsNormalization) {
      onActionsChange(normalizedActions);
    }
  }, [needsNormalization, normalizedActions, onActionsChange]);

  const handleAdd = () => {
    onActionsChange([
      ...normalizedActions,
      {
        id: buildId(),
        icon: 'phone',
        label: '',
        url: '',
        bgColor: safeDefaultColor,
      },
    ]);
  };

  const handleRemove = (id: string) => {
    if (normalizedActions.length <= 1) {return;}
    onActionsChange(normalizedActions.filter((action) => String(action.id) !== id));
  };

  const handleUpdate = (id: string, updater: (action: SpeedDialAction) => SpeedDialAction) => {
    onActionsChange(
      normalizedActions.map((action) => (
        String(action.id) === id ? updater(action) : action
      )),
    );
  };

  const dragProps = (id: string) => ({
    draggable: true,
    onDragStart: () => { setDraggedId(id); },
    onDragOver: (event: React.DragEvent) => {
      event.preventDefault();
      if (draggedId !== id) {
        setDragOverId(id);
      }
    },
    onDrop: (event: React.DragEvent) => {
      event.preventDefault();
      if (!draggedId || draggedId === id) {return;}

      const sourceIndex = normalizedActions.findIndex((action) => String(action.id) === draggedId);
      const targetIndex = normalizedActions.findIndex((action) => String(action.id) === id);

      if (sourceIndex < 0 || targetIndex < 0) {
        setDraggedId(null);
        setDragOverId(null);
        return;
      }

      const next = [...normalizedActions];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);

      onActionsChange(next);
      setDraggedId(null);
      setDragOverId(null);
    },
    onDragEnd: () => {
      setDraggedId(null);
      setDragOverId(null);
    },
  });

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Cấu hình chung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Vị trí hiển thị</Label>
            <select
              value={position}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                onPositionChange(event.target.value as SpeedDialPosition);
              }}
              className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
            >
              <option value="bottom-right">Góc phải</option>
              <option value="bottom-left">Góc trái</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Mặc định mở</Label>
            <button
              type="button"
              onClick={() => { onDefaultOpenChange(!defaultOpen); }}
              className={cn(
                'cursor-pointer inline-flex items-center justify-center rounded-full w-12 h-6 transition-colors',
                defaultOpen ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600',
              )}
              aria-pressed={defaultOpen}
            >
              <div
                className={cn(
                  'w-5 h-5 bg-white rounded-full transition-transform shadow',
                  defaultOpen ? 'translate-x-2.5' : '-translate-x-2.5',
                )}
              />
            </button>
            <p className="text-xs text-slate-500">Khi bật, Speed Dial mở sẵn khi tải trang.</p>
          </div>

          <div className="space-y-2">
            <Label>Hiển thị toàn site public</Label>
            <button
              type="button"
              onClick={() => { onShowOnAllPagesChange(!showOnAllPages); }}
              className={cn(
                'cursor-pointer inline-flex items-center justify-center rounded-full w-12 h-6 transition-colors',
                showOnAllPages ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600',
              )}
              aria-pressed={showOnAllPages}
            >
              <div
                className={cn(
                  'w-5 h-5 bg-white rounded-full transition-transform shadow',
                  showOnAllPages ? 'translate-x-2.5' : '-translate-x-2.5',
                )}
              />
            </button>
            <p className="text-xs text-slate-500">Khi bật, Speed Dial xuất hiện trên mọi trang public (không chỉ trang chủ).</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Danh sách hành động ({normalizedActions.length})</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={handleAdd} disabled={normalizedActions.length >= 6} className="gap-2">
            <Plus size={14} /> Thêm
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {normalizedActions.map((action, idx) => {
            const id = String(action.id);

            return (
              <div
                key={id}
                {...dragProps(id)}
                className={cn(
                  'p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3 transition-all cursor-grab active:cursor-grabbing',
                  draggedId === id && 'opacity-50 scale-[0.98]',
                  dragOverId === id && 'ring-2 ring-blue-500 ring-offset-2',
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical size={16} className="text-slate-400" />
                    <Label>Hành động {idx + 1}</Label>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-500 h-8 w-8"
                    onClick={() => { handleRemove(id); }}
                    disabled={normalizedActions.length <= 1}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-500">Icon</Label>
                    <select
                      value={action.icon}
                      onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                        handleUpdate(id, (current) => ({ ...current, icon: event.target.value }));
                      }}
                      className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
                    >
                      {ICON_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-500">Màu nền</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={normalizeActionColor(action.bgColor, safeDefaultColor)}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                          handleUpdate(id, (current) => ({ ...current, bgColor: event.target.value }));
                          setColorErrors((prev) => {
                            const next = { ...prev };
                            delete next[id];
                            return next;
                          });
                        }}
                        className="w-12 h-9 p-1 cursor-pointer"
                        aria-label="Chọn màu nền"
                      />
                      <Input
                        value={action.bgColor}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                          const newColor = event.target.value;
                          handleUpdate(id, (current) => ({ ...current, bgColor: newColor }));
                          
                          const validation = validateHexColor(newColor);
                          if (!validation.valid && validation.message) {
                            setColorErrors((prev) => ({ ...prev, [id]: validation.message! }));
                          } else {
                            setColorErrors((prev) => {
                              const next = { ...prev };
                              delete next[id];
                              return next;
                            });
                          }
                        }}
                        className={cn('flex-1', colorErrors[id] && 'border-red-500')}
                      />
                    </div>
                    {colorErrors[id] && (
                      <p className="text-xs text-red-500">{colorErrors[id]}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-500">Nhãn</Label>
                    <Input
                      value={action.label}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        handleUpdate(id, (current) => ({ ...current, label: event.target.value }));
                      }}
                      placeholder="VD: Gọi ngay"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-500">URL / Liên kết</Label>
                    <Input
                      value={action.url}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        const newUrl = event.target.value;
                        handleUpdate(id, (current) => ({ ...current, url: newUrl }));
                        
                        const validation = validateUrl(newUrl);
                        if (!validation.valid && validation.message) {
                          setUrlErrors((prev) => ({ ...prev, [id]: validation.message! }));
                        } else {
                          setUrlErrors((prev) => {
                            const next = { ...prev };
                            delete next[id];
                            return next;
                          });
                        }
                      }}
                      placeholder="tel:0123456789"
                      className={urlErrors[id] ? 'border-red-500' : ''}
                    />
                    {urlErrors[id] && (
                      <p className="text-xs text-red-500">{urlErrors[id]}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <p className="text-xs text-slate-500">
            Gợi ý URL: tel:0123456789 (gọi điện), mailto:email@example.com (email), https://zalo.me/... (Zalo)
          </p>
        </CardContent>
      </Card>
    </>
  );
}
