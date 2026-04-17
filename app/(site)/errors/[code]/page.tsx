'use client';

import React, { useMemo } from 'react';
import { ErrorPageView } from '@/components/site/error/ErrorPageView';
import { useBrandColors } from '@/components/site/hooks';
import { ERROR_STATUS_CODES, useErrorPagesConfig } from '@/lib/experiences';

const isValidStatusCode = (value: number) =>
  ERROR_STATUS_CODES.includes(value as (typeof ERROR_STATUS_CODES)[number]);

export default function ErrorCodePage({ params }: { params: { code: string } }) {
  const config = useErrorPagesConfig();
  const brandColors = useBrandColors();

  const resolvedCode = useMemo(() => {
    const parsed = Number(params.code);
    if (!Number.isFinite(parsed)) {
      return 404;
    }
    return isValidStatusCode(parsed) ? parsed : 404;
  }, [params.code]);

  return (
    <ErrorPageView
      code={resolvedCode}
      layoutStyle={config.layoutStyle}
      brandColor={brandColors.primary}
      secondaryColor={brandColors.secondary}
      colorMode={brandColors.mode}
      showGoHome={config.showGoHome}
      showGoBack={config.showGoBack}
      showShortApology={config.showShortApology}
      customHeadline={config.customHeadline}
      customMessage={config.customMessage}
    />
  );
}
