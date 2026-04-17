'use client';

import React, { useEffect } from 'react';
import { PublicImage as Image } from '@/components/shared/PublicImage';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { ProductImageFrame } from '@/lib/products/product-frame';
import { ProductImageFrameOverlay } from '@/components/shared/ProductImageFrameBox';

type ProductImageLightboxProps = {
  images: string[];
  currentIndex: number;
  open: boolean;
  onClose: () => void;
  onIndexChange: (nextIndex: number) => void;
  useNativeImage?: boolean;
  frame?: ProductImageFrame | null;
};

export function ProductImageLightbox({
  images,
  currentIndex,
  open,
  onClose,
  onIndexChange,
  useNativeImage = false,
  frame,
}: ProductImageLightboxProps) {
  const hasImages = images.length > 0;
  const safeIndex = Math.min(Math.max(currentIndex, 0), Math.max(images.length - 1, 0));
  const hasMultiple = images.length > 1;

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (!hasMultiple) {
        return;
      }
      if (event.key === 'ArrowLeft') {
        onIndexChange((safeIndex - 1 + images.length) % images.length);
      }
      if (event.key === 'ArrowRight') {
        onIndexChange((safeIndex + 1) % images.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasMultiple, images.length, onClose, onIndexChange, open, safeIndex]);

  if (!open || !hasImages) {
    return null;
  }

  const handlePrev = (event: React.MouseEvent) => {
    event.stopPropagation();
    onIndexChange((safeIndex - 1 + images.length) % images.length);
  };

  const handleNext = (event: React.MouseEvent) => {
    event.stopPropagation();
    onIndexChange((safeIndex + 1) % images.length);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-950/95" />
      <button
        type="button"
        onClick={(event) => { event.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 p-2 rounded-full border border-white/20 text-white/90 transition-colors z-[80]"
        aria-label="Đóng"
      >
        <X size={24} />
      </button>
      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border border-white/20 text-white/90 flex items-center justify-center transition-colors z-[80]"
            aria-label="Ảnh trước"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border border-white/20 text-white/90 flex items-center justify-center transition-colors z-[80]"
            aria-label="Ảnh sau"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}
      {hasMultiple && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm z-[80] px-3 py-1 rounded-full border border-white/15 bg-white/10 text-white/90">
          {safeIndex + 1} / {images.length}
        </div>
      )}
      <div className="relative z-[80] w-full max-w-5xl h-[80vh] px-4 flex items-center justify-center" onClick={event => event.stopPropagation()}>
        <div className="relative w-full h-full flex items-center justify-center">
          {useNativeImage ? (
            <img
              src={images[safeIndex]}
              alt={`Ảnh sản phẩm ${safeIndex + 1}`}
              className="max-h-[80vh] w-auto max-w-full object-contain"
            />
          ) : (
            <Image
              src={images[safeIndex]}
              alt={`Ảnh sản phẩm ${safeIndex + 1}`}
              fill
              sizes="90vw"
              className="object-contain"
              mode="primary"
            />
          )}
          <ProductImageFrameOverlay frame={frame} />
        </div>
      </div>
    </div>
  );
}
