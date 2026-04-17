'use client';

import React from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { cn } from '../../../components/ui';
import type { FaqStyleTokens } from '../_lib/colors';
import type { FaqConfig, FaqItem, FaqStyle } from '../_types';

interface FaqSectionSharedProps {
  items: FaqItem[];
  title?: string;
  style: FaqStyle;
  config?: FaqConfig;
  tokens: FaqStyleTokens;
  context: 'preview' | 'site';
  maxVisible?: number;
}

const FAQ_FALLBACKS = {
  answer: 'Câu trả lời...',
  description: 'Tìm câu trả lời cho các thắc mắc phổ biến của bạn',
  question: 'Câu hỏi',
  title: 'Câu hỏi thường gặp',
};

const getValue = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};

export function FaqSectionShared({
  items,
  title,
  style,
  config,
  tokens,
  context,
  maxVisible,
}: FaqSectionSharedProps) {
  const HeadingTag = context === 'site' ? 'h2' : 'h3';
  const sectionTitle = getValue(title) ?? FAQ_FALLBACKS.title;
  const sectionDescription = getValue(config?.description);

  const displayedItems = React.useMemo(
    () => (typeof maxVisible === 'number' ? items.slice(0, maxVisible) : items),
    [items, maxVisible],
  );
  const remainingCount = Math.max(0, items.length - displayedItems.length);

  const [openIndex, setOpenIndex] = React.useState<number | null>(displayedItems.length > 0 ? 0 : null);
  const [activeTab, setActiveTab] = React.useState(0);
  const accordionPrefix = React.useId().replaceAll(':', '');
  const tabPrefix = React.useId().replaceAll(':', '');

  React.useEffect(() => {
    if (displayedItems.length === 0) {
      setOpenIndex(null);
      setActiveTab(0);
      return;
    }

    setOpenIndex((current) => {
      if (current === null) {return 0;}
      if (current >= displayedItems.length) {return displayedItems.length - 1;}
      return current;
    });

    setActiveTab((current) => {
      if (current >= displayedItems.length) {return 0;}
      return current;
    });
  }, [displayedItems]);

  if (items.length === 0) {
    return (
      <section className="py-12 px-4" style={{ backgroundColor: tokens.sectionBg }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: tokens.iconBg }}>
            <HelpCircle size={32} style={{ color: tokens.iconText }} />
          </div>
          <HeadingTag className="text-2xl font-bold mb-2" style={{ color: tokens.heading }}>
            {sectionTitle}
          </HeadingTag>
          <p style={{ color: tokens.body }}>Chưa có câu hỏi nào</p>
        </div>
      </section>
    );
  }

  const renderRemainingBadge = () => {
    if (remainingCount <= 0) {return null;}

    return (
      <div className="flex items-center justify-center pt-3 md:pt-4">
        <span
          className="inline-flex min-h-[32px] items-center rounded-full border px-3.5 py-1.5 text-xs font-semibold"
          style={{
            backgroundColor: tokens.badgeBg,
            borderColor: tokens.badgeBorder,
            color: tokens.badgeText,
          }}
        >
          +{remainingCount} câu hỏi khác
        </span>
      </div>
    );
  };

  const renderSectionIntro = (options?: {
    align?: 'left' | 'center';
    maxWidthClass?: string;
    spacingClass?: string;
    eyebrow?: string;
    showDescription?: boolean;
  }) => {
    const align = options?.align ?? 'center';
    const maxWidthClass = options?.maxWidthClass ?? 'max-w-3xl';
    const spacingClass = options?.spacingClass ?? 'mb-8 md:mb-10';
    const eyebrow = options?.eyebrow ?? 'Hỗ trợ nhanh';
    const showDescription = options?.showDescription ?? true;

    return (
      <div className={cn('space-y-3', spacingClass, align === 'center' ? `mx-auto text-center ${maxWidthClass}` : maxWidthClass)}>
        <div className={cn('flex items-center gap-2', align === 'center' ? 'justify-center' : 'justify-start')}>
          <span
            className="inline-flex min-h-[28px] items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{ backgroundColor: tokens.iconBg, color: tokens.iconText }}
          >
            {eyebrow}
          </span>
        </div>
        <HeadingTag className="text-2xl font-semibold tracking-tight md:text-3xl" style={{ color: tokens.heading }}>
          {sectionTitle}
        </HeadingTag>
        {showDescription && sectionDescription && (
          <p className={cn('text-sm leading-7 md:text-base', align === 'center' ? 'mx-auto max-w-2xl' : 'max-w-xl')} style={{ color: tokens.body }}>
            {sectionDescription}
          </p>
        )}
      </div>
    );
  };

  if (style === 'accordion') {
    return (
      <section className="px-4 py-10 md:py-14" style={{ backgroundColor: tokens.sectionBg }}>
        <div className="mx-auto max-w-4xl">
          {renderSectionIntro({ eyebrow: 'Câu hỏi phổ biến' })}

          <div className="space-y-3" role="region" aria-label={sectionTitle}>
            {displayedItems.map((item, idx) => {
              const isOpen = openIndex === idx;
              const panelId = `${accordionPrefix}-panel-${idx}`;
              const buttonId = `${accordionPrefix}-button-${idx}`;
              const answer = getValue(item.answer) ?? FAQ_FALLBACKS.answer;
              const question = getValue(item.question) ?? `${FAQ_FALLBACKS.question} ${idx + 1}`;

              return (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-2xl border transition-colors"
                  style={{
                    backgroundColor: tokens.panelBg,
                    borderColor: isOpen ? tokens.panelBorderStrong : tokens.panelBorder,
                  }}
                >
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => { setOpenIndex(isOpen ? null : idx); }}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        setOpenIndex((current) => {
                          const next = current === null ? idx : current + 1;
                          return Math.min(next, displayedItems.length - 1);
                        });
                      }

                      if (event.key === 'ArrowUp') {
                        event.preventDefault();
                        setOpenIndex((current) => {
                          const next = current === null ? idx : current - 1;
                          return Math.max(next, 0);
                        });
                      }

                      if (event.key === 'Home') {
                        event.preventDefault();
                        setOpenIndex(0);
                      }

                      if (event.key === 'End') {
                        event.preventDefault();
                        setOpenIndex(displayedItems.length - 1);
                      }
                    }}
                    className={cn(
                      'flex w-full min-h-[52px] items-start justify-between gap-3 px-4 py-4 text-left md:px-6',
                      'focus-visible:outline-none focus-visible:ring-2',
                    )}
                    style={{ backgroundColor: isOpen ? tokens.panelBgMuted : tokens.panelBg, color: tokens.questionText }}
                  >
                    <span className="pr-3 text-sm font-semibold leading-6 md:text-base">{question}</span>
                    <ChevronDown
                      size={18}
                      className={cn('mt-1 flex-shrink-0 transition-transform duration-200', isOpen && 'rotate-180')}
                      style={{ color: tokens.chevron }}
                    />
                  </button>

                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className={cn('overflow-hidden transition-[max-height] duration-200', isOpen ? 'max-h-[420px]' : 'max-h-0')}
                  >
                    <div
                      className="border-t px-4 py-4 text-sm leading-7 md:px-6 md:text-[15px]"
                      style={{
                        backgroundColor: tokens.panelBgMuted,
                        borderColor: tokens.panelBorder,
                        color: tokens.body,
                      }}
                    >
                      {answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {renderRemainingBadge()}
        </div>
      </section>
    );
  }

  if (style === 'cards') {
    return (
      <section className="px-4 py-10 md:py-14" style={{ backgroundColor: tokens.sectionBg }}>
        <div className="mx-auto max-w-6xl">
          {renderSectionIntro({ eyebrow: 'Knowledge base', maxWidthClass: 'max-w-3xl' })}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
            {displayedItems.map((item, idx) => (
              <article
                key={item.id}
                className="rounded-2xl border p-5 md:p-6"
                style={{
                  backgroundColor: tokens.panelBg,
                  borderColor: tokens.panelBorder,
                }}
              >
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                    style={{ backgroundColor: tokens.iconSolidBg, color: tokens.iconSolidText }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <span
                    className="inline-flex min-h-[28px] items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
                    style={{
                      backgroundColor: tokens.badgeBg,
                      borderColor: tokens.badgeBorder,
                      color: tokens.badgeText,
                    }}
                  >
                    FAQ
                  </span>
                </div>

                <h4 className="mb-2 text-sm font-semibold leading-6 md:text-base" style={{ color: tokens.panelTitleText }}>
                  {getValue(item.question) ?? `${FAQ_FALLBACKS.question} ${idx + 1}`}
                </h4>
                <p className="text-sm leading-7" style={{ color: tokens.body }}>
                  {getValue(item.answer) ?? FAQ_FALLBACKS.answer}
                </p>
              </article>
            ))}
          </div>

          {renderRemainingBadge()}
        </div>
      </section>
    );
  }

  if (style === 'two-column') {
    const description = getValue(config?.description) ?? FAQ_FALLBACKS.description;
    const buttonText = getValue(config?.buttonText);
    const buttonLink = getValue(config?.buttonLink) ?? '#';

    return (
      <section className="px-4 py-10 md:py-14" style={{ backgroundColor: tokens.sectionBg }}>
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-5 md:gap-8">
          <div className="md:col-span-2">
            <div
              className="rounded-3xl border p-6 md:sticky md:top-6 md:p-7"
              style={{
                backgroundColor: tokens.panelBgMuted,
                borderColor: tokens.panelBorder,
              }}
            >
              {renderSectionIntro({ align: 'left', maxWidthClass: 'max-w-none', spacingClass: 'mb-5', eyebrow: 'Trung tâm trợ giúp', showDescription: false })}

              <div className="space-y-4">
                <div className="rounded-2xl border px-4 py-3" style={{ backgroundColor: tokens.panelBg, borderColor: tokens.panelBorder }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: tokens.number }}>
                    Mô tả
                  </p>
                  <p className="mt-2 text-sm leading-7" style={{ color: tokens.body }}>
                    {description}
                  </p>
                </div>

                {buttonText && (
                  <a
                    href={buttonLink}
                    className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold"
                    style={{
                      backgroundColor: tokens.ctaBg,
                      color: tokens.ctaText,
                      boxShadow: tokens.ctaShadow,
                    }}
                  >
                    {buttonText}
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3 md:col-span-3">
            {displayedItems.map((item, idx) => (
              <article
                key={item.id}
                className="rounded-2xl border p-5 md:p-6"
                style={{
                  backgroundColor: tokens.panelBg,
                  borderColor: tokens.panelBorder,
                }}
              >
                <div className="mb-3 flex items-center gap-3">
                  <span
                    className="inline-flex h-8 min-w-[32px] items-center justify-center rounded-full px-2 text-xs font-semibold"
                    style={{ backgroundColor: tokens.iconSolidBg, color: tokens.iconSolidText }}
                  >
                    {idx + 1}
                  </span>
                  <span
                    className="inline-flex min-h-[28px] items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
                    style={{
                      backgroundColor: tokens.badgeBg,
                      borderColor: tokens.badgeBorder,
                      color: tokens.badgeText,
                    }}
                  >
                    Hỏi đáp nhanh
                  </span>
                </div>
                <h4 className="mb-2 text-sm font-semibold leading-6 md:text-base" style={{ color: tokens.panelTitleText }}>
                  {getValue(item.question) ?? `${FAQ_FALLBACKS.question} ${idx + 1}`}
                </h4>
                <p className="text-sm leading-7" style={{ color: tokens.body }}>
                  {getValue(item.answer) ?? FAQ_FALLBACKS.answer}
                </p>
              </article>
            ))}

            {renderRemainingBadge()}
          </div>
        </div>
      </section>
    );
  }

  if (style === 'minimal') {
    return (
      <section className="px-4 py-10 md:py-14" style={{ backgroundColor: tokens.sectionBg }}>
        <div className="mx-auto max-w-4xl">
          {renderSectionIntro({ align: 'left', eyebrow: 'Cần biết trước khi mua' })}

          <div className="divide-y" style={{ borderColor: tokens.panelBorder }}>
            {displayedItems.map((item, idx) => (
              <div key={item.id} className="grid grid-cols-[56px,1fr] gap-3 py-5 md:grid-cols-[72px,1fr] md:gap-5 md:py-6">
                <span className="text-2xl font-semibold tracking-tight md:text-3xl" style={{ color: tokens.number }}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold leading-6 md:text-base" style={{ color: tokens.panelTitleText }}>
                    {getValue(item.question) ?? `${FAQ_FALLBACKS.question} ${idx + 1}`}
                  </h4>
                  <p className="text-sm leading-7 md:text-[15px]" style={{ color: tokens.body }}>
                    {getValue(item.answer) ?? FAQ_FALLBACKS.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {renderRemainingBadge()}
        </div>
      </section>
    );
  }

  if (style === 'timeline') {
    return (
      <section className="px-4 py-10 md:py-14" style={{ backgroundColor: tokens.sectionBg }}>
        <div className="mx-auto max-w-4xl">
          {renderSectionIntro({ eyebrow: 'Quy trình hỗ trợ' })}

          <div className="relative">
            <div className="absolute bottom-0 left-5 top-0 w-px md:left-6" style={{ backgroundColor: tokens.timelineLine }} />

            <div className="space-y-4 md:space-y-5">
              {displayedItems.map((item, idx) => (
                <div key={item.id} className="relative pl-14 md:pl-16">
                  <div
                    className="absolute left-0 top-1 flex h-10 w-10 items-center justify-center rounded-full border text-xs font-semibold md:left-1 md:h-11 md:w-11"
                    style={{
                      backgroundColor: tokens.timelineDotBg,
                      borderColor: tokens.timelineDotBorder,
                      color: tokens.iconText,
                    }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </div>

                  <article
                    className="rounded-2xl border p-5 md:p-6"
                    style={{
                      backgroundColor: tokens.panelBgMuted,
                      borderColor: tokens.panelBorder,
                    }}
                  >
                    <span
                      className="mb-3 inline-flex min-h-[28px] items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
                      style={{
                        backgroundColor: tokens.badgeBg,
                        borderColor: tokens.badgeBorder,
                        color: tokens.badgeText,
                      }}
                    >
                      Bước hỗ trợ {idx + 1}
                    </span>
                    <h4 className="mb-2 text-sm font-semibold leading-6 md:text-base" style={{ color: tokens.panelTitleText }}>
                      {getValue(item.question) ?? `${FAQ_FALLBACKS.question} ${idx + 1}`}
                    </h4>
                    <p className="text-sm leading-7" style={{ color: tokens.body }}>
                      {getValue(item.answer) ?? FAQ_FALLBACKS.answer}
                    </p>
                  </article>
                </div>
              ))}
            </div>
          </div>

          {renderRemainingBadge()}
        </div>
      </section>
    );
  }

  const tabItems = displayedItems.slice(0, 6);

  if (tabItems.length === 0) {
    return (
      <section className="py-12 px-4" style={{ backgroundColor: tokens.sectionBg }}>
        <div className="max-w-3xl mx-auto text-center">
          <HeadingTag className="text-2xl font-bold mb-2" style={{ color: tokens.heading }}>
            {sectionTitle}
          </HeadingTag>
          <p style={{ color: tokens.body }}>Chưa có câu hỏi nào</p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-10 md:py-14" style={{ backgroundColor: tokens.sectionBg }}>
      <div className="mx-auto max-w-5xl">
        {renderSectionIntro({ eyebrow: 'Theo chủ đề', maxWidthClass: 'max-w-3xl' })}

        <div className="mb-5 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label={sectionTitle}>
          {tabItems.map((item, idx) => {
            const isActive = activeTab === idx;
            const tabLabel = getValue(item.question) ?? `${FAQ_FALLBACKS.question} ${idx + 1}`;
            return (
              <button
                key={`${tabPrefix}-tab-${idx}`}
                id={`${tabPrefix}-tab-${idx}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`${tabPrefix}-panel-${idx}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => { setActiveTab(idx); }}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowRight') {
                    event.preventDefault();
                    setActiveTab((current) => (current + 1) % tabItems.length);
                  }

                  if (event.key === 'ArrowLeft') {
                    event.preventDefault();
                    setActiveTab((current) => (current - 1 + tabItems.length) % tabItems.length);
                  }

                  if (event.key === 'Home') {
                    event.preventDefault();
                    setActiveTab(0);
                  }

                  if (event.key === 'End') {
                    event.preventDefault();
                    setActiveTab(tabItems.length - 1);
                  }
                }}
                className="min-h-[44px] rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap"
                style={
                  isActive
                    ? {
                      backgroundColor: tokens.tabActiveBg,
                      borderColor: tokens.tabActiveBg,
                      color: tokens.tabActiveText,
                    }
                    : {
                      backgroundColor: tokens.tabInactiveBg,
                      borderColor: tokens.panelBorder,
                      color: tokens.tabInactiveText,
                    }
                }
              >
                {tabLabel}
              </button>
            );
          })}

          {displayedItems.length > 6 && (
            <span className="flex items-center px-3 py-2 text-sm" style={{ color: tokens.tabOverflowText }}>+{displayedItems.length - 6}</span>
          )}
        </div>

        {tabItems[activeTab] && (
          <div
            id={`${tabPrefix}-panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`${tabPrefix}-tab-${activeTab}`}
            className="rounded-3xl border p-6 md:p-8"
            style={{
              backgroundColor: tokens.panelBg,
              borderColor: tokens.panelBorder,
            }}
          >
            <div className="mb-4 flex items-center gap-3">
              <span
                className="inline-flex h-9 min-w-[36px] items-center justify-center rounded-full px-2 text-xs font-semibold"
                style={{ backgroundColor: tokens.iconSolidBg, color: tokens.iconSolidText }}
              >
                {activeTab + 1}
              </span>
              <span
                className="inline-flex min-h-[28px] items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{
                  backgroundColor: tokens.badgeBg,
                  borderColor: tokens.badgeBorder,
                  color: tokens.badgeText,
                }}
              >
                Chủ đề nổi bật
              </span>
            </div>
            <h4 className="mb-3 text-lg font-semibold leading-8 md:text-[22px]" style={{ color: tokens.panelTitleText }}>
              {getValue(tabItems[activeTab].question) ?? `${FAQ_FALLBACKS.question} ${activeTab + 1}`}
            </h4>
            <p className="text-sm leading-7 md:text-base" style={{ color: tokens.body }}>
              {getValue(tabItems[activeTab].answer) ?? FAQ_FALLBACKS.answer}
            </p>
          </div>
        )}

        {renderRemainingBadge()}
      </div>
    </section>
  );
}
