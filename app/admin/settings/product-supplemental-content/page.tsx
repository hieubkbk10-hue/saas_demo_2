'use client';

import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { ModuleGuard } from '../../components/ModuleGuard';
import { ProductSupplementalContentManager } from '../_components/ProductSupplementalContentManager';

export default function SettingsProductSupplementalContentPage() {
  return (
    <ModuleGuard moduleKey="settings">
      <ProductSupplementalContentContent />
    </ModuleGuard>
  );
}

function ProductSupplementalContentContent() {
  const router = useRouter();
  const featureSetting = useQuery(api.admin.modules.getModuleSetting, {
    moduleKey: 'products',
    settingKey: 'enableProductSupplementalContent',
  });

  const isEnabled = featureSetting?.value === true;

  useEffect(() => {
    if (featureSetting === undefined) {
      return;
    }
    if (!isEnabled) {
      router.replace('/admin/settings/general');
    }
  }, [featureSetting, isEnabled, router]);

  if (featureSetting === undefined) {
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
    <div className="max-w-[1600px] mx-auto space-y-8 pb-28">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Cài đặt hệ thống</h1>
        <p className="text-slate-500">Quản lý nội dung bổ sung cho chi tiết sản phẩm.</p>
      </div>
      <ProductSupplementalContentManager />
    </div>
  );
}
