'use client';

import { useState } from 'react';

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

export const deviceWidths: Record<PreviewDevice, string> = {
  desktop: 'w-full max-w-7xl',
  mobile: 'w-[375px] max-w-full',
  tablet: 'w-[768px] max-w-full',
};

export const usePreviewDevice = () => {
  const [device, setDevice] = useState<PreviewDevice>('desktop');

  return { device, setDevice };
};
