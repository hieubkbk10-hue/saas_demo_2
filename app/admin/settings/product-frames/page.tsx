'use client';

import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { ModuleGuard } from '../../components/ModuleGuard';
import { ProductFrameManager } from '../_components/ProductFrameManager';

export default function SettingsProductFramesPage() {
  return (
    <ModuleGuard moduleKey="settings">
      <ProductFramesContent />
    </ModuleGuard>
  );
}

function ProductFramesContent() {
  const router = useRouter();
  const productFramesSetting = useQuery(api.admin.modules.getModuleSetting, {
    moduleKey: 'products',
    settingKey: 'enableProductFrames',
  });

  const isEnabled = productFramesSetting?.value === true;

  useEffect(() => {
    if (productFramesSetting === undefined) {return;}
    if (!isEnabled) {
      router.replace('/admin/settings/general');
    }
  }, [productFramesSetting, isEnabled, router]);

  if (productFramesSetting === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!isEnabled) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-28">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Cài đặt hệ thống</h1>
        <p className="text-slate-500">Quản lý các cấu hình chung cho website của bạn.</p>
      </div>
      <ProductFrameManager />
    </div>
  );
}
