'use client';

import React from 'react';
import Link from 'next/link';
import { LayoutTemplate } from 'lucide-react';
import { Card, CardContent } from '@/app/admin/components/ui';
import { useI18n } from '../i18n/context';
import { systemExperiences } from './_constants';

export default function ExperiencesPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <LayoutTemplate className="text-cyan-600 dark:text-cyan-400" size={20} />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t.pages.experiences}</h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Cấu hình theo trải nghiệm người dùng, dễ quan sát và mở rộng.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {systemExperiences.map((exp) => {
          const Icon = exp.icon;
          return (
            <Link key={exp.href} href={exp.href} className="group">
              <Card className="border border-slate-200 dark:border-slate-800 hover:border-cyan-500/60 dark:hover:border-cyan-500/60 transition-colors">
                <CardContent className="p-4 flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                    <Icon size={18} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                      {exp.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{exp.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
