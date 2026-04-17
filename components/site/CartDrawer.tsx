'use client';

import React, { useMemo } from 'react';
import { PublicImage as Image } from '@/components/shared/PublicImage';
import Link from 'next/link';
import { Clock, Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { useCart, useCartExpiry } from '@/lib/cart';
import { useCartConfig } from '@/lib/experiences';
import { useBrandColors } from './hooks';
import { getCartColors } from './cart/colors';
import { useCustomerAuth } from '@/app/(site)/auth/context';

const formatVND = (value: number) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
}).format(value);

export function CartDrawer() {
  const brandColors = useBrandColors();
  const tokens = useMemo(
    () => getCartColors(brandColors.primary, brandColors.secondary, brandColors.mode),
    [brandColors.primary, brandColors.secondary, brandColors.mode]
  );
  const { cart, items, itemsCount, totalAmount, isDrawerOpen, closeDrawer, updateQuantity, removeItem, updateNote } = useCart();
  const { layoutStyle, showExpiry, showNote } = useCartConfig();
  const { isAuthenticated, openLoginModal } = useCustomerAuth();

  const handleUpdateQuantity = async (itemId: (typeof items)[number]['_id'], quantity: number) => {
    await updateQuantity(itemId, quantity);
  };

  const expiresAt = cart?.expiresAt ?? null;
  const { expiryText, isExpired } = useCartExpiry(expiresAt);
  const shouldShowExpiry = showExpiry && (expiryText || isExpired);

  if (layoutStyle !== 'drawer' || !isDrawerOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex">
      <button
        type="button"
        className="absolute inset-0"
        style={{ backgroundColor: tokens.drawerOverlayBg }}
        onClick={closeDrawer}
        aria-label="Đóng giỏ hàng"
      />
      <div
        className="ml-auto w-full max-w-sm h-full flex flex-col relative"
        style={{ backgroundColor: tokens.drawerSurface }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: tokens.drawerBorder }}>
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} style={{ color: tokens.primary }} />
            <h3 className="font-semibold" style={{ color: tokens.drawerTitle }}>Giỏ hàng ({itemsCount})</h3>
          </div>
          <button
            type="button"
            className="p-1 rounded hover:bg-[var(--drawer-hover-bg)]"
            style={{ ['--drawer-hover-bg' as never]: tokens.surfaceSoft }}
            onClick={closeDrawer}
          >
            <X size={18} style={{ color: tokens.drawerCloseIcon }} />
          </button>
        </div>

        {!isAuthenticated && (
          <div className="p-4">
            <div
              className="rounded-lg p-3 text-sm text-center border"
              style={{ backgroundColor: tokens.surfaceMuted, borderColor: tokens.border, color: tokens.metaText }}
            >
              Vui lòng đăng nhập để sử dụng giỏ hàng.
            </div>
            <button
              type="button"
              onClick={openLoginModal}
              className="mt-3 w-full py-2.5 rounded-lg font-semibold text-sm"
              style={{ backgroundColor: tokens.primaryButtonBg, color: tokens.primaryButtonText }}
            >
              Đăng nhập
            </button>
          </div>
        )}

        {isAuthenticated && (
          <>
            {shouldShowExpiry && (
              <div className="px-4 pt-3">
                <div
                  className="flex items-center justify-center gap-1.5 text-xs"
                  style={{ color: isExpired ? tokens.expiryExpiredText : tokens.expiryActiveText }}
                >
                  <Clock size={12} />
                  <span>{isExpired ? 'Giỏ hàng đã hết hạn' : `Giỏ hàng sẽ hết hạn sau ${expiryText}`}</span>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-auto px-4 py-3 space-y-3">
              {items.length === 0 && (
                <div className="text-sm text-center py-8" style={{ color: tokens.metaText }}>Giỏ hàng đang trống.</div>
              )}
              {items.map(item => (
                <div key={item._id} className="flex gap-3 py-3 border-b last:border-0" style={{ borderColor: tokens.itemDivider }}>
                  <div className="w-16 h-16 rounded-lg flex-shrink-0 overflow-hidden" style={{ backgroundColor: tokens.thumbBg }}>
                    {item.productImage ? (
                      <Image src={item.productImage} alt={item.productName} width={64} height={64} className="w-full h-full object-cover" mode="thumb" />
                    ) : (
                      <div className="w-full h-full" style={{ backgroundColor: tokens.surfaceSoft }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-2" style={{ color: tokens.bodyText }}>{item.productName}</h4>
                    <p className="text-sm font-semibold mt-0.5" style={{ color: tokens.priceText }}>{formatVND(item.price)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        className="w-6 h-6 rounded border flex items-center justify-center hover:bg-[var(--qty-hover-bg)]"
                        style={{
                          borderColor: tokens.quantityButtonBorder,
                          backgroundColor: tokens.quantityButtonBg,
                          ['--qty-hover-bg' as never]: tokens.quantityButtonHoverBg,
                        }}
                        onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                      >
                        <Minus size={12} style={{ color: tokens.quantityButtonIcon }} />
                      </button>
                      <span className="text-sm font-medium w-6 text-center" style={{ color: tokens.bodyText }}>{item.quantity}</span>
                      <button
                        type="button"
                        className="w-6 h-6 rounded border flex items-center justify-center hover:bg-[var(--qty-hover-bg)]"
                        style={{
                          borderColor: tokens.quantityButtonBorder,
                          backgroundColor: tokens.quantityButtonBg,
                          ['--qty-hover-bg' as never]: tokens.quantityButtonHoverBg,
                        }}
                        onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                      >
                        <Plus size={12} style={{ color: tokens.quantityButtonIcon }} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button
                      type="button"
                      className="group p-1 rounded hover:bg-[var(--action-hover-bg)]"
                      style={{ ['--action-hover-bg' as never]: tokens.actionHoverBg }}
                      onClick={() => removeItem(item._id)}
                    >
                      <Trash2
                        size={14}
                        className="text-[var(--action-icon)] group-hover:text-[var(--action-icon-hover)]"
                        style={{
                          ['--action-icon' as never]: tokens.actionIcon,
                          ['--action-icon-hover' as never]: tokens.actionHoverIcon,
                        }}
                      />
                    </button>
                    <span className="text-sm font-semibold" style={{ color: tokens.bodyText }}>{formatVND(item.subtotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            {showNote && (
              <div className="px-4 pb-2">
                <textarea
                  className="w-full px-3 py-2 border rounded-lg text-sm resize-none placeholder:text-[var(--input-placeholder)]"
                  rows={2}
                  placeholder="Ghi chú đơn hàng..."
                  value={cart?.note ?? ''}
                  onChange={(event) => updateNote(event.target.value)}
                  style={{
                    backgroundColor: tokens.inputBg,
                    borderColor: tokens.inputBorder,
                    color: tokens.inputText,
                    ['--input-placeholder' as never]: tokens.inputPlaceholder,
                  }}
                />
              </div>
            )}

            <div className="mt-auto px-4 py-4 border-t" style={{ borderColor: tokens.drawerBorder }}>
              <div className="flex justify-between mb-3">
                <span className="text-sm" style={{ color: tokens.summaryLabel }}>Tổng cộng</span>
                <span className="font-bold" style={{ color: tokens.summaryTotalValue }}>{formatVND(totalAmount)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/cart"
                  onClick={closeDrawer}
                  className="py-2 rounded-lg text-center text-sm font-medium border"
                  style={{
                    borderColor: tokens.secondaryButtonBorder,
                    backgroundColor: tokens.secondaryButtonBg,
                    color: tokens.secondaryButtonText,
                  }}
                >
                  Xem giỏ hàng
                </Link>
                <Link
                  href="/checkout?fromCart=true"
                  onClick={closeDrawer}
                  className={`py-2 rounded-lg text-sm font-semibold text-center ${items.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}
                  style={{ backgroundColor: tokens.primaryButtonBg, color: tokens.primaryButtonText }}
                >
                  Thanh toán
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
