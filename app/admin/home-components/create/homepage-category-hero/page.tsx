'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { HomepageCategoryHeroForm } from '../../homepage-category-hero/_components/HomepageCategoryHeroForm';
import { HomepageCategoryHeroPreview } from '../../homepage-category-hero/_components/HomepageCategoryHeroPreview';
import { DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG, normalizeHomepageCategoryHeroCategories } from '../../homepage-category-hero/_lib/constants';
import { useHomepageCategoryHeroAutoGenerate } from '../../homepage-category-hero/_lib/useHomepageCategoryHeroAutoGenerate';
import type {
  HomepageCategoryHeroBrandMode,
  HomepageCategoryHeroSelectionMode,
} from '../../homepage-category-hero/_types';

const COMPONENT_TYPE = 'HomepageCategoryHero';

export default function HomepageCategoryHeroCreatePage() {
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Hero khám phá danh mục', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const {
    autoGenerateConfig,
    autoGenerateMeta,
    categoriesData,
    isAutoGenerateLoading,
    isAutoGenerateReady,
    generateFromRealData,
  } = useHomepageCategoryHeroAutoGenerate();

  const { primary, secondary, mode } = effectiveColors;
  const brandMode: HomepageCategoryHeroBrandMode = mode === 'single' ? 'single' : 'dual';
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const [heading, _setHeading] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.heading);
  const [subheading, _setSubheading] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.subheading);
  const [ctaText, _setCtaText] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.ctaText);
  const [ctaUrl, _setCtaUrl] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.ctaUrl);
  const [style, setStyle] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.style);
  const [heroSlides, setHeroSlides] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.heroSlides);
  const [selectionMode, _setSelectionMode] = useState<HomepageCategoryHeroSelectionMode>(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.selectionMode);
  const [categoryItems, setCategoryItems] = useState(
    normalizeHomepageCategoryHeroCategories(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.categories)
  );
  const [hideEmptyCategories, setHideEmptyCategories] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.hideEmptyCategories);
  const [showCategoryImage, _setShowCategoryImage] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.showCategoryImage);
  const [categoryVisualMode, setCategoryVisualMode] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.categoryVisualMode);
  const [categoryImageSize, setCategoryImageSize] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.categoryImageSize);
  const [categoryImageShape, setCategoryImageShape] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.categoryImageShape);
  const [maxCategoriesDesktop, _setMaxCategoriesDesktop] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.maxCategoriesDesktop);
  const [maxCategoriesTablet, _setMaxCategoriesTablet] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.maxCategoriesTablet);
  const [maxCategoriesMobile, _setMaxCategoriesMobile] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.maxCategoriesMobile);
  const [attachToHeader, _setAttachToHeader] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.attachToHeader);
  const [tabletBehavior, _setTabletBehavior] = useState(DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.tabletBehavior);

  const handleAutoGenerate = () => {
    const generated = generateFromRealData({ hideEmptyCategories });
    if (generated.status === 'loading') {
      toast.message('Đang tải dữ liệu danh mục...');
      return;
    }
    if (generated.status === 'empty-source') {
      toast.info('Chưa có danh mục để sinh menu.');
      return;
    }
    if (generated.status === 'empty-result') {
      toast.info('Không có danh mục hoặc sản phẩm phù hợp để sinh menu.');
      return;
    }
    setCategoryItems(normalizeHomepageCategoryHeroCategories(generated.categories));
    toast.success(`Đã sinh ${generated.categories.length} danh mục.`);
  };

  const onSubmit = (e: React.FormEvent) => {
    void handleSubmit(e, {
      heading,
      subheading,
      ctaText,
      ctaUrl,
      style,
      heroSlides,
      selectionMode,
      categories: normalizeHomepageCategoryHeroCategories(categoryItems),
      autoGenerateConfig,
      autoGenerateMeta,
      hideEmptyCategories,
      showCategoryImage,
      categoryVisualMode,
      categoryImageSize,
      categoryImageShape,
      maxCategoriesDesktop,
      maxCategoriesTablet,
      maxCategoriesMobile,
      attachToHeader,
      tabletBehavior,
    });
  };

  return (
    <ComponentFormWrapper
      type={COMPONENT_TYPE}
      title={title}
      setTitle={setTitle}
      active={active}
      setActive={setActive}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      customState={customState}
      showCustomBlock={showCustomBlock}
      setCustomState={setCustomState}
      systemColors={systemColors}
      customFontState={customFontState}
      showFontCustomBlock={showFontCustomBlock}
      setCustomFontState={setCustomFontState}
    >
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_420px] 2xl:items-start">
        <HomepageCategoryHeroForm
          heroSlides={heroSlides}
          setHeroSlides={setHeroSlides}
          categoryItems={categoryItems}
          setCategoryItems={setCategoryItems}
          categoriesData={categoriesData}
          categoryVisualMode={categoryVisualMode}
          setCategoryVisualMode={setCategoryVisualMode}
          categoryImageSize={categoryImageSize}
          setCategoryImageSize={setCategoryImageSize}
          categoryImageShape={categoryImageShape}
          setCategoryImageShape={setCategoryImageShape}
          autoGenerateConfig={autoGenerateConfig}
          autoGenerateMeta={autoGenerateMeta}
          autoGenerateReady={isAutoGenerateReady}
          autoGenerateLoading={isAutoGenerateLoading}
          hideEmptyCategories={hideEmptyCategories}
          setHideEmptyCategories={setHideEmptyCategories}
          onAutoGenerate={handleAutoGenerate}
        />

        <div className="2xl:sticky 2xl:top-6">
          <HomepageCategoryHeroPreview
            config={{
              heading,
              subheading,
              ctaText,
              ctaUrl,
              style,
              heroSlides,
              selectionMode,
              categories: normalizeHomepageCategoryHeroCategories(categoryItems),
              autoGenerateConfig,
              autoGenerateMeta,
              hideEmptyCategories,
              showCategoryImage,
              categoryVisualMode,
              categoryImageSize,
              categoryImageShape,
              maxCategoriesDesktop,
              maxCategoriesTablet,
              maxCategoriesMobile,
              attachToHeader,
              tabletBehavior,
            }}
            brandColor={primary}
            secondary={secondary}
            mode={brandMode}
            selectedStyle={style}
            onStyleChange={setStyle}
            fontStyle={fontStyle}
            fontClassName="font-active"
          />
        </div>
      </div>
    </ComponentFormWrapper>
  );
}
