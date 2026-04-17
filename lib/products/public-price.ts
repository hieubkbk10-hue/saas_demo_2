export type ProductSaleMode = 'cart' | 'contact' | 'affiliate';

const formatVnd = (price: number) =>
  new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(price);

export function getPublicPriceLabel({
  saleMode,
  price,
  salePrice,
  isRangeFromVariant,
}: {
  saleMode: ProductSaleMode;
  price?: number;
  salePrice?: number;
  isRangeFromVariant?: boolean;
}) {
  const effectivePrice = price ?? 0;
  const isContactPrice = saleMode !== 'cart' && (!effectivePrice || effectivePrice <= 0);
  return {
    label: isContactPrice
      ? 'Giá liên hệ'
      : `${isRangeFromVariant ? 'Giá từ ' : ''}${formatVnd(effectivePrice)}`,
    comparePrice: !isContactPrice && !isRangeFromVariant && salePrice && price && salePrice > price
      ? salePrice
      : undefined,
    effectivePrice,
    isContactPrice,
    isRangeFromVariant: Boolean(isRangeFromVariant),
  };
}
