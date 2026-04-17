export type ProductImageAspectRatio =
  | 'square'
  | 'portrait45'
  | 'portrait34'
  | 'portrait23'
  | 'landscape32'
  | 'landscape43'
  | 'wide169';

export const DEFAULT_PRODUCT_IMAGE_ASPECT_RATIO: ProductImageAspectRatio = 'square';

export const PRODUCT_IMAGE_ASPECT_RATIO_OPTIONS: Array<{ label: string; value: ProductImageAspectRatio }> = [
  { label: 'Vuông (1:1)', value: 'square' },
  { label: 'Dọc 4:5', value: 'portrait45' },
  { label: 'Dọc 3:4', value: 'portrait34' },
  { label: 'Dọc 2:3', value: 'portrait23' },
  { label: 'Ngang 3:2', value: 'landscape32' },
  { label: 'Ngang 4:3', value: 'landscape43' },
  { label: 'Rộng 16:9', value: 'wide169' },
];

export const PRODUCT_IMAGE_ASPECT_RATIO_LABELS: Record<ProductImageAspectRatio, string> = {
  square: 'Vuông (1:1)',
  portrait45: 'Dọc 4:5',
  portrait34: 'Dọc 3:4',
  portrait23: 'Dọc 2:3',
  landscape32: 'Ngang 3:2',
  landscape43: 'Ngang 4:3',
  wide169: 'Rộng 16:9',
};

export const PRODUCT_IMAGE_ASPECT_RATIO_CSS: Record<ProductImageAspectRatio, string> = {
  square: '1 / 1',
  portrait45: '4 / 5',
  portrait34: '3 / 4',
  portrait23: '2 / 3',
  landscape32: '3 / 2',
  landscape43: '4 / 3',
  wide169: '16 / 9',
};

export const PRODUCT_IMAGE_ASPECT_RATIO_VALUES: Record<ProductImageAspectRatio, number> = {
  square: 1,
  portrait45: 4 / 5,
  portrait34: 3 / 4,
  portrait23: 2 / 3,
  landscape32: 3 / 2,
  landscape43: 4 / 3,
  wide169: 16 / 9,
};

export function getProductImageAspectRatioCssValue(aspectRatio: ProductImageAspectRatio): string {
  return PRODUCT_IMAGE_ASPECT_RATIO_CSS[aspectRatio];
}

export function getProductImageAspectRatioValue(aspectRatio: ProductImageAspectRatio): number {
  return PRODUCT_IMAGE_ASPECT_RATIO_VALUES[aspectRatio];
}

export function getProductImageAspectRatioLabel(aspectRatio: ProductImageAspectRatio): string {
  return PRODUCT_IMAGE_ASPECT_RATIO_LABELS[aspectRatio];
}

export function isProductImageAspectRatio(value: unknown): value is ProductImageAspectRatio {
  return typeof value === 'string' && value in PRODUCT_IMAGE_ASPECT_RATIO_CSS;
}

export function resolveProductImageAspectRatio(value: unknown): ProductImageAspectRatio {
  return isProductImageAspectRatio(value) ? value : DEFAULT_PRODUCT_IMAGE_ASPECT_RATIO;
}

export function isAspectRatioMatch(
  size: { width: number; height: number },
  aspectRatio: ProductImageAspectRatio,
  tolerance: number = 0.02
): boolean {
  if (!Number.isFinite(size.width) || !Number.isFinite(size.height) || size.width <= 0 || size.height <= 0) {
    return false;
  }
  const ratio = size.width / size.height;
  return Math.abs(ratio - getProductImageAspectRatioValue(aspectRatio)) <= tolerance;
}
