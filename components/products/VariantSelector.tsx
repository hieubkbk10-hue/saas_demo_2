'use client';

import React from 'react';
import Image from 'next/image';
import type { Id } from '@/convex/_generated/dataModel';

type OptionDisplayType =
  | 'dropdown'
  | 'buttons'
  | 'radio'
  | 'color_swatch'
  | 'image_swatch'
  | 'color_picker'
  | 'number_input'
  | 'text_input';

type OptionInputType = 'text' | 'number' | 'color';

export type VariantSelectorValue = {
  id: Id<'productOptionValues'>;
  label: string;
  value: string;
  colorCode?: string;
  image?: string;
};

export type VariantSelectorOption = {
  id: Id<'productOptions'>;
  name: string;
  displayType: OptionDisplayType;
  inputType?: OptionInputType;
  values: VariantSelectorValue[];
};

type VariantSelectorProps = {
  options: VariantSelectorOption[];
  selectedOptions: Record<string, Id<'productOptionValues'>>;
  onSelect: (optionId: Id<'productOptions'>, valueId: Id<'productOptionValues'>) => void;
  isOptionValueAvailable: (optionId: Id<'productOptions'>, valueId: Id<'productOptionValues'>) => boolean;
  accentColor?: string;
};

const isColorOption = (option: VariantSelectorOption) =>
  option.displayType === 'color_swatch' || option.inputType === 'color' || option.displayType === 'color_picker';

export function VariantSelector({ options, selectedOptions, onSelect, isOptionValueAvailable, accentColor }: VariantSelectorProps) {
  if (options.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {options.map((option) => (
        <div key={option.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900">{option.name}</span>
            {selectedOptions[option.id] && (
              <span className="text-xs text-slate-500">Đã chọn</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const isSelected = selectedOptions[option.id] === value.id;
              const isAvailable = isOptionValueAvailable(option.id, value.id);
              const buttonClasses = isSelected
                ? 'border-transparent text-white'
                : 'border-slate-200 text-slate-700 hover:border-slate-300';

              return (
                <button
                  key={value.id}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => onSelect(option.id, value.id)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${buttonClasses} ${!isAvailable ? 'opacity-40 cursor-not-allowed' : ''}`}
                  style={isSelected ? { backgroundColor: accentColor ?? '#0f172a' } : undefined}
                  aria-pressed={isSelected}
                >
                  {option.displayType === 'image_swatch' && value.image ? (
                    <span className="relative h-6 w-6 overflow-hidden rounded-full border border-white/60">
                      <Image src={value.image} alt={value.label} fill className="object-cover" />
                    </span>
                  ) : isColorOption(option) ? (
                    <span
                      className="h-4 w-4 rounded-full border border-slate-200"
                      style={{ backgroundColor: value.colorCode ?? value.value }}
                    />
                  ) : null}
                  <span>{value.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
