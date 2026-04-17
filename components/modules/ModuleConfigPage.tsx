 'use client';
 
import React, { useState } from 'react';
import { toast } from 'sonner';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Settings, Palette, Loader2, FolderTree } from 'lucide-react';
import type { ModuleDefinition } from '@/lib/modules/define-module';
import type { FieldConfig } from '@/types/module-config';
 import { useModuleConfig } from '@/lib/modules/hooks/useModuleConfig';
import { hasModuleRuntimeDefinition } from '@/lib/modules/runtime-config';
 import { 
   ModuleHeader, 
   ModuleStatus, 
   ConventionNote,
   SettingsCard, 
   SettingInput, 
   SettingSelect,
  SettingToggle,
  SettingTextarea,
   FeaturesCard,
   FieldsCard,
 } from '@/components/modules/shared';
import { VariantSettingsSection } from '@/components/modules/products/VariantSettingsSection';
import { Card, cn } from '@/app/admin/components/ui';
 
type TabType = 'config' | 'appearance';

const REMOVED_SETTINGS_FIELDS = new Set([
  'seo_robots',
  'seo_business_type',
  'seo_opening_hours',
  'seo_price_range',
  'seo_geo_lat',
  'seo_geo_lng',
  'seo_hreflang',
]);
 
export interface ModuleConfigPageRenderProps {
  config: ModuleDefinition;
  colorClasses: ReturnType<typeof getColorClasses>;
  isSaving: boolean;
  setIsSaving: (v: boolean) => void;
}

export interface ModuleConfigTabRenderProps {
  config: ModuleDefinition;
  moduleData: { isCore?: boolean; enabled?: boolean } | null | undefined;
  isReadOnly: boolean;
  localFeatures: Record<string, boolean>;
  localFields: FieldConfig[];
  localCategoryFields: FieldConfig[];
  localSettings: Record<string, string | number | boolean>;
  colorClasses: ReturnType<typeof getColorClasses>;
  onToggleFeature: (key: string) => void;
  onToggleField: (key: string) => void;
  onToggleCategoryField: (key: string) => void;
  onSettingChange: (key: string, value: string | number | boolean) => void;
}

 interface ModuleConfigPageProps {
   config: ModuleDefinition;
  renderAppearanceTab?: (props: ModuleConfigPageRenderProps) => React.ReactNode;
  renderConfigTab?: (props: ModuleConfigTabRenderProps) => React.ReactNode;
  onAppearanceSave?: () => Promise<void>;
  appearanceHasChanges?: boolean;
 }
 
export function ModuleConfigPage({ 
  config, 
  renderAppearanceTab,
  renderConfigTab,
  onAppearanceSave,
  appearanceHasChanges = false,
}: ModuleConfigPageProps) {
   const [activeTab, setActiveTab] = useState<TabType>('config');
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncModuleConfig = useMutation(api.admin.modules.syncModuleConfigFromDefinition);
   
   const {
     moduleData,
     localFeatures,
     localFields,
     localCategoryFields,
     localSettings,
     isLoading,
    isSaving: isConfigSaving,
     hasChanges,
     handleToggleFeature,
     handleToggleField,
     handleToggleCategoryField,
     handleSettingChange,
     handleSave,
   } = useModuleConfig(config);
   
   const colorClasses = getColorClasses(config.color);
   const tabs = config.tabs ?? ['config'];
   const isReadOnly = moduleData?.enabled === false;
  
  const canSyncMainModule = hasModuleRuntimeDefinition(config.key);
  const canSyncCategoryModule = config.categoryModuleKey
    ? hasModuleRuntimeDefinition(config.categoryModuleKey)
    : false;
  const canSyncDefinition = canSyncMainModule;

  const renderProps: ModuleConfigPageRenderProps = {
    config,
    colorClasses,
    isSaving,
    setIsSaving,
  };

  const configTabProps: ModuleConfigTabRenderProps = {
    config,
    moduleData,
    isReadOnly,
    localFeatures,
    localFields,
    localCategoryFields,
    localSettings,
    colorClasses,
    onToggleFeature: handleToggleFeature,
    onToggleField: handleToggleField,
    onToggleCategoryField: handleToggleCategoryField,
    onSettingChange: handleSettingChange,
  };
  
  const handleAppearanceSave = async () => {
    if (!onAppearanceSave) return;
    setIsSaving(true);
    try {
      await onAppearanceSave();
    } finally {
      setIsSaving(false);
    }
  };
  const canSaveConfig = !isReadOnly;
  const hasConfigChanges = activeTab === 'config' ? hasChanges : (activeTab === 'appearance' ? appearanceHasChanges : false);

  const handleSyncDefinition = async () => {
    if (isReadOnly || !canSyncDefinition) {return;}
    setIsSyncing(true);
    try {
      const moduleKeys = [config.key, canSyncCategoryModule ? config.categoryModuleKey : undefined]
        .filter((key): key is string => Boolean(key));
      const results = await Promise.all(moduleKeys.map((moduleKey) => syncModuleConfig({ moduleKey })));
      const added = results.reduce((total, result) => total
        + result.addedFields.length
        + result.addedFeatures.length
        + result.addedSettings.length, 0);
      const updated = results.reduce((total, result) => total
        + result.updatedFields.length
        + result.updatedFeatures.length
        + result.updatedSettings.length, 0);
      if (added === 0 && updated === 0) {
        toast.message('Không có thay đổi để đồng bộ.');
        return;
      }
      toast.success(`Đã đồng bộ: thêm ${added}, cập nhật ${updated}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Đồng bộ thất bại');
    } finally {
      setIsSyncing(false);
    }
  };
   
   if (isLoading) {
     return (
       <div className="flex items-center justify-center h-64">
         <Loader2 size={32} className="animate-spin text-slate-400" />
       </div>
     );
   }
   
   return (
     <div className="space-y-6 max-w-5xl mx-auto">
       <ModuleHeader
         icon={config.icon}
         title={`Module ${config.name}`}
         description={config.description}
         iconBgClass={colorClasses.iconBg}
         iconTextClass={colorClasses.iconText}
         buttonClass={colorClasses.button}
        onSave={canSaveConfig ? (activeTab === 'config' ? handleSave : (activeTab === 'appearance' && onAppearanceSave ? handleAppearanceSave : undefined)) : undefined}
        hasChanges={canSaveConfig ? hasConfigChanges : false}
        isSaving={isConfigSaving || isSaving}
        secondaryAction={activeTab === 'config' && canSyncDefinition ? {
          label: 'Đồng bộ từ định nghĩa',
          onClick: handleSyncDefinition,
          disabled: isReadOnly,
          isLoading: isSyncing,
        } : undefined}
       />

      {isReadOnly && (
        <div className="border border-amber-200 bg-amber-50 text-amber-700 text-sm rounded-lg p-3">
          Module đang tắt. Hãy bật module ở trang Quản lý Module để chỉnh cấu hình.
        </div>
      )}
       
       {tabs.length > 1 && (
         <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
           {tabs.includes('config') && (
             <TabButton
               active={activeTab === 'config'}
               onClick={() => setActiveTab('config')}
               icon={Settings}
               label="Cấu hình"
               colorClass={colorClasses.tab}
             />
           )}
           {tabs.includes('appearance') && (
             <TabButton
               active={activeTab === 'appearance'}
               onClick={() => setActiveTab('appearance')}
               icon={Palette}
               label="Giao diện"
               colorClass={colorClasses.tab}
             />
           )}
         </div>
       )}
       
       {activeTab === 'config' && (
         renderConfigTab ? renderConfigTab(configTabProps) : (
           <ConfigTab
             config={config}
             moduleData={moduleData}
             isReadOnly={isReadOnly}
             localFeatures={localFeatures}
             localFields={localFields}
             localCategoryFields={localCategoryFields}
             localSettings={localSettings}
             colorClasses={colorClasses}
             onToggleFeature={handleToggleFeature}
             onToggleField={handleToggleField}
             onToggleCategoryField={handleToggleCategoryField}
             onSettingChange={handleSettingChange}
           />
         )
       )}
       
       {activeTab === 'appearance' && (
        renderAppearanceTab ? renderAppearanceTab(renderProps) : <AppearanceTab />
       )}
     </div>
   );
 }
 
 function TabButton({ active, onClick, icon: Icon, label, colorClass }: {
   active: boolean;
   onClick: () => void;
   icon: React.ComponentType<{ size?: number }>;
   label: string;
   colorClass: string;
 }) {
   return (
     <button
       type="button"
       onClick={onClick}
       className={cn(
         "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-[2px] transition-colors",
         active
           ? `${colorClass} text-slate-900 dark:text-slate-100`
           : "border-transparent text-slate-500 hover:text-slate-700"
       )}
     >
       <Icon size={16} />
       {label}
     </button>
   );
 }
 
function ConfigTab({ config, moduleData, isReadOnly, localFeatures, localFields, localCategoryFields, localSettings, colorClasses, onToggleFeature, onToggleField, onToggleCategoryField, onSettingChange }: {
   config: ModuleDefinition;
   moduleData: { isCore?: boolean; enabled?: boolean } | null | undefined;
   isReadOnly: boolean;
   localFeatures: Record<string, boolean>;
  localFields: FieldConfig[];
  localCategoryFields: FieldConfig[];
   localSettings: Record<string, string | number | boolean>;
   colorClasses: ReturnType<typeof getColorClasses>;
   onToggleFeature: (key: string) => void;
   onToggleField: (key: string) => void;
   onToggleCategoryField: (key: string) => void;
   onSettingChange: (key: string, value: string | number | boolean) => void;
 }) {
  const settings = config.settings ?? [];
  const normalizedSettings = settings.map((setting) => ({
    ...setting,
    group: setting.group ?? 'general',
  }));
  const definedGroups = config.settingGroups ?? [];
  const groupKeys = new Set(definedGroups.map((group) => group.key));
  const extraGroups = Array.from(new Set(
    normalizedSettings
      .map((setting) => setting.group)
      .filter((group) => group && !groupKeys.has(group))
  ));
  const resolvedGroups = [
    ...definedGroups,
    ...extraGroups.map((key) => ({ key, label: key === 'general' ? 'Cài đặt chung' : key })),
  ];

  const settingsByGroup = resolvedGroups.map((group) => ({
    group,
    settings: normalizedSettings.filter((setting) => setting.group === group.key),
  })).filter((item) => item.settings.length > 0);

  const isProductModule = config.key === 'products';
  const isSettingsModule = config.key === 'settings';
  const isSingleBrandMode = isSettingsModule && localSettings.site_brand_mode === 'single';
  const visibleFields = localFields.filter((field) => {
    if (isSettingsModule && REMOVED_SETTINGS_FIELDS.has(field.key)) {
      return false;
    }
    if (config.key === 'subscriptions' && (field.key === 'timezone' || field.key === 'notes')) {
      return false;
    }
    return true;
  });
  const handleFieldToggle = (key: string) => {
    if (isSingleBrandMode && key === 'site_brand_secondary') {return;}
    onToggleField(key);
  };

  return (
     <>
       <ModuleStatus 
         isCore={moduleData?.isCore ?? false} 
         enabled={moduleData?.enabled ?? true}
         toggleColor={colorClasses.toggle}
         disabled={isReadOnly}
       />
       
       <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-4", isReadOnly && "pointer-events-none opacity-60")}>
         <div className="space-y-4">
          {settingsByGroup.map(({ group, settings: groupSettings }) => (
            <div key={group.key} className="space-y-3">
              <SettingsCard title={group.label}>
                {groupSettings.map(setting => {
                  if (setting.dependsOn && !localSettings[setting.dependsOn]) {
                    return null;
                  }

                  if (setting.type === 'select') {
                    return (
                      <SettingSelect
                        key={setting.key}
                        label={setting.label}
                        value={String(localSettings[setting.key] ?? '')}
                        onChange={(v) => onSettingChange(setting.key, v)}
                        options={setting.options ?? []}
                      />
                    );
                  }

                  if (setting.type === 'toggle') {
                    return (
                      <SettingToggle
                        key={setting.key}
                        label={setting.label}
                        value={Boolean(localSettings[setting.key])}
                        onChange={() => onSettingChange(setting.key, !localSettings[setting.key])}
                      />
                    );
                  }

                  if (setting.type === 'text') {
                    return (
                      <SettingInput
                        key={setting.key}
                        type="text"
                        label={setting.label}
                        value={String(localSettings[setting.key] ?? '')}
                        onChange={(v) => onSettingChange(setting.key, v)}
                      />
                    );
                  }

                  if (setting.type === 'json') {
                    return (
                      <SettingTextarea
                        key={setting.key}
                        label={setting.label}
                        value={String(localSettings[setting.key] ?? '')}
                        onChange={(v) => onSettingChange(setting.key, v)}
                      />
                    );
                  }

                  return (
                    <SettingInput
                      key={setting.key}
                      label={setting.label}
                      value={Number(localSettings[setting.key] ?? 0)}
                      onChange={(v) => onSettingChange(setting.key, v)}
                    />
                  );
                })}
              </SettingsCard>
              {isProductModule && group.key === 'variants' && (
                <VariantSettingsSection
                  enabled={Boolean(localSettings.variantEnabled)}
                  outOfStockDisplay={String(localSettings.outOfStockDisplay ?? 'blur')}
                  imageChangeAnimation={String(localSettings.imageChangeAnimation ?? 'fade')}
                />
              )}
            </div>
          ))}
           
           {config.features && config.features.length > 0 && (
             <FeaturesCard
               features={config.features.map(f => ({
                 config: { 
                   key: f.key, 
                   label: f.label, 
                   icon: f.icon ?? Settings,
                   linkedField: f.linkedField,
                   description: f.description,
                 },
                 enabled: localFeatures[f.key] ?? false,
               }))}
               onToggle={onToggleFeature}
               toggleColor={colorClasses.toggle}
             />
           )}
         </div>
         
         <FieldsCard
           title={`Trường ${config.name}`}
           icon={config.icon}
           iconColorClass={colorClasses.iconText}
           fields={visibleFields}
           onToggle={handleFieldToggle}
           fieldColorClass={colorClasses.fieldColor}
           toggleColor={colorClasses.toggle}
         />
         
         {config.categoryModuleKey && localCategoryFields.length > 0 && (
           <FieldsCard
             title="Trường danh mục"
             icon={FolderTree}
             iconColorClass="text-slate-500"
             fields={localCategoryFields}
             onToggle={onToggleCategoryField}
             fieldColorClass={colorClasses.fieldColor}
             toggleColor={colorClasses.toggle}
           />
         )}
       </div>
       
       {config.conventionNote && (
         <ConventionNote>
           <strong>Convention:</strong> {config.conventionNote}
         </ConventionNote>
       )}
     </>
   );
 }
 
 function AppearanceTab() {
   return (
     <Card className="p-8 text-center text-slate-500">
       <Palette size={48} className="mx-auto mb-4 opacity-50" />
       <p>Cấu hình giao diện sẽ hiển thị ở đây</p>
     </Card>
   );
 }
 
 function getColorClasses(color: string) {
   const colorMap: Record<string, {
     iconBg: string;
     iconText: string;
     button: string;
     toggle: string;
     tab: string;
     fieldColor: string;
   }> = {
     cyan: {
       iconBg: 'bg-cyan-500/10',
       iconText: 'text-cyan-600 dark:text-cyan-400',
       button: 'bg-cyan-600 hover:bg-cyan-500',
       toggle: 'bg-cyan-500',
       tab: 'border-cyan-500',
       fieldColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
     },
     orange: {
       iconBg: 'bg-orange-500/10',
       iconText: 'text-orange-600 dark:text-orange-400',
       button: 'bg-orange-600 hover:bg-orange-500',
       toggle: 'bg-orange-500',
       tab: 'border-orange-500',
       fieldColor: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
     },
     violet: {
       iconBg: 'bg-violet-500/10',
       iconText: 'text-violet-600 dark:text-violet-400',
       button: 'bg-violet-600 hover:bg-violet-500',
       toggle: 'bg-violet-500',
       tab: 'border-violet-500',
       fieldColor: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
     },
     emerald: {
       iconBg: 'bg-emerald-500/10',
       iconText: 'text-emerald-600 dark:text-emerald-400',
       button: 'bg-emerald-600 hover:bg-emerald-500',
       toggle: 'bg-emerald-500',
       tab: 'border-emerald-500',
       fieldColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
     },
     rose: {
       iconBg: 'bg-rose-500/10',
       iconText: 'text-rose-600 dark:text-rose-400',
       button: 'bg-rose-600 hover:bg-rose-500',
       toggle: 'bg-rose-500',
       tab: 'border-rose-500',
       fieldColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
     },
     blue: {
       iconBg: 'bg-blue-500/10',
       iconText: 'text-blue-600 dark:text-blue-400',
       button: 'bg-blue-600 hover:bg-blue-500',
       toggle: 'bg-blue-500',
       tab: 'border-blue-500',
       fieldColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
     },
     amber: {
       iconBg: 'bg-amber-500/10',
       iconText: 'text-amber-600 dark:text-amber-400',
       button: 'bg-amber-600 hover:bg-amber-500',
       toggle: 'bg-amber-500',
       tab: 'border-amber-500',
       fieldColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
     },
     indigo: {
       iconBg: 'bg-indigo-500/10',
       iconText: 'text-indigo-600 dark:text-indigo-400',
       button: 'bg-indigo-600 hover:bg-indigo-500',
       toggle: 'bg-indigo-500',
       tab: 'border-indigo-500',
       fieldColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
     },
   };
   
   return colorMap[color] ?? colorMap.blue;
 }
