'use client';

import React, { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Check, Loader2, Package, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '../i18n/context';
import { CascadeConfirmDialog } from './_components/CascadeConfirmDialog';
import { ConfigActions } from './_components/ConfigActions';
import { ModuleCard } from './_components/ModuleCard';
import { PresetDropdown } from './_components/PresetDropdown';
import { categoryColors } from './_constants';
import type { AdminModule } from './_types';

export default function ModuleManagementPage() {
  const { t } = useI18n();
  const modulesData = useQuery(api.admin.modules.listModules);
  const presetsData = useQuery(api.admin.presets.listPresets);
  const toggleModuleWithCascade = useMutation(api.admin.modules.toggleModuleWithCascade);
  const migrateCalendarToSubscriptions = useMutation(api.admin.modules.migrateCalendarToSubscriptions);
  const addBookingsModuleToList = useMutation(api.seed.addBookingsModuleToList);
  const applyPreset = useMutation(api.admin.presets.applyPreset);
  const seedModule = useMutation(api.seedManager.seedModule);
  
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string>('custom');
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [applyingPreset, setApplyingPreset] = useState(false);
  const [isReseeding, setIsReseeding] = useState(false);
  const [hasMigrated, setHasMigrated] = useState(false);
  const [hasEnsuredBookings, setHasEnsuredBookings] = useState(false);
  
  // SYS-004: State cho cascade confirmation dialog
  const [cascadeDialog, setCascadeDialog] = useState<{
    isOpen: boolean;
    moduleKey: string;
    moduleName: string;
    dependentModules: { key: string; name: string }[];
  }>({ dependentModules: [], isOpen: false, moduleKey: '', moduleName: '' });

  const modules = modulesData ?? [];
  const presets = presetsData ?? [];

  // Seed data if empty
  React.useEffect(() => {
    if (modulesData === undefined || presetsData === undefined) {
      return;
    }
    if (modulesData.length > 0 && presetsData.length > 0) {
      return;
    }
    void (async () => {
      try {
        if (modulesData.length === 0) {
          await seedModule({ module: 'adminModules', quantity: 0 });
        }
        if (presetsData.length === 0) {
          await seedModule({ module: 'systemPresets', quantity: 0 });
        }
      } catch (error) {
        console.error(error);
      }
    })();
  }, [modulesData, presetsData, seedModule]);

  React.useEffect(() => {
    if (hasMigrated) {
      return;
    }
    setHasMigrated(true);
    void (async () => {
      try {
        const result = await migrateCalendarToSubscriptions({});
        if (result.changed) {
          toast.success('Đã đồng bộ module Calendar → Subscriptions');
        }
      } catch (error) {
        console.error(error);
      }
    })();
  }, [hasMigrated, migrateCalendarToSubscriptions]);

  React.useEffect(() => {
    if (hasEnsuredBookings) {
      return;
    }
    setHasEnsuredBookings(true);
    void (async () => {
      try {
        await addBookingsModuleToList({});
      } catch (error) {
        console.error(error);
      }
    })();
  }, [addBookingsModuleToList, hasEnsuredBookings]);

  const handlePresetSelect = async (presetKey: string) => {
    setSelectedPreset(presetKey);
    if (presetKey === 'custom') {return;}
    
    setApplyingPreset(true);
    try {
      await applyPreset({ key: presetKey });
    } finally {
      setApplyingPreset(false);
    }
  };

  const handleReseedModules = async () => {
    setSelectedPreset('custom');
    setIsReseeding(true);
    try {
      const modulesResult = await seedModule({ force: true, module: 'adminModules', quantity: 0 });
      if (modulesResult.errors?.length) {
        throw new Error(modulesResult.errors.join(', '));
      }

      const presetsResult = await seedModule({ force: true, module: 'systemPresets', quantity: 0 });
      if (presetsResult.errors?.length) {
        throw new Error(presetsResult.errors.join(', '));
      }

      toast.success(t.modules.messages.reseedSuccess);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.common.error);
    } finally {
      setIsReseeding(false);
    }
  };
  
  // SYS-004: Tìm các modules phụ thuộc vào module này (enabled, bao gồm cascade)
  const getCascadeKeys = (moduleKey: string) => {
    const dependentsMap = new Map<string, string[]>();
    for (const moduleItem of modules) {
      if (!moduleItem.dependencies?.length) {continue;}
      for (const depKey of moduleItem.dependencies) {
        const list = dependentsMap.get(depKey) ?? [];
        list.push(moduleItem.key);
        dependentsMap.set(depKey, list);
      }
    }

    const cascade: string[] = [];
    const queue = [...(dependentsMap.get(moduleKey) ?? [])];
    const visited = new Set<string>();
    while (queue.length > 0) {
      const currentKey = queue.shift();
      if (!currentKey || visited.has(currentKey)) {continue;}
      visited.add(currentKey);
      const current = modules.find(m => m.key === currentKey);
      if (current?.enabled && (!current.isCore || current.key === 'roles')) {
        cascade.push(currentKey);
      }
      const next = dependentsMap.get(currentKey);
      if (next?.length) {
        queue.push(...next);
      }
    }
    return cascade;
  };

  const getToggleErrorMessage = (code: string | null | undefined) => {
    switch (code) {
      case 'CORE_LOCKED':
        return t.modules.messages.coreLocked;
      case 'DEPENDENCY_MISSING':
        return t.modules.messages.dependencyMissing;
      case 'INVALID_CASCADE':
        return t.modules.messages.invalidCascade;
      case 'MODULE_NOT_FOUND':
        return t.modules.messages.moduleNotFound;
      default:
        return t.common.error;
    }
  };

  const handleToggleModule = async (key: string, enabled: boolean) => {
    setSelectedPreset('custom');
    const targetModule = modules.find(m => m.key === key);
    
    // Khi tắt module, kiểm tra xem có modules con không
    if (!enabled) {
      const cascadeKeys = getCascadeKeys(key);
      if (cascadeKeys.length > 0) {
        setCascadeDialog({
          dependentModules: cascadeKeys.map(depKey => ({
            key: depKey,
            name: modules.find(m => m.key === depKey)?.name ?? depKey,
          })),
          isOpen: true,
          moduleKey: key,
          moduleName: targetModule?.name ?? key,
        });
        return;
      }
    }
    
    setTogglingKey(key);
    try {
      const result = await toggleModuleWithCascade({
        cascadeKeys: [],
        enabled,
        key,
      });
      if (!result.success) {
        toast.error(getToggleErrorMessage(result.code));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.common.error);
    } finally {
      setTogglingKey(null);
    }
  };

  // SYS-004: Handle cascade confirm
  const handleCascadeConfirm = async () => {
    const { moduleKey, dependentModules } = cascadeDialog;
    setTogglingKey(moduleKey);
    try {
      const result = await toggleModuleWithCascade({
        cascadeKeys: dependentModules.map(d => d.key),
        enabled: false,
        key: moduleKey,
      });
      if (!result.success) {
        toast.error(getToggleErrorMessage(result.code));
        return;
      }

      if (result.disabledModules.length > 0) {
        toast.success(
          t.modules.messages.cascadeDisabled
            .replace('{module}', moduleKey)
            .replace('{count}', String(result.disabledModules.length))
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.common.error);
    } finally {
      setTogglingKey(null);
      setCascadeDialog({ dependentModules: [], isOpen: false, moduleKey: '', moduleName: '' });
    }
  };

  const handleCascadeCancel = () => {
    setCascadeDialog({ dependentModules: [], isOpen: false, moduleKey: '', moduleName: '' });
  };
  
  const canToggleModule = (module: AdminModule): boolean => {
    if (module.isCore && module.key !== 'roles') {return false;}
    return true;
  };
  
  const filteredModules = modules.filter(m => {
    const matchCategory = filterCategory === 'all' || m.category === filterCategory;
    const matchSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       m.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });
  
  const groupedModules = filteredModules.reduce< Record<string, AdminModule[]>>((acc, module) => {
    if (!acc[module.category]) {acc[module.category] = [];}
    acc[module.category].push(module);
    return acc;
  }, {});
  
  const enabledCount = modules.filter(m => m.enabled).length;
  const disabledCount = modules.filter(m => !m.enabled).length;
  const currentPreset = presets.find(p => p.key === selectedPreset);

  if (modulesData === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-cyan-500" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t.modules.title}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t.modules.subtitle}
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Check size={12} /> {enabledCount} {t.modules.enabled}
            </span>
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
              <X size={12} /> {disabledCount} {t.modules.disabled}
            </span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <PresetDropdown 
            presets={presets} 
            selectedPreset={selectedPreset} 
            onSelect={handlePresetSelect}
            loading={applyingPreset}
            labels={t.modules}
          />
          <span className="text-xs text-slate-500">
            {t.modules.presetHint}
          </span>
          <ConfigActions
            modules={modules}
            preset={currentPreset}
            onReseed={handleReseedModules}
            isReseeding={isReseeding}
            labels={t.modules}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) =>{  setSearchQuery(e.target.value); }}
            placeholder={t.modules.searchModule}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-cyan-500/50 outline-none"
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {['all', ...Object.keys(categoryColors)].map((cat) => (
            <button 
              key={cat}
              onClick={() =>{  setFilterCategory(cat); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                filterCategory === cat 
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-600 dark:text-cyan-400' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {cat === 'all' ? t.modules.all : t.modules.categories[cat as keyof typeof t.modules.categories]}
            </button>
          ))}
        </div>
      </div>
      
      <div className="space-y-6">
        {Object.entries(groupedModules).map(([category, mods]) => (
          <div key={category}>
            <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${categoryColors[category]}`}>
              {t.modules.categories[category as keyof typeof t.modules.categories]}
              <span className="text-xs font-normal text-slate-500">({(mods).length})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {(mods).map(module => (
                <ModuleCard 
                  key={module._id} 
                  module={module} 
                  onToggle={handleToggleModule}
                  canToggle={canToggleModule(module)}
                  allModules={modules}
                  isToggling={togglingKey === module.key}
                  isAnyToggling={Boolean(togglingKey)} // SYS-008: Pass to disable all
                  labels={t.modules}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {filteredModules.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Package size={48} className="mx-auto mb-3 opacity-50" />
          <p>{t.modules.noModuleFound}</p>
        </div>
      )}

      {/* SYS-004: Cascade Confirmation Dialog */}
      <CascadeConfirmDialog
        isOpen={cascadeDialog.isOpen}
        moduleKey={cascadeDialog.moduleKey}
        moduleName={cascadeDialog.moduleName}
        dependentModules={cascadeDialog.dependentModules}
        onConfirm={handleCascadeConfirm}
        onCancel={handleCascadeCancel}
        isLoading={Boolean(togglingKey)}
        labels={t.modules}
      />

    </div>
  );
}
