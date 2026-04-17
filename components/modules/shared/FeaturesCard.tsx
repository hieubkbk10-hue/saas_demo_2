'use client';

import React from 'react';
import { Layers } from 'lucide-react';
import { ToggleSwitch } from './toggle-switch';
import type { FeatureConfig } from '@/types/module-config';

interface FeaturesCardProps {
  features: {
    config: FeatureConfig;
    enabled: boolean;
  }[];
  onToggle: (key: string) => void;
  toggleColor?: string;
}

export const FeaturesCard: React.FC<FeaturesCardProps> = ({ 
  features, 
  onToggle,
  toggleColor = 'bg-cyan-500'
}) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
      <Layers size={14} className="text-slate-500" /> Tính năng
    </h3>
    
    <div className="space-y-2">
      {features.map(({ config, enabled }) => {
        const Icon = config.icon;
        return (
          <div key={config.key} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950">
            <div className="flex items-center gap-2">
              <Icon size={14} className="text-slate-400" />
              <div>
                <span className="text-sm text-slate-700 dark:text-slate-200 block">{config.label}</span>
                {config.description && (
                  <span className="text-[10px] text-slate-400">{config.description}</span>
                )}
              </div>
            </div>
            <ToggleSwitch 
              enabled={enabled} 
              onChange={() =>{  onToggle(config.key); }}
              color={toggleColor}
            />
          </div>
        );
      })}
    </div>
  </div>
);
