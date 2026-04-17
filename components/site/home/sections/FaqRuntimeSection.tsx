'use client';

import React from 'react';
import { FaqSectionShared } from '@/app/admin/home-components/faq/_components/FaqSectionShared';
import { getFaqColors } from '@/app/admin/home-components/faq/_lib/colors';
import type { FaqConfig, FaqItem, FaqStyle } from '@/app/admin/home-components/faq/_types';
import type { HomeComponentSectionProps } from '../types';

export function FaqRuntimeSection({ config, brandColor, secondary, mode, title }: HomeComponentSectionProps) {
  const faqConfig = config as FaqConfig & { items?: Array<{ question?: string; answer?: string }>; style?: FaqStyle };
  const items: FaqItem[] = (faqConfig.items ?? []).map((item, idx) => ({
    answer: item.answer ?? '',
    id: idx,
    question: item.question ?? '',
  }));
  const style: FaqStyle = faqConfig.style ?? 'accordion';
  const tokens = getFaqColors({ primary: brandColor, secondary, mode, style });
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <FaqSectionShared
        items={items}
        title={title}
        style={style}
        config={{
          buttonLink: faqConfig.buttonLink,
          buttonText: faqConfig.buttonText,
          description: faqConfig.description,
        }}
        tokens={tokens}
        context="site"
      />
    </>
  );
}
