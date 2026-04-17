'use client';

import React from 'react';
import type { FieldConfig } from '@/types/module-config';
import { FieldRow } from './FieldRow';

interface FieldsCardProps {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconColorClass: string;
  fields: FieldConfig[];
  onToggle: (fieldKey: string) => void;
  fieldColorClass?: string;
  toggleColor?: string;
}

export const FieldsCard: React.FC<FieldsCardProps> = ({
  title,
  icon: Icon,
  iconColorClass,
  fields,
  onToggle,
  fieldColorClass = 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  toggleColor = 'bg-cyan-500',
}) => {
  const requiredFields = fields.filter(f => f.required);
  const optionalFields = fields.filter(f => !f.required);
  
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
        <Icon size={14} className={iconColorClass} /> {title}
      </h3>
      
      <div className="space-y-3">
        {requiredFields.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Bắt buộc</span>
            {requiredFields.map(field => (
              <FieldRow 
                key={field.id} 
                field={field} 
                onToggle={onToggle} 
                colorClass={fieldColorClass}
                toggleColor={toggleColor}
              />
            ))}
          </div>
        )}
        
        {optionalFields.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Tùy chọn</span>
            {optionalFields.map(field => (
              <FieldRow 
                key={field.id} 
                field={field} 
                onToggle={onToggle}
                colorClass={fieldColorClass}
                toggleColor={toggleColor}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
