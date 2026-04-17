import type {
  PricingConfig,
  PricingPlan,
  PricingStyle,
} from '../_types';

export const PRICING_STYLES: Array<{ id: PricingStyle; label: string }> = [
  { id: 'cards', label: 'Cards' },
  { id: 'horizontal', label: 'Ngang' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'comparison', label: 'So sánh' },
  { id: 'featured', label: 'Nổi bật' },
  { id: 'compact', label: 'Gọn' },
];

const DEFAULT_PRICING_STYLE: PricingStyle = 'cards';

const DEFAULT_PRICING_PLAN: PricingPlan = {
  id: 1,
  name: 'Gói cơ bản',
  price: '0',
  yearlyPrice: '0',
  period: '/tháng',
  features: ['Tính năng mặc định'],
  isPopular: false,
  buttonText: 'Chọn gói',
  buttonLink: '',
};

export const DEFAULT_PRICING_TEXTS: Record<string, string> = {
  popularBadge: 'Phổ biến',
  hotBadge: 'HOT',
  recommendedBadge: 'Khuyên dùng',
  featuredBadge: '★ Phổ biến nhất',
  emptyStateTitle: 'Chưa có gói nào',
  emptyStateDescription: 'Thêm gói để hiển thị bảng giá',
  defaultPlanName: 'Gói',
  defaultButtonText: 'Chọn gói',
  defaultFeature: 'Tính năng đang cập nhật',
  startNowButton: 'Bắt đầu ngay',
  selectButton: 'Chọn',
};

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  monthlyLabel: 'Hàng tháng',
  plans: [DEFAULT_PRICING_PLAN],
  showBillingToggle: true,
  style: DEFAULT_PRICING_STYLE,
  subtitle: 'Chọn gói phù hợp với nhu cầu của bạn',
  yearlyLabel: 'Hàng năm',
  yearlySavingText: 'Tiết kiệm 17%',
  texts: DEFAULT_PRICING_TEXTS,
};

const isPricingStyle = (value: unknown): value is PricingStyle => (
  value === 'cards'
  || value === 'horizontal'
  || value === 'minimal'
  || value === 'comparison'
  || value === 'featured'
  || value === 'compact'
);

const normalizeFeatureList = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value
    .map((feature) => String(feature ?? '').trim())
    .filter((feature) => feature.length > 0);
};

export const normalizePricingPlan = (value: unknown, index: number): PricingPlan => {
  const raw = (typeof value === 'object' && value !== null)
    ? value as Partial<PricingPlan>
    : {};

  return {
    id: typeof raw.id === 'number' || typeof raw.id === 'string' ? raw.id : index + 1,
    name: String(raw.name ?? '').trim(),
    price: String(raw.price ?? '').trim(),
    yearlyPrice: String(raw.yearlyPrice ?? '').trim(),
    period: String(raw.period ?? '/tháng').trim() || '/tháng',
    features: normalizeFeatureList(raw.features),
    isPopular: Boolean(raw.isPopular),
    buttonText: String(raw.buttonText ?? 'Chọn gói').trim() || 'Chọn gói',
    buttonLink: String(raw.buttonLink ?? '').trim(),
  };
};

export const normalizePricingConfig = (value: unknown): PricingConfig => {
  const raw = (typeof value === 'object' && value !== null)
    ? value as Partial<PricingConfig>
    : {};

  const texts = (typeof raw.texts === 'object' && raw.texts !== null)
    ? { ...DEFAULT_PRICING_TEXTS, ...raw.texts }
    : DEFAULT_PRICING_TEXTS;

  return {
    style: isPricingStyle(raw.style) ? raw.style : DEFAULT_PRICING_STYLE,
    subtitle: String(raw.subtitle ?? DEFAULT_PRICING_CONFIG.subtitle),
    showBillingToggle: raw.showBillingToggle !== false,
    monthlyLabel: String(raw.monthlyLabel ?? DEFAULT_PRICING_CONFIG.monthlyLabel),
    yearlyLabel: String(raw.yearlyLabel ?? DEFAULT_PRICING_CONFIG.yearlyLabel),
    yearlySavingText: String(raw.yearlySavingText ?? DEFAULT_PRICING_CONFIG.yearlySavingText),
    texts,
    plans: Array.isArray(raw.plans)
      ? raw.plans.map((plan, index) => normalizePricingPlan(plan, index))
      : DEFAULT_PRICING_CONFIG.plans.map((plan, index) => normalizePricingPlan(plan, index)),
  };
};
