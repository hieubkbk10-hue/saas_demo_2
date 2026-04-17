'use client';

import React from 'react';
import type { ProductListPreviewItem, ProductListStyle } from '../../product-list/_types';
import { ProductListPreview } from '../../product-list/_components/ProductListPreview';
import type { ProductGridStyle } from '../_types';

export const ProductGridPreview = ({
  brandColor,
  secondary,
  itemCount,
  selectedStyle,
  onStyleChange,
  items,
  subTitle,
  sectionTitle,
  fontStyle,
  fontClassName,
}: {
  brandColor: string;
  secondary: string;
  itemCount: number;
  selectedStyle?: ProductGridStyle;
  onStyleChange?: (style: ProductGridStyle) => void;
  items?: ProductListPreviewItem[];
  subTitle?: string;
  sectionTitle?: string;
  fontStyle?: React.CSSProperties;
  fontClassName?: string;
}) => {
  return (
    <ProductListPreview
      brandColor={brandColor}
      secondary={secondary}
      itemCount={itemCount}
      componentType="ProductGrid"
      selectedStyle={selectedStyle as ProductListStyle | undefined}
      onStyleChange={onStyleChange as ((style: ProductListStyle) => void) | undefined}
      items={items}
      subTitle={subTitle}
      sectionTitle={sectionTitle}
      fontStyle={fontStyle}
      fontClassName={fontClassName}
    />
  );
};
